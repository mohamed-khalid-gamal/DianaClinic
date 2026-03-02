import '../../../test-setup';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Reports } from './reports';

describe('Reports Component', () => {
  let component: Reports;
  let dataServiceMock: any;
  let alertServiceMock: any;
  let cdrMock: any;

  beforeEach(() => {
    dataServiceMock = {
      getRevenueStats: vi.fn().mockReturnValue(of({ totalRevenue: 1000 })),
      getRevenueByService: vi.fn().mockReturnValue(of([])),
      getRevenueByDoctor: vi.fn().mockReturnValue(of([])),
      getRevenueByPeriod: vi.fn().mockReturnValue(of([])),
      getAppointmentStats: vi.fn().mockReturnValue(of({})),
      getPatientStats: vi.fn().mockReturnValue(of({})),
      getComparisonStats: vi.fn().mockReturnValue(of({})),
      getRoomUtilization: vi.fn().mockReturnValue(of([])),
      getDeviceUtilization: vi.fn().mockReturnValue(of([]))
    };

    alertServiceMock = {
      validationError: vi.fn(),
      success: vi.fn(),
      toast: vi.fn()
    };

    cdrMock = {
      markForCheck: vi.fn()
    };

    component = new Reports(dataServiceMock, alertServiceMock, cdrMock);
  });

  it('loads reports on init', async () => {
    await component.ngOnInit();
    expect(dataServiceMock.getRevenueStats).toHaveBeenCalled();
    expect(component.revenueStats).toEqual({ totalRevenue: 1000 });
  });

  it('refreshes reports', () => {
    component.refreshReports();
    expect(dataServiceMock.getRevenueStats).toHaveBeenCalled();
  });

  it('validates export if no data', () => {
    component.serviceRevenue = [];
    component.exportToCSV();
    expect(alertServiceMock.validationError).toHaveBeenCalled();
  });

  /*
  it('exports to CSV', () => {
    component.serviceRevenue = [{ service: 'Svc', revenue: 100, count: 1 }];
    
    // Mock DOM
    global.URL.createObjectURL = vi.fn();
    global.URL.revokeObjectURL = vi.fn();
    const mockAnchor = { href: '', download: '', click: vi.fn() };
    document.createElement = vi.fn().mockReturnValue(mockAnchor as any);

    component.exportToCSV();

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(alertServiceMock.success).toHaveBeenCalled();
  });
  */
});
