import { Component, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProcurementService } from '../../../core/services/procurement.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { AuthService } from '../../../core/services/auth.service';
import { PurchaseOrder, PurchaseOrderStatus } from '../../../core/models/erp.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-procurement',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IconComponent, BadgeComponent, ModalComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="procurement-page">
      <!-- Page Header -->
      <div class="erp-card-header">
        <div>
          <h2 class="erp-card-title">Procurement & Purchase Orders</h2>
          <p class="erp-card-subtitle">Generate supplier requisitions, approve procurement spend, and receive physical inventory</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openCreateModal()" *ngIf="canManage">
          <app-icon name="plus" [size]="16"></app-icon>
          <span>Create Purchase Order</span>
        </button>
      </div>

      <!-- Feedback Alert -->
      <div class="alert-box alert-error" *ngIf="errorMessage">
        <app-icon name="alert-circle" [size]="18"></app-icon>
        <span>{{ errorMessage }}</span>
      </div>
      <div class="alert-box alert-success" *ngIf="successMessage">
        <app-icon name="check-circle" [size]="18"></app-icon>
        <span>{{ successMessage }}</span>
      </div>

      <!-- Toolbar -->
      <div class="toolbar-container">
        <div class="search-box">
          <app-icon name="search" [size]="16"></app-icon>
          <input
            type="text"
            class="form-control"
            placeholder="Search POs by number, supplier..."
            [value]="searchQuery()"
            (input)="onSearch($event)"
          />
        </div>

        <div class="filter-bar">
          <select class="form-select" (change)="onStatusFilter($event)">
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Ordered">Ordered</option>
            <option value="Partially Received">Partially Received</option>
            <option value="Received">Received</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="erp-card table-card">
        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Order Date</th>
                <th>Delivery Date</th>
                <th>Line Items</th>
                <th>Order Total (incl. GST)</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let po of filteredPOs(); trackBy: trackById">
                <td><strong class="font-mono">{{ po.poNumber }}</strong></td>
                <td>{{ po.supplierName }}</td>
                <td>{{ po.orderDate }}</td>
                <td>{{ po.expectedDeliveryDate }}</td>
                <td>{{ po.items.length }} product(s)</td>
                <td><strong>₹{{ po.totalAmount.toLocaleString('en-IN') }}</strong></td>
                <td><app-badge [text]="po.status"></app-badge></td>
                <td class="text-right">
                  <div class="actions-cell">
                    <button type="button" class="btn btn-secondary btn-xs" (click)="viewDetails(po)" title="View PO Details">
                      View
                    </button>

                    <!-- Approve button for Pending Approval -->
                    <button
                      type="button"
                      class="btn btn-success btn-xs"
                      *ngIf="po.status === 'Pending Approval' && canManage"
                      (click)="approvePO(po)"
                    >
                      Approve
                    </button>

                    <!-- Receive Goods button for Approved / Ordered / Partially Received -->
                    <button
                      type="button"
                      class="btn btn-primary btn-xs"
                      *ngIf="(po.status === 'Ordered' || po.status === 'Approved' || po.status === 'Partially Received') && canManage"
                      (click)="openReceiveModal(po)"
                    >
                      Receive Stock
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <app-empty-state
          *ngIf="filteredPOs().length === 0"
          icon="shopping-cart"
          title="No purchase orders found"
          description="There are no procurement purchase orders matching your search or filter."
          actionLabel="Create Purchase Order"
          (actionClicked)="openCreateModal()"
        ></app-empty-state>
      </div>

      <!-- Create PO Modal -->
      <app-modal
        [isOpen]="showCreateModal"
        title="Create Purchase Order Requisition"
        subtitle="Select vendor and configure line items. System automatically computes subtotal and 18% GST."
        size="lg"
        (closed)="showCreateModal = false"
      >
        <form [formGroup]="poForm" (ngSubmit)="submitPO()">
          <div class="grid-cols-2">
            <div class="form-group">
              <label class="form-label required">Select Supplier</label>
              <select formControlName="supplierId" class="form-select">
                <option *ngFor="let s of supplierService.suppliers()" [value]="s.id">
                  {{ s.supplierName }} ({{ s.companyName }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Expected Delivery Date</label>
              <input type="date" formControlName="expectedDeliveryDate" class="form-control" />
            </div>
          </div>

          <!-- Dynamic Line Items Section -->
          <div class="line-items-section">
            <div class="section-title-row">
              <span class="items-title">Product Line Items</span>
              <button type="button" class="btn btn-outline-primary btn-xs" (click)="addLineItem()">
                <app-icon name="plus" [size]="14"></app-icon> Add Line Item
              </button>
            </div>

            <div formArrayName="items" class="items-list">
              <div *ngFor="let item of itemsFormArray.controls; let i = index" [formGroupName]="i" class="item-row">
                <div class="form-group prod-select-group">
                  <label class="form-label">Product</label>
                  <select formControlName="productId" class="form-select" (change)="onProductSelected(i)">
                    <option *ngFor="let p of inventoryService.products()" [value]="p.id">
                      {{ p.name }} (Cost: ₹{{ p.purchasePrice }})
                    </option>
                  </select>
                </div>

                <div class="form-group qty-group">
                  <label class="form-label">Quantity</label>
                  <input type="number" formControlName="quantity" class="form-control" min="1" (input)="recalculateTotals()" />
                </div>

                <div class="form-group price-group">
                  <label class="form-label">Unit Price (₹)</label>
                  <input type="number" formControlName="unitPrice" class="form-control" min="1" (input)="recalculateTotals()" />
                </div>

                <div class="form-group remove-group" *ngIf="itemsFormArray.length > 1">
                  <label class="form-label">&nbsp;</label>
                  <button type="button" class="btn-remove-line" (click)="removeLineItem(i)" title="Remove line item">
                    <app-icon name="trash" [size]="16"></app-icon>
                  </button>
                </div>
              </div>
            </div>

            <!-- Totals Calculation Summary -->
            <div class="totals-summary-box">
              <div class="tot-row">
                <span>Subtotal:</span>
                <strong>₹{{ calculatedSubtotal.toLocaleString('en-IN') }}</strong>
              </div>
              <div class="tot-row">
                <span>GST (18%):</span>
                <strong>₹{{ calculatedTax.toLocaleString('en-IN') }}</strong>
              </div>
              <div class="tot-row grand-total">
                <span>Total PO Value:</span>
                <strong class="text-primary">₹{{ calculatedTotal.toLocaleString('en-IN') }}</strong>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Procurement Remarks / Notes</label>
            <input type="text" formControlName="notes" class="form-control" placeholder="Delivery instructions, freight terms, etc." />
          </div>

          <div modal-footer>
            <button type="button" class="btn btn-secondary" (click)="showCreateModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="poForm.invalid || itemsFormArray.length === 0">
              <app-icon name="check" [size]="16"></app-icon>
              <span>Submit Purchase Order</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- View PO Details Modal -->
      <app-modal
        [isOpen]="showDetailsModal"
        [title]="selectedPO ? 'Purchase Order: ' + selectedPO.poNumber : 'PO Details'"
        subtitle="Detailed order breakdown and line item fulfillment status"
        size="lg"
        [showFooter]="false"
        (closed)="showDetailsModal = false"
      >
        <div class="po-details-view" *ngIf="selectedPO">
          <div class="grid-cols-3 po-meta-bar">
            <div>
              <span class="meta-label">Supplier:</span>
              <strong>{{ selectedPO.supplierName }}</strong>
            </div>
            <div>
              <span class="meta-label">Order Date:</span>
              <span>{{ selectedPO.orderDate }}</span>
            </div>
            <div>
              <span class="meta-label">Status:</span>
              <app-badge [text]="selectedPO.status"></app-badge>
            </div>
          </div>

          <div class="table-responsive mt-3">
            <table class="erp-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Ordered Qty</th>
                  <th>Received Qty</th>
                  <th>Outstanding</th>
                  <th>Unit Cost</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of selectedPO.items">
                  <td><strong>{{ item.productName }}</strong></td>
                  <td><span class="sku-tag">{{ item.sku }}</span></td>
                  <td>{{ item.quantity }}</td>
                  <td><strong class="text-success">{{ item.receivedQuantity }}</strong></td>
                  <td><strong class="text-danger">{{ item.quantity - item.receivedQuantity }}</strong></td>
                  <td>₹{{ item.unitPrice.toLocaleString('en-IN') }}</td>
                  <td><strong>₹{{ item.total.toLocaleString('en-IN') }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="po-footer-totals">
            <div>Subtotal: ₹{{ selectedPO.subtotal.toLocaleString('en-IN') }}</div>
            <div>Tax (18% GST): ₹{{ selectedPO.taxAmount.toLocaleString('en-IN') }}</div>
            <div class="grand-total">Total Amount: <strong>₹{{ selectedPO.totalAmount.toLocaleString('en-IN') }}</strong></div>
          </div>
        </div>
      </app-modal>

      <!-- Receive Goods Modal -->
      <app-modal
        [isOpen]="showReceiveModal"
        [title]="selectedPO ? 'Receive Stock for ' + selectedPO.poNumber : 'Receive Stock'"
        subtitle="Specify items arrived at the warehouse. Available inventory quantities will be automatically updated."
        size="md"
        (closed)="showReceiveModal = false"
      >
        <div class="receive-form" *ngIf="selectedPO">
          <p class="receive-prompt">Enter incoming received quantities (cannot exceed outstanding balance):</p>

          <div class="receive-item-row" *ngFor="let item of selectedPO.items">
            <div class="item-info">
              <strong>{{ item.productName }}</strong>
              <div class="text-muted text-xs">
                Ordered: {{ item.quantity }} &bull; Already received: {{ item.receivedQuantity }} &bull;
                Outstanding: <strong>{{ item.quantity - item.receivedQuantity }}</strong>
              </div>
            </div>
            <div class="input-qty-wrap">
              <label class="text-xs">Receive Now:</label>
              <input
                type="number"
                class="form-control qty-input"
                min="0"
                [max]="item.quantity - item.receivedQuantity"
                [(ngModel)]="receiveInput[item.productId]"
              />
            </div>
          </div>
        </div>

        <div modal-footer>
          <button type="button" class="btn btn-secondary" (click)="showReceiveModal = false">Cancel</button>
          <button type="button" class="btn btn-success" (click)="confirmReceiveGoods()">
            <app-icon name="check" [size]="16"></app-icon>
            <span>Confirm & Update Inventory</span>
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .procurement-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .alert-box {
      padding: 10px 14px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.85rem;
    }
    .alert-error { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; }
    .alert-success { background: #dcfce7; border: 1px solid #86efac; color: #166534; }

    .actions-cell {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }
    .btn-xs {
      padding: 4px 10px;
      font-size: 0.75rem;
      border-radius: 6px;
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
    .text-primary { color: #2563eb !important; }
    .text-success { color: #16a34a !important; }
    .text-danger { color: #dc2626 !important; }
    .text-xs { font-size: 0.75rem; }

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
    .receive-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid var(--erp-border);
    }
    .qty-input {
      width: 90px;
      text-align: center;
    }
    .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .text-right { text-align: right; }
    .sku-tag {
      font-family: var(--erp-font-mono);
      font-size: 0.775rem;
      background: var(--erp-bg-subtle);
      padding: 2px 6px;
      border-radius: 4px;
    }
  `]
})
export class ProcurementComponent {
  procurementService = inject(ProcurementService);
  supplierService = inject(SupplierService);
  inventoryService = inject(InventoryService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  searchQuery = signal('');
  selectedStatus = signal('All');

  showCreateModal = false;
  showDetailsModal = false;
  showReceiveModal = false;
  selectedPO: PurchaseOrder | null = null;

  receiveInput: { [productId: string]: number } = {};

  calculatedSubtotal = 0;
  calculatedTax = 0;
  calculatedTotal = 0;

  errorMessage = '';
  successMessage = '';

  poForm: FormGroup;

  get canManage(): boolean {
    return this.auth.hasRole(['Admin', 'Inventory Manager']);
  }

  get itemsFormArray(): FormArray {
    return this.poForm.get('items') as FormArray;
  }

  constructor() {
    const today = new Date().toISOString().split('T')[0];
    const defaultSup = this.supplierService.suppliers()[0]?.id || '';

    this.poForm = this.fb.group({
      supplierId: [defaultSup, Validators.required],
      expectedDeliveryDate: [today, Validators.required],
      notes: [''],
      items: this.fb.array([])
    });
  }

  filteredPOs = computed(() => {
    let list = this.procurementService.purchaseOrders();
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();

    if (q) {
      list = list.filter(p =>
        p.poNumber.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q)
      );
    }

    if (status !== 'All') {
      list = list.filter(p => p.status === status);
    }
    return list;
  });

  trackById(index: number, po: PurchaseOrder): string {
    return po.id || po.poNumber;
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onStatusFilter(event: Event): void {
    this.selectedStatus.set((event.target as HTMLSelectElement).value);
  }

  openCreateModal(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.itemsFormArray.clear();

    const firstProd = this.inventoryService.products()[0];
    this.itemsFormArray.push(this.createItemGroup(firstProd?.id || '', 10, firstProd?.purchasePrice || 5000));
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
    this.itemsFormArray.push(this.createItemGroup(firstProd?.id || '', 5, firstProd?.purchasePrice || 5000));
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
      itemGroup.patchValue({ unitPrice: prod.purchasePrice });
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

    this.calculatedSubtotal = sub;
    this.calculatedTax = (sub * 18) / 100;
    this.calculatedTotal = this.calculatedSubtotal + this.calculatedTax;
  }

  submitPO(): void {
    if (this.poForm.invalid || this.itemsFormArray.length === 0) return;

    this.errorMessage = '';
    this.successMessage = '';
    const val = this.poForm.value;
    const supplier = this.supplierService.getSupplierById(val.supplierId);

    const res = this.procurementService.createPurchaseOrder({
      supplierId: val.supplierId,
      supplierName: supplier?.supplierName || 'Vendor',
      expectedDeliveryDate: val.expectedDeliveryDate,
      items: val.items,
      taxRate: 18,
      createdBy: this.auth.currentUser()?.name || 'Inventory Manager',
      notes: val.notes,
      status: 'Ordered'
    });

    if (res.success) {
      this.successMessage = res.message;
      this.showCreateModal = false;
    } else {
      this.errorMessage = res.message;
    }
  }

  viewDetails(po: PurchaseOrder): void {
    this.selectedPO = po;
    this.showDetailsModal = true;
  }

  approvePO(po: PurchaseOrder): void {
    const actor = this.auth.currentUser()?.name || 'Alexander Wright';
    this.procurementService.updatePOStatus(po.id, 'Approved', actor);
    this.successMessage = `Purchase order ${po.poNumber} has been approved.`;
  }

  openReceiveModal(po: PurchaseOrder): void {
    this.selectedPO = po;
    this.receiveInput = {};
    po.items.forEach(item => {
      const outstanding = item.quantity - item.receivedQuantity;
      this.receiveInput[item.productId] = outstanding; // default to receive remaining
    });
    this.showReceiveModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  confirmReceiveGoods(): void {
    if (!this.selectedPO) return;

    const res = this.procurementService.receiveGoods(
      this.selectedPO.id,
      this.receiveInput,
      this.auth.currentUser()?.name || 'Inventory Team'
    );

    if (res.success) {
      this.successMessage = res.message;
      this.showReceiveModal = false;
      this.selectedPO = null;
    } else {
      this.errorMessage = res.message;
    }
  }
}
