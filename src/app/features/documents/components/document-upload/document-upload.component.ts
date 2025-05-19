import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { DocumentService } from '../../services/document.service';
import { Document, DocumentCategory, DocumentUploadProgress } from '../../models/document.model';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatListModule,
    MatSelectModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.scss']
})
export class DocumentUploadComponent implements OnInit, OnDestroy {
  uploadForm: FormGroup;
  isDragging = false;
  uploadProgress: DocumentUploadProgress[] = [];
  isLoading = false;
  categories: DocumentCategory[] = [];
  loadingCategories = false;
  
  private destroy$ = new Subject<void>();
  
  // Services
  private readonly documentService = inject(DocumentService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  
  // File input reference
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  constructor() {
    // Initialize the form with proper type annotations
    this.uploadForm = this.fb.group({
      description: ['', [Validators.maxLength(500)]],
      classification: ['unclassified', [Validators.required]],
      categoryId: [null, [Validators.required]],
      tags: [''],
      file: [null, [Validators.required]]
    });
    
    // Load categories
    this.loadCategories();
  }
  
  private loadCategories() {
    this.loadingCategories = true;
    this.documentService.getDocumentCategories(true).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loadingCategories = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.snackBar.open('Failed to load categories', 'Dismiss', { duration: 5000 });
        this.loadingCategories = false;
      }
    });
  }
  
  // Template access methods
  getStatusText(item: DocumentUploadProgress): string {
    switch (item.status) {
      case 'uploading':
        return 'Uploading...';
      case 'completed':
        return 'Upload complete';
      case 'error':
        return item.error || 'Upload failed';
      default:
        return 'Pending';
    }
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file icon based on file type
  getFileIcon(type: string | undefined): string {
    if (!type) return 'insert_drive_file';
    
    const fileTypes: {[key: string]: string} = {
      'application/pdf': 'picture_as_pdf',
      'image/': 'image',
      'text/': 'description',
      'application/msword': 'description',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'description',
      'application/vnd.ms-excel': 'table_chart',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'table_chart',
      'application/vnd.ms-powerpoint': 'slideshow',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'slideshow',
      'application/zip': 'folder_zip',
      'application/x-rar-compressed': 'folder_zip',
      'application/x-7z-compressed': 'folder_zip'
    };
    
    // Check for exact matches first
    if (fileTypes[type]) {
      return fileTypes[type];
    }
    
    // Check for partial matches (e.g., 'image/' for all image types)
    for (const key in fileTypes) {
      if (type.startsWith(key) && key.endsWith('/')) {
        return fileTypes[key];
      }
    }
    
    return 'insert_drive_file';
  }
  
  // Parse tags from comma-separated string
  private parseTags(tagString: string): string[] {
    if (!tagString) return [];
    return tagString.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  /**
   * Handles file selection from file input
   * @param event The file input change event
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFiles(Array.from(input.files));
    }
  }

  /**
   * Handles drag over event for file drop zone
   * @param event The drag event
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  /**
   * Handles drag leave event for file drop zone
   * @param event The drag event
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  /**
   * Handles file drop event
   * @param event The drop event
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    if (event.dataTransfer?.files?.length) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  /**
   * Processes the selected files and updates the form
   * @param files Array of files to process
   */
  private handleFiles(files: File[]): void {
    if (!files?.length) return;
    
    // For now, we'll only handle the first file
    const file = files[0];
    
    // Validate file type and size
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 
      'image/jpeg', 
      'image/png', 
      'image/gif'
    ];
      
    if (!allowedTypes.includes(file.type)) {
      this.snackBar.open('File type not supported', 'Close', { duration: 5000 });
      return;
    }
    
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      this.snackBar.open('File size exceeds 100MB limit', 'Close', { duration: 5000 });
      return;
    }
    
    // Update the form with the file
    this.uploadForm.patchValue({ file });
    this.uploadForm.get('file')?.updateValueAndValidity();
    
    // Auto-fill the description with the filename (without extension)
    if (!this.uploadForm.get('description')?.value) {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      this.uploadForm.patchValue({ description: fileName });
    }
  }

  /**
   * Handles form submission
   */
  onSubmit(): void {
    if (this.uploadForm.invalid || this.isLoading) {
      // Mark all fields as touched to show validation errors
      this.uploadForm.markAllAsTouched();
      return;
    }
    
    const file = this.uploadForm.get('file')?.value as File;
    if (!file) {
      this.snackBar.open('Please select a file to upload', 'Dismiss', { duration: 5000 });
      return;
    }
    
    this.isLoading = true;
    
    // Prepare metadata
    const metadata = {
      title: file.name,
      description: this.uploadForm.get('description')?.value,
      classification: this.uploadForm.get('classification')?.value,
      categoryId: this.uploadForm.get('categoryId')?.value,
      tags: this.parseTags(this.uploadForm.get('tags')?.value),
    };
    
    // Subscribe to upload progress
    const uploadProgress$ = this.documentService.getUploadProgress();
    const uploadSub = uploadProgress$.subscribe({
      next: (progress) => {
        this.uploadProgress = progress;
      },
      error: (error) => {
        console.error('Error in upload progress:', error);
      }
    });
    
    // Convert classification to uppercase to match the expected type
    const documentMetadata = {
      ...metadata,
      classification: metadata.classification?.toUpperCase() as 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET',
      title: file.name
    };

    // Start the upload using the public uploadDocument method
    this.documentService.uploadDocument(file, documentMetadata).pipe(
      finalize(() => {
        uploadSub.unsubscribe();
        this.isLoading = false;
      })
    ).subscribe({
      next: (document) => {
        this.snackBar.open('Document uploaded successfully', 'Close', { 
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        
        // Reset form
        this.uploadForm.reset({
          classification: 'unclassified',
          description: '',
          tags: '',
          file: null
        });
        
        // Navigate to the document list after a short delay
        setTimeout(() => {
          this.router.navigate(['/dashboard/documents']);
        }, 1500);
      },
      error: (error) => {
        console.error('Upload failed:', error);
        const errorMessage = this.getErrorMessage(error);
        this.snackBar.open(errorMessage, 'Close', { 
          duration: 10000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
  
  // Remove file from the form
  removeFile(): void {
    this.uploadForm.patchValue({ file: null });
    this.uploadForm.get('file')?.updateValueAndValidity();
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  ngOnInit(): void {
    // Subscribe to upload progress
    this.documentService.getUploadProgress()
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.uploadProgress = progress;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  // (Duplicate methods removed)

  /**
   * Cancel an upload in progress
   * @param uploadItem The upload item to cancel
   */
  cancelUpload(uploadItem: DocumentUploadProgress): void {
    if (!uploadItem) return;
    
    console.log('Canceling upload:', uploadItem.filename);
    
    // Update the status to indicate cancellation
    uploadItem.status = 'error';
    uploadItem.error = 'Upload canceled';
    
    // TODO: Implement actual cancellation logic for the upload
    // This would typically involve unsubscribing from the upload observable
    
    // Remove the upload from the progress list after a short delay
    setTimeout(() => {
      this.uploadProgress = this.uploadProgress.filter(item => item.id !== uploadItem.id);
    }, 2000);
  }
  
  // onFileDropped removed - using onDrop and handleFiles instead
  
  /**
   * Gets a user-friendly error message from an error object
   * @param error The error object
   * @returns A user-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (!error) return 'An unknown error occurred';
    
    if (error.status === 0) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    if (error.status === 413) {
      return 'File is too large. Maximum file size is 100MB.';
    }
    
    if (error.status === 400) {
      return 'Invalid request. Please check your input and try again.';
    }
    
    if (error.status === 401 || error.status === 403) {
      return 'You are not authorized to perform this action.';
    }
    
    if (error.status === 404) {
      return 'The requested resource was not found.';
    }
    
    if (error.status >= 500) {
      return 'A server error occurred. Please try again later.';
    }
    
    // Handle custom error messages from the server
    if (error.error?.message) {
      return error.error.message;
    }
    
    return error.message || 'An error occurred while uploading the file. Please try again.';
  }
}
