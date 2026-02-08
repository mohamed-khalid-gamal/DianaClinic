import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent, StatCardComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';

interface RevenueStats {
  totalRevenue: number;
  totalInvoices: number;
  totalPayments: number;
  averageInvoice: number;
  startDate: Date;
  endDate: Date;
}

interface ServiceRevenue {
  service: string;
  revenue: number;
  count: number;
}

interface DoctorRevenue {
  doctor: string;
  revenue: number;
  appointmentCount: number;
}

interface PeriodRevenue {
  period: string;
  revenue: number;
  count: number;
}

interface AppointmentStats {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  scheduled: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
}

interface PatientStats {
  totalPatients: number;
  newPatients: number;
  activePatients: number;
  retentionRate: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, StatCardComponent],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class Reports implements OnInit {
  loading = false;

  // Date filters
  startDate: string = '';
  endDate: string = '';
  periodType: 'day' | 'week' | 'month' = 'day';

  // Stats
  revenueStats: RevenueStats | null = null;
  serviceRevenue: ServiceRevenue[] = [];
  doctorRevenue: DoctorRevenue[] = [];
  periodRevenue: PeriodRevenue[] = [];
  appointmentStats: AppointmentStats | null = null;
  patientStats: PatientStats | null = null;

  constructor(
    private dataService: DataService,
    private alertService: SweetAlertService
  ) {
    // Default to last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    this.endDate = this.formatDate(end);
    this.startDate = this.formatDate(start);
  }

  ngOnInit() {
    this.loadReports();
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  loadReports() {
    this.loading = true;
    const params = `?startDate=${this.startDate}&endDate=${this.endDate}`;

    Promise.all([
      this.dataService.getRevenueStats(params).toPromise(),
      this.dataService.getRevenueByService(params).toPromise(),
      this.dataService.getRevenueByDoctor(params).toPromise(),
      this.dataService.getRevenueByPeriod(params, this.periodType).toPromise(),
      this.dataService.getAppointmentStats(params).toPromise(),
      this.dataService.getPatientStats(params).toPromise()
    ]).then(([revenue, serviceRev, doctorRev, periodRev, aptStats, patStats]) => {
      this.revenueStats = revenue as RevenueStats;
      this.serviceRevenue = (serviceRev as ServiceRevenue[]).slice(0, 10); // Top 10
      this.doctorRevenue = doctorRev as DoctorRevenue[];
      this.periodRevenue = periodRev as PeriodRevenue[];
      this.appointmentStats = aptStats as AppointmentStats;
      this.patientStats = patStats as PatientStats;
      this.loading = false;
    }).catch(() => {
      this.alertService.error('Failed to load reports');
      this.loading = false;
    });
  }

  refreshReports() {
    this.loadReports();
  }

  exportToCSV() {
    if (!this.serviceRevenue.length) {
      this.alertService.validationError('No data to export');
      return;
    }

    let csv = 'Report Type,Metric,Value\n';

    // Revenue stats
    if (this.revenueStats) {
      csv += `Revenue,Total Revenue,${this.revenueStats.totalRevenue}\n`;
      csv += `Revenue,Total Invoices,${this.revenueStats.totalInvoices}\n`;
      csv += `Revenue,Average Invoice,${this.revenueStats.averageInvoice.toFixed(2)}\n\n`;
    }

    // Service revenue
    csv += 'Service Revenue,Service,Revenue,Count\n';
    this.serviceRevenue.forEach(s => {
      csv += `Service,${s.service},${s.revenue},${s.count}\n`;
    });
    csv += '\n';

    // Doctor revenue
    csv += 'Doctor Revenue,Doctor,Revenue,Appointments\n';
    this.doctorRevenue.forEach(d => {
      csv += `Doctor,${d.doctor},${d.revenue},${d.appointmentCount}\n`;
    });
    csv += '\n';

    // Appointment stats
    if (this.appointmentStats) {
      csv += 'Appointments,Metric,Count,Rate\n';
      csv += `Appointments,Total,${this.appointmentStats.total},-\n`;
      csv += `Appointments,Completed,${this.appointmentStats.completed},${this.appointmentStats.completionRate.toFixed(1)}%\n`;
      csv += `Appointments,Cancelled,${this.appointmentStats.cancelled},${this.appointmentStats.cancellationRate.toFixed(1)}%\n`;
      csv += `Appointments,No-Show,${this.appointmentStats.noShow},${this.appointmentStats.noShowRate.toFixed(1)}%\n\n`;
    }

    // Patient stats
    if (this.patientStats) {
      csv += 'Patients,Metric,Count\n';
      csv += `Patients,Total Patients,${this.patientStats.totalPatients}\n`;
      csv += `Patients,New Patients,${this.patientStats.newPatients}\n`;
      csv += `Patients,Active Patients,${this.patientStats.activePatients}\n`;
      csv += `Patients,Retention Rate,${this.patientStats.retentionRate.toFixed(1)}%\n`;
    }

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinic-report-${this.startDate}-to-${this.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    this.alertService.success('Report exported successfully');
  }

  formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
