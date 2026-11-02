import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="erp-badge" [ngClass]="badgeClass">
      <span class="badge-dot" *ngIf="showDot"></span>
      {{ text }}
    </span>
  `,
  styles: [`
    .erp-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1.25;
      letter-spacing: 0.02em;
      white-space: nowrap;
      text-transform: capitalize;
    }
    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }
    .badge-success {
      background-color: #dcfce7;
      color: #15803d;
    }
    .badge-warning {
      background-color: #fef3c7;
      color: #b45309;
    }
    .badge-danger {
      background-color: #fee2e2;
      color: #b91c1c;
    }
    .badge-info {
      background-color: #e0f2fe;
      color: #0369a1;
    }
    .badge-primary {
      background-color: #dbeafe;
      color: #1d4ed8;
    }
    .badge-neutral {
      background-color: #f1f5f9;
      color: #475569;
    }

    :host-context([data-theme="dark"]) {
      .badge-success { background-color: rgba(22, 163, 74, 0.2); color: #4ade80; }
      .badge-warning { background-color: rgba(245, 158, 11, 0.2); color: #fbbf24; }
      .badge-danger { background-color: rgba(220, 38, 38, 0.2); color: #f87171; }
      .badge-info { background-color: rgba(2, 132, 199, 0.2); color: #38bdf8; }
      .badge-primary { background-color: rgba(37, 99, 235, 0.2); color: #60a5fa; }
      .badge-neutral { background-color: rgba(148, 163, 184, 0.2); color: #cbd5e1; }
    }
  `]
})
export class BadgeComponent {
  @Input() text = '';
  @Input() variant: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral' | 'auto' = 'auto';
  @Input() showDot = true;

  get badgeClass(): string {
    if (this.variant !== 'auto') {
      return `badge-${this.variant}`;
    }

    const val = (this.text || '').toLowerCase().trim();
    if (['active', 'approved', 'in stock', 'received', 'delivered', 'paid', 'full-time', 'completed'].includes(val)) {
      return 'badge-success';
    }
    if (['pending', 'pending approval', 'low stock', 'partially received', 'processing', 'partially paid', 'probation', 'in_progress'].includes(val)) {
      return 'badge-warning';
    }
    if (['out of stock', 'rejected', 'cancelled', 'overdue', 'terminated'].includes(val)) {
      return 'badge-danger';
    }
    if (['confirmed', 'ordered', 'shipped', 'contract'].includes(val)) {
      return 'badge-info';
    }
    if (['draft', 'unpaid', 'part-time'].includes(val)) {
      return 'badge-neutral';
    }
    return 'badge-primary';
  }
}

