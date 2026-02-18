import '../../../test-setup';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Patients } from './patients';
import { Patient, Appointment, PatientWallet, Session } from '../../models';

describe('Patients Component', () => {
  let component: Patients;
  let dataServiceMock: any;
  let walletServiceMock: any;
  let alertServiceMock: any;
  let cdrMock: any;

  const mockPatients: Patient[] = [
    {
      id: 'p1',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '0123',
      email: 'jane@example.com',
      gender: 'female',
      dateOfBirth: new Date('1995-01-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
      allergies: [],
      chronicConditions: [],
      contraindications: [],
      notes: '',
      skinType: 3
    } as any
  ];

  const mockAppointments: Appointment[] = [
    {
      id: 'a1',
      patientId: 'p1',
      doctorId: 'd1',
      roomId: 'r1',
      services: [
        { serviceId: 'svc1', pricingType: 'fixed', price: 1200 }
      ],
      scheduledStart: new Date('2025-06-15T10:00:00Z'),
      scheduledEnd: new Date('2025-06-15T11:00:00Z'),
      status: 'completed',
      createdAt: new Date('2025-06-01T10:00:00Z')
    } as any
  ];

  const mockWallet: PatientWallet = {
    patientId: 'p1',
    cashBalance: 200,
    credits: []
  };

  const mockSessions: Session[] = [
    {
      id: 's1',
      appointmentId: 'a1',
      patientId: 'p1',
      doctorId: 'd1',
      startTime: new Date('2025-06-15T10:00:00Z'),
      endTime: new Date('2025-06-15T11:00:00Z'),
      consumablesUsed: [],
      creditsUsed: [],
      extraCharges: [],
      status: 'completed',
      clinicalNotes: 'Patient doing well.',
      beforePhotos: ['url1.jpg'],
      afterPhotos: ['url2.jpg']
    } as any
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    dataServiceMock = {
      getPatients: vi.fn().mockReturnValue(of(mockPatients)),
      getAppointments: vi.fn().mockReturnValue(of(mockAppointments)),
      addPatient: vi.fn().mockReturnValue(of(mockPatients[0])),
      updatePatient: vi.fn().mockReturnValue(of(mockPatients[0])),
      deletePatient: vi.fn().mockReturnValue(of(void 0)),
      addPatientTransaction: vi.fn().mockReturnValue(of({} as any)),
      getSessions: vi.fn().mockReturnValue(of(mockSessions))
    };

    walletServiceMock = {
      getWallet: vi.fn().mockReturnValue(of(mockWallet)),
      addCashBalance: vi.fn().mockReturnValue(of(mockWallet))
    };

    alertServiceMock = {
      validationError: vi.fn(),
      created: vi.fn(),
      updated: vi.fn(),
      deleted: vi.fn(),
      toast: vi.fn(),
      confirmDelete: vi.fn().mockResolvedValue(true),
      error: vi.fn(),
      walletTopUp: vi.fn()
    };

    cdrMock = {
      markForCheck: vi.fn()
    };

    component = new Patients(dataServiceMock, walletServiceMock, alertServiceMock, {} as any, cdrMock);
  });

  it('hydrates patients with derived fields on load', () => {
    component.ngOnInit();
    expect(dataServiceMock.getPatients).toHaveBeenCalled();
    expect(dataServiceMock.getAppointments).toHaveBeenCalled();
    const enriched = component.patients[0] as any;
    expect(enriched.fullName).toBe('Jane Doe');
    expect(enriched.lastVisit).toEqual(mockAppointments[0].scheduledStart);
    expect(component.loading).toBe(false);
  });

  it('blocks save when required fields missing', () => {
    component.patientForm = {};
    component.savePatient();

    expect(alertServiceMock.validationError).toHaveBeenCalled();
    expect(dataServiceMock.addPatient).not.toHaveBeenCalled();
  });

  it('creates patient when not in edit mode', () => {
    component.patientForm = {
      firstName: 'John',
      lastName: 'Smith',
      phone: '0999',
      dateOfBirth: new Date('2000-02-02'),
      gender: 'male'
    };
    component.isEditMode = false;
    component.showModal = true;

    component.savePatient();

    expect(dataServiceMock.addPatient).toHaveBeenCalled();
    expect(alertServiceMock.created).toHaveBeenCalledWith('Patient', 'John Smith');
    expect(component.showModal).toBe(false);
  });

  it('updates patient when in edit mode', () => {
    component.isEditMode = true;
    component.patientForm = { ...mockPatients[0] };

    component.savePatient();

    expect(dataServiceMock.updatePatient).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }));
    expect(alertServiceMock.updated).toHaveBeenCalledWith('Patient', 'Jane Doe');
  });

  it('deletes patient after confirmation', async () => {
    component.patients = [...mockPatients];
    await component.deletePatient(mockPatients[0]);
    await new Promise((r) => setTimeout(r, 0)); // flush subscribe next callback

    expect(dataServiceMock.deletePatient).toHaveBeenCalledWith('p1');
    expect(component.patients.length).toBe(0);
    expect(alertServiceMock.deleted).toHaveBeenCalledWith('Patient', 'Jane Doe');
  });

  it('tops up wallet and logs transaction', () => {
    // We can't spy on component methods easily in manual instantiation if we want to call them
    // But we can check side effects
    component.selectedPatient = mockPatients[0];
    component.topUpAmount = 150;

    component.confirmTopUp({ invalid: false } as any);

    expect(walletServiceMock.addCashBalance).toHaveBeenCalledWith('p1', 150);
    expect(dataServiceMock.addPatientTransaction).toHaveBeenCalled();
    expect(alertServiceMock.walletTopUp).toHaveBeenCalledWith(150, 'Jane Doe');
  });

  it('loads sessions and computes notes and photos', () => {
    // Create a mock session that has photos and notes
    const sessionsWithData = [{
        ...mockSessions[0],
        clinicalNotes: 'Note 1',
        beforePhotos: ['b1.jpg'],
        afterPhotos: ['a1.jpg']
    }];
    dataServiceMock.getSessions.mockReturnValue(of(sessionsWithData));

    component.viewPatientDetails(mockPatients[0]);

    expect(dataServiceMock.getSessions).toHaveBeenCalled();
    expect(component.patientSessions.length).toBe(1);
    expect(component.sessionNotes.length).toBe(1);
    expect(component.sessionNotes[0].note).toBe('Note 1');
    expect(component.galleryPhotos.length).toBe(2);
  });

});
