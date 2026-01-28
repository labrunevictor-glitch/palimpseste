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

// Charger tous les likes de l'utilisateur connecté
async function loadUserLikesCache() {
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
    document.getElementById('socialOverlay').classList.add('open');
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
}

function showNewContentIndicator() {
    const indicator = document.getElementById('liveIndicator');
    if (indicator) {
        indicator.textContent = '🔔 Nouveau contenu disponible - Cliquez pour actualiser';
        indicator.classList.add('new-content');
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
        indicator.onclick = null;
    }
    
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
    
    container.innerHTML = '<div class="feed-loading"><div class="spinner"></div><span>Chargement...</span></div>';
    
    let query = supabaseClient
        .from('extraits')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (currentSocialTab === 'activity') {
        // Afficher l'activité récente (likes)
        if (typeof loadActivityFeed === 'function') await loadActivityFeed();
        return;
    } else if (currentSocialTab === 'mine' && currentUser) {
        query = supabaseClient
            .from('extraits')
            .select('*, profiles(username)')
            .eq('user_id', currentUser.id)
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
            .select('*, profiles(username)')
            .in('user_id', Array.from(userFollowing))
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
    
    socialExtraits = data;
    renderSocialFeed();
}

async function renderSocialFeed() {
    const container = document.getElementById('socialFeed');
    if (!container) return;
    
    // Charger les compteurs de likes pour ces extraits
    const extraitIds = socialExtraits.map(e => e.id);
    await loadLikesCountForExtraits(extraitIds);
    
    // S'assurer que le cache utilisateur est chargé
    if (currentUser && !likesLoaded) {
        await loadUserLikesCache();
    }
    
    // Charger les follows si pas déjà fait
    if (currentUser && typeof loadUserFollowing === 'function') {
        await loadUserFollowing();
    }
    
    container.innerHTML = socialExtraits.map(extrait => {
        const username = extrait.profiles?.username || 'Anonyme';
        const avatarSymbol = getAvatarSymbol(username);
        const timeAgo = formatTimeAgo(new Date(extrait.created_at));
        const isLiked = isExtraitLiked(extrait.id);
        const likeCount = getLikeCount(extrait.id);
        const isFollowing = typeof userFollowing !== 'undefined' && userFollowing.has(extrait.user_id);
        
        return `
            <div class="extrait-card" data-id="${extrait.id}">
                <div class="extrait-header">
                    <div class="extrait-avatar" onclick="openUserProfile('${extrait.user_id}', '${username}')" style="cursor:pointer">${avatarSymbol}</div>
                    <div class="extrait-user-info" onclick="openUserProfile('${extrait.user_id}', '${username}')" style="cursor:pointer">
                        <div class="extrait-username">${username}</div>
                        <div class="extrait-time">${timeAgo}</div>
                    </div>
                    ${currentUser && extrait.user_id !== currentUser.id ? `
                        <button class="btn-follow-small ${isFollowing ? 'following' : ''}" onclick="toggleFollow('${extrait.user_id}', event)">
                            ${isFollowing ? '✓ Suivi' : '+ Suivre'}
                        </button>
                    ` : ''}
                </div>
                <div class="extrait-text" id="extraitText-${extrait.id}">${escapeHtml(extrait.texte)}</div>
                ${extrait.source_url ? `<button class="btn-voir-plus" onclick="loadFullTextFromSource('${extrait.id}', '${escapeHtml(extrait.source_url)}', '${escapeHtml(extrait.source_title)}')" id="voirPlus-${extrait.id}">📖 Voir le texte complet</button>` : ''}
                <div class="extrait-source">
                    <strong>${escapeHtml(extrait.source_author)}</strong> — ${escapeHtml(extrait.source_title)}
                    ${extrait.source_url ? `<a href="${extrait.source_url}" target="_blank" class="source-link">↗</a>` : ''}
                </div>
                ${extrait.commentary ? `<div class="extrait-commentary">${escapeHtml(extrait.commentary)}</div>` : ''}
                <div class="extrait-actions">
                    <button class="extrait-action like-btn ${isLiked ? 'liked' : ''}" id="likeBtn-${extrait.id}" onclick="toggleLikeExtrait('${extrait.id}')" data-extrait-id="${extrait.id}">
                        <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
                        <span class="like-count clickable" id="likeCount-${extrait.id}" onclick="event.stopPropagation(); showLikers('${extrait.id}')" style="display:${likeCount > 0 ? 'inline-flex' : 'none'};">${likeCount}</span>
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
            likeIcon.textContent = wasLiked ? '🤍' : '❤️';
        }
        if (likeCountEl) {
            likeCountEl.textContent = newCount;
            likeCountEl.style.display = newCount > 0 ? 'inline-flex' : 'none';
        }
        
        // ═══════════════════════════════════════════════════════════
        // SYNCHRONISATION AVEC LA BASE DE DONNÉES
        // ═══════════════════════════════════════════════════════════
        if (wasLiked) {
            // Supprimer le like
            const { error } = await supabaseClient
                .from('likes')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('extrait_id', extraitId);
            
            if (error) throw error;
            
            // Décrémenter le compteur likes_count dans la table extraits
            const { error: rpcError } = await supabaseClient.rpc('decrement_likes', { extrait_id: extraitId });
            if (rpcError) console.warn('RPC decrement_likes échoué:', rpcError);
            
        } else {
            // Ajouter le like
            const { error } = await supabaseClient
                .from('likes')
                .insert({
                    user_id: currentUser.id,
                    extrait_id: extraitId
                });
            
            if (error) throw error;
            
            // Incrémenter le compteur likes_count dans la table extraits
            const { error: rpcError } = await supabaseClient.rpc('increment_likes', { extrait_id: extraitId });
            if (rpcError) console.warn('RPC increment_likes échoué:', rpcError);
            
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
            likeIcon.textContent = isNowLiked ? '❤️' : '🤍';
        }
        if (likeCountEl) {
            likeCountEl.textContent = realCount;
            likeCountEl.style.display = realCount > 0 ? 'inline-flex' : 'none';
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

// Charger le texte complet depuis Wikisource (évite de stocker en base)
async function loadFullTextFromSource(extraitId, sourceUrl, sourceTitle) {
    const textEl = document.getElementById(`extraitText-${extraitId}`);
    const btnEl = document.getElementById(`voirPlus-${extraitId}`);
    
    if (!textEl || !sourceUrl) return;

    const scrollEl = textEl.closest('.favorites-overlay') || document.scrollingElement;
    const scrollTop = scrollEl ? scrollEl.scrollTop : window.scrollY;

    // Si déjà chargé, basculer sans recharger
    if (textEl.dataset.fullText) {
        const isExpanded = textEl.dataset.expanded === 'true';
        if (isExpanded) {
            const previewText = textEl.dataset.previewText || '';
            textEl.innerHTML = '';
            textEl.textContent = previewText;
            textEl.dataset.expanded = 'false';
            if (btnEl) {
                btnEl.innerHTML = '📖 Voir le texte complet';
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
                btnEl.innerHTML = '▲ Réduire';
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
    if (btnEl) btnEl.innerHTML = '⏳ Chargement depuis Wikisource...';
    
    try {
        // Extraire la langue et le titre de l'URL Wikisource
        const urlMatch = sourceUrl.match(/https?:\/\/(\w+)\.wikisource\.org\/wiki\/(.+)/);
        if (!urlMatch) {
            // Si pas une URL Wikisource valide, ouvrir dans un nouvel onglet
            window.open(sourceUrl, '_blank');
            if (btnEl) btnEl.innerHTML = '📖 Voir le texte complet';
            return;
        }
        
        const lang = urlMatch[1];
        const pageTitle = decodeURIComponent(urlMatch[2]);
        
        // Appeler l'API Wikisource
        const apiUrl = `https://${lang}.wikisource.org/w/api.php?` + new URLSearchParams({
            action: 'parse',
            page: pageTitle,
            prop: 'text',
            format: 'json',
            origin: '*'
        });
        
        // Sauvegarder l'extrait actuel pour permettre le repli
        if (!textEl.dataset.previewText) {
            textEl.dataset.previewText = textEl.textContent || '';
        }

        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.parse?.text?.['*']) {
            // Parser le HTML et extraire le texte
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data.parse.text['*'];
            
            // Supprimer les éléments indésirables
            tempDiv.querySelectorAll('table, .mw-editsection, script, style, .noprint, .reference, sup.reference').forEach(el => el.remove());
            
            // Récupérer le texte des paragraphes
            const paragraphs = tempDiv.querySelectorAll('p, .poem, .verse, blockquote, div.text');
            let fullText = '';
            paragraphs.forEach(p => {
                const text = p.textContent.trim();
                if (text.length > 20) fullText += text + '\n\n';
            });
            
            if (fullText.length < 100) {
                fullText = tempDiv.textContent.trim();
            }
            
            // Aligner le début avec l'extrait déjà affiché
            const previewText = textEl.dataset.previewText || textEl.textContent || '';
            const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
            const normPreview = normalize(previewText);
            if (normPreview) {
                const normFull = normalize(fullText);
                if (!normFull.startsWith(normPreview)) {
                    const lowerFull = (fullText || '').toLowerCase();
                    const lowerPreview = previewText.toLowerCase();
                    const idx = lowerFull.indexOf(lowerPreview);
                    if (idx >= 0) {
                        fullText = fullText.substring(idx);
                    } else {
                        fullText = previewText + '\n\n' + fullText;
                    }
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
                btnEl.innerHTML = '▲ Réduire';
                btnEl.classList.remove('exhausted');
            }

            requestAnimationFrame(() => {
                if (scrollEl) scrollEl.scrollTop = scrollTop;
                else window.scrollTo(0, scrollTop);
            });
            
            toast('✨ Texte chargé depuis Wikisource');
        } else {
            throw new Error('Texte non trouvé');
        }
        
    } catch (err) {
        console.error('Erreur chargement Wikisource:', err);
        // En cas d'erreur, proposer d'ouvrir la source
        if (btnEl) {
            btnEl.innerHTML = '↗ Ouvrir sur Wikisource';
            btnEl.onclick = () => window.open(sourceUrl, '_blank');
        }
        toast('Ouverture de la source...');
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
    
    container.innerHTML = '<div class="loading-spinner">⏳ Chargement des likes...</div>';
    
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
            .select('*, profiles(username)')
            .in('id', likedIds)
            .order('created_at', { ascending: false });
        
        if (!extraits || extraits.length === 0) {
            container.innerHTML = '<div class="social-empty">Aucun extrait trouvé</div>';
            return;
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
                    <h3>❤️ Aimé par</h3>
                    <button class="likers-close" onclick="closeLikersModal()">✕</button>
                </div>
                <div class="likers-list" id="likersList">
                    <div class="likers-loading">Chargement...</div>
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
    listContainer.innerHTML = '<div class="likers-loading">Chargement...</div>';
    
    try {
        // Charger les likes avec les profils
        const { data: likes, error } = await supabaseClient
            .from('likes')
            .select('user_id, created_at')
            .eq('extrait_id', extraitId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!likes || likes.length === 0) {
            listContainer.innerHTML = '<div class="likers-empty">Aucun like pour le moment</div>';
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
        listContainer.innerHTML = '<div class="likers-empty">Erreur de chargement</div>';
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
