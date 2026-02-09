import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PageHeaderComponent, ModalComponent, StatCardComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Device, Room } from '../../models';
import { getDeviceStatusColor } from '../../utils/status-colors';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent, StatCardComponent],
  templateUrl: './devices.html',
  styleUrl: './devices.scss'
})
export class Devices implements OnInit {
  devices: Device[] = [];
  rooms: Room[] = [];
  showModal = false;
  showLogModal = false;
  isEditMode = false;
  selectedDevice: Device | null = null;

  deviceForm: Partial<Device> = this.getEmptyForm();
  usageLog = {
    counterStart: 0,
    counterEnd: 0,
    notes: ''
  };

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
      devices: this.dataService.getDevices(),
      rooms: this.dataService.getRooms()
    }).subscribe({
      next: ({ devices, rooms }) => {
        this.devices = devices;
        this.rooms = rooms;
      },
      error: () => this.alertService.error('Failed to load devices. Please refresh.')
    });
  }

  openAddModal() {
    this.isEditMode = false;
    this.deviceForm = this.getEmptyForm();
    this.showModal = true;
  }

  openEditModal(device: Device) {
    this.isEditMode = true;
    this.deviceForm = { ...device };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveDevice(form?: NgForm) {
    if (form && form.invalid) {
      form.form.markAllAsTouched();
      this.alertService.validationError('Please fill all required fields');
      return;
    }

    const nameValue = this.deviceForm.name?.trim();
    const modelValue = this.deviceForm.model?.trim();
    const serialValue = this.deviceForm.serialNumber?.trim();
    const counterTypeValue = this.deviceForm.counterType?.trim();

    if (!nameValue) {
      this.alertService.validationError('Device name is required');
      return;
    }
    if (!modelValue) {
      this.alertService.validationError('Model is required');
      return;
    }
    if (!serialValue) {
      this.alertService.validationError('Serial number is required');
      return;
    }
    if (!counterTypeValue) {
      this.alertService.validationError('Counter type is required');
      return;
    }
    if (!this.deviceForm.maintenanceThreshold || this.deviceForm.maintenanceThreshold < 1) {
      this.alertService.validationError('Maintenance threshold must be at least 1');
      return;
    }

    const deviceName = this.deviceForm.name || 'Device';
    if (!this.isEditMode) {
      this.dataService.addDevice(this.deviceForm as Device).subscribe({
        next: () => {
          this.alertService.created('Device', deviceName);
          this.loadData();
          this.closeModal();
        },
        error: () => this.alertService.toast('Failed to save device', 'error')
      });
    } else {
      this.dataService.updateDevice(this.deviceForm as Device).subscribe({
        next: () => {
          this.alertService.updated('Device', deviceName);
          this.loadData();
          this.closeModal();
        },
        error: () => this.alertService.toast('Failed to update device', 'error')
      });
    }
  }

  async deleteDevice(device: Device) {
    const confirmed = await this.alertService.confirmDelete(device.name, 'Device');
    if (confirmed) {
      this.dataService.deleteDevice(device.id).subscribe({
        next: () => {
          this.devices = this.devices.filter(d => d.id !== device.id);
          this.alertService.deleted('Device', device.name);
          this.cdr.detectChanges();
        },
        error: () => this.alertService.toast('Failed to delete device', 'error')
      });
    }
  }

  openLogModal(device: Device) {
    this.selectedDevice = device;
    this.usageLog = {
      counterStart: device.currentCounter,
      counterEnd: device.currentCounter,
      notes: ''
    };
    this.showLogModal = true;
  }

  closeLogModal() {
    this.showLogModal = false;
    this.selectedDevice = null;
  }

  logUsage() {
    if (this.selectedDevice && this.usageLog.counterEnd > this.usageLog.counterStart) {
      const usedPulses = this.usageLog.counterEnd - this.usageLog.counterStart;
      this.dataService.updateDeviceCounter(this.selectedDevice.id, this.usageLog.counterEnd).subscribe({
        next: () => {
          this.alertService.toast(`Logged ${usedPulses.toLocaleString()} units for ${this.selectedDevice!.name}`, 'success');
          this.loadData();
        },
        error: () => this.alertService.toast('Failed to update device counter', 'error')
      });
    }
    this.closeLogModal();
  }

  getEmptyForm(): Partial<Device> {
    return {
      name: '',
      model: '',
      serialNumber: '',
      roomId: '',
      counterType: 'pulse',
      currentCounter: 0,
      maintenanceThreshold: 50000,
      purchaseDate: new Date(),
      status: 'active'
    };
  }

  getRoomName(roomId?: string): string {
    if (!roomId) return 'Unassigned';
    return this.rooms.find(r => r.id === roomId)?.name || 'Unknown';
  }

  getMaintenancePercentage(device: Device): number {
    return Math.min((device.currentCounter / device.maintenanceThreshold) * 100, 100);
  }

  isNearMaintenance(device: Device): boolean {
    return this.getMaintenancePercentage(device) >= 90;
  }

  getStatusColor(status: string): string {
    return getDeviceStatusColor(status);
  }

  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  getDevicesNearMaintenance(): number {
    return this.devices.filter(d => this.isNearMaintenance(d)).length;
  }

  getTotalDevices(): number {
    return this.devices.length;
  }

  getActiveDevices(): number {
    return this.devices.filter(d => d.status === 'active').length;
  }
}
