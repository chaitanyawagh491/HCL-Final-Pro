import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  NgZone,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart, { ChartConfiguration, ChartType } from 'chart.js/auto';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart-wrapper" [style.height.px]="height">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-wrapper {
      position: relative;
      width: 100%;
    }
    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `]
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() type: ChartType = 'bar';
  @Input() labels: string[] = [];
  @Input() datasets: any[] = [];
  @Input() options: any = {};
  @Input() height = 260;

  private ngZone = inject(NgZone);
  private chartInstance: Chart | null = null;
  private isDestroyed = false;

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.renderChart();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.chartInstance) return;

    if (changes['type']) {
      this.ngZone.runOutsideAngular(() => {
        this.renderChart();
      });
      return;
    }

    const labelsChanged = changes['labels'] && !this.areArraysEqual(changes['labels'].previousValue, changes['labels'].currentValue);
    const datasetsChanged = changes['datasets'] && !this.areDatasetsEqual(changes['datasets'].previousValue, changes['datasets'].currentValue);

    if (labelsChanged || datasetsChanged) {
      this.ngZone.runOutsideAngular(() => {
        if (this.chartInstance && !this.isDestroyed) {
          this.chartInstance.data.labels = [...this.labels];
          this.chartInstance.data.datasets = this.datasets.map(d => ({ ...d }));
          this.chartInstance.update('none'); // Update in-place without triggering heavy requestAnimationFrames
        }
      });
    }
  }

  private areArraysEqual(a: any[] | undefined, b: any[] | undefined): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  private areDatasetsEqual(a: any[] | undefined, b: any[] | undefined): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const da = a[i]?.data;
      const db = b[i]?.data;
      if (!this.areArraysEqual(da, db)) return false;
      if (a[i]?.label !== b[i]?.label) return false;
    }
    return true;
  }

  private renderChart(): void {
    if (this.isDestroyed || !this.canvasRef?.nativeElement) return;

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      plugins: {
        legend: {
          display: this.type === 'doughnut' || this.type === 'pie' || this.datasets.length > 1,
          position: (this.type === 'doughnut' || this.type === 'pie' ? 'bottom' : 'top') as any,
          labels: {
            boxWidth: 12,
            font: {
              family: 'Inter, sans-serif',
              size: 11
            },
            color: '#64748b'
          }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Inter, sans-serif', size: 12 },
          bodyFont: { family: 'Inter, sans-serif', size: 11 },
          padding: 10,
          cornerRadius: 8
        }
      },
      scales: (this.type === 'doughnut' || this.type === 'pie') ? {} : {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter, sans-serif', size: 11 }, color: '#64748b' }
        },
        y: {
          grid: { color: '#f1f5f9' },
          ticks: { font: { family: 'Inter, sans-serif', size: 11 }, color: '#64748b' }
        }
      }
    };

    const config: ChartConfiguration = {
      type: this.type,
      data: {
        labels: [...this.labels],
        datasets: this.datasets.map(d => ({ ...d }))
      },
      options: {
        ...defaultOptions,
        ...this.options
      }
    };

    this.chartInstance = new Chart(ctx, config);
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}
