import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="modal-backdrop" *ngIf="isOpen" (click)="onBackdropClick($event)">
      <div class="modal-container" [ngClass]="'modal-' + size" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <h3 class="modal-title">{{ title }}</h3>
            <p class="modal-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
          </div>
          <button type="button" class="btn-close" (click)="close()" aria-label="Close">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
        <div class="modal-footer" *ngIf="showFooter">
          <ng-content select="[modal-footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: 16px;
      animation: fadeIn 0.15s ease-out;
    }
    .modal-container {
      background: var(--erp-card-bg, #ffffff);
      border-radius: 14px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--erp-border, #e2e8f0);
      animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-sm { max-width: 420px; }
    .modal-md { max-width: 580px; }
    .modal-lg { max-width: 800px; }
    .modal-xl { max-width: 1050px; }

    .modal-header {
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--erp-border, #e2e8f0);
    }
    .modal-title {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--erp-text-heading, #0f172a);
      margin: 0;
    }
    .modal-subtitle {
      font-size: 0.85rem;
      color: var(--erp-text-muted, #64748b);
      margin: 2px 0 0;
    }
    .btn-close {
      background: transparent;
      border: none;
      color: var(--erp-text-muted, #64748b);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .btn-close:hover {
      background: var(--erp-bg-hover, #f1f5f9);
      color: var(--erp-text-heading, #0f172a);
    }
    .modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }
    .modal-footer {
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid var(--erp-border, #e2e8f0);
      background: var(--erp-bg-subtle, #f8fafc);
      border-bottom-left-radius: 14px;
      border-bottom-right-radius: 14px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showFooter = true;
  @Input() closeOnBackdrop = true;

  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop && event.target === event.currentTarget) {
      this.close();
    }
  }
}

