import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, Observable, switchMap } from 'rxjs';
import { PageHeaderComponent, ModalComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { OfferService, AppliedOffer, CartItem } from '../../services/offer.service';
import { WalletService } from '../../services/wallet.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Appointment, Patient, Service, Offer, ServiceCredit, Doctor, InventoryItem } from '../../models';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  serviceId?: string;
  pricingType?: 'fixed' | 'pulse' | 'area' | 'time';
  isCreditsUsed?: boolean; // Track if paying with credits
  originallyPaidByCredit?: boolean; // New: Track if credits were used during session (so we don't double charge)
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
  inventory: InventoryItem[] = [];
  offers: Offer[] = [];
  invoices: any[] = [];

  loading = true;
  activeTab: 'pending' | 'completed' = 'pending';
  showInvoiceModal = false;
  selectedAppointment: Appointment | null = null;
  selectedPatient: Patient | null = null;
  selectedInvoiceId: string | null = null;
  isViewingInvoice = false;
  isPartialPaymentMode = false;
  isProcessingInvoice = false;

  // History filters
  historySearchQuery = '';
  historyDateFrom = '';
  historyDateTo = '';
  historyPriceMin: number | null = null;
  historyPriceMax: number | null = null;
  historyStatusFilter: 'all' | 'paid' | 'partial' | 'pending' = 'all';

  // Invoice Builder
  invoiceItems: InvoiceItem[] = [];

  // Offers
  availableOffers: AppliedOffer[] = [];
  // Bug 13.1 fix: Support multiple non-exclusive offers
  selectedAppliedOffers: AppliedOffer[] = [];

  // Available Credits
  availableCredits: ServiceCredit[] = [];

  discount = 0;
  taxRate = 0; // Default to 0 as per user preference

  // Payment
  payments: PaymentMethod[] = [];
  newPayment: PaymentMethod = { type: 'cash', amount: 0 };
  paymentAttempted = false;
  invoiceAttempted = false;

  // Success message
  packageGrantedMessage = '';
  private selectedAppointmentSessionDate?: Date;

  private normalizePricingType(value?: string): InvoiceItem['pricingType'] {
    return value === 'fixed' || value === 'pulse' || value === 'area' || value === 'time'
      ? value
      : undefined;
  }

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
    this.loading = true;
    forkJoin({
      appointments: this.dataService.getAppointments(),
      patients: this.dataService.getPatients(),
      services: this.dataService.getServices(),
      doctors: this.dataService.getDoctors(),
      inventory: this.dataService.getInventory(),
      offers: this.dataService.getOffers(),
      invoices: this.dataService.getInvoices()
    }).subscribe({
      next: ({ appointments, patients, services, doctors, inventory, offers, invoices }) => {
        this.appointments = appointments;
        this.patients = patients;
        this.services = services;
        this.doctors = doctors;
        this.inventory = inventory;
        this.offers = offers;
        this.invoices = invoices;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
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

    // Filter by Date
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

    // Filter by Patient Name
    if (this.historySearchQuery.trim()) {
      const q = this.historySearchQuery.toLowerCase();
      result = result.filter(a => this.getPatientName(a.patientId).toLowerCase().includes(q));
    }

    // Filter by Invoice-specific attributes (Price & Status)
    if (this.historyPriceMin !== null || this.historyPriceMax !== null || this.historyStatusFilter !== 'all') {
      result = result.filter(a => {
        const inv = this.invoices.find(i => i.appointmentId === a.id);
        if (!inv) return false;

        // Price Check
        if (this.historyPriceMin !== null && inv.total < this.historyPriceMin) return false;
        if (this.historyPriceMax !== null && inv.total > this.historyPriceMax) return false;

        // Status Check
        if (this.historyStatusFilter !== 'all' && inv.status !== this.historyStatusFilter) return false;

        return true;
      });
    }

    return result.sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime());
  }

  getInvoiceForAppointment(appointmentId: string): any {
    return this.invoices.find(inv => inv.appointmentId === appointmentId);
  }

  onHistoryFilterChange() {
    // Reactive via getter, no explicit action needed
  }

  clearHistoryFilter() {
    this.historySearchQuery = '';
    this.historyDateFrom = '';
    this.historyDateTo = '';
    this.historyPriceMin = null;
    this.historyPriceMax = null;
    this.historyStatusFilter = 'all';
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
    this.selectedAppliedOffers = [];
    this.availableOffers = [];
    this.availableCredits = [];
    this.packageGrantedMessage = '';
    this.selectedAppointmentSessionDate = undefined;
    this.paymentAttempted = false;
    this.invoiceAttempted = false;
    this.isViewingInvoice = viewOnly;

    if (viewOnly) {
      const invoice = this.invoices.find(inv => inv.appointmentId === appointment.id);
      if (!invoice) {
        this.alertService.error('Invoice not found for this appointment.');
        return;
      }

      this.selectedInvoiceId = invoice.id;
      this.isPartialPaymentMode = invoice.status === 'pending' || invoice.status === 'partial';

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
          pricingType: this.normalizePricingType(service.pricingType),
          isCreditsUsed: isFromCredits
        });
      }
    }

    // Load session details (consumables, actual credit usage, extra charges)
    this.dataService.getSessionByAppointment(appointment.id).subscribe({
      next: session => {
        if (session) {
            this.selectedAppointmentSessionDate = session.endTime ? new Date(session.endTime) : new Date(session.startTime);
            // 1. Process Consumables - SKIPPED as per user request (inventory tracking only)
            // if(session.consumablesUsed) { ... }

            // 2. Process Extra Charges
            if (session.extraCharges) {
                for (const charge of session.extraCharges) {
                    // Bug 12.2 fix: If the extra charge has a serviceId, it represents
                    // the actual cost calculated from a non-fixed pricing model (pulse/area/time).
                    // Zero out the original invoice item's base price to avoid double-counting.
                    if (charge.serviceId) {
                      const matchingItem = this.invoiceItems.find(i => i.serviceId === charge.serviceId && !i.isCreditsUsed);
                      if (matchingItem) {
                        matchingItem.unitPrice = 0;
                        matchingItem.total = 0;
                        matchingItem.description += ` (${charge.description})`;
                      }
                    }
                    this.invoiceItems.push({
                        description: charge.description,
                        quantity: 1,
                        unitPrice: charge.amount,
                        total: charge.amount,
                        serviceId: charge.serviceId,
                      pricingType: this.normalizePricingType(this.selectedAppointment?.services.find(s => s.serviceId === charge.serviceId)?.pricingType),
                        isCreditsUsed: false
                    });
                }
            }

            // 3. Update Service Items based on Session Credit Usage
            // If session recorded credit usage, update the corresponding invoice items to be 0 total
             if (session.creditsUsed) {
                 for(const creditUsage of session.creditsUsed) {
                     // Find the invoice item for this service
                     // We match by serviceId. If there are multiple items for same service (unlikely in this context but possible),
                     // we should ideally match one. For now, find first non-credit one.
                     const invItem = this.invoiceItems.find(i => i.serviceId === creditUsage.serviceId && !i.isCreditsUsed);
                     if(invItem) {
                         invItem.isCreditsUsed = true;
                         invItem.originallyPaidByCredit = true; // Mark as already paid by session credits
                         invItem.total = 0;
                         invItem.description += ` (Covered by ${creditUsage.unitsUsed} ${creditUsage.unitType})`;
                     }
                 }
            }

        }
        this.recalculateOffers();
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });

    // Load available credits for this patient
    if (this.selectedPatient) {
      forkJoin({
        credits: this.walletService.getAvailableCredits(this.selectedPatient.id),
        usage: this.dataService.getOfferUsage(this.selectedPatient.id)
      }).subscribe({
        next: ({ credits, usage }) => {
          this.availableCredits = credits;
          this.recalculateOffers(usage);
          this.showInvoiceModal = true;
          this.cdr.markForCheck();
        },
        error: () => {
          this.showInvoiceModal = true;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.recalculateOffers();
      this.showInvoiceModal = true;
    }
  }

  closeInvoiceModal() {
    this.showInvoiceModal = false;
    this.selectedAppointment = null;
    this.selectedPatient = null;
    this.selectedInvoiceId = null;
    this.packageGrantedMessage = '';
    this.isViewingInvoice = false;
    this.isPartialPaymentMode = false;
    this.isProcessingInvoice = false;
  }

  // Offer Calculation
  recalculateOffers(usageStats?: { offerId: string, patientCount: number, globalCount: number }[]) {
    if (!this.selectedPatient) return;

    const cart: CartItem[] = this.invoiceItems.map(item => ({
      serviceId: item.serviceId || '',
      serviceName: item.description,
      price: item.unitPrice,
      quantity: item.quantity
    }));

    const sessionDate = this.selectedAppointmentSessionDate
      ? new Date(this.selectedAppointmentSessionDate)
      : (this.selectedAppointment ? new Date(this.selectedAppointment.scheduledStart) : undefined);
    this.availableOffers = this.offerService.evaluateOffers(cart, this.selectedPatient, this.offers, this.services, usageStats, 'billing', sessionDate);

    // Bug 13 fix: Keep offer chosen at end-session visible in billing even if offer is now inactive.
    if (this.selectedAppointment?.offerId) {
      const pinnedOffer = this.offers.find(o => o.id === this.selectedAppointment!.offerId);
      if (pinnedOffer) {
        const forcedOffer = { ...pinnedOffer, isActive: true };
        const pinnedApplied = this.offerService.evaluateOffers(cart, this.selectedPatient, [forcedOffer], this.services, usageStats, 'billing', sessionDate);
        if (pinnedApplied.length > 0) {
          const exists = this.availableOffers.some(a => a.offer.id === pinnedApplied[0].offer.id);
          if (!exists) {
            this.availableOffers = [pinnedApplied[0], ...this.availableOffers];
          }
        }
      }
    }

    // Bug 13.1 fix: Auto-select all non-exclusive offers if none selected yet
    if (this.availableOffers.length > 0 && this.selectedAppliedOffers.length === 0) {
       this.selectedAppliedOffers = [...this.availableOffers];
    }
  }

  get subtotal(): number {
    return this.invoiceItems
      .filter(item => !item.isCreditsUsed)
      .reduce((sum, item) => sum + item.total, 0);
  }

  get discountAmount(): number {
    // Bug 13.1 fix: Sum discounts from all selected offers
    const offerDiscount = this.selectedAppliedOffers.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
    return offerDiscount + this.discount;
  }

  get taxAmount(): number {
    return Math.max(0, this.subtotal - this.discountAmount) * (this.taxRate / 100);
  }

  get grandTotal(): number {
    return Math.max(0, this.subtotal - this.discountAmount + this.taxAmount);
  }

  get totalPaid(): number {
    return this.payments.reduce((sum, p) => sum + p.amount, 0);
  }

  get remainingBalance(): number {
    return this.grandTotal - this.totalPaid;
  }

  applyOffer(appliedOffer: AppliedOffer) {
    // Bug 13.1 fix: Toggle offer selection (add/remove from array)
    const idx = this.selectedAppliedOffers.findIndex(o => o.offer.id === appliedOffer.offer.id);
    if (idx > -1) {
      this.selectedAppliedOffers.splice(idx, 1);
    } else {
      this.selectedAppliedOffers.push(appliedOffer);
    }
  }

  isOfferSelected(appliedOffer: AppliedOffer): boolean {
    return this.selectedAppliedOffers.some(o => o.offer.id === appliedOffer.offer.id);
  }

  clearOffers() {
    this.selectedAppliedOffers = [];
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
      // Bug 13.6 fix: Validate credit unit type matches service pricing model
      const credit = this.availableCredits.find(c => c.serviceId === item.serviceId && c.remaining > 0);
      const svc = this.services.find(s => s.id === item.serviceId);
      if (credit && svc) {
        const expectedPricingType = item.pricingType || this.selectedAppointment?.services.find(s => s.serviceId === item.serviceId)?.pricingType;
        const creditType = credit.unitType;
        let compatibleModel = false;

        if (expectedPricingType) {
          if (creditType === 'session' || creditType === 'unit') {
            compatibleModel = expectedPricingType === 'fixed';
          } else {
            compatibleModel = expectedPricingType === creditType;
          }
        } else {
          compatibleModel = svc.pricingModels.some(m => {
            if (creditType === 'session' || creditType === 'unit') return m.type === 'fixed';
            return m.type === creditType;
          });
        }

        if (!compatibleModel) {
          this.alertService.validationError('This credit type does not match the selected billing type for this service.');
          return; // Don't allow mismatched credit usage
        }
      }
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
    this.newPayment.amount = Math.round(this.remainingBalance * 100) / 100;
    if (this.newPayment.amount <= 0) return;

    if (this.isPartialPaymentMode) {
      this.submitAdditionalPayment();
      return;
    }

    this.addPayment();
  }

  validatePaymentAmount() {
    if (this.newPayment.amount) {
      this.newPayment.amount = Math.round(this.newPayment.amount * 100) / 100;
    }
  }

  confirmInvoice(saveAsPending: boolean = false) {
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
    if (this.payments.length === 0 && this.grandTotal > 0 && !saveAsPending) {
      this.alertService.validationError('Add at least one payment or Save as Pending');
      return;
    }
    if (!saveAsPending && this.totalPaid < this.grandTotal) {
      this.alertService.validationError('Remaining balance must be fully paid to Confirm & Pay. Otherwise use Save as Pending.');
      return;
    }
    if (this.totalPaid > this.grandTotal) {
      this.alertService.validationError('Total paid cannot exceed the grand total');
      return;
    }

    // 1. Credit redemptions and package grants are now securely performed by the backend during Invoice Create
    // to ensure atomicity. The frontend just passes the flags.

    // 2. Handle package grants from offers is now securely performed by the backend during Invoice Create

    // 3. Build invoice payload — first fetch the session so we can pass its ID
    //    This is critical to prevent double credit deduction (Bug 13.4)
    this.isProcessingInvoice = true;
    this.dataService.getSessionByAppointment(this.selectedAppointment!.id).pipe(
      switchMap(session => {
        const hasPayments = this.payments.length > 0;
        const shouldApplyOffer = !saveAsPending || hasPayments;
        const invoicePayload = {
          patientId: this.selectedPatient?.id ?? '',
          appointmentId: this.selectedAppointment?.id ?? '',
          sessionId: session?.id || null,
          appliedOfferId: shouldApplyOffer
            ? (this.selectedAppliedOffers.length > 0
              ? this.selectedAppliedOffers[0].offer.id
              : (this.selectedAppointment?.offerId || null))
            : null,
          items: this.invoiceItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            isCreditsUsed: item.isCreditsUsed || false,
            serviceId: item.serviceId || null
          })),
          subtotal: this.subtotal,
          discount: this.discountAmount,
          tax: this.taxAmount,
          total: this.grandTotal,
          status: saveAsPending ? (this.totalPaid > 0 ? 'partial' as const : 'pending' as const) : 'paid' as const,
          createdAt: new Date(),
          payments: this.payments.map(p => ({
            id: crypto.randomUUID(),
            amount: p.amount,
            method: p.type as 'cash' | 'card' | 'wallet' | 'credits',
            timestamp: new Date()
          }))
        };

        // Create invoice (Backend handles all transactions atomically)
        return this.dataService.createInvoice(invoicePayload);
      }),
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
        console.error('Invoice creation failed', err);
        this.cdr.markForCheck();
      }
    });
  }

  submitAdditionalPayment() {
    if (this.isProcessingInvoice || !this.selectedInvoiceId) return;

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

    this.isProcessingInvoice = true;
    this.dataService.addInvoicePayment(this.selectedInvoiceId, {
      amount: this.newPayment.amount,
      method: this.newPayment.type
    }).pipe(
      switchMap((updatedInvoice) => {
        // Also add the transaction to the patient's record for consistency
        return this.dataService.addPatientTransaction({
          patientId: this.selectedPatient!.id,
          date: new Date(),
          type: 'payment',
          description: `Partial payment via ${this.newPayment.type}`,
          amount: this.newPayment.amount,
          method: this.newPayment.type,
          relatedAppointmentId: this.selectedAppointment?.id
        }).pipe(switchMap(() => of(updatedInvoice)));
      })
    ).subscribe({
      next: (updatedInvoice) => {
        this.isProcessingInvoice = false;

        // Update local state to reflect the new payment
        this.payments.push({ ...this.newPayment });
        this.newPayment = { type: 'cash', amount: 0 };
        this.paymentAttempted = false;

        // Update the invoice in the list
        const idx = this.invoices.findIndex(inv => inv.id === updatedInvoice.id);
        if (idx > -1) {
          this.invoices[idx] = updatedInvoice;
        }

        // If newly paid off, refresh everything and close
        if (updatedInvoice.status === 'paid') {
          this.alertService.success('Fully Paid', 'Invoice has been fully paid off.')
            .then(() => {
              this.closeInvoiceModal();
              this.loadData();
            });
        } else {
          this.alertService.success('Payment Added', 'Partial payment recorded successfully.');
        }
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isProcessingInvoice = false;
        console.error('Adding payment failed', err);
        this.alertService.error(err.error?.error || 'Failed to add payment. Please try again.');
        this.cdr.markForCheck();
      }
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
