import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product, StockStatus } from '../../../core/models/erp.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IconComponent,
    BadgeComponent,
    ModalComponent,
    ConfirmDialogComponent,
    PaginationComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="inventory-page">
      <!-- Page Header -->
      <div class="erp-card-header">
        <div>
          <h2 class="erp-card-title">Inventory Stock & Product Catalog</h2>
          <p class="erp-card-subtitle">Monitor SKU quantities, track safety stock thresholds, and view warehouse locations</p>
        </div>
        <div class="header-btn-row">
          <a routerLink="/inventory/movements" class="btn btn-secondary">
            <app-icon name="layers" [size]="16"></app-icon>
            <span>Stock Movements Log</span>
          </a>
          <button type="button" class="btn btn-primary" (click)="openAddModal()" *ngIf="canManage">
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      <!-- Quick Inventory Stat Highlights -->
      <div class="grid-cols-4">
        <div class="inv-kpi-card">
          <span class="kpi-title">Total SKUs</span>
          <span class="kpi-val">{{ inventoryService.totalProducts() }}</span>
        </div>
        <div class="inv-kpi-card">
          <span class="kpi-title">Total Inventory Cost</span>
          <span class="kpi-val text-primary">₹{{ Math.round(inventoryService.totalInventoryValue()).toLocaleString('en-IN') }}</span>
        </div>
        <div class="inv-kpi-card">
          <span class="kpi-title">Retail Valuation</span>
          <span class="kpi-val text-success">₹{{ Math.round(inventoryService.totalSalesPotentialValue()).toLocaleString('en-IN') }}</span>
        </div>
        <div class="inv-kpi-card">
          <span class="kpi-title">Low / Out of Stock</span>
          <span class="kpi-val text-danger">{{ inventoryService.lowStockCount() }} Products</span>
        </div>
      </div>

      <!-- Toolbar: Search, Filters, Sort -->
      <div class="toolbar-container">
        <div class="search-box">
          <app-icon name="search" [size]="16"></app-icon>
          <input
            type="text"
            class="form-control"
            placeholder="Search products by SKU, name, warehouse..."
            [value]="searchQuery"
            (input)="onSearch($event)"
          />
        </div>

        <div class="filter-bar">
          <!-- Category Filter -->
          <select class="form-select" (change)="onCategoryFilter($event)">
            <option value="All">All Categories</option>
            <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
          </select>

          <!-- Stock Status Filter -->
          <select class="form-select" (change)="onStatusFilter($event)">
            <option value="All">All Stock Levels</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

          <!-- Warehouse Filter -->
          <select class="form-select" (change)="onWarehouseFilter($event)">
            <option value="All">All Warehouses</option>
            <option value="Warehouse Alpha">Warehouse Alpha</option>
            <option value="Warehouse Beta">Warehouse Beta</option>
            <option value="Central Hub">Central Hub</option>
          </select>
        </div>
      </div>

      <!-- Inventory Table -->
      <div class="erp-card table-card">
        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Product SKU / Code</th>
                <th>Product Name & Description</th>
                <th>Category</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Available Qty</th>
                <th>Min Safety Level</th>
                <th>Warehouse</th>
                <th>Status</th>
                <th class="text-right" *ngIf="canManage">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let prod of pagedProducts">
                <td>
                  <span class="sku-pill">{{ prod.sku }}</span>
                  <div class="id-sub">{{ prod.productId }}</div>
                </td>
                <td>
                  <strong>{{ prod.name }}</strong>
                  <div class="prod-desc">{{ prod.description }}</div>
                </td>
                <td><span class="cat-pill">{{ prod.category }}</span></td>
                <td>₹{{ prod.purchasePrice.toLocaleString('en-IN') }}</td>
                <td><strong>₹{{ prod.sellingPrice.toLocaleString('en-IN') }}</strong></td>
                <td>
                  <span class="qty-text" [class.qty-low]="prod.availableQuantity <= prod.minimumStockLevel">
                    {{ prod.availableQuantity }} {{ prod.unit }}
                  </span>
                </td>
                <td>{{ prod.minimumStockLevel }} {{ prod.unit }}</td>
                <td>{{ prod.warehouse }}</td>
                <td><app-badge [text]="prod.status"></app-badge></td>
                <td class="text-right" *ngIf="canManage">
                  <div class="actions-cell">
                    <button type="button" class="btn-action edit" (click)="openEditModal(prod)" title="Edit Product">
                      <app-icon name="edit" [size]="15"></app-icon>
                    </button>
                    <button type="button" class="btn-action delete" (click)="confirmDelete(prod)" title="Delete Product">
                      <app-icon name="trash" [size]="15"></app-icon>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <app-empty-state
          *ngIf="filteredProducts.length === 0"
          icon="box"
          title="No products match criteria"
          description="Try clearing your search query or adjusting your category/status filters."
          actionLabel="Clear Filters"
          [showAddIcon]="false"
          (actionClicked)="clearFilters()"
        ></app-empty-state>

        <app-pagination
          [totalItems]="filteredProducts.length"
          [pageSize]="pageSize"
          [currentPage]="currentPage"
          (pageChanged)="currentPage = $event"
        ></app-pagination>
      </div>

      <!-- Add/Edit Product Modal -->
      <app-modal
        [isOpen]="showModal"
        [title]="editingProductId ? 'Edit Product Details' : 'Add New Inventory Product'"
        subtitle="Specify product SKU, pricing, unit, and minimum re-order threshold."
        size="lg"
        (closed)="closeModal()"
      >
        <form [formGroup]="productForm" (ngSubmit)="saveProduct()" class="product-form">
          <div class="grid-cols-2">
            <div class="form-group">
              <label class="form-label required">Product Name</label>
              <input type="text" formControlName="name" class="form-control" placeholder="e.g. Cisco Catalyst 24-Port Switch" />
            </div>

            <div class="form-group">
              <label class="form-label required">SKU (Stock Keeping Unit)</label>
              <input type="text" formControlName="sku" class="form-control" placeholder="e.g. NET-CS-24P" />
            </div>
          </div>

          <div class="grid-cols-3">
            <div class="form-group">
              <label class="form-label required">Category</label>
              <select formControlName="category" class="form-select">
                <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Inventory Unit</label>
              <select formControlName="unit" class="form-select">
                <option value="pcs">pcs</option>
                <option value="box">box</option>
                <option value="sets">sets</option>
                <option value="kg">kg</option>
                <option value="liters">liters</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Warehouse Location</label>
              <select formControlName="warehouse" class="form-select">
                <option value="Warehouse Alpha">Warehouse Alpha</option>
                <option value="Warehouse Beta">Warehouse Beta</option>
                <option value="Central Hub">Central Hub</option>
              </select>
            </div>
          </div>

          <div class="grid-cols-4">
            <div class="form-group">
              <label class="form-label required">Purchase Cost (₹)</label>
              <input type="number" formControlName="purchasePrice" class="form-control" min="1" />
            </div>

            <div class="form-group">
              <label class="form-label required">Selling Price (₹)</label>
              <input type="number" formControlName="sellingPrice" class="form-control" min="1" />
            </div>

            <div class="form-group">
              <label class="form-label required">Available Quantity</label>
              <input type="number" formControlName="availableQuantity" class="form-control" min="0" />
            </div>

            <div class="form-group">
              <label class="form-label required">Min Stock Threshold</label>
              <input type="number" formControlName="minimumStockLevel" class="form-control" min="1" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required">Primary Supplier</label>
            <select formControlName="supplierId" class="form-select">
              <option *ngFor="let sup of supplierService.suppliers()" [value]="sup.id">
                {{ sup.supplierName }} ({{ sup.companyName }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Technical Description</label>
            <textarea formControlName="description" class="form-control" rows="2" placeholder="Product specifications, model, and application"></textarea>
          </div>

          <div modal-footer>
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="productForm.invalid">
              <app-icon name="check" [size]="16"></app-icon>
              <span>{{ editingProductId ? 'Update Product' : 'Add to Inventory' }}</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- Delete Confirmation -->
      <app-confirm-dialog
        [isOpen]="showDeleteConfirm"
        title="Confirm Inventory Deletion"
        [message]="'Are you sure you want to delete product ' + (selectedProduct?.name || '') + ' (' + (selectedProduct?.sku || '') + ')?'"
        confirmText="Delete Product"
        variant="danger"
        (confirmed)="deleteConfirmed()"
        (cancelled)="showDeleteConfirm = false"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .inventory-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .header-btn-row {
      display: flex;
      gap: 10px;
    }
    .inv-kpi-card {
      background: var(--erp-card-bg);
      border: 1px solid var(--erp-border);
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
    }
    .kpi-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--erp-text-muted);
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .kpi-val {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--erp-text-heading);
    }
    .text-primary { color: #2563eb !important; }
    .text-success { color: #16a34a !important; }
    .text-danger { color: #dc2626 !important; }

    .sku-pill {
      font-family: var(--erp-font-mono);
      font-size: 0.8rem;
      font-weight: 600;
      background: var(--erp-bg-subtle);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .id-sub {
      font-size: 0.7rem;
      color: var(--erp-text-muted);
      margin-top: 2px;
    }
    .prod-desc {
      font-size: 0.775rem;
      color: var(--erp-text-muted);
      margin-top: 2px;
      max-width: 320px;
      line-height: 1.35;
    }
    .cat-pill {
      font-size: 0.775rem;
      color: var(--erp-text);
      background: var(--erp-bg-subtle);
      padding: 3px 8px;
      border-radius: 6px;
    }
    .qty-text {
      font-weight: 700;
    }
    .qty-low {
      color: #dc2626;
    }
    .actions-cell {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }
    .btn-action {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid var(--erp-border);
      background: var(--erp-card-bg);
      color: var(--erp-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .btn-action.edit:hover { color: #2563eb; border-color: #93c5fd; background: var(--erp-bg-hover); }
    .btn-action.delete:hover { color: #dc2626; border-color: #fca5a5; background: #fef2f2; }
    .text-right { text-align: right; }

    .product-form .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .product-form .grid-cols-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .product-form .grid-cols-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }

    @media (max-width: 768px) {
      .product-form .grid-cols-2,
      .product-form .grid-cols-3,
      .product-form .grid-cols-4 { grid-template-columns: 1fr; }
    }
  `]
})
export class ProductListComponent {
  inventoryService = inject(InventoryService);
  supplierService = inject(SupplierService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  Math = Math;

  categories = [
    'Compute & Chips',
    'Storage',
    'Networking',
    'Peripherals',
    'Office Furniture',
    'Power & Infrastructure',
    'Security & Access',
    'Facility & Cooling',
    'Packaging'
  ];

  searchQuery = '';
  selectedCategory = 'All';
  selectedStatus = 'All';
  selectedWarehouse = 'All';

  currentPage = 1;
  pageSize = 8;

  showModal = false;
  editingProductId: string | null = null;
  showDeleteConfirm = false;
  selectedProduct: Product | null = null;

  productForm: FormGroup;

  get canManage(): boolean {
    return this.auth.hasRole(['Admin', 'Inventory Manager']);
  }

  constructor() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      sku: ['', Validators.required],
      category: ['Compute & Chips', Validators.required],
      description: [''],
      unit: ['pcs', Validators.required],
      purchasePrice: [10000, [Validators.required, Validators.min(1)]],
      sellingPrice: [15000, [Validators.required, Validators.min(1)]],
      availableQuantity: [20, [Validators.required, Validators.min(0)]],
      minimumStockLevel: [5, [Validators.required, Validators.min(1)]],
      warehouse: ['Warehouse Alpha', Validators.required],
      supplierId: ['', Validators.required]
    });
  }

  get filteredProducts(): Product[] {
    let list = this.inventoryService.products();

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.warehouse.toLowerCase().includes(q)
      );
    }

    if (this.selectedCategory !== 'All') {
      list = list.filter(p => p.category === this.selectedCategory);
    }

    if (this.selectedStatus !== 'All') {
      list = list.filter(p => p.status === this.selectedStatus);
    }

    if (this.selectedWarehouse !== 'All') {
      list = list.filter(p => p.warehouse === this.selectedWarehouse);
    }

    return list;
  }

  get pagedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.currentPage = 1;
  }

  onCategoryFilter(event: Event): void {
    this.selectedCategory = (event.target as HTMLSelectElement).value;
    this.currentPage = 1;
  }

  onStatusFilter(event: Event): void {
    this.selectedStatus = (event.target as HTMLSelectElement).value;
    this.currentPage = 1;
  }

  onWarehouseFilter(event: Event): void {
    this.selectedWarehouse = (event.target as HTMLSelectElement).value;
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'All';
    this.selectedStatus = 'All';
    this.selectedWarehouse = 'All';
    this.currentPage = 1;
  }

  openAddModal(): void {
    this.editingProductId = null;
    const defaultSup = this.supplierService.suppliers()[0]?.id || '';
    this.productForm.reset({
      name: '',
      sku: '',
      category: 'Compute & Chips',
      description: '',
      unit: 'pcs',
      purchasePrice: 10000,
      sellingPrice: 15000,
      availableQuantity: 20,
      minimumStockLevel: 5,
      warehouse: 'Warehouse Alpha',
      supplierId: defaultSup
    });
    this.showModal = true;
  }

  openEditModal(p: Product): void {
    this.editingProductId = p.id;
    this.productForm.patchValue({
      name: p.name,
      sku: p.sku,
      category: p.category,
      description: p.description,
      unit: p.unit,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      availableQuantity: p.availableQuantity,
      minimumStockLevel: p.minimumStockLevel,
      warehouse: p.warehouse,
      supplierId: p.supplierId
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingProductId = null;
  }

  saveProduct(): void {
    if (this.productForm.invalid) return;

    const val = this.productForm.value;
    const supplier = this.supplierService.getSupplierById(val.supplierId);
    const supplierName = supplier?.supplierName || 'Verified Vendor';

    if (this.editingProductId) {
      this.inventoryService.updateProduct(this.editingProductId, {
        name: val.name,
        sku: val.sku,
        category: val.category,
        description: val.description,
        unit: val.unit,
        purchasePrice: Number(val.purchasePrice),
        sellingPrice: Number(val.sellingPrice),
        availableQuantity: Number(val.availableQuantity),
        minimumStockLevel: Number(val.minimumStockLevel),
        warehouse: val.warehouse,
        supplierId: val.supplierId,
        supplierName
      });
    } else {
      this.inventoryService.addProduct({
        name: val.name,
        sku: val.sku,
        category: val.category,
        description: val.description,
        unit: val.unit,
        purchasePrice: Number(val.purchasePrice),
        sellingPrice: Number(val.sellingPrice),
        availableQuantity: Number(val.availableQuantity),
        minimumStockLevel: Number(val.minimumStockLevel),
        warehouse: val.warehouse,
        supplierId: val.supplierId,
        supplierName
      });
    }

    this.closeModal();
  }

  confirmDelete(p: Product): void {
    this.selectedProduct = p;
    this.showDeleteConfirm = true;
  }

  deleteConfirmed(): void {
    if (this.selectedProduct) {
      this.inventoryService.deleteProduct(this.selectedProduct.id, false);
      this.showDeleteConfirm = false;
      this.selectedProduct = null;
    }
  }
}

