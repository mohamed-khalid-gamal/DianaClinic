import '../../../test-setup';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Sessions } from './sessions';
import { Appointment, Patient, Service, ServiceCredit, Device } from '../../models';

describe('Sessions Component', () => {
  let component: Sessions;
  let dataServiceMock: any;
  let walletServiceMock: any;
  let offerServiceMock: any;
  let alertServiceMock: any;
  let cdrMock: any;

  const mockAppts: Appointment[] = [
    { 
      id: 'a1', 
      patientId: 'p1', 
      doctorId: 'd1',
      status: 'in-progress', 
      scheduledStart: new Date(),
      services: [{ serviceId: 's1', price: 100 }]
    } as any,
    { 
      id: 'a2', 
      patientId: 'p2', 
      status: 'checked-in',
      services: [] 
    } as any
  ];

  const mockServices: Service[] = [
    { 
      id: 's1', 
      name: 'Laser Service', 
      pricingModels: [{ type: 'pulse', basePrice: 50, pricePerUnit: 1 }] 
    } as any
  ];

  const mockPatients: Patient[] = [{ id: 'p1', firstName: 'John' } as any];
  const mockDevices: Device[] = [{ id: 'dev1', name: 'Laser', roomId: 'r1' } as any];

  beforeEach(() => {
    vi.useFakeTimers();

    dataServiceMock = {
      getAppointments: vi.fn().mockReturnValue(of(mockAppts)),
      getPatients: vi.fn().mockReturnValue(of(mockPatients)),
      getDoctors: vi.fn().mockReturnValue(of([])),
      getRooms: vi.fn().mockReturnValue(of([])),
      getServices: vi.fn().mockReturnValue(of(mockServices)),
      getDevices: vi.fn().mockReturnValue(of(mockDevices)),
      getInventory: vi.fn().mockReturnValue(of([])),
      getOffers: vi.fn().mockReturnValue(of([])),
      updateAppointmentStatus: vi.fn().mockReturnValue(of({})),
      addPatientTransaction: vi.fn().mockReturnValue(of({})),
      addSession: vi.fn().mockReturnValue(of({})),
      updateDeviceCounter: vi.fn().mockReturnValue(of({})),
      updateInventoryQuantity: vi.fn().mockReturnValue(of({}))
    };

    walletServiceMock = {
      getAvailableCredits: vi.fn().mockReturnValue(of([])),
      redeemCredit: vi.fn().mockReturnValue(of({}))
    };

    offerServiceMock = {
      evaluateOffers: vi.fn().mockReturnValue([])
    };

    alertServiceMock = {
      sessionStarted: vi.fn(),
      confirm: vi.fn().mockResolvedValue(true),
      validationError: vi.fn(),
      success: vi.fn(),
      sessionEnded: vi.fn()
    };

    cdrMock = {
      markForCheck: vi.fn()
    };

    component = new Sessions(dataServiceMock, walletServiceMock, offerServiceMock, alertServiceMock, cdrMock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads data and builds active sessions', () => {
    component.ngOnInit();
    expect(dataServiceMock.getAppointments).toHaveBeenCalled();
    expect(component.activeSessions.length).toBe(1);
    expect(component.activeSessions[0].appointment.id).toBe('a1');
  });

  it('starts session from checked-in appointment', () => {
    const apt = mockAppts[1]; // checked-in
    component.patients = mockPatients;
    
    component.startSession(apt);

    expect(dataServiceMock.updateAppointmentStatus).toHaveBeenCalledWith('a2', 'in-progress');
    expect(alertServiceMock.sessionStarted).toHaveBeenCalled();
  });

  it('calculates billing for pulse based service', () => {
    const serviceState: any = {
      serviceId: 's1',
      selectedModelType: 'pulse',
      pricingModels: [{ type: 'pulse', basePrice: 50, pricePerUnit: 10 }],
      pulsesUsed: 0,
      availableCredits: 0
    };

    // Case 1: 0 pulses
    component.calculateBilling(serviceState);
    expect(serviceState.costToPay).toBe(0);

    // Case 2: 10 pulses, no credits
    serviceState.pulsesUsed = 10;
    component.calculateBilling(serviceState);
    // Cost = (10 - 0) * 10 = 100
    expect(serviceState.costToPay).toBe(100);

    // Case 3: 10 pulses, 5 credits
    serviceState.availableCredits = 5;
    component.calculateBilling(serviceState);
    // Cost = (10 - 5) * 10 = 50
    expect(serviceState.costToPay).toBe(50);
    expect(serviceState.creditsToDeduct).toBe(5);

    // Case 4: 10 pulses, 15 credits
    serviceState.availableCredits = 15;
    component.calculateBilling(serviceState);
    expect(serviceState.costToPay).toBe(0);
    expect(serviceState.creditsToDeduct).toBe(10);
  });

  it('calculates billing for fixed service', () => {
    const serviceState: any = {
      serviceId: 's1',
      selectedModelType: 'fixed',
      pricingModels: [{ type: 'fixed', basePrice: 200 }],
      availableCredits: 0
    };

    // Case 1: No credits
    component.calculateBilling(serviceState);
    expect(serviceState.costToPay).toBe(0); // For fixed, costToPay usually handled by Invoice logic unless we add "extra"?
    // Logic in component: if availableCredits >= 1, deduct 1. Else costToPay = 0 (implies standard billing later)
    
    // Case 2: 1 credit
    serviceState.availableCredits = 1;
    component.calculateBilling(serviceState);
    expect(serviceState.creditsToDeduct).toBe(1);
  });

  it('opens end session modal and initializes state', () => {
    component.activeSessions = [{ 
      appointment: mockAppts[0], 
      patient: mockPatients[0],
      room: { id: 'r1' } as any,
      services: mockServices 
    } as any];
    component.services = mockServices;

    component.openEndSessionModal(component.activeSessions[0]);

    expect(walletServiceMock.getAvailableCredits).toHaveBeenCalled();
    expect(component.showEndSessionModal).toBe(true);
    // Should have pushed a service state
    // Note: implementation does this in subscribe next, which is sync with 'of'
    expect(component.endSessionServiceStates.length).toBe(1);
    expect(component.endSessionServiceStates[0].serviceId).toBe('s1');
  });

  it('confirms end session', () => {
    // Setup state
    component.selectedSession = { 
      appointment: mockAppts[0], 
      patient: mockPatients[0],
      doctor: { id: 'd1' } as any,
      services: [] 
    } as any;
    component.endSessionServiceStates = [];
    component.extraCharges = [];
    
    component.confirmEndSession();
    
    expect(dataServiceMock.updateAppointmentStatus).toHaveBeenCalledWith('a1', 'completed');
    expect(alertServiceMock.sessionEnded).toHaveBeenCalled();
  });
});
