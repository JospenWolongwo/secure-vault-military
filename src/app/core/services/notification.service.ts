import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef } from '@angular/material/snack-bar';
import { NotificationComponent } from '../../shared/components/notification/notification.component';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationConfig {
  type?: NotificationType;
  duration?: number;
  action?: string;
  verticalPosition?: 'top' | 'bottom';
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
  panelClass?: string | string[];
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private snackBarDefaultConfig: MatSnackBarConfig = {
    duration: 5000,
    verticalPosition: 'top',
    horizontalPosition: 'right',
    panelClass: ['notification'],
  };

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Shows a success notification
   * @param message The message to display
   * @param config Optional configuration
   */
  showSuccess(message: string, config?: NotificationConfig): MatSnackBarRef<any> {
    return this.show(message, { ...config, type: 'success' });
  }

  /**
   * Shows an error notification
   * @param message The message to display
   * @param config Optional configuration
   */
  showError(message: string, config?: NotificationConfig): MatSnackBarRef<any> {
    return this.show(message, { ...config, type: 'error' });
  }

  /**
   * Shows an info notification
   * @param message The message to display
   * @param config Optional configuration
   */
  showInfo(message: string, config?: NotificationConfig): MatSnackBarRef<any> {
    return this.show(message, { ...config, type: 'info' });
  }

  /**
   * Shows a warning notification
   * @param message The message to display
   * @param config Optional configuration
   */
  showWarning(message: string, config?: NotificationConfig): MatSnackBarRef<any> {
    return this.show(message, { ...config, type: 'warning' });
  }

  /**
   * Shows a custom notification
   * @param message The message to display
   * @param config Optional configuration
   */
  show(message: string, config: NotificationConfig = {}): MatSnackBarRef<any> {
    const { type = 'info', duration, action, verticalPosition, horizontalPosition, panelClass } = config;

    const snackBarConfig: MatSnackBarConfig = {
      ...this.snackBarDefaultConfig,
      duration: duration !== undefined ? duration : this.snackBarDefaultConfig.duration,
      verticalPosition: verticalPosition || this.snackBarDefaultConfig.verticalPosition,
      horizontalPosition: horizontalPosition || this.snackBarDefaultConfig.horizontalPosition,
      panelClass: this.getPanelClasses(type, panelClass),
      data: {
        message,
        type,
        action,
      },
    };

    return this.snackBar.openFromComponent(NotificationComponent, snackBarConfig);
  }

  /**
   * Dismisses the currently open notification
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }

  /**
   * Gets the panel classes based on the notification type
   * @param type The notification type
   * @param customClasses Custom CSS classes
   * @private
   */
  private getPanelClasses(type: NotificationType, customClasses?: string | string[]): string[] {
    const baseClasses = ['notification', `notification-${type}`];
    
    if (Array.isArray(customClasses)) {
      return [...baseClasses, ...customClasses];
    } else if (typeof customClasses === 'string') {
      return [...baseClasses, customClasses];
    }
    
    return baseClasses;
  }
}
