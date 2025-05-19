import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { LanguageSwitcherComponent } from '../../../../shared/components/language-switcher/language-switcher.component';

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
    MatProgressSpinnerModule,
    LanguageSwitcherComponent
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
    private notificationService: NotificationService,
    private changeDetectorRef: ChangeDetectorRef
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
    
    // If there's a session error in the URL, show it
    const error = this.route.snapshot.queryParams['error'];
    if (error) {
      this.notificationService.showError(error);
      // Remove the error from the URL
      this.router.navigate([], {
        queryParams: { error: null },
        queryParamsHandling: 'merge'
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async onSubmit(): Promise<void> {
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

    // Manually clear any existing tokens to avoid lock conflicts
    localStorage.removeItem('sb:token');
    localStorage.removeItem('sb:refresh_token');
    sessionStorage.removeItem('sb:token');
    sessionStorage.removeItem('sb:refresh_token');

    try {
      console.log('LoginComponent - Attempting login with email:', email);
      
      // Call the authentication service
      this.authService.login(email, password).subscribe({
        next: (response) => {
          console.log('LoginComponent - Login successful, response:', response);
          
          // Show success message
          this.notificationService.showSuccess('AUTH.LOGIN.SUCCESS');
          
          // Get the return URL from route parameters or default to '/dashboard'
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          
          console.log('LoginComponent - Navigating to:', returnUrl);
          
          // Manually force navigation to dashboard using a hard redirect
          console.log('LoginComponent - Forcing direct redirection to dashboard');
          // We need a clean redirect - delay slightly to allow the notification to show
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 300);
        },
        error: (error) => {
          console.error('Login error:', error);
          this.loading = false;
          this.changeDetectorRef.detectChanges();
          
          // Show appropriate error message
          let errorMessage = 'An error occurred during login';
          if (error.message.includes('Invalid email or password')) {
            errorMessage = 'Invalid email or password';
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please confirm your email before logging in';
          } else if (error.message.includes('connection')) {
            errorMessage = 'Unable to connect to the server. Please check your connection.';
          }
          
          this.notificationService.showError(errorMessage);
        },
        complete: () => {
          this.loading = false;
          this.changeDetectorRef.detectChanges();
        }
      });
      
    } catch (error: unknown) {
      this.loading = false;
      
      let errorMessage = 'AUTH.LOGIN.ERRORS.GENERIC';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'AUTH.LOGIN.ERRORS.INVALID_CREDENTIALS';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'AUTH.LOGIN.ERRORS.EMAIL_NOT_CONFIRMED';
        } else if ('status' in error && (error as any).status === 0) {
          errorMessage = 'AUTH.LOGIN.ERRORS.CONNECTION_ERROR';
        } else {
          errorMessage = error.message;
        }
      }
      
      this.notificationService.showError(errorMessage);
    } finally {
      this.loading = false;
    }
  }
}
