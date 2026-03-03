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
          case 400: // Bad Request — may include field-level validation errors
            errorTitle = 'Invalid Request';
            errorMessage = formatValidationErrors(error);
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

/**
 * Parse field-level validation errors from backend response.
 * Handles both ASP.NET ModelState format: { errors: { Field: ["msg"] } }
 * and custom middleware format: { error: "msg", errors: { field: ["msg"] } }
 */
function formatValidationErrors(error: HttpErrorResponse): string {
  const body = error.error;

  if (typeof body === 'string' && body.trim().length > 0) {
    return body;
  }

  // Check for field-level errors dictionary (ASP.NET ModelState or custom middleware)
  const errors: Record<string, string[]> | undefined = body?.errors;

  if (errors && typeof errors === 'object') {
    const messages: string[] = [];
    for (const [field, fieldErrors] of Object.entries(errors)) {
      if (Array.isArray(fieldErrors)) {
        // Format field name from PascalCase/camelCase to readable form
        const readableField = field
          .replace(/([A-Z])/g, ' $1')
          .replace(/^[\s.]/, '')
          .trim();
        fieldErrors.forEach(msg => {
          // If the message already contains the field name context, use it directly
          // Otherwise prefix with the readable field name
          if (msg.toLowerCase().includes(readableField.toLowerCase()) || !readableField) {
            messages.push(msg);
          } else {
            messages.push(`${readableField}: ${msg}`);
          }
        });
      }
    }

    if (messages.length > 0) {
      // If there's a summary error message, prepend it
      const summary = body?.error || body?.title || 'Please correct the following errors:';
      return `${summary}\n\n• ${messages.join('\n• ')}`;
    }
  }

  // Fallback to generic error message
  return body?.error || body?.message || body?.title || 'Please check your input.';
}
