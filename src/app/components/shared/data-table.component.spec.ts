import '../../../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataTableComponent, TableColumn } from './data-table.component';

describe('DataTableComponent', () => {
  let component: DataTableComponent;

  const mockData = [
    { id: 1, name: 'Item 1', status: 'Active' },
    { id: 2, name: 'Item 2', status: 'Inactive' }
  ];

  const mockColumns: TableColumn[] = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'status', label: 'Status', type: 'badge' }
  ];

  beforeEach(() => {
    component = new DataTableComponent();
    component.data = mockData;
    component.columns = mockColumns;
    component.search = { emit: vi.fn() } as any;
    component.rowClick = { emit: vi.fn() } as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter data by search query', () => {
    component.searchQuery = 'Item 1';
    expect(component.filteredData.length).toBe(1);
    expect(component.filteredData[0].name).toBe('Item 1');
  });

  it('should paginate data', () => {
    component.pageSize = 1;
    component.currentPage = 1;
    expect(component.filteredData.length).toBe(1);
    expect(component.filteredData[0].id).toBe(1);

    component.nextPage();
    expect(component.currentPage).toBe(2);
    expect(component.filteredData[0].id).toBe(2);
  });

  it('should emit row click', () => {
    component.rowClickable = true;
    component.onRowClick(mockData[0]);
    expect(component.rowClick.emit).toHaveBeenCalledWith(mockData[0]);
  });
});
