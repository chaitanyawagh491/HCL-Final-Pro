import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FinanceService } from '../../../core/services/finance.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { ProcurementService } from '../../../core/services/procurement.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatCardComponent, ChartComponent, BadgeComponent, IconComponent],
  template: `
    <div class="finance-page">
      <!-- Page Header -->
      <div class="erp-card-header">
        <div>
          <h2 class="erp-card-title">Corporate Finance & Treasury Dashboard</h2>
          <p class="erp-card-subtitle">Real-time accounting balance, collected cash revenues, expenditures, and net profitability</p>
        </div>
        <div class="header-btn-row">
          <a routerLink="/finance/expenses" class="btn btn-secondary btn-sm">
            <app-icon name="credit-card" [size]="15"></app-icon>
            <span>Manage Expenses</span>
          </a>
          <a routerLink="/finance/reports" class="btn btn-primary btn-sm">
            <app-icon name="bar-chart" [size]="15"></app-icon>
            <span>Financial Statements</span>
          </a>
        </div>
      </div>

      <!-- Financial Principles Statement Card -->
      <div class="accounting-rule-banner">
        <app-icon name="alert-circle" [size]="20"></app-icon>
        <div>
          <strong>Accounting Principle Enforced (Cash Basis & Reconciled Accrual):</strong>
          Revenue represents strictly collected and reconciled cash payments from client invoices (₹{{ Math.round(financeService.totalRevenue()).toLocaleString('en-IN') }}).
          Unpaid invoices (₹{{ Math.round(financeService.outstandingReceivables()).toLocaleString('en-IN') }}) are tracked separately as Accounts Receivable and are not treated as collected cash.
        </div>
      </div>

      <!-- Core Finance KPIs -->
      <div class="grid-cols-4">
        <app-stat-card
          title="Total Cash Revenue"
          [value]="formatCurrency(financeService.totalRevenue())"
          icon="dollar-sign"
          variant="success"
          subtitle="Reconciled collections"
          [trend]="{ text: '+14.2% Month-over-Month', isPositive: true }"
        ></app-stat-card>

        <app-stat-card
          title="Total Expenditure"
          [value]="formatCurrency(financeService.totalExpenses())"
          icon="credit-card"
          variant="danger"
          subtitle="Operating + Procurement"
        ></app-stat-card>

        <app-stat-card
          title="Net Corporate Profit"
          [value]="formatCurrency(financeService.netProfit())"
          icon="trending-up"
          [variant]="financeService.netProfit() >= 0 ? 'success' : 'danger'"
          [subtitle]="'Net Profit Margin: ' + calculateMargin() + '%'"
        ></app-stat-card>

        <app-stat-card
          title="Outstanding Receivables"
          [value]="formatCurrency(financeService.outstandingReceivables())"
          icon="clock"
          variant="warning"
          subtitle="Pending client payments"
        ></app-stat-card>
      </div>

      <!-- Secondary Metrics -->
      <div class="grid-cols-4">
        <div class="metric-mini-card">
          <span class="m-lbl">Gross Invoiced Billed</span>
          <span class="m-val text-primary">₹{{ Math.round(financeService.totalInvoicedSales()).toLocaleString('en-IN') }}</span>
          <span class="m-sub">{{ invoiceService.totalInvoicesCount() }} Total Invoices</span>
        </div>

        <div class="metric-mini-card">
          <span class="m-lbl">Operating Overheads</span>
          <span class="m-val">₹{{ Math.round(financeService.totalOperationalExpenses()).toLocaleString('en-IN') }}</span>
          <span class="m-sub">Rent, IT, Utilities, Legal</span>
        </div>

        <div class="metric-mini-card">
          <span class="m-lbl">Procurement Spend</span>
          <span class="m-val">₹{{ Math.round(financeService.totalPurchaseSpend()).toLocaleString('en-IN') }}</span>
          <span class="m-sub">Delivered Vendor POs</span>
        </div>

        <div class="metric-mini-card">
          <span class="m-lbl">Monthly Payroll Obligation</span>
          <span class="m-val">₹{{ Math.round(financeService.monthlyPayroll()).toLocaleString('en-IN') }}</span>
          <span class="m-sub">{{ employeeService.activeEmployees() }} Active Staff Members</span>
        </div>
      </div>

      <!-- Finance Charts Section -->
      <div class="grid-cols-2">
        <!-- Monthly Trend Line Chart -->
        <div class="erp-card">
          <div class="erp-card-header">
            <div>
              <h4 class="erp-card-title">Cash Revenue vs. Total Outflow (Expenses)</h4>
              <p class="erp-card-subtitle">Monthly dynamic cash flow comparison</p>
            </div>
            <span class="badge badge-success">Cash Performance</span>
          </div>
          <app-chart
            type="line"
            [labels]="cashFlowChartData.labels"
            [datasets]="cashFlowChartData.datasets"
            [height]="260"
          ></app-chart>
        </div>

        <!-- Expense Category Breakdown Doughnut -->
        <div class="erp-card">
          <div class="erp-card-header">
            <div>
              <h4 class="erp-card-title">Operating Expenditure Breakdown</h4>
              <p class="erp-card-subtitle">Expense distribution by overhead category</p>
            </div>
            <span class="badge badge-info">Cost Centers</span>
          </div>
          <app-chart
            type="doughnut"
            [labels]="expenseDistChartData.labels"
            [datasets]="expenseDistChartData.datasets"
            [height]="260"
          ></app-chart>
        </div>
      </div>

      <!-- Recent Payments & Invoices Split Tables -->
      <div class="grid-cols-2">
        <!-- Latest Collected Payments -->
        <div class="erp-card">
          <div class="erp-card-header">
            <h4 class="erp-card-title">Recent Cash Receipts & Payments</h4>
            <a routerLink="/sales/invoices" class="btn btn-outline-primary btn-xs">View All &rarr;</a>
          </div>
          <div class="table-responsive">
            <table class="erp-table">
              <thead>
                <tr>
                  <th>Receipt ID</th>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <ng-container *ngFor="let inv of invoiceService.invoices()">
                  <tr *ngFor="let pay of inv.payments">
                    <td><strong class="font-mono">{{ pay.paymentId }}</strong></td>
                    <td><span class="font-mono text-muted">{{ inv.invoiceNumber }}</span></td>
                    <td>{{ pay.paymentDate }}</td>
                    <td>{{ pay.paymentMethod }}</td>
                    <td><strong class="text-success">+₹{{ pay.amount.toLocaleString('en-IN') }}</strong></td>
                  </tr>
                </ng-container>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Unpaid & Overdue Invoices -->
        <div class="erp-card">
          <div class="erp-card-header">
            <h4 class="erp-card-title">Pending & Overdue Receivables</h4>
            <a routerLink="/sales/invoices" class="btn btn-outline-primary btn-xs">Manage Dues &rarr;</a>
          </div>
          <div class="table-responsive">
            <table class="erp-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Due Date</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let inv of pendingInvoicesList">
                  <td><strong class="font-mono">{{ inv.invoiceNumber }}</strong></td>
                  <td>{{ inv.customerName }}</td>
                  <td>{{ inv.dueDate }}</td>
                  <td><strong class="text-danger">₹{{ inv.outstandingAmount.toLocaleString('en-IN') }}</strong></td>
                  <td><app-badge [text]="inv.paymentStatus"></app-badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .finance-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .header-btn-row {
      display: flex;
      gap: 10px;
    }
    .accounting-rule-banner {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 12px 16px;
      color: #1e40af;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.85rem;
      line-height: 1.45;
    }
    .metric-mini-card {
      background: var(--erp-card-bg);
      border: 1px solid var(--erp-border);
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
    }
    .m-lbl {
      font-size: 0.725rem;
      font-weight: 600;
      color: var(--erp-text-muted);
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .m-val {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--erp-text-heading);
    }
    .m-sub {
      font-size: 0.75rem;
      color: var(--erp-text-muted);
      margin-top: 4px;
    }
    .text-primary { color: #2563eb !important; }
    .text-success { color: #16a34a !important; }
    .text-danger { color: #dc2626 !important; }
    .font-mono { font-family: var(--erp-font-mono); }
    .btn-xs { padding: 4px 10px; font-size: 0.75rem; }
    .badge-success { background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; }
    .badge-info { background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; }
  `]
})
export class FinanceDashboardComponent {
  financeService = inject(FinanceService);
  invoiceService = inject(InvoiceService);
  expenseService = inject(ExpenseService);
  procurementService = inject(ProcurementService);
  employeeService = inject(EmployeeService);

  Math = Math;

  formatCurrency(val: number): string {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  }

  calculateMargin(): string {
    const rev = this.financeService.totalRevenue();
    const net = this.financeService.netProfit();
    if (rev <= 0) return '0.0';
    return ((net / rev) * 100).toFixed(1);
  }

  get pendingInvoicesList() {
    return this.invoiceService.invoices()
      .filter(i => i.outstandingAmount > 0)
      .slice(0, 5);
  }

  get cashFlowChartData() {
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
          label: 'Total Expenditures (₹)',
          data: trends.expenses,
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          fill: true,
          tension: 0.3
        }
      ]
    };
  }

  get expenseDistChartData() {
    const categoryTotals: { [cat: string]: number } = {};
    this.expenseService.expenses().forEach(e => {
      if (e.status === 'Paid') {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
      }
    });

    return {
      labels: Object.keys(categoryTotals),
      datasets: [
        {
          data: Object.values(categoryTotals),
          backgroundColor: [
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#ef4444',
            '#8b5cf6',
            '#ec4899',
            '#06b6d4',
            '#64748b'
          ]
        }
      ]
    };
  }
}

