import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent, ModalComponent, StatCardComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { OfferService, AppliedOffer, CartItem } from '../../services/offer.service';
import { WalletService } from '../../services/wallet.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Appointment, Patient, Service, Offer, ServiceCredit } from '../../models';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  serviceId?: string;
  isCreditsUsed?: boolean; // Track if paying with credits
}

interface PaymentMethod {
  type: 'cash' | 'card' | 'wallet' | 'credits';
  amount: number;
  serviceId?: string; // For credits, track which service
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent, StatCardComponent],
  templateUrl: './billing.html',
  styleUrl: './billing.scss'
})
export class Billing implements OnInit {
  appointments: Appointment[] = [];
  patients: Patient[] = [];
  services: Service[] = [];
  offers: Offer[] = [];
  
  activeTab: 'pending' | 'completed' = 'pending';
  showInvoiceModal = false;
  selectedAppointment: Appointment | null = null;
  selectedPatient: Patient | null = null;

  // Invoice Builder
  invoiceItems: InvoiceItem[] = [];
  
  // Offers
  availableOffers: AppliedOffer[] = [];
  selectedAppliedOffer: AppliedOffer | null = null;
  
  // Available Credits
  availableCredits: ServiceCredit[] = [];
  
  discount = 0;
  taxRate = 14; 
  
  // Payment
  payments: PaymentMethod[] = [];
  newPayment: PaymentMethod = { type: 'cash', amount: 0 };

  // Success message
  packageGrantedMessage = '';

  constructor(
    private dataService: DataService,
    private offerService: OfferService,
    private walletService: WalletService,
    private alertService: SweetAlertService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dataService.getAppointments().subscribe(apt => this.appointments = apt);
    this.dataService.getPatients().subscribe(p => this.patients = p);
    this.dataService.getServices().subscribe(s => this.services = s);
    this.dataService.getDoctors().subscribe(d => this.doctors = d); // Load doctors
    this.dataService.getOffers().subscribe(o => this.offers = o);
  }
  
  doctors: import('../../models').Doctor[] = []; // Explicit type if needed or rely on inference

  getDoctorName(doctorId: string): string {
    return this.doctors.find(d => d.id === doctorId)?.name || 'Unknown';
  }

  get pendingAppointments(): Appointment[] {
    return this.appointments.filter(a => a.status === 'completed' || a.status === 'in-progress');
  }

  get historyAppointments(): Appointment[] {
    return this.appointments.filter(a => a.status === 'billed');
  }

  getPatientName(patientId: string): string {
    const patient = this.patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown';
  }

  getServiceName(serviceId: string): string {
    return this.services.find(s => s.id === serviceId)?.name || 'Unknown';
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  // Invoice Modal
  openInvoiceModal(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.selectedPatient = this.patients.find(p => p.id === appointment.patientId) || null;
    this.invoiceItems = [];
    this.payments = [];
    this.discount = 0;
    this.selectedAppliedOffer = null;
    this.availableOffers = [];
    this.availableCredits = [];
    this.packageGrantedMessage = '';
    
    // Populate from appointment services
    for (const service of appointment.services) {
      const svc = this.services.find(s => s.id === service.serviceId);
      if (svc) {
        this.invoiceItems.push({
          description: svc.name,
          quantity: 1,
          unitPrice: service.price || svc.pricingModels[0]?.basePrice || 0,
          total: service.price || svc.pricingModels[0]?.basePrice || 0,
          serviceId: svc.id,
          isCreditsUsed: false
        });
      }
    }
    
    // Load available credits for this patient
    if (this.selectedPatient) {
      this.walletService.getAvailableCredits(this.selectedPatient.id).subscribe(credits => {
        this.availableCredits = credits;
      });
    }
    
    this.recalculateOffers();
    this.showInvoiceModal = true;
  }

  closeInvoiceModal() {
    this.showInvoiceModal = false;
    this.selectedAppointment = null;
    this.selectedPatient = null;
    this.packageGrantedMessage = '';
  }

  // Offer Calculation
  recalculateOffers() {
    if (!this.selectedPatient) return;

    const cart: CartItem[] = this.invoiceItems.map(item => ({
      serviceId: item.serviceId || '',
      serviceName: item.description,
      price: item.unitPrice,
      quantity: item.quantity
    }));

    this.availableOffers = this.offerService.evaluateOffers(cart, this.selectedPatient, this.offers);

    if (this.availableOffers.length > 0 && !this.selectedAppliedOffer) {
       this.selectedAppliedOffer = this.availableOffers[0];
    }
  }

  get subtotal(): number {
    return this.invoiceItems
      .filter(item => !item.isCreditsUsed)
      .reduce((sum, item) => sum + item.total, 0);
  }

  get discountAmount(): number {
    return (this.selectedAppliedOffer?.discountAmount || 0) + this.discount;
  }

  get taxAmount(): number {
    return (this.subtotal - this.discountAmount) * (this.taxRate / 100);
  }

  get grandTotal(): number {
    return this.subtotal - this.discountAmount + this.taxAmount;
  }

  get totalPaid(): number {
    return this.payments.reduce((sum, p) => sum + p.amount, 0);
  }

  get remainingBalance(): number {
    return this.grandTotal - this.totalPaid;
  }

  applyOffer(appliedOffer: AppliedOffer) {
    this.selectedAppliedOffer = appliedOffer;
  }

  clearOffer() {
    this.selectedAppliedOffer = null;
  }

  // Credit Usage
  hasCreditsForService(serviceId: string): boolean {
    return this.availableCredits.some(c => c.serviceId === serviceId && c.remaining > 0);
  }

  getCreditsCountForService(serviceId: string): number {
    const credit = this.availableCredits.find(c => c.serviceId === serviceId && c.remaining > 0);
    return credit ? credit.remaining : 0;
  }

  useCredit(item: InvoiceItem) {
    if (item.serviceId && this.hasCreditsForService(item.serviceId)) {
      item.isCreditsUsed = true;
      item.total = 0; // Zero out the price
    }
  }

  removeCredit(item: InvoiceItem) {
    item.isCreditsUsed = false;
    item.total = item.unitPrice * item.quantity;
  }

  addPayment() {
    if (this.newPayment.amount > 0) {
      this.payments.push({ ...this.newPayment });
      this.newPayment = { type: 'cash', amount: 0 };
    }
  }

  removePayment(index: number) {
    this.payments.splice(index, 1);
  }

  payFullAmount() {
    this.newPayment.amount = this.remainingBalance;
    this.addPayment();
  }

  confirmInvoice() {
    // 1. Handle credit redemption
    for (const item of this.invoiceItems) {
      if (item.isCreditsUsed && item.serviceId && this.selectedPatient) {
        this.walletService.redeemCredit(this.selectedPatient.id, item.serviceId);
      }
    }

    // 2. Handle package grants from offers
    if (this.selectedAppliedOffer && this.selectedPatient) {
      const offer = this.selectedAppliedOffer.offer;
      const benefit = offer.benefits[0];
      
      if (benefit && benefit.type === 'grant_package') {
        const serviceId = benefit.parameters.packageServiceId;
        const sessions = benefit.parameters.packageSessions || 1;
        const validityDays = benefit.parameters.packageValidityDays || 365;
        
        if (serviceId) {
          const serviceName = this.getServiceName(serviceId);
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + validityDays);
          
          const credit: ServiceCredit = {
            serviceId: serviceId,
            serviceName: serviceName,
            remaining: sessions,
            total: sessions,
            expiresAt: expiresAt,
            packageId: offer.id
          };
          
          this.walletService.addCredit(this.selectedPatient.id, credit);
          this.packageGrantedMessage = `✓ Package granted: ${sessions} sessions of ${serviceName}`;
        }
      }
    }

    console.log('Invoice Confirmed', {
      items: this.invoiceItems,
      appliedOffer: this.selectedAppliedOffer,
      total: this.grandTotal,
      payments: this.payments
    });

    if (this.selectedAppointment) {
      this.dataService.updateAppointmentStatus(this.selectedAppointment.id, 'billed');
    }

    this.alertService.invoicePaid(this.totalPaid, this.packageGrantedMessage || undefined)
      .then(() => {
        this.closeInvoiceModal();
        this.loadData();
      });
  }

  // Stats
  getTodayRevenue(): number { return 15000; }
  getPendingInvoices(): number { return this.pendingAppointments.length; }
  getMonthlyRevenue(): number { return 450000; }
}
