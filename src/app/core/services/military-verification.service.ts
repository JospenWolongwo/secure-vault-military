import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { MilitaryVerificationRequest, MilitaryVerificationResponse } from '../models/military-verification.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class MilitaryVerificationService {
  private apiUrl = `${environment.apiUrl}/military-verification`;
  private verificationCache = new Map<string, MilitaryVerificationResponse>();
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  /**
   * Vérifie un identifiant militaire
   * @param request Données de la requête de vérification
   * @returns Observable avec la réponse de vérification
   */
  verifyMilitaryId(request: MilitaryVerificationRequest): Observable<MilitaryVerificationResponse> {
    const cacheKey = this.generateCacheKey(request);
    const cachedResponse = this.getCachedResponse(cacheKey);
    
    if (cachedResponse) {
      return of(cachedResponse);
    }

    // En mode développement, simuler une vérification réussie
    if (!environment.production) {
      return this.simulateVerification(request);
    }

    // En production, appeler l'API réelle
    return this.http.post<MilitaryVerificationResponse>(`${this.apiUrl}/verify`, request).pipe(
      tap((response) => {
        if (response.isValid) {
          this.cacheResponse(cacheKey, response);
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Simule la vérification d'identité en mode développement
   * @param request Données de la requête de vérification
   * @returns Réponse simulée
   */
  private simulateVerification(request: MilitaryVerificationRequest): Observable<MilitaryVerificationResponse> {
    // Simulation d'une vérification réussie après un court délai
    return of({
      isValid: true,
      message: 'Military ID verification successful',
      data: {
        rank: request.rank || 'Soldier',
        unit: 'Unknown Unit',
        isActive: true,
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 an à partir de maintenant
      }
    }).pipe(
      tap(response => {
        const cacheKey = this.generateCacheKey(request);
        this.cacheResponse(cacheKey, response);
      })
    );
  }

  /**
   * Génère une clé de cache unique pour une requête
   */
  private generateCacheKey(request: MilitaryVerificationRequest): string {
    return `${request.militaryId}:${request.firstName || ''}:${request.lastName || ''}:${request.rank || ''}`;
  }

  /**
   * Récupère une réponse mise en cache si elle existe et est toujours valide
   */
  private getCachedResponse(key: string): MilitaryVerificationResponse | null {
    const cached = this.verificationCache.get(key);
    if (!cached) return null;

    // Vérifier si le cache a expiré
    const now = Date.now();
    if (now - (cached as any).cachedAt > this.CACHE_DURATION_MS) {
      this.verificationCache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Met en cache une réponse de vérification
   */
  private cacheResponse(key: string, response: MilitaryVerificationResponse): void {
    // Ajouter un horodatage pour suivre l'âge du cache
    (response as any).cachedAt = Date.now();
    this.verificationCache.set(key, response);
  }

  /**
   * Gère les erreurs HTTP
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (error.status === 0) {
        errorMessage = 'Unable to connect to the verification service. Please check your connection.';
      } else {
        errorMessage = error.error?.message || error.message || `Server returned code ${error.status}`;
      }
    }
    
    this.notificationService.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
