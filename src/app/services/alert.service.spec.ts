import '../../test-setup';
import { AlertService } from './alert.service';
import { DataService } from './data.service';
import { InventoryItem, Device } from '../models';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';

describe('AlertService', () => {
  let service: AlertService;
  let dataServiceMock: any;

  beforeEach(() => {
    // Mock localStorage
    const store: any = {};
    const localStorageMock = {
      getItem: (key: string) => store[key],
      setItem: (key: string, value: string) => { store[key] = value.toString(); },
      clear: () => { }
    };
    vi.stubGlobal('localStorage', localStorageMock);

    dataServiceMock = {
      getInventory: vi.fn(),
      getDevices: vi.fn()
    };

    service = new AlertService(dataServiceMock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('refreshAlerts should generate alerts for low stock', () => {
    const mockInventory: InventoryItem[] = [
      { id: 'i1', name: 'Item 1', quantity: 5, reorderThreshold: 10, unit: 'pcs' } as any
    ];
    dataServiceMock.getInventory.mockReturnValue(of(mockInventory));
    dataServiceMock.getDevices.mockReturnValue(of([]));

    service.refreshAlerts(); // Triggers subscription

    service.getAlerts().subscribe(alerts => {
      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('low_stock');
      expect(alerts[0].title).toBe('Low Stock');
    });
  });

  it('refreshAlerts should generate alerts for expiring items', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5); // Expires in 5 days
    const mockInventory: InventoryItem[] = [
      { id: 'i2', name: 'Item 2', quantity: 20, reorderThreshold: 10, expiryDate: futureDate } as any
    ];
    dataServiceMock.getInventory.mockReturnValue(of(mockInventory));
    dataServiceMock.getDevices.mockReturnValue(of([]));

    service.refreshAlerts();

    service.getAlerts().subscribe(alerts => {
      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('expiry');
    });
  });

  it('snoozeAlert should hide alert', () => {
     // Setup alert
    const mockInventory: InventoryItem[] = [
      { id: 'i1', name: 'Item 1', quantity: 5, reorderThreshold: 10 } as any
    ];
    dataServiceMock.getInventory.mockReturnValue(of(mockInventory));
    dataServiceMock.getDevices.mockReturnValue(of([]));
    service.refreshAlerts();

    let alertId = '';
    service.getAlerts().subscribe(alerts => {
      if (alerts.length > 0) alertId = alerts[0].id;
    });

    service.snoozeAlert(alertId);

    service.getAlerts().subscribe(alerts => {
      expect(alerts.length).toBe(0);
    });
  });
});
