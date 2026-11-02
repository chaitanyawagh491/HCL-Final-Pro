import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { DemoDataService } from './demo-data.service';
import { SalesService } from './sales.service';
import { NotificationService } from './notification.service';
import { Invoice, PaymentRecord, PaymentStatus, SalesOrder } from '../models/erp.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly KEY = 'erp_invoices';
  invoices = signal<Invoice[]>([]);

  totalInvoicesCount = computed(() => this.invoices().length);

  totalInvoicedAmount = computed(() => {
    return this.invoices().reduce((sum, inv) => sum + inv.totalAmount, 0);
  });

  totalCollectedCash = computed(() => {
    return this.invoices().reduce((sum, inv) => sum + inv.paidAmount, 0);
  });

  totalOutstandingAmount = computed(() => {
    return this.invoices().reduce((sum, inv) => sum + inv.outstandingAmount, 0);
  });

  paidInvoicesCount = computed(() => {
    return this.invoices().filter(i => i.paymentStatus === 'Paid').length;
  });

  unpaidInvoicesCount = computed(() => {
    return this.invoices().filter(i => i.paymentStatus === 'Unpaid' || i.paymentStatus === 'Partially Paid' || i.paymentStatus === 'Overdue').length;
  });

  overdueInvoicesCount = computed(() => {
    return this.invoices().filter(i => i.paymentStatus === 'Overdue').length;
  });

  constructor(
    private storage: StorageService,
    private demoData: DemoDataService,
    private salesService: SalesService,
    private notificationService: NotificationService
  ) {
    this.loadInvoices();
  }

  private loadInvoices(): void {
    const data = this.storage.getItem<Invoice[]>(this.KEY, this.demoData.getDemoInvoices());
    this.invoices.set(data);
    this.checkOverdueStatus(data);
  }

  private save(data: Invoice[]): void {
    this.invoices.set(data);
    this.storage.setItem(this.KEY, data);
  }

  private checkOverdueStatus(invoices: Invoice[]): void {
    const today = new Date().toISOString().split('T')[0];
    let changed = false;

    const updated = invoices.map(inv => {
      if (inv.outstandingAmount > 0 && inv.dueDate < today && inv.paymentStatus !== 'Overdue') {
        changed = true;
        return { ...inv, paymentStatus: 'Overdue' as PaymentStatus };
      }
      return inv;
    });

    if (changed) {
      this.save(updated);
    }
  }

  getInvoiceById(id: string): Invoice | undefined {
    return this.invoices().find(i => i.id === id || i.invoiceNumber === id);
  }

  getInvoiceBySalesOrderId(orderId: string): Invoice | undefined {
    return this.invoices().find(i => i.salesOrderId === orderId || i.salesOrderNumber === orderId);
  }

  generateInvoiceFromSalesOrder(salesOrder: SalesOrder, dueDate?: string): { success: boolean; message: string; invoice?: Invoice } {
    // Prevent duplicate invoice generation
    const existing = this.getInvoiceBySalesOrderId(salesOrder.id) || this.getInvoiceBySalesOrderId(salesOrder.orderNumber);
    if (existing || salesOrder.invoiceGenerated) {
      return {
        success: false,
        message: `An invoice (${existing?.invoiceNumber || 'existing'}) has already been generated for order ${salesOrder.orderNumber}.`
      };
    }

    const today = new Date().toISOString().split('T')[0];
    // Default dueDate: 30 days from today
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 30);
    const defaultDueDate = dueDate || dueDateObj.toISOString().split('T')[0];

    const list = this.invoices();
    const nextNum = 9000 + list.length + 1;

    const items = salesOrder.items.map(item => ({
      description: `${item.productName} (${item.sku})`,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.total
    }));

    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber: `INV-${nextNum}`,
      salesOrderId: salesOrder.id,
      salesOrderNumber: salesOrder.orderNumber,
      customerName: salesOrder.customerName,
      customerAddress: salesOrder.customerAddress,
      customerEmail: salesOrder.customerEmail,
      invoiceDate: today,
      dueDate: defaultDueDate,
      items,
      subtotal: salesOrder.subtotal,
      discount: salesOrder.discountAmount,
      gst: salesOrder.taxAmount,
      totalAmount: salesOrder.totalAmount,
      paidAmount: 0,
      outstandingAmount: salesOrder.totalAmount,
      paymentStatus: 'Unpaid',
      payments: [],
      notes: `Generated from Sales Order ${salesOrder.orderNumber}. Standard enterprise payment terms apply.`
    };

    const updatedInvoices = [newInvoice, ...list];
    this.save(updatedInvoices);

    // Update sales order to mark invoice generated
    this.salesService.markInvoiceGenerated(salesOrder.id, newInvoice.id);

    this.notificationService.notify(
      'New Invoice Generated',
      `Invoice ${newInvoice.invoiceNumber} generated for ${newInvoice.customerName} (₹${newInvoice.totalAmount.toLocaleString('en-IN')}).`,
      'info',
      '/sales/invoices'
    );

    return { success: true, message: `Invoice ${newInvoice.invoiceNumber} generated successfully.`, invoice: newInvoice };
  }

  recordPayment(
    invoiceId: string,
    amount: number,
    paymentMethod: PaymentRecord['paymentMethod'],
    transactionReference: string,
    recordedBy: string,
    notes = ''
  ): { success: boolean; message: string; payment?: PaymentRecord } {
    const invoice = this.getInvoiceById(invoiceId);
    if (!invoice) return { success: false, message: 'Invoice not found.' };

    if (amount <= 0) {
      return { success: false, message: 'Payment amount must be greater than zero.' };
    }

    if (amount > invoice.outstandingAmount + 0.01) {
      return {
        success: false,
        message: `Payment amount (₹${amount.toLocaleString('en-IN')}) exceeds the outstanding balance (₹${invoice.outstandingAmount.toLocaleString('en-IN')}).`
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const newPayment: PaymentRecord = {
      id: 'pay-' + Date.now(),
      paymentId: `PAY-${1000 + (invoice.payments?.length || 0) + 1}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount,
      paymentDate: today,
      paymentMethod,
      transactionReference: transactionReference || `TXN-${Date.now().toString().slice(-6)}`,
      recordedBy,
      notes
    };

    const newPaidAmount = invoice.paidAmount + amount;
    const newOutstanding = Math.max(0, invoice.totalAmount - newPaidAmount);

    let newStatus: PaymentStatus;
    if (newOutstanding <= 0.01) {
      newStatus = 'Paid';
    } else {
      newStatus = 'Partially Paid';
    }

    const updated = this.invoices().map(i => {
      if (i.id === invoice.id) {
        return {
          ...i,
          paidAmount: newPaidAmount,
          outstandingAmount: newOutstanding,
          paymentStatus: newStatus,
          payments: [...(i.payments || []), newPayment]
        };
      }
      return i;
    });

    this.save(updated);

    // Sync status to sales order
    this.salesService.updatePaymentStatus(invoice.salesOrderId, newStatus);

    this.notificationService.notify(
      'Payment Recorded',
      `Received payment of ₹${amount.toLocaleString('en-IN')} for Invoice ${invoice.invoiceNumber}. Balance: ₹${newOutstanding.toLocaleString('en-IN')}.`,
      'success',
      '/finance/dashboard'
    );

    return { success: true, message: 'Payment recorded successfully.', payment: newPayment };
  }

  deleteInvoice(id: string): { success: boolean; message: string } {
    const invoice = this.getInvoiceById(id);
    if (!invoice) return { success: false, message: 'Invoice not found.' };

    if (invoice.paidAmount > 0) {
      return {
        success: false,
        message: 'Cannot delete invoice that has recorded payment transactions.'
      };
    }

    const filtered = this.invoices().filter(i => i.id !== id);
    this.save(filtered);
    return { success: true, message: 'Invoice removed.' };
  }

  resetDemo(): void {
    this.save(this.demoData.getDemoInvoices());
  }
}

