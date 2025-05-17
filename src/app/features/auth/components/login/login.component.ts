import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Translation
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-login',
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
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  hidePassword = true;
  loading = false;
  returnUrl: string;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {
    // Initialize the form
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false],
    });

    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }


  ngOnInit(): void {
    // Check if user is already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate([this.returnUrl]);
      return;
    }

    // Check for remember me
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      this.loginForm.patchValue({
        email: savedEmail,
        rememberMe: true,
      });
    }
    
    // Get return URL from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    // Stop if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    const { email, password, rememberMe } = this.loginForm.value;

    // Save email to localStorage if remember me is checked
    if (rememberMe) {
      localStorage.setItem('savedEmail', email);
    } else {
      localStorage.removeItem('savedEmail');
    }

    // Call the authentication service
    this.authService
      .login(email, password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Show success message
          this.notificationService.showSuccess('AUTH.LOGIN.SUCCESS');
          
          // Navigate to the return URL or dashboard
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigateByUrl(returnUrl).catch(() => {
            // If navigation fails (e.g., invalid return URL), go to dashboard
            this.router.navigate(['/dashboard']);
          });
        },
        error: (error) => {
          this.loading = false;
          let errorMessage = 'Login failed. Please try again.';
          
          if (error.status === 401) {
            errorMessage = 'Invalid email or password.';
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
