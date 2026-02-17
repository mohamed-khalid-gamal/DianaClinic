import '../../test-setup';
import { WalletService } from './wallet.service';
import { PatientWallet } from '../models';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';

describe('WalletService', () => {
  let service: WalletService;
  let httpClientMock: any;

  beforeEach(() => {
    httpClientMock = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn()
    };
    service = new WalletService(httpClientMock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getWallet should return hydrated wallet', () => {
    const mockWallet: PatientWallet = {
      id: 'w1',
      patientId: 'p1',
      cashBalance: 100,
      credits: [{ serviceId: 's1', serviceName: 'Service', remaining: 5, total: 10, expiresAt: '2023-01-01', unitType: 'session' }],
      transactions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;

    httpClientMock.get.mockReturnValue(of(mockWallet));

    service.getWallet('p1').subscribe(wallet => {
      expect(wallet.cashBalance).toBe(100);
      expect(wallet.credits[0].expiresAt).toBeInstanceOf(Date);
    });

    expect(httpClientMock.get).toHaveBeenCalledWith('/api/patients/p1/wallet');
  });

  it('addCashBalance should post amount', () => {
    httpClientMock.post.mockReturnValue(of({}));
    service.addCashBalance('p1', 50).subscribe();
    expect(httpClientMock.post).toHaveBeenCalledWith('/api/patients/p1/wallet/topup', { amount: 50 });
  });

  it('deductCashBalance should post amount', () => {
    httpClientMock.post.mockReturnValue(of({}));
    service.deductCashBalance('p1', 30).subscribe();
    expect(httpClientMock.post).toHaveBeenCalledWith('/api/patients/p1/wallet/deduct', { amount: 30 });
  });

  it('redeemCredit should post serviceId and units', () => {
    httpClientMock.post.mockReturnValue(of({}));
    service.redeemCredit('p1', 's1', 2).subscribe();
    expect(httpClientMock.post).toHaveBeenCalledWith('/api/patients/p1/wallet/credits/redeem', { serviceId: 's1', units: 2 });
  });
});
