import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent, ModalComponent, StatCardComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Appointment, Patient, Doctor, Room, Service, Session } from '../../models';

interface ActiveSession {
  appointment: Appointment;
  patient: Patient;
  doctor: Doctor;
  room: Room;
  services: Service[];
  startTime: Date;
  elapsedMinutes: number;
  consumablesUsed: { name: string; quantity: number }[];
  notes: string;
}

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent, ModalComponent, StatCardComponent],
  templateUrl: './sessions.html',
  styleUrl: './sessions.scss'
})
export class Sessions implements OnInit {
  appointments: Appointment[] = [];
  patients: Patient[] = [];
  doctors: Doctor[] = [];
  rooms: Room[] = [];
  services: Service[] = [];
  
  activeSessions: ActiveSession[] = [];
  
  showSessionModal = false;
  selectedSession: ActiveSession | null = null;
  sessionNotes = '';

  constructor(
    private dataService: DataService,
    private alertService: SweetAlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
    // Update elapsed time every minute
    setInterval(() => this.updateElapsedTimes(), 60000);
  }

  loadData() {
    this.dataService.getAppointments().subscribe(apt => {
      this.appointments = apt;
      this.buildActiveSessions();
    });
    this.dataService.getPatients().subscribe(p => this.patients = p);
    this.dataService.getDoctors().subscribe(d => this.doctors = d);
    this.dataService.getRooms().subscribe(r => this.rooms = r);
    this.dataService.getServices().subscribe(s => this.services = s);
  }

  buildActiveSessions() {
    // Find appointments that are in-progress (active sessions)
    const inProgressApts = this.appointments.filter(a => a.status === 'in-progress');
    
    this.activeSessions = inProgressApts.map(apt => ({
      appointment: apt,
      patient: this.patients.find(p => p.id === apt.patientId) || {} as Patient,
      doctor: this.doctors.find(d => d.id === apt.doctorId) || {} as Doctor,
      room: this.rooms.find(r => r.id === apt.roomId) || {} as Room,
      services: apt.services.map(s => this.services.find(svc => svc.id === s.serviceId)).filter(Boolean) as Service[],
      startTime: new Date(apt.scheduledStart),
      elapsedMinutes: Math.round((Date.now() - new Date(apt.scheduledStart).getTime()) / 60000),
      consumablesUsed: [],
      notes: ''
    }));
  }

  updateElapsedTimes() {
    this.activeSessions.forEach(session => {
      session.elapsedMinutes = Math.round((Date.now() - session.startTime.getTime()) / 60000);
    });
  }

  get checkedInAppointments(): Appointment[] {
    return this.appointments.filter(a => a.status === 'checked-in');
  }

  getPatientName(patientId: string): string {
    const patient = this.patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : '';
  }

  getDoctorName(doctorId: string): string {
    return this.doctors.find(d => d.id === doctorId)?.name || '';
  }

  getRoomName(roomId: string): string {
    return this.rooms.find(r => r.id === roomId)?.name || '';
  }

  getServiceNames(apt: Appointment): string[] {
    return apt.services.map(s => this.services.find(svc => svc.id === s.serviceId)?.name || 'Unknown');
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  formatElapsed(minutes: number): string {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }

  // Start new session from checked-in appointment
  startSession(apt: Appointment) {
    const patientName = this.getPatientName(apt.patientId);
    this.dataService.updateAppointmentStatus(apt.id, 'in-progress');
    
    // Immediately update local state to reflect the change
    apt.status = 'in-progress';
    this.buildActiveSessions();
    
    this.alertService.sessionStarted(patientName);
  }

  // Open session details modal
  openSessionModal(session: ActiveSession) {
    this.selectedSession = session;
    this.sessionNotes = session.notes;
    this.showSessionModal = true;
  }

  closeSessionModal() {
    this.showSessionModal = false;
    this.selectedSession = null;
  }

  // End session and move to billing
  endSession(session: ActiveSession) {
    // Update appointment status to completed
    this.dataService.updateAppointmentStatus(session.appointment.id, 'completed');
    
    // Immediately remove from active sessions for instant UI update
    session.appointment.status = 'completed';
    this.activeSessions = this.activeSessions.filter(s => s.appointment.id !== session.appointment.id);
    
    // In a real app, we'd also:
    // 1. Create a Session record with consumables and notes
    // 2. Update device counters
    // 3. Navigate to billing
    
    const patientName = `${session.patient.firstName} ${session.patient.lastName}`;
    this.closeSessionModal();
    this.alertService.sessionEnded(patientName);
  }

  // Quick end session from card
  async quickEndSession(session: ActiveSession) {
    const patientName = `${session.patient.firstName}`;
    const confirmed = await this.alertService.confirm(
      'End Session?',
      `End session for ${patientName}? This will move to billing.`,
      'Yes, End Session',
      'Cancel'
    );
    if (confirmed) {
      this.endSession(session);
    }
    this.cdr.markForCheck();
  }
}
