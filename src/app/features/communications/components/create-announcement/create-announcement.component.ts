import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';

// App Imports
import { CommunicationService } from '../../services/communication.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-create-announcement',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDividerModule,
    PageHeaderComponent
  ],
  templateUrl: './create-announcement.component.html',
  styleUrls: ['./create-announcement.component.scss']
})
export class CreateAnnouncementComponent implements OnInit {
  announcementForm: FormGroup;
  isSubmitting = false;
  priorities = [
    { value: 'low', label: 'COMMUNICATIONS.PRIORITY.LOW' },
    { value: 'normal', label: 'COMMUNICATIONS.PRIORITY.NORMAL' },
    { value: 'high', label: 'COMMUNICATIONS.PRIORITY.HIGH' },
    { value: 'urgent', label: 'COMMUNICATIONS.PRIORITY.URGENT' }
  ];

  constructor(
    private fb: FormBuilder,
    private communicationService: CommunicationService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.announcementForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      content: ['', [Validators.required, Validators.maxLength(5000)]],
      priority: ['normal', Validators.required],
      category: [''],
      is_published: [true],
      expires_at: [null]
    });
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.announcementForm.invalid) {
      // Mark all fields as touched to trigger error messages
      Object.keys(this.announcementForm.controls).forEach(key => {
        const control = this.announcementForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const formValues = this.announcementForm.value;

    // Convert date to ISO string if exists
    if (formValues.expires_at) {
      formValues.expires_at = new Date(formValues.expires_at).toISOString();
    }

    this.communicationService.createCommunication(formValues).subscribe({
      next: (communicationId) => {
        this.isSubmitting = false;
        if (communicationId) {
          // Now we need to assign recipients
          // For now, we'll assign all users (to be replaced with user selection in a more advanced version)
          // This part would be expanded in a real implementation to select specific users, units, roles, etc.
          
          // Navigate to the newly created announcement
          this.router.navigate(['/communications', communicationId]);
        }
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/communications']);
  }
}
