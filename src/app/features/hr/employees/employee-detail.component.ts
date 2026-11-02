import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { EmployeeService } from '../../../core/services/employee.service';
import { LeaveService } from '../../../core/services/leave.service';
import { Employee, LeaveRequest } from '../../../core/models/erp.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { DEFAULT_AVATAR } from '../../../core/constants/avatars';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, IconComponent, BadgeComponent],
  template: `
    <div class="emp-detail-page" *ngIf="employee; else notFound">
      <!-- Back Navigation Header -->
      <div class="header-nav">
        <a routerLink="/hr/employees" class="btn btn-secondary btn-sm">
          <app-icon name="arrow-left" [size]="15"></app-icon>
          <span>Back to Employee Directory</span>
        </a>
        <div class="header-actions">
          <app-badge [text]="employee.employmentStatus"></app-badge>
        </div>
      </div>

      <!-- Employee Hero Profile Card -->
      <div class="erp-card hero-card">
        <div class="hero-left">
          <div class="avatar-wrapper">
            <img
              [src]="employee.avatar || defaultAvatar"
              (error)="onAvatarError($event)"
              [alt]="employee.fullName"
              class="hero-avatar"
            />
          </div>
          <div class="hero-details">
            <h2 class="hero-name">{{ employee.fullName }}</h2>
            <div class="hero-designation-row">
              <span class="hero-designation">{{ employee.designation }}</span>
              <span class="goal-highlight-badge" *ngIf="employee.professionalGoal">
                <app-icon name="cloud" [size]="14"></app-icon>
                <span>{{ employee.professionalGoal }}</span>
              </span>
            </div>
            <div class="hero-meta">
              <span class="meta-tag">
                <app-icon name="user" [size]="14"></app-icon>
                <span>Employee ID: <strong>{{ employee.employeeId }}</strong></span>
              </span>
              <span class="meta-tag">
                <app-icon name="calendar" [size]="14"></app-icon>
                <span>Joining Date: <strong>{{ employee.joiningDate }}</strong></span>
              </span>
              <span class="meta-tag" *ngIf="employee.university">
                <app-icon name="graduation-cap" [size]="14"></app-icon>
                <span>University: <strong>{{ employee.university }}</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="hero-right">
          <div class="academic-summary-box">
            <div class="box-stat">
              <span class="box-label">Institution / University</span>
              <span class="box-val">{{ employee.university || 'Sanjivani University' }}</span>
              <span class="box-sub">Department of Computer Science &amp; Engineering</span>
            </div>
            <div class="box-divider"></div>
            <div class="box-stat">
              <span class="box-label">Gross Monthly Salary / Package</span>
              <span class="box-amount">₹{{ employee.salary.toLocaleString('en-IN') }}</span>
              <span class="box-sub">Annual CTC: ₹{{ (employee.salary * 12).toLocaleString('en-IN') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Information Sections Grid -->
      <div class="grid-cols-2">
        <!-- Personal & Contact Information Card -->
        <div class="erp-card profile-card">
          <div class="erp-card-header">
            <div class="card-heading-group">
              <app-icon name="user" [size]="18" class="heading-icon"></app-icon>
              <h4 class="erp-card-title">Personal & Contact Information</h4>
            </div>
          </div>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">
                <app-icon name="user" [size]="14"></app-icon>
                <span>Full Name</span>
              </span>
              <span class="info-val font-medium">{{ employee.fullName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">
                <app-icon name="mail" [size]="14"></app-icon>
                <span>Email Address</span>
              </span>
              <span class="info-val">
                <a [href]="'mailto:' + employee.email" class="contact-link">{{ employee.email }}</a>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">
                <app-icon name="phone" [size]="14"></app-icon>
                <span>Mobile Phone</span>
              </span>
              <span class="info-val">{{ employee.phone }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">
                <app-icon name="users" [size]="14"></app-icon>
                <span>Gender</span>
              </span>
              <span class="info-val">{{ employee.gender }}</span>
            </div>
            <div class="info-item address-item">
              <span class="info-label">
                <app-icon name="map-pin" [size]="14"></app-icon>
                <span>Residential Address</span>
              </span>
              <span class="info-val address-val">{{ employee.address }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">
                <app-icon name="award" [size]="14"></app-icon>
                <span>Education</span>
              </span>
              <span class="info-val highlight-edu">{{ employee.education || 'Diploma in Computer Technology (Completed)' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">
                <app-icon name="graduation-cap" [size]="14"></app-icon>
                <span>Current Education</span>
              </span>
              <span class="info-val highlight-edu">{{ employee.currentEducation || 'B.Tech in Computer Science & Engineering (Pursuing)' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">
                <app-icon name="cloud" [size]="14"></app-icon>
                <span>Professional Goal</span>
              </span>
              <span class="info-val goal-val">{{ employee.professionalGoal || 'Cloud Engineer (AI + Cloud)' }}</span>
            </div>
          </div>
        </div>

        <!-- Academic & Job Attendance Summary -->
        <div class="erp-card profile-card">
          <div class="erp-card-header">
            <div class="card-heading-group">
              <app-icon name="building" [size]="18" class="heading-icon"></app-icon>
              <h4 class="erp-card-title">Job & Academic Summary</h4>
            </div>
          </div>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">Department</span>
              <span class="info-val">{{ employee.departmentName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">University / Institution</span>
              <span class="info-val font-medium">{{ employee.university || 'Sanjivani University' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Designation / Role</span>
              <span class="info-val">{{ employee.designation }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Employment Status</span>
              <span class="info-val"><app-badge [text]="employee.employmentStatus"></app-badge></span>
            </div>
            <div class="info-item">
              <span class="info-label">Working Days This Month</span>
              <span class="info-val">{{ employee.attendancePresentDays }} / {{ employee.attendanceTotalDays }} days</span>
            </div>
            <div class="info-item">
              <span class="info-label">Attendance Rate</span>
              <span class="info-val attendance-rate">
                {{ ((employee.attendancePresentDays / employee.attendanceTotalDays) * 100).toFixed(1) }}%
              </span>
            </div>
            <div class="progress-container">
              <div
                class="progress-bar-fill"
                [style.width.%]="(employee.attendancePresentDays / employee.attendanceTotalDays) * 100"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Leave Balances & History Card -->
      <div class="erp-card">
        <div class="erp-card-header">
          <div>
            <h4 class="erp-card-title">Leave Balances & Leave History</h4>
            <p class="erp-card-subtitle">Annual accrued leave quotas and individual application records</p>
          </div>
          <div class="leave-balance-pills">
            <div class="balance-pill">
              <span class="bal-label">Casual</span>
              <span class="bal-val">{{ employee.casualLeaveBalance }}</span>
            </div>
            <div class="balance-pill">
              <span class="bal-label">Sick</span>
              <span class="bal-val">{{ employee.sickLeaveBalance }}</span>
            </div>
            <div class="balance-pill">
              <span class="bal-label">Earned</span>
              <span class="bal-val">{{ employee.earnedLeaveBalance }}</span>
            </div>
            <div class="balance-pill">
              <span class="bal-label">Unpaid Taken</span>
              <span class="bal-val">{{ employee.unpaidLeaveTaken }}</span>
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Reviewer Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let leave of employeeLeaves; trackBy: trackById">
                <td><strong>{{ leave.requestId }}</strong></td>
                <td>{{ leave.leaveType }}</td>
                <td>{{ leave.startDate }}</td>
                <td>{{ leave.endDate }}</td>
                <td>{{ leave.days }} day(s)</td>
                <td>{{ leave.reason }}</td>
                <td><app-badge [text]="leave.status"></app-badge></td>
                <td>{{ leave.comments || '—' }}</td>
              </tr>
              <tr *ngIf="employeeLeaves.length === 0">
                <td colspan="8" class="text-center py-4 text-muted">No leave applications on file for this employee.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <ng-template #notFound>
      <div class="erp-card text-center py-5">
        <h3>Employee profile not found</h3>
        <p class="text-muted">The requested employee ID does not exist in the active records.</p>
        <a routerLink="/hr/employees" class="btn btn-primary mt-3">Back to Directory</a>
      </div>
    </ng-template>
  `,
  styles: [`
    .emp-detail-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .header-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .hero-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 24px;
      padding: 28px;
      background: var(--erp-card-bg);
      border-radius: 12px;
      border: 1px solid var(--erp-border);
      box-shadow: var(--erp-shadow-sm);
    }
    .hero-left {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .avatar-wrapper {
      position: relative;
      flex-shrink: 0;
    }
    .hero-avatar {
      width: 104px;
      height: 104px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid var(--erp-primary, #2563eb);
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.2);
      background: var(--erp-primary-light, #eff6ff);
      display: block;
    }
    .hero-details {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .hero-name {
      font-size: 1.55rem;
      font-weight: 700;
      color: var(--erp-text-heading);
      letter-spacing: -0.01em;
      margin: 0;
    }
    .hero-designation-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .hero-designation {
      font-size: 0.975rem;
      font-weight: 500;
      color: var(--erp-text-muted);
    }
    .goal-highlight-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
      font-size: 0.825rem;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 9999px;
    }
    [data-theme="dark"] .goal-highlight-badge {
      background: rgba(37, 99, 235, 0.2);
      color: #60a5fa;
      border-color: rgba(96, 165, 250, 0.3);
    }
    .hero-meta {
      display: flex;
      align-items: center;
      gap: 18px;
      margin-top: 6px;
      font-size: 0.825rem;
      color: var(--erp-text-muted);
      flex-wrap: wrap;
    }
    .meta-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .hero-right {
      display: flex;
      align-items: center;
    }
    .academic-summary-box {
      background: var(--erp-bg-subtle);
      border: 1px solid var(--erp-border);
      border-radius: 12px;
      padding: 16px 22px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 280px;
    }
    .box-stat {
      display: flex;
      flex-direction: column;
    }
    .box-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      font-weight: 600;
      color: var(--erp-text-muted);
      letter-spacing: 0.04em;
    }
    .box-val {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--erp-text-heading);
      margin-top: 2px;
    }
    .box-amount {
      font-size: 1.45rem;
      font-weight: 700;
      color: #16a34a;
      line-height: 1.2;
      margin-top: 2px;
    }
    .box-sub {
      font-size: 0.775rem;
      color: var(--erp-text-muted);
      margin-top: 2px;
    }
    .box-divider {
      height: 1px;
      background: var(--erp-border);
    }
    .profile-card {
      padding: 24px;
    }
    .card-heading-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .heading-icon {
      color: var(--erp-primary);
    }
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-top: 14px;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--erp-border);
      font-size: 0.885rem;
      gap: 16px;
    }
    .info-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .info-label {
      color: var(--erp-text-muted);
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .info-val {
      font-weight: 500;
      color: var(--erp-text-heading);
      text-align: right;
    }
    .font-medium {
      font-weight: 600;
    }
    .contact-link {
      color: var(--erp-primary);
      text-decoration: none;
      font-weight: 600;
    }
    .contact-link:hover {
      text-decoration: underline;
    }
    .address-item {
      align-items: flex-start;
    }
    .address-val {
      max-width: 60%;
      line-height: 1.4;
    }
    .highlight-edu {
      color: var(--erp-text-heading);
      font-weight: 600;
    }
    .goal-val {
      color: var(--erp-primary);
      font-weight: 600;
    }
    .attendance-rate {
      color: #16a34a;
      font-weight: 700;
    }
    .progress-container {
      width: 100%;
      height: 6px;
      background: var(--erp-border);
      border-radius: 9999px;
      overflow: hidden;
      margin-top: 4px;
    }
    .progress-bar-fill {
      height: 100%;
      background: #16a34a;
      border-radius: 9999px;
      transition: width 0.4s ease;
    }
    .leave-balance-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .balance-pill {
      background: var(--erp-bg-subtle);
      border: 1px solid var(--erp-border);
      border-radius: 8px;
      padding: 6px 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 70px;
    }
    .bal-label {
      font-size: 0.65rem;
      text-transform: uppercase;
      font-weight: 600;
      color: var(--erp-text-muted);
    }
    .bal-val {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--erp-primary);
    }
    .text-center {
      text-align: center;
    }
    @media (max-width: 992px) {
      .hero-card {
        flex-direction: column;
        align-items: flex-start;
      }
      .academic-summary-box {
        width: 100%;
      }
      .hero-left {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class EmployeeDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private employeeService = inject(EmployeeService);
  private leaveService = inject(LeaveService);
  private cdr = inject(ChangeDetectorRef);
  private routeSub?: Subscription;

  employee?: Employee;
  employeeLeaves: LeaveRequest[] = [];
  defaultAvatar = DEFAULT_AVATAR;

  trackById(index: number, leave: any): string {
    return leave?.id || leave?.requestId || index.toString();
  }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.employee = this.employeeService.getEmployeeById(id);
        if (this.employee) {
          this.employeeLeaves = this.leaveService.getLeavesByEmployee(this.employee.employeeId);
        }
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  onAvatarError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.onerror = null;
    target.src = this.defaultAvatar;
  }
}
