/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💬 COMMENTS.JS - Palimpseste
 * Système de commentaires pour les extraits
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// 💬 AFFICHAGE DES COMMENTAIRES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Afficher/masquer les commentaires d'un extrait
 * @param {string} extraitId - ID de l'extrait
 */
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

/**
 * Charger les commentaires d'un extrait
 * @param {string} extraitId - ID de l'extrait
 */
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
        
        container.innerHTML = comments.map(comment => 
            renderCommentItem(comment, profileMap, likesCountMap, userLikedMap, extraitId)
        ).join('');
        
        // Mettre à jour le compteur
        const countEl = document.getElementById(`commentCount-${extraitId}`);
        if (countEl) countEl.textContent = comments.length;
        
    } catch (err) {
        console.error('Erreur chargement commentaires:', err);
        container.innerHTML = '<div class="comments-empty">Erreur: ' + (err.message || err) + '</div>';
    }
}

/**
 * Générer le HTML d'un commentaire
 * @private
 */
function renderCommentItem(comment, profileMap, likesCountMap, userLikedMap, extraitId) {
    const profile = profileMap.get(comment.user_id);
    const username = profile?.username || 'Anonyme';
    const avatarSymbol = getAvatarSymbol(username);
    const timeAgo = formatTimeAgo(new Date(comment.created_at));
    const canDelete = currentUser && comment.user_id === currentUser.id;
    const likeCount = likesCountMap.get(comment.id) || 0;
    const isLiked = userLikedMap.get(comment.id) || false;
    
    return `
        <div class="comment-item" data-id="${comment.id}">
            <div class="comment-avatar" onclick="openUserProfile('${comment.user_id}', '${escapeHtml(username)}')" style="cursor:pointer">${avatarSymbol}</div>
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
}

// ═══════════════════════════════════════════════════════════════════════════
// 💬 ACTIONS SUR LES COMMENTAIRES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Poster un nouveau commentaire
 * @param {string} extraitId - ID de l'extrait
 */
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
            toast('Erreur : ' + error.message);
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
        toast('Erreur d\'envoi');
    }
}

/**
 * Supprimer un commentaire
 * @param {string} commentId - ID du commentaire
 * @param {string} extraitId - ID de l'extrait parent
 */
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
        try {
            await supabaseClient.rpc('decrement_comments', { p_extrait_id: extraitId });
        } catch (rpcErr) {
            console.warn('RPC decrement_comments non disponible:', rpcErr);
        }
        
        toast('🗑️ Commentaire supprimé');
        
        // Recharger les commentaires
        await loadComments(extraitId);
        
    } catch (err) {
        console.error('Erreur suppression commentaire:', err);
        toast('Erreur de suppression');
    }
}

/**
 * Liker/Unliker un commentaire
 * @param {string} commentId - ID du commentaire
 * @param {string} extraitId - ID de l'extrait parent (pour refresh)
 */
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
