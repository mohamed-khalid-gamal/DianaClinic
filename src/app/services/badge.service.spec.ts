import '../../test-setup';
import { BadgeService } from './badge.service';
import { AlertService } from './alert.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { of, BehaviorSubject } from 'rxjs';

describe('BadgeService', () => {
  let service: BadgeService;
  let alertServiceMock: any;

  beforeEach(() => {
    alertServiceMock = {
      getAlertCount: vi.fn(),
      refreshAlerts: vi.fn()
    };
    // Mock return values before instantiation because constructor subscribes
    alertServiceMock.getAlertCount.mockReturnValue(new BehaviorSubject(0));
    
    service = new BadgeService(alertServiceMock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update badge counts when alert service emits', () => {
    const inventorySubject = new BehaviorSubject(0);
    const devicesSubject = new BehaviorSubject(0);

    alertServiceMock.getAlertCount.mockImplementation((category: string) => {
      if (category === 'inventory') return inventorySubject;
      if (category === 'devices') return devicesSubject;
      return of(0);
    });

    // Re-instantiate to trigger subscriptions with new mocks
    service = new BadgeService(alertServiceMock);

    inventorySubject.next(5);
    devicesSubject.next(2);

    service.getBadgeCounts().subscribe(counts => {
      expect(counts.inventory).toBe(5);
      expect(counts.devices).toBe(2);
    });
  });

  it('refreshCounts should call alertService.refreshAlerts', () => {
    service.refreshCounts();
    expect(alertServiceMock.refreshAlerts).toHaveBeenCalled();
  });
});
