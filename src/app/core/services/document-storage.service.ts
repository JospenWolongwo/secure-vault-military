import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { SUPABASE_CONFIG } from '@environments/environment';
import { AuthService } from './auth.service';

export interface UploadOptions {
  filePath: string;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  path: string;
  fullPath: string;
  url: string;
  size: number;
  type: string;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentStorageService {
  private supabase: SupabaseClient;
  private readonly DOCUMENTS_BUCKET = 'documents';
  private readonly AVATARS_BUCKET = 'avatars';

  constructor(private authService: AuthService) {
    this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  /**
   * Upload a document to the user's personal storage
   * @param file The file to upload
   * @param options Upload options including file path and progress callback
   * @returns Observable with upload result
   */
  uploadDocument(file: File, options: UploadOptions): Observable<UploadResult> {
    console.log('Starting file upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      targetPath: options.filePath,
      bucket: this.DOCUMENTS_BUCKET
    });

    return this.authService.currentUser$.pipe(
      take(1),
      switchMap(user => {
        if (!user?.id) {
          const error = new Error('User not authenticated');
          console.error('Upload failed:', error);
          return throwError(() => error);
        }

        return new Observable<UploadResult>((subscriber) => {
          console.log(`Uploading file to ${this.DOCUMENTS_BUCKET}/${options.filePath}`);
          
          // Upload the file to storage
          this.supabase.storage
            .from(this.DOCUMENTS_BUCKET)
            .upload(options.filePath, file, {
              cacheControl: '3600',
              upsert: false,
              contentType: file.type
            })
            .then(({ data: uploadData, error: uploadError }) => {
              if (uploadError) {
                console.error('Storage upload error:', uploadError);
                subscriber.error(new Error(`Storage error: ${uploadError.message}`));
                return;
              }

              if (!uploadData) {
                const error = new Error('No data returned from upload');
                console.error('Upload failed:', error);
                subscriber.error(error);
                return;
              }

              console.log('File uploaded successfully, getting public URL...');

              // Get the public URL for the uploaded file
              try {
                const { data: urlData } = this.supabase.storage
                  .from(this.DOCUMENTS_BUCKET)
                  .getPublicUrl(options.filePath);

                if (!urlData) {
                  throw new Error('Failed to get public URL: No data returned');
                }

                const result = {
                  path: uploadData.path,
                  fullPath: uploadData.path,
                  url: urlData.publicUrl,
                  size: file.size,
                  type: file.type,
                };

                console.log('Upload completed successfully:', result);
                subscriber.next(result);
                subscriber.complete();
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error('Error in URL generation:', error);
                subscriber.error(new Error(`Failed to generate URL: ${errorMessage}`));
              }
            })
            .catch(error => {
              console.error('Upload failed with error:', error);
              subscriber.error(new Error(`Upload failed: ${error.message}`));
            });

          // Report upload progress if callback is provided
          if (options.onProgress) {
            // Simulate progress updates (Supabase doesn't provide real progress events)
            const interval = setInterval(() => {
              if (options.onProgress) {
                options.onProgress(50); // Just show 50% until complete
              }
            }, 500);

            // Clean up interval when subscription is unsubscribed
            return () => clearInterval(interval);
          }
          
          // Return a no-op cleanup function if no interval was created
          return () => {};
        });
      }),
      catchError(error => {
        console.error('Error in upload process:', {
          error,
          message: error.message,
          stack: error.stack
        });
        return throwError(() => new Error(`Upload failed: ${error.message}`));
      })
    );
  }

  /**
   * Get a signed URL for a document
   * @param filePath Path to the file in storage
   * @param expiresIn URL expiration time in seconds (default: 1 hour)
   */
  getDocumentUrl(filePath: string, expiresIn = 3600): Observable<string> {
    if (expiresIn > 0) {
      return from(
        this.supabase.storage
          .from(this.DOCUMENTS_BUCKET)
          .createSignedUrl(filePath, expiresIn)
      ).pipe(
        map(({ data, error }) => {
          if (error) throw error;
          if (!data?.signedUrl) throw new Error('No URL returned');
          return data.signedUrl;
        })
      );
    } else {
      const { data } = this.supabase.storage
        .from(this.DOCUMENTS_BUCKET)
        .getPublicUrl(filePath);
      return of(data.publicUrl);
    }
  }

  /**
   * Delete a document from storage
   * @param filePath Path to the file in storage
   */
  deleteDocument(filePath: string): Observable<void> {
    return from(
      this.supabase.storage.from(this.DOCUMENTS_BUCKET).remove([filePath])
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  /**
   * Upload a user avatar
   * @param userId User ID
   * @param file Avatar file
   */
  uploadAvatar(userId: string, file: File): Observable<UploadResult> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    return new Observable<UploadResult>((subscriber) => {
      this.supabase.storage
        .from(this.AVATARS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        })
        .then(({ data, error }) => {
          if (error) {
            subscriber.error(error);
            return;
          }

          if (!data) {
            subscriber.error(new Error('No data returned from upload'));
            return;
          }

          const { data: urlData } = this.supabase.storage
            .from(this.AVATARS_BUCKET)
            .getPublicUrl(filePath);

          subscriber.next({
            path: data.path,
            fullPath: data.path,
            url: urlData.publicUrl,
            size: file.size,
            type: file.type,
          });
          subscriber.complete();
        })
        .catch((error) => {
          subscriber.error(error);
        });
    });
  }

  /**
   * Get storage usage for a user
   * @param userId User ID
   */
  getStorageUsage(userId: string): Observable<number> {
    return from(
      this.supabase.storage.from(this.DOCUMENTS_BUCKET).list(userId)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.reduce((total, file) => {
          // Get size from metadata if available
          const size = file.metadata && typeof file.metadata === 'object' && 'size' in file.metadata 
            ? Number(file.metadata['size']) 
            : 0;
          return total + size;
        }, 0);
      })
    );
  }

  /**
   * Get storage quota for a user
   * @param userId User ID
   */
  getStorageQuota(userId: string): Observable<number> {
    // Default to 1GB storage quota (1073741824 bytes)
    return of(1073741824);
  }
}
