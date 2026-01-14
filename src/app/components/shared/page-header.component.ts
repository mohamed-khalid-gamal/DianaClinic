import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>{{ title }}</h1>
        <p class="subtitle" *ngIf="subtitle">{{ subtitle }}</p>
      </div>
      <div class="header-actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }
    
    h1 {
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-main);
      margin: 0;
    }
    
    .subtitle {
      color: var(--text-muted);
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
    }
    
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
