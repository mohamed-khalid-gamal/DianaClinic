import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Patients } from './patients';
import { DataService } from '../../services/data.service';
import { WalletService } from '../../services/wallet.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Patient, Appointment, PatientWallet } from '../../models';

describe('Patients', () => {
  let component: Patients;
  let fixture: ComponentFixture<Patients>;

  const dataServiceMock = {
    getPatients: vi.fn(),
    getAppointments: vi.fn(),
    addPatient: vi.fn(),
    updatePatient: vi.fn(),
    deletePatient: vi.fn(),
    addPatientTransaction: vi.fn()
  };

  const walletServiceMock = {
    getWallet: vi.fn(),
    addCashBalance: vi.fn()
  };

  const alertServiceMock = {
    validationError: vi.fn(),
    created: vi.fn(),
    updated: vi.fn(),
    deleted: vi.fn(),
    toast: vi.fn(),
    confirmDelete: vi.fn(),
    error: vi.fn(),
    walletTopUp: vi.fn()
  };

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
    }
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
    }
  ];

  const mockWallet: PatientWallet = {
    patientId: 'p1',
    cashBalance: 200,
    credits: []
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    dataServiceMock.getPatients.mockReturnValue(of(mockPatients));
    dataServiceMock.getAppointments.mockReturnValue(of(mockAppointments));
    dataServiceMock.addPatient.mockReturnValue(of(mockPatients[0]));
    dataServiceMock.updatePatient.mockReturnValue(of(mockPatients[0]));
    dataServiceMock.deletePatient.mockReturnValue(of(void 0));
    dataServiceMock.addPatientTransaction.mockReturnValue(of({} as any));
    walletServiceMock.getWallet.mockReturnValue(of(mockWallet));
    walletServiceMock.addCashBalance.mockReturnValue(of(mockWallet));
    alertServiceMock.confirmDelete.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [Patients],
      providers: [
        { provide: DataService, useValue: dataServiceMock },
        { provide: WalletService, useValue: walletServiceMock },
        { provide: SweetAlertService, useValue: alertServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Patients);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('hydrates patients with derived fields on load', () => {
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
    dataServiceMock.addPatient.mockClear();
    alertServiceMock.created.mockClear();
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
    dataServiceMock.updatePatient.mockClear();
    component.isEditMode = true;
    component.patientForm = { ...mockPatients[0] };

    component.savePatient();

    expect(dataServiceMock.updatePatient).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }));
    expect(alertServiceMock.updated).toHaveBeenCalledWith('Patient', 'Jane Doe');
  });

  it('deletes patient after confirmation', async () => {
    component.patients = [...mockPatients];
    alertServiceMock.deleted.mockClear();

    await component.deletePatient(mockPatients[0]);

    expect(dataServiceMock.deletePatient).toHaveBeenCalledWith('p1');
    expect(component.patients.length).toBe(0);
    expect(alertServiceMock.deleted).toHaveBeenCalledWith('Patient', 'Jane Doe');
  });

  it('tops up wallet and logs transaction', () => {
    const loadWalletSpy = vi.spyOn(component, 'loadWallet');
    component.selectedPatient = mockPatients[0];
    component.topUpAmount = 150;

    component.confirmTopUp();

    expect(walletServiceMock.addCashBalance).toHaveBeenCalledWith('p1', 150);
    expect(dataServiceMock.addPatientTransaction).toHaveBeenCalled();
    expect(alertServiceMock.walletTopUp).toHaveBeenCalledWith(150, 'Jane Doe');
    expect(loadWalletSpy).toHaveBeenCalledWith('p1');
  });
});
