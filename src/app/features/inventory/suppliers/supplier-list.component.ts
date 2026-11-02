import { Component, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupplierService } from '../../../core/services/supplier.service';
import { ProcurementService } from '../../../core/services/procurement.service';
import { AuthService } from '../../../core/services/auth.service';
import { Supplier, PurchaseOrder } from '../../../core/models/erp.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, BadgeComponent, ModalComponent, ConfirmDialogComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="suppliers-page">
      <!-- Page Header -->
      <div class="erp-card-header">
        <div>
          <h2 class="erp-card-title">Vendors & Supplier Management</h2>
          <p class="erp-card-subtitle">Maintain vendor credentials, tax registrations (GSTIN), and procurement histories</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openAddModal()" *ngIf="canManage">
          <app-icon name="plus" [size]="16"></app-icon>
          <span>Add New Supplier</span>
        </button>
      </div>

      <!-- Toolbar -->
      <div class="toolbar-container">
        <div class="search-box">
          <app-icon name="search" [size]="16"></app-icon>
          <input
            type="text"
            class="form-control"
            placeholder="Search suppliers by name, company, GST, email..."
            [value]="searchQuery()"
            (input)="onSearch($event)"
          />
        </div>

        <div class="filter-bar">
          <select class="form-select" (change)="onStatusFilter($event)">
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <!-- Suppliers Grid -->
      <div class="grid-cols-2">
        <div class="erp-card supplier-card" *ngFor="let sup of filteredSuppliers(); trackBy: trackById">
          <div class="sup-card-header">
            <div>
              <span class="sup-id-badge">{{ sup.supplierId }}</span>
              <h3 class="sup-title">{{ sup.supplierName }}</h3>
              <p class="sup-legal-name">{{ sup.companyName }}</p>
            </div>
            <div class="sup-actions">
              <app-badge [text]="sup.status"></app-badge>
              <div class="btn-group" *ngIf="canManage">
                <button type="button" class="icon-btn-sm" (click)="openEditModal(sup)" title="Edit">
                  <app-icon name="edit" [size]="14"></app-icon>
                </button>
                <button type="button" class="icon-btn-sm text-danger" (click)="confirmDelete(sup)" title="Delete">
                  <app-icon name="trash" [size]="14"></app-icon>
                </button>
              </div>
            </div>
          </div>

          <div class="sup-info-box">
            <div class="info-row">
              <span class="info-lbl"><app-icon name="file-text" [size]="13"></app-icon> GST Number:</span>
              <span class="info-val font-mono">{{ sup.gstNumber }}</span>
            </div>
            <div class="info-row">
              <span class="info-lbl"><app-icon name="user" [size]="13"></app-icon> Contact Email:</span>
              <span class="info-val"><a [href]="'mailto:' + sup.email">{{ sup.email }}</a></span>
            </div>
            <div class="info-row">
              <span class="info-lbl"><app-icon name="credit-card" [size]="13"></app-icon> Phone:</span>
              <span class="info-val">{{ sup.phone }}</span>
            </div>
            <div class="info-row">
              <span class="info-lbl"><app-icon name="building" [size]="13"></app-icon> Dispatch Address:</span>
              <span class="info-val text-truncate">{{ sup.address }}</span>
            </div>
          </div>

          <div class="supplied-items-box">
            <span class="sub-lbl">Supplied Line Categories:</span>
            <div class="tags-row">
              <span class="tag-pill" *ngFor="let p of sup.suppliedProducts">{{ p }}</span>
            </div>
          </div>

          <div class="sup-card-footer">
            <button type="button" class="btn btn-secondary btn-sm w-100" (click)="viewPurchaseHistory(sup)">
              <app-icon name="shopping-cart" [size]="14"></app-icon>
              <span>View Purchase Order History</span>
            </button>
          </div>
        </div>
      </div>

      <app-empty-state
        *ngIf="filteredSuppliers().length === 0"
        icon="truck"
        title="No suppliers found"
        description="No vendor accounts match your filter criteria."
        actionLabel="Add Supplier"
        (actionClicked)="openAddModal()"
      ></app-empty-state>

      <!-- Add/Edit Modal -->
      <app-modal
        [isOpen]="showModal"
        [title]="editingSupplierId ? 'Edit Supplier Profile' : 'Register New Supplier'"
        subtitle="Ensure corporate GSTIN and contact details are accurate."
        size="md"
        (closed)="closeModal()"
      >
        <form [formGroup]="supplierForm" (ngSubmit)="saveSupplier()">
          <div class="form-group">
            <label class="form-label required">Supplier Brand Name</label>
            <input type="text" formControlName="supplierName" class="form-control" placeholder="e.g. Apex Microelectronics Ltd" />
          </div>

          <div class="form-group">
            <label class="form-label required">Registered Legal Company Name</label>
            <input type="text" formControlName="companyName" class="form-control" placeholder="e.g. Apex Microelectronics India Pvt Ltd" />
          </div>

          <div class="grid-cols-2">
            <div class="form-group">
              <label class="form-label required">Official Email</label>
              <input type="email" formControlName="email" class="form-control" placeholder="sales@vendor.com" />
            </div>

            <div class="form-group">
              <label class="form-label required">Phone Contact</label>
              <input type="text" formControlName="phone" class="form-control" placeholder="+91 ..." />
            </div>
          </div>

          <div class="grid-cols-2">
            <div class="form-group">
              <label class="form-label required">GST Registration Number</label>
              <input type="text" formControlName="gstNumber" class="form-control" placeholder="29AAACA1234B1Z5" />
            </div>

            <div class="form-group">
              <label class="form-label required">Status</label>
              <select formControlName="status" class="form-select">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required">Factory / Office Address</label>
            <textarea formControlName="address" class="form-control" rows="2" placeholder="Industrial area, city, pincode"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Supplied Products (Comma separated)</label>
            <input type="text" formControlName="suppliedProductsStr" class="form-control" placeholder="e.g. Processors, RAM, Motherboards" />
          </div>

          <div modal-footer>
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="supplierForm.invalid">
              <app-icon name="check" [size]="16"></app-icon>
              <span>{{ editingSupplierId ? 'Save Changes' : 'Create Supplier' }}</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- Purchase History Modal -->
      <app-modal
        [isOpen]="showHistoryModal"
        [title]="selectedSupplier ? selectedSupplier.supplierName + ' — Procurement History' : 'Purchase Orders'"
        subtitle="All purchase requisitions and purchase orders placed with this vendor"
        size="lg"
        [showFooter]="false"
        (closed)="showHistoryModal = false"
      >
        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Order Date</th>
                <th>Expected Delivery</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let po of supplierPurchaseOrders">
                <td><strong>{{ po.poNumber }}</strong></td>
                <td>{{ po.orderDate }}</td>
                <td>{{ po.expectedDeliveryDate }}</td>
                <td><strong>₹{{ po.totalAmount.toLocaleString('en-IN') }}</strong></td>
                <td><app-badge [text]="po.status"></app-badge></td>
              </tr>
              <tr *ngIf="supplierPurchaseOrders.length === 0">
                <td colspan="5" class="text-center py-4">No purchase orders found for this supplier.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </app-modal>

      <!-- Delete Confirmation -->
      <app-confirm-dialog
        [isOpen]="showDeleteConfirm"
        title="Confirm Supplier Deletion"
        [message]="'Are you sure you want to delete supplier profile for ' + (supplierToDelete?.supplierName || '') + '?'"
        confirmText="Delete Supplier"
        variant="danger"
        (confirmed)="deleteConfirmed()"
        (cancelled)="showDeleteConfirm = false"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .suppliers-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .supplier-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }
    .sup-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
    }
    .sup-id-badge {
      font-family: var(--erp-font-mono);
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--erp-primary);
      background: var(--erp-primary-light);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .sup-title {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--erp-text-heading);
      margin: 4px 0 2px;
    }
    .sup-legal-name {
      font-size: 0.8rem;
      color: var(--erp-text-muted);
    }
    .sup-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-group {
      display: flex;
      gap: 4px;
    }
    .icon-btn-sm {
      background: none;
      border: 1px solid var(--erp-border);
      border-radius: 6px;
      padding: 4px;
      cursor: pointer;
      color: var(--erp-text-muted);
    }
    .icon-btn-sm:hover {
      background: var(--erp-bg-hover);
      color: var(--erp-text-heading);
    }
    .text-danger:hover {
      color: #dc2626 !important;
      background: #fee2e2 !important;
    }
    .sup-info-box {
      background: var(--erp-bg-subtle);
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.825rem;
      gap: 10px;
    }
    .info-lbl {
      color: var(--erp-text-muted);
      display: flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
    }
    .info-val {
      font-weight: 600;
      color: var(--erp-text-heading);
      text-align: right;
    }
    .font-mono {
      font-family: var(--erp-font-mono);
    }
    .text-truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 250px;
    }
    .supplied-items-box {
      margin-bottom: 16px;
    }
    .sub-lbl {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--erp-text-muted);
      display: block;
      margin-bottom: 6px;
    }
    .tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    .tag-pill {
      font-size: 0.725rem;
      background: var(--erp-bg-subtle);
      border: 1px solid var(--erp-border);
      color: var(--erp-text);
      padding: 2px 7px;
      border-radius: 4px;
    }
    .w-100 { width: 100%; }
    .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 600px) {
      .grid-cols-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class SupplierListComponent {
  supplierService = inject(SupplierService);
  procurementService = inject(ProcurementService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  searchQuery = signal('');
  selectedStatus = signal('All');

  showModal = false;
  editingSupplierId: string | null = null;
  showHistoryModal = false;
  selectedSupplier: Supplier | null = null;
  supplierPurchaseOrders: PurchaseOrder[] = [];

  showDeleteConfirm = false;
  supplierToDelete: Supplier | null = null;

  supplierForm: FormGroup;

  get canManage(): boolean {
    return this.auth.hasRole(['Admin', 'Inventory Manager']);
  }

  constructor() {
    this.supplierForm = this.fb.group({
      supplierName: ['', Validators.required],
      companyName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      gstNumber: ['', Validators.required],
      status: ['Active', Validators.required],
      address: ['', Validators.required],
      suppliedProductsStr: ['']
    });
  }

  filteredSuppliers = computed(() => {
    let list = this.supplierService.suppliers();
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();

    if (q) {
      list = list.filter(s =>
        s.supplierName.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q) ||
        s.supplierId.toLowerCase().includes(q) ||
        s.gstNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }

    if (status !== 'All') {
      list = list.filter(s => s.status === status);
    }
    return list;
  });

  trackById(index: number, sup: Supplier): string {
    return sup.id || sup.supplierId;
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onStatusFilter(event: Event): void {
    this.selectedStatus.set((event.target as HTMLSelectElement).value);
  }

  openAddModal(): void {
    this.editingSupplierId = null;
    this.supplierForm.reset({
      supplierName: '',
      companyName: '',
      email: '',
      phone: '+91 ',
      gstNumber: '29AAAC',
      status: 'Active',
      address: '',
      suppliedProductsStr: ''
    });
    this.showModal = true;
  }

  openEditModal(sup: Supplier): void {
    this.editingSupplierId = sup.id;
    this.supplierForm.patchValue({
      supplierName: sup.supplierName,
      companyName: sup.companyName,
      email: sup.email,
      phone: sup.phone,
      gstNumber: sup.gstNumber,
      status: sup.status,
      address: sup.address,
      suppliedProductsStr: (sup.suppliedProducts || []).join(', ')
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingSupplierId = null;
  }

  saveSupplier(): void {
    if (this.supplierForm.invalid) return;

    const val = this.supplierForm.value;
    const suppliedProducts = (val.suppliedProductsStr || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    if (this.editingSupplierId) {
      this.supplierService.updateSupplier(this.editingSupplierId, {
        supplierName: val.supplierName,
        companyName: val.companyName,
        email: val.email,
        phone: val.phone,
        gstNumber: val.gstNumber,
        status: val.status,
        address: val.address,
        suppliedProducts
      });
    } else {
      this.supplierService.addSupplier({
        supplierName: val.supplierName,
        companyName: val.companyName,
        email: val.email,
        phone: val.phone,
        gstNumber: val.gstNumber,
        status: val.status,
        address: val.address,
        suppliedProducts
      });
    }

    this.closeModal();
  }

  viewPurchaseHistory(sup: Supplier): void {
    this.selectedSupplier = sup;
    this.supplierPurchaseOrders = this.procurementService.purchaseOrders().filter(
      po => po.supplierId === sup.id || po.supplierName === sup.supplierName
    );
    this.showHistoryModal = true;
  }

  confirmDelete(sup: Supplier): void {
    this.supplierToDelete = sup;
    this.showDeleteConfirm = true;
  }

  deleteConfirmed(): void {
    if (this.supplierToDelete) {
      this.supplierService.deleteSupplier(this.supplierToDelete.id, false);
      this.showDeleteConfirm = false;
      this.supplierToDelete = null;
    }
  }
}

