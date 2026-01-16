import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent, StatCardComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { Appointment, Alert, Doctor, Room } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, StatCardComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  stats = {
    todayAppointments: 0,
    totalPatients: 0,
    roomsInUse: 0,
    totalRooms: 0,
    devicesNearMaintenance: 0,
    lowStockItems: 0,
    expiringItems: 0,
    pendingAlerts: 0
  };

  todayAppointments: (Appointment & { patientName?: string; doctorName?: string; roomName?: string })[] = [];
  alerts: Alert[] = [];
  doctors: Doctor[] = [];
  rooms: Room[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.dataService.getDashboardStats().subscribe(stats => {
      this.stats = stats;
    });

    this.dataService.getAppointments().subscribe(appointments => {
      const today = new Date();
      this.todayAppointments = appointments
        .filter(a => new Date(a.scheduledStart).toDateString() === today.toDateString())
        .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
    });

    this.dataService.getAlerts().subscribe(alerts => {
      this.alerts = alerts.filter(a => !a.isRead).slice(0, 5);
    });

    this.dataService.getDoctors().subscribe(doctors => {
      this.doctors = doctors;
    });

    this.dataService.getRooms().subscribe(rooms => {
      this.rooms = rooms;
    });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'scheduled': '#3B82F6',
      'checked-in': '#F59E0B',
      'in-progress': '#8B5CF6',
      'completed': '#10B981',
      'billed': '#9CA3AF',
      'cancelled': '#EF4444',
      'no-show': '#F97316'
    };
    return colors[status] || '#6B7280';
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  getDoctorName(doctorId: string): string {
    return this.doctors.find(d => d.id === doctorId)?.name || 'Unknown';
  }

  getRoomName(roomId: string): string {
    return this.rooms.find(r => r.id === roomId)?.name || 'Unknown';
  }

  getAlertIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'low_stock': 'fa-solid fa-box-open',
      'expiry': 'fa-solid fa-triangle-exclamation',
      'maintenance': 'fa-solid fa-wrench',
      'credit_expiry': 'fa-solid fa-credit-card'
    };
    return icons[type] || 'fa-solid fa-bell';
  }

  getSeverityClass(severity: string): string {
    return `severity-${severity}`;
  }
}
