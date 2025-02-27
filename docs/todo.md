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
  - [ ] Footer

- [x] Pages
  - [x] Home (classement public)
  - [x] Login/Register (Auth0)
  - [x] Add Suggestion
  - [x] Vote

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
  - suggestions (id, title, description, user_id, status, elo_score, created_at, updated_at)
  - votes (id, suggestion_id, user_id, score, created_at, updated_at)
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
  - [x] PUT /api/suggestions/:id (mise à jour du statut)

- [x] Votes
  - [x] POST /api/votes (création avec limite quotidienne)
  - [x] GET /api/votes/user/:id (votes d'un utilisateur)
  - [x] GET /api/votes/suggestion/:id (votes d'une suggestion)

### Services
- [x] Service de gestion des utilisateurs
- [x] Service de gestion des suggestions
  - [x] Gestion des limites quotidiennes (5 suggestions/jour)
  - [x] Tri par score ELO
- [x] Service de gestion des votes
  - [x] Implémentation de l'algorithme ELO
  - [x] Gestion des limites quotidiennes (10 votes/jour)

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
  - [x] Profile (stats utilisateur)

### Services
- [x] Auth Service (intégration Auth0)
- [x] API Service
- [x] User Service
  - [x] Gestion des limites quotidiennes
- [x] Suggestion Service
  - [x] Intégration avec l'API
  - [x] Gestion des suggestions
- [x] Vote Service
  - [x] Intégration avec l'API
  - [x] Calcul des scores moyens

### Guards
- [x] Auth Guard pour les routes protégées

## 5. Tests

### Backend
- [ ] Tests unitaires des services
- [ ] Tests d'intégration des endpoints
- [ ] Tests de l'algorithme Elo

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

## 8. Optimisations futures potentielles

- [ ] Cache des résultats
- [ ] Optimisation des requêtes
- [ ] Amélioration de l'algorithme de matching
- [ ] Système de badges/récompenses
- [ ] Dashboard admin
- [ ] Export des données

## 9. Refonte du système de vote

### Backend
- [x] Modifier le service de suggestions
  - [x] Ajouter une méthode pour récupérer 2 suggestions aléatoires
  - [x] Exclure les suggestions déjà votées par l'utilisateur
  - [x] Optimiser la requête pour éviter les doublons

- [x] Modifier le service de votes
  - [x] Adapter l'algorithme ELO pour le système de comparaison directe
  - [x] Mettre à jour la méthode de création de vote pour gérer la comparaison
  - [x] Ajouter la logique de tracking des suggestions déjà vues

### Frontend
- [x] Mettre à jour le composant de vote
  - [x] Modifier l'interface pour afficher 2 suggestions côte à côte
  - [x] Implémenter la logique de sélection d'une suggestion
  - [x] Ajouter des animations de transition entre les paires
  - [x] Gérer l'état de chargement et les erreurs

- [x] Mettre à jour le service de vote
  - [x] Adapter les méthodes pour le nouveau format de vote
  - [x] Gérer le cache local des votes effectués
  - [x] Optimiser les requêtes pour minimiser la latence

### Base de données
- [x] Créer la migration pour le nouveau système
  - [x] Ajouter la colonne elo_score aux suggestions
  - [x] Modifier la structure de la table votes
  - [x] Ajouter les contraintes de clés étrangères

### Tests
- [ ] Tests unitaires
  - [ ] Tester la sélection aléatoire des suggestions
  - [ ] Tester le nouvel algorithme ELO
  - [ ] Tester la logique de comparaison

- [ ] Tests d'intégration
  - [ ] Tester le flux complet de vote
  - [ ] Vérifier la mise à jour des scores
  - [ ] Valider la non-répétition des suggestions

### Prochaines étapes
- [ ] Optimiser les performances
  - [ ] Ajouter des index sur les colonnes fréquemment utilisées
  - [ ] Mettre en cache les paires de suggestions
  - [ ] Optimiser les requêtes SQL

- [ ] Améliorer l'expérience utilisateur
  - [ ] Ajouter des statistiques sur les votes
  - [ ] Afficher l'historique des votes
  - [ ] Ajouter des animations plus fluides

## 10. Tests

### Backend
- [ ] Tests unitaires des services
- [ ] Tests d'intégration des endpoints
- [ ] Tests de l'algorithme Elo

### Frontend
- [ ] Tests unitaires des services
- [ ] Tests des components
- [ ] Tests E2E avec Cypress

## 11. Déploiement

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

## 12. Post-déploiement

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

## 13. Optimisations futures potentielles

- [ ] Cache des résultats
- [ ] Optimisation des requêtes
- [ ] Amélioration de l'algorithme de matching
- [ ] Système de badges/récompenses
- [ ] Dashboard admin
- [ ] Export des données

## 14. Refonte du système de vote

### Backend
- [ ] Modifier le service de suggestions
  - [ ] Ajouter une méthode pour récupérer 2 suggestions aléatoires
  - [ ] Exclure les suggestions déjà votées par l'utilisateur
  - [ ] Optimiser la requête pour éviter les doublons

- [ ] Modifier le service de votes
  - [ ] Adapter l'algorithme ELO pour le système de comparaison directe
  - [ ] Mettre à jour la méthode de création de vote pour gérer la comparaison
  - [ ] Ajouter la logique de tracking des suggestions déjà vues

### Frontend
- [ ] Mettre à jour le composant de vote
  - [ ] Modifier l'interface pour afficher 2 suggestions côte à côte
  - [ ] Implémenter la logique de sélection d'une suggestion
  - [ ] Ajouter des animations de transition entre les paires
  - [ ] Gérer l'état de chargement et les erreurs

- [ ] Mettre à jour le service de vote
  - [ ] Adapter les méthodes pour le nouveau format de vote
  - [ ] Gérer le cache local des votes effectués
  - [ ] Optimiser les requêtes pour minimiser la latence

### Tests
- [ ] Tests unitaires
  - [ ] Tester la sélection aléatoire des suggestions
  - [ ] Tester le nouvel algorithme ELO
  - [ ] Tester la logique de comparaison

- [ ] Tests d'intégration
  - [ ] Tester le flux complet de vote
  - [ ] Vérifier la mise à jour des scores
  - [ ] Valider la non-répétition des suggestions 