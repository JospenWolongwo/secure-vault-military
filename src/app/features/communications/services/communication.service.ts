import { Injectable } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { BehaviorSubject, Observable, from, map, switchMap, tap, of } from 'rxjs';
import { Communication, CommunicationPriority, CommunicationRecipient, CommunicationWithReadStatus } from '../models/communication.model';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { User } from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {
  private communicationsSubject = new BehaviorSubject<CommunicationWithReadStatus[]>([]);
  communications$ = this.communicationsSubject.asObservable();

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private translateService: TranslateService
  ) {}

  /**
   * Load all communications visible to the current user
   */
  loadCommunications(): Observable<CommunicationWithReadStatus[]> {
    return this.authService.currentUser$.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }

        return from(this.supabaseService.getClient()
          .from('communications')
          .select(`
            id, title, content, priority, category, 
            is_published, published_at, expires_at, 
            created_by, created_at, updated_at,
            communication_recipients!inner(user_id, read_at, acknowledged_at, created_at)
          `)
          .eq('communication_recipients.user_id', user.id)
          .order('created_at', { ascending: false })
        ).pipe(
          map(({ data, error }) => {
            if (error) {
              this.notificationService.error(
                this.translateService.instant('COMMUNICATIONS.ERRORS.LOAD_FAILED')
              );
              console.error('Error loading communications:', error);
              return [];
            }

            // Transform the data to include read status
            return data.map(item => {
              const recipient = item.communication_recipients[0];
              return {
                ...item,
                read_at: recipient.read_at,
                acknowledged_at: recipient.acknowledged_at,
                communication_recipients: undefined // Remove this property as we've extracted what we need
              } as CommunicationWithReadStatus;
            });
          }),
          tap(communications => this.communicationsSubject.next(communications))
        );
      })
    );
  }

  /**
   * Get a single communication by ID
   */
  getCommunication(id: string): Observable<CommunicationWithReadStatus | null> {
    return this.authService.currentUser$.pipe(
      switchMap(user => {
        if (!user) {
          return of(null);
        }

        return from(this.supabaseService.getClient()
          .from('communications')
          .select(`
            id, title, content, priority, category, 
            is_published, published_at, expires_at, 
            created_by, created_at, updated_at,
            communication_recipients!inner(user_id, read_at, acknowledged_at, created_at)
          `)
          .eq('id', id)
          .eq('communication_recipients.user_id', user.id)
          .single()
        ).pipe(
          map(({ data, error }) => {
            if (error) {
              this.notificationService.error(
                this.translateService.instant('COMMUNICATIONS.ERRORS.LOAD_FAILED')
              );
              console.error('Error loading communication:', error);
              return null;
            }

            if (!data) return null;

            const recipient = data.communication_recipients[0];
            return {
              ...data,
              read_at: recipient.read_at,
              acknowledged_at: recipient.acknowledged_at,
              communication_recipients: undefined // Remove this property as we've extracted what we need
            } as CommunicationWithReadStatus;
          })
        );
      })
    );
  }

  /**
   * Mark a communication as read
   */
  markAsRead(communicationId: string): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      switchMap(user => {
        if (!user) {
          return of(false);
        }

        return from(this.supabaseService.getClient()
          .from('communication_recipients')
          .update({
            read_at: new Date().toISOString()
          })
          .eq('communication_id', communicationId)
          .eq('user_id', user.id)
        ).pipe(
          map(({ error }) => {
            if (error) {
              console.error('Error marking communication as read:', error);
              return false;
            }
            
            // Update local state
            const communications = this.communicationsSubject.value;
            const updatedCommunications = communications.map(comm => {
              if (comm.id === communicationId) {
                return { ...comm, read_at: new Date().toISOString() };
              }
              return comm;
            });
            this.communicationsSubject.next(updatedCommunications);
            
            return true;
          })
        );
      })
    );
  }

  /**
   * Acknowledge a communication
   */
  acknowledge(communicationId: string): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      switchMap(user => {
        if (!user) {
          return of(false);
        }

        return from(this.supabaseService.getClient()
          .from('communication_recipients')
          .update({
            acknowledged_at: new Date().toISOString(),
            read_at: new Date().toISOString() // Also mark as read if not already
          })
          .eq('communication_id', communicationId)
          .eq('user_id', user.id)
        ).pipe(
          map(({ error }) => {
            if (error) {
              console.error('Error acknowledging communication:', error);
              return false;
            }
            
            // Update local state
            const communications = this.communicationsSubject.value;
            const updatedCommunications = communications.map(comm => {
              if (comm.id === communicationId) {
                return { 
                  ...comm, 
                  acknowledged_at: new Date().toISOString(),
                  read_at: comm.read_at || new Date().toISOString()
                };
              }
              return comm;
            });
            this.communicationsSubject.next(updatedCommunications);
            
            return true;
          })
        );
      })
    );
  }

  /**
   * Admin function to create a new communication
   */
  createCommunication(
    communication: Omit<Communication, 'id' | 'created_by' | 'created_at' | 'updated_at'>
  ): Observable<string | null> {
    return this.authService.currentUser$.pipe(
      switchMap(user => {
        if (!user) {
          return of(null);
        }

        // Prepare communication data
        const newCommunication = {
          ...communication,
          created_by: user.id,
          published_at: communication.is_published ? new Date().toISOString() : null
        };

        return from(this.supabaseService.getClient()
          .from('communications')
          .insert(newCommunication)
          .select('id')
          .single()
        ).pipe(
          map(({ data, error }) => {
            if (error) {
              this.notificationService.error(
                this.translateService.instant('COMMUNICATIONS.ERRORS.CREATE_FAILED')
              );
              console.error('Error creating communication:', error);
              return null;
            }
            
            this.notificationService.success(
              this.translateService.instant('COMMUNICATIONS.SUCCESS.CREATED')
            );
            
            return data?.id || null;
          })
        );
      })
    );
  }

  /**
   * Admin function to update an existing communication
   */
  updateCommunication(
    id: string,
    updates: Partial<Omit<Communication, 'id' | 'created_by' | 'created_at' | 'updated_at'>>
  ): Observable<boolean> {
    // Check if publishing status is changing
    const updateData: any = { ...updates };
    if (updates.is_published === true) {
      updateData.published_at = new Date().toISOString();
    }

    return from(this.supabaseService.getClient()
      .from('communications')
      .update(updateData)
      .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) {
          this.notificationService.error(
            this.translateService.instant('COMMUNICATIONS.ERRORS.UPDATE_FAILED')
          );
          console.error('Error updating communication:', error);
          return false;
        }
        
        this.notificationService.success(
          this.translateService.instant('COMMUNICATIONS.SUCCESS.UPDATED')
        );
        
        // Update local state if it exists in our current list
        const communications = this.communicationsSubject.value;
        const updatedCommunications = communications.map(comm => {
          if (comm.id === id) {
            return { ...comm, ...updateData };
          }
          return comm;
        });
        this.communicationsSubject.next(updatedCommunications);
        
        return true;
      })
    );
  }

  /**
   * Admin function to delete a communication
   */
  deleteCommunication(id: string): Observable<boolean> {
    return from(this.supabaseService.getClient()
      .from('communications')
      .delete()
      .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) {
          this.notificationService.error(
            this.translateService.instant('COMMUNICATIONS.ERRORS.DELETE_FAILED')
          );
          console.error('Error deleting communication:', error);
          return false;
        }
        
        this.notificationService.success(
          this.translateService.instant('COMMUNICATIONS.SUCCESS.DELETED')
        );
        
        // Update local state
        const communications = this.communicationsSubject.value;
        const updatedCommunications = communications.filter(comm => comm.id !== id);
        this.communicationsSubject.next(updatedCommunications);
        
        return true;
      })
    );
  }

  /**
   * Admin function to assign recipients to a communication
   * @param communicationId ID of the communication
   * @param userIds List of user IDs to assign as recipients
   */
  assignRecipients(communicationId: string, userIds: string[]): Observable<boolean> {
    // Prepare recipient objects
    const recipients = userIds.map(userId => ({
      communication_id: communicationId,
      user_id: userId
    }));

    return from(this.supabaseService.getClient()
      .from('communication_recipients')
      .insert(recipients)
    ).pipe(
      map(({ error }) => {
        if (error) {
          this.notificationService.error(
            this.translateService.instant('COMMUNICATIONS.ERRORS.ASSIGN_FAILED')
          );
          console.error('Error assigning recipients:', error);
          return false;
        }
        
        this.notificationService.success(
          this.translateService.instant('COMMUNICATIONS.SUCCESS.ASSIGNED')
        );
        
        return true;
      })
    );
  }

  /**
   * Check if a user has admin role
   * @param userId User ID to check
   */
  checkIsAdmin(userId: string): Observable<boolean> {
    // Use the RPC function since it's working correctly
    return from(this.supabaseService.getClient()
      .rpc('has_role', { role_name: 'admin' })
    ).pipe(
      map((result) => {
        if (result.error) {
          console.error('Error checking admin role:', result.error);
          return false;
        }
        console.log('Admin role check result:', result.data);
        return !!result.data;
      })
    );
  }

  /**
   * Get statistics for a communication (admin function)
   */
  getCommunicationStats(communicationId: string): Observable<{
    recipientCount: number;
    readCount: number;
    acknowledgedCount: number;
  }> {
    return from(this.supabaseService.getClient()
      .from('communication_recipients')
      .select('read_at, acknowledged_at')
      .eq('communication_id', communicationId)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error getting communication stats:', error);
          return {
            recipientCount: 0,
            readCount: 0,
            acknowledgedCount: 0
          };
        }
        
        return {
          recipientCount: data.length,
          readCount: data.filter(r => r.read_at).length,
          acknowledgedCount: data.filter(r => r.acknowledged_at).length
        };
      })
    );
  }
}
