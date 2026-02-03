// ═══════════════════════════════════════════════════════════
// 📱 FEED SOCIAL
// ═══════════════════════════════════════════════════════════

var socialExtraits = [];
var currentSocialTab = 'recent';
var feedSubscription = null;
var likesSubscription = null;
var lastFeedUpdate = null;

// ═══════════════════════════════════════════════════════════
// ❤️ SYSTÈME DE LIKES - Cache et état global
// ═══════════════════════════════════════════════════════════
var userLikesCache = new Set(); // Cache des IDs d'extraits likés par l'utilisateur
var likesCountCache = {};       // Cache des compteurs de likes par extrait
var likesLoaded = false;        // Flag pour savoir si les likes ont été chargés
var pendingLikeOperations = {}; // Opérations de like en cours (évite les doubles clics)
var extraitDataCache = new Map(); // Cache des données d'extraits

// ═══════════════════════════════════════════════════════════
// 💬 CACHE DES COMPTEURS DE COMMENTAIRES RÉELS
// ═══════════════════════════════════════════════════════════
var commentsCountCache = {}; // Cache des vrais compteurs de commentaires

// Charger les vrais compteurs de commentaires pour une liste d'extraits
async function loadCommentsCountForExtraits(extraitIds) {
    if (!supabaseClient || !extraitIds || extraitIds.length === 0) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('comments')
            .select('extrait_id')
            .in('extrait_id', extraitIds);
        
        if (!error && data) {
            // Reset les compteurs pour ces extraits
            extraitIds.forEach(id => commentsCountCache[id] = 0);
            // Compter les commentaires
            data.forEach(comment => {
                commentsCountCache[comment.extrait_id] = (commentsCountCache[comment.extrait_id] || 0) + 1;
            });
        }
    } catch (err) {
        console.error('Erreur chargement compteurs commentaires:', err);
    }
}

// Obtenir le vrai nombre de commentaires d'un extrait
function getRealCommentsCount(extraitId) {
    return commentsCountCache[extraitId] !== undefined ? commentsCountCache[extraitId] : null;
}

// Charger tous les likes de l'utilisateur connecté
async function loadUserLikesCache() {
    // Éviter les chargements redondants
    if (likesLoaded) return;
    
    if (!supabaseClient || !currentUser) {
        userLikesCache = new Set();
        likesLoaded = false;
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('likes')
            .select('extrait_id')
            .eq('user_id', currentUser.id);
        
        if (!error && data) {
            userLikesCache = new Set(data.map(l => l.extrait_id));
            likesLoaded = true;
            console.log(`✅ Likes cache chargé: ${userLikesCache.size} likes`);
        }
    } catch (err) {
        console.error('Erreur chargement cache likes:', err);
    }
}

// Charger les compteurs de likes pour une liste d'extraits
async function loadLikesCountForExtraits(extraitIds) {
    if (!supabaseClient || !extraitIds || extraitIds.length === 0) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('likes')
            .select('extrait_id')
            .in('extrait_id', extraitIds);
        
        if (!error && data) {
            // Reset les compteurs pour ces extraits
            extraitIds.forEach(id => likesCountCache[id] = 0);
            // Compter les likes
            data.forEach(like => {
                likesCountCache[like.extrait_id] = (likesCountCache[like.extrait_id] || 0) + 1;
            });
        }
    } catch (err) {
        console.error('Erreur chargement compteurs likes:', err);
    }
}

// Vérifier si l'utilisateur a liké un extrait (depuis le cache)
function isExtraitLiked(extraitId) {
    return userLikesCache.has(extraitId);
}

// Obtenir le nombre de likes d'un extrait (depuis le cache)
function getLikeCount(extraitId) {
    return likesCountCache[extraitId] || 0;
}

function openSocialFeed() {
    var overlay = document.getElementById('socialOverlay');
    overlay.classList.add('open');
    // Charger le cache des likes si pas encore fait
    if (!likesLoaded && currentUser) {
        loadUserLikesCache();
    }
    loadSocialFeed();
    setupRealtimeSubscriptions();
}

function closeSocialFeed() {
    document.getElementById('socialOverlay').classList.remove('open');
    // Cleanup subscriptions when closing
    if (feedSubscription && supabaseClient) {
        supabaseClient.removeChannel(feedSubscription);
        feedSubscription = null;
    }
    if (likesSubscription && supabaseClient) {
        supabaseClient.removeChannel(likesSubscription);
        likesSubscription = null;
    }
}

// Track last loaded timestamp to avoid showing indicator for old content
let lastFeedLoadTime = Date.now();
let pendingNewContent = false;

// Setup realtime subscriptions
function setupRealtimeSubscriptions() {
    if (!supabaseClient || feedSubscription) return;
    
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const currentUserId = currentUser?.id;
    
    // Subscribe to new extraits only (INSERT events)
    feedSubscription = supabaseClient
        .channel('extraits-changes')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'extraits' },
            (payload) => {
                // Ignorer ses propres partages
                if (payload.new && payload.new.user_id === currentUserId) return;
                // Ignorer si créé avant le dernier chargement
                if (payload.new && new Date(payload.new.created_at).getTime() < lastFeedLoadTime) return;
                
                showNewContentIndicator();
            }
        )
        .subscribe();
    
    // Ne pas s'abonner aux likes - trop fréquent et pas pertinent pour "nouveau contenu"
}

function showNewContentIndicator() {
    // Éviter les doublons
    if (pendingNewContent) return;
    pendingNewContent = true;
    
    const indicator = document.getElementById('liveIndicator');
    if (indicator) {
        indicator.textContent = '🔔 Nouveau contenu disponible - Cliquez pour actualiser';
        indicator.classList.add('new-content');
        indicator.style.cursor = 'pointer';
        indicator.onclick = () => refreshFeed();
    }
}

async function refreshFeed() {
    const btn = document.getElementById('refreshBtn');
    const indicator = document.getElementById('liveIndicator');
    
    if (btn) btn.classList.add('spinning');
    if (indicator) {
        indicator.textContent = '🟢 En direct';
        indicator.classList.remove('new-content');
        indicator.style.cursor = 'default';
        indicator.onclick = null;
    }
    
    // Reset tracking variables
    pendingNewContent = false;
    lastFeedLoadTime = Date.now();
    
    await loadSocialFeed();
    
    if (btn) setTimeout(() => btn.classList.remove('spinning'), 500);
    toast('🔄 Feed actualisé !');
}

function switchSocialTab(tab) {
    currentSocialTab = tab;
    document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
    const tabEl = document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (tabEl) tabEl.classList.add('active');
    loadSocialFeed();
}

async function loadSocialFeed() {
    const container = document.getElementById('socialFeed');
    if (!container) return;
    
    // Reset content tracking on each load
    lastFeedLoadTime = Date.now();
    pendingNewContent = false;
    
    if (typeof isSupabaseConfigured === 'function' && !isSupabaseConfigured()) {
        container.innerHTML = `
            <div class="social-empty">
                <div class="social-empty-icon">⚙️</div>
                <div class="social-empty-title">Configuration requise</div>
                <div class="social-empty-text">
                    Pour activer le feed social, configurez Supabase:<br><br>
                    1. Créez un compte sur <a href="https://supabase.com" target="_blank" style="color:var(--accent)">supabase.com</a><br>
                    2. Créez un nouveau projet<br>
                    3. Copiez l'URL et la clé anon<br>
                    4. Remplacez les valeurs dans le code
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `<div class="feed-loading"><div class="spinner"></div><span>${typeof t === 'function' ? t('loading') : 'Loading...'}</span></div>`;
    
    let query = supabaseClient
        .from('extraits')
        .select('*')
        .or('is_silent.is.null,is_silent.eq.false')  // Exclure les extraits silencieux (créés pour likes)
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (currentSocialTab === 'activity') {
        // Afficher l'activité récente (likes)
        if (typeof loadActivityFeed === 'function') await loadActivityFeed();
        return;
    } else if (currentSocialTab === 'mine' && currentUser) {
        query = supabaseClient
            .from('extraits')
            .select('*')
            .eq('user_id', currentUser.id)
            .or('is_silent.is.null,is_silent.eq.false')  // Exclure les extraits silencieux
            .order('created_at', { ascending: false });
    } else if (currentSocialTab === 'friends' && currentUser) {
        // Charger les extraits des amis
        if (typeof loadUserFollowing === 'function') await loadUserFollowing();
        
        if (typeof userFollowing !== 'undefined' && userFollowing.size === 0) {
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
            .select('*')
            .in('user_id', Array.from(userFollowing))
            .or('is_silent.is.null,is_silent.eq.false')  // Exclure les extraits silencieux
            .order('created_at', { ascending: false })
            .limit(50);
    } else if (currentSocialTab === 'discover') {
        // Afficher tous les utilisateurs actifs
        if (typeof loadUserFollowing === 'function') await loadUserFollowing();
        if (typeof loadDiscoverUsers === 'function') await loadDiscoverUsers();
        return;
    } else if (currentSocialTab === 'followers') {
        // Afficher mes abonnés (qui me suivent)
        if (typeof loadMyFollowers === 'function') await loadMyFollowers();
        return;
    }
    
    const { data, error } = await query;
    
    if (error) {
        container.innerHTML = `<div class="social-empty">Erreur : ${error.message}</div>`;
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

    if (typeof loadProfilesMap === 'function') {
        const profileMap = await loadProfilesMap(data.map(e => e.user_id));
        data.forEach(extrait => {
            extrait.profiles = profileMap.get(extrait.user_id) || null;
        });
    }
    
    socialExtraits = data;
    renderSocialFeed();
}

async function renderSocialFeed() {
    const container = document.getElementById('socialFeed');
    if (!container) return;
    
    // Charger les compteurs de likes pour ces extraits
    const extraitIds = socialExtraits.map(e => e.id);
    await loadLikesCountForExtraits(extraitIds);
    
    // Charger les VRAIS compteurs de commentaires (pas comments_count qui peut être désynchronisé)
    await loadCommentsCountForExtraits(extraitIds);
    
    // S'assurer que le cache utilisateur est chargé
    if (currentUser && !likesLoaded) {
        await loadUserLikesCache();
    }
    
    // Charger les follows si pas déjà fait
    if (currentUser && typeof loadUserFollowing === 'function') {
        await loadUserFollowing();
    }
    
    // Charger les infos de partages
    if (typeof loadExtraitShareInfoBatch === 'function') {
        await loadExtraitShareInfoBatch(extraitIds);
    }
    
    // Charger les infos de collections
    if (typeof loadExtraitCollectionsInfoBatch === 'function') {
        await loadExtraitCollectionsInfoBatch(extraitIds);
    }
    
    container.innerHTML = socialExtraits.map(extrait => {
        const username = extrait.profiles?.username || 'Anonyme';
        const avatarSymbol = getAvatarSymbol(username);
        const timeAgo = formatTimeAgo(new Date(extrait.created_at));
        const isLiked = isExtraitLiked(extrait.id);
        const likeCount = getLikeCount(extrait.id);
        const isFollowing = typeof userFollowing !== 'undefined' && userFollowing.has(extrait.user_id);
        extraitDataCache.set(extrait.id, extrait);

        // Lire les compteurs depuis le cache (peuplé par les batch loads ci-dessus)
        const shareInfo = typeof extraitSharesCache !== 'undefined' && extraitSharesCache.get(extrait.id);
        const shareCount = shareInfo?.count || 0;
        const collInfo = typeof extraitCollectionsCache !== 'undefined' && extraitCollectionsCache.get(extrait.id);
        const collCount = collInfo?.count || 0;
        
        // Utiliser le VRAI compteur de commentaires depuis le cache
        const commentsCount = getRealCommentsCount(extrait.id) !== null ? getRealCommentsCount(extrait.id) : (extrait.comments_count || 0);

        // Échapper les quotes pour éviter les erreurs de syntaxe JS
        const safeUrl = (extrait.source_url || '').replace(/'/g, "\\'");
        const safeTitle = (extrait.source_title || '').replace(/'/g, "\\'");
        const safeUsername = (username || '').replace(/'/g, "\\'");

        return `
            <div class="extrait-card" data-id="${extrait.id}">
                <div class="extrait-header">
                    <div class="extrait-avatar" onclick="openUserProfile('${extrait.user_id}', '${safeUsername}')" style="cursor:pointer">${avatarSymbol}</div>
                    <div class="extrait-user-info" onclick="openUserProfile('${extrait.user_id}', '${safeUsername}')" style="cursor:pointer">
                        <div class="extrait-username">${escapeHtml(username)}</div>
                        <div class="extrait-time">${timeAgo}</div>
                    </div>
                    ${currentUser && extrait.user_id !== currentUser.id ? `
                        <button class="btn-follow-small ${isFollowing ? 'following' : ''}" onclick="toggleFollow('${extrait.user_id}', event)">
                            ${isFollowing ? t('followed') : t('follow_short')}
                        </button>
                    ` : ''}
                </div>
                <div class="extrait-text" id="extraitText-${extrait.id}">${escapeHtml(extrait.texte)}</div>
                ${extrait.source_url ? `<button class="btn-voir-plus" onclick="loadFullTextFromSource(this)" id="voirPlus-${extrait.id}" data-extrait-id="${extrait.id}" data-source-url="${escapeHtml(extrait.source_url)}" data-source-title="${escapeHtml(extrait.source_title || '')}">${t('view_full_text')}</button>` : ''}
                <div class="extrait-source">
                    <strong>${escapeHtml(extrait.source_author)}</strong> — ${escapeHtml(extrait.source_title)}
                    ${extrait.source_url ? `<a href="${extrait.source_url}" target="_blank" class="source-link">🔗</a>` : ''}
                </div>
                ${extrait.commentary ? `<div class="extrait-commentary">${escapeHtml(extrait.commentary)}</div>` : ''}
                <div class="extrait-actions">
                    <button class="extrait-action like-btn ${isLiked ? 'liked' : ''}" id="likeBtn-${extrait.id}" onclick="toggleLikeExtrait('${extrait.id}')" data-extrait-id="${extrait.id}">
                        <span class="like-icon">${isLiked ? '♥' : '♡'}</span>
                        <span class="like-count ${likeCount === 0 ? 'is-zero' : ''}" id="likeCount-${extrait.id}" onclick="event.stopPropagation(); showLikers('${extrait.id}')">${likeCount}</span>
                    </button>
                    <div class="share-btn-wrapper">
                        <button class="extrait-action share-btn" onclick="shareExtraitFromCard('${extrait.id}')">
                            <span class="icon">⤴</span>
                            <span class="share-count ${shareCount === 0 ? 'is-zero' : ''}" id="shareCount-${extrait.id}" onclick="event.stopPropagation(); event.preventDefault(); showSharers('${extrait.id}')">${shareCount}</span>
                        </button>
                        ${currentUser && extrait.user_id === currentUser.id ? `
                            <button class="unshare-badge" id="unshareBtn-${extrait.id}" onclick="event.stopPropagation(); cancelShareExtrait('${extrait.id}')" title="${t('tooltip_cancel_share')}">×</button>
                        ` : ''}
                    </div>
                    <button class="extrait-action collection-btn" onclick="openCollectionPickerForExtrait('${extrait.id}')">
                        <span class="icon">▦</span>
                        <span class="collections-count ${collCount === 0 ? 'is-zero' : ''}" id="collectionsCount-${extrait.id}" onclick="event.stopPropagation(); event.preventDefault(); showExtraitCollections('${extrait.id}')">${collCount}</span>
                    </button>
                </div>
                <div class="comments-section">
                    <button class="comments-toggle" onclick="toggleComments('${extrait.id}')">
                        💬 <span id="commentCount-${extrait.id}">${commentsCount}</span> ${commentsCount !== 1 ? t('comment_plural') : t('comment_singular')}
                    </button>
                    <div class="comments-container" id="comments-${extrait.id}">
                        <div class="comments-list" id="commentsList-${extrait.id}">
                            <div class="comments-empty">${t('loading_comments')}</div>
                        </div>
                        <div class="comment-input-area">
                            <textarea class="comment-input" id="commentInput-${extrait.id}" placeholder="${t('write_comment')}" rows="1" onkeypress="if(event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); postComment('${extrait.id}'); }"></textarea>
                            <button class="comment-send" onclick="postComment('${extrait.id}')">➤</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Charger les commentaires pour ces extraits (si disponible)
    if (typeof loadCommentsForExtraits === 'function') {
        await loadCommentsForExtraits();
    }
    
    // Mettre à jour les compteurs de partages et collections
    if (typeof updateExtraitShareButtons === 'function') {
        updateExtraitShareButtons(extraitIds);
    }
    if (typeof updateExtraitCollectionsButtons === 'function') {
        updateExtraitCollectionsButtons(extraitIds);
    }
}

async function toggleLikeExtrait(extraitId) {
    if (!currentUser) {
        if (typeof openAuthModal === 'function') openAuthModal('login');
        toast('📝 Connectez-vous pour liker');
        return;
    }
    if (!supabaseClient) return;
    
    // Éviter les doubles clics
    if (pendingLikeOperations[extraitId]) {
        return;
    }
    pendingLikeOperations[extraitId] = true;
    
    // Éléments UI
    const likeBtn = document.getElementById(`likeBtn-${extraitId}`);
    const likeIcon = likeBtn?.querySelector('.like-icon');
    const likeCountEl = document.getElementById(`likeCount-${extraitId}`);
    
    try {
        // ═══════════════════════════════════════════════════════════
        // VÉRIFIER L'ÉTAT RÉEL DANS LA BASE DE DONNÉES
        // ═══════════════════════════════════════════════════════════
        const { data: existingLike } = await supabaseClient
            .from('likes')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('extrait_id', extraitId)
            .maybeSingle();
        
        const wasLiked = !!existingLike;
        const currentCount = parseInt(likeCountEl?.textContent) || 0;
        
        // ═══════════════════════════════════════════════════════════
        // MISE À JOUR OPTIMISTE DE L'UI (instantanée)
        // ═══════════════════════════════════════════════════════════
        const newCount = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
        
        // Mettre à jour le cache
        if (wasLiked) {
            userLikesCache.delete(extraitId);
        } else {
            userLikesCache.add(extraitId);
        }
        likesCountCache[extraitId] = newCount;
        
        // Mettre à jour l'UI immédiatement
        if (likeBtn) {
            likeBtn.classList.toggle('liked', !wasLiked);
            likeBtn.classList.add('like-animating');
            setTimeout(() => likeBtn.classList.remove('like-animating'), 300);
        }
        if (likeIcon) {
            likeIcon.textContent = wasLiked ? '♡' : '♥';
        }
        if (likeCountEl) {
            likeCountEl.textContent = newCount;
            likeCountEl.classList.toggle('is-zero', newCount === 0);
        }
        
        // ═══════════════════════════════════════════════════════════
        // SYNCHRONISATION AVEC LA BASE DE DONNÉES
        // ═══════════════════════════════════════════════════════════
        if (wasLiked) {
            // Supprimer le like (le trigger met à jour likes_count)
            const { error } = await supabaseClient
                .from('likes')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('extrait_id', extraitId);

            if (error) throw error;

        } else {
            // Ajouter le like (le trigger met à jour likes_count)
            const { error } = await supabaseClient
                .from('likes')
                .insert({
                    user_id: currentUser.id,
                    extrait_id: extraitId
                });

            if (error) throw error;
            
            // Notifier l'auteur de l'extrait
            const extrait = socialExtraits.find(e => e.id === extraitId);
            if (extrait && extrait.user_id !== currentUser.id && typeof createNotification === 'function') {
                await createNotification(extrait.user_id, 'like', extraitId);
            }
        }
        
        // Mettre à jour les stats utilisateur en arrière-plan
        if (typeof loadUserStats === 'function') {
            loadUserStats();
        }
        
    } catch (err) {
        console.error('Erreur like:', err);
        
        // ═══════════════════════════════════════════════════════════
        // ROLLBACK EN CAS D'ERREUR - Recharger l'état réel
        // ═══════════════════════════════════════════════════════════
        await loadUserLikesCache();
        const extraitIds = socialExtraits.map(e => e.id);
        await loadLikesCountForExtraits(extraitIds);
        
        // Restaurer l'UI avec les vraies valeurs
        const isNowLiked = isExtraitLiked(extraitId);
        const realCount = getLikeCount(extraitId);
        
        if (likeBtn) {
            likeBtn.classList.toggle('liked', isNowLiked);
        }
        if (likeIcon) {
            likeIcon.textContent = isNowLiked ? '♥' : '♡';
        }
        if (likeCountEl) {
            likeCountEl.textContent = realCount;
            likeCountEl.classList.toggle('is-zero', realCount === 0);
        }

        toast('Erreur de synchronisation');
    } finally {
        delete pendingLikeOperations[extraitId];
    }
}

function copyExtrait(extraitId) {
    const extrait = socialExtraits.find(e => e.id === extraitId);
    if (!extrait) return;
    
    const text = `"${extrait.texte}"\n— ${extrait.source_author}, ${extrait.source_title}`;
    navigator.clipboard.writeText(text);
    toast('📋 Extrait copié !');
}

/**
 * Récupérer les données complètes d'un extrait (cache + Supabase)
 */
async function getExtraitData(extraitId) {
    if (!extraitId) return null;

    if (extraitDataCache.has(extraitId)) {
        return extraitDataCache.get(extraitId);
    }

    const local = socialExtraits.find(e => e.id === extraitId);
    if (local) {
        extraitDataCache.set(extraitId, local);
        return local;
    }

    if (!supabaseClient) return null;

    try {
        const { data, error } = await supabaseClient
            .from('extraits')
            .select('*')
            .eq('id', extraitId)
            .single();

        if (error) throw error;

        if (data && typeof loadProfilesMap === 'function') {
            const profileMap = await loadProfilesMap([data.user_id]);
            data.profiles = profileMap.get(data.user_id) || null;
        }

        if (data) {
            extraitDataCache.set(extraitId, data);
        }

        return data || null;
    } catch (err) {
        console.error('Erreur récupération extrait:', err);
        return null;
    }
}

/**
 * Hydrater les likes + UI pour une liste d'extraits
 */
async function hydrateExtraitLikesUI(extraitIds) {
    if (!extraitIds || extraitIds.length === 0) return;

    await loadLikesCountForExtraits(extraitIds);

    if (currentUser && !likesLoaded) {
        await loadUserLikesCache();
    }

    extraitIds.forEach(id => {
        const likeBtn = document.getElementById(`likeBtn-${id}`);
        const likeIcon = likeBtn?.querySelector('.like-icon');
        const likeCountEl = document.getElementById(`likeCount-${id}`);
        const liked = isExtraitLiked(id);
        const count = getLikeCount(id);

        if (likeBtn) {
            likeBtn.classList.toggle('liked', liked);
        }
        if (likeIcon) {
            likeIcon.textContent = liked ? '♥' : '♡';
        }
        if (likeCountEl) {
            likeCountEl.textContent = count;
            likeCountEl.classList.toggle('is-zero', count === 0);
        }
    });
}

// Charger le texte complet - utilise le texte stocké si complet, sinon fallback Wikisource
// Accepte soit un élément bouton (avec data-attributes), soit les anciens paramètres
async function loadFullTextFromSource(btnOrId, sourceUrlParam, sourceTitleParam) {
    let extraitId, sourceUrl, sourceTitle, btnEl;
    
    // Nouvelle API: bouton avec data-attributes
    if (btnOrId && typeof btnOrId === 'object' && btnOrId.dataset) {
        btnEl = btnOrId;
        extraitId = btnEl.dataset.extraitId;
        sourceUrl = btnEl.dataset.sourceUrl;
        sourceTitle = btnEl.dataset.sourceTitle;
    } else {
        // Ancienne API: paramètres directs (fallback)
        extraitId = btnOrId;
        sourceUrl = sourceUrlParam;
        sourceTitle = sourceTitleParam;
        btnEl = document.getElementById(`voirPlus-${extraitId}`);
    }
    
    const textEl = document.getElementById(`extraitText-${extraitId}`);
    
    if (!textEl || !sourceUrl) return;

    const scrollEl = textEl.closest('.favorites-overlay') || document.scrollingElement;
    const scrollTop = scrollEl ? scrollEl.scrollTop : window.scrollY;
    
    // ═══════════════════════════════════════════════════════════
    // Vérifier si le texte stocké est déjà complet (nouveaux extraits)
    // Critère : longueur > 500 et ne finit pas par "…"
    // ═══════════════════════════════════════════════════════════
    if (!textEl.dataset.fullText && extraitId) {
        let storedText = null;
        
        // 1. Essayer le cache extraitDataCache
        if (typeof extraitDataCache !== 'undefined' && extraitDataCache.has(extraitId)) {
            const cached = extraitDataCache.get(extraitId);
            if (cached && cached.texte) {
                storedText = cached.texte;
            }
        }
        
        // 2. Si pas en cache, requêter Supabase
        if (!storedText && supabaseClient) {
            try {
                const { data } = await supabaseClient
                    .from('extraits')
                    .select('texte')
                    .eq('id', extraitId)
                    .single();
                if (data && data.texte) {
                    storedText = data.texte;
                }
            } catch (e) {
                console.warn('Erreur récupération texte stocké:', e);
            }
        }
        
        // 3. Vérifier si le texte stocké est complet (pas un aperçu tronqué)
        if (storedText && storedText.length > 500 && !storedText.endsWith('…')) {
            // Texte complet stocké en base - l'utiliser directement sans appel API
            textEl.dataset.fullText = storedText;
            textEl.dataset.previewText = textEl.textContent || '';
        }
    }

    // Si déjà chargé, basculer sans recharger
    if (textEl.dataset.fullText) {
        const isExpanded = textEl.dataset.expanded === 'true';
        if (isExpanded) {
            const previewText = textEl.dataset.previewText || '';
            textEl.innerHTML = '';
            textEl.textContent = previewText;
            textEl.dataset.expanded = 'false';
            if (btnEl) {
                btnEl.innerHTML = t('view_full_text');
                btnEl.classList.remove('exhausted');
            }
        } else {
            const fullText = textEl.dataset.fullText;
            textEl.innerHTML = '';
            const chunkEl = document.createElement('div');
            chunkEl.className = 'text-chunk';
            chunkEl.style.animation = 'fadeIn 0.4s ease';
            chunkEl.textContent = fullText;
            textEl.appendChild(chunkEl);
            textEl.dataset.expanded = 'true';
            if (btnEl) {
                btnEl.innerHTML = t('collapse');
                btnEl.classList.remove('exhausted');
            }
        }
        requestAnimationFrame(() => {
            if (scrollEl) scrollEl.scrollTop = scrollTop;
            else window.scrollTo(0, scrollTop);
        });
        return;
    }
    
    // Afficher le chargement
    if (btnEl) btnEl.innerHTML = `⏳ ${typeof t === 'function' ? t('loading') : 'Loading...'}`;
    
    try {
        let fullText = '';
        
        // Extraire la langue et le titre de l'URL Wikisource
        const wikisourceMatch = sourceUrl.match(/https?:\/\/(\w+)\.wikisource\.org\/wiki\/(.+)/);
        // Détecter les URLs Gutenberg
        const gutenbergMatch = sourceUrl.match(/https?:\/\/(?:www\.)?gutenberg\.org\/ebooks\/(\d+)/);
        
        if (wikisourceMatch) {
            // URL Wikisource - utiliser l'API MediaWiki avec détection de sommaire
            const lang = wikisourceMatch[1];
            let pageTitle = decodeURIComponent(wikisourceMatch[2]);
            const baseUrl = `https://${lang}.wikisource.org`;
            
            // Sauvegarder l'extrait actuel pour permettre le repli
            if (!textEl.dataset.previewText) {
                textEl.dataset.previewText = textEl.textContent || '';
            }
            
            // Fonction pour charger une page avec détection de sommaire
            const loadPageWithFallback = async (title, depth = 0) => {
                if (depth > 3) return null;
                
                // Requête enrichie avec liens pour détecter les sommaires
                const apiUrl = `${baseUrl}/w/api.php?` + new URLSearchParams({
                    action: 'parse',
                    page: title,
                    prop: 'text|links',
                    pllimit: '100',
                    format: 'json',
                    origin: '*',
                    redirects: 'true'
                });
                
                const response = await fetch(apiUrl);
                const data = await response.json();
                
                if (data.error || !data.parse?.text?.['*']) return null;
                
                const html = data.parse.text['*'];
                const links = data.parse.links || [];
                
                // Parser le HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : html;
                
                // Supprimer les éléments indésirables
                tempDiv.querySelectorAll('table, .mw-editsection, script, style, .noprint, .reference, sup.reference, .navigation, .toc').forEach(el => el.remove());
                
                // Extraire le texte des paragraphes
                let text = '';
                const paragraphs = tempDiv.querySelectorAll('p, .poem, .verse, blockquote, div.text');
                paragraphs.forEach(p => {
                    const t = p.textContent.trim();
                    if (t.length > 20) text += t + '\n\n';
                });
                
                if (text.length < 100) {
                    text = tempDiv.textContent
                        .replace(/\[\d+\]/g, '')
                        .replace(/\[modifier\]/gi, '')
                        .replace(/\s+/g, ' ')
                        .trim();
                }
                
                // Vérifier si c'est un sommaire (beaucoup de liens vers sous-pages, peu de texte)
                const basePage = title.split('/')[0];
                const subPageLinks = links.filter(l => {
                    const linkTitle = l['*'] || '';
                    return linkTitle.startsWith(basePage + '/') && l.ns === 0;
                });
                
                const isLikelySommaire = subPageLinks.length >= 3 && text.length < 500;
                
                if (isLikelySommaire && subPageLinks.length > 0) {
                    // C'est un sommaire - chercher une sous-page qui contient l'extrait
                    const previewText = textEl.dataset.previewText || '';
                    const normPreview = previewText.replace(/\s+/g, ' ').trim().toLowerCase().substring(0, 50);
                    
                    // Essayer les sous-pages une par une pour trouver celle qui contient le texte
                    for (const subLink of subPageLinks.slice(0, 5)) {
                        const subResult = await loadPageWithFallback(subLink['*'], depth + 1);
                        if (subResult && subResult.length > 200) {
                            const normSub = subResult.replace(/\s+/g, ' ').trim().toLowerCase();
                            if (normSub.includes(normPreview.substring(0, 30))) {
                                return subResult;
                            }
                        }
                    }
                    
                    // Si aucune correspondance, prendre la première sous-page avec du contenu
                    for (const subLink of subPageLinks.slice(0, 3)) {
                        const subResult = await loadPageWithFallback(subLink['*'], depth + 1);
                        if (subResult && subResult.length > 300) {
                            return subResult;
                        }
                    }
                }
                
                return text.length > 100 ? text : null;
            };
            
            fullText = await loadPageWithFallback(pageTitle) || '';
        } else if (gutenbergMatch) {
            // URL Gutenberg - utiliser l'API Gutendex pour trouver le texte brut
            const bookId = gutenbergMatch[1];
            
            if (!textEl.dataset.previewText) {
                textEl.dataset.previewText = textEl.textContent || '';
            }
            
            // Récupérer les métadonnées du livre via Gutendex
            const apiUrl = `https://gutendex.com/books/${bookId}`;
            const apiRes = await fetch(apiUrl);
            
            if (apiRes.ok) {
                const bookData = await apiRes.json();
                const formats = bookData.formats || {};
                
                // Trouver l'URL du texte brut
                const txtUrl = formats['text/plain; charset=utf-8'] ||
                              formats['text/plain; charset=us-ascii'] ||
                              formats['text/plain'] ||
                              null;
                
                if (txtUrl) {
                    // Utiliser r.jina.ai comme proxy pour le texte brut
                    const proxyUrl = `https://r.jina.ai/${txtUrl}`;
                    const txtRes = await fetch(proxyUrl);
                    
                    if (txtRes.ok) {
                        let rawText = await txtRes.text();
                        
                        // Nettoyage Gutenberg header/footer
                        const startMarker = /\*\*\*\s*START OF(.*?)\*\*\*/is;
                        const endMarker = /\*\*\*\s*END OF(.*?)\*\*\*/is;
                        const startMatch = rawText.match(startMarker);
                        if (startMatch) {
                            rawText = rawText.slice(startMatch.index + startMatch[0].length);
                        }
                        const endMatch = rawText.match(endMarker);
                        if (endMatch) {
                            rawText = rawText.slice(0, endMatch.index);
                        }
                        
                        fullText = rawText.replace(/\r\n/g, '\n').trim();
                    }
                }
            }
        } else {
            // Autre URL - essayer avec r.jina.ai (meilleur proxy que corsproxy.io)
            if (!textEl.dataset.previewText) {
                textEl.dataset.previewText = textEl.textContent || '';
            }
            
            const proxyUrl = `https://r.jina.ai/${sourceUrl}`;
            const response = await fetch(proxyUrl);
            
            if (response.ok) {
                const html = await response.text();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : html;
                
                // Supprimer les éléments non-texte
                tempDiv.querySelectorAll('script, style, nav, header, footer, aside, .sidebar, .menu, .navigation, .noprint').forEach(el => el.remove());
                
                // Extraire le texte des paragraphes
                const paragraphs = tempDiv.querySelectorAll('p, .poem, .verse, blockquote, article, .text, .content');
                paragraphs.forEach(p => {
                    const text = p.textContent.trim();
                    if (text.length > 30) fullText += text + '\n\n';
                });
                
                if (fullText.length < 100) {
                    // Fallback: prendre le texte du body
                    const body = tempDiv.querySelector('body') || tempDiv;
                    fullText = body.textContent
                        .replace(/\s+/g, ' ')
                        .replace(/\n{3,}/g, '\n\n')
                        .trim();
                }
            }
        }
        
        if (fullText.length < 50) {
            throw new Error('Texte non disponible');
        }
            
            // Aligner le début avec l'extrait déjà affiché
            const previewText = textEl.dataset.previewText || textEl.textContent || '';
            const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
            const normPreview = normalize(previewText);
            
            if (normPreview && normPreview.length > 20) {
                const normFull = normalize(fullText);
                
                // Chercher une correspondance significative (au moins 50 caractères du début du preview)
                const searchLen = Math.min(normPreview.length, 80);
                const searchSnippet = normPreview.substring(0, searchLen);
                
                const matchIdx = normFull.indexOf(searchSnippet);
                
                if (matchIdx >= 0) {
                    // Trouver l'index correspondant dans le texte original
                    // On va compter les caractères non-espace jusqu'à matchIdx dans normFull
                    let origIdx = 0;
                    let normCount = 0;
                    const fullTextLower = fullText.toLowerCase();
                    
                    while (normCount < matchIdx && origIdx < fullText.length) {
                        if (!/\s/.test(fullText[origIdx]) || (origIdx > 0 && !/\s/.test(fullText[origIdx - 1]))) {
                            normCount++;
                        }
                        origIdx++;
                    }
                    
                    // Reculer jusqu'au début d'un mot/ligne pour une coupe propre
                    while (origIdx > 0 && fullText[origIdx - 1] !== '\n' && fullText[origIdx - 1] !== ' ') {
                        origIdx--;
                    }
                    
                    fullText = fullText.substring(origIdx).trim();
                } else {
                    // Le preview n'est pas dans le texte complet - chercher une correspondance partielle
                    // Utiliser les premiers mots du preview pour trouver le point de départ
                    const previewWords = normPreview.split(' ').slice(0, 5).join(' ');
                    const partialIdx = normFull.indexOf(previewWords);
                    
                    if (partialIdx >= 0) {
                        // Trouver l'index dans l'original
                        let origIdx = 0;
                        let normCount = 0;
                        while (normCount < partialIdx && origIdx < fullText.length) {
                            if (!/\s/.test(fullText[origIdx]) || (origIdx > 0 && !/\s/.test(fullText[origIdx - 1]))) {
                                normCount++;
                            }
                            origIdx++;
                        }
                        while (origIdx > 0 && fullText[origIdx - 1] !== '\n' && fullText[origIdx - 1] !== ' ') {
                            origIdx--;
                        }
                        fullText = fullText.substring(origIdx).trim();
                    }
                    // Si aucune correspondance, afficher le texte tel quel (la détection de sommaire en amont devrait avoir fonctionné)
                }
            }

            // Limiter à 2000 caractères pour l'affichage
            if (fullText.length > 2000) {
                fullText = fullText.substring(0, 2000) + '…';
            }
            
            // Étendre le texte existant (pas de duplication)
            const cardEl = textEl.closest('.extrait-card') || textEl.parentElement;
            if (cardEl) {
                const existingFull = cardEl.querySelector('.text-full');
                if (existingFull) existingFull.remove();
            }

            textEl.innerHTML = '';
            const chunkEl = document.createElement('div');
            chunkEl.className = 'text-chunk';
            chunkEl.style.animation = 'fadeIn 0.4s ease';
            chunkEl.textContent = fullText;
            textEl.appendChild(chunkEl);
            textEl.dataset.fullText = fullText;
            textEl.dataset.expanded = 'true';

            if (btnEl) {
                btnEl.innerHTML = t('collapse');
                btnEl.classList.remove('exhausted');
            }

            requestAnimationFrame(() => {
                if (scrollEl) scrollEl.scrollTop = scrollTop;
                else window.scrollTo(0, scrollTop);
            });
            
            // ═══════════════════════════════════════════════════════════
            // Migration lazy : mettre à jour la base avec le texte complet
            // Cela "répare" automatiquement les anciens extraits tronqués
            // ═══════════════════════════════════════════════════════════
            if (extraitId && supabaseClient && fullText.length > 500) {
                // Mise à jour en arrière-plan (ne pas bloquer l'UI)
                supabaseClient
                    .from('extraits')
                    .update({ texte: fullText })
                    .eq('id', extraitId)
                    .then(({ error }) => {
                        if (!error) {
                            console.log(`✅ Extrait ${extraitId} migré avec texte complet (${fullText.length} chars)`);
                            // Mettre à jour le cache aussi
                            if (typeof extraitDataCache !== 'undefined' && extraitDataCache.has(extraitId)) {
                                const cached = extraitDataCache.get(extraitId);
                                cached.texte = fullText;
                            }
                        }
                    })
                    .catch(e => console.warn('Migration lazy échouée:', e));
            }
            
            toast('✨ Texte chargé');
        
    } catch (err) {
        console.error('Erreur chargement texte:', err);
        // En cas d'erreur, afficher un message mais NE PAS ouvrir la source
        if (btnEl) {
            btnEl.innerHTML = '⚠️ Texte non disponible';
            btnEl.classList.add('exhausted');
        }
        toast('Texte non disponible pour cette source');
    }
}

// Afficher mes extraits (depuis le profil)
function showMyExtraits() {
    if (!currentUser) {
        toast('📝 Connectez-vous d\'abord');
        return;
    }
    // Ouvrir mon profil sur l'onglet extraits
    openUserProfile(currentUser.id, currentUser.user_metadata?.username || 'Moi', 'extraits');
}

// Afficher mes likes (depuis le profil)
async function showMyLikes() {
    if (!currentUser || !supabaseClient) {
        toast('📝 Connectez-vous d\'abord');
        return;
    }
    
    openSocialFeed();
    
    // Charger les extraits que j'ai likés
    const container = document.getElementById('socialFeed');
    if (!container) return;
    
    container.innerHTML = `<div class="loading-spinner">⏳ ${typeof t === 'function' ? t('loading') : 'Loading...'}</div>`;
    
    try {
        // Utiliser le cache si disponible, sinon charger
        if (!likesLoaded) {
            await loadUserLikesCache();
        }
        
        const likedIds = Array.from(userLikesCache);
        
        if (likedIds.length === 0) {
            container.innerHTML = '<div class="social-empty"><div class="social-empty-icon">💔</div><div class="social-empty-title">Aucun like</div><div class="social-empty-text">Vous n\'avez pas encore liké d\'extraits</div></div>';
            return;
        }
        
        // Récupérer les extraits likés
        const { data: extraits } = await supabaseClient
            .from('extraits')
            .select('*')
            .in('id', likedIds)
            .order('created_at', { ascending: false });
        
        if (!extraits || extraits.length === 0) {
            container.innerHTML = '<div class="social-empty">Aucun extrait trouvé</div>';
            return;
        }
        
        if (typeof loadProfilesMap === 'function') {
            const profileMap = await loadProfilesMap((extraits || []).map(e => e.user_id));
            (extraits || []).forEach(extrait => {
                extrait.profiles = profileMap.get(extrait.user_id) || null;
            });
        }

        socialExtraits = extraits;
        
        // Marquer l'onglet actif
        document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
        
        renderSocialFeed();
        
    } catch (err) {
        container.innerHTML = `<div class="social-empty">Erreur : ${err.message}</div>`;
    }
}

// Réinitialiser le cache des likes (appelé à la déconnexion)
function resetLikesCache() {
    userLikesCache = new Set();
    likesCountCache = {};
    likesLoaded = false;
    pendingLikeOperations = {};
    console.log('🔄 Cache des likes réinitialisé');
}

// ═══════════════════════════════════════════════════════════
// 👥 VOIR QUI A LIKÉ
// ═══════════════════════════════════════════════════════════

/**
 * Afficher la liste des utilisateurs qui ont liké un extrait
 */
async function showLikers(extraitId) {
    console.log('🔴 showLikers appelé avec:', extraitId);
    
    if (!supabaseClient) {
        console.log('Pas de supabaseClient');
        return;
    }
    
    // Créer la modal si elle n'existe pas
    let modal = document.getElementById('likersModal');
    console.log('🔴 Modal existante:', !!modal);
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'likersModal';
        modal.className = 'likers-modal';
        modal.innerHTML = `
            <div class="likers-content">
                <div class="likers-header">
                    <h3>${typeof t === 'function' ? t('liked_by') : '❤️ Liked by'}</h3>
                    <button class="likers-close" onclick="closeLikersModal()">✕</button>
                </div>
                <div class="likers-list" id="likersList">
                    <div class="likers-loading">${typeof t === 'function' ? t('loading') : 'Loading...'}</div>
                </div>
            </div>
        `;
        modal.onclick = (e) => { if (e.target === modal) closeLikersModal(); };
        document.body.appendChild(modal);
        console.log('🔴 Modal créée et ajoutée au body');
    }
    
    // Ouvrir la modal et log
    console.log('🔴 Ajout classe open sur modal');
    modal.classList.add('open');
    console.log('🔴 Classes du modal:', modal.className);
    console.log('🔴 Style computed display:', window.getComputedStyle(modal).display);
    
    const listContainer = document.getElementById('likersList');
    listContainer.innerHTML = `<div class="likers-loading">${typeof t === 'function' ? t('loading') : 'Loading...'}</div>`;
    
    try {
        // Charger les likes avec les profils
        const { data: likes, error } = await supabaseClient
            .from('likes')
            .select('user_id, created_at')
            .eq('extrait_id', extraitId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!likes || likes.length === 0) {
            listContainer.innerHTML = `<div class="likers-empty">${typeof t === 'function' ? t('no_likes_yet') : 'No likes yet'}</div>`;
            return;
        }
        
        // Charger les profils
        const userIds = likes.map(l => l.user_id);
        const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('id, username')
            .in('id', userIds);
        
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        
        // Charger les follows de l'utilisateur actuel
        let userFollowingSet = new Set();
        if (currentUser && typeof userFollowing !== 'undefined') {
            userFollowingSet = userFollowing;
        }
        
        listContainer.innerHTML = likes.map(like => {
            const profile = profileMap.get(like.user_id);
            const username = profile?.username || 'Anonyme';
            const avatarSymbol = getAvatarSymbol(username);
            const timeAgo = formatTimeAgo(new Date(like.created_at));
            const isMe = currentUser && like.user_id === currentUser.id;
            const isFollowing = userFollowingSet.has(like.user_id);
            
            return `
                <div class="liker-item">
                    <div class="liker-avatar" onclick="openUserProfile('${like.user_id}', '${escapeHtml(username)}'); closeLikersModal();">${avatarSymbol}</div>
                    <div class="liker-info" onclick="openUserProfile('${like.user_id}', '${escapeHtml(username)}'); closeLikersModal();">
                        <div class="liker-username">${escapeHtml(username)}${isMe ? ' <span style="color:var(--text-muted)">(vous)</span>' : ''}</div>
                        <div class="liker-time">${timeAgo}</div>
                    </div>
                    ${!isMe && currentUser ? `
                        <button class="liker-follow-btn ${isFollowing ? 'following' : ''}" onclick="toggleFollowFromLikers('${like.user_id}', this)">
                            ${isFollowing ? '✓ Suivi' : 'Suivre'}
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
        
    } catch (err) {
        console.error('Erreur chargement likers:', err);
        listContainer.innerHTML = `<div class="likers-empty">${typeof t === 'function' ? t('loading_error') : 'Loading error'}</div>`;
    }
}

/**
 * Fermer la modal des likers
 */
function closeLikersModal() {
    const modal = document.getElementById('likersModal');
    if (modal) modal.classList.remove('open');
}

/**
 * Suivre/ne plus suivre depuis la liste des likers
 */
async function toggleFollowFromLikers(userId, btn) {
    if (!currentUser || !supabaseClient) return;
    
    const isFollowing = btn.classList.contains('following');
    
    if (isFollowing) {
        await supabaseClient.from('follows').delete()
            .eq('follower_id', currentUser.id)
            .eq('following_id', userId);
        if (typeof userFollowing !== 'undefined') userFollowing.delete(userId);
        btn.classList.remove('following');
        btn.textContent = 'Suivre';
    } else {
        await supabaseClient.from('follows').insert({
            follower_id: currentUser.id,
            following_id: userId,
            created_at: new Date().toISOString()
        });
        if (typeof userFollowing !== 'undefined') userFollowing.add(userId);
        if (typeof createNotification === 'function') {
            await createNotification(userId, 'follow');
        }
        btn.classList.add('following');
        btn.textContent = '✓ Suivi';
    }
}

// Rendre les fonctions accessibles globalement
window.openSocialFeed = openSocialFeed;
window.closeSocialFeed = closeSocialFeed;
window.refreshFeed = refreshFeed;
window.switchSocialTab = switchSocialTab;
window.loadSocialFeed = loadSocialFeed;
window.renderSocialFeed = renderSocialFeed;
window.toggleLikeExtrait = toggleLikeExtrait;
window.loadFullTextFromSource = loadFullTextFromSource;
window.copyExtrait = copyExtrait;
window.getExtraitData = getExtraitData;
window.hydrateExtraitLikesUI = hydrateExtraitLikesUI;
window.showMyExtraits = showMyExtraits;
window.showMyLikes = showMyLikes;

// Fonctions du système de likes
window.loadUserLikesCache = loadUserLikesCache;
window.loadLikesCountForExtraits = loadLikesCountForExtraits;
window.isExtraitLiked = isExtraitLiked;
window.getLikeCount = getLikeCount;
window.resetLikesCache = resetLikesCache;
window.showLikers = showLikers;
window.closeLikersModal = closeLikersModal;
window.toggleFollowFromLikers = toggleFollowFromLikers;
