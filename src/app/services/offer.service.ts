import { Injectable } from '@angular/core';
import { Offer, OfferCondition, OfferBenefit, Patient, Service } from '../models';
import { DataService } from './data.service';

export interface CartItem {
  serviceId: string;
  serviceName: string;
  price: number; // Unit price
  quantity: number;
}

export interface AppliedOffer {
  offer: Offer;
  discountAmount: number;
  finalPrice: number;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class OfferService {
  
  constructor(private dataService: DataService) {}

  /**
   * Main entry point: Evaluate all available offers against the current cart and patient.
   */
  evaluateOffers(cart: CartItem[], patient: Patient, allOffers: Offer[]): AppliedOffer[] {
    const applicableOffers: AppliedOffer[] = [];
    const today = new Date();

    // 1. Filter active and valid date
    const candidates = allOffers.filter(o => {
      if (!o.isActive) return false;
      if (o.validFrom && new Date(o.validFrom) > today) return false;
      if (o.validUntil && new Date(o.validUntil) < today) return false;
      return true;
    });

    // 2. Sort by priority
    candidates.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // 3. Evaluate conditions
    for (const offer of candidates) {
      if (this.checkConditions(offer, cart, patient)) {
        const benefit = this.calculateBenefit(offer, cart);
        if (benefit && benefit.discountAmount > 0) {
          applicableOffers.push(benefit);
        }
      }
    }

    // TODO: Handle exclusive offers mechanism (pick best exclusive or allow stacking)
    // For now, return all applicable
    return applicableOffers;
  }

  private checkConditions(offer: Offer, cart: CartItem[], patient: Patient): boolean {
    if (!offer.conditions || offer.conditions.length === 0) return true;

    return offer.conditions.every(condition => {
      switch (condition.type) {
        case 'service_includes':
          // Cart must contain specific services
          if (!condition.parameters.serviceIds) return true;
          const cartServiceIds = cart.map(i => i.serviceId);
          // Check if ALL required services are in cart
          return condition.parameters.serviceIds.every(reqId => cartServiceIds.includes(reqId));

        case 'min_spend':
          const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          return total >= (condition.parameters.minAmount || 0);

        case 'new_patient':
           // Simplistic check: if created within last 30 days or has 0 past appointments
           // Ideally we check appointment history size
           const isNew = (new Date().getTime() - new Date(patient.createdAt).getTime()) < (30 * 24 * 60 * 60 * 1000);
           return isNew;

        // Add other condition checks
        default:
          return true;
      }
    });
  }

  private calculateBenefit(offer: Offer, cart: CartItem[]): AppliedOffer | null {
    // Simplified benefit calculation based on first benefit
    const benefit = offer.benefits[0];
    if (!benefit) return null;

    let discount = 0;
    let description = offer.name;

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    switch (benefit.type) {
      case 'percent_off':
        discount = cartTotal * ((benefit.parameters.percent || 0) / 100);
        description += ` (${benefit.parameters.percent}% Off)`;
        break;

      case 'fixed_amount_off':
        discount = benefit.parameters.fixedAmount || 0;
        description += ` (EGP ${discount} Off)`;
        break;

      case 'fixed_price':
        // For bundles: Set total price to Fixed Price
        // Discount = Current Total - Fixed Price
        if (benefit.parameters.fixedPrice) {
          discount = Math.max(0, cartTotal - benefit.parameters.fixedPrice);
          description += ` (Bundle Price: EGP ${benefit.parameters.fixedPrice})`;
        }
        break;
        
      case 'grant_package':
         // This doesn't discount the current invoice usually, unless it's a "Package for Price X" deal
         // If it's pure grant, discount is 0, but we return object to trigger entitlement creation
         if (benefit.parameters.fixedPrice) {
           // Buying a package
           // Assumption: Cart contains the dummy 'package item' or we treat this as overriding the total
           // For simplicity, let's say this offer applies if we are buying the trigger services
           discount = 0; // Logic for package purchase often handled differently (Service Item Replacement)
         }
         break;
    }

    return {
      offer: offer,
      discountAmount: discount,
      finalPrice: cartTotal - discount,
      description: description
    };
  }
}
