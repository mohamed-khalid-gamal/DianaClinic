import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card" [class.clickable]="clickable" (click)="onClick()">
      <div class="stat-icon" [style.background]="iconBg">
        <i [class]="icon"></i>
      </div>
      <div class="stat-content">
        <span class="stat-value">{{ value }}</span>
        <span class="stat-label">{{ label }}</span>
      </div>
      <div class="stat-trend" *ngIf="trend !== undefined && trend !== null" [class.positive]="trend > 0" [class.negative]="trend < 0" [class.neutral]="trend === 0">
        <span>{{ trend > 0 ? '+' : '' }}{{ trend | number:'1.0-1' }}%</span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .stat-card {
      background: var(--bg-card);
      border-radius: var(--radius-xl);
      padding: 1.25rem 1.25rem 1.25rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
      min-width: 0;
      height: 100%;
      position: relative;
    }

    .stat-card.clickable {
      cursor: pointer;
    }

    .stat-card.clickable:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      color: var(--primary-color);
      flex-shrink: 0;
    }

    .stat-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .stat-value {
      font-size: clamp(1.15rem, 1vw + 0.75rem, 1.65rem);
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stat-label {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
      white-space: nowrap;
    }

    .stat-trend {
      position: absolute;
      top: 0.625rem;
      right: 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.15rem 0.4rem;
      border-radius: var(--radius-md);
      white-space: nowrap;
    }

    .stat-trend.positive {
      color: var(--success-color);
      background: rgba(16, 185, 129, 0.1);
    }

    .stat-trend.negative {
      color: var(--danger-color);
      background: rgba(239, 68, 68, 0.1);
    }

    .stat-trend.neutral {
      color: var(--text-muted);
      background: var(--bg-body);
    }

    @media (max-width: 640px) {
      .stat-card {
        padding: 0.875rem;
        gap: 0.625rem;
      }

      .stat-icon {
        width: 40px;
        height: 40px;
        font-size: 1rem;
      }

      .stat-trend {
        font-size: 0.7rem;
        top: 0.5rem;
        right: 0.5rem;
      }
    }
  `]
})
export class StatCardComponent {
  @Input() icon = 'fa-solid fa-chart-line';
  @Input() iconBg = 'var(--primary-light)';
  @Input() value: string | number = 0;
  @Input() label = '';
  @Input() trend?: number;
  @Input() clickable = false;
  @Output() cardClick = new EventEmitter<void>();

  onClick() {
    if (this.clickable) {
      this.cardClick.emit();
    }
  }
}

