/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 👥 FOLLOWERS.JS - Palimpseste
 * Système d'amis, abonnements et profils utilisateur
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// 📦 ÉTAT DU MODULE
// ═══════════════════════════════════════════════════════════════════════════

let currentProfileUserId = null;
let currentProfileTab = 'extraits';
let userFollowing = new Set(); // IDs des personnes qu'on suit
let activitySubscription = null;
let currentActivityFilter = 'all'; // 'all', 'following', 'mine', 'likes', 'comments'

// ═══════════════════════════════════════════════════════════════════════════
// 👥 GESTION DES ABONNEMENTS (FOLLOW/UNFOLLOW)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Charger la liste des personnes qu'on suit
 */
async function loadUserFollowing() {
    if (!currentUser || !supabaseClient) return;
    
    const { data } = await supabaseClient
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);
    
    userFollowing = new Set(data?.map(f => f.following_id) || []);
}

/**
 * Suivre/Ne plus suivre un utilisateur
 * @param {string} userId - ID de l'utilisateur à suivre/ne plus suivre
 * @param {Event} event - Événement optionnel pour stopPropagation
 */
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

/**
 * Suivre/Ne plus suivre depuis la modal profil
 */
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

// ═══════════════════════════════════════════════════════════════════════════
// 🔍 DÉCOUVERTE D'UTILISATEURS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Charger et afficher les utilisateurs à découvrir
 */
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

/**
 * Helper: Générer une carte utilisateur
 */
function renderUserCard(userId, username, subtitle, showFollowButton = true, toggleFn = 'toggleFollow') {
    const avatarSymbol = getAvatarSymbol(username || 'A');
    const safeName = escapeHtml(username || 'Anonyme');
    const isFollowing = userFollowing.has(userId);
    return `
        <div class="discover-card">
            <div class="discover-avatar" onclick="openUserProfile('${userId}', '${safeName}')">${avatarSymbol}</div>
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

/**
 * Charger mes abonnés (les gens qui me suivent)
 */
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

// ═══════════════════════════════════════════════════════════════════════════
// 📡 FIL D'ACTIVITÉ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Feed d'activité - voir toute l'activité de la communauté
 */
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
    const { data: recentLikes } = await supabaseClient
        .from('likes')
        .select('id, created_at, user_id, extrait_id')
        .order('created_at', { ascending: false })
        .limit(30);
    
    // Récupérer les commentaires récents
    const { data: recentComments } = await supabaseClient
        .from('comments')
        .select('id, created_at, user_id, extrait_id, content')
        .order('created_at', { ascending: false })
        .limit(30);
    
    // Récupérer les follows récents
    const { data: recentFollows } = await supabaseClient
        .from('follows')
        .select('id, created_at, follower_id, following_id')
        .order('created_at', { ascending: false })
        .limit(20);
    
    // Récupérer les nouveaux extraits partagés
    const { data: recentExtraits } = await supabaseClient
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

/**
 * Rendu d'un item d'activité
 */
function renderActivityItem(activity, userMap, extraitMap, authorMap) {
    const actor = userMap.get(activity.user_id);
    const actorName = actor?.username || 'Quelqu\'un';
    const actorSymbol = getAvatarSymbol(actorName);
    const timeAgo = formatTimeAgo(new Date(activity.created_at));
    const highlight = activity.is_on_mine ? 'highlight' : '';
    
    if (activity.type === 'like') {
        const extrait = extraitMap.get(activity.extrait_id);
        const author = extrait ? authorMap.get(extrait.user_id) : null;
        const authorName = author?.username || 'Anonyme';
        const snippet = extrait?.texte?.substring(0, 80) || 'Extrait supprimé';
        
        return `
            <div class="activity-item ${highlight}" onclick="viewExtraitById('${activity.extrait_id}')">
                <div class="activity-avatar" onclick="event.stopPropagation(); openUserProfile('${activity.user_id}', '${escapeHtml(actorName)}')">${actorSymbol}</div>
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
                <div class="activity-avatar comment" onclick="event.stopPropagation(); openUserProfile('${activity.user_id}', '${escapeHtml(actorName)}')">${actorSymbol}</div>
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
                <div class="activity-avatar follow" onclick="event.stopPropagation(); openUserProfile('${activity.user_id}', '${escapeHtml(actorName)}')">${actorSymbol}</div>
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
                <div class="activity-avatar share" onclick="event.stopPropagation(); openUserProfile('${activity.user_id}', '${escapeHtml(actorName)}')">${actorSymbol}</div>
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

/**
 * Changer le filtre d'activité
 */
function setActivityFilter(filter) {
    currentActivityFilter = filter;
    loadActivityFeed();
}

/**
 * Abonnement temps réel à l'activité
 */
function subscribeToActivityFeed() {
    if (activitySubscription) return;
    if (!supabaseClient) return;
    
    activitySubscription = supabaseClient
        .channel('activity-all')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'likes' },
            () => { if (currentSocialTab === 'activity') loadActivityFeed(); }
        )
        .on('postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'likes' },
            () => { if (currentSocialTab === 'activity') loadActivityFeed(); }
        )
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'comments' },
            () => { if (currentSocialTab === 'activity') loadActivityFeed(); }
        )
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'follows' },
            () => { if (currentSocialTab === 'activity') loadActivityFeed(); }
        )
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'extraits' },
            () => { if (currentSocialTab === 'activity') loadActivityFeed(); }
        )
        .subscribe();
}

/**
 * Se désabonner quand on quitte
 */
function unsubscribeFromActivityFeed() {
    if (activitySubscription) {
        activitySubscription.unsubscribe();
        activitySubscription = null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 👤 PROFIL UTILISATEUR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Voir un extrait par son ID
 */
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

/**
 * Ouvrir le profil d'un utilisateur
 */
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
    document.getElementById('profileAvatar').textContent = getAvatarSymbol(displayName);
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

/**
 * Changer d'onglet dans le profil
 */
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

/**
 * Charger les extraits partagés par l'utilisateur
 */
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

/**
 * Charger les extraits likés par l'utilisateur
 */
async function loadProfileLikes(userId) {
    const container = document.getElementById('profileContentArea');
    
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

/**
 * Charger les abonnés (personnes qui suivent cet utilisateur)
 */
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
                        <div class="friend-avatar">${getAvatarSymbol(name)}</div>
                        <span>${esc(name)}</span>
                        <span style="margin-left:auto; font-size:0.7rem; color:var(--muted)">depuis ${formatTimeAgo(new Date(f.created_at))}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Charger les personnes suivies par un utilisateur
 */
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
                        <div class="friend-avatar">${getAvatarSymbol(name)}</div>
                        <span>${esc(name)}</span>
                        <span style="margin-left:auto; font-size:0.7rem; color:var(--muted)">depuis ${formatTimeAgo(new Date(f.created_at))}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Fermer la modal profil
 */
function closeUserProfile() {
    document.getElementById('userProfileModal').classList.remove('open');
    currentProfileUserId = null;
}
