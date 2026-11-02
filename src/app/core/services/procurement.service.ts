import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { DemoDataService } from './demo-data.service';
import { InventoryService } from './inventory.service';
import { NotificationService } from './notification.service';
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '../models/erp.model';

@Injectable({
  providedIn: 'root'
})
export class ProcurementService {
  private readonly KEY = 'erp_purchase_orders';
  purchaseOrders = signal<PurchaseOrder[]>([]);

  totalPurchaseOrders = computed(() => this.purchaseOrders().length);

  pendingOrdersCount = computed(() => {
    return this.purchaseOrders().filter(po => po.status === 'Pending Approval' || po.status === 'Draft').length;
  });

  orderedCount = computed(() => {
    return this.purchaseOrders().filter(po => po.status === 'Ordered' || po.status === 'Approved').length;
  });

  totalPurchaseSpend = computed(() => {
    return this.purchaseOrders()
      .filter(po => po.status === 'Received' || po.status === 'Partially Received')
      .reduce((sum, po) => sum + po.totalAmount, 0);
  });

  constructor(
    private storage: StorageService,
    private demoData: DemoDataService,
    private inventoryService: InventoryService,
    private notificationService: NotificationService
  ) {
    this.loadPOs();
  }

  private loadPOs(): void {
    const data = this.storage.getItem<PurchaseOrder[]>(this.KEY, this.demoData.getDemoPurchaseOrders());
    this.purchaseOrders.set(data);
  }

  private save(data: PurchaseOrder[]): void {
    this.purchaseOrders.set(data);
    this.storage.setItem(this.KEY, data);
  }

  getPOById(id: string): PurchaseOrder | undefined {
    return this.purchaseOrders().find(p => p.id === id || p.poNumber === id);
  }

  createPurchaseOrder(order: {
    supplierId: string;
    supplierName: string;
    expectedDeliveryDate: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
    taxRate?: number;
    createdBy: string;
    notes?: string;
    status?: PurchaseOrderStatus;
  }): { success: boolean; message: string; po?: PurchaseOrder } {
    if (!order.items || order.items.length === 0) {
      return { success: false, message: 'Purchase order must have at least one product line item.' };
    }

    const items: PurchaseOrderItem[] = [];
    let subtotal = 0;

    for (const line of order.items) {
      const prod = this.inventoryService.getProductById(line.productId);
      if (!prod) {
        return { success: false, message: `Product with ID ${line.productId} not found.` };
      }
      if (line.quantity <= 0) {
        return { success: false, message: `Quantity for ${prod.name} must be greater than 0.` };
      }
      const lineTotal = line.quantity * line.unitPrice;
      subtotal += lineTotal;
      items.push({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        receivedQuantity: 0,
        total: lineTotal
      });
    }

    const taxRate = order.taxRate ?? 18; // default 18% GST
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    const list = this.purchaseOrders();
    const nextNum = 7000 + list.length + 1;
    const today = new Date().toISOString().split('T')[0];

    const newPO: PurchaseOrder = {
      id: 'po-' + Date.now(),
      poNumber: `PO-${nextNum}`,
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      orderDate: today,
      expectedDeliveryDate: order.expectedDeliveryDate || today,
      items,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      status: order.status || 'Pending Approval',
      createdBy: order.createdBy,
      notes: order.notes
    };

    this.save([newPO, ...list]);

    this.notificationService.notify(
      'New Purchase Order Created',
      `PO ${newPO.poNumber} created for ${newPO.supplierName} (Total: ₹${newPO.totalAmount.toLocaleString('en-IN')}).`,
      'info',
      '/inventory/procurement'
    );

    return { success: true, message: `Purchase order ${newPO.poNumber} created successfully.`, po: newPO };
  }

  updatePOStatus(id: string, status: PurchaseOrderStatus, actor: string): { success: boolean; message: string } {
    const po = this.getPOById(id);
    if (!po) return { success: false, message: 'Purchase order not found.' };

    const updated = this.purchaseOrders().map(p => {
      if (p.id === id) {
        return {
          ...p,
          status,
          approvedBy: status === 'Approved' || status === 'Ordered' ? actor : p.approvedBy
        };
      }
      return p;
    });

    this.save(updated);
    this.notificationService.notify(
      'PO Status Updated',
      `Purchase order ${po.poNumber} is now marked as ${status}.`,
      status === 'Cancelled' ? 'danger' : 'info',
      '/inventory/procurement'
    );
    return { success: true, message: `Purchase order status changed to ${status}.` };
  }

  receiveGoods(
    poId: string,
    receivedLines: { [productId: string]: number },
    receivedBy: string
  ): { success: boolean; message: string } {
    const po = this.getPOById(poId);
    if (!po) return { success: false, message: 'Purchase order not found.' };

    if (po.status === 'Cancelled' || po.status === 'Received') {
      return { success: false, message: `Cannot receive goods for a purchase order that is ${po.status}.` };
    }

    // Validation: prevent receiving more than the outstanding quantity
    for (const item of po.items) {
      const incomingQty = receivedLines[item.productId] || 0;
      const outstanding = item.quantity - item.receivedQuantity;
      if (incomingQty > outstanding) {
        return {
          success: false,
          message: `Cannot receive ${incomingQty} units of ${item.productName}. Outstanding purchase quantity is only ${outstanding}.`
        };
      }
    }

    let anyReceived = false;
    let allCompleted = true;

    const updatedItems = po.items.map(item => {
      const incoming = receivedLines[item.productId] || 0;
      if (incoming > 0) {
        anyReceived = true;
        const newReceivedQty = item.receivedQuantity + incoming;

        // Increase inventory stock
        this.inventoryService.adjustStock(
          item.productId,
          incoming,
          'IN',
          'PURCHASE_RECEIPT',
          po.poNumber,
          receivedBy,
          `Procurement intake from PO ${po.poNumber} (${po.supplierName})`
        );

        if (newReceivedQty < item.quantity) {
          allCompleted = false;
        }
        return { ...item, receivedQuantity: newReceivedQty };
      } else {
        if (item.receivedQuantity < item.quantity) {
          allCompleted = false;
        }
        return item;
      }
    });

    if (!anyReceived) {
      return { success: false, message: 'Please specify received quantities greater than zero.' };
    }

    const newStatus: PurchaseOrderStatus = allCompleted ? 'Received' : 'Partially Received';

    const updated = this.purchaseOrders().map(p => {
      if (p.id === po.id) {
        return {
          ...p,
          items: updatedItems,
          status: newStatus
        };
      }
      return p;
    });

    this.save(updated);

    this.notificationService.notify(
      'Inventory Goods Intake',
      `Goods received for ${po.poNumber}. Stock levels and stock movement updated (${newStatus}).`,
      'success',
      '/inventory/products'
    );

    return {
      success: true,
      message: `Goods received successfully. Purchase order is now ${newStatus}. Inventory stock increased.`
    };
  }

  deletePO(id: string): { success: boolean; message: string } {
    const po = this.getPOById(id);
    if (!po) return { success: false, message: 'Purchase order not found.' };
    if (po.status !== 'Draft' && po.status !== 'Pending Approval' && po.status !== 'Cancelled') {
      return {
        success: false,
        message: `Cannot delete purchase order with status '${po.status}'. Only Draft, Pending Approval, or Cancelled orders can be removed.`
      };
    }

    const filtered = this.purchaseOrders().filter(p => p.id !== id);
    this.save(filtered);
    return { success: true, message: 'Purchase order removed.' };
  }

  resetDemo(): void {
    this.save(this.demoData.getDemoPurchaseOrders());
  }
}

