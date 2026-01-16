import { Injectable } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { DataService } from './data.service';
import { Appointment, Doctor, Patient, Room, Service } from '../models';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    appointmentId: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    roomId: string;
    roomName: string;
    services: string[];
    status: string;
  };
}

export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

  // Status colors - Aligned with Merve Aesthetics professional palette
  private statusColors: Record<string, { bg: string; border: string; text: string }> = {
    'scheduled': { bg: '#0E7490', border: '#155E75', text: '#FFFFFF' },      // Primary Cyan
    'checked-in': { bg: '#F59E0B', border: '#D97706', text: '#FFFFFF' },     // Warning Amber
    'in-progress': { bg: '#6366F1', border: '#4F46E5', text: '#FFFFFF' },    // Indigo (for distinction)
    'completed': { bg: '#10B981', border: '#059669', text: '#FFFFFF' },      // Success Emerald
    'billed': { bg: '#64748B', border: '#475569', text: '#FFFFFF' },         // Muted Slate
    'cancelled': { bg: '#EF4444', border: '#DC2626', text: '#FFFFFF' },      // Danger Red
    'no-show': { bg: '#94A3B8', border: '#64748B', text: '#FFFFFF' }         // Slate Grey
  };

  constructor(private dataService: DataService) {}

  /**
   * Get all calendar events with full details
   */
  getAllEvents(): Observable<CalendarEvent[]> {
    return combineLatest([
      this.dataService.getAppointments(),
      this.dataService.getPatients(),
      this.dataService.getDoctors(),
      this.dataService.getRooms(),
      this.dataService.getServices()
    ]).pipe(
      map(([appointments, patients, doctors, rooms, services]) =>
        this.mapAppointmentsToEvents(appointments, patients, doctors, rooms, services)
      )
    );
  }

  /**
   * Get events filtered by room
   */
  getRoomEvents(roomId: string): Observable<CalendarEvent[]> {
    return this.getAllEvents().pipe(
      map(events => events.filter(e => e.extendedProps.roomId === roomId))
    );
  }

  /**
   * Get events filtered by doctor
   */
  getDoctorEvents(doctorId: string): Observable<CalendarEvent[]> {
    return this.getAllEvents().pipe(
      map(events => events.filter(e => e.extendedProps.doctorId === doctorId))
    );
  }

  /**
   * Get events filtered by patient
   */
  getPatientEvents(patientId: string): Observable<CalendarEvent[]> {
    return this.getAllEvents().pipe(
      map(events => events.filter(e => e.extendedProps.patientId === patientId))
    );
  }

  /**
   * Get events for a specific date range
   */
  getEventsInRange(start: Date, end: Date): Observable<CalendarEvent[]> {
    return this.getAllEvents().pipe(
      map(events => events.filter(e =>
        new Date(e.start) >= start && new Date(e.end) <= end
      ))
    );
  }

  /**
   * Map appointments to FullCalendar events
   */
  private mapAppointmentsToEvents(
    appointments: Appointment[],
    patients: Patient[],
    doctors: Doctor[],
    rooms: Room[],
    services: Service[]
  ): CalendarEvent[] {
    return appointments
      .filter(apt => apt.status !== 'cancelled')
      .map(apt => {
        const patient = patients.find(p => p.id === apt.patientId);
        const doctor = doctors.find(d => d.id === apt.doctorId);
        const room = rooms.find(r => r.id === apt.roomId);
        const serviceNames = apt.services.map(s =>
          services.find(svc => svc.id === s.serviceId)?.name || 'Unknown'
        );

        const colors = this.statusColors[apt.status] || this.statusColors['scheduled'];
        const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown';

        return {
          id: apt.id,
          title: `${patientName} - ${serviceNames.join(', ')}`,
          start: new Date(apt.scheduledStart),
          end: new Date(apt.scheduledEnd),
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
          extendedProps: {
            appointmentId: apt.id,
            patientId: apt.patientId,
            patientName: patientName,
            doctorId: apt.doctorId,
            doctorName: doctor?.name || 'Unknown',
            roomId: apt.roomId,
            roomName: room?.name || 'Unknown',
            services: serviceNames,
            status: apt.status
          }
        };
      });
  }

  /**
   * Get status color for legend
   */
  getStatusColors(): { status: string; label: string; color: string }[] {
    return [
      { status: 'scheduled', label: 'Scheduled', color: this.statusColors['scheduled'].bg },
      { status: 'checked-in', label: 'Checked In', color: this.statusColors['checked-in'].bg },
      { status: 'in-progress', label: 'In Progress', color: this.statusColors['in-progress'].bg },
      { status: 'completed', label: 'Completed', color: this.statusColors['completed'].bg },
      { status: 'billed', label: 'Billed', color: this.statusColors['billed'].bg },
      { status: 'cancelled', label: 'Cancelled', color: this.statusColors['cancelled'].bg },
      { status: 'no-show', label: 'No Show', color: this.statusColors['no-show'].bg }
    ];
  }

  /**
   * Get FullCalendar options for consistent configuration
   */
  getCalendarOptions(view: CalendarView = 'timeGridWeek') {
    return {
      initialView: view,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
      },
      slotMinTime: '07:00:00',
      slotMaxTime: '22:00:00',
      slotDuration: '00:30:00',
      allDaySlot: false,
      weekends: true,
      editable: false,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      nowIndicator: true,
      height: 'auto',
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      },
      slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
    };
  }
}
