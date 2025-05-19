import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { takeUntil, switchMap, map, catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { ActivityItem, RecentActivity, StatCard, StorageUsage } from './home.interface';
import { DocumentService } from '../../../documents/services/document.service';
import { DocumentStorageService } from '../../../../core/services/document-storage.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    RouterModule,
    TranslateModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  user$: Observable<User | null> = this.authService.currentUser$;
  private destroy$ = new Subject<void>();
  isLoading = true;

  // Track real time stats
  stats: StatCard[] = [];
  recentActivities: ActivityItem[] = [];
  storageUsage: StorageUsage = {
    used: '0 KB',
    total: '10 GB',
    percentage: 0
  };

  // Track if documents have been loaded
  documentsLoaded = false;
  recentDocuments: any[] = [];

  constructor(
    private authService: AuthService,
    private documentService: DocumentService,
    private storageService: DocumentStorageService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    // Get current user and their documents
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$),
      switchMap(user => {
        if (!user) {
          this.isLoading = false;
          return of(null);
        }
        
        // Load documents with no filter to get all documents
        return this.documentService.loadDocuments().pipe(
          map(documents => ({ user, documents })),
          catchError(error => {
            console.error('Error loading documents:', error);
            return of({ user, documents: [] });
          })
        );
      })
    ).subscribe(result => {
      if (!result) {
        this.isLoading = false;
        return;
      }
      
      const { user, documents } = result;
      this.documentsLoaded = true;
      
      // Update stats based on actual document count
      this.updateStats(documents);
      
      // Get recent documents (up to 5)
      this.recentDocuments = documents
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);
        
      // Update recent activities based on documents
      this.updateRecentActivities(this.recentDocuments);
      
      // Calculate storage usage
      this.calculateStorageUsage(documents);
      
      this.isLoading = false;
    });
  }
  
  private updateStats(documents: any[]): void {
    // Calculate document total and percentage change (placeholder for now)
    const totalDocs = documents.length;
    const changePercentage = 0; // In a real app we'd calculate this based on historical data
    
    // Get document types distribution
    const fileTypes = documents.reduce((acc, doc) => {
      acc[doc.fileType] = (acc[doc.fileType] || 0) + 1;
      return acc;
    }, {});
    
    const mostCommonType = Object.entries(fileTypes);
    
    // Calculate total size
    const totalSize = documents.reduce((total, doc) => total + (doc.fileSize || 0), 0);
    
    // Format total size for display
    const formattedSize = this.formatBytes(totalSize);
    
    this.stats = [
      { 
        title: 'Total Documents', 
        key: 'TOTAL_DOCUMENTS',
        value: totalDocs.toString(), 
        change: changePercentage, 
        color: 'primary',
        icon: 'description',
        changeType: 'increase'
      },
      { 
        title: 'Storage Used', 
        key: 'STORAGE_USED',
        value: formattedSize, 
        change: 0, 
        color: 'accent',
        icon: 'storage',
        changeType: 'neutral'
      },
      { 
        title: 'Recent Activities', 
        key: 'RECENT_ACTIVITIES',
        value: Math.min(totalDocs, 5).toString(), 
        change: 0, 
        color: 'warn',
        icon: 'update',
        changeType: 'neutral'
      }
    ];
  }
  
  private updateRecentActivities(documents: any[]): void {
    if (!documents.length) {
      this.recentActivities = [];
      return;
    }
    
    this.recentActivities = documents.map(doc => {
      return {
        type: 'upload',
        icon: this.getFileIcon(doc.fileType),
        title: doc.title,
        description: `${doc.fileType ? doc.fileType.toUpperCase() : 'Document'} - ${this.formatBytes(doc.fileSize)}`,
        time: this.getTimeAgo(new Date(doc.createdAt))
      };
    });
  }
  
  // Make these methods public so they can be accessed from the HTML template
  getFileIcon(fileType: string): string {
    if (!fileType) return 'insert_drive_file';
    
    switch (fileType.toLowerCase()) {
      case 'pdf': return 'picture_as_pdf';
      case 'doc': case 'docx': return 'description';
      case 'xls': case 'xlsx': return 'table_chart';
      case 'ppt': case 'pptx': return 'slideshow';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return 'image';
      case 'zip': case 'rar': return 'folder_zip';
      case 'txt': return 'article';
      default: return 'insert_drive_file';
    }
  }
  
  private calculateStorageUsage(documents: any[]): void {
    // Calculate total size in bytes
    const totalSizeBytes = documents.reduce((total, doc) => total + (doc.fileSize || 0), 0);
    
    // For demo purposes, let's assume a total storage allocation of 10GB
    const totalStorageBytes = 10 * 1024 * 1024 * 1024; // 10GB in bytes
    
    // Calculate percentage
    const usagePercentage = Math.min(100, (totalSizeBytes / totalStorageBytes) * 100);
    
    this.storageUsage = {
      used: this.formatBytes(totalSizeBytes),
      total: '10 GB',
      percentage: usagePercentage
    };
  }
  
  // Public formatBytes method for template access
  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    let count = Math.floor(interval);
    if (interval > 1) return this.translateService.instant('DASHBOARD.HOME.TIME.YEARS_AGO', { count });
    
    interval = seconds / 2592000;
    count = Math.floor(interval);
    if (interval > 1) return this.translateService.instant('DASHBOARD.HOME.TIME.MONTHS_AGO', { count });
    
    interval = seconds / 86400;
    count = Math.floor(interval);
    if (interval > 1) return this.translateService.instant('DASHBOARD.HOME.TIME.DAYS_AGO', { count });
    
    interval = seconds / 3600;
    count = Math.floor(interval);
    if (interval > 1) return this.translateService.instant('DASHBOARD.HOME.TIME.HOURS_AGO', { count });
    
    interval = seconds / 60;
    count = Math.floor(interval);
    if (interval > 1) return this.translateService.instant('DASHBOARD.HOME.TIME.MINUTES_AGO', { count });
    
    count = Math.floor(seconds);
    return this.translateService.instant('DASHBOARD.HOME.TIME.SECONDS_AGO', { count });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
