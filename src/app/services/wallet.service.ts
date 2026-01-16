import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { PatientWallet, ServiceCredit } from '../models';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  private wallets$ = new BehaviorSubject<PatientWallet[]>(this.generateMockWallets());

  /**
   * Get wallet for a specific patient
   */
  getWallet(patientId: string): Observable<PatientWallet> {
    return this.wallets$.pipe(
      map(wallets => {
        let wallet = wallets.find(w => w.patientId === patientId);
        if (!wallet) {
          // Create empty wallet if doesn't exist
          wallet = { patientId, cashBalance: 0, credits: [] };
          this.wallets$.next([...wallets, wallet]);
        }
        return wallet;
      })
    );
  }

  /**
   * Get all wallets (for admin purposes)
   */
  getAllWallets(): Observable<PatientWallet[]> {
    return this.wallets$.asObservable();
  }

  /**
   * Add cash balance to patient wallet
   */
  addCashBalance(patientId: string, amount: number): void {
    const wallets = this.wallets$.value;
    const walletIndex = wallets.findIndex(w => w.patientId === patientId);

    if (walletIndex > -1) {
      wallets[walletIndex].cashBalance += amount;
    } else {
      wallets.push({ patientId, cashBalance: amount, credits: [] });
    }

    this.wallets$.next([...wallets]);
  }

  /**
   * Deduct cash balance from patient wallet
   */
  deductCashBalance(patientId: string, amount: number): boolean {
    const wallets = this.wallets$.value;
    const wallet = wallets.find(w => w.patientId === patientId);

    if (!wallet || wallet.cashBalance < amount) {
      return false; // Insufficient balance
    }

    wallet.cashBalance -= amount;
    this.wallets$.next([...wallets]);
    return true;
  }

  /**
   * Add service credits (from package purchase)
   */
  addCredit(patientId: string, credit: ServiceCredit): void {
    const wallets = this.wallets$.value;
    let walletIndex = wallets.findIndex(w => w.patientId === patientId);

    if (walletIndex === -1) {
      // Create wallet if doesn't exist
      wallets.push({ patientId, cashBalance: 0, credits: [credit] });
    } else {
      // Check if credit for same service/package exists
      const existingCreditIndex = wallets[walletIndex].credits.findIndex(
        c => c.serviceId === credit.serviceId && c.packageId === credit.packageId
      );

      if (existingCreditIndex > -1) {
        // Add to existing credit
        wallets[walletIndex].credits[existingCreditIndex].remaining += credit.remaining;
        wallets[walletIndex].credits[existingCreditIndex].total += credit.total;
      } else {
        wallets[walletIndex].credits.push(credit);
      }
    }

    this.wallets$.next([...wallets]);
  }

  /**
   * Redeem a service credit (use one session)
   */
  redeemCredit(patientId: string, serviceId: string, units: number = 1): boolean {
    const wallets = this.wallets$.value;
    const wallet = wallets.find(w => w.patientId === patientId);

    if (!wallet) return false;

    const creditIndex = wallet.credits.findIndex(
      c => c.serviceId === serviceId && c.remaining > 0
    );

    if (creditIndex === -1) return false; // No credits available

    const credit = wallet.credits[creditIndex];
    const actualUnits = Math.min(units, credit.remaining);
    credit.remaining -= actualUnits;

    // Remove credit if fully used
    if (credit.remaining <= 0) {
      wallet.credits.splice(creditIndex, 1);
    }

    this.wallets$.next([...wallets]);
    return true;
  }

  /**
   * Reserve credits for appointment (temporarily reduce but can be adjusted at session end)
   */
  reserveCredits(patientId: string, serviceId: string, units: number): boolean {
    return this.redeemCredit(patientId, serviceId, units);
  }

  /**
   * Adjust credits after session (if actual usage differs from reserved)
   * positive adjustment = return credits, negative = deduct more
   */
  adjustCredits(patientId: string, serviceId: string, adjustment: number): void {
    if (adjustment === 0) return;

    const wallets = this.wallets$.value;
    const wallet = wallets.find(w => w.patientId === patientId);
    if (!wallet) return;

    const creditIndex = wallet.credits.findIndex(c => c.serviceId === serviceId);

    if (adjustment > 0) {
      // Return credits
      if (creditIndex > -1) {
        wallet.credits[creditIndex].remaining += adjustment;
      }
    } else {
      // Deduct more credits
      if (creditIndex > -1 && wallet.credits[creditIndex].remaining >= Math.abs(adjustment)) {
        wallet.credits[creditIndex].remaining += adjustment; // adjustment is negative
      }
    }

    this.wallets$.next([...wallets]);
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

  /**
   * Generate mock wallet data
   */
  private generateMockWallets(): PatientWallet[] {
    return [
      {
        patientId: 'p1',
        cashBalance: 500,
        credits: [
          {
            serviceId: 's1',
            serviceName: 'Full Body Laser Hair Removal',
            remaining: 4,
            total: 6,
            expiresAt: new Date(2026, 5, 30),
            packageId: 'pkg1',
            unitType: 'session'
          },
          {
            serviceId: 's2',
            serviceName: 'Face Laser',
            remaining: 500,
            total: 1000,
            expiresAt: new Date(2026, 11, 31),
            packageId: 'pkg2',
            unitType: 'pulse'
          },
          {
            serviceId: 's4',
            serviceName: 'HydraFacial',
            remaining: 2,
            total: 3,
            expiresAt: new Date(2026, 11, 31),
            packageId: 'pkg3',
            unitType: 'session'
          }
        ]
      },
      {
        patientId: 'p2',
        cashBalance: 1200,
        credits: []
      },
      {
        patientId: 'p3',
        cashBalance: 0,
        credits: [
          {
            serviceId: 's6',
            serviceName: 'Botox Full Face',
            remaining: 1,
            total: 2,
            packageId: 'pkg4',
            unitType: 'session'
          }
        ]
      }
    ];
  }
}
