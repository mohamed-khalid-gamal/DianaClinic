import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult } from 'sweetalert2';

export interface AlertOptions {
  timer?: number;
  showTimer?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SweetAlertService {
  // Brand colors
  private readonly primaryColor = '#0E7490';
  private readonly successColor = '#10B981';
  private readonly warningColor = '#F59E0B';
  private readonly dangerColor = '#EF4444';
  private readonly infoColor = '#3B82F6';

  /**
   * Display a success alert with auto-dismiss
   */
  success(title: string, message?: string, options?: AlertOptions): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      text: message,
      icon: 'success',
      confirmButtonColor: this.primaryColor,
      timer: options?.timer ?? 3000,
      timerProgressBar: options?.showTimer ?? true,
      showConfirmButton: false
    });
  }

  /**
   * Display an error alert
   */
  error(title: string, message?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      text: message,
      icon: 'error',
      confirmButtonColor: this.dangerColor,
      confirmButtonText: 'OK'
    });
  }

  /**
   * Display a warning alert
   */
  warning(title: string, message?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      text: message,
      icon: 'warning',
      confirmButtonColor: this.warningColor,
      confirmButtonText: 'OK'
    });
  }

  /**
   * Display an info alert
   */
  info(title: string, message?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      text: message,
      icon: 'info',
      confirmButtonColor: this.infoColor,
      confirmButtonText: 'Got it'
    });
  }

  /**
   * Display a confirmation dialog
   * @returns Promise that resolves to true if confirmed, false otherwise
   */
  confirm(
    title: string,
    message?: string,
    confirmText: string = 'Yes',
    cancelText: string = 'Cancel'
  ): Promise<boolean> {
    return Swal.fire({
      title,
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: this.primaryColor,
      cancelButtonColor: '#6B7280',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true
    }).then((result) => result.isConfirmed);
  }

  /**
   * Display a delete confirmation dialog with danger styling
   * @returns Promise that resolves to true if confirmed, false otherwise
   */
  confirmDelete(itemName: string, itemType: string = 'item'): Promise<boolean> {
    return Swal.fire({
      title: 'Delete ' + itemType + '?',
      html: `Are you sure you want to delete <strong>${itemName}</strong>?<br><small class="text-muted">This action cannot be undone.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: this.dangerColor,
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true
    }).then((result) => result.isConfirmed);
  }

  /**
   * Display a quick toast notification in the corner
   */
  toast(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'success',
    position: 'top' | 'top-end' | 'bottom' | 'bottom-end' = 'top-end'
  ): Promise<SweetAlertResult> {
    const Toast = Swal.mixin({
      toast: true,
      position,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      }
    });

    return Toast.fire({
      icon: type,
      title: message
    });
  }

  /**
   * Display a success message for created items
   */
  created(itemType: string, itemName?: string): Promise<SweetAlertResult> {
    const message = itemName 
      ? `${itemType} "${itemName}" has been created successfully.`
      : `${itemType} has been created successfully.`;
    return this.toast(message, 'success');
  }

  /**
   * Display a success message for updated items
   */
  updated(itemType: string, itemName?: string): Promise<SweetAlertResult> {
    const message = itemName 
      ? `${itemType} "${itemName}" has been updated successfully.`
      : `${itemType} has been updated successfully.`;
    return this.toast(message, 'success');
  }

  /**
   * Display a success message for deleted items
   */
  deleted(itemType: string, itemName?: string): Promise<SweetAlertResult> {
    const message = itemName 
      ? `${itemType} "${itemName}" has been deleted.`
      : `${itemType} has been deleted.`;
    return this.toast(message, 'success');
  }

  /**
   * Display a booking/appointment confirmation
   */
  bookingConfirmed(count: number = 1): Promise<SweetAlertResult> {
    return Swal.fire({
      title: 'Booking Confirmed!',
      text: `Successfully scheduled ${count} appointment${count > 1 ? 's' : ''}.`,
      icon: 'success',
      confirmButtonColor: this.primaryColor,
      timer: 3000,
      timerProgressBar: true
    });
  }

  /**
   * Display an invoice/payment confirmation
   */
  invoicePaid(amount: number, additionalMessage?: string): Promise<SweetAlertResult> {
    let text = `Invoice processed successfully.\nPayment: ${amount} EGP`;
    if (additionalMessage) {
      text += `\n${additionalMessage}`;
    }
    
    return Swal.fire({
      title: 'Invoice Paid',
      text,
      icon: 'success',
      confirmButtonColor: this.primaryColor,
      timer: 3000,
      timerProgressBar: true
    });
  }

  /**
   * Display session started notification
   */
  sessionStarted(patientName: string): Promise<SweetAlertResult> {
    return this.toast(`Session started for ${patientName}`, 'success');
  }

  /**
   * Display session ended notification
   */
  sessionEnded(patientName: string): Promise<SweetAlertResult> {
    return this.success(
      'Session Completed',
      `Session for ${patientName} has been completed and moved to billing.`
    );
  }

  /**
   * Display wallet top-up confirmation
   */
  walletTopUp(amount: number, patientName: string): Promise<SweetAlertResult> {
    return this.success(
      'Wallet Topped Up',
      `${amount} EGP has been added to ${patientName}'s wallet.`
    );
  }

  /**
   * Display validation warning
   */
  validationError(message: string): Promise<SweetAlertResult> {
    return this.warning('Validation Error', message);
  }
}
