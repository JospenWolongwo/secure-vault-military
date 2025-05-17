import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmDialogData } from './confirm-dialog.interface';

@Component({
  standalone: true,
  selector: 'app-confirm-dialog',
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button *ngIf="data.showCancel" (click)="onNoClick()">
        {{ data.cancelText || 'Cancel' }}
      </button>
      <button 
        mat-button 
        [color]="data.confirmColor || 'primary'" 
        [mat-dialog-close]="true"
        cdkFocusInitial>
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `
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

  onNoClick(): void {
    this.dialogRef.close(false);
  }
}
