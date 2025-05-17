import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

// Components
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';

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
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

@NgModule({
  // No need to declare or import standalone components here
  // They are loaded via the router
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
  ],
  providers: [
    AuthService,
    MilitaryVerificationService
  ]
})
export class AuthModule {}
