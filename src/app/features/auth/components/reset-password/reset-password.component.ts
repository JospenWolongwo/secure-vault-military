import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Translation
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
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
    private notificationService: NotificationService,
    private translate: TranslateService
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
      this.notificationService.showError(this.translate.instant('AUTH.RESET_PASSWORD.ERRORS.INVALID_TOKEN'));
      this.router.navigate(['/auth/forgot-password']);
    }
    
    // Set default language
    this.translate.setDefaultLang('fr');
    this.translate.use('fr');
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
      .updatePassword(this.token, password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.resetSuccess = true;
          this.notificationService.showSuccess(this.translate.instant('AUTH.RESET_PASSWORD.SUCCESS_MESSAGE'));
        },
        error: (error: any) => {
          this.loading = false;
          let errorKey = 'AUTH.RESET_PASSWORD.ERRORS.GENERIC';
          
          if (error.status === 400) {
            errorKey = 'AUTH.RESET_PASSWORD.ERRORS.INVALID_TOKEN';
          } else if (error.status === 0) {
            errorKey = 'COMMON.ERRORS.NETWORK';
          } else if (error.error?.message) {
            errorKey = error.error.message;
          } else if (error.error?.errors) {
            // Handle validation errors from the server
            const errorMessages = Object.values(error.error.errors).flat();
            errorKey = errorMessages.join(' ');
          }
          
          const errorMessage = this.translate.instant(errorKey);
          
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
