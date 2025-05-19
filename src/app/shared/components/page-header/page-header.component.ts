import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule, MatTooltip } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatDivider } from '@angular/material/divider';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  standalone: true,
  selector: 'app-page-header',
  imports: [
    CommonModule,
    RouterLink,
    NgClass,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTooltip,
    MatMenuModule,
    MatDividerModule,
    MatIcon,
    MatDivider,
    LanguageSwitcherComponent
  ],
  template: `
    <div class="page-header" [ngClass]="{ 'with-breadcrumbs': breadcrumbs && breadcrumbs.length > 0 }">
      <div class="header-content">
        <button *ngIf="showBackButton" mat-icon-button class="back-button" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="title-section">
          <h1 class="title">
            <ng-container *ngIf="icon">
              <mat-icon class="title-icon">{{ icon }}</mat-icon>
            </ng-container>
            {{ title }}
          </h1>
          <span class="subtitle" *ngIf="subtitle">{{ subtitle }}</span>
        </div>
        
        <div class="header-actions">
          <app-language-switcher class="language-selector"></app-language-switcher>
          <div class="actions" *ngIf="showActionButtons">
            <ng-content select="[actions]"></ng-content>
          </div>
        </div>
      </div>
      
      <nav class="breadcrumb" *ngIf="breadcrumbs && breadcrumbs.length > 0">
        <a *ngFor="let crumb of breadcrumbs; let last = last" 
           [routerLink]="crumb.url" 
           [class.active]="last"
           [matTooltip]="crumb.tooltip || ''"
           matTooltipPosition="below">
          {{ crumb.label }}
        </a>
      </nav>
      
      <mat-divider *ngIf="divider"></mat-divider>
    </div>
  `,
  styles: [
    `
      .page-header {
        margin-bottom: 2rem;
        padding: 0 24px;
      }
      
      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      
      .title-section {
        flex: 1;
      }
      
      .title {
        display: flex;
        align-items: center;
        margin: 0;
        font-size: 1.75rem;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
      }
      
      .title-icon {
        margin-right: 0.5rem;
        color: #3f51b5;
      }
      
      .subtitle {
        display: block;
        margin-top: 0.5rem;
        color: rgba(0, 0, 0, 0.6);
        font-size: 1rem;
      }
      
      .header-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
        
        .language-selector {
          margin-right: 0.5rem;
        }
        
        .actions {
          display: flex;
          gap: 0.5rem;
        }
      }
      
      .breadcrumb {
        display: flex;
        flex-wrap: wrap;
        padding: 0.75rem 0;
        margin-bottom: 1rem;
        list-style: none;
        background-color: transparent;
        border-radius: 0.25rem;
      }
      
      .breadcrumb a {
        color: #666;
        text-decoration: none;
        font-size: 0.9rem;
        transition: color 0.2s;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
      }
      
      .breadcrumb a:not(.active):hover {
        color: #3f51b5;
        background-color: rgba(63, 81, 181, 0.1);
      }
      
      .breadcrumb a:not(:last-child)::after {
        content: '/';
        margin: 0 0.5rem;
        color: #999;
      }
      
      .breadcrumb a.active {
        color: #3f51b5;
        font-weight: 500;
        cursor: default;
      }
      
      mat-divider {
        margin-top: 1rem;
      }
    `,
  ],
})
export class PageHeaderComponent implements OnInit {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() icon: string = '';
  @Input() showActionButtons: boolean = false;
  @Input() showBackButton: boolean = false;
  @Input() breadcrumbs: Breadcrumb[] = [];
  @Input() divider: boolean = false;

  constructor(private router: Router) {}
  
  goBack(): void {
    window.history.back();
  }

  ngOnInit(): void {
    // If no breadcrumbs are provided, generate from the current route
    if (this.breadcrumbs.length === 0) {
      this.generateBreadcrumbs();
    }
  }

  private generateBreadcrumbs(): void {
    const url = this.router.url;
    const segments = url.split('/').filter(segment => segment !== '');
    
    let urlSoFar = '';
    const newBreadcrumbs = segments.map(segment => {
      urlSoFar += `/${segment}`;
      return {
        label: this.formatLabel(segment),
        url: urlSoFar,
        tooltip: `Navigate to ${this.formatLabel(segment)}`
      };
    });
    
    // Only update if we found breadcrumbs
    if (newBreadcrumbs.length > 0) {
      this.breadcrumbs = newBreadcrumbs;
    }
  }
  
  private formatLabel(segment: string): string {
    // Convert kebab-case to Title Case
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

export interface Breadcrumb {
  label: string;
  url: string;
  tooltip?: string;
}
