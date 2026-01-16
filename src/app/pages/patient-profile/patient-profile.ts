import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  styleUrl: './patient-profile.scss'
})
export class PatientProfile implements OnInit {
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
    private calendarService: CalendarService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const patientId = params.get('id');
      if (!patientId) return;
      this.loadPatient(patientId);
    });
  }

  loadPatient(patientId: string): void {
    this.dataService.getPatient(patientId).subscribe(patient => {
      this.patient = patient || null;
    });

    this.walletService.getWallet(patientId).subscribe(wallet => {
      this.wallet = wallet;
    });

    this.dataService.getPatientAppointments(patientId).subscribe(appointments => {
      this.appointments = appointments;
    });

    this.dataService.getServices().subscribe(services => {
      this.services = services;
    });

    this.dataService.getPatientTransactions(patientId).subscribe(transactions => {
      this.transactions = transactions.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });

    this.dataService.getOffers().subscribe(offers => {
      this.offers = offers.filter(o => o.isActive && o.type === 'package');
    });

    this.dataService.getPendingPackagePurchases(patientId).subscribe(purchases => {
      this.pendingPurchases = purchases;
    });

    this.calendarService.getPatientEvents(patientId).subscribe(events => {
      this.patientEvents = events;
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

    const purchaseId = this.dataService.addPackagePurchase({
      patientId: this.patient.id,
      offerId: this.selectedOffer.id,
      offerName: this.selectedOffer.name,
      price: price,
      status: 'pending',
      credits: credits,
      createdAt: new Date()
    });

    this.dataService.addPatientTransaction({
      patientId: this.patient.id,
      date: new Date(),
      type: 'credit_purchase',
      description: `Package pending: ${this.selectedOffer.name}`,
      amount: price,
      packageId: this.selectedOffer.id
    });

    this.alertService.toast(`Package "${this.selectedOffer.name}" added as pending bill`, 'success');
    this.closeBuyPackageModal();
    this.loadPatient(this.patient.id);
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

    // Mark as paid
    this.dataService.updatePackagePurchaseStatus(purchase.id, 'paid');

    // Grant credits to wallet
    const validityDays = 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    for (const creditItem of purchase.credits) {
      const credit: ServiceCredit = {
        serviceId: creditItem.serviceId,
        serviceName: creditItem.serviceName,
        remaining: creditItem.quantity,
        total: creditItem.quantity,
        expiresAt: expiresAt,
        packageId: purchase.offerId,
        unitType: creditItem.unitType
      };
      this.walletService.addCredit(this.patient.id, credit);
    }

    // Record payment transaction
    this.dataService.addPatientTransaction({
      patientId: this.patient.id,
      date: new Date(),
      type: 'payment',
      description: `Paid for package: ${purchase.offerName}`,
      amount: purchase.price,
      method: this.paymentMethod,
      packageId: purchase.offerId
    });

    this.alertService.toast(`Payment received! Credits added to wallet.`, 'success');
    this.closePayModal();
    this.loadPatient(this.patient.id);
  }

  getServiceName(serviceId: string): string {
    return this.services.find(s => s.id === serviceId)?.name || 'Unknown';
  }
}
