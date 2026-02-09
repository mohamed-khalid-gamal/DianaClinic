import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SweetAlertService } from '../services/sweet-alert.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const alertService = inject(SweetAlertService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred.';
      let errorTitle = 'Error';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        switch (error.status) {
          case 400: // Bad Request
            errorTitle = 'Invalid Request';
            errorMessage = error.error?.error || error.error?.message || 'Please check your input.';
            break;
          case 401: // Unauthorized
            errorTitle = 'Unauthorized';
            errorMessage = 'You need to log in to perform this action.';
            break;
          case 403: // Forbidden
            errorTitle = 'Access Denied';
            errorMessage = 'You do not have permission to perform this action.';
            break;
          case 404: // Not Found
            errorTitle = 'Not Found';
            errorMessage = 'The requested resource was not found.';
            break;
          case 409: // Conflict
            errorTitle = 'Operation Failed';
            errorMessage = error.error?.error || 'This operation conflicts with existing data.';
            if (error.error?.details) {
              errorMessage += ` (${error.error.details})`;
            }
            break;
          case 500: // Internal Server Error
            errorTitle = 'Server Error';
            errorMessage = 'Something went wrong on our end. Please try again later.';
            break;
          default:
            errorMessage = error.message || error.statusText;
            break;
        }
      }

      // Display the error using SweetAlert
      alertService.error(errorTitle, errorMessage);

      // Re-throw the error so components can still react if needed (e.g., stop loading spinners)
      return throwError(() => error);
    })
  );
};
