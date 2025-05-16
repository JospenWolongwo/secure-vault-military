import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  forgotPasswordForm: FormGroup;
  loading = false;
  emailSent = false;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    // Initialize the form
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    // Stop if form is invalid
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.loading = true;
    const email = this.forgotPasswordForm.get('email')?.value;

    // Call the authentication service
    this.authService
      .forgotPassword(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.emailSent = true;
          this.loading = false;
          this.notificationService.showSuccess(
            'Password reset link has been sent to your email.'
          );
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          this.loading = false;
          let errorMessage = 'Failed to send reset link. Please try again.';
          
          if (error.status === 404) {
            errorMessage = 'No account found with this email address.';
          } else if (error.status === 0) {
            errorMessage = 'Unable to connect to the server. Please check your connection.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.notificationService.showError(errorMessage);
        },
      });
  }
}
