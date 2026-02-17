import '../../../../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsPanelComponent } from './notifications-panel.component';
import { of } from 'rxjs';

describe('NotificationsPanelComponent', () => {
  let component: NotificationsPanelComponent;
  let alertServiceMock: any;

  beforeEach(() => {
    alertServiceMock = {
      getAlerts: vi.fn().mockReturnValue(of([])),
      dismissAlert: vi.fn(),
      snoozeAlert: vi.fn()
    };

    component = new NotificationsPanelComponent(alertServiceMock);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load alerts on init', () => {
    const mockAlerts = [{ id: '1', message: 'Low Stock' }];
    alertServiceMock.getAlerts.mockReturnValue(of(mockAlerts));

    component.ngOnInit();
    expect(alertServiceMock.getAlerts).toHaveBeenCalled();
    expect(component.alerts).toBe(mockAlerts);
  });

  it('should dismiss alert', () => {
    const alert = { id: '1' } as any;
    component.dismissAlert(alert);
    expect(alertServiceMock.dismissAlert).toHaveBeenCalledWith('1');
  });

  it('should snooze alert', () => {
    const alert = { id: '1' } as any;
    component.snoozeAlert(alert);
    expect(alertServiceMock.snoozeAlert).toHaveBeenCalledWith('1');
  });
});
