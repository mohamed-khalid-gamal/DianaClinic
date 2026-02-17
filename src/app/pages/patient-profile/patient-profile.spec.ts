import '../../../test-setup';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { PatientProfile } from './patient-profile';
import { DataService } from '../../services/data.service';
import { WalletService } from '../../services/wallet.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { CalendarService } from '../../services/calendar.service';
import { Patient, Appointment, PatientWallet, Service, Offer, PackagePurchase } from '../../models';

// No @angular/core mock: use TestBed so inject(DestroyRef) and takeUntilDestroyed work

describe('Patient Profile Page', () => {
  let component: PatientProfile;
  let dataServiceMock: any;
  let walletServiceMock: any;
  let alertServiceMock: any;
  let calendarServiceMock: any;

  const mockPatient: Patient = {
    id: 'p1',
    firstName: 'John',
    lastName: 'Doe',
    phone: '555'
  } as any;

  const mockWallet: PatientWallet = {
    patientId: 'p1',
    cashBalance: 0,
    credits: [
      { serviceId: 's1', serviceName: 'Laser', remaining: 5, total: 5, unitType: 'session' }
    ]
  };

  const mockAppointments: Appointment[] = [
    {
      id: 'a1',
      patientId: 'p1',
      scheduledStart: new Date(Date.now() + 100000),
      status: 'scheduled',
      services: [{ serviceId: 's1' }]
    } as any
  ];

  const mockServices: Service[] = [
    { id: 's1', name: 'Laser' } as any
  ];

  const mockOffers: Offer[] = [
    {
      id: 'o1',
      name: 'Pkg',
      isActive: true,
      type: 'package',
      benefits: [{
        type: 'grant_package',
        parameters: { fixedPrice: 100, packageSessions: 5, packageServiceId: 's1' }
      }]
    } as any
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    dataServiceMock = {
      getPatient: vi.fn().mockReturnValue(of(mockPatient)),
      getPatientAppointments: vi.fn().mockReturnValue(of(mockAppointments)),
      getServices: vi.fn().mockReturnValue(of(mockServices)),
      getPatientTransactions: vi.fn().mockReturnValue(of([])),
      getOffers: vi.fn().mockReturnValue(of(mockOffers)),
      getPendingPackagePurchases: vi.fn().mockReturnValue(of([])),
      addPackagePurchase: vi.fn().mockReturnValue(of({})),
      addPatientTransaction: vi.fn().mockReturnValue(of({})),
      updatePackagePurchaseStatus: vi.fn().mockReturnValue(of({}))
    };

    walletServiceMock = {
      getWallet: vi.fn().mockReturnValue(of(mockWallet)),
      addCredit: vi.fn().mockReturnValue(of({}))
    };

    alertServiceMock = {
      toast: vi.fn()
    };

    calendarServiceMock = {
      getPatientEvents: vi.fn().mockReturnValue(of([]))
    };

    TestBed.configureTestingModule({
      imports: [PatientProfile],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of(new Map([['id', 'p1']])) } },
        { provide: DataService, useValue: dataServiceMock },
        { provide: WalletService, useValue: walletServiceMock },
        { provide: SweetAlertService, useValue: alertServiceMock },
        { provide: CalendarService, useValue: calendarServiceMock }
      ]
    });

    const fixture = TestBed.createComponent(PatientProfile);
    component = fixture.componentInstance;
  });

  it('loads patient data on init', () => {
    component.ngOnInit();
    expect(dataServiceMock.getPatient).toHaveBeenCalledWith('p1');
    expect(component.patient).toBeDefined();
    expect(component.wallet).toBeDefined();
    expect(component.appointments.length).toBe(1);
  });

  it('calculates total credits', () => {
    component.wallet = mockWallet;
    expect(component.totalCredits).toBe(5);
  });

  it('handles package purchase', () => {
    component.patient = mockPatient;
    component.selectedOffer = mockOffers[0];

    component.confirmPurchasePackage();

    expect(dataServiceMock.addPackagePurchase).toHaveBeenCalled();
    expect(dataServiceMock.addPatientTransaction).toHaveBeenCalled();
    expect(alertServiceMock.toast).toHaveBeenCalled();
  });

  it('confirms payment for pending purchase', () => {
    component.patient = mockPatient;
    const purchase: PackagePurchase = {
      id: 'pur1',
      patientId: 'p1',
      offerId: 'o1',
      offerName: 'Pkg',
      price: 100,
      credits: [{ serviceId: 's1', serviceName: 'Laser', quantity: 5, unitType: 'session' }],
      status: 'pending',
      createdAt: new Date()
    } as any;

    component.selectedPurchase = purchase;

    component.confirmPayment();

    expect(dataServiceMock.updatePackagePurchaseStatus).toHaveBeenCalledWith('pur1', 'paid');
    expect(walletServiceMock.addCredit).toHaveBeenCalled();
    expect(dataServiceMock.addPatientTransaction).toHaveBeenCalled();
    expect(alertServiceMock.toast).toHaveBeenCalled();
  });
});
