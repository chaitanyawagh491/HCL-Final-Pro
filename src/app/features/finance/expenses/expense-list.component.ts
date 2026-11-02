import { Component, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpenseService } from '../../../core/services/expense.service';
import { AuthService } from '../../../core/services/auth.service';
import { Expense, ExpenseCategory } from '../../../core/models/erp.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconComponent,
    BadgeComponent,
    ModalComponent,
    ConfirmDialogComponent,
    PaginationComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="expenses-page">
      <div class="erp-card-header">
        <div>
          <h2 class="erp-card-title">Corporate Operating Expenses</h2>
          <p class="erp-card-subtitle">Manage facility leases, software tooling, utilities, and corporate administrative overheads</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openAddModal()" *ngIf="canManage">
          <app-icon name="plus" [size]="16"></app-icon>
          <span>Record New Expense</span>
        </button>
      </div>

      <!-- Quick Summary Cards -->
      <div class="grid-cols-3">
        <div class="kpi-card">
          <span class="kpi-lbl">Total Paid Overheads</span>
          <span class="kpi-val text-danger">₹{{ Math.round(expenseService.totalExpensesAmount()).toLocaleString('en-IN') }}</span>
          <span class="kpi-sub">Reconciled disbursements</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-lbl">Pending Approvals</span>
          <span class="kpi-val text-warning">₹{{ Math.round(expenseService.pendingExpensesAmount()).toLocaleString('en-IN') }}</span>
          <span class="kpi-sub">Awaiting payment settlement</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-lbl">Expense Vouchers</span>
          <span class="kpi-val">{{ expenseService.expenses().length }} Records</span>
          <span class="kpi-sub">Across 8 operational cost centers</span>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar-container">
        <div class="search-box">
          <app-icon name="search" [size]="16"></app-icon>
          <input
            type="text"
            class="form-control"
            placeholder="Search by title, voucher ID, description..."
            [value]="searchQuery()"
            (input)="onSearch($event)"
          />
        </div>

        <div class="filter-bar">
          <select class="form-select" (change)="onCategoryFilter($event)">
            <option value="All">All Categories</option>
            <option *ngFor="let cat of categories; trackBy: trackByFn" [value]="cat">{{ cat }}</option>
          </select>

          <select class="form-select" (change)="onStatusFilter($event)">
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      <!-- Expenses Table -->
      <div class="erp-card table-card">
        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Voucher ID</th>
                <th>Expense Title & Scope</th>
                <th>Category</th>
                <th>Date</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th class="text-right" *ngIf="canManage">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let exp of pagedExpenses(); trackBy: trackById">
                <td><strong class="font-mono">{{ exp.expenseId }}</strong></td>
                <td>
                  <strong>{{ exp.title }}</strong>
                  <div class="text-xs text-muted">{{ exp.description }}</div>
                </td>
                <td><span class="cat-pill">{{ exp.category }}</span></td>
                <td>{{ exp.expenseDate }}</td>
                <td>{{ exp.paymentMethod }}</td>
                <td><strong>₹{{ exp.amount.toLocaleString('en-IN') }}</strong></td>
                <td><app-badge [text]="exp.status"></app-badge></td>
                <td class="text-right" *ngIf="canManage">
                  <div class="actions-cell">
                    <button type="button" class="btn-action edit" (click)="openEditModal(exp)" title="Edit">
                      <app-icon name="edit" [size]="15"></app-icon>
                    </button>
                    <button type="button" class="btn-action delete" (click)="confirmDelete(exp)" title="Delete">
                      <app-icon name="trash" [size]="15"></app-icon>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <app-empty-state
          *ngIf="filteredExpenses().length === 0"
          icon="credit-card"
          title="No expense records found"
          description="Adjust your search query or category filters."
          actionLabel="Record Expense"
          (actionClicked)="openAddModal()"
        ></app-empty-state>

        <app-pagination
          [totalItems]="filteredExpenses().length"
          [pageSize]="pageSize"
          [currentPage]="currentPage()"
          (pageChanged)="currentPage.set($event)"
        ></app-pagination>
      </div>

      <!-- Add/Edit Expense Modal -->
      <app-modal
        [isOpen]="showModal"
        [title]="editingExpenseId ? 'Edit Expense Record' : 'Record Operating Expense'"
        subtitle="Log operational overheads for auditing and profit/loss calculation."
        size="md"
        (closed)="closeModal()"
      >
        <form [formGroup]="expenseForm" (ngSubmit)="saveExpense()">
          <div class="form-group">
            <label class="form-label required">Expense Title</label>
            <input type="text" formControlName="title" class="form-control" placeholder="e.g. AWS Cloud Infrastructure Hosting" />
          </div>

          <div class="grid-cols-2">
            <div class="form-group">
              <label class="form-label required">Cost Center Category</label>
              <select formControlName="category" class="form-select">
                <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Disbursement Amount (₹)</label>
              <input type="number" formControlName="amount" class="form-control" min="1" />
            </div>
          </div>

          <div class="grid-cols-3">
            <div class="form-group">
              <label class="form-label required">Expense Date</label>
              <input type="date" formControlName="expenseDate" class="form-control" />
            </div>

            <div class="form-group">
              <label class="form-label required">Payment Mode</label>
              <select formControlName="paymentMethod" class="form-select">
                <option value="Corporate Card">Corporate Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Status</label>
              <select formControlName="status" class="form-select">
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Detailed Description / Vendor Reference</label>
            <textarea formControlName="description" class="form-control" rows="2" placeholder="Invoice reference, vendor name, purpose"></textarea>
          </div>

          <div modal-footer>
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="expenseForm.invalid">
              <app-icon name="check" [size]="16"></app-icon>
              <span>{{ editingExpenseId ? 'Update Expense' : 'Save Expense Record' }}</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- Delete Confirmation -->
      <app-confirm-dialog
        [isOpen]="showDeleteConfirm"
        title="Confirm Expense Deletion"
        [message]="'Are you sure you want to delete expense record ' + (selectedExpense?.expenseId || '') + ' (' + (selectedExpense?.title || '') + ')?'"
        confirmText="Delete Record"
        variant="danger"
        (confirmed)="deleteConfirmed()"
        (cancelled)="showDeleteConfirm = false"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .expenses-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .kpi-card {
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
    }
    .kpi-sub {
      font-size: 0.775rem;
      color: var(--erp-text-muted);
      margin-top: 4px;
    }
    .text-danger { color: #dc2626 !important; }
    .text-warning { color: #d97706 !important; }
    .font-mono { font-family: var(--erp-font-mono); }
    .text-xs { font-size: 0.775rem; }
    .cat-pill {
      font-size: 0.775rem;
      background: var(--erp-bg-subtle);
      padding: 3px 8px;
      border-radius: 6px;
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
    .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid-cols-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    @media (max-width: 600px) {
      .grid-cols-2, .grid-cols-3 { grid-template-columns: 1fr; }
    }
  `]
})
export class ExpenseListComponent {
  expenseService = inject(ExpenseService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  Math = Math;

  categories: ExpenseCategory[] = [
    'Office Supplies',
    'Utilities',
    'Rent & Lease',
    'Salaries',
    'Marketing',
    'Travel & Logistics',
    'Software Licenses',
    'Maintenance'
  ];

  searchQuery = signal('');
  selectedCategory = signal('All');
  selectedStatus = signal('All');

  currentPage = signal(1);
  pageSize = 8;

  showModal = false;
  editingExpenseId: string | null = null;
  showDeleteConfirm = false;
  selectedExpense: Expense | null = null;

  expenseForm: FormGroup;

  get canManage(): boolean {
    return this.auth.hasRole(['Admin', 'Finance Manager']);
  }

  filteredExpenses = computed(() => {
    let list = this.expenseService.expenses();
    const q = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();
    const status = this.selectedStatus();

    if (q) {
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.expenseId.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }

    if (cat !== 'All') {
      list = list.filter(e => e.category === cat);
    }

    if (status !== 'All') {
      list = list.filter(e => e.status === status);
    }
    return list;
  });

  pagedExpenses = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredExpenses().slice(start, start + this.pageSize);
  });

  trackById(index: number, exp: any): string {
    return exp?.id || exp?.expenseId || index.toString();
  }

  trackByFn(index: number, item: any): any {
    return item || index;
  }

  constructor() {
    const today = new Date().toISOString().split('T')[0];
    this.expenseForm = this.fb.group({
      title: ['', Validators.required],
      category: ['Software Licenses', Validators.required],
      amount: [25000, [Validators.required, Validators.min(1)]],
      expenseDate: [today, Validators.required],
      paymentMethod: ['Corporate Card', Validators.required],
      status: ['Paid', Validators.required],
      description: ['']
    });
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onCategoryFilter(event: Event): void {
    this.selectedCategory.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  onStatusFilter(event: Event): void {
    this.selectedStatus.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  openAddModal(): void {
    this.editingExpenseId = null;
    const today = new Date().toISOString().split('T')[0];
    this.expenseForm.reset({
      title: '',
      category: 'Software Licenses',
      amount: 25000,
      expenseDate: today,
      paymentMethod: 'Corporate Card',
      status: 'Paid',
      description: ''
    });
    this.showModal = true;
  }

  openEditModal(exp: Expense): void {
    this.editingExpenseId = exp.id;
    this.expenseForm.patchValue({
      title: exp.title,
      category: exp.category,
      amount: exp.amount,
      expenseDate: exp.expenseDate,
      paymentMethod: exp.paymentMethod,
      status: exp.status,
      description: exp.description
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingExpenseId = null;
  }

  saveExpense(): void {
    if (this.expenseForm.invalid) return;

    const val = this.expenseForm.value;

    if (this.editingExpenseId) {
      this.expenseService.updateExpense(this.editingExpenseId, {
        title: val.title,
        category: val.category,
        amount: Number(val.amount),
        expenseDate: val.expenseDate,
        paymentMethod: val.paymentMethod,
        status: val.status,
        description: val.description
      });
    } else {
      this.expenseService.addExpense({
        title: val.title,
        category: val.category,
        amount: Number(val.amount),
        expenseDate: val.expenseDate,
        paymentMethod: val.paymentMethod,
        status: val.status,
        description: val.description
      });
    }

    this.closeModal();
  }

  confirmDelete(exp: Expense): void {
    this.selectedExpense = exp;
    this.showDeleteConfirm = true;
  }

  deleteConfirmed(): void {
    if (this.selectedExpense) {
      this.expenseService.deleteExpense(this.selectedExpense.id);
      this.showDeleteConfirm = false;
      this.selectedExpense = null;
    }
  }
}

