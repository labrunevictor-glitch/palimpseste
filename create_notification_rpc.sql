-- ═══════════════════════════════════════════════════════════════════════════
-- 🔧 SOLUTION: Fonction RPC pour créer des notifications
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Cette fonction permet de créer des notifications de manière sécurisée
-- en vérifiant que l'appelant est authentifié.
-- Elle bypasse RLS car elle s'exécute avec les privilèges de la fonction.
--
-- Exécutez ce script dans Supabase SQL Editor.
--
-- ═══════════════════════════════════════════════════════════════════════════

-- Créer la fonction RPC
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_extrait_id UUID DEFAULT NULL,
    p_content TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- S'exécute avec les privilèges du créateur (bypasse RLS)
SET search_path = public
AS $$
DECLARE
    v_notification_id UUID;
    v_from_user_id UUID;
BEGIN
    -- Vérifier que l'appelant est authentifié
    v_from_user_id := auth.uid();
    IF v_from_user_id IS NULL THEN
        RAISE EXCEPTION 'Non authentifié';
    END IF;
    
    -- Ne pas créer de notification pour soi-même
    IF p_user_id = v_from_user_id THEN
        RETURN NULL;
    END IF;
    
    -- Insérer la notification
    INSERT INTO notifications (user_id, from_user_id, type, extrait_id, content, created_at)
    VALUES (p_user_id, v_from_user_id, p_type, p_extrait_id, p_content, NOW())
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- Donner les droits d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, UUID, TEXT) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📝 UTILISATION côté JS:
-- await supabaseClient.rpc('create_notification', {
--     p_user_id: userId,
--     p_type: 'like',
--     p_extrait_id: extraitId,
--     p_content: null
-- });
-- ═══════════════════════════════════════════════════════════════════════════
