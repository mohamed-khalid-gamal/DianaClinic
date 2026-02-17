import '../../../test-setup';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Billing } from './billing';
import { Appointment, Patient, Service, Offer } from '../../models';

describe('Billing Component', () => {
  let component: Billing;
  let dataServiceMock: any;
  let offerServiceMock: any;
  let walletServiceMock: any;
  let alertServiceMock: any;
  let cdrMock: any;

  const mockAppointments: Appointment[] = [
    { 
      id: 'a1', 
      patientId: 'p1', 
      status: 'completed', 
      services: [{ serviceId: 's1', price: 100 }],
      scheduledStart: new Date(),
      scheduledEnd: new Date()
    } as any
  ];

  const mockPatients: Patient[] = [
    { id: 'p1', firstName: 'John', lastName: 'Doe' } as any
  ];

  const mockServices: Service[] = [
    { id: 's1', name: 'Service 1', pricingModels: [{ basePrice: 100 }] } as any
  ];

  const mockOffers: Offer[] = [];

  beforeEach(() => {
    dataServiceMock = {
      getAppointments: vi.fn().mockReturnValue(of(mockAppointments)),
      getPatients: vi.fn().mockReturnValue(of(mockPatients)),
      getServices: vi.fn().mockReturnValue(of(mockServices)),
      getDoctors: vi.fn().mockReturnValue(of([])),
      getInventory: vi.fn().mockReturnValue(of([])),
      getOffers: vi.fn().mockReturnValue(of(mockOffers)),
      getInvoices: vi.fn().mockReturnValue(of([])),
      getSessionByAppointment: vi.fn().mockReturnValue(of({})),
      createInvoice: vi.fn().mockReturnValue(of({})),
      updateAppointmentStatus: vi.fn().mockReturnValue(of({})),
      addPatientTransaction: vi.fn().mockReturnValue(of({}))
    };

    offerServiceMock = {
      evaluateOffers: vi.fn().mockReturnValue([])
    };

    walletServiceMock = {
      getAvailableCredits: vi.fn().mockReturnValue(of([])),
      redeemCredit: vi.fn().mockReturnValue(of({})),
      addCredit: vi.fn().mockReturnValue(of({}))
    };

    alertServiceMock = {
      validationError: vi.fn(),
      error: vi.fn(),
      invoicePaid: vi.fn().mockResolvedValue(true)
    };

    cdrMock = {
      markForCheck: vi.fn()
    };

    component = new Billing(dataServiceMock, offerServiceMock, walletServiceMock, alertServiceMock, cdrMock);
  });

  it('loads data on init', () => {
    component.ngOnInit();
    expect(dataServiceMock.getAppointments).toHaveBeenCalled();
    expect(component.appointments.length).toBe(1);
    expect(component.patients.length).toBe(1);
  });

  it('filters pending appointments', () => {
    component.appointments = mockAppointments; // status 'completed'
    expect(component.pendingAppointments.length).toBe(1);

    component.appointments = [{ ...mockAppointments[0], status: 'billed' }];
    expect(component.pendingAppointments.length).toBe(0);
  });

  it('opens invoice modal and populates items', () => {
    component.appointments = mockAppointments;
    component.patients = mockPatients;
    component.services = mockServices;

    component.openInvoiceModal(mockAppointments[0]);

    expect(component.showInvoiceModal).toBe(true);
    expect(component.selectedAppointment).toBe(mockAppointments[0]);
    expect(component.invoiceItems.length).toBe(1);
    expect(component.invoiceItems[0].total).toBe(100);
    expect(dataServiceMock.getSessionByAppointment).toHaveBeenCalled();
  });

  it('calculates totals correctly', () => {
    component.invoiceItems = [
      { description: 'Item 1', quantity: 1, unitPrice: 100, total: 100 },
      { description: 'Item 2', quantity: 2, unitPrice: 50, total: 100 }
    ];
    component.discount = 20;
    component.taxRate = 10;

    // Subtotal: 200
    // Discount: 20
    // Taxable: 180
    // Tax: 18
    // Grand Total: 198

    expect(component.subtotal).toBe(200);
    expect(component.grandTotal).toBe(198);
  });

  it('adds and removes payments', () => {
    component.newPayment = { type: 'cash', amount: 50 };
    component.remainingBalance; // Access getter to ensure it's calculated if needed (though getter handles logic)
    // Need items to have balance
    component.invoiceItems = [{ description: 'Item 1', quantity: 1, unitPrice: 100, total: 100 }];
    
    component.addPayment();
    expect(component.payments.length).toBe(1);
    expect(component.payments[0].amount).toBe(50);

    component.removePayment(0);
    expect(component.payments.length).toBe(0);
  });

  it('confirms invoice and processes payment', () => {
    component.selectedAppointment = mockAppointments[0];
    component.selectedPatient = mockPatients[0];
    component.invoiceItems = [{ description: 'Service', quantity: 1, unitPrice: 100, total: 100 }];
    component.payments = [{ type: 'cash', amount: 100 }];
    
    component.confirmInvoice();

    expect(dataServiceMock.createInvoice).toHaveBeenCalled();
    expect(dataServiceMock.updateAppointmentStatus).toHaveBeenCalledWith('a1', 'billed');
    expect(alertServiceMock.invoicePaid).toHaveBeenCalled();
  });
});
