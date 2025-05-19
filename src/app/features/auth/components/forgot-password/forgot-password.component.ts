import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Translation
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
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
    private notificationService: NotificationService,
    private translate: TranslateService
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
            this.translate.instant('AUTH.FORGOT_PASSWORD.SUCCESS')
          );
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          this.loading = false;
          let errorKey = 'AUTH.FORGOT_PASSWORD.ERRORS.GENERIC';
          
          if (error.status === 404) {
            errorKey = 'AUTH.FORGOT_PASSWORD.ERRORS.EMAIL_NOT_FOUND';
          } else if (error.status === 0) {
            errorKey = 'COMMON.ERRORS.NETWORK';
          } else if (error.error?.message) {
            errorKey = error.error.message;
          }
          
          const errorMessage = this.translate.instant(errorKey);
          
          this.notificationService.showError(errorMessage);
        },
      });
  }
}
