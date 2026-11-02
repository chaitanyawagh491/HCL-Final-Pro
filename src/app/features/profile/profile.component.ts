import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { NotificationService } from '../../core/services/notification.service';
import { Employee, User } from '../../core/models/erp.model';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { CW_AVATAR, DEFAULT_AVATAR } from '../../core/constants/avatars';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, IconComponent, BadgeComponent],
  template: `
    <div class="profile-container">
      <!-- Top Navigation Header -->
      <div class="profile-top-bar">
        <div class="breadcrumb-group">
          <button type="button" class="btn btn-secondary btn-sm" (click)="goToDashboard()">
            <app-icon name="arrow-left" [size]="16"></app-icon>
            <span>Back to Dashboard</span>
          </button>
          <span class="page-title-badge">ERP User Profile</span>
        </div>

        <div class="top-bar-actions">
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            (click)="openPasswordModal()"
            [disabled]="isEditing()"
          >
            <app-icon name="key" [size]="15"></app-icon>
            <span>Change Password</span>
          </button>

          <button
            type="button"
            class="btn btn-primary btn-sm"
            *ngIf="!isEditing()"
            (click)="startEditing()"
          >
            <app-icon name="edit" [size]="15"></app-icon>
            <span>Edit Profile</span>
          </button>

          <ng-container *ngIf="isEditing()">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              (click)="cancelEditing()"
            >
              <app-icon name="x" [size]="15"></app-icon>
              <span>Cancel</span>
            </button>

            <button
              type="button"
              class="btn btn-success btn-sm save-btn"
              (click)="saveProfileChanges()"
              [disabled]="profileForm.invalid"
            >
              <app-icon name="check" [size]="15"></app-icon>
              <span>Save Changes</span>
            </button>
          </ng-container>
        </div>
      </div>

      <!-- Success / Alert Banner -->
      <div class="alert-banner alert-success" *ngIf="successMessage()">
        <app-icon name="check-circle" [size]="18"></app-icon>
        <span class="alert-text">{{ successMessage() }}</span>
        <button type="button" class="close-alert" (click)="successMessage.set('')">×</button>
      </div>

      <!-- Hero Header Card -->
      <div class="erp-card hero-profile-card">
        <div class="hero-identity">
          <div class="avatar-container">
            <img
              [src]="userAvatar"
              (error)="onAvatarError($event)"
              alt="Avatar"
              class="profile-hero-avatar"
            />
            <span class="avatar-badge" title="Verified System Administrator">
              <app-icon name="check" [size]="12"></app-icon>
            </span>
          </div>

          <div class="hero-info">
            <div class="name-row">
              <h1 class="hero-full-name">{{ currentUser()?.name || 'Chaitanya Santosh Wagh' }}</h1>
              <span class="role-pill-tag">{{ currentUser()?.role || 'Admin' }}</span>
            </div>

            <p class="hero-designation-text">
              {{ currentUser()?.designation || 'Chief Administrator & System Architect' }}
            </p>

            <div class="career-goal-pill" *ngIf="currentEmployee()?.careerInterest || currentUser()?.careerInterest">
              <app-icon name="cloud" [size]="15"></app-icon>
              <span class="goal-label">Career Interest:</span>
              <strong class="goal-text">{{ currentEmployee()?.careerInterest || currentUser()?.careerInterest || 'Aspiring Cloud Engineer' }}</strong>
            </div>

            <div class="hero-badges-row">
              <span class="hero-meta-item">
                <app-icon name="user" [size]="14"></app-icon>
                <span>ID: <strong>{{ currentEmployee()?.employeeId || 'EMP-1001' }}</strong></span>
              </span>
              <span class="hero-meta-item">
                <app-icon name="map-pin" [size]="14"></app-icon>
                <span>Location: <strong>{{ currentEmployee()?.location || currentUser()?.location || 'Newasa, Maharashtra, India' }}</strong></span>
              </span>
              <span class="hero-meta-item">
                <app-icon name="graduation-cap" [size]="14"></app-icon>
                <span>University: <strong>{{ currentEmployee()?.university || currentUser()?.university || 'Sanjivani University' }}</strong></span>
              </span>
              <span class="hero-meta-item">
                <app-icon name="calendar" [size]="14"></app-icon>
                <span>Joined: <strong>{{ currentEmployee()?.joiningDate || '2023-08-01' }}</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="hero-stats">
          <div class="stat-box">
            <span class="stat-box-label">Monthly Gross</span>
            <span class="stat-box-val">₹{{ (currentEmployee()?.salary || 125000).toLocaleString('en-IN') }}</span>
            <span class="stat-box-sub">CTC: ₹{{ ((currentEmployee()?.salary || 125000) * 12).toLocaleString('en-IN') }}/yr</span>
          </div>
          <div class="stat-box-divider"></div>
          <div class="stat-box">
            <span class="stat-box-label">Accrued Leaves</span>
            <span class="stat-box-val text-primary">{{ totalLeaveBalance }} Days</span>
            <span class="stat-box-sub">Casual: {{ currentEmployee()?.casualLeaveBalance || 12 }} | Sick: {{ currentEmployee()?.sickLeaveBalance || 10 }} | Earned: {{ currentEmployee()?.earnedLeaveBalance || 15 }}</span>
          </div>
        </div>
      </div>

      <!-- Main Profile Sections Form / Grid -->
      <form [formGroup]="profileForm" (ngSubmit)="saveProfileChanges()">
        <div class="profile-grid">
          <!-- Section 1: Personal Information -->
          <div class="erp-card section-card">
            <div class="card-header-styled">
              <div class="header-icon-box icon-blue">
                <app-icon name="user" [size]="18"></app-icon>
              </div>
              <div>
                <h3 class="section-title">Personal Information</h3>
                <p class="section-desc">Personal identity, educational credentials and career focus</p>
              </div>
            </div>

            <div class="form-fields-list">
              <!-- Full Name -->
              <div class="detail-row">
                <label class="field-label">Full Name</label>
                <div class="field-value-wrapper">
                  <ng-container *ngIf="!isEditing()">
                    <span class="field-display font-semibold">{{ currentUser()?.name || 'Chaitanya Santosh Wagh' }}</span>
                  </ng-container>
                  <ng-container *ngIf="isEditing()">
                    <input
                      type="text"
                      class="erp-input"
                      formControlName="fullName"
                      placeholder="Enter Full Name"
                    />
                    <div class="error-hint" *ngIf="profileForm.get('fullName')?.invalid && profileForm.get('fullName')?.touched">
                      Full name is required.
                    </div>
                  </ng-container>
                </div>
              </div>

              <!-- Gender -->
              <div class="detail-row">
                <label class="field-label">Gender</label>
                <div class="field-value-wrapper">
                  <ng-container *ngIf="!isEditing()">
                    <span class="field-display">{{ currentEmployee()?.gender || 'Male' }}</span>
                  </ng-container>
                  <ng-container *ngIf="isEditing()">
                    <select class="erp-select" formControlName="gender">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </ng-container>
                </div>
              </div>

              <!-- Location / Address -->
              <div class="detail-row">
                <label class="field-label">Location / Address</label>
                <div class="field-value-wrapper">
                  <ng-container *ngIf="!isEditing()">
                    <span class="field-display font-medium text-highlight">
                      {{ currentEmployee()?.location || currentUser()?.location || 'Newasa, Maharashtra, India' }}
                    </span>
                  </ng-container>
                  <ng-container *ngIf="isEditing()">
                    <input
                      type="text"
                      class="erp-input"
                      formControlName="location"
                      placeholder="e.g., Newasa, Maharashtra, India"
                    />
                  </ng-container>
                </div>
              </div>

              <!-- Education -->
              <div class="detail-row">
                <label class="field-label">Education (Completed)</label>
                <div class="field-value-wrapper">
                  <ng-container *ngIf="!isEditing()">
                    <span class="field-display education-tag">
                      <app-icon name="award" [size]="14"></app-icon>
                      <span>{{ currentEmployee()?.education || currentUser()?.education || 'Diploma in Computer Technology' }}</span>
                    </span>
                  </ng-container>
                  <ng-container *ngIf="isEditing()">
                    <input
                      type="text"
                      class="erp-input"
                      formControlName="education"
                      placeholder="e.g. Diploma in Computer Technology"
                    />
                  </ng-container>
                </div>
              </div>

              <!-- Current Education -->
              <div class="detail-row">
                <label class="field-label">Current Education (Pursuing)</label>
                <div class="field-value-wrapper">
                  <ng-container *ngIf="!isEditing()">
                    <span class="field-display education-tag tag-primary">
                      <app-icon name="graduation-cap" [size]="14"></app-icon>
                      <span>{{ currentEmployee()?.currentEducation || currentUser()?.currentEducation || 'B.Tech in Computer Science and Engineering' }}</span>
                    </span>
                  </ng-container>
                  <ng-container *ngIf="isEditing()">
                    <input
                      type="text"
                      class="erp-input"
                      formControlName="currentEducation"
                      placeholder="e.g. B.Tech in Computer Science and Engineering"
                    />
                  </ng-container>
                </div>
              </div>

              <!-- University -->
              <div class="detail-row">
                <label class="field-label">University / Institution</label>
                <div class="field-value-wrapper">
                  <ng-container *ngIf="!isEditing()">
                    <span class="field-display font-semibold text-primary">
                      {{ currentEmployee()?.university || currentUser()?.university || 'Sanjivani University' }}
                    </span>
                  </ng-container>
                  <ng-container *ngIf="isEditing()">
                    <input
                      type="text"
                      class="erp-input"
                      formControlName="university"
                      placeholder="e.g. Sanjivani University"
                    />
                  </ng-container>
                </div>
              </div>

              <!-- Career Interest -->
              <div class="detail-row">
                <label class="field-label">Career Interest</label>
                <div class="field-value-wrapper">
                  <ng-container *ngIf="!isEditing()">
                    <span class="field-display career-highlight">
                      <app-icon name="cloud" [size]="15"></app-icon>
                      <span>{{ currentEmployee()?.careerInterest || currentUser()?.careerInterest || 'Aspiring Cloud Engineer' }}</span>
                    </span>
                  </ng-container>
                  <ng-container *ngIf="isEditing()">
                    <input
                      type="text"
                      class="erp-input"
                      formControlName="careerInterest"
                      placeholder="e.g. Aspiring Cloud Engineer"
                    />
                  </ng-container>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Contact Information -->
          <div class="erp-card section-card">
            <div class="card-header-styled">
              <div class="header-icon-box icon-green">
                <app-icon name="phone" [size]="18"></app-icon>
              </div>
              <div>
                <h3 class="section-title">Contact Information</h3>
                <p class="section-desc">Mobile number and communications channels</p>
              </div>
            </div>

            <div class="form-fields-list">
              <!-- Mobile Phone -->
              <div class="detail-row">
                <label class="field-label">Mobile Phone</label>
                <div class="field-value-wrapper">
                  <ng-container *ngIf="!isEditing()">
                    <span class="field-display font-mono font-medium">
                      {{ currentEmployee()?.phone || currentUser()?.phone || '+91 93730 83491' }}
                    </span>
                  </ng-container>
                  <ng-container *ngIf="isEditing()">
                    <input
                      type="text"
                      class="erp-input"
                      formControlName="phone"
                      placeholder="+91 93730 83491"
                    />
                    <div class="error-hint" *ngIf="profileForm.get('phone')?.invalid && profileForm.get('phone')?.touched">
                      Valid phone number is required.
                    </div>
                  </ng-container>
                </div>
              </div>

              <!-- Personal / Contact Email -->
              <div class="detail-row">
                <label class="field-label">Contact Email</label>
                <div class="field-value-wrapper">
                  <ng-container *ngIf="!isEditing()">
                    <a [href]="'mailto:' + (currentEmployee()?.email || 'chaitanyawagh491@gmail.com')" class="field-display link-display">
                      {{ currentEmployee()?.email || 'chaitanyawagh491@gmail.com' }}
                    </a>
                  </ng-container>
                  <ng-container *ngIf="isEditing()">
                    <input
                      type="email"
                      class="erp-input"
                      formControlName="email"
                      placeholder="chaitanyawagh491@gmail.com"
                    />
                    <div class="error-hint" *ngIf="profileForm.get('email')?.invalid && profileForm.get('email')?.touched">
                      Valid email address is required.
                    </div>
                  </ng-container>
                </div>
              </div>

              <!-- Login / System Account Email -->
              <div class="detail-row">
                <label class="field-label">System Account Email</label>
                <div class="field-value-wrapper">
                  <span class="field-display text-muted font-mono">
                    {{ currentUser()?.email || 'admin@erp.com' }}
                  </span>
                  <span class="field-hint-tag">Default ERP Admin Account</span>
                </div>
              </div>

              <!-- Preferred Mode of Contact -->
              <div class="detail-row">
                <label class="field-label">Contact Mode</label>
                <div class="field-value-wrapper">
                  <span class="field-display">Mobile Phone, Email &amp; HCL ERP Portal Notifications</span>
                </div>
              </div>

              <!-- Work Availability -->
              <div class="detail-row">
                <label class="field-label">Availability</label>
                <div class="field-value-wrapper">
                  <span class="status-indicator-online">
                    <span class="status-dot"></span>
                    <span>Online &amp; Active (System Administrator)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Employee Information -->
          <div class="erp-card section-card">
            <div class="card-header-styled">
              <div class="header-icon-box icon-purple">
                <app-icon name="briefcase" [size]="18"></app-icon>
              </div>
              <div>
                <h3 class="section-title">Employee Information</h3>
                <p class="section-desc">Organizational hierarchy, department and employment profile</p>
              </div>
            </div>

            <div class="form-fields-list">
              <div class="detail-row">
                <label class="field-label">Employee ID</label>
                <div class="field-value-wrapper">
                  <span class="field-display font-mono font-bold">{{ currentEmployee()?.employeeId || 'EMP-1001' }}</span>
                </div>
              </div>

              <div class="detail-row">
                <label class="field-label">Department</label>
                <div class="field-value-wrapper">
                  <span class="field-display font-semibold">{{ currentEmployee()?.departmentName || 'Engineering & Technology' }}</span>
                </div>
              </div>

              <div class="detail-row">
                <label class="field-label">Designation / Role</label>
                <div class="field-value-wrapper">
                  <span class="field-display">{{ currentEmployee()?.designation || 'Chief Administrator & System Architect' }}</span>
                </div>
              </div>

              <div class="detail-row">
                <label class="field-label">Employment Status</label>
                <div class="field-value-wrapper">
                  <app-badge [text]="currentEmployee()?.employmentStatus || 'Full-time'"></app-badge>
                </div>
              </div>

              <div class="detail-row">
                <label class="field-label">Joining Date</label>
                <div class="field-value-wrapper">
                  <span class="field-display">{{ currentEmployee()?.joiningDate || '2023-08-01' }}</span>
                </div>
              </div>

              <div class="detail-row">
                <label class="field-label">Monthly Gross Package</label>
                <div class="field-value-wrapper">
                  <span class="field-display font-semibold text-success">₹{{ (currentEmployee()?.salary || 125000).toLocaleString('en-IN') }} / month</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 4: Account & Security Information -->
          <div class="erp-card section-card">
            <div class="card-header-styled">
              <div class="header-icon-box icon-amber">
                <app-icon name="shield" [size]="18"></app-icon>
              </div>
              <div>
                <h3 class="section-title">Account & Security Information</h3>
                <p class="section-desc">Access credentials, permission level and local persistence</p>
              </div>
            </div>

            <div class="form-fields-list">
              <div class="detail-row">
                <label class="field-label">Active Role</label>
                <div class="field-value-wrapper">
                  <div class="role-badge-pill">
                    <span class="role-dot"></span>
                    <strong>{{ currentUser()?.role || 'Admin' }} (Full Access)</strong>
                  </div>
                </div>
              </div>

              <div class="detail-row">
                <label class="field-label">Permissions Scope</label>
                <div class="field-value-wrapper">
                  <span class="field-display">All 4 ERP Modules (HR, Inventory, Sales, Finance, System Management)</span>
                </div>
              </div>

              <div class="detail-row">
                <label class="field-label">Authentication Mode</label>
                <div class="field-value-wrapper">
                  <span class="field-display">Client-Side LocalStorage (100% Offline, Zero External APIs)</span>
                </div>
              </div>

              <div class="detail-row">
                <label class="field-label">Password Status</label>
                <div class="field-value-wrapper flex-between">
                  <span class="field-display text-muted">•••••••••••• (Encrypted Session)</span>
                  <button type="button" class="btn btn-outline-primary btn-xs" (click)="openPasswordModal()">
                    Change
                  </button>
                </div>
              </div>

              <div class="detail-row">
                <label class="field-label">Last Password Update</label>
                <div class="field-value-wrapper">
                  <span class="field-display font-mono text-muted">
                    {{ currentUser()?.lastPasswordUpdate || 'System Initial (admin123)' }}
                  </span>
                </div>
              </div>

              <div class="detail-row">
                <label class="field-label">Storage Engine</label>
                <div class="field-value-wrapper">
                  <span class="badge-subtle">HTML5 Web Storage (erp_employees + auth_users)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky Bottom Bar when Editing -->
        <div class="edit-actions-sticky" *ngIf="isEditing()">
          <div class="sticky-content">
            <span class="sticky-text">You have unsaved profile changes.</span>
            <div class="sticky-buttons">
              <button type="button" class="btn btn-secondary btn-sm" (click)="cancelEditing()">
                <app-icon name="x" [size]="14"></app-icon>
                <span>Cancel</span>
              </button>
              <button type="button" class="btn btn-success btn-sm" (click)="saveProfileChanges()" [disabled]="profileForm.invalid">
                <app-icon name="check" [size]="14"></app-icon>
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>

    <!-- Change Password Modal -->
    <div class="modal-backdrop" *ngIf="showPasswordModal">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="header-icon-box icon-amber">
              <app-icon name="key" [size]="18"></app-icon>
            </div>
            <div>
              <h4 class="modal-title">Change Account Password</h4>
              <p class="modal-subtitle">Update your master administrator credentials stored in LocalStorage</p>
            </div>
          </div>
          <button type="button" class="btn-close" (click)="closePasswordModal()">×</button>
        </div>

        <div class="modal-body">
          <div class="alert-banner alert-danger" *ngIf="passwordError">
            <app-icon name="alert-triangle" [size]="16"></app-icon>
            <span>{{ passwordError }}</span>
          </div>

          <div class="form-group mb-3">
            <label class="erp-label">Current Password <span class="required">*</span></label>
            <div class="input-with-action">
              <input
                [type]="showOldPassword ? 'text' : 'password'"
                class="erp-input"
                [(ngModel)]="oldPassword"
                placeholder="Enter current password (e.g. admin123)"
              />
              <button type="button" class="toggle-eye-btn" (click)="showOldPassword = !showOldPassword">
                <app-icon [name]="showOldPassword ? 'eye-off' : 'eye'" [size]="16"></app-icon>
              </button>
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="erp-label">New Password <span class="required">*</span></label>
            <div class="input-with-action">
              <input
                [type]="showNewPassword ? 'text' : 'password'"
                class="erp-input"
                [(ngModel)]="newPassword"
                placeholder="Enter new password (min. 4 characters)"
              />
              <button type="button" class="toggle-eye-btn" (click)="showNewPassword = !showNewPassword">
                <app-icon [name]="showNewPassword ? 'eye-off' : 'eye'" [size]="16"></app-icon>
              </button>
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="erp-label">Confirm New Password <span class="required">*</span></label>
            <div class="input-with-action">
              <input
                [type]="showConfirmPassword ? 'text' : 'password'"
                class="erp-input"
                [(ngModel)]="confirmPassword"
                placeholder="Re-type new password"
              />
              <button type="button" class="toggle-eye-btn" (click)="showConfirmPassword = !showConfirmPassword">
                <app-icon [name]="showConfirmPassword ? 'eye-off' : 'eye'" [size]="16"></app-icon>
              </button>
            </div>
          </div>

          <p class="modal-hint">
            <strong>Note:</strong> Changes take effect immediately in LocalStorage without any external API calls. You can log in using your updated password.
          </p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="closePasswordModal()">
            Cancel
          </button>
          <button type="button" class="btn btn-primary" (click)="submitPasswordChange()">
            Update Password
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      display: flex;
      flex-direction: column;
      gap: 22px;
      max-width: 1300px;
      margin: 0 auto;
      padding-bottom: 40px;
    }
    .profile-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .breadcrumb-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .page-title-badge {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--erp-text-muted);
      background: var(--erp-bg-subtle);
      border: 1px solid var(--erp-border);
      padding: 4px 12px;
      border-radius: 6px;
    }
    .top-bar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .save-btn {
      background: #16a34a !important;
      border-color: #15803d !important;
      color: #fff !important;
    }
    .save-btn:hover {
      background: #15803d !important;
    }

    /* Alert Banner */
    .alert-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 18px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      animation: fadeIn 0.2s ease;
    }
    .alert-success {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .alert-danger {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .close-alert {
      margin-left: auto;
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: inherit;
      line-height: 1;
    }

    /* Hero Card */
    .hero-profile-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
      padding: 28px;
      background: var(--erp-card-bg);
      border-radius: 14px;
      border: 1px solid var(--erp-border);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    }
    .hero-identity {
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    .avatar-container {
      position: relative;
      width: 104px;
      height: 104px;
      flex-shrink: 0;
    }
    .profile-hero-avatar {
      width: 104px;
      height: 104px;
      border-radius: 50%;
      object-fit: cover;
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25);
      border: 3px solid #ffffff;
      background: #eff6ff;
    }
    .avatar-badge {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #16a34a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #ffffff;
    }
    .hero-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .name-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .hero-full-name {
      font-size: 1.65rem;
      font-weight: 700;
      color: var(--erp-text-heading);
      letter-spacing: -0.02em;
      margin: 0;
    }
    .role-pill-tag {
      font-size: 0.75rem;
      font-weight: 700;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 3px 10px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .hero-designation-text {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--erp-text);
      margin: 0;
    }
    .career-goal-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 1px solid #93c5fd;
      padding: 5px 12px;
      border-radius: 8px;
      color: #1e40af;
      font-size: 0.85rem;
      width: fit-content;
      margin-top: 2px;
    }
    .goal-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 600;
      color: #3b82f6;
    }
    .goal-text {
      color: #1d4ed8;
    }
    .hero-badges-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 4px;
    }
    .hero-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.825rem;
      color: var(--erp-text-muted);
    }
    .hero-meta-item strong {
      color: var(--erp-text-heading);
    }

    /* Hero Stats */
    .hero-stats {
      display: flex;
      align-items: center;
      gap: 20px;
      background: var(--erp-bg-subtle);
      border: 1px solid var(--erp-border);
      border-radius: 12px;
      padding: 16px 22px;
    }
    .stat-box {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .stat-box-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--erp-text-muted);
      letter-spacing: 0.03em;
    }
    .stat-box-val {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--erp-text-heading);
    }
    .stat-box-sub {
      font-size: 0.75rem;
      color: var(--erp-text-muted);
    }
    .stat-box-divider {
      width: 1px;
      height: 45px;
      background: var(--erp-border);
    }

    /* Grid Sections */
    .profile-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .section-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .card-header-styled {
      display: flex;
      align-items: center;
      gap: 14px;
      border-bottom: 1px solid var(--erp-border);
      padding-bottom: 14px;
    }
    .header-icon-box {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .icon-blue { background: #eff6ff; color: #2563eb; }
    .icon-green { background: #ecfdf5; color: #059669; }
    .icon-purple { background: #f5f3ff; color: #7c3aed; }
    .icon-amber { background: #fffbeb; color: #d97706; }

    .section-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--erp-text-heading);
      margin: 0;
    }
    .section-desc {
      font-size: 0.775rem;
      color: var(--erp-text-muted);
      margin: 2px 0 0 0;
    }

    .form-fields-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .detail-row {
      display: grid;
      grid-template-columns: 180px 1fr;
      align-items: center;
      gap: 14px;
      padding: 6px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.03);
    }
    .field-label {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--erp-text-muted);
    }
    .field-value-wrapper {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .field-display {
      font-size: 0.9rem;
      color: var(--erp-text);
      word-break: break-word;
    }
    .text-highlight {
      color: #1e3a8a;
      font-weight: 600;
    }
    .link-display {
      color: #2563eb;
      text-decoration: none;
    }
    .link-display:hover {
      text-decoration: underline;
    }
    .education-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--erp-bg-subtle);
      border: 1px solid var(--erp-border);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.825rem;
      font-weight: 500;
      color: var(--erp-text-heading);
      width: fit-content;
    }
    .tag-primary {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1d4ed8;
    }
    .career-highlight {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #2563eb;
    }
    .field-hint-tag {
      font-size: 0.7rem;
      color: var(--erp-text-muted);
    }
    .status-indicator-online {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.825rem;
      color: #15803d;
      font-weight: 500;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
    }
    .role-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 4px 12px;
      border-radius: 8px;
      color: #1e40af;
      font-size: 0.85rem;
      width: fit-content;
    }
    .role-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #2563eb;
    }
    .badge-subtle {
      font-size: 0.775rem;
      color: var(--erp-text-muted);
      background: var(--erp-bg-subtle);
      border: 1px solid var(--erp-border);
      padding: 3px 8px;
      border-radius: 4px;
      width: fit-content;
    }
    .flex-between {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }

    /* Inputs */
    .erp-input, .erp-select {
      width: 100%;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--erp-border);
      background: var(--erp-bg);
      color: var(--erp-text);
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.15s ease;
    }
    .erp-input:focus, .erp-select:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .error-hint {
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: 2px;
    }

    /* Sticky Bottom Bar */
    .edit-actions-sticky {
      position: sticky;
      bottom: 20px;
      background: #0f172a;
      color: #f8fafc;
      padding: 14px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      z-index: 50;
      animation: slideUp 0.2s ease;
      margin-top: 10px;
    }
    .sticky-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .sticky-text {
      font-size: 0.9rem;
      font-weight: 500;
    }
    .sticky-buttons {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Change Password Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      animation: fadeIn 0.15s ease;
    }
    .modal-dialog {
      background: var(--erp-card-bg);
      border-radius: 14px;
      border: 1px solid var(--erp-border);
      width: 100%;
      max-width: 480px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 24px;
      border-bottom: 1px solid var(--erp-border);
    }
    .modal-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .modal-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--erp-text-heading);
      margin: 0;
    }
    .modal-subtitle {
      font-size: 0.775rem;
      color: var(--erp-text-muted);
      margin: 2px 0 0 0;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1.4rem;
      color: var(--erp-text-muted);
      cursor: pointer;
      line-height: 1;
    }
    .modal-body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .erp-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--erp-text);
      margin-bottom: 6px;
    }
    .required {
      color: #dc2626;
    }
    .input-with-action {
      position: relative;
      display: flex;
      align-items: center;
    }
    .toggle-eye-btn {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: var(--erp-text-muted);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-hint {
      font-size: 0.775rem;
      color: var(--erp-text-muted);
      background: var(--erp-bg-subtle);
      border: 1px solid var(--erp-border);
      border-radius: 8px;
      padding: 10px 14px;
      margin: 8px 0 0 0;
    }
    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px;
      border-top: 1px solid var(--erp-border);
      background: var(--erp-bg-subtle);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @media (max-width: 992px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
      .detail-row {
        grid-template-columns: 140px 1fr;
      }
      .hero-profile-card {
        flex-direction: column;
        align-items: flex-start;
      }
      .hero-stats {
        width: 100%;
      }
    }
    @media (max-width: 640px) {
      .detail-row {
        grid-template-columns: 1fr;
        gap: 6px;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  auth = inject(AuthService);
  employeeService = inject(EmployeeService);
  notificationService = inject(NotificationService);
  router = inject(Router);
  fb = inject(FormBuilder);

  currentUser = this.auth.currentUser;
  currentEmployee = signal<Employee | null>(null);

  isEditing = signal<boolean>(false);
  successMessage = signal<string>('');

  userAvatar = CW_AVATAR;
  defaultAvatar = DEFAULT_AVATAR;

  // Change Password state
  showPasswordModal = false;
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  passwordError = '';

  profileForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadProfileData();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      gender: ['Male', Validators.required],
      phone: ['', [Validators.required, Validators.minLength(8)]],
      email: ['', [Validators.required, Validators.email]],
      location: ['Newasa, Maharashtra, India', Validators.required],
      education: ['Diploma in Computer Technology', Validators.required],
      currentEducation: ['B.Tech in Computer Science and Engineering', Validators.required],
      university: ['Sanjivani University', Validators.required],
      careerInterest: ['Aspiring Cloud Engineer', Validators.required]
    });
  }

  loadProfileData(): void {
    const user = this.currentUser();
    const empId = user?.employeeId || 'EMP-1001';
    let emp = this.employeeService.getEmployeeById(empId);

    if (!emp) {
      const all = this.employeeService.employees();
      emp = all.find(e => e.employeeId === 'EMP-1001') || all[0];
    }

    if (emp) {
      this.currentEmployee.set(emp);
      this.userAvatar = user?.avatar || emp.avatar || CW_AVATAR;
    } else {
      this.userAvatar = CW_AVATAR;
    }

    // Populate form with current values
    this.profileForm.patchValue({
      fullName: user?.name || emp?.fullName || 'Chaitanya Santosh Wagh',
      gender: emp?.gender || 'Male',
      phone: user?.phone || emp?.phone || '+91 93730 83491',
      email: emp?.email || 'chaitanyawagh491@gmail.com',
      location: user?.location || emp?.location || emp?.address || 'Newasa, Maharashtra, India',
      education: user?.education || emp?.education || 'Diploma in Computer Technology',
      currentEducation: user?.currentEducation || emp?.currentEducation || 'B.Tech in Computer Science and Engineering',
      university: user?.university || emp?.university || 'Sanjivani University',
      careerInterest: user?.careerInterest || emp?.careerInterest || emp?.professionalGoal || 'Aspiring Cloud Engineer'
    });
  }

  get totalLeaveBalance(): number {
    const emp = this.currentEmployee();
    if (!emp) return 37;
    return (emp.casualLeaveBalance || 0) + (emp.sickLeaveBalance || 0) + (emp.earnedLeaveBalance || 0);
  }

  startEditing(): void {
    this.isEditing.set(true);
    this.successMessage.set('');
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.loadProfileData();
  }

  saveProfileChanges(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const val = this.profileForm.value;
    const user = this.currentUser();
    const emp = this.currentEmployee();

    // 1. Update user session in AuthService & localStorage
    const updatedUser = this.auth.updateCurrentUser({
      name: val.fullName.trim(),
      phone: val.phone.trim(),
      location: val.location.trim(),
      education: val.education.trim(),
      currentEducation: val.currentEducation.trim(),
      university: val.university.trim(),
      careerInterest: val.careerInterest.trim(),
      avatar: CW_AVATAR
    });

    // 2. Update employee in EmployeeService & localStorage
    const targetEmpId = emp?.employeeId || user?.employeeId || 'EMP-1001';
    const updatedEmp = this.employeeService.updateProfile(targetEmpId, {
      fullName: val.fullName.trim(),
      phone: val.phone.trim(),
      email: val.email.trim(),
      gender: val.gender,
      location: val.location.trim(),
      address: val.location.trim(),
      education: val.education.trim(),
      currentEducation: val.currentEducation.trim(),
      university: val.university.trim(),
      careerInterest: val.careerInterest.trim(),
      professionalGoal: val.careerInterest.trim(),
      avatar: CW_AVATAR
    });

    if (updatedEmp) {
      this.currentEmployee.set(updatedEmp);
    }

    this.isEditing.set(false);
    this.successMessage.set('Profile details successfully updated and saved to LocalStorage!');
    this.notificationService.notify('Profile Updated', 'Your profile details have been saved successfully.', 'success');

    // Auto dismiss message after 5 seconds
    setTimeout(() => {
      this.successMessage.set('');
    }, 5000);
  }

  openPasswordModal(): void {
    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError = '';
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordError = '';
  }

  submitPasswordChange(): void {
    this.passwordError = '';

    if (!this.oldPassword) {
      this.passwordError = 'Please enter your current password.';
      return;
    }
    if (!this.newPassword || this.newPassword.trim().length < 4) {
      this.passwordError = 'New password must be at least 4 characters long.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'New password and confirmation do not match.';
      return;
    }

    const res = this.auth.changePassword(this.oldPassword, this.newPassword);
    if (!res.success) {
      this.passwordError = res.message;
      return;
    }

    this.closePasswordModal();
    this.successMessage.set('Password successfully updated! You can now sign in using your new credentials.');
    this.notificationService.notify('Password Changed', 'Your account password has been updated in LocalStorage.', 'success');

    setTimeout(() => {
      this.successMessage.set('');
    }, 5000);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  onAvatarError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.onerror = null;
    target.src = this.defaultAvatar;
  }
}
