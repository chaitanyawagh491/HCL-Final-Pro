import { Component, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InvoiceService } from '../../../core/services/invoice.service';
import { AuthService } from '../../../core/services/auth.service';
import { Invoice, PaymentRecord } from '../../../core/models/erp.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconComponent,
    BadgeComponent,
    ModalComponent,
    PaginationComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="invoices-page">
      <!-- Page Header -->
      <div class="erp-card-header no-print">
        <div>
          <h2 class="erp-card-title">Customer Invoicing & Receivables</h2>
          <p class="erp-card-subtitle">Manage tax invoices, record payment transactions, and track accounts receivable</p>
        </div>
      </div>

      <!-- KPI Summary -->
      <div class="grid-cols-4 no-print">
        <div class="inv-kpi-card">
          <span class="kpi-lbl">Total Billed Invoices</span>
          <span class="kpi-val text-primary">₹{{ Math.round(invoiceService.totalInvoicedAmount()).toLocaleString('en-IN') }}</span>
          <span class="kpi-sub">{{ invoiceService.totalInvoicesCount() }} Invoices Generated</span>
        </div>
        <div class="inv-kpi-card">
          <span class="kpi-lbl">Collected Cash</span>
          <span class="kpi-val text-success">₹{{ Math.round(invoiceService.totalCollectedCash()).toLocaleString('en-IN') }}</span>
          <span class="kpi-sub">Total payments reconciled</span>
        </div>
        <div class="inv-kpi-card">
          <span class="kpi-lbl">Outstanding Receivables</span>
          <span class="kpi-val text-warning">₹{{ Math.round(invoiceService.totalOutstandingAmount()).toLocaleString('en-IN') }}</span>
          <span class="kpi-sub">{{ invoiceService.unpaidInvoicesCount() }} Open invoices</span>
        </div>
        <div class="inv-kpi-card">
          <span class="kpi-lbl">Overdue Risk Dues</span>
          <span class="kpi-val text-danger">{{ invoiceService.overdueInvoicesCount() }} Invoices</span>
          <span class="kpi-sub">Past payment due date</span>
        </div>
      </div>

      <!-- Alerts -->
      <div class="alert-box alert-error no-print" *ngIf="errorMessage">
        <app-icon name="alert-circle" [size]="18"></app-icon>
        <span>{{ errorMessage }}</span>
      </div>
      <div class="alert-box alert-success no-print" *ngIf="successMessage">
        <app-icon name="check-circle" [size]="18"></app-icon>
        <span>{{ successMessage }}</span>
      </div>

      <!-- Toolbar -->
      <div class="toolbar-container no-print">
        <div class="search-box">
          <app-icon name="search" [size]="16"></app-icon>
          <input
            type="text"
            class="form-control"
            placeholder="Search by invoice #, customer name..."
            [value]="searchQuery()"
            (input)="onSearch($event)"
          />
        </div>

        <div class="filter-bar">
          <select class="form-select" (change)="onStatusFilter($event)">
            <option value="All">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      <!-- Invoices Table -->
      <div class="erp-card table-card no-print">
        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client / Customer</th>
                <th>Order Ref</th>
                <th>Invoice Date</th>
                <th>Due Date</th>
                <th>Total Billed</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let inv of pagedInvoices(); trackBy: trackById">
                <td><strong class="font-mono">{{ inv.invoiceNumber }}</strong></td>
                <td>
                  <strong>{{ inv.customerName }}</strong>
                </td>
                <td><span class="font-mono text-muted">{{ inv.salesOrderNumber }}</span></td>
                <td>{{ inv.invoiceDate }}</td>
                <td>
                  <span [class.text-danger]="inv.paymentStatus === 'Overdue'">{{ inv.dueDate }}</span>
                </td>
                <td><strong>₹{{ inv.totalAmount.toLocaleString('en-IN') }}</strong></td>
                <td><span class="text-success">₹{{ inv.paidAmount.toLocaleString('en-IN') }}</span></td>
                <td>
                  <strong [class.text-danger]="inv.outstandingAmount > 0">
                    ₹{{ inv.outstandingAmount.toLocaleString('en-IN') }}
                  </strong>
                </td>
                <td><app-badge [text]="inv.paymentStatus"></app-badge></td>
                <td class="text-right">
                  <div class="actions-cell">
                    <button type="button" class="btn btn-secondary btn-xs" (click)="viewInvoice(inv)">
                      <app-icon name="printer" [size]="13"></app-icon>
                      <span>View & Print</span>
                    </button>

                    <!-- Record Payment button if outstanding > 0 -->
                    <button
                      type="button"
                      class="btn btn-success btn-xs"
                      *ngIf="inv.outstandingAmount > 0 && canManagePayments"
                      (click)="openPaymentModal(inv)"
                    >
                      <app-icon name="dollar-sign" [size]="13"></app-icon>
                      <span>Pay</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <app-empty-state
          *ngIf="filteredInvoices().length === 0"
          icon="file-text"
          title="No invoices found"
          description="Invoices are created directly from confirmed sales orders."
        ></app-empty-state>

        <app-pagination
          [totalItems]="filteredInvoices().length"
          [pageSize]="pageSize"
          [currentPage]="currentPage()"
          (pageChanged)="currentPage.set($event)"
        ></app-pagination>
      </div>

      <!-- Professional Printable Invoice Modal Template -->
      <app-modal
        [isOpen]="showViewModal"
        title="Enterprise Tax Invoice"
        subtitle="Official billing document for client fulfillment"
        size="xl"
        (closed)="showViewModal = false"
      >
        <div class="printable-invoice" id="printableInvoice" *ngIf="selectedInvoice">
          <!-- Corporate Letterhead Header -->
          <div class="inv-doc-header">
            <div class="company-brand">
              <div class="brand-title">HCL ENTERPRISE SOLUTIONS</div>
              <div class="brand-sub">HCL Technologies &bull; Enterprise Resource Planning Division</div>
              <div class="brand-address">Plot 3A, Sector 126, Noida, Uttar Pradesh, India - 201304</div>
              <div class="brand-gst">GSTIN: <strong>07AAACH1234F1Z9</strong> &bull; PAN: AAACH1234F</div>
            </div>
            <div class="invoice-badge-block">
              <h1 class="inv-title">TAX INVOICE</h1>
              <div class="inv-num">{{ selectedInvoice.invoiceNumber }}</div>
              <div class="inv-status-pill">
                <app-badge [text]="selectedInvoice.paymentStatus"></app-badge>
              </div>
            </div>
          </div>

          <div class="inv-doc-divider"></div>

          <!-- Billing & Order Meta Grid -->
          <div class="inv-info-grid">
            <div class="info-col">
              <span class="col-title">BILLED TO (CUSTOMER):</span>
              <strong class="cust-name">{{ selectedInvoice.customerName }}</strong>
              <div class="cust-addr">{{ selectedInvoice.customerAddress }}</div>
              <div class="cust-email">{{ selectedInvoice.customerEmail }}</div>
            </div>

            <div class="info-col text-right">
              <div class="meta-line">
                <span class="lbl">Invoice Date:</span>
                <strong>{{ selectedInvoice.invoiceDate }}</strong>
              </div>
              <div class="meta-line">
                <span class="lbl">Payment Due Date:</span>
                <strong>{{ selectedInvoice.dueDate }}</strong>
              </div>
              <div class="meta-line">
                <span class="lbl">Sales Order Ref:</span>
                <span class="font-mono">{{ selectedInvoice.salesOrderNumber }}</span>
              </div>
            </div>
          </div>

          <!-- Itemized Table -->
          <table class="inv-items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Description</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of selectedInvoice.items; trackBy: trackById; let i = index">
                <td>{{ i + 1 }}</td>
                <td><strong>{{ item.description }}</strong></td>
                <td class="text-center">{{ item.quantity }}</td>
                <td class="text-right">₹{{ item.unitPrice.toLocaleString('en-IN') }}</td>
                <td class="text-right">₹{{ item.subtotal.toLocaleString('en-IN') }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Financial Calculation Breakdown -->
          <div class="inv-calculation-section">
            <div class="banking-instructions">
              <span class="bank-title">Payment Settlement Details:</span>
              <div>Bank: <strong>HDFC Bank Ltd &bull; Corporate Banking Branch</strong></div>
              <div>Account Name: <strong>HCL Enterprise Solutions Pvt Ltd</strong></div>
              <div>Account Number: <strong>50200012345678</strong> &bull; IFSC: <strong>HDFC0000123</strong></div>
              <div class="inv-terms-note">Terms: Net 30 days. Cheques payable to HCL Enterprise Solutions.</div>
            </div>

            <div class="calc-totals-block">
              <div class="calc-row">
                <span>Subtotal:</span>
                <span>₹{{ selectedInvoice.subtotal.toLocaleString('en-IN') }}</span>
              </div>
              <div class="calc-row" *ngIf="selectedInvoice.discount > 0">
                <span>Discount Applied:</span>
                <span class="text-danger">-₹{{ selectedInvoice.discount.toLocaleString('en-IN') }}</span>
              </div>
              <div class="calc-row">
                <span>GST (18% Integrated Tax):</span>
                <span>₹{{ selectedInvoice.gst.toLocaleString('en-IN') }}</span>
              </div>
              <div class="calc-row calc-grand-total">
                <span>Total Invoice Amount:</span>
                <span>₹{{ selectedInvoice.totalAmount.toLocaleString('en-IN') }}</span>
              </div>
              <div class="calc-row calc-paid">
                <span>Amount Paid:</span>
                <span class="text-success">₹{{ selectedInvoice.paidAmount.toLocaleString('en-IN') }}</span>
              </div>
              <div class="calc-row calc-balance">
                <span>Balance Due:</span>
                <span [class.text-danger]="selectedInvoice.outstandingAmount > 0">
                  ₹{{ selectedInvoice.outstandingAmount.toLocaleString('en-IN') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Transaction Records -->
          <div class="payments-history-block" *ngIf="selectedInvoice.payments && selectedInvoice.payments.length > 0">
            <span class="bank-title">Recorded Payment Transactions:</span>
            <div class="table-responsive">
              <table class="erp-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Transaction Reference</th>
                    <th>Amount Reconciled</th>
                    <th>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of selectedInvoice.payments; trackBy: trackById">
                    <td><strong class="font-mono">{{ p.paymentId }}</strong></td>
                    <td>{{ p.paymentDate }}</td>
                    <td>{{ p.paymentMethod }}</td>
                    <td><span class="font-mono">{{ p.transactionReference }}</span></td>
                    <td><strong class="text-success">₹{{ p.amount.toLocaleString('en-IN') }}</strong></td>
                    <td>{{ p.recordedBy }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div modal-footer>
          <button type="button" class="btn btn-secondary" (click)="showViewModal = false">Close</button>
          <button type="button" class="btn btn-primary" (click)="printInvoice()">
            <app-icon name="printer" [size]="16"></app-icon>
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </app-modal>

      <!-- Record Payment Modal -->
      <app-modal
        [isOpen]="showPaymentModal"
        [title]="selectedInvoice ? 'Record Payment for ' + selectedInvoice.invoiceNumber : 'Record Payment'"
        [subtitle]="'Customer: ' + selectedInvoice?.customerName + ' (Outstanding: ₹' + (selectedInvoice?.outstandingAmount?.toLocaleString('en-IN') || 0) + ')'"
        size="md"
        (closed)="showPaymentModal = false"
      >
        <form [formGroup]="paymentForm" (ngSubmit)="submitPayment()">
          <div class="form-group">
            <label class="form-label required">Payment Amount (₹)</label>
            <input type="number" formControlName="amount" class="form-control font-mono" min="1" [max]="selectedInvoice?.outstandingAmount || 0" />
            <span class="text-xs text-muted">Maximum allowed: ₹{{ selectedInvoice?.outstandingAmount?.toLocaleString('en-IN') }}</span>
          </div>

          <div class="grid-cols-2">
            <div class="form-group">
              <label class="form-label required">Payment Mode</label>
              <select formControlName="paymentMethod" class="form-select">
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="UPI">UPI Instant Payment</option>
                <option value="Cheque">Corporate Cheque</option>
                <option value="Cash">Cash Settlement</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Transaction Reference</label>
              <input type="text" formControlName="transactionReference" class="form-control" placeholder="e.g. UTR-HDFC-991203" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Payment Audit Notes</label>
            <input type="text" formControlName="notes" class="form-control" placeholder="Bank reconciliation confirmation..." />
          </div>

          <div modal-footer>
            <button type="button" class="btn btn-secondary" (click)="showPaymentModal = false">Cancel</button>
            <button type="submit" class="btn btn-success" [disabled]="paymentForm.invalid">
              <app-icon name="check" [size]="16"></app-icon>
              <span>Record Payment & Reconcile</span>
            </button>
          </div>
        </form>
      </app-modal>
    </div>
  `,
  styles: [`
    .invoices-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .inv-kpi-card {
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
    .font-mono { font-family: var(--erp-font-mono); }
    .text-xs { font-size: 0.75rem; }

    .actions-cell {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }
    .btn-xs {
      padding: 4px 10px;
      font-size: 0.75rem;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    /* Printable Tax Invoice Styles */
    .printable-invoice {
      background: #ffffff;
      color: #0f172a;
      padding: 24px;
      font-family: var(--erp-font-sans);
    }
    .inv-doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 1.3rem;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: -0.02em;
    }
    .brand-sub {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
    }
    .brand-address, .brand-gst {
      font-size: 0.785rem;
      color: #64748b;
      margin-top: 2px;
    }
    .invoice-badge-block {
      text-align: right;
    }
    .inv-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .inv-num {
      font-family: var(--erp-font-mono);
      font-size: 1.1rem;
      font-weight: 700;
      color: #2563eb;
      margin: 2px 0 6px;
    }
    .inv-doc-divider {
      height: 2px;
      background: #e2e8f0;
      margin-bottom: 20px;
    }
    .inv-info-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
      font-size: 0.875rem;
    }
    .col-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      display: block;
      margin-bottom: 4px;
    }
    .cust-name {
      font-size: 1.05rem;
      color: #0f172a;
    }
    .cust-addr, .cust-email {
      color: #475569;
      margin-top: 2px;
    }
    .meta-line {
      margin-bottom: 4px;
    }
    .meta-line .lbl {
      color: #64748b;
      margin-right: 8px;
    }
    .inv-items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 0.875rem;
    }
    .inv-items-table th {
      background: #f8fafc;
      border-top: 1px solid #cbd5e1;
      border-bottom: 2px solid #94a3b8;
      padding: 10px 12px;
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 700;
      color: #475569;
    }
    .inv-items-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .inv-calculation-section {
      display: flex;
      justify-content: space-between;
      gap: 30px;
      margin-bottom: 24px;
    }
    .banking-instructions {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
      font-size: 0.825rem;
      color: #334155;
    }
    .bank-title {
      font-weight: 700;
      font-size: 0.85rem;
      color: #0f172a;
      display: block;
      margin-bottom: 6px;
    }
    .inv-terms-note {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 8px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 6px;
    }
    .calc-totals-block {
      width: 320px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.9rem;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
    }
    .calc-grand-total {
      border-top: 2px solid #0f172a;
      padding-top: 6px;
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
    }
    .calc-paid {
      font-weight: 600;
    }
    .calc-balance {
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      font-size: 1.1rem;
      font-weight: 700;
    }
    .payments-history-block {
      margin-top: 20px;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
    }
    .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  `]
})
export class InvoiceListComponent {
  invoiceService = inject(InvoiceService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  Math = Math;

  searchQuery = signal('');
  selectedStatus = signal('All');

  currentPage = signal(1);
  pageSize = 8;

  showViewModal = false;
  showPaymentModal = false;
  selectedInvoice: Invoice | null = null;

  errorMessage = '';
  successMessage = '';

  paymentForm: FormGroup;

  get canManagePayments(): boolean {
    return this.auth.hasRole(['Admin', 'Finance Manager']);
  }

  filteredInvoices = computed(() => {
    let list = this.invoiceService.invoices();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.selectedStatus();

    if (query) {
      list = list.filter(i =>
        i.invoiceNumber.toLowerCase().includes(query) ||
        i.customerName.toLowerCase().includes(query) ||
        i.salesOrderNumber.toLowerCase().includes(query)
      );
    }

    if (status !== 'All') {
      list = list.filter(i => i.paymentStatus === status);
    }
    return list;
  });

  pagedInvoices = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredInvoices().slice(start, start + this.pageSize);
  });

  trackById(index: number, item: any): string {
    return item?.id || item?.invoiceNumber || item?.paymentId || index.toString();
  }

  constructor() {
    this.paymentForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      paymentMethod: ['Bank Transfer', Validators.required],
      transactionReference: ['', Validators.required],
      notes: ['']
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

  viewInvoice(inv: Invoice): void {
    this.selectedInvoice = inv;
    this.showViewModal = true;
  }

  openPaymentModal(inv: Invoice): void {
    this.selectedInvoice = inv;
    this.errorMessage = '';
    this.successMessage = '';

    this.paymentForm.reset({
      amount: inv.outstandingAmount,
      paymentMethod: 'Bank Transfer',
      transactionReference: `TXN-HDFC-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: 'Cleared via corporate net banking.'
    });
    this.showPaymentModal = true;
  }

  submitPayment(): void {
    if (this.paymentForm.invalid || !this.selectedInvoice) return;

    this.errorMessage = '';
    this.successMessage = '';
    const val = this.paymentForm.value;

    const res = this.invoiceService.recordPayment(
      this.selectedInvoice.id,
      Number(val.amount),
      val.paymentMethod,
      val.transactionReference,
      this.auth.currentUser()?.name || 'Finance Controller',
      val.notes
    );

    if (res.success) {
      this.successMessage = res.message;
      this.showPaymentModal = false;
      this.selectedInvoice = this.invoiceService.getInvoiceById(this.selectedInvoice.id) || null;
    } else {
      this.errorMessage = res.message;
    }
  }

  printInvoice(): void {
    window.print();
  }
}

