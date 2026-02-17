import '../../../test-setup';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Appointments } from './appointments';
import { Appointment, Doctor, Patient, Room, Service } from '../../models';

describe('Appointments Component', () => {
  let component: Appointments;
  let dataServiceMock: any;
  let alertServiceMock: any;
  let cdrMock: any;

  // Mock Data
  const mockPatients: Patient[] = [
    { id: 'p1', firstName: 'John', lastName: 'Doe', phone: '123' } as any
  ];
  const mockDoctors: Doctor[] = [
    { 
      id: 'd1', 
      name: 'Dr. Smith', 
      isActive: true,
      workingHours: [{ dayOfWeek: new Date().getDay(), startTime: '08:00', endTime: '18:00' }] 
    } as any
  ];
  const mockRooms: Room[] = [
    { id: 'r1', name: 'Room 1', type: 'treatment', isActive: true, capacity: 1 } as any
  ];
  const mockServices: Service[] = [
    { id: 's1', name: 'Consultation', duration: 30, pricingModels: [{ basePrice: 100 } as any], isActive: true } as any
  ];
  const mockAppointments: Appointment[] = [
    { 
      id: 'a1', 
      patientId: 'p1', 
      doctorId: 'd1', 
      roomId: 'r1', 
      scheduledStart: new Date(new Date().setHours(10, 0, 0, 0)), 
      scheduledEnd: new Date(new Date().setHours(10, 30, 0, 0)),
      status: 'scheduled',
      services: []
    } as any
  ];

  beforeEach(() => {
    // Setup Mocks
    dataServiceMock = {
      getAppointments: vi.fn().mockReturnValue(of(mockAppointments)),
      getPatients: vi.fn().mockReturnValue(of(mockPatients)),
      getDoctors: vi.fn().mockReturnValue(of(mockDoctors)),
      getRooms: vi.fn().mockReturnValue(of(mockRooms)),
      getServices: vi.fn().mockReturnValue(of(mockServices)),
      addAppointment: vi.fn().mockReturnValue(of({})),
      addPatient: vi.fn().mockReturnValue(of(mockPatients[0])),
      updateAppointmentStatus: vi.fn().mockReturnValue(of({}))
    };

    alertServiceMock = {
      validationError: vi.fn(),
      bookingConfirmed: vi.fn(),
      error: vi.fn(),
      confirm: vi.fn().mockResolvedValue(true)
    };

    cdrMock = {
      markForCheck: vi.fn(),
      detectChanges: vi.fn()
    };

    // Manual Instantiation
    component = new Appointments(dataServiceMock, alertServiceMock, cdrMock);
  });

  it('should initialize and load data', () => {
    component.ngOnInit();
    expect(dataServiceMock.getAppointments).toHaveBeenCalled();
    expect(component.appointments.length).toBe(1);
    expect(component.patients.length).toBe(1);
    expect(component.doctors.length).toBe(1);
    expect(component.rooms.length).toBe(1);
    expect(component.services.length).toBe(1);
  });

  it('filteredAppointments should return filtered results', () => {
    component.appointments = mockAppointments;
    component.patients = mockPatients;
    component.doctors = mockDoctors;

    component.searchQuery = 'John';
    expect(component.filteredAppointments.length).toBe(1);

    component.searchQuery = 'XYZ';
    expect(component.filteredAppointments.length).toBe(0);
  });

  it('should reset booking state', () => {
    component.bookingStep = 2;
    component.resetBooking();
    expect(component.bookingStep).toBe(1); // Although resetBooking doesn't explicit set step to 1, openBookingModal does. 
                                            // resetBooking resets data objects.
    expect(component.booking.patientId).toBe('');
    expect(component.bookingSegments.length).toBe(0);
  });

  it('should validate step 1 (Patient Selection)', () => {
    component.bookingStep = 1;
    component.booking.patientId = '';
    
    expect(component.canProceed()).toBe(false);

    component.booking.patientId = 'p1';
    expect(component.canProceed()).toBe(true);
  });

  it('should validate step 2 (Service Selection)', () => {
    component.bookingStep = 2;
    component.booking.allServiceIds = [];
    
    expect(component.canProceed()).toBe(false);

    component.booking.allServiceIds = ['s1'];
    expect(component.canProceed()).toBe(true);
  });

  it('should generate segments from services', () => {
    component.services = mockServices;
    component.booking.allServiceIds = ['s1'];
    
    component.initializeSegmentsAsSplit();
    
    expect(component.bookingSegments.length).toBe(1);
    expect(component.bookingSegments[0].serviceIds).toContain('s1');
  });

  it('should detect conflicts', () => {
    component.appointments = mockAppointments; // 10:00 - 10:30
    
    const start = new Date(mockAppointments[0].scheduledStart);
    const end = new Date(mockAppointments[0].scheduledEnd);

    // Exact overlap
    expect(component.hasConflicts(start, end, 'd1', 'r1')).toBe(true);

    // Different doctor/room, no conflict (logic depends on arguments)
    // hasConflicts(start, end, doctorId?, roomId?)
    // If doctorId provided, checks conflicts for THAT doctor.
    
    expect(component.hasConflicts(start, end, 'd2', 'r2')).toBe(false); // No apts for d2
  });

  it('should confirm booking', () => {
    // Setup valid booking state
    component.bookingSegments = [{
      serviceIds: ['s1'],
      date: new Date().toISOString().split('T')[0],
      time: '12:00 PM',
      doctorId: 'd1',
      roomId: 'r1',
      duration: 30,
      label: 'Test'
    }];
    component.booking.patientId = 'p1';
    
    component.confirmBooking();

    expect(dataServiceMock.addAppointment).toHaveBeenCalled();
    expect(alertServiceMock.bookingConfirmed).toHaveBeenCalled();
  });
});
