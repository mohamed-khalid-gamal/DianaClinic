import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent, DataTableComponent, ModalComponent, TableColumn } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Doctor } from '../../models';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, DataTableComponent, ModalComponent],
  templateUrl: './doctors.html',
  styleUrl: './doctors.scss'
})
export class Doctors implements OnInit {
  doctors: Doctor[] = [];
  showModal = false;
  isEditMode = false;

  columns: TableColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'specialty', label: 'Specialty' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status', type: 'badge', width: '100px' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '100px' }
  ];

  doctorForm: Partial<Doctor> = this.getEmptyForm();

  rooms: any[] = [];
  days = [
    { id: 0, name: 'Sunday' },
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' }
  ];

  newShift = { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', roomId: '' };

  constructor(
    private dataService: DataService,
    private alertService: SweetAlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDoctors();
    this.dataService.getRooms().subscribe(rooms => this.rooms = rooms);
  }

  loadDoctors() {
    this.dataService.getDoctors().subscribe(doctors => {
      this.doctors = doctors.map(d => ({
        ...d,
        status: d.isActive ? 'Active' : 'Inactive'
      }));
    });
  }

  openAddModal() {
    this.isEditMode = false;
    this.doctorForm = this.getEmptyForm();
    this.showModal = true;
  }

  openEditModal(doctor: Doctor) {
    this.isEditMode = true;
    this.doctorForm = JSON.parse(JSON.stringify(doctor)); // Deep copy
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  addShift() {
    if (!this.doctorForm.workingHours) {
      this.doctorForm.workingHours = [];
    }
    this.doctorForm.workingHours.push({ ...this.newShift });
  }

  removeShift(index: number) {
    this.doctorForm.workingHours?.splice(index, 1);
  }

  getDayName(dayId: number): string {
    return this.days.find(d => d.id === dayId)?.name || 'Unknown';
  }

  getRoomName(roomId: string): string {
    return this.rooms.find(r => r.id === roomId)?.name || 'Any Room';
  }

  saveDoctor() {
    const doctorName = this.doctorForm.name || 'Doctor';
    if (this.isEditMode) {
      // Update
      this.alertService.updated('Doctor', doctorName);
    } else {
      this.dataService.addDoctor(this.doctorForm as Doctor);
      this.alertService.created('Doctor', doctorName);
    }
    this.loadDoctors();
    this.closeModal();
  }

  async deleteDoctor(doctor: Doctor) {
    const confirmed = await this.alertService.confirmDelete(doctor.name, 'Doctor');
    if (confirmed) {
      this.dataService.deleteDoctor(doctor.id);
      // Immediately update local array for instant UI refresh
      this.doctors = this.doctors.filter(d => d.id !== doctor.id);
      this.alertService.deleted('Doctor', doctor.name);
    }
    this.cdr.markForCheck();
  }

  getEmptyForm(): Partial<Doctor> {
    return {
      name: '',
      specialty: '',
      phone: '',
      email: '',
      workingHours: [],
      assignedRooms: [],
      isActive: true
    };
  }
}
