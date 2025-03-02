# Gayness Scale - Plan d'implémentation

## 1. Configuration initiale du projet

### Frontend (Angular)
- [x] Initialiser un nouveau projet Angular 19
- [x] Configurer TailwindCSS
- [x] Configurer Auth0 pour l'authentification
- [x] Mettre en place la structure de base du projet
  - [x] Components
  - [x] Services
  - [x] Guards
  - [x] Interfaces
  - [x] Environment files

### Components
- [x] Layout
  - [x] Navbar (avec état d'authentification)
  - [x] Footer

- [x] Pages
  - [x] Home (classement public)
  - [x] Login/Register (Auth0)
  - [x] Add Suggestion
  - [x] Vote
  - [x] Profile (stats utilisateur)

### Services
- [x] Auth Service (intégration Auth0)
- [x] API Service
- [x] User Service
- [x] Suggestion Service
- [x] Vote Service

### Guards
- [x] Auth Guard pour les routes protégées

### Backend (Cloudflare Workers + D1)
- [x] Initialiser un nouveau projet Cloudflare Workers
- [x] Configurer D1 Database
- [x] Mettre en place la structure du projet
  - [x] Routes
  - [x] Middleware
  - [x] Services
  - [x] Types

## 2. Base de données

### Schéma D1
- [x] Créer les tables:
  ```sql
  - users (id, email, name, daily_votes_count, daily_suggestions_count, last_vote_date, last_suggestion_date, created_at, updated_at)
  - suggestions (id, description, user_id, elo_score, created_at, updated_at)
  - votes (id, winner_id, loser_id, user_id, created_at)
  ```
- [x] Créer les indexes nécessaires
- [x] Mettre en place les migrations

## 3. Backend Implementation

### API Endpoints
- [x] Authentication
  - [x] Middleware de vérification JWT Auth0
  - [x] Endpoint de création/mise à jour utilisateur

- [x] Suggestions
  - [x] GET /api/suggestions (liste paginée, triée par score ELO)
  - [x] POST /api/suggestions (création avec limite quotidienne)
  - [x] GET /api/suggestions/:id (détails)
  - [x] PUT /api/suggestions/:id (mise à jour)
  - [x] GET /api/suggestions/random-pair (paire aléatoire pour vote)

- [x] Votes
  - [x] POST /api/votes (création sans limite quotidienne)
  - [x] GET /api/votes/user/:id (votes d'un utilisateur)

### Services
- [x] Service de gestion des utilisateurs
- [x] Service de gestion des suggestions
  - [x] Gestion des limites quotidiennes (5 suggestions/jour)
  - [x] Tri par score ELO
  - [x] Récupération de paires aléatoires pour le vote
- [x] Service de gestion des votes
  - [x] Implémentation de l'algorithme ELO
  - [x] Tracking des suggestions déjà votées

## 4. Frontend Implementation

### Components
- [x] Layout
  - [x] Navbar (avec état d'authentification)
  - [x] Footer

- [x] Pages
  - [x] Home (classement public)
  - [x] Login/Register (Auth0)
  - [x] Add Suggestion
  - [x] Vote
    - [x] Interface pour afficher 2 suggestions côte à côte
    - [x] Logique de sélection d'une suggestion
    - [x] Gestion des états (chargement, erreurs, plus de suggestions)
    - [x] Bouton pour passer à la paire suivante
  - [x] Profile (stats utilisateur)

### Services
- [x] Auth Service (intégration Auth0)
- [x] API Service
- [x] User Service
  - [x] Gestion des limites quotidiennes pour les suggestions uniquement
- [x] Suggestion Service
  - [x] Intégration avec l'API
  - [x] Gestion des suggestions
  - [x] Récupération de paires aléatoires
- [x] Vote Service
  - [x] Intégration avec l'API
  - [x] Création de votes avec le système de comparaison directe

## 5. Tests

### Backend
- [x] Tests unitaires des services
  - [x] Tester la sélection aléatoire des suggestions
  - [x] Tester l'algorithme ELO
  - [x] Tester la logique de comparaison
- [x] Tests d'intégration des endpoints
  - [x] Tester le flux complet de vote
  - [x] Vérifier la mise à jour des scores
  - [x] Valider la non-répétition des suggestions

### Frontend
- [ ] Tests unitaires des services
- [ ] Tests des components
- [ ] Tests E2E avec Cypress

## 6. Déploiement

### Backend (Cloudflare)
- [ ] Configuration des variables d'environnement
- [ ] Déploiement de la base D1
- [ ] Déploiement du Worker
- [ ] Configuration des routes et DNS

### Frontend (Cloudflare Pages)
- [ ] Configuration du build
- [ ] Configuration des variables d'environnement
- [ ] Déploiement
- [ ] Configuration du domaine personnalisé

## 7. Post-déploiement

### Monitoring et Analytics
- [ ] Mise en place du monitoring
- [ ] Configuration des analytics
- [ ] Mise en place des alertes

### Documentation
- [ ] Documentation API
- [ ] Documentation technique
- [ ] Guide d'utilisation

### Sécurité
- [ ] Audit de sécurité
- [ ] Tests de charge
- [ ] Configuration CORS
- [ ] Rate limiting

## 8. Optimisations futures

- [ ] Cache des résultats
- [ ] Optimisation des requêtes
  - [ ] Ajouter des index sur les colonnes fréquemment utilisées
  - [ ] Mettre en cache les paires de suggestions
  - [ ] Optimiser les requêtes SQL
- [ ] Amélioration de l'algorithme de matching
- [ ] Système de badges/récompenses
- [ ] Dashboard admin
- [ ] Export des données
- [ ] Amélioration de l'expérience utilisateur
  - [ ] Ajouter des statistiques plus détaillées sur les votes
  - [ ] Améliorer l'affichage de l'historique des votes
  - [ ] Optimiser les animations et transitions

## 9. Modifications du système de vote

### Changements à implémenter
- [x] Supprimer la limite quotidienne de votes
  - [x] Backend:
    - [x] Modifier le service de vote (`backend/src/services/vote.service.ts`) pour ne plus vérifier la limite quotidienne
      - [x] Supprimer la vérification `daily_votes_count < 10` dans la méthode `createVote`
      - [x] Supprimer la mise à jour du compteur `daily_votes_count` dans la méthode `createVote`
    - [x] Modifier la route de vote (`backend/src/routes/vote.routes.ts`) pour ne plus renvoyer d'erreur 429
      - [x] Supprimer la gestion de l'erreur 'Daily vote limit reached'
    - [x] Mettre à jour le service de suggestion (`backend/src/services/suggestion.service.ts`) pour ne plus inclure le nombre de votes restants dans la réponse
      - [x] Modifier la méthode `getRandomPairForVoting` pour ne plus calculer `remainingCount` basé sur les votes restants
  - [x] Frontend:
    - [x] Mettre à jour le service utilisateur (`frontend/src/app/core/services/user.service.ts`)
      - [x] Supprimer ou modifier la méthode `canVoteToday`
      - [x] Supprimer ou modifier la méthode `getRemainingVotes`
    - [x] Mettre à jour le composant de vote (`frontend/src/app/pages/vote/vote.component.ts`)
      - [x] Supprimer la propriété `remainingVotes`
      - [x] Supprimer la gestion de l'erreur 429
      - [x] Supprimer la propriété `votingEnabled` ou la modifier pour qu'elle ne soit plus basée sur la limite quotidienne
    - [x] Mettre à jour le template de vote (`frontend/src/app/pages/vote/vote.component.html`)
      - [x] Supprimer l'affichage du nombre de votes restants
      - [x] Supprimer ou modifier la section "Daily limit reached"
  - [x] Base de données:
    - [x] Créer une migration pour supprimer la colonne `daily_votes_count` de la table `users` (optionnel, peut être conservée mais non utilisée)
    - [x] Mettre à jour les scripts d'initialisation de la base de données si nécessaire

- [x] Conserver la limite quotidienne de 5 suggestions par utilisateur
  - [x] S'assurer que toutes les vérifications liées à `daily_suggestions_count` restent intactes
  - [x] Vérifier que la limite de 5 suggestions par jour est toujours correctement appliquée dans le service de suggestion
  - [x] Vérifier que l'interface utilisateur affiche toujours correctement le nombre de suggestions restantes

### Tests à effectuer après les modifications
- [x] Vérifier que les utilisateurs peuvent voter sans limite quotidienne
- [x] Vérifier que l'interface n'affiche plus de compteur de votes restants
- [x] Vérifier que l'erreur 429 n'est plus renvoyée pour les votes
- [x] Vérifier que la limite de 5 suggestions par jour fonctionne toujours correctement
- [x] Vérifier que l'algorithme ELO continue de fonctionner correctement
- [x] Vérifier que le tracking des suggestions déjà votées fonctionne toujours 