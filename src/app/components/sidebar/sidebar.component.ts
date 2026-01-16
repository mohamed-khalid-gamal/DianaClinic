import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  collapsed = false;
  mobileMenuOpen = false;
  isMobile = false;

  navItems = [
    { label: 'Dashboard', icon: 'fa-solid fa-chart-pie', route: '/dashboard' },
    { label: 'Patients', icon: 'fa-solid fa-users', route: '/patients' },
    { label: 'Appointments', icon: 'fa-solid fa-calendar-check', route: '/appointments' },
    { label: 'Sessions', icon: 'fa-solid fa-play-circle', route: '/sessions' },
    { label: 'Calendar', icon: 'fa-solid fa-calendar-days', route: '/calendar' },
    { label: 'Doctors', icon: 'fa-solid fa-user-doctor', route: '/doctors' },
    { label: 'Rooms', icon: 'fa-solid fa-door-open', route: '/rooms' },
    { label: 'Devices', icon: 'fa-solid fa-microchip', route: '/devices' },
    { label: 'Inventory', icon: 'fa-solid fa-boxes-stacked', route: '/inventory' },
    { label: 'Services', icon: 'fa-solid fa-spa', route: '/services' },
    { label: 'Offers', icon: 'fa-solid fa-tags', route: '/offers' },
    { label: 'Billing', icon: 'fa-solid fa-file-invoice-dollar', route: '/billing' },
  ];

  constructor() {
    this.checkMobile();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) {
      this.mobileMenuOpen = false;
    }
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  onNavClick() {
    if (this.isMobile) {
      this.closeMobileMenu();
    }
  }
}
