import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

// Material modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

// Components
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ConfirmEmailComponent } from './components/confirm-email/confirm-email.component';

// Services
import { AuthService } from '../../core/services/auth.service';
import { MilitaryVerificationService } from '../../core/services/military-verification.service';

const routes: Routes = [
  { path: 'login', component: LoginComponent, data: { title: 'Login' } },
  { path: 'register', component: RegisterComponent, data: { title: 'Register' } },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    data: { title: 'Forgot Password' },
  },
  {
    path: 'reset-password/:token',
    component: ResetPasswordComponent,
    data: { title: 'Reset Password' },
  },
  {
    path: 'confirm-email',
    component: ConfirmEmailComponent,
    data: { title: 'Confirm Email' },
  },
  {
    path: 'confirm-email/:email',
    component: ConfirmEmailComponent,
    data: { title: 'Confirm Email' },
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

@NgModule({
  declarations: [],
  imports: [
    // Angular modules
    CommonModule,
    RouterModule.forChild(routes),
    
    // Standalone components
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    ConfirmEmailComponent,
    
    // Shared module
    SharedModule,
    
    // Material modules
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    
    // i18n
    TranslateModule.forChild()
  ],
  providers: [
    AuthService,
    MilitaryVerificationService
  ]
})
export class AuthModule {}
