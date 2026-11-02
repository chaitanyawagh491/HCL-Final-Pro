import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { StockMovement } from '../../../core/models/erp.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-stock-movements',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, IconComponent, EmptyStateComponent],
  template: `
    <div class="movements-page">
      <div class="erp-card-header">
        <div>
          <h2 class="erp-card-title">Stock Movements & Inventory Audit Log</h2>
          <p class="erp-card-subtitle">Real-time ledger of inbound purchases, sales deductions, and inventory adjustments</p>
        </div>
        <a routerLink="/inventory/products" class="btn btn-secondary btn-sm">
          <app-icon name="arrow-left" [size]="15"></app-icon>
          <span>Back to Product Catalog</span>
        </a>
      </div>

      <!-- Movements Table Card -->
      <div class="erp-card table-card">
        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Product & SKU</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reference Activity</th>
                <th>Reference Document</th>
                <th>Timestamp</th>
                <th>Authorized Performer</th>
                <th>Audit Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of inventoryService.stockMovements(); trackBy: trackById">
                <td><strong class="font-mono">{{ m.movementId }}</strong></td>
                <td>
                  <strong>{{ m.productName }}</strong>
                  <div class="text-xs text-muted">{{ m.sku }}</div>
                </td>
                <td>
                  <span class="type-pill" [ngClass]="'type-' + m.type.toLowerCase()">
                    {{ m.type }}
                  </span>
                </td>
                <td>
                  <strong [ngClass]="m.type === 'IN' ? 'text-success' : (m.type === 'OUT' ? 'text-danger' : 'text-primary')">
                    {{ m.type === 'IN' ? '+' : (m.type === 'OUT' ? '-' : '±') }}{{ m.quantity }}
                  </strong>
                </td>
                <td>
                  <span class="ref-pill">{{ formatRefType(m.referenceType) }}</span>
                </td>
                <td><span class="font-mono doc-tag">{{ m.referenceId }}</span></td>
                <td>{{ m.date }}</td>
                <td>{{ m.performedBy }}</td>
                <td class="text-xs text-muted">{{ m.notes }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <app-empty-state
          *ngIf="inventoryService.stockMovements().length === 0"
          icon="layers"
          title="No stock movements logged yet"
          description="Stock movements are automatically recorded when receiving goods from purchase orders or fulfilling sales orders."
        ></app-empty-state>
      </div>
    </div>
  `,
  styles: [`
    .movements-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .font-mono {
      font-family: var(--erp-font-mono);
    }
    .text-xs { font-size: 0.775rem; }
    .text-success { color: #16a34a !important; }
    .text-danger { color: #dc2626 !important; }
    .text-primary { color: #2563eb !important; }

    .type-pill {
      font-size: 0.725rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .type-in { background: #dcfce7; color: #15803d; }
    .type-out { background: #fee2e2; color: #b91c1c; }
    .type-adjustment { background: #dbeafe; color: #1d4ed8; }

    .ref-pill {
      font-size: 0.75rem;
      background: var(--erp-bg-subtle);
      border: 1px solid var(--erp-border);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .doc-tag {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--erp-primary);
    }
  `]
})
export class StockMovementsComponent {
  inventoryService = inject(InventoryService);

  trackById(index: number, m: StockMovement): string {
    return m.id || m.movementId || index.toString();
  }

  formatRefType(ref: string): string {
    return ref.replace(/_/g, ' ');
  }
}
