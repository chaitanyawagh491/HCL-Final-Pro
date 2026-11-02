import { Component, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SalesService } from '../../../core/services/sales.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import { AuthService } from '../../../core/services/auth.service';
import { SalesOrder, SalesOrderStatus } from '../../../core/models/erp.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-sales-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IconComponent,
    BadgeComponent,
    ModalComponent,
    PaginationComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="sales-page">
      <!-- Page Header -->
      <div class="erp-card-header">
        <div>
          <h2 class="erp-card-title">Sales Orders & Client Contracts</h2>
          <p class="erp-card-subtitle">Manage customer demand, verify available inventory, and trigger enterprise fulfillment</p>
        </div>
        <div class="header-btn-row">
          <a routerLink="/sales/invoices" class="btn btn-secondary">
            <app-icon name="file-text" [size]="16"></app-icon>
            <span>Customer Invoices</span>
          </a>
          <button type="button" class="btn btn-primary" (click)="openCreateModal()" *ngIf="canManage">
            <app-icon name="plus" [size]="16"></app-icon>
            <span>New Sales Order</span>
          </button>
        </div>
      </div>

      <!-- Feedback Alerts -->
      <div class="alert-box alert-error" *ngIf="errorMessage">
        <app-icon name="alert-circle" [size]="18"></app-icon>
        <span>{{ errorMessage }}</span>
      </div>
      <div class="alert-box alert-success" *ngIf="successMessage">
        <app-icon name="check-circle" [size]="18"></app-icon>
        <span>{{ successMessage }}</span>
      </div>

      <!-- Sales Volume KPI Bar -->
      <div class="grid-cols-3">
        <div class="sales-kpi-card">
          <span class="kpi-lbl">Total Sales Bookings</span>
          <span class="kpi-val text-primary">₹{{ Math.round(salesService.totalSalesVolume()).toLocaleString('en-IN') }}</span>
          <span class="kpi-sub">{{ salesService.totalSalesCount() }} total contract orders</span>
        </div>
        <div class="sales-kpi-card">
          <span class="kpi-lbl">Fulfilled & Delivered</span>
          <span class="kpi-val text-success">₹{{ Math.round(salesService.deliveredSalesVolume()).toLocaleString('en-IN') }}</span>
          <span class="kpi-sub">Completed customer dispatches</span>
        </div>
        <div class="sales-kpi-card">
          <span class="kpi-lbl">In-Flight Orders</span>
          <span class="kpi-val text-warning">{{ inFlightOrdersCount() }} Orders</span>
          <span class="kpi-sub">Confirmed / Processing / Shipped</span>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar-container">
        <div class="search-box">
          <app-icon name="search" [size]="16"></app-icon>
          <input
            type="text"
            class="form-control"
            placeholder="Search by order #, customer, email..."
            [value]="searchQuery()"
            (input)="onSearch($event)"
          />
        </div>

        <div class="filter-bar">
          <select class="form-select" (change)="onStatusFilter($event)">
            <option value="All">All Order Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select class="form-select" (change)="onPaymentFilter($event)">
            <option value="All">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      <!-- Sales Orders Table -->
      <div class="erp-card table-card">
        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Client / Customer</th>
                <th>Order Date</th>
                <th>Delivery Date</th>
                <th>Total (incl. GST)</th>
                <th>Order Status</th>
                <th>Payment</th>
                <th>Invoice</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of pagedOrders(); trackBy: trackById">
                <td><strong class="font-mono">{{ order.orderNumber }}</strong></td>
                <td>
                  <strong>{{ order.customerName }}</strong>
                  <div class="text-xs text-muted">{{ order.customerEmail }}</div>
                </td>
                <td>{{ order.orderDate }}</td>
                <td>{{ order.deliveryDate }}</td>
                <td><strong>₹{{ order.totalAmount.toLocaleString('en-IN') }}</strong></td>
                <td><app-badge [text]="order.salesStatus"></app-badge></td>
                <td><app-badge [text]="order.paymentStatus"></app-badge></td>
                <td>
                  <span class="inv-tag" *ngIf="order.invoiceGenerated" (click)="goToInvoice(order.invoiceId)">
                    <app-icon name="check" [size]="12"></app-icon> Generated
                  </span>
                  <span class="text-xs text-muted" *ngIf="!order.invoiceGenerated">Not Generated</span>
                </td>
                <td class="text-right">
                  <div class="actions-cell">
                    <button type="button" class="btn btn-secondary btn-xs" (click)="viewOrder(order)">
                      View
                    </button>

                    <!-- Generate Invoice Button (Only if not already generated!) -->
                    <button
                      type="button"
                      class="btn btn-outline-primary btn-xs"
                      *ngIf="!order.invoiceGenerated && order.salesStatus !== 'Cancelled' && canManage"
                      (click)="generateInvoice(order)"
                      title="Generate tax invoice for this order"
                    >
                      <app-icon name="file-text" [size]="13"></app-icon>
                      <span>Invoice</span>
                    </button>

                    <!-- Status Transition Menu Dropdown -->
                    <select
                      class="status-select-xs"
                      *ngIf="order.salesStatus !== 'Delivered' && order.salesStatus !== 'Cancelled' && canManage"
                      (change)="changeOrderStatus(order, $event)"
                    >
                      <option [value]="order.salesStatus">Move: {{ order.salesStatus }}</option>
                      <option value="Confirmed" *ngIf="order.salesStatus === 'Draft'">Confirm Order</option>
                      <option value="Processing" *ngIf="order.salesStatus === 'Confirmed'">Mark Processing</option>
                      <option value="Shipped" *ngIf="order.salesStatus === 'Processing'">Mark Shipped</option>
                      <option value="Delivered" *ngIf="order.salesStatus === 'Shipped'">Mark Delivered</option>
                      <option value="Cancelled">Cancel Order</option>
                    </select>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <app-empty-state
          *ngIf="filteredOrders().length === 0"
          icon="shopping-cart"
          title="No sales orders found"
          description="There are no sales orders matching your search or filters."
          actionLabel="Create Sales Order"
          (actionClicked)="openCreateModal()"
        ></app-empty-state>

        <app-pagination
          [totalItems]="filteredOrders().length"
          [pageSize]="pageSize"
          [currentPage]="currentPage()"
          (pageChanged)="currentPage.set($event)"
        ></app-pagination>
      </div>

      <!-- Create Sales Order Modal -->
      <app-modal
        [isOpen]="showCreateModal"
        title="Create New Client Sales Order"
        subtitle="Checks available warehouse stock before confirmation. Deducts stock automatically without double-deduction."
        size="lg"
        (closed)="showCreateModal = false"
      >
        <form [formGroup]="salesForm" (ngSubmit)="submitSalesOrder()">
          <div class="grid-cols-2">
            <div class="form-group">
              <label class="form-label required">Customer / Company Name</label>
              <input type="text" formControlName="customerName" class="form-control" placeholder="e.g. Infotech Systems Corp" />
            </div>

            <div class="form-group">
              <label class="form-label required">Customer Email</label>
              <input type="email" formControlName="customerEmail" class="form-control" placeholder="billing@client.com" />
            </div>
          </div>

          <div class="grid-cols-3">
            <div class="form-group">
              <label class="form-label required">Contact Phone</label>
              <input type="text" formControlName="customerPhone" class="form-control" placeholder="+91 98..." />
            </div>

            <div class="form-group">
              <label class="form-label required">Target Delivery Date</label>
              <input type="date" formControlName="deliveryDate" class="form-control" />
            </div>

            <div class="form-group">
              <label class="form-label required">Initial Status</label>
              <select formControlName="salesStatus" class="form-select">
                <option value="Confirmed">Confirmed (Deducts Stock)</option>
                <option value="Draft">Draft (Stock Quote Only)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required">Billing & Delivery Address</label>
            <input type="text" formControlName="customerAddress" class="form-control" placeholder="Office park, city, pincode" />
          </div>

          <!-- Product Line Items -->
          <div class="line-items-section">
            <div class="section-title-row">
              <span class="items-title">Ordered Products</span>
              <button type="button" class="btn btn-outline-primary btn-xs" (click)="addLineItem()">
                <app-icon name="plus" [size]="14"></app-icon> Add Product
              </button>
            </div>

            <div formArrayName="items" class="items-list">
              <div *ngFor="let item of itemsFormArray.controls; let i = index" [formGroupName]="i" class="item-row">
                <div class="form-group prod-select-group">
                  <label class="form-label">Product</label>
                  <select formControlName="productId" class="form-select" (change)="onProductSelected(i)">
                    <option *ngFor="let p of inventoryService.products()" [value]="p.id">
                      {{ p.name }} (Available: {{ p.availableQuantity }} {{ p.unit }} | Price: ₹{{ p.sellingPrice }})
                    </option>
                  </select>
                </div>

                <div class="form-group qty-group">
                  <label class="form-label">Qty</label>
                  <input type="number" formControlName="quantity" class="form-control" min="1" (input)="recalculateTotals()" />
                </div>

                <div class="form-group price-group">
                  <label class="form-label">Price (₹)</label>
                  <input type="number" formControlName="unitPrice" class="form-control" min="1" (input)="recalculateTotals()" />
                </div>

                <div class="form-group remove-group" *ngIf="itemsFormArray.length > 1">
                  <label class="form-label">&nbsp;</label>
                  <button type="button" class="btn-remove-line" (click)="removeLineItem(i)">
                    <app-icon name="trash" [size]="16"></app-icon>
                  </button>
                </div>
              </div>
            </div>

            <!-- Discount & Tax Configuration -->
            <div class="discount-tax-row">
              <div class="form-group mb-0">
                <label class="form-label">Discount (%):</label>
                <input type="number" formControlName="discountPercent" class="form-control w-100px" min="0" max="100" (input)="recalculateTotals()" />
              </div>
            </div>

            <div class="totals-summary-box">
              <div class="tot-row">
                <span>Subtotal:</span>
                <strong>₹{{ calculatedSubtotal.toLocaleString('en-IN') }}</strong>
              </div>
              <div class="tot-row" *ngIf="calculatedDiscount > 0">
                <span>Discount:</span>
                <strong class="text-danger">-₹{{ calculatedDiscount.toLocaleString('en-IN') }}</strong>
              </div>
              <div class="tot-row">
                <span>GST (18%):</span>
                <strong>₹{{ calculatedTax.toLocaleString('en-IN') }}</strong>
              </div>
              <div class="tot-row grand-total">
                <span>Total Amount:</span>
                <strong class="text-primary">₹{{ calculatedTotal.toLocaleString('en-IN') }}</strong>
              </div>
            </div>
          </div>

          <div modal-footer>
            <button type="button" class="btn btn-secondary" (click)="showCreateModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="salesForm.invalid">
              <app-icon name="check" [size]="16"></app-icon>
              <span>Save & Confirm Sales Order</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- View Order Details Modal -->
      <app-modal
        [isOpen]="showDetailsModal"
        [title]="selectedOrder ? 'Sales Order: ' + selectedOrder.orderNumber : 'Order Details'"
        subtitle="Complete itemization, customer details, and delivery information"
        size="lg"
        [showFooter]="false"
        (closed)="showDetailsModal = false"
      >
        <div class="order-details-view" *ngIf="selectedOrder">
          <div class="grid-cols-3 po-meta-bar">
            <div>
              <span class="meta-label">Customer:</span>
              <strong>{{ selectedOrder.customerName }}</strong>
              <div class="text-xs text-muted">{{ selectedOrder.customerAddress }}</div>
            </div>
            <div>
              <span class="meta-label">Order Date:</span>
              <span>{{ selectedOrder.orderDate }}</span>
            </div>
            <div>
              <span class="meta-label">Order Status:</span>
              <app-badge [text]="selectedOrder.salesStatus"></app-badge>
            </div>
          </div>

          <div class="table-responsive mt-3">
            <table class="erp-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of selectedOrder.items; trackBy: trackById">
                  <td><strong>{{ item.productName }}</strong></td>
                  <td><span class="sku-tag">{{ item.sku }}</span></td>
                  <td>{{ item.quantity }}</td>
                  <td>₹{{ item.unitPrice.toLocaleString('en-IN') }}</td>
                  <td><strong>₹{{ item.total.toLocaleString('en-IN') }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="po-footer-totals">
            <div>Subtotal: ₹{{ selectedOrder.subtotal.toLocaleString('en-IN') }}</div>
            <div *ngIf="selectedOrder.discountAmount > 0">Discount ({{ selectedOrder.discountPercent }}%): -₹{{ selectedOrder.discountAmount.toLocaleString('en-IN') }}</div>
            <div>Tax (18% GST): ₹{{ selectedOrder.taxAmount.toLocaleString('en-IN') }}</div>
            <div class="grand-total">Total Order Value: <strong>₹{{ selectedOrder.totalAmount.toLocaleString('en-IN') }}</strong></div>
          </div>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .sales-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .header-btn-row {
      display: flex;
      gap: 10px;
    }
    .sales-kpi-card {
      background: var(--erp-card-bg);
      border: 1px solid var(--erp-border);
      border-radius: 10px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
    }
    .kpi-lbl {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--erp-text-muted);
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .kpi-val {
      font-size: 1.45rem;
      font-weight: 700;
      line-height: 1.2;
    }
    .kpi-sub {
      font-size: 0.775rem;
      color: var(--erp-text-muted);
      margin-top: 4px;
    }
    .text-primary { color: #2563eb !important; }
    .text-success { color: #16a34a !important; }
    .text-warning { color: #d97706 !important; }
    .text-danger { color: #dc2626 !important; }
    .text-xs { font-size: 0.75rem; }

    .inv-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #dcfce7;
      color: #15803d;
      font-size: 0.725rem;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;
      cursor: pointer;
    }
    .inv-tag:hover {
      text-decoration: underline;
    }
    .actions-cell {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      align-items: center;
    }
    .btn-xs {
      padding: 4px 10px;
      font-size: 0.75rem;
      border-radius: 6px;
    }
    .status-select-xs {
      padding: 3px 6px;
      border-radius: 6px;
      font-size: 0.75rem;
      border: 1px solid var(--erp-border);
      background: var(--erp-bg-subtle);
      color: var(--erp-text);
      cursor: pointer;
      outline: none;
    }
    .line-items-section {
      background: var(--erp-bg-subtle);
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 16px;
      border: 1px solid var(--erp-border);
    }
    .section-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .items-title {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--erp-text-heading);
    }
    .item-row {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 10px;
    }
    .prod-select-group { flex: 3; margin-bottom: 0 !important; }
    .qty-group { flex: 1; margin-bottom: 0 !important; }
    .price-group { flex: 1.5; margin-bottom: 0 !important; }
    .remove-group { margin-bottom: 0 !important; }
    .btn-remove-line {
      background: none;
      border: none;
      color: #dc2626;
      cursor: pointer;
      padding: 6px;
    }
    .discount-tax-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
    }
    .w-100px { width: 100px; text-align: center; }
    .mb-0 { margin-bottom: 0; }
    .totals-summary-box {
      border-top: 1px solid var(--erp-border);
      padding-top: 10px;
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      font-size: 0.875rem;
    }
    .grand-total {
      font-size: 1rem;
      color: var(--erp-text-heading);
    }
    .po-meta-bar {
      background: var(--erp-bg-subtle);
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.875rem;
      display: flex;
      justify-content: space-between;
    }
    .po-footer-totals {
      text-align: right;
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.9rem;
    }
    .sku-tag {
      font-family: var(--erp-font-mono);
      font-size: 0.775rem;
      background: var(--erp-bg-subtle);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .text-right { text-align: right; }
    .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid-cols-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  `]
})
export class SalesOrdersComponent {
  salesService = inject(SalesService);
  inventoryService = inject(InventoryService);
  invoiceService = inject(InvoiceService);
  auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  Math = Math;

  searchQuery = signal('');
  selectedStatus = signal('All');
  selectedPayment = signal('All');

  currentPage = signal(1);
  pageSize = 8;

  showCreateModal = false;
  showDetailsModal = false;
  selectedOrder: SalesOrder | null = null;

  calculatedSubtotal = 0;
  calculatedDiscount = 0;
  calculatedTax = 0;
  calculatedTotal = 0;

  errorMessage = '';
  successMessage = '';

  salesForm: FormGroup;

  get canManage(): boolean {
    return this.auth.hasRole(['Admin', 'Sales Manager']);
  }

  inFlightOrdersCount = computed(() => {
    return this.salesService.salesOrders().filter(
      o => o.salesStatus === 'Confirmed' || o.salesStatus === 'Processing' || o.salesStatus === 'Shipped'
    ).length;
  });

  get itemsFormArray(): FormArray {
    return this.salesForm.get('items') as FormArray;
  }

  filteredOrders = computed(() => {
    let list = this.salesService.salesOrders();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.selectedStatus();
    const payment = this.selectedPayment();

    if (query) {
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query) ||
        o.customerEmail.toLowerCase().includes(query)
      );
    }

    if (status !== 'All') {
      list = list.filter(o => o.salesStatus === status);
    }

    if (payment !== 'All') {
      list = list.filter(o => o.paymentStatus === payment);
    }

    return list;
  });

  pagedOrders = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredOrders().slice(start, start + this.pageSize);
  });

  trackById(index: number, item: any): string {
    return item?.id || item?.productId || item?.orderNumber || index.toString();
  }

  constructor() {
    const today = new Date().toISOString().split('T')[0];
    this.salesForm = this.fb.group({
      customerName: ['', Validators.required],
      customerEmail: ['', [Validators.required, Validators.email]],
      customerPhone: ['', Validators.required],
      customerAddress: ['', Validators.required],
      deliveryDate: [today, Validators.required],
      salesStatus: ['Confirmed', Validators.required],
      discountPercent: [0, [Validators.min(0), Validators.max(100)]],
      items: this.fb.array([])
    });
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onStatusFilter(event: Event): void {
    this.selectedStatus.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  onPaymentFilter(event: Event): void {
    this.selectedPayment.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  openCreateModal(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.itemsFormArray.clear();

    const firstProd = this.inventoryService.products()[0];
    this.itemsFormArray.push(this.createItemGroup(firstProd?.id || '', 2, firstProd?.sellingPrice || 10000));
    this.recalculateTotals();

    this.showCreateModal = true;
  }

  createItemGroup(productId: string, quantity: number, unitPrice: number): FormGroup {
    return this.fb.group({
      productId: [productId, Validators.required],
      quantity: [quantity, [Validators.required, Validators.min(1)]],
      unitPrice: [unitPrice, [Validators.required, Validators.min(1)]]
    });
  }

  addLineItem(): void {
    const firstProd = this.inventoryService.products()[0];
    this.itemsFormArray.push(this.createItemGroup(firstProd?.id || '', 1, firstProd?.sellingPrice || 10000));
    this.recalculateTotals();
  }

  removeLineItem(index: number): void {
    if (this.itemsFormArray.length > 1) {
      this.itemsFormArray.removeAt(index);
      this.recalculateTotals();
    }
  }

  onProductSelected(index: number): void {
    const itemGroup = this.itemsFormArray.at(index);
    const prodId = itemGroup.get('productId')?.value;
    const prod = this.inventoryService.getProductById(prodId);
    if (prod) {
      itemGroup.patchValue({ unitPrice: prod.sellingPrice });
      this.recalculateTotals();
    }
  }

  recalculateTotals(): void {
    let sub = 0;
    this.itemsFormArray.controls.forEach(control => {
      const qty = control.get('quantity')?.value || 0;
      const price = control.get('unitPrice')?.value || 0;
      sub += qty * price;
    });

    const discRate = this.salesForm.get('discountPercent')?.value || 0;
    this.calculatedSubtotal = sub;
    this.calculatedDiscount = (sub * discRate) / 100;
    const discounted = sub - this.calculatedDiscount;
    this.calculatedTax = (discounted * 18) / 100;
    this.calculatedTotal = discounted + this.calculatedTax;
  }

  submitSalesOrder(): void {
    if (this.salesForm.invalid || this.itemsFormArray.length === 0) return;

    this.errorMessage = '';
    this.successMessage = '';
    const val = this.salesForm.value;

    const res = this.salesService.createSalesOrder({
      customerName: val.customerName,
      customerEmail: val.customerEmail,
      customerPhone: val.customerPhone,
      customerAddress: val.customerAddress,
      deliveryDate: val.deliveryDate,
      items: val.items,
      discountPercent: val.discountPercent,
      salesStatus: val.salesStatus,
      taxPercent: 18
    });

    if (res.success) {
      this.successMessage = res.message;
      this.showCreateModal = false;
    } else {
      this.errorMessage = res.message;
    }
  }

  viewOrder(order: SalesOrder): void {
    this.selectedOrder = order;
    this.showDetailsModal = true;
  }

  changeOrderStatus(order: SalesOrder, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as SalesOrderStatus;
    if (newStatus === order.salesStatus) return;

    const res = this.salesService.updateSalesOrderStatus(order.id, newStatus);
    if (res.success) {
      this.successMessage = res.message;
      this.errorMessage = '';
    } else {
      this.errorMessage = res.message;
      this.successMessage = '';
    }
  }

  generateInvoice(order: SalesOrder): void {
    this.errorMessage = '';
    this.successMessage = '';
    const res = this.invoiceService.generateInvoiceFromSalesOrder(order);
    if (res.success) {
      this.successMessage = res.message;
    } else {
      this.errorMessage = res.message;
    }
  }

  goToInvoice(invId?: string): void {
    this.router.navigate(['/sales/invoices']);
  }
}
