-- ═══════════════════════════════════════════════════════════════════════════
-- 🔧 FIX: Notifications RLS Policy
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Ce script configure les politiques RLS STRICTES pour la table notifications.
-- Exécutez ce script dans Supabase SQL Editor.
--
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Les utilisateurs voient leurs notifications" ON notifications;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des notifications" ON notifications;
DROP POLICY IF EXISTS "Les utilisateurs peuvent marquer leurs notifications comme lues" ON notifications;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_any" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;

-- 2. Activer RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Politique SELECT : voir ses propres notifications
CREATE POLICY "notifications_select_own"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- 4. Politique INSERT : STRICTE - auth.uid() doit correspondre à from_user_id
-- Cela garantit que seul l'utilisateur authentifié peut créer des notifications en son nom
CREATE POLICY "notifications_insert_authenticated"
    ON notifications FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND auth.uid() = from_user_id
    );

-- 5. Politique UPDATE : marquer ses propres notifications comme lues
CREATE POLICY "notifications_update_own"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Politique DELETE : supprimer ses propres notifications
CREATE POLICY "notifications_delete_own"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- 7. Vérifier les politiques créées
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'notifications';

-- ═══════════════════════════════════════════════════════════════════════════
-- 📝 IMPORTANT: Les notifications fonctionnent maintenant avec RLS strict.
-- Le client JS doit avoir une session active (auth.uid() != NULL).
-- Le code a été mis à jour pour refresh la session avant insert.
-- ═══════════════════════════════════════════════════════════════════════════
