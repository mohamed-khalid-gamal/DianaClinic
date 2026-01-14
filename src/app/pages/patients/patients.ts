import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent, DataTableComponent, ModalComponent, TableColumn } from '../../components/shared';
import { DataService } from '../../services/data.service';
import { WalletService } from '../../services/wallet.service';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { Patient, PatientWallet, ServiceCredit } from '../../models';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent, DataTableComponent, ModalComponent],
  templateUrl: './patients.html',
  styleUrl: './patients.scss'
})
export class Patients implements OnInit {
  patients: Patient[] = [];
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
    this.dataService.getPatients().subscribe(patients => {
      this.patients = patients.map(p => ({
        ...p,
        fullName: `${p.firstName} ${p.lastName}`,
        age: this.calculateAge(p.dateOfBirth),
        lastVisit: new Date() // Mock
      }));
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

  savePatient() {
    const patientName = `${this.patientForm.firstName} ${this.patientForm.lastName}`;
    if (this.isEditMode && this.patientForm.id) {
      this.dataService.updatePatient(this.patientForm as Patient);
      this.alertService.updated('Patient', patientName);
    } else {
      this.dataService.addPatient({
        ...this.patientForm,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Patient);
      this.alertService.created('Patient', patientName);
    }
    this.loadPatients();
    this.closeModal();
  }

  async deletePatient(patient: Patient) {
    const patientName = `${patient.firstName} ${patient.lastName}`;
    const confirmed = await this.alertService.confirmDelete(patientName, 'Patient');
    if (confirmed) {
      this.dataService.deletePatient(patient.id);
      // Immediately update local array for instant UI refresh
      this.patients = this.patients.filter(p => p.id !== patient.id);
      this.alertService.deleted('Patient', patientName);
    }
    this.cdr.markForCheck();
  }

  viewPatientDetails(patient: Patient) {
    this.selectedPatient = patient;
    this.showDetailPanel = true;
    this.loadWallet(patient.id);
  }

  loadWallet(patientId: string) {
    this.walletService.getWallet(patientId).subscribe(wallet => {
      this.selectedWallet = wallet;
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

  confirmTopUp() {
    if (this.selectedPatient && this.topUpAmount > 0) {
      const patientName = `${this.selectedPatient.firstName} ${this.selectedPatient.lastName}`;
      this.walletService.addCashBalance(this.selectedPatient.id, this.topUpAmount);
      this.loadWallet(this.selectedPatient.id);
      this.alertService.walletTopUp(this.topUpAmount, patientName);
      this.closeTopUpModal();
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
