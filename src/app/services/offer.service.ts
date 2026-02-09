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
  evaluateOffers(cart: CartItem[], patient: Patient, allOffers: Offer[], services: Service[] = []): AppliedOffer[] {
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
      if (this.evaluateOfferConditions(offer, cart, patient, services)) {
        const benefit = this.calculateBenefit(offer, cart);
        if (benefit && (benefit.discountAmount > 0 || benefit.offer.benefits[0]?.type === 'grant_package')) {
          applicableOffers.push(benefit);
        }
      }
    }

    // Handle exclusive offers: if any exclusive offer matches, return only the best one
    const exclusives = applicableOffers.filter(a => a.offer.isExclusive);
    const nonExclusives = applicableOffers.filter(a => !a.offer.isExclusive);

    if (exclusives.length > 0) {
      // Pick the exclusive offer with the highest discount
      const bestExclusive = exclusives.reduce((best, curr) =>
        curr.discountAmount > best.discountAmount ? curr : best
      );
      return [bestExclusive];
    }

    return nonExclusives;
  }

  private evaluateOfferConditions(offer: Offer, cart: CartItem[], patient: Patient, services: Service[]): boolean {
    if (!offer.conditions || offer.conditions.length === 0) return true;
    // Top level is always implicit AND
    return offer.conditions.every(cond => this.evaluateCondition(cond, cart, patient, services));
  }

  private evaluateCondition(condition: OfferCondition, cart: CartItem[], patient: Patient, services: Service[]): boolean {
    switch (condition.type) {
      case 'group':
        if (!condition.children || condition.children.length === 0) return true;
        if (condition.logic === 'OR') {
          return condition.children.some(child => this.evaluateCondition(child, cart, patient, services));
        } else {
          // Default to AND
          return condition.children.every(child => this.evaluateCondition(child, cart, patient, services));
        }

      case 'service_includes':
        return this.evaluateServiceIncludes(condition, cart, services);

      case 'min_spend':
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return total >= (condition.parameters.minAmount || 0);

      case 'new_patient':
         const isNew = (new Date().getTime() - new Date(patient.createdAt).getTime()) < (30 * 24 * 60 * 60 * 1000);
         return isNew;

      case 'patient_tag':
        // Check if patient has any of the required tags (match against notes/skinType)
        if (!condition.parameters.tags || condition.parameters.tags.length === 0) return true;
        const patientTags = [patient.skinType, ...(patient.allergies || []), ...(patient.chronicConditions || [])]
          .filter(Boolean).map(t => String(t).toLowerCase());
        
        if (condition.operator === 'not_contains' || condition.operator === 'not_in') {
             return !condition.parameters.tags.some(tag => patientTags.includes(tag.toLowerCase()));
        }
        return condition.parameters.tags.some(tag => patientTags.includes(tag.toLowerCase()));

      case 'date_range':
        const now = new Date();
        if (condition.parameters.startDate && new Date(condition.parameters.startDate) > now) return false;
        if (condition.parameters.endDate && new Date(condition.parameters.endDate) < now) return false;
        return true;

      case 'specific_patient':
        if (!condition.parameters.patientIds || condition.parameters.patientIds.length === 0) return true;
        return condition.parameters.patientIds.includes(patient.id);

      case 'time_range':
        return this.evaluateTimeRange(condition);
      
      case 'day_of_week':
        return this.evaluateDayOfWeek(condition);

      case 'customer_attribute':
        return this.evaluateAttribute(condition, patient);

      case 'visit_count':
        // TODO: This requires checking patient history which is not passed here.
        // For now, return true or we need to fetch it.
        // Assuming we might have visit count in Patient object tailored for this?
        // Or we just skip this check for now.
        return true; 

      case 'cart_property':
         return this.evaluateCartProperty(condition, cart);

      default:
        return true;
    }
  }

  private evaluateTimeRange(condition: OfferCondition): boolean {
      if (!condition.parameters.startTime || !condition.parameters.endTime) return true;
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const [startH, startM] = condition.parameters.startTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      
      const [endH, endM] = condition.parameters.endTime.split(':').map(Number);
      const endMinutes = endH * 60 + endM;
      
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  private evaluateDayOfWeek(condition: OfferCondition): boolean {
      if (!condition.parameters.daysOfWeek || condition.parameters.daysOfWeek.length === 0) return true;
      const day = new Date().getDay(); // 0-6
      return condition.parameters.daysOfWeek.includes(day);
  }

  private evaluateAttribute(condition: OfferCondition, patient: Patient): boolean {
      const attr = condition.parameters.attributeName;
      if (!attr) return true;
      
      // Access patient property safely
      const value = (patient as any)[attr];
      const target = condition.parameters.attributeValue;

      // TODO: Improve type handling (dates, numbers)
      
      switch (condition.operator) {
          case 'equals': return value == target;
          case 'not_equals': return value != target;
          case 'greater_than': return value > target;
          case 'less_than': return value < target;
          case 'contains': return String(value).includes(target);
          case 'not_contains': return !String(value).includes(target);
          default: return value == target;
      }
  }

  private evaluateServiceIncludes(condition: OfferCondition, cart: CartItem[], allServices: Service[]): boolean {
    const params = condition.parameters;
    const cartServiceIds = new Set(cart.map(i => i.serviceId));

    // 1. Resolve Target IDs from Service IDs and Categories
    let targetIds = new Set<string>(params.serviceIds || []);

    if (params.categoryIds && params.categoryIds.length > 0) {
      allServices
        .filter(s => params.categoryIds?.includes(s.categoryId))
        .forEach(s => targetIds.add(s.id));
    }

    if (targetIds.size === 0) return true; // No targets defined = match all? Or ignore? Assuming ignore -> true.

    // 2. Determine matches based on matchType
    const matchType = params.matchType || 'all';
    
    // Check coverage
    const cartHasId = (id: string) => cartServiceIds.has(id);
    
    let isMatch = false;

    if (matchType === 'any') {
      // At least one target ID is in cart
      isMatch = Array.from(targetIds).some(id => cartHasId(id));
    } else if (matchType === 'none') {
      // NONE of the target IDs are in cart
      isMatch = !Array.from(targetIds).some(id => cartHasId(id));
      // For 'none', minQuantity doesn't make sense to check on matches (since there are none), so return early
      return isMatch;
    } else if (matchType === 'exact') {
      // Cart services must be exactly the target set
      if (cartServiceIds.size !== targetIds.size) isMatch = false;
      else isMatch = Array.from(targetIds).every(id => cartHasId(id));
    } else {
      // 'all' (default) - Cart must contain ALL target IDs
      // This is strict 'all listed must be present'. 
      // If categories are used, it implies "All services in this category"? No, that's dangerous.
      // Usually 'all' with categories means "Is this logical?". 
      // If user selects "Category: Laser" and "Match: All", it implies "Cart must contain ALL laser services available". That's unlikely.
      // Probably 'all' is useful for bundling specific Service IDs. 
      // For categories, 'any' is the standard use case. 
      // However, we follow logic: All IDs in targetIds must be in cart.
      isMatch = Array.from(targetIds).every(id => cartHasId(id));
    }

    if (!isMatch) return false;

    // 3. Check Minimum Quantity (Total items matching the target)
    if (params.minQuantity && params.minQuantity > 0) {
       // Count quantity of items in cart that match the target set
       const matchingCartItems = cart.filter(i => targetIds.has(i.serviceId));
       const totalUnits = matchingCartItems.reduce((sum, item) => sum + item.quantity, 0);
       
       if (totalUnits < params.minQuantity) return false;
    }

    return true;
  }
}

  private evaluateCartProperty(condition: OfferCondition, cart: CartItem[]): boolean {
      const prop = condition.parameters.attributeName; // 'totalQuantity', 'totalItems', 'distinctCategories'
      let value = 0;
      
      if (prop === 'totalQuantity') {
          value = cart.reduce((sum, item) => sum + item.quantity, 0);
      } else if (prop === 'totalItems') { // Distinct items
          value = cart.length;
      }
      
      const target = condition.parameters.threshold || 0;
      
       switch (condition.operator) {
          case 'equals': return value == target;
          case 'not_equals': return value != target;
          case 'greater_than': return value > target;
          case 'less_than': return value < target;
          default: return value >= target;
      }
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
           discount = 0; // Logic for package purchase often handled differently (Service Item Replacement)
         }
         break;

      case 'free_session': {
        // Buy X Get Y Free logic
        const buyQty = benefit.parameters.buyQuantity || 2;
        const freeQty = benefit.parameters.freeQuantity || 1;
        const targetId = benefit.parameters.targetServiceId;
        // Find qualifying items in cart
        const qualifying = targetId
          ? cart.filter(i => i.serviceId === targetId)
          : cart;
        const totalQty = qualifying.reduce((sum, i) => sum + i.quantity, 0);
        if (totalQty >= buyQty) {
          const freeItems = Math.floor(totalQty / (buyQty + freeQty)) * freeQty;
          if (freeItems > 0 && qualifying.length > 0) {
            // Use the cheapest qualifying item price for free sessions
            const cheapest = Math.min(...qualifying.map(i => i.price));
            discount = freeItems * cheapest;
            description += ` (Buy ${buyQty} Get ${freeQty} Free)`;
          }
        }
        break;
      }
    }

    return {
      offer: offer,
      discountAmount: discount,
      finalPrice: cartTotal - discount,
      description: description
    };
  }
}
