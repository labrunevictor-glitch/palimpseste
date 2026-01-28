-- ═══════════════════════════════════════════════════════════════════════════
-- 🐦 PALIMPSESTE - Configuration Supabase
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Instructions:
-- 1. Créez un projet sur https://supabase.com
-- 2. Allez dans "SQL Editor" dans le menu de gauche
-- 3. Copiez-collez ce script et exécutez-le
-- 4. Récupérez votre URL et clé anon dans Project Settings > API
-- 5. Remplacez les valeurs dans index.html:
--    const SUPABASE_URL = 'https://xxxxx.supabase.co';
--    const SUPABASE_ANON_KEY = 'eyJhbGci...';
--
-- ═══════════════════════════════════════════════════════════════════════════

-- Table des profils utilisateurs
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table privée de résolution pseudo -> email (utilisée côté serveur uniquement)
-- NOTE: RLS activé sans policy => inaccessible côté client (sauf service role)
CREATE TABLE IF NOT EXISTS auth_lookup (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username_lower TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE auth_lookup ENABLE ROW LEVEL SECURITY;

-- Table des extraits partagés
-- NOTE: texte contient maintenant un APERÇU (~150 chars), pas le texte complet
-- Le texte complet est chargé à la volée depuis source_url (Wikisource)
CREATE TABLE extraits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    texte TEXT NOT NULL, -- Aperçu seulement (~150 chars)
    source_title TEXT NOT NULL,
    source_author TEXT NOT NULL,
    source_url TEXT, -- URL Wikisource pour charger le texte complet
    commentary TEXT,
    text_hash TEXT, -- Hash pour identifier le passage exact (optionnel)
    text_length INTEGER, -- Longueur du texte original (optionnel)
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sécuriser l'ajout des colonnes si la table existe déjà sans ces champs
ALTER TABLE extraits ADD COLUMN IF NOT EXISTS text_hash TEXT;
ALTER TABLE extraits ADD COLUMN IF NOT EXISTS text_length INTEGER;

-- Table des likes
CREATE TABLE likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    extrait_id UUID REFERENCES extraits(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, extrait_id)
);

-- Index pour les performances
CREATE INDEX idx_extraits_user_id ON extraits(user_id);
CREATE INDEX idx_extraits_created_at ON extraits(created_at DESC);
CREATE INDEX idx_extraits_likes_count ON extraits(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_extraits_text_hash ON extraits(text_hash);
CREATE INDEX IF NOT EXISTS idx_extraits_user_text_hash ON extraits(user_id, text_hash);
CREATE INDEX IF NOT EXISTS idx_extraits_source_hash ON extraits(source_url, text_hash);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_extrait_id ON likes(extrait_id);

-- Fonction pour incrémenter les likes
CREATE OR REPLACE FUNCTION increment_likes(extrait_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE extraits 
    SET likes_count = likes_count + 1 
    WHERE id = extrait_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour décrémenter les likes
CREATE OR REPLACE FUNCTION decrement_likes(extrait_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE extraits 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = extrait_id;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔐 Row Level Security (RLS) - Sécurité
-- ═══════════════════════════════════════════════════════════════════════════

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraits ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Les profils sont visibles par tous"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent créer leur profil"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policies pour extraits
CREATE POLICY "Les extraits sont visibles par tous"
    ON extraits FOR SELECT
    USING (true);

CREATE POLICY "Les utilisateurs connectés peuvent créer des extraits"
    ON extraits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres extraits"
    ON extraits FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres extraits"
    ON extraits FOR UPDATE
    USING (auth.uid() = user_id);

-- Policies pour likes
CREATE POLICY "Les likes sont visibles par tous"
    ON likes FOR SELECT
    USING (true);

CREATE POLICY "Les utilisateurs connectés peuvent liker"
    ON likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent retirer leurs likes"
    ON likes FOR DELETE
    USING (auth.uid() = user_id);

-- Activer Realtime sur likes pour le feed d'activité en temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE likes;

-- ═══════════════════════════════════════════════════════════════════════════
-- � Table des follows (système d'amis)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Index pour les performances
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- RLS pour follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les follows sont visibles par tous"
    ON follows FOR SELECT
    USING (true);

CREATE POLICY "Les utilisateurs peuvent suivre"
    ON follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Les utilisateurs peuvent unfollow"
    ON follows FOR DELETE
    USING (auth.uid() = follower_id);

-- Ajouter compteurs followers/following dans profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fonction pour incrémenter followers
CREATE OR REPLACE FUNCTION increment_followers(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour décrémenter followers
CREATE OR REPLACE FUNCTION decrement_followers(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour incrémenter following
CREATE OR REPLACE FUNCTION increment_following(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles SET following_count = following_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour décrémenter following
CREATE OR REPLACE FUNCTION decrement_following(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- 💬 Table des messages privés
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Réactions (likes/emojis) sur les messages
CREATE TABLE IF NOT EXISTS message_reactions (
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions(user_id);

-- Index pour les performances
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- RLS pour messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les messages qu'ils ont envoyés ou reçus
CREATE POLICY "Les utilisateurs voient leurs messages"
    ON messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Les utilisateurs peuvent envoyer des messages
CREATE POLICY "Les utilisateurs peuvent envoyer des messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- NOTE: pas de policy UPDATE directe sur messages.
-- Les mises à jour (read_at / édition) se font via RPC SECURITY DEFINER.

DROP POLICY IF EXISTS "Les utilisateurs peuvent marquer leurs messages comme lus" ON messages;

-- Policies pour les réactions
CREATE POLICY "Les utilisateurs voient les réactions de leurs conversations"
    ON message_reactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = message_id
              AND (auth.uid() = m.sender_id OR auth.uid() = m.receiver_id)
        )
    );

CREATE POLICY "Les utilisateurs peuvent réagir dans leurs conversations"
    ON message_reactions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = message_id
              AND (auth.uid() = m.sender_id OR auth.uid() = m.receiver_id)
        )
    );

CREATE POLICY "Les utilisateurs peuvent modifier leurs réactions"
    ON message_reactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs réactions"
    ON message_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- � Table des commentaires sur les extraits
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    extrait_id UUID REFERENCES extraits(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Réactions (emojis) sur les commentaires
CREATE TABLE IF NOT EXISTS comment_reactions (
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user ON comment_reactions(user_id);

-- Index pour les performances
CREATE INDEX idx_comments_extrait ON comments(extrait_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);

-- RLS pour comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- Les commentaires sont visibles par tous
CREATE POLICY "Les commentaires sont visibles par tous"
    ON comments FOR SELECT
    USING (true);

-- Les utilisateurs connectés peuvent commenter
CREATE POLICY "Les utilisateurs peuvent commenter"
    ON comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres commentaires
CREATE POLICY "Les utilisateurs peuvent supprimer leurs commentaires"
    ON comments FOR DELETE
    USING (auth.uid() = user_id);

-- NOTE: pas de policy UPDATE directe sur comments.
-- L'édition se fait via RPC SECURITY DEFINER.

-- Policies pour les réactions de commentaires
CREATE POLICY "Les réactions de commentaires sont visibles par tous"
    ON comment_reactions FOR SELECT
    USING (true);

CREATE POLICY "Les utilisateurs peuvent réagir aux commentaires"
    ON comment_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs réactions de commentaires"
    ON comment_reactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs réactions de commentaires"
    ON comment_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔧 RPC (SECURITY DEFINER) - Lecture / Édition
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION mark_messages_read(p_from_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE messages
    SET read_at = NOW()
    WHERE sender_id = p_from_user_id
      AND receiver_id = auth.uid()
      AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION mark_messages_read(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mark_messages_read(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION edit_message(p_message_id UUID, p_content TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE messages
    SET content = p_content,
        edited_at = NOW()
    WHERE id = p_message_id
      AND sender_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION edit_message(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION edit_message(UUID, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION edit_comment(p_comment_id UUID, p_content TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE comments
    SET content = p_content,
        edited_at = NOW()
    WHERE id = p_comment_id
      AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION edit_comment(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION edit_comment(UUID, TEXT) TO anon, authenticated;

-- Ajouter compteur de commentaires dans extraits
ALTER TABLE extraits ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Fonction pour incrémenter le compteur de commentaires
CREATE OR REPLACE FUNCTION increment_comments(p_extrait_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE extraits SET comments_count = comments_count + 1 WHERE id = p_extrait_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour décrémenter le compteur de commentaires
CREATE OR REPLACE FUNCTION decrement_comments(p_extrait_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE extraits SET comments_count = GREATEST(0, comments_count - 1) WHERE id = p_extrait_id;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔔 Table des notifications
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'like', 'comment', 'follow'
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    extrait_id UUID REFERENCES extraits(id) ON DELETE CASCADE,
    content TEXT,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- RLS pour notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs ne voient que leurs propres notifications
CREATE POLICY "Les utilisateurs voient leurs notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Les utilisateurs connectés peuvent créer des notifications pour d'autres
CREATE POLICY "Les utilisateurs peuvent créer des notifications"
    ON notifications FOR INSERT
    WITH CHECK (auth.uid() = from_user_id);

-- Les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Les utilisateurs peuvent marquer leurs notifications comme lues"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs notifications
CREATE POLICY "Les utilisateurs peuvent supprimer leurs notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Activer Realtime sur notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔧 Trigger pour créer automatiquement un profil à l'inscription
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
    );

    INSERT INTO auth_lookup (user_id, username_lower, email)
    VALUES (
        NEW.id,
        lower(COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))),
        NEW.email
    )
    ON CONFLICT (user_id) DO UPDATE
        SET username_lower = EXCLUDED.username_lower,
            email = EXCLUDED.email;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Sync username_lower si l'utilisateur change son username dans profiles
CREATE OR REPLACE FUNCTION sync_auth_lookup_username()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.username IS DISTINCT FROM OLD.username THEN
        UPDATE auth_lookup
        SET username_lower = lower(NEW.username)
        WHERE user_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profiles_username_updated ON profiles;
CREATE TRIGGER on_profiles_username_updated
    AFTER UPDATE OF username ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_auth_lookup_username();

-- Backfill auth_lookup pour les utilisateurs existants (si script exécuté après coup)
INSERT INTO auth_lookup (user_id, username_lower, email)
SELECT
    u.id,
    lower(COALESCE(p.username, split_part(u.email, '@', 1))),
    u.email
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
ON CONFLICT (user_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 💜 Table des likes sur les commentaires
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

-- RLS pour comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les likes de commentaires sont visibles par tous"
    ON comment_likes FOR SELECT
    USING (true);

CREATE POLICY "Les utilisateurs connectés peuvent liker des commentaires"
    ON comment_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent retirer leurs likes de commentaires"
    ON comment_likes FOR DELETE
    USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 📚 Table des likes sur les sources Wikisource (synchronisés entre appareils)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS source_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    source_url TEXT NOT NULL,
    title TEXT,
    author TEXT,
    preview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, source_url)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_source_likes_user ON source_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_source_likes_created ON source_likes(created_at DESC);

-- RLS pour source_likes
ALTER TABLE source_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs voient leurs propres likes de sources"
    ON source_likes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent liker des sources"
    ON source_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent retirer leurs likes de sources"
    ON source_likes FOR DELETE
    USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔖 Table des Collections (listes personnalisées de favoris)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    emoji TEXT DEFAULT '📚',
    color TEXT DEFAULT '#5a7a8a',
    is_public BOOLEAN DEFAULT false,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_position ON collections(user_id, position);
CREATE INDEX IF NOT EXISTS idx_collections_public ON collections(is_public) WHERE is_public = true;

-- RLS pour collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs voient leurs propres collections + les collections publiques
CREATE POLICY "Les utilisateurs voient leurs collections et les publiques"
    ON collections FOR SELECT
    USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Les utilisateurs peuvent créer des collections"
    ON collections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs collections"
    ON collections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs collections"
    ON collections FOR DELETE
    USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔗 Table de liaison Collection <-> Source/Extrait
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS collection_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    -- Un item peut être un extrait partagé OU un like de source locale
    extrait_id UUID REFERENCES extraits(id) ON DELETE CASCADE,
    source_like_id UUID REFERENCES source_likes(id) ON DELETE CASCADE,
    -- Ou directement une référence locale (titre/auteur/url) si pas de source_like
    local_title TEXT,
    local_author TEXT,
    local_url TEXT,
    local_preview TEXT,
    note TEXT, -- Note personnelle sur cet item
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Un item par collection (soit extrait, soit source_like, soit local)
    CONSTRAINT unique_extrait_in_collection UNIQUE(collection_id, extrait_id),
    CONSTRAINT unique_source_in_collection UNIQUE(collection_id, source_like_id),
    CONSTRAINT unique_local_in_collection UNIQUE(collection_id, local_url)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_user ON collection_items(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_position ON collection_items(collection_id, position);

-- RLS pour collection_items
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs voient les items de leurs collections et des collections publiques
CREATE POLICY "Les utilisateurs voient les items de leurs collections"
    ON collection_items FOR SELECT
    USING (
        auth.uid() = user_id 
        OR collection_id IN (SELECT id FROM collections WHERE is_public = true)
    );

CREATE POLICY "Les utilisateurs peuvent ajouter des items à leurs collections"
    ON collection_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs items"
    ON collection_items FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs items"
    ON collection_items FOR DELETE
    USING (auth.uid() = user_id);

-- Ajouter compteur d'items dans collections
ALTER TABLE collections ADD COLUMN IF NOT EXISTS items_count INTEGER DEFAULT 0;

-- Fonction pour incrémenter le compteur d'items
CREATE OR REPLACE FUNCTION increment_collection_items(p_collection_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE collections SET items_count = items_count + 1, updated_at = NOW() WHERE id = p_collection_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour décrémenter le compteur d'items
CREATE OR REPLACE FUNCTION decrement_collection_items(p_collection_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE collections SET items_count = GREATEST(0, items_count - 1), updated_at = NOW() WHERE id = p_collection_id;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ Terminé ! 
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- N'oubliez pas d'activer les providers d'authentification dans:
-- Authentication > Providers > Email (activé par défaut)
-- Authentication > Providers > Google (optionnel, nécessite config OAuth)
--
-- Pour tester, activez aussi dans Authentication > Settings:
-- ✓ Enable email confirmations (peut être désactivé pour les tests)
--
