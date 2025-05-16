import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Rank } from '../../../../core/models/user.model';

@Component({
  selector: 'app-register',
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

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
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
      militaryId: ['', [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9-]+$'),
        Validators.minLength(6),
        Validators.maxLength(20)
      ]],
      rank: ['', Validators.required],
      unit: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$')
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
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else if (confirmPassword && confirmPassword.hasError('passwordMismatch')) {
      delete confirmPassword.errors?.['passwordMismatch'];
      confirmPassword.updateValueAndValidity();
    }
    return null;
  }

  // Getter for easy access to form fields
  get f() { return this.registerForm.controls; }

  onSubmit(): void {
    // Mark all fields as touched to trigger validation messages
    this.registerForm.markAllAsTouched();
    
    if (this.registerForm.invalid) {
      // Scroll to the first invalid field
      const firstInvalidControl = document.querySelector('.ng-invalid');
      if (firstInvalidControl) {
        firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    this.loading = true;
    this.error = '';
    
    // Remove confirmPassword before sending to server
    const { confirmPassword, ...userData } = this.registerForm.value;

    this.authService.register(userData).subscribe({
      next: () => {
        this.notificationService.showSuccess('Registration successful! Please check your email to verify your account.');
        this.router.navigate(['/auth/registration-success'], { 
          state: { email: userData.email } 
        });
      },
      error: (error) => {
        this.error = error.message || 'Registration failed. Please try again.';
        
        // Handle specific error cases
        if (error.error?.errors) {
          // Handle field-specific errors from the server
          const fieldErrors = error.error.errors;
          Object.keys(fieldErrors).forEach(field => {
            const formControl = this.registerForm.get(field);
            if (formControl) {
              // Set the server error message
              formControl.setErrors({ serverError: fieldErrors[field][0] });
            }
          });
          
          // Show the first error message
          const firstError = Object.values(fieldErrors)[0]?.[0];
          if (firstError) {
            this.notificationService.showError(firstError);
          }
        } else {
          // Generic error message
          this.notificationService.showError(this.error);
        }
        
        this.loading = false;
        
        // Scroll to the first error
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
