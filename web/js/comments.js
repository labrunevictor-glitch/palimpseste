/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💬 COMMENTS.JS - Palimpseste
 * Système de commentaires pour les extraits
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// 💬 AFFICHAGE DES COMMENTAIRES
// ═══════════════════════════════════════════════════════════════════════════

// Réactions emoji commentaires
let activeCommentReactionPicker = null;
const COMMENT_REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

/**
 * Afficher/masquer les commentaires d'un extrait
 * @param {string} extraitId - ID de l'extrait
 */
async function toggleComments(extraitId) {
    const container = document.getElementById(`comments-${extraitId}`);
    if (!container) return;
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
        
        // Réactions emoji sur les commentaires
        const commentIds = comments.map(c => c.id);
        const reactionsByComment = new Map();
        const myReactionByComment = new Map();

        if (commentIds.length > 0) {
            const { data: reactions, error: reactionsError } = await supabaseClient
                .from('comment_reactions')
                .select('comment_id, user_id, emoji')
                .in('comment_id', commentIds);

            if (reactionsError) {
                console.warn('Réactions commentaires indisponibles:', reactionsError.message || reactionsError);
            } else {
                (reactions || []).forEach(r => {
                    if (!reactionsByComment.has(r.comment_id)) reactionsByComment.set(r.comment_id, new Map());
                    const emojiCounts = reactionsByComment.get(r.comment_id);
                    emojiCounts.set(r.emoji, (emojiCounts.get(r.emoji) || 0) + 1);
                    if (currentUser && r.user_id === currentUser.id) {
                        myReactionByComment.set(r.comment_id, r.emoji);
                    }
                });
            }
        }
        
        container.innerHTML = comments.map(comment => 
            renderCommentItem(comment, profileMap, reactionsByComment, myReactionByComment, extraitId)
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
function renderCommentItem(comment, profileMap, reactionsByComment, myReactionByComment, extraitId) {
    const profile = profileMap.get(comment.user_id);
    const username = profile?.username || 'Anonyme';
    const avatarSymbol = getAvatarSymbol(username);
    const timeAgo = formatTimeAgo(new Date(comment.created_at));
    const canDelete = currentUser && comment.user_id === currentUser.id;
    const canEdit = currentUser && comment.user_id === currentUser.id;

    // Format WhatsApp-style: "Modifié" discret
    const editedLabel = comment.edited_at ? `<span class="comment-edited-label" title="Modifié le ${new Date(comment.edited_at).toLocaleString()}"> • Modifié</span>` : '';
    const reactionsHtml = renderCommentReactions(comment.id, reactionsByComment, myReactionByComment);
    
    return `
        <div class="comment-item" data-id="${comment.id}" data-extrait-id="${extraitId}">
            <div class="comment-avatar" onclick="openUserProfile('${comment.user_id}', '${escapeHtml(username)}')" style="cursor:pointer">${avatarSymbol}</div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-username" onclick="openUserProfile('${comment.user_id}', '${escapeHtml(username)}')">${escapeHtml(username)}</span>
                    <span class="comment-time">${timeAgo}${editedLabel}</span>
                    <div class="comment-actions-inline">
                        <button class="comment-actions-toggle" title="Actions" onclick="toggleCommentActions('${comment.id}')">⋯</button>
                    </div>
                </div>
                <div class="comment-text" id="commentText-${comment.id}">${escapeHtml(comment.content)}</div>
                ${reactionsHtml}
                <div class="comment-footer">
                    <div class="comment-footer-actions">
                        ${canEdit ? `<button class="comment-edit" title="Modifier" onclick="startEditComment('${comment.id}', '${extraitId}')">✎</button>` : ''}
                        ${canDelete ? `<button class="comment-delete" title="Supprimer" onclick="deleteComment('${comment.id}', '${extraitId}')">🗑️</button>` : ''}
                        <button class="comment-react-btn" title="Réagir" onclick="openCommentReactionPicker('${comment.id}', this)">😊</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

let commentActionsInstalled = false;
function ensureCommentActionsInstalled() {
    if (commentActionsInstalled) return;
    commentActionsInstalled = true;
    document.addEventListener('click', (e) => {
        const clickedInsideComment = e.target.closest('.comment-item');
        const clickedInsidePicker = e.target.closest('.comment-reaction-picker');
        if (!clickedInsideComment && !clickedInsidePicker) {
            document.querySelectorAll('.comment-item.show-actions').forEach(el => el.classList.remove('show-actions'));
            closeCommentReactionPicker();
        }
    });
}

function toggleCommentActions(commentId) {
    ensureCommentActionsInstalled();
    const item = document.querySelector(`.comment-item[data-id="${commentId}"]`);
    if (!item) return;
    const willShow = !item.classList.contains('show-actions');
    document.querySelectorAll('.comment-item.show-actions').forEach(el => el.classList.remove('show-actions'));
    if (willShow) item.classList.add('show-actions');
}

function formatHourMinute(dateString) {
    try {
        const d = new Date(dateString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

function startEditComment(commentId, extraitId) {
    const textEl = document.getElementById(`commentText-${commentId}`);
    if (!textEl) return;

    const item = document.querySelector(`.comment-item[data-id="${commentId}"]`);
    if (item) item.classList.add('editing');

    const original = textEl.textContent || '';
    textEl.dataset.original = original;

    // Construire en DOM pour éviter l'escaping visible dans le textarea
    textEl.innerHTML = '';

    const textarea = document.createElement('textarea');
    textarea.className = 'comment-edit-input';
    textarea.id = `commentEditInput-${commentId}`;
    textarea.value = original;

    const actions = document.createElement('div');
    actions.className = 'comment-edit-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'comment-edit-save';
    saveBtn.textContent = 'Enregistrer';
    saveBtn.onclick = () => saveEditComment(commentId, extraitId);

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'comment-edit-cancel';
    cancelBtn.textContent = 'Annuler';
    cancelBtn.onclick = () => cancelEditComment(commentId);

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);

    textEl.appendChild(textarea);
    textEl.appendChild(actions);

    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

function cancelEditComment(commentId) {
    const textEl = document.getElementById(`commentText-${commentId}`);
    if (!textEl) return;
    const original = textEl.dataset.original || '';
    textEl.textContent = original;

    const item = document.querySelector(`.comment-item[data-id="${commentId}"]`);
    if (item) item.classList.remove('editing');
}

async function saveEditComment(commentId, extraitId) {
    if (!currentUser) {
        openAuthModal('login');
        toast('📝 Connectez-vous pour modifier');
        return;
    }
    if (!supabaseClient) return;

    const input = document.getElementById(`commentEditInput-${commentId}`);
    const newContent = input?.value?.trim();
    if (!newContent) {
        toast('Le commentaire ne peut pas être vide');
        return;
    }

    try {
        const { error } = await supabaseClient.rpc('edit_comment', {
            p_comment_id: commentId,
            p_content: newContent
        });
        if (error) throw error;
        toast('✅ Commentaire modifié');
        await loadComments(extraitId);
        const item = document.querySelector(`.comment-item[data-id="${commentId}"]`);
        if (item) item.classList.remove('editing');
    } catch (err) {
        console.error('Erreur edit_comment:', err);
        toast('Erreur modification');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 😊 RÉACTIONS (EMOJIS) SUR COMMENTAIRES
// ═══════════════════════════════════════════════════════════════════════════

function renderCommentReactions(commentId, reactionsByComment, myReactionByComment) {
    const emojiCounts = reactionsByComment.get(commentId);
    if (!emojiCounts || emojiCounts.size === 0) return '';

    const myEmoji = myReactionByComment.get(commentId);
    const pills = Array.from(emojiCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([emoji, count]) => {
            const mine = myEmoji === emoji ? ' mine' : '';
            const label = count > 1 ? `${emoji} ${count}` : `${emoji}`;
            return `<button class="comment-reaction-pill${mine}" onclick="setCommentReaction('${commentId}', '${emoji}')" title="Réagir ${emoji}">${label}</button>`;
        })
        .join('');

    return `<div class="comment-reactions" aria-label="Réactions">${pills}</div>`;
}

function closeCommentReactionPicker() {
    if (activeCommentReactionPicker) {
        activeCommentReactionPicker.remove();
        activeCommentReactionPicker = null;
    }
}

function openCommentReactionPicker(commentId, anchorEl) {
    ensureCommentActionsInstalled();
    closeCommentReactionPicker();

    const picker = document.createElement('div');
    picker.className = 'comment-reaction-picker';
    picker.innerHTML = COMMENT_REACTION_EMOJIS
        .map(e => `<button class="comment-reaction-emoji" onclick="setCommentReaction('${commentId}', '${e}')">${e}</button>`)
        .join('');
    picker.style.visibility = 'hidden';
    document.body.appendChild(picker);

    const rect = anchorEl.getBoundingClientRect();
    const pickerRect = picker.getBoundingClientRect();
    const margin = 8;

    let top = rect.bottom + margin;
    if (top + pickerRect.height > window.innerHeight - margin) {
        top = rect.top - pickerRect.height - margin;
    }

    let left = rect.left + (rect.width / 2) - (pickerRect.width / 2);
    left = Math.max(margin, Math.min(left, window.innerWidth - pickerRect.width - margin));

    picker.style.top = `${top}px`;
    picker.style.left = `${left}px`;
    picker.style.visibility = '';

    activeCommentReactionPicker = picker;

    setTimeout(() => {
        const onDocClick = (ev) => {
            if (!picker.contains(ev.target)) {
                closeCommentReactionPicker();
                document.removeEventListener('click', onDocClick);
                window.removeEventListener('scroll', onViewportChange, true);
                window.removeEventListener('resize', onViewportChange);
            }
        };
        const onViewportChange = () => {
            closeCommentReactionPicker();
            document.removeEventListener('click', onDocClick);
            window.removeEventListener('scroll', onViewportChange, true);
            window.removeEventListener('resize', onViewportChange);
        };
        document.addEventListener('click', onDocClick);
        window.addEventListener('scroll', onViewportChange, true);
        window.addEventListener('resize', onViewportChange);
    }, 0);
}

async function setCommentReaction(commentId, emoji) {
    if (!currentUser) {
        openAuthModal('login');
        toast('😊 Connectez-vous pour réagir');
        return;
    }
    if (!supabaseClient) return;

    try {
        const { data: existing } = await supabaseClient
            .from('comment_reactions')
            .select('emoji')
            .eq('comment_id', commentId)
            .eq('user_id', currentUser.id)
            .maybeSingle();

        if (existing?.emoji === emoji) {
            const { error } = await supabaseClient
                .from('comment_reactions')
                .delete()
                .eq('comment_id', commentId)
                .eq('user_id', currentUser.id);
            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('comment_reactions')
                .upsert({
                    comment_id: commentId,
                    user_id: currentUser.id,
                    emoji,
                    created_at: new Date().toISOString()
                }, { onConflict: 'comment_id,user_id' });
            if (error) throw error;
        }

        closeCommentReactionPicker();

        const item = document.querySelector(`.comment-item[data-id="${commentId}"]`);
        const extraitId = item?.dataset?.extraitId;
        if (extraitId) await loadComments(extraitId);
    } catch (err) {
        console.error('Erreur réaction commentaire:', err);
        const msg = (err && (err.message || err.details)) || '';
        if (msg.includes('comment_reactions') || msg.includes('does not exist') || err?.code === '42P01') {
            toast('Réactions indisponibles: créez la table comment_reactions dans Supabase');
        } else {
            toast('Erreur réaction');
        }
    }
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
            await createNotification(extrait.user_id, 'comment', extraitId, content.substring(0, 100));
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
            
            // Notifier l'auteur du commentaire
            // D'abord récupérer le user_id du commentaire
            const { data: comment } = await supabaseClient
                .from('comments')
                .select('user_id')
                .eq('id', commentId)
                .single();
            
            if (comment && comment.user_id !== currentUser.id && typeof createNotification === 'function') {
                await createNotification(comment.user_id, 'comment_like', extraitId, commentId);
            }
        }
        
        // Rafraîchir l'affichage des commentaires
        await loadComments(extraitId);
        
    } catch (err) {
        console.error('Erreur like commentaire:', err);
    }
}
