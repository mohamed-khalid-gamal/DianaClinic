import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, timer } from 'rxjs';
import { map, switchMap, shareReplay } from 'rxjs/operators';
import { DataService } from './data.service';
import { Device, InventoryItem } from '../models';

export interface BadgeCounts {
  inventory: number;  // Low stock + expiring items
  devices: number;    // Devices near maintenance threshold
  sessions: number;   // Active sessions (optional)
}

@Injectable({
  providedIn: 'root'
})
export class BadgeService {
  private readonly refreshInterval = 60000; // Refresh every 60 seconds
  
  private badgeCounts$ = new BehaviorSubject<BadgeCounts>({
    inventory: 0,
    devices: 0,
    sessions: 0
  });

  constructor(private dataService: DataService) {
    this.startPolling();
  }

  getBadgeCounts(): Observable<BadgeCounts> {
    return this.badgeCounts$.asObservable();
  }

  refreshCounts(): void {
    this.fetchCounts();
  }

  private startPolling(): void {
    // Initial fetch
    this.fetchCounts();
    
    // Poll periodically
    timer(this.refreshInterval, this.refreshInterval).subscribe(() => {
      this.fetchCounts();
    });
  }

  private fetchCounts(): void {
    forkJoin({
      inventory: this.dataService.getInventory(),
      devices: this.dataService.getDevices()
    }).subscribe({
      next: ({ inventory, devices }) => {
        const counts: BadgeCounts = {
          inventory: this.countInventoryAlerts(inventory),
          devices: this.countDeviceAlerts(devices),
          sessions: 0
        };
        this.badgeCounts$.next(counts);
      },
      error: () => {
        // Silent fail, keep existing counts
      }
    });
  }

  private countInventoryAlerts(items: InventoryItem[]): number {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return items.filter(item => {
      // Low stock
      if (item.quantity <= item.reorderThreshold) return true;
      // Expiring soon (within 30 days)
      if (item.expiryDate && new Date(item.expiryDate) <= thirtyDaysFromNow) return true;
      return false;
    }).length;
  }

  private countDeviceAlerts(devices: Device[]): number {
    return devices.filter(device => {
      // Near maintenance threshold (within 10% of limit)
      const threshold = device.maintenanceThreshold;
      const current = device.currentCounter;
      if (threshold > 0 && current >= threshold * 0.9) return true;
      // In maintenance status
      if (device.status === 'maintenance') return true;
      return false;
    }).length;
  }
}
