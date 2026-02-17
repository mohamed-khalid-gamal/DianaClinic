import '../../../test-setup';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CalendarPage } from './calendar';
import { CalendarEvent } from '../../services/calendar.service';
import { Doctor, Room, Patient } from '../../models';

describe('Calendar Page', () => {
  let component: CalendarPage;
  let calendarServiceMock: any;
  let dataServiceMock: any;
  let alertServiceMock: any;
  let routerMock: any;
  let cdrMock: any;

  const mockEvents: CalendarEvent[] = [
    { title: 'Evt 1', start: new Date(), extendedProps: { doctorId: 'd1', roomId: 'r1', patientId: 'p1' } } as any,
    { title: 'Evt 2', start: new Date(), extendedProps: { doctorId: 'd2', roomId: 'r2', patientId: 'p2' } } as any
  ];

  const mockDoctors: Doctor[] = [{ id: 'd1', name: 'Dr. One' } as any];
  const mockRooms: Room[] = [{ id: 'r1', name: 'Room 1' } as any];
  const mockPatients: Patient[] = [{ id: 'p1', firstName: 'P1', lastName: 'L1', phone: '1' } as any];

  beforeEach(() => {
    calendarServiceMock = {
      getAllEvents: vi.fn().mockReturnValue(of((mockEvents)))
    };

    dataServiceMock = {
      getDoctors: vi.fn().mockReturnValue(of(mockDoctors)),
      getRooms: vi.fn().mockReturnValue(of(mockRooms)),
      getPatients: vi.fn().mockReturnValue(of(mockPatients))
    };

    alertServiceMock = {
      validationError: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    cdrMock = {
      markForCheck: vi.fn()
    };

    component = new CalendarPage(calendarServiceMock, dataServiceMock, alertServiceMock, routerMock, cdrMock);
  });

  it('loads data on init', () => {
    component.ngOnInit();
    expect(calendarServiceMock.getAllEvents).toHaveBeenCalled();
    expect(component.events.length).toBe(2);
    expect(component.doctors.length).toBe(1);
  });

  it('filters events by doctor', () => {
    component.events = mockEvents;
    component.activeTab = 'doctor';
    
    component.selectDoctor('d1');
    expect(component.filteredEvents.length).toBe(1);
    expect(component.filteredEvents[0].extendedProps.doctorId).toBe('d1');

    component.selectDoctor('d99');
    expect(component.filteredEvents.length).toBe(0);
  });

  it('searches patients', () => {
    component.patients = mockPatients;
    component.patientSearch = 'P1';
    
    component.searchPatients();
    expect(component.filteredPatients.length).toBe(1);
    
    component.patientSearch = 'XXX';
    component.searchPatients();
    expect(component.filteredPatients.length).toBe(0);
  });
});
