import { Component, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationType } from '../../../core/services/notification.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

interface NotificationData {
  message: string;
  type: NotificationType;
  action?: string;
}

@Component({
  standalone: true,
  selector: 'app-notification',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    TranslateModule
  ],
  template: `
    <div class="notification-container" [ngClass]="data.type">
      <div class="notification-icon">
        <mat-icon *ngIf="icon">{{ icon }}</mat-icon>
      </div>
      <div class="notification-content">
        <div class="notification-message">
          {{ isTranslationKey(data.message) ? (data.message | translate) : data.message }}
        </div>
        <div class="notification-action" *ngIf="data.action">
          <button mat-button (click)="onAction()">
            {{ isTranslationKey(data.action) ? (data.action | translate) : data.action }}
          </button>
        </div>
      </div>
      <button mat-icon-button class="close-button" (click)="dismiss()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styles: [
    `
      .notification-container {
        display: flex;
        align-items: center;
        padding: 14px 16px;
        border-radius: 4px;
        color: #fff;
        font-size: 14px;
        box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2),
                    0 6px 10px 0 rgba(0, 0, 0, 0.14),
                    0 1px 18px 0 rgba(0, 0, 0, 0.12);
        min-width: 300px;
        max-width: 500px;
        position: relative;
        overflow: hidden;
      }

      .notification-icon {
        margin-right: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .notification-icon mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .notification-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .notification-message {
        line-height: 1.4;
        margin-bottom: 4px;
      }

      .notification-action {
        margin-top: 4px;
      }

      .notification-action button {
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;
        padding: 0;
        min-width: auto;
        line-height: 1.2;
        text-transform: uppercase;
      }

      .notification-action button:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .close-button {
        margin-left: 8px;
        color: rgba(255, 255, 255, 0.7);
        width: 24px;
        height: 24px;
        line-height: 24px;
      }

      .close-button:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
      }

      /* Success notification */
      .notification-container.success {
        background-color: #4caf50;
      }

      /* Error notification */
      .notification-container.error {
        background-color: #f44336;
      }

      /* Info notification */
      .notification-container.info {
        background-color: #2196f3;
      }

      /* Warning notification */
      .notification-container.warning {
        background-color: #ff9800;
      }
    `,
  ],
})
export class NotificationComponent {
  constructor(
    public snackBarRef: MatSnackBarRef<NotificationComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: NotificationData,
    private translate: TranslateService
  ) {}

  /**
   * Checks if the provided string is a translation key
   * A simple heuristic: if it contains dots and either underscores or capital letters,
   * it's likely a translation key
   */
  isTranslationKey(str: string): boolean {
    if (!str) return false;
    return str.includes('.') && (str.includes('_') || /[A-Z]/.test(str));
  }

  /**
   * Returns the appropriate Material icon name based on notification type
   */
  get icon(): string {
    const iconMap: Record<NotificationType, string> = {
      'success': 'check_circle',
      'error': 'error_outline',
      'warning': 'warning',
      'info': 'info_outline'
    };
    
    return iconMap[this.data.type || 'info'];
  }

  /**
   * Handles the action button click
   */
  onAction(): void {
    this.snackBarRef.dismissWithAction();
  }

  /**
   * Dismisses the notification
   */
  dismiss(): void {
    this.snackBarRef.dismiss();
  }
}
