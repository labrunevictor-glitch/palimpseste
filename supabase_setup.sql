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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- RLS pour messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les messages qu'ils ont envoyés ou reçus
CREATE POLICY "Les utilisateurs voient leurs messages"
    ON messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Les utilisateurs peuvent envoyer des messages
CREATE POLICY "Les utilisateurs peuvent envoyer des messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Les utilisateurs peuvent marquer comme lu leurs messages reçus
CREATE POLICY "Les utilisateurs peuvent marquer leurs messages comme lus"
    ON messages FOR UPDATE
    USING (auth.uid() = receiver_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- � Table des commentaires sur les extraits
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    extrait_id UUID REFERENCES extraits(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_comments_extrait ON comments(extrait_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);

-- RLS pour comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

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
