import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Offers } from './offers';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Offer } from '../../models';

describe('Offers', () => {
  let component: Offers;
  let fixture: ComponentFixture<Offers>;

  const dataServiceMock = {
    getOffers: vi.fn(),
    getServices: vi.fn(),
    addOffer: vi.fn(),
    updateOffer: vi.fn(),
    deleteOffer: vi.fn()
  };

  const alertServiceMock = {
    validationError: vi.fn(),
    created: vi.fn(),
    updated: vi.fn(),
    deleted: vi.fn(),
    toast: vi.fn(),
    confirmDelete: vi.fn(),
    error: vi.fn()
  };

  const mockOffers: Offer[] = [
    {
      id: '1',
      name: 'Offer A',
      benefits: [{ id: 'b1', type: 'percent_off', parameters: { percent: 10 } }],
      conditions: [],
      type: 'percentage',
      isActive: true,
      isExclusive: false,
      validFrom: new Date('2025-01-01'),
      validUntil: new Date('2025-12-31'),
      priority: 1,
      createdAt: new Date('2025-01-01')
    }
  ];

  const mockServices = [
    { id: 'svc1', name: 'Laser Hair Removal', price: 1000, duration: 30 }
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    dataServiceMock.getOffers.mockReturnValue(of(mockOffers));
    dataServiceMock.getServices.mockReturnValue(of(mockServices as any));
    dataServiceMock.addOffer.mockReturnValue(of(mockOffers[0]));
    dataServiceMock.updateOffer.mockReturnValue(of(mockOffers[0]));
    dataServiceMock.deleteOffer.mockReturnValue(of(void 0));
    alertServiceMock.confirmDelete.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [Offers],
      providers: [
        { provide: DataService, useValue: dataServiceMock },
        { provide: SweetAlertService, useValue: alertServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Offers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads offers and services on init', () => {
    expect(dataServiceMock.getOffers).toHaveBeenCalled();
    expect(dataServiceMock.getServices).toHaveBeenCalled();
    expect(component.offers.length).toBe(1);
    expect(component.services.length).toBe(1);
  });

  it('adds default benefit when none provided on create', () => {
    dataServiceMock.addOffer.mockClear();
    alertServiceMock.created.mockClear();
    component.offerForm = { name: 'Summer Sale', benefits: [] };
    component.isEditMode = false;

    component.saveOffer();

    const payload = dataServiceMock.addOffer.mock.calls[0][0] as Offer;
    expect(payload.benefits?.length).toBeGreaterThan(0);
    expect(alertServiceMock.created).toHaveBeenCalledWith('Offer', 'Summer Sale');
  });

  it('rejects save when name missing', () => {
    component.offerForm = {};
    component.saveOffer();

    expect(alertServiceMock.validationError).toHaveBeenCalled();
    expect(dataServiceMock.addOffer).not.toHaveBeenCalled();
    expect(dataServiceMock.updateOffer).not.toHaveBeenCalled();
  });

  it('updates offer when in edit mode', () => {
    dataServiceMock.updateOffer.mockClear();
    component.offerForm = { ...mockOffers[0] };
    component.isEditMode = true;

    component.saveOffer();

    expect(dataServiceMock.updateOffer).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
    expect(alertServiceMock.updated).toHaveBeenCalledWith('Offer', mockOffers[0].name);
  });

  it('toggles status and toasts on success', () => {
    const offer = { ...mockOffers[0], isActive: true };
    dataServiceMock.updateOffer.mockClear();
    alertServiceMock.toast.mockClear();

    component.toggleOfferStatus(offer);

    expect(dataServiceMock.updateOffer).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    expect(alertServiceMock.toast).toHaveBeenCalled();
  });

  it('reverts status and shows error on failure', () => {
    const offer = { ...mockOffers[0], isActive: true };
    dataServiceMock.updateOffer.mockReturnValue(throwError(() => new Error('fail')));

    component.toggleOfferStatus(offer);

    expect(offer.isActive).toBe(true);
    expect(alertServiceMock.error).toHaveBeenCalled();
  });

  it('deletes offer after confirmation', async () => {
    component.offers = [...mockOffers];
    alertServiceMock.deleted.mockClear();

    await component.deleteOffer(mockOffers[0]);

    expect(dataServiceMock.deleteOffer).toHaveBeenCalledWith('1');
    expect(component.offers.length).toBe(0);
    expect(alertServiceMock.deleted).toHaveBeenCalledWith('Offer', mockOffers[0].name);
  });
});
