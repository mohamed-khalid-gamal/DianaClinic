import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, Observable, switchMap } from 'rxjs';
import { PageHeaderComponent, ModalComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { OfferService, AppliedOffer, CartItem } from '../../services/offer.service';
import { WalletService } from '../../services/wallet.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Appointment, Patient, Service, Offer, ServiceCredit, Doctor } from '../../models';

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
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent],
  templateUrl: './billing.html',
  styleUrl: './billing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Billing implements OnInit {
  appointments: Appointment[] = [];
  patients: Patient[] = [];
  services: Service[] = [];
  doctors: Doctor[] = [];
  offers: Offer[] = [];
  invoices: any[] = [];

  activeTab: 'pending' | 'completed' = 'pending';
  showInvoiceModal = false;
  selectedAppointment: Appointment | null = null;
  selectedPatient: Patient | null = null;
  isViewingInvoice = false;
  isProcessingInvoice = false;

  // History filters
  historyDateFrom = '';
  historyDateTo = '';

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
  paymentAttempted = false;
  invoiceAttempted = false;

  // Success message
  packageGrantedMessage = '';

  constructor(
    private dataService: DataService,
    private offerService: OfferService,
    private walletService: WalletService,
    private alertService: SweetAlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    forkJoin({
      appointments: this.dataService.getAppointments(),
      patients: this.dataService.getPatients(),
      services: this.dataService.getServices(),
      doctors: this.dataService.getDoctors(),
      offers: this.dataService.getOffers(),
      invoices: this.dataService.getInvoices()
    }).subscribe({
      next: ({ appointments, patients, services, doctors, offers, invoices }) => {
        this.appointments = appointments;
        this.patients = patients;
        this.services = services;
        this.doctors = doctors;
        this.offers = offers;
        this.invoices = invoices;
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }

  getDoctorName(doctorId: string): string {
    return this.doctors.find(d => d.id === doctorId)?.name || 'Unknown';
  }

  get pendingAppointments(): Appointment[] {
    return this.appointments.filter(a => a.status === 'completed' || a.status === 'in-progress');
  }

  get historyAppointments(): Appointment[] {
    return this.appointments.filter(a => a.status === 'billed');
  }

  get filteredHistoryAppointments(): Appointment[] {
    let result = this.historyAppointments;
    if (this.historyDateFrom) {
      const from = new Date(this.historyDateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter(a => new Date(a.scheduledStart) >= from);
    }
    if (this.historyDateTo) {
      const to = new Date(this.historyDateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(a => new Date(a.scheduledStart) <= to);
    }
    return result.sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime());
  }

  onHistoryFilterChange() {
    // Reactive via getter, no explicit action needed
  }

  clearHistoryFilter() {
    this.historyDateFrom = '';
    this.historyDateTo = '';
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
  openInvoiceModal(appointment: Appointment, viewOnly = false) {
    this.selectedAppointment = appointment;
    this.selectedPatient = this.patients.find(p => p.id === appointment.patientId) || null;
    this.invoiceItems = [];
    this.payments = [];
    this.discount = 0;
    this.selectedAppliedOffer = null;
    this.availableOffers = [];
    this.availableCredits = [];
    this.packageGrantedMessage = '';
    this.paymentAttempted = false;
    this.invoiceAttempted = false;
    this.isViewingInvoice = viewOnly;

    if (viewOnly) {
      const invoice = this.invoices.find(inv => inv.appointmentId === appointment.id);
      if (!invoice) {
        this.alertService.error('Invoice not found for this appointment.');
        return;
      }

      this.invoiceItems = (invoice.items || []).map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        serviceId: item.serviceId,
        isCreditsUsed: item.total === 0 && item.unitPrice > 0
      }));

      this.payments = (invoice.payments || []).map((p: any) => ({
        type: p.method,
        amount: p.amount
      }));

      this.discount = invoice.discount || 0;
      this.showInvoiceModal = true;
      return;
    }

    // Populate from appointment services
    for (const service of appointment.services) {
      const svc = this.services.find(s => s.id === service.serviceId);
      if (svc) {
        // Check if this service was paid from credits at booking
        const isFromCredits = service.fromCredits || false;
        this.invoiceItems.push({
          description: svc.name,
          quantity: 1,
          unitPrice: service.price || svc.pricingModels[0]?.basePrice || 0,
          total: isFromCredits ? 0 : (service.price || svc.pricingModels[0]?.basePrice || 0),
          serviceId: svc.id,
          isCreditsUsed: isFromCredits
        });
      }
    }

    // Load session extra charges (overage, consumables, etc.)
    this.dataService.getSessionByAppointment(appointment.id).subscribe({
      next: session => {
        if (session && session.extraCharges) {
          for (const charge of session.extraCharges) {
            this.invoiceItems.push({
              description: charge.description,
              quantity: 1,
              unitPrice: charge.amount,
              total: charge.amount,
              serviceId: charge.serviceId,
              isCreditsUsed: false
            });
          }
        }
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });

    // Load available credits for this patient
    if (this.selectedPatient) {
      this.walletService.getAvailableCredits(this.selectedPatient.id).subscribe({
        next: credits => {
          this.availableCredits = credits;
          this.cdr.markForCheck();
        },
        error: () => {} // Handled globally
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
    this.isViewingInvoice = false;
    this.isProcessingInvoice = false;
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
    this.paymentAttempted = true;
    if (!this.newPayment.type) {
      this.alertService.validationError('Select a payment method');
      return;
    }
    if (this.newPayment.amount <= 0) {
      this.alertService.validationError('Payment amount must be greater than 0');
      return;
    }
    if (this.remainingBalance > 0 && this.newPayment.amount > this.remainingBalance) {
      this.alertService.validationError('Payment amount exceeds remaining balance');
      return;
    }

    this.payments.push({ ...this.newPayment });
    this.newPayment = { type: 'cash', amount: 0 };
    this.paymentAttempted = false;
  }

  removePayment(index: number) {
    this.payments.splice(index, 1);
  }

  payFullAmount() {
    this.newPayment.amount = this.remainingBalance;
    this.addPayment();
  }

  confirmInvoice() {
    if (this.isProcessingInvoice) return;
    this.invoiceAttempted = true;
    if (!this.selectedPatient || !this.selectedAppointment) {
      this.alertService.validationError('Select a patient and appointment before confirming');
      return;
    }
    if (this.invoiceItems.length === 0) {
      this.alertService.validationError('Invoice has no items');
      return;
    }
    if (this.discount < 0) {
      this.alertService.validationError('Discount cannot be negative');
      return;
    }
    if (this.payments.length === 0) {
      this.alertService.validationError('Add at least one payment');
      return;
    }
    if (this.totalPaid < this.grandTotal) {
      this.alertService.validationError('Remaining balance must be fully paid');
      return;
    }
    if (this.totalPaid > this.grandTotal) {
      this.alertService.validationError('Total paid cannot exceed the grand total');
      return;
    }

    // 1. Collect pre-invoice operations (credit redemptions + package grants)
    const preOps: Observable<any>[] = [];

    for (const item of this.invoiceItems) {
      if (item.isCreditsUsed && item.serviceId && this.selectedPatient) {
        preOps.push(this.walletService.redeemCredit(this.selectedPatient.id, item.serviceId));
        preOps.push(this.dataService.addPatientTransaction({
          patientId: this.selectedPatient.id,
          date: new Date(),
          type: 'credit_usage',
          description: `Used 1 credit for ${item.description}`,
          amount: 0,
          method: 'credits',
          serviceId: item.serviceId,
          relatedAppointmentId: this.selectedAppointment?.id
        }));
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
          const service = this.services.find(s => s.id === serviceId);
          if (!service) {
            this.alertService.validationError('Package service is missing or invalid.');
            return;
          }
          if (sessions <= 0) {
            this.alertService.validationError('Package sessions must be greater than 0.');
            return;
          }

          const serviceName = service.name;
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + validityDays);

          const credit: ServiceCredit = {
            serviceId: serviceId,
            serviceName: serviceName,
            remaining: sessions,
            total: sessions,
            expiresAt: expiresAt,
            packageId: offer.id,
            unitType: 'session'
          };

          preOps.push(this.walletService.addCredit(this.selectedPatient.id, credit));
          this.packageGrantedMessage = `✓ Package granted: ${sessions} sessions of ${serviceName}`;
          preOps.push(this.dataService.addPatientTransaction({
            patientId: this.selectedPatient.id,
            date: new Date(),
            type: 'credit_purchase',
            description: `Granted package: ${sessions} sessions of ${serviceName}`,
            amount: benefit.parameters.fixedPrice || 0,
            method: 'card',
            serviceId: serviceId,
            packageId: offer.id,
            relatedAppointmentId: this.selectedAppointment?.id
          }));
        }
      }
    }

    // 3. Build invoice payload
    const invoicePayload = {
      patientId: this.selectedPatient?.id ?? '',
      appointmentId: this.selectedAppointment?.id ?? '',
      sessionId: null as string | null,
      items: this.invoiceItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      })),
      subtotal: this.subtotal,
      discount: this.discountAmount,
      tax: this.taxAmount,
      total: this.grandTotal,
      status: 'paid' as const,
      createdAt: new Date(),
      payments: this.payments.map(p => ({
        id: crypto.randomUUID(),
        amount: p.amount,
        method: p.type as 'cash' | 'card' | 'wallet' | 'credits',
        timestamp: new Date()
      }))
    };

    // 4. Execute: pre-ops (sequential) → create invoice → post-ops (status + payment transactions)
    this.isProcessingInvoice = true;
    const preOps$: Observable<any> = preOps.length > 0
      ? preOps.reduce((chain, op) => chain.pipe(switchMap(() => op)), of(null) as Observable<any>)
      : of(null);

    preOps$.pipe(
      switchMap(() => this.dataService.createInvoice(invoicePayload)),
      switchMap(() => {
        const postOps: Observable<any>[] = [];

        if (this.selectedAppointment) {
          postOps.push(this.dataService.updateAppointmentStatus(this.selectedAppointment.id, 'billed'));
        }

        if (this.selectedPatient) {
          for (const payment of this.payments) {
            postOps.push(this.dataService.addPatientTransaction({
              patientId: this.selectedPatient.id,
              date: new Date(),
              type: 'payment',
              description: `Payment via ${payment.type}`,
              amount: payment.amount,
              method: payment.type,
              relatedAppointmentId: this.selectedAppointment?.id
            }));
          }
        }

        return postOps.length > 0 ? forkJoin(postOps) : of(null);
      })
    ).subscribe({
      next: () => {
        this.isProcessingInvoice = false;
        this.alertService.invoicePaid(this.totalPaid, this.packageGrantedMessage || undefined)
          .then(() => {
            this.closeInvoiceModal();
            this.loadData();
          });
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isProcessingInvoice = false;
        this.cdr.markForCheck();
      } // Handled globally
    });
  }

  // Stats
  getTodayRevenue(): number {
    const today = new Date().toDateString();
    return this.invoices
      .filter(inv => new Date(inv.createdAt).toDateString() === today)
      .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
  }
  getPendingInvoices(): number { return this.pendingAppointments.length; }
  getMonthlyRevenue(): number {
    const now = new Date();
    return this.invoices
      .filter(inv => {
        const d = new Date(inv.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
  }
}
