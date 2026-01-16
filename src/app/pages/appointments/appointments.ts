import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent, ModalComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { WalletService } from '../../services/wallet.service';
import { Appointment, Patient, Doctor, Room, Service, ServiceCredit } from '../../models';
import { OfferService } from '../../services/offer.service';
import { SweetAlertService } from '../../services/sweet-alert.service';

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
  styleUrl: './appointments.scss'
})
export class Appointments implements OnInit {
  appointments: Appointment[] = [];
  patients: Patient[] = [];
  doctors: Doctor[] = [];
  rooms: Room[] = [];
  services: Service[] = [];

  currentDate = new Date();
  viewMode: 'day' | 'week' = 'day';
  timeSlots: TimeSlot[] = [];

  showBookingModal = false;
  bookingStep = 1;

  // Refactored Booking State
  booking = {
    patientId: '',
    patientSearch: '',
    isNewPatient: false,
    newPatient: { firstName: '', lastName: '', phone: '', email: '' },
    allServiceIds: [] as string[], // Master list of selected services
    offerId: undefined as string | undefined,
    notes: '',
    // Credit usage tracking
    creditSelections: [] as { serviceId: string; unitsToUse: number; unitType: string }[]
  };

  // Patient credits
  patientCredits: ServiceCredit[] = [];

  // Scheduling Strategy
  bookingSegments: BookingSegment[] = [];
  currentSegmentIndex = 0;

  // Merge/Split Selection State
  selectedSegmentIndices: number[] = [];

  filteredPatients: Patient[] = [];
  offers: any[] = [];
  applicableOffers: any[] = [];

  // Wizard UI Helpers
  selectedSlotDoctors: Doctor[] = [];
  selectedSlotRooms: Room[] = [];
  minDate = new Date().toISOString().split('T')[0];
  availableSlots: { time: string, date: Date, doctors: Doctor[], rooms: Room[] }[] = [];

  constructor(
    private dataService: DataService,
    private walletService: WalletService,
    private offerService: OfferService,
    private alertService: SweetAlertService
  ) {}

  ngOnInit() {
    this.loadData();
    this.generateTimeSlots();
  }

  loadData() {
    this.dataService.getAppointments().subscribe(data => this.appointments = data);
    this.dataService.getPatients().subscribe(data => this.patients = data);
    this.dataService.getDoctors().subscribe(data => this.doctors = data);
    this.dataService.getRooms().subscribe(data => this.rooms = data);
    this.dataService.getServices().subscribe(data => this.services = data);
    this.dataService.getOffers().subscribe(data => this.offers = data);
  }

  // --- Wizard Navigation & Logic ---

  openBookingModal() {
    this.showBookingModal = true;
    this.bookingStep = 1;
    this.resetBooking();
  }

  closeBookingModal() {
    this.showBookingModal = false;
  }

  resetBooking() {
    this.booking = {
      patientId: '',
      patientSearch: '',
      isNewPatient: false,
      newPatient: { firstName: '', lastName: '', phone: '', email: '' },
      allServiceIds: [],
      offerId: undefined,
      notes: '',
      creditSelections: []
    };
    this.bookingSegments = [];
    this.currentSegmentIndex = 0;
    this.selectedSegmentIndices = [];
    this.filteredPatients = [];
    this.availableSlots = [];
    this.applicableOffers = [];
    this.patientCredits = [];
  }

  // Load patient credits when patient is selected
  loadPatientCredits() {
    if (!this.booking.patientId) {
      this.patientCredits = [];
      return;
    }
    this.walletService.getAvailableCredits(this.booking.patientId).subscribe(credits => {
      this.patientCredits = credits;
      // Initialize credit selections
      this.booking.creditSelections = this.patientCredits.map(c => ({
        serviceId: c.serviceId,
        unitsToUse: 0,
        unitType: c.unitType
      }));
    });
  }

  nextStep() {
    if (this.bookingStep === 1) {
      // After patient selection, load their credits
      this.loadPatientCredits();
    } else if (this.bookingStep === 2) {
      // Step 2 is now credits - auto-add services from credit selections
      this.applyCreditsToServices();
    } else if (this.bookingStep === 3) {
       // Transition 3 -> 4: Initialize Segments
       this.initializeSegmentsAsSplit();
    } else if (this.bookingStep === 4) {
       // Transition 4 -> 5: Structure confirmed.
       // Check if we have segments
       if (this.bookingSegments.length === 0) return;
       // Prepare for scheduling
       this.currentSegmentIndex = 0;
       this.generateAvailableSlots();
    } else if (this.bookingStep === 5) {
       // Transition 5 -> 6: Schedule Loop
       if (this.currentSegmentIndex < this.bookingSegments.length - 1) {
         this.currentSegmentIndex++;
         this.generateAvailableSlots();
         return; // Stay on Step 5
       } else {
         // Finished scheduling all segments
         this.checkOffers();
       }
    }

    if (this.bookingStep < 7) {
      this.bookingStep++;
    }
  }

  prevStep() {
    if (this.bookingStep === 5) {
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

  // Apply credit selections to booking services
  applyCreditsToServices() {
    // Add services from credits that have units > 0
    for (const selection of this.booking.creditSelections) {
      if (selection.unitsToUse > 0) {
        if (!this.booking.allServiceIds.includes(selection.serviceId)) {
          this.booking.allServiceIds.push(selection.serviceId);
        }
      }
    }
  }

  // Get credit for a specific service
  getCreditForService(serviceId: string): ServiceCredit | undefined {
    return this.patientCredits.find(c => c.serviceId === serviceId);
  }

  // Get credit selection for a service
  getCreditSelection(serviceId: string) {
    return this.booking.creditSelections.find(s => s.serviceId === serviceId);
  }

  // Update credit selection
  updateCreditSelection(serviceId: string, units: number) {
    const credit = this.getCreditForService(serviceId);
    const selection = this.getCreditSelection(serviceId);
    if (selection && credit) {
      // Ensure we don't exceed available credits
      selection.unitsToUse = Math.min(Math.max(0, units), credit.remaining);
    }
  }

  // Check if any credits are selected
  hasAnyCreditsSelected(): boolean {
    return this.booking.creditSelections.some(s => s.unitsToUse > 0);
  }

  canProceed(): boolean {
    switch (this.bookingStep) {
      case 1:
        return this.booking.patientId !== '' || (
          this.booking.isNewPatient &&
          this.booking.newPatient.firstName !== '' &&
          this.booking.newPatient.phone !== ''
        );
      case 2:
        // Credits step - can proceed even with no credits selected
        return true;
      case 3:
        return this.booking.allServiceIds.length > 0;
      case 4:
        return this.bookingSegments.length > 0;
      case 5:
        const seg = this.getCurrentSegment();
        return !!seg && seg.date !== '' && seg.time !== '' && seg.doctorId !== '' && seg.roomId !== '';
      case 6:
         return true;
      default:
        return true;
    }
  }

  // --- Granular Segment Logic (Step 3) ---

  initializeSegmentsAsSplit() {
      const selectedServices = this.services.filter(s => this.booking.allServiceIds.includes(s.id));
      this.bookingSegments = selectedServices.map(s => ({
          serviceIds: [s.id],
          date: this.formatDateInput(new Date()),
          time: '',
          doctorId: '',
          roomId: '',
          duration: s.duration,
          label: s.name
      }));
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
    const date = new Date(segment.date);
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

  // --- Offers & Confirmation ---

  checkOffers() {
      // Evaluate based on ALL services
      if (this.booking.allServiceIds.length === 0) return;
      const patient = this.getSelectedPatient();
      if (!patient) return;

      const cart = this.booking.allServiceIds.map(id => {
          const svc = this.services.find(s => s.id === id);
          return {
              serviceId: id,
              serviceName: svc?.name || '',
              price: svc?.pricingModels[0]?.basePrice || 0,
              quantity: 1
          };
      });

      this.applicableOffers = this.offerService.evaluateOffers(cart, patient, this.offers);
  }

  confirmBooking() {
    // First, deduct credits from wallet for credit-based services
    for (const selection of this.booking.creditSelections) {
      if (selection.unitsToUse > 0) {
        this.walletService.reserveCredits(
          this.booking.patientId,
          selection.serviceId,
          selection.unitsToUse
        );

        // Log transaction
        const service = this.services.find(s => s.id === selection.serviceId);
        this.dataService.addPatientTransaction({
          patientId: this.booking.patientId,
          date: new Date(),
          type: 'credit_usage',
          description: `Reserved ${selection.unitsToUse} ${selection.unitType}(s) for ${service?.name || 'service'}`,
          amount: 0,
          method: 'credits',
          serviceId: selection.serviceId
        });
      }
    }

    this.bookingSegments.forEach(seg => {
        const [hours, minutes] = seg.time.split(':').map(Number);
        const scheduledStart = new Date(seg.date);
        scheduledStart.setHours(hours, minutes, 0, 0);

        const scheduledEnd = new Date(scheduledStart.getTime() + seg.duration * 60000);

        const appointment: Appointment = {
            id: '',
            patientId: this.booking.patientId,
            doctorId: seg.doctorId,
            roomId: seg.roomId,
            services: seg.serviceIds.map(id => {
                const creditSelection = this.booking.creditSelections.find(c => c.serviceId === id);
                return {
                    serviceId: id,
                    pricingType: 'fixed',
                    price: 0,
                    fromCredits: creditSelection ? creditSelection.unitsToUse > 0 : false,
                    creditsUsed: creditSelection?.unitsToUse || 0
                };
            }),
            scheduledStart,
            scheduledEnd,
            status: 'scheduled',
            notes: this.booking.notes,
            createdAt: new Date()
        };
        this.dataService.addAppointment(appointment);
    });

    this.loadData();
    this.closeBookingModal();

    this.alertService.bookingConfirmed(this.bookingSegments.length);
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
    return this.appointments.some(apt => {
        if (apt.status === 'cancelled') return false;

        if (doctorId && apt.doctorId !== doctorId) return false;
        if (roomId && apt.roomId !== roomId) return false;

        const aptStart = new Date(apt.scheduledStart);
        let aptEnd = apt.scheduledEnd ? new Date(apt.scheduledEnd) : new Date(aptStart.getTime() + 30 * 60000);
        return (start < aptEnd && end > aptStart);
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
    // Load patient credits immediately
    this.loadPatientCredits();
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

  getSelectedOfferName(): string | undefined {
      if (!this.booking.offerId) return undefined;
      const applied = this.applicableOffers.find(o => o.offer.id === this.booking.offerId);
      return applied ? applied.offer.name : undefined;
  }

  toggleOffer(offerId: string) {
       this.booking.offerId = (this.booking.offerId === offerId) ? undefined : offerId;
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
    return this.appointments.filter(apt => new Date(apt.scheduledStart).toDateString() === this.currentDate.toDateString());
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
  formatDateInput(date: Date): string { return date.toISOString().split('T')[0]; }
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = { 'scheduled': '#0E7490', 'checked-in': '#F59E0B', 'in-progress': '#8B5CF6', 'completed': '#10B981', 'cancelled': '#EF4444' };
    return colors[status] || '#6B7280';
  }
  updateStatus(apt: Appointment, status: Appointment['status']) {
    this.dataService.updateAppointmentStatus(apt.id, status);
    this.loadData();
  }
}
