import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PageHeaderComponent, CalendarComponent, ModalComponent } from '../../components/shared';
import { CalendarService, CalendarEvent, CalendarView } from '../../services/calendar.service';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Doctor, Room, Patient } from '../../models';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent, CalendarComponent, ModalComponent],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarPage implements OnInit {
  // Data
  events: CalendarEvent[] = [];
  filteredEvents: CalendarEvent[] = [];
  doctors: Doctor[] = [];
  rooms: Room[] = [];
  patients: Patient[] = [];

  // Filters
  activeTab: 'all' | 'room' | 'doctor' | 'patient' = 'all';
  selectedRoomId = '';
  selectedDoctorId = '';
  selectedPatientId = '';
  patientSearch = '';
  filteredPatients: Patient[] = [];

  // Current view
  currentView: CalendarView = 'timeGridWeek';

  // Event detail modal
  showEventModal = false;
  selectedEvent: CalendarEvent | null = null;

  constructor(
    private calendarService: CalendarService,
    private dataService: DataService,
    private alertService: SweetAlertService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    forkJoin({
      events: this.calendarService.getAllEvents(),
      doctors: this.dataService.getDoctors(),
      rooms: this.dataService.getRooms(),
      patients: this.dataService.getPatients()
    }).subscribe({
      next: ({ events, doctors, rooms, patients }) => {
        this.events = events;
        this.doctors = doctors;
        this.rooms = rooms;
        this.patients = patients;
        this.applyFilter();
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }

  setTab(tab: 'all' | 'room' | 'doctor' | 'patient') {
    this.activeTab = tab;
    this.selectedRoomId = '';
    this.selectedDoctorId = '';
    this.selectedPatientId = '';
    this.applyFilter();
  }

  applyFilter() {
    switch (this.activeTab) {
      case 'room':
        this.filteredEvents = this.selectedRoomId
          ? this.events.filter(e => e.extendedProps.roomId === this.selectedRoomId)
          : [];
        break;
      case 'doctor':
        this.filteredEvents = this.selectedDoctorId
          ? this.events.filter(e => e.extendedProps.doctorId === this.selectedDoctorId)
          : [];
        break;
      case 'patient':
        this.filteredEvents = this.selectedPatientId
          ? this.events.filter(e => e.extendedProps.patientId === this.selectedPatientId)
          : [];
        break;
      default:
        this.filteredEvents = this.events;
    }
  }

  selectRoom(roomId: string) {
    this.selectedRoomId = roomId;
    this.applyFilter();
  }

  selectDoctor(doctorId: string) {
    this.selectedDoctorId = doctorId;
    this.applyFilter();
  }

  selectPatient(patientId: string) {
    this.selectedPatientId = patientId;
    this.patientSearch = '';
    this.filteredPatients = [];
    this.applyFilter();
  }

  searchPatients() {
    if (this.patientSearch.length < 2) {
      this.filteredPatients = [];
      return;
    }
    const search = this.patientSearch.toLowerCase();
    this.filteredPatients = this.patients.filter(p =>
      p.firstName.toLowerCase().includes(search) ||
      p.lastName.toLowerCase().includes(search) ||
      p.phone.includes(search)
    ).slice(0, 10);
  }

  getSelectedPatient(): Patient | undefined {
    return this.patients.find(p => p.id === this.selectedPatientId);
  }

  getSelectedDoctor(): Doctor | undefined {
    return this.doctors.find(d => d.id === this.selectedDoctorId);
  }

  getSelectedRoom(): Room | undefined {
    return this.rooms.find(r => r.id === this.selectedRoomId);
  }

  getCalendarTitle(): string {
    switch (this.activeTab) {
      case 'room':
        return this.getSelectedRoom()?.name || 'Select a Room';
      case 'doctor':
        return this.getSelectedDoctor()?.name || 'Select a Doctor';
      case 'patient':
        const patient = this.getSelectedPatient();
        return patient ? `${patient.firstName} ${patient.lastName}` : 'Select a Patient';
      default:
        return 'All Appointments';
    }
  }

  getCalendarSubtitle(): string {
    const count = this.filteredEvents.length;
    return `${count} appointment${count !== 1 ? 's' : ''}`;
  }

  onEventClick(event: CalendarEvent) {
    this.selectedEvent = event;
    this.showEventModal = true;
  }

  closeEventModal() {
    this.showEventModal = false;
    this.selectedEvent = null;
  }

  onDateSelect(selection: { start: Date; end: Date }) {
    const dateStr = selection.start.toISOString().split('T')[0];
    this.router.navigate(['/appointments'], { queryParams: { date: dateStr } });
  }

  onViewChange(view: CalendarView) {
    this.currentView = view;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'scheduled': 'Scheduled',
      'checked-in': 'Checked In',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'billed': 'Billed',
      'cancelled': 'Cancelled',
      'no-show': 'No Show'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }
}
