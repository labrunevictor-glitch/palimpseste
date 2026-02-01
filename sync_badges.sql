-- ═══════════════════════════════════════════════════════════════════════════
-- 🏆 SYNCHRONISATION DES BADGES ET PROGRESSION UTILISATEUR
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Ce script crée la table user_progress pour synchroniser les badges
-- et statistiques de lecture entre tous les appareils d'un utilisateur.
--
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Table de progression utilisateur (badges + stats de lecture)
CREATE TABLE IF NOT EXISTS user_progress (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    achievements TEXT[] DEFAULT '{}', -- Liste des IDs de badges débloqués
    read_count INTEGER DEFAULT 0,
    author_stats JSONB DEFAULT '{}', -- { "Victor Hugo": 5, "Baudelaire": 3 }
    genre_stats JSONB DEFAULT '{}', -- { "poésie": 10, "roman": 5 }
    liked_genre_stats JSONB DEFAULT '{}',
    liked_author_stats JSONB DEFAULT '{}',
    liked_authors TEXT[] DEFAULT '{}',
    reading_stats JSONB DEFAULT '{
        "totalWordsRead": 0,
        "totalReadingTime": 0,
        "streak": 0,
        "lastReadDate": null,
        "sessionsToday": 0,
        "bestStreak": 0,
        "dailyWords": {}
    }',
    reading_path JSONB DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_progress_updated ON user_progress(updated_at DESC);

-- RLS pour user_progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs ne voient que leur propre progression
CREATE POLICY "Les utilisateurs voient leur progression"
    ON user_progress FOR SELECT
    USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leur progression
CREATE POLICY "Les utilisateurs peuvent créer leur progression"
    ON user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leur progression
CREATE POLICY "Les utilisateurs peuvent modifier leur progression"
    ON user_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔧 Fonction RPC pour fusionner/synchroniser la progression
-- Fusionne les données locales avec le cloud (prend le maximum)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION sync_user_progress(
    p_achievements TEXT[],
    p_read_count INTEGER,
    p_author_stats JSONB,
    p_genre_stats JSONB,
    p_liked_genre_stats JSONB,
    p_liked_author_stats JSONB,
    p_liked_authors TEXT[],
    p_reading_stats JSONB,
    p_reading_path JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_existing user_progress%ROWTYPE;
    v_merged_achievements TEXT[];
    v_merged_read_count INTEGER;
    v_merged_author_stats JSONB;
    v_merged_genre_stats JSONB;
    v_merged_liked_genre_stats JSONB;
    v_merged_liked_author_stats JSONB;
    v_merged_liked_authors TEXT[];
    v_merged_reading_stats JSONB;
    v_merged_reading_path JSONB;
BEGIN
    -- Récupérer les données existantes
    SELECT * INTO v_existing FROM user_progress WHERE user_id = auth.uid();
    
    IF v_existing IS NULL THEN
        -- Première sync : créer l'entrée
        INSERT INTO user_progress (
            user_id, achievements, read_count, author_stats, genre_stats,
            liked_genre_stats, liked_author_stats, liked_authors,
            reading_stats, reading_path, updated_at
        ) VALUES (
            auth.uid(), p_achievements, p_read_count, p_author_stats, p_genre_stats,
            p_liked_genre_stats, p_liked_author_stats, p_liked_authors,
            p_reading_stats, p_reading_path, NOW()
        );
        
        RETURN jsonb_build_object(
            'achievements', p_achievements,
            'readCount', p_read_count,
            'authorStats', p_author_stats,
            'genreStats', p_genre_stats,
            'likedGenreStats', p_liked_genre_stats,
            'likedAuthorStats', p_liked_author_stats,
            'likedAuthors', p_liked_authors,
            'readingStats', p_reading_stats,
            'readingPath', p_reading_path
        );
    ELSE
        -- Fusionner les achievements (union des deux listes, sans doublons)
        SELECT ARRAY(
            SELECT DISTINCT unnest 
            FROM unnest(v_existing.achievements || p_achievements)
        ) INTO v_merged_achievements;
        
        -- Prendre le maximum pour read_count
        v_merged_read_count := GREATEST(v_existing.read_count, p_read_count);
        
        -- Fusionner author_stats (prendre le max pour chaque auteur)
        SELECT COALESCE(
            jsonb_object_agg(
                key,
                GREATEST(
                    COALESCE((v_existing.author_stats->key)::integer, 0),
                    COALESCE((p_author_stats->key)::integer, 0)
                )
            ),
            '{}'::jsonb
        )
        INTO v_merged_author_stats
        FROM (
            SELECT DISTINCT key 
            FROM (
                SELECT jsonb_object_keys(COALESCE(v_existing.author_stats, '{}'::jsonb)) AS key
                UNION
                SELECT jsonb_object_keys(COALESCE(p_author_stats, '{}'::jsonb)) AS key
            ) AS all_keys
        ) AS keys;
        
        -- Fusionner genre_stats (prendre le max pour chaque genre)
        SELECT COALESCE(
            jsonb_object_agg(
                key,
                GREATEST(
                    COALESCE((v_existing.genre_stats->key)::integer, 0),
                    COALESCE((p_genre_stats->key)::integer, 0)
                )
            ),
            '{}'::jsonb
        )
        INTO v_merged_genre_stats
        FROM (
            SELECT DISTINCT key 
            FROM (
                SELECT jsonb_object_keys(COALESCE(v_existing.genre_stats, '{}'::jsonb)) AS key
                UNION
                SELECT jsonb_object_keys(COALESCE(p_genre_stats, '{}'::jsonb)) AS key
            ) AS all_keys
        ) AS keys;
        
        -- Fusionner liked_genre_stats
        SELECT COALESCE(
            jsonb_object_agg(
                key,
                GREATEST(
                    COALESCE((v_existing.liked_genre_stats->key)::integer, 0),
                    COALESCE((p_liked_genre_stats->key)::integer, 0)
                )
            ),
            '{}'::jsonb
        )
        INTO v_merged_liked_genre_stats
        FROM (
            SELECT DISTINCT key 
            FROM (
                SELECT jsonb_object_keys(COALESCE(v_existing.liked_genre_stats, '{}'::jsonb)) AS key
                UNION
                SELECT jsonb_object_keys(COALESCE(p_liked_genre_stats, '{}'::jsonb)) AS key
            ) AS all_keys
        ) AS keys;
        
        -- Fusionner liked_author_stats
        SELECT COALESCE(
            jsonb_object_agg(
                key,
                GREATEST(
                    COALESCE((v_existing.liked_author_stats->key)::integer, 0),
                    COALESCE((p_liked_author_stats->key)::integer, 0)
                )
            ),
            '{}'::jsonb
        )
        INTO v_merged_liked_author_stats
        FROM (
            SELECT DISTINCT key 
            FROM (
                SELECT jsonb_object_keys(COALESCE(v_existing.liked_author_stats, '{}'::jsonb)) AS key
                UNION
                SELECT jsonb_object_keys(COALESCE(p_liked_author_stats, '{}'::jsonb)) AS key
            ) AS all_keys
        ) AS keys;
        
        -- Fusionner liked_authors (union)
        SELECT ARRAY(
            SELECT DISTINCT unnest 
            FROM unnest(v_existing.liked_authors || p_liked_authors)
        ) INTO v_merged_liked_authors;
        
        -- Fusionner reading_stats (prendre les max)
        v_merged_reading_stats := jsonb_build_object(
            'totalWordsRead', GREATEST(
                COALESCE((v_existing.reading_stats->>'totalWordsRead')::integer, 0),
                COALESCE((p_reading_stats->>'totalWordsRead')::integer, 0)
            ),
            'totalReadingTime', GREATEST(
                COALESCE((v_existing.reading_stats->>'totalReadingTime')::integer, 0),
                COALESCE((p_reading_stats->>'totalReadingTime')::integer, 0)
            ),
            'streak', GREATEST(
                COALESCE((v_existing.reading_stats->>'streak')::integer, 0),
                COALESCE((p_reading_stats->>'streak')::integer, 0)
            ),
            'lastReadDate', COALESCE(
                GREATEST(
                    v_existing.reading_stats->>'lastReadDate',
                    p_reading_stats->>'lastReadDate'
                ),
                p_reading_stats->>'lastReadDate',
                v_existing.reading_stats->>'lastReadDate'
            ),
            'sessionsToday', GREATEST(
                COALESCE((v_existing.reading_stats->>'sessionsToday')::integer, 0),
                COALESCE((p_reading_stats->>'sessionsToday')::integer, 0)
            ),
            'bestStreak', GREATEST(
                COALESCE((v_existing.reading_stats->>'bestStreak')::integer, 0),
                COALESCE((p_reading_stats->>'bestStreak')::integer, 0)
            ),
            'dailyWords', COALESCE(v_existing.reading_stats->'dailyWords', '{}'::jsonb) || 
                          COALESCE(p_reading_stats->'dailyWords', '{}'::jsonb)
        );
        
        -- Reading path : prendre le plus long
        IF jsonb_array_length(COALESCE(v_existing.reading_path, '[]'::jsonb)) >= 
           jsonb_array_length(COALESCE(p_reading_path, '[]'::jsonb)) THEN
            v_merged_reading_path := v_existing.reading_path;
        ELSE
            v_merged_reading_path := p_reading_path;
        END IF;
        
        -- Mettre à jour
        UPDATE user_progress SET
            achievements = v_merged_achievements,
            read_count = v_merged_read_count,
            author_stats = v_merged_author_stats,
            genre_stats = v_merged_genre_stats,
            liked_genre_stats = v_merged_liked_genre_stats,
            liked_author_stats = v_merged_liked_author_stats,
            liked_authors = v_merged_liked_authors,
            reading_stats = v_merged_reading_stats,
            reading_path = v_merged_reading_path,
            updated_at = NOW()
        WHERE user_id = auth.uid();
        
        RETURN jsonb_build_object(
            'achievements', v_merged_achievements,
            'readCount', v_merged_read_count,
            'authorStats', v_merged_author_stats,
            'genreStats', v_merged_genre_stats,
            'likedGenreStats', v_merged_liked_genre_stats,
            'likedAuthorStats', v_merged_liked_author_stats,
            'likedAuthors', v_merged_liked_authors,
            'readingStats', v_merged_reading_stats,
            'readingPath', v_merged_reading_path
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
REVOKE ALL ON FUNCTION sync_user_progress(TEXT[], INTEGER, JSONB, JSONB, JSONB, JSONB, TEXT[], JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sync_user_progress(TEXT[], INTEGER, JSONB, JSONB, JSONB, JSONB, TEXT[], JSONB, JSONB) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ Terminé !
-- ═══════════════════════════════════════════════════════════════════════════
