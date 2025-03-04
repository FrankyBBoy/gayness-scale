# Plan d'optimisation pour réduire les "rows read" dans D1

Ce document présente une liste priorisée des tâches à effectuer pour réduire significativement le nombre de lectures dans la base de données D1 de Cloudflare. Avec 700k lectures quotidiennes pour seulement 4 utilisateurs, 14 suggestions et 120 votes, des optimisations sont clairement nécessaires.

## Priorité 1: Optimisations critiques à impact immédiat

### 1.1 Optimiser la requête `getRandomPairForVoting`
- [x] Remplacer le CROSS JOIN actuel par une approche plus efficace
- [x] Implémenter la version optimisée suivante:
```sql
WITH voted_pairs AS (
  SELECT 
    CASE WHEN winner_id < loser_id THEN winner_id ELSE loser_id END AS s1_id,
    CASE WHEN winner_id < loser_id THEN loser_id ELSE winner_id END AS s2_id
  FROM votes
  WHERE user_id = ?
)
SELECT 
  s1.id AS id1, s1.text AS text1, s1.created_at AS created_at1, s1.updated_at AS updated_at1, s1.elo_score AS elo_score1,
  s2.id AS id2, s2.text AS text2, s2.created_at AS created_at2, s2.updated_at AS updated_at2, s2.elo_score AS elo_score2
FROM suggestions s1
JOIN suggestions s2 ON s1.id < s2.id
LEFT JOIN voted_pairs vp ON vp.s1_id = s1.id AND vp.s2_id = s2.id
WHERE vp.s1_id IS NULL
ORDER BY RANDOM()
LIMIT 1
```
- [x] Mesurer l'impact sur les performances après implémentation
- [ ] Optimiser davantage la requête en testant des alternatives (comme NOT EXISTS)
- [ ] Ajouter des index sur les colonnes clés pour améliorer les performances des jointures
- Économie estimée: ~50% des lectures actuelles

### 1.2 Optimiser les index de la base de données
- [ ] Ajouter les index prioritaires suivants pour réduire significativement les "rows read":

  #### Index pour la table `votes`:
  - [ ] Créer un index composite optimisé pour la requête de paires non votées:
  ```sql
  CREATE INDEX idx_votes_user_pairs ON votes(
    user_id, 
    CASE WHEN winner_id < loser_id THEN winner_id ELSE loser_id END,
    CASE WHEN winner_id < loser_id THEN loser_id ELSE winner_id END
  );
  ```
  - Impact attendu: Réduction de 95-97% des "rows read" pour la requête `getRandomPairForVoting` (de 8.58k à environ 200-300)
  
  - [ ] Créer un index simple sur user_id pour les requêtes de votes par utilisateur:
  ```sql
  CREATE INDEX idx_votes_user_id ON votes(user_id);
  ```
  
  #### Index pour la table `suggestions`:
  - [ ] Créer un index pour les requêtes de classement par score ELO:
  ```sql
  CREATE INDEX idx_suggestions_elo_score ON suggestions(elo_score DESC);
  ```
  - Impact attendu: Réduction de 50-65% des "rows read" pour les requêtes de meilleures suggestions
  
  - [ ] Créer un index pour les requêtes de suggestions récentes:
  ```sql
  CREATE INDEX idx_suggestions_created_at ON suggestions(created_at DESC);
  ```
  - Impact attendu: Réduction de 50-65% des "rows read" pour les requêtes de suggestions récentes
  
  - [ ] Créer un index pour filtrer les suggestions par utilisateur:
  ```sql
  CREATE INDEX idx_suggestions_user_id ON suggestions(user_id);
  ```
  - Impact attendu: Amélioration significative des performances pour les requêtes de suggestions par utilisateur

- [ ] Vérifier l'impact des index sur les performances des requêtes principales
- [ ] Documenter les index créés pour référence future
- Économie estimée: ~70-80% des lectures pour les requêtes concernées

### 1.3 Utiliser le CDN de Cloudflare avec des en-têtes de cache appropriés
- [ ] Modifier les endpoints API pour les listes "Meilleurs Suggestions" et "Dernières Suggestions" afin d'inclure des en-têtes de cache appropriés:
  - [ ] Ajouter `Cache-Control: public, max-age=3600` (cache d'une heure)
  - [ ] Implémenter des ETag ou Last-Modified pour la validation conditionnelle
  - [ ] Configurer Vary: Accept, Accept-Encoding pour gérer correctement les différentes représentations
- [ ] Configurer les règles de cache dans le dashboard Cloudflare pour ces endpoints spécifiques
- [ ] Ajouter un mécanisme de purge de cache lors de l'ajout/modification de suggestions importantes
- [ ] Implémenter une stratégie de cache-busting pour les mises à jour urgentes (par exemple, via des paramètres de requête)
- [ ] Tester la mise en cache avec des outils comme Lighthouse ou les outils de développement du navigateur
- Économie estimée: ~40% des lectures totales (en supposant que ces listes sont fréquemment consultées)

### 1.4 Implémenter un cache côté client pour les suggestions
- [ ] Mettre en cache la liste des suggestions dans le localStorage du navigateur
- [ ] Définir une durée de validité du cache (ex: 1 heure pour correspondre au rafraîchissement serveur)
- [ ] Ajouter un mécanisme d'invalidation du cache lors de l'ajout/modification de suggestions
- [ ] Tester la cohérence des données entre le cache et le serveur
- Économie estimée: ~30% des lectures totales

### 1.5 Ajouter des logs de diagnostic pour identifier les points chauds
- [ ] Instrumenter chaque service avec des logs détaillant:
  - [ ] Le nombre d'appels à chaque méthode
  - [ ] Le nombre estimé de lectures par appel
  - [ ] Les paramètres d'appel pour identifier les motifs
- [ ] Créer un endpoint d'administration pour consulter ces statistiques
- [ ] Analyser les résultats pour identifier d'autres opportunités d'optimisation

## Priorité 2: Optimisations architecturales

### 2.1 Réduire la fréquence des requêtes du frontend
- [ ] Identifier et éliminer tout polling inutile
- [ ] Remplacer les requêtes périodiques par des approches plus efficaces:
  - [ ] Utiliser des WebSockets pour les mises à jour en temps réel
  - [ ] Implémenter un mécanisme de "pull-to-refresh" manuel
- [ ] Vérifier l'impact sur l'expérience utilisateur
- Économie estimée: ~40% des lectures si du polling est présent

### 2.2 Combiner les endpoints fréquemment appelés
- [ ] Créer un endpoint `/api/dashboard` qui retourne en une seule requête:
  - [ ] Les suggestions populaires (depuis le cache horaire)
  - [ ] Les statistiques de l'utilisateur
  - [ ] La prochaine paire à voter
- [ ] Adapter le frontend pour utiliser ce nouvel endpoint
- [ ] Mesurer la réduction du nombre de requêtes
- Économie estimée: ~20% des lectures

### 2.3 Optimiser les requêtes de jointure
- [ ] Remplacer `SELECT *` par la sélection explicite des colonnes nécessaires
- [ ] Vérifier l'impact des index sur les performances de lecture
- Économie estimée: ~15% des lectures

## Priorité 3: Améliorations supplémentaires

### 3.1 Implémenter la pagination pour toutes les listes
- [ ] Limiter `getAllSuggestions` à 10 éléments par page
- [ ] Ajouter la pagination à `getVotesByUser` et autres listes
- [ ] Adapter l'interface utilisateur pour la navigation paginée
- [ ] Implémenter le chargement à la demande (lazy loading)
- Économie estimée: ~10% des lectures

### 3.2 Précharger les paires de vote
- [ ] Modifier le frontend pour précharger la prochaine paire pendant que l'utilisateur vote
- [ ] Stocker temporairement 2-3 paires en avance dans le state de l'application
- [ ] Implémenter une logique de rafraîchissement intelligent du cache de paires
- Économie estimée: ~5-10% des lectures

### 3.3 Optimiser les vérifications de limites quotidiennes
- [ ] Stocker les compteurs de limites quotidiennes dans le localStorage
- [ ] Vérifier les limites côté client avant d'envoyer des requêtes
- [ ] Valider côté serveur uniquement lors de l'action finale
- [ ] S'assurer que la synchronisation client/serveur reste cohérente
- Économie estimée: ~5% des lectures

## Priorité 4: Monitoring et maintenance continue

### 4.1 Mettre en place un monitoring des performances
- [ ] Ajouter des métriques pour suivre le nombre de lectures par endpoint
- [ ] Créer un dashboard pour visualiser l'évolution des performances
- [ ] Configurer des alertes en cas de dépassement de seuils
- [ ] Établir une baseline pour comparer les améliorations

### 4.2 Réviser régulièrement les requêtes les plus coûteuses
- [ ] Analyser les logs mensuellement pour identifier de nouvelles opportunités d'optimisation
- [ ] Mettre à jour ce document avec de nouvelles tâches selon les besoins
- [ ] Planifier des revues de code régulières axées sur les performances

### 4.3 Évaluer l'impact des nouvelles fonctionnalités
- [ ] Ajouter une étape d'évaluation des performances dans le processus de développement
- [ ] Estimer l'impact sur les lectures D1 avant de déployer de nouvelles fonctionnalités
- [ ] Documenter les bonnes pratiques pour les futurs développements

## Impact estimé total
En implémentant toutes ces optimisations, nous pouvons espérer réduire le nombre de lectures de 80-90%, ramenant les 700k lectures quotidiennes à environ 70-140k. 