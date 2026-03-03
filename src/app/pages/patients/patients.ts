import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PageHeaderComponent } from '../../components/shared/page-header.component';
import { DataTableComponent, TableColumn } from '../../components/shared/data-table.component';
import { ModalComponent } from '../../components/shared/modal.component';
import { DataService } from '../../services/data.service';
import { WalletService } from '../../services/wallet.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { FormErrorService } from '../../services/form-error.service';
import { Patient, PatientWallet, ServiceCredit, Appointment, Session } from '../../models';
import { TagInputComponent } from '../../components/shared/tag-input.component';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent, DataTableComponent, ModalComponent, TagInputComponent],
  templateUrl: './patients.html',
  styleUrl: './patients.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Patients implements OnInit {
  patients: Patient[] = [];
  loading = true;
  saving = false;
  selectedPatient: Patient | null = null;
  selectedWallet: PatientWallet | null = null;
  patientSessions: Session[] = [];

  showModal = false;
  showDetailPanel = false;
  isEditMode = false;

  columns: TableColumn[] = [
    { key: 'fullName', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'age', label: 'Age', width: '80px' },
    { key: 'gender', label: 'Gender', type: 'badge', width: '100px' },
    { key: 'skinType', label: 'Skin Type', width: '100px' },
    { key: 'lastVisit', label: 'Last Visit', type: 'date' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '100px' }
  ];

  patientForm: Partial<Patient> = this.getEmptyForm();

  constructor(
    private dataService: DataService,
    private walletService: WalletService,
    private alertService: SweetAlertService,
    private formErrorService: FormErrorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadPatients();
  }

  loadPatients() {
    forkJoin({
      patients: this.dataService.getPatients(),
      appointments: this.dataService.getAppointments()
    }).subscribe({
      next: ({ patients, appointments }) => {
        this.patients = patients.map(p => {
          const patientApts = appointments
            .filter(a => a.patientId === p.id && (a.status === 'completed' || a.status === 'billed'))
            .sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime());
          return {
            ...p,
            fullName: `${p.firstName} ${p.lastName}`,
            age: this.calculateAge(p.dateOfBirth),
            lastVisit: patientApts.length > 0 ? new Date(patientApts[0].scheduledStart) : undefined
          };
        });

        // Update selectedPatient reference if it exists
        if (this.selectedPatient) {
          const updatedSelected = this.patients.find(p => p.id === this.selectedPatient!.id);
          if (updatedSelected) {
            this.selectedPatient = updatedSelected;
          }
        }

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      } // Handled globally
    });
  }

  calculateAge(dob: Date): number {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  openAddModal() {
    this.isEditMode = false;
    this.patientForm = this.getEmptyForm();
    this.showModal = true;
  }

  openEditModal(patient: Patient) {
    this.isEditMode = true;
    this.patientForm = { ...patient };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  savePatient(form?: NgForm) {
    if (form && form.invalid) {
      form.form.markAllAsTouched();
      this.alertService.validationError('Please fill all required fields');
      return;
    }

    const firstName = this.patientForm.firstName?.trim();
    const lastName = this.patientForm.lastName?.trim();
    const phone = this.patientForm.phone?.trim();

    if (!firstName) {
      this.alertService.validationError('First name is required');
      return;
    }
    if (!lastName) {
      this.alertService.validationError('Last name is required');
      return;
    }
    if (!phone) {
      this.alertService.validationError('Phone is required');
      return;
    }
    if (!this.patientForm.dateOfBirth) {
      this.alertService.validationError('Date of birth is required');
      return;
    }
    if (!this.patientForm.gender) {
      this.alertService.validationError('Gender is required');
      return;
    }

    const patientName = `${this.patientForm.firstName} ${this.patientForm.lastName}`;
    this.saving = true;
    if (this.isEditMode && this.patientForm.id) {
      this.dataService.updatePatient(this.patientForm as Patient).subscribe({
        next: () => {
          this.alertService.updated('Patient', patientName);
          this.loadPatients();
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
      this.dataService.addPatient({
        ...this.patientForm,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Patient).subscribe({
        next: () => {
          this.alertService.created('Patient', patientName);
          this.loadPatients();
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

  async deletePatient(patient: Patient) {
    const patientName = `${patient.firstName} ${patient.lastName}`;
    const confirmed = await this.alertService.confirmDelete(patientName, 'Patient');
    if (confirmed) {
      this.dataService.deletePatient(patient.id).subscribe({
        next: () => {
          this.patients = this.patients.filter(p => p.id !== patient.id);
          this.alertService.deleted('Patient', patientName);
          this.cdr.markForCheck();
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 409 || err.status === 400) {
            const message = typeof err.error === 'string' ? err.error : this.formErrorService.getErrorSummary(err);
            this.alertService.error('Deletion Failed', message);
          }
          // Other errors (500 etc) handled globally
        }
      });
    }
  }

  viewPatientDetails(patient: Patient) {
    this.selectedPatient = patient;
    this.showDetailPanel = true;
    this.loadWallet(patient.id);
    this.loadSessions(patient.id);
    this.cdr.markForCheck();
  }

  loadSessions(patientId: string) {
    this.dataService.getSessions().subscribe({
      next: (sessions) => {
        // Filter sessions for this patient and sort by date desc
        this.patientSessions = sessions
          .filter(s => s.patientId === patientId)
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        this.cdr.markForCheck();
      },
      error: () => {}
    });


  }

  loadWallet(patientId: string) {
    this.walletService.getWallet(patientId).subscribe({
      next: wallet => {
        this.selectedWallet = wallet;
        this.cdr.markForCheck();
      },
      error: () => {} // Handled globally
    });
  }

  closeDetailPanel() {
    this.showDetailPanel = false;
    this.selectedPatient = null;
    this.selectedWallet = null;
    this.patientSessions = [];
    this.cdr.markForCheck();
  }

  getTotalCredits(): number {
    if (!this.selectedWallet) return 0;
    return this.selectedWallet.credits.reduce((sum, c) => sum + c.remaining, 0);
  }

  formatCreditExpiry(credit: ServiceCredit): string {
    if (!credit.expiresAt) return 'No Expiry';
    return new Date(credit.expiresAt).toLocaleDateString();
  }

  getEmptyForm(): Partial<Patient> {
    return {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      dateOfBirth: new Date(),
      gender: 'female',
      skinType: 3,
      allergies: [],
      chronicConditions: [],
      contraindications: [],
      tags: [],
      notes: ''
    };
  }

  getSkinTypeLabel(type?: number): string {
    const labels: { [key: number]: string } = {
      1: 'Type I - Very Fair',
      2: 'Type II - Fair',
      3: 'Type III - Medium',
      4: 'Type IV - Olive',
      5: 'Type V - Brown',
      6: 'Type VI - Dark'
    };
    return labels[type || 3] || 'Unknown';
  }

  get sessionNotes() {
    return this.patientSessions
      .filter(s => !!s.clinicalNotes)
      .map(s => ({
        date: s.startTime,
        note: s.clinicalNotes
      }));
  }

  get galleryPhotos() {
    const photos: { url: string; type: 'before' | 'after'; date: Date; sessionId: string }[] = [];
    this.patientSessions.forEach(session => {
      if (session.beforePhotos?.length) {
        session.beforePhotos.forEach(url => {
          photos.push({ url, type: 'before', date: session.startTime, sessionId: session.id });
        });
      }
      if (session.afterPhotos?.length) {
        session.afterPhotos.forEach(url => {
          photos.push({ url, type: 'after', date: session.startTime, sessionId: session.id });
        });
      }
    });
    return photos;
  }
}
