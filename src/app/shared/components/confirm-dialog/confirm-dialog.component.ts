import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  showCancel?: boolean;
  width?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button 
        mat-button 
        [mat-dialog-close]="false"
        *ngIf="data.showCancel !== false"
        data-testid="cancel-button"
      >
        {{ data.cancelText || 'Cancel' }}
      </button>
      
      <button 
        mat-flat-button 
        [color]="data.confirmColor || 'primary'"
        [mat-dialog-close]="true"
        cdkFocusInitial
        data-testid="confirm-button"
      >
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      h2 {
        margin: 0 0 1rem 0;
        padding: 0;
        color: rgba(0, 0, 0, 0.87);
      }
      
      mat-dialog-content {
        margin: 0 0 1.5rem 0;
        padding: 0;
        color: rgba(0, 0, 0, 0.6);
        line-height: 1.5;
      }
      
      mat-dialog-actions {
        margin: 0 -16px -16px -16px;
        padding: 0.75rem 1.5rem;
        justify-content: flex-end;
        border-top: 1px solid rgba(0, 0, 0, 0.12);
      }
      
      button {
        margin-left: 0.5rem;
        min-width: 80px;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    // Set default values
    this.data = {
      title: data.title || 'Confirm Action',
      message: data.message || 'Are you sure you want to perform this action?',
      confirmText: data.confirmText || 'Confirm',
      cancelText: data.cancelText || 'Cancel',
      confirmColor: data.confirmColor || 'primary',
      showCancel: data.showCancel !== false, // true by default
      width: data.width || '400px',
    };
  }

  /**
   * Open a confirmation dialog
   * @param dialog The MatDialog service
   * @param data Configuration for the dialog
   * @returns Observable that emits when the dialog is closed
   */
  static open(dialog: any, data: ConfirmDialogData) {
    return dialog.open(ConfirmDialogComponent, {
      width: data.width || '400px',
      disableClose: true,
      data,
    });
  }
}
