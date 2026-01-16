import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent, ModalComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Offer, Service, OfferCondition, OfferBenefit, PackageCreditItem } from '../../models';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent],
  templateUrl: './offers.html',
  styleUrl: './offers.scss'
})
export class Offers implements OnInit {
  offers: Offer[] = [];
  services: Service[] = [];
  showModal = false;
  isEditMode = false;
  currentStep = 1;
  activeFilter: 'all' | 'active' | 'expired' = 'all';

  offerForm: Partial<Offer> = {};

  constructor(
    private dataService: DataService,
    private alertService: SweetAlertService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dataService.getOffers().subscribe(offers => this.offers = offers);
    this.dataService.getServices().subscribe(services => this.services = services);
  }

  get filteredOffers(): Offer[] {
    const now = new Date();
    if (this.activeFilter === 'active') {
      return this.offers.filter(o => o.isActive && (!o.validUntil || new Date(o.validUntil) >= now));
    }
    if (this.activeFilter === 'expired') {
      return this.offers.filter(o => !o.isActive || (o.validUntil && new Date(o.validUntil) < now));
    }
    return this.offers;
  }

  openAddModal() {
    this.isEditMode = false;
    this.currentStep = 1;
    this.offerForm = this.getEmptyForm();
    this.showModal = true;
  }

  openEditModal(offer: Offer) {
    this.isEditMode = true;
    this.currentStep = 1;
    this.offerForm = JSON.parse(JSON.stringify(offer));
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveOffer() {
    if (!this.offerForm.name) {
      this.alertService.validationError('Offer Name is required');
      return;
    }

    // Default benefits if missing
    if (!this.offerForm.benefits || this.offerForm.benefits.length === 0) {
       this.offerForm.benefits = [{
         id: 'b_' + Date.now(),
         type: 'percent_off',
         parameters: { percent: 10 }
       }];
    }

    const offerName = this.offerForm.name;
    if (this.isEditMode && this.offerForm.id) {
      this.dataService.updateOffer(this.offerForm as Offer);
      this.alertService.updated('Offer', offerName);
    } else {
      this.dataService.addOffer(this.offerForm as Offer);
      this.alertService.created('Offer', offerName);
    }

    this.loadData();
    this.closeModal();
  }

  toggleOfferStatus(offer: Offer, event?: Event) {
    if(event) event.stopPropagation();
    offer.isActive = !offer.isActive;
    this.dataService.updateOffer(offer);
    const status = offer.isActive ? 'activated' : 'deactivated';
    this.alertService.toast(`Offer "${offer.name}" ${status}`, offer.isActive ? 'success' : 'warning');
  }

  // Wizard Helpers
  addCondition(type: string) {
    if (!this.offerForm.conditions) this.offerForm.conditions = [];
    this.offerForm.conditions.push({
      id: Math.random().toString(36).substr(2, 9),
      type: type as any,
      parameters: { serviceIds: [] }
    });
  }

  removeCondition(index: number) {
    this.offerForm.conditions?.splice(index, 1);
  }

  addServiceToCondition(cond: OfferCondition, event: any) {
    const serviceId = event.target.value;
    if (!serviceId) return;
    if (!cond.parameters.serviceIds) cond.parameters.serviceIds = [];
    if (!cond.parameters.serviceIds.includes(serviceId)) {
      cond.parameters.serviceIds.push(serviceId);
    }
    event.target.value = '';
  }

  removeServiceFromCondition(cond: OfferCondition, serviceId: string) {
    if (cond.parameters.serviceIds) {
      cond.parameters.serviceIds = cond.parameters.serviceIds.filter((id: string) => id !== serviceId);
    }
  }

  getConditionLabel(type: string): string {
    const labels: any = {
      'service_includes': 'Must Include Services',
      'min_spend': 'Minimum Spend Amount',
      'new_patient': 'New Patients Only'
    };
    return labels[type] || type;
  }

  getServiceName(serviceId: string): string {
    return this.services.find(s => s.id === serviceId)?.name || 'Unknown';
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  formatDateInput(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  getTypeLabel(type: string): string {
    const map: any = {
      'percentage': 'Percentage Discount',
      'bundle': 'Fixed Bundle',
      'package': 'Credit Package',
      'fixed_amount': 'Flat Discount',
      'conditional': 'Conditional Rule'
    };
    return map[type] || type;
  }

  getBenefitDescription(offer: Offer): string {
    const benefit = offer.benefits[0];
    if (!benefit) return 'No benefits defined';

    switch (benefit.type) {
      case 'percent_off': return `${benefit.parameters.percent}% Off`;
      case 'fixed_amount_off': return `EGP ${benefit.parameters.fixedAmount} Off`;
      case 'fixed_price': return `Price: EGP ${benefit.parameters.fixedPrice}`;
      case 'grant_package': return `${benefit.parameters.packageSessions} Sessions for EGP ${benefit.parameters.fixedPrice}`;
      default: return benefit.type;
    }
  }

  getConditionDescription(offer: Offer): string {
     if (!offer.conditions || offer.conditions.length === 0) return 'Applies to everyone';
     const cond = offer.conditions[0];
     // Simple summary of first condition
     switch (cond.type) {
        case 'new_patient': return 'New Patients Only';
        case 'min_spend': return `Spend > EGP ${cond.parameters.minAmount}`;
        case 'service_includes': return `Requires specific services`;
        default: return `${offer.conditions.length} condition(s)`;
     }
  }

  getEmptyForm(): Partial<Offer> {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return {
      name: '',
      type: 'percentage',
      isActive: true,
      validFrom: today,
      validUntil: nextMonth,
      conditions: [],
      benefits: [{
        id: 'b_init',
        type: 'percent_off',
        parameters: { percent: 10, packageCredits: [] }
      }],
      priority: 10
    };
  }

  // Package Credits Methods
  addPackageCredit(benefit: OfferBenefit): void {
    if (!benefit.parameters.packageCredits) {
      benefit.parameters.packageCredits = [];
    }
    benefit.parameters.packageCredits.push({
      serviceId: '',
      serviceName: '',
      quantity: 1,
      unitType: 'session'
    });
  }

  removePackageCredit(benefit: OfferBenefit, index: number): void {
    benefit.parameters.packageCredits?.splice(index, 1);
  }

  updateCreditServiceName(credit: PackageCreditItem): void {
    const service = this.services.find(s => s.id === credit.serviceId);
    credit.serviceName = service?.name || '';
  }

  getOfferStatus(offer: Offer): { label: string; class: string } {
    if (!offer.isActive) return { label: 'Inactive', class: 'inactive' };
    const now = new Date();
    if (offer.validUntil && new Date(offer.validUntil) < now) return { label: 'Expired', class: 'expired' };
    return { label: 'Active', class: 'active' };
  }

  // Date handlers
  updateValidFrom(value: string) {
    if (value) this.offerForm.validFrom = new Date(value);
  }

  updateValidUntil(value: string) {
    if (value) this.offerForm.validUntil = new Date(value);
  }
}
