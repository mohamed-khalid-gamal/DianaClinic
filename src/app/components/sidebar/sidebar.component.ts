import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { BadgeService, BadgeCounts } from '../../services/badge.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badgeKey?: keyof BadgeCounts;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  collapsed = false;
  mobileMenuOpen = false;
  isMobile = false;
  badgeCounts: BadgeCounts = { inventory: 0, devices: 0, sessions: 0 };
  private badgeSub?: Subscription;

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'fa-solid fa-chart-pie', route: '/dashboard' },
    { label: 'Patients', icon: 'fa-solid fa-users', route: '/patients' },
    { label: 'Appointments', icon: 'fa-solid fa-calendar-check', route: '/appointments' },
    { label: 'Sessions', icon: 'fa-solid fa-play-circle', route: '/sessions', badgeKey: 'sessions' },
    { label: 'Calendar', icon: 'fa-solid fa-calendar-days', route: '/calendar' },
    { label: 'Doctors', icon: 'fa-solid fa-user-doctor', route: '/doctors' },
    { label: 'Rooms', icon: 'fa-solid fa-door-open', route: '/rooms' },
    { label: 'Devices', icon: 'fa-solid fa-microchip', route: '/devices', badgeKey: 'devices' },
    { label: 'Inventory', icon: 'fa-solid fa-boxes-stacked', route: '/inventory', badgeKey: 'inventory' },
    { label: 'Services', icon: 'fa-solid fa-spa', route: '/services' },
    { label: 'Offers', icon: 'fa-solid fa-tags', route: '/offers' },
    { label: 'Billing', icon: 'fa-solid fa-file-invoice-dollar', route: '/billing' },
    { label: 'Reports', icon: 'fa-solid fa-chart-line', route: '/reports' },
    { label: 'User Manual', icon: 'fa-solid fa-book-open', route: '/manual' }
  ];

  constructor(private badgeService: BadgeService) {
    this.checkMobile();
  }

  ngOnInit() {
    this.badgeSub = this.badgeService.getBadgeCounts().subscribe(counts => {
      this.badgeCounts = counts;
    });
  }

  ngOnDestroy() {
    this.badgeSub?.unsubscribe();
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

  getBadgeCount(item: NavItem): number {
    if (item.badgeKey) {
      return this.badgeCounts[item.badgeKey] || 0;
    }
    return 0;
  }
}
