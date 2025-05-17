import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { NotificationService } from '@app/core/services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Material modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-confirm-email',
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <div class="confirm-email-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ 'AUTH.CONFIRM_EMAIL.TITLE' | translate }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="!isLoading; else loading">
            <p>{{ 'AUTH.CONFIRM_EMAIL.INSTRUCTIONS' | translate:{email: email} }}</p>
            <p>{{ 'AUTH.CONFIRM_EMAIL.CHECK_SPAM' | translate }}</p>
          </div>
          <ng-template #loading>
            <div class="loading-spinner">
              <mat-spinner diameter="40"></mat-spinner>
              <p>{{ 'COMMON.LOADING' | translate }}</p>
            </div>
          </ng-template>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="resendConfirmation()" [disabled]="isLoading">
            {{ 'AUTH.CONFIRM_EMAIL.RESEND_BUTTON' | translate }}
          </button>
          <button mat-button routerLink="/auth/login">
            {{ 'COMMON.BACK_TO_LOGIN' | translate }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .confirm-email-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 2rem;
      background-color: #f5f7fa;
    }
    
    .confirm-email-card {
      max-width: 500px;
      width: 100%;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .confirm-email-header {
      background-color: #f8f9fa;
      padding: 24px 24px 16px;
      border-bottom: 1px solid #e9ecef;
      text-align: center;
    }
    
    .confirm-email-title {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 600;
      color: #2c3e50;
      margin: 0;
    }
    
    .confirm-email-subtitle {
      color: #6c757d;
      margin-top: 8px;
      font-size: 0.95rem;
    }
    
    .header-icon {
      margin-right: 12px;
      color: #4361ee;
    }
    
    .confirm-email-content {
      padding: 32px;
      text-align: center;
    }
    
    .content-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .email-icon-container {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: #e9f0ff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }
    
    .email-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #4361ee;
    }
    
    .email-address {
      color: #2c3e50;
      margin: 0 0 16px;
      font-size: 1.1rem;
      font-weight: 500;
      word-break: break-all;
    }
    
    .instructions {
      color: #495057;
      line-height: 1.6;
      margin-bottom: 24px;
      font-size: 1rem;
    }
    
    .check-spam {
      display: flex;
      align-items: center;
      background-color: #fff8e6;
      border-left: 4px solid #ffc107;
      padding: 12px 16px;
      border-radius: 4px;
      margin: 16px 0;
      width: 100%;
      box-sizing: border-box;
    }
    
    .warning-icon {
      color: #ffc107;
      margin-right: 8px;
      font-size: 20px;
      height: 20px;
      width: 20px;
    }
    
    .check-spam span {
      color: #856404;
      font-size: 0.9rem;
      line-height: 1.4;
    }
    
    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
    }
    
    .loading-text {
      margin-top: 16px;
      color: #6c757d;
      font-size: 0.95rem;
    }
    
    .confirm-email-actions {
      display: flex;
      justify-content: space-between;
      padding: 16px 24px 24px;
      border-top: 1px solid #e9ecef;
      background-color: #f8f9fa;
    }
    
    .resend-button {
      min-width: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .resend-button mat-icon {
      margin-right: 8px;
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
    
    .back-to-login {
      display: flex;
      align-items: center;
    }
    
    .back-to-login mat-icon {
      margin-right: 6px;
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
    
    @media (max-width: 600px) {
      .confirm-email-actions {
        flex-direction: column;
        gap: 12px;
      }
      
      .resend-button,
      .back-to-login {
        width: 100%;
        margin: 0;
      }
    }
  `]
})
export class ConfirmEmailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  email: string = '';
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    // First check the route params
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const emailFromParams = params.get('email');
      if (emailFromParams) {
        this.email = decodeURIComponent(emailFromParams);
        return;
      }
      
      // Then check query params
      const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
      if (emailFromQuery) {
        this.email = decodeURIComponent(emailFromQuery);
        return;
      }
      
      // Finally check the state
      const navigation = this.router.getCurrentNavigation();
      const state = navigation?.extras.state as { email: string } | undefined;
      if (state?.email) {
        this.email = state.email;
      } else {
        // If no email found, redirect to register page
        this.router.navigate(['/auth/register']);
      }
    });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async resendConfirmation() {
    if (!this.email) {
      this.notificationService.showError('AUTH.CONFIRM_EMAIL.ERRORS.EMAIL_REQUIRED');
      return;
    }

    this.isLoading = true;
    
    try {
      // Try to resend the confirmation email
      // This is a placeholder - you'll need to implement the actual API call
      // in your auth service
      // Example:
      // await this.authService.resendConfirmationEmail(this.email).toPromise();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.notificationService.showSuccess('AUTH.CONFIRM_EMAIL.RESEND_SUCCESS');
    } catch (error) {
      console.error('Error resending confirmation email:', error);
      this.notificationService.showError('AUTH.CONFIRM_EMAIL.ERRORS.RESEND_FAILED');
    } finally {
      this.isLoading = false;
    }
  }
}
