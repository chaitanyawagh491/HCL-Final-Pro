import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat-card" [ngClass]="'variant-' + variant">
      <div class="stat-header">
        <span class="stat-title">{{ title }}</span>
        <div class="icon-circle" [ngClass]="'icon-' + variant">
          <app-icon [name]="icon" [size]="20"></app-icon>
        </div>
      </div>
      <div class="stat-body">
        <div class="stat-value">{{ value }}</div>
        <div class="stat-footer" *ngIf="subtitle || trend">
          <span class="stat-trend" *ngIf="trend" [ngClass]="trend.isPositive ? 'trend-up' : 'trend-down'">
            <app-icon [name]="trend.isPositive ? 'trending-up' : 'trending-down'" [size]="14"></app-icon>
            {{ trend.text }}
          </span>
          <span class="stat-subtitle" *ngIf="subtitle">{{ subtitle }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: var(--erp-card-bg, #ffffff);
      border: 1px solid var(--erp-border, #e2e8f0);
      border-radius: 12px;
      padding: 18px 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
    }
    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .stat-title {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--erp-text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .icon-circle {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-primary { background: #eff6ff; color: #2563eb; }
    .icon-success { background: #f0fdf4; color: #16a34a; }
    .icon-warning { background: #fefce8; color: #ca8a04; }
    .icon-danger  { background: #fef2f2; color: #dc2626; }
    .icon-purple  { background: #faf5ff; color: #9333ea; }
    .icon-indigo  { background: #eef2ff; color: #4f46e5; }
    .icon-teal    { background: #f0fdfa; color: #0d9488; }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--erp-text-heading, #0f172a);
      line-height: 1.2;
    }
    .stat-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      font-size: 0.8rem;
    }
    .stat-trend {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-weight: 600;
    }
    .trend-up { color: #16a34a; }
    .trend-down { color: #dc2626; }
    .stat-subtitle {
      color: var(--erp-text-muted, #64748b);
    }
  `]
})
export class StatCardComponent {
  @Input() title = '';
  @Input() value: string | number = '';
  @Input() icon = 'bar-chart';
  @Input() variant: 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'indigo' | 'teal' = 'primary';
  @Input() subtitle?: string;
  @Input() trend?: { text: string; isPositive: boolean };
}

