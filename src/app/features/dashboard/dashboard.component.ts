import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard-container">
      <mat-card class="dashboard-card">
        <mat-card-header>
          <mat-card-title>Welcome to SecureVault Military</mat-card-title>
          <mat-card-subtitle>Your secure document management solution</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>You are now logged in to your secure dashboard.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
    }
    
    .dashboard-card {
      max-width: 600px;
      width: 100%;
    }
  `]
})
export class DashboardComponent {}
