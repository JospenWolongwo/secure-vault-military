import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { Observable, Subject, of, BehaviorSubject } from 'rxjs';
import { takeUntil, map, tap } from 'rxjs/operators';
import { User } from '../../core/models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';

interface AppNotification {
  id: string;
  message: string;
  icon: string;
  time: string;
  read: boolean;
  type?: 'info' | 'warning' | 'error' | 'success';
  action?: string;
  data?: any;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  user$: Observable<User | null>;
  currentYear = new Date().getFullYear();
  unreadNotifications = 0;
  notifications: AppNotification[] = [
    {
      id: '1',
      message: 'New document uploaded successfully',
      icon: 'file_upload',
      time: '10 min ago',
      read: false,
      type: 'info'
    },
    {
      id: '2',
      message: 'Security alert: Unusual login attempt',
      icon: 'security',
      time: '1 hour ago',
      read: false,
      type: 'warning'
    },
    {
      id: '3',
      message: 'Your storage is 85% full',
      icon: 'storage',
      time: '2 days ago',
      read: true,
      type: 'warning'
    }
  ];

  private destroy$ = new Subject<void>();
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.user$ = this.authService.currentUser$.pipe(
      tap(user => {
        if (user) {
          // Initialize notifications when user is available
          this.notificationsSubject.next(this.notifications);
          this.updateUnreadCount();
        }
      })
    );
  }

  ngOnInit(): void {
    // Check authentication status
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate(['/auth/login']);
        }
      });

    // Update unread notifications count
    this.updateUnreadCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    const query = input.value.trim();
    if (query) {
      // Show a snackbar for demo purposes
      this.snackBar.open(`Searching for: ${query}`, 'Dismiss', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
      // In a real app, you would navigate to search results
      // this.router.navigate(['/dashboard/search'], { queryParams: { q: query } });
    }
  }

  markAllAsRead(): void {
    const updatedNotifications = this.notifications.map(notification => ({
      ...notification,
      read: true
    }));
    
    this.notifications = updatedNotifications;
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
    
    // Show feedback
    this.snackBar.open('All notifications marked as read', 'Dismiss', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  removeNotification(id: string, event: Event): void {
    event.stopPropagation();
    const updatedNotifications = this.notifications.filter(n => n.id !== id);
    this.notifications = updatedNotifications;
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
  }

  private updateUnreadCount(): void {
    this.unreadNotifications = this.notifications.filter(n => !n.read).length;
  }
  
  getUserInitials(user: User | null): string {
    if (!user) return 'U';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  }

  getNotificationIcon(type?: string): string {
    switch (type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'check_circle';
      case 'info':
      default:
        return 'info';
    }
  }

  handleNotificationAction(notification: AppNotification): void {
    if (notification.action) {
      // Handle different notification actions
      switch (notification.action) {
        case 'navigate':
          if (notification.data?.route) {
            this.router.navigate([notification.data.route]);
          }
          break;
        case 'openDialog':
          // Handle dialog opening
          break;
        case 'externalLink':
          if (notification.data?.url) {
            window.open(notification.data.url, '_blank');
          }
          break;
      }
    }
    
    // Mark as read
    if (!notification.read) {
      const updatedNotifications = this.notifications.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      );
      this.notifications = updatedNotifications;
      this.notificationsSubject.next(updatedNotifications);
      this.updateUnreadCount();
    }
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Logout failed:', error);
        // Still navigate to login even if there's an error
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
