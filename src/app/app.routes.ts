import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { EmployeeListComponent } from './features/hr/employees/employee-list.component';
import { EmployeeDetailComponent } from './features/hr/employees/employee-detail.component';
import { DepartmentListComponent } from './features/hr/departments/department-list.component';
import { LeaveManagementComponent } from './features/hr/leave/leave-management.component';
import { ProductListComponent } from './features/inventory/products/product-list.component';
import { SupplierListComponent } from './features/inventory/suppliers/supplier-list.component';
import { ProcurementComponent } from './features/inventory/procurement/procurement.component';
import { StockMovementsComponent } from './features/inventory/movements/stock-movements.component';
import { SalesOrdersComponent } from './features/sales/orders/sales-orders.component';
import { InvoiceListComponent } from './features/sales/invoices/invoice-list.component';
import { FinanceDashboardComponent } from './features/finance/dashboard/finance-dashboard.component';
import { ExpenseListComponent } from './features/finance/expenses/expense-list.component';
import { ReportsComponent } from './features/finance/reports/reports.component';
import { WorkflowOverviewComponent } from './features/finance/workflows/workflow-overview.component';
import { SystemSettingsComponent } from './features/system/settings/system-settings.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },

      // Module 1: Employee, HR and Leave Management
      { path: 'hr', redirectTo: 'hr/employees', pathMatch: 'full' },
      {
        path: 'hr/employees',
        component: EmployeeListComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'HR Manager'] }
      },
      {
        path: 'hr/employees/:id',
        component: EmployeeDetailComponent
      },
      {
        path: 'hr/departments',
        component: DepartmentListComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'HR Manager'] }
      },
      {
        path: 'hr/leave',
        component: LeaveManagementComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'HR Manager', 'Employee'] }
      },
      {
        path: 'hr/leaves',
        component: LeaveManagementComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'HR Manager', 'Employee'] }
      },
      {
        path: 'hr/reports',
        component: ReportsComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'HR Manager', 'Finance Manager'] }
      },

      // Module 2: Inventory, Suppliers and Procurement
      { path: 'inventory', redirectTo: 'inventory/products', pathMatch: 'full' },
      {
        path: 'inventory/products',
        component: ProductListComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Inventory Manager'] }
      },
      {
        path: 'inventory/suppliers',
        component: SupplierListComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Inventory Manager'] }
      },
      {
        path: 'inventory/procurement',
        component: ProcurementComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Inventory Manager'] }
      },
      {
        path: 'inventory/movements',
        component: StockMovementsComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Inventory Manager'] }
      },

      // Module 3: Sales, Purchase Orders and Invoicing
      { path: 'sales', redirectTo: 'sales/orders', pathMatch: 'full' },
      { path: 'sales/customers', redirectTo: 'sales/orders', pathMatch: 'full' },
      {
        path: 'sales/orders',
        component: SalesOrdersComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Sales Manager'] }
      },
      {
        path: 'sales/invoices',
        component: InvoiceListComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Sales Manager', 'Finance Manager'] }
      },

      // Module 4: Finance Dashboard, Reports and Workflows
      { path: 'finance', redirectTo: 'finance/dashboard', pathMatch: 'full' },
      {
        path: 'finance/dashboard',
        component: FinanceDashboardComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Finance Manager'] }
      },
      {
        path: 'finance/expenses',
        component: ExpenseListComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Finance Manager'] }
      },
      {
        path: 'finance/reports',
        component: ReportsComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Finance Manager', 'HR Manager'] }
      },
      {
        path: 'finance/workflows',
        component: WorkflowOverviewComponent
      },
      {
        path: 'workflows',
        component: WorkflowOverviewComponent
      },

      // System Management
      {
        path: 'system/settings',
        component: SystemSettingsComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin'] }
      },
      {
        path: 'system/users',
        component: SystemSettingsComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin'] }
      },
      {
        path: 'settings',
        component: SystemSettingsComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin'] }
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
