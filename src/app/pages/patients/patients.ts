import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PageHeaderComponent, DataTableComponent, ModalComponent, TableColumn } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { WalletService } from '../../services/wallet.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Patient, PatientWallet, ServiceCredit, Appointment } from '../../models';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent, DataTableComponent, ModalComponent],
  templateUrl: './patients.html',
  styleUrl: './patients.scss'
})
export class Patients implements OnInit {
  patients: Patient[] = [];
  loading = true;
  selectedPatient: Patient | null = null;
  selectedWallet: PatientWallet | null = null;

  showModal = false;
  showDetailPanel = false;
  isEditMode = false;
  showTopUpModal = false;
  topUpAmount = 0;

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
        this.loading = false;
      },
      error: () => this.alertService.error('Failed to load patients. Please refresh.')
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
    if (this.isEditMode && this.patientForm.id) {
      this.dataService.updatePatient(this.patientForm as Patient).subscribe({
        next: () => {
          this.alertService.updated('Patient', patientName);
          this.loadPatients();
          this.closeModal();
        },
        error: () => this.alertService.toast('Failed to update patient', 'error')
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
        },
        error: () => this.alertService.toast('Failed to create patient', 'error')
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
        error: () => this.alertService.toast('Failed to delete patient', 'error')
      });
    }
  }

  viewPatientDetails(patient: Patient) {
    this.selectedPatient = patient;
    this.showDetailPanel = true;
    this.loadWallet(patient.id);
  }

  loadWallet(patientId: string) {
    this.walletService.getWallet(patientId).subscribe({
      next: wallet => {
        this.selectedWallet = wallet;
      },
      error: () => this.alertService.error('Failed to load wallet data.')
    });
  }

  closeDetailPanel() {
    this.showDetailPanel = false;
    this.selectedPatient = null;
    this.selectedWallet = null;
  }

  // Wallet Actions
  openTopUpModal() {
    this.topUpAmount = 0;
    this.showTopUpModal = true;
  }

  closeTopUpModal() {
    this.showTopUpModal = false;
  }

  confirmTopUp(form?: NgForm) {
    if (form && form.invalid) {
      form.form.markAllAsTouched();
      this.alertService.validationError('Please enter a valid amount');
      return;
    }

    if (!this.selectedPatient) {
      this.alertService.validationError('Select a patient before topping up');
      return;
    }
    if (this.topUpAmount <= 0) {
      this.alertService.validationError('Top up amount must be greater than 0');
      return;
    }

    if (this.selectedPatient && this.topUpAmount > 0) {
      const patientName = `${this.selectedPatient.firstName} ${this.selectedPatient.lastName}`;
      this.walletService.addCashBalance(this.selectedPatient.id, this.topUpAmount).pipe(
        switchMap(() => this.dataService.addPatientTransaction({
          patientId: this.selectedPatient!.id,
          date: new Date(),
          type: 'wallet_topup',
          description: 'Wallet top-up',
          amount: this.topUpAmount,
          method: 'cash'
        }))
      ).subscribe({
        next: () => {
          this.loadWallet(this.selectedPatient!.id);
          this.alertService.walletTopUp(this.topUpAmount, patientName);
          this.closeTopUpModal();
        },
        error: () => this.alertService.toast('Failed to top up wallet', 'error')
      });
    }
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
      notes: ''
    };
  }

  joinArray(arr?: string[]): string {
    return (arr || []).join(', ');
  }

  splitText(text: string): string[] {
    return text.split(',').map(s => s.trim()).filter(s => s.length > 0);
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
}
