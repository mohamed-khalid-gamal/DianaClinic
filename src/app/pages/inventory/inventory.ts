import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import { PageHeaderComponent, DataTableComponent, ModalComponent, StatCardComponent, TableColumn, NotificationsPanelComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { AlertService } from '../../services/alert.service';
import { InventoryItem, InventoryCategory } from '../../models';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, DataTableComponent, ModalComponent, StatCardComponent, NotificationsPanelComponent],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Inventory implements OnInit, OnDestroy {
  items: InventoryItem[] = [];
  categories: InventoryCategory[] = [];
  showModal = false;
  isEditMode = false;
  activeFilter = 'all';
  showNotifications = false;
  alertCount = 0;
  private alertSub?: Subscription;

  // Category management
  showCategoryModal = false;
  newCategoryName = '';
  editingCategoryId: string | null = null;
  editingCategoryName = '';

  columns: TableColumn[] = [
    { key: 'name', label: 'Product Name' },
    { key: 'sku', label: 'SKU', width: '100px' },
    { key: 'categoryName', label: 'Category', type: 'badge', width: '120px' },
    { key: 'quantity', label: 'Qty', width: '80px' },
    { key: 'costPrice', label: 'Cost', type: 'currency', width: '100px' },
    { key: 'sellingPrice', label: 'Price', type: 'currency', width: '100px' },
    { key: 'expiryDate', label: 'Expiry', type: 'date', width: '120px' },
    { key: 'stockStatus', label: 'Status', type: 'badge', width: '100px' },
    { key: 'actions', label: '', type: 'actions', width: '100px' }
  ];

  itemForm: Partial<InventoryItem> = this.getEmptyForm();

  constructor(
    private dataService: DataService,
    private sweetAlert: SweetAlertService,
    private notificationService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
    this.alertSub = this.notificationService.getAlertCount('inventory').subscribe(count => {
      this.alertCount = count;
    });
  }

  ngOnDestroy() {
    this.alertSub?.unsubscribe();
  }

  loadData() {
    forkJoin({
      items: this.dataService.getInventory(),
      categories: this.dataService.getInventoryCategories()
    }).subscribe({
      next: ({ items, categories }) => {
        this.categories = categories;
        this.items = items.map(item => ({
          ...item,
          stockStatus: this.getStockStatus(item),
          categoryName: this.getCategoryName(item.category)
        }));
        this.cdr.detectChanges();
      },
      error: () => {} // Handled globally
    });
  }

  getCategoryName(categoryId: string): string {
    return this.categories.find(c => c.id === categoryId)?.name || categoryId;
  }

  get filteredItems(): InventoryItem[] {
    if (this.activeFilter === 'all') return this.items;
    if (this.activeFilter === 'low') return this.items.filter(i => i.quantity <= i.reorderThreshold);
    if (this.activeFilter === 'expiring') return this.items.filter(i => this.isExpiringSoon(i));
    return this.items.filter(i => i.category === this.activeFilter);
  }

  getStockStatus(item: InventoryItem): string {
    if (item.quantity === 0) return 'Out of Stock';
    if (item.quantity <= item.reorderThreshold) return 'Low Stock';
    if (this.isExpiringSoon(item)) return 'Expiring';
    return 'In Stock';
  }

  isExpiringSoon(item: InventoryItem): boolean {
    if (!item.expiryDate) return false;
    const daysUntil = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil > 0;
  }

  openAddModal() {
    this.isEditMode = false;
    this.itemForm = this.getEmptyForm();
    this.showModal = true;
  }

  openEditModal(item: InventoryItem) {
    this.isEditMode = true;
    this.itemForm = { ...item };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveItem(form?: NgForm) {
    if (form && form.invalid) {
      form.form.markAllAsTouched();
      this.sweetAlert.validationError('Please fill all required fields');
      return;
    }

    const nameValue = this.itemForm.name?.trim();
    const skuValue = this.itemForm.sku?.trim();

    if (!nameValue) {
      this.sweetAlert.validationError('Product name is required');
      return;
    }
    if (!skuValue) {
      this.sweetAlert.validationError('SKU is required');
      return;
    }
    if (!this.itemForm.category) {
      this.sweetAlert.validationError('Category is required');
      return;
    }
    if (this.itemForm.quantity == null || this.itemForm.quantity < 0) {
      this.sweetAlert.validationError('Quantity must be 0 or more');
      return;
    }

    const itemName = this.itemForm.name || 'Item';
    if (!this.isEditMode) {
      this.dataService.addInventoryItem(this.itemForm as InventoryItem).subscribe({
        next: () => {
          this.sweetAlert.created('Inventory Item', itemName);
          this.loadData();
          this.closeModal();
        },
        error: () => {} // Handled globally
      });
    } else {
      this.dataService.updateInventoryItem(this.itemForm as InventoryItem).subscribe({
        next: () => {
          this.sweetAlert.updated('Inventory Item', itemName);
          this.loadData();
          this.closeModal();
        },
        error: () => {} // Handled globally
      });
    }
  }

  async deleteItem(item: InventoryItem) {
    const confirmed = await this.sweetAlert.confirmDelete(item.name, 'Inventory Item');
    if (confirmed) {
      this.dataService.deleteInventoryItem(item.id).subscribe({
        next: () => {
          this.items = this.items.filter(i => i.id !== item.id);
          this.sweetAlert.deleted('Inventory Item', item.name);
          this.cdr.detectChanges();
        },
        error: () => {} // Handled globally
      });
    }
  }

  getEmptyForm(): Partial<InventoryItem> {
    return {
      name: '',
      sku: '',
      category: '',
      quantity: 0,
      unit: 'piece',
      costPrice: 0,
      sellingPrice: 0,
      reorderThreshold: 10,
      expiryDate: undefined,
      batchNumber: '',
      supplier: '',
      location: ''
    };
  }

  getTotalItems(): number {
    return this.items.length;
  }

  getLowStockCount(): number {
    return this.items.filter(i => i.quantity <= i.reorderThreshold).length;
  }

  getExpiringCount(): number {
    return this.items.filter(i => this.isExpiringSoon(i)).length;
  }

  getTotalValue(): number {
    return this.items.reduce((sum, i) => sum + (i.costPrice * i.quantity), 0);
  }

  // Category Management Methods
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
    this.dataService.addInventoryCategory({ name } as InventoryCategory).subscribe({
      next: (cat) => {
        this.categories.push(cat);
        this.newCategoryName = '';
        this.sweetAlert.toast(`Category "${name}" added`);
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }

  startEditCategory(cat: InventoryCategory) {
    this.editingCategoryId = cat.id;
    this.editingCategoryName = cat.name;
  }

  cancelEditCategory() {
    this.editingCategoryId = null;
    this.editingCategoryName = '';
  }

  saveCategory(cat: InventoryCategory) {
    const name = this.editingCategoryName.trim();
    if (!name) return;
    const updated = { ...cat, name };
    this.dataService.updateInventoryCategory(updated).subscribe({
      next: () => {
        cat.name = name;
        this.editingCategoryId = null;
        this.sweetAlert.toast(`Category updated`);
        this.loadData(); // Reload to update category names on items
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }

  async deleteCategory(cat: InventoryCategory) {
    const count = this.getItemCountForCategory(cat.id);
    if (count > 0) {
      this.sweetAlert.toast('Cannot delete category with existing items', 'error');
      return;
    }
    const confirmed = await this.sweetAlert.confirm(`Delete category "${cat.name}"?`, 'This cannot be undone.');
    if (!confirmed) return;
    this.dataService.deleteInventoryCategory(cat.id).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== cat.id);
        this.sweetAlert.toast(`Category "${cat.name}" deleted`);
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }

  getItemCountForCategory(categoryId: string): number {
    return this.items.filter(i => i.category === categoryId).length;
  }
}
