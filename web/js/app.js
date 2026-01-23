// ═══════════════════════════════════════════════════════════
// 🐦 SUPABASE - Configuration Social
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://cqoepdrqifilqxnvflyy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2VwZHJxaWZpbHF4bnZmbHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzQxMTksImV4cCI6MjA4NDc1MDExOX0.e7dJmzUEgzDIix12ca38HvBmF7Cgp_fTZPT6gZ6Xy5s';

// Client Supabase (initialisé si configuré)
let supabaseClient = null;
let currentUser = null;
let socialExtraits = [];
let currentSocialTab = 'recent';

// Vérifie si Supabase est configuré
function isSupabaseConfigured() {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}

// Initialise Supabase si configuré
function initSupabase() {
    if (!isSupabaseConfigured()) {
        // Mode local uniquement
        return false;
    }
    try {
        // Vérifier que le SDK est chargé
        if (typeof window.supabase === 'undefined') {
            // SDK pas encore chargé - retry
            // Réessayer dans 500ms (le SDK est en async)
            setTimeout(initSupabase, 500);
            return false;
        }
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // Supabase prêt
        
        // Écouter les changements d'auth
        supabaseClient.auth.onAuthStateChange((event, session) => {
            // Auth state changed
            if (session?.user) {
                currentUser = session.user;
                onUserLoggedIn();
            } else {
                currentUser = null;
                onUserLoggedOut();
            }
        });
        
        // Vérifier si déjà connecté
        checkSession();
        return true;
    } catch (e) {
        console.error('Erreur init Supabase:', e);
        return false;
    }
}

async function checkSession() {
    if (!supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
        currentUser = session.user;
        onUserLoggedIn();
    }
}

// ═══════════════════════════════════════════════════════════
// 🔐 AUTHENTIFICATION
// ═══════════════════════════════════════════════════════════

function openAuthModal(mode = 'login') {
    document.getElementById('authModal').classList.add('open');
    switchAuthForm(mode);
    closeUserDropdown();
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('open');
    // Reset errors
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('registerError').classList.remove('show');
}

function switchAuthForm(mode) {
    document.getElementById('loginForm').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = mode === 'register' ? 'block' : 'none';
}

async function loginWithEmail() {
    if (!supabaseClient) {
        showAuthError('login', 'Supabase non configuré. Voir console pour instructions.');
        return;
    }
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showAuthError('login', 'Veuillez remplir tous les champs');
        return;
    }
    
    document.getElementById('loginBtn').disabled = true;
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    document.getElementById('loginBtn').disabled = false;
    
    if (error) {
        showAuthError('login', error.message);
    } else {
        closeAuthModal();
        toast('✅ Connexion réussie !');
    }
}

async function registerWithEmail() {
    if (!supabaseClient) {
        showAuthError('register', 'Supabase non configuré. Voir console pour instructions.');
        return;
    }
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!username || !email || !password) {
        showAuthError('register', 'Veuillez remplir tous les champs');
        return;
    }
    
    if (password.length < 6) {
        showAuthError('register', 'Le mot de passe doit faire au moins 6 caractères');
        return;
    }
    
    document.getElementById('registerBtn').disabled = true;
    
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: { username }
        }
    });
    
    document.getElementById('registerBtn').disabled = false;
    
    if (error) {
        showAuthError('register', error.message);
    } else {
        // Créer le profil utilisateur
        await createUserProfile(data.user.id, username);
        closeAuthModal();
        toast('🎉 Compte créé ! Vérifiez votre email.');
    }
}

async function loginWithGoogle() {
    if (!supabaseClient) {
        toast('⚠️ Supabase non configuré');
        return;
    }
    
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });
    
    if (error) {
        toast('❌ Erreur: ' + error.message);
    }
}

async function logoutUser() {
    if (!supabaseClient) return;
    
    await supabaseClient.auth.signOut();
    closeUserDropdown();
    toast('👋 Déconnecté');
}

function showAuthError(form, message) {
    const el = document.getElementById(form + 'Error');
    el.textContent = message;
    el.classList.add('show');
}

async function createUserProfile(userId, username) {
    if (!supabaseClient) return;
    
    try {
        // Utiliser upsert pour créer ou mettre à jour le profil
        const { error } = await supabaseClient.from('profiles').upsert({
            id: userId,
            username: username,
            created_at: new Date().toISOString()
        }, { onConflict: 'id' });
        
        if (error) {
            console.error('Erreur création profil:', error);
        }
    } catch (e) {
        console.error('Exception création profil:', e);
    }
}

// S'assurer que le profil existe (appelé à chaque connexion)
async function ensureProfileExists() {
    if (!supabaseClient || !currentUser) return;
    
    // Vérifier si le profil existe
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('id, username')
        .eq('id', currentUser.id)
        .maybeSingle();
    
    if (!profile) {
        // Profil n'existe pas, le créer
        const username = currentUser.user_metadata?.username || 
                         currentUser.email?.split('@')[0] || 
                         'Utilisateur';
        await createUserProfile(currentUser.id, username);
    } else if (!profile.username && currentUser.user_metadata?.username) {
        // Profil existe mais sans username, le mettre à jour
        await supabaseClient
            .from('profiles')
            .update({ username: currentUser.user_metadata.username })
            .eq('id', currentUser.id);
    }
}

// Callbacks auth
async function onUserLoggedIn() {
    // S'assurer que le profil existe dans la table profiles
    await ensureProfileExists();
    
    const username = currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'Utilisateur';
    const initial = username.charAt(0).toUpperCase();
    
    // Update header
    document.getElementById('headerAvatar').innerHTML = initial;
    document.getElementById('loginMenuItem').style.display = 'none';
    document.getElementById('registerMenuItem').style.display = 'none';
    document.getElementById('profileMenuItem').style.display = 'block';
    document.getElementById('logoutDivider').style.display = 'block';
    document.getElementById('logoutMenuItem').style.display = 'block';
    
    // Update sidebar
    document.getElementById('profileLoggedOut').style.display = 'none';
    document.getElementById('profileLoggedIn').style.display = 'block';
    document.getElementById('sidebarAvatar').innerHTML = initial;
    document.getElementById('sidebarUsername').textContent = username;
    
    // Load user stats
    loadUserStats();
    
    // Mettre à jour le badge de messages non lus
    updateUnreadBadge();
    
    // Mettre à jour le badge de notifications et s'abonner
    updateNotifBadge();
    subscribeToNotifications();
}

function onUserLoggedOut() {
    document.getElementById('headerAvatar').innerHTML = '👤';
    document.getElementById('loginMenuItem').style.display = 'block';
    document.getElementById('registerMenuItem').style.display = 'block';
    document.getElementById('profileMenuItem').style.display = 'none';
    document.getElementById('logoutDivider').style.display = 'none';
    document.getElementById('logoutMenuItem').style.display = 'none';
    
    document.getElementById('profileLoggedOut').style.display = 'block';
    document.getElementById('profileLoggedIn').style.display = 'none';
}

function toggleUserDropdown() {
    document.getElementById('userDropdown').classList.toggle('open');
}

function closeUserDropdown() {
    document.getElementById('userDropdown').classList.remove('open');
}

// Fermer dropdown si clic ailleurs
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        closeUserDropdown();
    }
});

// ═══════════════════════════════════════════════════════════
// 🔥 TENDANCES - Feed doom scrolling des textes populaires
// ═══════════════════════════════════════════════════════════

function openTrendingFeed() {
    document.getElementById('trendingOverlay').classList.add('open');
    loadTrendingFeed();
}

function closeTrendingFeed() {
    document.getElementById('trendingOverlay').classList.remove('open');
}

async function loadTrendingFeed() {
    const container = document.getElementById('trendingFeed');
    container.innerHTML = '<div class="trending-loading">🔥 Chargement des tendances...</div>';
    
    if (!supabaseClient) {
        container.innerHTML = '<div class="trending-empty"><div class="trending-empty-icon">🔌</div><p>Connexion requise pour voir les tendances</p></div>';
        return;
    }
    
    try {
        // Charger les extraits les plus likés et commentés récemment
        const { data: extraits, error } = await supabaseClient
            .from('extraits')
            .select(`
                *,
                profiles:user_id (username, avatar_url)
            `)
            .order('likes_count', { ascending: false })
            .order('comments_count', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(30);
        
        if (error) throw error;
        
        if (!extraits || extraits.length === 0) {
            container.innerHTML = `
                <div class="trending-empty">
                    <div class="trending-empty-icon">📭</div>
                    <p>Aucun texte populaire pour le moment</p>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem;">Soyez le premier à partager un extrait !</p>
                </div>
            `;
            return;
        }
        
        // Vérifier les likes de l'utilisateur actuel
        const userId = currentUser?.id;
        let userLikes = new Set();
        if (userId) {
            const { data: likes } = await supabaseClient
                .from('likes')
                .select('extrait_id')
                .eq('user_id', userId);
            userLikes = new Set((likes || []).map(l => l.extrait_id));
        }
        
        container.innerHTML = extraits.map((extrait, index) => {
            const username = extrait.profiles?.username || 'Anonyme';
            const avatar = extrait.profiles?.avatar_url || username[0].toUpperCase();
            const isLiked = userLikes.has(extrait.id);
            const likesCount = extrait.likes_count || 0;
            const commentsCount = extrait.comments_count || 0;
            const isHot = likesCount >= 5 || commentsCount >= 3;
            const timeAgo = formatTimeAgo(new Date(extrait.created_at));
            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            
            return `
                <div class="trending-card" data-extrait-id="${extrait.id}">
                    <div class="trending-card-header">
                        <div class="trending-card-author" onclick="openUserProfile('${extrait.user_id}')">
                            <div class="trending-avatar">${avatar.startsWith('http') ? `<img src="${avatar}" style="width:100%;height:100%;border-radius:50%;">` : avatar}</div>
                            <div>
                                <div class="trending-username">${escapeHtml(username)}</div>
                                <div class="trending-time">${timeAgo}</div>
                            </div>
                        </div>
                        <div class="trending-rank">${rankEmoji}</div>
                    </div>
                    <div class="trending-card-body">
                        <div class="trending-text">${escapeHtml(extrait.texte)}</div>
                        ${extrait.source_author || extrait.source_title ? `
                            <div class="trending-source">
                                <strong>${escapeHtml(extrait.source_author || '')}</strong>
                                ${extrait.source_title ? ` — ${escapeHtml(extrait.source_title)}` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <div class="trending-card-footer">
                        <div class="trending-stats">
                            <div class="trending-stat ${isHot ? 'hot' : ''}">
                                <span>${isHot ? '🔥' : '❤️'}</span>
                                <span>${likesCount}</span>
                            </div>
                            <div class="trending-stat">
                                <span>💬</span>
                                <span>${commentsCount}</span>
                            </div>
                        </div>
                        <div class="trending-actions">
                            <button class="trending-action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLikeTrending('${extrait.id}', this)">
                                ${isLiked ? '❤️' : '🤍'} Like
                            </button>
                            <button class="trending-action-btn" onclick="viewTrendingComments('${extrait.id}')">
                                💬 Commenter
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (err) {
        console.error('Erreur chargement tendances:', err);
        container.innerHTML = '<div class="trending-empty"><div class="trending-empty-icon">⚠️</div><p>Erreur de chargement</p></div>';
    }
}

async function toggleLikeTrending(extraitId, btn) {
    if (!currentUser) {
        toast('🔐 Connectez-vous pour liker');
        return;
    }
    
    const isLiked = btn.classList.contains('liked');
    
    try {
        if (isLiked) {
            await supabaseClient
                .from('likes')
                .delete()
                .eq('extrait_id', extraitId)
                .eq('user_id', currentUser.id);
            btn.classList.remove('liked');
            btn.innerHTML = '🤍 Like';
        } else {
            await supabaseClient
                .from('likes')
                .insert({ extrait_id: extraitId, user_id: currentUser.id });
            btn.classList.add('liked');
            btn.innerHTML = '❤️ Like';
            toast('❤️ Aimé !');
        }
        
        // Update count
        const card = btn.closest('.trending-card');
        const statEl = card.querySelector('.trending-stat');
        const countEl = statEl.querySelector('span:last-child');
        const currentCount = parseInt(countEl.textContent) || 0;
        countEl.textContent = isLiked ? currentCount - 1 : currentCount + 1;
        
    } catch (err) {
        console.error('Erreur like trending:', err);
        toast('❌ Erreur');
    }
}

function viewTrendingComments(extraitId) {
    // Fermer le trending et ouvrir le social feed sur cet extrait
    closeTrendingFeed();
    openSocialFeed();
    // Scroll to the extrait after a short delay
    setTimeout(() => {
        const card = document.querySelector(`[data-extrait-id="${extraitId}"]`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            toggleComments(extraitId);
        }
    }, 500);
}

// ═══════════════════════════════════════════════════════════
// 📤 PARTAGE D'EXTRAITS
// ═══════════════════════════════════════════════════════════

let pendingShare = null;

function openShareModal(text, author, title, sourceUrl) {
    if (!currentUser) {
        openAuthModal('login');
        toast('📝 Connectez-vous pour partager');
        return;
    }
    
    pendingShare = { text, author, title, sourceUrl };
    
    document.getElementById('sharePreviewText').textContent = text.length > 300 
        ? text.substring(0, 300) + '...' 
        : text;
    document.getElementById('sharePreviewSource').textContent = `— ${author}, ${title}`;
    document.getElementById('shareCommentary').value = '';
    document.getElementById('shareModal').classList.add('open');
}

function closeShareModal() {
    document.getElementById('shareModal').classList.remove('open');
    pendingShare = null;
}

async function publishExtrait() {
    if (!supabaseClient || !currentUser || !pendingShare) {
        toast('⚠️ Impossible de publier');
        return;
    }
    
    document.getElementById('publishBtn').disabled = true;
    
    const commentary = document.getElementById('shareCommentary').value.trim();
    
    const { data, error } = await supabaseClient.from('extraits').insert({
        user_id: currentUser.id,
        texte: pendingShare.text.substring(0, 1000), // Limite 1000 chars
        source_title: pendingShare.title,
        source_author: pendingShare.author,
        source_url: pendingShare.sourceUrl || '',
        commentary: commentary || null,
        likes_count: 0,
        created_at: new Date().toISOString()
    });
    
    document.getElementById('publishBtn').disabled = false;
    
    if (error) {
        toast('❌ Erreur: ' + error.message);
    } else {
        closeShareModal();
        toast('🐦 Extrait publié !');
        loadUserStats();
    }
}

// Fonction pour ajouter un bouton de partage sur la sélection
function setupTextSelection(cardElement, author, title, sourceUrl) {
    const textElement = cardElement.querySelector('.card-body');
    if (!textElement) return;
    
    textElement.classList.add('text-selectable');
    
    textElement.addEventListener('mouseup', () => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText.length >= 20 && selectedText.length <= 1000) {
            // Montrer un tooltip ou bouton flottant
            showShareTooltip(selectedText, author, title, sourceUrl);
        }
    });
}

let shareTooltip = null;

function showShareTooltip(text, author, title, sourceUrl) {
    hideShareTooltip();
    
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    shareTooltip = document.createElement('div');
    shareTooltip.className = 'share-tooltip';
    shareTooltip.innerHTML = `<button onclick="openShareModal('${text.replace(/'/g, "\\'")}', '${author}', '${title}', '${sourceUrl}')">🐦 Partager</button>`;
    shareTooltip.style.cssText = `
        position: fixed;
        top: ${rect.top - 40}px;
        left: ${rect.left + rect.width/2 - 50}px;
        background: var(--accent-tertiary);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        z-index: 1000;
        cursor: pointer;
        font-size: 0.85rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(shareTooltip);
    
    // Auto-hide après 5s
    setTimeout(hideShareTooltip, 5000);
}

function hideShareTooltip() {
    if (shareTooltip) {
        shareTooltip.remove();
        shareTooltip = null;
    }
}

document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.share-tooltip')) {
        hideShareTooltip();
    }
});

// ═══════════════════════════════════════════════════════════
// 📱 FEED SOCIAL
// ═══════════════════════════════════════════════════════════

let feedSubscription = null;
let likesSubscription = null;
let lastFeedUpdate = null;

function openSocialFeed() {
    document.getElementById('socialOverlay').classList.add('open');
    loadSocialFeed();
    setupRealtimeSubscriptions();
}

function closeSocialFeed() {
    document.getElementById('socialOverlay').classList.remove('open');
    // Cleanup subscriptions when closing
    if (feedSubscription) {
        supabaseClient.removeChannel(feedSubscription);
        feedSubscription = null;
    }
    if (likesSubscription) {
        supabaseClient.removeChannel(likesSubscription);
        likesSubscription = null;
    }
}

// Setup realtime subscriptions
function setupRealtimeSubscriptions() {
    if (!supabaseClient || feedSubscription) return;
    
    // Subscribe to new extraits
    feedSubscription = supabaseClient
        .channel('extraits-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'extraits' },
            (payload) => {
                // Nouveau contenu détecté
                showNewContentIndicator();
            }
        )
        .subscribe();
    
    // Subscribe to likes changes
    likesSubscription = supabaseClient
        .channel('likes-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'likes' },
            (payload) => {
                // Like détecté
                showNewContentIndicator();
            }
        )
        .subscribe();
    
    // Realtime activé
}

function showNewContentIndicator() {
    const indicator = document.getElementById('liveIndicator');
    indicator.textContent = '🔔 Nouveau contenu disponible - Cliquez pour actualiser';
    indicator.classList.add('new-content');
    indicator.onclick = () => refreshFeed();
}

async function refreshFeed() {
    const btn = document.getElementById('refreshBtn');
    const indicator = document.getElementById('liveIndicator');
    
    btn.classList.add('spinning');
    indicator.textContent = '🟢 En direct';
    indicator.classList.remove('new-content');
    indicator.onclick = null;
    
    await loadSocialFeed();
    
    setTimeout(() => btn.classList.remove('spinning'), 500);
    toast('🔄 Feed actualisé !');
}

function switchSocialTab(tab) {
    currentSocialTab = tab;
    document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
    loadSocialFeed();
}

async function loadSocialFeed() {
    const container = document.getElementById('socialFeed');
    
    if (!isSupabaseConfigured()) {
        container.innerHTML = `
            <div class="social-empty">
                <div class="social-empty-icon">⚙️</div>
                <div class="social-empty-title">Configuration requise</div>
                <div class="social-empty-text">
                    Pour activer le feed social, configurez Supabase:<br><br>
                    1. Créez un compte sur <a href="https://supabase.com" target="_blank" style="color:var(--accent)">supabase.com</a><br>
                    2. Créez un nouveau projet<br>
                    3. Copiez l'URL et la clé anon<br>
                    4. Remplacez les valeurs dans le code<br><br>
                    <code style="background:var(--bg);padding:0.5rem;border-radius:4px;display:block;margin-top:1rem;font-size:0.75rem;">
                    const SUPABASE_URL = 'votre_url';<br>
                    const SUPABASE_ANON_KEY = 'votre_clé';
                    </code>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div class="feed-loading"><div class="spinner"></div><span>Chargement...</span></div>';
    
    let query = supabaseClient
        .from('extraits')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (currentSocialTab === 'activity') {
        // Afficher l'activité récente (likes)
        await loadActivityFeed();
        return;
    } else if (currentSocialTab === 'mine' && currentUser) {
        query = supabaseClient
            .from('extraits')
            .select('*, profiles(username)')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
    } else if (currentSocialTab === 'friends' && currentUser) {
        // Charger les extraits des amis
        await loadUserFollowing();
        
        if (userFollowing.size === 0) {
            container.innerHTML = `
                <div class="social-empty">
                    <div class="social-empty-icon">👥</div>
                    <div class="social-empty-title">Aucun ami suivi</div>
                    <div class="social-empty-text">
                        Vous ne suivez personne pour l'instant.<br>
                        Allez dans l'onglet "🔎 Découvrir" pour trouver des utilisateurs !
                    </div>
                </div>
            `;
            return;
        }
        
        query = supabaseClient
            .from('extraits')
            .select('*, profiles(username)')
            .in('user_id', Array.from(userFollowing))
            .order('created_at', { ascending: false })
            .limit(50);
    } else if (currentSocialTab === 'discover') {
        // Afficher tous les utilisateurs actifs
        await loadUserFollowing();
        await loadDiscoverUsers();
        return;
    } else if (currentSocialTab === 'followers') {
        // Afficher mes abonnés (qui me suivent)
        await loadMyFollowers();
        return;
    }
    
    const { data, error } = await query;
    
    if (error) {
        container.innerHTML = `<div class="social-empty">❌ Erreur: ${error.message}</div>`;
        return;
    }
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="social-empty">
                <div class="social-empty-icon">📭</div>
                <div class="social-empty-title">Aucun extrait</div>
                <div class="social-empty-text">
                    ${currentSocialTab === 'mine' 
                        ? "Vous n'avez pas encore partagé d'extraits. Sélectionnez du texte dans une lecture pour partager !"
                        : "Soyez le premier à partager un extrait !"}
                </div>
            </div>
        `;
        return;
    }
    
    socialExtraits = data;
    renderSocialFeed();
}

async function renderSocialFeed() {
    const container = document.getElementById('socialFeed');
    
    // Charger les likes et follows de l'utilisateur
    let userLikes = new Set();
    let likeCounts = {};
    
    if (supabaseClient) {
        // Compter les vrais likes pour chaque extrait depuis la table likes
        const extraitIds = socialExtraits.map(e => e.id);
        const { data: allLikes } = await supabaseClient
            .from('likes')
            .select('extrait_id')
            .in('extrait_id', extraitIds);
        
        // Compter les likes par extrait
        if (allLikes) {
            allLikes.forEach(like => {
                likeCounts[like.extrait_id] = (likeCounts[like.extrait_id] || 0) + 1;
            });
        }
        
        if (currentUser) {
            const { data } = await supabaseClient
                .from('likes')
                .select('extrait_id')
                .eq('user_id', currentUser.id);
            userLikes = new Set(data?.map(l => l.extrait_id) || []);
            
            // Charger les follows si pas déjà fait
            await loadUserFollowing();
        }
    }
    
    container.innerHTML = socialExtraits.map(extrait => {
        const username = extrait.profiles?.username || 'Anonyme';
        const initial = username.charAt(0).toUpperCase();
        const timeAgo = formatTimeAgo(new Date(extrait.created_at));
        const isLiked = userLikes.has(extrait.id);
        const realLikeCount = likeCounts[extrait.id] || 0;
        
        return `
            <div class="extrait-card" data-id="${extrait.id}">
                <div class="extrait-header">
                    <div class="extrait-avatar" onclick="openUserProfile('${extrait.user_id}', '${username}')" style="cursor:pointer">${initial}</div>
                    <div class="extrait-user-info" onclick="openUserProfile('${extrait.user_id}', '${username}')" style="cursor:pointer">
                        <div class="extrait-username">${username}</div>
                        <div class="extrait-time">${timeAgo}</div>
                    </div>
                    ${currentUser && extrait.user_id !== currentUser.id ? `
                        <button class="btn-follow-small ${userFollowing.has(extrait.user_id) ? 'following' : ''}" onclick="toggleFollow('${extrait.user_id}', event)">
                            ${userFollowing.has(extrait.user_id) ? '✓ Suivi' : '+ Suivre'}
                        </button>
                    ` : ''}
                </div>
                <div class="extrait-text">${escapeHtml(extrait.texte)}</div>
                <div class="extrait-source">
                    <strong>${escapeHtml(extrait.source_author)}</strong> — ${escapeHtml(extrait.source_title)}
                </div>
                ${extrait.commentary ? `<div class="extrait-commentary">${escapeHtml(extrait.commentary)}</div>` : ''}
                <div class="extrait-actions">
                    <button class="extrait-action ${isLiked ? 'liked' : ''}" onclick="toggleLikeExtrait('${extrait.id}')">
                        <span class="icon">${isLiked ? '❤️' : '🤍'}</span>
                        <span>${realLikeCount}</span>
                    </button>
                    <button class="extrait-action" onclick="copyExtrait('${extrait.id}')">
                        <span class="icon">📋</span>
                        <span>Copier</span>
                    </button>
                </div>
                <div class="comments-section">
                    <button class="comments-toggle" onclick="toggleComments('${extrait.id}')">
                        💬 <span id="commentCount-${extrait.id}">${extrait.comments_count || 0}</span> commentaire${(extrait.comments_count || 0) !== 1 ? 's' : ''}
                    </button>
                    <div class="comments-container" id="comments-${extrait.id}">
                        <div class="comments-list" id="commentsList-${extrait.id}">
                            <div class="comments-empty">Chargement...</div>
                        </div>
                        <div class="comment-input-area">
                            <textarea class="comment-input" id="commentInput-${extrait.id}" placeholder="Écrire un commentaire..." rows="1" onkeypress="if(event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); postComment('${extrait.id}'); }"></textarea>
                            <button class="comment-send" onclick="postComment('${extrait.id}')">➤</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function toggleLikeExtrait(extraitId) {
    if (!currentUser) {
        openAuthModal('login');
        toast('📝 Connectez-vous pour liker');
        return;
    }
    if (!supabaseClient) return;
    
    try {
        const { data: existing } = await supabaseClient
            .from('likes')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('extrait_id', extraitId)
            .single();
        
        if (existing) {
            await supabaseClient.from('likes').delete().eq('id', existing.id);
            toast('💔 Like retiré');
        } else {
            await supabaseClient.from('likes').insert({
                user_id: currentUser.id,
                extrait_id: extraitId,
                created_at: new Date().toISOString()
            });
            toast('❤️ Liké !');
            
            // Notifier l'auteur de l'extrait
            const extrait = socialExtraits.find(e => e.id === extraitId);
            if (extrait && extrait.user_id !== currentUser.id) {
                createNotification(extrait.user_id, 'like', extraitId);
            }
        }
        loadSocialFeed();
    } catch (err) {
        toast('❌ Erreur');
    }
}

function copyExtrait(extraitId) {
    const extrait = socialExtraits.find(e => e.id === extraitId);
    if (!extrait) return;
    
    const text = `"${extrait.texte}"\n— ${extrait.source_author}, ${extrait.source_title}`;
    navigator.clipboard.writeText(text);
    toast('📋 Extrait copié !');
}

// ═══════════════════════════════════════════════════════════
// 💬 COMMENTAIRES
// ═══════════════════════════════════════════════════════════

// Afficher/masquer les commentaires
async function toggleComments(extraitId) {
    const container = document.getElementById(`comments-${extraitId}`);
    const isOpen = container.classList.contains('open');
    
    if (isOpen) {
        container.classList.remove('open');
    } else {
        container.classList.add('open');
        await loadComments(extraitId);
    }
}

// Charger les commentaires d'un extrait
async function loadComments(extraitId) {
    if (!supabaseClient) return;
    
    const container = document.getElementById(`commentsList-${extraitId}`);
    if (!container) return;
    container.innerHTML = '<div class="comments-empty">Chargement...</div>';
    
    try {
        // Récupérer les commentaires
        const { data: comments, error } = await supabaseClient
            .from('comments')
            .select('*')
            .eq('extrait_id', extraitId)
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error('Erreur SQL comments:', error);
            // Vérifier si c'est une erreur de table non existante
            if (error.message?.includes('does not exist') || error.code === '42P01') {
                container.innerHTML = '<div class="comments-empty">⚠️ Table comments non créée.<br><small>Exécutez le SQL dans Supabase.</small></div>';
            } else {
                container.innerHTML = '<div class="comments-empty">Erreur: ' + error.message + '</div>';
            }
            return;
        }
        
        if (!comments || comments.length === 0) {
            container.innerHTML = '<div class="comments-empty">Aucun commentaire. Soyez le premier !</div>';
            return;
        }
        
        // Récupérer les profils des commentateurs
        const userIds = [...new Set(comments.map(c => c.user_id))];
        const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('id, username')
            .in('id', userIds);
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        
        // Récupérer les likes de tous les commentaires
        const commentIds = comments.map(c => c.id);
        const { data: commentLikes } = await supabaseClient
            .from('comment_likes')
            .select('comment_id, user_id')
            .in('comment_id', commentIds);
        
        // Compter les likes par commentaire et vérifier si l'utilisateur a liké
        const likesCountMap = new Map();
        const userLikedMap = new Map();
        (commentLikes || []).forEach(like => {
            likesCountMap.set(like.comment_id, (likesCountMap.get(like.comment_id) || 0) + 1);
            if (currentUser && like.user_id === currentUser.id) {
                userLikedMap.set(like.comment_id, true);
            }
        });
        
        container.innerHTML = comments.map(comment => {
            const profile = profileMap.get(comment.user_id);
            const username = profile?.username || 'Anonyme';
            const initial = username.charAt(0).toUpperCase();
            const timeAgo = formatTimeAgo(new Date(comment.created_at));
            const canDelete = currentUser && comment.user_id === currentUser.id;
            const likeCount = likesCountMap.get(comment.id) || 0;
            const isLiked = userLikedMap.get(comment.id) || false;
            
            return `
                <div class="comment-item" data-id="${comment.id}">
                    <div class="comment-avatar" onclick="openUserProfile('${comment.user_id}', '${escapeHtml(username)}')" style="cursor:pointer">${initial}</div>
                    <div class="comment-content">
                        <div class="comment-header">
                            <span class="comment-username" onclick="openUserProfile('${comment.user_id}', '${escapeHtml(username)}')">${escapeHtml(username)}</span>
                            <span class="comment-time">${timeAgo}</span>
                            ${canDelete ? `<button class="comment-delete" onclick="deleteComment('${comment.id}', '${extraitId}')">🗑️</button>` : ''}
                        </div>
                        <div class="comment-text">${escapeHtml(comment.content)}</div>
                        <div class="comment-actions">
                            <button class="comment-like-btn ${isLiked ? 'liked' : ''}" onclick="toggleCommentLike('${comment.id}', '${extraitId}')">
                                <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
                                <span class="comment-like-count">${likeCount > 0 ? likeCount : ''}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Mettre à jour le compteur
        const countEl = document.getElementById(`commentCount-${extraitId}`);
        if (countEl) countEl.textContent = comments.length;
        
    } catch (err) {
        console.error('Erreur chargement commentaires:', err);
        container.innerHTML = '<div class="comments-empty">Erreur: ' + (err.message || err) + '</div>';
    }
}

// Poster un commentaire
async function postComment(extraitId) {
    if (!currentUser) {
        openAuthModal('login');
        toast('📝 Connectez-vous pour commenter');
        return;
    }
    
    if (!supabaseClient) return;
    
    const input = document.getElementById(`commentInput-${extraitId}`);
    const content = input.value.trim();
    
    if (!content) return;
    
    input.value = '';
    
    try {
        const { error } = await supabaseClient
            .from('comments')
            .insert({
                extrait_id: extraitId,
                user_id: currentUser.id,
                content: content,
                created_at: new Date().toISOString()
            });
        
        if (error) {
            console.error('Erreur insert comment:', error);
            toast('❌ Erreur: ' + error.message);
            return;
        }
        
        // Incrémenter le compteur (ignorer les erreurs si la fonction n'existe pas)
        try {
            await supabaseClient.rpc('increment_comments', { p_extrait_id: extraitId });
        } catch (rpcErr) {
            console.warn('RPC increment_comments non disponible:', rpcErr);
        }
        
        toast('💬 Commentaire ajouté !');
        
        // Notifier l'auteur de l'extrait
        const extrait = socialExtraits.find(e => e.id === extraitId);
        if (extrait && extrait.user_id !== currentUser.id) {
            createNotification(extrait.user_id, 'comment', extraitId, content.substring(0, 100));
        }
        
        // Recharger les commentaires
        await loadComments(extraitId);
        
    } catch (err) {
        console.error('Erreur post commentaire:', err);
        toast('❌ Erreur d\'envoi');
    }
}

// Supprimer un commentaire
async function deleteComment(commentId, extraitId) {
    if (!currentUser || !supabaseClient) return;
    
    if (!confirm('Supprimer ce commentaire ?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('comments')
            .delete()
            .eq('id', commentId);
        
        if (error) throw error;
        
        // Décrémenter le compteur
        await supabaseClient.rpc('decrement_comments', { p_extrait_id: extraitId });
        
        toast('🗑️ Commentaire supprimé');
        
        // Recharger les commentaires
        await loadComments(extraitId);
        
    } catch (err) {
        console.error('Erreur suppression commentaire:', err);
        toast('❌ Erreur de suppression');
    }
}

// Liker/Unliker un commentaire
async function toggleCommentLike(commentId, extraitId) {
    if (!currentUser) {
        openAuthModal('login');
        toast('❤️ Connectez-vous pour liker');
        return;
    }
    
    if (!supabaseClient) return;
    
    try {
        // Vérifier si déjà liké
        const { data: existing } = await supabaseClient
            .from('comment_likes')
            .select('id')
            .eq('comment_id', commentId)
            .eq('user_id', currentUser.id)
            .single();
        
        if (existing) {
            // Unlike
            await supabaseClient
                .from('comment_likes')
                .delete()
                .eq('id', existing.id);
        } else {
            // Like
            await supabaseClient
                .from('comment_likes')
                .insert({
                    comment_id: commentId,
                    user_id: currentUser.id,
                    created_at: new Date().toISOString()
                });
        }
        
        // Rafraîchir l'affichage des commentaires
        await loadComments(extraitId);
        
    } catch (err) {
        console.error('Erreur like commentaire:', err);
    }
}

async function loadUserStats() {
    if (!supabaseClient || !currentUser) return;
    
    // Compter les extraits
    const { count: extraitCount } = await supabaseClient
        .from('extraits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);
    
    // Compter les vrais likes reçus (depuis la table likes)
    const { data: myExtraits } = await supabaseClient
        .from('extraits')
        .select('id')
        .eq('user_id', currentUser.id);
    
    let totalLikes = 0;
    if (myExtraits && myExtraits.length > 0) {
        const extraitIds = myExtraits.map(e => e.id);
        const { count: likesCount } = await supabaseClient
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .in('extrait_id', extraitIds);
        totalLikes = likesCount || 0;
    }
    
    document.getElementById('myExtraitsCount').textContent = extraitCount || 0;
    document.getElementById('myLikesCount').textContent = totalLikes;
    
    // Aussi afficher le nombre d'abonnés
    const { count: followersCount } = await supabaseClient
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', currentUser.id);
    

}

// Helpers
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' h';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' j';
    return date.toLocaleDateString('fr-FR');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openMyProfile() {
    closeUserDropdown();
    switchSocialTab('mine');
    openSocialFeed();
}

// ═══════════════════════════════════════════════════════════
// 👥 SYSTÈME D'AMIS (FOLLOWERS)
// ═══════════════════════════════════════════════════════════

let currentProfileUserId = null;
let userFollowing = new Set(); // IDs des personnes qu'on suit

// Charger la liste des personnes qu'on suit
async function loadUserFollowing() {
    if (!currentUser || !supabaseClient) return;
    
    const { data } = await supabaseClient
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);
    
    userFollowing = new Set(data?.map(f => f.following_id) || []);
}

// Charger et afficher les utilisateurs à découvrir
async function loadDiscoverUsers() {
    const container = document.getElementById('socialFeed');
    
    if (!supabaseClient) {
        container.innerHTML = '<div class="social-empty">⚠️ Non connecté</div>';
        return;
    }
    
    // Récupérer tous les profils avec leur nombre d'extraits
    const { data: profiles, error } = await supabaseClient
        .from('profiles')
        .select('id, username, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (error || !profiles) {
        container.innerHTML = '<div class="social-empty">❌ Erreur lors du chargement</div>';
        return;
    }
    
    // Compter les extraits pour chaque profil
    const profilesWithStats = await Promise.all(profiles.map(async (p) => {
        const { count } = await supabaseClient
            .from('extraits')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', p.id);
        return { ...p, extraitCount: count || 0 };
    }));
    
    // Filtrer pour ne pas s'afficher soi-même
    const filteredProfiles = profilesWithStats.filter(p => 
        !currentUser || p.id !== currentUser.id
    );
    
    if (filteredProfiles.length === 0) {
        container.innerHTML = `
            <div class="social-empty">
                <div class="social-empty-icon">🌱</div>
                <div class="social-empty-title">Pas encore d'utilisateurs</div>
                <div class="social-empty-text">Soyez le premier à inviter des amis !</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="discover-header">
            <h3>👥 Utilisateurs à découvrir</h3>
            <p>Suivez des personnes pour voir leurs extraits dans l'onglet "Abonnements"</p>
        </div>
        <div class="discover-grid">
            ${filteredProfiles.map(p => renderUserCard(
                p.id, 
                p.username, 
                `${p.extraitCount} extrait${p.extraitCount > 1 ? 's' : ''}`
            )).join('')}
        </div>
    `;
}

// Helper: Générer une carte utilisateur
function renderUserCard(userId, username, subtitle, showFollowButton = true, toggleFn = 'toggleFollow') {
    const initial = (username || 'A').charAt(0).toUpperCase();
    const safeName = escapeHtml(username || 'Anonyme');
    const isFollowing = userFollowing.has(userId);
    return `
        <div class="discover-card">
            <div class="discover-avatar" onclick="openUserProfile('${userId}', '${safeName}')">${initial}</div>
            <div class="discover-info" onclick="openUserProfile('${userId}', '${safeName}')">
                <div class="discover-name">${safeName}</div>
                <div class="discover-stats">${subtitle}</div>
            </div>
            ${showFollowButton ? `
                <button class="btn-follow-small ${isFollowing ? 'following' : ''}" onclick="${toggleFn}('${userId}', event)">
                    ${isFollowing ? '✓ Suivi' : '+ Suivre'}
                </button>
            ` : ''}
        </div>
    `;
}

// Charger mes abonnés (les gens qui me suivent)
async function loadMyFollowers() {
    const container = document.getElementById('socialFeed');
    
    if (!supabaseClient || !currentUser) {
        container.innerHTML = `
            <div class="social-empty">
                <div class="social-empty-icon">🔐</div>
                <div class="social-empty-title">Connexion requise</div>
                <div class="social-empty-text">Connectez-vous pour voir qui vous suit</div>
            </div>
        `;
        return;
    }
    
    // Récupérer les followers
    const { data: follows } = await supabaseClient
        .from('follows')
        .select('follower_id, created_at')
        .eq('following_id', currentUser.id)
        .order('created_at', { ascending: false });
    
    if (!follows || follows.length === 0) {
        container.innerHTML = `
            <div class="social-empty">
                <div class="social-empty-icon">💌</div>
                <div class="social-empty-title">Pas encore d'abonnés</div>
                <div class="social-empty-text">
                    Personne ne vous suit encore.<br>
                    Partagez des extraits pour attirer des lecteurs !
                </div>
            </div>
        `;
        return;
    }
    
    // Récupérer les profils des followers
    const followerIds = follows.map(f => f.follower_id);
    const profileMap = new Map();
    
    for (const fid of followerIds) {
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('id, username')
            .eq('id', fid)
            .maybeSingle();
        if (profile) {
            profileMap.set(fid, profile);
        }
    }
    
    // Charger qui on suit pour les boutons
    await loadUserFollowing();
    
    container.innerHTML = `
        <div class="discover-header">
            <h3>💌 Vos abonnés (${follows.length})</h3>
            <p>Ces personnes vous suivent et voient vos extraits</p>
        </div>
        <div class="discover-grid">
            ${follows.map(f => {
                const profile = profileMap.get(f.follower_id);
                const username = profile?.username || 'Anonyme';
                const followedAt = formatTimeAgo(new Date(f.created_at));
                return renderUserCard(f.follower_id, username, `Vous suit depuis ${followedAt}`);
            }).join('')}
        </div>
    `;
}

// Feed d'activité - voir toute l'activité de la communauté
let activitySubscription = null;
let currentActivityFilter = 'all'; // 'all', 'following', 'mine', 'likes', 'comments'

async function loadActivityFeed() {
    const container = document.getElementById('socialFeed');
    
    if (!supabaseClient) {
        container.innerHTML = '<div class="social-empty">⚠️ Non connecté</div>';
        return;
    }
    
    // Récupérer les abonnements de l'utilisateur
    let followingIds = [];
    if (currentUser) {
        const { data: following } = await supabaseClient
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUser.id);
        followingIds = (following || []).map(f => f.following_id);
    }
    
    // Récupérer mes extraits pour savoir quand quelqu'un interagit avec
    let myExtraitIds = [];
    if (currentUser) {
        const { data: myExtraits } = await supabaseClient
            .from('extraits')
            .select('id')
            .eq('user_id', currentUser.id);
        myExtraitIds = (myExtraits || []).map(e => e.id);
    }
    
    // Récupérer les likes récents
    const { data: recentLikes, error: likesError } = await supabaseClient
        .from('likes')
        .select('id, created_at, user_id, extrait_id')
        .order('created_at', { ascending: false })
        .limit(30);
    
    // Récupérer les commentaires récents
    const { data: recentComments, error: commentsError } = await supabaseClient
        .from('comments')
        .select('id, created_at, user_id, extrait_id, content')
        .order('created_at', { ascending: false })
        .limit(30);
    
    // Récupérer les follows récents
    const { data: recentFollows, error: followsError } = await supabaseClient
        .from('follows')
        .select('id, created_at, follower_id, following_id')
        .order('created_at', { ascending: false })
        .limit(20);
    
    // Récupérer les nouveaux extraits partagés
    const { data: recentExtraits, error: extraitsError } = await supabaseClient
        .from('extraits')
        .select('id, created_at, user_id, texte, source_title')
        .order('created_at', { ascending: false })
        .limit(20);
    
    // Combiner toutes les activités avec leur type
    let activities = [];
    
    if (recentLikes) {
        activities.push(...recentLikes.map(l => ({
            type: 'like',
            id: `like-${l.id}`,
            created_at: l.created_at,
            user_id: l.user_id,
            extrait_id: l.extrait_id,
            is_on_mine: myExtraitIds.includes(l.extrait_id)
        })));
    }
    
    if (recentComments) {
        activities.push(...recentComments.map(c => ({
            type: 'comment',
            id: `comment-${c.id}`,
            created_at: c.created_at,
            user_id: c.user_id,
            extrait_id: c.extrait_id,
            content: c.content,
            is_on_mine: myExtraitIds.includes(c.extrait_id)
        })));
    }
    
    if (recentFollows) {
        activities.push(...recentFollows.map(f => ({
            type: 'follow',
            id: `follow-${f.id}`,
            created_at: f.created_at,
            user_id: f.follower_id,
            target_id: f.following_id,
            is_on_mine: f.following_id === currentUser?.id
        })));
    }
    
    if (recentExtraits) {
        activities.push(...recentExtraits.map(e => ({
            type: 'share',
            id: `share-${e.id}`,
            created_at: e.created_at,
            user_id: e.user_id,
            extrait_id: e.id,
            texte: e.texte,
            source_title: e.source_title
        })));
    }
    
    // Trier par date
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Compter pour les filtres
    const counts = {
        all: activities.length,
        following: activities.filter(a => followingIds.includes(a.user_id)).length,
        mine: activities.filter(a => a.is_on_mine && a.user_id !== currentUser?.id).length,
        likes: activities.filter(a => a.type === 'like').length,
        comments: activities.filter(a => a.type === 'comment').length
    };
    
    // Appliquer le filtre
    let filtered = activities;
    if (currentActivityFilter === 'following') {
        filtered = activities.filter(a => followingIds.includes(a.user_id));
    } else if (currentActivityFilter === 'mine') {
        filtered = activities.filter(a => a.is_on_mine && a.user_id !== currentUser?.id);
    } else if (currentActivityFilter === 'likes') {
        filtered = activities.filter(a => a.type === 'like');
    } else if (currentActivityFilter === 'comments') {
        filtered = activities.filter(a => a.type === 'comment');
    }
    
    // Limiter à 50 résultats
    filtered = filtered.slice(0, 50);
    
    // Récupérer tous les user IDs nécessaires
    const allUserIds = [...new Set([
        ...filtered.map(a => a.user_id),
        ...filtered.filter(a => a.target_id).map(a => a.target_id)
    ])];
    const { data: users } = await supabaseClient
        .from('profiles')
        .select('id, username')
        .in('id', allUserIds);
    const userMap = new Map((users || []).map(u => [u.id, u]));
    
    // Récupérer tous les extraits nécessaires
    const allExtraitIds = [...new Set(filtered.filter(a => a.extrait_id).map(a => a.extrait_id))];
    const { data: extraits } = await supabaseClient
        .from('extraits')
        .select('id, texte, source_title, user_id')
        .in('id', allExtraitIds);
    const extraitMap = new Map((extraits || []).map(e => [e.id, e]));
    
    // Récupérer les auteurs des extraits
    const extraitAuthorIds = [...new Set((extraits || []).map(e => e.user_id))];
    const { data: authors } = await supabaseClient
        .from('profiles')
        .select('id, username')
        .in('id', extraitAuthorIds);
    const authorMap = new Map((authors || []).map(a => [a.id, a]));
    
    container.innerHTML = `
        <div class="discover-header">
            <h3>📡 Fil d'activité</h3>
            <p>Suivez ce qui se passe dans la communauté</p>
        </div>
        <div class="activity-filters">
            <div class="activity-filter ${currentActivityFilter === 'all' ? 'active' : ''}" onclick="setActivityFilter('all')">
                🌐 Tout <span class="filter-count">${counts.all}</span>
            </div>
            ${currentUser ? `
                <div class="activity-filter ${currentActivityFilter === 'following' ? 'active' : ''}" onclick="setActivityFilter('following')">
                    👥 Abonnements <span class="filter-count">${counts.following}</span>
                </div>
                <div class="activity-filter ${currentActivityFilter === 'mine' ? 'active' : ''}" onclick="setActivityFilter('mine')">
                    🔔 Sur mes extraits <span class="filter-count">${counts.mine}</span>
                </div>
            ` : ''}
            <div class="activity-filter ${currentActivityFilter === 'likes' ? 'active' : ''}" onclick="setActivityFilter('likes')">
                ❤️ Likes <span class="filter-count">${counts.likes}</span>
            </div>
            <div class="activity-filter ${currentActivityFilter === 'comments' ? 'active' : ''}" onclick="setActivityFilter('comments')">
                💬 Commentaires <span class="filter-count">${counts.comments}</span>
            </div>
        </div>
        ${filtered.length === 0 ? `
            <div class="social-empty">
                <div class="social-empty-icon">${currentActivityFilter === 'following' ? '👥' : currentActivityFilter === 'mine' ? '🔔' : '📡'}</div>
                <div class="social-empty-title">Pas d'activité</div>
                <div class="social-empty-text">${
                    currentActivityFilter === 'following' 
                        ? 'Suivez des personnes pour voir leur activité ici !' 
                        : currentActivityFilter === 'mine'
                            ? 'Partagez des extraits pour voir qui interagit avec !'
                            : 'Soyez le premier à interagir !'
                }</div>
            </div>
        ` : `
            <div class="activity-feed">
                ${filtered.map(activity => renderActivityItem(activity, userMap, extraitMap, authorMap)).join('')}
            </div>
        `}
    `;
    
    // S'abonner aux changements en temps réel
    subscribeToActivityFeed();
}

// Rendu d'un item d'activité
function renderActivityItem(activity, userMap, extraitMap, authorMap) {
    const actor = userMap.get(activity.user_id);
    const actorName = actor?.username || 'Quelqu\'un';
    const actorInitial = actorName.charAt(0).toUpperCase();
    const timeAgo = formatTimeAgo(new Date(activity.created_at));
    const highlight = activity.is_on_mine ? 'highlight' : '';
    
    if (activity.type === 'like') {
        const extrait = extraitMap.get(activity.extrait_id);
        const author = extrait ? authorMap.get(extrait.user_id) : null;
        const authorName = author?.username || 'Anonyme';
        const snippet = extrait?.texte?.substring(0, 80) || 'Extrait supprimé';
        
        return `
            <div class="activity-item ${highlight}" onclick="viewExtraitById('${activity.extrait_id}')">
                <div class="activity-avatar" onclick="event.stopPropagation(); openUserProfile('${activity.user_id}', '${escapeHtml(actorName)}')">${actorInitial}</div>
                <div class="activity-content">
                    <div class="activity-text">
                        <strong onclick="event.stopPropagation(); openUserProfile('${activity.user_id}', '${escapeHtml(actorName)}')">${escapeHtml(actorName)}</strong> 
                        a aimé un extrait de 
                        <strong onclick="event.stopPropagation(); openUserProfile('${extrait?.user_id}', '${escapeHtml(authorName)}')">${escapeHtml(authorName)}</strong>
                    </div>
                    <div class="activity-snippet">"${escapeHtml(snippet)}${snippet.length >= 80 ? '...' : ''}"</div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
                <div class="activity-icon like">❤️</div>
            </div>
        `;
    }
    
    if (activity.type === 'comment') {
        const extrait = extraitMap.get(activity.extrait_id);
        const author = extrait ? authorMap.get(extrait.user_id) : null;
        const authorName = author?.username || 'Anonyme';
        const commentPreview = activity.content?.substring(0, 100) || '';
        
        return `
            <div class="activity-item ${highlight}" onclick="viewExtraitById('${activity.extrait_id}')">
                <div class="activity-avatar comment" onclick="event.stopPropagation(); openUserProfile('${activity.user_id}', '${escapeHtml(actorName)}')">${actorInitial}</div>
                <div class="activity-content">
                    <div class="activity-text">
                        <strong onclick="event.stopPropagation(); openUserProfile('${activity.user_id}', '${escapeHtml(actorName)}')">${escapeHtml(actorName)}</strong> 
                        a commenté un extrait de 
                        <strong onclick="event.stopPropagation(); openUserProfile('${extrait?.user_id}', '${escapeHtml(authorName)}')">${escapeHtml(authorName)}</strong>
                    </div>
                    <div class="activity-comment-preview">"${escapeHtml(commentPreview)}${commentPreview.length >= 100 ? '...' : ''}"</div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
                <div class="activity-icon">💬</div>
            </div>
        `;
    }
    
    if (activity.type === 'follow') {
        const target = userMap.get(activity.target_id);
        const targetName = target?.username || 'Quelqu\'un';
        
        return `
            <div class="activity-item ${highlight}" onclick="openUserProfile('${activity.target_id}', '${escapeHtml(targetName)}')">
                <div class="activity-avatar follow" onclick="event.stopPropagation(); openUserProfile('${activity.user_id}', '${escapeHtml(actorName)}')">${actorInitial}</div>
                <div class="activity-content">
                    <div class="activity-text">
                        <strong onclick="event.stopPropagation(); openUserProfile('${activity.user_id}', '${escapeHtml(actorName)}')">${escapeHtml(actorName)}</strong> 
                        s'est abonné à 
                        <strong onclick="event.stopPropagation(); openUserProfile('${activity.target_id}', '${escapeHtml(targetName)}')">${escapeHtml(targetName)}</strong>
                    </div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
                <div class="activity-icon">👥</div>
            </div>
        `;
    }
    
    if (activity.type === 'share') {
        const snippet = activity.texte?.substring(0, 80) || '';
        const source = activity.source_title || 'Source inconnue';
        
        return `
            <div class="activity-item" onclick="viewExtraitById('${activity.extrait_id}')">
                <div class="activity-avatar share" onclick="event.stopPropagation(); openUserProfile('${activity.user_id}', '${escapeHtml(actorName)}')">${actorInitial}</div>
                <div class="activity-content">
                    <div class="activity-text">
                        <strong onclick="event.stopPropagation(); openUserProfile('${activity.user_id}', '${escapeHtml(actorName)}')">${escapeHtml(actorName)}</strong> 
                        a partagé un extrait
                    </div>
                    <div class="activity-snippet">"${escapeHtml(snippet)}${snippet.length >= 80 ? '...' : ''}"</div>
                    <div class="activity-snippet" style="font-style: normal; color: var(--text-secondary);">📖 ${escapeHtml(source)}</div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
                <div class="activity-icon">📝</div>
            </div>
        `;
    }
    
    return '';
}

// Changer le filtre d'activité
function setActivityFilter(filter) {
    currentActivityFilter = filter;
    loadActivityFeed();
}

// Abonnement temps réel à l'activité (likes, commentaires, follows)
function subscribeToActivityFeed() {
    if (activitySubscription) return; // Déjà abonné
    
    if (!supabaseClient) return;
    
    activitySubscription = supabaseClient
        .channel('activity-all')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'likes' },
            (payload) => {
                console.log('Nouveau like détecté:', payload);
                if (currentSocialTab === 'activity') {
                    loadActivityFeed();
                }
            }
        )
        .on('postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'likes' },
            (payload) => {
                console.log('Like supprimé:', payload);
                if (currentSocialTab === 'activity') {
                    loadActivityFeed();
                }
            }
        )
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'comments' },
            (payload) => {
                console.log('Nouveau commentaire détecté:', payload);
                if (currentSocialTab === 'activity') {
                    loadActivityFeed();
                }
            }
        )
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'follows' },
            (payload) => {
                console.log('Nouvel abonnement détecté:', payload);
                if (currentSocialTab === 'activity') {
                    loadActivityFeed();
                }
            }
        )
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'extraits' },
            (payload) => {
                console.log('Nouvel extrait partagé:', payload);
                if (currentSocialTab === 'activity') {
                    loadActivityFeed();
                }
            }
        )
        .subscribe((status) => {
            console.log('Statut abonnement activité:', status);
        });
}

// Se désabonner quand on quitte
function unsubscribeFromActivityFeed() {
    if (activitySubscription) {
        activitySubscription.unsubscribe();
        activitySubscription = null;
    }
}

// Voir un extrait par son ID
async function viewExtraitById(extraitId) {
    if (!supabaseClient) return;
    
    const { data: extrait } = await supabaseClient
        .from('extraits')
        .select('*, profiles(username)')
        .eq('id', extraitId)
        .single();
    
    if (extrait) {
        socialExtraits = [extrait];
        renderSocialFeed();
    }
}

// Ouvrir le profil d'un utilisateur
let currentProfileTab = 'extraits';

async function openUserProfile(userId, username) {
    if (!supabaseClient) return;
    
    currentProfileUserId = userId;
    currentProfileTab = 'extraits';
    
    // Charger les infos du profil
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    // Compter les extraits
    const { count: extraitCount } = await supabaseClient
        .from('extraits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
    
    // Compter followers/following
    const { count: followersCount } = await supabaseClient
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
    
    const { count: followingCount } = await supabaseClient
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
    
    // Mettre à jour l'UI
    const displayName = profile?.username || username || 'Anonyme';
    document.getElementById('profileAvatar').textContent = displayName.charAt(0).toUpperCase();
    document.getElementById('profileUsername').textContent = displayName;
    document.getElementById('profileFollowers').textContent = followersCount || 0;
    document.getElementById('profileFollowing').textContent = followingCount || 0;
    document.getElementById('profileExtraits').textContent = extraitCount || 0;
    
    // Bouton suivre
    const followBtn = document.getElementById('profileFollowBtn');
    const messageBtn = document.getElementById('profileMessageBtn');
    if (currentUser && userId !== currentUser.id) {
        followBtn.style.display = 'inline-block';
        messageBtn.style.display = 'inline-block';
        const isFollowing = userFollowing.has(userId);
        followBtn.textContent = isFollowing ? 'Ne plus suivre' : 'Suivre';
        followBtn.classList.toggle('following', isFollowing);
    } else {
        followBtn.style.display = 'none';
        messageBtn.style.display = 'none';
    }
    
    // Reset tabs
    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tabProfileExtraits').classList.add('active');
    
    // Charger le contenu initial (extraits)
    await loadProfileExtraits(userId);
    
    // Ouvrir la modal
    document.getElementById('userProfileModal').classList.add('open');
}

// Changer d'onglet dans le profil
async function switchProfileTab(tab) {
    if (!currentProfileUserId) return;
    
    currentProfileTab = tab;
    
    // Update tabs UI
    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    const tabMap = {
        'extraits': 'tabProfileExtraits',
        'likes': 'tabProfileLikes',
        'followers': 'tabProfileFollowers',
        'following': 'tabProfileFollowing'
    };
    document.getElementById(tabMap[tab])?.classList.add('active');
    
    // Load content
    const container = document.getElementById('profileContentArea');
    container.innerHTML = '<div class="profile-empty"><div class="spinner"></div></div>';
    
    switch(tab) {
        case 'extraits':
            await loadProfileExtraits(currentProfileUserId);
            break;
        case 'likes':
            await loadProfileLikes(currentProfileUserId);
            break;
        case 'followers':
            await loadProfileFollowersList(currentProfileUserId);
            break;
        case 'following':
            await loadProfileFollowingList(currentProfileUserId);
            break;
    }
}

// Charger les extraits partagés par l'utilisateur
async function loadProfileExtraits(userId) {
    const container = document.getElementById('profileContentArea');
    
    const { data: extraits } = await supabaseClient
        .from('extraits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);
    
    if (!extraits || extraits.length === 0) {
        container.innerHTML = `
            <div class="profile-empty">
                <div class="profile-empty-icon">📝</div>
                <div class="profile-empty-text">Aucun extrait partagé</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="profile-extraits-list">
            ${extraits.map(e => `
                <div class="profile-extrait-card">
                    <div class="profile-extrait-text">"${esc(e.texte.substring(0, 300))}${e.texte.length > 300 ? '...' : ''}"</div>
                    <div class="profile-extrait-source">
                        <strong>${esc(e.source_author)}</strong> — ${esc(e.source_title)}
                    </div>
                    <div class="profile-extrait-meta">
                        <span>❤️ ${e.likes_count || 0} likes</span>
                        <span>${formatTimeAgo(new Date(e.created_at))}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Charger les extraits likés par l'utilisateur
async function loadProfileLikes(userId) {
    const container = document.getElementById('profileContentArea');
    
    // Récupérer les likes de l'utilisateur
    const { data: likes } = await supabaseClient
        .from('likes')
        .select('extrait_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);
    
    if (!likes || likes.length === 0) {
        container.innerHTML = `
            <div class="profile-empty">
                <div class="profile-empty-icon">❤️</div>
                <div class="profile-empty-text">Aucun like pour l'instant</div>
            </div>
        `;
        return;
    }
    
    // Récupérer les extraits likés
    const extraitIds = likes.map(l => l.extrait_id);
    const { data: extraits } = await supabaseClient
        .from('extraits')
        .select('*, profiles:user_id(username)')
        .in('id', extraitIds);
    
    if (!extraits || extraits.length === 0) {
        container.innerHTML = `
            <div class="profile-empty">
                <div class="profile-empty-icon">❤️</div>
                <div class="profile-empty-text">Aucun extrait disponible</div>
            </div>
        `;
        return;
    }
    
    // Mapper par ID pour garder l'ordre des likes
    const extraitMap = new Map(extraits.map(e => [e.id, e]));
    
    container.innerHTML = `
        <div class="profile-extraits-list">
            ${likes.map(l => {
                const e = extraitMap.get(l.extrait_id);
                if (!e) return '';
                const authorName = e.profiles?.username || 'Anonyme';
                return `
                    <div class="profile-extrait-card">
                        <div class="profile-extrait-text">"${esc(e.texte.substring(0, 300))}${e.texte.length > 300 ? '...' : ''}"</div>
                        <div class="profile-extrait-source">
                            <strong>${esc(e.source_author)}</strong> — ${esc(e.source_title)}
                        </div>
                        <div class="profile-extrait-meta">
                            <span>par @${esc(authorName)}</span>
                            <span>liké ${formatTimeAgo(new Date(l.created_at))}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Charger les abonnés (personnes qui suivent cet utilisateur)
async function loadProfileFollowersList(userId) {
    const container = document.getElementById('profileContentArea');
    
    const { data } = await supabaseClient
        .from('follows')
        .select('follower_id, created_at, profiles!follows_follower_id_fkey(username)')
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="profile-empty">
                <div class="profile-empty-icon">👥</div>
                <div class="profile-empty-text">Aucun abonné pour l'instant</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="friends-list">
            ${data.map(f => {
                const name = f.profiles?.username || 'Anonyme';
                return `
                    <div class="friend-item" onclick="openUserProfile('${f.follower_id}', '${esc(name)}')">
                        <div class="friend-avatar">${name.charAt(0).toUpperCase()}</div>
                        <span>${esc(name)}</span>
                        <span style="margin-left:auto; font-size:0.7rem; color:var(--muted)">depuis ${formatTimeAgo(new Date(f.created_at))}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Charger les personnes suivies par un utilisateur
async function loadProfileFollowingList(userId) {
    const container = document.getElementById('profileContentArea');
    
    const { data } = await supabaseClient
        .from('follows')
        .select('following_id, created_at, profiles!follows_following_id_fkey(username)')
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="profile-empty">
                <div class="profile-empty-icon">📤</div>
                <div class="profile-empty-text">Ne suit personne pour l'instant</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="friends-list">
            ${data.map(f => {
                const name = f.profiles?.username || 'Anonyme';
                return `
                    <div class="friend-item" onclick="openUserProfile('${f.following_id}', '${esc(name)}')">
                        <div class="friend-avatar">${name.charAt(0).toUpperCase()}</div>
                        <span>${esc(name)}</span>
                        <span style="margin-left:auto; font-size:0.7rem; color:var(--muted)">depuis ${formatTimeAgo(new Date(f.created_at))}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Fermer la modal profil
function closeUserProfile() {
    document.getElementById('userProfileModal').classList.remove('open');
    currentProfileUserId = null;
}

// Suivre/Ne plus suivre depuis la modal profil
async function toggleFollowFromProfile() {
    if (!currentProfileUserId) return;
    await toggleFollow(currentProfileUserId);
    
    // Rafraîchir l'affichage
    const followBtn = document.getElementById('profileFollowBtn');
    const isNowFollowing = userFollowing.has(currentProfileUserId);
    followBtn.textContent = isNowFollowing ? 'Ne plus suivre' : 'Suivre';
    followBtn.classList.toggle('following', isNowFollowing);
    
    // Mettre à jour le compteur followers
    const { count } = await supabaseClient
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', currentProfileUserId);
    document.getElementById('profileFollowers').textContent = count || 0;
}

// Suivre/Ne plus suivre un utilisateur
async function toggleFollow(userId, event) {
    if (event) event.stopPropagation();
    
    if (!currentUser) {
        openAuthModal('login');
        toast('📝 Connectez-vous pour suivre');
        return;
    }
    
    if (!supabaseClient || userId === currentUser.id) return;
    
    const isFollowing = userFollowing.has(userId);
    
    if (isFollowing) {
        // Unfollow
        await supabaseClient
            .from('follows')
            .delete()
            .eq('follower_id', currentUser.id)
            .eq('following_id', userId);
        userFollowing.delete(userId);
        toast('👋 Vous ne suivez plus cet utilisateur');
    } else {
        // Follow
        await supabaseClient
            .from('follows')
            .insert({
                follower_id: currentUser.id,
                following_id: userId,
                created_at: new Date().toISOString()
            });
        userFollowing.add(userId);
        toast('✅ Vous suivez maintenant cet utilisateur !');
        
        // Notifier l'utilisateur qu'on le suit
        createNotification(userId, 'follow');
    }
    
    // Rafraîchir le feed si on est sur l'onglet amis
    if (currentSocialTab === 'friends') {
        loadSocialFeed();
    }
}

// ═══════════════════════════════════════════════════════════
// 💬 MESSAGERIE PRIVÉE
// ═══════════════════════════════════════════════════════════

let currentConversationUserId = null;
let messagesSubscription = null;

// Ouvrir la messagerie
async function openMessaging() {
    if (!currentUser) {
        openAuthModal('login');
        toast('📝 Connectez-vous pour accéder à vos messages');
        return;
    }
    
    document.getElementById('messagesModal').classList.add('open');
    document.getElementById('messagesModal').classList.remove('chat-open');
    document.getElementById('chatArea').style.display = 'none';
    document.getElementById('chatPlaceholder').style.display = 'flex';
    
    await loadConversations();
    subscribeToMessages();
}

// Fermer la messagerie
function closeMessaging() {
    document.getElementById('messagesModal').classList.remove('open');
    if (messagesSubscription) {
        messagesSubscription.unsubscribe();
        messagesSubscription = null;
    }
    currentConversationUserId = null;
}

// Retour aux conversations (mobile)
function backToConversations() {
    document.getElementById('messagesModal').classList.remove('chat-open');
    document.getElementById('chatArea').style.display = 'none';
    document.getElementById('chatPlaceholder').style.display = 'flex';
    currentConversationUserId = null;
}

// Charger les conversations
async function loadConversations() {
    if (!supabaseClient || !currentUser) return;
    
    const container = document.getElementById('conversationsList');
    container.innerHTML = '<div class="messages-empty">Chargement...</div>';
    
    try {
        // Récupérer tous les messages où l'utilisateur est impliqué
        // Utiliser deux requêtes séparées pour éviter les problèmes de syntaxe OR
        const { data: sentMessages, error: err1 } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('sender_id', currentUser.id);
        
        const { data: receivedMessages, error: err2 } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('receiver_id', currentUser.id);
        
        if (err1 || err2) {
            console.error('Erreur messages:', err1 || err2);
            // Vérifier si c'est une erreur de table non existante
            const errMsg = (err1 || err2)?.message || '';
            if (errMsg.includes('does not exist') || errMsg.includes('relation')) {
                container.innerHTML = '<div class="messages-empty">⚠️ La table messages n\'existe pas encore.<br><br>Exécutez le SQL dans Supabase pour activer la messagerie.</div>';
            } else {
                container.innerHTML = '<div class="messages-empty">Erreur de chargement<br><small>' + errMsg + '</small></div>';
            }
            return;
        }
        
        // Combiner et trier
        const allMessages = [...(sentMessages || []), ...(receivedMessages || [])];
        allMessages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        if (allMessages.length === 0) {
            container.innerHTML = '<div class="messages-empty">Aucune conversation.<br><br>Visitez le profil d\'un utilisateur et cliquez sur "💬 Message" pour démarrer une conversation.</div>';
            return;
        }
        
        // Grouper par conversation (autre utilisateur)
        const conversations = new Map();
        for (const msg of allMessages) {
            const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
            if (!conversations.has(otherUserId)) {
                conversations.set(otherUserId, {
                    otherUserId,
                    lastMessage: msg,
                    unreadCount: 0
                });
            }
            // Compter les messages non lus
            if (msg.receiver_id === currentUser.id && !msg.read_at) {
                const conv = conversations.get(otherUserId);
                conv.unreadCount++;
            }
        }
        
        // Récupérer les profils des autres utilisateurs
        const userIds = Array.from(conversations.keys());
        const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('id, username')
            .in('id', userIds);
        
        const profileMap = new Map();
        (profiles || []).forEach(p => profileMap.set(p.id, p));
        
        // Afficher les conversations
        container.innerHTML = '';
        for (const [userId, conv] of conversations) {
            const profile = profileMap.get(userId) || { username: 'Utilisateur' };
            const initial = profile.username.charAt(0).toUpperCase();
            const preview = conv.lastMessage.content.substring(0, 40) + (conv.lastMessage.content.length > 40 ? '...' : '');
            const time = formatMessageTime(conv.lastMessage.created_at);
            
            const item = document.createElement('div');
            item.className = 'conversation-item';
            if (currentConversationUserId === userId) item.classList.add('active');
            item.onclick = () => openConversation(userId, profile.username);
            item.innerHTML = `
                <div class="conversation-avatar">${initial}</div>
                <div class="conversation-info">
                    <div class="conversation-name">${profile.username}</div>
                    <div class="conversation-preview">${conv.lastMessage.sender_id === currentUser.id ? 'Vous: ' : ''}${preview}</div>
                </div>
                <div class="conversation-meta">
                    <span class="conversation-time">${time}</span>
                    ${conv.unreadCount > 0 ? `<span class="conversation-unread">${conv.unreadCount}</span>` : ''}
                </div>
            `;
            container.appendChild(item);
        }
    } catch (err) {
        console.error('Erreur chargement conversations:', err);
        container.innerHTML = '<div class="messages-empty">Erreur de chargement<br><small>' + (err.message || err) + '</small></div>';
    }
}

// Formater l'heure des messages
function formatMessageTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' min';
    if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// Ouvrir une conversation
async function openConversation(userId, username) {
    currentConversationUserId = userId;
    
    // Afficher le chat
    document.getElementById('chatPlaceholder').style.display = 'none';
    document.getElementById('chatArea').style.display = 'flex';
    document.getElementById('messagesModal').classList.add('chat-open');
    
    // Header
    document.getElementById('chatAvatar').textContent = username.charAt(0).toUpperCase();
    document.getElementById('chatUsername').textContent = username;
    
    // Charger les messages
    await loadMessages(userId);
    
    // Marquer comme lus
    markMessagesAsRead(userId);
    
    // Mettre à jour la liste (active)
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    loadConversations(); // Refresh pour les badges
}

// Charger les messages d'une conversation
async function loadMessages(otherUserId) {
    if (!supabaseClient || !currentUser) return;
    
    const container = document.getElementById('chatMessages');
    container.innerHTML = '<div class="messages-empty">Chargement...</div>';
    
    try {
        // Récupérer les messages envoyés et reçus séparément
        const { data: sentMessages, error: err1 } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('sender_id', currentUser.id)
            .eq('receiver_id', otherUserId);
        
        const { data: receivedMessages, error: err2 } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('sender_id', otherUserId)
            .eq('receiver_id', currentUser.id);
        
        if (err1 || err2) throw (err1 || err2);
        
        // Combiner et trier par date
        const messages = [...(sentMessages || []), ...(receivedMessages || [])];
        messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        container.innerHTML = '';
        
        if (messages.length === 0) {
            container.innerHTML = '<div class="messages-empty" style="align-self: center; margin: auto;">Démarrez la conversation !</div>';
            return;
        }
        
        for (const msg of messages) {
            const isSent = msg.sender_id === currentUser.id;
            const msgEl = document.createElement('div');
            msgEl.className = `chat-message ${isSent ? 'sent' : 'received'}`;
            msgEl.innerHTML = `
                ${escapeHtml(msg.content)}
                <div class="chat-message-time">${formatMessageTime(msg.created_at)}</div>
            `;
            container.appendChild(msgEl);
        }
        
        // Scroll en bas
        container.scrollTop = container.scrollHeight;
    } catch (err) {
        console.error('Erreur chargement messages:', err);
        container.innerHTML = '<div class="messages-empty">Erreur de chargement</div>';
    }
}

// Envoyer un message
async function sendMessage() {
    if (!supabaseClient || !currentUser || !currentConversationUserId) return;
    
    const input = document.getElementById('chatInput');
    const content = input.value.trim();
    
    if (!content) return;
    
    input.value = '';
    
    try {
        const { error } = await supabaseClient
            .from('messages')
            .insert({
                sender_id: currentUser.id,
                receiver_id: currentConversationUserId,
                content: content,
                created_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        // Rafraîchir les messages
        await loadMessages(currentConversationUserId);
        
    } catch (err) {
        console.error('Erreur envoi message:', err);
        toast('❌ Erreur d\'envoi');
    }
}

// Marquer les messages comme lus
async function markMessagesAsRead(fromUserId) {
    if (!supabaseClient || !currentUser) return;
    
    try {
        await supabaseClient
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('sender_id', fromUserId)
            .eq('receiver_id', currentUser.id)
            .is('read_at', null);
        
        updateUnreadBadge();
    } catch (err) {
        console.error('Erreur marquage lu:', err);
    }
}

// Mettre à jour le badge de messages non lus
async function updateUnreadBadge() {
    if (!supabaseClient || !currentUser) return;
    
    try {
        const { count } = await supabaseClient
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', currentUser.id)
            .is('read_at', null);
        
        const badge = document.getElementById('unreadBadge');
        if (count && count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    } catch (err) {
        console.error('Erreur comptage non lus:', err);
    }
}

// Souscrire aux nouveaux messages (temps réel)
function subscribeToMessages() {
    if (!supabaseClient || !currentUser || messagesSubscription) return;
    
    messagesSubscription = supabaseClient
        .channel('messages-channel')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages' },
            (payload) => {
                const msg = payload.new;
                if (msg.receiver_id === currentUser.id || msg.sender_id === currentUser.id) {
                    // Rafraîchir la conversation si elle est ouverte
                    if (currentConversationUserId === msg.sender_id || currentConversationUserId === msg.receiver_id) {
                        loadMessages(currentConversationUserId);
                    }
                    // Rafraîchir la liste des conversations
                    loadConversations();
                    // Mettre à jour le badge
                    updateUnreadBadge();
                }
            }
        )
        .subscribe();
}

// Démarrer une conversation (depuis le profil)
function startConversation(userId) {
    if (!currentUser) {
        openAuthModal('login');
        toast('📝 Connectez-vous pour envoyer des messages');
        return;
    }
    
    if (userId === currentUser.id) {
        toast('😅 Vous ne pouvez pas vous écrire à vous-même');
        return;
    }
    
    closeUserProfile();
    openMessaging();
    
    // Ouvrir la conversation avec ce user
    const username = document.getElementById('profileUsername').textContent;
    setTimeout(() => {
        openConversation(userId, username);
    }, 300);
}

// ═══════════════════════════════════════════════════════════
// 🔔 NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

let notificationsSubscription = null;

// Afficher/masquer les notifications
function toggleNotifications() {
    const dropdown = document.getElementById('notifDropdown');
    const isOpen = dropdown.classList.contains('open');
    
    // Fermer les autres dropdowns
    document.getElementById('userDropdown')?.classList.remove('open');
    
    if (isOpen) {
        dropdown.classList.remove('open');
    } else {
        dropdown.classList.add('open');
        loadNotifications();
    }
}

// Fermer dropdown quand on clique ailleurs
document.addEventListener('click', (e) => {
    const notifBtn = document.querySelector('.notif-btn');
    if (notifBtn && !notifBtn.contains(e.target)) {
        document.getElementById('notifDropdown')?.classList.remove('open');
    }
});

// Charger les notifications
async function loadNotifications() {
    if (!supabaseClient || !currentUser) return;
    
    const container = document.getElementById('notifList');
    container.innerHTML = '<div class="notif-empty">Chargement...</div>';
    
    try {
        const { data: notifs, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(30);
        
        if (error) {
            console.error('Erreur notifications:', error);
            if (error.message?.includes('does not exist')) {
                container.innerHTML = '<div class="notif-empty">⚠️ Table non créée</div>';
            } else {
                container.innerHTML = '<div class="notif-empty">Erreur</div>';
            }
            return;
        }
        
        if (!notifs || notifs.length === 0) {
            container.innerHTML = '<div class="notif-empty">Aucune notification</div>';
            return;
        }
        
        // Récupérer les profils des expéditeurs
        const fromUserIds = [...new Set(notifs.map(n => n.from_user_id))];
        const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('id, username')
            .in('id', fromUserIds);
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        
        container.innerHTML = notifs.map(notif => {
            const fromUser = profileMap.get(notif.from_user_id);
            const fromName = fromUser?.username || 'Quelqu\'un';
            const initial = fromName.charAt(0).toUpperCase();
            const timeAgo = formatTimeAgo(new Date(notif.created_at));
            const isUnread = !notif.read_at;
            
            let icon = '🔔';
            let text = '';
            
            if (notif.type === 'like') {
                icon = '❤️';
                text = `<strong>${escapeHtml(fromName)}</strong> a aimé votre extrait`;
            } else if (notif.type === 'comment') {
                icon = '💬';
                text = `<strong>${escapeHtml(fromName)}</strong> a commenté votre extrait`;
            } else if (notif.type === 'follow') {
                icon = '👤';
                text = `<strong>${escapeHtml(fromName)}</strong> vous suit`;
            }
            
            return `
                <div class="notif-item ${isUnread ? 'unread' : ''}" onclick="handleNotifClick('${notif.id}', '${notif.type}', '${notif.extrait_id || ''}', '${notif.from_user_id}', '${escapeHtml(fromName)}')">
                    <div class="notif-avatar">${initial}</div>
                    <div class="notif-content">
                        <div class="notif-text">${text}</div>
                        <div class="notif-time">${timeAgo}</div>
                    </div>
                    <div class="notif-icon">${icon}</div>
                </div>
            `;
        }).join('');
        
    } catch (err) {
        console.error('Erreur chargement notifications:', err);
        container.innerHTML = '<div class="notif-empty">Erreur</div>';
    }
}

// Gérer le clic sur une notification
async function handleNotifClick(notifId, type, extraitId, fromUserId, fromName) {
    // Marquer comme lue
    if (supabaseClient && currentUser) {
        await supabaseClient
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', notifId);
    }
    
    // Fermer le dropdown
    document.getElementById('notifDropdown').classList.remove('open');
    
    // Action selon le type
    if (type === 'like' || type === 'comment') {
        if (extraitId) {
            viewExtraitById(extraitId);
        }
    } else if (type === 'follow') {
        openUserProfile(fromUserId, fromName);
    }
    
    // Mettre à jour le badge
    updateNotifBadge();
}

// Marquer toutes les notifications comme lues
async function markAllNotifsRead() {
    if (!supabaseClient || !currentUser) return;
    
    try {
        await supabaseClient
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', currentUser.id)
            .is('read_at', null);
        
        toast('✅ Toutes les notifications marquées comme lues');
        loadNotifications();
        updateNotifBadge();
    } catch (err) {
        console.error('Erreur marquage lu:', err);
    }
}

// Mettre à jour le badge de notifications
async function updateNotifBadge() {
    if (!supabaseClient || !currentUser) return;
    
    try {
        const { count } = await supabaseClient
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id)
            .is('read_at', null);
        
        const badge = document.getElementById('notifBadge');
        if (count && count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    } catch (err) {
        // Ignorer si la table n'existe pas
    }
}

// Créer une notification
async function createNotification(userId, type, extraitId = null, content = null) {
    if (!supabaseClient || !currentUser) return;
    if (userId === currentUser.id) return; // Pas de notif pour soi-même
    
    try {
        await supabaseClient
            .from('notifications')
            .insert({
                user_id: userId,
                from_user_id: currentUser.id,
                type: type,
                extrait_id: extraitId,
                content: content,
                created_at: new Date().toISOString()
            });
    } catch (err) {
        console.warn('Notification non créée:', err);
    }
}

// S'abonner aux notifications en temps réel
function subscribeToNotifications() {
    if (!supabaseClient || !currentUser || notificationsSubscription) return;
    
    notificationsSubscription = supabaseClient
        .channel('notif-channel')
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
            (payload) => {
                console.log('Nouvelle notification:', payload);
                updateNotifBadge();
                // Notification visuelle
                toast('🔔 Nouvelle notification !');
            }
        )
        .subscribe();
}

// Fonction pour partager depuis une carte
function shareCardExtrait(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const text = card.dataset.text || '';
    const author = card.dataset.author || 'Inconnu';
    const title = card.dataset.title || 'Sans titre';
    
    // Récupérer la sélection si elle existe, sinon utiliser le teaser
    const selection = window.getSelection().toString().trim();
    const textToShare = selection.length >= 20 ? selection : text.substring(0, 500);
    
    // Construire l'URL Wikisource
    const lang = card.dataset.lang || 'fr';
    const sourceUrl = `https://${lang}.wikisource.org/wiki/${encodeURIComponent(title)}`;
    
    openShareModal(textToShare, author, title, sourceUrl);
}

// Partager rapidement et ouvrir les commentaires
async function quickShareAndComment(cardId) {
    if (!currentUser) {
        openAuthModal('login');
        toast('📝 Connectez-vous pour commenter');
        return;
    }
    
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const text = card.dataset.text || '';
    const author = card.dataset.author || 'Inconnu';
    const title = card.dataset.title || 'Sans titre';
    const lang = card.dataset.lang || 'fr';
    const sourceUrl = `https://${lang}.wikisource.org/wiki/${encodeURIComponent(title)}`;
    
    // Récupérer la sélection ou le teaser
    const selection = window.getSelection().toString().trim();
    const textToShare = selection.length >= 20 ? selection : text.substring(0, 500);
    
    // Vérifier si cet extrait existe déjà (même texte, même source)
    if (supabaseClient) {
        const { data: existing } = await supabaseClient
            .from('extraits')
            .select('id')
            .eq('texte', textToShare)
            .eq('source_title', title)
            .eq('user_id', currentUser.id)
            .maybeSingle();
        
        if (existing) {
            // Ouvrir le feed social et afficher cet extrait
            toast('📖 Cet extrait existe déjà, ouverture...');
            openSocialFeed();
            setTimeout(async () => {
                await viewExtraitById(existing.id);
                // Ouvrir les commentaires
                setTimeout(() => toggleComments(existing.id), 300);
            }, 300);
            return;
        }
        
        // Créer l'extrait directement
        const { data: newExtrait, error } = await supabaseClient
            .from('extraits')
            .insert({
                user_id: currentUser.id,
                texte: textToShare,
                source_title: title,
                source_author: author,
                source_url: sourceUrl,
                commentary: '',
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) {
            console.error('Erreur création extrait:', error);
            toast('❌ Erreur: ' + error.message);
            return;
        }
        
        toast('✅ Extrait partagé ! Ajoutez votre commentaire');
        
        // Ouvrir le feed social et afficher cet extrait avec les commentaires ouverts
        openSocialFeed();
        setTimeout(async () => {
            await viewExtraitById(newExtrait.id);
            // Ouvrir les commentaires automatiquement
            setTimeout(() => toggleComments(newExtrait.id), 300);
        }, 300);
    }
}

// ═══════════════════════════════════════════════════════════
// 🌍 CONFIGURATION MULTILINGUE - Littérature mondiale
// ═══════════════════════════════════════════════════════════
const WIKISOURCES = [
    { lang: 'fr', name: 'Français', url: 'https://fr.wikisource.org' },
    { lang: 'en', name: 'English', url: 'https://en.wikisource.org' },
    { lang: 'de', name: 'Deutsch', url: 'https://de.wikisource.org' },
    { lang: 'it', name: 'Italiano', url: 'https://it.wikisource.org' },
    { lang: 'es', name: 'Español', url: 'https://es.wikisource.org' },
    { lang: 'pt', name: 'Português', url: 'https://pt.wikisource.org' },
    { lang: 'ru', name: 'Русский', url: 'https://ru.wikisource.org' },
    { lang: 'la', name: 'Latina', url: 'https://la.wikisource.org' },
    { lang: 'zh', name: '中文', url: 'https://zh.wikisource.org' },
    { lang: 'ja', name: '日本語', url: 'https://ja.wikisource.org' },
    { lang: 'ar', name: 'العربية', url: 'https://ar.wikisource.org' },
    { lang: 'el', name: 'Ελληνικά', url: 'https://el.wikisource.org' },
];

// Sources alternatives (APIs propres sans scories)
const ALT_SOURCES = {
    poetrydb: {
        name: 'PoetryDB',
        url: 'https://poetrydb.org',
        lang: 'en',
        // Auteurs disponibles dans PoetryDB
        authors: ['Shakespeare', 'Emily Dickinson', 'William Blake', 'John Keats', 
                  'Percy Shelley', 'Lord Byron', 'William Wordsworth', 'Edgar Allan Poe',
                  'Walt Whitman', 'Robert Frost', 'Oscar Wilde', 'Alfred Tennyson']
    },
    gutenberg: {
        name: 'Project Gutenberg',
        url: 'https://www.gutenberg.org',
        // Œuvres populaires avec leurs IDs Gutenberg (domaine public)
        works: [
            { id: 1342, title: 'Pride and Prejudice', author: 'Jane Austen', lang: 'en' },
            { id: 11, title: 'Alice\'s Adventures in Wonderland', author: 'Lewis Carroll', lang: 'en' },
            { id: 84, title: 'Frankenstein', author: 'Mary Shelley', lang: 'en' },
            { id: 1661, title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', lang: 'en' },
            { id: 2701, title: 'Moby Dick', author: 'Herman Melville', lang: 'en' },
            { id: 1232, title: 'The Prince', author: 'Niccolò Machiavelli', lang: 'en' },
            { id: 174, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', lang: 'en' },
            { id: 345, title: 'Dracula', author: 'Bram Stoker', lang: 'en' },
            { id: 1400, title: 'Great Expectations', author: 'Charles Dickens', lang: 'en' },
            { id: 98, title: 'A Tale of Two Cities', author: 'Charles Dickens', lang: 'en' },
            { id: 2600, title: 'War and Peace', author: 'Leo Tolstoy', lang: 'en' },
            { id: 2554, title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', lang: 'en' },
            { id: 4300, title: 'Ulysses', author: 'James Joyce', lang: 'en' },
            { id: 1080, title: 'A Modest Proposal', author: 'Jonathan Swift', lang: 'en' },
            { id: 76, title: 'Adventures of Huckleberry Finn', author: 'Mark Twain', lang: 'en' },
            { id: 74, title: 'The Adventures of Tom Sawyer', author: 'Mark Twain', lang: 'en' },
            { id: 219, title: 'Heart of Darkness', author: 'Joseph Conrad', lang: 'en' },
            { id: 5200, title: 'Metamorphosis', author: 'Franz Kafka', lang: 'en' },
            { id: 1952, title: 'The Yellow Wallpaper', author: 'Charlotte Perkins Gilman', lang: 'en' },
            { id: 120, title: 'Treasure Island', author: 'Robert Louis Stevenson', lang: 'en' },
            // Français
            { id: 17489, title: 'Les Misérables', author: 'Victor Hugo', lang: 'fr' },
            { id: 13951, title: 'Le Comte de Monte-Cristo', author: 'Alexandre Dumas', lang: 'fr' },
            { id: 14287, title: 'Les Trois Mousquetaires', author: 'Alexandre Dumas', lang: 'fr' },
            { id: 4650, title: 'Du côté de chez Swann', author: 'Marcel Proust', lang: 'fr' },
            { id: 17396, title: 'Madame Bovary', author: 'Gustave Flaubert', lang: 'fr' },
            { id: 13704, title: 'Le Rouge et le Noir', author: 'Stendhal', lang: 'fr' },
            { id: 5053, title: 'Germinal', author: 'Émile Zola', lang: 'fr' },
            // Autres langues
            { id: 2000, title: 'Don Quixote', author: 'Miguel de Cervantes', lang: 'es' },
            { id: 1012, title: 'The Divine Comedy', author: 'Dante Alighieri', lang: 'it' },
            { id: 2229, title: 'The Sorrows of Young Werther', author: 'Johann Wolfgang von Goethe', lang: 'de' },
            { id: 7849, title: 'Faust', author: 'Johann Wolfgang von Goethe', lang: 'de' }
        ]
    }
};

// Mots-clés de recherche par langue (termes qui fonctionnent bien sur Wikisource)
const SEARCH_TERMS = {
    fr: [
        'Les Fleurs du Mal', 'Fables de La Fontaine', 'Les Contemplations',
        'Baudelaire', 'Hugo poème', 'Verlaine', 'Rimbaud',
        'Maupassant nouvelle', 'Balzac', 'Zola chapitre',
        'Molière acte', 'Racine tragédie', 'La Fontaine fable',
        'Musset poésie', 'Lamartine méditation', 'Nerval sonnet',
        'Flaubert', 'Stendhal', 'Voltaire conte'
    ],
    en: [
        'Shakespeare sonnet', 'Milton Paradise', 'Keats ode',
        'Byron poem', 'Shelley', 'Wordsworth', 'Blake songs',
        'Dickens chapter', 'Austen', 'Poe tale',
        'Whitman leaves', 'Dickinson poem', 'Tennyson'
    ],
    de: [
        'Goethe Faust', 'Schiller', 'Heine Gedicht',
        'Rilke', 'Novalis', 'Hölderlin', 'Grimm Märchen',
        'Kafka', 'Mann Kapitel', 'Nietzsche'
    ],
    it: [
        'Dante Divina', 'Petrarca sonetto', 'Leopardi canto',
        'Manzoni capitolo', 'Boccaccio novella', 'Ariosto',
        'Pirandello', 'Foscolo', 'Carducci'
    ],
    es: [
        'Cervantes Quijote', 'Góngora soneto', 'Quevedo',
        'Lorca poema', 'Machado', 'Bécquer rima',
        'Calderón', 'Lope de Vega'
    ],
    pt: ['Camões soneto', 'Pessoa poema', 'Eça de Queirós', 'Machado de Assis'],
    ru: ['Пушкин стихотворение', 'Толстой глава', 'Достоевский', 'Чехов рассказ', 'Лермонтов'],
    la: ['Vergilius Aeneis', 'Horatius ode', 'Ovidius', 'Cicero', 'Catullus carmen'],
    zh: ['李白 詩', '杜甫', '蘇軾', '白居易'],
    ja: ['芥川龍之介', '夏目漱石', '太宰治', '宮沢賢治'],
    ar: ['المتنبي قصيدة', 'أبو تمام', 'البحتري'],
    el: ['Ομήρου', 'Σαπφώ', 'Πίνδαρος'],
};

// État de la langue courante ('all' = toutes langues, ou code langue spécifique)
let selectedLang = 'all';
let currentWikisource = WIKISOURCES[0];

// Fonction pour changer la langue
function changeLanguage(lang) {
    selectedLang = lang;
    localStorage.setItem('palimpseste_lang', lang);
    toast(lang === 'all' ? '🌍 Toutes les langues activées' : `🌐 Langue: ${WIKISOURCES.find(w => w.lang === lang)?.name || lang}`);
    // Recharger le feed avec la nouvelle langue
    shuffleFeed();
}

// Récupérer les Wikisources selon le filtre de langue
function getActiveWikisources() {
    if (selectedLang === 'all') return WIKISOURCES;
    return WIKISOURCES.filter(w => w.lang === selectedLang);
}

const GENRE_COLORS = {
    'poésie': '#bf5af2', 'poetry': '#bf5af2', 'Gedicht': '#bf5af2', 'poesia': '#bf5af2', 'poema': '#bf5af2',
    'fable': '#30d158', 'Fabel': '#30d158', 'favola': '#30d158', 'fábula': '#30d158',
    'conte': '#ff9f0a', 'tale': '#ff9f0a', 'Märchen': '#ff9f0a', 'racconto': '#ff9f0a', 'cuento': '#ff9f0a',
    'nouvelle': '#ff453a', 'story': '#ff453a', 'Novelle': '#ff453a', 'novella': '#ff453a',
    'théâtre': '#64d2ff', 'drama': '#64d2ff', 'theater': '#64d2ff', 'teatro': '#64d2ff',
    'texte': '#6e6e73', 'text': '#6e6e73',
    'mystique': '#ffd60a', 'mystic': '#ffd60a',
    'philosophie': '#ac8e68', 'philosophy': '#ac8e68',
    'roman': '#ff6482', 'novel': '#ff6482', 'Roman': '#ff6482', 'romanzo': '#ff6482'
};

// Graphe dynamique des connexions (enrichi au fur et à mesure)
let authorConnections = {};

let state = {
    likes: new Set(), readCount: 0, loading: false, cache: new Map(),
    textPool: [], shownPages: new Set(), cardIdx: 0,
    authorStats: {}, genreStats: {},
    likedAuthors: new Set(), discoveredConnections: new Set(),
    achievements: [], readingPath: [],
    // Statistiques de lecture
    readingStats: {
        totalWordsRead: 0,
        totalReadingTime: 0, // en secondes
        streak: 0,
        lastReadDate: null,
        sessionsToday: 0,
        bestStreak: 0,
        dailyWords: {} // { 'YYYY-MM-DD': wordsCount }
    }
};

// Timer de lecture
let readingTimer = null;
let sessionStartTime = null;


// Recherche via l'API - supporte plusieurs Wikisources
async function searchTexts(query, limit = 20, wikisource = currentWikisource) {
    const url = `${wikisource.url}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${limit}&srnamespace=0&format=json&origin=*`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        const results = (data.query?.search || []).map(r => ({ ...r, lang: wikisource.lang, wikisource }));

        return results;
    } catch (e) { 
        console.error('searchTexts error:', e);
        return []; 
    }
}

// Récupère le texte avec gestion intelligente (multilingue)
async function fetchText(page, depth = 0, wikisource = currentWikisource) {
    if (depth > 4) {

        return null;
    }
    
    // Filtrage précoce des pages indésirables
    if (!isValidTitle(page)) {

        return null;
    }
    
    const cacheKey = `${wikisource.lang}:${page}`;
    if (state.cache.has(cacheKey)) return state.cache.get(cacheKey);

    // Requête enrichie : texte + catégories + liens pour analyse du graphe
    const url = `${wikisource.url}/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=text|displaytitle|categories|links&pllimit=500&format=json&origin=*&redirects=true`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) return null;
        
        if (data.parse?.text) {
            // Vérifier le displaytitle aussi
            const displayTitle = data.parse.displaytitle || '';
            if (!isValidTitle(displayTitle)) return null;
            
            const html = data.parse.text['*'];
            const links = data.parse.links || [];
            
            // ═══ ANALYSE DU GRAPHE DES LIENS ═══
            // Compter les liens vers des sous-pages (même préfixe + "/")
            const basePage = page.split('/')[0];
            const subPageLinks = links.filter(l => {
                const title = l['*'] || '';
                return title.startsWith(basePage + '/') && l.ns === 0;
            });
            
            // Si la page a beaucoup de liens vers ses sous-pages, c'est un sommaire
            const isLikelySommaire = subPageLinks.length >= 5;
            
            if (isLikelySommaire && subPageLinks.length > 0) {
                // Choisir une sous-page au hasard et la suivre
                const randomSub = subPageLinks[Math.floor(Math.random() * subPageLinks.length)];

                return await fetchText(randomSub['*'], depth + 1, wikisource);
            }
            
            const analysis = analyzeHtml(html);
            
            // Si page d'index classique (redirections, éditions multiples)
            if (analysis.isIndex && analysis.subLink) {
                return await fetchText(analysis.subLink, depth + 1, wikisource);
            }
            
            // ═══ ANALYSE STATISTIQUE DE QUALITÉ ═══
            // Filtrage des "faux textes" (pages de garde, listes, etc.)
            const quality = analyzeContentQuality(analysis.text, links, page);
            if (!quality.isGood) {

                 // Si c'est rejeté parce que c'est un sommaire/liste, on essaie de trouver un lien pertinent
                 if (quality.reason === 'link_density' || quality.reason === 'listy') {
                     const contentLinks = links.filter(l => l.ns === 0 && !l['*'].includes(':'));
                     if (contentLinks.length > 0) {
                         const randomLink = contentLinks[Math.floor(Math.random() * contentLinks.length)];
                         return await fetchText(randomLink['*'], depth + 1, wikisource);
                     }
                 }
                 return null;
            }

            if (analysis.text && analysis.text.length > 150) {
                // Nettoyer le titre (supprimer HTML et spans)
                let cleanTitle = (data.parse.displaytitle || page)
                    .replace(/<[^>]+>/g, '')  // Supprimer tout HTML
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/mw-page-title[^\s]*/gi, '')  // Supprimer classes MW résiduelles
                    .trim();
                
                // Double vérification du titre nettoyé
                if (!isValidTitle(cleanTitle)) return null;
                
                // ===== DÉTECTION AUTEUR (multilingue) =====
                let detectedAuthor = null;
                
                // 1. Chercher dans les liens de la page (liens "Auteur:XXX" / "Author:XXX" / etc.)
                const authorPrefixes = ['Auteur:', 'Author:', 'Autor:', 'Autore:', '作者:'];
                const links = data.parse.links || [];
                for (const link of links) {
                    const linkTitle = link['*'] || '';
                    for (const prefix of authorPrefixes) {
                        if (linkTitle.startsWith(prefix)) {
                            const authorName = linkTitle.replace(prefix, '').trim();
                            if (authorName.length > 2 && authorName.length < 50) {
                                detectedAuthor = authorName;
                                break;
                            }
                        }
                    }
                    if (detectedAuthor) break;
                }
                
                // 2. Chercher dans les catégories (patterns multilingues)
                if (!detectedAuthor) {
                    const categories = data.parse.categories || [];
                    for (const cat of categories) {
                        const catName = cat['*'] || '';
                        // Patterns multilingues
                        const authorMatch = catName.match(/(?:Textes|Poèmes|Œuvres|Works|Texts|Poems|Werke|Opere|Obras)\s+(?:de|by|von|di)\s+(.+)/i);
                        if (authorMatch && authorMatch[1].length > 2) {
                            detectedAuthor = authorMatch[1].trim();
                            break;
                        }
                    }
                }
                
                // 3. Chercher un lien Auteur: dans le HTML
                if (!detectedAuthor) {
                    detectedAuthor = analysis.authorFromHtml;
                }
                
                const result = { 
                    text: analysis.text, 
                    title: cleanTitle,
                    author: detectedAuthor,
                    lang: wikisource.lang,
                    wikisource: wikisource
                };
                state.cache.set(cacheKey, result);
                return result;
            }
        }
        return null;
    } catch (e) { return null; }
}

function analyzeHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // ===== EXTRAIRE L'AUTEUR DEPUIS LE HTML =====
    let authorFromHtml = null;
    
    // 1. Chercher les liens "Auteur:XXX" dans le HTML
    const authorLinks = div.querySelectorAll('a[href*="Auteur:"]');
    for (const a of authorLinks) {
        const href = a.getAttribute('href') || '';
        const match = href.match(/Auteur:([^"&?#]+)/);
        if (match) {
            authorFromHtml = decodeURIComponent(match[1]).replace(/_/g, ' ').trim();
            break;
        }
    }
    
    // 2. Chercher dans les éléments de header/metadata Wikisource
    if (!authorFromHtml) {
        const headerAuthor = div.querySelector('.ws-author, .author, .auteur, [class*="auteur"]');
        if (headerAuthor) {
            const authorText = headerAuthor.textContent.trim();
            if (authorText.length > 2 && authorText.length < 50) {
                authorFromHtml = authorText;
            }
        }
    }
    
    // 3. Chercher le pattern "par XXX" ou "de XXX" en début de page
    if (!authorFromHtml) {
        const firstLines = div.textContent.substring(0, 500);
        const parMatch = firstLines.match(/(?:^|\n)\s*(?:par|de)\s+([A-ZÀ-Ü][a-zà-ü]+(?:\s+(?:de\s+)?[A-ZÀ-Ü][a-zà-ü\-]+){0,3})\s*(?:\n|$)/m);
        if (parMatch && parMatch[1].length > 3 && parMatch[1].length < 40) {
            authorFromHtml = parMatch[1].trim();
        }
    }
    
    // Supprimer tous les spans avec page-title AVANT toute analyse
    div.querySelectorAll('span[class*="page-title"], .mw-page-title-main, .mw-page-title').forEach(el => el.remove());
    
    // Détecter page d'index/sommaire (simplifié - seulement les cas évidents)
    const isRedirect = !!div.querySelector('.redirectMsg');
    const txt = div.textContent;
    const hasEditions = txt.includes('propose plusieurs éditions') || 
                       txt.includes('Cette page répertorie');
    
    // Seulement les redirections et pages d'éditions multiples sont des index
    const isIndex = isRedirect || hasEditions;
    
    // Trouver un sous-lien utile si c'est un index
    let subLink = null;
    if (isIndex) {
        const links = div.querySelectorAll('a[href^="/wiki/"]');
        for (const a of links) {
            const href = a.getAttribute('href');
            if (href && !href.includes(':') && !href.includes('Auteur') && !href.includes('Discussion')) {
                const name = decodeURIComponent(href.replace('/wiki/', ''));
                // Chercher des pages qui ressemblent à du contenu réel
                if (name.includes('/') && !name.endsWith('/')) {
                    // Éviter les pages de métadonnées
                    if (!name.includes('Préface') && !name.includes('Notice') && 
                        !name.includes('Table') && !name.includes('Index')) {
                        subLink = name;
                        break;
                    }
                }
            }
        }
    }
    
    // Nettoyer - supprimer tous les éléments non désirés
    div.querySelectorAll('.ws-noexport, .noprint, .mw-editsection, script, style, .reference, .toc, .navbox, .infobox, .metadata, .hatnote, .ambox, .catlinks, .mw-headline, .redirectMsg, .homonymie, .bandeau-homonymie, .bandeau-portail, .headertemplate, .ws-header, .mw-page-title-main, .mw-page-title, span[class*="page-title"], .titreoeuvre, .auteur-oeuvre, .header').forEach(el => el.remove());
    
    let content = div.querySelector('.prp-pages-output, .poem') || div.querySelector('.mw-parser-output') || div;
    
    // Supprimer TOUS les spans de MediaWiki
    content.querySelectorAll('span').forEach(el => {
        const cls = el.className || '';
        if (cls.includes('page-title') || cls.includes('mw-') || cls.includes('ws-')) {
            el.remove();
        }
    });
    
    let text = content.innerText || content.textContent;
    
    // Nettoyer les résidus HTML et MediaWiki
    text = text.replace(/\[modifier[^\]]*\]/g, '').replace(/\[\d+\]/g, '')
               .replace(/modifier le wikicode/gi, '').replace(/\n{3,}/g, '\n\n')
               .replace(/<span[^>]*>|<\/span>/gi, '')  // Supprimer spans résiduels
               .replace(/<[^>]+>/g, '')  // Supprimer tout HTML résiduel
               .replace(/mw-page-title[^\s]*/gi, '')  // Supprimer classes MW
               .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
               .replace(/Poésies \([^)]+\)/g, '')  // Supprimer titres de recueils parasites
               .trim();
    
    // Enlever métadonnées, préfaces, mentions de conférence en début
    const lines = text.split('\n');
    let start = 0;
    for (let i = 0; i < Math.min(15, lines.length); i++) {
        const l = lines[i].toLowerCase();
        const line = lines[i].trim();
        if (l.includes('sommaire') || l.includes('édition') || l.includes('navigation') || 
            l.includes('conférence') || l.includes('présenté') || l.includes('siège') ||
            l.includes('présidée par') || l.includes('professeur') || l.includes('faculté') ||
            l.includes('mw-page-title') || l.includes('span class') ||
            line.length < 3 || (line.startsWith('(') && line.endsWith(')'))) {
            start = i + 1;
        } else if (line.length > 40) break;
    }
    text = lines.slice(start).join('\n').trim();
    
    if (text.length > 5000) {
        text = text.substring(0, 5000);
        const cut = Math.max(text.lastIndexOf('\n\n'), text.lastIndexOf('. '));
        if (cut > 4000) text = text.substring(0, cut + 1);
        text += '\n\n[...]';
    }
    
    // ═══ DÉTECTION ROBUSTE DES SCORIES ═══
    if (isLikelyJunk(text)) {
        return { text: '', isIndex: true, subLink, authorFromHtml };
    }
    
    return { text, isIndex, subLink, authorFromHtml };
}

// ═══════════════════════════════════════════════════════════
// 🛡️ FILTRE MINIMAL - On laisse le graphe des liens faire le travail
// ═══════════════════════════════════════════════════════════
function isLikelyJunk(text) {
    // Filtre minimal : juste vérifier qu'il y a du contenu
    if (!text || text.length < 100) return true;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return true;
    return false;
}

// ═══════════════════════════════════════════════════════════
// 🕸️ EXPLORATION PAR ARBORESCENCE (Catégories)
// ═══════════════════════════════════════════════════════════

let currentCategoryPath = [];
let currentBrowseMode = null; // 'category' ou 'search'

// Branches enrichies par genre (auteurs majeurs + courants)
const GENRE_BRANCHES = {
    'philosophie': {
        'Courants': ['Rationalisme', 'Empirisme', 'Idéalisme', 'Existentialisme', 'Stoïcisme', 'Épicurisme', 'Scepticisme', 'Phénoménologie'],
        'Domaines': ['Métaphysique', 'Éthique', 'Épistémologie', 'Logique', 'Esthétique', 'Philosophie politique', 'Ontologie'],
        'Antiquité': ['Platon', 'Aristote', 'Épictète', 'Marc Aurèle', 'Sénèque', 'Cicéron', 'Lucrèce'],
        'XVIIe siècle': ['Descartes', 'Pascal', 'Spinoza', 'Leibniz', 'Malebranche', 'Hobbes', 'Locke'],
        'XVIIIe siècle': ['Voltaire', 'Rousseau', 'Montesquieu', 'Diderot', 'Hume', 'Kant', 'Condillac'],
        'XIXe siècle': ['Hegel', 'Schopenhauer', 'Nietzsche', 'Kierkegaard', 'Comte', 'Marx', 'Bergson']
    },
    'poésie': {
        'Formes': ['Sonnet', 'Ode', 'Élégie', 'Ballade', 'Fable', 'Épopée', 'Haïku'],
        'Mouvements': ['Romantisme', 'Parnasse', 'Symbolisme', 'Surréalisme', 'Baroque'],
        'XVIe siècle': ['Ronsard', 'Du Bellay', 'Louise Labé', 'Marot'],
        'XVIIe siècle': ['La Fontaine', 'Malherbe', 'Boileau', 'Racine'],
        'XIXe siècle': ['Hugo', 'Baudelaire', 'Verlaine', 'Rimbaud', 'Mallarmé', 'Lamartine', 'Musset', 'Nerval'],
        'XXe siècle': ['Apollinaire', 'Éluard', 'Aragon', 'Prévert', 'Char', 'Valéry']
    },
    'roman': {
        'Genres': ['Roman épistolaire', 'Roman historique', 'Roman réaliste', 'Roman naturaliste', 'Roman psychologique'],
        'XVIIe siècle': ['Madame de La Fayette', 'Scarron', 'Fénelon'],
        'XVIIIe siècle': ['Voltaire', 'Rousseau', 'Diderot', 'Laclos', 'Prévost', 'Bernardin de Saint-Pierre'],
        'XIXe siècle': ['Balzac', 'Stendhal', 'Flaubert', 'Zola', 'Maupassant', 'Hugo', 'Dumas', 'Sand'],
        'XXe siècle': ['Proust', 'Gide', 'Céline', 'Camus', 'Sartre', 'Colette']
    },
    'théâtre': {
        'Genres': ['Tragédie', 'Comédie', 'Drame', 'Farce', 'Vaudeville'],
        'Antiquité': ['Sophocle', 'Euripide', 'Eschyle', 'Aristophane', 'Plaute', 'Térence'],
        'XVIIe siècle': ['Molière', 'Racine', 'Corneille', 'Marivaux'],
        'XVIIIe siècle': ['Beaumarchais', 'Voltaire', 'Marivaux'],
        'XIXe siècle': ['Hugo', 'Musset', 'Rostand', 'Labiche'],
        'XXe siècle': ['Claudel', 'Giraudoux', 'Anouilh', 'Ionesco', 'Beckett']
    },
    'conte': {
        'Types': ['Conte merveilleux', 'Conte philosophique', 'Conte moral', 'Conte fantastique'],
        'Auteurs': ['Perrault', 'Grimm', 'Andersen', 'Voltaire', 'Maupassant', 'Hoffmann']
    },
    'nouvelle': {
        'Styles': ['Nouvelle réaliste', 'Nouvelle fantastique', 'Nouvelle psychologique'],
        'Auteurs': ['Maupassant', 'Mérimée', 'Balzac', 'Flaubert', 'Zola', 'Villiers de l\'Isle-Adam']
    },
    'mystique': {
        'Traditions': ['Mystique chrétienne', 'Mystique soufie', 'Kabbale'],
        'Auteurs': ['Thérèse d\'Avila', 'Jean de la Croix', 'Maître Eckhart', 'François de Sales', 'Fénelon', 'Bossuet']
    },
    'fable': {
        'Auteurs': ['La Fontaine', 'Ésope', 'Phèdre', 'Florian']
    },
    'histoire': {
        'Périodes': ['Antiquité', 'Moyen Âge', 'Renaissance', 'Révolution française', 'XIXe siècle'],
        'Historiens': ['Hérodote', 'Thucydide', 'Tacite', 'Michelet', 'Tocqueville', 'Voltaire']
    }
};

// Mappage des genres simples vers les catégories racines Wikisource
const CATEGORY_ROOTS = {
    fr: {
        'poésie': 'Catégorie:Poésie',
        'roman': 'Catégorie:Romans',
        'théâtre': 'Catégorie:Théâtre',
        'philosophie': 'Catégorie:Philosophie',
        'conte': 'Catégorie:Contes',
        'fable': 'Catégorie:Fables',
        'nouvelle': 'Catégorie:Nouvelles',
        'essai': 'Catégorie:Essais',
        'histoire': 'Catégorie:Histoire',
        'lettres': 'Catégorie:Correspondances',
        'mystique': 'Catégorie:Textes_spirituels'
    },
    en: {
        'poetry': 'Category:Poetry',
        'novel': 'Category:Novels',
        'drama': 'Category:Plays',
        'philosophy': 'Category:Philosophy',
        'tale': 'Category:Tales',
        'history': 'Category:History',
        'essay': 'Category:Essays'
    },
    de: {
        'Gedicht': 'Kategorie:Gedicht_Titel',
        'Roman': 'Kategorie:Roman',
        'Märchen': 'Kategorie:Märchen'
    }
};

async function exploreCategory(genreOrCategoryName, isSubCat = false) {
    const wikisource = currentWikisource;
    const lang = wikisource.lang;
    const genreLower = genreOrCategoryName.toLowerCase();
    
    // Afficher l'UI
    document.getElementById('categoryNav').style.display = 'block';
    document.getElementById('catSubcategories').innerHTML = '<div style="color:var(--muted)">Chargement...</div>';
    document.getElementById('feed').innerHTML = '';
    state.textPool = [];
    
    // Cas 1: C'est un genre racine avec branches enrichies
    if (!isSubCat && GENRE_BRANCHES[genreLower]) {
        currentCategoryPath = [genreOrCategoryName];
        currentBrowseMode = 'branches';
        renderBreadcrumbs();
        renderEnrichedBranches(genreLower);
        return;
    }
    
    // Cas 2: C'est une branche (recherche par terme)
    if (!isSubCat) {
        currentCategoryPath = [genreOrCategoryName];
    } else if (!currentCategoryPath.includes(genreOrCategoryName)) {
        currentCategoryPath.push(genreOrCategoryName);
    } else {
        const index = currentCategoryPath.indexOf(genreOrCategoryName);
        currentCategoryPath = currentCategoryPath.slice(0, index + 1);
    }
    
    renderBreadcrumbs();
    currentBrowseMode = 'search';
    
    // Rechercher sur Wikisource
    await searchByTerm(genreOrCategoryName, wikisource);
}

// Affiche les branches enrichies pour un genre
function renderEnrichedBranches(genre) {
    const branches = GENRE_BRANCHES[genre];
    if (!branches) return;
    
    const container = document.getElementById('catSubcategories');
    let html = '<div class="branches-container">';
    
    for (const [groupName, items] of Object.entries(branches)) {
        html += `<div class="branch-group">
            <div class="branch-group-title">${groupName}</div>
            <div class="branch-items">
                ${items.map(item => `<div class="cat-pill" onclick="exploreCategory('${item.replace(/'/g, "\\'")}', true)">${item}</div>`).join('')}
            </div>
        </div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Message d'info
    document.getElementById('feed').innerHTML = '<div class="empty-state">👆 Choisissez une branche ci-dessus pour explorer les textes</div>';
}

// Recherche par terme (auteur, courant, etc.)
async function searchByTerm(term, wikisource) {
    document.getElementById('catSubcategories').innerHTML = `<div style="color:var(--muted)">🔍 Recherche "${term}"...</div>`;
    
    try {
        // Recherche élargie sur Wikisource
        const results = await searchTexts(term, 50, wikisource);
        
        // Filtrer les résultats valides
        const validResults = results.filter(r => isValidTitle(r.title) && r.snippet?.length > 20);
        
        // Info sur les résultats
        const container = document.getElementById('catSubcategories');
        if (validResults.length > 0) {
            container.innerHTML = `<div style="font-size:0.8rem; color:var(--accent);">📚 ${validResults.length} texte${validResults.length > 1 ? 's' : ''} trouvé${validResults.length > 1 ? 's' : ''} pour "${term}"</div>`;
        } else {
            container.innerHTML = `<div style="font-size:0.8rem; color:var(--muted);">Aucun résultat pour "${term}"</div>`;
        }
        
        // Remplir le pool
        state.textPool = validResults.map(r => ({
            title: r.title,
            snippet: r.snippet,
            lang: wikisource.lang,
            wikisource: wikisource,
            source: 'search_exploration'
        }));
        
        // Mélanger et charger
        state.textPool = state.textPool.sort(() => Math.random() - 0.5);
        
        if (state.textPool.length > 0) {
            loadMore();
        } else {
            document.getElementById('feed').innerHTML = `<div class="empty-state">Aucun texte trouvé pour "${term}".<br>Essayez un autre terme.</div>`;
        }
        
    } catch (e) {
        console.error('Search error:', e);
        document.getElementById('catSubcategories').innerHTML = '<div style="color:var(--accent)">Erreur de recherche</div>';
    }
}

async function fetchCategoryData(categoryName, wikisource) {
    // Récupérer sous-catégories et pages
    const url = `${wikisource.url}/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(categoryName)}&cmlimit=100&format=json&origin=*`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        const members = data.query?.categorymembers || [];
        
        const subcats = members.filter(m => m.ns === 14); // 14 = Category
        const pages = members.filter(m => m.ns === 0);    // 0 = Page
        
        renderSubcategories(subcats, pages.length);
        
        // Remplir le pool avec les pages trouvées
        state.textPool = []; // Reset pour cette catégorie
        for (const p of pages) {
            if (isValidTitle(p.title)) {
                 state.textPool.push({
                     title: p.title,
                     lang: wikisource.lang,
                     wikisource: wikisource,
                     source: 'category_exploration'
                 });
            }
        }
        

        
        // Mélanger et charger
        state.textPool = state.textPool.sort(() => Math.random() - 0.5);
        
        if (state.textPool.length > 0) {
            loadMore();
        } else if (subcats.length === 0) {
            document.getElementById('feed').innerHTML = '<div class="empty-state">Aucun texte direct dans cette catégorie.<br>Essayez une autre branche.</div>';
        }
        
    } catch (e) {
        console.error('Category error:', e);
        document.getElementById('catSubcategories').innerHTML = '<div style="color:var(--accent)">Erreur de chargement</div>';
    }
}

function renderBreadcrumbs() {
    const container = document.getElementById('catBreadcrumbs');
    container.innerHTML = currentCategoryPath.map((cat, idx) => {
        const name = cat.split(':')[1] || cat;
        const isLast = idx === currentCategoryPath.length - 1;
        return `
            <span class="cat-crumb ${isLast ? 'active' : ''}" onclick="exploreCategory('${cat.replace(/'/g, "\\'")}', true)">${name}</span>
            ${!isLast ? '<span class="cat-sep">></span>' : ''}
        `;
    }).join('');
}

function renderSubcategories(subcats, pageCount = 0) {
    const container = document.getElementById('catSubcategories');
    
    let html = '';
    
    // Info sur les pages directes
    if (pageCount > 0) {
        html += `<div style="font-size:0.8rem; color:var(--accent); margin-bottom:0.5rem;">📚 ${pageCount} texte${pageCount > 1 ? 's' : ''} dans cette catégorie</div>`;
    }
    
    if (subcats.length === 0) {
        if (pageCount === 0) {
            html += '<div style="font-size:0.8rem; color:var(--muted); font-style:italic;">Catégorie vide ou sous-pages uniquement</div>';
        }
        container.innerHTML = html;
        return;
    }
    
    html += `<div style="font-size:0.75rem; color:var(--muted); margin-bottom:0.3rem;">↳ ${subcats.length} sous-catégorie${subcats.length > 1 ? 's' : ''} :</div>`;
    html += subcats.map(c => {
        const name = (c.title.split(':')[1] || c.title).replace(/_/g, ' ');
        return `<div class="cat-pill" onclick="exploreCategory('${c.title.replace(/'/g, "\\'")}', true)">${name}</div>`;
    }).join('');
    
    container.innerHTML = html;
}

function closeCategoryMode() {
    document.getElementById('categoryNav').style.display = 'none';
    currentCategoryPath = [];
    shuffleFeed(); // Revenir au mode normal
}

// ═══════════════════════════════════════════════════════════
// � PROJECT GUTENBERG - Classiques du domaine public
// ═══════════════════════════════════════════════════════════
async function fetchGutenberg() {
    const works = ALT_SOURCES.gutenberg.works;
    // Filtrer par langue si nécessaire
    const filtered = selectedLang === 'all' 
        ? works 
        : works.filter(w => w.lang === selectedLang);
    
    if (filtered.length === 0) return [];
    
    // Choisir une œuvre au hasard
    const work = filtered[Math.floor(Math.random() * filtered.length)];
    const cacheKey = `gutenberg:${work.id}`;
    
    // Éviter les doublons
    if (state.shownPages.has(cacheKey)) return [];
    
    try {
        // Utiliser l'API de téléchargement texte de Gutenberg
        const res = await fetch(`https://www.gutenberg.org/files/${work.id}/${work.id}-0.txt`, {
            mode: 'cors'
        }).catch(() => 
            // Fallback sur un autre format
            fetch(`https://www.gutenberg.org/cache/epub/${work.id}/pg${work.id}.txt`)
        );
        
        if (!res.ok) throw new Error('Gutenberg fetch failed');
        
        let text = await res.text();
        
        // Nettoyer le texte Gutenberg (retirer header/footer légaux)
        const startMarkers = ['*** START OF', '***START OF', 'START OF THE PROJECT'];
        const endMarkers = ['*** END OF', '***END OF', 'END OF THE PROJECT', 'End of Project'];
        
        for (const marker of startMarkers) {
            const idx = text.indexOf(marker);
            if (idx !== -1) {
                const nextLine = text.indexOf('\n', idx);
                text = text.substring(nextLine + 1);
                break;
            }
        }
        
        for (const marker of endMarkers) {
            const idx = text.indexOf(marker);
            if (idx !== -1) {
                text = text.substring(0, idx);
                break;
            }
        }
        
        // Prendre un extrait aléatoire (pas tout le livre!)
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 100);
        if (paragraphs.length > 10) {
            // Choisir un passage au hasard (pas le début)
            const startIdx = Math.floor(Math.random() * Math.max(1, paragraphs.length - 10)) + 5;
            const excerpt = paragraphs.slice(startIdx, startIdx + 5).join('\n\n');
            

            
            return [{
                title: work.title,
                text: excerpt.trim(),
                author: work.author,
                source: 'gutenberg',
                lang: work.lang,
                gutenbergId: work.id
            }];
        }
    } catch (e) {
        console.error('Gutenberg error:', work.title, e);
    }
    return [];
}

// ═══════════════════════════════════════════════════════════
// �📜 POETRYDB - Poésie anglaise de qualité (pas de scories!)
// ═══════════════════════════════════════════════════════════
async function fetchPoetryDB() {
    const authors = ALT_SOURCES.poetrydb.authors;
    const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
    
    try {
        const res = await fetch(`https://poetrydb.org/author/${encodeURIComponent(randomAuthor)}/title,author,lines`);
        const poems = await res.json();
        
        if (Array.isArray(poems) && poems.length > 0) {
            // Prendre quelques poèmes au hasard
            const shuffled = poems.sort(() => Math.random() - 0.5).slice(0, 5);

            
            return shuffled.map(poem => ({
                title: poem.title,
                text: poem.lines.join('\n'),
                author: poem.author,
                source: 'poetrydb',
                lang: 'en'
            }));
        }
    } catch (e) {
        console.error('PoetryDB error:', e);
    }
    return [];
}

// ═══════════════════════════════════════════════════════════
// 🌍 ALIMENTER LE POOL - Littérature mondiale
// ═══════════════════════════════════════════════════════════
async function fillPool() {
    // === 1. POETRYDB (si anglais actif) - Qualité garantie ===
    if (selectedLang === 'all' || selectedLang === 'en') {
        try {
            const poems = await fetchPoetryDB();
            for (const poem of poems) {
                if (!state.shownPages.has('poetrydb:' + poem.title)) {
                    // Ajouter EN PRIORITÉ (pas de scories!)
                    state.textPool.unshift({
                        title: poem.title,
                        text: poem.text,
                        author: poem.author,
                        lang: 'en',
                        source: 'poetrydb',
                        isPreloaded: true // Texte déjà chargé
                    });
                }
            }
        } catch (e) {
            console.error('PoetryDB fillPool error:', e);
        }
    }
    
    // === 1.5 PROJECT GUTENBERG - Classiques du domaine public ===
    try {
        const gutenbergTexts = await fetchGutenberg();
        for (const item of gutenbergTexts) {
            state.textPool.unshift({
                ...item,
                isPreloaded: true
            });
        }
    } catch (e) {
        console.error('Gutenberg fillPool error:', e);
    }
    
    // === 2. WIKISOURCE (sources traditionnelles) ===
    const activeSources = getActiveWikisources();
    if (activeSources.length === 0 && state.textPool.length === 0) {
        console.error('Aucune source active');
        return;
    }
    const shuffledSources = [...activeSources].sort(() => Math.random() - 0.5).slice(0, Math.min(3, activeSources.length));
    

    
    for (const ws of shuffledSources) {
        const terms = [...(SEARCH_TERMS[ws.lang] || SEARCH_TERMS.en)];
        const selectedTerms = terms.sort(() => Math.random() - 0.5).slice(0, 5);
        
        for (const term of selectedTerms) {
            try {
                const results = await searchTexts(term, 15, ws);
                for (const r of results) {
                    if (!state.shownPages.has(r.title) && !state.textPool.some(t => t.title === r.title)) {
                        // Filtrage généraliste par structure du titre
                        if (isValidTitle(r.title) && r.snippet?.length > 20) {
                            // Prioriser les sous-pages (contenu réel)
                            const item = { 
                                title: r.title, 
                                snippet: r.snippet, 
                                lang: ws.lang,
                                wikisource: ws 
                            };
                            if (r.title.includes('/')) {
                                state.textPool.unshift(item);
                            } else {
                                state.textPool.push(item);
                            }
                        }
                    }
                }
            } catch (e) { 
                console.error('fillPool error:', e);
            }
        }
    }
    state.textPool = [...state.textPool].sort(() => Math.random() - 0.5);
}

// Filtrage généraliste du titre (exclut les pages non littéraires)
function isValidTitle(title) {
    if (!title || title.length < 3) return false;
    const t = title.toLowerCase();
    
    // Exclure les namespaces spéciaux (universel)
    if (t.includes('category:') || t.includes('catégorie:') || 
        t.includes('kategorie:') || t.includes('categoria:')) return false;
    
    // Liste étendue des namespaces wiki
    if (/^(help|aide|hilfe|aiuto|ayuda|ajuda|manual|project|projet|image|file|fichier|template|modèle|module|media|special|spécial):/i.test(t)) return false;

    if (t.includes('author:') || t.includes('auteur:') || 
        t.includes('autor:') || t.includes('autore:')) return false;
    if (t.includes('talk:') || t.includes('discussion:') || 
        t.includes('diskussion:') || t.includes('discussione:')) return false;
    if (t.includes('index:') || t.includes('page:') || t.includes('file:')) return false;
    
    // Exclure les listes (pattern universel)
    if (/^list[ea]?\s+(de|of|di|von)/i.test(t)) return false;
    if (t.startsWith('index ') || t.endsWith(' index')) return false;
    if (t.includes('table des matières') || t.includes('table of contents') || t.includes('inhaltsverzeichnis')) return false;
    if (t.includes('bibliographie') || t.includes('bibliography')) return false;
    
    // Exclure les études biographiques et critiques (souvent des pages de garde)
    if (t.includes('sa vie et son œuvre') || t.includes('sa vie et son oeuvre')) return false;
    if (t.includes('his life and work') || t.includes('sein leben')) return false;
    if (t.includes('étude biographique') || t.includes('étude sur')) return false;
    if (t.includes('biographical study') || t.includes('biography of')) return false;
    if (/\bbiograph/i.test(t) && !t.includes('/')) return false;
    
    // Exclure les œuvres complètes sans sous-page (ce sont des sommaires)
    if ((t.includes('œuvres complètes') || t.includes('complete works') || 
         t.includes('gesammelte werke') || t.includes('opere complete')) && !t.includes('/')) return false;
    
    return true;
}

// ═══════════════════════════════════════════════════════════
// 🕵️ ANALYSE DE QUALITÉ DU CONTENU (Heuristiques)
// ═══════════════════════════════════════════════════════════
function analyzeContentQuality(text, links, title) {
    if (!text) return { isGood: false, reason: 'empty' };
    const len = text.length;
    
    // 1. Trop court = Fragment ou erreur
    if (len < 300) return { isGood: false, reason: 'too_short' };
    
    // 2. Trop long = Livre entier non découpé (mauvaise UX)
    if (len > 80000) return { isGood: false, reason: 'too_long' };
    
    // 3. Densité de liens (Link Density)
    // Si une page est composée à 20% de liens, c'est un sommaire/hub
    // On estime ~30 chars par lien en moyenne (titre + balise)
    const linkCharsEstimate = links.length * 30;
    const linkDensity = linkCharsEstimate / len;
    
    // Seuil : > 25% de liens = Sommaire
    if (linkDensity > 0.25) return { isGood: false, reason: 'link_density' };
    
    // 4. Structure "Paragraphe" vs "Liste"
    // Un vrai texte a des phrases qui finissent par des points.
    // Une liste a des retours à la ligne fréquents sans ponctuation.
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const avgLineLength = len / Math.max(1, lines.length);
    
    // Si lignes très courtes (< 50 chars) ET pas de ponctuation finale
    if (avgLineLength < 60) {
        // Exception pour la poésie : lignes courtes mais strophes
        // Vérifier la ponctuation
        const linesEndingWithPunctuation = lines.filter(l => /[.!?…:;]$/.test(l.trim())).length;
        const punctuationRatio = linesEndingWithPunctuation / lines.length;
        
        // Si peu de ponctuation finale (< 30%), c'est une liste brute
        if (punctuationRatio < 0.3) return { isGood: false, reason: 'listy' };
    }
    
    // 5. Structure Words (Meta-titres)
    const t = title.toLowerCase();
    const badWords = ['sommaire', 'contents', 'inhalt', 'table', 'index', 'chapitres', 'chapters'];
    if (badWords.some(w => t.includes(w))) return { isGood: false, reason: 'title_blacklist' };

    return { isGood: true };
}

// Normalise un nom d'auteur (simplifié - accepte tout nom valide)
function normalizeAuthor(rawAuthor) {
    if (!rawAuthor) return null;
    // Nettoyer le nom
    let clean = rawAuthor
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Vérifier que c'est un nom valide (commence par majuscule, longueur raisonnable)
    if (clean.length > 2 && clean.length < 60 && /^[A-ZÀ-ÜА-Яぁ-んァ-ン一-龯\u0600-\u06FF]/.test(clean)) {
        return clean;
    }
    return null;
}

function detectAuthor(title, text, metadataAuthor = null) {
    // 1. PRIORITÉ : Auteur des métadonnées Wikisource (liens, catégories)
    if (metadataAuthor) {
        const normalized = normalizeAuthor(metadataAuthor);
        if (normalized) return normalized;
    }
    
    // 2. Chercher dans le titre (format "Œuvre (Auteur)")
    const parenthMatch = title.match(/\(([^)]+)\)$/);
    if (parenthMatch) {
        const potentialAuthor = parenthMatch[1].trim();
        // Vérifier que ça ressemble à un nom de personne
        if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü]+)*$/.test(potentialAuthor)) {
            return potentialAuthor;
        }
    }
    
    // 3. Chercher dans le titre - format "Auteur - Œuvre" ou "Œuvre - Auteur"
    const dashMatch = title.match(/^([^—–\-]+)[—–\-](.+)$/);
    if (dashMatch) {
        const part1 = dashMatch[1].trim();
        const part2 = dashMatch[2].trim();
        // Tester si l'une des parties est un nom de personne
        if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü]+)*$/.test(part1)) return part1;
        if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü]+)*$/.test(part2)) return part2;
    }
    
    return 'Anonyme';
}

function detectTag(title, text) {
    const t = (title + ' ' + (text || '').substring(0, 500)).toLowerCase();
    const titleLower = title.toLowerCase();
    
    // Théâtre (prioritaire - mots très spécifiques)
    if (t.includes('acte ') || t.includes('scène ') || titleLower.includes('tragédie') || 
        titleLower.includes('comédie') || t.includes('personnages:') || t.includes('le chœur')) return 'théâtre';
    
    // Fable (prioritaire)
    if (titleLower.includes('fable') || (t.includes('morale') && t.includes('la fontaine'))) return 'fable';
    
    // Conte
    if (titleLower.includes('conte') || titleLower.includes('il était une fois')) return 'conte';
    
    // Poésie (mots spécifiques au genre)
    if (titleLower.includes('sonnet') || titleLower.includes('poème') || titleLower.includes('poésie') ||
        titleLower.includes('ode ') || titleLower.includes('ballade') || titleLower.includes('élégie') ||
        titleLower.includes('stances') || titleLower.includes('hymne') || titleLower.includes('rondeau') ||
        titleLower.includes('complainte') || titleLower.includes('chanson')) return 'poésie';
    // Détection poésie par structure (vers courts, rimes)
    const lines = (text || '').split('\n').slice(0, 20);
    const shortLines = lines.filter(l => l.trim().length > 5 && l.trim().length < 60);
    if (shortLines.length > 10) return 'poésie';
    
    // Nouvelle
    if (titleLower.includes('nouvelle')) return 'nouvelle';
    
    // Roman
    if (titleLower.includes('chapitre') || titleLower.includes('roman') || 
        titleLower.includes('livre ') || titleLower.includes('partie ')) return 'roman';
    
    // Philosophie (termes spécifiques)
    if (titleLower.includes('pensées') || titleLower.includes('maximes') || titleLower.includes('réflexions') ||
        titleLower.includes('essai') || titleLower.includes('discours sur') || titleLower.includes('traité') ||
        titleLower.includes('lettres à') || titleLower.includes('entretiens')) return 'philosophie';
    
    // Mystique (termes TRÈS spécifiques seulement)
    if (titleLower.includes('sermon') || titleLower.includes('oraison') || titleLower.includes('prière') ||
        titleLower.includes('méditation') || titleLower.includes('spirituel') || titleLower.includes('mystique') ||
        titleLower.includes('contemplation') || titleLower.includes('extase') || titleLower.includes('château intérieur') ||
        titleLower.includes('nuit obscure') || titleLower.includes('imitation de')) return 'mystique';
    
    return 'texte';
}

async function init() {
    // Initialiser Supabase (social features)
    initSupabase();
    
    loadState();
    
    // Restaurer le choix de langue ou détecter automatiquement
    const savedLang = localStorage.getItem('palimpseste_lang');
    const validLangs = ['all', ...WIKISOURCES.map(w => w.lang)];
    
    if (savedLang && validLangs.includes(savedLang)) {
        // Utiliser la langue sauvegardée
        selectedLang = savedLang;
    } else {
        // Détecter la langue du navigateur
        const browserLang = (navigator.language || navigator.userLanguage || 'fr').split('-')[0].toLowerCase();
        // Si la langue du navigateur est supportée, l'utiliser, sinon français par défaut
        selectedLang = validLangs.includes(browserLang) ? browserLang : 'fr';
        localStorage.setItem('palimpseste_lang', selectedLang);
    }
    
    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = selectedLang;
    
    updateStats();
    updateConnections();
    renderAchievements();
    renderReadingPath();
    renderFavorites();
    updateFavCount();
    updateFunStat();
    
    document.getElementById('loading').style.display = 'block';
    await fillPool();
    document.getElementById('loading').style.display = 'none';
    await loadMore();
    
    // Mise à jour périodique du fun stat
    setInterval(updateFunStat, 15000);
    
    window.onscroll = () => {
        document.getElementById('progress').style.width = 
            (scrollY / (document.body.scrollHeight - innerHeight) * 100) + '%';
        if (innerHeight + scrollY >= document.body.scrollHeight - 800 && !state.loading) loadMore();
    };
}

function loadState() {
    try {
        const d = JSON.parse(localStorage.getItem('palimpseste') || '{}');
        state.likes = new Set(d.likes || []);
        state.readCount = d.readCount || 0;
        state.authorStats = d.authorStats || {};
        state.genreStats = d.genreStats || {};
        state.likedAuthors = new Set(d.likedAuthors || []);
        state.discoveredConnections = new Set(d.discoveredConnections || []);
        state.achievements = d.achievements || [];
        state.readingPath = d.readingPath || [];
        state.favorites = d.favorites || [];
        // Charger les stats de lecture
        state.readingStats = d.readingStats || {
            totalWordsRead: 0,
            totalReadingTime: 0,
            streak: 0,
            lastReadDate: null,
            sessionsToday: 0,
            bestStreak: 0,
            dailyWords: {}
        };
        // Vérifier et mettre à jour le streak au chargement
        checkAndUpdateStreak();
    } catch(e) {}
}

function saveState() {
    localStorage.setItem('palimpseste', JSON.stringify({ 
        likes: [...state.likes], 
        readCount: state.readCount,
        authorStats: state.authorStats,
        genreStats: state.genreStats,
        likedAuthors: [...state.likedAuthors],
        discoveredConnections: [...state.discoveredConnections],
        achievements: state.achievements || [],
        readingPath: state.readingPath || [],
        favorites: state.favorites || [],
        readingStats: state.readingStats
    }));
    updateStats();
}

function updateStats() {
    // Mettre à jour les stats du panneau
    document.getElementById('totalRead').textContent = state.readCount;
    document.getElementById('likeCountPanel').textContent = state.likes.size;
    document.getElementById('authorCount').textContent = Object.keys(state.authorStats).length;
    
    // Titre dynamique selon le contexte
    updateDynamicHeader();
    
    // Mettre à jour les barres d'auteurs
    renderAuthorBars();
    renderGenreChart();
    
    // Mettre à jour les statistiques de lecture
    updateReadingStatsUI();
}

// ═══════════════════════════════════════════════════════════
// 📊 STATISTIQUES DE LECTURE
// ═══════════════════════════════════════════════════════════

function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

function checkAndUpdateStreak() {
    const stats = state.readingStats;
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (!stats.lastReadDate) {
        stats.streak = 0;
    } else if (stats.lastReadDate === today) {
        // Déjà lu aujourd'hui, streak maintenu
    } else if (stats.lastReadDate === yesterday) {
        // A lu hier, streak continue (sera incrémenté quand il lit aujourd'hui)
    } else {
        // Streak cassé
        stats.streak = 0;
    }
}

function recordReading(wordCount) {
    const stats = state.readingStats;
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Ajouter les mots lus
    stats.totalWordsRead = (stats.totalWordsRead || 0) + wordCount;
    
    // Mots par jour
    if (!stats.dailyWords) stats.dailyWords = {};
    stats.dailyWords[today] = (stats.dailyWords[today] || 0) + wordCount;
    
    // Gérer le streak
    if (stats.lastReadDate !== today) {
        // Première lecture du jour
        if (stats.lastReadDate === yesterday || !stats.lastReadDate) {
            stats.streak = (stats.streak || 0) + 1;
        } else {
            stats.streak = 1; // Recommencer le streak
        }
        stats.lastReadDate = today;
        stats.sessionsToday = 1;
        
        // Meilleur streak
        if (stats.streak > (stats.bestStreak || 0)) {
            stats.bestStreak = stats.streak;
            if (stats.streak >= 7) {
                toast('🔥 Streak record : ' + stats.streak + ' jours !');
            }
        }
    } else {
        stats.sessionsToday = (stats.sessionsToday || 0) + 1;
    }
    
    saveState();
}

function startReadingTimer() {
    if (!sessionStartTime) {
        sessionStartTime = Date.now();
    }
}

function stopReadingTimer() {
    if (sessionStartTime) {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        state.readingStats.totalReadingTime = (state.readingStats.totalReadingTime || 0) + elapsed;
        sessionStartTime = null;
        saveState();
    }
}

function formatReadingTime(seconds) {
    if (seconds < 60) return seconds + ' sec';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours + 'h ' + mins + 'min';
}

function formatWordsCount(words) {
    if (words < 1000) return words.toString();
    if (words < 10000) return (words / 1000).toFixed(1) + 'k';
    return Math.floor(words / 1000) + 'k';
}

function updateReadingStatsUI() {
    const stats = state.readingStats;
    
    // Temps de lecture
    const timeEl = document.getElementById('totalReadingTime');
    if (timeEl) {
        timeEl.textContent = formatReadingTime(stats.totalReadingTime || 0);
    }
    
    // Mots lus
    const wordsEl = document.getElementById('totalWordsRead');
    if (wordsEl) {
        wordsEl.textContent = formatWordsCount(stats.totalWordsRead || 0);
    }
    
    // Streak
    const streakEl = document.getElementById('currentStreak');
    if (streakEl) {
        streakEl.textContent = stats.streak || 0;
    }
    
    // Barre de progression streak (objectif 7 jours)
    const progressEl = document.getElementById('streakProgress');
    if (progressEl) {
        const progress = Math.min(100, ((stats.streak || 0) / 7) * 100);
        progressEl.style.width = progress + '%';
    }
    
    // Hint streak
    const hintEl = document.getElementById('streakHint');
    if (hintEl) {
        const streak = stats.streak || 0;
        if (streak === 0) {
            hintEl.textContent = 'Commencez à lire pour démarrer votre streak !';
        } else if (streak < 3) {
            hintEl.textContent = `${streak} jour${streak > 1 ? 's' : ''} - Continuez demain !`;
        } else if (streak < 7) {
            hintEl.textContent = `🔥 ${streak} jours ! Plus que ${7 - streak} pour la semaine complète !`;
        } else if (streak < 30) {
            hintEl.textContent = `🔥🔥 ${streak} jours ! Vers le mois complet !`;
        } else {
            hintEl.textContent = `🏆 ${streak} jours ! Incroyable dévotion !`;
        }
    }
    
    // Graphique hebdomadaire
    renderWeeklyChart();
}

function renderWeeklyChart() {
    const container = document.getElementById('weeklyChart');
    if (!container) return;
    
    const stats = state.readingStats;
    const dailyWords = stats.dailyWords || {};
    const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const today = new Date();
    
    // Obtenir les 7 derniers jours
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();
        weekData.push({
            key,
            dayLabel: days[(dayOfWeek + 6) % 7], // Lundi = 0
            words: dailyWords[key] || 0,
            isToday: i === 0
        });
    }
    
    // Trouver le max pour normaliser
    const maxWords = Math.max(100, ...weekData.map(d => d.words));
    
    container.innerHTML = weekData.map(d => {
        const height = Math.max(4, (d.words / maxWords) * 45);
        const classes = ['weekly-bar'];
        if (d.words > 0) classes.push('active');
        if (d.isToday) classes.push('today');
        return `<div class="${classes.join(' ')}" style="height: ${height}px" data-day="${d.dayLabel}" title="${d.words} mots"></div>`;
    }).join('');
}

// Détecter quand l'utilisateur quitte la page
window.addEventListener('beforeunload', stopReadingTimer);
window.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopReadingTimer();
    } else {
        startReadingTimer();
    }
});

// Phrases d'en-tête dynamiques selon l'état de l'exploration
const HEADER_PHRASES = {
    start: [
        "Laissez-vous dériver...",
        "Un texte vous attend...",
        "La bibliothèque murmure...",
        "Plongez dans l'inconnu..."
    ],
    exploring: [
        "Le voyage continue...",
        "Vous vous enfoncez...",
        "Les pages tournent...",
        "Le labyrinthe s'ouvre..."
    ],
    deep: [
        "Vous êtes loin du rivage...",
        "Les profondeurs vous appellent...",
        "Le temps se suspend...",
        "Bienvenue dans l'abîme..."
    ],
    expert: [
        "Vous êtes un érudit...",
        "Les auteurs vous reconnaissent...",
        "Le palimpseste se révèle...",
        "Maître des mots anciens..."
    ]
};

function updateDynamicHeader() {
    const authorCount = Object.keys(state.authorStats).length;
    const readCount = state.readCount || 0;
    
    let phrases;
    if (readCount < 3) phrases = HEADER_PHRASES.start;
    else if (authorCount < 10) phrases = HEADER_PHRASES.exploring;
    else if (authorCount < 25) phrases = HEADER_PHRASES.deep;
    else phrases = HEADER_PHRASES.expert;
    
    const headerEl = document.getElementById('headerTitle');
    if (headerEl && Math.random() < 0.3) { // 30% de chance de changer
        headerEl.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    }
}

function renderAuthorBars() {
    const container = document.getElementById('authorBars');
    const sorted = Object.entries(state.authorStats).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = sorted[0]?.[1] || 1;
    const colors = ['#ff453a', '#ff9f0a', '#30d158', '#64d2ff', '#bf5af2', '#ff6482', '#ffd60a', '#ac8e68'];
    
    container.innerHTML = sorted.map(([author, count], i) => `
        <div class="author-bar">
            <span class="author-bar-name">${author.split(' ').pop()}</span>
            <div class="author-bar-track">
                <div class="author-bar-fill" style="width: ${(count/max)*100}%; background: ${colors[i % colors.length]}"></div>
            </div>
            <span class="author-bar-count">${count}</span>
        </div>
    `).join('');
}

function renderGenreChart() {
    const container = document.getElementById('genreChart');
    container.innerHTML = Object.entries(state.genreStats).map(([genre, count]) => `
        <div class="genre-pill" onclick="exploreCategory('${genre}')" title="Explorer l'arborescence ${genre}">
            <span class="genre-dot" style="background: ${GENRE_COLORS[genre] || '#6e6e73'}"></span>
            ${genre} <strong>${count}</strong>
        </div>
    `).join('');
}

function trackStats(author, tag) {
    state.authorStats[author] = (state.authorStats[author] || 0) + 1;
    state.genreStats[tag] = (state.genreStats[tag] || 0) + 1;
    saveState();
}

// Construire dynamiquement les connexions entre auteurs
// Les auteurs du même genre sont connectés entre eux
function buildAuthorConnections(author, tag) {
    if (!author || author === 'Anonyme') return;
    
    // Trouver les autres auteurs du même genre
    const sameGenreAuthors = Object.keys(state.authorStats).filter(a => {
        // On considère que les auteurs vus récemment dans la même session sont "connectés"
        return a !== author && a !== 'Anonyme';
    });
    
    // Ajouter des connexions bidirectionnelles
    if (!authorConnections[author]) authorConnections[author] = [];
    
    // Connecter avec les 5 derniers auteurs différents découverts
    const recentAuthors = sameGenreAuthors.slice(-5);
    for (const other of recentAuthors) {
        if (!authorConnections[author].includes(other)) {
            authorConnections[author].push(other);
        }
        if (!authorConnections[other]) authorConnections[other] = [];
        if (!authorConnections[other].includes(author)) {
            authorConnections[other].push(author);
        }
    }
    
    // Limiter à 10 connexions par auteur
    if (authorConnections[author].length > 10) {
        authorConnections[author] = authorConnections[author].slice(-10);
    }
}

// ═══════════════════════════════════════════════════════════
// 🔍 RECHERCHE - Fonctions de recherche avancée
// ═══════════════════════════════════════════════════════════

let searchResults = {
    wikisource: [],
    poetrydb: [],
    gutenberg: [],
    users: []
};
let currentSearchTab = 'all';
let currentSearchQuery = '';

// Gérer l'affichage du bouton clear
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    
    if (searchInput && searchClear) {
        searchInput.addEventListener('input', () => {
            searchClear.classList.toggle('visible', searchInput.value.length > 0);
        });
    }
});

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        document.getElementById('searchClear')?.classList.remove('visible');
        searchInput.focus();
    }
}

// Fonction pour la barre de recherche principale
function performMainSearch() {
    const input = document.getElementById('mainSearchInput');
    if (!input) return;
    const query = input.value.trim();
    if (!query || query.length < 2) {
        toast('⚠️ Entrez au moins 2 caractères');
        return;
    }
    // Réutiliser la logique de performSearch
    document.getElementById('searchInput').value = query;
    performSearch();
}

async function performSearch() {
    const mainInput = document.getElementById('mainSearchInput');
    const headerInput = document.getElementById('searchInput');
    const query = (mainInput?.value || headerInput?.value || '').trim();
    
    if (!query || query.length < 2) {
        toast('⚠️ Entrez au moins 2 caractères');
        return;
    }
    
    currentSearchQuery = query;
    
    // Afficher l'overlay avec loading
    const overlay = document.getElementById('searchResultsOverlay');
    const grid = document.getElementById('searchResultsGrid');
    const tabs = document.getElementById('searchResultsTabs');
    
    document.getElementById('searchQueryDisplay').textContent = query;
    overlay.classList.add('open');
    
    grid.innerHTML = '<div class="search-loading"><div class="spinner"></div><p>Recherche en cours...</p></div>';
    tabs.innerHTML = '';
    
    // Réinitialiser les résultats
    searchResults = { wikisource: [], poetrydb: [], gutenberg: [], users: [] };
    
    // Lancer les recherches en parallèle
    toast('🔍 Recherche...');
    
    await Promise.all([
        searchWikisource(query),
        searchPoetryDB(query),
        searchGutenberg(query),
        searchUsers(query)
    ]);
    
    // Afficher les résultats
    renderSearchTabs();
    renderSearchResults('all');
}

// Recherche d'utilisateurs sur Palimpseste
async function searchUsers(query) {
    if (!supabaseClient) return;
    
    try {
        const { data: users } = await supabaseClient
            .from('profiles')
            .select('id, username, created_at')
            .ilike('username', `%${query}%`)
            .limit(20);
        
        if (users && users.length > 0) {
            // Charger qui on suit
            await loadUserFollowing();
            
            // Compter les extraits pour chaque user
            searchResults.users = await Promise.all(users.map(async (u) => {
                const { count } = await supabaseClient
                    .from('extraits')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', u.id);
                return {
                    ...u,
                    extraitCount: count || 0,
                    source: 'users'
                };
            }));
        }
    } catch (e) {
        console.error('User search error:', e);
    }
}

async function searchWikisource(query) {
    try {
        const wikisources = getActiveWikisources();
        const allResults = [];
        
        // Fonction pour chercher les œuvres d'un auteur via sa catégorie
        async function searchAuthorWorks(ws, authorName) {
            const results = [];
            // Normaliser le nom de l'auteur (première lettre majuscule pour chaque mot)
            const normalizedName = authorName.trim().split(/\s+/)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ');
            
            // D'abord, essayer de trouver la page Auteur pour récupérer le nom complet
            let fullAuthorName = normalizedName;
            try {
                // Chercher la page Auteur avec le nom
                const authorSearchUrl = `${ws.url}/w/api.php?action=query&list=search&srsearch=intitle:${encodeURIComponent(normalizedName)}&srnamespace=102&srlimit=5&format=json&origin=*`;
                const authorSearchRes = await fetch(authorSearchUrl);
                const authorSearchData = await authorSearchRes.json();
                const authorPages = authorSearchData.query?.search || [];
                
                if (authorPages.length > 0) {
                    // Extraire le nom de la page Auteur (ex: "Auteur:Arthur Schopenhauer")
                    const authorPage = authorPages[0].title;
                    fullAuthorName = authorPage.replace(/^Auteur:|^Author:|^Autor:/, '').trim();
                }
            } catch (e) { /* Ignorer */ }
            
            // Essayer différents formats de catégorie selon la langue
            const categoryFormats = {
                'fr': [
                    `Catégorie:Œuvres d'${fullAuthorName}`,
                    `Catégorie:Œuvres de ${fullAuthorName}`,
                    `Catégorie:${fullAuthorName}`
                ],
                'en': [
                    `Category:Works by ${fullAuthorName}`,
                    `Category:${fullAuthorName}`
                ],
                'de': [
                    `Kategorie:${fullAuthorName}`,
                    `Kategorie:Werke von ${fullAuthorName}`
                ],
                'it': [
                    `Categoria:Opere di ${fullAuthorName}`,
                    `Categoria:${fullAuthorName}`
                ],
                'es': [
                    `Categoría:Obras de ${fullAuthorName}`,
                    `Categoría:${fullAuthorName}`
                ]
            };
            
            const categories = categoryFormats[ws.lang] || [`Category:${fullAuthorName}`];
            
            for (const catName of categories) {
                try {
                    const catUrl = `${ws.url}/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(catName)}&cmlimit=20&cmnamespace=0&format=json&origin=*`;
                    const res = await fetch(catUrl);
                    const data = await res.json();
                    const members = data.query?.categorymembers || [];
                    if (members.length > 0) {
                        return members.map(m => ({
                            title: m.title,
                            snippet: `📚 Œuvre de ${fullAuthorName}`,
                            source: 'wikisource',
                            lang: ws.lang,
                            wikisource: ws,
                            isAuthorWork: true
                        }));
                    }
                } catch (e) { /* Ignorer si catégorie non trouvée */ }
            }
            return results;
        }
        
        // Pour chaque wikisource, faire une recherche standard ET une recherche par auteur
        for (const ws of wikisources) {
            // Recherche standard
            const standardPromise = fetch(`${ws.url}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=15&srnamespace=0&format=json&origin=*`)
                .then(res => res.json())
                .then(data => {
                    return (data.query?.search || []).map(r => ({
                        title: r.title,
                        snippet: r.snippet || '',
                        source: 'wikisource',
                        lang: ws.lang,
                        wikisource: ws
                    }));
                })
                .catch(() => []);
            
            // Recherche par catégorie d'auteur (si la requête ressemble à un nom)
            const authorPromise = searchAuthorWorks(ws, query);
            
            const [standardResults, authorResults] = await Promise.all([standardPromise, authorPromise]);
            
            // Fusionner en mettant les œuvres de l'auteur en premier
            const combined = [...authorResults, ...standardResults];
            
            // Dédupliquer par titre
            const seen = new Set();
            const unique = combined.filter(r => {
                if (seen.has(r.title)) return false;
                seen.add(r.title);
                return true;
            });
            
            allResults.push(...unique);
        }
        
        searchResults.wikisource = allResults;
    } catch (e) {
        console.error('Wikisource search error:', e);
    }
}

async function searchPoetryDB(query) {
    try {
        // Recherche par auteur
        const authorRes = await fetch(`https://poetrydb.org/author/${encodeURIComponent(query)}`);
        let authorData = [];
        if (authorRes.ok) {
            const data = await authorRes.json();
            if (Array.isArray(data)) {
                authorData = data.slice(0, 10).map(p => ({
                    title: p.title,
                    author: p.author,
                    snippet: p.lines?.slice(0, 3).join(' / ') || '',
                    lines: p.lines,
                    source: 'poetrydb',
                    lang: 'en'
                }));
            }
        }
        
        // Recherche par titre
        const titleRes = await fetch(`https://poetrydb.org/title/${encodeURIComponent(query)}`);
        let titleData = [];
        if (titleRes.ok) {
            const data = await titleRes.json();
            if (Array.isArray(data)) {
                titleData = data.slice(0, 10).map(p => ({
                    title: p.title,
                    author: p.author,
                    snippet: p.lines?.slice(0, 3).join(' / ') || '',
                    lines: p.lines,
                    source: 'poetrydb',
                    lang: 'en'
                }));
            }
        }
        
        // Combiner et dédupliquer
        const combined = [...authorData, ...titleData];
        const seen = new Set();
        searchResults.poetrydb = combined.filter(p => {
            const key = p.title + p.author;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    } catch (e) {
        console.error('PoetryDB search error:', e);
    }
}

async function searchGutenberg(query) {
    try {
        const res = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        searchResults.gutenberg = (data.results || []).slice(0, 15).map(book => ({
            title: book.title,
            author: book.authors?.map(a => a.name).join(', ') || 'Inconnu',
            snippet: book.subjects?.slice(0, 3).join(' • ') || '',
            id: book.id,
            source: 'gutenberg',
            lang: book.languages?.[0] || 'en',
            formats: book.formats
        }));
    } catch (e) {
        console.error('Gutenberg search error:', e);
    }
}

function renderSearchTabs() {
    const tabs = document.getElementById('searchResultsTabs');
    const totalAll = searchResults.wikisource.length + searchResults.poetrydb.length + searchResults.gutenberg.length;
    const usersCount = searchResults.users?.length || 0;
    
    tabs.innerHTML = `
        <button class="search-tab ${currentSearchTab === 'users' ? 'active' : ''}" onclick="switchSearchTab('users')">
            👥 Utilisateurs <span class="count">${usersCount}</span>
        </button>
        <button class="search-tab ${currentSearchTab === 'all' ? 'active' : ''}" onclick="switchSearchTab('all')">
            📚 Textes <span class="count">${totalAll}</span>
        </button>
        <button class="search-tab ${currentSearchTab === 'wikisource' ? 'active' : ''}" onclick="switchSearchTab('wikisource')">
            📜 Wikisource <span class="count">${searchResults.wikisource.length}</span>
        </button>
        <button class="search-tab ${currentSearchTab === 'poetrydb' ? 'active' : ''}" onclick="switchSearchTab('poetrydb')">
            🎭 Poésie <span class="count">${searchResults.poetrydb.length}</span>
        </button>
        <button class="search-tab ${currentSearchTab === 'gutenberg' ? 'active' : ''}" onclick="switchSearchTab('gutenberg')">
            📖 Gutenberg <span class="count">${searchResults.gutenberg.length}</span>
        </button>
    `;
}

function switchSearchTab(tab) {
    currentSearchTab = tab;
    renderSearchTabs();
    renderSearchResults(tab);
}

function renderSearchResults(tab) {
    const grid = document.getElementById('searchResultsGrid');
    
    // Si onglet utilisateurs
    if (tab === 'users') {
        const users = searchResults.users || [];
        
        if (users.length === 0) {
            grid.innerHTML = `
                <div class="search-no-results">
                    <div class="search-no-results-icon">👤</div>
                    <p>Aucun utilisateur trouvé pour "${escapeHtml(currentSearchQuery)}"</p>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem;">Vérifiez l'orthographe du pseudo</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = `
            <div class="discover-grid" style="padding: 0.5rem;">
                ${users.map(u => {
                    const isMe = currentUser && u.id === currentUser.id;
                    if (isMe) {
                        return `
                            <div class="discover-card">
                                <div class="discover-avatar" onclick="openUserProfile('${u.id}', '${u.username}')">${(u.username || '?').charAt(0).toUpperCase()}</div>
                                <div class="discover-info" onclick="openUserProfile('${u.id}', '${u.username}')">
                                    <div class="discover-name">${escapeHtml(u.username || 'Anonyme')}</div>
                                    <div class="discover-stats">${u.extraitCount} extrait${u.extraitCount > 1 ? 's' : ''}</div>
                                </div>
                                <span style="color:var(--muted);font-size:0.8rem;">C'est vous</span>
                            </div>
                        `;
                    }
                    return renderUserCard(
                        u.id, 
                        u.username, 
                        `${u.extraitCount} extrait${u.extraitCount > 1 ? 's' : ''}`,
                        true,
                        'toggleFollowFromSearch'
                    );
                }).join('')}
            </div>
        `;
        return;
    }
    
    let results = [];
    if (tab === 'all') {
        results = [
            ...searchResults.wikisource,
            ...searchResults.poetrydb,
            ...searchResults.gutenberg
        ];
    } else {
        results = searchResults[tab] || [];
    }
    
    if (results.length === 0) {
        grid.innerHTML = `
            <div class="search-no-results">
                <div class="search-no-results-icon">📭</div>
                <p>Aucun résultat pour "${escapeHtml(currentSearchQuery)}"</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem;">Essayez avec d'autres mots-clés ou un nom d'auteur</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = results.map((r, idx) => {
        const sourceIcon = r.source === 'wikisource' ? '📜' : r.source === 'poetrydb' ? '🎭' : '📖';
        const sourceName = r.source === 'wikisource' ? 'Wikisource' : r.source === 'poetrydb' ? 'PoetryDB' : 'Gutenberg';
        const author = r.author || extractAuthorFromTitle(r.title) || '';
        
        // Nettoyer le snippet HTML
        let snippet = r.snippet || '';
        snippet = snippet.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        
        // Highlight query dans le snippet
        const queryRegex = new RegExp(`(${escapeRegex(currentSearchQuery)})`, 'gi');
        snippet = snippet.replace(queryRegex, '<mark>$1</mark>');
        
        return `
            <div class="search-result-card" onclick="openSearchResult(${idx}, '${r.source}')">
                <div class="search-result-title">${escapeHtml(r.title)}</div>
                ${author ? `<div class="search-result-author">${escapeHtml(author)}</div>` : ''}
                <div class="search-result-snippet">${snippet}</div>
                <div class="search-result-meta">
                    <span class="search-result-source">${sourceIcon} ${sourceName}</span>
                    ${r.lang ? `<span>🌐 ${r.lang.toUpperCase()}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Follow depuis la recherche
async function toggleFollowFromSearch(userId, event) {
    event.stopPropagation();
    await toggleFollow(userId);
    // Re-render les résultats pour mettre à jour les boutons
    renderSearchResults(currentSearchTab);
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractAuthorFromTitle(title) {
    // Essayer d'extraire l'auteur depuis des patterns courants
    const patterns = [
        /^(.+?)\s*[-–—]\s*(.+)$/,  // "Titre - Auteur" ou "Auteur - Titre"
        /\(([^)]+)\)$/,             // "Titre (Auteur)"
        /by\s+(.+)$/i               // "Title by Author"
    ];
    
    for (const pattern of patterns) {
        const match = title.match(pattern);
        if (match) {
            const candidate = match[1] || match[2];
            // Vérifier si ça ressemble à un nom d'auteur
            if (candidate && candidate.length < 50 && /^[A-Za-zÀ-ÿ\s.'-]+$/.test(candidate)) {
                return candidate.trim();
            }
        }
    }
    return null;
}

async function openSearchResult(idx, source) {
    let result;
    if (currentSearchTab === 'all') {
        const allResults = [
            ...searchResults.wikisource,
            ...searchResults.poetrydb,
            ...searchResults.gutenberg
        ];
        result = allResults[idx];
    } else {
        result = searchResults[currentSearchTab]?.[idx];
    }
    
    if (!result) return;
    
    closeSearchResults();
    toast('📖 Chargement...');
    
    if (result.source === 'wikisource') {
        // Charger le texte depuis Wikisource
        const text = await fetchText(result.title, 0, result.wikisource);
        if (text) {
            document.getElementById('feed').innerHTML = '';
            state.cardIdx = 0;
            renderCard(text, result.title, result.wikisource);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            toast('❌ Impossible de charger ce texte');
        }
    } else if (result.source === 'poetrydb') {
        // Afficher directement le poème
        document.getElementById('feed').innerHTML = '';
        state.cardIdx = 0;
        renderCard({
            title: result.title,
            text: result.lines?.join('\n') || result.snippet,
            author: result.author,
            source: 'poetrydb'
        }, result.title, { lang: 'en', url: 'https://poetrydb.org', name: 'PoetryDB' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (result.source === 'gutenberg') {
        // Ouvrir le livre sur Gutenberg
        const readUrl = `https://www.gutenberg.org/ebooks/${result.id}`;
        window.open(readUrl, '_blank');
        toast('📖 Ouverture sur Project Gutenberg');
    }
}

function closeSearchResults() {
    document.getElementById('searchResultsOverlay').classList.remove('open');
}

async function shuffleFeed() {
    document.getElementById('feed').innerHTML = '';
    state.textPool = [];
    state.shownPages.clear();
    state.cardIdx = 0;
    toast('Nouveaux textes...');
    await fillPool();
    await loadMore();
}

function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

async function loadMore() {
    if (state.loading) return;
    state.loading = true;
    document.getElementById('loading').style.display = 'block';

    let loaded = 0, attempts = 0;
    while (loaded < 3 && attempts < 15) {
        attempts++;
        const isExploringCategory = currentCategoryPath.length > 0;
        if (state.textPool.length < 3 && !isExploringCategory) {
            await fillPool();
        }
        if (state.textPool.length === 0) break;
        
        const item = state.textPool.shift();
        const itemKey = (item.source === 'poetrydb' ? 'poetrydb:' : '') + item.title;
        if (state.shownPages.has(itemKey)) continue;
        
        // Si c'est un item pré-chargé (PoetryDB), on l'affiche directement
        if (item.isPreloaded && item.text) {
            state.shownPages.add(itemKey);
            renderCard({
                title: item.title,
                text: item.text,
                author: item.author,
                source: item.source
            }, item.title, { lang: item.lang, url: 'https://poetrydb.org', name: 'PoetryDB' });
            loaded++;
            continue;
        }
        
        // Sinon, récupérer depuis Wikisource
        const ws = item.wikisource || currentWikisource;
        const result = await fetchText(item.title, 0, ws);
        if (result?.text?.length > 150) {
            state.shownPages.add(itemKey);
            renderCard(result, item.title, ws);
            loaded++;
        }
    }

    document.getElementById('loading').style.display = 'none';
    state.loading = false;
}

function renderCard(result, origTitle, wikisource = currentWikisource) {
    let title = result.title || origTitle;
    // Nettoyage agressif du titre
    title = title
        .replace(/<[^>]+>/g, '')  // Supprimer tout HTML
        .replace(/mw-page-title[^\s]*/gi, '')  // Supprimer classes MW
        .replace(/Liste des [^\/]*/gi, '')  // Supprimer "Liste des..."
        .replace(/par ordre alphabétique/gi, '')
        .replace(/span class/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Si le titre est invalide, ne pas afficher cette carte
    if (!isValidTitle(title)) return;
    
    const text = result.text;
    const lang = wikisource?.lang || 'fr';
    // Utiliser l'auteur des métadonnées en priorité
    const author = detectAuthor(title, text, result.author);
    const tag = detectTag(title, text);
    const url = `${wikisource?.url || 'https://fr.wikisource.org'}/wiki/${encodeURIComponent(origTitle)}`;
    const cardId = 'card-' + (state.cardIdx++);
    
    // Extraire un titre propre pour l'affichage
    let displayTitle = title.split('/').pop() || title.split('/')[0];
    // Si c'est un titre générique, prendre la première partie
    if (displayTitle.length < 3) displayTitle = title.split('/')[0];
    // Supprimer les parenthèses avec l'auteur si redondant
    displayTitle = displayTitle.replace(/\s*\([^)]*\)\s*$/, '').trim();
    // Si displayTitle est vide ou trop court après nettoyage, utiliser le titre original
    if (displayTitle.length < 3) displayTitle = title.split('/')[0] || 'Texte sans titre';
    
    // Badge de langue
    const langBadge = lang !== 'fr' ? `<span class="lang-badge">${lang.toUpperCase()}</span>` : '';
    
    // Tracker les stats et construire les connexions
    trackStats(author, tag);
    buildAuthorConnections(author, tag);

    // Découper le texte en teaser + suite
    const TEASER_LENGTH = 350;
    const CHUNK_LENGTH = 600;
    let teaser = text;
    let remaining = '';
    
    if (text.length > TEASER_LENGTH) {
        // Couper proprement sur une phrase ou un retour à la ligne
        let cutPoint = text.lastIndexOf('. ', TEASER_LENGTH);
        if (cutPoint < TEASER_LENGTH * 0.5) cutPoint = text.lastIndexOf('\n', TEASER_LENGTH);
        if (cutPoint < TEASER_LENGTH * 0.5) cutPoint = text.lastIndexOf(' ', TEASER_LENGTH);
        if (cutPoint < TEASER_LENGTH * 0.5) cutPoint = TEASER_LENGTH;
        teaser = text.substring(0, cutPoint + 1).trim();
        remaining = text.substring(cutPoint + 1).trim();
    }
    
    // Générer les mots-clés pour ce texte
    const keywords = extractKeywords(text, title, author, tag);
    const keywordsHtml = keywords.map(kw => 
        `<span class="keyword-tag" onclick="exploreKeyword('${kw}')" title="Explorer #${kw}">${kw}</span>`
    ).join('');
    
    const card = document.createElement('div');
    card.className = 'card';
    card.id = cardId;
    card.innerHTML = `
        <div class="card-head" onclick="showRelatedAuthors('${cardId}')" style="cursor:pointer;" title="Cliquer pour découvrir des auteurs proches">
            <div>
                <div class="author">${esc(author)} ${langBadge} <span class="explore-hint">🕸️</span></div>
                <div class="work">${esc(displayTitle)}</div>
            </div>
            <span class="tag ${tag}" onclick="event.stopPropagation(); exploreCategory('${tag}')" title="Explorer ce genre">${tag}</span>
        </div>
        <div class="card-body" ondblclick="doubleTapLike('${cardId}', event)">
            <span class="like-heart-overlay" id="heart-${cardId}">❤️</span>
            <div class="text-teaser">${esc(teaser)}</div>
            <div class="text-full" id="full-${cardId}"></div>
            ${remaining ? `<button class="btn-suite" onclick="showMore('${cardId}')" id="suite-${cardId}">Lire la suite<span class="arrow">→</span></button>` : ''}
        </div>
        <div class="related-authors" id="related-${cardId}" style="display:none;"></div>
        <div class="card-foot">
            <div class="card-keywords">${keywordsHtml}</div>
            <div class="actions">
                <button class="btn" onclick="toggleLike('${cardId}',this)">♥</button>
                <button class="btn btn-share" onclick="shareCardExtrait('${cardId}')" title="Partager cet extrait">🐦 Partager</button>
                <button class="btn" onclick="quickShareAndComment('${cardId}')" title="Partager et commenter">💬</button>
                <button class="btn" onclick="showRelatedAuthors('${cardId}')" title="Explorer auteurs proches">🔗</button>
                <a class="btn" href="${url}" target="_blank">↗ Wikisource</a>
            </div>
        </div>
    `;
    card.dataset.title = title;
    card.dataset.author = author;
    card.dataset.text = text;
    card.dataset.remaining = remaining;
    card.dataset.shown = '0';
    card.dataset.tag = tag;
    card.dataset.lang = lang;
    card.dataset.chunkSize = CHUNK_LENGTH;
    document.getElementById('feed').appendChild(card);
    setTimeout(() => card.classList.add('show'), 50);
    
    // Tracker ce texte comme lu
    state.readCount++;
    const teaserWords = teaser.split(/\s+/).filter(w => w.length > 0).length;
    recordReading(teaserWords);
    startReadingTimer();
    
    // Mettre à jour l'affichage
    updateStats();
    saveState();
}

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }

// Afficher la suite du texte - tout d'un coup au premier clic
function showMore(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const fullEl = document.getElementById('full-' + cardId);
    const btnEl = document.getElementById('suite-' + cardId);
    if (!fullEl || !btnEl) return;
    
    let remaining = card.dataset.remaining || '';
    
    if (!remaining) {
        btnEl.innerHTML = '✓ Texte complet';
        btnEl.classList.add('exhausted');
        btnEl.onclick = null;
        return;
    }
    
    // Afficher TOUT le texte restant d'un coup
    const chunkEl = document.createElement('div');
    chunkEl.className = 'text-chunk';
    chunkEl.style.animation = 'fadeIn 0.4s ease';
    chunkEl.innerHTML = esc(remaining);
    fullEl.appendChild(chunkEl);
    fullEl.classList.add('visible');
    
    // Tracker les mots lus
    const wordCount = remaining.split(/\s+/).filter(w => w.length > 0).length;
    recordReading(wordCount);
    startReadingTimer();
    
    // Marquer comme complet
    card.dataset.remaining = '';
    
    // Mettre à jour le bouton
    btnEl.innerHTML = '✓ Texte complet';
    btnEl.classList.add('exhausted');
    btnEl.onclick = null;
    
    // Scroll doux vers le nouveau contenu
    setTimeout(() => chunkEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function toggleLike(id, btn) {
    const card = document.getElementById(id);
    const author = card?.dataset?.author;
    const title = card?.dataset?.title;
    const text = card?.dataset?.text;
    
    if (state.likes.has(id)) { 
        state.likes.delete(id); 
        // Supprimer des favoris stockés
        state.favorites = (state.favorites || []).filter(f => f.id !== id);
        btn?.classList?.remove('active');
        // Retirer l'auteur des likedAuthors si plus aucune carte likée
        if (author && author !== 'Anonyme') {
            const hasOtherLikes = [...state.likes].some(likeId => {
                const c = document.getElementById(likeId);
                return c?.dataset?.author === author;
            });
            if (!hasOtherLikes) state.likedAuthors.delete(author);
        }
    } else { 
        state.likes.add(id); 
        // Ajouter aux favoris stockés
        if (!state.favorites) state.favorites = [];
        state.favorites.push({
            id: id,
            title: title,
            author: author,
            text: text?.substring(0, 200) || '',
            timestamp: Date.now()
        });
        btn?.classList?.add('active'); 
        toast('💎 Ajouté aux favoris');
        // Ajouter l'auteur aux likedAuthors
        if (author && author !== 'Anonyme') {
            state.likedAuthors.add(author);
        }
    }
    saveState();
    updateConnections();
    renderFavorites();
    updateFavCount();
}

// Double-tap pour liker (style Instagram)
function doubleTapLike(id, event) {
    event.preventDefault();
    const card = document.getElementById(id);
    const heart = document.getElementById('heart-' + id);
    const likeBtn = card?.querySelector('.card-foot .btn');
    
    // Afficher l'animation du coeur
    if (heart) {
        heart.classList.remove('animate');
        void heart.offsetWidth; // Force reflow
        heart.classList.add('animate');
    }
    
    // Si pas déjà liké, liker
    if (!state.likes.has(id)) {
        toggleLike(id, likeBtn);
    } else {
        // Déjà liké, juste montrer le coeur (feedback visuel)
        toast('❤️ Déjà dans tes favoris !');
    }
}

// Afficher la liste des favoris dans le panneau
function renderFavorites() {
    const container = document.getElementById('favoritesList');
    if (!container) return;
    
    const favorites = state.favorites || [];
    
    if (favorites.length === 0) {
        container.innerHTML = '<div class="favorites-empty">Cliquez ♥ pour sauvegarder</div>';
        return;
    }
    
    // Trier par date (plus récent d'abord)
    const sorted = [...favorites].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    container.innerHTML = sorted.map(fav => `
        <div class="favorite-item" onclick="scrollToCard('${fav.id}')">
            <div class="favorite-content">
                <div class="favorite-title">${esc(fav.title?.split('/').pop() || fav.title || 'Sans titre')}</div>
                <div class="favorite-author">${esc(fav.author || 'Anonyme')}</div>
                <div class="favorite-preview">${esc(fav.text || '')}</div>
            </div>
            <button class="favorite-remove" onclick="event.stopPropagation(); removeFavorite('${fav.id}')" title="Retirer">✕</button>
        </div>
    `).join('');
}

function scrollToCard(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.boxShadow = '0 0 30px rgba(255,69,58,0.5)';
        setTimeout(() => card.style.boxShadow = '', 2000);
    }
}

function removeFavorite(id) {
    state.likes.delete(id);
    state.favorites = (state.favorites || []).filter(f => f.id !== id);
    const btn = document.querySelector(`#${id} .btn.active`);
    if (btn) btn.classList.remove('active');
    saveState();
    renderFavorites();
    updateFavCount();
    toast('Retiré des favoris');
}

// === VUE FAVORIS COMPLÈTE ===
function openFavoritesView() {
    const overlay = document.getElementById('favoritesOverlay');
    const grid = document.getElementById('favoritesGrid');
    if (!overlay || !grid) return;
    
    const favorites = state.favorites || [];
    
    if (favorites.length === 0) {
        grid.innerHTML = `
            <div class="fav-empty">
                <div class="fav-empty-icon">♥</div>
                <div class="fav-empty-text">Aucun favori pour l'instant</div>
                <p style="margin-top: 1rem; color: var(--muted); font-size: 0.9rem;">
                    Cliquez sur le cœur ♥ d'un texte pour le sauvegarder ici
                </p>
            </div>
        `;
    } else {
        const sorted = [...favorites].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        grid.innerHTML = sorted.map(fav => `
            <div class="fav-card">
                <div class="fav-card-head">
                    <div>
                        <div class="fav-card-author">${esc(fav.author || 'Anonyme')}</div>
                        <div class="fav-card-title">${esc(fav.title?.split('/').pop() || fav.title || 'Sans titre')}</div>
                    </div>
                </div>
                <div class="fav-card-text">${esc(fav.text || '').substring(0, 500)}${(fav.text?.length || 0) > 500 ? '...' : ''}</div>
                <div class="fav-card-actions">
                    <button class="btn" onclick="openFavInReader('${fav.id}')">Lire</button>
                    <button class="btn" onclick="removeFavoriteFromView('${fav.id}')">Retirer</button>
                </div>
            </div>
        `).join('');
    }
    
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeFavoritesView() {
    const overlay = document.getElementById('favoritesOverlay');
    if (overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function openFavInReader(id) {
    const fav = (state.favorites || []).find(f => f.id === id);
    if (fav) {
        closeFavoritesView();
        // Chercher la carte dans le feed ou créer une vue reader
        const card = document.getElementById(id);
        if (card) {
            const btn = card.querySelector('.read-more-btn');
            if (btn) btn.click();
            else {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            // Ouvrir directement dans le reader avec le texte sauvegardé
            openReaderWithFav(fav);
        }
    }
}

function openReaderWithFav(fav) {
    const overlay = document.getElementById('readerOverlay');
    const content = document.getElementById('readerContent');
    if (!overlay || !content) return;
    
    content.innerHTML = `
        <div style="text-align:center; margin-bottom: 3rem;">
            <div style="font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 600;">${esc(fav.author || 'Anonyme')}</div>
            <div style="color: var(--muted); font-style: italic; margin-top: 0.5rem;">${esc(fav.title?.split('/').pop() || fav.title || '')}</div>
        </div>
        <div style="white-space: pre-wrap; text-align: justify;">${esc(fav.text || 'Texte non disponible')}</div>
    `;
    
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function removeFavoriteFromView(id) {
    removeFavorite(id);
    // Re-render la vue favoris
    openFavoritesView();
}

function updateFavCount() {
    const countEl = document.getElementById('favCount');
    if (countEl) {
        const count = (state.favorites || []).length;
        countEl.textContent = count;
    }
}

// Trouver les auteurs connexes basés sur les favoris et les découvertes
function getConnectedAuthors() {
    const connected = new Map(); // auteur -> source(s)
    
    // Utiliser les auteurs découverts comme base de recommandation
    // Un auteur "similaire" est un auteur lu dans la même session mais pas encore liké
    for (const likedAuthor of state.likedAuthors) {
        // Chercher des auteurs découverts récemment (dans authorConnections dynamique)
        const connections = authorConnections[likedAuthor] || [];
        for (const connectedAuthor of connections) {
            // Ne pas recommander un auteur déjà lu/liké
            if (state.likedAuthors.has(connectedAuthor)) continue;
            if (state.discoveredConnections.has(connectedAuthor)) continue;
            
            if (!connected.has(connectedAuthor)) {
                connected.set(connectedAuthor, []);
            }
            connected.get(connectedAuthor).push(likedAuthor);
        }
    }
    
    // Trier par nombre de connexions (auteurs recommandés par plusieurs sources d'abord)
    return [...connected.entries()]
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 6);
}

// Mettre à jour l'affichage des connexions
function updateConnections() {
    const connected = getConnectedAuthors();
    const section = document.getElementById('connectionsSection');
    const graph = document.getElementById('connectionGraph');
    const recoBanner = document.getElementById('recoBanner');
    const recoAuthors = document.getElementById('recoAuthors');
    
    if (connected.length === 0) {
        section.style.display = 'none';
        recoBanner.style.display = 'none';
        return;
    }
    
    // Afficher la section dans le panneau
    section.style.display = 'block';
    graph.innerHTML = connected.map(([author, sources]) => {
        const isDiscovered = state.discoveredConnections.has(author);
        const sourceList = sources.slice(0, 2).join(', ');
        return `
            <div class="connection-item" onclick="exploreAuthor('${author.replace(/'/g, "\\'")}')">
                <div class="connection-node ${isDiscovered ? 'discovered' : ''}">
                    <span class="connection-dot"></span>
                    <span>${author}</span>
                </div>
                <div class="connection-label">via ${sourceList}</div>
            </div>
        `;
    }).join('');
    
    // Afficher la bannière de recommandation
    recoBanner.style.display = 'block';
    recoAuthors.innerHTML = connected.slice(0, 4).map(([author]) => `
        <span class="reco-author" onclick="exploreAuthor('${author.replace(/'/g, "\\'")}')">${author}</span>
    `).join('');
}

// ═══════════════════════════════════════════════════════════
// 🕸️ AFFICHER LES AUTEURS LIÉS À UN TEXTE (clic sur carte)
// ═══════════════════════════════════════════════════════════
function showRelatedAuthors(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const author = card.dataset.author;
    const container = document.getElementById('related-' + cardId);
    
    // Toggle : si déjà visible, cacher
    if (container.style.display !== 'none') {
        container.style.display = 'none';
        return;
    }
    
    // Trouver les auteurs connectés (dynamiquement découverts)
    const connected = authorConnections[author] || [];
    
    // Ajouter des suggestions basées sur le genre
    const tag = card.dataset.tag;
    const genreAuthors = getAuthorsForGenre(tag, author);
    
    // Combiner et dédupliquer
    const allRelated = [...new Set([...connected, ...genreAuthors])].slice(0, 6);
    
    if (allRelated.length === 0) {
        container.innerHTML = `<div class="no-related">Aucune connexion connue. <button class="btn btn-small" onclick="randomJump()">🎲 Hasard</button></div>`;
    } else {
        container.innerHTML = `
            <div class="related-title">🕸️ Auteurs proches de ${author.split(' ').pop()}</div>
            <div class="related-list">
                ${allRelated.map(a => `
                    <button class="related-btn" onclick="exploreAuthor('${a.replace(/'/g, "\\'")}')">
                        ${a.split(' ').pop()}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    container.style.display = 'block';
    toast(`${allRelated.length} auteur(s) à explorer`);
}

// Trouver des auteurs du même genre (classiques mondiaux + dynamique)
function getAuthorsForGenre(genre, excludeAuthor) {
    // Auteurs classiques par genre (mix mondial)
    const genreMap = {
        'poésie': ['Baudelaire', 'Rimbaud', 'Shakespeare', 'Goethe', 'Dante', 'Petrarca', 'Pushkin', 'Neruda'],
        'poetry': ['Shakespeare', 'Keats', 'Byron', 'Wordsworth', 'Dickinson', 'Whitman', 'Poe'],
        'théâtre': ['Molière', 'Shakespeare', 'Goethe', 'Calderón', 'Goldoni', 'Chekhov'],
        'drama': ['Shakespeare', 'Marlowe', 'Ibsen', 'Chekhov', 'Wilde'],
        'roman': ['Balzac', 'Dickens', 'Dostoevsky', 'Tolstoy', 'Cervantes', 'Mann'],
        'novel': ['Dickens', 'Austen', 'Brontë', 'Twain', 'Melville', 'James'],
        'conte': ['Perrault', 'Grimm', 'Andersen', 'Maupassant'],
        'tale': ['Grimm', 'Andersen', 'Wilde', 'Poe'],
        'fable': ['La Fontaine', 'Ésope', 'Aesop', 'Krylov'],
        'texte': ['Hugo', 'Goethe', 'Dante', 'Cervantes'],
        'text': ['Milton', 'Bunyan', 'Swift', 'Defoe']
    };
    
    // Ajouter les auteurs découverts dynamiquement pour ce genre
    const discovered = Object.keys(state.authorStats);
    const baseList = genreMap[genre?.toLowerCase()] || [];
    const combined = [...baseList, ...discovered];
    
    return [...new Set(combined)]
        .filter(a => a !== excludeAuthor && a !== 'Anonyme')
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);
}

// Explorer un auteur spécifique (recherche ciblée)
async function exploreAuthor(author) {
    toast(`Exploration de ${author}...`);
    state.discoveredConnections.add(author);
    saveState();
    
    // Recherches spécifiques pour cet auteur
    const searches = [`${author} poem`, `${author} text`, `${author} sonnet`];
    
    // Utiliser les wikisources actives selon le filtre
    const activeSources = getActiveWikisources();
    const shuffledWS = [...activeSources].sort(() => Math.random() - 0.5).slice(0, Math.min(3, activeSources.length));
    
    for (const ws of shuffledWS) {
        for (const query of searches) {
            const results = await searchTexts(query, 3, ws);
            for (const r of results) {
                if (!state.shownPages.has(r.title) && isValidTitle(r.title)) {
                    state.textPool.unshift({ ...r, wikisource: ws }); // Ajouter en priorité
                }
            }
        }
    }
    
    // Charger immédiatement
    await loadMore();
    updateConnections();
    
    // Scroll vers le nouveau contenu
    window.scrollTo({ top: document.body.scrollHeight - window.innerHeight - 400, behavior: 'smooth' });
}

function openReader(id) {
    const card = document.getElementById(id);
    if (!card) return;
    const author = card.dataset.author;
    const title = card.dataset.title;
    const text = card.dataset.text || '';
    document.getElementById('readerTitle').textContent = `${author} — ${title.split('/')[0]}`;
    document.getElementById('readerContent').innerHTML = esc(text);
    document.getElementById('reader').classList.add('open');
    document.body.style.overflow = 'hidden';
    state.readCount++;
    
    // Tracker les mots lus
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    recordReading(wordCount);
    startReadingTimer();
    
    saveState();
    
    // Fonctionnalités fun
    addToReadingPath(author, title);
    checkAchievements();
    updateFunStat();
    updateStats();
}

function closeReader() {
    document.getElementById('reader').classList.remove('open');
    document.body.style.overflow = '';
    stopReadingTimer();
}

// ═══════════════════════════════════════════════════════════
// � AMBIANCES DE LECTURE
// ═══════════════════════════════════════════════════════════

const AMBIANCES = {
    libre: {
        name: 'Dérive libre',
        icon: '🌊',
        description: 'Laissez-vous porter par le hasard des textes',
        authors: [], // Utilise les auteurs par défaut
        keywords: [],
        color: '#64b5f6'
    },
    gothique: {
        name: 'Gothique',
        icon: '🦇',
        description: 'Châteaux hantés, spectres et terreurs nocturnes',
        authors: ['Edgar Allan Poe', 'Ann Radcliffe', 'Matthew Lewis', 'Horace Walpole', 'Mary Shelley', 'Bram Stoker', 'Charles Maturin', 'Sheridan Le Fanu', 'Théophile Gautier', 'Villiers de l\'Isle-Adam'],
        keywords: ['fantôme', 'spectre', 'château', 'terreur', 'nuit', 'vampire', 'mort', 'tombe', 'ténèbres', 'effroi'],
        color: '#6a1b9a'
    },
    surrealiste: {
        name: 'Surréaliste',
        icon: '🎭',
        description: 'L\'inconscient libéré, les rêves éveillés',
        authors: ['André Breton', 'Paul Éluard', 'Robert Desnos', 'Philippe Soupault', 'Louis Aragon', 'Benjamin Péret', 'René Crevel', 'Antonin Artaud', 'Lautréamont', 'Alfred Jarry'],
        keywords: ['rêve', 'automatique', 'hasard', 'inconscient', 'merveilleux', 'étrange', 'absurde'],
        color: '#ff6f00'
    },
    romantique: {
        name: 'Romantique',
        icon: '🌹',
        description: 'Passions intenses et âmes tourmentées',
        authors: ['Victor Hugo', 'Alphonse de Lamartine', 'Alfred de Musset', 'Alfred de Vigny', 'Gérard de Nerval', 'François-René de Chateaubriand', 'George Sand', 'Lord Byron', 'Percy Shelley', 'John Keats'],
        keywords: ['amour', 'passion', 'coeur', 'âme', 'sentiment', 'larmes', 'désespoir', 'nature'],
        color: '#e91e63'
    },
    melancolie: {
        name: 'Mélancolie',
        icon: '🌧️',
        description: 'Spleen, tristesse douce et contemplation',
        authors: ['Charles Baudelaire', 'Paul Verlaine', 'Jules Laforgue', 'Maurice Rollinat', 'Sully Prudhomme', 'Albert Samain', 'Francis Jammes', 'Giacomo Leopardi'],
        keywords: ['spleen', 'ennui', 'tristesse', 'automne', 'pluie', 'brume', 'solitude', 'regret', 'nostalgie'],
        color: '#546e7a'
    },
    mystique: {
        name: 'Mystique',
        icon: '🔮',
        description: 'Quêtes spirituelles et visions ésotériques',
        authors: ['William Blake', 'Emanuel Swedenborg', 'Jakob Böhme', 'Angelus Silesius', 'San Juan de la Cruz', 'Sainte Thérèse d\'Avila', 'Maître Eckhart', 'Hildegarde de Bingen', 'Rûmî'],
        keywords: ['âme', 'divin', 'extase', 'vision', 'lumière', 'éternel', 'sacré', 'céleste', 'spirituel'],
        color: '#7e57c2'
    },
    epique: {
        name: 'Épique',
        icon: '⚔️',
        description: 'Héros, batailles et destinées grandioses',
        authors: ['Homère', 'Virgile', 'Le Tasse', 'L\'Arioste', 'Milton', 'Camoens', 'Dante Alighieri', 'Victor Hugo'],
        keywords: ['héros', 'bataille', 'gloire', 'honneur', 'guerre', 'victoire', 'destin', 'épée', 'conquête'],
        color: '#d32f2f'
    },
    pastoral: {
        name: 'Pastoral',
        icon: '🌾',
        description: 'Campagnes idylliques et nature apaisante',
        authors: ['Théocrite', 'Virgile', 'Pierre de Ronsard', 'Joachim du Bellay', 'Maurice Scève', 'Francis Jammes', 'Jean Giono', 'Colette'],
        keywords: ['berger', 'prairie', 'champ', 'fleur', 'ruisseau', 'oiseau', 'printemps', 'nature', 'campagne'],
        color: '#66bb6a'
    },
    decadent: {
        name: 'Décadent',
        icon: '💀',
        description: 'Fin de siècle, artifice et beauté morbide',
        authors: ['Joris-Karl Huysmans', 'Jean Lorrain', 'Rachilde', 'Villiers de l\'Isle-Adam', 'Jules Barbey d\'Aurevilly', 'Oscar Wilde', 'Gabriele D\'Annunzio', 'Maurice Rollinat'],
        keywords: ['artifice', 'opium', 'décadence', 'luxe', 'pervers', 'morbide', 'exquis', 'raffiné', 'poison'],
        color: '#4a148c'
    },
    nocturne: {
        name: 'Nocturne',
        icon: '🌙',
        description: 'Nuits blanches, insomnies et rêveries lunaires',
        authors: ['Gérard de Nerval', 'Novalis', 'Charles Baudelaire', 'Paul Verlaine', 'Rainer Maria Rilke', 'Federico García Lorca', 'E.T.A. Hoffmann', 'Aloysius Bertrand'],
        keywords: ['nuit', 'lune', 'étoiles', 'ténèbres', 'rêve', 'insomnie', 'ombre', 'silence', 'minuit'],
        color: '#1a237e'
    },
    voyage: {
        name: 'Antique',
        icon: '🏛️',
        description: 'Sagesse grecque et grandeur romaine',
        authors: ['Homère', 'Sophocle', 'Euripide', 'Platon', 'Aristote', 'Virgile', 'Ovide', 'Horace', 'Sénèque', 'Marc Aurèle', 'Cicéron'],
        keywords: ['Olympe', 'dieux', 'muse', 'oracle', 'temple', 'philosophe', 'vertu', 'sagesse'],
        color: '#8d6e63'
    },
    voyage: {
        name: 'Voyage',
        icon: '🚢',
        description: 'Horizons lointains et découvertes',
        authors: ['Jules Verne', 'Pierre Loti', 'Joseph Conrad', 'Herman Melville', 'Robert Louis Stevenson', 'Jack London', 'Marco Polo', 'Ibn Battûta'],
        keywords: ['voyage', 'mer', 'île', 'horizon', 'aventure', 'découverte', 'navire', 'explorateur', 'orient'],
        color: '#0288d1'
    },
    philosophie: {
        name: 'Philosophie',
        icon: '🧠',
        description: 'Méditations sur l\'existence et la pensée',
        authors: ['Platon', 'Aristote', 'Montaigne', 'Blaise Pascal', 'René Descartes', 'Jean-Jacques Rousseau', 'Voltaire', 'Friedrich Nietzsche', 'Arthur Schopenhauer', 'Sénèque'],
        keywords: ['pensée', 'raison', 'vérité', 'existence', 'mort', 'liberté', 'sagesse', 'doute', 'être'],
        color: '#455a64'
    }
};

// ═══════════════════════════════════════════════════════════
// 📜 ÉPOQUES LITTÉRAIRES
// ═══════════════════════════════════════════════════════════

const EPOQUES = {
    antiquite: {
        name: 'Antiquité',
        icon: '🏺',
        period: 'VIIIᵉ s. av. J.-C. – Vᵉ s.',
        description: 'L\'aube de la littérature : épopées, tragédies et sagesse des anciens',
        authors: ['Homère', 'Sophocle', 'Euripide', 'Eschyle', 'Aristophane', 'Platon', 'Aristote', 'Virgile', 'Ovide', 'Horace', 'Sénèque', 'Marc Aurèle', 'Cicéron', 'Lucrèce', 'Apulée', 'Pétrone'],
        keywords: ['mythologie', 'olympe', 'tragédie', 'héros', 'oracle', 'destin'],
        color: '#8d6e63'
    },
    medieval: {
        name: 'Moyen Âge',
        icon: '⚔️',
        period: 'Vᵉ – XVᵉ siècle',
        description: 'Chevaliers, troubadours et enluminures',
        authors: ['Chrétien de Troyes', 'François Villon', 'Dante Alighieri', 'Boccace', 'Pétrarque', 'Guillaume de Machaut', 'Marie de France', 'Jean de Meung', 'Rutebeuf', 'Christine de Pizan'],
        keywords: ['chevalier', 'amour courtois', 'quête', 'graal', 'troubadour', 'roman'],
        color: '#5d4037'
    },
    renaissance: {
        name: 'Renaissance',
        icon: '🎨',
        period: 'XVIᵉ siècle',
        description: 'Humanisme, redécouverte antique et soif de savoir',
        authors: ['François Rabelais', 'Michel de Montaigne', 'Pierre de Ronsard', 'Joachim du Bellay', 'Louise Labé', 'Clément Marot', 'Agrippa d\'Aubigné', 'Étienne de La Boétie', 'Maurice Scève', 'Shakespeare'],
        keywords: ['humanisme', 'éducation', 'sonnet', 'pléiade', 'amour', 'nature'],
        color: '#ff8f00'
    },
    classique: {
        name: 'Grand Siècle',
        icon: '👑',
        period: 'XVIIᵉ siècle',
        description: 'L\'âge d\'or français : raison, mesure et passions tragiques',
        authors: ['Molière', 'Jean Racine', 'Pierre Corneille', 'Jean de La Fontaine', 'Blaise Pascal', 'Madame de La Fayette', 'Nicolas Boileau', 'Jean de La Bruyère', 'François de La Rochefoucauld', 'Madame de Sévigné', 'Bossuet'],
        keywords: ['honnête homme', 'bienséance', 'tragédie', 'comédie', 'fable', 'moraliste'],
        color: '#ffd700'
    },
    lumieres: {
        name: 'Lumières',
        icon: '💡',
        period: 'XVIIIᵉ siècle',
        description: 'Raison critique, esprit philosophique et émancipation',
        authors: ['Voltaire', 'Jean-Jacques Rousseau', 'Denis Diderot', 'Montesquieu', 'Beaumarchais', 'Marivaux', 'L\'Abbé Prévost', 'Choderlos de Laclos', 'Bernardin de Saint-Pierre', 'Marquis de Sade', 'Condorcet'],
        keywords: ['raison', 'progrès', 'philosophie', 'encyclopédie', 'liberté', 'tolérance'],
        color: '#ffeb3b'
    },
    xixe: {
        name: 'XIXᵉ siècle',
        icon: '🏭',
        period: '1800 – 1900',
        description: 'Le siècle des révolutions : romantisme, réalisme, décadence',
        authors: ['Victor Hugo', 'Honoré de Balzac', 'Gustave Flaubert', 'Émile Zola', 'Stendhal', 'Charles Baudelaire', 'Arthur Rimbaud', 'Paul Verlaine', 'Gérard de Nerval', 'Alexandre Dumas', 'Guy de Maupassant', 'Théophile Gautier'],
        keywords: ['révolution', 'passion', 'société', 'naturalisme', 'symbolisme', 'spleen'],
        color: '#795548'
    },
    belleepoque: {
        name: 'Belle Époque',
        icon: '🎭',
        period: '1880 – 1914',
        description: 'Fêtes galantes, décadence et avant-gardes naissantes',
        authors: ['Marcel Proust', 'Colette', 'Guillaume Apollinaire', 'Paul Valéry', 'André Gide', 'Oscar Wilde', 'Rainer Maria Rilke', 'Joris-Karl Huysmans', 'Jean Lorrain', 'Maurice Maeterlinck'],
        keywords: ['salon', 'mondain', 'décadence', 'symbolisme', 'impressionnisme', 'art nouveau'],
        color: '#e91e63'
    },
    xxe: {
        name: 'XXᵉ siècle',
        icon: '💣',
        period: '1900 – 2000',
        description: 'Guerres, existentialisme et révolutions littéraires',
        authors: ['Albert Camus', 'Jean-Paul Sartre', 'Simone de Beauvoir', 'André Breton', 'Louis-Ferdinand Céline', 'Samuel Beckett', 'Marguerite Duras', 'Boris Vian', 'Marguerite Yourcenar', 'Antoine de Saint-Exupéry', 'Jean Genet'],
        keywords: ['absurde', 'existentialisme', 'surréalisme', 'engagement', 'modernité', 'guerre'],
        color: '#f44336'
    }
};

// ═══════════════════════════════════════════════════════════
// 🏛️ COURANTS LITTÉRAIRES
// ═══════════════════════════════════════════════════════════

const COURANTS = {
    humanisme: {
        name: 'Humanisme',
        icon: '📚',
        period: 'XVIᵉ siècle',
        description: 'Foi en l\'homme, éducation et sagesse antique retrouvée',
        authors: ['Michel de Montaigne', 'François Rabelais', 'Érasme', 'Thomas More', 'Étienne de La Boétie', 'Guillaume Budé'],
        keywords: ['homme', 'éducation', 'sagesse', 'vertu', 'raison', 'antiquité'],
        color: '#4caf50'
    },
    baroque: {
        name: 'Baroque',
        icon: '🎭',
        period: 'Fin XVIᵉ – début XVIIᵉ',
        description: 'Mouvement, illusion et vanité du monde',
        authors: ['Agrippa d\'Aubigné', 'Théophile de Viau', 'Saint-Amant', 'Tristan L\'Hermite', 'Góngora', 'Shakespeare'],
        keywords: ['inconstance', 'métamorphose', 'illusion', 'mort', 'vanité', 'spectacle'],
        color: '#9c27b0'
    },
    classicisme: {
        name: 'Classicisme',
        icon: '⚖️',
        period: 'XVIIᵉ siècle',
        description: 'Raison, équilibre et imitation des Anciens',
        authors: ['Molière', 'Jean Racine', 'Pierre Corneille', 'Jean de La Fontaine', 'Nicolas Boileau', 'Madame de La Fayette'],
        keywords: ['raison', 'règle', 'vraisemblance', 'bienséance', 'nature', 'universel'],
        color: '#607d8b'
    },
    romantisme: {
        name: 'Romantisme',
        icon: '🌹',
        period: '1820 – 1850',
        description: 'Exaltation du moi, passion et communion avec la nature',
        authors: ['Victor Hugo', 'Alphonse de Lamartine', 'Alfred de Musset', 'Alfred de Vigny', 'Gérard de Nerval', 'François-René de Chateaubriand', 'George Sand', 'Novalis', 'Lord Byron', 'John Keats'],
        keywords: ['moi', 'passion', 'nature', 'mélancolie', 'liberté', 'génie', 'sublime'],
        color: '#e91e63'
    },
    realisme: {
        name: 'Réalisme',
        icon: '🔬',
        period: '1850 – 1880',
        description: 'Peinture fidèle de la société et des moeurs',
        authors: ['Honoré de Balzac', 'Gustave Flaubert', 'Stendhal', 'Guy de Maupassant', 'Prosper Mérimée', 'Champfleury', 'Fiodor Dostoïevski', 'Léon Tolstoï'],
        keywords: ['société', 'observation', 'objectivité', 'bourgeoisie', 'argent', 'ambition'],
        color: '#795548'
    },
    naturalisme: {
        name: 'Naturalisme',
        icon: '🏭',
        period: '1870 – 1890',
        description: 'Roman expérimental et déterminisme social',
        authors: ['Émile Zola', 'Guy de Maupassant', 'Alphonse Daudet', 'Edmond et Jules de Goncourt', 'Joris-Karl Huysmans'],
        keywords: ['hérédité', 'milieu', 'expérimental', 'ouvrier', 'misère', 'déterminisme'],
        color: '#3e2723'
    },
    symbolisme: {
        name: 'Symbolisme',
        icon: '🌸',
        period: '1880 – 1900',
        description: 'Musique des mots, symboles et correspondances secrètes',
        authors: ['Charles Baudelaire', 'Stéphane Mallarmé', 'Paul Verlaine', 'Arthur Rimbaud', 'Jean Moréas', 'Gustave Kahn', 'Maurice Maeterlinck', 'Émile Verhaeren'],
        keywords: ['symbole', 'suggestion', 'musique', 'synesthésie', 'idéal', 'mystère'],
        color: '#7b1fa2'
    },
    surrealisme: {
        name: 'Surréalisme',
        icon: '👁️',
        period: '1920 – 1960',
        description: 'Libération de l\'inconscient et automatisme psychique',
        authors: ['André Breton', 'Paul Éluard', 'Louis Aragon', 'Robert Desnos', 'Philippe Soupault', 'Benjamin Péret', 'René Crevel', 'Antonin Artaud'],
        keywords: ['rêve', 'inconscient', 'automatisme', 'hasard', 'merveilleux', 'révolution'],
        color: '#ff5722'
    },
    existentialisme: {
        name: 'Existentialisme',
        icon: '🚬',
        period: '1940 – 1960',
        description: 'L\'existence précède l\'essence, liberté et engagement',
        authors: ['Jean-Paul Sartre', 'Albert Camus', 'Simone de Beauvoir', 'Jean Genet', 'Maurice Merleau-Ponty', 'Gabriel Marcel'],
        keywords: ['existence', 'liberté', 'absurde', 'engagement', 'angoisse', 'autrui'],
        color: '#212121'
    },
    absurde: {
        name: 'Absurde',
        icon: '🎪',
        period: '1950 – 1970',
        description: 'Théâtre de l\'incommunicabilité et du non-sens',
        authors: ['Samuel Beckett', 'Eugène Ionesco', 'Jean Genet', 'Arthur Adamov', 'Harold Pinter', 'Fernando Arrabal'],
        keywords: ['absurde', 'attente', 'langage', 'vide', 'dérision', 'tragique'],
        color: '#424242'
    }
};

let currentAmbiance = 'libre';
let currentExplorationMode = 'derives';

// ═══════════════════════════════════════════════════════════
// 🔄 NAVIGATION ENTRE MODES D'EXPLORATION
// ═══════════════════════════════════════════════════════════

function switchExplorationMode(mode) {
    currentExplorationMode = mode;
    
    // Mettre à jour les onglets
    document.querySelectorAll('.exploration-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    
    // Afficher la bonne barre
    document.getElementById('ambianceBar').style.display = mode === 'derives' ? 'flex' : 'none';
    document.getElementById('epoquesBar').style.display = mode === 'epoques' ? 'flex' : 'none';
    document.getElementById('courantsBar').style.display = mode === 'courants' ? 'flex' : 'none';
    
    // Réinitialiser les sélections
    document.querySelectorAll('.ambiance-pill').forEach(pill => pill.classList.remove('active'));
    if (mode === 'derives') {
        document.querySelector('[data-ambiance="libre"]')?.classList.add('active');
    }
    
    // Cacher l'intro
    document.getElementById('ambianceIntro').style.display = 'none';
}

// Sélectionner une époque
async function setEpoque(epoqueId) {
    const epoque = EPOQUES[epoqueId];
    if (!epoque) return;
    
    // Mettre à jour l'UI
    document.querySelectorAll('#epoquesBar .ambiance-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.ambiance === epoqueId);
    });
    
    // Afficher l'intro
    const introEl = document.getElementById('ambianceIntro');
    introEl.innerHTML = `
        <button class="close-intro" onclick="closeAmbianceIntro()" title="Fermer">✕</button>
        <h2>${epoque.icon} ${epoque.name}</h2>
        <p class="period-badge">${epoque.period}</p>
        <p>${epoque.description}</p>
        <div class="ambiance-tags">
            ${epoque.authors.slice(0, 6).map(a => `<span class="ambiance-tag" onclick="exploreFromAmbiance('${a.replace(/'/g, "\\'")}'" title="Explorer ${a}">${a}</span>`).join('')}
            ${epoque.authors.length > 6 ? `<span class="ambiance-tag more-authors" title="${epoque.authors.slice(6).join(', ')}">+${epoque.authors.length - 6}</span>` : ''}
        </div>
    `;
    introEl.style.display = 'block';
    
    // Effacer et recharger
    document.getElementById('feed').innerHTML = '';
    state.loading = false;
    
    toast(`${epoque.icon} ${epoque.name} – ${epoque.period}`);
    
    // Charger des auteurs de cette époque
    const shuffled = [...epoque.authors].sort(() => Math.random() - 0.5);
    for (const author of shuffled.slice(0, 3)) {
        await exploreAuthor(author);
    }
}

// Sélectionner un courant
async function setCourant(courantId) {
    const courant = COURANTS[courantId];
    if (!courant) return;
    
    // Mettre à jour l'UI
    document.querySelectorAll('#courantsBar .ambiance-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.ambiance === courantId);
    });
    
    // Afficher l'intro
    const introEl = document.getElementById('ambianceIntro');
    introEl.innerHTML = `
        <button class="close-intro" onclick="closeAmbianceIntro()" title="Fermer">✕</button>
        <h2>${courant.icon} ${courant.name}</h2>
        <p class="period-badge">${courant.period}</p>
        <p>${courant.description}</p>
        <div class="ambiance-tags">
            ${courant.authors.slice(0, 6).map(a => `<span class="ambiance-tag" onclick="exploreFromAmbiance('${a.replace(/'/g, "\\'")}'" title="Explorer ${a}">${a}</span>`).join('')}
            ${courant.authors.length > 6 ? `<span class="ambiance-tag more-authors" title="${courant.authors.slice(6).join(', ')}">+${courant.authors.length - 6}</span>` : ''}
        </div>
    `;
    introEl.style.display = 'block';
    
    // Effacer et recharger
    document.getElementById('feed').innerHTML = '';
    state.loading = false;
    
    toast(`${courant.icon} ${courant.name}`);
    
    // Charger des auteurs de ce courant
    const shuffled = [...courant.authors].sort(() => Math.random() - 0.5);
    for (const author of shuffled.slice(0, 3)) {
        await exploreAuthor(author);
    }
}

// Changer d'ambiance
async function setAmbiance(ambianceId) {
    const ambiance = AMBIANCES[ambianceId];
    if (!ambiance) return;
    
    currentAmbiance = ambianceId;
    
    // Mettre à jour l'UI
    document.querySelectorAll('#ambianceBar .ambiance-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.ambiance === ambianceId);
    });
    
    // Afficher l'intro si ce n'est pas "libre"
    const introEl = document.getElementById('ambianceIntro');
    if (ambianceId !== 'libre') {
        introEl.innerHTML = `
            <button class="close-intro" onclick="closeAmbianceIntro()" title="Fermer">✕</button>
            <h2>${ambiance.icon} ${ambiance.name}</h2>
            <p>${ambiance.description}</p>
            <div class="ambiance-tags">
                ${ambiance.authors.slice(0, 5).map(a => `<span class="ambiance-tag" onclick="exploreFromAmbiance('${a.replace(/'/g, "\\'")}'" title="Explorer ${a}">${a}</span>`).join('')}
                ${ambiance.authors.length > 5 ? `<span class="ambiance-tag more-authors" title="${ambiance.authors.slice(5).join(', ')}">+${ambiance.authors.length - 5} auteurs</span>` : ''}
            </div>
        `;
        introEl.style.display = 'block';
        introEl.style.position = 'relative';
    } else {
        introEl.style.display = 'none';
    }
    
    // Effacer le feed et recharger avec la nouvelle ambiance
    document.getElementById('feed').innerHTML = '';
    state.loading = false;
    
    // Toast
    toast(`${ambiance.icon} Mode ${ambiance.name} activé`);
    
    // Charger les textes de cette ambiance
    await loadAmbianceContent(ambianceId);
}

// Fermer l'intro d'ambiance
function closeAmbianceIntro() {
    const introEl = document.getElementById('ambianceIntro');
    introEl.style.display = 'none';
}

// Explorer un auteur depuis l'encart d'ambiance
async function exploreFromAmbiance(author) {
    toast(`🔍 Exploration de ${author}...`);
    await exploreAuthor(author);
}

// Charger le contenu d'une ambiance
async function loadAmbianceContent(ambianceId) {
    const ambiance = AMBIANCES[ambianceId];
    
    // Auteurs classiques par défaut
    const classicAuthors = ['Victor Hugo', 'Charles Baudelaire', 'Gustave Flaubert', 'Marcel Proust', 'Stendhal', 'Voltaire'];
    
    if (ambianceId === 'libre' || !ambiance.authors.length) {
        // Mode libre : utiliser un auteur classique au hasard
        await exploreAuthor(classicAuthors[Math.floor(Math.random() * classicAuthors.length)]);
        return;
    }
    
    // Choisir des auteurs/mots-clés de l'ambiance au hasard
    const shuffledAuthors = [...ambiance.authors].sort(() => Math.random() - 0.5);
    const shuffledKeywords = [...ambiance.keywords].sort(() => Math.random() - 0.5);
    
    // Charger 2-3 auteurs + 1-2 mots-clés pour variété
    const toLoad = [
        ...shuffledAuthors.slice(0, 2),
        ...shuffledKeywords.slice(0, 1)
    ];
    
    for (const term of toLoad) {
        await exploreAuthor(term);
    }
}

// Modifier randomJump pour respecter l'ambiance
// ═══════════════════════════════════════════════════════════
// �🎲 FONCTIONNALITÉS FUN - Le génie des graphes
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// 🏷️ SYSTÈME DE MOTS-CLÉS - Extraction et exploration
// ═══════════════════════════════════════════════════════════

// Dictionnaire de thèmes littéraires pour enrichir l'extraction
const LITERARY_THEMES = {
    emotions: ['amour', 'haine', 'joie', 'tristesse', 'mélancolie', 'désespoir', 'espoir', 'passion', 'colère', 'peur', 'angoisse', 'bonheur', 'souffrance', 'douleur', 'extase', 'ennui', 'solitude', 'nostalgie', 'regret', 'jalousie'],
    nature: ['forêt', 'mer', 'océan', 'montagne', 'rivière', 'fleuve', 'lac', 'ciel', 'étoiles', 'lune', 'soleil', 'aurore', 'crépuscule', 'nuit', 'jour', 'saison', 'printemps', 'été', 'automne', 'hiver', 'tempête', 'orage', 'pluie', 'neige', 'vent', 'fleur', 'arbre', 'jardin', 'campagne', 'désert'],
    existence: ['mort', 'vie', 'âme', 'destin', 'temps', 'éternité', 'infini', 'néant', 'existence', 'être', 'devenir', 'mémoire', 'oubli', 'rêve', 'sommeil', 'éveil', 'conscience', 'liberté', 'fatalité', 'hasard'],
    societe: ['roi', 'reine', 'prince', 'peuple', 'guerre', 'paix', 'justice', 'loi', 'pouvoir', 'gloire', 'honneur', 'vertu', 'crime', 'châtiment', 'révolte', 'révolution', 'patrie', 'exil', 'prison', 'esclavage'],
    spirituel: ['dieu', 'diable', 'ange', 'démon', 'paradis', 'enfer', 'péché', 'grâce', 'prière', 'foi', 'doute', 'mystère', 'sacré', 'profane', 'miracle', 'prophétie', 'apocalypse', 'résurrection', 'salut', 'damnation'],
    corps: ['coeur', 'yeux', 'regard', 'visage', 'main', 'sang', 'larme', 'sourire', 'baiser', 'étreinte', 'beauté', 'laideur', 'jeunesse', 'vieillesse', 'maladie', 'guérison', 'blessure', 'cicatrice'],
    art: ['poésie', 'musique', 'chant', 'danse', 'peinture', 'sculpture', 'théâtre', 'roman', 'conte', 'fable', 'légende', 'mythe', 'héros', 'muse', 'inspiration', 'génie', 'création'],
    voyage: ['voyage', 'chemin', 'route', 'errance', 'aventure', 'découverte', 'horizon', 'lointain', 'ailleurs', 'retour', 'départ', 'arrivée', 'navire', 'île', 'continent', 'orient', 'occident'],
    amour_passion: ['amant', 'amante', 'maîtresse', 'époux', 'épouse', 'fiancé', 'séduction', 'désir', 'volupté', 'ivresse', 'abandon', 'trahison', 'fidélité', 'rupture', 'retrouvailles']
};

// Mots vides à ignorer
const STOP_WORDS = new Set(['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi', 'dont', 'ce', 'cette', 'ces', 'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses', 'notre', 'votre', 'leur', 'nos', 'vos', 'leurs', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'on', 'se', 'ne', 'pas', 'plus', 'moins', 'tout', 'tous', 'toute', 'toutes', 'autre', 'autres', 'bien', 'peu', 'trop', 'aussi', 'encore', 'jamais', 'toujours', 'rien', 'personne', 'chaque', 'quelque', 'aucun', 'sans', 'avec', 'pour', 'par', 'dans', 'sur', 'sous', 'entre', 'vers', 'chez', 'comme', 'ainsi', 'alors', 'puis', 'quand', 'avoir', 'faire', 'dire', 'voir', 'aller', 'venir', 'pouvoir', 'vouloir', 'devoir', 'falloir', 'savoir', 'prendre', 'mettre', 'fait', 'dit', 'sont', 'ont', 'aux', 'the', 'and', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'for', 'with', 'from', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'nor', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'now', 'its', 'this', 'that', 'these', 'those', 'myself', 'our', 'ours', 'ourselves', 'your', 'yours', 'yourself', 'yourselves', 'him', 'his', 'himself', 'her', 'hers', 'herself', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'whom', 'whose']);

function extractKeywords(text, title, author, tag) {
    const keywords = new Set();
    const fullText = (text + ' ' + title).toLowerCase();
    
    // 1. Chercher les thèmes littéraires présents dans le texte
    for (const [category, themes] of Object.entries(LITERARY_THEMES)) {
        for (const theme of themes) {
            if (fullText.includes(theme.toLowerCase())) {
                keywords.add(theme);
                if (keywords.size >= 8) break;
            }
        }
        if (keywords.size >= 8) break;
    }
    
    // 2. Extraire les mots significatifs du texte
    const words = fullText
        .replace(/[.,;:!?()\[\]{}"']/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 4 && !STOP_WORDS.has(w));
    
    // Compter les occurrences
    const wordCount = {};
    words.forEach(w => wordCount[w] = (wordCount[w] || 0) + 1);
    
    // Ajouter les mots les plus fréquents
    const sorted = Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    for (const [word] of sorted) {
        if (keywords.size < 5 && word.length > 3 && !keywords.has(word)) {
            keywords.add(word);
        }
    }
    
    // 3. Ajouter le genre comme mot-clé si pas assez
    if (tag && keywords.size < 5) {
        keywords.add(tag);
    }
    
    return [...keywords].slice(0, 5);
}

// Explorer un mot-clé
async function exploreKeyword(keyword) {
    toast(`🏷️ Exploration de #${keyword}...`);
    await exploreAuthor(keyword);
}

// Auteurs "secrets" - pépites cachées mondiales à découvrir
const HIDDEN_GEMS = [
    // Français
    'Lautréamont', 'Aloysius Bertrand', 'Tristan Corbière', 'Jules Laforgue',
    // Anglais
    'John Donne', 'George Herbert', 'Thomas Traherne', 'Christopher Smart',
    // Allemand
    'Novalis', 'Hölderlin', 'Rilke', 'Trakl',
    // Italien
    'Leopardi', 'Ungaretti', 'Montale',
    // Espagnol
    'Góngora', 'Quevedo', 'San Juan de la Cruz',
    // Russe
    'Tyutchev', 'Mandelstam', 'Akhmatova',
    // Latin
    'Catullus', 'Propertius', 'Tibullus'
];

// Messages fun aléatoires
const FUN_MESSAGES = [
    "🦇 Vous vous enfoncez dans les ténèbres littéraires...",
    "🌀 La spirale des mots vous aspire...",
    "📚 Les livres murmurent votre nom...",
    "🕯️ Une bougie vacille dans la bibliothèque...",
    "🗝️ Vous avez trouvé une porte secrète...",
    "🦉 Un hibou vous observe depuis les étagères...",
    "🌙 La lune éclaire un passage inconnu...",
    "🎭 Les personnages vous guettent...",
    "⚗️ L'encre des siècles vous enivre...",
    "🏚️ Vous errez dans le grenier des âmes...",
    "🌊 Les vers déferlent comme des vagues...",
    "🔮 Le cristal révèle un auteur oublié...",
    "🕸️ La toile littéraire se tisse autour de vous...",
    "☄️ Un météore de mots traverse votre esprit...",
    "🎪 Bienvenue dans le cirque des poètes maudits..."
];

// Badges/Achievements
const ACHIEVEMENTS = {
    first_read: { icon: '📖', name: 'Premier pas', desc: 'Lire votre premier texte' },
    explorer_5: { icon: '🗺️', name: 'Explorateur', desc: 'Découvrir 5 auteurs' },
    explorer_15: { icon: '🧭', name: 'Aventurier', desc: 'Découvrir 15 auteurs' },
    explorer_30: { icon: '🏴‍☠️', name: 'Corsaire littéraire', desc: 'Découvrir 30 auteurs' },
    night_owl: { icon: '🦉', name: 'Noctambule', desc: 'Lire après minuit' },
    century_jump: { icon: '⏳', name: 'Voyageur temporel', desc: 'Passer du XIXe au XVIe siècle' },
    hidden_gem: { icon: '💎', name: 'Dénicheur', desc: 'Trouver un auteur secret' },
    love_10: { icon: '❤️‍🔥', name: 'Passionné', desc: 'Aimer 10 textes' },
    marathon: { icon: '🏃', name: 'Marathonien', desc: 'Lire 25 textes d\'affilée' },
    mystique: { icon: '✨', name: 'Mystique', desc: 'Explorer 5 textes mystiques' },
    poete_maudit: { icon: '🖤', name: 'Poète maudit', desc: 'Découvrir Lautréamont' },
    renaissance: { icon: '🏛️', name: 'Renaissance', desc: 'Lire 3 auteurs du XVIe' },
    symbolist: { icon: '🦢', name: 'Symboliste', desc: 'Explorer Mallarmé et Verlaine' }
};

// Saut aléatoire SANS thématique (ignore l'ambiance)
async function pureRandomJump() {
    // Liste étendue d'auteurs classiques de toutes époques et cultures
    const classicAuthors = [
        // Français - Classiques
        'Victor Hugo', 'Charles Baudelaire', 'Gustave Flaubert', 'Émile Zola',
        'Marcel Proust', 'Stendhal', 'Honoré de Balzac', 'Guy de Maupassant',
        'Alexandre Dumas', 'Jules Verne', 'Voltaire', 'Molière', 'Jean Racine',
        'Arthur Rimbaud', 'Paul Verlaine', 'Gérard de Nerval', 'Alfred de Musset',
        'François Rabelais', 'Michel de Montaigne', 'Jean de La Fontaine',
        'Pierre Corneille', 'Denis Diderot', 'Alphonse Daudet', 'Théophile Gautier',
        // Français - Modernes
        'Albert Camus', 'Jean-Paul Sartre', 'Simone de Beauvoir', 'Marguerite Duras',
        'André Gide', 'Colette', 'Anatole France', 'Paul Claudel', 'André Malraux',
        // Français - Poètes
        'Stéphane Mallarmé', 'Paul Valéry', 'Guillaume Apollinaire', 'René Char',
        'Saint-John Perse', 'Francis Ponge', 'Henri Michaux', 'Yves Bonnefoy',
        // Anglais
        'Shakespeare', 'Oscar Wilde', 'Edgar Allan Poe', 'Mary Shelley',
        'Charles Dickens', 'Jane Austen', 'Emily Brontë', 'Charlotte Brontë',
        'Virginia Woolf', 'James Joyce', 'William Blake', 'John Milton',
        'Geoffrey Chaucer', 'Lord Byron', 'Percy Shelley', 'John Keats',
        'William Wordsworth', 'Samuel Taylor Coleridge', 'Alfred Tennyson',
        // Américains
        'Herman Melville', 'Nathaniel Hawthorne', 'Mark Twain', 'Walt Whitman',
        'Emily Dickinson', 'Henry David Thoreau', 'Ralph Waldo Emerson',
        'F. Scott Fitzgerald', 'Ernest Hemingway', 'William Faulkner',
        // Allemands
        'Johann Wolfgang von Goethe', 'Friedrich Schiller', 'Heinrich Heine',
        'Thomas Mann', 'Franz Kafka', 'Hermann Hesse', 'Rainer Maria Rilke',
        // Russes
        'Fiodor Dostoïevski', 'Léon Tolstoï', 'Anton Tchekhov', 'Alexandre Pouchkine',
        'Nicolas Gogol', 'Ivan Tourgueniev', 'Boris Pasternak', 'Anna Akhmatova',
        // Italiens
        'Dante Alighieri', 'Pétrarque', 'Boccace', 'Machiavel', 'Luigi Pirandello',
        'Giacomo Leopardi', 'Italo Calvino', 'Primo Levi',
        // Espagnols
        'Cervantes', 'Federico García Lorca', 'Jorge Luis Borges', 'Pablo Neruda',
        'Octavio Paz', 'Gabriel García Márquez', 'Julio Cortázar',
        // Portugais
        'Fernando Pessoa', 'Luís de Camões', 'José Saramago',
        // Japonais
        'Matsuo Bashō', 'Murasaki Shikibu', 'Sei Shōnagon', 'Yukio Mishima',
        // Autres
        'Omar Khayyam', 'Rabindranath Tagore', 'Khalil Gibran', 'Rûmî',
        'Confucius', 'Lao Tseu', 'Li Bai', 'Du Fu',
        // Antiques
        'Homère', 'Virgile', 'Ovide', 'Horace', 'Sophocle', 'Euripide',
        'Eschyle', 'Platon', 'Aristote', 'Cicéron', 'Sénèque', 'Marc Aurèle'
    ];
    
    const discoveredAuthors = Object.keys(state.authorStats);
    const universalTerms = ['sonnet', 'elegy', 'ode', 'ballade', 'fable', 'nocturne', 'poème', 'conte', 'méditation', 'hymne', 'élégie', 'satire'];
    const allOptions = [...discoveredAuthors, ...HIDDEN_GEMS, ...universalTerms, ...classicAuthors];
    const unvisited = allOptions.filter(a => !state.authorStats[a]);
    const pool = unvisited.length > 3 ? unvisited : allOptions;
    
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    
    toast('🎲 Découverte libre...');
    
    await exploreAuthor(chosen);
    checkAchievements();
    updateFunStat();
}

// Saut aléatoire vers un auteur ou terme de recherche aléatoire
async function randomJump() {
    const ambiance = AMBIANCES[currentAmbiance];
    let pool = [];
    
    // Si une ambiance spécifique est active, utiliser ses auteurs/mots-clés
    if (currentAmbiance !== 'libre' && ambiance.authors.length > 0) {
        pool = [...ambiance.authors, ...ambiance.keywords];
    } else {
        // Mode libre : comportement classique
        const discoveredAuthors = Object.keys(state.authorStats);
        const universalTerms = ['sonnet', 'elegy', 'ode', 'ballade', 'fable', 'hymn', 'nocturne'];
        const allOptions = [...discoveredAuthors, ...HIDDEN_GEMS, ...universalTerms];
        const unvisited = allOptions.filter(a => !state.authorStats[a] && !HIDDEN_GEMS.includes(a) || HIDDEN_GEMS.includes(a));
        pool = unvisited.length > 3 ? unvisited : allOptions;
    }
    
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    
    toast(FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)]);
    
    setTimeout(async () => {
        await exploreAuthor(chosen);
        checkAchievements();
        updateFunStat();
    }, 1500);
}

// Mise à jour du message fun
function updateFunStat() {
    const el = document.getElementById('funStat');
    if (!el) return;
    
    const authorCount = Object.keys(state.authorStats).length;
    const readCount = state.readCount || 0;
    const likeCount = state.likes?.size || 0;
    
    const funStats = [
        `🌡️ Température littéraire : ${Math.min(100, readCount * 3)}°`,
        `🧬 ${authorCount} ADN d'auteurs dans votre sang`,
        `💫 ${likeCount} étincelles dans votre bibliothèque intérieure`,
        `🌀 Profondeur de dérive : niveau ${Math.floor(readCount / 5)}`,
        `🔥 Combo actuel : ${readCount} textes sans pause`,
        `🎲 Prochain saut aléatoire dans ${Math.max(1, 5 - (readCount % 5))} textes`,
        `📡 Signal littéraire : ${Math.min(100, authorCount * 5)}% de couverture`,
        `🧪 Dose de poésie : ${Math.floor(readCount * 2.7)}mg`,
    ];
    
    el.textContent = funStats[Math.floor(Math.random() * funStats.length)];
    el.style.opacity = '0';
    setTimeout(() => el.style.opacity = '1', 100);
}

// Vérification et déblocage des achievements
function checkAchievements() {
    const authorCount = Object.keys(state.authorStats).length;
    const readCount = state.readCount || 0;
    const likeCount = state.likes?.size || 0;
    const hour = new Date().getHours();
    
    const checks = [
        ['first_read', readCount >= 1],
        ['explorer_5', authorCount >= 5],
        ['explorer_15', authorCount >= 15],
        ['explorer_30', authorCount >= 30],
        ['night_owl', hour >= 0 && hour < 5],
        ['love_10', likeCount >= 10],
        ['marathon', readCount >= 25],
        ['mystique', (state.genreStats?.mystique || 0) >= 5],
        ['hidden_gem', HIDDEN_GEMS.some(a => state.authorStats[a])],
        ['poete_maudit', !!state.authorStats['Comte de Lautréamont']],
        ['symbolist', state.authorStats['Stéphane Mallarmé'] && state.authorStats['Paul Verlaine']]
    ];
    
    for (const [id, condition] of checks) {
        if (condition && !state.achievements.includes(id)) {
            unlockAchievement(id);
        }
    }
}

// Animation de déblocage d'achievement
function unlockAchievement(id) {
    const ach = ACHIEVEMENTS[id];
    if (!ach) return;
    
    state.achievements.push(id);
    saveState();
    
    // Notification spéciale
    const notif = document.createElement('div');
    notif.className = 'achievement-popup';
    notif.innerHTML = `
        <div class="achievement-icon">${ach.icon}</div>
        <div class="achievement-info">
            <div class="achievement-title">🏆 Badge débloqué !</div>
            <div class="achievement-name">${ach.name}</div>
            <div class="achievement-desc">${ach.desc}</div>
        </div>
    `;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.classList.add('show'), 100);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 500);
    }, 4000);
    
    renderAchievements();
}

// Affichage des badges avec progression
function renderAchievements() {
    const container = document.getElementById('achievementList');
    if (!container) return;
    
    const authorCount = Object.keys(state.authorStats).length;
    const readCount = state.readCount || 0;
    const likeCount = state.likes?.size || 0;
    const mystiqueCount = state.genreStats?.mystique || 0;
    
    // Définir la progression pour chaque badge
    const badgeProgress = {
        first_read: { current: Math.min(readCount, 1), target: 1, text: readCount >= 1 ? 'Complété !' : `${readCount}/1 texte lu` },
        explorer_5: { current: Math.min(authorCount, 5), target: 5, text: authorCount >= 5 ? 'Complété !' : `${authorCount}/5 auteurs découverts` },
        explorer_15: { current: Math.min(authorCount, 15), target: 15, text: authorCount >= 15 ? 'Complété !' : `${authorCount}/15 auteurs découverts` },
        explorer_30: { current: Math.min(authorCount, 30), target: 30, text: authorCount >= 30 ? 'Complété !' : `${authorCount}/30 auteurs découverts` },
        night_owl: { current: 0, target: 1, text: 'Lisez entre minuit et 5h du matin', special: true },
        century_jump: { current: 0, target: 1, text: 'Passez du XIXe au XVIe siècle', special: true },
        hidden_gem: { 
            current: HIDDEN_GEMS.some(a => state.authorStats[a]) ? 1 : 0, 
            target: 1, 
            text: HIDDEN_GEMS.some(a => state.authorStats[a]) ? 'Complété !' : 'Trouvez un auteur secret caché' 
        },
        love_10: { current: Math.min(likeCount, 10), target: 10, text: likeCount >= 10 ? 'Complété !' : `${likeCount}/10 textes aimés` },
        marathon: { current: Math.min(readCount, 25), target: 25, text: readCount >= 25 ? 'Complété !' : `${readCount}/25 textes lus d'affilée` },
        mystique: { current: Math.min(mystiqueCount, 5), target: 5, text: mystiqueCount >= 5 ? 'Complété !' : `${mystiqueCount}/5 textes mystiques explorés` },
        poete_maudit: { 
            current: state.authorStats['Comte de Lautréamont'] ? 1 : 0, 
            target: 1, 
            text: state.authorStats['Comte de Lautréamont'] ? 'Complété !' : 'Découvrez Lautréamont' 
        },
        renaissance: { 
            current: 0, target: 3, 
            text: 'Lisez 3 auteurs du XVIe siècle', special: true 
        },
        symbolist: { 
            current: (state.authorStats['Stéphane Mallarmé'] ? 1 : 0) + (state.authorStats['Paul Verlaine'] ? 1 : 0), 
            target: 2, 
            text: `Découvrez Mallarmé ${state.authorStats['Stéphane Mallarmé'] ? '✓' : '○'} et Verlaine ${state.authorStats['Paul Verlaine'] ? '✓' : '○'}` 
        }
    };
    
    const unlockedCount = state.achievements.length;
    const totalBadges = Object.keys(ACHIEVEMENTS).length;
    
    // Mettre à jour le compteur
    document.getElementById('unlockedCount').textContent = unlockedCount;
    document.getElementById('totalBadges').textContent = totalBadges;
    
    container.innerHTML = Object.entries(ACHIEVEMENTS).map(([id, ach]) => {
        const unlocked = state.achievements.includes(id);
        const progress = badgeProgress[id] || { current: 0, target: 1, text: ach.desc };
        const percent = Math.min(100, Math.round((progress.current / progress.target) * 100));
        
        return `
            <div class="achievement ${unlocked ? 'unlocked' : 'locked'}" onclick="showBadgeDetails('${id}')">
                <div class="badge-icon">${ach.icon}</div>
                <div class="badge-info">
                    <div class="badge-name">
                        ${ach.name}
                        ${unlocked ? '<span class="unlocked-check">✓</span>' : ''}
                    </div>
                    <div class="badge-desc">${ach.desc}</div>
                    ${!unlocked && !progress.special ? `
                        <div class="badge-progress">
                            <div class="badge-progress-bar">
                                <div class="badge-progress-fill" style="width: ${percent}%"></div>
                            </div>
                            <div class="badge-progress-text">${progress.text}</div>
                        </div>
                    ` : !unlocked && progress.special ? `
                        <div class="badge-progress">
                            <div class="badge-progress-text">💡 ${progress.text}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Toggle entre afficher tous les badges ou seulement les débloqués
let badgesExpanded = true;
function toggleBadgesView() {
    badgesExpanded = !badgesExpanded;
    const container = document.getElementById('achievementList');
    const toggle = document.getElementById('badgesToggle');
    
    if (badgesExpanded) {
        container.classList.remove('collapsed');
        toggle.textContent = 'Voir tout';
    } else {
        container.classList.add('collapsed');
        toggle.textContent = 'Débloqués seulement';
    }
}

// Afficher les détails d'un badge
function showBadgeDetails(id) {
    const ach = ACHIEVEMENTS[id];
    if (!ach) return;
    
    const unlocked = state.achievements.includes(id);
    
    const hints = {
        first_read: "Cliquez sur n'importe quel texte pour commencer votre voyage littéraire !",
        explorer_5: "Explorez différents auteurs en utilisant le bouton 🎲 ou la recherche.",
        explorer_15: "Continuez à découvrir de nouveaux auteurs. Chaque nom cache un univers !",
        explorer_30: "Devenez un véritable corsaire des lettres en naviguant entre 30 auteurs différents.",
        night_owl: "Les plus beaux textes se lisent parfois à la lueur de la lune... Revenez entre minuit et 5h !",
        century_jump: "Voyagez dans le temps ! Lisez un auteur du XIXe puis sautez au XVIe siècle.",
        hidden_gem: "Certains auteurs sont cachés... Cherchez les trésors oubliés de la littérature.",
        love_10: "Cliquez sur ♥ pour sauvegarder vos textes préférés. 10 coups de cœur = 1 badge !",
        marathon: "Lisez 25 textes sans vous arrêter. Un vrai marathon littéraire !",
        mystique: "Explorez les textes aux thèmes mystiques, ésotériques ou spirituels.",
        poete_maudit: "Recherchez 'Lautréamont' ou 'Maldoror' pour découvrir ce poète maudit légendaire.",
        renaissance: "Recherchez des auteurs du XVIe siècle : Ronsard, Du Bellay, Rabelais...",
        symbolist: "Les symbolistes Mallarmé et Verlaine vous attendent. Recherchez leurs noms !"
    };
    
    toast(`${ach.icon} ${ach.name}${unlocked ? ' (Débloqué !)' : ''} - ${hints[id] || ach.desc}`, 5000);
}

// Chemin de lecture (breadcrumb visuel)
function addToReadingPath(author, title) {
    if (!state.readingPath) state.readingPath = [];
    
    // Garder les 8 derniers
    state.readingPath.push({ author, title: title?.split('/')[0] || '?', time: Date.now() });
    if (state.readingPath.length > 8) state.readingPath.shift();
    
    renderReadingPath();
    saveState();
}

function renderReadingPath() {
    const container = document.getElementById('readingPath');
    if (!container || !state.readingPath?.length) return;
    
    container.innerHTML = state.readingPath.map((node, i) => `
        <span class="path-node" title="${node.title}">
            ${node.author.split(' ').pop()}
        </span>
        ${i < state.readingPath.length - 1 ? '<span class="path-arrow">→</span>' : ''}
    `).join('');
}

document.onkeydown = e => { if (e.key === 'Escape') closeReader(); };

init();