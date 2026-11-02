import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="confirm-backdrop" *ngIf="isOpen">
      <div class="confirm-card">
        <div class="confirm-icon" [ngClass]="'icon-' + variant">
          <app-icon [name]="iconName" [size]="24"></app-icon>
        </div>
        <div class="confirm-content">
          <h4 class="confirm-title">{{ title }}</h4>
          <p class="confirm-message">{{ message }}</p>
        </div>
        <div class="confirm-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()">
            {{ cancelText }}
          </button>
          <button type="button" class="btn" [ngClass]="'btn-' + variant" (click)="confirm()">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
      padding: 16px;
      animation: fadeIn 0.15s ease-out;
    }
    .confirm-card {
      background: var(--erp-card-bg, #ffffff);
      border-radius: 14px;
      padding: 24px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
      border: 1px solid var(--erp-border, #e2e8f0);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .confirm-icon {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .icon-danger { background: #fee2e2; color: #dc2626; }
    .icon-warning { background: #fef3c7; color: #d97706; }
    .icon-primary { background: #dbeafe; color: #2563eb; }

    .confirm-title {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--erp-text-heading, #0f172a);
      margin: 0 0 8px;
    }
    .confirm-message {
      font-size: 0.9rem;
      color: var(--erp-text-muted, #64748b);
      margin: 0 0 20px;
      line-height: 1.5;
    }
    .confirm-actions {
      display: flex;
      gap: 12px;
      width: 100%;
      justify-content: center;
    }
    .btn {
      padding: 9px 18px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
      flex: 1;
    }
    .btn-secondary {
      background: var(--erp-bg-subtle, #f1f5f9);
      color: var(--erp-text, #334155);
      border-color: var(--erp-border, #e2e8f0);
    }
    .btn-secondary:hover {
      background: #e2e8f0;
    }
    .btn-danger {
      background: #dc2626;
      color: #ffffff;
    }
    .btn-danger:hover {
      background: #b91c1c;
    }
    .btn-warning {
      background: #d97706;
      color: #ffffff;
    }
    .btn-warning:hover {
      background: #b45309;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed with this action? This operation cannot be undone.';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() variant: 'danger' | 'warning' | 'primary' = 'danger';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  get iconName(): string {
    if (this.variant === 'danger') return 'alert-circle';
    if (this.variant === 'warning') return 'clock';
    return 'check-circle';
  }

  confirm(): void {
    this.confirmed.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }
}

