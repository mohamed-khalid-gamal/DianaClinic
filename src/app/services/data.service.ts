import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  Patient, Doctor, Room, Device, InventoryItem,
  ServiceCategory, Service, Offer, Appointment, Alert, PatientWallet, PatientTransaction, PackagePurchase, Session, Invoice
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly apiBase = '/api';

  constructor(private http: HttpClient) {}

  // Patients
  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiBase}/patients`).pipe(
      map(patients => patients.map(patient => this.hydratePatient(patient)))
    );
  }

  getPatient(id: string): Observable<Patient | undefined> {
    return this.http.get<Patient>(`${this.apiBase}/patients/${id}`).pipe(
      map(patient => this.hydratePatient(patient)),
      catchError(() => of(undefined))
    );
  }

  addPatient(patient: Patient): Observable<Patient> {
    const payload = this.toPatientPayload(patient);
    return this.http.post<Patient>(`${this.apiBase}/patients`, payload).pipe(
      map(created => this.hydratePatient(created))
    );
  }

  updatePatient(patient: Patient): Observable<Patient> {
    const payload = this.toPatientPayload(patient);
    return this.http.put<Patient>(`${this.apiBase}/patients/${patient.id}`, payload).pipe(
      map(updated => this.hydratePatient(updated))
    );
  }

  deletePatient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/patients/${id}`);
  }

  // Doctors
  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiBase}/doctors`);
  }

  addDoctor(doctor: Doctor): Observable<Doctor> {
    return this.http.post<Doctor>(`${this.apiBase}/doctors`, doctor);
  }

  updateDoctor(doctor: Doctor): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.apiBase}/doctors/${doctor.id}`, doctor);
  }

  deleteDoctor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/doctors/${id}`);
  }

  // Rooms
  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiBase}/rooms`);
  }

  addRoom(room: Room): Observable<Room> {
    return this.http.post<Room>(`${this.apiBase}/rooms`, room);
  }

  updateRoom(room: Room): Observable<Room> {
    return this.http.put<Room>(`${this.apiBase}/rooms/${room.id}`, room);
  }

  deleteRoom(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/rooms/${id}`);
  }

  // Devices
  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.apiBase}/devices`).pipe(
      map(devices => devices.map(d => ({ ...d, purchaseDate: new Date(d.purchaseDate) })))
    );
  }

  addDevice(device: Device): Observable<Device> {
    return this.http.post<Device>(`${this.apiBase}/devices`, device);
  }

  updateDevice(device: Device): Observable<Device> {
    return this.http.put<Device>(`${this.apiBase}/devices/${device.id}`, device);
  }

  deleteDevice(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/devices/${id}`);
  }

  updateDeviceCounter(deviceId: string, newCounter: number): Observable<Device> {
    return this.http.patch<Device>(`${this.apiBase}/devices/${deviceId}/counter`, { newCounter });
  }

  // Inventory
  getInventory(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.apiBase}/inventory`).pipe(
      map(items => items.map(i => ({ ...i, expiryDate: i.expiryDate ? new Date(i.expiryDate) : undefined })))
    );
  }

  addInventoryItem(item: InventoryItem): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${this.apiBase}/inventory`, item);
  }

  updateInventoryItem(item: InventoryItem): Observable<InventoryItem> {
    return this.http.put<InventoryItem>(`${this.apiBase}/inventory/${item.id}`, item);
  }

  updateInventoryQuantity(itemId: string, quantityChange: number): Observable<InventoryItem> {
    return this.http.patch<InventoryItem>(`${this.apiBase}/inventory/${itemId}/quantity`, { quantityChange });
  }

  deleteInventoryItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/inventory/${id}`);
  }

  // Services & Categories
  getCategories(): Observable<ServiceCategory[]> {
    return this.http.get<ServiceCategory[]>(`${this.apiBase}/services/categories`);
  }

  getServices(): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiBase}/services`);
  }

  addService(service: Service): Observable<Service> {
    return this.http.post<Service>(`${this.apiBase}/services`, service);
  }

  updateService(service: Service): Observable<Service> {
    return this.http.put<Service>(`${this.apiBase}/services/${service.id}`, service);
  }

  deleteService(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/services/${id}`);
  }

  // Categories CRUD
  addCategory(category: ServiceCategory): Observable<ServiceCategory> {
    return this.http.post<ServiceCategory>(`${this.apiBase}/services/categories`, category);
  }

  updateCategory(category: ServiceCategory): Observable<ServiceCategory> {
    return this.http.put<ServiceCategory>(`${this.apiBase}/services/categories/${category.id}`, category);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/services/categories/${id}`);
  }

  // Offers
  getOffers(): Observable<Offer[]> {
    return this.http.get<Offer[]>(`${this.apiBase}/offers`);
  }

  addOffer(offer: Offer): Observable<Offer> {
    return this.http.post<Offer>(`${this.apiBase}/offers`, offer);
  }

  updateOffer(offer: Offer): Observable<Offer> {
    return this.http.put<Offer>(`${this.apiBase}/offers/${offer.id}`, offer);
  }

  deleteOffer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/offers/${id}`);
  }

  // Appointments
  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiBase}/appointments`).pipe(
      map(apts => apts.map(a => ({ ...a, scheduledStart: new Date(a.scheduledStart), scheduledEnd: new Date(a.scheduledEnd), createdAt: new Date(a.createdAt) })))
    );
  }

  getPatientAppointments(patientId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiBase}/appointments/patient/${patientId}`).pipe(
      map(apts => apts.map(a => ({ ...a, scheduledStart: new Date(a.scheduledStart), scheduledEnd: new Date(a.scheduledEnd), createdAt: new Date(a.createdAt) })))
    );
  }

  addAppointment(appointment: Appointment): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiBase}/appointments`, appointment);
  }

  updateAppointment(appointment: Appointment): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiBase}/appointments/${appointment.id}`, appointment);
  }

  updateAppointmentStatus(id: string, status: Appointment['status']): Observable<any> {
    return this.http.patch(`${this.apiBase}/appointments/${id}/status`, { status });
  }

  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/appointments/${id}`);
  }

  // Patient Transactions
  getPatientTransactions(patientId: string): Observable<PatientTransaction[]> {
    return this.http.get<PatientTransaction[]>(`${this.apiBase}/patients/${patientId}/transactions`).pipe(
      map(transactions => transactions.map(transaction => this.hydrateTransaction(transaction)))
    );
  }

  addPatientTransaction(transaction: Omit<PatientTransaction, 'id'>): Observable<PatientTransaction> {
    return this.http.post<PatientTransaction>(
      `${this.apiBase}/patients/${transaction.patientId}/transactions`,
      transaction
    );
  }

  // Package Purchases
  getPatientPackagePurchases(patientId: string): Observable<PackagePurchase[]> {
    return this.http.get<PackagePurchase[]>(`${this.apiBase}/package-purchases/patient/${patientId}`).pipe(
      map(purchases => purchases.map(p => ({ ...p, createdAt: new Date(p.createdAt), paidAt: p.paidAt ? new Date(p.paidAt) : undefined })))
    );
  }

  getPendingPackagePurchases(patientId: string): Observable<PackagePurchase[]> {
    return this.http.get<PackagePurchase[]>(`${this.apiBase}/package-purchases/patient/${patientId}/pending`).pipe(
      map(purchases => purchases.map(p => ({ ...p, createdAt: new Date(p.createdAt), paidAt: p.paidAt ? new Date(p.paidAt) : undefined })))
    );
  }

  addPackagePurchase(purchase: Omit<PackagePurchase, 'id'>): Observable<PackagePurchase> {
    return this.http.post<PackagePurchase>(`${this.apiBase}/package-purchases`, purchase);
  }

  updatePackagePurchaseStatus(purchaseId: string, status: PackagePurchase['status']): Observable<any> {
    return this.http.patch(`${this.apiBase}/package-purchases/${purchaseId}/status`, { status });
  }

  getPackagePurchase(purchaseId: string): Observable<PackagePurchase | undefined> {
    return this.http.get<PackagePurchase>(`${this.apiBase}/package-purchases/${purchaseId}`).pipe(
      map(p => ({ ...p, createdAt: new Date(p.createdAt), paidAt: p.paidAt ? new Date(p.paidAt) : undefined }))
    );
  }

  // Sessions
  getSessions(): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.apiBase}/sessions`);
  }

  getSessionByAppointment(appointmentId: string): Observable<Session | undefined> {
    return this.http.get<Session | null>(`${this.apiBase}/sessions/appointment/${appointmentId}`).pipe(
      map(s => s ?? undefined)
    );
  }

  addSession(session: Omit<Session, 'id'>): Observable<Session> {
    return this.http.post<Session>(`${this.apiBase}/sessions`, session);
  }

  updateSession(sessionId: string, updates: Partial<Session>): Observable<any> {
    return this.http.put(`${this.apiBase}/sessions/${sessionId}`, updates);
  }

  // Invoices
  getInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiBase}/invoices`);
  }

  createInvoice(invoice: Omit<Invoice, 'id'>): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiBase}/invoices`, invoice);
  }

  // Alerts
  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.apiBase}/alerts`);
  }

  markAlertRead(id: string): Observable<any> {
    return this.http.patch(`${this.apiBase}/alerts/${id}/read`, {});
  }

  // Dashboard Stats - computed from live API data
  getDashboardStats(): Observable<any> {
    const today = new Date();
    return forkJoin({
      appointments: this.getAppointments().pipe(catchError(() => of([]))),
      patients: this.getPatients().pipe(catchError(() => of([]))),
      rooms: this.getRooms().pipe(catchError(() => of([]))),
      devices: this.getDevices().pipe(catchError(() => of([]))),
      inventory: this.getInventory().pipe(catchError(() => of([]))),
      alerts: this.getAlerts().pipe(catchError(() => of([])))
    }).pipe(
      map(({ appointments, patients, rooms, devices, inventory, alerts }) => {
        const todayApts = appointments.filter(a => new Date(a.scheduledStart).toDateString() === today.toDateString());
        const inProgressApts = appointments.filter(a => a.status === 'in-progress' || a.status === 'checked-in');
        return {
          todayAppointments: todayApts.length,
          totalPatients: patients.length,
          totalRooms: rooms.length,
          roomsInUse: new Set(inProgressApts.map(a => a.roomId).filter(Boolean)).size,
          devicesNearMaintenance: devices.filter(d => d.currentCounter >= d.maintenanceThreshold * 0.9).length,
          lowStockItems: inventory.filter(i => i.quantity <= i.reorderThreshold).length,
          expiringItems: inventory.filter(i => {
            if (!i.expiryDate) return false;
            const daysUntilExpiry = Math.ceil((new Date(i.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
          }).length,
          pendingAlerts: alerts.filter(a => !a.isRead).length
        };
      })
    );
  }

  private hydratePatient(patient: Patient): Patient {
    return {
      ...patient,
      dateOfBirth: new Date(patient.dateOfBirth),
      createdAt: new Date(patient.createdAt),
      updatedAt: new Date(patient.updatedAt)
    };
  }

  private hydrateTransaction(transaction: PatientTransaction): PatientTransaction {
    return {
      ...transaction,
      date: new Date(transaction.date)
    };
  }

  private toPatientPayload(patient: Patient): Partial<Patient> {
    return {
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
      email: patient.email,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      skinType: patient.skinType,
      allergies: patient.allergies,
      chronicConditions: patient.chronicConditions,
      contraindications: patient.contraindications,
      notes: patient.notes
    };
  }

  // Reports
  getRevenueStats(params: string): Observable<any> {
    return this.http.get(`${this.apiBase}/reports/revenue${params}`);
  }

  getRevenueByService(params: string): Observable<any> {
    return this.http.get(`${this.apiBase}/reports/revenue-by-service${params}`);
  }

  getRevenueByDoctor(params: string): Observable<any> {
    return this.http.get(`${this.apiBase}/reports/revenue-by-doctor${params}`);
  }

  getRevenueByPeriod(params: string, period: string): Observable<any> {
    return this.http.get(`${this.apiBase}/reports/revenue-by-period${params}&period=${period}`);
  }

  getAppointmentStats(params: string): Observable<any> {
    return this.http.get(`${this.apiBase}/reports/appointments-stats${params}`);
  }

  getPatientStats(params: string): Observable<any> {
    return this.http.get(`${this.apiBase}/reports/patient-stats${params}`);
  }

}
