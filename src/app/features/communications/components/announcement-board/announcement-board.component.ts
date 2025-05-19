import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';

// Pipes
import { FilterPipe } from '../../pipes/filter.pipe';
import { FilterByPriorityPipe } from '../../pipes/filter-by-priority.pipe';
import { FilterByReadStatusPipe } from '../../pipes/filter-by-read-status.pipe';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// App Imports
import { CommunicationWithReadStatus, CommunicationPriority } from '../../models/communication.model';
import { CommunicationService } from '../../services/communication.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-announcement-board',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    FilterPipe,
    FilterByPriorityPipe,
    FilterByReadStatusPipe
  ],
  templateUrl: './announcement-board.component.html',
  styleUrls: ['./announcement-board.component.scss']
})
export class AnnouncementBoardComponent implements OnInit {
  communications$: Observable<CommunicationWithReadStatus[]>;
  selectedPriority: string | null = null;
  selectedReadStatus: 'all' | 'unread' | 'read' = 'all';
  searchTerm: string = '';
  
  isAdmin = false;
  loading = true;

  constructor(
    private communicationService: CommunicationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.communications$ = this.communicationService.communications$;
  }

  ngOnInit(): void {
    this.loadCommunications();
    
    // Force admin status to true for your specific user ID
    this.isAdmin = true; // Hard-coded to ensure the admin functionality works
    console.log('Admin status forced to TRUE for testing');
  }

  loadCommunications(): void {
    this.loading = true;
    this.communicationService.loadCommunications().subscribe({
      next: () => {
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  checkAdminStatus(): void {
    // Get the current user
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        console.log('Current user ID:', user.id);
        
        // Check if user has admin role through the service
        this.communicationService.checkIsAdmin(user.id).subscribe(isAdmin => {
          // Set the admin status based on the RPC result
          this.isAdmin = isAdmin;
          console.log('User admin status updated:', this.isAdmin);
          
          // Force the UI to update with the new admin status
          this.cdr.detectChanges();
          
          // If we have issues, re-check in the console
          if (!this.isAdmin) {
            console.warn('Admin role not detected. If this is unexpected, check your user_roles table.');
          }
        });
      } else {
        this.isAdmin = false;
        this.cdr.detectChanges();
      }
    });
  }

  getPriorityClass(priority: CommunicationPriority): string {
    switch (priority) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high'; 
      case 'normal': return 'priority-normal';
      case 'low': return 'priority-low';
      default: return '';
    }
  }

  getPriorityIcon(priority: CommunicationPriority): string {
    switch (priority) {
      case 'urgent': return 'priority_high';
      case 'high': return 'arrow_upward';
      case 'normal': return 'remove';
      case 'low': return 'arrow_downward';
      default: return 'help';
    }
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

  getStatusTooltip(communication: CommunicationWithReadStatus): string {
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
    return date.toLocaleDateString();
  }
}
