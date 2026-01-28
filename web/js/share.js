// ═══════════════════════════════════════════════════════════
// 📤 PARTAGE D'EXTRAITS - Version améliorée
// - Texte intégral par défaut
// - Sélection possible pour réduire
// - Commentaires inline ergonomiques
// ═══════════════════════════════════════════════════════════

var pendingShare = null;
var shareTooltip = null;
var originalShareText = '';

/**
 * Ouvrir le modal de partage avec le texte COMPLET
 * L'utilisateur peut ensuite sélectionner une partie s'il le souhaite
 */
function openShareModal(text, author, title, sourceUrl, cardId = null, tag = '') {
    if (!currentUser) {
        if (typeof openAuthModal === 'function') openAuthModal('login');
        toast('📝 Connectez-vous pour partager');
        return;
    }
    
    originalShareText = text;
    pendingShare = { text, author, title, sourceUrl, cardId, tag };
    
    const previewEl = document.getElementById('sharePreviewText');
    const sourceEl = document.getElementById('sharePreviewSource');
    
    // Afficher le texte complet (scrollable si long)
    if (previewEl) {
        previewEl.innerHTML = `<div class="share-text-selectable" style="user-select:text;-webkit-user-select:text;">${escapeHtmlShare(text)}</div>`;
        previewEl.style.maxHeight = '250px';
        previewEl.style.overflowY = 'auto';
        previewEl.style.cursor = 'text';
    }
    
    if (sourceEl) {
        sourceEl.textContent = `— ${author}, ${title}`;
    }
    
    // Compteur de caractères
    updateShareCharCount(text.length);
    
    document.getElementById('shareCommentary').value = '';
    document.getElementById('shareModal').classList.add('open');
    
    // Listeners pour la sélection
    setTimeout(setupShareTextSelection, 100);
}

function setupShareTextSelection() {
    const previewEl = document.getElementById('sharePreviewText');
    if (!previewEl) return;
    
    const handler = () => {
        const selection = window.getSelection().toString().trim();
        if (selection.length >= 20 && pendingShare) {
            pendingShare.text = selection;
            updateShareCharCount(selection.length);
            toast(`✂️ ${selection.length} caractères sélectionnés`);
        }
    };
    
    previewEl.onmouseup = handler;
    previewEl.ontouchend = handler;
}

function updateShareCharCount(count) {
    let el = document.getElementById('shareCharCount');
    if (!el) {
        // Créer l'élément s'il n'existe pas
        const preview = document.querySelector('.share-preview');
        if (preview) {
            el = document.createElement('div');
            el.id = 'shareCharCount';
            el.className = 'share-char-count';
            preview.appendChild(el);
        }
    }
    if (el) {
        const limit = 1000;
        el.textContent = `${count}/${limit} caractères`;
        el.style.color = count > limit ? 'var(--accent)' : 'var(--muted)';
        el.style.fontSize = '0.75rem';
        el.style.textAlign = 'right';
        el.style.marginTop = '0.5rem';
    }
}

function resetShareToFull() {
    if (pendingShare && originalShareText) {
        pendingShare.text = originalShareText;
        updateShareCharCount(originalShareText.length);
        toast('📄 Texte complet restauré');
    }
}

function closeShareModal() {
    document.getElementById('shareModal').classList.remove('open');
    pendingShare = null;
    originalShareText = '';
}

async function publishExtrait() {
    if (!supabaseClient || !currentUser || !pendingShare) {
        toast('⚠️ Impossible de publier');
        return;
    }
    
    const btn = document.getElementById('publishBtn');
    if (btn) btn.disabled = true;
    
    const commentary = document.getElementById('shareCommentary').value.trim();
    
    // Ne stocker qu'un APERÇU (150 chars) + métadonnées pour récupérer depuis Wikisource
    const fullText = pendingShare.text || '';
    const preview = fullText.substring(0, 150) + (fullText.length > 150 ? '…' : '');
    const { textHash, textLength } = buildExtraitKey(fullText, pendingShare.title, pendingShare.author, pendingShare.sourceUrl);
    
    try {
        const { data, error } = await supabaseClient.from('extraits').insert({
            user_id: currentUser.id,
            texte: preview, // Seulement l'aperçu !
            source_title: pendingShare.title,
            source_author: pendingShare.author,
            source_url: pendingShare.sourceUrl || '',
            text_hash: textHash || null,
            text_length: textLength || null,
            commentary: commentary || null,
            likes_count: 0,
            created_at: new Date().toISOString()
        });
        
        if (error) throw error;
        
        closeShareModal();
        toast('🐦 Extrait publié !');
        if (typeof loadUserStats === 'function') loadUserStats();
        
    } catch (err) {
        toast('Erreur : ' + (err.message || err));
    } finally {
        if (btn) btn.disabled = false;
    }
}

// ═══════════════════════════════════════════════════════════
// 💬 COMMENTAIRES INLINE - Directement sous les cartes
// ═══════════════════════════════════════════════════════════

function showInlineComment(cardId) {
    if (!currentUser) {
        if (typeof openAuthModal === 'function') openAuthModal('login');
        toast('📝 Connectez-vous pour commenter');
        return;
    }
    
    const card = document.getElementById(cardId);
    if (!card) return;
    
    // Toggle si déjà existant
    let box = card.querySelector('.inline-comment-box');
    if (box) {
        box.classList.toggle('open');
        if (box.classList.contains('open')) {
            box.querySelector('input')?.focus();
        }
        return;
    }
    
    // Créer le champ inline
    box = document.createElement('div');
    box.className = 'inline-comment-box open';
    box.innerHTML = `
        <div class="inline-comments-list"></div>
        <div class="inline-comment-input-wrapper">
            <input type="text" class="inline-comment-input" 
                   placeholder="Votre commentaire..." maxlength="500"
                   onkeydown="if(event.key==='Enter')sendInlineComment('${cardId}',this)">
            <button class="inline-comment-send" onclick="sendInlineComment('${cardId}',this.previousElementSibling)">➤</button>
        </div>
    `;
    
    const foot = card.querySelector('.card-foot');
    if (foot) foot.after(box);
    else card.appendChild(box);
    
    setTimeout(() => box.querySelector('input')?.focus(), 50);
    
    // Charger les commentaires existants si extrait connu
    loadInlineComments(cardId);
}

async function loadInlineComments(cardId) {
    const card = document.getElementById(cardId);
    if (!card || !supabaseClient) return;
    
    const title = card.dataset.title;
    const author = card.dataset.author;
    const sourceUrl = card.dataset.url || '';
    const text = card.dataset.text || '';
    const teaserText = text.substring(0, 500);
    const { textHash } = buildExtraitKey(teaserText, title, author, sourceUrl);
    const listEl = card.querySelector('.inline-comments-list');
    if (!listEl) return;
    
    try {
        // Chercher l'extrait
        let query = supabaseClient
            .from('extraits')
            .select('id')
            .eq('source_title', title)
            .eq('source_author', author);
        if (sourceUrl) query = query.eq('source_url', sourceUrl);
        if (textHash) query = query.eq('text_hash', textHash);

        let extraits = null;

        const byHash = await query
            .order('created_at', { ascending: false })
            .limit(1);
        extraits = byHash.data;

        if (!extraits || extraits.length === 0) {
            let fallbackQuery = supabaseClient
                .from('extraits')
                .select('id')
                .eq('source_title', title)
                .eq('source_author', author);
            if (sourceUrl) fallbackQuery = fallbackQuery.eq('source_url', sourceUrl);
            const fallback = await fallbackQuery
                .order('created_at', { ascending: false })
                .limit(1);
            extraits = fallback.data;
        }
        
        if (!extraits || extraits.length === 0) return;
        
        const extraitId = extraits[0].id;
        card.dataset.extraitId = extraitId;
        
        // Charger les commentaires
        const { data: comments } = await supabaseClient
            .from('comments')
            .select('*, profiles:user_id(username)')
            .eq('extrait_id', extraitId)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (comments && comments.length > 0) {
            listEl.innerHTML = comments.map(c => {
                const username = c.profiles?.username || 'Anonyme';
                const avatarSymbol = getAvatarSymbol(username);
                return `
                    <div class="inline-comment-item">
                        <span class="inline-comment-avatar">${avatarSymbol}</span>
                        <span class="inline-comment-content">
                            <strong>${escapeHtmlShare(username)}</strong> ${escapeHtmlShare(c.content)}
                        </span>
                    </div>
                `;
            }).join('');
        }
    } catch (e) {
        console.log('Pas de commentaires:', e);
    }
}

async function sendInlineComment(cardId, inputEl) {
    if (!currentUser || !supabaseClient) {
        toast('📝 Connectez-vous');
        return;
    }
    
    const comment = inputEl.value.trim();
    if (!comment) return;
    
    const card = document.getElementById(cardId);
    if (!card) return;
    
    inputEl.disabled = true;
    
    try {
        let extraitId = card.dataset.extraitId;
        const sourceUrl = card.dataset.url || '';
        const text = card.dataset.text || '';
        const author = card.dataset.author || 'Inconnu';
        const title = card.dataset.title || 'Sans titre';
        const lang = card.dataset.lang || 'fr';
        const textToStore = text.substring(0, 500);
        const { textHash, textLength } = buildExtraitKey(textToStore, title, author, sourceUrl);
        
        // Créer l'extrait si nécessaire
        if (!extraitId) {
            let existing = null;
            let existingQuery = supabaseClient
                .from('extraits')
                .select('id')
                .eq('source_title', title)
                .eq('source_author', author);
            if (sourceUrl) existingQuery = existingQuery.eq('source_url', sourceUrl);
            if (textHash) existingQuery = existingQuery.eq('text_hash', textHash);
            const { data: existingByHash } = await existingQuery.order('created_at', { ascending: false }).maybeSingle();
            existing = existingByHash || null;

            if (!existing) {
                let existingFallbackQuery = supabaseClient
                    .from('extraits')
                    .select('id')
                    .eq('source_title', title)
                    .eq('source_author', author);
                if (sourceUrl) existingFallbackQuery = existingFallbackQuery.eq('source_url', sourceUrl);
                const { data: existingFallback } = await existingFallbackQuery
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                existing = existingFallback || null;
            }
            
            if (existing?.id) {
                extraitId = existing.id;
                card.dataset.extraitId = extraitId;
            } else {
                const { data: newExtrait, error } = await supabaseClient
                    .from('extraits')
                    .insert({
                        user_id: currentUser.id,
                        texte: textToStore,
                        source_title: title,
                        source_author: author,
                        source_url: sourceUrl || `https://${lang}.wikisource.org/wiki/${encodeURIComponent(title)}`,
                        text_hash: textHash || null,
                        text_length: textLength || null,
                        likes_count: 0
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                extraitId = newExtrait.id;
                card.dataset.extraitId = extraitId;
            }
        }
        
        // Ajouter le commentaire
        await supabaseClient.from('comments').insert({
            extrait_id: extraitId,
            user_id: currentUser.id,
            content: comment
        });

        // Incrémenter le compteur côté extraits (RPC si disponible)
        try {
            await supabaseClient.rpc('increment_comments', { p_extrait_id: extraitId });
        } catch (e) {
            // Silencieux si RPC non disponible
        }
        
        inputEl.value = '';
        toast('💬 Commentaire ajouté !');
        
        // Afficher localement
        const username = currentUser?.user_metadata?.username || 'Moi';
        const listEl = card.querySelector('.inline-comments-list');
        if (listEl) {
            const el = document.createElement('div');
            el.className = 'inline-comment-item new';
            el.innerHTML = `
                <span class="inline-comment-avatar">${getAvatarSymbol(username)}</span>
                <span class="inline-comment-content"><strong>${escapeHtmlShare(username)}</strong> ${escapeHtmlShare(comment)}</span>
            `;
            listEl.prepend(el);
            setTimeout(() => el.classList.remove('new'), 300);
        }
        
        // Mettre à jour le compteur de commentaires sur la carte
        const countEl = document.getElementById(`commentCount-${cardId}`);
        if (countEl) {
            const currentCount = parseInt(countEl.textContent) || 0;
            if (typeof updateCardCommentCount === 'function') {
                updateCardCommentCount(cardId, currentCount + 1);
            } else {
                countEl.textContent = currentCount + 1;
            }
        }
        
    } catch (err) {
        toast(err.message || 'Erreur');
    } finally {
        inputEl.disabled = false;
        inputEl.focus();
    }
}

// ═══════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════

function escapeHtmlShare(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function showShareTooltip(text, author, title, sourceUrl) {
    hideShareTooltip();
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    shareTooltip = document.createElement('div');
    shareTooltip.className = 'share-tooltip';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '📤 Partager';
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.openShareModal === 'function') {
            window.openShareModal(text, author, title, sourceUrl);
        }
    });
    shareTooltip.appendChild(btn);
    shareTooltip.style.cssText = `position:fixed;top:${rect.top-45}px;left:${Math.max(10,rect.left+rect.width/2-50)}px;background:var(--accent);color:white;padding:0.5rem 1rem;border-radius:8px;z-index:10000;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.4);`;
    document.body.appendChild(shareTooltip);
    setTimeout(hideShareTooltip, 5000);
}

function hideShareTooltip() {
    if (shareTooltip) { shareTooltip.remove(); shareTooltip = null; }
}

document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.share-tooltip')) hideShareTooltip();
});

// Exports
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.publishExtrait = publishExtrait;
window.resetShareToFull = resetShareToFull;
window.showShareTooltip = showShareTooltip;
window.hideShareTooltip = hideShareTooltip;
window.showInlineComment = showInlineComment;
window.sendInlineComment = sendInlineComment;
