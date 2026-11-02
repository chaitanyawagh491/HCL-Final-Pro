import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart, { ChartConfiguration, ChartType } from 'chart.js/auto';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
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

  private chartInstance: Chart | null = null;

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chartInstance && (changes['labels'] || changes['datasets'] || changes['type'])) {
      this.chartInstance.destroy();
      this.renderChart();
    }
  }

  private renderChart(): void {
    if (!this.canvasRef?.nativeElement) return;

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
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
        labels: this.labels,
        datasets: this.datasets
      },
      options: {
        ...defaultOptions,
        ...this.options
      }
    };

    this.chartInstance = new Chart(ctx, config);
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}

