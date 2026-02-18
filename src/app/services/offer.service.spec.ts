import '../../test-setup';
import { OfferService } from './offer.service';
import { DataService } from './data.service';
import { Offer, Patient, Service } from '../models';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('OfferService', () => {
  let service: OfferService;
  let dataServiceMock: any;

  beforeEach(() => {
    dataServiceMock = {} as any;
    service = new OfferService(dataServiceMock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('evaluateOffers', () => {
    const mockPatient: Patient = {
      id: 'p1',
      createdAt: new Date('2023-01-01'),
      firstName: 'John',
      lastName: 'Doe',
      phone: '123',
      email: 'john@example.com',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      updatedAt: new Date()
    } as any;

    const mockService: Service = {
      id: 's1',
      name: 'Service 1',
      price: 100,
      categoryId: 'c1',
      duration: 60,
      createdAt: new Date()
    } as any;

    const mockCart = [
      { serviceId: 's1', serviceName: 'Service 1', price: 100, quantity: 1 }
    ];

    it('should filter out inactive offers', () => {
      const offers: Offer[] = [
        { id: 'o1', name: 'Active', isActive: true, benefits: [] } as any,
        { id: 'o2', name: 'Inactive', isActive: false, benefits: [] } as any
      ];

      const result = service.evaluateOffers(mockCart, mockPatient, offers, [mockService]);
      expect(result.length).toBe(0);
    });

    it('should apply percent off offer', () => {
      const offer: Offer = {
        id: 'o1',
        name: '10% Off',
        isActive: true,
        priority: 1,
        conditions: [],
        benefits: [{ type: 'percent_off', parameters: { percent: 10 } }]
      } as any;

      const result = service.evaluateOffers(mockCart, mockPatient, [offer], [mockService]);
      expect(result.length).toBe(1);
      expect(result[0].discountAmount).toBe(10); // 10% of 100
    });

    it('should handle min_spend condition', () => {
      const offer: Offer = {
        id: 'o3',
        name: 'Min Spend 50',
        isActive: true,
        priority: 1,
        conditions: [{ type: 'min_spend', parameters: { minAmount: 50 }, children: [] }],
        benefits: [{ type: 'fixed_amount_off', parameters: { fixedAmount: 10 } }]
      } as any;

      const result = service.evaluateOffers(mockCart, mockPatient, [offer], [mockService]);
      expect(result.length).toBe(1);

      // Now increase min spend to 200
      offer.conditions![0].parameters.minAmount = 200;
      const result2 = service.evaluateOffers(mockCart, mockPatient, [offer], [mockService]);
      expect(result2.length).toBe(0);
    });

    it('should handle patient_tag condition', () => {
      const patientWithTags = { ...mockPatient, tags: ['VIP', 'Loyal'] };
      const offer: Offer = {
        id: 'o4',
        name: 'VIP Only',
        isActive: true,
        priority: 1,
        conditions: [{ type: 'patient_tag', parameters: { tags: ['VIP'] }, operator: 'contains' }],
        benefits: [{ type: 'percent_off', parameters: { percent: 20 } }]
      } as any;

      // Should match
      const result = service.evaluateOffers(mockCart, patientWithTags, [offer], [mockService]);
      expect(result.length).toBe(1);

      // Should not match non-VIP
      const result2 = service.evaluateOffers(mockCart, mockPatient, [offer], [mockService]);
      expect(result2.length).toBe(0);
    });

    it('should handle visit_count condition', () => {
      const patientHighVisits = { ...mockPatient, visitCount: 10 };
      const offer: Offer = {
        id: 'o5',
        name: '10th Visit Special',
        isActive: true, // Assuming active
        priority: 1,
        conditions: [{ type: 'visit_count', parameters: { threshold: 9 }, operator: 'greater_than' }],
        benefits: [{ type: 'fixed_amount_off', parameters: { fixedAmount: 50 } }]
      } as any;

      // Should match (10 > 9)
      const result = service.evaluateOffers(mockCart, patientHighVisits, [offer], [mockService]);
      expect(result.length).toBe(1);

      // Should not match low visits
      const patientLowVisits = { ...mockPatient, visitCount: 5 };
      const result2 = service.evaluateOffers(mockCart, patientLowVisits, [offer], [mockService]);
      expect(result2.length).toBe(0);
    });
  });
});
