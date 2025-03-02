# Gayness Scale

Une application web permettant aux utilisateurs de voter et de suggérer des critères pour évaluer le niveau de "gayness" de manière ludique et respectueuse.

## Structure du Projet

Ce projet est organisé en monorepo avec les composants suivants :

```
/
├── frontend/          # Application Angular (SPA)
├── backend/           # API Cloudflare Workers
└── docs/             # Documentation du projet
```

### Frontend (Angular 19)

Le frontend est une Single Page Application (SPA) construite avec :
- Angular 19
- TailwindCSS pour le styling
- Auth0 pour l'authentification

Pour démarrer le frontend en développement :
```bash
cd frontend
npm install
npm run start
```

### Backend (Cloudflare Workers)

L'API backend est construite avec :
- Cloudflare Workers pour le serverless
- TypeScript
- D1 Database pour le stockage
- Auth0 pour la sécurité

Pour démarrer le backend en développement :
```bash
cd backend
npm install
npm run start
```

### Base de données (Cloudflare D1)

L'application utilise Cloudflare D1, une base de données SQL compatible avec SQLite, pour le stockage des données.

#### Création de la base de données

Pour créer une nouvelle base de données D1 :

```bash
cd backend
wrangler d1 create gayness-scale-db
```

Cette commande génère un nouvel ID de base de données qu'il faut mettre à jour dans le fichier `backend/wrangler.toml` :

```toml
[[d1_databases]]
binding = "DB"
database_name = "gayness-scale-db"
database_id = "votre-id-de-base-de-données"
```

#### Gestion des migrations

Les migrations sont stockées dans le dossier `backend/migrations/` et sont appliquées séquentiellement.

##### Exécuter les migrations en local

Pour initialiser la base de données locale avec toutes les migrations :

```bash
cd backend
node scripts/init-db.js
```

Ou pour exécuter une migration spécifique en local :

```bash
cd backend
wrangler d1 execute gayness-scale-db --file="migrations/nom_de_la_migration.sql"
```

##### Exécuter les migrations en production

Pour appliquer toutes les migrations à la base de données distante :

```bash
cd backend
wrangler d1 migrations apply gayness-scale-db --remote
```

Pour exécuter une migration spécifique en production :

```bash
cd backend
wrangler d1 execute gayness-scale-db --file="migrations/nom_de_la_migration.sql" --remote
```

##### Vérifier l'état de la base de données

Pour vérifier les tables existantes en local :

```bash
cd backend
wrangler d1 execute gayness-scale-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

Pour vérifier les tables existantes en production :

```bash
cd backend
wrangler d1 execute gayness-scale-db --command="SELECT name FROM sqlite_master WHERE type='table';" --remote
```

## Documentation

- [Plan d'implémentation](docs/todo.md)

## Développement

### Prérequis

- Node.js 20+
- npm 10+
- Compte Cloudflare (pour le backend)
- Compte Auth0 (pour l'authentification)

### Installation

1. Cloner le repository
```bash
git clone https://github.com/votre-username/gayness-scale.git
cd gayness-scale
```

2. Installer les dépendances
```bash
# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

## Contribution

Les contributions sont les bienvenues ! Veuillez consulter le fichier [CONTRIBUTING.md](CONTRIBUTING.md) pour les détails. 