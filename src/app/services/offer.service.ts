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
  evaluateOffers(cart: CartItem[], patient: Patient, allOffers: Offer[], services: Service[] = [], usageStats?: { offerId: string, patientCount: number, globalCount: number }[], context: 'billing' | 'package' | 'all' = 'all', sessionDate?: Date): AppliedOffer[] {
    const applicableOffers: AppliedOffer[] = [];
    const evaluationDate = sessionDate ? new Date(sessionDate) : new Date();

    // 1. Filter active and valid date
    let candidates = allOffers.filter(o => {
      if (!o.isActive) return false;
      if (o.validFrom && new Date(o.validFrom) > evaluationDate) return false;
      if (o.validUntil && new Date(o.validUntil) < evaluationDate) return false;

      // Filter by context
      if (context === 'billing') {
        // Billing/End Session only shows discounts (percentage or fixed amount), NOT packages
        if (o.type === 'package') return false;
      } else if (context === 'package') {
        // Package purchase only shows packages
        if (o.type !== 'package') return false;
      }

      return true;
    });

    // 2. Filter by Usage Limits
    if (usageStats) {
      candidates = candidates.filter(o => {
        const stats = usageStats.find(s => s.offerId === o.id);
        if (!stats) return true;

        if (o.usageLimitPerPatient && stats.patientCount >= o.usageLimitPerPatient) return false;
        if (o.totalUsageLimit && stats.globalCount >= o.totalUsageLimit) return false;

        return true;
      });
    }

    // 3. Sort by priority (Bug 13.2 fix: enforce integer priority)
    candidates.sort((a, b) => (Math.floor(b.priority || 0)) - (Math.floor(a.priority || 0)));

    // 3. Evaluate detailed logic conditions
    for (const offer of candidates) {
      if (this.evaluateOfferConditions(offer, cart, patient, services, evaluationDate)) {
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
      // Pick the exclusive offer with the highest PRIORITY, or if equal, highest discount
      const bestExclusive = exclusives.reduce((best, curr) => {
        const bestPrio = Math.floor(best.offer.priority || 0);
        const currPrio = Math.floor(curr.offer.priority || 0);
        if (currPrio > bestPrio) return curr;
        if (currPrio < bestPrio) return best;
        return curr.discountAmount > best.discountAmount ? curr : best;
      });
      return [bestExclusive];
    }

    return nonExclusives;
  }

  private evaluateOfferConditions(offer: Offer, cart: CartItem[], patient: Patient, services: Service[], evaluationDate: Date): boolean {
    if (!offer.conditions || offer.conditions.length === 0) return true;
    // Top level is always implicit AND
    return offer.conditions.every(cond => this.evaluateCondition(cond, cart, patient, services, evaluationDate));
  }

  private evaluateCondition(condition: OfferCondition, cart: CartItem[], patient: Patient, services: Service[], evaluationDate: Date): boolean {
    switch (condition.type) {
      case 'group':
        if (!condition.children || condition.children.length === 0) return true;
        if (condition.logic === 'OR') {
          return condition.children.some(child => this.evaluateCondition(child, cart, patient, services, evaluationDate));
        } else {
          // Default to AND
          return condition.children.every(child => this.evaluateCondition(child, cart, patient, services, evaluationDate));
        }

      case 'service_includes':
        return this.evaluateServiceIncludes(condition, cart, services);

      case 'min_spend':
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return total >= (condition.parameters.minAmount || 0);

      case 'new_patient':
         // Bug 13.12a fix: Use visitCount instead of creation date
        const isNew = (patient.visitCount || 0) <= 1;
         return isNew;

      case 'patient_tag':
        // Check if patient has any of the required tags (match against real tags + medical fields)
        if (!condition.parameters.tags || condition.parameters.tags.length === 0) return true;

        const patientTags = [
            ...(patient.tags || []),            // Real marketing tags
            String(patient.skinType || ''),
            ...(patient.allergies || []),
            ...(patient.chronicConditions || []),
            ...(patient.contraindications || [])
        ].filter(Boolean).map(t => t.toLowerCase());

        const targetTags = condition.parameters.tags.map(t => t.toLowerCase());

        if (condition.operator === 'not_contains' || condition.operator === 'not_in') {
             return !targetTags.some(tag => patientTags.includes(tag));
        }
        // flexible match: if ANY target tag is present
        return targetTags.some(tag => patientTags.includes(tag));

      case 'date_range':
        if (condition.parameters.startDate && new Date(condition.parameters.startDate) > evaluationDate) return false;
        if (condition.parameters.endDate && new Date(condition.parameters.endDate) < evaluationDate) return false;
        return true;

      case 'specific_patient':
        if (!condition.parameters.patientIds || condition.parameters.patientIds.length === 0) return true;
        return condition.parameters.patientIds.includes(patient.id);

      case 'time_range':
        return this.evaluateTimeRange(condition, evaluationDate);

      case 'day_of_week':
        return this.evaluateDayOfWeek(condition, evaluationDate);

      case 'customer_attribute':
        return this.evaluateAttribute(condition, patient, evaluationDate);

      case 'visit_count':
        // Now using real visit count from backend
        return this.compareValues(patient.visitCount || 0, condition.parameters.threshold || 0, condition.operator || 'greater_than');

      case 'cart_property':
         return this.evaluateCartProperty(condition, cart, services);

      default:
        return true;
    }
  }

  private evaluateTimeRange(condition: OfferCondition, evaluationDate: Date): boolean {
      if (!condition.parameters.startTime || !condition.parameters.endTime) return true;
      const currentMinutes = evaluationDate.getHours() * 60 + evaluationDate.getMinutes();

      const [startH, startM] = condition.parameters.startTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;

      const [endH, endM] = condition.parameters.endTime.split(':').map(Number);
      const endMinutes = endH * 60 + endM;

      if (endMinutes < startMinutes) {
          // Overnight range (e.g. 22:00 to 02:00)
          return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      }
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  private evaluateDayOfWeek(condition: OfferCondition, evaluationDate: Date): boolean {
      if (!condition.parameters.daysOfWeek || condition.parameters.daysOfWeek.length === 0) return true;
      const day = evaluationDate.getDay(); // 0-6 (Sun-Sat)
      return condition.parameters.daysOfWeek.includes(day);
  }

  private evaluateAttribute(condition: OfferCondition, patient: Patient, evaluationDate: Date): boolean {
      const attr = condition.parameters.attributeName;
      if (!attr) return true;

      let value: any = undefined;

      // Handle derived or mapped attributes
      if (attr === 'age') {
          if (!patient.dateOfBirth) return false;
          const birthDate = new Date(patient.dateOfBirth);
          let age = evaluationDate.getFullYear() - birthDate.getFullYear();
          const m = evaluationDate.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && evaluationDate.getDate() < birthDate.getDate())) {
              age--;
          }
          value = age;
      } else if (attr === 'visitCount') {
          value = patient.visitCount || 0;
      } else {
          // Fallback to direct property access
          value = (patient as any)[attr];
      }

      return this.compareValues(value, condition.parameters.attributeValue, condition.operator);
  }

  private compareValues(value: any, target: any, operator: string = 'equals'): boolean {
      // Type coercion for comparison
      if (typeof target === 'number') {
          value = Number(value);
      }

      switch (operator) {
          case 'equals': return String(value).toLowerCase() === String(target).toLowerCase();
          case 'not_equals': return String(value).toLowerCase() !== String(target).toLowerCase();
          case 'greater_than': return Number(value) > Number(target);
          case 'less_than': return Number(value) < Number(target);
          case 'contains': return String(value).toLowerCase().includes(String(target).toLowerCase());
          case 'not_contains': return !String(value).toLowerCase().includes(String(target).toLowerCase());
          case 'in': return Array.isArray(target) && target.map((t: any) => String(t).toLowerCase()).includes(String(value).toLowerCase());
          case 'not_in': return Array.isArray(target) && !target.map((t: any) => String(t).toLowerCase()).includes(String(value).toLowerCase());
          default: return String(value).toLowerCase() === String(target).toLowerCase();
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

    if (targetIds.size === 0) return true;

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
      return isMatch;
    } else if (matchType === 'exact') {
      // Bug 13.10 & 13.11 fix: 'exact' means cart contains ALL target IDs and NO OTHER target IDs.
      const hasAllTargets = Array.from(targetIds).every(id => cartHasId(id));
      const hasNoOthers = Array.from(cartServiceIds).every(id => targetIds.has(id));
      isMatch = hasAllTargets && hasNoOthers;
    } else {
      // 'all' - Cart must contain ALL target IDs
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

  private evaluateCartProperty(condition: OfferCondition, cart: CartItem[], allServices: Service[]): boolean {
      const prop = condition.parameters.attributeName; // 'totalQuantity', 'totalItems', 'distinctCategories'
      let value = 0;

      if (prop === 'totalQuantity') {
          value = cart.reduce((sum, item) => sum + item.quantity, 0);
      } else if (prop === 'totalItems') { // Distinct service IDs
          value = cart.length;
      } else if (prop === 'totalAmount') {
          value = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      } else if (prop === 'distinctCategories') {
          const cats = new Set<string>();
          cart.forEach(item => {
              const svc = allServices.find(s => s.id === item.serviceId);
              if (svc && svc.categoryId) cats.add(svc.categoryId);
          });
          value = cats.size;
      }

      return this.compareValues(value, condition.parameters.threshold, condition.operator || 'greater_than');
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
        const totalQty = qualifying.reduce((sum: number, i: CartItem) => sum + i.quantity, 0);
        if (totalQty >= buyQty) {
          const freeItems = Math.floor(totalQty / (buyQty + freeQty)) * freeQty;
          if (freeItems > 0 && qualifying.length > 0) {
            // Use the cheapest qualifying item price for free sessions
            const cheapest = Math.min(...qualifying.map((i: CartItem) => i.price));
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
