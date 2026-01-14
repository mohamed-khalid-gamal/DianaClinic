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
      <div class="stat-trend" *ngIf="trend" [class.positive]="trend > 0" [class.negative]="trend < 0">
        <span>{{ trend > 0 ? '+' : '' }}{{ trend }}%</span>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: var(--bg-card);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
    }
    
    .stat-card.clickable {
      cursor: pointer;
    }
    
    .stat-card.clickable:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
    
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: var(--primary-color);
    }
    
    .stat-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.2;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
    
    .stat-trend {
      font-size: 0.875rem;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-md);
    }
    
    .stat-trend.positive {
      color: var(--success);
      background: rgba(16, 185, 129, 0.1);
    }
    
    .stat-trend.negative {
      color: var(--danger);
      background: rgba(239, 68, 68, 0.1);
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

