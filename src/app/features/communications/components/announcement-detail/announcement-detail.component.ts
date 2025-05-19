import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of, switchMap, tap } from 'rxjs';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

// App Imports
import { CommunicationWithReadStatus } from '../../models/communication.model';
import { CommunicationService } from '../../services/communication.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { NotificationService } from '../../../../core/services/notification.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-announcement-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PageHeaderComponent
  ],
  templateUrl: './announcement-detail.component.html',
  styleUrls: ['./announcement-detail.component.scss']
})
export class AnnouncementDetailComponent implements OnInit {
  communication$: Observable<CommunicationWithReadStatus | null> = of(null);
  loading = true;
  isAdmin = false;
  communicationId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private communicationService: CommunicationService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.checkAdminStatus();
    this.loadCommunication();
  }

  checkAdminStatus(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isAdmin = user?.role === 'admin';
    });
  }

  loadCommunication(): void {
    this.loading = true;
    this.communication$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        this.communicationId = id;
        
        if (!id) {
          this.router.navigate(['/communications']);
          return of(null);
        }
        
        return this.communicationService.getCommunication(id).pipe(
          tap(communication => {
            this.loading = false;
            
            // If communication doesn't exist, navigate back to list
            if (!communication) {
              this.notificationService.error('COMMUNICATIONS.ERRORS.NOT_FOUND');
              this.router.navigate(['/communications']);
              return;
            }
            
            // Mark as read if not already read
            if (!communication.read_at) {
              this.communicationService.markAsRead(id).subscribe();
            }
          })
        );
      })
    );
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high'; 
      case 'normal': return 'priority-normal';
      case 'low': return 'priority-low';
      default: return '';
    }
  }

  getPriorityLabel(priority: string): string {
    return `COMMUNICATIONS.PRIORITY.${priority.toUpperCase()}`;
  }

  getStatusIcon(communication: CommunicationWithReadStatus): string {
    if (communication.acknowledged_at) {
      return 'done_all';
    } else if (communication.read_at) {
      return 'done';
    } else {
      return 'mark_email_unread';
    }
  }

  getStatusLabel(communication: CommunicationWithReadStatus): string {
    if (communication.acknowledged_at) {
      return 'COMMUNICATIONS.STATUS.ACKNOWLEDGED';
    } else if (communication.read_at) {
      return 'COMMUNICATIONS.STATUS.READ';
    } else {
      return 'COMMUNICATIONS.STATUS.UNREAD';
    }
  }

  getFormattedDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  onAcknowledge(id: string): void {
    this.communicationService.acknowledge(id).subscribe({
      next: success => {
        if (success) {
          this.notificationService.success('COMMUNICATIONS.SUCCESS.ACKNOWLEDGED');
        }
      }
    });
  }

  onEdit(id: string): void {
    this.router.navigate(['/communications/edit', id]);
  }

  onDelete(id: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'COMMUNICATIONS.DELETE.TITLE',
        message: 'COMMUNICATIONS.DELETE.CONFIRM',
        confirmText: 'COMMON.DELETE',
        cancelText: 'COMMON.CANCEL',
        isDangerous: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.communicationService.deleteCommunication(id).subscribe({
          next: success => {
            if (success) {
              this.router.navigate(['/communications']);
            }
          }
        });
      }
    });
  }
}
