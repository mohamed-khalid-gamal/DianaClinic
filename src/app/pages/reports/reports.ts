import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { PageHeaderComponent, StatCardComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import {
  RevenueStats,
  ServiceRevenue,
  DoctorRevenue,
  PeriodRevenue,
  AppointmentStats,
  PatientStats,
  ReportComparison,
  RoomUtilization,
  DeviceUtilization
} from '../../models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, StatCardComponent, BaseChartDirective],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Reports implements OnInit {
  loading = false;
  activeTab: 'overview' | 'revenue' | 'operations' | 'utilization' = 'overview';

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
  comparison: ReportComparison | null = null;
  roomUtilization: RoomUtilization[] = [];
  deviceUtilization: DeviceUtilization[] = [];

  readonly lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Revenue: ${this.formatCurrency(context.parsed.y || 0)}`
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => this.formatCompactCurrency(Number(value))
        }
      }
    }
  };

  readonly pieChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${this.formatCurrency(Number(context.raw || 0))}`
        }
      }
    }
  };

  readonly verticalBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Revenue: ${this.formatCurrency(context.parsed.y || 0)}`
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => this.formatCompactCurrency(Number(value))
        }
      }
    }
  };

  readonly horizontalBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        ticks: {
          callback: (value) => `${Number(value).toFixed(0)}`
        }
      }
    }
  };

  constructor(
    private dataService: DataService,
    private alertService: SweetAlertService,
    private cdr: ChangeDetectorRef
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

  setTab(tab: 'overview' | 'revenue' | 'operations' | 'utilization') {
    this.activeTab = tab;
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  loadReports() {
    if (!this.startDate || !this.endDate) {
      this.alertService.validationError('Start and end dates are required');
      return;
    }

    if (new Date(this.startDate) > new Date(this.endDate)) {
      this.alertService.validationError('Start date cannot be after end date');
      return;
    }

    this.loading = true;
    const params = `?startDate=${this.startDate}&endDate=${this.endDate}`;

    forkJoin({
      revenue: this.dataService.getRevenueStats(params),
      serviceRev: this.dataService.getRevenueByService(params),
      doctorRev: this.dataService.getRevenueByDoctor(params),
      periodRev: this.dataService.getRevenueByPeriod(params, this.periodType),
      aptStats: this.dataService.getAppointmentStats(params),
      patStats: this.dataService.getPatientStats(params),
      comparison: this.dataService.getComparisonStats(params),
      roomUtilization: this.dataService.getRoomUtilization(params),
      deviceUtilization: this.dataService.getDeviceUtilization(params)
    }).subscribe({
      next: ({ revenue, serviceRev, doctorRev, periodRev, aptStats, patStats, comparison, roomUtilization, deviceUtilization }) => {
        this.revenueStats = revenue;
        this.serviceRevenue = serviceRev.slice(0, 10);
        this.doctorRevenue = doctorRev;
        this.periodRevenue = periodRev;
        this.appointmentStats = aptStats;
        this.patientStats = patStats;
        this.comparison = comparison;
        this.roomUtilization = roomUtilization;
        this.deviceUtilization = deviceUtilization;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.alertService.toast('Failed to load reports', 'error');
        this.cdr.markForCheck();
      }
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
      csv += `Revenue,Invoice Revenue,${this.revenueStats.invoiceRevenue || 0}\n`;
      csv += `Revenue,Package Revenue,${this.revenueStats.packageRevenue || 0}\n`;
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

    if (this.roomUtilization.length) {
      csv += '\nRoom Utilization,Room,Bookings,Hours,Utilization Rate\n';
      this.roomUtilization.forEach(r => {
        csv += `Room,${r.roomName},${r.totalBookings},${r.totalHours},${r.utilizationRate}%\n`;
      });
    }

    if (this.deviceUtilization.length) {
      csv += '\nDevice Utilization,Device,Usages,Units,Avg Units Per Usage\n';
      this.deviceUtilization.forEach(d => {
        csv += `Device,${d.deviceName},${d.totalUsages},${d.totalUnits},${d.avgUnitsPerUsage}\n`;
      });
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

  printReport() {
    window.print();
  }

  get revenueTrendChartData(): ChartData<'line'> {
    return {
      labels: this.periodRevenue.map(item => item.period),
      datasets: [
        {
          data: this.periodRevenue.map(item => item.revenue),
          label: 'Revenue',
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          fill: true,
          tension: 0.3
        }
      ]
    };
  }

  get serviceRevenueChartData(): ChartData<'doughnut'> {
    const top = this.serviceRevenue.slice(0, 6);
    return {
      labels: top.map(item => item.service),
      datasets: [
        {
          data: top.map(item => item.revenue),
          backgroundColor: ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4']
        }
      ]
    };
  }

  get doctorRevenueChartData(): ChartData<'bar'> {
    const top = this.doctorRevenue.slice(0, 8);
    return {
      labels: top.map(item => item.doctor),
      datasets: [
        {
          data: top.map(item => item.revenue),
          label: 'Revenue',
          backgroundColor: '#8b5cf6'
        }
      ]
    };
  }

  get appointmentStatusChartData(): ChartData<'doughnut'> {
    return {
      labels: ['Completed', 'Cancelled', 'No Show', 'Scheduled'],
      datasets: [
        {
          data: [
            this.appointmentStats?.completed || 0,
            this.appointmentStats?.cancelled || 0,
            this.appointmentStats?.noShow || 0,
            this.appointmentStats?.scheduled || 0
          ],
          backgroundColor: ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6']
        }
      ]
    };
  }

  get roomUtilizationChartData(): ChartData<'bar'> {
    const top = this.roomUtilization.slice(0, 10);
    return {
      labels: top.map(item => item.roomName),
      datasets: [
        {
          data: top.map(item => item.utilizationRate),
          label: 'Utilization %',
          backgroundColor: '#06b6d4'
        }
      ]
    };
  }

  get deviceUtilizationChartData(): ChartData<'bar'> {
    const top = this.deviceUtilization.slice(0, 10);
    return {
      labels: top.map(item => item.deviceName),
      datasets: [
        {
          data: top.map(item => item.totalUnits),
          label: 'Units Used',
          backgroundColor: '#f59e0b'
        }
      ]
    };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 2
    }).format(amount || 0);
  }

  formatCompactCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount || 0);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value || 0);
  }

  formatHours(value: number): string {
    return `${(value || 0).toFixed(1)} h`;
  }

  get selectedRangeLabel(): string {
    if (!this.startDate || !this.endDate) return '';
    const start = new Date(this.startDate).toLocaleDateString('en-US', { dateStyle: 'medium' });
    const end = new Date(this.endDate).toLocaleDateString('en-US', { dateStyle: 'medium' });
    return `${start} - ${end}`;
  }

  get previousRangeLabel(): string {
    if (!this.comparison?.previousStartDate || !this.comparison?.previousEndDate) return '';
    const start = new Date(this.comparison.previousStartDate).toLocaleDateString('en-US', { dateStyle: 'medium' });
    const end = new Date(this.comparison.previousEndDate).toLocaleDateString('en-US', { dateStyle: 'medium' });
    return `${start} - ${end}`;
  }

  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
