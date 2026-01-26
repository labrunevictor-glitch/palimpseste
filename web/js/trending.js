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
        
        // Vérifier les likes de l'utilisateur actuel (utiliser le cache global)
        const userId = currentUser?.id;
        let userLikes = new Set();
        if (userId) {
            // Utiliser le cache global s'il est chargé
            if (typeof likesLoaded !== 'undefined' && likesLoaded && typeof userLikesCache !== 'undefined') {
                userLikes = userLikesCache;
            } else {
                // Sinon charger depuis la DB
                const { data: likes } = await supabaseClient
                    .from('likes')
                    .select('extrait_id')
                    .eq('user_id', userId);
                userLikes = new Set((likes || []).map(l => l.extrait_id));
            }
        }
        
        container.innerHTML = extraits.map((extrait, index) => {
            const username = extrait.profiles?.username || 'Anonyme';
            const avatar = extrait.profiles?.avatar_url || getAvatarSymbol(username);
            const isLiked = userLikes.has(extrait.id);
            const likesCount = extrait.likes_count || 0;
            const commentsCount = extrait.comments_count || 0;
            const isHot = likesCount >= 5 || commentsCount >= 3;
            const timeAgo = formatTimeAgo(new Date(extrait.created_at));
            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            
            return `
                <div class="trending-card" data-extrait-id="${extrait.id}" onclick="openTrendingExtrait('${extrait.id}')" style="cursor: pointer;">
                    <div class="trending-card-header">
                        <div class="trending-card-author" onclick="event.stopPropagation(); openUserProfile('${extrait.user_id}')">
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
                            <button class="trending-action-btn ${isLiked ? 'liked' : ''}" onclick="event.stopPropagation(); toggleLikeTrending('${extrait.id}', this)">
                                ${isLiked ? '❤️' : '🤍'} Like
                            </button>
                            <button class="trending-action-btn" onclick="event.stopPropagation(); viewTrendingComments('${extrait.id}')">
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
    if (!supabaseClient) return;
    
    // Éviter les doubles clics
    if (btn.disabled) return;
    btn.disabled = true;
    
    // Éléments UI
    const card = btn.closest('.trending-card');
    const statEl = card?.querySelector('.trending-stat');
    const countEl = statEl?.querySelector('span:last-child');
    const currentCount = parseInt(countEl?.textContent) || 0;
    
    try {
        // Vérifier l'état réel dans la DB
        const { data: existingLike } = await supabaseClient
            .from('likes')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('extrait_id', extraitId)
            .maybeSingle();
        
        const wasLiked = !!existingLike;
        const newCount = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
        
        // Mise à jour optimiste de l'UI
        if (wasLiked) {
            btn.classList.remove('liked');
            btn.innerHTML = '🤍 Like';
        } else {
            btn.classList.add('liked');
            btn.innerHTML = '❤️ Like';
        }
        if (countEl) countEl.textContent = newCount;
        
        // Animation
        btn.style.transform = 'scale(1.2)';
        setTimeout(() => btn.style.transform = 'scale(1)', 150);
        
        // Mettre à jour le cache global
        if (typeof userLikesCache !== 'undefined') {
            if (wasLiked) {
                userLikesCache.delete(extraitId);
            } else {
                userLikesCache.add(extraitId);
            }
        }
        if (typeof likesCountCache !== 'undefined') {
            likesCountCache[extraitId] = newCount;
        }
        
        // Synchronisation avec la DB
        if (wasLiked) {
            const { error } = await supabaseClient
                .from('likes')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('extrait_id', extraitId);
            
            if (error) throw error;
            await supabaseClient.rpc('decrement_likes', { extrait_id: extraitId });
        } else {
            const { error } = await supabaseClient
                .from('likes')
                .insert({ extrait_id: extraitId, user_id: currentUser.id });
            
            if (error) throw error;
            await supabaseClient.rpc('increment_likes', { extrait_id: extraitId });
        }
        
        // Mettre à jour les stats utilisateur
        if (typeof loadUserStats === 'function') loadUserStats();
        
    } catch (err) {
        console.error('Erreur like trending:', err);
        // Rollback - restaurer l'UI à l'état précédent
        if (btn.classList.contains('liked')) {
            btn.classList.remove('liked');
            btn.innerHTML = '🤍 Like';
        } else {
            btn.classList.add('liked');
            btn.innerHTML = '❤️ Like';
        }
        if (countEl) countEl.textContent = currentCount;
        toast('Erreur');
    } finally {
        btn.disabled = false;
    }
}

function viewTrendingComments(extraitId) {
    // Fermer le trending et ouvrir le social feed sur cet extrait
    closeTrendingFeed();
    if (typeof openSocialFeed === 'function') openSocialFeed();
    // Scroll to the extrait after a short delay
    setTimeout(() => {
        const card = document.querySelector(`[data-extrait-id="${extraitId}"]`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof toggleComments === 'function') toggleComments(extraitId);
        }
    }, 500);
}

/**
 * Ouvre un extrait depuis les tendances - utilise viewExtraitById pour afficher l'extrait
 */
function openTrendingExtrait(extraitId) {
    // Fermer le trending
    closeTrendingFeed();
    
    // Utiliser viewExtraitById si disponible (charge et affiche l'extrait dans le feed social)
    if (typeof viewExtraitById === 'function') {
        // Ouvrir le feed social d'abord
        if (typeof openSocialFeed === 'function') {
            openSocialFeed();
        }
        // Puis charger l'extrait spécifique
        setTimeout(() => {
            viewExtraitById(extraitId);
            if (typeof toast === 'function') {
                toast('📜 Extrait chargé');
            }
        }, 300);
    } else {
        // Fallback: ouvrir le feed social et essayer de trouver la carte
        if (typeof openSocialFeed === 'function') {
            openSocialFeed();
        }
        setTimeout(() => {
            const card = document.querySelector(`[data-extrait-id="${extraitId}"]`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.style.boxShadow = '0 0 20px var(--accent)';
                setTimeout(() => {
                    card.style.boxShadow = '';
                }, 2000);
            }
        }, 600);
    }
}

// Rendre les fonctions accessibles globalement
window.openTrendingFeed = openTrendingFeed;
window.closeTrendingFeed = closeTrendingFeed;
window.toggleLikeTrending = toggleLikeTrending;
window.viewTrendingComments = viewTrendingComments;
window.openTrendingExtrait = openTrendingExtrait;
