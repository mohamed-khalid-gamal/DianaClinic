import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataService } from './data.service';
import { Device, InventoryItem } from '../models';

export interface AppAlert {
  id: string;
  type: 'low_stock' | 'expiry' | 'maintenance';
  category: 'inventory' | 'devices';
  title: string;
  message: string;
  relatedId: string;
  relatedName: string;
  severity: 'warning' | 'critical';
  createdAt: Date;
}

interface DismissedAlerts {
  [alertId: string]: boolean;
}

interface SnoozedAlerts {
  [alertId: string]: number; // timestamp when snooze expires
}

const DISMISSED_KEY = 'clinic_dismissed_alerts';
const SNOOZED_KEY = 'clinic_snoozed_alerts';
const SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alerts$ = new BehaviorSubject<AppAlert[]>([]);
  private dismissed: DismissedAlerts = {};
  private snoozed: SnoozedAlerts = {};

  constructor(private dataService: DataService) {
    this.loadFromStorage();
    this.refreshAlerts();
  }

  getAlerts(category?: 'inventory' | 'devices'): Observable<AppAlert[]> {
    return this.alerts$.pipe(
      map(alerts => {
        let filtered = this.filterVisibleAlerts(alerts);
        if (category) {
          filtered = filtered.filter(a => a.category === category);
        }
        return filtered;
      })
    );
  }

  getAlertCount(category?: 'inventory' | 'devices'): Observable<number> {
    return this.getAlerts(category).pipe(map(alerts => alerts.length));
  }

  dismissAlert(alertId: string): void {
    this.dismissed[alertId] = true;
    this.saveToStorage();
    this.alerts$.next(this.alerts$.value); // Trigger update
  }

  snoozeAlert(alertId: string): void {
    this.snoozed[alertId] = Date.now() + SNOOZE_DURATION_MS;
    this.saveToStorage();
    this.alerts$.next(this.alerts$.value); // Trigger update
  }

  refreshAlerts(): void {
    this.cleanupExpiredSnoozes();
    
    forkJoin({
      inventory: this.dataService.getInventory(),
      devices: this.dataService.getDevices()
    }).subscribe({
      next: ({ inventory, devices }) => {
        const alerts: AppAlert[] = [
          ...this.generateInventoryAlerts(inventory),
          ...this.generateDeviceAlerts(devices)
        ];
        
        // Clean up dismissed alerts for items that no longer have issues
        this.cleanupResolvedDismissals(alerts);
        
        this.alerts$.next(alerts);
      },
      error: () => {
        // Silent fail
      }
    });
  }

  private filterVisibleAlerts(alerts: AppAlert[]): AppAlert[] {
    const now = Date.now();
    return alerts.filter(alert => {
      // Check if dismissed
      if (this.dismissed[alert.id]) return false;
      // Check if snoozed and not expired
      const snoozeExpiry = this.snoozed[alert.id];
      if (snoozeExpiry && snoozeExpiry > now) return false;
      return true;
    });
  }

  private generateInventoryAlerts(items: InventoryItem[]): AppAlert[] {
    const alerts: AppAlert[] = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const item of items) {
      // Low stock alert
      if (item.quantity <= item.reorderThreshold) {
        const isCritical = item.quantity === 0;
        alerts.push({
          id: `low_stock_${item.id}`,
          type: 'low_stock',
          category: 'inventory',
          title: isCritical ? 'Out of Stock' : 'Low Stock',
          message: isCritical 
            ? `${item.name} is out of stock. Reorder immediately.`
            : `${item.name} has ${item.quantity} ${item.unit}(s) remaining (threshold: ${item.reorderThreshold}).`,
          relatedId: item.id,
          relatedName: item.name,
          severity: isCritical ? 'critical' : 'warning',
          createdAt: now
        });
      }

      // Expiring soon alert
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        if (expiryDate <= thirtyDaysFromNow) {
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isExpired = daysUntilExpiry <= 0;
          const isCritical = daysUntilExpiry <= 7;
          
          alerts.push({
            id: `expiry_${item.id}`,
            type: 'expiry',
            category: 'inventory',
            title: isExpired ? 'Expired' : 'Expiring Soon',
            message: isExpired
              ? `${item.name} has expired. Remove from inventory.`
              : `${item.name} expires in ${daysUntilExpiry} day(s).`,
            relatedId: item.id,
            relatedName: item.name,
            severity: isCritical ? 'critical' : 'warning',
            createdAt: now
          });
        }
      }
    }

    return alerts;
  }

  private generateDeviceAlerts(devices: Device[]): AppAlert[] {
    const alerts: AppAlert[] = [];
    const now = new Date();

    for (const device of devices) {
      // Near maintenance threshold
      const percentage = (device.currentCounter / device.maintenanceThreshold) * 100;
      
      if (percentage >= 90 || device.status === 'maintenance') {
        const isCritical = percentage >= 100 || device.status === 'maintenance';
        
        alerts.push({
          id: `maintenance_${device.id}`,
          type: 'maintenance',
          category: 'devices',
          title: device.status === 'maintenance' ? 'Under Maintenance' : 'Maintenance Due',
          message: device.status === 'maintenance'
            ? `${device.name} is currently under maintenance.`
            : `${device.name} is at ${percentage.toFixed(0)}% of maintenance threshold (${device.currentCounter.toLocaleString()}/${device.maintenanceThreshold.toLocaleString()}).`,
          relatedId: device.id,
          relatedName: device.name,
          severity: isCritical ? 'critical' : 'warning',
          createdAt: now
        });
      }
    }

    return alerts;
  }

  private cleanupExpiredSnoozes(): void {
    const now = Date.now();
    let changed = false;
    for (const alertId of Object.keys(this.snoozed)) {
      if (this.snoozed[alertId] <= now) {
        delete this.snoozed[alertId];
        changed = true;
      }
    }
    if (changed) {
      this.saveToStorage();
    }
  }

  private cleanupResolvedDismissals(currentAlerts: AppAlert[]): void {
    const currentAlertIds = new Set(currentAlerts.map(a => a.id));
    let changed = false;
    for (const alertId of Object.keys(this.dismissed)) {
      if (!currentAlertIds.has(alertId)) {
        delete this.dismissed[alertId];
        changed = true;
      }
    }
    if (changed) {
      this.saveToStorage();
    }
  }

  private loadFromStorage(): void {
    try {
      const dismissedJson = localStorage.getItem(DISMISSED_KEY);
      const snoozedJson = localStorage.getItem(SNOOZED_KEY);
      this.dismissed = dismissedJson ? JSON.parse(dismissedJson) : {};
      this.snoozed = snoozedJson ? JSON.parse(snoozedJson) : {};
    } catch {
      this.dismissed = {};
      this.snoozed = {};
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(this.dismissed));
      localStorage.setItem(SNOOZED_KEY, JSON.stringify(this.snoozed));
    } catch {
      // Silent fail if localStorage is full or disabled
    }
  }
}
