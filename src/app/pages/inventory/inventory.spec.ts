import '../../../test-setup';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Inventory } from './inventory';
import { InventoryItem, InventoryCategory } from '../../models';

describe('Inventory Component', () => {
  let component: Inventory;
  let dataServiceMock: any;
  let sweetAlertMock: any;
  let formErrorServiceMock: any;
  let notificationServiceMock: any;
  let cdrMock: any;

  const mockItems: InventoryItem[] = [
    { 
      id: 'i1', 
      name: 'Item 1', 
      sku: 'SKU1', 
      category: 'c1', 
      quantity: 5, 
      reorderThreshold: 10,
      expiryDate: new Date('2030-01-01'),
      costPrice: 10,
      sellingPrice: 20
    } as any,
    { 
      id: 'i2', 
      name: 'Item 2', 
      sku: 'SKU2', 
      category: 'c2', 
      quantity: 20, 
      reorderThreshold: 5,
      expiryDate: new Date('2020-01-01'), // Expired
      costPrice: 15,
      sellingPrice: 25
    } as any
  ];

  const mockCategories: InventoryCategory[] = [
    { id: 'c1', name: 'Cat 1' },
    { id: 'c2', name: 'Cat 2' }
  ];

  beforeEach(() => {
    dataServiceMock = {
      getInventory: vi.fn().mockReturnValue(of(mockItems)),
      getInventoryCategories: vi.fn().mockReturnValue(of(mockCategories)),
      addInventoryItem: vi.fn().mockReturnValue(of(mockItems[0])),
      updateInventoryItem: vi.fn().mockReturnValue(of(mockItems[0])),
      deleteInventoryItem: vi.fn().mockReturnValue(of(void 0)),
      addInventoryCategory: vi.fn().mockReturnValue(of(mockCategories[0])),
      updateInventoryCategory: vi.fn().mockReturnValue(of(void 0)),
      deleteInventoryCategory: vi.fn().mockReturnValue(of(void 0))
    };

    sweetAlertMock = {
      validationError: vi.fn(),
      created: vi.fn(),
      updated: vi.fn(),
      deleted: vi.fn(),
      toast: vi.fn(),
      confirm: vi.fn().mockResolvedValue(true),
      confirmDelete: vi.fn().mockResolvedValue(true)
    };

    formErrorServiceMock = {
      handleBackendErrors: vi.fn()
    };

    notificationServiceMock = {
      getAlertCount: vi.fn().mockReturnValue(of(5))
    };

    cdrMock = {
      markForCheck: vi.fn(),
      detectChanges: vi.fn()
    };

    component = new Inventory(dataServiceMock, sweetAlertMock, formErrorServiceMock, notificationServiceMock, cdrMock);
  });

  it('loads data and alerts on init', () => {
    component.ngOnInit();
    expect(dataServiceMock.getInventory).toHaveBeenCalled();
    expect(dataServiceMock.getInventoryCategories).toHaveBeenCalled();
    expect(notificationServiceMock.getAlertCount).toHaveBeenCalledWith('inventory');
    expect(component.items.length).toBe(2);
    expect(component.categories.length).toBe(2);
    expect(component.alertCount).toBe(5);
  });

  it('filters items correctly', () => {
    component.items = mockItems;

    // All
    component.activeFilter = 'all';
    expect(component.filteredItems.length).toBe(2);

    // Low stock (Item 1: 5 <= 10)
    component.activeFilter = 'low';
    expect(component.filteredItems.length).toBe(1);
    expect(component.filteredItems[0].id).toBe('i1');

    // Category
    component.activeFilter = 'c2';
    expect(component.filteredItems.length).toBe(1);
    expect(component.filteredItems[0].id).toBe('i2');
  });

  it('determines stock status', () => {
    const lowItem = { ...mockItems[0], quantity: 5, reorderThreshold: 10 };
    expect(component.getStockStatus(lowItem)).toBe('Low Stock');

    const outItem = { ...mockItems[0], quantity: 0 };
    expect(component.getStockStatus(outItem)).toBe('Out of Stock');

    const expiringItem = { ...mockItems[0], quantity: 20, reorderThreshold: 5, expiryDate: new Date(Date.now() + 86400000 * 10) }; // 10 days
    expect(component.getStockStatus(expiringItem)).toBe('Expiring');
    
    const okItem = { ...mockItems[0], quantity: 20, reorderThreshold: 5, expiryDate: new Date(Date.now() + 86400000 * 100) };
    expect(component.getStockStatus(okItem)).toBe('In Stock');
  });

  it('saves new item', () => {
    component.itemForm = { name: 'New Item', sku: 'NEW1', category: 'c1', quantity: 10 };
    component.isEditMode = false;

    component.saveItem();

    expect(dataServiceMock.addInventoryItem).toHaveBeenCalled();
    expect(sweetAlertMock.created).toHaveBeenCalled();
  });

  it('updates existing item', () => {
    component.itemForm = { ...mockItems[0] };
    component.isEditMode = true;

    component.saveItem();

    expect(dataServiceMock.updateInventoryItem).toHaveBeenCalled();
    expect(sweetAlertMock.updated).toHaveBeenCalled();
  });

  it('manages categories', () => {
    component.newCategoryName = 'New Cat';
    component.addNewCategory();
    expect(dataServiceMock.addInventoryCategory).toHaveBeenCalled();
    
    component.editingCategoryName = 'Updated Cat';
    component.saveCategory(mockCategories[0]);
    expect(dataServiceMock.updateInventoryCategory).toHaveBeenCalled();
  });

  it('prevents saving when expiry date is today or in the past', () => {
    component.itemForm = { 
      name: 'Expired Item', 
      sku: 'EXP1', 
      category: 'c1', 
      quantity: 10, 
      costPrice: 10,
      sellingPrice: 20
    };
    
    // Test past date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    component.itemForm.expiryDate = pastDate;
    
    component.saveItem();
    expect(sweetAlertMock.validationError).toHaveBeenCalledWith('Expiration date cannot be today or in the past');
    expect(dataServiceMock.addInventoryItem).not.toHaveBeenCalled();

    // Test today's date
    const today = new Date();
    component.itemForm.expiryDate = today;
    
    component.saveItem();
    expect(sweetAlertMock.validationError).toHaveBeenCalledWith('Expiration date cannot be today or in the past');
    expect(dataServiceMock.addInventoryItem).not.toHaveBeenCalled();
  });

  /*
  it.skip('deletes item after confirmation', async () => {
    await component.deleteItem(mockItems[0]);
    expect(dataServiceMock.deleteInventoryItem).toHaveBeenCalled();
    expect(sweetAlertMock.deleted).toHaveBeenCalled();
  });
  */
});
