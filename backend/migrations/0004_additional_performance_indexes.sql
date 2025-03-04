-- Migration: 0004_additional_performance_indexes.sql
-- Date: 2025-02-24
-- Description: Ajoute des index supplémentaires pour optimiser davantage les requêtes de paires aléatoires

-- Index sur l'ID des suggestions pour optimiser la jointure s1.id < s2.id
CREATE INDEX IF NOT EXISTS idx_suggestions_id ON suggestions(id);

-- Index combiné sur elo_score et id pour optimiser les requêtes de top suggestions
CREATE INDEX IF NOT EXISTS idx_suggestions_elo_id ON suggestions(elo_score DESC, id);

-- Index pour optimiser les requêtes qui filtrent par user_id et winner_id/loser_id
CREATE INDEX IF NOT EXISTS idx_votes_user_winner_loser ON votes(user_id, winner_id, loser_id);

-- Commentaire: Ces index sont complémentaires à ceux créés dans la migration 0003.
-- Ils visent spécifiquement à améliorer les performances de la requête getRandomPairForVoting
-- en optimisant la jointure entre les tables suggestions et le filtrage des votes.

-- Pour vérifier les index après application:
-- PRAGMA index_list('suggestions');
-- PRAGMA index_list('votes'); 