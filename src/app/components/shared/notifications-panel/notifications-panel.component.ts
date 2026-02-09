import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AlertService, AppAlert } from '../../../services/alert.service';

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications-panel.component.html',
  styleUrls: ['./notifications-panel.component.scss']
})
export class NotificationsPanelComponent implements OnInit, OnDestroy {
  @Input() category!: 'inventory' | 'devices';
  @Input() isOpen = false;
  
  alerts: AppAlert[] = [];
  private alertSub?: Subscription;

  constructor(private alertService: AlertService) {}

  ngOnInit() {
    this.alertSub = this.alertService.getAlerts(this.category).subscribe(alerts => {
      this.alerts = alerts;
    });
  }

  ngOnDestroy() {
    this.alertSub?.unsubscribe();
  }

  dismissAlert(alert: AppAlert) {
    this.alertService.dismissAlert(alert.id);
  }

  snoozeAlert(alert: AppAlert) {
    this.alertService.snoozeAlert(alert.id);
  }

  getSeverityIcon(severity: string): string {
    return severity === 'critical' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-triangle-exclamation';
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'low_stock': return 'fa-solid fa-boxes-stacked';
      case 'expiry': return 'fa-solid fa-calendar-xmark';
      case 'maintenance': return 'fa-solid fa-wrench';
      default: return 'fa-solid fa-bell';
    }
  }
}
