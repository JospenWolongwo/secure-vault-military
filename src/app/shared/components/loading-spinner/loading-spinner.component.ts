import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="loading-spinner" [ngClass]="{ 'full-screen': fullScreen, 'overlay': overlay }">
      <mat-spinner [diameter]="diameter" [color]="color"></mat-spinner>
      <div class="loading-text" *ngIf="message">{{ message }}</div>
    </div>
  `,
  styles: [
    `
      .loading-spinner {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
      }
      
      .loading-spinner.full-screen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.9);
        z-index: 9999;
      }
      
      .loading-spinner.overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.8);
        z-index: 10;
      }
      
      .loading-text {
        margin-top: 1rem;
        font-size: 1rem;
        color: #666;
      }
    `,
  ],
})
export class LoadingSpinnerComponent implements OnChanges {
  @Input() message = 'Loading...';
  @Input() diameter = 50;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() fullScreen = false;
  @Input() overlay = false;

  ngOnChanges(changes: SimpleChanges): void {
    // If both fullScreen and overlay are true, overlay takes precedence
    if (changes['overlay'] && this.overlay) {
      this.fullScreen = false;
    }
  }
}
