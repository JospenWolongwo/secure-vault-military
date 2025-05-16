import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private snackBar: MatSnackBar, private router: Router) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        let errorDetails = '';

        // Client-side error
        if (error.error instanceof ErrorEvent) {
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
          
          // Handle different HTTP error codes
          switch (error.status) {
            case 400:
              errorDetails = 'Bad Request';
              // Handle validation errors
              if (error.error?.errors) {
                const validationErrors = [];
                for (const key in error.error.errors) {
                  if (error.error.errors[key]) {
                    validationErrors.push(error.error.errors[key]);
                  }
                }
                errorDetails = validationErrors.join('\n');
              } else if (error.error?.title) {
                errorDetails = error.error.title;
              }
              break;
            case 401:
              // Handled by AuthInterceptor
              return throwError(() => error);
            case 403:
              errorDetails = 'You do not have permission to perform this action';
              break;
            case 404:
              errorDetails = 'The requested resource was not found';
              this.router.navigate(['/not-found']);
              break;
            case 500:
              errorDetails = 'Internal Server Error';
              if (error.error?.detail) {
                errorDetails = error.error.detail;
              }
              break;
            case 0:
              // Server not reachable
              errorMessage = 'Unable to connect to the server. Please check your connection.';
              errorDetails = 'Server not reachable';
              break;
            default:
              errorDetails = error.message;
          }
        }

        // Show error message to the user
        this.showError(errorMessage, errorDetails);

        // Log the error to the console
        console.error('ErrorInterceptor:', error);

        // Rethrow the error
        return throwError(() => ({
          message: errorMessage,
          details: errorDetails,
          originalError: error,
        }));
      })
    );
  }

  private showError(message: string, details?: string): void {
    // Show a snackbar with the error message
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });

    // Log detailed error to console
    if (details) {
      console.error('Error details:', details);
    }
  }
}
