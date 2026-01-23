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
CREATE TABLE extraits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    texte TEXT NOT NULL,
    source_title TEXT NOT NULL,
    source_author TEXT NOT NULL,
    source_url TEXT,
    commentary TEXT,
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
-- �🔧 Trigger pour créer automatiquement un profil à l'inscription
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
