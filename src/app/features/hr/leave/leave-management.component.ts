import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LeaveService } from '../../../core/services/leave.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { AuthService } from '../../../core/services/auth.service';
import { LeaveRequest, LeaveType } from '../../../core/models/erp.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-leave-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IconComponent, BadgeComponent, ModalComponent, EmptyStateComponent],
  template: `
    <div class="leave-page">
      <!-- Page Header -->
      <div class="erp-card-header">
        <div>
          <h2 class="erp-card-title">Leave & Attendance Management</h2>
          <p class="erp-card-subtitle">Apply for official leaves, manage employee quotas, and review approval workflows</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openApplyModal()">
          <app-icon name="plus" [size]="16"></app-icon>
          <span>Apply for Leave</span>
        </button>
      </div>

      <!-- User's own Leave Balances Card (Especially helpful for logged in employee) -->
      <div class="erp-card balance-summary-card" *ngIf="currentEmployee">
        <div class="user-greeting">
          <img [src]="currentEmployee.avatar" alt="Avatar" class="avatar-sm" />
          <div>
            <strong>{{ currentEmployee.fullName }}</strong> ({{ currentEmployee.designation }})
            <span class="text-muted d-block">{{ currentEmployee.departmentName }}</span>
          </div>
        </div>
        <div class="quotas-row">
          <div class="quota-pill">
            <span class="q-label">Casual Leave</span>
            <span class="q-val">{{ currentEmployee.casualLeaveBalance }} <small>days</small></span>
          </div>
          <div class="quota-pill">
            <span class="q-label">Sick Leave</span>
            <span class="q-val">{{ currentEmployee.sickLeaveBalance }} <small>days</small></span>
          </div>
          <div class="quota-pill">
            <span class="q-label">Earned Leave</span>
            <span class="q-val">{{ currentEmployee.earnedLeaveBalance }} <small>days</small></span>
          </div>
          <div class="quota-pill">
            <span class="q-label">Unpaid Taken</span>
            <span class="q-val">{{ currentEmployee.unpaidLeaveTaken }} <small>days</small></span>
          </div>
        </div>
      </div>

      <!-- Status Tabs -->
      <div class="tabs-nav">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'Pending'"
          (click)="activeTab = 'Pending'"
        >
          Pending Requests ({{ leaveService.pendingLeavesCount() }})
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'Approved'"
          (click)="activeTab = 'Approved'"
        >
          Approved History ({{ leaveService.approvedLeavesCount() }})
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'Rejected'"
          (click)="activeTab = 'Rejected'"
        >
          Rejected ({{ leaveService.rejectedLeavesCount() }})
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'All'"
          (click)="activeTab = 'All'"
        >
          All Requests ({{ leaveService.leaveRequests().length }})
        </button>
      </div>

      <!-- Feedback Alert -->
      <div class="alert-box alert-error" *ngIf="errorMessage">
        <app-icon name="alert-circle" [size]="18"></app-icon>
        <span>{{ errorMessage }}</span>
      </div>
      <div class="alert-box alert-success" *ngIf="successMessage">
        <app-icon name="check-circle" [size]="18"></app-icon>
        <span>{{ successMessage }}</span>
      </div>

      <!-- Leaves Table -->
      <div class="erp-card table-card">
        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Req ID</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Leave Category</th>
                <th>Duration (Dates)</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th *ngIf="canApprove" class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let leave of filteredLeaves">
                <td><span class="id-tag">{{ leave.requestId }}</span></td>
                <td><strong>{{ leave.employeeName }}</strong></td>
                <td>{{ leave.departmentName }}</td>
                <td>{{ leave.leaveType }}</td>
                <td>
                  <span class="date-range">{{ leave.startDate }} &rarr; {{ leave.endDate }}</span>
                </td>
                <td><strong>{{ leave.days }}</strong> day(s)</td>
                <td>{{ leave.reason }}</td>
                <td>{{ leave.appliedDate }}</td>
                <td>
                  <app-badge [text]="leave.status"></app-badge>
                </td>
                <td *ngIf="canApprove" class="text-right">
                  <div class="action-btn-group" *ngIf="leave.status === 'Pending'">
                    <button type="button" class="btn btn-success btn-xs" (click)="openReviewModal(leave, 'approve')">
                      Approve
                    </button>
                    <button type="button" class="btn btn-danger btn-xs" (click)="openReviewModal(leave, 'reject')">
                      Reject
                    </button>
                  </div>
                  <span *ngIf="leave.status !== 'Pending'" class="reviewed-meta">
                    Reviewed by {{ leave.reviewedBy || 'HR' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <app-empty-state
          *ngIf="filteredLeaves.length === 0"
          icon="calendar"
          title="No leave requests in this view"
          description="There are currently no leave applications matching the selected status tab."
          actionLabel="Apply for Leave"
          (actionClicked)="openApplyModal()"
        ></app-empty-state>
      </div>

      <!-- Apply Leave Modal -->
      <app-modal
        [isOpen]="showApplyModal"
        title="Apply for Employee Leave"
        subtitle="Dates are validated to prevent overlaps. Leave days will automatically deduct from balance upon approval."
        size="md"
        (closed)="showApplyModal = false"
      >
        <form [formGroup]="applyForm" (ngSubmit)="submitLeaveApplication()">
          <div class="form-group" *ngIf="canSelectAnyEmployee">
            <label class="form-label required">Employee</label>
            <select formControlName="employeeId" class="form-select" (change)="onEmployeeSelected($event)">
              <option *ngFor="let emp of employeeService.employees()" [value]="emp.employeeId">
                {{ emp.fullName }} ({{ emp.departmentName }} - {{ emp.designation }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label required">Leave Category</label>
            <select formControlName="leaveType" class="form-select">
              <option value="Casual Leave">Casual Leave (Balance: {{ selectedEmpQuota?.casualLeaveBalance ?? 12 }})</option>
              <option value="Sick Leave">Sick Leave (Balance: {{ selectedEmpQuota?.sickLeaveBalance ?? 10 }})</option>
              <option value="Earned Leave">Earned Leave (Balance: {{ selectedEmpQuota?.earnedLeaveBalance ?? 15 }})</option>
              <option value="Unpaid Leave">Unpaid Leave (Loss of Pay)</option>
              <option value="Maternity/Paternity Leave">Maternity/Paternity Leave</option>
            </select>
          </div>

          <div class="grid-cols-2">
            <div class="form-group">
              <label class="form-label required">Start Date</label>
              <input type="date" formControlName="startDate" class="form-control" (change)="updateCalculatedDays()" />
            </div>

            <div class="form-group">
              <label class="form-label required">End Date</label>
              <input type="date" formControlName="endDate" class="form-control" (change)="updateCalculatedDays()" />
            </div>
          </div>

          <!-- Calculated duration preview -->
          <div class="calc-days-box" *ngIf="calculatedDays > 0">
            <app-icon name="clock" [size]="16"></app-icon>
            <span>Calculated Duration: <strong>{{ calculatedDays }} day(s)</strong></span>
          </div>

          <div class="form-group">
            <label class="form-label required">Reason for Leave</label>
            <textarea formControlName="reason" class="form-control" rows="3" placeholder="Explain the purpose of this leave application"></textarea>
          </div>

          <div modal-footer>
            <button type="button" class="btn btn-secondary" (click)="showApplyModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="applyForm.invalid || calculatedDays <= 0">
              <app-icon name="check" [size]="16"></app-icon>
              <span>Submit Leave Request</span>
            </button>
          </div>
        </form>
      </app-modal>

      <!-- Review / Approve / Reject Modal -->
      <app-modal
        [isOpen]="showReviewModal"
        [title]="reviewAction === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'"
        [subtitle]="'Request ID: ' + selectedLeave?.requestId + ' for ' + selectedLeave?.employeeName"
        size="sm"
        (closed)="showReviewModal = false"
      >
        <div class="review-body">
          <p class="review-prompt">
            Are you sure you want to {{ reviewAction }} this <strong>{{ selectedLeave?.days }}-day {{ selectedLeave?.leaveType }}</strong> application?
          </p>
          <div class="form-group">
            <label class="form-label">Reviewer Remarks / Comments</label>
            <input type="text" [(ngModel)]="reviewComments" class="form-control" [placeholder]="reviewAction === 'approve' ? 'Approved by HR' : 'Specify rejection reason...'" />
          </div>
        </div>

        <div modal-footer>
          <button type="button" class="btn btn-secondary" (click)="showReviewModal = false">Cancel</button>
          <button
            type="button"
            class="btn"
            [ngClass]="reviewAction === 'approve' ? 'btn-success' : 'btn-danger'"
            (click)="executeReview()"
          >
            {{ reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection' }}
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .leave-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .balance-summary-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      padding: 16px 20px;
    }
    .user-greeting {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .avatar-sm {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
    }
    .quotas-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .quota-pill {
      background: var(--erp-bg-subtle);
      border: 1px solid var(--erp-border);
      border-radius: 8px;
      padding: 8px 14px;
      display: flex;
      flex-direction: column;
    }
    .q-label {
      font-size: 0.7rem;
      color: var(--erp-text-muted);
      font-weight: 600;
      text-transform: uppercase;
    }
    .q-val {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--erp-primary);
    }
    .q-val small {
      font-size: 0.75rem;
      font-weight: 400;
      color: var(--erp-text-muted);
    }
    .tabs-nav {
      display: flex;
      gap: 6px;
      border-bottom: 1px solid var(--erp-border);
      padding-bottom: 2px;
      overflow-x: auto;
    }
    .tab-btn {
      background: none;
      border: none;
      padding: 8px 16px;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--erp-text-muted);
      cursor: pointer;
      border-radius: 8px 8px 0 0;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .tab-btn:hover {
      color: var(--erp-text-heading);
      background: var(--erp-bg-hover);
    }
    .tab-btn.active {
      color: var(--erp-primary);
      font-weight: 600;
      border-bottom: 2px solid var(--erp-primary);
    }
    .alert-box {
      padding: 10px 14px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.85rem;
    }
    .alert-error {
      background: #fee2e2;
      border: 1px solid #fca5a5;
      color: #991b1b;
    }
    .alert-success {
      background: #dcfce7;
      border: 1px solid #86efac;
      color: #166534;
    }
    .date-range {
      font-family: var(--erp-font-mono);
      font-size: 0.8rem;
    }
    .action-btn-group {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }
    .btn-xs {
      padding: 4px 10px;
      font-size: 0.75rem;
      border-radius: 6px;
    }
    .reviewed-meta {
      font-size: 0.75rem;
      color: var(--erp-text-muted);
    }
    .calc-days-box {
      background: var(--erp-primary-light);
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
    }
    .grid-cols-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .text-right {
      text-align: right;
    }
    .review-prompt {
      margin-bottom: 12px;
      font-size: 0.9rem;
      color: var(--erp-text);
    }
  `]
})
export class LeaveManagementComponent implements OnInit {
  leaveService = inject(LeaveService);
  employeeService = inject(EmployeeService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'] as any;
      }
      if (params['action'] === 'apply') {
        setTimeout(() => this.openApplyModal(), 100);
      }
    });
  }

  activeTab: 'Pending' | 'Approved' | 'Rejected' | 'All' = 'Pending';
  showApplyModal = false;
  showReviewModal = false;
  reviewAction: 'approve' | 'reject' = 'approve';
  selectedLeave: LeaveRequest | null = null;
  reviewComments = '';

  calculatedDays = 0;
  errorMessage = '';
  successMessage = '';

  applyForm: FormGroup;

  get canApprove(): boolean {
    return this.auth.hasRole(['Admin', 'HR Manager']);
  }

  get canSelectAnyEmployee(): boolean {
    return this.auth.hasRole(['Admin', 'HR Manager']);
  }

  get currentEmployee() {
    const user = this.auth.currentUser();
    if (!user) return undefined;
    return this.employeeService.employees().find(e => e.employeeId === user.employeeId || e.email === user.email);
  }

  get selectedEmpQuota() {
    const empId = this.applyForm.get('employeeId')?.value;
    return this.employeeService.getEmployeeById(empId);
  }

  get filteredLeaves(): LeaveRequest[] {
    let list = this.leaveService.leaveRequests();

    // If logged in as regular employee, filter to show only their own requests
    const user = this.auth.currentUser();
    if (user?.role === 'Employee' && user.employeeId) {
      list = list.filter(l => l.employeeId === user.employeeId);
    }

    if (this.activeTab !== 'All') {
      list = list.filter(l => l.status === this.activeTab);
    }
    return list;
  }

  constructor() {
    const defaultEmp = this.currentEmployee || this.employeeService.employees()[0];
    const today = new Date().toISOString().split('T')[0];

    this.applyForm = this.fb.group({
      employeeId: [defaultEmp?.employeeId || 'EMP-1001', Validators.required],
      leaveType: ['Casual Leave', Validators.required],
      startDate: [today, Validators.required],
      endDate: [today, Validators.required],
      reason: ['', Validators.required]
    });

    this.calculatedDays = 1;
  }

  onEmployeeSelected(event: Event): void {
    // triggers getter update
  }

  updateCalculatedDays(): void {
    const start = this.applyForm.get('startDate')?.value;
    const end = this.applyForm.get('endDate')?.value;
    if (start && end) {
      this.calculatedDays = this.leaveService.calculateDays(start, end);
    } else {
      this.calculatedDays = 0;
    }
  }

  openApplyModal(): void {
    this.errorMessage = '';
    this.successMessage = '';
    const today = new Date().toISOString().split('T')[0];
    const defaultEmp = this.currentEmployee || this.employeeService.employees()[0];

    this.applyForm.patchValue({
      employeeId: defaultEmp?.employeeId || 'EMP-1001',
      leaveType: 'Casual Leave',
      startDate: today,
      endDate: today,
      reason: ''
    });
    this.calculatedDays = 1;
    this.showApplyModal = true;
  }

  submitLeaveApplication(): void {
    if (this.applyForm.invalid) return;

    this.errorMessage = '';
    this.successMessage = '';
    const val = this.applyForm.value;
    const emp = this.employeeService.getEmployeeById(val.employeeId);

    if (!emp) {
      this.errorMessage = 'Employee not found.';
      return;
    }

    const res = this.leaveService.applyLeave({
      employeeId: emp.employeeId,
      employeeName: emp.fullName,
      departmentName: emp.departmentName,
      leaveType: val.leaveType as LeaveType,
      startDate: val.startDate,
      endDate: val.endDate,
      reason: val.reason
    });

    if (res.success) {
      this.successMessage = res.message;
      this.showApplyModal = false;
    } else {
      this.errorMessage = res.message;
    }
  }

  openReviewModal(leave: LeaveRequest, action: 'approve' | 'reject'): void {
    this.selectedLeave = leave;
    this.reviewAction = action;
    this.reviewComments = action === 'approve' ? 'Approved by HR Manager' : 'Business requirements do not permit absence during this period.';
    this.showReviewModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  executeReview(): void {
    if (!this.selectedLeave) return;
    const reviewer = this.auth.currentUser()?.name || 'HR Manager';

    if (this.reviewAction === 'approve') {
      const res = this.leaveService.approveLeave(this.selectedLeave.id, reviewer, this.reviewComments);
      if (res.success) {
        this.successMessage = res.message;
      } else {
        this.errorMessage = res.message;
      }
    } else {
      const res = this.leaveService.rejectLeave(this.selectedLeave.id, reviewer, this.reviewComments);
      if (res.success) {
        this.successMessage = res.message;
      } else {
        this.errorMessage = res.message;
      }
    }
    this.showReviewModal = false;
    this.selectedLeave = null;
  }
}
