import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { DocumentService } from '../../services/document.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, NavigationEnd } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { Subject, of } from 'rxjs';
import { filter, takeUntil, catchError } from 'rxjs/operators';
import { Document as DocumentModel } from '../../models/document.model';

// Define Document interface for the component
interface Document {
  id: string;
  title: string;
  description?: string;
  fileType: string;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  filePath: string;
  classification: string;
  status: 'active' | 'archived' | 'deleted';
  tags?: string[];
  isFavorite?: boolean;
  [key: string]: any; // Add index signature to allow dynamic properties
}

// Define DocumentFilter interface for filtering documents
interface DocumentFilter {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  isFavorite?: boolean;
  classification?: string;
  status?: 'active' | 'archived' | 'deleted';
}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FileSizePipe,
    TranslateModule
  ],
  template: `
    <div class="document-list-container">
      <div class="document-list-header">
        <h2>My Documents</h2>
        <button mat-raised-button color="primary" routerLink="upload">
          <mat-icon>upload</mat-icon>
          Upload Document
        </button>
      </div>

      <div class="document-list-actions">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search documents</mat-label>
          <input #searchInput matInput placeholder="Search documents..." (keyup.enter)="onSearch(searchInput.value)">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Filter by</mat-label>
          <mat-select [ngModel]="currentFilter" (ngModelChange)="onFilterChange($event)">
            <mat-option value="all">All Documents</mat-option>
            <mat-option value="recent">Recently Opened</mat-option>
            <mat-option value="favorites">Favorites</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="document-list">
        <div *ngIf="isLoading" class="loading-spinner">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Loading documents...</p>
        </div>

        <div class="no-documents" *ngIf="!isLoading && (!documents || documents.length === 0)">
          <mat-icon>folder_open</mat-icon>
          <h3>No documents found</h3>
          <p>Get started by uploading your first document</p>
          <button mat-raised-button color="primary" routerLink="upload">
            <mat-icon>upload</mat-icon>
            Upload Document
          </button>
        </div>

        <div class="document-grid" *ngIf="!isLoading && documents && documents.length > 0">
          <mat-card *ngFor="let doc of documents" class="document-card">
            <mat-card-header>
              <div mat-card-avatar class="document-icon">
                <mat-icon>{{ getFileIcon(doc.fileType) }}</mat-icon>
              </div>
              <mat-card-title>{{ doc.title || 'Untitled Document' }}</mat-card-title>
              <mat-card-subtitle *ngIf="doc.fileSize !== undefined || doc.updatedAt">
                <span *ngIf="doc.fileSize !== undefined">{{ doc.fileSize | fileSize }}</span>
                <span *ngIf="doc.fileSize !== undefined && doc.updatedAt"> • </span>
                <span *ngIf="doc.updatedAt">{{ doc.updatedAt | date:'medium' }}</span>
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-actions align="end">
              <button mat-icon-button (click)="onViewDocument(doc.id)">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button (click)="onDownloadDocument(doc.id)">
                <mat-icon>download</mat-icon>
              </button>
              <button mat-icon-button [matMenuTriggerFor]="menu" #menuTrigger="matMenuTrigger">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="onShareDocument(doc.id)">
                  <mat-icon>share</mat-icon>
                  <span>Share</span>
                </button>
                <button mat-menu-item (click)="onAddToFavorites(doc)" *ngIf="doc?.id">
                  <mat-icon>{{ doc.isFavorite ? 'favorite' : 'favorite_border' }}</mat-icon>
                  <span>{{ doc.isFavorite ? 'Remove from Favorites' : 'Add to Favorites' }}</span>
                </button>
                <button mat-menu-item (click)="openRenameDialog(doc)" *ngIf="doc?.id">
                  <mat-icon>edit</mat-icon>
                  <span>Rename</span>
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item class="delete-button" (click)="$event.stopPropagation(); onDeleteDocument(doc.id)">
                  <mat-icon color="warn">delete</mat-icon>
                  <span>Delete</span>
                </button>
              </mat-menu>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .document-list-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .document-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h2 {
        margin: 0;
        font-weight: 500;
        color: #333;
      }
    }

    .document-list-actions {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;

      .search-field {
        flex: 1;
        min-width: 250px;
      }

      .filter-field {
        width: 100%;
      }
    }

    .document-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
      min-height: 200px;
      position: relative;
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
      gap: 16px;
      color: #666;
    }

    .no-documents {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      background: #fafafa;
      border-radius: 8px;
      border: 1px dashed #ddd;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        color: #ccc;
      }

      h3 {
        margin: 16px 0 8px;
        color: #333;
      }
      p {
        color: #666;
        margin-bottom: 24px;
      }
    }

    .document-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .document-card {
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      }

      .document-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #e3f2fd;
        border-radius: 4px;
        width: 40px;
        height: 40px;

        mat-icon {
          color: #1976d2;
        }
      }

      .mat-card-header-text {
        margin-left: 12px;
      }

      .mat-card-title {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 4px;
      }

      .mat-card-subtitle {
        font-size: 12px;
        color: #666;
        display: flex;
        align-items: center;
      }

      .delete-button {
        color: #f44336;
      }
    }

    @media (max-width: 600px) {
      .document-list-container {
        padding: 16px;
      }

      .document-list-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;

        button {
          width: 100%;
        }
      }

      .document-list-actions {
        flex-direction: column;
        gap: 16px;
      }
    }
  `]
})
export class DocumentListComponent implements OnInit, OnDestroy {
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;

  documents: Document[] = [];
  displayedColumns: string[] = ['title', 'fileType', 'fileSize', 'updatedAt', 'actions'];
  isLoading = false;
  searchTerm = '';
  currentFilter: 'all' | 'recent' | 'favorites' = 'all';

  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 100];
  totalItems = 0;

  sortActive = 'updatedAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  private destroy$ = new Subject<void>();

  constructor(
    private documentService: DocumentService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.setupNavigationListener();
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupNavigationListener(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.router.url.includes('/documents')) {
        this.loadDocuments();
      }
    });
  }

  loadDocuments(): void {
    this.isLoading = true;

    // Create filter object with appropriate properties based on DocumentService expectations
    const filter: any = {
      search: this.searchTerm,
      page: this.pageIndex + 1,
      pageSize: this.pageSize
    };
    
    // Apply additional filter based on currentFilter selection
    if (this.currentFilter === 'recent') {
      filter.sortBy = 'updatedAt';
      filter.sortOrder = 'desc';
    } else if (this.currentFilter === 'favorites') {
      filter.favorites = true;
    }

    this.documentService.loadDocuments(filter).pipe(
      takeUntil(this.destroy$),
      catchError((error: Error) => {
        console.error('Error loading documents:', error);
        this.snackBar.open('Error loading documents', 'Dismiss', { duration: 5000 });
        return of([]);
      })
    ).subscribe({
      next: (documentsResponse) => {
        // Handle if null/undefined response comes back
        if (!documentsResponse) {
          this.documents = [];
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        // Convert DocumentModel to our local Document interface
        this.documents = (documentsResponse as any[]).map(doc => ({
          id: doc.id || '',
          title: doc.title || '',
          description: doc.description,
          fileType: doc.fileType || '',
          fileSize: doc.fileSize || 0,
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
          createdBy: doc.createdBy || '',
          updatedBy: doc.updatedBy,
          filePath: doc.filePath || '',
          classification: doc.classification || '',
          status: (doc.status as any) || 'active',
          tags: doc.tags || [],
          isFavorite: !!doc.isFavorite
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: Error) => {
        console.error('Error loading documents:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange(filter: 'all' | 'recent' | 'favorites'): void {
    this.currentFilter = filter;
    this.pageIndex = 0; // Reset to first page on filter change
    this.loadDocuments();
  }
  
  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.pageIndex = 0; // Reset to first page on new search
    this.loadDocuments();
  }

  onViewDocument(documentId: string): void {
    if (!documentId) return;
    this.router.navigate(['/documents', documentId]);
  }

  onDownloadDocument(documentId: string): void {
    if (!documentId) return;
    
    // In a real implementation, this would call a service method
    // Since downloadDocument doesn't exist in the service, we'll show a message instead
    this.snackBar.open('Download functionality coming soon', 'Dismiss', { duration: 3000 });
    
    // Commented out actual implementation until service method is available
    /*
    this.documentService.downloadDocument(documentId).subscribe({
      next: (blob: Blob) => {
        // Create a download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        
        // Find the document to get its original filename
        const doc = this.documents.find(d => d.id === documentId);
        const filename = doc?.title || `document-${documentId}`;
        const fileExtension = doc?.fileType ? `.${doc.fileType.toLowerCase()}` : '';
        
        a.download = `${filename}${fileExtension}`;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(a);
      },
      error: (error: Error) => {
        console.error('Error downloading document:', error);
        this.snackBar.open('Error downloading document', 'Dismiss', { duration: 5000 });
      }
    });
    */
  }

  onShareDocument(documentId: string): void {
    if (!documentId) return;
    
    this.snackBar.open('Share functionality coming soon', 'Dismiss', { duration: 3000 });
  }

  onDeleteDocument(documentId: string): void {
    if (!documentId) return;
    
    if (window.confirm(`Are you sure you want to delete this document? This action cannot be undone.`)) {
      // Remove the document from the local list first for immediate UI feedback
      this.documents = this.documents.filter(doc => doc.id !== documentId);
      
      // Show confirmation message
      this.snackBar.open('Document deleted successfully', 'Dismiss', { duration: 3000 });
      
      // In a real implementation, we would call the service to delete the document
      // this.documentService.deleteDocument(documentId).subscribe(...)
    }
  }

  openRenameDialog(document: Document): void {
    if (!document?.id) return;

    // Prompt for new name using browser's prompt
    const newName = window.prompt('Enter new document name:', document.title);
    
    if (newName && newName.trim() !== '') {
      this.onRenameDocument(document, newName);
    }
  }

  onAddToFavorites(document: Document): void {
    if (!document?.id) return;
    
    // Toggle favorite status
    const updatedDocument: Document = Object.assign({}, document, {
      isFavorite: !document.isFavorite
    });

    // Update the document in the list
    const index = this.documents.findIndex(doc => doc.id === document.id);
    if (index !== -1) {
      this.documents = [
        ...this.documents.slice(0, index),
        updatedDocument,
        ...this.documents.slice(index + 1)
      ];
    }

    // In a real implementation, this would call a service method
    // For now, we'll just update the UI and show feedback
    console.log(`Toggle favorite status for document ${document.id} to ${updatedDocument.isFavorite}`);

    // Show immediate feedback
    this.snackBar.open(
      updatedDocument.isFavorite ? 'Added to favorites' : 'Removed from favorites',
      'Close',
      { duration: 3000 }
    );
  }

  onRenameDocument(document: Document, newName: string): void {
    // In a real implementation, this would call a service method
    // For now, we'll just update the UI and show feedback
    console.log(`Renamed document ${document.id} to ${newName}`);

    // Update the document in the list
    const index = this.documents.findIndex(doc => doc.id === document.id);
    if (index !== -1) {
      const updatedDoc = Object.assign({}, document, { title: newName });
      const updatedDocs = this.documents.slice();
      updatedDocs[index] = updatedDoc;
      this.documents = updatedDocs;
    }

    // Show immediate feedback
    this.snackBar.open(`Document renamed to ${newName}`, 'Close', { duration: 3000 });
  }

  getFileIcon(fileType: string | undefined): string {
    if (!fileType) return 'insert_drive_file';
    
    const type = fileType.toLowerCase();
    
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('word') || type.includes('document')) return 'description';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'table_chart';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'slideshow';
    if (type.includes('image')) return 'image';
    if (type.includes('audio')) return 'audio_file';
    if (type.includes('video')) return 'videocam';
    if (type.includes('zip') || type.includes('compressed')) return 'folder_zip';
    if (type.includes('text') || type.includes('plain')) return 'text_snippet';
    if (type.includes('code')) return 'code';
    
    return 'insert_drive_file';
  }
}

