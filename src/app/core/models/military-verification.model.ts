/**
 * Interface pour la réponse de vérification d'identité militaire
 */
export interface MilitaryVerificationResponse {
  /** Indique si la vérification a réussi */
  isValid: boolean;
  
  /** Message détaillant le résultat de la vérification */
  message: string;
  
  /** Données supplémentaires sur l'identifiant militaire */
  data?: {
    /** Grade militaire */
    rank?: string;
    
    /** Unité d'affectation */
    unit?: string;
    
    /** Statut actif/inactif */
    isActive?: boolean;
    
    /** Date d'expiration de l'identifiant */
    expirationDate?: Date;
  };
}

/**
 * Données nécessaires pour la vérification d'identité militaire
 */
export interface MilitaryVerificationRequest {
  /** Identifiant militaire à vérifier */
  militaryId: string;
  
  /** Prénom (pour vérification croisée) */
  firstName?: string;
  
  /** Nom de famille (pour vérification croisée) */
  lastName?: string;
  
  /** Grade militaire (pour vérification croisée) */
  rank?: string;
}
