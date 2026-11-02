import { Component, Output, EventEmitter, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { EmployeeService } from '../../core/services/employee.service';
import { DepartmentService } from '../../core/services/department.service';
import { InventoryService } from '../../core/services/inventory.service';
import { SupplierService } from '../../core/services/supplier.service';
import { ProcurementService } from '../../core/services/procurement.service';
import { SalesService } from '../../core/services/sales.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { ExpenseService } from '../../core/services/expense.service';
import { LeaveService } from '../../core/services/leave.service';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { UserRole } from '../../core/models/erp.model';
import { DEFAULT_AVATAR, CW_AVATAR } from '../../core/constants/avatars';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="app-header">
      <div class="header-left">
        <button type="button" class="icon-btn" (click)="toggleSidebar.emit()" title="Toggle Sidebar">
          <app-icon name="menu" [size]="20"></app-icon>
        </button>

        <div class="role-switcher">
          <span class="switcher-label">Active Role:</span>
          <select class="role-select" [ngModel]="auth.currentRole()" (ngModelChange)="onRoleSelected($event)">
            <option value="Admin">Admin (Full Access)</option>
            <option value="HR Manager">HR Manager</option>
            <option value="Inventory Manager">Inventory Manager</option>
            <option value="Sales Manager">Sales Manager</option>
            <option value="Finance Manager">Finance Manager</option>
            <option value="Employee">Employee</option>
          </select>
        </div>
      </div>

      <div class="header-right">
        <!-- Reset Demo Data Button -->
        <button type="button" class="btn btn-secondary btn-sm" (click)="showResetModal = true" title="Reset all demo records">
          <app-icon name="refresh-cw" [size]="14"></app-icon>
          <span class="btn-text">Reset Demo Data</span>
        </button>

        <!-- Dark/Light Mode Toggle -->
        <button type="button" class="icon-btn" (click)="toggleTheme()" [title]="isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
          <app-icon [name]="isDark() ? 'sun' : 'moon'" [size]="18"></app-icon>
        </button>

        <!-- Notifications Dropdown -->
        <div class="notif-wrapper">
          <button type="button" class="icon-btn notif-btn" (click)="showNotifications = !showNotifications">
            <app-icon name="bell" [size]="19"></app-icon>
            <span class="notif-badge" *ngIf="notificationService.unreadCount() > 0">
              {{ notificationService.unreadCount() }}
            </span>
          </button>

          <!-- Notification Menu -->
          <div class="notif-dropdown" *ngIf="showNotifications">
            <div class="notif-header">
              <span class="notif-title">System Notifications</span>
              <button type="button" class="mark-read-btn" (click)="notificationService.markAllAsRead()">
                Mark all read
              </button>
            </div>
            <div class="notif-list">
              <div
                class="notif-item"
                *ngFor="let item of recentNotifications(); trackBy: trackById"
                [class.unread]="!item.read"
                (click)="onNotificationClick(item)"
              >
                <div class="notif-indicator" [ngClass]="'indicator-' + item.type"></div>
                <div class="notif-content">
                  <div class="notif-item-title">{{ item.title }}</div>
                  <div class="notif-item-msg">{{ item.message }}</div>
                  <div class="notif-item-time">{{ item.date }}</div>
                </div>
              </div>
              <div class="notif-empty" *ngIf="notificationService.notifications().length === 0">
                No notifications to display
              </div>
            </div>
          </div>
        </div>

        <!-- User Profile Dropdown -->
        <div class="profile-wrapper">
          <div class="profile-trigger" (click)="showProfileMenu = !showProfileMenu">
            <img
              [src]="auth.currentUser()?.avatar || defaultAvatar"
              (error)="onAvatarError($event)"
              alt="Avatar"
              class="profile-avatar"
            />
            <div class="profile-meta">
              <span class="profile-name">{{ auth.currentUser()?.name }}</span>
              <span class="profile-role">{{ auth.currentUser()?.designation || auth.currentUser()?.role }}</span>
            </div>
            <app-icon name="chevron-down" [size]="14"></app-icon>
          </div>

          <div class="profile-dropdown" *ngIf="showProfileMenu">
            <div class="profile-dropdown-header">
              <p class="signed-in-as">Signed in as</p>
              <p class="user-email">{{ auth.currentUser()?.email }}</p>
            </div>
            <div class="dropdown-divider"></div>
            <button type="button" class="dropdown-item" (click)="goToProfile()">
              <app-icon name="user" [size]="16"></app-icon>
              <span>My Profile</span>
            </button>
            <button type="button" class="dropdown-item logout-item" (click)="logout()">
              <app-icon name="log-out" [size]="16"></app-icon>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Reset Demo Data Confirmation Dialog -->
    <app-confirm-dialog
      [isOpen]="showResetModal"
      title="Reset ERP Demo Data"
      message="This will restore all departments, employees, inventory, purchase orders, sales orders, invoices, and expenses back to default initial seed values. Any custom modifications will be reset."
      confirmText="Reset All Data"
      cancelText="Cancel"
      variant="warning"
      (confirmed)="resetAllDemoData()"
      (cancelled)="showResetModal = false"
    ></app-confirm-dialog>
  `,
  styles: [`
    .app-header {
      height: var(--erp-header-height);
      background: var(--erp-card-bg);
      border-bottom: 1px solid var(--erp-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 90;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }
    .header-left, .header-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .icon-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--erp-bg-subtle);
      border: 1px solid var(--erp-border);
      color: var(--erp-text);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .icon-btn:hover {
      background: var(--erp-border);
      color: var(--erp-text-heading);
    }
    .role-switcher {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--erp-bg-subtle);
      padding: 4px 10px;
      border-radius: 8px;
      border: 1px solid var(--erp-border);
    }
    .switcher-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--erp-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .role-select {
      background: transparent;
      border: none;
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--erp-primary);
      cursor: pointer;
      outline: none;
    }
    .notif-wrapper, .profile-wrapper {
      position: relative;
    }
    .notif-btn {
      position: relative;
    }
    .notif-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #dc2626;
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 700;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--erp-card-bg);
    }
    .notif-dropdown {
      position: absolute;
      top: 48px;
      right: 0;
      width: 360px;
      background: var(--erp-card-bg);
      border: 1px solid var(--erp-border);
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
      z-index: 1000;
      animation: fadeIn 0.15s ease-out;
    }
    .notif-header {
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--erp-border);
    }
    .notif-title {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--erp-text-heading);
    }
    .mark-read-btn {
      background: none;
      border: none;
      color: var(--erp-primary);
      font-size: 0.775rem;
      font-weight: 500;
      cursor: pointer;
    }
    .notif-list {
      max-height: 380px;
      overflow-y: auto;
    }
    .notif-item {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--erp-border);
      cursor: pointer;
      transition: background 0.1s ease;
    }
    .notif-item:hover {
      background: var(--erp-bg-hover);
    }
    .notif-item.unread {
      background: var(--erp-primary-light);
    }
    .notif-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 5px;
      flex-shrink: 0;
    }
    .indicator-info { background: #0284c7; }
    .indicator-success { background: #16a34a; }
    .indicator-warning { background: #f59e0b; }
    .indicator-danger { background: #dc2626; }

    .notif-item-title {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--erp-text-heading);
    }
    .notif-item-msg {
      font-size: 0.775rem;
      color: var(--erp-text);
      margin: 2px 0 4px;
      line-height: 1.35;
    }
    .notif-item-time {
      font-size: 0.7rem;
      color: var(--erp-text-muted);
    }
    .notif-empty {
      padding: 24px;
      text-align: center;
      color: var(--erp-text-muted);
      font-size: 0.85rem;
    }
    .profile-trigger {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 8px;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background 0.15s ease;
    }
    .profile-trigger:hover {
      background: var(--erp-bg-subtle);
    }
    .profile-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--erp-primary);
    }
    .profile-meta {
      display: flex;
      flex-direction: column;
      text-align: left;
    }
    .profile-name {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--erp-text-heading);
      line-height: 1.2;
    }
    .profile-role {
      font-size: 0.7rem;
      color: var(--erp-text-muted);
    }
    .profile-dropdown {
      position: absolute;
      top: 48px;
      right: 0;
      width: 220px;
      background: var(--erp-card-bg);
      border: 1px solid var(--erp-border);
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
      padding: 8px 0;
      z-index: 1000;
    }
    .profile-dropdown-header {
      padding: 8px 16px;
    }
    .signed-in-as {
      font-size: 0.7rem;
      color: var(--erp-text-muted);
    }
    .user-email {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--erp-text-heading);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dropdown-divider {
      height: 1px;
      background: var(--erp-border);
      margin: 6px 0;
    }
    .dropdown-item {
      width: 100%;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: none;
      border: none;
      font-size: 0.85rem;
      color: var(--erp-text);
      cursor: pointer;
      text-align: left;
      transition: background 0.1s ease;
    }
    .dropdown-item:hover {
      background: var(--erp-bg-hover);
      color: var(--erp-text-heading);
    }
    .logout-item {
      color: var(--erp-danger);
    }
    .logout-item:hover {
      background: var(--erp-danger-bg);
      color: var(--erp-danger);
    }

    @media (max-width: 768px) {
      .btn-text, .profile-meta, .switcher-label {
        display: none;
      }
      .app-header {
        padding: 0 12px;
      }
    }
  `]
})
export class HeaderComponent {
  auth = inject(AuthService);
  notificationService = inject(NotificationService);
  employeeService = inject(EmployeeService);
  deptService = inject(DepartmentService);
  inventoryService = inject(InventoryService);
  supplierService = inject(SupplierService);
  procurementService = inject(ProcurementService);
  salesService = inject(SalesService);
  invoiceService = inject(InvoiceService);
  expenseService = inject(ExpenseService);
  leaveService = inject(LeaveService);
  router = inject(Router);

  @Output() toggleSidebar = new EventEmitter<void>();

  showNotifications = false;
  showProfileMenu = false;
  showResetModal = false;
  isDark = signal(false);
  defaultAvatar = DEFAULT_AVATAR;

  recentNotifications = computed(() => this.notificationService.notifications().slice(0, 8));

  trackById(index: number, item: any): string {
    return item.id || index;
  }

  onAvatarError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.onerror = null;
    target.src = this.defaultAvatar;
  }

  toggleTheme(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  onRoleSelected(role: UserRole): void {
    if (!role) return;
    const switchedUser = this.auth.switchDemoUser(role);
    this.notificationService.notify('Switched Role', `Active session switched to ${role} (${switchedUser?.name || ''}).`, 'info');

    // Auto-navigate if current route is not accessible for the newly selected role
    const currentUrl = this.router.url.split('?')[0];
    if (role === 'Employee') {
      if (currentUrl !== '/hr/leave' && !currentUrl.startsWith('/hr/employees/')) {
        this.router.navigate(['/hr/leave']);
      }
    } else if (role === 'HR Manager') {
      if (!currentUrl.startsWith('/hr') && currentUrl !== '/dashboard' && !currentUrl.startsWith('/finance/reports') && currentUrl !== '/workflows' && currentUrl !== '/finance/workflows') {
        this.router.navigate(['/dashboard']);
      }
    } else if (role === 'Inventory Manager') {
      if (!currentUrl.startsWith('/inventory') && currentUrl !== '/dashboard' && currentUrl !== '/workflows' && currentUrl !== '/finance/workflows') {
        this.router.navigate(['/dashboard']);
      }
    } else if (role === 'Sales Manager') {
      if (!currentUrl.startsWith('/sales') && currentUrl !== '/dashboard' && currentUrl !== '/workflows' && currentUrl !== '/finance/workflows') {
        this.router.navigate(['/dashboard']);
      }
    } else if (role === 'Finance Manager') {
      if (!currentUrl.startsWith('/finance') && currentUrl !== '/sales/invoices' && currentUrl !== '/dashboard' && currentUrl !== '/workflows' && currentUrl !== '/finance/workflows') {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  onNotificationClick(item: any): void {
    this.notificationService.markAsRead(item.id);
    this.showNotifications = false;
    if (item.link) {
      this.router.navigateByUrl(item.link);
    }
  }

  goToProfile(): void {
    this.showProfileMenu = false;
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.showProfileMenu = false;
    this.auth.logout();
  }

  resetAllDemoData(): void {
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
      'Demo Data Reset Completed',
      'All 4 ERP modules have been restored to initial sample baseline data.',
      'success',
      '/dashboard'
    );
  }
}
