import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { PageHeaderComponent, ModalComponent, StatCardComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { WalletService } from '../../services/wallet.service';
import { OfferService, AppliedOffer, CartItem } from '../../services/offer.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Appointment, Patient, Doctor, Room, Service, Session, Device, InventoryItem, ServiceCredit, Offer, SessionCreditUsage, SessionExtraCharge, PricingModel } from '../../models';
import { switchMap } from 'rxjs/operators';

interface ServiceBillingState {
  serviceId: string;
  serviceName: string;
  pricingModels: PricingModel[];
  selectedModelType: 'fixed' | 'pulse' | 'area' | 'time';

  // Inputs
  pulsesUsed: number;
  timeUsed: number; // minutes
  selectedAreas: { name: string; price: number; isSelected: boolean }[];

  // Credits
  availableCredits: number;
  creditUnitType: string; // 'session', 'pulse', 'area', 'time', 'unit'

  // Calculated
  creditsToDeduct: number;
  costToPay: number;
  overageDescription?: string;
}

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
  endSessionServiceStates: ServiceBillingState[] = []; // NEW: Track complex billing state per service
  endSessionConsumables: { itemId: string; name: string; quantity: number }[] = [];
  endSessionDeviceUsage: { deviceId: string; name: string; unitsUsed: number }[] = [];
  extraCharges: { description: string; amount: number }[] = [];
  endSessionLaserSettings: { waveType: string; power: number } = { waveType: 'Alexandrite', power: 0 };
  endSessionAttempted = false;
  beforePhotos: string[] = [];
  afterPhotos: string[] = [];
  uploadingPhoto = false;

  // Financial state for End Session
  endSessionPatientCredits: ServiceCredit[] = [];
  endSessionUseCreditsForService: { [serviceId: string]: boolean } = {};
  endSessionAvailableOffers: AppliedOffer[] = [];
  endSessionSelectedOfferId: string | undefined = undefined;
  offers: Offer[] = [];
  loading = true;

  constructor(
    private dataService: DataService,
    private walletService: WalletService,
    private offerService: OfferService,
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
    this.loading = true;
    forkJoin({
      appointments: this.dataService.getAppointments(),
      patients: this.dataService.getPatients(),
      doctors: this.dataService.getDoctors(),
      rooms: this.dataService.getRooms(),
      services: this.dataService.getServices(),
      devices: this.dataService.getDevices(),
      inventory: this.dataService.getInventory(),
      offers: this.dataService.getOffers()
    }).subscribe({
      next: ({ appointments, patients, doctors, rooms, services, devices, inventory, offers }) => {
        this.appointments = appointments;
        this.patients = patients;
        this.doctors = doctors;
        this.rooms = rooms;
        this.services = services;
        this.devices = devices;
        this.inventory = inventory;
        this.offers = offers;
        this.buildActiveSessions();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
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

  getServiceNameById(serviceId: string): string {
    return this.services.find(s => s.id === serviceId)?.name || 'Unknown';
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

  // Open end session modal with resource tracking + financial logic
  openEndSessionModal(session: ActiveSession) {
    this.selectedSession = session;
    this.sessionNotes = session.notes;
    const patientId = session.patient.id;

    // Reset financial state
    this.endSessionPatientCredits = [];
    this.endSessionUseCreditsForService = {};
    this.endSessionAvailableOffers = [];
    this.endSessionSelectedOfferId = undefined;

    // Initialize credit usage tracking
    this.endSessionCredits = [];
    this.endSessionServiceStates = [];

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

    // Load patient credits from wallet and determine which services can use credits
    this.walletService.getAvailableCredits(patientId).subscribe({
      next: credits => {
        this.endSessionPatientCredits = credits;

        // Initialize ServiceBillingState for each service
        for (const apptSvc of session.appointment.services) {
          const svc = this.services.find(s => s.id === apptSvc.serviceId);
          if (!svc) continue;

          const credit = credits.find(c => c.serviceId === apptSvc.serviceId && c.remaining > 0);
          
          // Determine default model logic
          // 1. If credit exists, try to match its unitType to a pricing model BUT ONLY if service supports it
          // 2. Else default to the first pricing model
          
          let defaultModelType: 'fixed' | 'pulse' | 'area' | 'time' = svc.pricingModels[0].type;
          
          if (credit && svc.pricingModels.length > 0) {
             // Try to find a pricing model that matches the credit type
             let matchingModel = null;
             
             if (credit.unitType === 'pulse') matchingModel = svc.pricingModels.find(m => m.type === 'pulse');
             else if (credit.unitType === 'area') matchingModel = svc.pricingModels.find(m => m.type === 'area');
             else if (credit.unitType === 'time') matchingModel = svc.pricingModels.find(m => m.type === 'time');
             
             // If we found a model that matches the credit, use it
             if (matchingModel) {
               defaultModelType = matchingModel.type;
             }
             // Otherwise keep the default (first model), effectively ignoring the credit if it doesn't apply
          }

          // Initialize areas if applicable
          const areas = svc.pricingModels.find(m => m.type === 'area')?.areas?.map(a => ({
            name: a.name,
            price: a.price,
            isSelected: false
          })) || [];

          const newState: ServiceBillingState = {
            serviceId: svc.id,
            serviceName: svc.name,
            pricingModels: svc.pricingModels || [],
            selectedModelType: defaultModelType,
            pulsesUsed: 0,
            timeUsed: 0,
            selectedAreas: areas,
            availableCredits: 0,
            creditUnitType: 'unit',
            creditsToDeduct: 0,
            costToPay: 0
          };

          // Update credits based on default model
          this.updateCreditsForMode(newState);

          // Initial Calculation
          this.calculateBilling(newState);
          this.endSessionServiceStates.push(newState);
        }

        // Evaluate applicable offers
        this.evaluateEndSessionOffers();
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });

    this.showEndSessionModal = true;
  }

  // Handle change in billing mode (dropdown)
  onBillingModeChange(state: ServiceBillingState) {
    // Reset inputs when mode changes
    state.pulsesUsed = 0;
    state.timeUsed = 0;
    state.selectedAreas.forEach(a => a.isSelected = false);
    
    // Update available credits for the new mode
    this.updateCreditsForMode(state);
    
    this.calculateBilling(state);
  }

  // Update available credits based on selected model type
  updateCreditsForMode(state: ServiceBillingState) {
    // Find credit that matches the selected model type
    // mapping: fixed -> session, pulse -> pulse, area -> area, time -> time
    // unit -> matches any (generic)
    
    const targetType = state.selectedModelType === 'fixed' ? 'session' : state.selectedModelType;
    
    const credit = this.endSessionPatientCredits.find(c => 
      c.serviceId === state.serviceId && 
      c.remaining > 0 && 
      (c.unitType === targetType || c.unitType === 'unit')
    );

    state.availableCredits = credit ? credit.remaining : 0;
    state.creditUnitType = credit ? credit.unitType : 'unit';
  }

  // Toggle area selection for Area-based pricing
  toggleAreaSelection(state: ServiceBillingState, areaName: string) {
    const area = state.selectedAreas.find(a => a.name === areaName);
    if (area) {
      area.isSelected = !area.isSelected;
      this.calculateBilling(state);
    }
  }

  // Main calculation logic for billing state
  calculateBilling(state: ServiceBillingState) {
    const model = state.pricingModels.find(m => m.type === state.selectedModelType);
    if (!model) return;

    state.creditsToDeduct = 0;
    state.costToPay = 0;
    state.overageDescription = undefined;

    // Check if user has relevant credits for this mode
    // We assume credit unitType loosely matches or is 'unit'/'session'
    // If Mode is Pulse, we need Pulse credits (or generic credits used as pulses?)
    // Implementation assumption: availableCredits applies to the selected mode 
    // IF the credit unit type matches OR is 'unit'/'session' (generic).
    // Stricter check: 
    // - Pulse Mode needs 'pulse' credits
    // - Area Mode needs 'area' or 'unit' credits
    // - Time Mode needs 'time' or 'unit' credits
    // - Fixed Mode needs 'session' or 'unit' credits

    const hasMatchingCredits = state.availableCredits > 0; 
    // We can refine matching logic here if needed, but for now assuming displayed availableCredits are applicable.

    if (state.selectedModelType === 'pulse') {
      const pricePerPulse = model.pricePerUnit || 0;
      if (state.pulsesUsed > 0) {
        if (state.availableCredits >= state.pulsesUsed) {
          // Fully covered
          state.creditsToDeduct = state.pulsesUsed;
          state.costToPay = 0;
        } else {
          // Partial coverage
          state.creditsToDeduct = state.availableCredits;
          const overage = state.pulsesUsed - state.availableCredits;
          state.costToPay = overage * pricePerPulse;
          state.overageDescription = `Extra ${overage} pulses`;
        }
      }
    } else if (state.selectedModelType === 'area') {
      const selectedCount = state.selectedAreas.filter(a => a.isSelected).length;
      if (selectedCount > 0) {
        // Assumption: 1 Credit = 1 Area
        if (state.availableCredits >= selectedCount) {
          state.creditsToDeduct = selectedCount;
          state.costToPay = 0;
        } else {
          state.creditsToDeduct = state.availableCredits;
          const areasToPay = selectedCount - state.availableCredits;
          
          // Which areas to pay for? The most expensive ones or just average?
          // Strategy: Pay for the remaining ones. We iterate and mark checked ones as paid until credits run out?
          // Or just sum price of *last* N areas?
          // Let's assume we pay for the ones *not covered*.
          // Simplistic approach: Sum price of all selected, subtract (credits * avg price)? No.
          // Better: We identify exactly which areas are covered?
          // User requirement: "take what he have and the remaning pay as normal"
          
          // Let's calculate total price of selected areas
          // Then subtract value of credits? 
          // If 1 Credit = 1 Area, effectively we create a discount equal to the price of the covered areas.
          // To favor the patient, we cover the MOST EXPENSIVE areas with credits first.
          
          const selected = state.selectedAreas.filter(a => a.isSelected).sort((a, b) => b.price - a.price);
          
          // First N covered by credits
          let covered = 0;
          let toPay = 0;
          
          selected.forEach((area, index) => {
            if (index < state.availableCredits) {
              covered++;
            } else {
              toPay += area.price;
            }
          });
          
          state.costToPay = toPay;
          state.overageDescription = `Pay for ${selectedCount - covered} areas`;
        }
      }
    } else if (state.selectedModelType === 'time') {
       const pricePerMin = model.pricePerUnit || 0;
       if (state.timeUsed > 0) {
         if (state.availableCredits >= state.timeUsed) {
           state.creditsToDeduct = state.timeUsed;
           state.costToPay = 0;
         } else {
           state.creditsToDeduct = state.availableCredits;
           const overage = state.timeUsed - state.availableCredits;
           state.costToPay = overage * pricePerMin;
           state.overageDescription = `Extra ${overage} mins`;
         }
       }
    } else {
      // Fixed / Session based
      const price = model.basePrice;
      // 1 Session = 1 Credit
      if (state.availableCredits >= 1) {
        state.creditsToDeduct = 1;
        state.costToPay = 0;
      } else {
        state.creditsToDeduct = 0;
        state.costToPay = 0;
        state.overageDescription = undefined;
      }
    }
  }

  getTotalPayable(): number {
    return this.endSessionServiceStates.reduce((sum, s) => sum + s.costToPay, 0) + 
           this.extraCharges.reduce((sum, c) => sum + c.amount, 0);
  }

  // Evaluate offers based on the session's services
  evaluateEndSessionOffers() {
    if (!this.selectedSession) return;
    const patient = this.selectedSession.patient;

    const cart: CartItem[] = this.selectedSession.appointment.services.map(apptSvc => {
      const svc = this.services.find(s => s.id === apptSvc.serviceId);
      return {
        serviceId: apptSvc.serviceId,
        serviceName: svc?.name || '',
        price: apptSvc.price || svc?.pricingModels[0]?.basePrice || 0,
        quantity: 1
      };
    });

    this.endSessionAvailableOffers = this.offerService.evaluateOffers(cart, patient, this.offers);
  }

  // Toggle credit usage for a specific service
  toggleEndSessionCreditUsage(serviceId: string) {
    this.endSessionUseCreditsForService[serviceId] = !this.endSessionUseCreditsForService[serviceId];

    // Update the endSessionCredits tracking array
    if (this.endSessionUseCreditsForService[serviceId]) {
      // Add to tracking if not already there
      if (!this.endSessionCredits.find(c => c.serviceId === serviceId)) {
        const credit = this.endSessionPatientCredits.find(c => c.serviceId === serviceId);
        const svc = this.services.find(s => s.id === serviceId);
        if (credit) {
          this.endSessionCredits.push({
            serviceId,
            serviceName: svc?.name || 'Unknown',
            allocated: 1,
            actual: 1,
            unitType: credit.unitType
          });
        }
      }
    } else {
      // Remove from tracking
      this.endSessionCredits = this.endSessionCredits.filter(c => c.serviceId !== serviceId);
    }
  }

  // Get credit info for a specific service
  getEndSessionCreditInfo(serviceId: string): ServiceCredit | undefined {
    return this.endSessionPatientCredits.find(c => c.serviceId === serviceId && c.remaining > 0);
  }

  // Get selected offer details
  getSelectedEndSessionOffer(): AppliedOffer | undefined {
    if (!this.endSessionSelectedOfferId) return undefined;
    return this.endSessionAvailableOffers.find(o => o.offer.id === this.endSessionSelectedOfferId);
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
    // Reset financial state
    this.endSessionPatientCredits = [];
    this.endSessionUseCreditsForService = {};
    this.endSessionAvailableOffers = [];
    this.endSessionSelectedOfferId = undefined;
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
      const photoUrl = data.url.startsWith('http') ? data.url : `${environment.imageBaseUrl}${data.url.replace('/uploads', '')}`;

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

    // Validation
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

    // New Validation for Billing inputs
    if (this.endSessionServiceStates.some(s => s.selectedModelType === 'pulse' && s.pulsesUsed < 0)) {
      this.alertService.validationError('Pulses used cannot be negative');
      return;
    }
    if (this.endSessionServiceStates.some(s => s.selectedModelType === 'time' && s.timeUsed < 0)) {
      this.alertService.validationError('Time used cannot be negative');
      return;
    }

    const session = this.selectedSession;
    const patientId = session.patient.id;
    session.notes = this.sessionNotes;

    // Collect all side-effect observables
    // 1. Calculate Extra Charges and Credits Used
    const allExtraCharges: SessionExtraCharge[] = [...this.extraCharges];
    const creditsUsedPayload: any[] = [];

    for (const state of this.endSessionServiceStates) {
      // Credits to deduct
      if (state.creditsToDeduct > 0) {
        creditsUsedPayload.push({
          serviceId: state.serviceId,
          serviceName: state.serviceName,
          unitsUsed: state.creditsToDeduct,
          unitType: state.creditUnitType
        });
      }

      // Extra charges (Overage/Payment)
      if (state.costToPay > 0) {
        allExtraCharges.push({
          description: state.overageDescription || `Payment for ${state.serviceName}`,
          amount: state.costToPay,
          serviceId: state.serviceId
        });
      }
    }

    // Construct Payload for Atomic Backend Transaction
    const payload = {
      appointmentId: session.appointment.id,
      patientId: patientId,
      doctorId: session.doctor.id,
      startTime: session.startTime,
      endTime: new Date(),
      notes: this.sessionNotes,
      consumablesUsed: this.endSessionConsumables.map(c => ({
        inventoryItemId: c.itemId,
        quantity: c.quantity
      })),
      creditsUsed: creditsUsedPayload,
      extraCharges: allExtraCharges.map(c => ({
          serviceId: c.serviceId,
          description: c.description,
          amount: c.amount
      })),
      deviceUsage: this.endSessionDeviceUsage.map(u => ({
          deviceId: u.deviceId,
          name: u.name,
          unitsUsed: u.unitsUsed
      })),
      laserSettings: this.isLaserSession() ? {
        waveType: this.endSessionLaserSettings.waveType as 'Alexandrite' | 'Nd:YAG',
        power: this.endSessionLaserSettings.power
      } : null,
      beforePhotos: this.beforePhotos,
      afterPhotos: this.afterPhotos
    };

    // Call Atomic Endpoint
    this.dataService.completeSession(payload).subscribe({
      next: (completedSession) => {
        session.appointment.status = 'completed';
        this.activeSessions = this.activeSessions.filter(s => s.appointment.id !== session.appointment.id);

        const patientName = `${session.patient.firstName} ${session.patient.lastName}`;
        this.closeEndSessionModal();
        this.alertService.sessionEnded(patientName);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Session completion failed', err);
        this.alertService.error('Failed to complete session. Please try again.');
      }
    });
  }
}
