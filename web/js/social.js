// ═══════════════════════════════════════════════════════════
// 📱 FEED SOCIAL
// ═══════════════════════════════════════════════════════════

var socialExtraits = [];
var currentSocialTab = 'recent';
var feedSubscription = null;
var likesSubscription = null;
var lastFeedUpdate = null;

function openSocialFeed() {
    document.getElementById('socialOverlay').classList.add('open');
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
    if (!container) return;
    
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
            if (typeof loadUserFollowing === 'function') await loadUserFollowing();
        }
    }
    
    container.innerHTML = socialExtraits.map(extrait => {
        const username = extrait.profiles?.username || 'Anonyme';
        const avatarSymbol = getAvatarSymbol(username);
        const timeAgo = formatTimeAgo(new Date(extrait.created_at));
        const isLiked = userLikes.has(extrait.id);
        const realLikeCount = likeCounts[extrait.id] || 0;
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
        if (typeof openAuthModal === 'function') openAuthModal('login');
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
            // Mettre à jour les compteurs
            if (typeof loadUserStats === 'function') loadUserStats();
        } else {
            await supabaseClient.from('likes').insert({
                user_id: currentUser.id,
                extrait_id: extraitId,
                created_at: new Date().toISOString()
            });
            toast('❤️ Liké !');
            
            // Notifier l'auteur de l'extrait
            const extrait = socialExtraits.find(e => e.id === extraitId);
            if (extrait && extrait.user_id !== currentUser.id && typeof createNotification === 'function') {
                createNotification(extrait.user_id, 'like', extraitId);
            }
        }
        loadSocialFeed();
        // Mettre à jour les compteurs de likes dans la sidebar
        if (typeof loadUserStats === 'function') loadUserStats();
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

// Charger le texte complet depuis Wikisource (évite de stocker en base)
async function loadFullTextFromSource(extraitId, sourceUrl, sourceTitle) {
    const textEl = document.getElementById(`extraitText-${extraitId}`);
    const btnEl = document.getElementById(`voirPlus-${extraitId}`);
    
    if (!textEl || !sourceUrl) return;
    
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
            
            // Limiter à 2000 caractères pour l'affichage
            if (fullText.length > 2000) {
                fullText = fullText.substring(0, 2000) + '…';
            }
            
            // Afficher le texte complet
            textEl.innerHTML = `<div class="full-text-loaded">${escapeHtml(fullText)}</div>`;
            if (btnEl) btnEl.remove();
            
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
        toast('📖 Ouverture de la source...');
    }
}

// Afficher mes extraits (depuis le profil)
function showMyExtraits() {
    openSocialFeed();
    switchSocialTab('mine');
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
        // Récupérer mes likes
        const { data: myLikes } = await supabaseClient
            .from('likes')
            .select('extrait_id')
            .eq('user_id', currentUser.id);
        
        if (!myLikes || myLikes.length === 0) {
            container.innerHTML = '<div class="social-empty"><div class="social-empty-icon">💔</div><div class="social-empty-title">Aucun like</div><div class="social-empty-text">Vous n\'avez pas encore liké d\'extraits</div></div>';
            return;
        }
        
        const extraitIds = myLikes.map(l => l.extrait_id);
        
        // Récupérer les extraits likés
        const { data: extraits } = await supabaseClient
            .from('extraits')
            .select('*, profiles(username)')
            .in('id', extraitIds)
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
        container.innerHTML = `<div class="social-empty">❌ Erreur: ${err.message}</div>`;
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
