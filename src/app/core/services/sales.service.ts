import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { DemoDataService } from './demo-data.service';
import { InventoryService } from './inventory.service';
import { NotificationService } from './notification.service';
import { SalesOrder, SalesOrderItem, SalesOrderStatus, PaymentStatus } from '../models/erp.model';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private readonly KEY = 'erp_sales_orders';
  salesOrders = signal<SalesOrder[]>([]);

  totalSalesCount = computed(() => this.salesOrders().length);

  totalSalesVolume = computed(() => {
    return this.salesOrders()
      .filter(o => o.salesStatus !== 'Cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  });

  deliveredSalesVolume = computed(() => {
    return this.salesOrders()
      .filter(o => o.salesStatus === 'Delivered')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  });

  constructor(
    private storage: StorageService,
    private demoData: DemoDataService,
    private inventoryService: InventoryService,
    private notificationService: NotificationService
  ) {
    this.loadOrders();
  }

  private loadOrders(): void {
    const data = this.storage.getItem<SalesOrder[]>(this.KEY, this.demoData.getDemoSalesOrders());
    this.salesOrders.set(data);
  }

  private save(data: SalesOrder[]): void {
    this.salesOrders.set(data);
    this.storage.setItem(this.KEY, data);
  }

  getOrderById(id: string): SalesOrder | undefined {
    return this.salesOrders().find(o => o.id === id || o.orderNumber === id);
  }

  createSalesOrder(orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    deliveryDate: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
    discountPercent?: number;
    taxPercent?: number;
    salesStatus?: SalesOrderStatus;
    notes?: string;
  }): { success: boolean; message: string; order?: SalesOrder } {
    if (!orderData.items || orderData.items.length === 0) {
      return { success: false, message: 'Sales order must have at least one product.' };
    }

    const items: SalesOrderItem[] = [];
    let subtotal = 0;

    // Validate products and check stock availability if status is Confirmed
    const willDeductStock = orderData.salesStatus === 'Confirmed' ||
      orderData.salesStatus === 'Processing' ||
      orderData.salesStatus === 'Shipped' ||
      orderData.salesStatus === 'Delivered';

    for (const line of orderData.items) {
      const prod = this.inventoryService.getProductById(line.productId);
      if (!prod) {
        return { success: false, message: `Product ID ${line.productId} not found.` };
      }
      if (line.quantity <= 0) {
        return { success: false, message: `Quantity for ${prod.name} must be greater than 0.` };
      }

      if (willDeductStock && prod.availableQuantity < line.quantity) {
        return {
          success: false,
          message: `Cannot confirm order: Insufficient stock for "${prod.name}". Available: ${prod.availableQuantity}, Requested: ${line.quantity}.`
        };
      }

      const lineTotal = line.quantity * line.unitPrice;
      subtotal += lineTotal;
      items.push({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        total: lineTotal
      });
    }

    const discountPercent = orderData.discountPercent ?? 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    const discountedSubtotal = subtotal - discountAmount;

    const taxPercent = orderData.taxPercent ?? 18; // default 18% GST
    const taxAmount = (discountedSubtotal * taxPercent) / 100;
    const totalAmount = discountedSubtotal + taxAmount;

    const list = this.salesOrders();
    const nextNum = 8000 + list.length + 1;
    const today = new Date().toISOString().split('T')[0];

    const initialStatus: SalesOrderStatus = orderData.salesStatus || 'Confirmed';

    const newOrder: SalesOrder = {
      id: 'so-' + Date.now(),
      orderNumber: `SO-${nextNum}`,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      orderDate: today,
      deliveryDate: orderData.deliveryDate || today,
      items,
      subtotal,
      discountPercent,
      discountAmount,
      taxPercent,
      taxAmount,
      totalAmount,
      salesStatus: initialStatus,
      paymentStatus: 'Unpaid',
      invoiceGenerated: false,
      stockDeducted: false,
      notes: orderData.notes
    };

    // Deduct stock if confirmed
    if (willDeductStock) {
      for (const item of items) {
        this.inventoryService.adjustStock(
          item.productId,
          item.quantity,
          'OUT',
          'SALES_FULFILLMENT',
          newOrder.orderNumber,
          'Sales Dispatch',
          `Fulfillment for Order ${newOrder.orderNumber} (${newOrder.customerName})`
        );
      }
      newOrder.stockDeducted = true;
    }

    this.save([newOrder, ...list]);

    this.notificationService.notify(
      'New Sales Order',
      `Order ${newOrder.orderNumber} placed by ${newOrder.customerName} for ₹${newOrder.totalAmount.toLocaleString('en-IN')}.`,
      'success',
      '/sales/orders'
    );

    return { success: true, message: `Sales order ${newOrder.orderNumber} created successfully.`, order: newOrder };
  }

  updateSalesOrderStatus(orderId: string, newStatus: SalesOrderStatus): { success: boolean; message: string } {
    const order = this.getOrderById(orderId);
    if (!order) return { success: false, message: 'Sales order not found.' };

    if (order.salesStatus === newStatus) {
      return { success: true, message: 'Status is already ' + newStatus };
    }

    // If moving from Draft -> Confirmed/Processing/Shipped/Delivered
    if (!order.stockDeducted && newStatus !== 'Draft' && newStatus !== 'Cancelled') {
      // Validate stock availability
      for (const item of order.items) {
        const prod = this.inventoryService.getProductById(item.productId);
        if (!prod || prod.availableQuantity < item.quantity) {
          return {
            success: false,
            message: `Cannot confirm order: Insufficient stock for ${item.productName}. Available: ${prod?.availableQuantity ?? 0}, Requested: ${item.quantity}.`
          };
        }
      }

      // Deduct stock
      for (const item of order.items) {
        this.inventoryService.adjustStock(
          item.productId,
          item.quantity,
          'OUT',
          'SALES_FULFILLMENT',
          order.orderNumber,
          'Sales Dispatch',
          `Order confirmation fulfillment for ${order.orderNumber}`
        );
      }
      order.stockDeducted = true;
    }

    // If order was confirmed and is now being Cancelled -> Restore deducted stock!
    if (order.stockDeducted && newStatus === 'Cancelled') {
      for (const item of order.items) {
        this.inventoryService.adjustStock(
          item.productId,
          item.quantity,
          'IN',
          'SALES_CANCELLATION',
          order.orderNumber,
          'Sales Manager',
          `Restored inventory due to cancelled sales order ${order.orderNumber}`
        );
      }
      order.stockDeducted = false;
    }

    const updated = this.salesOrders().map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          salesStatus: newStatus,
          stockDeducted: order.stockDeducted
        };
      }
      return o;
    });

    this.save(updated);
    this.notificationService.notify(
      'Sales Order Status Updated',
      `Order ${order.orderNumber} is now ${newStatus}.`,
      newStatus === 'Cancelled' ? 'warning' : 'info',
      '/sales/orders'
    );

    return { success: true, message: `Order status updated to ${newStatus}.` };
  }

  markInvoiceGenerated(orderId: string, invoiceId: string): void {
    const updated = this.salesOrders().map(o => {
      if (o.id === orderId || o.orderNumber === orderId) {
        return {
          ...o,
          invoiceGenerated: true,
          invoiceId
        };
      }
      return o;
    });
    this.save(updated);
  }

  updatePaymentStatus(orderId: string, status: PaymentStatus): void {
    const updated = this.salesOrders().map(o => {
      if (o.id === orderId || o.orderNumber === orderId) {
        return { ...o, paymentStatus: status };
      }
      return o;
    });
    this.save(updated);
  }

  deleteDraftOrder(id: string): { success: boolean; message: string } {
    const order = this.getOrderById(id);
    if (!order) return { success: false, message: 'Sales order not found.' };

    if (order.salesStatus !== 'Draft' && order.salesStatus !== 'Cancelled') {
      return {
        success: false,
        message: 'Only Draft or Cancelled sales orders can be deleted. Please cancel the order first if needed.'
      };
    }

    const filtered = this.salesOrders().filter(o => o.id !== id);
    this.save(filtered);
    return { success: true, message: 'Sales order deleted.' };
  }

  resetDemo(): void {
    this.save(this.demoData.getDemoSalesOrders());
  }
}

