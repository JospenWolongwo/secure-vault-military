import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of, throwError, firstValueFrom } from 'rxjs';
import { map, catchError, switchMap, take, filter } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { Document, DocumentCategory, DocumentFilter, DocumentUploadProgress, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../models/document.model';
import { DocumentStorageService } from '../../../core/services/document-storage.service';
import { User } from '@app/core/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private supabaseClient: SupabaseClient;
  private uploadProgress = new BehaviorSubject<DocumentUploadProgress[]>([]);
  private documents = new BehaviorSubject<Document[]>([]);
  private categories = new BehaviorSubject<DocumentCategory[]>([]);
  private categoriesLoaded = false;
  private uploadQueue: { file: File; document: Partial<Document> }[] = [];
  private currentUploads: DocumentUploadProgress[] = [];
  private uploadQueueSubject = new BehaviorSubject<typeof this.uploadQueue>([]);
  private isProcessingQueue = false;

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private documentStorage: DocumentStorageService
  ) {
    // Get the Supabase client instance from the service
    this.supabaseClient = this.supabaseService.getClient();
    this.processUploadQueue();
  }

  /**
   * Get the current upload progress
   */
  getUploadProgress(): Observable<DocumentUploadProgress[]> {
    return this.uploadProgress.asObservable();
  }

  /**
   * Get document categories
   */
  getDocumentCategories(forceReload = false): Observable<DocumentCategory[]> {
    if (!this.categoriesLoaded || forceReload) {
      return from(
        this.supabaseClient
          .from('document_categories')
          .select('*')
          .order('name')
      ).pipe(
        map(({ data, error }) => {
          if (error) {
            console.error('Error loading categories:', error);
            throw error;
          }
          const categories = (data || []).map(cat => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            createdAt: new Date(cat.created_at),
            updatedAt: new Date(cat.updated_at)
          }));
          this.categories.next(categories);
          this.categoriesLoaded = true;
          return categories;
        }),
        catchError(error => {
          console.error('Error in getDocumentCategories:', error);
          return of([]);
        })
      );
    }
    return this.categories.asObservable();
  }

  /**
   * Load documents from the database with optional filtering
   */
  loadDocuments(filter: DocumentFilter = {}): Observable<Document[]> {
    console.log('Loading documents with filter:', filter);
    
    return this.authService.currentUser$.pipe(
      take(1),
      switchMap(user => {
        console.log('Current user:', user);
        
        if (!user?.id) {
          console.log('No user ID found, returning empty array');
          return of([]);
        }

        console.log('Building query for user ID:', user.id);
        
        let query = this.supabaseClient
          .from('documents')
          .select(`
            *,
            category:category_id (id, name, description)
          `)
          .eq('user_id', user.id)
          .order(filter.sortBy || 'created_at', { ascending: filter.sortOrder !== 'desc' });
          
        console.log('Query built, applying filters');

        if (filter.search) {
          query = query.ilike('title', `%${filter.search}%`);
        }
        if (filter.fileType) {
          query = query.eq('file_type', filter.fileType);
        }
        if (filter.categoryId) {
          query = query.eq('category_id', filter.categoryId);
        }
        if (filter.classification) {
          query = query.eq('classification', filter.classification);
        }
        if (filter.isEncrypted !== undefined) {
          query = query.eq('is_encrypted', filter.isEncrypted);
        }
        if (filter.startDate) {
          query = query.gte('created_at', filter.startDate.toISOString());
        }
        if (filter.endDate) {
          query = query.lte('created_at', filter.endDate.toISOString());
        }
        if (filter.limit) {
          query = query.limit(filter.limit);
        }
        if (filter.offset) {
          query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
        }

        console.log('Executing query...');
        
        return from(query).pipe(
          map(({ data, error }) => {
            console.log('Query response - data:', data);
            console.log('Query response - error:', error);
            
            if (error) {
              console.error('Error in query response:', error);
              throw error;
            }
            
            const mappedDocuments = data.map(doc => this.mapDbDocumentToModel(doc, user.id));
            console.log('Mapped documents:', mappedDocuments);
            return mappedDocuments;
          }),
          catchError(error => {
            console.error('Error in loadDocuments:', error);
            console.error('Error details:', {
              name: error.name,
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint
            });
            return of([]);
          })
        );
      })
    );
  }

  /**
   * Get a document by ID
   */
  getDocumentById(id: string): Observable<Document | null> {
    return from(
      this.supabaseClient
        .from('documents')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        if (!data) return of(null);
        
        return this.authService.currentUser$.pipe(
          take(1),
          map(user => this.mapDbDocumentToModel(data, user?.id || ''))
        );
      }),
      catchError(error => {
        console.error('Error getting document:', error);
        return of(null);
      })
    );
  }

  /**
   * Map database document to our Document model
   */
  private mapDbDocumentToModel(doc: Record<string, any>, userId: string): Document {
    return {
      id: doc['id'],
      title: doc['title'],
      description: doc['description'] || '',
      filePath: doc['file_path'],
      fileSize: doc['file_size'],
      fileType: doc['file_type'],
      category: doc['category'] || null,
      categoryId: doc['category_id'] || null,
      classification: doc['classification'] || 'UNCLASSIFIED',
      isEncrypted: doc['is_encrypted'] || false,
      expiresAt: doc['expires_at'] ? new Date(doc['expires_at']) : null,
      userId: userId,
      createdAt: new Date(doc['created_at']),
      updatedAt: new Date(doc['updated_at']),
      // UI properties
      isSelected: false,
      isUploading: false,
      uploadProgress: 100,
      status: 'completed',
      downloadUrl: doc['download_url']
    } as Document;
  }

  /**
   * Upload a document
   */
  uploadDocument(file: File, metadata: Partial<Omit<Document, 'id' | 'createdAt' | 'updatedAt'>> = {}): Observable<Document> {
    // Validate the file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error || 'Invalid file'));
    }

    return this.authService.currentUser$.pipe(
      take(1),
      switchMap(user => {
        if (!user?.id) {
          return throwError(() => new Error('User must be logged in to upload documents'));
        }

        // Generate a unique file path
        const fileExt = file.name.split('.').pop();
        const fileId = uuidv4();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '_');
        const filePath = `${user.id}/${fileId}_${sanitizedFileName}`;

        // Update upload progress
        this.updateUploadProgress(file, 'uploading', undefined, 0);

        // First upload the file to storage
        return from(
          this.documentStorage.uploadDocument(file, { 
            filePath,
            onProgress: (progress: number) => {
              this.updateUploadProgress(file, 'uploading', undefined, progress);
            }
          })
        ).pipe(
          switchMap((uploadResult) => {

            // Then create the document record in the database
            const documentData = {
              title: metadata.title || file.name,
              description: metadata.description || '',
              file_path: filePath,
              file_size: file.size,
              file_type: file.type,
              category_id: metadata.categoryId,
              classification: metadata.classification || 'UNCLASSIFIED',
              is_encrypted: metadata.isEncrypted || false,
              expires_at: metadata.expiresAt || null,
              user_id: user.id
            };

            return from(
              this.supabaseClient
                .from('documents')
                .insert([documentData])
                .select('*')
            ).pipe(
              map(({ data: docData, error: docError }) => {
                if (docError) {
                  this.updateUploadProgress(file, 'error', docError);
                  throw docError;
                }
                
                const uploadedDoc = this.mapDbDocumentToModel(docData[0], user.id);
                this.updateUploadProgress(file, 'completed', undefined, 100);
                return uploadedDoc;
              })
            );
          }),
          catchError(error => {
            this.updateUploadProgress(file, 'error', error);
            return throwError(() => error);
          })
        );
      }),
      catchError(error => {
        console.error('Error in upload process:', error);
        return throwError(() => new Error(`Upload failed: ${error.message}`));
      })
    );
  }

  /**
   * Validate a file before upload
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      };
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}` 
      };
    }

    return { valid: true };
  }

  /**
   * Update upload progress for a file
   */
  private updateUploadProgress(
    file: File,
    status: 'pending' | 'uploading' | 'completed' | 'error',
    error?: Error | string,
    progress?: number
  ): void {
    const currentUploads = [...this.currentUploads];
    const existingIndex = currentUploads.findIndex(u => u.file === file);
    
    const uploadProgress: DocumentUploadProgress = {
      id: existingIndex >= 0 ? currentUploads[existingIndex].id : uuidv4(),
      filename: file.name,
      file,
      progress: progress !== undefined ? progress : status === 'completed' ? 100 : 0,
      status,
      error: typeof error === 'string' ? error : error?.message
    };

    if (existingIndex >= 0) {
      currentUploads[existingIndex] = uploadProgress;
    } else {
      currentUploads.push(uploadProgress);
    }

    this.currentUploads = currentUploads;
    this.uploadProgress.next(currentUploads);
  }

  /**
   * Remove a file from upload progress tracking
   */
  private removeFromUploadProgress(file: File): void {
    this.currentUploads = this.currentUploads.filter(u => u.file !== file);
    this.uploadProgress.next(this.currentUploads);
  }

  /**
   * Process the upload queue
   */
  private processUploadQueue(): void {
    if (this.isProcessingQueue || this.uploadQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const nextInQueue = this.uploadQueue.shift();

    if (!nextInQueue?.file) {
      this.isProcessingQueue = false;
      this.processUploadQueue();
      return;
    }

    const { file, document } = nextInQueue;

    this.uploadDocument(file, document).subscribe({
      next: (doc) => {
        // Update the documents list
        const currentDocs = this.documents.value;
        this.documents.next([doc, ...currentDocs]);
        
        // Process next in queue
        this.isProcessingQueue = false;
        this.processUploadQueue();
      },
      error: (error: Error) => {
        console.error('Error processing upload:', error);
        this.isProcessingQueue = false;
        this.processUploadQueue();
      }
    });
  }
}
