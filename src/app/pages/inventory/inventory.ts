import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { PageHeaderComponent, DataTableComponent, ModalComponent, StatCardComponent, TableColumn } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { InventoryItem } from '../../models';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, DataTableComponent, ModalComponent, StatCardComponent],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss'
})
export class Inventory implements OnInit {
  items: InventoryItem[] = [];
  showModal = false;
  isEditMode = false;
  activeFilter = 'all';

  columns: TableColumn[] = [
    { key: 'name', label: 'Product Name' },
    { key: 'sku', label: 'SKU', width: '100px' },
    { key: 'category', label: 'Category', type: 'badge', width: '120px' },
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
    private alertService: SweetAlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.dataService.getInventory().subscribe({
      next: items => {
        this.items = items.map(item => ({
          ...item,
          stockStatus: this.getStockStatus(item)
        }));
      },
      error: () => this.alertService.error('Failed to load inventory. Please refresh.')
    });
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
      this.alertService.validationError('Please fill all required fields');
      return;
    }

    const nameValue = this.itemForm.name?.trim();
    const skuValue = this.itemForm.sku?.trim();

    if (!nameValue) {
      this.alertService.validationError('Product name is required');
      return;
    }
    if (!skuValue) {
      this.alertService.validationError('SKU is required');
      return;
    }
    if (!this.itemForm.category) {
      this.alertService.validationError('Category is required');
      return;
    }
    if (this.itemForm.quantity == null || this.itemForm.quantity < 0) {
      this.alertService.validationError('Quantity must be 0 or more');
      return;
    }

    const itemName = this.itemForm.name || 'Item';
    if (!this.isEditMode) {
      this.dataService.addInventoryItem(this.itemForm as InventoryItem).subscribe({
        next: () => {
          this.alertService.created('Inventory Item', itemName);
          this.loadItems();
          this.closeModal();
        },
        error: () => this.alertService.error('Failed to create item. Please try again.')
      });
    } else {
      this.dataService.updateInventoryItem(this.itemForm as InventoryItem).subscribe({
        next: () => {
          this.alertService.updated('Inventory Item', itemName);
          this.loadItems();
          this.closeModal();
        },
        error: () => this.alertService.error('Failed to update item. Please try again.')
      });
    }
  }

  async deleteItem(item: InventoryItem) {
    const confirmed = await this.alertService.confirmDelete(item.name, 'Inventory Item');
    if (confirmed) {
      this.dataService.deleteInventoryItem(item.id).subscribe({
        next: () => {
          this.items = this.items.filter(i => i.id !== item.id);
          this.alertService.deleted('Inventory Item', item.name);
          this.cdr.markForCheck();
        },
        error: () => this.alertService.error('Failed to delete item. Please try again.')
      });
    }
  }

  getEmptyForm(): Partial<InventoryItem> {
    return {
      name: '',
      sku: '',
      category: 'consumable',
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
}
