import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page-header',
  template: `
    <div class="page-header" [ngClass]="{ 'with-breadcrumbs': breadcrumbs?.length > 0 }">
      <div class="header-content">
        <div class="title-section">
          <h1 class="title">
            <ng-container *ngIf="icon">
              <mat-icon class="title-icon">{{ icon }}</mat-icon>
            </ng-container>
            {{ title }}
          </h1>
          <span class="subtitle" *ngIf="subtitle">{{ subtitle }}</span>
        </div>
        
        <div class="actions" *ngIf="showActionButtons">
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>
      
      <nav class="breadcrumb" *ngIf="breadcrumbs?.length > 0">
        <a *ngFor="let crumb of breadcrumbs; let last = last" 
           [routerLink]="crumb.url" 
           [class.active]="last"
           [matTooltip]="crumb.tooltip"
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
      
      .actions {
        display: flex;
        gap: 0.5rem;
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
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '';
  @Input() divider = true;
  @Input() breadcrumbs: Breadcrumb[] = [];
  @Input() showActionButtons = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Auto-generate breadcrumbs if not provided
    if (this.breadcrumbs.length === 0) {
      this.generateBreadcrumbs();
    }
  }

  private generateBreadcrumbs(): void {
    const url = this.router.url;
    const segments = url.split('/').filter(segment => segment);
    const breadcrumbs: Breadcrumb[] = [];
    
    let urlSegment = '';
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      urlSegment += `/${segment}`;
      
      // Skip numeric segments (like IDs)
      if (/^\d+$/.test(segment)) {
        continue;
      }
      
      const label = this.formatLabel(segment);
      breadcrumbs.push({
        label,
        url: urlSegment,
        tooltip: `Go to ${label}`
      });
    }
    
    // Only update if we found breadcrumbs
    if (breadcrumbs.length > 0) {
      this.breadcrumbs = breadcrumbs;
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
