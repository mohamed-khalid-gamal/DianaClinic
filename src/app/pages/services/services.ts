import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PageHeaderComponent, ModalComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Service, ServiceCategory, PricingModel, Doctor, InventoryItem, ServiceConsumable } from '../../models';

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
  inventoryItems: InventoryItem[] = [];

  // Available types derived from rooms/system config
  roomTypes = ['treatment', 'consultation', 'laser', 'surgery', 'facial'];

  selectedCategory: string = 'all';
  showModal = false;
  isEditMode = false;
  loading = true;

  // Category management
  showCategoryModal = false;
  newCategoryName = '';
  editingCategoryId: string | null = null;
  editingCategoryName = '';

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
    forkJoin({
      services: this.dataService.getServices(),
      categories: this.dataService.getCategories(),
      doctors: this.dataService.getDoctors(),
      inventory: this.dataService.getInventory()
    }).subscribe({
      next: ({ services, categories, doctors, inventory }) => {
        this.services = services;
        this.categories = categories;
        this.doctors = doctors;
        this.inventoryItems = inventory.filter(i => i.category === 'consumable' || i.category === 'drug');
        this.loading = false;
      },
      error: () => this.alertService.error('Failed to load services. Please refresh.')
    });
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

  saveService(form?: NgForm) {
    if (form && form.invalid) {
      form.form.markAllAsTouched();
      this.alertService.validationError('Please fill all required fields');
      return;
    }

    const serviceNameValue = this.serviceForm.name?.trim();

    if (!serviceNameValue) {
      this.alertService.validationError('Service name is required');
      return;
    }
    if (!this.serviceForm.categoryId) {
      this.alertService.validationError('Category is required');
      return;
    }
    if (!this.serviceForm.duration || this.serviceForm.duration < 5) {
      this.alertService.validationError('Duration must be at least 5 minutes');
      return;
    }

    const serviceName = this.serviceForm.name || 'Service';
    if (!this.isEditMode) {
      this.dataService.addService(this.serviceForm as Service).subscribe({
        next: () => {
          this.alertService.created('Service', serviceName);
          this.loadData();
          this.closeModal();
        },
        error: () => this.alertService.error('Failed to create service. Please try again.')
      });
    } else {
      this.dataService.updateService(this.serviceForm as Service).subscribe({
        next: () => {
          this.alertService.updated('Service', serviceName);
          this.loadData();
          this.closeModal();
        },
        error: () => this.alertService.error('Failed to update service. Please try again.')
      });
    }
  }

  async deleteService(service: Service) {
    const confirmed = await this.alertService.confirmDelete(service.name, 'Service');
    if (confirmed) {
      this.dataService.deleteService(service.id).subscribe({
        next: () => {
          this.services = this.services.filter(s => s.id !== service.id);
          this.alertService.deleted('Service', service.name);
        },
        error: () => this.alertService.error('Failed to delete service. Please try again.')
      });
    }
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
      consumables: [],
      isActive: true
    };
  }

  // Consumable management
  addConsumable() {
    if (!this.serviceForm.consumables) this.serviceForm.consumables = [];
    this.serviceForm.consumables.push({ inventoryItemId: '', quantity: 1 });
  }

  removeConsumable(index: number) {
    this.serviceForm.consumables?.splice(index, 1);
  }

  getInventoryItemName(itemId: string): string {
    return this.inventoryItems.find(i => i.id === itemId)?.name || 'Unknown';
  }

  // Category management
  openCategoryModal() {
    this.showCategoryModal = true;
    this.newCategoryName = '';
    this.editingCategoryId = null;
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
    this.editingCategoryId = null;
  }

  addNewCategory() {
    const name = this.newCategoryName.trim();
    if (!name) return;
    this.dataService.addCategory({ name } as ServiceCategory).subscribe({
      next: (cat) => {
        this.categories.push(cat);
        this.newCategoryName = '';
        this.alertService.toast(`Category "${name}" added`);
      },
      error: () => this.alertService.toast('Failed to add category', 'error')
    });
  }

  startEditCategory(cat: ServiceCategory) {
    this.editingCategoryId = cat.id;
    this.editingCategoryName = cat.name;
  }

  cancelEditCategory() {
    this.editingCategoryId = null;
    this.editingCategoryName = '';
  }

  saveCategory(cat: ServiceCategory) {
    const name = this.editingCategoryName.trim();
    if (!name) return;
    const updated = { ...cat, name };
    this.dataService.updateCategory(updated).subscribe({
      next: () => {
        cat.name = name;
        this.editingCategoryId = null;
        this.alertService.toast(`Category updated`);
      },
      error: () => this.alertService.toast('Failed to update category', 'error')
    });
  }

  async deleteCategory(cat: ServiceCategory) {
    const count = this.getServiceCountForCategory(cat.id);
    if (count > 0) {
      this.alertService.toast('Cannot delete category with existing services', 'error');
      return;
    }
    const confirmed = await this.alertService.confirm(`Delete category "${cat.name}"?`, 'This cannot be undone.');
    if (!confirmed) return;
    this.dataService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== cat.id);
        this.alertService.toast(`Category "${cat.name}" deleted`);
      },
      error: () => this.alertService.toast('Failed to delete category', 'error')
    });
  }

  getServiceCountForCategory(categoryId: string): number {
    return this.services.filter(s => s.categoryId === categoryId).length;
  }
}
