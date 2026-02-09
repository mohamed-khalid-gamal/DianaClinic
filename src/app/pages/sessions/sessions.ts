import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { PageHeaderComponent, ModalComponent, StatCardComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { WalletService } from '../../services/wallet.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Appointment, Patient, Doctor, Room, Service, Session, Device, InventoryItem, SessionCreditUsage, SessionExtraCharge } from '../../models';
import { take, switchMap } from 'rxjs/operators';

interface ActiveSession {
  appointment: Appointment;
  patient: Patient;
  doctor: Doctor;
  room: Room;
  services: Service[];
  startTime: Date;
  elapsedMinutes: number;
  consumablesUsed: { itemId: string; name: string; quantity: number }[];
  creditsUsed: SessionCreditUsage[];
  deviceUsage: { deviceId: string; name: string; unitsUsed: number }[];
  notes: string;
}

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent, ModalComponent, StatCardComponent],
  templateUrl: './sessions.html',
  styleUrl: './sessions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Sessions implements OnInit, OnDestroy {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  appointments: Appointment[] = [];
  patients: Patient[] = [];
  doctors: Doctor[] = [];
  rooms: Room[] = [];
  services: Service[] = [];
  devices: Device[] = [];
  inventory: InventoryItem[] = [];

  activeSessions: ActiveSession[] = [];

  showSessionModal = false;
  selectedSession: ActiveSession | null = null;
  sessionNotes = '';

  // Resource tracking for session end
  showEndSessionModal = false;
  endSessionCredits: { serviceId: string; serviceName: string; allocated: number; actual: number; unitType: string }[] = [];
  endSessionConsumables: { itemId: string; name: string; quantity: number }[] = [];
  endSessionDeviceUsage: { deviceId: string; name: string; unitsUsed: number }[] = [];
  extraCharges: { description: string; amount: number }[] = [];
  endSessionLaserSettings: { waveType: string; power: number } = { waveType: 'Alexandrite', power: 0 };
  endSessionAttempted = false;
  beforePhotos: string[] = [];
  afterPhotos: string[] = [];
  uploadingPhoto = false;

  constructor(
    private dataService: DataService,
    private walletService: WalletService,
    private alertService: SweetAlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
    // Update elapsed time every minute
    this.intervalId = setInterval(() => this.updateElapsedTimes(), 60000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  loadData() {
    forkJoin({
      appointments: this.dataService.getAppointments(),
      patients: this.dataService.getPatients(),
      doctors: this.dataService.getDoctors(),
      rooms: this.dataService.getRooms(),
      services: this.dataService.getServices(),
      devices: this.dataService.getDevices(),
      inventory: this.dataService.getInventory()
    }).subscribe({
      next: ({ appointments, patients, doctors, rooms, services, devices, inventory }) => {
        this.appointments = appointments;
        this.patients = patients;
        this.doctors = doctors;
        this.rooms = rooms;
        this.services = services;
        this.devices = devices;
        this.inventory = inventory;
        this.buildActiveSessions();
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
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
      creditsUsed: [],
      deviceUsage: [],
      notes: ''
    }));
  }

  updateElapsedTimes() {
    this.activeSessions.forEach(session => {
      session.elapsedMinutes = Math.round((Date.now() - session.startTime.getTime()) / 60000);
    });
    this.cdr.markForCheck();
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
    this.dataService.updateAppointmentStatus(apt.id, 'in-progress').subscribe({
      next: () => {
        apt.status = 'in-progress';
        this.buildActiveSessions();
        this.alertService.sessionStarted(patientName);
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
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

  // Save notes and open end session modal for resource tracking
  saveNotesAndEndSession(session: ActiveSession) {
    session.notes = this.sessionNotes;
    this.closeSessionModal();
    this.openEndSessionModal(session);
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
      this.openEndSessionModal(session);
    }
    this.cdr.markForCheck();
  }

  // Open end session modal with resource tracking
  openEndSessionModal(session: ActiveSession) {
    this.selectedSession = session;
    this.sessionNotes = session.notes;
    const patientId = session.patient.id;

    // Initialize credit usage tracking
    this.endSessionCredits = session.appointment.services
      .filter(s => s.fromCredits)
      .map(s => {
        const service = this.services.find(svc => svc.id === s.serviceId);
        return {
          serviceId: s.serviceId,
          serviceName: service?.name || 'Unknown',
          allocated: s.creditsUsed || 0,
          actual: s.creditsUsed || 0, // Start with allocated
          unitType: 'unit' // Will be determined from wallet
        };
      });

    // Initialize device usage
    this.endSessionDeviceUsage = [];
    const room = session.room;
    if (room) {
      const roomDevices = this.devices.filter(d => d.roomId === room.id);
      this.endSessionDeviceUsage = roomDevices.map(d => ({
        deviceId: d.id,
        name: d.name,
        unitsUsed: 0
      }));
    }

    // Initialize consumables list
    this.endSessionConsumables = [];

    // Reset extra charges
    this.extraCharges = [];

    // Resolve unit types from wallet credits
    this.walletService.getWallet(patientId).pipe(take(1)).subscribe({
      next: wallet => {
        this.endSessionCredits = this.endSessionCredits.map(credit => {
          const walletCredit = wallet.credits.find(c => c.serviceId === credit.serviceId);
          return {
            ...credit,
            unitType: walletCredit?.unitType || credit.unitType || 'unit'
          };
        });
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });

    this.showEndSessionModal = true;
  }

  closeEndSessionModal() {
    this.showEndSessionModal = false;
    this.selectedSession = null;
    this.endSessionCredits = [];
    this.endSessionConsumables = [];
    this.endSessionDeviceUsage = [];
    this.extraCharges = [];
    this.endSessionLaserSettings = { waveType: 'Alexandrite', power: 0 };
    this.sessionNotes = '';
    this.endSessionAttempted = false;
    this.beforePhotos = [];
    this.afterPhotos = [];
  }

  hasInvalidCreditsUsage(): boolean {
    return this.endSessionCredits.some(c => !Number.isFinite(c.actual) || c.actual < 0);
  }

  hasInvalidDeviceUsage(): boolean {
    return this.endSessionDeviceUsage.some(u => !Number.isFinite(u.unitsUsed) || u.unitsUsed < 0);
  }

  hasInvalidConsumables(): boolean {
    return this.endSessionConsumables.some(c => !Number.isFinite(c.quantity) || c.quantity < 1);
  }

  hasInvalidExtraCharges(): boolean {
    return this.extraCharges.some(c => !Number.isFinite(c.amount) || c.amount < 0 || (!c.description || !c.description.trim()));
  }

  hasInvalidLaserSettings(): boolean {
    if (!this.isLaserSession()) return false;
    return !Number.isFinite(this.endSessionLaserSettings.power) || this.endSessionLaserSettings.power <= 0;
  }

  // Add consumable to session
  addConsumable(itemId: string) {
    const item = this.inventory.find(i => i.id === itemId);
    if (item && !this.endSessionConsumables.find(c => c.itemId === itemId)) {
      this.endSessionConsumables.push({
        itemId: item.id,
        name: item.name,
        quantity: 1
      });
    }
  }

  removeConsumable(index: number) {
    this.endSessionConsumables.splice(index, 1);
  }

  // Add extra charge for overage
  addExtraCharge() {
    this.extraCharges.push({ description: '', amount: 0 });
  }

  removeExtraCharge(index: number) {
    this.extraCharges.splice(index, 1);
  }

  // Calculate overage (used more than allocated credits)
  getCreditsOverage(): { serviceId: string; serviceName: string; overage: number }[] {
    return this.endSessionCredits
      .filter(c => c.actual > c.allocated)
      .map(c => ({
        serviceId: c.serviceId,
        serviceName: c.serviceName,
        overage: c.actual - c.allocated
      }));
  }

  // Check if current session involves a laser service
  isLaserSession(): boolean {
    if (!this.selectedSession) return false;
    // Check if any service in the session requires a laser device
    return this.selectedSession.services.some(svc => {
      const device = this.devices.find(d => svc.requiredDevices?.includes(d.id));
      return device?.counterType === 'pulse'; // Laser devices typically use pulse counters
    });
  }

  // Upload photo file
  async uploadPhoto(event: Event, photoType: 'before' | 'after') {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.alertService.validationError('Please select a valid image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      this.alertService.validationError('Image size must be less than 10MB');
      return;
    }

    this.uploadingPhoto = true;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const photoUrl = data.url.startsWith('http') ? data.url : `/api${data.url}`;

      if (photoType === 'before') {
        this.beforePhotos.push(photoUrl);
      } else {
        this.afterPhotos.push(photoUrl);
      }

      this.alertService.success('Photo uploaded successfully');
    } catch (error) {
    } finally {
      this.uploadingPhoto = false;
      input.value = ''; // Reset input
      this.cdr.markForCheck();
    }
  }

  // Remove photo
  removePhoto(photoType: 'before' | 'after', index: number) {
    if (photoType === 'before') {
      this.beforePhotos.splice(index, 1);
    } else {
      this.afterPhotos.splice(index, 1);
    }
  }

  // Confirm end session with resource tracking
  confirmEndSession() {
    if (!this.selectedSession) return;

    this.endSessionAttempted = true;

    if (this.hasInvalidCreditsUsage()) {
      this.alertService.validationError('Credits used must be 0 or more');
      return;
    }

    if (this.hasInvalidDeviceUsage()) {
      this.alertService.validationError('Device usage must be 0 or more');
      return;
    }

    if (this.hasInvalidConsumables()) {
      this.alertService.validationError('Consumable quantities must be at least 1');
      return;
    }

    if (this.hasInvalidExtraCharges()) {
      this.alertService.validationError('Extra charges require a description and non-negative amount');
      return;
    }

    if (this.hasInvalidLaserSettings()) {
      this.alertService.validationError('Laser power must be greater than 0');
      return;
    }

    const session = this.selectedSession;
    const patientId = session.patient.id;
    session.notes = this.sessionNotes;

    // Collect all side-effect observables
    const sideEffects: Observable<any>[] = [];

    // 1. Adjust credits based on actual usage
    for (const credit of this.endSessionCredits) {
      const diff = credit.allocated - credit.actual;
      if (diff !== 0) {
        sideEffects.push(this.walletService.adjustCredits(patientId, credit.serviceId, diff));
      }
    }

    // 2. Update device counters
    for (const usage of this.endSessionDeviceUsage) {
      if (usage.unitsUsed > 0) {
        const device = this.devices.find(d => d.id === usage.deviceId);
        if (device) {
          sideEffects.push(this.dataService.updateDeviceCounter(device.id, device.currentCounter + usage.unitsUsed));
        }
      }
    }

    // 3. Deduct inventory
    for (const consumable of this.endSessionConsumables) {
      sideEffects.push(this.dataService.updateInventoryQuantity(consumable.itemId, -consumable.quantity));
    }

    // 4. Log credit usage transactions
    for (const credit of this.endSessionCredits) {
      if (credit.actual > 0) {
        sideEffects.push(this.dataService.addPatientTransaction({
          patientId: patientId,
          date: new Date(),
          type: 'credit_usage',
          description: `Used ${credit.actual} ${credit.unitType}(s) for ${credit.serviceName}`,
          amount: 0,
          method: 'credits',
          serviceId: credit.serviceId,
          relatedAppointmentId: session.appointment.id
        }));
      }
    }

    // 5. Record overage charges for billing
    const overages = this.getCreditsOverage();
    const allExtraCharges: SessionExtraCharge[] = [...this.extraCharges];
    for (const overage of overages) {
      const service = this.services.find(s => s.id === overage.serviceId);
      const pricePerUnit = service?.pricingModels[0]?.pricePerUnit || 0;
      if (pricePerUnit > 0) {
        allExtraCharges.push({
          description: `Extra ${overage.overage} units of ${overage.serviceName}`,
          amount: overage.overage * pricePerUnit,
          serviceId: overage.serviceId
        });
      }
    }

    // 6. Create session record with all tracking data
    const creditsUsed: SessionCreditUsage[] = this.endSessionCredits
      .filter(c => c.actual > 0)
      .map(c => ({
        serviceId: c.serviceId,
        serviceName: c.serviceName,
        unitsUsed: c.actual,
        unitType: c.unitType as 'session' | 'pulse' | 'unit'
      }));

    // Wait for all side effects, then create session and update appointment
    const sideEffects$: Observable<any> = sideEffects.length > 0 ? forkJoin(sideEffects) : of(null);

    sideEffects$.pipe(
      switchMap(() => this.dataService.addSession({
        appointmentId: session.appointment.id,
        patientId: patientId,
        doctorId: session.doctor.id,
        startTime: session.startTime,
        endTime: new Date(),
        consumablesUsed: this.endSessionConsumables.map(c => ({
          inventoryItemId: c.itemId,
          quantity: c.quantity
        })),
        creditsUsed: creditsUsed,
        extraCharges: allExtraCharges,
        laserSettings: this.isLaserSession() ? {
          waveType: this.endSessionLaserSettings.waveType as 'Alexandrite' | 'Nd:YAG',
          power: this.endSessionLaserSettings.power
        } : undefined,
        clinicalNotes: this.sessionNotes,
        beforePhotos: this.beforePhotos,
        afterPhotos: this.afterPhotos,
        status: 'completed'
      } as any)),
      switchMap(() => this.dataService.updateAppointmentStatus(session.appointment.id, 'completed'))
    ).subscribe({
      next: () => {
        session.appointment.status = 'completed';
        this.activeSessions = this.activeSessions.filter(s => s.appointment.id !== session.appointment.id);

        const patientName = `${session.patient.firstName} ${session.patient.lastName}`;
        this.closeEndSessionModal();
        this.alertService.sessionEnded(patientName);
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }
}
