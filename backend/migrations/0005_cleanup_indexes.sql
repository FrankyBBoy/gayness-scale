-- Migration: 0005_cleanup_indexes.sql
-- Date: 2025-02-24
-- Description: Supprime les index redondants ou moins utiles après optimisation du code

-- Suppression de l'index complexe sur les paires votées (remplacé par une approche en code)
DROP INDEX IF EXISTS idx_votes_user_pairs;

-- Suppression de l'index sur id (redondant avec la clé primaire)
DROP INDEX IF EXISTS idx_suggestions_id;

-- Suppression de l'index sur created_at (moins prioritaire pour notre cas d'utilisation actuel)
DROP INDEX IF EXISTS idx_suggestions_created_at;

-- Commentaire: Ces index ont été créés pour optimiser l'ancienne implémentation de getRandomPairForVoting
-- qui utilisait une requête SQL complexe avec des jointures et des CTE.
-- La nouvelle implémentation utilise deux requêtes simples et traite la logique dans le code TypeScript,
-- rendant ces index moins utiles.

-- Index conservés qui restent utiles:
-- - idx_votes_user_id: Essentiel pour filtrer les votes par utilisateur
-- - idx_suggestions_elo_score ou idx_suggestions_elo_id: Essentiel pour trier les suggestions par score ELO
-- - idx_suggestions_user_id: Utile pour filtrer les suggestions par utilisateur
-- - idx_votes_user_winner_loser: Utile pour d'autres opérations comme la vérification des votes existants

-- Pour vérifier les index restants après application:
-- PRAGMA index_list('suggestions');
-- PRAGMA index_list('votes'); 