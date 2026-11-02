import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { DemoDataService } from './demo-data.service';
import { NotificationService } from './notification.service';
import { Product, StockMovement, StockStatus, StockMovementType } from '../models/erp.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly PRODUCTS_KEY = 'erp_products';
  private readonly MOVEMENTS_KEY = 'erp_stock_movements';

  products = signal<Product[]>([]);
  stockMovements = signal<StockMovement[]>([]);

  totalProducts = computed(() => this.products().length);

  lowStockProducts = computed(() => {
    return this.products().filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock');
  });

  lowStockCount = computed(() => this.lowStockProducts().length);

  totalInventoryValue = computed(() => {
    return this.products().reduce((sum, p) => sum + (p.purchasePrice * p.availableQuantity), 0);
  });

  totalSalesPotentialValue = computed(() => {
    return this.products().reduce((sum, p) => sum + (p.sellingPrice * p.availableQuantity), 0);
  });

  constructor(
    private storage: StorageService,
    private demoData: DemoDataService,
    private notificationService: NotificationService
  ) {
    this.loadData();
  }

  private loadData(): void {
    const productsData = this.storage.getItem<Product[]>(this.PRODUCTS_KEY, this.demoData.getDemoProducts());
    const movementsData = this.storage.getItem<StockMovement[]>(this.MOVEMENTS_KEY, this.demoData.getDemoStockMovements());
    this.products.set(productsData);
    this.stockMovements.set(movementsData);
  }

  private saveProducts(data: Product[]): void {
    this.products.set(data);
    this.storage.setItem(this.PRODUCTS_KEY, data);
  }

  private saveMovements(data: StockMovement[]): void {
    this.stockMovements.set(data);
    this.storage.setItem(this.MOVEMENTS_KEY, data);
  }

  calculateStatus(available: number, minStock: number): StockStatus {
    if (available <= 0) return 'Out of Stock';
    if (available <= minStock) return 'Low Stock';
    return 'In Stock';
  }

  getProductById(id: string): Product | undefined {
    return this.products().find(p => p.id === id || p.productId === id);
  }

  addProduct(prod: Omit<Product, 'id' | 'productId' | 'status'>): Product {
    const list = this.products();
    const nextNum = 2000 + list.length + 1;
    const status = this.calculateStatus(prod.availableQuantity, prod.minimumStockLevel);

    const newProd: Product = {
      ...prod,
      id: 'prd-' + Date.now(),
      productId: `PRD-${nextNum}`,
      status
    };

    const updated = [newProd, ...list];
    this.saveProducts(updated);

    // Initial stock movement
    if (newProd.availableQuantity > 0) {
      this.recordStockMovement({
        productId: newProd.id,
        productName: newProd.name,
        sku: newProd.sku,
        type: 'IN',
        quantity: newProd.availableQuantity,
        referenceType: 'INITIAL_STOCK',
        referenceId: newProd.productId,
        performedBy: 'System / Inventory Admin',
        notes: 'Initial stock intake upon product registration.'
      });
    }

    if (status === 'Low Stock' || status === 'Out of Stock') {
      this.notificationService.notify(
        'Low Stock Warning',
        `Product ${newProd.name} added with low or zero stock level (${newProd.availableQuantity} available).`,
        'warning',
        '/inventory/products'
      );
    }

    return newProd;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    let result: Product | null = null;
    const updated = this.products().map(p => {
      if (p.id === id || p.productId === id) {
        const available = updates.availableQuantity !== undefined ? updates.availableQuantity : p.availableQuantity;
        const minStock = updates.minimumStockLevel !== undefined ? updates.minimumStockLevel : p.minimumStockLevel;
        const status = this.calculateStatus(available, minStock);
        result = { ...p, ...updates, status };
        return result;
      }
      return p;
    });

    if (result) {
      this.saveProducts(updated);
    }
    return result;
  }

  deleteProduct(id: string, hasActiveTransactions: boolean): { success: boolean; message: string } {
    if (hasActiveTransactions) {
      return {
        success: false,
        message: 'Cannot delete product tied to active open sales orders or pending purchase orders.'
      };
    }
    const filtered = this.products().filter(p => p.id !== id && p.productId !== id);
    this.saveProducts(filtered);
    return { success: true, message: 'Product deleted from inventory.' };
  }

  adjustStock(
    productId: string,
    quantityChange: number,
    movementType: StockMovementType,
    referenceType: StockMovement['referenceType'],
    referenceId: string,
    performedBy: string,
    notes = ''
  ): { success: boolean; message: string; newQuantity?: number } {
    const product = this.getProductById(productId);
    if (!product) {
      return { success: false, message: 'Product not found.' };
    }

    let newQuantity = product.availableQuantity;
    if (movementType === 'IN') {
      newQuantity += Math.abs(quantityChange);
    } else if (movementType === 'OUT') {
      if (product.availableQuantity < Math.abs(quantityChange)) {
        return {
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.availableQuantity}, Requested deduction: ${Math.abs(quantityChange)}.`
        };
      }
      newQuantity -= Math.abs(quantityChange);
    } else if (movementType === 'ADJUSTMENT') {
      newQuantity = Math.max(0, quantityChange);
    }

    const updated = this.updateProduct(product.id, { availableQuantity: newQuantity });
    if (!updated) {
      return { success: false, message: 'Failed to update product stock.' };
    }

    // Record movement
    this.recordStockMovement({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: movementType,
      quantity: Math.abs(quantityChange),
      referenceType,
      referenceId,
      performedBy,
      notes
    });

    // Check low stock
    if (updated.status === 'Low Stock' || updated.status === 'Out of Stock') {
      this.notificationService.notify(
        'Stock Alert: ' + updated.name,
        `Current stock has dropped to ${updated.availableQuantity} ${updated.unit} (Minimum threshold: ${updated.minimumStockLevel}).`,
        'warning',
        '/inventory/products'
      );
    }

    return { success: true, message: 'Stock updated successfully.', newQuantity };
  }

  recordStockMovement(movement: Omit<StockMovement, 'id' | 'movementId' | 'date'>): void {
    const list = this.stockMovements();
    const nextNum = 4000 + list.length + 1;
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);

    const newMov: StockMovement = {
      ...movement,
      id: 'sm-' + Date.now(),
      movementId: `SM-${nextNum}`,
      date: dateStr
    };

    this.saveMovements([newMov, ...list]);
  }

  resetDemo(): void {
    this.saveProducts(this.demoData.getDemoProducts());
    this.saveMovements(this.demoData.getDemoStockMovements());
  }
}

