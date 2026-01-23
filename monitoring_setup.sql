-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 PALIMPSESTE - Configuration du Monitoring
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Instructions:
-- 1. Exécutez ce script dans Supabase SQL Editor
-- 2. Accédez aux données via le Dashboard ou créez une page admin
--
-- ═══════════════════════════════════════════════════════════════════════════

-- Table des événements analytics
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,           -- 'login', 'logout', 'page_view', 'search', 'share', etc.
    event_data JSONB DEFAULT '{}',      -- Données additionnelles (page, query, etc.)
    ip_address TEXT,                    -- Optionnel, pour géolocalisation
    user_agent TEXT,                    -- Navigateur/device
    session_id TEXT,                    -- Pour grouper les événements d'une session
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_session ON analytics_events(session_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔒 SÉCURITÉ RLS - TRÈS IMPORTANT
-- ═══════════════════════════════════════════════════════════════════════════

-- Activer RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent (pour pouvoir relancer le script)
DROP POLICY IF EXISTS "Anyone can insert analytics" ON analytics_events;
DROP POLICY IF EXISTS "Admins can read analytics" ON analytics_events;
DROP POLICY IF EXISTS "No public read" ON analytics_events;

-- Policy 1: Tout le monde peut INSÉRER (pour tracker même les visiteurs anonymes)
-- C'est sécurisé car on ne peut que AJOUTER des données, pas les LIRE
CREATE POLICY "Anyone can insert analytics" ON analytics_events
    FOR INSERT 
    WITH CHECK (true);

-- Policy 2: SEUL VOTRE EMAIL peut LIRE les données
-- ⚠️ IMPORTANT: Remplacez 'VOTRE_EMAIL@example.com' par votre vrai email Supabase
CREATE POLICY "Admins can read analytics" ON analytics_events
    FOR SELECT 
    USING (
        auth.jwt() ->> 'email' = 'VOTRE_EMAIL@example.com'
    );

-- ═══════════════════════════════════════════════════════════════════════════
-- 📋 VÉRIFICATION: Exécutez cette requête pour voir vos policies
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'analytics_events';

-- ═══════════════════════════════════════════════════════════════════════════
-- 📈 VUES POUR LE DASHBOARD
-- ═══════════════════════════════════════════════════════════════════════════

-- Vue : Connexions par jour
CREATE OR REPLACE VIEW analytics_daily_logins AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as login_count,
    COUNT(DISTINCT user_id) as unique_users
FROM analytics_events 
WHERE event_type = 'login'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Vue : Événements par type (derniers 30 jours)
CREATE OR REPLACE VIEW analytics_events_summary AS
SELECT 
    event_type,
    COUNT(*) as total_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_events 
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY event_type
ORDER BY total_count DESC;

-- Vue : Utilisateurs les plus actifs
CREATE OR REPLACE VIEW analytics_top_users AS
SELECT 
    ae.user_id,
    p.username,
    COUNT(*) as event_count,
    COUNT(DISTINCT DATE(ae.created_at)) as active_days,
    MAX(ae.created_at) as last_activity
FROM analytics_events ae
LEFT JOIN profiles p ON ae.user_id = p.id
WHERE ae.created_at > NOW() - INTERVAL '30 days'
GROUP BY ae.user_id, p.username
ORDER BY event_count DESC
LIMIT 50;

-- Vue : Sessions actives (dernière heure)
CREATE OR REPLACE VIEW analytics_active_sessions AS
SELECT 
    session_id,
    user_id,
    MIN(created_at) as session_start,
    MAX(created_at) as last_activity,
    COUNT(*) as event_count,
    array_agg(DISTINCT event_type) as event_types
FROM analytics_events 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY session_id, user_id
ORDER BY last_activity DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 FONCTIONS UTILES
-- ═══════════════════════════════════════════════════════════════════════════

-- Fonction : Statistiques globales
CREATE OR REPLACE FUNCTION get_analytics_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM profiles),
        'active_users_today', (
            SELECT COUNT(DISTINCT user_id) 
            FROM analytics_events 
            WHERE created_at > CURRENT_DATE
        ),
        'active_users_week', (
            SELECT COUNT(DISTINCT user_id) 
            FROM analytics_events 
            WHERE created_at > NOW() - INTERVAL '7 days'
        ),
        'total_logins_today', (
            SELECT COUNT(*) 
            FROM analytics_events 
            WHERE event_type = 'login' AND created_at > CURRENT_DATE
        ),
        'total_searches_today', (
            SELECT COUNT(*) 
            FROM analytics_events 
            WHERE event_type = 'search' AND created_at > CURRENT_DATE
        ),
        'total_shares_today', (
            SELECT COUNT(*) 
            FROM analytics_events 
            WHERE event_type = 'share' AND created_at > CURRENT_DATE
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner accès à la fonction aux utilisateurs authentifiés (pour le dashboard admin)
GRANT EXECUTE ON FUNCTION get_analytics_stats() TO authenticated;
