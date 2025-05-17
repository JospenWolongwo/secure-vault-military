# SecureVault Military (SVM) - Development Task List

## Current Issues (High Priority)

### 1. Language Configuration

- [x] Set French as default language
  - [x] Check i18n configuration
  - [x] Verify language service initialization
  - [x] Test language switching functionality

### 2. Authentication Flow

- [x] Fix 'Create Account' link not redirecting to signup
  - [x] Check router configuration
  - [x] Verify signup component is properly imported
  - [x] Test navigation from login to signup
- [x] Fix TypeScript errors in User model
  - [x] Resolve duplicate property issues
  - [x] Update auth service to handle user metadata
  - [x] Add missing translation keys
- [x] Configure email confirmation
  - [x] Set up Supabase email templates
  - [x] Add French translations for email content
  - [x] Test email confirmation flow

### 3. Document Management

- [ ] Implement document upload functionality
  - [ ] Create document upload component
  - [ ] Add file type validation
  - [ ] Implement drag and drop
  - [ ] Add progress indicators
- [ ] Document listing and management
  - [ ] Create document list component
  - [ ] Implement sorting and filtering
  - [ ] Add document preview functionality
  - [ ] Implement document sharing
- [ ] Document security
  - [ ] Implement encryption/decryption
  - [ ] Add access control
  - [ ] Implement audit logging

### 4. Git Repository Cleanup

- [x] Review and update .gitignore
  - [x] Add node_modules/
  - [x] Add .angular/cache
  - [x] Add environment files with sensitive data
  - [x] Add IDE specific files
  - [x] Clean up existing tracked files that should be ignored

---

## File Structure

## Structure de Fichiers

```
securevault-military/
│
├── src/
│   ├── app/
│   │   ├── core/                      # Services et modules fondamentaux (singleton)
│   │   │   ├── auth/                  # Service d'authentification
│   │   │   │   ├── guards/            # Route guards
│   │   │   │   ├── interceptors/      # HTTP interceptors pour tokens
│   │   │   │   ├── services/          # Services d'authentification
│   │   │   │   └── store/             # State management pour auth
│   │   │   ├── http/                  # Services HTTP et interceptors
│   │   │   ├── storage/               # Service de stockage et cryptage
│   │   │   └── utils/                 # Utilitaires communs
│   │   │
│   │   ├── shared/                    # Composants, directives, pipes partagés
│   │   │   ├── components/            # Composants UI réutilisables
│   │   │   ├── directives/            # Directives personnalisées
│   │   │   ├── pipes/                 # Pipes personnalisés
│   │   │   └── models/                # Interfaces et classes de modèles
│   │   │
│   │   ├── features/                  # Modules fonctionnels
│   │   │   ├── dashboard/             # Tableau de bord utilisateur
│   │   │   ├── documents/             # Module gestion documentaire
│   │   │   │   ├── components/        # Composants spécifiques aux documents
│   │   │   │   ├── services/          # Services spécifiques aux documents
│   │   │   │   ├── store/             # State management pour documents
│   │   │   │   └── models/            # Modèles spécifiques aux documents
│   │   │   ├── announcements/         # Module communications/annonces
│   │   │   └── admin/                 # Module d'administration
│   │   │
│   │   ├── layouts/                   # Composants de mise en page
│   │   │   ├── main-layout/           # Layout principal authentifié
│   │   │   └── auth-layout/           # Layout pour pages d'authentification
│   │   │
│   │   └── pages/                     # Pages de l'application
│   │       ├── home/                  # Page d'accueil
│   │       ├── login/                 # Page de connexion
│   │       ├── register/              # Page d'inscription
│   │       ├── document-viewer/       # Visualiseur de documents
│   │       └── not-found/             # Page 404
│   │
│   ├── assets/                        # Ressources statiques
│   │   ├── images/                    # Images
│   │   ├── icons/                     # Icônes
│   │   └── i18n/                      # Fichiers de traduction
│   │
│   ├── environments/                  # Configurations d'environnement
│   │   ├── environment.ts             # Développement
│   │   └── environment.prod.ts        # Production
│   │
│   └── themes/                        # Styles et thèmes
│       ├── _variables.scss            # Variables SCSS
│       ├── _mixins.scss               # Mixins SCSS
│       └── styles.scss                # Styles globaux
│
├── supabase/                          # Configuration Supabase
│   ├── functions/                     # Edge functions
│   ├── migrations/                    # Migrations DB
│   └── seed/                          # Données initiales
│
├── cypress/                           # Tests E2E
├── .github/                           # CI/CD workflows
└── docs/                              # Documentation
```

## Liste des Tâches de Développement

### Phase 1: Configuration & Infrastructure (J1-J3) - COMPLETED ✅

- [x] **Configuration du Projet**
    - [x] Initialiser le projet Angular avec Angular CLI
    - [x] Configurer la structure de dossiers
    - [x] Installer les dépendances principales (Angular Material, ngx-translate, etc.)
    - [x] Configurer ESLint et Prettier pour la qualité du code
    - [x] Mettre en place le système de versionnement Git

- [ ] **Configuration Supabase** - IN PROGRESS 🔄
    - [x] Installer la dépendance @supabase/supabase-js
    - [ ] Créer un projet sur Supabase
    - [ ] Configurer l'authentification (providers, règles)
    - [ ] Créer le schéma de base de données initial
        - [ ] Table des utilisateurs avec champs militaires
        - [ ] Table des rôles et permissions
        - [ ] Table des documents
    - [ ] Configurer le système de stockage (buckets)
        - [ ] Créer des buckets pour les documents classifiés
        - [ ] Configurer les politiques d'accès
    - [ ] Configurer les règles de sécurité RLS (Row Level Security)
        - [ ] Politiques pour les utilisateurs
        - [ ] Politiques pour les administrateurs

- [x] **Environnement de Développement**
    - [x] Configurer les fichiers d'environnement (dev, prod)
    - [ ] Mettre à jour les variables d'environnement pour Supabase
    - [x] Configurer les proxy pour le développement local
    - [x] Configurer les variables d'API pour l'authentification

### Phase 2: Core & Authentification (J4-J7) - IN PROGRESS 🔄

- [x] **Services Core**

  - [x] Implémenter le service HTTP avec interceptors pour tokens
  - [x] Créer le service de gestion d'état (state management)
  - [ ] Développer le service de journalisation (logging)
  - [x] Implémenter les utilitaires de cryptage côté client
  - [x] Créer le service de gestion des erreurs

- [x] **Authentification**
  - [x] Implémenter le service d'authentification Supabase
  - [x] Développer les composants de connexion (login)
  - [x] Créer le formulaire d'inscription avec validation
  - [ ] Implémenter la vérification d'ID militaire
  - [ ] Développer le système d'authentification à deux facteurs
  - [ ] Implémenter la récupération de compte
  - [x] Configurer les guards pour routes protégées

#### Next Steps:

1. Implement military ID verification system
2. Set up two-factor authentication
3. Complete account recovery functionality
4. Add comprehensive logging service

- [ ] **Layouts**
  - [ ] Créer le layout principal de l'application
  - [ ] Développer la barre de navigation responsive
  - [ ] Implémenter le menu latéral (sidebar)
  - [ ] Créer le layout pour les pages d'authentification

### Phase 3: Gestion Documentaire (J8-J14)

- [ ] **Structure de Base**

  - [ ] Créer les interfaces/modèles pour documents et dossiers
  - [ ] Implémenter la structure de stockage dans Supabase
  - [ ] Développer le service de gestion documentaire
  - [ ] Implémenter les méthodes CRUD de base

- [ ] **Interface Utilisateur**

  - [ ] Développer la vue d'exploration de documents (explorer)
  - [ ] Créer le composant de téléchargement avec drag & drop
  - [ ] Implémenter la vue en grille/liste des documents
  - [ ] Développer les composants d'affichage des métadonnées
  - [ ] Créer l'interface de création/gestion de dossiers

- [ ] **Fonctionnalités Avancées**
  - [ ] Implémenter le cryptage côté client avant upload
  - [ ] Développer le système de prévisualisation de documents
  - [ ] Créer le système de recherche et filtrage
  - [ ] Implémenter le système de versionning documentaire
  - [ ] Développer les contrôles de quota et limitations

### Phase 4: Communications & Annonces (J15-J18)

- [ ] **Backend Annonces**

  - [ ] Créer les tables et triggers Supabase pour annonces
  - [ ] Implémenter les RLS pour permissions sur annonces
  - [ ] Développer les fonctions serveur pour notifications

- [ ] **Interface Annonces**
  - [ ] Développer le tableau d'affichage des annonces
  - [ ] Créer le composant de création d'annonce (admin)
  - [ ] Implémenter le système de filtrage et recherche
  - [ ] Développer le composant d'accusé de lecture
  - [ ] Créer le système de notifications pour nouvelles annonces

### Phase 5: Administration & Tableau de Bord (J19-J22)

- [ ] **Interface Administration**

  - [ ] Développer le tableau de bord administrateur
  - [ ] Créer l'interface de gestion des utilisateurs
  - [ ] Implémenter le système de logs et audit
  - [ ] Développer les outils de gestion de quotas

- [ ] **Tableau de Bord Utilisateur**
  - [ ] Créer le tableau de bord utilisateur avec widgets
  - [ ] Implémenter les indicateurs d'utilisation d'espace
  - [ ] Développer la vue des documents récents
  - [ ] Créer la section annonces récentes/non lues

### Phase 6: Optimisation & Sécurité (J23-J27)

- [ ] **Performance**

  - [ ] Optimiser le chargement des listes de documents
  - [ ] Implémenter le chargement différé (lazy loading)
  - [ ] Optimiser les requêtes Supabase
  - [ ] Configurer le cache pour les ressources statiques

- [ ] **Sécurité**

  - [ ] Effectuer un audit de sécurité complet
  - [ ] Vérifier la mise en œuvre du cryptage
  - [ ] Tester les autorisations et contrôles d'accès
  - [ ] Corriger les vulnérabilités identifiées
  - [ ] Implémenter le système de journalisation d'activité

- [ ] **Tests**
  - [ ] Écrire les tests unitaires pour services critiques
  - [ ] Implémenter les tests d'intégration
  - [ ] Configurer les tests E2E avec Cypress
  - [ ] Créer des scénarios de test pour les fonctionnalités clés

### Phase 7: Finalisation & Déploiement (J28-J30)

- [x] **Internationalisation**

  - [x] Configurer ngx-translate
  - [x] Extraire les textes dans des fichiers de traduction (en/fr)
  - [x] Implémenter le changement de langue avec sélecteur
  - [x] Créer le composant de sélecteur de langue
  - [x] Configurer la détection automatique de la langue du navigateur

- [ ] **Préparation au Déploiement**

  - [ ] Configurer le build de production
  - [ ] Optimiser les bundles (bundle analyzer)
  - [ ] Mettre en place les règles de sécurité pour production
  - [ ] Préparer les scripts de migration de base de données

- [ ] **Documentation**

  - [ ] Créer la documentation pour les utilisateurs
  - [ ] Rédiger la documentation technique
  - [ ] Documenter les API et structures de données
  - [ ] Préparer les supports de formation

- [ ] **Déploiement**
  - [ ] Déployer la base de données Supabase en production
  - [ ] Configurer l'hébergement pour l'application Angular
  - [ ] Mettre en place le monitoring
  - [ ] Déployer la version MVP

## Bonnes Pratiques à Maintenir

1. **Commits Réguliers**

   - Commits atomiques avec messages descriptifs
   - Utilisation de branches pour fonctionnalités

2. **Revue de Code**

   - Auto-revue avant push
   - Utiliser les pull requests pour fonctionnalités majeures

3. **Sécurité**

   - Ne jamais stocker de secrets dans le code
   - Toujours crypter les données sensibles avant stockage
   - Valider toutes les entrées utilisateur

4. **Architecture**

   - Maintenir la séparation des préoccupations
   - Utiliser les services pour logique métier
   - Composants pour UI uniquement
   - Observer le pattern Container/Presentational

5. **Performance**
   - Surveillance de la taille des bundles
   - Optimisation des requêtes Supabase
   - Mise en œuvre de la stratégie de détection des changements OnPush

## Dépendances Principales

```json
{
  "dependencies": {
    "@angular/...": "^17.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "crypto-js": "^4.2.0",
    "ngx-file-drop": "^16.0.0",
    "ngx-translate": "^15.0.0",
    "rxjs": "~7.8.0",
    "pdfjs-dist": "^4.0.0",
    "marked": "^9.0.0"
  },
  "devDependencies": {
    "@angular-devkit/...": "^17.0.0",
    "cypress": "^13.0.0",
    "jest": "^29.7.0",
    "eslint": "^8.54.0",
    "prettier": "^3.1.0"
  }
}
```
