import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { AlertService } from './alert.service';

export interface BadgeCounts {
  inventory: number;
  devices: number;
  sessions: number;
}

@Injectable({
  providedIn: 'root'
})
export class BadgeService {
  private badgeCounts$ = new BehaviorSubject<BadgeCounts>({
    inventory: 0,
    devices: 0,
    sessions: 0
  });

  private inventorySub?: Subscription;
  private devicesSub?: Subscription;

  constructor(private alertService: AlertService) {
    this.startListening();
  }

  getBadgeCounts(): Observable<BadgeCounts> {
    return this.badgeCounts$.asObservable();
  }

  refreshCounts(): void {
    this.alertService.refreshAlerts();
  }

  private startListening(): void {
    // Subscribe to inventory alerts
    this.inventorySub = this.alertService.getAlertCount('inventory').subscribe(count => {
      this.badgeCounts$.next({
        ...this.badgeCounts$.value,
        inventory: count
      });
    });

    // Subscribe to device alerts
    this.devicesSub = this.alertService.getAlertCount('devices').subscribe(count => {
      this.badgeCounts$.next({
        ...this.badgeCounts$.value,
        devices: count
      });
    });
  }
}
