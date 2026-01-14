import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Patients } from './pages/patients/patients';
import { Appointments } from './pages/appointments/appointments';
import { Doctors } from './pages/doctors/doctors';
import { Rooms } from './pages/rooms/rooms';
import { Devices } from './pages/devices/devices';
import { Inventory } from './pages/inventory/inventory';
import { Services } from './pages/services/services';
import { Offers } from './pages/offers/offers';
import { Billing } from './pages/billing/billing';
import { Sessions } from './pages/sessions/sessions';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'patients', component: Patients },
  { path: 'appointments', component: Appointments },
  { path: 'sessions', component: Sessions },
  { path: 'doctors', component: Doctors },
  { path: 'rooms', component: Rooms },
  { path: 'devices', component: Devices },
  { path: 'inventory', component: Inventory },
  { path: 'services', component: Services },
  { path: 'offers', component: Offers },
  { path: 'billing', component: Billing },
];
