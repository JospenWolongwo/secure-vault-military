import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <div class="illustration">
          <div class="code">404</div>
          <mat-icon class="large-icon">system_security_update_warning</mat-icon>
        </div>
        
        <h1>Page Non Trouvée</h1>
        <p>Nous sommes désolés, la page que vous recherchez n'existe pas ou est encore en cours de développement.</p>
        
        <div class="actions">
          <button mat-flat-button color="primary" [routerLink]="getReturnRoute()">
            <mat-icon>arrow_back</mat-icon>
            <span *ngIf="isAuthenticated">Retour au Tableau de Bord</span>
            <span *ngIf="!isAuthenticated">Retour à la Connexion</span>
          </button>
          
          <button mat-stroked-button color="primary" routerLink="/dashboard/documents">
            <mat-icon>folder</mat-icon>
            <span>Voir les Documents</span>
          </button>
        </div>
        
        <div class="info">
          <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support avec l'ID d'erreur ci-dessous:</p>
          <code>Error ID: {{ generateErrorId() }}</code>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 2rem;
      background-color: #f8f9fa;
      background-image: linear-gradient(135deg, rgba(255,255,255,.4) 25%, transparent 25%),
                        linear-gradient(225deg, rgba(255,255,255,.4) 25%, transparent 25%),
                        linear-gradient(45deg, rgba(255,255,255,.4) 25%, transparent 25%),
                        linear-gradient(315deg, rgba(255,255,255,.4) 25%, transparent 25%);
      background-position: 20px 0, 20px 0, 0 0, 0 0;
      background-size: 40px 40px;
    }
    
    .not-found-content {
      max-width: 600px;
      text-align: center;
      padding: 3rem;
      border-radius: 12px;
      background-color: white;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    h1 {
      font-size: 2rem;
      font-weight: 700;
      margin: 1rem 0;
      color: #333;
    }
    
    p {
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 2rem;
    }
    
    .illustration {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 2rem;
    }
    
    .code {
      font-size: 8rem;
      font-weight: 900;
      color: #f0f2f5;
      letter-spacing: -5px;
      user-select: none;
    }
    
    .large-icon {
      position: absolute;
      font-size: 5rem;
      width: 5rem;
      height: 5rem;
      color: #4a6bdf;
    }
    
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .actions button {
      padding: 0 1.5rem;
      height: 48px;
      font-weight: 500;
    }
    
    .actions button:first-child {
      background-color: #4a6bdf;
    }
    
    mat-icon {
      margin-right: 0.5rem;
    }
    
    .info {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #eee;
    }
    
    .info p {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    
    code {
      display: inline-block;
      padding: 0.5rem 1rem;
      background-color: #f5f7fa;
      border-radius: 4px;
      font-family: 'Roboto Mono', monospace;
      font-size: 0.9rem;
      color: #666;
      user-select: all;
    }
    
    @media (max-width: 600px) {
      .not-found-content {
        padding: 2rem 1.5rem;
      }
      
      .code {
        font-size: 6rem;
      }
      
      .large-icon {
        font-size: 4rem;
        width: 4rem;
        height: 4rem;
      }
      
      .actions {
        flex-direction: column;
      }
      
      .actions button {
        width: 100%;
      }
    }
  `]
})
export class NotFoundPageComponent implements OnInit {
  isAuthenticated = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Check if user is authenticated
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });
  }

  /**
   * Get the appropriate return route based on authentication status
   */
  getReturnRoute(): string {
    return this.isAuthenticated ? '/dashboard' : '/auth/login';
  }

  /**
   * Generate a random error ID to help with support requests
   * Format: SVT-404-XXXX (where X is random alphanumeric)  
   */
  generateErrorId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'SVT-404-';
    
    for (let i = 0; i < 4; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return id;
  }
}
