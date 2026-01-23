-- ═══════════════════════════════════════════════════════════
-- Ajouter la colonne is_silent pour distinguer les extraits
-- créés automatiquement (pour likes/collections) des vrais partages
-- ═══════════════════════════════════════════════════════════

-- Ajouter la colonne (valeur par défaut false = extrait publié normalement)
ALTER TABLE extraits ADD COLUMN IF NOT EXISTS is_silent BOOLEAN DEFAULT false;

-- Créer un index pour filtrer efficacement les extraits non-silencieux
CREATE INDEX IF NOT EXISTS idx_extraits_is_silent ON extraits(is_silent) WHERE is_silent = false OR is_silent IS NULL;

-- Commentaire explicatif
COMMENT ON COLUMN extraits.is_silent IS 'True si l''extrait a été créé automatiquement pour permettre un like ou ajout collection, sans être un vrai partage public';
