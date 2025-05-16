import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetPasswordForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  loading = false;
  resetSuccess = false;
  private token: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {
    // Initialize the form with validation
    this.resetPasswordForm = this.formBuilder.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.pattern(
              '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$'
            ),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validator: this.checkPasswords }
    );
  }


  ngOnInit(): void {
    // Get the token from the route
    this.token = this.route.snapshot.paramMap.get('token') || '';
    
    if (!this.token) {
      this.notificationService.showError('Invalid or missing reset token');
      this.router.navigate(['/auth/forgot-password']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Custom validator to check if passwords match
   */
  checkPasswords(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    // Stop if form is invalid
    if (this.resetPasswordForm.invalid) {
      return;
    }

    this.loading = true;
    const password = this.resetPasswordForm.get('password')?.value;

    // Call the authentication service
    this.authService
      .resetPassword(this.token, password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.resetSuccess = true;
        },
        error: (error) => {
          this.loading = false;
          let errorMessage = 'Failed to reset password. Please try again.';
          
          if (error.status === 400) {
            errorMessage = 'Invalid or expired reset token.';
          } else if (error.status === 0) {
            errorMessage = 'Unable to connect to the server. Please check your connection.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.errors) {
            // Handle validation errors from the server
            const errorMessages = Object.values(error.error.errors).flat();
            errorMessage = errorMessages.join(' ');
          }
          
          this.notificationService.showError(errorMessage);
          
          // If the token is invalid, redirect to forgot password
          if (error.status === 400) {
            setTimeout(() => {
              this.router.navigate(['/auth/forgot-password']);
            }, 3000);
          }
        },
      });
  }

  onLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
