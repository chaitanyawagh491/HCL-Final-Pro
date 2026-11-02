import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <!-- Logo and Brand -->
        <div class="login-header">
          <div class="brand-badge">
            <app-icon name="layers" [size]="28"></app-icon>
          </div>
          <h2 class="login-title">HCL Enterprise ERP</h2>
          <p class="login-subtitle">Sign in to access your organization's ERP ecosystem</p>
        </div>

        <!-- Error alert -->
        <div class="alert-box" *ngIf="errorMessage">
          <app-icon name="alert-circle" [size]="18"></app-icon>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Login Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label class="form-label" for="email">Work Email</label>
            <div class="input-wrap">
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-control"
                placeholder="name@erp.com"
                [class.is-invalid]="f['email'].touched && f['email'].invalid"
              />
            </div>
            <div class="invalid-feedback" *ngIf="f['email'].touched && f['email'].errors?.['required']">
              Email is required
            </div>
            <div class="invalid-feedback" *ngIf="f['email'].touched && f['email'].errors?.['email']">
              Please enter a valid email address
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <div class="password-input-wrap">
              <input
                id="password"
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                class="form-control"
                placeholder="••••••••"
                [class.is-invalid]="f['password'].touched && f['password'].invalid"
              />
              <button
                type="button"
                class="btn-password-toggle"
                (click)="showPassword = !showPassword"
                tabindex="-1"
                aria-label="Toggle password visibility"
              >
                <app-icon [name]="showPassword ? 'eye-off' : 'eye'" [size]="17"></app-icon>
              </button>
            </div>
            <div class="invalid-feedback" *ngIf="f['password'].touched && f['password'].errors?.['required']">
              Password is required
            </div>
          </div>

          <div class="form-extra">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="rememberMe" />
              <span>Remember me</span>
            </label>
            <span class="terms-note">Frontend Demo Mode</span>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loginForm.invalid || isSubmitting">
            <app-icon name="check" [size]="18" *ngIf="!isSubmitting"></app-icon>
            <span>{{ isSubmitting ? 'Authenticating...' : 'Sign In to Workspace' }}</span>
          </button>
        </form>

        <!-- Quick Demo Accounts Selector -->
        <div class="demo-accounts-section">
          <div class="divider">
            <span>QUICK DEMO SIGN-IN</span>
          </div>
          <p class="demo-hint">Click any role button below to automatically load credentials:</p>
          <div class="demo-buttons-grid">
            <button type="button" class="demo-btn" (click)="fillCredentials('admin@erp.com', 'admin123')">
              <strong>Admin (Full Access)</strong>
              <span>admin&#64;erp.com</span>
            </button>
            <button type="button" class="demo-btn" (click)="fillCredentials('hr@erp.com', 'hr123')">
              <strong>HR Manager</strong>
              <span>hr&#64;erp.com</span>
            </button>
            <button type="button" class="demo-btn" (click)="fillCredentials('inventory@erp.com', 'inventory123')">
              <strong>Inventory Manager</strong>
              <span>inventory&#64;erp.com</span>
            </button>
            <button type="button" class="demo-btn" (click)="fillCredentials('sales@erp.com', 'sales123')">
              <strong>Sales Manager</strong>
              <span>sales&#64;erp.com</span>
            </button>
            <button type="button" class="demo-btn" (click)="fillCredentials('finance@erp.com', 'finance123')">
              <strong>Finance Manager</strong>
              <span>finance&#64;erp.com</span>
            </button>
            <button type="button" class="demo-btn" (click)="fillCredentials('employee@erp.com', 'employee123')">
              <strong>Employee Self-Service</strong>
              <span>employee&#64;erp.com</span>
            </button>
          </div>
        </div>

        <div class="login-footer">
          <p>HCL Integrated ERP System &bull; Frontend LocalStorage Demonstration</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 20%, #1e293b 0%, #0f172a 100%);
      padding: 24px;
    }
    .login-card {
      width: 100%;
      max-width: 480px;
      background: #ffffff;
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .login-header {
      text-align: center;
      margin-bottom: 24px;
    }
    .brand-badge {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4);
    }
    .login-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .login-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 4px;
    }
    .alert-box {
      background: #fee2e2;
      border: 1px solid #fca5a5;
      color: #991b1b;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .login-form .form-group {
      margin-bottom: 16px;
    }
    .password-input-wrap {
      position: relative;
    }
    .btn-password-toggle {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-password-toggle:hover {
      color: #0f172a;
    }
    .form-extra {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 0.85rem;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #475569;
      cursor: pointer;
    }
    .terms-note {
      color: #94a3b8;
      font-size: 0.775rem;
    }
    .btn-block {
      width: 100%;
      padding: 11px;
      font-size: 0.95rem;
      font-weight: 600;
    }
    .demo-accounts-section {
      margin-top: 28px;
    }
    .divider {
      position: relative;
      text-align: center;
      margin-bottom: 12px;
    }
    .divider::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e2e8f0;
    }
    .divider span {
      position: relative;
      background: #ffffff;
      padding: 0 10px;
      font-size: 0.7rem;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.05em;
    }
    .demo-hint {
      font-size: 0.775rem;
      color: #64748b;
      margin-bottom: 10px;
      text-align: center;
    }
    .demo-buttons-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .demo-btn {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 7px 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      transition: all 0.15s ease;
      text-align: left;
    }
    .demo-btn strong {
      font-size: 0.775rem;
      color: #0f172a;
    }
    .demo-btn span {
      font-size: 0.675rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }
    .demo-btn:hover {
      background: #eff6ff;
      border-color: #93c5fd;
    }
    .login-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 0.75rem;
      color: #94a3b8;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  showPassword = false;
  isSubmitting = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['admin@erp.com', [Validators.required, Validators.email]],
      password: ['admin123', [Validators.required]],
      rememberMe: [true]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  fillCredentials(email: string, pass: string): void {
    this.loginForm.patchValue({
      email,
      password: pass
    });
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    const { email, password, rememberMe } = this.loginForm.value;
    const res = this.auth.login(email, password, rememberMe);

    if (res.success) {
      const user = this.auth.currentUser();
      if (user?.role === 'Employee') {
        this.router.navigate(['/hr/leave']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.errorMessage = res.message || 'Authentication failed. Please check credentials.';
      this.isSubmitting = false;
    }
  }
}

