import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, Observable } from 'rxjs';
import { PageHeaderComponent, ModalComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { Appointment, Patient, Doctor, Room, Service } from '../../models';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { getAppointmentStatusColor } from '../../utils/status-colors';

interface TimeSlot {
  time: string;
  hour: number;
  minute: number;
  appointments: Appointment[];
}

interface BookingSegment {
  serviceIds: string[];
  date: string;
  time: string;
  doctorId: string;
  roomId: string;
  duration: number;
  label: string; // "Full Session" or Service Name
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent],
  templateUrl: './appointments.html',
  styleUrl: './appointments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Appointments implements OnInit {
  appointments: Appointment[] = [];
  patients: Patient[] = [];
  doctors: Doctor[] = [];
  rooms: Room[] = [];
  services: Service[] = [];
  loading = true;

  currentDate = new Date();
  viewMode: 'day' | 'week' = 'day';
  timeSlots: TimeSlot[] = [];
  searchQuery = '';

  showBookingModal = false;
  bookingStep = 1;
  bookingAttemptedStep1 = false;
  bookingAttemptedStep2 = false; // Services
  bookingAttemptedStep3 = false; // Schedule (was step 4)

  // Reschedule Modal
  showRescheduleModal = false;
  rescheduleAppointment: Appointment | null = null;
  rescheduleDate = '';
  rescheduleTime = '';
  rescheduleDoctorId = '';
  rescheduleRoomId = '';
  rescheduleAttempted = false;
  rescheduleAvailableSlots: { time: string; date: Date; doctors: Doctor[]; rooms: Room[] }[] = [];
  rescheduleSelectedDoctors: Doctor[] = [];
  rescheduleSelectedRooms: Room[] = [];

  // Refactored Booking State
  booking = {
    patientId: '',
    patientSearch: '',
    isNewPatient: false,
    newPatient: { firstName: '', lastName: '', phone: '', email: '', dateOfBirth: '', gender: 'female' as 'male' | 'female' },
    allServiceIds: [] as string[], // Master list of selected services
    notes: ''
  };



  // Scheduling Strategy
  bookingSegments: BookingSegment[] = [];
  currentSegmentIndex = 0;

  // Merge/Split Selection State
  selectedSegmentIndices: number[] = [];

  filteredPatients: Patient[] = [];

  // Wizard UI Helpers
  selectedSlotDoctors: Doctor[] = [];
  selectedSlotRooms: Room[] = [];
  minDate = '';
  availableSlots: { time: string, date: Date, doctors: Doctor[], rooms: Room[] }[] = [];

  constructor(
    private dataService: DataService,
    private alertService: SweetAlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.minDate = this.formatDateInput(new Date());
    this.loadData();
    this.generateTimeSlots();
  }

  get weekDays(): { date: Date; label: string }[] {
    const start = new Date(this.currentDate);
    start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({ date: d, label: dayNames[i] });
    }
    return days;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  getAppointmentsForDate(date: Date): Appointment[] {
    return this.filteredAppointments.filter(a =>
      new Date(a.scheduledStart).toDateString() === date.toDateString()
    ).sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
  }

  get filteredAppointments(): Appointment[] {
    if (!this.searchQuery.trim()) return this.appointments;
    const q = this.searchQuery.toLowerCase();
    return this.appointments.filter(a => {
      const patient = this.patients.find(p => p.id === a.patientId);
      const doctor = this.doctors.find(d => d.id === a.doctorId);
      const patientName = patient ? `${patient.firstName} ${patient.lastName}`.toLowerCase() : '';
      const doctorName = doctor?.name.toLowerCase() || '';
      return patientName.includes(q) || doctorName.includes(q) || a.status.includes(q);
    });
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  loadData() {
    this.loading = true;
    forkJoin({
      appointments: this.dataService.getAppointments(),
      patients: this.dataService.getPatients(),
      doctors: this.dataService.getDoctors(),
      rooms: this.dataService.getRooms(),
      services: this.dataService.getServices()
    }).subscribe({
      next: ({ appointments, patients, doctors, rooms, services }) => {
        this.appointments = appointments;
        this.patients = patients;
        this.doctors = doctors;
        this.rooms = rooms;
        this.services = services;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // --- Wizard Navigation & Logic ---

  openBookingModal() {
    this.resetBooking();
    this.showBookingModal = true;
    this.bookingStep = 1;
  }

  closeBookingModal() {
    this.showBookingModal = false;
  }

  resetBooking() {
    this.booking = {
      patientId: '',
      patientSearch: '',
      isNewPatient: false,
      newPatient: { firstName: '', lastName: '', phone: '', email: '', dateOfBirth: '', gender: 'female' as 'male' | 'female' },
      allServiceIds: [],
      notes: ''
    };
    // Actually the test sets bookingStep=2 then calls resetBooking.
    this.bookingStep = 1;

    this.bookingSegments = [];
    this.currentSegmentIndex = 0;
    this.selectedSegmentIndices = [];
    this.filteredPatients = [];
    this.availableSlots = [];
    this.bookingAttemptedStep1 = false;
    this.bookingAttemptedStep2 = false;
    this.bookingAttemptedStep3 = false;
  }



  nextStep() {
    if (!this.canProceed()) {
      if (this.bookingStep === 1) {
        this.bookingAttemptedStep1 = true;
        this.alertService.validationError('Please select a patient or enter new patient details');
      } else if (this.bookingStep === 2) {
        this.bookingAttemptedStep2 = true;
        this.alertService.validationError('Please select at least one service');
      } else if (this.bookingStep === 3) {
        this.bookingAttemptedStep3 = true;
        this.alertService.validationError('Please select date, time, doctor, and room');
      }
      return;
    }

    if (this.bookingStep === 1) {
      // After patient selection, initialize services step
    } else if (this.bookingStep === 2) {
      // Transition 2 (Services) -> 3 (Schedule): Initialize Segments
      this.initializeSegmentsAsSplit();
      if (this.bookingSegments.length === 0) return;
      this.currentSegmentIndex = 0;
      this.generateAvailableSlots();
    } else if (this.bookingStep === 3) {
      // Schedule Loop: cycle through segments
      if (this.currentSegmentIndex < this.bookingSegments.length - 1) {
        this.currentSegmentIndex++;
        this.generateAvailableSlots();
        return; // Stay on Step 3
      }
      // All segments scheduled — confirm booking
      this.confirmBooking();
      return;
    }

    if (this.bookingStep < 3) {
      this.bookingStep++;
    }
  }

  prevStep() {
    if (this.bookingStep === 3) {
      if (this.currentSegmentIndex > 0) {
        this.currentSegmentIndex--;
        this.generateAvailableSlots();
        return;
      }
    }
    if (this.bookingStep > 1) {
      this.bookingStep--;
    }
  }

  canProceed(): boolean {
    switch (this.bookingStep) {
      case 1:
        if (this.booking.isNewPatient) {
          return this.booking.newPatient.firstName.trim() !== '' &&
            this.booking.newPatient.lastName.trim() !== '' &&
            this.booking.newPatient.phone.trim() !== '';
        }
        return this.booking.patientId !== '';
      case 2:
        return this.booking.allServiceIds.length > 0;
      case 3:
        return this.isCurrentSegmentComplete();
      default:
        return true;
    }
  }

  isCurrentSegmentComplete(): boolean {
    const seg = this.getCurrentSegment();
    return !!seg && seg.date !== '' && seg.time !== '' && seg.doctorId !== '' && seg.roomId !== '';
  }

  // --- Granular Segment Logic ---

  initializeSegmentsAsSplit() {
      const selectedServices = this.services.filter(s => this.booking.allServiceIds.includes(s.id));
      // If only 1 service, go directly to schedule (no grouping step needed)
      if (selectedServices.length === 1) {
        this.bookingSegments = [{
          serviceIds: [selectedServices[0].id],
          date: this.formatDateInput(new Date()),
          time: '',
          doctorId: '',
          roomId: '',
          duration: selectedServices[0].duration,
          label: selectedServices[0].name
        }];
      } else {
        this.bookingSegments = selectedServices.map(s => ({
            serviceIds: [s.id],
            date: this.formatDateInput(new Date()),
            time: '',
            doctorId: '',
            roomId: '',
            duration: s.duration,
            label: s.name
        }));
      }
      this.selectedSegmentIndices = [];
  }

  toggleSegmentSelection(index: number) {
      const i = this.selectedSegmentIndices.indexOf(index);
      if (i > -1) {
          this.selectedSegmentIndices.splice(i, 1);
      } else {
          this.selectedSegmentIndices.push(index);
      }
  }

  canMergeSelected(): boolean {
      if (this.selectedSegmentIndices.length < 2) return false;

      const segmentIndices = this.selectedSegmentIndices;
      const allServiceIds = segmentIndices.flatMap(i => this.bookingSegments[i].serviceIds);
      const selectedServices = this.services.filter(s => allServiceIds.includes(s.id));

      const commonDoctors = this.doctors.filter(d =>
          selectedServices.every(s => !s.allowedDoctorIds?.length || s.allowedDoctorIds.includes(d.id))
      );
      const commonRooms = this.rooms.filter(r =>
          selectedServices.every(s => !s.requiredRoomTypes?.length || s.requiredRoomTypes.includes(r.type))
      );

      return commonDoctors.length > 0 && commonRooms.length > 0;
  }

  mergeSelectedSegments() {
      if (!this.canMergeSelected()) return;

      const indices = [...this.selectedSegmentIndices].sort((a, b) => b - a);

      const mergedServiceIds: string[] = [];
      let totalDuration = 0;

      indices.forEach(i => {
          const seg = this.bookingSegments[i];
          mergedServiceIds.push(...seg.serviceIds);
          totalDuration += seg.duration;
          this.bookingSegments.splice(i, 1);
      });

      const svcNames = this.services.filter(s => mergedServiceIds.includes(s.id)).map(s => s.name).join(' & ');

      this.bookingSegments.push({
          serviceIds: mergedServiceIds,
          date: this.formatDateInput(new Date()),
          time: '',
          doctorId: '',
          roomId: '',
          duration: totalDuration,
          label: `Bundle: ${svcNames}`
      });

      this.selectedSegmentIndices = [];
  }

  splitSegment(index: number) {
      const seg = this.bookingSegments[index];
      if (seg.serviceIds.length <= 1) return;

      const sIds = seg.serviceIds;
      this.bookingSegments.splice(index, 1);

      sIds.forEach(id => {
          const s = this.services.find(x => x.id === id);
          if (s) {
              this.bookingSegments.push({
                  serviceIds: [id],
                  date: this.formatDateInput(new Date()),
                  time: '',
                  doctorId: '',
                  roomId: '',
                  duration: s.duration,
                  label: s.name
              });
          }
      });

      this.selectedSegmentIndices = [];
  }



  getCurrentSegment(): BookingSegment {
    return this.bookingSegments[this.currentSegmentIndex];
  }

  // --- Slot Logic ---

  generateAvailableSlots() {
    this.availableSlots = [];
    const segment = this.getCurrentSegment();
    if (!segment) return;

    const segmentServices = this.services.filter(s => segment.serviceIds.includes(s.id));
    const duration = segment.duration;

    // Narrow resources based on THIS segment's requirements
    const eligibleDoctors = this.doctors.filter(d =>
        d.isActive && segmentServices.every(s => !s.allowedDoctorIds?.length || s.allowedDoctorIds.includes(d.id))
    );

    const eligibleRooms = this.rooms.filter(r =>
        r.isActive && segmentServices.every(s => !s.requiredRoomTypes?.length || s.requiredRoomTypes.includes(r.type))
    );

    const startHour = 8;
    const endHour = 20;
    const dateParts = segment.date.split('-');
    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    const dayOfWeek = date.getDay();

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotStart.getMinutes() + duration);

        if (slotEnd.getHours() >= 20 && slotEnd.getMinutes() > 0) continue;

        const availableDoctors = eligibleDoctors.filter(doc =>
            this.isDoctorAvailable(doc, slotStart, slotEnd, dayOfWeek)
        );

        const availableRooms = eligibleRooms.filter(room =>
            this.isRoomAvailable(room, slotStart, slotEnd)
        );

        if (availableDoctors.length > 0 && availableRooms.length > 0) {
            this.availableSlots.push({
                time: slotStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                date: slotStart,
                doctors: availableDoctors,
                rooms: availableRooms
            });
        }
      }
    }
  }

  updateBookingDate(dateStr: string) {
    const seg = this.getCurrentSegment();
    seg.date = dateStr;
    // Check if later segments need date update? Optional UX enhancement.
    // For now, just update current.
    this.generateAvailableSlots();
  }

  selectSlot(slot: any) {
    const seg = this.getCurrentSegment();
    seg.time = slot.time;

    this.selectedSlotDoctors = slot.doctors;
    this.selectedSlotRooms = slot.rooms;

    // Auto-select single resource
    seg.doctorId = slot.doctors.length === 1 ? slot.doctors[0].id : '';
    seg.roomId = slot.rooms.length === 1 ? slot.rooms[0].id : '';
  }

  // --- Confirmation ---

  confirmBooking() {
    if (this.bookingSegments.length === 0 || !this.bookingSegments.every(seg => seg.date && seg.time && seg.doctorId && seg.roomId)) {
      this.bookingAttemptedStep3 = true;
      this.alertService.validationError('Please complete patient info, service selection, and schedule');
      return;
    }

    const doBooking = (patientId: string) => {
      // Create Appointments — pure scheduling, no financial logic
      const appointmentCalls = this.bookingSegments.map(seg => {
        const scheduledStart = this.parseSlotTime(seg.time, seg.date);
        const scheduledEnd = new Date(scheduledStart.getTime() + seg.duration * 60000);

        const appointment: Appointment = {
          id: '',
          patientId,
          doctorId: seg.doctorId,
          roomId: seg.roomId,
          services: seg.serviceIds.map(id => {
            const svc = this.services.find(s => s.id === id);
            return {
              serviceId: id,
              pricingType: 'fixed',
              price: svc?.pricingModels[0]?.basePrice || 0
            };
          }),
          scheduledStart,
          scheduledEnd,
          status: 'scheduled',
          notes: this.booking.notes,
          createdAt: new Date()
        };
        return this.dataService.addAppointment(appointment);
      });

      forkJoin(appointmentCalls).subscribe({
        next: () => {
          this.loadData();
          this.closeBookingModal();
          this.alertService.bookingConfirmed(this.bookingSegments.length);
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          console.error('Booking failed', err);
          const errorMessage = err.error?.error || 'Booking failed. Please try again.';
          this.alertService.error(errorMessage);
        }
      });
    };

    // If new patient, create patient first then book
    if (this.booking.isNewPatient) {
      const newPatient = {
        ...this.booking.newPatient,
        dateOfBirth: this.booking.newPatient.dateOfBirth ? new Date(this.booking.newPatient.dateOfBirth) : new Date(),
        gender: this.booking.newPatient.gender || 'female' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Patient;

      this.dataService.addPatient(newPatient).subscribe({
        next: (created) => {
          this.patients.push(created);
          doBooking(created.id);
          this.cdr.markForCheck();
        },
        error: (err: any) => {} // Handled globally
      });
    } else {
      doBooking(this.booking.patientId);
    }
  }

  getServiceName(id: string): string {
      return this.services.find(s => s.id === id)?.name || 'Service';
  }

  /** Parse 12-hour locale time string (e.g. "2:30 PM") into a Date */
  private parseSlotTime(timeStr: string, dateStr: string): Date {
    const dateParts = dateStr.split('-');
    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridian = match[3].toUpperCase();
      if (meridian === 'PM' && hours !== 12) hours += 12;
      if (meridian === 'AM' && hours === 12) hours = 0;
      date.setHours(hours, minutes, 0, 0);
    }
    return date;
  }

  // --- Helpers & Boileplate ---

  isDoctorAvailable(doctor: Doctor, start: Date, end: Date, dayOfWeek: number): boolean {
    if (!doctor.workingHours) return true;
    const todaysShift = doctor.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
    if (!todaysShift) return false;

    const [shiftStartH, shiftStartM] = todaysShift.startTime.split(':').map(Number);
    const [shiftEndH, shiftEndM] = todaysShift.endTime.split(':').map(Number);

    const shiftStart = new Date(start);
    shiftStart.setHours(shiftStartH, shiftStartM, 0);
    const shiftEnd = new Date(start);
    shiftEnd.setHours(shiftEndH, shiftEndM, 0);

    if (start < shiftStart || end > shiftEnd) return false;
    return !this.hasConflicts(start, end, doctor.id, undefined);
  }

  isRoomAvailable(room: Room, start: Date, end: Date): boolean {
    return !this.hasConflicts(start, end, undefined, room.id);
  }

  hasConflicts(start: Date, end: Date, doctorId?: string, roomId?: string): boolean {
    // 1. Check existing saved appointments
    const existsInDb = this.appointments.some(apt => {
        if (apt.status === 'cancelled' || apt.status === 'no-show') return false;

        if (doctorId && apt.doctorId !== doctorId) return false;
        if (roomId && apt.roomId !== roomId) return false;

        const aptStart = new Date(apt.scheduledStart);
        let aptEnd = apt.scheduledEnd ? new Date(apt.scheduledEnd) : new Date(aptStart.getTime() + 30 * 60000);
        return (start < aptEnd && end > aptStart);
    });

    if (existsInDb) return true;

    // 2. Check current booking segments (unsaved)
    return this.bookingSegments.some((seg, idx) => {
        // Skip current segment we are scheduling
        if (idx === this.currentSegmentIndex) return false;
        // Skip incomplete segments
        if (!seg.date || !seg.time || !seg.doctorId || !seg.roomId) return false;

        if (doctorId && seg.doctorId !== doctorId) return false;
        if (roomId && seg.roomId !== roomId) return false;

        const segStart = this.parseSlotTime(seg.time, seg.date);
        const segEnd = new Date(segStart.getTime() + (seg.duration || 30) * 60000);

        return (start < segEnd && end > segStart);
    });
  }

  // Patient helpers
  searchPatients() {
    if (this.booking.patientSearch.length < 2) {
      this.filteredPatients = [];
      return;
    }
    const query = this.booking.patientSearch.toLowerCase();
    this.filteredPatients = this.patients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
      p.phone.includes(query)
    ).slice(0, 5);
  }

  selectPatient(patient: Patient) {
    this.booking.patientId = patient.id;
    this.booking.patientSearch = `${patient.firstName} ${patient.lastName}`;
    this.filteredPatients = [];
  }

  getSelectedPatient(): Patient | undefined {
    return this.patients.find(p => p.id === this.booking.patientId);
  }

  // Service helpers
  isServiceSelected(serviceId: string): boolean {
    return this.booking.allServiceIds.includes(serviceId);
  }

  toggleService(serviceId: string) {
    const index = this.booking.allServiceIds.indexOf(serviceId);
    if (index > -1) {
        this.booking.allServiceIds.splice(index, 1);
    } else {
        this.booking.allServiceIds.push(serviceId);
    }
  }

  getSelectedServices(): Service[] {
    return this.services.filter(s => this.booking.allServiceIds.includes(s.id));
  }

  getTotalDuration(): number {
    return this.getSelectedServices().reduce((sum, s) => sum + s.duration, 0);
  }

  // Data Display Helpers
  getPatientName(patientId: string): string {
    const patient = this.patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown';
  }

  getDoctorName(doctorId: string): string {
    return this.doctors.find(d => d.id === doctorId)?.name || 'Unknown';
  }

  getRoomName(roomId: string): string {
    return this.rooms.find(r => r.id === roomId)?.name || 'Unknown';
  }



  // View Helpers
  generateTimeSlots() {
     this.timeSlots = [];
     for (let hour = 8; hour <= 20; hour++) {
       for (let minute = 0; minute < 60; minute += 30) {
         const displayTime = new Date(2024, 0, 1, hour, minute).toLocaleTimeString('en-US', {
           hour: 'numeric', minute: '2-digit', hour12: true
         });
         this.timeSlots.push({ time: displayTime, hour, minute, appointments: [] });
       }
     }
  }

  get dayAppointments(): Appointment[] {
    return this.filteredAppointments.filter(apt => new Date(apt.scheduledStart).toDateString() === this.currentDate.toDateString());
  }

  getAppointmentsForSlot(slot: TimeSlot): Appointment[] {
    return this.dayAppointments.filter(apt => {
      const aptDate = new Date(apt.scheduledStart);
      return aptDate.getHours() === slot.hour && Math.floor(aptDate.getMinutes() / 30) * 30 === slot.minute;
    });
  }

  previousDay() { this.currentDate = new Date(this.currentDate.setDate(this.currentDate.getDate() - 1)); }
  nextDay() { this.currentDate = new Date(this.currentDate.setDate(this.currentDate.getDate() + 1)); }
  goToToday() { this.currentDate = new Date(); }
  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  getStatusColor(status: string): string {
    return getAppointmentStatusColor(status);
  }

  async updateStatus(apt: Appointment, status: Appointment['status']) {
    if (status === 'cancelled') {
      const confirmed = await this.alertService.confirm(
        'Cancel Appointment?',
        'Are you sure you want to cancel this appointment? This action cannot be undone.'
      );
      if (!confirmed) return;
    }
    this.dataService.updateAppointmentStatus(apt.id, status).subscribe({
      next: () => {
        this.loadData();
        // If marked as no-show, offer to reschedule
        if (status === 'no-show') {
          this.offerReschedule(apt);
        }
      },
      error: () => this.alertService.error('Failed to update appointment status. Please try again.')
    });
  }

  private async offerReschedule(apt: Appointment) {
    const patient = this.patients.find(p => p.id === apt.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'the patient';

    const confirmed = await this.alertService.confirm(
      'Reschedule Appointment?',
      `${patientName} did not show up. Would you like to schedule a new appointment?`,
      'Yes, Reschedule',
      'No, Close'
    );

    if (confirmed) {
      this.openRescheduleModal(apt);
      this.cdr.detectChanges();
    }
  }

  // --- Reschedule Modal Methods ---

  openRescheduleModal(apt: Appointment) {
    this.rescheduleAppointment = apt;
    this.rescheduleDate = new Date().toISOString().split('T')[0];
    this.rescheduleTime = '';
    this.rescheduleDoctorId = apt.doctorId;
    this.rescheduleRoomId = apt.roomId;
    this.rescheduleAvailableSlots = [];
    this.rescheduleSelectedDoctors = [];
    this.rescheduleSelectedRooms = [];
    this.showRescheduleModal = true;
    this.generateRescheduleSlots();
  }

  closeRescheduleModal() {
    this.showRescheduleModal = false;
    this.rescheduleAppointment = null;
    this.rescheduleAttempted = false;
  }

  generateRescheduleSlots() {
    if (!this.rescheduleAppointment) return;
    this.rescheduleAvailableSlots = [];

    const apt = this.rescheduleAppointment;
    const duration = apt.services?.reduce((sum, s) => {
      const svc = this.services.find(sv => sv.id === s.serviceId);
      return sum + (svc?.duration || 30);
    }, 0) || 60;

    const eligibleDoctors = this.doctors.filter(d => d.isActive);
    const eligibleRooms = this.rooms.filter(r => r.isActive);

    const startHour = 8;
    const endHour = 20;
    const dateParts = this.rescheduleDate.split('-');
    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    const dayOfWeek = date.getDay();

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotStart.getMinutes() + duration);

        if (slotEnd.getHours() >= 20 && slotEnd.getMinutes() > 0) continue;

        const availableDoctors = eligibleDoctors.filter(doc =>
          this.isDoctorAvailable(doc, slotStart, slotEnd, dayOfWeek)
        );

        const availableRooms = eligibleRooms.filter(room =>
          this.isRoomAvailable(room, slotStart, slotEnd)
        );

        if (availableDoctors.length > 0 && availableRooms.length > 0) {
          this.rescheduleAvailableSlots.push({
            time: slotStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            date: slotStart,
            doctors: availableDoctors,
            rooms: availableRooms
          });
        }
      }
    }
  }

  onRescheduleDateChange() {
    this.rescheduleTime = '';
    this.generateRescheduleSlots();
  }

  selectRescheduleSlot(slot: any) {
    this.rescheduleTime = slot.time;
    this.rescheduleSelectedDoctors = slot.doctors;
    this.rescheduleSelectedRooms = slot.rooms;

    // Auto-select if only one option
    this.rescheduleDoctorId = slot.doctors.length === 1 ? slot.doctors[0].id : (this.rescheduleDoctorId || '');
    this.rescheduleRoomId = slot.rooms.length === 1 ? slot.rooms[0].id : (this.rescheduleRoomId || '');
  }

  canConfirmReschedule(): boolean {
    return !!(this.rescheduleDate && this.rescheduleTime && this.rescheduleDoctorId && this.rescheduleRoomId);
  }

  confirmReschedule() {
    this.rescheduleAttempted = true;
    if (!this.rescheduleAppointment || !this.canConfirmReschedule()) {
      this.alertService.validationError('Please select date, time, doctor, and room');
      return;
    }

    const apt = this.rescheduleAppointment;
    const slot = this.rescheduleAvailableSlots.find(s => s.time === this.rescheduleTime);
    if (!slot) return;

    const duration = apt.services?.reduce((sum, s) => {
      const svc = this.services.find(sv => sv.id === s.serviceId);
      return sum + (svc?.duration || 30);
    }, 0) || 60;

    const scheduledStart = slot.date;
    const scheduledEnd = new Date(scheduledStart);
    scheduledEnd.setMinutes(scheduledStart.getMinutes() + duration);

    // Create a new appointment with same details
    const newAppointment: Appointment = {
      id: '',
      patientId: apt.patientId,
      doctorId: this.rescheduleDoctorId,
      roomId: this.rescheduleRoomId,
      services: apt.services,
      scheduledStart,
      scheduledEnd,
      status: 'scheduled',
      notes: apt.notes ? `(Rescheduled) ${apt.notes}` : 'Rescheduled from no-show',
      offerId: apt.offerId,
      createdAt: new Date()
    };

    this.dataService.addAppointment(newAppointment).subscribe({
      next: () => {
        this.alertService.success('Appointment Rescheduled', 'The new appointment has been created.');
        this.closeRescheduleModal();
        this.loadData();
      },
      error: () => this.alertService.error('Failed to reschedule appointment. Please try again.')
    });
  }

  getReschedulePatientName(): string {
    if (!this.rescheduleAppointment) return '';
    const patient = this.patients.find(p => p.id === this.rescheduleAppointment!.patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown';
  }

  getRescheduleServices(): string {
    if (!this.rescheduleAppointment) return '';
    return this.rescheduleAppointment.services
      .map(s => this.services.find(svc => svc.id === s.serviceId)?.name || 'Unknown')
      .join(', ');
  }
}
