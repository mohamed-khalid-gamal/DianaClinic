import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent, ModalComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Service, ServiceCategory, PricingModel, Doctor, Room } from '../../models';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent],
  templateUrl: './services.html',
  styleUrl: './services.scss'
})
export class Services implements OnInit {
  services: Service[] = [];
  categories: ServiceCategory[] = [];
  doctors: Doctor[] = [];
  
  // Available types derived from rooms/system config
  roomTypes = ['treatment', 'consultation', 'laser', 'surgery', 'facial'];
  
  selectedCategory: string = 'all';
  showModal = false;
  isEditMode = false;

  serviceForm: Partial<Service> = this.getEmptyForm();
  pricingTypes = [
    { key: 'fixed', label: 'Fixed Session Price', description: 'Standard flat fee per session' },
    { key: 'pulse', label: 'Pulse-Based Pricing', description: 'Price per pulse + base fee' },
    { key: 'area', label: 'Area/Tier Pricing', description: 'Different prices by treatment area' },
    { key: 'time', label: 'Time-Based', description: 'Charged per minute' }
  ];

  newArea = { name: '', price: 0 };

  constructor(
    private dataService: DataService,
    private alertService: SweetAlertService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dataService.getServices().subscribe(services => this.services = services);
    this.dataService.getCategories().subscribe(categories => this.categories = categories);
    this.dataService.getDoctors().subscribe(doctors => this.doctors = doctors);
  }

  get filteredServices(): Service[] {
    if (this.selectedCategory === 'all') return this.services;
    return this.services.filter(s => s.categoryId === this.selectedCategory);
  }

  getCategoryName(categoryId: string): string {
    return this.categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
  }

  getCategoryIcon(categoryId: string): string {
    const icons: { [key: string]: string } = {
      'cat1': 'fa-solid fa-bolt',
      'cat2': 'fa-solid fa-droplet',
      'cat3': 'fa-solid fa-syringe',
      'cat4': 'fa-solid fa-person-running'
    };
    return icons[categoryId] || 'fa-solid fa-wand-magic-sparkles';
  }

  getMainPrice(service: Service): string {
    const pricing = service.pricingModels[0];
    if (!pricing) return 'N/A';
    
    if (pricing.type === 'fixed') {
      return `EGP ${pricing.basePrice.toLocaleString()}`;
    }
    if (pricing.type === 'pulse') {
      return `EGP ${pricing.basePrice} + ${pricing.pricePerUnit}/pulse`;
    }
    if (pricing.type === 'area' && pricing.areas?.length) {
      const minPrice = Math.min(...pricing.areas.map(a => a.price));
      return `From EGP ${minPrice.toLocaleString()}`;
    }
    return `EGP ${pricing.basePrice.toLocaleString()}`;
  }

  getPricingTypes(service: Service): string[] {
    return service.pricingModels.map(p => p.type);
  }

  openAddModal() {
    this.isEditMode = false;
    this.serviceForm = this.getEmptyForm();
    this.showModal = true;
  }

  openEditModal(service: Service) {
    this.isEditMode = true;
    this.serviceForm = JSON.parse(JSON.stringify(service));
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveService() {
    const serviceName = this.serviceForm.name || 'Service';
    if (!this.isEditMode) {
      this.dataService.addService(this.serviceForm as Service);
      this.alertService.created('Service', serviceName);
    } else {
      this.alertService.updated('Service', serviceName);
    }
    this.loadData();
    this.closeModal();
  }

  togglePricingType(type: string) {
    if (!this.serviceForm.pricingModels) {
      this.serviceForm.pricingModels = [];
    }
    
    const index = this.serviceForm.pricingModels.findIndex(p => p.type === type);
    if (index > -1) {
      this.serviceForm.pricingModels.splice(index, 1);
    } else {
      const newModel: PricingModel = { type: type as any, basePrice: 0 };
      if (type === 'pulse') newModel.pricePerUnit = 0;
      if (type === 'area') newModel.areas = [];
      this.serviceForm.pricingModels.push(newModel);
    }
  }

  hasPricingType(type: string): boolean {
    return this.serviceForm.pricingModels?.some(p => p.type === type) || false;
  }

  getPricingModel(type: string): PricingModel | undefined {
    return this.serviceForm.pricingModels?.find(p => p.type === type);
  }

  // Resource Management
  toggleRoomType(type: string) {
    if (!this.serviceForm.requiredRoomTypes) this.serviceForm.requiredRoomTypes = [];
    
    const index = this.serviceForm.requiredRoomTypes.indexOf(type);
    if (index > -1) {
      this.serviceForm.requiredRoomTypes.splice(index, 1);
    } else {
      this.serviceForm.requiredRoomTypes.push(type);
    }
  }

  hasRoomType(type: string): boolean {
    return this.serviceForm.requiredRoomTypes?.includes(type) || false;
  }

  toggleDoctor(doctorId: string) {
    if (!this.serviceForm.allowedDoctorIds) this.serviceForm.allowedDoctorIds = [];
    
    const index = this.serviceForm.allowedDoctorIds.indexOf(doctorId);
    if (index > -1) {
      this.serviceForm.allowedDoctorIds.splice(index, 1);
    } else {
      this.serviceForm.allowedDoctorIds.push(doctorId);
    }
  }

  isDoctorAllowed(doctorId: string): boolean {
    // If array is empty, all are allowed? Or none? Usually specific skills imply restriction.
    // Let's assume if array has items, only those are allowed. If empty, maybe general practitioners?
    // For UI simplicity: check if in array.
    return this.serviceForm.allowedDoctorIds?.includes(doctorId) || false;
  }

  addArea() {
    if (this.newArea.name && this.newArea.price > 0) {
      const areaModel = this.getPricingModel('area');
      if (areaModel) {
        if (!areaModel.areas) areaModel.areas = [];
        areaModel.areas.push({ ...this.newArea });
        this.newArea = { name: '', price: 0 };
      }
    }
  }

  removeArea(index: number) {
    const areaModel = this.getPricingModel('area');
    if (areaModel?.areas) {
      areaModel.areas.splice(index, 1);
    }
  }

  getEmptyForm(): Partial<Service> {
    return {
      name: '',
      categoryId: '',
      description: '',
      duration: 30,
      pricingModels: [{ type: 'fixed', basePrice: 0 }],
      requiredRoomTypes: [],
      allowedDoctorIds: [],
      isActive: true
    };
  }
}
