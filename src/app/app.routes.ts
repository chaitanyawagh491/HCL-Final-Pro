import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },

      // Module 1: Employee, HR and Leave Management
      { path: 'hr', redirectTo: 'hr/employees', pathMatch: 'full' },
      {
        path: 'hr/employees',
        loadComponent: () => import('./features/hr/employees/employee-list.component').then(m => m.EmployeeListComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'HR Manager'] }
      },
      {
        path: 'hr/employees/:id',
        loadComponent: () => import('./features/hr/employees/employee-detail.component').then(m => m.EmployeeDetailComponent)
      },
      {
        path: 'hr/departments',
        loadComponent: () => import('./features/hr/departments/department-list.component').then(m => m.DepartmentListComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'HR Manager'] }
      },
      {
        path: 'hr/leave',
        loadComponent: () => import('./features/hr/leave/leave-management.component').then(m => m.LeaveManagementComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'HR Manager', 'Employee'] }
      },
      {
        path: 'hr/leaves',
        loadComponent: () => import('./features/hr/leave/leave-management.component').then(m => m.LeaveManagementComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'HR Manager', 'Employee'] }
      },
      {
        path: 'hr/reports',
        loadComponent: () => import('./features/finance/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'HR Manager', 'Finance Manager'] }
      },

      // Module 2: Inventory, Suppliers and Procurement
      { path: 'inventory', redirectTo: 'inventory/products', pathMatch: 'full' },
      {
        path: 'inventory/products',
        loadComponent: () => import('./features/inventory/products/product-list.component').then(m => m.ProductListComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Inventory Manager'] }
      },
      {
        path: 'inventory/suppliers',
        loadComponent: () => import('./features/inventory/suppliers/supplier-list.component').then(m => m.SupplierListComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Inventory Manager'] }
      },
      {
        path: 'inventory/procurement',
        loadComponent: () => import('./features/inventory/procurement/procurement.component').then(m => m.ProcurementComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Inventory Manager'] }
      },
      {
        path: 'inventory/movements',
        loadComponent: () => import('./features/inventory/movements/stock-movements.component').then(m => m.StockMovementsComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Inventory Manager'] }
      },

      // Module 3: Sales, Purchase Orders and Invoicing
      { path: 'sales', redirectTo: 'sales/orders', pathMatch: 'full' },
      { path: 'sales/customers', redirectTo: 'sales/orders', pathMatch: 'full' },
      {
        path: 'sales/orders',
        loadComponent: () => import('./features/sales/orders/sales-orders.component').then(m => m.SalesOrdersComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Sales Manager'] }
      },
      {
        path: 'sales/invoices',
        loadComponent: () => import('./features/sales/invoices/invoice-list.component').then(m => m.InvoiceListComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Sales Manager', 'Finance Manager'] }
      },

      // Module 4: Finance Dashboard, Reports and Workflows
      { path: 'finance', redirectTo: 'finance/dashboard', pathMatch: 'full' },
      {
        path: 'finance/dashboard',
        loadComponent: () => import('./features/finance/dashboard/finance-dashboard.component').then(m => m.FinanceDashboardComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Finance Manager'] }
      },
      {
        path: 'finance/expenses',
        loadComponent: () => import('./features/finance/expenses/expense-list.component').then(m => m.ExpenseListComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Finance Manager'] }
      },
      {
        path: 'finance/reports',
        loadComponent: () => import('./features/finance/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Finance Manager', 'HR Manager'] }
      },
      {
        path: 'finance/workflows',
        loadComponent: () => import('./features/finance/workflows/workflow-overview.component').then(m => m.WorkflowOverviewComponent)
      },
      {
        path: 'workflows',
        loadComponent: () => import('./features/finance/workflows/workflow-overview.component').then(m => m.WorkflowOverviewComponent)
      },

      // System Management
      {
        path: 'system/settings',
        loadComponent: () => import('./features/system/settings/system-settings.component').then(m => m.SystemSettingsComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin'] }
      },
      {
        path: 'system/users',
        loadComponent: () => import('./features/system/settings/system-settings.component').then(m => m.SystemSettingsComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin'] }
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/system/settings/system-settings.component').then(m => m.SystemSettingsComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin'] }
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
