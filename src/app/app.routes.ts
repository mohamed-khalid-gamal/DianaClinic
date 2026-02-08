import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'patients', loadComponent: () => import('./pages/patients/patients').then(m => m.Patients) },
  { path: 'patients/:id', loadComponent: () => import('./pages/patient-profile/patient-profile').then(m => m.PatientProfile) },
  { path: 'appointments', loadComponent: () => import('./pages/appointments/appointments').then(m => m.Appointments) },
  { path: 'sessions', loadComponent: () => import('./pages/sessions/sessions').then(m => m.Sessions) },
  { path: 'calendar', loadComponent: () => import('./pages/calendar/calendar').then(m => m.CalendarPage) },
  { path: 'doctors', loadComponent: () => import('./pages/doctors/doctors').then(m => m.Doctors) },
  { path: 'rooms', loadComponent: () => import('./pages/rooms/rooms').then(m => m.Rooms) },
  { path: 'devices', loadComponent: () => import('./pages/devices/devices').then(m => m.Devices) },
  { path: 'inventory', loadComponent: () => import('./pages/inventory/inventory').then(m => m.Inventory) },
  { path: 'services', loadComponent: () => import('./pages/services/services').then(m => m.Services) },
  { path: 'offers', loadComponent: () => import('./pages/offers/offers').then(m => m.Offers) },
  { path: 'billing', loadComponent: () => import('./pages/billing/billing').then(m => m.Billing) },
  { path: 'reports', loadComponent: () => import('./pages/reports/reports').then(m => m.Reports) },
  { path: 'manual', loadComponent: () => import('./pages/manual').then(m => m.ManualPage) },
  { path: '**', redirectTo: 'dashboard' },
];
