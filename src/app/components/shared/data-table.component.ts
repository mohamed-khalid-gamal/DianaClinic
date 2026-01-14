import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'currency' | 'badge' | 'actions';
  width?: string;
  badgeColors?: { [key: string]: string };
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="table-container">
      <div class="table-header" *ngIf="searchable || filterable">
        <div class="search-box" *ngIf="searchable">
          <input type="text" 
                 placeholder="Search..." 
                 [(ngModel)]="searchQuery"
                 (input)="onSearch()">
        </div>
      </div>
      
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th *ngFor="let col of columns" [style.width]="col.width">
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of filteredData; let i = index" 
                [class.clickable]="rowClickable"
                (click)="onRowClick(row)">
              <td *ngFor="let col of columns">
                <ng-container [ngSwitch]="col.type">
                  <span *ngSwitchCase="'date'">{{ formatDate(row[col.key]) }}</span>
                  <span *ngSwitchCase="'currency'">{{ formatCurrency(row[col.key]) }}</span>
                  <span *ngSwitchCase="'badge'" 
                        class="badge" 
                        [style.background]="getBadgeColor(row[col.key], col.badgeColors)">
                    {{ row[col.key] }}
                  </span>
                  <div *ngSwitchCase="'actions'" class="actions">
                    <button class="action-btn" (click)="onEdit(row, $event)" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete" (click)="onDelete(row, $event)" title="Delete"><i class="fa-solid fa-trash"></i></button>
                  </div>
                  <span *ngSwitchDefault>{{ row[col.key] }}</span>
                </ng-container>
              </td>
            </tr>
            <tr *ngIf="filteredData.length === 0">
              <td [attr.colspan]="columns.length" class="empty-state">
                No data available
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="table-footer" *ngIf="paginated">
        <span class="page-info">Showing {{ startIndex + 1 }}-{{ endIndex }} of {{ data.length }}</span>
        <div class="pagination">
          <button (click)="prevPage()" [disabled]="currentPage === 1"><i class="fa-solid fa-chevron-left"></i></button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button (click)="nextPage()" [disabled]="currentPage === totalPages"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-container {
      background: var(--bg-card);
      border-radius: var(--radius-xl);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }
    
    .table-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      gap: 1rem;
    }
    
    .search-box input {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      width: 300px;
      outline: none;
      transition: border-color 0.2s;
    }
    
    .search-box input:focus {
      border-color: var(--primary-color);
    }
    
    .table-wrapper {
      overflow-x: auto;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th, td {
      padding: 1rem 1.5rem;
      text-align: left;
    }
    
    th {
      background: var(--bg-body);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    
    tr {
      border-bottom: 1px solid var(--border-color);
    }
    
    tbody tr:hover {
      background: var(--bg-body);
    }
    
    tbody tr.clickable {
      cursor: pointer;
    }
    
    tbody tr:last-child {
      border-bottom: none;
    }
    
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      color: white;
      text-transform: capitalize;
    }
    
    .actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: var(--radius-md);
      transition: background 0.2s;
    }
    
    .action-btn:hover {
      background: var(--bg-body);
    }
    
    .action-btn.delete:hover {
      background: rgba(239, 68, 68, 0.1);
    }
    
    .empty-state {
      text-align: center;
      color: var(--text-muted);
      padding: 3rem !important;
    }
    
    .table-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .page-info {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    
    .pagination {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .pagination button {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .pagination button:hover:not(:disabled) {
      background: var(--bg-body);
    }
    
    .pagination button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class DataTableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() searchable = true;
  @Input() filterable = false;
  @Input() paginated = true;
  @Input() pageSize = 10;
  @Input() rowClickable = false;
  
  @Output() rowClick = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() search = new EventEmitter<string>();

  searchQuery = '';
  currentPage = 1;

  get filteredData(): any[] {
    let result = this.data;
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(val =>
          String(val).toLowerCase().includes(query)
        )
      );
    }
    if (this.paginated) {
      const start = (this.currentPage - 1) * this.pageSize;
      result = result.slice(start, start + this.pageSize);
    }
    return result;
  }

  get totalPages(): number {
    return Math.ceil(this.data.length / this.pageSize);
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.data.length);
  }

  onSearch() {
    this.currentPage = 1;
    this.search.emit(this.searchQuery);
  }

  onRowClick(row: any) {
    if (this.rowClickable) {
      this.rowClick.emit(row);
    }
  }

  onEdit(row: any, event: Event) {
    event.stopPropagation();
    this.edit.emit(row);
  }

  onDelete(row: any, event: Event) {
    event.stopPropagation();
    this.delete.emit(row);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  formatDate(value: any): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(value: any): string {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(value);
  }

  getBadgeColor(value: string, colors?: { [key: string]: string }): string {
    if (colors && colors[value]) {
      return colors[value];
    }
    const defaultColors: { [key: string]: string } = {
      'active': 'var(--success)',
      'inactive': 'var(--secondary-color)',
      'scheduled': 'var(--primary-color)',
      'completed': 'var(--success)',
      'cancelled': 'var(--danger)',
      'pending': 'var(--warning)',
      'checked-in': 'var(--primary-color)',
      'in-progress': 'var(--warning)',
      'no-show': 'var(--danger)'
    };
    return defaultColors[value?.toLowerCase()] || 'var(--secondary-color)';
  }
}
