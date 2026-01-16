// Core Data Models for CCMS

// Patient
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  skinType?: number; // Fitzpatrick scale 1-6
  allergies?: string[];
  chronicConditions?: string[];
  contraindications?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientWallet {
  patientId: string;
  cashBalance: number;
  credits: ServiceCredit[];
}

export interface ServiceCredit {
  serviceId: string;
  serviceName: string;
  remaining: number;
  total: number;
  expiresAt?: Date;
  packageId?: string;
  unitType: 'session' | 'pulse' | 'unit'; // Type of credit unit
}

// Package/Offer purchase that creates pending bill
export interface PackagePurchase {
  id: string;
  patientId: string;
  offerId: string;
  offerName: string;
  price: number;
  status: 'pending' | 'paid' | 'cancelled';
  credits: PackageCreditItem[]; // What credits will be granted on payment
  createdAt: Date;
  paidAt?: Date;
}

export interface PackageCreditItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitType: 'session' | 'pulse' | 'unit';
}

export interface PatientTransaction {
  id: string;
  patientId: string;
  date: Date;
  type: 'payment' | 'refund' | 'credit_purchase' | 'credit_usage' | 'wallet_topup';
  description: string;
  amount: number;
  method?: 'cash' | 'card' | 'wallet' | 'credits';
  relatedAppointmentId?: string;
  relatedInvoiceId?: string;
  serviceId?: string;
  packageId?: string;
  balanceAfter?: number;
}

// Doctor
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email?: string;
  workingHours: WorkingHours[];
  assignedRooms?: string[];
  avatar?: string;
  isActive: boolean;
}

export interface WorkingHours {
  dayOfWeek: number; // 0-6
  startTime: string; // HH:mm
  endTime: string;
  roomId?: string; // Specific room assignment for this time block
}

// Room
export interface Room {
  id: string;
  name: string;
  type: 'treatment' | 'consultation' | 'surgery' | 'storage';
  floor?: string;
  equipment?: string[];
  capacity: number;
  isActive: boolean;
  maintenanceSchedule?: MaintenanceWindow[];
}

export interface MaintenanceWindow {
  startDate: Date;
  endDate: Date;
  reason: string;
}

// Device
export interface Device {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  roomId?: string;
  counterType: 'pulse' | 'session' | 'time';
  currentCounter: number;
  maintenanceThreshold: number;
  lampLifetime?: number;
  currentLampUsage?: number;
  purchaseDate: Date;
  lastMaintenanceDate?: Date;
  status: 'active' | 'maintenance' | 'inactive';
  notes?: string;
}

export interface DeviceUsageLog {
  id: string;
  deviceId: string;
  appointmentId: string;
  counterStart: number;
  counterEnd: number;
  usedBy: string; // doctorId
  timestamp: Date;
}

// Inventory
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: 'drug' | 'consumable' | 'retail' | 'equipment';
  quantity: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  reorderThreshold: number;
  expiryDate?: Date;
  batchNumber?: string;
  supplier?: string;
  location?: string;
}

// Service & Pricing
export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  duration: number; // minutes
  pricingModels: PricingModel[];
  requiredDevices?: string[];
  consumables?: ServiceConsumable[];
  requiredRoomTypes?: string[];
  allowedDoctorIds?: string[];
  isActive: boolean;
}

export interface PricingModel {
  type: 'fixed' | 'pulse' | 'area' | 'time';
  basePrice: number;
  pricePerUnit?: number; // per pulse, per minute, etc.
  areas?: AreaPrice[];
}

export interface AreaPrice {
  name: string;
  price: number;
}

export interface ServiceConsumable {
  inventoryItemId: string;
  quantity: number;
}

// Offers & Packages
// Offers & Rule Engine
export interface Offer {
  id: string;
  name: string;
  description?: string;
  type: 'percentage' | 'bundle' | 'buyXgetY' | 'package' | 'fixed_amount' | 'conditional';
  isActive: boolean;
  validFrom?: Date;
  validUntil?: Date;
  usageLimitPerPatient?: number;
  totalUsageLimit?: number;
  conditions?: OfferCondition[];
  benefits: OfferBenefit[];
  priority?: number; // Higher applies first
  isExclusive?: boolean; // If true, cannot combine with other offers
  createdAt: Date;
}

export interface OfferCondition {
  id: string;
  type: 'service_includes' | 'min_spend' | 'new_patient' | 'patient_tag' | 'date_range' | 'specific_patient';
  parameters: {
    serviceIds?: string[];
    minAmount?: number;
    tags?: string[];
    patientIds?: string[];
    startDate?: Date;
    endDate?: Date;
  };
}

export interface OfferBenefit {
  id: string;
  type: 'percent_off' | 'fixed_price' | 'grant_package' | 'free_session' | 'fixed_amount_off';
  parameters: {
    percent?: number;
    fixedPrice?: number;
    fixedAmount?: number;
    // For package grants - supports multiple service credits
    packageServiceId?: string;
    packageSessions?: number;
    packageValidityDays?: number;
    // For multi-service packages
    packageCredits?: PackageCreditItem[];
    // For free session (Buy X Get Y)
    buyQuantity?: number;
    freeQuantity?: number;
    targetServiceId?: string;
  };
}

export interface OfferRedemption {
  id: string;
  offerId: string;
  patientId: string;
  invoiceId: string;
  date: Date;
  savingsAmount: number;
}

// Appointment
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  roomId: string;
  deviceId?: string;
  services: AppointmentService[];
  offerId?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: 'scheduled' | 'checked-in' | 'in-progress' | 'completed' | 'billed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: Date;
}

export interface AppointmentService {
  serviceId: string;
  pricingType: string;
  price: number;
  area?: string;
  pulses?: number;
  fromCredits?: boolean; // Whether this service is paid from patient credits
  creditsUsed?: number; // How many credits/units were allocated from wallet
}

// Session & Billing
export interface Session {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  startTime: Date;
  endTime?: Date;
  consumablesUsed: SessionConsumable[];
  deviceUsage?: DeviceUsageLog;
  creditsUsed: SessionCreditUsage[]; // Track actual credit consumption
  extraCharges: SessionExtraCharge[]; // Extra charges from overage, etc.
  clinicalNotes?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  status: 'active' | 'completed';
}

export interface SessionExtraCharge {
  description: string;
  amount: number;
  serviceId?: string;
}

export interface SessionCreditUsage {
  serviceId: string;
  serviceName: string;
  unitsUsed: number;
  unitType: 'session' | 'pulse' | 'unit';
}

export interface SessionConsumable {
  inventoryItemId: string;
  quantity: number;
}

export interface Invoice {
  id: string;
  patientId: string;
  appointmentId: string;
  sessionId: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payments: Payment[];
  status: 'pending' | 'partial' | 'paid' | 'refunded';
  createdAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: 'cash' | 'card' | 'wallet' | 'credits';
  reference?: string;
  timestamp: Date;
}

// Notifications/Alerts
export interface Alert {
  id: string;
  type: 'low_stock' | 'expiry' | 'maintenance' | 'credit_expiry';
  title: string;
  message: string;
  relatedId: string;
  severity: 'info' | 'warning' | 'critical';
  isRead: boolean;
  createdAt: Date;
}
