import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';

interface NavItem {
  label: string;
  route: string;
  queryParams?: any;
  icon: string;
  roles?: string[];
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, BadgeComponent],
  template: `
    <aside class="app-sidebar" [class.collapsed]="isCollapsed">
      <!-- Brand Logo / Title -->
      <div class="sidebar-brand">
        <div class="brand-logo-icon">
          <app-icon name="layers" [size]="22"></app-icon>
        </div>
        <div class="brand-text" *ngIf="!isCollapsed">
          <span class="brand-name">HCL <span class="highlight">ERP</span></span>
          <span class="brand-tag">Enterprise Master System</span>
        </div>
      </div>

      <!-- Navigation Menu -->
      <div class="sidebar-nav">
        <div class="nav-section" *ngFor="let section of filteredSections">
          <div class="section-title" *ngIf="!isCollapsed && section.title">{{ section.title }}</div>
          <ul class="nav-list">
            <li class="nav-item" *ngFor="let item of section.items">
              <a
                [routerLink]="item.route"
                [queryParams]="item.queryParams || null"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
                class="nav-link"
                [title]="isCollapsed ? item.label : ''"
              >
                <span class="nav-icon">
                  <app-icon [name]="item.icon" [size]="19"></app-icon>
                </span>
                <span class="nav-label" *ngIf="!isCollapsed">{{ item.label }}</span>
                <span class="nav-badge" *ngIf="!isCollapsed && item.badge">
                  <app-badge [text]="item.badge" variant="primary" [showDot]="false"></app-badge>
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- User Role Pill at Bottom -->
      <div class="sidebar-footer" *ngIf="!isCollapsed">
        <div class="user-role-card">
          <div class="role-avatar">
            <img
              [src]="auth.currentUser()?.avatar || defaultAvatar"
              (error)="onAvatarError($event)"
              alt="Avatar"
            />
          </div>
          <div class="role-details">
            <span class="user-name">{{ auth.currentUser()?.name }}</span>
            <span class="user-role-badge">{{ auth.currentUser()?.designation || auth.currentUser()?.role }}</span>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .app-sidebar {
      width: var(--erp-sidebar-width);
      height: 100vh;
      background: #0f172a;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #1e293b;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 100;
      transition: width 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      overflow-x: hidden;
    }
    .app-sidebar.collapsed {
      width: var(--erp-sidebar-collapsed-width);
    }
    .sidebar-brand {
      height: var(--erp-header-height);
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 12px;
      border-bottom: 1px solid #1e293b;
      flex-shrink: 0;
    }
    .brand-logo-icon {
      width: 36px;
      height: 36px;
      border-radius: 9px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .brand-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.02em;
    }
    .brand-name .highlight {
      color: #60a5fa;
    }
    .brand-tag {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
    }
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 16px 12px;
      scrollbar-width: thin;
      scrollbar-color: #334155 transparent;
    }
    .sidebar-nav::-webkit-scrollbar {
      width: 5px;
    }
    .sidebar-nav::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 4px;
    }
    .section-title {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      font-weight: 700;
      padding: 12px 10px 6px;
    }
    .nav-list {
      list-style: none;
      margin-bottom: 12px;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      color: #94a3b8;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .nav-link:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #ffffff;
    }
    .nav-link.active {
      background: #2563eb;
      color: #ffffff;
      font-weight: 600;
    }
    .nav-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .nav-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sidebar-footer {
      padding: 12px 14px;
      border-top: 1px solid #1e293b;
      flex-shrink: 0;
      background: #0b1120;
    }
    .user-role-card {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .role-avatar img {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #3b82f6;
    }
    .role-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .user-name {
      font-size: 0.825rem;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role-badge {
      font-size: 0.7rem;
      color: #60a5fa;
      font-weight: 500;
    }
  `]
})
export class SidebarComponent {
  auth = inject(AuthService);

  @Input() isCollapsed = false;

  defaultAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none"><rect width="36" height="36" fill="%23EFF6FF"/><circle cx="18" cy="14" r="7" fill="%232563EB"/><path d="M7 30C7 24.1421 11.7421 19.4 17.6 19.4C23.4579 19.4 28.2 24.1421 28.2 30" stroke="%232563EB" stroke-width="2.5" stroke-linecap="round"/></svg>';

  onAvatarError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target.src !== this.defaultAvatar) {
      target.src = this.defaultAvatar;
    }
  }

  navSections: NavSection[] = [
    {
      title: 'CORE DASHBOARD',
      items: [
        { label: 'Overview Dashboard', route: '/dashboard', icon: 'dashboard' }
      ]
    },
    {
      title: 'MODULE 1: HUMAN RESOURCE MANAGEMENT',
      items: [
        { label: 'HR Dashboard', route: '/hr/employees', icon: 'users', roles: ['Admin', 'HR Manager'] },
        { label: 'Employee Directory', route: '/hr/employees', icon: 'user', roles: ['Admin', 'HR Manager'] },
        { label: 'Employee Registration', route: '/hr/employees', queryParams: { action: 'register' }, icon: 'plus', roles: ['Admin', 'HR Manager'] },
        { label: 'Department Management', route: '/hr/departments', icon: 'building', roles: ['Admin', 'HR Manager'] },
        { label: 'Leave Management', route: '/hr/leave', icon: 'calendar', roles: ['Admin', 'HR Manager', 'Employee'] },
        { label: 'Leave Approvals', route: '/hr/leave', queryParams: { tab: 'Pending' }, icon: 'check-circle', roles: ['Admin', 'HR Manager'] },
        { label: 'HR Reports', route: '/finance/reports', queryParams: { type: 'payroll' }, icon: 'bar-chart', roles: ['Admin', 'HR Manager'] }
      ]
    },
    {
      title: 'MODULE 2: INVENTORY & SUPPLY MANAGEMENT',
      items: [
        { label: 'Inventory Dashboard', route: '/inventory/products', icon: 'box', roles: ['Admin', 'Inventory Manager'] },
        { label: 'Product Inventory', route: '/inventory/products', icon: 'layers', roles: ['Admin', 'Inventory Manager'] },
        { label: 'Vendors & Suppliers', route: '/inventory/suppliers', icon: 'truck', roles: ['Admin', 'Inventory Manager'] },
        { label: 'Procurement Management', route: '/inventory/procurement', icon: 'shopping-cart', roles: ['Admin', 'Inventory Manager'] },
        { label: 'Stock Movements Log', route: '/inventory/movements', icon: 'clock', roles: ['Admin', 'Inventory Manager'] }
      ]
    },
    {
      title: 'MODULE 3: SALES & ORDER MANAGEMENT',
      items: [
        { label: 'Sales Dashboard', route: '/sales/orders', icon: 'trending-up', roles: ['Admin', 'Sales Manager'] },
        { label: 'Sales Orders', route: '/sales/orders', icon: 'shopping-cart', roles: ['Admin', 'Sales Manager'] },
        { label: 'Customer Invoices', route: '/sales/invoices', icon: 'file-text', roles: ['Admin', 'Sales Manager', 'Finance Manager'] },
        { label: 'Generate Invoice', route: '/sales/orders', queryParams: { action: 'invoice' }, icon: 'plus', roles: ['Admin', 'Sales Manager'] }
      ]
    },
    {
      title: 'MODULE 4: FINANCE & AUDIT',
      items: [
        { label: 'Finance Dashboard', route: '/finance/dashboard', icon: 'dollar-sign', roles: ['Admin', 'Finance Manager'] },
        { label: 'Income & Expenses', route: '/finance/expenses', icon: 'credit-card', roles: ['Admin', 'Finance Manager'] },
        { label: 'Financial Reports', route: '/finance/reports', icon: 'bar-chart', roles: ['Admin', 'Finance Manager'] },
        { label: 'ERP Workflows View', route: '/finance/workflows', icon: 'workflow', roles: ['Admin', 'HR Manager', 'Inventory Manager', 'Sales Manager', 'Finance Manager'] }
      ]
    },
    {
      title: 'SYSTEM MANAGEMENT',
      items: [
        { label: 'User & Role Management', route: '/system/users', icon: 'shield', roles: ['Admin'] },
        { label: 'System Settings', route: '/system/settings', icon: 'settings', roles: ['Admin'] }
      ]
    }
  ];

  get filteredSections(): NavSection[] {
    const role = this.auth.currentRole();
    if (!role) return [];

    return this.navSections.map(sec => ({
      title: sec.title,
      items: sec.items.filter(item => {
        if (!item.roles) return true;
        if (role === 'Admin') return true;
        return item.roles.includes(role);
      })
    })).filter(sec => sec.items.length > 0);
  }
}

