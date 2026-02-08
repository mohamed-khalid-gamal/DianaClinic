import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { PatientWallet, ServiceCredit } from '../models';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  private readonly apiBase = '/api';

  constructor(private http: HttpClient) {}

  /**
   * Get wallet for a specific patient
   */
  getWallet(patientId: string): Observable<PatientWallet> {
    return this.http.get<PatientWallet>(`${this.apiBase}/patients/${patientId}/wallet`).pipe(
      map(wallet => this.hydrateWallet(wallet))
    );
  }

  /**
   * Add cash balance to patient wallet
   */
  addCashBalance(patientId: string, amount: number): Observable<PatientWallet> {
    return this.http.post<PatientWallet>(
      `${this.apiBase}/patients/${patientId}/wallet/topup`,
      { amount }
    );
  }

  /**
   * Deduct cash balance from patient wallet
   */
  deductCashBalance(patientId: string, amount: number): Observable<PatientWallet> {
    return this.http.post<PatientWallet>(
      `${this.apiBase}/patients/${patientId}/wallet/deduct`,
      { amount }
    );
  }

  /**
   * Add service credits (from package purchase)
   */
  addCredit(patientId: string, credit: ServiceCredit): Observable<PatientWallet> {
    return this.http.post<PatientWallet>(
      `${this.apiBase}/patients/${patientId}/wallet/credits`,
      {
        serviceId: credit.serviceId,
        serviceName: credit.serviceName,
        remaining: credit.remaining,
        total: credit.total,
        expiresAt: credit.expiresAt,
        packageId: credit.packageId,
        unitType: credit.unitType
      }
    );
  }

  /**
   * Redeem a service credit (use one session)
   */
  redeemCredit(patientId: string, serviceId: string, units: number = 1): Observable<PatientWallet> {
    return this.http.post<PatientWallet>(
      `${this.apiBase}/patients/${patientId}/wallet/credits/redeem`,
      { serviceId, units }
    );
  }

  /**
   * Reserve credits for appointment (temporarily reduce but can be adjusted at session end)
   */
  reserveCredits(patientId: string, serviceId: string, units: number): Observable<PatientWallet> {
    return this.redeemCredit(patientId, serviceId, units);
  }

  /**
   * Adjust credits after session (if actual usage differs from reserved)
   * positive adjustment = return credits, negative = deduct more
   */
  adjustCredits(patientId: string, serviceId: string, adjustment: number): Observable<any> {
    if (adjustment === 0) return of(null);
    return this.http.patch<PatientWallet>(
      `${this.apiBase}/patients/${patientId}/wallet/credits/adjust`,
      { serviceId, adjustment }
    );
  }

  /**
   * Check available credits for a service
   */
  getCreditsForService(patientId: string, serviceId: string): Observable<number> {
    return this.getWallet(patientId).pipe(
      map(wallet => {
        const credit = wallet.credits.find(c => c.serviceId === serviceId && c.remaining > 0);
        return credit ? credit.remaining : 0;
      })
    );
  }

  /**
   * Get all available credits for a patient
   */
  getAvailableCredits(patientId: string): Observable<ServiceCredit[]> {
    return this.getWallet(patientId).pipe(
      map(wallet => wallet.credits.filter(c => c.remaining > 0))
    );
  }

  private hydrateWallet(wallet: PatientWallet): PatientWallet {
    return {
      ...wallet,
      credits: (wallet.credits || []).map(credit => ({
        ...credit,
        expiresAt: credit.expiresAt ? new Date(credit.expiresAt) : undefined
      }))
    };
  }
}
