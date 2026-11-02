import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmployeeService } from '../../../core/services/employee.service';
import { LeaveService } from '../../../core/services/leave.service';
import { ProcurementService } from '../../../core/services/procurement.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { SalesService } from '../../../core/services/sales.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import { FinanceService } from '../../../core/services/finance.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-workflow-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="workflows-page">
      <div class="erp-card-header">
        <div>
          <h2 class="erp-card-title">Enterprise Business Process Workflows</h2>
          <p class="erp-card-subtitle">Visual state transitions showing the end-to-end integration across all 4 ERP modules</p>
        </div>
      </div>

      <!-- 1. HR & Leave Workflow -->
      <div class="erp-card workflow-card">
        <div class="wf-header">
          <div class="wf-icon hr-icon">
            <app-icon name="users" [size]="22"></app-icon>
          </div>
          <div>
            <h3 class="wf-title">1. Human Resource & Leave Lifecycle</h3>
            <p class="wf-sub">Employee Onboarding &rarr; Leave Application &rarr; Manager Review &rarr; Automatic Balance Deduction</p>
          </div>
          <span class="badge badge-info ml-auto">HR Module</span>
        </div>

        <div class="steps-flow">
          <div class="step-node completed">
            <div class="step-circle"><app-icon name="check" [size]="14"></app-icon></div>
            <div class="step-title">Employee Created</div>
            <div class="step-desc">{{ employeeService.totalEmployees() }} Profiles in Database</div>
          </div>

          <div class="step-connector"></div>

          <div class="step-node completed">
            <div class="step-circle"><app-icon name="check" [size]="14"></app-icon></div>
            <div class="step-title">Leave Applied</div>
            <div class="step-desc">Validated for Date Overlaps</div>
          </div>

          <div class="step-connector"></div>

          <div class="step-node" [class.active-pending]="leaveService.pendingLeavesCount() > 0" [class.completed]="leaveService.pendingLeavesCount() === 0">
            <div class="step-circle">
              <app-icon [name]="leaveService.pendingLeavesCount() > 0 ? 'clock' : 'check'" [size]="14"></app-icon>
            </div>
            <div class="step-title">HR Approval</div>
            <div class="step-desc">
              <span *ngIf="leaveService.pendingLeavesCount() > 0" class="text-warning font-bold">
                {{ leaveService.pendingLeavesCount() }} Pending Review
              </span>
              <span *ngIf="leaveService.pendingLeavesCount() === 0" class="text-success">All Reviewed</span>
            </div>
          </div>

          <div class="step-connector"></div>

          <div class="step-node completed">
            <div class="step-circle"><app-icon name="check" [size]="14"></app-icon></div>
            <div class="step-title">Balance Updated</div>
            <div class="step-desc">Quotas Accrued Dynamically</div>
          </div>
        </div>

        <div class="wf-footer">
          <span class="wf-status-note">
            Pending Actions: <strong>{{ leaveService.pendingLeavesCount() }}</strong> leave request(s) awaiting managerial sign-off.
          </span>
          <a routerLink="/hr/leave" class="btn btn-outline-primary btn-xs">Open Leave Queue &rarr;</a>
        </div>
      </div>

      <!-- 2. Procurement & Inventory Workflow -->
      <div class="erp-card workflow-card">
        <div class="wf-header">
          <div class="wf-icon proc-icon">
            <app-icon name="shopping-cart" [size]="22"></app-icon>
          </div>
          <div>
            <h3 class="wf-title">2. Procurement & Inventory Replenishment Workflow</h3>
            <p class="wf-sub">Requisition &rarr; Vendor PO &rarr; Physical Intake &rarr; Automatic Stock Quantity Update</p>
          </div>
          <span class="badge badge-info ml-auto">Procurement Module</span>
        </div>

        <div class="steps-flow">
          <div class="step-node completed">
            <div class="step-circle"><app-icon name="check" [size]="14"></app-icon></div>
            <div class="step-title">Requisition Created</div>
            <div class="step-desc">Vendor & SKUs Selected</div>
          </div>

          <div class="step-connector"></div>

          <div class="step-node completed">
            <div class="step-circle"><app-icon name="check" [size]="14"></app-icon></div>
            <div class="step-title">Manager Approval</div>
            <div class="step-desc">Budget Authorization</div>
          </div>

          <div class="step-connector"></div>

          <div class="step-node" [class.active-pending]="procurementService.orderedCount() > 0" [class.completed]="procurementService.orderedCount() === 0">
            <div class="step-circle">
              <app-icon [name]="procurementService.orderedCount() > 0 ? 'truck' : 'check'" [size]="14"></app-icon>
            </div>
            <div class="step-title">Goods In-Transit</div>
            <div class="step-desc">
              <span *ngIf="procurementService.orderedCount() > 0" class="text-primary font-bold">
                {{ procurementService.orderedCount() }} Awaiting Receipt
              </span>
              <span *ngIf="procurementService.orderedCount() === 0">Dispatched</span>
            </div>
          </div>

          <div class="step-connector"></div>

          <div class="step-node completed">
            <div class="step-circle"><app-icon name="check" [size]="14"></app-icon></div>
            <div class="step-title">Inventory Stock Updated</div>
            <div class="step-desc">Movement Ledger Logged</div>
          </div>
        </div>

        <div class="wf-footer">
          <span class="wf-status-note">
            Pending Actions: <strong>{{ procurementService.orderedCount() }}</strong> active PO(s) ready for warehouse receiving.
          </span>
          <a routerLink="/inventory/procurement" class="btn btn-outline-primary btn-xs">Open Procurement &rarr;</a>
        </div>
      </div>

      <!-- 3. Sales & Fulfillment Workflow -->
      <div class="erp-card workflow-card">
        <div class="wf-header">
          <div class="wf-icon sales-icon">
            <app-icon name="box" [size]="22"></app-icon>
          </div>
          <div>
            <h3 class="wf-title">3. Sales Order, Stock Deduction & Invoice Workflow</h3>
            <p class="wf-sub">Sales Booking &rarr; Stock Checked & Reserved &rarr; Delivery &rarr; Tax Invoice &rarr; Payment Reconciled</p>
          </div>
          <span class="badge badge-info ml-auto">Sales Module</span>
        </div>

        <div class="steps-flow">
          <div class="step-node completed">
            <div class="step-circle"><app-icon name="check" [size]="14"></app-icon></div>
            <div class="step-title">Sales Order Placed</div>
            <div class="step-desc">Client Specifications</div>
          </div>

          <div class="step-connector"></div>

          <div class="step-node completed">
            <div class="step-circle"><app-icon name="check" [size]="14"></app-icon></div>
            <div class="step-title">Stock Deducted</div>
            <div class="step-desc">Inventory Protected</div>
          </div>

          <div class="step-connector"></div>

          <div class="step-node completed">
            <div class="step-circle"><app-icon name="check" [size]="14"></app-icon></div>
            <div class="step-title">Delivered</div>
            <div class="step-desc">Carrier Fulfillment</div>
          </div>

          <div class="step-connector"></div>

          <div class="step-node completed">
            <div class="step-circle"><app-icon name="check" [size]="14"></app-icon></div>
            <div class="step-title">Invoice Generated</div>
            <div class="step-desc">Tax Document Issued</div>
          </div>

          <div class="step-connector"></div>

          <div class="step-node" [class.active-pending]="invoiceService.unpaidInvoicesCount() > 0" [class.completed]="invoiceService.unpaidInvoicesCount() === 0">
            <div class="step-circle">
              <app-icon [name]="invoiceService.unpaidInvoicesCount() > 0 ? 'clock' : 'check'" [size]="14"></app-icon>
            </div>
            <div class="step-title">Payment Collected</div>
            <div class="step-desc">
              <span *ngIf="invoiceService.unpaidInvoicesCount() > 0" class="text-warning font-bold">
                {{ invoiceService.unpaidInvoicesCount() }} Open Invoices
              </span>
              <span *ngIf="invoiceService.unpaidInvoicesCount() === 0">All Reconciled</span>
            </div>
          </div>
        </div>

        <div class="wf-footer">
          <span class="wf-status-note">
            Pending Actions: <strong>₹{{ Math.round(invoiceService.totalOutstandingAmount()).toLocaleString('en-IN') }}</strong> outstanding receivables across customer accounts.
          </span>
          <a routerLink="/sales/invoices" class="btn btn-outline-primary btn-xs">View Open Invoices &rarr;</a>
        </div>
      </div>

      <!-- 4. Finance & Treasury Workflow -->
      <div class="erp-card workflow-card">
        <div class="wf-header">
          <div class="wf-icon fin-icon">
            <app-icon name="dollar-sign" [size]="22"></app-icon>
          </div>
          <div>
            <h3 class="wf-title">4. Finance, Revenue Recognition & Audit Workflow</h3>
            <p class="wf-sub">Payment Recorded &rarr; Revenue Updated (Cash Basis) &rarr; Overhead Factored &rarr; P&L Statement Updated</p>
          </div>
          <span class="badge badge-info ml-auto">Finance Module</span>
        </div>

        <div class="steps-flow">
          <div class="step-node completed">
            <div class="step-circle"><app-icon name="check" [size]="14"></app-icon></div>
            <div class="step-title">Payment Recorded</div>
            <div class="step-desc">Bank Reference Captured</div>
          </div>

          <div class="step-connector"></div>

          <div class="step-node completed">
            <div class="step-circle"><app-icon name="check" [size]="14"></app-icon></div>
            <div class="step-title">Cash Revenue Updated</div>
            <div class="step-desc">Strict Cash-basis Accounting</div>
          </div>

          <div class="step-connector"></div>

          <div class="step-node completed">
            <div class="step-circle"><app-icon name="check" [size]="14"></app-icon></div>
            <div class="step-title">Expenses Deducted</div>
            <div class="step-desc">Operating + Procurement Spend</div>
          </div>

          <div class="step-connector"></div>

          <div class="step-node completed">
            <div class="step-circle"><app-icon name="check" [size]="14"></app-icon></div>
            <div class="step-title">Financial Reports Updated</div>
            <div class="step-desc">Real-time P&L & Balance Sheet</div>
          </div>
        </div>

        <div class="wf-footer">
          <span class="wf-status-note">
            Current Net Profit: <strong>₹{{ Math.round(financeService.netProfit()).toLocaleString('en-IN') }}</strong> from total cash collections of ₹{{ Math.round(financeService.totalRevenue()).toLocaleString('en-IN') }}.
          </span>
          <a routerLink="/finance/reports" class="btn btn-outline-primary btn-xs">View P&L Report &rarr;</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workflows-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .workflow-card {
      padding: 24px;
    }
    .wf-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .wf-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .hr-icon { background: #eff6ff; color: #2563eb; }
    .proc-icon { background: #f0fdf4; color: #16a34a; }
    .sales-icon { background: #faf5ff; color: #9333ea; }
    .fin-icon { background: #fefce8; color: #ca8a04; }

    .wf-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--erp-text-heading);
      margin: 0 0 2px;
    }
    .wf-sub {
      font-size: 0.825rem;
      color: var(--erp-text-muted);
      margin: 0;
    }
    .ml-auto { margin-left: auto; }

    /* Steps Flow Visualizer */
    .steps-flow {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 24px;
      overflow-x: auto;
      padding: 10px 0;
    }
    .step-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      width: 140px;
      flex-shrink: 0;
    }
    .step-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--erp-bg-subtle);
      border: 2px solid var(--erp-border);
      color: var(--erp-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }
    .step-node.completed .step-circle {
      background: #dcfce7;
      border-color: #16a34a;
      color: #15803d;
    }
    .step-node.active-pending .step-circle {
      background: #fef3c7;
      border-color: #f59e0b;
      color: #b45309;
      animation: pulse 1.5s infinite;
    }
    .step-title {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--erp-text-heading);
      line-height: 1.25;
      margin-bottom: 4px;
    }
    .step-desc {
      font-size: 0.725rem;
      color: var(--erp-text-muted);
      line-height: 1.3;
    }
    .step-connector {
      flex: 1;
      height: 2px;
      background: var(--erp-border);
      margin-top: 15px;
      min-width: 20px;
    }
    .font-bold { font-weight: 700; }
    .text-warning { color: #d97706 !important; }
    .text-success { color: #16a34a !important; }
    .text-primary { color: #2563eb !important; }

    .wf-footer {
      border-top: 1px solid var(--erp-border);
      padding-top: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--erp-text-muted);
      flex-wrap: wrap;
      gap: 10px;
    }
    .btn-xs { padding: 4px 10px; font-size: 0.75rem; border-radius: 6px; }

    @keyframes pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
      70% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
    }
  `]
})
export class WorkflowOverviewComponent {
  employeeService = inject(EmployeeService);
  leaveService = inject(LeaveService);
  procurementService = inject(ProcurementService);
  inventoryService = inject(InventoryService);
  salesService = inject(SalesService);
  invoiceService = inject(InvoiceService);
  financeService = inject(FinanceService);

  Math = Math;
}
