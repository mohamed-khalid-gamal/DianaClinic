import '../../../test-setup';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Offers } from './offers';
import { Offer } from '../../models';

describe('Offers Component', () => {
  let component: Offers;
  let dataServiceMock: any;
  let alertServiceMock: any;
  let cdrMock: any;

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
    } as any
  ];

  const mockServices = [
    { id: 'svc1', name: 'Laser Hair Removal', price: 1000, duration: 30 }
  ];

  beforeEach(() => {
    dataServiceMock = {
      getOffers: vi.fn().mockReturnValue(of(mockOffers)),
      getServices: vi.fn().mockReturnValue(of(mockServices)),
      getCategories: vi.fn().mockReturnValue(of([])),
      addOffer: vi.fn().mockReturnValue(of(mockOffers[0])),
      updateOffer: vi.fn().mockReturnValue(of(mockOffers[0])),
      deleteOffer: vi.fn().mockReturnValue(of(void 0))
    };

    alertServiceMock = {
      validationError: vi.fn(),
      created: vi.fn(),
      updated: vi.fn(),
      deleted: vi.fn(),
      toast: vi.fn(),
      confirmDelete: vi.fn().mockResolvedValue(true),
      error: vi.fn()
    };

    cdrMock = {
      markForCheck: vi.fn()
    };

    component = new Offers(dataServiceMock, alertServiceMock, cdrMock);
  });

  it('loads offers and services on init', () => {
    component.ngOnInit();
    expect(dataServiceMock.getOffers).toHaveBeenCalled();
    expect(dataServiceMock.getServices).toHaveBeenCalled();
    expect(component.offers.length).toBe(1);
    expect(component.services.length).toBe(1);
  });

  it('adds default benefit when none provided on create', () => {
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
    component.offerForm = { ...mockOffers[0] };
    component.isEditMode = true;

    component.saveOffer();

    expect(dataServiceMock.updateOffer).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
    expect(alertServiceMock.updated).toHaveBeenCalledWith('Offer', mockOffers[0].name);
  });

  it('toggles status and toasts on success', () => {
    const offer = { ...mockOffers[0], isActive: true };
    
    component.toggleOfferStatus(offer);

    expect(dataServiceMock.updateOffer).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    expect(alertServiceMock.toast).toHaveBeenCalled();
  });

  it('reverts status and shows error on failure', async () => {
    const offer = { ...mockOffers[0], isActive: true };
    dataServiceMock.updateOffer.mockReturnValue(throwError(() => new Error('fail')));

    component.toggleOfferStatus(offer);
    await new Promise((r) => setTimeout(r, 0)); // wait for subscribe error callback

    expect(offer.isActive).toBe(true);
    expect(alertServiceMock.error).toHaveBeenCalled();
  });

  it('deletes offer after confirmation', async () => {
    component.ngOnInit(); // Load initial data
    await component.deleteOffer(mockOffers[0]);

    expect(dataServiceMock.deleteOffer).toHaveBeenCalledWith('1');
    expect(component.offers.length).toBe(0);
    expect(alertServiceMock.deleted).toHaveBeenCalledWith('Offer', mockOffers[0].name);
  });
});
