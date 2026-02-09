import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PageHeaderComponent, StatCardComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Appointment, Alert, Doctor, Room, Patient } from '../../models';
import { getAppointmentStatusColor } from '../../utils/status-colors';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, StatCardComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard implements OnInit {
  loading = true;
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
  patients: Patient[] = [];

  constructor(
    private dataService: DataService,
    private alertService: SweetAlertService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    forkJoin({
      stats: this.dataService.getDashboardStats(),
      appointments: this.dataService.getAppointments(),
      alerts: this.dataService.getAlerts(),
      doctors: this.dataService.getDoctors(),
      rooms: this.dataService.getRooms(),
      patients: this.dataService.getPatients()
    }).subscribe({
      next: ({ stats, appointments, alerts, doctors, rooms, patients }) => {
        this.stats = stats;
        this.doctors = doctors;
        this.rooms = rooms;
        this.patients = patients;
        this.alerts = alerts.filter(a => !a.isRead).slice(0, 5);
        const today = new Date();
        this.todayAppointments = appointments
          .filter(a => new Date(a.scheduledStart).toDateString() === today.toDateString())
          .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }

  getStatusColor(status: string): string {
    return getAppointmentStatusColor(status);
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

  getPatientName(patientId: string): string {
    const p = this.patients.find(pt => pt.id === patientId);
    return p ? `${p.firstName} ${p.lastName}` : 'Unknown';
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

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  checkIn(apt: Appointment) {
    this.dataService.updateAppointmentStatus(apt.id, 'checked-in').subscribe({
      next: () => {
        apt.status = 'checked-in';
        this.alertService.success(`Patient checked in successfully`);
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }

  scrollToAlerts() {
    document.getElementById('alerts-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  dismissAlert(alert: Alert) {
    this.dataService.markAlertRead(alert.id).subscribe({
      next: () => {
        this.alerts = this.alerts.filter(a => a.id !== alert.id);
        this.stats.pendingAlerts = Math.max(0, this.stats.pendingAlerts - 1);
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }

  isRoomOccupied(roomId: string): boolean {
    const now = new Date().getTime();
    return this.todayAppointments.some(a =>
      a.roomId === roomId &&
      (a.status === 'checked-in' || a.status === 'in-progress') &&
      new Date(a.scheduledStart).getTime() <= now &&
      new Date(a.scheduledEnd).getTime() >= now
    );
  }

  getRoomCurrentPatient(roomId: string): string | null {
    const now = new Date().getTime();
    const apt = this.todayAppointments.find(a =>
      a.roomId === roomId &&
      (a.status === 'checked-in' || a.status === 'in-progress') &&
      new Date(a.scheduledStart).getTime() <= now &&
      new Date(a.scheduledEnd).getTime() >= now
    );
    return apt ? this.getPatientName(apt.patientId) : null;
  }
}
