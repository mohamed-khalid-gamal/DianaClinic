import '../../../test-setup';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Devices } from './devices';
import { Device, Room } from '../../models';

describe('Devices Component', () => {
  let component: Devices;
  let dataServiceMock: any;
  let sweetAlertMock: any;
  let notificationServiceMock: any;
  let cdrMock: any;

  const mockDevices: Device[] = [
    { 
      id: 'd1', 
      name: 'Device 1', 
      roomId: 'r1',
      status: 'active',
      currentCounter: 100,
      maintenanceThreshold: 1000,
      model: 'Model X',
      serialNumber: '123',
      counterType: 'pulse'
    } as any
  ];

  const mockRooms: Room[] = [
    { id: 'r1', name: 'Room 1' } as any
  ];

  beforeEach(() => {
    dataServiceMock = {
      getDevices: vi.fn().mockReturnValue(of(mockDevices)),
      getRooms: vi.fn().mockReturnValue(of(mockRooms)),
      addDevice: vi.fn().mockReturnValue(of(mockDevices[0])),
      updateDevice: vi.fn().mockReturnValue(of(mockDevices[0])),
      deleteDevice: vi.fn().mockReturnValue(of(void 0)),
      updateDeviceCounter: vi.fn().mockReturnValue(of(void 0))
    };

    sweetAlertMock = {
      validationError: vi.fn(),
      created: vi.fn(),
      updated: vi.fn(),
      deleted: vi.fn(),
      toast: vi.fn(),
      confirmDelete: vi.fn().mockResolvedValue(true)
    };

    notificationServiceMock = {
      getAlertCount: vi.fn().mockReturnValue(of(2))
    };

    cdrMock = {
      markForCheck: vi.fn()
    };

    component = new Devices(dataServiceMock, sweetAlertMock, notificationServiceMock, cdrMock);
  });

  it('loads data on init', () => {
    component.ngOnInit();
    expect(dataServiceMock.getDevices).toHaveBeenCalled();
    expect(dataServiceMock.getRooms).toHaveBeenCalled();
    expect(notificationServiceMock.getAlertCount).toHaveBeenCalledWith('devices');
    expect(component.devices.length).toBe(1);
    expect(component.rooms.length).toBe(1);
    expect(component.alertCount).toBe(2);
  });

  it('validates form before saving', () => {
    component.deviceForm = {};
    component.saveDevice();
    expect(sweetAlertMock.validationError).toHaveBeenCalled();
    expect(dataServiceMock.addDevice).not.toHaveBeenCalled();
  });

  it('adds new device', () => {
    component.deviceForm = { 
      name: 'New Device', 
      model: 'M1', 
      serialNumber: 'S1', 
      counterType: 'pulse', 
      maintenanceThreshold: 100 
    };
    component.isEditMode = false;

    component.saveDevice();

    expect(dataServiceMock.addDevice).toHaveBeenCalled();
    expect(sweetAlertMock.created).toHaveBeenCalled();
  });

  it('updates existing device', async () => {
    component.deviceForm = { ...mockDevices[0] };
    component.isEditMode = true;

    component.saveDevice();
    await Promise.resolve(); // flush subscribe next callback

    expect(dataServiceMock.updateDevice).toHaveBeenCalled();
    expect(sweetAlertMock.updated).toHaveBeenCalled();
  });

  it('logs usage', () => {
    component.selectedDevice = mockDevices[0];
    component.usageLog = { counterStart: 100, counterEnd: 200, notes: '' };
    
    component.logUsage();
    
    expect(dataServiceMock.updateDeviceCounter).toHaveBeenCalledWith('d1', 200);
    expect(sweetAlertMock.toast).toHaveBeenCalled();
  });

  it('calculates maintenance status', () => {
    const fresh = { ...mockDevices[0], currentCounter: 0, maintenanceThreshold: 1000 }; // 0%
    expect(component.getMaintenancePercentage(fresh)).toBe(0);
    expect(component.isNearMaintenance(fresh)).toBe(false);

    const near = { ...mockDevices[0], currentCounter: 950, maintenanceThreshold: 1000 }; // 95%
    expect(component.getMaintenancePercentage(near)).toBe(95);
    expect(component.isNearMaintenance(near)).toBe(true);
  });

  /*
  it.skip('deletes device after confirmation', async () => {
    await component.deleteDevice(mockDevices[0]);
    expect(dataServiceMock.deleteDevice).toHaveBeenCalled();
    expect(sweetAlertMock.deleted).toHaveBeenCalled();
  });
  */
});
