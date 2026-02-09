import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { PageHeaderComponent, DataTableComponent, ModalComponent, TableColumn } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Room } from '../../models';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, DataTableComponent, ModalComponent],
  templateUrl: './rooms.html',
  styleUrl: './rooms.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Rooms implements OnInit {
  rooms: Room[] = [];
  showModal = false;
  isEditMode = false;

  columns: TableColumn[] = [
    { key: 'name', label: 'Room Name' },
    { key: 'type', label: 'Type', type: 'badge' },
    { key: 'floor', label: 'Floor', width: '80px' },
    { key: 'capacity', label: 'Capacity', width: '100px' },
    { key: 'status', label: 'Status', type: 'badge', width: '100px' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '100px' }
  ];

  roomForm: Partial<Room> = this.getEmptyForm();

  constructor(
    private dataService: DataService,
    private alertService: SweetAlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadRooms();
  }

  loadRooms() {
    this.dataService.getRooms().subscribe({
      next: rooms => {
        this.rooms = rooms.map(r => ({
          ...r,
          status: r.isActive ? 'Available' : 'Unavailable'
        }));
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }

  openAddModal() {
    this.isEditMode = false;
    this.roomForm = this.getEmptyForm();
    this.showModal = true;
  }

  openEditModal(room: Room) {
    this.isEditMode = true;
    this.roomForm = { ...room };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveRoom(form?: NgForm) {
    if (form && form.invalid) {
      form.form.markAllAsTouched();
      this.alertService.validationError('Please fill all required fields');
      return;
    }

    const roomNameValue = this.roomForm.name?.trim();
    const roomTypeValue = this.roomForm.type?.trim();

    if (!roomNameValue) {
      this.alertService.validationError('Room name is required');
      return;
    }
    if (!roomTypeValue) {
      this.alertService.validationError('Room type is required');
      return;
    }

    const roomName = this.roomForm.name || 'Room';
    if (!this.isEditMode) {
      this.dataService.addRoom(this.roomForm as Room).subscribe({
        next: () => {
          this.alertService.created('Room', roomName);
          this.loadRooms();
          this.closeModal();
          this.cdr.markForCheck();
        },
        error: () => {} // Handled globally
      });
    } else {
      this.dataService.updateRoom(this.roomForm as Room).subscribe({
        next: () => {
          this.alertService.updated('Room', roomName);
          this.loadRooms();
          this.closeModal();
          this.cdr.markForCheck();
        },
        error: () => {} // Handled globally
      });
    }
  }

  async deleteRoom(room: Room) {
    const confirmed = await this.alertService.confirmDelete(room.name, 'Room');
    if (confirmed) {
      this.dataService.deleteRoom(room.id).subscribe({
        next: () => {
          this.rooms = this.rooms.filter(r => r.id !== room.id);
          this.alertService.deleted('Room', room.name);
          this.cdr.markForCheck();
        },
        error: () => {} // Handled globally
      });
    }
  }

  getEmptyForm(): Partial<Room> {
    return {
      name: '',
      type: 'treatment',
      floor: '',
      equipment: [],
      capacity: 1,
      isActive: true
    };
  }

  joinArray(arr?: string[]): string {
    return (arr || []).join(', ');
  }

  splitText(text: string): string[] {
    return text.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }
}
