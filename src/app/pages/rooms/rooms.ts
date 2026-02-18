import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { PageHeaderComponent, DataTableComponent, ModalComponent, TableColumn } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { FormErrorService } from '../../services/form-error.service';
import { Room, RoomType } from '../../models';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, DataTableComponent, ModalComponent],
  templateUrl: './rooms.html',
  styleUrl: './rooms.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Rooms implements OnInit {
  loading = true;
  saving = false;
  rooms: Room[] = [];
  roomTypes: RoomType[] = [];
  showModal = false;
  isEditMode = false;
  showRoomTypeModal = false;
  newRoomTypeName = '';
  editingRoomTypeId: string | null = null;
  editingRoomTypeName = '';

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
    private formErrorService: FormErrorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    forkJoin({
      rooms: this.dataService.getRooms(),
      roomTypes: this.dataService.getRoomTypes()
    }).subscribe({
      next: ({ rooms, roomTypes }) => {
        this.rooms = rooms.map(r => ({
          ...r,
          status: r.isActive ? 'Available' : 'Unavailable'
        }));
        this.roomTypes = roomTypes;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadRooms() {
    this.dataService.getRooms().subscribe({
      next: rooms => {
        this.rooms = rooms.map(r => ({
          ...r,
          status: r.isActive ? 'Available' : 'Unavailable'
        }));
        this.cdr.markForCheck();
      }
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
      this.alertService.validationError('Please correct the highlighted errors before saving');
      return;
    }

    const roomNameValue = this.roomForm.name?.trim();
    const roomTypeValue = this.roomForm.type?.trim();

    if (!roomNameValue) {
      this.alertService.validationError('Room name is required');
      return;
    }
    if (roomNameValue.length < 2) {
      this.alertService.validationError('Room name must be at least 2 characters');
      return;
    }
    if (!roomTypeValue) {
      this.alertService.validationError('Room type is required');
      return;
    }
    if (this.roomForm.capacity !== undefined && (this.roomForm.capacity < 1 || this.roomForm.capacity > 10)) {
      this.alertService.validationError('Capacity must be between 1 and 10');
      return;
    }

    const roomName = this.roomForm.name || 'Room';
    this.saving = true;
    if (!this.isEditMode) {
      this.dataService.addRoom(this.roomForm as Room).subscribe({
        next: () => {
          this.alertService.created('Room', roomName);
          this.loadRooms();
          this.closeModal();
          this.saving = false;
          this.cdr.markForCheck();
        },
        error: (err: HttpErrorResponse) => {
          this.formErrorService.handleBackendErrors(err, form);
          this.saving = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.dataService.updateRoom(this.roomForm as Room).subscribe({
        next: () => {
          this.alertService.updated('Room', roomName);
          this.loadRooms();
          this.closeModal();
          this.saving = false;
          this.cdr.markForCheck();
        },
        error: (err: HttpErrorResponse) => {
          this.formErrorService.handleBackendErrors(err, form);
          this.saving = false;
          this.cdr.markForCheck();
        }
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

  // Room Type management
  openRoomTypeModal() {
    this.showRoomTypeModal = true;
    this.newRoomTypeName = '';
    this.editingRoomTypeId = null;
  }

  closeRoomTypeModal() {
    this.showRoomTypeModal = false;
    this.editingRoomTypeId = null;
  }

  addNewRoomType() {
    const name = this.newRoomTypeName.trim();
    if (!name) return;
    this.dataService.addRoomType({ name } as RoomType).subscribe({
      next: (rt) => {
        this.roomTypes.push(rt);
        this.newRoomTypeName = '';
        this.alertService.toast(`Room type "${name}" added`);
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }

  startEditRoomType(rt: RoomType) {
    this.editingRoomTypeId = rt.id;
    this.editingRoomTypeName = rt.name;
  }

  cancelEditRoomType() {
    this.editingRoomTypeId = null;
    this.editingRoomTypeName = '';
  }

  saveRoomType(rt: RoomType) {
    const name = this.editingRoomTypeName.trim();
    if (!name) return;
    const updated = { ...rt, name };
    this.dataService.updateRoomType(updated).subscribe({
      next: () => {
        rt.name = name;
        this.editingRoomTypeId = null;
        this.alertService.toast(`Room type updated`);
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }

  async deleteRoomType(rt: RoomType) {
    // Check if any rooms are using this type
    const count = this.rooms.filter(r => r.type === rt.name).length;
    if (count > 0) {
      this.alertService.toast('Cannot delete room type with existing rooms', 'error');
      return;
    }
    const confirmed = await this.alertService.confirm(`Delete room type "${rt.name}"?`, 'This cannot be undone.');
    if (!confirmed) return;
    this.dataService.deleteRoomType(rt.id).subscribe({
      next: () => {
        this.roomTypes = this.roomTypes.filter(r => r.id !== rt.id);
        this.alertService.toast(`Room type "${rt.name}" deleted`);
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }

  joinArray(arr?: string[]): string {
    return (arr || []).join(', ');
  }

  splitText(text: string): string[] {
    return text.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }
}
