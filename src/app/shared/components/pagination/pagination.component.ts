import { Component, Input, Output, EventEmitter, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pagination-container" *ngIf="totalItems > 0">
      <div class="pagination-info">
        Showing <strong>{{ startItem }}</strong> to <strong>{{ endItem }}</strong> of <strong>{{ totalItems }}</strong> entries
      </div>
      <div class="pagination-controls" *ngIf="totalPages > 1">
        <button
          type="button"
          class="page-btn"
          [disabled]="currentPage === 1"
          (click)="setPage(currentPage - 1)"
          aria-label="Previous page"
        >
          <app-icon name="chevron-left" [size]="16"></app-icon>
        </button>

        <button
          *ngFor="let page of visiblePages"
          type="button"
          class="page-btn"
          [class.active]="page === currentPage"
          [disabled]="page === -1"
          (click)="page !== -1 && setPage(page)"
        >
          {{ page === -1 ? '...' : page }}
        </button>

        <button
          type="button"
          class="page-btn"
          [disabled]="currentPage === totalPages"
          (click)="setPage(currentPage + 1)"
          aria-label="Next page"
        >
          <app-icon name="chevron-right" [size]="16"></app-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-top: 1px solid var(--erp-border, #e2e8f0);
      font-size: 0.85rem;
      color: var(--erp-text-muted, #64748b);
      flex-wrap: wrap;
      gap: 12px;
    }
    .pagination-info strong {
      color: var(--erp-text-heading, #0f172a);
    }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .page-btn {
      min-width: 32px;
      height: 32px;
      padding: 0 6px;
      border-radius: 6px;
      border: 1px solid var(--erp-border, #e2e8f0);
      background: var(--erp-card-bg, #ffffff);
      color: var(--erp-text, #334155);
      font-size: 0.825rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .page-btn:hover:not(:disabled) {
      background: var(--erp-bg-hover, #f1f5f9);
      border-color: #cbd5e1;
    }
    .page-btn.active {
      background: var(--erp-primary, #2563eb);
      color: #ffffff;
      border-color: var(--erp-primary, #2563eb);
    }
    .page-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  `]
})
export class PaginationComponent implements OnChanges {
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() currentPage = 1;

  @Output() pageChanged = new EventEmitter<number>();

  totalPages = 1;
  visiblePages: number[] = [];

  get startItem(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  ngOnChanges(): void {
    this.calculatePages();
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.calculatePages();
      this.pageChanged.emit(page);
    }
  }

  private calculatePages(): void {
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));
    const pages: number[] = [];

    if (this.totalPages <= 7) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (this.currentPage > 3) pages.push(-1);

      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (this.currentPage < this.totalPages - 2) pages.push(-1);
      pages.push(this.totalPages);
    }
    this.visiblePages = pages;
  }
}

