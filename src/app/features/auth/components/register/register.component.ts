import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, AsyncValidatorFn, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Rank } from '../../../../core/models/user.model';
import { MilitaryVerificationService } from '../../../../core/services/military-verification.service';
import { first, map, switchMap, debounceTime, distinctUntilChanged, catchError, of } from 'rxjs';

@Component({
  selector: 'app-register',
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
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  error = '';
  
  // Available military ranks
  ranks = Object.values(Rank);

  // Helper methods for password validation
  hasUppercase(value: string): boolean {
    return /[A-Z]/.test(value || '');
  }

  hasLowercase(value: string): boolean {
    return /[a-z]/.test(value || '');
  }

  hasNumber(value: string): boolean {
    return /\d/.test(value || '');
  }

  hasSpecialChar(value: string): boolean {
    return /[^\w\s]/.test(value || '');
  }

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private militaryVerificationService: MilitaryVerificationService,
    private router: Router,
    private notificationService: NotificationService,
    private translate: TranslateService
  ) {
    // Ensure translations are loaded
    this.translate.setDefaultLang('fr');
    this.translate.use('fr');
    this.registerForm = this.formBuilder.group({
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-Z\s\'-]+$')
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-Z\s\'-]+$')
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]],
      militaryId: ['', 
        {
          validators: [
            Validators.required,
            Validators.pattern('^[a-zA-Z0-9-]+$'),
            Validators.minLength(6),
            Validators.maxLength(20)
          ],
          asyncValidators: [this.militaryIdValidator()],
          updateOn: 'blur'
        }
      ],
      rank: ['', Validators.required],
      unit: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        // At least 1 uppercase, 1 lowercase, 1 number, and 1 special character
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s]).{8,}$')
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Focus first field on init
    setTimeout(() => {
      const firstNameField = document.getElementById('firstName');
      if (firstNameField) {
        firstNameField.focus();
      }
    });
  }

  // Custom validator to check if passwords match
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    // If either control is null, return null (no validation possible)
    if (!password || !confirmPassword) {
      return null;
    }
    
    // If password field is empty, don't validate yet (required validator will handle this)
    if (!password.value) {
      return null;
    }
    
    // Check if passwords match
    if (password.value !== confirmPassword.value) {
      // Set error on the form group
      return { passwordMismatch: true };
    }
    
    // Clear any existing password mismatch errors
    if (confirmPassword.hasError('passwordMismatch')) {
      const errors = { ...confirmPassword.errors };
      delete errors['passwordMismatch'];
      confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
    }
    
    return null;
  }

  // Getter for easy access to form fields
  get f() { return this.registerForm.controls; }

  /**
   * Validateur asynchrone pour vérifier l'ID militaire
   */
  private militaryIdValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) {
        return of(null);
      }

      const militaryId = control.value;
      const firstName = this.registerForm?.get('firstName')?.value || '';
      const lastName = this.registerForm?.get('lastName')?.value || '';
      const rank = this.registerForm?.get('rank')?.value || '';

      return of(control.value).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(() => 
          this.militaryVerificationService.verifyMilitaryId({
            militaryId,
            firstName,
            lastName,
            rank
          })
        ),
        map(response => {
          if (!response.isValid) {
            return { invalidMilitaryId: true };
          }
          return null;
        }),
        catchError(() => of({ verificationError: true }))
      );
    };
  }

  onSubmit(): void {
    // Reset error message
    this.error = '';

    // Mark all fields as touched to trigger validation messages
    Object.values(this.registerForm.controls).forEach(control => {
      control.markAsTouched();
    });

    // Manually trigger validation
    this.registerForm.updateValueAndValidity();

    // Check if form is valid
    if (this.registerForm.invalid) {
      // Find the first invalid control and focus it
      const firstInvalidControl = document.querySelector('.ng-invalid');
      if (firstInvalidControl) {
        firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Show loading state
    this.loading = true;
    this.error = '';

    // Get form values and ensure passwords match
    const formValue = this.registerForm.getRawValue();
    
    // Create a clean user data object
    const userData = {
      email: formValue.email,
      password: formValue.password,
      confirmPassword: formValue.confirmPassword,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      militaryId: formValue.militaryId,
      // Add other fields as needed
    };
    
    console.log('Submitting registration with data:', {
      ...userData,
      password: '***', // Don't log actual passwords
      confirmPassword: '***'
    });

    this.authService.register(userData).subscribe({
      next: (response) => {
        // Show success message with the user's email
        this.notificationService.showSuccess(
          this.translate.instant('AUTH.REGISTER.SUCCESS_MESSAGE', { email: userData.email })
        );
        
        // Always redirect to confirm-email page with the email as a route parameter
        this.router.navigate(['/auth/confirm-email', encodeURIComponent(userData.email)]);
      },
      error: (error) => {
        console.error('Registration error:', error);
        
        // Reset loading state
        this.loading = false;
        
        // Default error message
        let errorMessage = 'AUTH.REGISTER.ERRORS.REGISTRATION_FAILED';
        
        // Handle specific error messages
        if (error.message) {
          if (error.message.includes('Password mismatch') || 
              error.message.includes('Passwords do not match')) {
            errorMessage = 'AUTH.REGISTER.ERRORS.PASSWORD_MISMATCH';
            
            // Scroll to confirm password field
            const confirmPasswordField = document.getElementById('confirmPassword');
            if (confirmPasswordField) {
              confirmPasswordField.scrollIntoView({ behavior: 'smooth', block: 'center' });
              confirmPasswordField.focus();
            }
          } else if (error.message.includes('User already registered') || 
                    error.message.includes('already in use')) {
            errorMessage = 'AUTH.REGISTER.ERRORS.EMAIL_TAKEN';
          } else if (error.message.includes('password')) {
            errorMessage = 'AUTH.REGISTER.ERRORS.INVALID_PASSWORD';
          } else if (error.message.includes('email')) {
            errorMessage = 'AUTH.REGISTER.ERRORS.INVALID_EMAIL';
          } else if (error.message.includes('network')) {
            errorMessage = 'AUTH.REGISTER.ERRORS.NETWORK_ERROR';
          }
        }
        
        // Show the error message
        this.notificationService.showError(this.translate.instant(errorMessage));
        
        // Scroll to the first error field if available
        const firstInvalidControl = document.querySelector('.ng-invalid');
        if (firstInvalidControl) {
          firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
  
  // Helper method to check if a field has an error
  hasError(controlName: string, errorName: string): boolean {
    const control = this.registerForm.get(controlName);
    return control ? control.hasError(errorName) && (control.dirty || control.touched) : false;
  }
  
  // Get error message for a specific field
  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    
    if (!control || !control.errors) return '';
    
    if (control.hasError('required')) {
      return 'This field is required';
    } else if (control.hasError('email')) {
      return 'Please enter a valid email address';
    } else if (control.hasError('minlength')) {
      return `Minimum length is ${control.errors['minlength'].requiredLength} characters`;
    } else if (control.hasError('maxlength')) {
      return `Maximum length is ${control.errors['maxlength'].requiredLength} characters`;
    } else if (control.hasError('pattern')) {
      if (controlName === 'password') {
        return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
      } else if (controlName === 'militaryId') {
        return 'Only letters, numbers, and hyphens are allowed';
      } else if (['firstName', 'lastName'].includes(controlName)) {
        return 'Only letters, spaces, hyphens, and apostrophes are allowed';
      }
      return 'Invalid format';
    } else if (control.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    } else if (control.hasError('serverError')) {
      return control.errors['serverError'];
    }
    
    return 'Invalid field';
  }
}
