import '../../../test-setup';
import { Dashboard } from './dashboard';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { Appointment, Alert, Doctor, Room, Patient } from '../../models';

describe('Dashboard Component', () => {
  let component: Dashboard;
  let dataServiceMock: any;
  let alertServiceMock: any;
  let routerMock: any;
  let cdrMock: any;

  const mockStats = {
    todayAppointments: 5,
    totalPatients: 100,
    roomsInUse: 2,
    totalRooms: 10,
    devicesNearMaintenance: 1,
    lowStockItems: 2,
    expiringItems: 0,
    pendingAlerts: 1
  };

  const mockAppointments: Appointment[] = [
    { id: 'a1', patientId: 'p1', doctorId: 'd1', roomId: 'r1', status: 'scheduled', scheduledStart: new Date(), scheduledEnd: new Date() } as any
  ];
  const mockAlerts: Alert[] = [{ id: 'al1', isRead: false, type: 'low_stock' } as any];
  const mockDoctors: Doctor[] = [{ id: 'd1', name: 'Dr. Smith' } as any];
  const mockRooms: Room[] = [{ id: 'r1', name: 'Room 1' } as any];
  const mockPatients: Patient[] = [{ id: 'p1', firstName: 'John', lastName: 'Doe' } as any];

  beforeEach(() => {
    dataServiceMock = {
      getDashboardStats: vi.fn().mockReturnValue(of(mockStats)),
      getAppointments: vi.fn().mockReturnValue(of(mockAppointments)),
      getAlerts: vi.fn().mockReturnValue(of(mockAlerts)),
      getDoctors: vi.fn().mockReturnValue(of(mockDoctors)),
      getRooms: vi.fn().mockReturnValue(of(mockRooms)),
      getPatients: vi.fn().mockReturnValue(of(mockPatients)),
      updateAppointmentStatus: vi.fn().mockReturnValue(of({})),
      markAlertRead: vi.fn().mockReturnValue(of({}))
    };

    alertServiceMock = {
      success: vi.fn(),
      error: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    cdrMock = {
      markForCheck: vi.fn()
    };

    component = new Dashboard(dataServiceMock, alertServiceMock, routerMock, cdrMock);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard data on init', () => {
    component.ngOnInit();
    
    expect(dataServiceMock.getDashboardStats).toHaveBeenCalled();
    expect(component.stats).toEqual(mockStats);
    expect(component.doctors.length).toBe(1);
    expect(component.todayAppointments.length).toBe(1);
    expect(component.loading).toBe(false);
  });

  it('should check in patient', () => {
    const apt = { ...mockAppointments[0] };
    component.checkIn(apt);
    
    expect(dataServiceMock.updateAppointmentStatus).toHaveBeenCalledWith(apt.id, 'checked-in');
    expect(apt.status).toBe('checked-in');
    expect(alertServiceMock.success).toHaveBeenCalled();
  });

  it('should dismiss alert', () => {
    component.alerts = [...mockAlerts];
    component.dismissAlert(mockAlerts[0]);
    
    expect(dataServiceMock.markAlertRead).toHaveBeenCalledWith(mockAlerts[0].id);
    expect(component.alerts.length).toBe(0);
  });

  it('should navigate', () => {
    component.navigateTo('/patients');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/patients']);
  });

  it('should return correct room name', () => {
    component.rooms = mockRooms;
    expect(component.getRoomName('r1')).toBe('Room 1');
    expect(component.getRoomName('unknown')).toBe('Unknown');
  });

  it('should check if room is occupied', () => {
    component.todayAppointments = [
      { 
        roomId: 'r1', 
        status: 'in-progress', 
        scheduledStart: new Date(Date.now() - 1000), 
        scheduledEnd: new Date(Date.now() + 1000) 
      } as any
    ];
    
    expect(component.isRoomOccupied('r1')).toBe(true);
    expect(component.isRoomOccupied('r2')).toBe(false);
  });
});
