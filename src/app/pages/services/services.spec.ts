import '../../../test-setup';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Services } from './services';
import { Service, ServiceCategory, Doctor, InventoryItem, InventoryCategory } from '../../models';

describe('Services Component', () => {
  let component: Services;
  let dataServiceMock: any;
  let alertServiceMock: any;
  let cdrMock: any;

  const mockServices: Service[] = [
    { 
      id: 's1', 
      name: 'Service 1', 
      categoryId: 'c1',
      description: 'Desc',
      duration: 30,
      pricingModels: [{ type: 'fixed', basePrice: 100 }],
      isActive: true,
      allowedDoctorIds: [],
      requiredRoomTypes: [],
      consumables: []
    } as any
  ];

  const mockCategories: ServiceCategory[] = [
    { id: 'c1', name: 'Cat 1' }
  ];

  const mockDoctors: Doctor[] = [
    { id: 'd1', name: 'Dr. Smith' } as any
  ];

  const mockInventoryCategories: InventoryCategory[] = [
    { id: 'ic1', name: 'Consumable' },
    { id: 'ic2', name: 'Equipment' }
  ];

  const mockInventory: InventoryItem[] = [
    { id: 'i1', name: 'Item 1', category: 'ic1' } as any,
    { id: 'i2', name: 'Item 2', category: 'ic2' } as any
  ];

  beforeEach(() => {
    dataServiceMock = {
      getServices: vi.fn().mockReturnValue(of(mockServices)),
      getCategories: vi.fn().mockReturnValue(of(mockCategories)),
      getDoctors: vi.fn().mockReturnValue(of(mockDoctors)),
      getInventory: vi.fn().mockReturnValue(of(mockInventory)),
      getInventoryCategories: vi.fn().mockReturnValue(of(mockInventoryCategories)),
      addService: vi.fn().mockReturnValue(of(mockServices[0])),
      updateService: vi.fn().mockReturnValue(of(mockServices[0])),
      deleteService: vi.fn().mockReturnValue(of(void 0)),
      addCategory: vi.fn().mockReturnValue(of(mockCategories[0])),
      updateCategory: vi.fn().mockReturnValue(of(void 0)),
      deleteCategory: vi.fn().mockReturnValue(of(void 0))
    };

    alertServiceMock = {
      validationError: vi.fn(),
      created: vi.fn(),
      updated: vi.fn(),
      deleted: vi.fn(),
      toast: vi.fn(),
      confirm: vi.fn().mockResolvedValue(true),
      confirmDelete: vi.fn().mockResolvedValue(true)
    };

    cdrMock = {
      markForCheck: vi.fn()
    };

    const formErrorServiceMock = {
      handleBackendErrors: vi.fn()
    };

    component = new Services(dataServiceMock, alertServiceMock, formErrorServiceMock as any, cdrMock);
  });

  it('loads data on init', () => {
    component.ngOnInit();
    expect(dataServiceMock.getServices).toHaveBeenCalled();
    expect(dataServiceMock.getCategories).toHaveBeenCalled();
    expect(dataServiceMock.getInventoryCategories).toHaveBeenCalled();
    expect(component.services.length).toBe(1);
    expect(component.categories.length).toBe(1);
    expect(component.doctors.length).toBe(1);
    expect(component.inventoryItems.length).toBe(2); // Should have all items
    expect(component.inventoryItems[0].id).toBe('i1');
    expect(component.inventoryItems[1].id).toBe('i2');
  });

  it('filters services by category', () => {
    component.services = [
      { ...mockServices[0], id: 's1', categoryId: 'c1' },
      { ...mockServices[0], id: 's2', categoryId: 'c2' }
    ];

    component.selectedCategory = 'all';
    expect(component.filteredServices.length).toBe(2);

    component.selectedCategory = 'c1';
    expect(component.filteredServices.length).toBe(1);
    expect(component.filteredServices[0].id).toBe('s1');
  });

  it('validates form before saving', () => {
    component.serviceForm = {};
    component.saveService();
    expect(alertServiceMock.validationError).toHaveBeenCalled();
    expect(dataServiceMock.addService).not.toHaveBeenCalled();
  });

  it('adds new service', () => {
    component.serviceForm = { 
      name: 'New Service', 
      categoryId: 'c1',
      duration: 30,
      pricingModels: [{ type: 'fixed', basePrice: 100 }]
    };
    component.isEditMode = false;

    component.saveService();

    expect(dataServiceMock.addService).toHaveBeenCalled();
    expect(alertServiceMock.created).toHaveBeenCalled();
  });

  it('toggles pricing types', () => {
    component.serviceForm = { pricingModels: [] };
    
    component.togglePricingType('fixed');
    expect(component.serviceForm.pricingModels?.length).toBe(1);
    expect(component.serviceForm.pricingModels?.[0].type).toBe('fixed');

    component.togglePricingType('fixed');
    expect(component.serviceForm.pricingModels?.length).toBe(0);
  });
});
