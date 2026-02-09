import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PageHeaderComponent, ModalComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Offer, Service, OfferCondition, OfferBenefit, PackageCreditItem, ServiceCategory } from '../../models';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent],
  templateUrl: './offers.html',
  styleUrl: './offers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Offers implements OnInit {
  offers: Offer[] = [];
  services: Service[] = [];
  categories: ServiceCategory[] = [];
  showModal = false;
  isEditMode = false;
  currentStep = 1;
  activeFilter: 'all' | 'active' | 'expired' = 'all';

  offerForm: Partial<Offer> = {};

  constructor(
    private dataService: DataService,
    private alertService: SweetAlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    forkJoin({
      offers: this.dataService.getOffers(),
      services: this.dataService.getServices(),
      categories: this.dataService.getCategories()
    }).subscribe({
      next: ({ offers, services, categories }) => {
        this.offers = offers;
        this.services = services;
        this.categories = categories;
        this.cdr.markForCheck();
      },
      error: () => {
        this.alertService.error('Failed to load data. Please refresh.');
        this.cdr.markForCheck();
      }
    });
  }

  // ... (filteredOffers, modal methods, etc.)

  // Helpers
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

  addCategoryToCondition(cond: OfferCondition, event: any) {
    const categoryId = event.target.value;
    if (!categoryId) return;
    if (!cond.parameters.categoryIds) cond.parameters.categoryIds = [];
    if (!cond.parameters.categoryIds.includes(categoryId)) {
      cond.parameters.categoryIds.push(categoryId);
    }
    event.target.value = '';
  }

  removeCategoryFromCondition(cond: OfferCondition, categoryId: string) {
    if (cond.parameters.categoryIds) {
      cond.parameters.categoryIds = cond.parameters.categoryIds.filter((id: string) => id !== categoryId);
    }
  }

  getCategoryName(catId: string): string {
    return this.categories.find(c => c.id === catId)?.name || 'Unknown';
  }

  getServiceName(serviceId: string): string {
    return this.services.find(s => s.id === serviceId)?.name || 'Unknown';
  }

  joinArray(arr?: string[]): string {
    return (arr || []).join(', ');
  }

  splitText(text: string): string[] {
    return text.split(',').map(t => t.trim()).filter(t => t.length > 0);
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
      'buyXgetY': 'Buy X Get Y',
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
      case 'free_session': return `Buy ${benefit.parameters.buyQuantity || 2} Get ${benefit.parameters.freeQuantity || 1} Free`;
      default: return benefit.type;
    }
  }

  // Wizard Helpers
  getConditionDescription(offer: Offer): string {
     if (!offer.conditions || offer.conditions.length === 0) return 'Applies to everyone';
     return offer.conditions.map(c => this.describeCondition(c)).join(' AND ');
  }

  describeCondition(cond: OfferCondition): string {
      switch (cond.type) {
         case 'group':
           const children = (cond.children || []).map(c => this.describeCondition(c)).join(` ${cond.logic || 'AND'} `);
           return children ? `(${children})` : '(Empty Group)';
         case 'new_patient': return 'New Patients Only';
         case 'min_spend': return `Spend > EGP ${cond.parameters.minAmount}`;
         case 'service_includes': return `Requires specific services`;
         case 'patient_tag': 
             const op = cond.operator === 'not_contains' ? 'NOT' : ''; 
             return `Tags ${op}: ${(cond.parameters.tags || []).join(', ')}`;
         case 'date_range': return `Date range condition`;
         case 'specific_patient': return `${(cond.parameters.patientIds || []).length} specific patient(s)`;
         case 'time_range': return `Time: ${cond.parameters.startTime} - ${cond.parameters.endTime}`;
         case 'day_of_week': return `Days: ${(cond.parameters.daysOfWeek || []).map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}`;
         case 'customer_attribute': return `Patient ${cond.parameters.attributeName} ${cond.operator} ${cond.parameters.attributeValue}`;
         case 'visit_count': return `Visits ${cond.operator} ${cond.parameters.attributeValue}`;
         case 'cart_property': return `Cart ${cond.parameters.attributeName} ${cond.operator} ${cond.parameters.threshold}`;
         default: return cond.type;
      }
  }

  getConditionLabel(type: string): string {
    const labels: any = {
      'group': 'Logic Group (AND/OR)',
      'service_includes': 'Must Include Services',
      'min_spend': 'Minimum Spend Amount',
      'new_patient': 'New Patients Only',
      'patient_tag': 'Patient Tags',
      'date_range': 'Date Range',
      'specific_patient': 'Specific Patients',
      'time_range': 'Time of Day',
      'day_of_week': 'Days of Week',
      'customer_attribute': 'Patient Attribute',
      'cart_property': 'Cart Property'
    };
    return labels[type] || type;
  }

  // Wizard Helpers - Recursive
  addCondition(parent: OfferCondition | null, type: string) {
    const newCond: OfferCondition = {
      id: crypto.randomUUID(),
      type: type as any,
      parameters: { serviceIds: [] }
    };

    if (type === 'group') {
        newCond.logic = 'AND';
        newCond.children = [];
    }

    if (parent && parent.type === 'group') {
        if (!parent.children) parent.children = [];
        parent.children.push(newCond);
    } else {
        // Root level
        if (!this.offerForm.conditions) this.offerForm.conditions = [];
        this.offerForm.conditions.push(newCond);
    }
  }

  removeCondition(parent: OfferCondition | null, id: string) {
      const targetList = parent ? parent.children : this.offerForm.conditions;
      if (!targetList) return;
      
      const idx = targetList.findIndex(c => c.id === id);
      if (idx > -1) {
          targetList.splice(idx, 1);
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
      isExclusive: false,
      validFrom: today,
      validUntil: nextMonth,
      conditions: [],
      benefits: [{
        id: 'b_init',
        type: 'percent_off',
        parameters: { percent: 10, packageCredits: [] }
      }],
      priority: 10,
      usageLimitPerPatient: undefined,
      totalUsageLimit: undefined
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

  onTypeChange(type: string) {
    if (!this.offerForm.benefits || this.offerForm.benefits.length === 0) return;
    const ben = this.offerForm.benefits[0];
    const typeMap: Record<string, OfferBenefit['type']> = {
      'percentage': 'percent_off',
      'fixed_amount': 'fixed_amount_off',
      'bundle': 'fixed_price',
      'package': 'grant_package',
      'buyXgetY': 'free_session',
      'conditional': 'percent_off'
    };
    ben.type = typeMap[type] || 'percent_off';
  }
}
