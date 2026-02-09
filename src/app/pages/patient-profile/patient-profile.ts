import { Component, OnInit, DestroyRef, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageHeaderComponent, StatCardComponent, ModalComponent, CalendarComponent } from '../../components/shared';
import { CalendarService, CalendarEvent, CalendarView } from '../../services/calendar.service';
import { DataService } from '../../services/data.service';
import { WalletService } from '../../services/wallet.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Appointment, Patient, PatientTransaction, PatientWallet, Service, Offer, PackagePurchase, ServiceCredit, PackageCreditItem } from '../../models';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent, StatCardComponent, ModalComponent, CalendarComponent],
  templateUrl: './patient-profile.html',
  styleUrl: './patient-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientProfile implements OnInit {
  private destroyRef = inject(DestroyRef);
  patient: Patient | null = null;
  wallet: PatientWallet | null = null;
  appointments: Appointment[] = [];
  services: Service[] = [];
  offers: Offer[] = [];
  transactions: PatientTransaction[] = [];
  pendingPurchases: PackagePurchase[] = [];
  patientEvents: CalendarEvent[] = [];

  activeTab: 'overview' | 'credits' | 'appointments' | 'transactions' | 'calendar' = 'overview';
  calendarView: CalendarView = 'timeGridWeek';

  // Buy Package Modal
  showBuyPackageModal = false;
  selectedOffer: Offer | null = null;

  // Pay Pending Modal
  showPayModal = false;
  selectedPurchase: PackagePurchase | null = null;
  paymentMethod: 'cash' | 'card' | 'wallet' = 'cash';

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private walletService: WalletService,
    private alertService: SweetAlertService,
    private calendarService: CalendarService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      const patientId = params.get('id');
      if (!patientId) return;
      this.loadPatient(patientId);
    });
  }

  loadPatient(patientId: string): void {
    forkJoin({
      patient: this.dataService.getPatient(patientId),
      wallet: this.walletService.getWallet(patientId),
      appointments: this.dataService.getPatientAppointments(patientId),
      services: this.dataService.getServices(),
      transactions: this.dataService.getPatientTransactions(patientId),
      offers: this.dataService.getOffers(),
      purchases: this.dataService.getPendingPackagePurchases(patientId),
      events: this.calendarService.getPatientEvents(patientId)
    }).subscribe({
      next: ({ patient, wallet, appointments, services, transactions, offers, purchases, events }) => {
        this.patient = patient || null;
        this.wallet = wallet;
        this.appointments = appointments;
        this.services = services;
        this.transactions = transactions.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.offers = offers.filter(o => o.isActive && o.type === 'package');
        this.pendingPurchases = purchases;
        this.patientEvents = events;
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }

  setTab(tab: 'overview' | 'credits' | 'appointments' | 'transactions' | 'calendar'): void {
    this.activeTab = tab;
  }

  get fullName(): string {
    if (!this.patient) return '';
    return `${this.patient.firstName} ${this.patient.lastName}`;
  }

  get totalCredits(): number {
    if (!this.wallet) return 0;
    return this.wallet.credits.reduce((sum, c) => sum + c.remaining, 0);
  }

  get creditBreakdown(): { unitType: string; count: number }[] {
    if (!this.wallet?.credits?.length) return [];
    const map = new Map<string, number>();
    for (const c of this.wallet.credits) {
      const key = c.unitType || 'session';
      map.set(key, (map.get(key) || 0) + c.remaining);
    }
    return Array.from(map.entries()).map(([unitType, count]) => ({ unitType, count }));
  }

  get creditSummary(): string {
    const bd = this.creditBreakdown;
    if (!bd.length) return '0 credits';
    return bd.map(b => `${b.count} ${b.unitType}s`).join(', ');
  }

  get upcomingAppointments(): Appointment[] {
    const now = new Date().getTime();
    return this.appointments
      .filter(a => new Date(a.scheduledStart).getTime() >= now && a.status !== 'cancelled' && a.status !== 'no-show')
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
  }

  get pastAppointments(): Appointment[] {
    const now = new Date().getTime();
    return this.appointments
      .filter(a => new Date(a.scheduledStart).getTime() < now)
      .sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime());
  }

  get nextAppointment(): Appointment | null {
    return this.upcomingAppointments.length ? this.upcomingAppointments[0] : null;
  }

  get lastVisit(): Appointment | null {
    return this.pastAppointments.length ? this.pastAppointments[0] : null;
  }

  getServiceNames(appointment: Appointment): string {
    return appointment.services
      .map(s => this.services.find(svc => svc.id === s.serviceId)?.name || 'Unknown')
      .join(', ');
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      dateStyle: 'medium'
    });
  }

  onCalendarViewChange(view: CalendarView) {
    this.calendarView = view;
  }

  getTransactionBadge(type: PatientTransaction['type']): string {
    switch (type) {
      case 'payment':
        return 'Payment';
      case 'refund':
        return 'Refund';
      case 'credit_purchase':
        return 'Package';
      case 'credit_usage':
        return 'Credit Used';
      case 'wallet_topup':
        return 'Top Up';
      default:
        return 'Transaction';
    }
  }

  getTransactionClass(type: PatientTransaction['type']): string {
    switch (type) {
      case 'payment':
        return 'badge-success';
      case 'refund':
        return 'badge-danger';
      case 'credit_purchase':
        return 'badge-info';
      case 'credit_usage':
        return 'badge-warning';
      case 'wallet_topup':
        return 'badge-primary';
      default:
        return 'badge-muted';
    }
  }

  // Package Purchase Methods
  get availablePackages(): Offer[] {
    return this.offers.filter(o => o.isActive && o.type === 'package');
  }

  openBuyPackageModal(): void {
    this.selectedOffer = null;
    this.showBuyPackageModal = true;
  }

  closeBuyPackageModal(): void {
    this.showBuyPackageModal = false;
    this.selectedOffer = null;
  }

  selectPackage(offer: Offer): void {
    this.selectedOffer = offer;
  }

  getPackagePrice(offer: Offer): number {
    const benefit = offer.benefits[0];
    return benefit?.parameters?.fixedPrice || 0;
  }

  getPackageCredits(offer: Offer): PackageCreditItem[] {
    const benefit = offer.benefits[0];
    if (!benefit) return [];

    // Support new multi-credit format
    if (benefit.parameters.packageCredits?.length) {
      return benefit.parameters.packageCredits;
    }

    // Fallback to legacy single service format
    if (benefit.parameters.packageServiceId) {
      const service = this.services.find(s => s.id === benefit.parameters.packageServiceId);
      return [{
        serviceId: benefit.parameters.packageServiceId || '',
        serviceName: service?.name || 'Unknown Service',
        quantity: benefit.parameters.packageSessions || 1,
        unitType: 'session'
      }];
    }

    return [];
  }

  confirmPurchasePackage(): void {
    if (!this.patient || !this.selectedOffer) return;

    const credits = this.getPackageCredits(this.selectedOffer);
    const price = this.getPackagePrice(this.selectedOffer);

    this.dataService.addPackagePurchase({
      patientId: this.patient.id,
      offerId: this.selectedOffer.id,
      offerName: this.selectedOffer.name,
      price: price,
      status: 'pending',
      credits: credits,
      createdAt: new Date()
    }).pipe(
      switchMap(() => this.dataService.addPatientTransaction({
        patientId: this.patient!.id,
        date: new Date(),
        type: 'credit_purchase',
        description: `Package pending: ${this.selectedOffer!.name}`,
        amount: price,
        packageId: this.selectedOffer!.id
      }))
    ).subscribe({
      next: () => {
        this.alertService.toast(`Package "${this.selectedOffer!.name}" added as pending bill`, 'success');
        this.closeBuyPackageModal();
        this.loadPatient(this.patient!.id);
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }

  // Pay Pending Purchase
  openPayModal(purchase: PackagePurchase): void {
    this.selectedPurchase = purchase;
    this.paymentMethod = 'cash';
    this.showPayModal = true;
  }

  closePayModal(): void {
    this.showPayModal = false;
    this.selectedPurchase = null;
  }

  confirmPayment(): void {
    if (!this.patient || !this.selectedPurchase) return;

    const purchase = this.selectedPurchase;
    const patientId = this.patient.id;

    // Build all credit observables
    const validityDays = 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    const creditOps = purchase.credits.map(creditItem => {
      const credit: ServiceCredit = {
        serviceId: creditItem.serviceId,
        serviceName: creditItem.serviceName,
        remaining: creditItem.quantity,
        total: creditItem.quantity,
        expiresAt: expiresAt,
        packageId: purchase.offerId,
        unitType: creditItem.unitType
      };
      return this.walletService.addCredit(patientId, credit);
    });

    // Execute all mutations in parallel, then reload
    forkJoin([
      this.dataService.updatePackagePurchaseStatus(purchase.id, 'paid'),
      ...creditOps,
      this.dataService.addPatientTransaction({
        patientId: patientId,
        date: new Date(),
        type: 'payment',
        description: `Paid for package: ${purchase.offerName}`,
        amount: purchase.price,
        method: this.paymentMethod,
        packageId: purchase.offerId
      })
    ]).subscribe({
      next: () => {
        this.alertService.toast(`Payment received! Credits added to wallet.`, 'success');
        this.closePayModal();
        this.loadPatient(patientId);
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }

  // Usage History Helpers
  expandedCredits = new Set<string>();

  toggleCreditHistory(credit: ServiceCredit) {
    // Unique key for credit item
    const key = this.getCreditKey(credit);
    if (this.expandedCredits.has(key)) {
        this.expandedCredits.delete(key);
    } else {
        this.expandedCredits.add(key);
    }
  }

  isCreditExpanded(credit: ServiceCredit): boolean {
      return this.expandedCredits.has(this.getCreditKey(credit));
  }

  private getCreditKey(credit: ServiceCredit): string {
      return `${credit.serviceId}_${credit.packageId || 'none'}_${credit.unitType}`;
  }

  getUsageHistory(credit: ServiceCredit): PatientTransaction[] {
      return this.transactions.filter(tx => 
          tx.type === 'credit_usage' && 
          tx.serviceId === credit.serviceId &&
          (!credit.packageId || tx.packageId === credit.packageId) // Match package if exists
      );
  }

  getRelatedAppointment(tx: PatientTransaction): Appointment | undefined {
      if (!tx.relatedAppointmentId) return undefined;
      return this.appointments.find(a => a.id === tx.relatedAppointmentId);
  }

  getServiceName(serviceId: string): string {
    return this.services.find(s => s.id === serviceId)?.name || 'Unknown';
  }
}
