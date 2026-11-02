import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReportService } from '../../../core/services/report.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

type ReportType =
  | 'sales'
  | 'purchase'
  | 'revenue'
  | 'expense'
  | 'pnl'
  | 'receivables'
  | 'inventory'
  | 'payroll';

@Component({
  selector: 'app-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IconComponent, BadgeComponent],
  template: `
    <div class="reports-page">
      <!-- Page Header -->
      <div class="erp-card-header no-print">
        <div>
          <h2 class="erp-card-title">Financial Statements & Analytics Reports</h2>
          <p class="erp-card-subtitle">Generate regulatory audit reports, P&L statements, inventory valuations, and export to CSV</p>
        </div>
        <div class="header-btn-row">
          <button type="button" class="btn btn-secondary" (click)="printReport()">
            <app-icon name="printer" [size]="16"></app-icon>
            <span>Print Report</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="exportReport()">
            <app-icon name="download" [size]="16"></app-icon>
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      <!-- Report Selection Tabs -->
      <div class="report-tabs-bar no-print">
        <button
          type="button"
          class="report-tab-btn"
          *ngFor="let rep of reportTabs; trackBy: trackByTab"
          [class.active]="selectedReport === rep.id"
          (click)="selectReport(rep.id)"
        >
          <app-icon [name]="rep.icon" [size]="15"></app-icon>
          <span>{{ rep.label }}</span>
        </button>
      </div>

      <!-- Filters Strip -->
      <div class="erp-card filters-card no-print">
        <div class="filter-row">
          <div class="filter-item">
            <label class="filter-lbl">From Date:</label>
            <input type="date" [(ngModel)]="startDate" (change)="refreshData()" class="form-control" />
          </div>

          <div class="filter-item">
            <label class="filter-lbl">To Date:</label>
            <input type="date" [(ngModel)]="endDate" (change)="refreshData()" class="form-control" />
          </div>

          <div class="filter-item" *ngIf="selectedReport === 'expense'">
            <label class="filter-lbl">Cost Center Category:</label>
            <select [(ngModel)]="categoryFilter" (change)="refreshData()" class="form-select">
              <option value="All">All Categories</option>
              <option value="Software Licenses">Software Licenses</option>
              <option value="Rent & Lease">Rent & Lease</option>
              <option value="Utilities">Utilities</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Marketing">Marketing</option>
              <option value="Travel & Logistics">Travel & Logistics</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Salaries">Salaries</option>
            </select>
          </div>

          <div class="filter-item" *ngIf="selectedReport === 'payroll'">
            <label class="filter-lbl">Filter Department:</label>
            <select [(ngModel)]="deptFilter" (change)="refreshData()" class="form-select">
              <option value="All">All Departments</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Supply Chain & Inventory">Supply Chain & Inventory</option>
              <option value="Sales & Marketing">Sales & Marketing</option>
              <option value="Finance & Accounts">Finance & Accounts</option>
              <option value="Engineering & Technology">Engineering & Technology</option>
            </select>
          </div>

          <div class="filter-item filter-actions">
            <button type="button" class="btn btn-secondary btn-sm" (click)="resetFilters()">
              <app-icon name="refresh-cw" [size]="14"></app-icon> Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Printable Report Document Container -->
      <div class="erp-card report-document">
        <div class="report-doc-header">
          <div class="doc-title-block">
            <span class="company-name">HCL ENTERPRISE SOLUTIONS PRIVATE LIMITED</span>
            <h2 class="report-main-title">{{ activeReportData?.title }}</h2>
            <div class="doc-timestamp">Generated on: {{ activeReportData?.generatedAt }} &bull; Confidential Internal Report</div>
          </div>
          <div class="doc-watermark">
            <app-icon name="file-text" [size]="32"></app-icon>
          </div>
        </div>

        <!-- Summary KPI Metrics for the Report -->
        <div class="report-summary-grid" *ngIf="activeReportData?.summary">
          <div class="rep-sum-card" *ngFor="let item of summaryEntries; trackBy: trackByFirst">
            <span class="sum-key">{{ formatKey(item[0]) }}</span>
            <span class="sum-val">{{ formatVal(item[1]) }}</span>
          </div>
        </div>

        <!-- Profit and Loss Special Table -->
        <div *ngIf="selectedReport === 'pnl'" class="pnl-statement-wrap">
          <table class="erp-table pnl-table">
            <thead>
              <tr>
                <th>Accounting Line Description</th>
                <th>Type</th>
                <th class="text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let line of activeReportData?.breakdown; trackBy: trackByItem">
                <td><strong>{{ line.item }}</strong></td>
                <td>
                  <app-badge [text]="line.type" [variant]="line.type === 'Credit' ? 'success' : (line.type === 'Debit' ? 'danger' : 'neutral')"></app-badge>
                </td>
                <td class="text-right font-mono">
                  <strong [ngClass]="line.type === 'Credit' ? 'text-success' : (line.type === 'Debit' ? 'text-danger' : '')">
                    {{ line.type === 'Debit' ? '-' : '+' }}₹{{ line.amount.toLocaleString('en-IN') }}
                  </strong>
                </td>
              </tr>
              <tr class="pnl-net-row">
                <td colspan="2"><strong>NET OPERATING PROFIT (Cash Collections - Total Outflow)</strong></td>
                <td class="text-right font-mono">
                  <strong [ngClass]="activeReportData?.summary?.netProfit >= 0 ? 'text-success' : 'text-danger'">
                    ₹{{ activeReportData?.summary?.netProfit.toLocaleString('en-IN') }}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Standard Tabular Rows Report -->
        <div class="table-responsive" *ngIf="selectedReport !== 'pnl' && activeReportData?.rows">
          <table class="erp-table">
            <thead>
              <tr>
                <th *ngFor="let col of tableColumns; trackBy: trackByCol">
                  {{ formatKey(col) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of activeReportData.rows; trackBy: trackByRow">
                <td *ngFor="let col of tableColumns; trackBy: trackByCol">
                  <span *ngIf="isStatusField(col)">
                    <app-badge [text]="row[col]"></app-badge>
                  </span>
                  <span *ngIf="!isStatusField(col) && isCurrencyField(col)">
                    <strong>₹{{ row[col].toLocaleString('en-IN') }}</strong>
                  </span>
                  <span *ngIf="!isStatusField(col) && !isCurrencyField(col)">
                    {{ row[col] }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .header-btn-row {
      display: flex;
      gap: 10px;
    }
    .report-tabs-bar {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .report-tab-btn {
      display: flex;
      align-items: center;
      gap: 7px;
      background: var(--erp-card-bg);
      border: 1px solid var(--erp-border);
      border-radius: 8px;
      padding: 9px 14px;
      font-size: 0.825rem;
      font-weight: 500;
      color: var(--erp-text);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .report-tab-btn:hover {
      background: var(--erp-bg-hover);
      color: var(--erp-text-heading);
    }
    .report-tab-btn.active {
      background: var(--erp-primary);
      color: #ffffff;
      border-color: var(--erp-primary);
    }
    .filters-card {
      padding: 14px 20px;
    }
    .filter-row {
      display: flex;
      align-items: flex-end;
      gap: 14px;
      flex-wrap: wrap;
    }
    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .filter-lbl {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--erp-text-muted);
    }
    .filter-actions {
      margin-left: auto;
    }
    .report-document {
      background: var(--erp-card-bg);
      padding: 28px;
    }
    .report-doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--erp-border);
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .company-name {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--erp-text-muted);
      text-transform: uppercase;
    }
    .report-main-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--erp-text-heading);
      margin: 4px 0 2px;
    }
    .doc-timestamp {
      font-size: 0.775rem;
      color: var(--erp-text-muted);
    }
    .doc-watermark {
      color: var(--erp-border);
    }
    .report-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }
    .rep-sum-card {
      background: var(--erp-bg-subtle);
      border: 1px solid var(--erp-border);
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
    }
    .sum-key {
      font-size: 0.725rem;
      font-weight: 600;
      color: var(--erp-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .sum-val {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--erp-text-heading);
      margin-top: 4px;
    }
    .font-mono { font-family: var(--erp-font-mono); }
    .text-right { text-align: right; }
    .text-success { color: #16a34a !important; }
    .text-danger { color: #dc2626 !important; }

    .pnl-net-row td {
      border-top: 2px solid var(--erp-text-heading);
      font-size: 1.05rem;
      padding: 14px 16px;
    }
  `]
})
export class ReportsComponent implements OnInit, OnDestroy {
  reportService = inject(ReportService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private querySub?: Subscription;

  reportTabs: Array<{ id: ReportType; label: string; icon: string }> = [
    { id: 'sales', label: '1. Sales Orders Report', icon: 'shopping-cart' },
    { id: 'purchase', label: '2. Purchase Orders Report', icon: 'box' },
    { id: 'revenue', label: '3. Cash Revenue Report', icon: 'dollar-sign' },
    { id: 'expense', label: '4. Expenditure Report', icon: 'credit-card' },
    { id: 'pnl', label: '5. Profit & Loss Statement', icon: 'trending-up' },
    { id: 'receivables', label: '6. Outstanding Receivables', icon: 'clock' },
    { id: 'inventory', label: '7. Inventory Valuation', icon: 'layers' },
    { id: 'payroll', label: '8. Employee Salary Payroll', icon: 'users' }
  ];

  selectedReport: ReportType = 'sales';
  startDate = '2026-09-01';
  endDate = '2026-11-30';
  categoryFilter = 'All';
  deptFilter = 'All';

  activeReportData: any = null;
  tableColumns: string[] = [];
  summaryEntries: [string, any][] = [];

  trackByTab(index: number, tab: any): string {
    return tab.id;
  }

  trackByRow(index: number, row: any): any {
    return row?.id || row?.orderNumber || row?.invoiceNumber || row?.expenseId || row?.employeeId || index;
  }

  trackByCol(index: number, col: string): string {
    return col;
  }

  trackByFirst(index: number, item: [string, any]): string {
    return item[0];
  }

  trackByItem(index: number, line: any): string {
    return line.item || index.toString();
  }

  ngOnInit(): void {
    this.querySub = this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.selectedReport = params['type'] as ReportType;
        this.refreshData();
      }
    });
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
  }

  constructor() {
    this.refreshData();
  }

  selectReport(repId: ReportType): void {
    this.selectedReport = repId;
    this.refreshData();
  }

  refreshData(): void {
    const filter = {
      startDate: this.startDate,
      endDate: this.endDate
    };

    switch (this.selectedReport) {
      case 'sales':
        this.activeReportData = this.reportService.getSalesReport(filter);
        break;
      case 'purchase':
        this.activeReportData = this.reportService.getPurchaseReport(filter);
        break;
      case 'revenue':
        this.activeReportData = this.reportService.getRevenueReport(filter);
        break;
      case 'expense':
        this.activeReportData = this.reportService.getExpenseReport({ ...filter, category: this.categoryFilter });
        break;
      case 'pnl':
        this.activeReportData = this.reportService.getProfitAndLossReport();
        break;
      case 'receivables':
        this.activeReportData = this.reportService.getOutstandingInvoiceReport();
        break;
      case 'inventory':
        this.activeReportData = this.reportService.getInventoryValuationReport();
        break;
      case 'payroll':
        this.activeReportData = this.reportService.getEmployeeSalaryReport(this.deptFilter);
        break;
    }

    this.summaryEntries = this.activeReportData?.summary ? Object.entries(this.activeReportData.summary) : [];
    this.tableColumns = this.activeReportData?.rows && this.activeReportData.rows.length > 0 ? Object.keys(this.activeReportData.rows[0]) : [];
    this.cdr.markForCheck();
  }

  resetFilters(): void {
    this.startDate = '2026-09-01';
    this.endDate = '2026-11-30';
    this.categoryFilter = 'All';
    this.deptFilter = 'All';
    this.refreshData();
  }

  getSummaryEntries(obj: any): [string, any][] {
    if (!obj) return [];
    return Object.entries(obj);
  }

  getTableColumns(rows: any[]): string[] {
    if (!rows || rows.length === 0) return [];
    return Object.keys(rows[0]);
  }

  formatKey(str: string): string {
    return str.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
  }

  formatVal(val: any): string {
    if (typeof val === 'number') {
      return val > 999 ? '₹' + Math.round(val).toLocaleString('en-IN') : String(val);
    }
    return String(val);
  }

  isStatusField(col: string): boolean {
    const c = col.toLowerCase();
    return c.includes('status');
  }

  isCurrencyField(col: string): boolean {
    const c = col.toLowerCase();
    return c.includes('salary') || c.includes('price') || c.includes('cost') ||
           c.includes('amount') || c.includes('subtotal') || c.includes('tax') ||
           c.includes('discount') || c.includes('total') || c.includes('valuation') ||
           c.includes('balance');
  }

  printReport(): void {
    window.print();
  }

  exportReport(): void {
    if (this.selectedReport === 'pnl') {
      const rows = this.activeReportData.breakdown.map((b: any) => ({
        LineItem: b.item,
        Type: b.type,
        Amount: b.amount
      }));
      this.reportService.exportToCSV('Profit_and_Loss_Report', rows);
    } else if (this.activeReportData?.rows) {
      this.reportService.exportToCSV(`${this.selectedReport}_Report`, this.activeReportData.rows);
    }
  }
}

