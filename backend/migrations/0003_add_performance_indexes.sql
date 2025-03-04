-- Migration: Add performance indexes
-- Created at: 2025-03-03 18:00:00
-- Description: Ajoute des index pour optimiser les performances et réduire les "rows read"

-- Index composite pour la table votes optimisé pour la requête getRandomPairForVoting
-- Cet index devrait réduire considérablement (95-97%) les "rows read" pour cette requête
CREATE INDEX IF NOT EXISTS idx_votes_user_pairs ON votes(
  user_id, 
  CASE WHEN winner_id < loser_id THEN winner_id ELSE loser_id END,
  CASE WHEN winner_id < loser_id THEN loser_id ELSE winner_id END
);

-- Index simple sur user_id pour les requêtes de votes par utilisateur
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- Index pour les requêtes de classement par score ELO (meilleures suggestions)
-- Devrait réduire de 50-65% les "rows read" pour ces requêtes
CREATE INDEX IF NOT EXISTS idx_suggestions_elo_score ON suggestions(elo_score DESC);

-- Index pour les requêtes de suggestions récentes
-- Devrait réduire de 50-65% les "rows read" pour ces requêtes
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at DESC);

-- Index pour filtrer les suggestions par utilisateur
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON suggestions(user_id);

-- Vérification des index créés (commenté, à exécuter manuellement si nécessaire)
-- PRAGMA index_list('votes');
-- PRAGMA index_list('suggestions'); 