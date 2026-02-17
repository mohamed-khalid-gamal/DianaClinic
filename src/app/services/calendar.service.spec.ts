import '../../test-setup';
import { CalendarService } from './calendar.service';
import { DataService } from './data.service';
import { Appointment, Patient, Doctor, Room, Service } from '../models';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';

describe('CalendarService', () => {
  let service: CalendarService;
  let dataServiceMock: any;

  beforeEach(() => {
    dataServiceMock = {
      getAppointments: vi.fn().mockReturnValue(of([])),
      getPatients: vi.fn().mockReturnValue(of([])),
      getDoctors: vi.fn().mockReturnValue(of([])),
      getRooms: vi.fn().mockReturnValue(of([])),
      getServices: vi.fn().mockReturnValue(of([]))
    };
    service = new CalendarService(dataServiceMock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAllEvents should map appointments to events', () => {
    const mockApt: Appointment = {
      id: 'a1',
      patientId: 'p1',
      doctorId: 'd1',
      roomId: 'r1',
      status: 'scheduled',
      scheduledStart: new Date('2023-01-01T10:00:00'),
      scheduledEnd: new Date('2023-01-01T11:00:00'),
      services: [{ serviceId: 's1', price: 100, quantity: 1 }]
    } as any;

    const mockPatient: Patient = { id: 'p1', firstName: 'John', lastName: 'Doe' } as any;
    const mockDoctor: Doctor = { id: 'd1', name: 'Dr. Smith' } as any;
    const mockRoom: Room = { id: 'r1', name: 'Room 1' } as any;
    const mockService: Service = { id: 's1', name: 'Consultation' } as any;

    dataServiceMock.getAppointments.mockReturnValue(of([mockApt]));
    dataServiceMock.getPatients.mockReturnValue(of([mockPatient]));
    dataServiceMock.getDoctors.mockReturnValue(of([mockDoctor]));
    dataServiceMock.getRooms.mockReturnValue(of([mockRoom]));
    dataServiceMock.getServices.mockReturnValue(of([mockService]));

    service.getAllEvents().subscribe(events => {
      expect(events.length).toBe(1);
      const event = events[0];
      expect(event.title).toContain('John Doe');
      expect(event.title).toContain('Consultation');
      expect(event.start).toEqual(mockApt.scheduledStart);
      expect(event.extendedProps.patientName).toBe('John Doe');
      expect(event.extendedProps.doctorName).toBe('Dr. Smith');
    });
  });

  it('getRoomEvents should filter by room', () => {
     // Setup similar to above but with multiple events...
     // Start simple
     const mockApts = [
       { id: 'a1', roomId: 'r1', status: 'scheduled', scheduledStart: new Date(), scheduledEnd: new Date(), services: [] },
       { id: 'a2', roomId: 'r2', status: 'scheduled', scheduledStart: new Date(), scheduledEnd: new Date(), services: [] }
     ] as any[];

     dataServiceMock.getAppointments.mockReturnValue(of(mockApts));
     service.getRoomEvents('r1').subscribe(events => {
       expect(events.length).toBe(1);
       expect(events[0].extendedProps.roomId).toBe('r1');
     });
  });
});
