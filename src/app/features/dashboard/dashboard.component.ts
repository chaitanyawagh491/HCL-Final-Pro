import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmployeeService } from '../../core/services/employee.service';
import { DepartmentService } from '../../core/services/department.service';
import { LeaveService } from '../../core/services/leave.service';
import { InventoryService } from '../../core/services/inventory.service';
import { SupplierService } from '../../core/services/supplier.service';
import { ProcurementService } from '../../core/services/procurement.service';
import { SalesService } from '../../core/services/sales.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { FinanceService } from '../../core/services/finance.service';
import { ExpenseService } from '../../core/services/expense.service';
import { AuthService } from '../../core/services/auth.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatCardComponent, BadgeComponent, ChartComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-page">
      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <div class="welcome-text">
          <h1 class="page-title">Enterprise Resource Planning (ERP) Master Dashboard</h1>
          <p class="page-subtitle">
            Welcome back, <strong>{{ auth.currentUser()?.name }}</strong> ({{ auth.currentUser()?.designation || auth.currentUser()?.role }}). Here is your real-time integrated organizational overview.
          </p>
        </div>
        <div class="quick-actions">
          <a routerLink="/sales/orders" class="btn btn-primary btn-sm">
            <app-icon name="plus" [size]="15"></app-icon>
            <span>New Sales Order</span>
          </a>
          <a routerLink="/inventory/procurement" class="btn btn-secondary btn-sm">
            <app-icon name="shopping-cart" [size]="15"></app-icon>
            <span>New Purchase Order</span>
          </a>
          <a routerLink="/hr/employees" class="btn btn-secondary btn-sm" *ngIf="auth.hasRole(['Admin', 'HR Manager'])">
            <app-icon name="users" [size]="15"></app-icon>
            <span>Add Employee</span>
          </a>
        </div>
      </div>

      <!-- Urgent Attention Alert Banners -->
      <div class="alerts-grid">
        <div class="alert-strip warning-strip" *ngIf="inventoryService.lowStockCount() > 0">
          <app-icon name="alert-circle" [size]="20"></app-icon>
          <div class="strip-content">
            <strong>Stock Replenishment Needed:</strong>
            {{ inventoryService.lowStockCount() }} product(s) are below safety threshold or out of stock.
          </div>
          <a routerLink="/inventory/products" class="strip-link">Review Inventory &rarr;</a>
        </div>

        <div class="alert-strip info-strip" *ngIf="leaveService.pendingLeavesCount() > 0 && auth.hasRole(['Admin', 'HR Manager'])">
          <app-icon name="clock" [size]="20"></app-icon>
          <div class="strip-content">
            <strong>Pending Leave Approvals:</strong>
            {{ leaveService.pendingLeavesCount() }} employee leave request(s) awaiting managerial review.
          </div>
          <a routerLink="/hr/leave" class="strip-link">Manage Leaves &rarr;</a>
        </div>

        <div class="alert-strip purple-strip" *ngIf="procurementService.pendingOrdersCount() > 0 && auth.hasRole(['Admin', 'Inventory Manager'])">
          <app-icon name="shopping-cart" [size]="20"></app-icon>
          <div class="strip-content">
            <strong>Pending Purchase Orders:</strong>
            {{ procurementService.pendingOrdersCount() }} procurement order(s) pending approval or delivery fulfillment.
          </div>
          <a routerLink="/inventory/procurement" class="strip-link">View Procurement &rarr;</a>
        </div>

        <div class="alert-strip danger-strip" *ngIf="invoiceService.unpaidInvoicesCount() > 0 && auth.hasRole(['Admin', 'Sales Manager', 'Finance Manager'])">
          <app-icon name="clock" [size]="20"></app-icon>
          <div class="strip-content">
            <strong>Outstanding Invoice Alerts:</strong>
            {{ invoiceService.unpaidInvoicesCount() }} open customer invoice(s) with total outstanding receivables of {{ formatCurrency(invoiceService.totalOutstandingAmount()) }}.
          </div>
          <a routerLink="/sales/invoices" class="strip-link">Inspect Invoices &rarr;</a>
        </div>
      </div>

      <!-- 12 Required Core Metric Statistic Cards -->
      <div class="metrics-section">
        <h3 class="section-heading">Key Performance Indicators</h3>
        <div class="grid-cols-4">
          <!-- HR KPIs -->
          <app-stat-card
            title="Total Employees"
            [value]="employeeService.totalEmployees()"
            icon="users"
            variant="primary"
            subtitle="Registered workforce"
            [trend]="{ text: '+2 this quarter', isPositive: true }"
          ></app-stat-card>

          <app-stat-card
            title="Active Employees"
            [value]="employeeService.activeEmployees()"
            icon="check-circle"
            variant="success"
            subtitle="Currently on payroll"
          ></app-stat-card>

          <app-stat-card
            title="Pending Leaves"
            [value]="leaveService.pendingLeavesCount()"
            icon="calendar"
            variant="warning"
            subtitle="Awaiting HR approval"
          ></app-stat-card>

          <app-stat-card
            title="Total Suppliers"
            [value]="supplierService.suppliers().length"
            icon="truck"
            variant="purple"
            subtitle="Active verified vendors"
          ></app-stat-card>

          <!-- Inventory & Procurement KPIs -->
          <app-stat-card
            title="Inventory Items"
            [value]="inventoryService.totalProducts()"
            icon="box"
            variant="teal"
            subtitle="Catalog product SKUs"
          ></app-stat-card>

          <app-stat-card
            title="Low Stock Items"
            [value]="inventoryService.lowStockCount()"
            icon="alert-circle"
            variant="danger"
            subtitle="At or below minimum level"
          ></app-stat-card>

          <app-stat-card
            title="Pending POs"
            [value]="procurementService.pendingOrdersCount()"
            icon="shopping-cart"
            variant="indigo"
            subtitle="Procurement in pipeline"
          ></app-stat-card>

          <app-stat-card
            title="Total Sales Orders"
            [value]="salesService.totalSalesCount()"
            icon="bar-chart"
            variant="primary"
            subtitle="All enterprise bookings"
          ></app-stat-card>

          <!-- Sales & Financial KPIs -->
          <app-stat-card
            title="Total Invoices"
            [value]="invoiceService.totalInvoicesCount()"
            icon="file-text"
            variant="indigo"
            [subtitle]="invoiceService.paidInvoicesCount() + ' Paid / ' + invoiceService.unpaidInvoicesCount() + ' Pending'"
          ></app-stat-card>

          <app-stat-card
            title="Outstanding Dues"
            [value]="formatCurrency(invoiceService.totalOutstandingAmount())"
            icon="clock"
            variant="warning"
            subtitle="Receivables to collect"
          ></app-stat-card>

          <app-stat-card
            title="Total Cash Revenue"
            [value]="formatCurrency(financeService.totalRevenue())"
            icon="dollar-sign"
            variant="success"
            subtitle="Reconciled collections"
            [trend]="{ text: '+18.4% YoY', isPositive: true }"
          ></app-stat-card>

          <app-stat-card
            title="Total Company Expenses"
            [value]="formatCurrency(financeService.totalExpenses())"
            icon="credit-card"
            variant="danger"
            subtitle="Operating + Procurement"
          ></app-stat-card>
        </div>
      </div>

      <!-- 6 Required Dashboard Visualizations -->
      <div class="charts-section">
        <h3 class="section-heading">Operational & Financial Visualizations</h3>

        <div class="grid-cols-2">
          <!-- 1. Monthly Sales Chart -->
          <div class="erp-card">
            <div class="erp-card-header">
              <div>
                <h4 class="erp-card-title">1. Monthly Sales Orders Trend</h4>
                <p class="erp-card-subtitle">Volume of sales orders booked across recent months</p>
              </div>
              <span class="badge badge-info">Delivered & Confirmed</span>
            </div>
            <app-chart
              type="bar"
              [labels]="monthlySalesData().labels"
              [datasets]="monthlySalesData().datasets"
              [height]="250"
            ></app-chart>
          </div>

          <!-- 2. Revenue vs Expenses Chart -->
          <div class="erp-card">
            <div class="erp-card-header">
              <div>
                <h4 class="erp-card-title">2. Revenue vs. Total Expenditure</h4>
                <p class="erp-card-subtitle">Actual collected cash revenue against operating and procurement expenses</p>
              </div>
              <span class="badge badge-success">Cash Flow</span>
            </div>
            <app-chart
              type="line"
              [labels]="revExpChartData().labels"
              [datasets]="revExpChartData().datasets"
              [height]="250"
            ></app-chart>
          </div>
        </div>

        <div class="grid-cols-4">
          <!-- 3. Inventory Category Distribution -->
          <div class="erp-card">
            <div class="erp-card-header">
              <div>
                <h4 class="erp-card-title">3. Inventory by Category</h4>
                <p class="erp-card-subtitle">Product SKU distribution</p>
              </div>
            </div>
            <app-chart
              type="doughnut"
              [labels]="categoryChartData().labels"
              [datasets]="categoryChartData().datasets"
              [height]="220"
            ></app-chart>
          </div>

          <!-- 4. Employee Department Distribution -->
          <div class="erp-card">
            <div class="erp-card-header">
              <div>
                <h4 class="erp-card-title">4. Workforce by Dept</h4>
                <p class="erp-card-subtitle">Active headcount by team</p>
              </div>
            </div>
            <app-chart
              type="doughnut"
              [labels]="departmentChartData().labels"
              [datasets]="departmentChartData().datasets"
              [height]="220"
            ></app-chart>
          </div>

          <!-- 5. Leave Request Status -->
          <div class="erp-card">
            <div class="erp-card-header">
              <div>
                <h4 class="erp-card-title">5. Leave Request Status</h4>
                <p class="erp-card-subtitle">HR review breakdown</p>
              </div>
            </div>
            <app-chart
              type="pie"
              [labels]="leaveStatusChartData().labels"
              [datasets]="leaveStatusChartData().datasets"
              [height]="220"
            ></app-chart>
          </div>

          <!-- 6. Purchase Order Status -->
          <div class="erp-card">
            <div class="erp-card-header">
              <div>
                <h4 class="erp-card-title">6. Purchase Order Status</h4>
                <p class="erp-card-subtitle">Procurement lifecycle</p>
              </div>
            </div>
            <app-chart
              type="doughnut"
              [labels]="poStatusChartData().labels"
              [datasets]="poStatusChartData().datasets"
              [height]="220"
            ></app-chart>
          </div>
        </div>
      </div>

      <!-- Recent 6-Stream Activity Overview -->
      <div class="erp-card">
        <div class="erp-card-header">
          <div>
            <h4 class="erp-card-title">Real-Time Organizational Activity Feeds</h4>
            <p class="erp-card-subtitle">Live records and audit trails across all four integrated ERP business modules</p>
          </div>
          <div class="activity-tabs-row">
            <button type="button" class="tab-btn-sm" [class.active]="activeActivityTab === 'sales'" (click)="activeActivityTab = 'sales'">
              Sales Orders ({{ salesService.salesOrders().length }})
            </button>
            <button type="button" class="tab-btn-sm" [class.active]="activeActivityTab === 'procurement'" (click)="activeActivityTab = 'procurement'">
              Procurement POs ({{ procurementService.purchaseOrders().length }})
            </button>
            <button type="button" class="tab-btn-sm" [class.active]="activeActivityTab === 'invoices'" (click)="activeActivityTab = 'invoices'">
              Customer Invoices ({{ invoiceService.invoices().length }})
            </button>
            <button type="button" class="tab-btn-sm" [class.active]="activeActivityTab === 'movements'" (click)="activeActivityTab = 'movements'">
              Stock Movements ({{ inventoryService.stockMovements().length }})
            </button>
            <button type="button" class="tab-btn-sm" [class.active]="activeActivityTab === 'financial'" (click)="activeActivityTab = 'financial'">
              Financial Transactions
            </button>
            <button type="button" class="tab-btn-sm" [class.active]="activeActivityTab === 'hr'" (click)="activeActivityTab = 'hr'">
              HR & Personnel
            </button>
          </div>
        </div>

        <!-- 1. Recent Sales Orders Table -->
        <div class="table-responsive" *ngIf="activeActivityTab === 'sales'">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Line Items</th>
                <th>Total Value</th>
                <th>Order Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let so of salesOrdersList(); trackBy: trackById">
                <td><strong class="font-mono">{{ so.orderNumber }}</strong></td>
                <td>{{ so.customerName }}</td>
                <td>{{ so.orderDate }}</td>
                <td>{{ so.items.length }} product(s)</td>
                <td><strong>{{ formatCurrency(so.totalAmount) }}</strong></td>
                <td><app-badge [text]="so.salesStatus"></app-badge></td>
                <td><app-badge [text]="so.paymentStatus"></app-badge></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 2. Recent Procurement Orders Table -->
        <div class="table-responsive" *ngIf="activeActivityTab === 'procurement'">
          <table class="erp-table">
            <thead>
              <tr>
                <th>PO #</th>
                <th>Supplier / Vendor</th>
                <th>Order Date</th>
                <th>Delivery Date</th>
                <th>Order Value</th>
                <th>Procurement Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let po of purchaseOrdersList(); trackBy: trackById">
                <td><strong class="font-mono">{{ po.poNumber }}</strong></td>
                <td>{{ po.supplierName }}</td>
                <td>{{ po.orderDate }}</td>
                <td>{{ po.expectedDeliveryDate }}</td>
                <td><strong>{{ formatCurrency(po.totalAmount) }}</strong></td>
                <td><app-badge [text]="po.status"></app-badge></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 3. Recent Customer Invoices Table -->
        <div class="table-responsive" *ngIf="activeActivityTab === 'invoices'">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Invoice Date</th>
                <th>Due Date</th>
                <th>Total Billed</th>
                <th>Outstanding</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let inv of invoicesList(); trackBy: trackById">
                <td><strong class="font-mono">{{ inv.invoiceNumber }}</strong></td>
                <td>{{ inv.customerName }}</td>
                <td>{{ inv.invoiceDate }}</td>
                <td>{{ inv.dueDate }}</td>
                <td><strong>{{ formatCurrency(inv.totalAmount) }}</strong></td>
                <td class="text-warning font-bold">{{ formatCurrency(inv.outstandingAmount) }}</td>
                <td><app-badge [text]="inv.paymentStatus"></app-badge></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 4. Recent Stock Movements Table -->
        <div class="table-responsive" *ngIf="activeActivityTab === 'movements'">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Movement ID</th>
                <th>Product SKU / Name</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reference</th>
                <th>Date</th>
                <th>Performed By</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sm of stockMovementsList(); trackBy: trackById">
                <td><span class="font-mono">{{ sm.movementId }}</span></td>
                <td><strong>{{ sm.productName }}</strong> ({{ sm.sku }})</td>
                <td>
                  <span class="badge" [ngClass]="sm.type === 'IN' ? 'badge-success' : (sm.type === 'OUT' ? 'badge-danger' : 'badge-info')">
                    {{ sm.type }}
                  </span>
                </td>
                <td><strong>{{ sm.type === 'IN' ? '+' : '-' }}{{ sm.quantity }}</strong></td>
                <td><code>{{ sm.referenceId }}</code></td>
                <td>{{ sm.date }}</td>
                <td>{{ sm.performedBy }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 5. Recent Financial Transactions Table -->
        <div class="table-responsive" *ngIf="activeActivityTab === 'financial'">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Transaction Reference</th>
                <th>Category</th>
                <th>Description</th>
                <th>Date</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let exp of expensesList(); trackBy: trackById">
                <td><span class="font-mono">{{ exp.expenseId }}</span></td>
                <td>{{ exp.category }}</td>
                <td>{{ exp.title }}</td>
                <td>{{ exp.expenseDate }}</td>
                <td>{{ exp.paymentMethod }}</td>
                <td class="text-danger font-bold">-{{ formatCurrency(exp.amount) }}</td>
                <td><app-badge [text]="exp.status"></app-badge></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 6. Recent Personnel & Leaves Table -->
        <div class="table-responsive" *ngIf="activeActivityTab === 'hr'">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Applied Date</th>
                <th>Approval Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let lr of leaveRequestsList(); trackBy: trackById">
                <td><span class="font-mono">{{ lr.requestId }}</span></td>
                <td><strong>{{ lr.employeeName }}</strong></td>
                <td>{{ lr.departmentName }}</td>
                <td>{{ lr.leaveType }}</td>
                <td>{{ lr.days }} day(s)</td>
                <td>{{ lr.appliedDate }}</td>
                <td><app-badge [text]="lr.status"></app-badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .welcome-banner {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #ffffff;
      border-radius: 14px;
      padding: 24px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .page-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .page-subtitle {
      font-size: 0.875rem;
      color: #94a3b8;
    }
    .page-subtitle strong {
      color: #60a5fa;
    }
    .quick-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .section-heading {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--erp-text-heading);
      margin-bottom: 14px;
    }
    .alerts-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .alert-strip {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 0.875rem;
    }
    .warning-strip {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .info-strip {
      background: #e0f2fe;
      color: #075985;
      border: 1px solid #bae6fd;
    }
    .purple-strip {
      background: #f3e8ff;
      color: #6b21a8;
      border: 1px solid #e9d5ff;
    }
    .danger-strip {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .strip-content {
      flex: 1;
    }
    .strip-link {
      font-weight: 600;
      text-decoration: underline;
    }
    .activity-tabs-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .tab-btn-sm {
      background: var(--erp-bg-subtle);
      border: 1px solid var(--erp-border);
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--erp-text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .tab-btn-sm:hover {
      background: var(--erp-bg-hover);
      color: var(--erp-text);
    }
    .tab-btn-sm.active {
      background: var(--erp-primary);
      color: #ffffff;
      border-color: var(--erp-primary);
    }
    .badge-info {
      background: #e0f2fe;
      color: #0369a1;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-success {
      background: #dcfce7;
      color: #15803d;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }
  `]
})
export class DashboardComponent {
  auth = inject(AuthService);
  employeeService = inject(EmployeeService);
  deptService = inject(DepartmentService);
  leaveService = inject(LeaveService);
  inventoryService = inject(InventoryService);
  supplierService = inject(SupplierService);
  procurementService = inject(ProcurementService);
  salesService = inject(SalesService);
  invoiceService = inject(InvoiceService);
  financeService = inject(FinanceService);
  expenseService = inject(ExpenseService);

  activeActivityTab: 'sales' | 'procurement' | 'invoices' | 'movements' | 'financial' | 'hr' = 'sales';

  // Memoized activity slices
  salesOrdersList = computed(() => this.salesService.salesOrders().slice(0, 6));
  purchaseOrdersList = computed(() => this.procurementService.purchaseOrders().slice(0, 6));
  invoicesList = computed(() => this.invoiceService.invoices().slice(0, 6));
  stockMovementsList = computed(() => this.inventoryService.stockMovements().slice(0, 6));
  expensesList = computed(() => this.expenseService.expenses().slice(0, 6));
  leaveRequestsList = computed(() => this.leaveService.leaveRequests().slice(0, 6));

  formatCurrency(val: number): string {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  }

  trackById(index: number, item: any): string {
    return item.id || item.orderNumber || item.poNumber || item.invoiceNumber || item.movementId || item.expenseId || item.requestId || index;
  }

  // 1. Monthly Sales Bar Chart (Memoized Signal)
  monthlySalesData = computed(() => {
    return {
      labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
      datasets: [
        {
          label: 'Sales Volume (₹)',
          data: [450000, 620000, 710000, 890000, 940000, this.salesService.totalSalesVolume()],
          backgroundColor: '#3b82f6',
          borderRadius: 6
        }
      ]
    };
  });

  // 2. Revenue vs Expenses Line Chart (Memoized Signal)
  revExpChartData = computed(() => {
    const trends = this.financeService.getMonthlyFinancialTrends();
    return {
      labels: trends.labels,
      datasets: [
        {
          label: 'Collected Cash Revenue (₹)',
          data: trends.revenue,
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          fill: true,
          tension: 0.3
        },
        {
          label: 'Total Expenses (₹)',
          data: trends.expenses,
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          fill: true,
          tension: 0.3
        }
      ]
    };
  });

  // 3. Inventory Category Doughnut Chart (Memoized Signal)
  categoryChartData = computed(() => {
    const counts: { [cat: string]: number } = {};
    this.inventoryService.products().forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return {
      labels: Object.keys(counts),
      datasets: [
        {
          data: Object.values(counts),
          backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b']
        }
      ]
    };
  });

  // 4. Employee Department Doughnut Chart (Memoized Signal)
  departmentChartData = computed(() => {
    const counts: { [dept: string]: number } = {};
    this.employeeService.employees().forEach(e => {
      if (e.employmentStatus !== 'Terminated') {
        counts[e.departmentName] = (counts[e.departmentName] || 0) + 1;
      }
    });
    return {
      labels: Object.keys(counts),
      datasets: [
        {
          data: Object.values(counts),
          backgroundColor: ['#3b82f6', '#0d9488', '#f97316', '#6366f1', '#14b8a6']
        }
      ]
    };
  });

  // 5. Leave Request Status Chart (Memoized Signal)
  leaveStatusChartData = computed(() => {
    const pending = this.leaveService.pendingLeavesCount();
    const approved = this.leaveService.approvedLeavesCount();
    const rejected = this.leaveService.rejectedLeavesCount();
    return {
      labels: ['Approved', 'Pending', 'Rejected'],
      datasets: [
        {
          data: [approved, pending, rejected],
          backgroundColor: ['#16a34a', '#f59e0b', '#dc2626']
        }
      ]
    };
  });

  // 6. Purchase Order Status Chart (Memoized Signal)
  poStatusChartData = computed(() => {
    const pos = this.procurementService.purchaseOrders();
    const counts: { [status: string]: number } = {};
    pos.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return {
      labels: Object.keys(counts),
      datasets: [
        {
          data: Object.values(counts),
          backgroundColor: ['#16a34a', '#f59e0b', '#2563eb', '#9333ea', '#64748b', '#dc2626']
        }
      ]
    };
  });
}

