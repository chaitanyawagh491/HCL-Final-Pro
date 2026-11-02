import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="empty-state">
      <div class="empty-icon-wrap">
        <app-icon [name]="icon" [size]="36"></app-icon>
      </div>
      <h4 class="empty-title">{{ title }}</h4>
      <p class="empty-description" *ngIf="description">{{ description }}</p>
      <div class="empty-action" *ngIf="actionLabel">
        <button type="button" class="btn btn-primary" (click)="actionClicked.emit()">
          <app-icon name="plus" [size]="16" *ngIf="showAddIcon"></app-icon>
          {{ actionLabel }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .empty-state {
      padding: 48px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .empty-icon-wrap {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--erp-bg-subtle, #f1f5f9);
      color: var(--erp-text-muted, #94a3b8);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .empty-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--erp-text-heading, #1e293b);
      margin: 0 0 6px;
    }
    .empty-description {
      font-size: 0.875rem;
      color: var(--erp-text-muted, #64748b);
      max-width: 420px;
      margin: 0 0 20px;
      line-height: 1.5;
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--erp-primary, #2563eb);
      color: #ffffff;
      padding: 9px 18px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-primary:hover {
      background: var(--erp-primary-dark, #1d4ed8);
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'box';
  @Input() title = 'No records found';
  @Input() description = 'There is currently no data matching your criteria or no items have been added yet.';
  @Input() actionLabel?: string;
  @Input() showAddIcon = true;

  @Output() actionClicked = new EventEmitter<void>();
}

