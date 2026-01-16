import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  Patient, Doctor, Room, Device, InventoryItem,
  ServiceCategory, Service, Offer, Appointment, Alert, PatientWallet, PatientTransaction, PackagePurchase, Session
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // Mock Data Storage
  private patients$ = new BehaviorSubject<Patient[]>(this.generateMockPatients());
  private doctors$ = new BehaviorSubject<Doctor[]>(this.generateMockDoctors());
  private rooms$ = new BehaviorSubject<Room[]>(this.generateMockRooms());
  private devices$ = new BehaviorSubject<Device[]>(this.generateMockDevices());
  private inventory$ = new BehaviorSubject<InventoryItem[]>(this.generateMockInventory());
  private categories$ = new BehaviorSubject<ServiceCategory[]>(this.generateMockCategories());
  private services$ = new BehaviorSubject<Service[]>(this.generateMockServices());
  private offers$ = new BehaviorSubject<Offer[]>(this.generateMockOffers());
  private appointments$ = new BehaviorSubject<Appointment[]>(this.generateMockAppointments());
  private alerts$ = new BehaviorSubject<Alert[]>(this.generateMockAlerts());
  private transactions$ = new BehaviorSubject<PatientTransaction[]>(this.generateMockTransactions());
  private packagePurchases$ = new BehaviorSubject<PackagePurchase[]>([]);

  // Patients
  getPatients(): Observable<Patient[]> {
    return this.patients$.asObservable();
  }

  getPatient(id: string): Observable<Patient | undefined> {
    return of(this.patients$.value.find(p => p.id === id));
  }

  addPatient(patient: Patient): void {
    const current = this.patients$.value;
    this.patients$.next([...current, { ...patient, id: this.generateId() }]);
  }

  updatePatient(patient: Patient): void {
    const current = this.patients$.value;
    const index = current.findIndex(p => p.id === patient.id);
    if (index > -1) {
      current[index] = patient;
      this.patients$.next([...current]);
    }
  }

  deletePatient(id: string): void {
    const current = this.patients$.value.filter(p => p.id !== id);
    this.patients$.next(current);
  }

  // Doctors
  getDoctors(): Observable<Doctor[]> {
    return this.doctors$.asObservable();
  }

  addDoctor(doctor: Doctor): void {
    const current = this.doctors$.value;
    this.doctors$.next([...current, { ...doctor, id: this.generateId() }]);
  }

  deleteDoctor(id: string): void {
    const current = this.doctors$.value.filter(d => d.id !== id);
    this.doctors$.next(current);
  }

  // Rooms
  getRooms(): Observable<Room[]> {
    return this.rooms$.asObservable();
  }

  addRoom(room: Room): void {
    const current = this.rooms$.value;
    this.rooms$.next([...current, { ...room, id: this.generateId() }]);
  }

  deleteRoom(id: string): void {
    const current = this.rooms$.value.filter(r => r.id !== id);
    this.rooms$.next(current);
  }

  // Devices
  getDevices(): Observable<Device[]> {
    return this.devices$.asObservable();
  }

  addDevice(device: Device): void {
    const current = this.devices$.value;
    this.devices$.next([...current, { ...device, id: this.generateId() }]);
  }

  updateDeviceCounter(deviceId: string, newCounter: number): void {
    const current = this.devices$.value;
    const device = current.find(d => d.id === deviceId);
    if (device) {
      device.currentCounter = newCounter;
      this.devices$.next([...current]);
    }
  }

  // Inventory
  getInventory(): Observable<InventoryItem[]> {
    return this.inventory$.asObservable();
  }

  addInventoryItem(item: InventoryItem): void {
    const current = this.inventory$.value;
    this.inventory$.next([...current, { ...item, id: this.generateId() }]);
  }

  updateInventoryQuantity(itemId: string, quantityChange: number): void {
    const current = this.inventory$.value;
    const item = current.find(i => i.id === itemId);
    if (item) {
      item.quantity += quantityChange;
      this.inventory$.next([...current]);
    }
  }

  deleteInventoryItem(id: string): void {
    const current = this.inventory$.value.filter(i => i.id !== id);
    this.inventory$.next(current);
  }

  // Services & Categories
  getCategories(): Observable<ServiceCategory[]> {
    return this.categories$.asObservable();
  }

  getServices(): Observable<Service[]> {
    return this.services$.asObservable();
  }

  addService(service: Service): void {
    const current = this.services$.value;
    this.services$.next([...current, { ...service, id: this.generateId() }]);
  }

  // Offers
  getOffers(): Observable<Offer[]> {
    return this.offers$.asObservable();
  }

  addOffer(offer: Offer): void {
    const current = this.offers$.value;
    this.offers$.next([...current, { ...offer, id: this.generateId() }]);
  }

  updateOffer(offer: Offer): void {
    const current = this.offers$.value;
    const index = current.findIndex(o => o.id === offer.id);
    if (index > -1) {
      current[index] = offer;
      this.offers$.next([...current]);
    }
  }

  // Appointments
  getAppointments(): Observable<Appointment[]> {
    return this.appointments$.asObservable();
  }

  getPatientAppointments(patientId: string): Observable<Appointment[]> {
    return this.appointments$.pipe(
      map(appointments => appointments.filter(a => a.patientId === patientId))
    );
  }

  addAppointment(appointment: Appointment): void {
    const current = this.appointments$.value;
    this.appointments$.next([...current, { ...appointment, id: this.generateId() }]);
  }

  updateAppointmentStatus(id: string, status: Appointment['status']): void {
    const current = this.appointments$.value;
    const apt = current.find(a => a.id === id);
    if (apt) {
      apt.status = status;
      this.appointments$.next([...current]);
    }
  }

  // Patient Transactions
  getPatientTransactions(patientId: string): Observable<PatientTransaction[]> {
    return this.transactions$.pipe(
      map(transactions => transactions.filter(t => t.patientId === patientId))
    );
  }

  addPatientTransaction(transaction: Omit<PatientTransaction, 'id'>): void {
    const current = this.transactions$.value;
    const newTransaction: PatientTransaction = {
      ...transaction,
      id: this.generateId()
    };
    this.transactions$.next([newTransaction, ...current]);
  }

  // Package Purchases
  getPatientPackagePurchases(patientId: string): Observable<PackagePurchase[]> {
    return this.packagePurchases$.pipe(
      map(purchases => purchases.filter(p => p.patientId === patientId))
    );
  }

  getPendingPackagePurchases(patientId: string): Observable<PackagePurchase[]> {
    return this.packagePurchases$.pipe(
      map(purchases => purchases.filter(p => p.patientId === patientId && p.status === 'pending'))
    );
  }

  addPackagePurchase(purchase: Omit<PackagePurchase, 'id'>): string {
    const current = this.packagePurchases$.value;
    const id = this.generateId();
    const newPurchase: PackagePurchase = { ...purchase, id };
    this.packagePurchases$.next([newPurchase, ...current]);
    return id;
  }

  updatePackagePurchaseStatus(purchaseId: string, status: PackagePurchase['status']): void {
    const current = this.packagePurchases$.value;
    const purchase = current.find(p => p.id === purchaseId);
    if (purchase) {
      purchase.status = status;
      if (status === 'paid') {
        purchase.paidAt = new Date();
      }
      this.packagePurchases$.next([...current]);
    }
  }

  getPackagePurchase(purchaseId: string): Observable<PackagePurchase | undefined> {
    return this.packagePurchases$.pipe(
      map(purchases => purchases.find(p => p.id === purchaseId))
    );
  }

  // Sessions
  private sessions$ = new BehaviorSubject<Session[]>([]);

  getSessions(): Observable<Session[]> {
    return this.sessions$.asObservable();
  }

  getSessionByAppointment(appointmentId: string): Observable<Session | undefined> {
    return this.sessions$.pipe(
      map(sessions => sessions.find(s => s.appointmentId === appointmentId))
    );
  }

  addSession(session: Omit<Session, 'id'>): string {
    const current = this.sessions$.value;
    const id = this.generateId();
    const newSession: Session = { ...session, id };
    this.sessions$.next([newSession, ...current]);
    return id;
  }

  updateSession(sessionId: string, updates: Partial<Session>): void {
    const current = this.sessions$.value;
    const index = current.findIndex(s => s.id === sessionId);
    if (index > -1) {
      current[index] = { ...current[index], ...updates };
      this.sessions$.next([...current]);
    }
  }

  // Alerts
  getAlerts(): Observable<Alert[]> {
    return this.alerts$.asObservable();
  }

  // Dashboard Stats
  getDashboardStats(): Observable<any> {
    const today = new Date();
    const appointments = this.appointments$.value;
    const todayAppointments = appointments.filter(a =>
      new Date(a.scheduledStart).toDateString() === today.toDateString()
    );

    const devices = this.devices$.value;
    const devicesNearMaintenance = devices.filter(d =>
      d.currentCounter >= d.maintenanceThreshold * 0.9
    );

    const inventory = this.inventory$.value;
    const lowStockItems = inventory.filter(i => i.quantity <= i.reorderThreshold);
    const expiringItems = inventory.filter(i => {
      if (!i.expiryDate) return false;
      const daysUntilExpiry = Math.ceil((new Date(i.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });

    return of({
      todayAppointments: todayAppointments.length,
      totalPatients: this.patients$.value.length,
      roomsInUse: Math.floor(this.rooms$.value.length * 0.6),
      totalRooms: this.rooms$.value.length,
      devicesNearMaintenance: devicesNearMaintenance.length,
      lowStockItems: lowStockItems.length,
      expiringItems: expiringItems.length,
      pendingAlerts: this.alerts$.value.filter(a => !a.isRead).length
    }).pipe(delay(300));
  }

  // Helper
  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  // Mock Data Generators
  private generateMockPatients(): Patient[] {
    return [
      { id: 'p1', firstName: 'Sarah', lastName: 'Ahmed', phone: '+20 100 123 4567', email: 'sarah@email.com', dateOfBirth: new Date(1990, 5, 15), gender: 'female', skinType: 3, allergies: ['Penicillin'], chronicConditions: [], contraindications: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'p2', firstName: 'Mohamed', lastName: 'Hassan', phone: '+20 101 234 5678', email: 'mohamed@email.com', dateOfBirth: new Date(1985, 8, 22), gender: 'male', skinType: 4, allergies: [], chronicConditions: ['Diabetes'], contraindications: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'p3', firstName: 'Fatima', lastName: 'Ali', phone: '+20 102 345 6789', email: 'fatima@email.com', dateOfBirth: new Date(1995, 2, 10), gender: 'female', skinType: 2, allergies: [], chronicConditions: [], contraindications: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'p4', firstName: 'Ahmed', lastName: 'Mostafa', phone: '+20 103 456 7890', dateOfBirth: new Date(1988, 11, 5), gender: 'male', skinType: 5, allergies: ['Latex'], chronicConditions: [], contraindications: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'p5', firstName: 'Nour', lastName: 'Ibrahim', phone: '+20 104 567 8901', email: 'nour@email.com', dateOfBirth: new Date(1992, 7, 28), gender: 'female', skinType: 3, allergies: [], chronicConditions: [], contraindications: [], createdAt: new Date(), updatedAt: new Date() },
    ];
  }

  private generateMockDoctors(): Doctor[] {
    return [
      {
        id: 'd1',
        name: 'Dr. Amira Khalil',
        specialty: 'Dermatology',
        phone: '+20 100 111 2222',
        email: 'amira@clinic.com',
        workingHours: [
          { dayOfWeek: 0, startTime: '09:00', endTime: '13:00', roomId: 'r1' },
          { dayOfWeek: 0, startTime: '13:00', endTime: '17:00', roomId: 'r2' },
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', roomId: 'r1' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', roomId: 'r2' }
        ],
        assignedRooms: ['r1', 'r2'],
        isActive: true
      },
      {
        id: 'd2',
        name: 'Dr. Karim Mansour',
        specialty: 'Cosmetic Surgery',
        phone: '+20 101 222 3333',
        email: 'karim@clinic.com',
        workingHours: [
          { dayOfWeek: 1, startTime: '10:00', endTime: '14:00', roomId: 'r3' },
          { dayOfWeek: 1, startTime: '14:00', endTime: '18:00', roomId: 'r3' },
          { dayOfWeek: 3, startTime: '10:00', endTime: '18:00', roomId: 'r3' }
        ],
        assignedRooms: ['r3'],
        isActive: true
      },
      {
        id: 'd3',
        name: 'Dr. Layla Farouk',
        specialty: 'Laser Specialist',
        phone: '+20 102 333 4444',
        email: 'layla@clinic.com',
        workingHours: [
          { dayOfWeek: 0, startTime: '08:00', endTime: '12:00', roomId: 'r1' },
          { dayOfWeek: 0, startTime: '12:00', endTime: '16:00', roomId: 'r1' },
          { dayOfWeek: 2, startTime: '08:00', endTime: '16:00', roomId: 'r1' },
          { dayOfWeek: 4, startTime: '08:00', endTime: '16:00', roomId: 'r1' }
        ],
        assignedRooms: ['r1'],
        isActive: true
      },
    ];
  }

  private generateMockRooms(): Room[] {
    return [
      { id: 'r1', name: 'Laser Suite 1', type: 'treatment', floor: '1', equipment: ['Laser Machine', 'Cooling System'], capacity: 1, isActive: true },
      { id: 'r2', name: 'Treatment Room A', type: 'treatment', floor: '1', equipment: ['HydraFacial Machine'], capacity: 1, isActive: true },
      { id: 'r3', name: 'Surgery Room', type: 'surgery', floor: '2', equipment: ['Surgical Equipment', 'Anesthesia'], capacity: 2, isActive: true },
      { id: 'r4', name: 'Consultation Room 1', type: 'consultation', floor: '1', equipment: ['Desk', 'Computer'], capacity: 3, isActive: true },
      { id: 'r5', name: 'Consultation Room 2', type: 'consultation', floor: '1', equipment: ['Desk', 'Computer'], capacity: 3, isActive: true },
    ];
  }

  private generateMockDevices(): Device[] {
    return [
      { id: 'dev1', name: 'Candela GentleMax Pro', model: 'GentleMax Pro', serialNumber: 'CAN-2023-001', roomId: 'r1', counterType: 'pulse', currentCounter: 45000, maintenanceThreshold: 50000, lampLifetime: 100000, currentLampUsage: 45000, purchaseDate: new Date(2023, 0, 15), status: 'active' },
      { id: 'dev2', name: 'HydraFacial Elite', model: 'Elite MD', serialNumber: 'HF-2022-042', roomId: 'r2', counterType: 'session', currentCounter: 1200, maintenanceThreshold: 1500, purchaseDate: new Date(2022, 5, 20), status: 'active' },
      { id: 'dev3', name: 'CoolSculpting Elite', model: 'Elite', serialNumber: 'CS-2023-015', roomId: 'r1', counterType: 'session', currentCounter: 300, maintenanceThreshold: 500, purchaseDate: new Date(2023, 3, 10), status: 'active' },
    ];
  }

  private generateMockInventory(): InventoryItem[] {
    return [
      { id: 'inv1', name: 'Hyaluronic Acid Filler', sku: 'HA-001', category: 'drug', quantity: 25, unit: 'vial', costPrice: 150, sellingPrice: 300, reorderThreshold: 10, expiryDate: new Date(2025, 6, 15), batchNumber: 'B2024-001', supplier: 'MedSupply Co.' },
      { id: 'inv2', name: 'Botox 100 Units', sku: 'BTX-100', category: 'drug', quantity: 15, unit: 'vial', costPrice: 200, sellingPrice: 450, reorderThreshold: 5, expiryDate: new Date(2025, 3, 20), batchNumber: 'B2024-002', supplier: 'Allergan' },
      { id: 'inv3', name: 'Disposable Gloves (M)', sku: 'GLV-M', category: 'consumable', quantity: 500, unit: 'pair', costPrice: 0.5, sellingPrice: 0, reorderThreshold: 100 },
      { id: 'inv4', name: 'Alcohol Wipes', sku: 'ALC-W', category: 'consumable', quantity: 1000, unit: 'piece', costPrice: 0.1, sellingPrice: 0, reorderThreshold: 200 },
      { id: 'inv5', name: 'Vitamin C Serum 30ml', sku: 'VCS-30', category: 'retail', quantity: 30, unit: 'bottle', costPrice: 25, sellingPrice: 75, reorderThreshold: 10, expiryDate: new Date(2025, 11, 1) },
      { id: 'inv6', name: 'Sunscreen SPF50', sku: 'SS-50', category: 'retail', quantity: 8, unit: 'tube', costPrice: 15, sellingPrice: 45, reorderThreshold: 15, expiryDate: new Date(2026, 1, 15) },
    ];
  }

  private generateMockCategories(): ServiceCategory[] {
    return [
      { id: 'cat1', name: 'Laser Treatments', description: 'All laser-based procedures', icon: 'fa-solid fa-bolt' },
      { id: 'cat2', name: 'Skin Care', description: 'Facial and skin treatments', icon: 'fa-solid fa-droplet' },
      { id: 'cat3', name: 'Injectables', description: 'Botox, fillers, and more', icon: 'fa-solid fa-syringe' },
      { id: 'cat4', name: 'Body Contouring', description: 'Body shaping procedures', icon: 'fa-solid fa-person-running' },
    ];
  }

  private generateMockServices(): Service[] {
    return [
      { id: 's1', categoryId: 'cat1', name: 'Full Body Laser Hair Removal', description: 'Complete body laser treatment', duration: 120, pricingModels: [{ type: 'fixed', basePrice: 2500 }, { type: 'pulse', basePrice: 500, pricePerUnit: 0.5 }], requiredDevices: ['dev1'], isActive: true },
      { id: 's2', categoryId: 'cat1', name: 'Face Laser', description: 'Face laser hair removal', duration: 30, pricingModels: [{ type: 'fixed', basePrice: 500 }, { type: 'pulse', basePrice: 100, pricePerUnit: 0.5 }], requiredDevices: ['dev1'], isActive: true },
      { id: 's3', categoryId: 'cat1', name: 'Underarms Laser', description: 'Underarms laser treatment', duration: 15, pricingModels: [{ type: 'fixed', basePrice: 300 }], requiredDevices: ['dev1'], isActive: true },
      { id: 's4', categoryId: 'cat2', name: 'HydraFacial Signature', description: 'Deep cleansing facial', duration: 45, pricingModels: [{ type: 'fixed', basePrice: 800 }], requiredDevices: ['dev2'], isActive: true },
      { id: 's5', categoryId: 'cat2', name: 'Chemical Peel', description: 'Skin rejuvenation peel', duration: 30, pricingModels: [{ type: 'fixed', basePrice: 600 }], isActive: true },
      { id: 's6', categoryId: 'cat3', name: 'Botox Full Face', description: 'Complete facial botox treatment', duration: 30, pricingModels: [{ type: 'fixed', basePrice: 3000 }], consumables: [{ inventoryItemId: 'inv2', quantity: 1 }], isActive: true },
      { id: 's7', categoryId: 'cat3', name: 'Lip Filler', description: 'Lip augmentation with HA filler', duration: 45, pricingModels: [{ type: 'fixed', basePrice: 2500 }], consumables: [{ inventoryItemId: 'inv1', quantity: 1 }], isActive: true },
      { id: 's8', categoryId: 'cat4', name: 'CoolSculpting Session', description: 'Fat freezing treatment', duration: 60, pricingModels: [{ type: 'area', basePrice: 0, areas: [{ name: 'Abdomen', price: 3000 }, { name: 'Love Handles', price: 2500 }, { name: 'Thighs', price: 2800 }] }], requiredDevices: ['dev3'], isActive: true },
    ];
  }

  private generateMockOffers(): Offer[] {
    return [
      {
        id: 'o1',
        name: 'Summer Glow Bundle',
        description: 'HydraFacial + Chemical Peel for fixed price',
        type: 'bundle',
        isActive: true,
        validFrom: new Date(2024, 0, 1),
        validUntil: new Date(2024, 11, 31),
        conditions: [
          {
            id: 'c1',
            type: 'service_includes',
            parameters: { serviceIds: ['s4', 's5'] } // Requires HydraFacial (s4) and Peel (s5)
          }
        ],
        benefits: [
          {
            id: 'b1',
            type: 'fixed_price',
            parameters: { fixedPrice: 1200 } // Normal price ~1400
          }
        ],
        priority: 10,
        createdAt: new Date()
      },
      {
        id: 'o2',
        name: 'New Patient Welcome',
        description: '20% off first visit for new patients',
        type: 'conditional',
        isActive: true,
        usageLimitPerPatient: 1,
        conditions: [
          { id: 'c2', type: 'new_patient', parameters: {} }
        ],
        benefits: [
          { id: 'b2', type: 'percent_off', parameters: { percent: 20 } }
        ],
        priority: 5,
        createdAt: new Date()
      },
      {
        id: 'o3',
        name: 'Buy 5 Get 1 Free - Laser',
        description: 'Purchase 5 sessions package, get 6 credits',
        type: 'package',
        isActive: true,
        validFrom: new Date(2024, 0, 1),
        benefits: [
          {
            id: 'b3',
            type: 'grant_package',
            parameters: {
              packageServiceId: 's1', // Full Body Laser
              packageSessions: 6,
              packageValidityDays: 365,
              fixedPrice: 12500 // 5 * 2500
            }
          }
        ],
        priority: 8,
        createdAt: new Date()
      }
    ];
  }

  private generateMockAppointments(): Appointment[] {
    const today = new Date();
    return [
      { id: 'a1', patientId: 'p1', doctorId: 'd1', roomId: 'r1', deviceId: 'dev1', services: [{ serviceId: 's2', pricingType: 'fixed', price: 500 }], scheduledStart: new Date(today.setHours(9, 0)), scheduledEnd: new Date(today.setHours(9, 30)), status: 'scheduled', createdAt: new Date() },
      { id: 'a2', patientId: 'p2', doctorId: 'd3', roomId: 'r2', deviceId: 'dev2', services: [{ serviceId: 's4', pricingType: 'fixed', price: 800 }], scheduledStart: new Date(today.setHours(10, 0)), scheduledEnd: new Date(today.setHours(10, 45)), status: 'checked-in', createdAt: new Date() },
      { id: 'a3', patientId: 'p3', doctorId: 'd1', roomId: 'r1', deviceId: 'dev1', services: [{ serviceId: 's1', pricingType: 'fixed', price: 2500 }], scheduledStart: new Date(today.setHours(11, 0)), scheduledEnd: new Date(today.setHours(13, 0)), status: 'scheduled', createdAt: new Date() },
      { id: 'a4', patientId: 'p4', doctorId: 'd2', roomId: 'r3', services: [{ serviceId: 's6', pricingType: 'fixed', price: 3000 }], scheduledStart: new Date(today.setHours(14, 0)), scheduledEnd: new Date(today.setHours(14, 30)), status: 'scheduled', createdAt: new Date() },
    ];
  }

  private generateMockAlerts(): Alert[] {
    return [
      { id: 'al1', type: 'low_stock', title: 'Low Stock Alert', message: 'Sunscreen SPF50 is running low (8 units remaining)', relatedId: 'inv6', severity: 'warning', isRead: false, createdAt: new Date() },
      { id: 'al2', type: 'maintenance', title: 'Device Maintenance Due', message: 'Candela GentleMax Pro is at 90% of maintenance threshold', relatedId: 'dev1', severity: 'warning', isRead: false, createdAt: new Date() },
      { id: 'al3', type: 'expiry', title: 'Expiry Warning', message: 'Botox 100 Units batch B2024-002 expires in 60 days', relatedId: 'inv2', severity: 'info', isRead: false, createdAt: new Date() },
    ];
  }

  private generateMockTransactions(): PatientTransaction[] {
    const today = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'tx1',
        patientId: 'p1',
        date: today,
        type: 'credit_usage',
        description: 'Used 1 session from Laser package',
        amount: 0,
        method: 'credits',
        serviceId: 's1',
        packageId: 'o3'
      },
      {
        id: 'tx2',
        patientId: 'p1',
        date: yesterday,
        type: 'payment',
        description: 'Payment for HydraFacial Session',
        amount: 800,
        method: 'card'
      },
      {
        id: 'tx3',
        patientId: 'p2',
        date: lastWeek,
        type: 'wallet_topup',
        description: 'Wallet top-up',
        amount: 500,
        method: 'cash'
      }
    ];
  }
}
