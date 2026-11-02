import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { DepartmentService } from '../../../core/services/department.service';
import { LeaveService } from '../../../core/services/leave.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ProcurementService } from '../../../core/services/procurement.service';
import { SalesService } from '../../../core/services/sales.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { NotificationService } from '../../../core/services/notification.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { User, UserRole } from '../../../core/models/erp.model';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, ConfirmDialogComponent],
  template: `
    <div class="settings-page">
      <!-- Page Header -->
      <div class="erp-card-header">
        <div>
          <h2 class="erp-card-title">System Settings & Role Management</h2>
          <p class="erp-card-subtitle">Manage organization configuration, demo security roles, database health, and LocalStorage records</p>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" (click)="showResetModal = true">
          <app-icon name="refresh-cw" [size]="15"></app-icon>
          <span>Reset All Demo Data</span>
        </button>
      </div>

      <!-- Quick Stats Banner -->
      <div class="grid-cols-4">
        <div class="setting-kpi">
          <span class="kpi-label">Active Users & Roles</span>
          <span class="kpi-val text-primary">{{ auth.getUsers().length }} Accounts</span>
          <span class="kpi-sub">Role-Based Access Control</span>
        </div>
        <div class="setting-kpi">
          <span class="kpi-label">Active Master Role</span>
          <span class="kpi-val text-success">{{ auth.currentUser()?.role }}</span>
          <span class="kpi-sub">{{ auth.currentUser()?.name }}</span>
        </div>
        <div class="setting-kpi">
          <span class="kpi-label">LocalStorage Size</span>
          <span class="kpi-val text-warning">{{ approximateStorageSize }} KB</span>
          <span class="kpi-sub">Browser Persisted Storage</span>
        </div>
        <div class="setting-kpi">
          <span class="kpi-label">ERP Modules Active</span>
          <span class="kpi-val text-indigo">4 / 4 Integrated</span>
          <span class="kpi-sub">HR, Supply, Sales, Finance</span>
        </div>
      </div>

      <!-- Section 1: Security & Demo Roles Matrix -->
      <div class="erp-card">
        <div class="erp-card-header">
          <div>
            <h4 class="erp-card-title">Enterprise Demo User Accounts & Access Matrix</h4>
            <p class="erp-card-subtitle">Switch instantly between roles or inspect authorization permissions</p>
          </div>
        </div>

        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>User / Avatar</th>
                <th>Role Designation</th>
                <th>Login Email</th>
                <th>Demo Password</th>
                <th>Department</th>
                <th>Access Scope</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of auth.getUsers()" [class.active-user-row]="u.role === auth.currentRole()">
                <td>
                  <div class="user-cell">
                    <img [src]="u.avatar || defaultAvatar" (error)="onAvatarError($event)" alt="Avatar" class="avatar-thumb" />
                    <div>
                      <div class="user-fullname">{{ u.name }}</div>
                      <div class="user-id-sub">{{ u.employeeId }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <strong>{{ u.role }}</strong>
                  <div class="text-muted text-xs">{{ u.designation || 'Staff' }}</div>
                </td>
                <td><code class="code-pill">{{ u.email }}</code></td>
                <td><code class="code-pill">{{ u.password || '******' }}</code></td>
                <td>{{ u.department }}</td>
                <td>
                  <span class="badge" [ngClass]="u.role === 'Admin' ? 'badge-success' : 'badge-info'">
                    {{ u.role === 'Admin' ? 'Full Access (All 4 Modules)' : u.role }}
                  </span>
                </td>
                <td class="text-right">
                  <button
                    type="button"
                    class="btn btn-xs"
                    [ngClass]="u.role === auth.currentRole() ? 'btn-primary' : 'btn-secondary'"
                    (click)="switchToRole(u.role)"
                  >
                    {{ u.role === auth.currentRole() ? 'Active Session' : 'Switch to Role' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section 2: Organization Profile & System Configuration -->
      <div class="grid-cols-2">
        <div class="erp-card">
          <div class="erp-card-header">
            <div>
              <h4 class="erp-card-title">Corporate Organization Profile</h4>
              <p class="erp-card-subtitle">Global company identifiers and financial calendar</p>
            </div>
          </div>
          <div class="info-list">
            <div class="info-row">
              <span class="info-lbl">Organization Name:</span>
              <span class="info-val font-bold">HCL Enterprise Solutions Ltd.</span>
            </div>
            <div class="info-row">
              <span class="info-lbl">GSTIN / Tax ID:</span>
              <span class="info-val font-mono">27AABCH1234F1Z8</span>
            </div>
            <div class="info-row">
              <span class="info-lbl">Default Base Currency:</span>
              <span class="info-val font-bold">INR (₹) — Indian Rupee</span>
            </div>
            <div class="info-row">
              <span class="info-lbl">Current Fiscal Year:</span>
              <span class="info-val">FY 2026 – 2027</span>
            </div>
            <div class="info-row">
              <span class="info-lbl">Standard GST Tax Rate:</span>
              <span class="info-val font-bold">18% (Applicable across POs & Sales)</span>
            </div>
            <div class="info-row">
              <span class="info-lbl">Default Warehouse:</span>
              <span class="info-val">Central Hub - Pune (WH-A1)</span>
            </div>
          </div>
        </div>

        <!-- Section 3: Database & LocalStorage Audit -->
        <div class="erp-card">
          <div class="erp-card-header">
            <div>
              <h4 class="erp-card-title">LocalStorage Database Records</h4>
              <p class="erp-card-subtitle">Real-time counts of persisted in-memory records</p>
            </div>
            <button type="button" class="btn btn-secondary btn-xs" (click)="exportDatabaseJson()">
              <app-icon name="download" [size]="14"></app-icon>
              <span>Export JSON Backup</span>
            </button>
          </div>
          <div class="records-grid">
            <div class="rec-item">
              <span class="rec-name">Employees:</span>
              <span class="rec-count">{{ employeeService.employees().length }}</span>
            </div>
            <div class="rec-item">
              <span class="rec-name">Departments:</span>
              <span class="rec-count">{{ deptService.departments().length }}</span>
            </div>
            <div class="rec-item">
              <span class="rec-name">Leave Requests:</span>
              <span class="rec-count">{{ leaveService.leaveRequests().length }}</span>
            </div>
            <div class="rec-item">
              <span class="rec-name">Products (SKUs):</span>
              <span class="rec-count">{{ inventoryService.products().length }}</span>
            </div>
            <div class="rec-item">
              <span class="rec-name">Suppliers / Vendors:</span>
              <span class="rec-count">{{ supplierService.suppliers().length }}</span>
            </div>
            <div class="rec-item">
              <span class="rec-name">Purchase Orders:</span>
              <span class="rec-count">{{ procurementService.purchaseOrders().length }}</span>
            </div>
            <div class="rec-item">
              <span class="rec-name">Sales Orders:</span>
              <span class="rec-count">{{ salesService.salesOrders().length }}</span>
            </div>
            <div class="rec-item">
              <span class="rec-name">Customer Invoices:</span>
              <span class="rec-count">{{ invoiceService.invoices().length }}</span>
            </div>
            <div class="rec-item">
              <span class="rec-name">Operating Expenses:</span>
              <span class="rec-count">{{ expenseService.expenses().length }}</span>
            </div>
            <div class="rec-item">
              <span class="rec-name">Stock Movements:</span>
              <span class="rec-count">{{ inventoryService.stockMovements().length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reset Confirmation Dialog -->
    <app-confirm-dialog
      [isOpen]="showResetModal"
      title="Confirm ERP Demo Data Reset"
      message="This will reset all data records across HR, Inventory, Sales, and Finance back to the official default seed dataset. Are you sure you wish to proceed?"
      confirmText="Reset Entire ERP"
      cancelText="Cancel"
      variant="warning"
      (confirmed)="confirmReset()"
      (cancelled)="showResetModal = false"
    ></app-confirm-dialog>
  `,
  styles: [`
    .settings-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .setting-kpi {
      background: var(--erp-card-bg);
      border: 1px solid var(--erp-border);
      border-radius: 12px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .kpi-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--erp-text-muted);
    }
    .kpi-val {
      font-size: 1.45rem;
      font-weight: 700;
    }
    .kpi-sub {
      font-size: 0.775rem;
      color: var(--erp-text-muted);
    }
    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .avatar-thumb {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--erp-primary);
    }
    .user-fullname {
      font-weight: 600;
      color: var(--erp-text-heading);
    }
    .user-id-sub {
      font-size: 0.75rem;
      color: var(--erp-text-muted);
    }
    .code-pill {
      font-family: var(--erp-font-mono);
      font-size: 0.8rem;
      background: var(--erp-bg-subtle);
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid var(--erp-border);
    }
    .active-user-row {
      background: rgba(37, 99, 235, 0.06);
    }
    .text-xs {
      font-size: 0.725rem;
    }
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 10px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--erp-border);
      font-size: 0.885rem;
    }
    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .info-lbl {
      color: var(--erp-text-muted);
    }
    .info-val {
      color: var(--erp-text-heading);
    }
    .records-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 14px;
    }
    .rec-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--erp-bg-subtle);
      border: 1px solid var(--erp-border);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
    }
    .rec-name {
      color: var(--erp-text-muted);
    }
    .rec-count {
      font-weight: 700;
      color: var(--erp-primary);
    }
  `]
})
export class SystemSettingsComponent {
  auth = inject(AuthService);
  storage = inject(StorageService);
  employeeService = inject(EmployeeService);
  deptService = inject(DepartmentService);
  leaveService = inject(LeaveService);
  inventoryService = inject(InventoryService);
  supplierService = inject(SupplierService);
  procurementService = inject(ProcurementService);
  salesService = inject(SalesService);
  invoiceService = inject(InvoiceService);
  expenseService = inject(ExpenseService);
  notificationService = inject(NotificationService);

  showResetModal = false;
  defaultAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none"><rect width="36" height="36" fill="%23EFF6FF"/><circle cx="18" cy="14" r="7" fill="%232563EB"/><path d="M7 30C7 24.1421 11.7421 19.4 17.6 19.4C23.4579 19.4 28.2 24.1421 28.2 30" stroke="%232563EB" stroke-width="2.5" stroke-linecap="round"/></svg>';

  onAvatarError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target.src !== this.defaultAvatar) {
      target.src = this.defaultAvatar;
    }
  }

  get approximateStorageSize(): number {
    try {
      let total = 0;
      for (const x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
          total += (localStorage[x].length * 2);
        }
      }
      return Math.round(total / 1024);
    } catch {
      return 45;
    }
  }

  switchToRole(role: UserRole): void {
    this.auth.switchDemoUser(role);
    this.notificationService.notify('Switched Role', `Active session changed to ${role}.`, 'info');
  }

  confirmReset(): void {
    this.employeeService.resetDemo();
    this.deptService.resetDemo();
    this.inventoryService.resetDemo();
    this.supplierService.resetDemo();
    this.procurementService.resetDemo();
    this.salesService.resetDemo();
    this.invoiceService.resetDemo();
    this.expenseService.resetDemo();
    this.leaveService.resetDemo();
    this.notificationService.resetDemo();

    this.showResetModal = false;
    this.notificationService.notify(
      'System Reset Completed',
      'All 4 ERP modules have been restored to baseline seed datasets.',
      'success',
      '/dashboard'
    );
  }

  exportDatabaseJson(): void {
    const dump = {
      exportTimestamp: new Date().toISOString(),
      employees: this.employeeService.employees(),
      departments: this.deptService.departments(),
      leaves: this.leaveService.leaveRequests(),
      products: this.inventoryService.products(),
      suppliers: this.supplierService.suppliers(),
      procurement: this.procurementService.purchaseOrders(),
      sales: this.salesService.salesOrders(),
      invoices: this.invoiceService.invoices(),
      expenses: this.expenseService.expenses(),
      stockMovements: this.inventoryService.stockMovements()
    };

    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hcl_erp_database_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
