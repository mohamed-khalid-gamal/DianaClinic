import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NgForm } from '@angular/forms';

/**
 * Service to map backend validation errors to Angular form controls.
 * 
 * Handles two response formats:
 * 1. ASP.NET ModelState: { errors: { FieldName: ["message"] }, title: "..." }
 * 2. Custom middleware: { error: "summary", errors: { fieldName: ["message"] } }
 * 
 * Usage in components:
 * ```ts
 * error: (err: HttpErrorResponse) => {
 *   this.formErrorService.handleBackendErrors(err, this.myForm);
 *   this.saving = false;
 *   this.cdr.markForCheck();
 * }
 * ```
 * 
 * In templates, display server errors:
 * ```html
 * <span class="error-text" *ngIf="firstName.errors?.['serverError']">
 *   {{ firstName.errors?.['serverError'] }}
 * </span>
 * ```
 */
@Injectable({ providedIn: 'root' })
export class FormErrorService {

  /** Maps backend field names to frontend form control names */
  private readonly fieldMappings: Record<string, string> = {
    // PatientDtos
    'FirstName': 'firstName',
    'LastName': 'lastName',
    'Phone': 'phone',
    'Email': 'email',
    'DateOfBirth': 'dateOfBirth',
    'Gender': 'gender',
    'SkinType': 'skinType',
    // DoctorDtos (uses "Name" on backend, "doctorName" on frontend)
    'Name': 'doctorName',
    'Specialty': 'specialty',
    // RoomDtos
    'Capacity': 'capacity',
    'Floor': 'floor',
    // DeviceDtos
    'SerialNumber': 'serialNumber',
    'Model': 'model',
    'MaintenanceThreshold': 'maintenanceThreshold',
    // InventoryDtos
    'Sku': 'sku',
    'Quantity': 'quantity',
    'CostPrice': 'costPrice',
    'SellingPrice': 'sellingPrice',
    'ReorderThreshold': 'reorderThreshold',
    // OfferDtos
    'Priority': 'priority',
    'Description': 'description',
    'UsageLimitPerPatient': 'usageLimitPerPatient',
    'TotalUsageLimit': 'totalUsageLimit',
    // AppointmentDtos
    'PatientId': 'patientId',
    'DoctorId': 'doctorId',
    'RoomId': 'roomId',
    'ScheduledStart': 'scheduledStart',
    'ScheduledEnd': 'scheduledEnd',
    // SessionDtos
    'Notes': 'notes',
    'ClinicalNotes': 'clinicalNotes',
    'Status': 'status',
    // InvoiceDtos
    'Subtotal': 'subtotal',
    'Discount': 'discount',
    'Tax': 'tax',
    'Total': 'total',
    // WalletDtos
    'Amount': 'amount',
    // Common (new patient in appointment)
    'newFirstName': 'newFirstName',
    'newLastName': 'newLastName',
    'newPhone': 'newPhone',
    'newEmail': 'newEmail',
  };

  /**
   * Parse backend validation errors and set them on matching form controls.
   * Returns true if field-level errors were found and mapped, false otherwise.
   */
  handleBackendErrors(error: HttpErrorResponse, form?: NgForm): boolean {
    if (!error?.error || error.status !== 400) {
      return false;
    }

    const body = error.error;
    const errors: Record<string, string[]> | undefined = body?.errors;

    if (!errors || typeof errors !== 'object') {
      return false;
    }

    let mapped = false;

    for (const [backendField, messages] of Object.entries(errors)) {
      if (!Array.isArray(messages) || messages.length === 0) continue;

      const errorMessage = messages[0]; // Take the first error message
      const controlName = this.resolveControlName(backendField);

      if (form) {
        const control = form.controls[controlName];
        if (control) {
          // Set a custom 'serverError' validator on the control
          control.setErrors({ ...control.errors, serverError: errorMessage });
          control.markAsTouched();
          mapped = true;
        }
      }
    }

    return mapped;
  }

  /**
   * Extract error summary from backend response (for SweetAlert fallback).
   */
  getErrorSummary(error: HttpErrorResponse): string {
    if (!error?.error) return 'An unexpected error occurred.';
    
    const body = error.error;
    const errors: Record<string, string[]> | undefined = body?.errors;

    if (errors && typeof errors === 'object') {
      const messages: string[] = [];
      for (const fieldErrors of Object.values(errors)) {
        if (Array.isArray(fieldErrors)) {
          messages.push(...fieldErrors);
        }
      }
      if (messages.length > 0) {
        return messages.join('. ');
      }
    }

    return body?.error || body?.message || body?.title || 'Please check your input and try again.';
  }

  /**
   * Clear all server errors from form controls.
   * Call this when the user starts editing to remove stale backend errors.
   */
  clearServerErrors(form: NgForm): void {
    if (!form?.controls) return;

    for (const control of Object.values(form.controls)) {
      if (control.errors?.['serverError']) {
        const { serverError, ...remainingErrors } = control.errors;
        control.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null);
      }
    }
  }

  private resolveControlName(backendField: string): string {
    // Direct mapping lookup
    if (this.fieldMappings[backendField]) {
      return this.fieldMappings[backendField];
    }

    // Handle dot notation (e.g., "Benefits[0].Parameters.Percent" → try "percent")
    const lastPart = backendField.split('.').pop() || backendField;
    if (this.fieldMappings[lastPart]) {
      return this.fieldMappings[lastPart];
    }

    // Fallback: convert PascalCase to camelCase
    return lastPart.charAt(0).toLowerCase() + lastPart.slice(1);
  }
}
