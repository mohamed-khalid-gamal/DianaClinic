import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent, ModalComponent, StatCardComponent } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Device, Room } from '../../models';

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
    private alertService: SweetAlertService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dataService.getDevices().subscribe(devices => this.devices = devices);
    this.dataService.getRooms().subscribe(rooms => this.rooms = rooms);
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

  saveDevice() {
    const deviceName = this.deviceForm.name || 'Device';
    if (!this.isEditMode) {
      this.dataService.addDevice(this.deviceForm as Device);
      this.alertService.created('Device', deviceName);
    } else {
      this.alertService.updated('Device', deviceName);
    }
    this.loadData();
    this.closeModal();
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
      this.dataService.updateDeviceCounter(this.selectedDevice.id, this.usageLog.counterEnd);
      const usedPulses = this.usageLog.counterEnd - this.usageLog.counterStart;
      this.alertService.toast(`Logged ${usedPulses.toLocaleString()} units for ${this.selectedDevice.name}`, 'success');
      this.loadData();
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
    const colors: { [key: string]: string } = {
      'active': 'var(--success)',
      'maintenance': 'var(--warning)',
      'inactive': 'var(--danger)'
    };
    return colors[status] || 'var(--secondary-color)';
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
