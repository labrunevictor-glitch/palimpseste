// ═══════════════════════════════════════════════════════════
// 📤 PARTAGE D'EXTRAITS - Version améliorée
// - Texte intégral par défaut
// - Sélection possible pour réduire
// - Commentaires inline ergonomiques
// ═══════════════════════════════════════════════════════════

var pendingShare = null;
var shareTooltip = null;
var originalShareText = '';
var extraitSharesCache = new Map();
var extraitSharesInFlight = new Map();

/**
 * Partager un extrait depuis n'importe quel contexte
 * Ouvre le modal de partage avec possibilité d'ajouter un commentaire
 */
async function shareExtraitFromCard(extraitId) {
    if (!currentUser) {
        if (typeof openAuthModal === 'function') openAuthModal('login');
        toast('📝 Connectez-vous pour partager');
        return;
    }

    if (typeof getExtraitData !== 'function') {
        toast('❌ Impossible de charger cet extrait');
        return;
    }

    const extrait = await getExtraitData(extraitId);
    if (!extrait) {
        toast('❌ Extrait introuvable');
        return;
    }

    openShareModal(
        extrait.texte || '',
        extrait.source_author || '',
        extrait.source_title || '',
        extrait.source_url || '',
        extrait.id || null
    );
}

/**
 * Récupérer la liste des partages d'un extrait
 * Note: Exclut les extraits "silencieux" (créés pour likes/collections, pas des vrais partages)
 */
async function getExtraitSharesInfo(extraitId) {
    if (!supabaseClient || !extraitId) return { hasShares: false, count: 0, shares: [] };

    if (extraitSharesCache.has(extraitId)) {
        return extraitSharesCache.get(extraitId);
    }

    if (typeof getExtraitData !== 'function') {
        return { hasShares: false, count: 0, shares: [] };
    }

    const extrait = await getExtraitData(extraitId);
    if (!extrait) return { hasShares: false, count: 0, shares: [] };

    try {
        let query = supabaseClient
            .from('extraits')
            .select('id, user_id, created_at, text_hash, source_url, source_title, source_author, is_silent');

        if (extrait.text_hash) {
            query = query.eq('text_hash', extrait.text_hash);
            if (extrait.source_url) {
                query = query.eq('source_url', extrait.source_url);
            } else {
                query = query.eq('source_title', extrait.source_title || '').eq('source_author', extrait.source_author || '');
            }
        } else {
            if (extrait.source_url) {
                query = query.eq('source_url', extrait.source_url);
            } else {
                query = query.eq('source_title', extrait.source_title || '').eq('source_author', extrait.source_author || '');
            }
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // Filtrer les extraits "silencieux" (créés pour like/collection, pas de vrais partages)
        const shares = (data || []).filter(s => !s.is_silent);
        if (typeof loadProfilesMap === 'function') {
            const profileMap = await loadProfilesMap(shares.map(s => s.user_id));
            shares.forEach(share => {
                share.profiles = profileMap.get(share.user_id) || null;
            });
        }
        const info = { hasShares: shares.length > 0, count: shares.length, shares };
        extraitSharesCache.set(extraitId, info);
        return info;
    } catch (err) {
        console.error('Erreur chargement partages:', err);
        return { hasShares: false, count: 0, shares: [] };
    }
}

/**
 * Charger les partages pour une liste d'extraits (batch)
 */
async function loadExtraitShareInfoBatch(extraitIds) {
    if (!supabaseClient || !extraitIds || extraitIds.length === 0) return;

    const uniqueIds = [...new Set(extraitIds.filter(Boolean))];
    const missingIds = uniqueIds.filter(id => !extraitSharesCache.has(id));
    const idsToFetch = missingIds.filter(id => !extraitSharesInFlight.has(id));
    if (missingIds.length === 0 || idsToFetch.length === 0) {
        updateExtraitShareButtons(uniqueIds);
        return;
    }

    idsToFetch.forEach(id => extraitSharesInFlight.set(id, true));

    let extraits = [];
    try {
        if (typeof getExtraitData === 'function') {
            extraits = await Promise.all(idsToFetch.map(id => getExtraitData(id)));
        } else {
            // Fallback: try extraitDataCache or fetch from DB
            const uncachedIds = [];
            for (const id of idsToFetch) {
                if (typeof extraitDataCache !== 'undefined' && extraitDataCache.has(id)) {
                    extraits.push(extraitDataCache.get(id));
                } else {
                    uncachedIds.push(id);
                }
            }
            if (uncachedIds.length > 0) {
                const { data } = await supabaseClient
                    .from('extraits')
                    .select('*')
                    .in('id', uncachedIds);
                if (data) extraits.push(...data);
            }
        }
    } finally {
        idsToFetch.forEach(id => extraitSharesInFlight.delete(id));
    }
    const validExtraits = extraits.filter(Boolean);
    const hashGroups = validExtraits.filter(e => e.text_hash).reduce((acc, e) => {
        acc[e.text_hash] = acc[e.text_hash] || [];
        acc[e.text_hash].push(e);
        return acc;
    }, {});

    const hashes = Object.keys(hashGroups);
    let sharesByHash = [];
    if (hashes.length > 0) {
        const { data } = await supabaseClient
            .from('extraits')
            .select('id, user_id, created_at, text_hash, source_url, source_title, source_author, is_silent')
            .in('text_hash', hashes)
            .or('is_silent.is.null,is_silent.eq.false')  // Exclure les extraits silencieux
            .order('created_at', { ascending: false });
        sharesByHash = data || [];
        if (typeof loadProfilesMap === 'function') {
            const profileMap = await loadProfilesMap(sharesByHash.map(s => s.user_id));
            sharesByHash.forEach(share => {
                share.profiles = profileMap.get(share.user_id) || null;
            });
        }
    }

    for (const extrait of validExtraits) {
        if (extraitSharesCache.has(extrait.id)) continue;

        let shares = [];
        if (extrait.text_hash) {
            shares = sharesByHash.filter(s => {
                // Inclure tous les extraits avec le même hash (y compris celui-ci pour le comptage)
                if (s.text_hash !== extrait.text_hash) return false;
                if (extrait.source_url) return s.source_url === extrait.source_url;
                return (s.source_title || '') === (extrait.source_title || '')
                    && (s.source_author || '') === (extrait.source_author || '');
            });
        } else {
            let query = supabaseClient
                .from('extraits')
                .select('id, user_id, created_at, text_hash, source_url, source_title, source_author, is_silent')
                .or('is_silent.is.null,is_silent.eq.false');  // Exclure les extraits silencieux
            if (extrait.source_url) {
                query = query.eq('source_url', extrait.source_url);
            } else {
                query = query.eq('source_title', extrait.source_title || '').eq('source_author', extrait.source_author || '');
            }
            const { data } = await query.order('created_at', { ascending: false });
            shares = (data || []);
            if (typeof loadProfilesMap === 'function') {
                const profileMap = await loadProfilesMap(shares.map(s => s.user_id));
                shares.forEach(share => {
                    share.profiles = profileMap.get(share.user_id) || null;
                });
            }
        }

        const info = { hasShares: shares.length > 0, count: shares.length, shares };
        extraitSharesCache.set(extrait.id, info);
    }
    
    updateExtraitShareButtons(uniqueIds);
}

/**
 * Mettre à jour l'affichage des compteurs de partage
 */
function updateExtraitShareButtons(extraitIds, cardId = null) {
    if (!extraitIds || extraitIds.length === 0) return;

    extraitIds.forEach(id => {
        const info = extraitSharesCache.get(id);
        // Chercher par extraitId d'abord, puis par cardId si fourni, puis par data-extrait-id
        let countEl = document.getElementById(`shareCount-${id}`);
        if (!countEl && cardId) {
            countEl = document.getElementById(`shareCount-${cardId}`);
        }
        if (!countEl) {
            countEl = document.querySelector(`[id^="shareCount-"][data-extrait-id="${id}"]`);
        }
        if (!countEl) return;

        const count = info?.count || 0;
        countEl.textContent = count;
        countEl.classList.toggle('is-zero', count === 0);
    });
}

/**
 * Afficher la liste des utilisateurs qui ont partagé un extrait
 */
async function showSharers(extraitId) {
    if (!supabaseClient) return;

    let modal = document.getElementById('sharersModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'sharersModal';
        modal.className = 'likers-modal';
        modal.innerHTML = `
            <div class="likers-content">
                <div class="likers-header">
                    <h3>⤴ Partagé par</h3>
                    <button class="likers-close" onclick="closeSharersModal()">✕</button>
                </div>
                <div class="likers-list" id="sharersList">
                    <div class="likers-loading">Chargement...</div>
                </div>
            </div>
        `;
        modal.onclick = (e) => { if (e.target === modal) closeSharersModal(); };
        document.body.appendChild(modal);
    }

    modal.classList.add('open');
    const listContainer = document.getElementById('sharersList');
    listContainer.innerHTML = '<div class="likers-loading">Chargement...</div>';

    // Forcer le rechargement depuis la DB (vider le cache pour cet extrait)
    extraitSharesCache.delete(extraitId);
    
    const info = await getExtraitSharesInfo(extraitId);
    if (!info.shares || info.shares.length === 0) {
        listContainer.innerHTML = '<div class="likers-empty">Aucun partage pour le moment</div>';
        return;
    }

    listContainer.innerHTML = info.shares.map(share => {
        const profile = share.profiles || {};
        const username = profile.username || 'Anonyme';
        const avatarSymbol = getAvatarSymbol(username);
        const timeAgo = formatTimeAgo(new Date(share.created_at));

        return `
            <div class="liker-item">
                <div class="liker-avatar" onclick="openUserProfile('${share.user_id}', '${escapeHtml(username)}'); closeSharersModal();">${avatarSymbol}</div>
                <div class="liker-info" onclick="openUserProfile('${share.user_id}', '${escapeHtml(username)}'); closeSharersModal();">
                    <div class="liker-name">${escapeHtml(username)}</div>
                    <div class="liker-time">${timeAgo}</div>
                </div>
            </div>
        `;
    }).join('');
}

function closeSharersModal() {
    const modal = document.getElementById('sharersModal');
    if (modal) modal.classList.remove('open');
}

/**
 * Ouvrir le modal de partage avec le texte COMPLET
 * L'utilisateur peut ensuite sélectionner une partie s'il le souhaite
 */
function openShareModal(text, author, title, sourceUrl, extraitId = null, tag = '', cardId = null) {
    if (!currentUser) {
        if (typeof openAuthModal === 'function') openAuthModal('login');
        toast('📝 Connectez-vous pour partager');
        return;
    }
    
    originalShareText = text;
    pendingShare = { text, author, title, sourceUrl, extraitId, tag, cardId };
    
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
    
    // Garder trace des IDs AVANT de fermer le modal (pendingShare sera réinitialisé)
    const originalExtraitId = pendingShare.cardId;
    const extraitIdToUpdate = pendingShare.extraitId;
    const cardIdToUpdate = pendingShare.cardId;
    
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
        }).select().single();
        
        if (error) throw error;
        
        // ═══════════════════════════════════════════════════════════
        // MISE À JOUR OPTIMISTE DU COMPTEUR DE PARTAGES (IMMÉDIATE)
        // Avant closeShareModal pour que le compteur soit mis à jour
        // ═══════════════════════════════════════════════════════════
        if (extraitIdToUpdate || cardIdToUpdate) {
            const countEl = document.getElementById(`shareCount-${cardIdToUpdate}`) 
                         || document.getElementById(`shareCount-${extraitIdToUpdate}`);
            if (countEl) {
                const currentCount = parseInt(countEl.textContent) || 0;
                const newCount = currentCount + 1;
                countEl.textContent = newCount;
                countEl.classList.toggle('is-zero', newCount === 0);
            }
            
            // Mettre à jour le cache
            if (extraitIdToUpdate) {
                const cacheInfo = extraitSharesCache.get(extraitIdToUpdate) || { count: 0 };
                cacheInfo.count = (cacheInfo.count || 0) + 1;
                extraitSharesCache.set(extraitIdToUpdate, cacheInfo);
            }
        }
        
        closeShareModal();
        toast('🐦 Extrait publié !');
        
        // Notifier l'auteur de l'extrait original (si c'est un repartage) - en arrière-plan
        if (originalExtraitId && typeof createNotification === 'function') {
            (async () => {
                try {
                    const { data: originalExtrait } = await supabaseClient
                        .from('extraits')
                        .select('user_id')
                        .eq('id', originalExtraitId)
                        .single();
                    
                    if (originalExtrait && originalExtrait.user_id !== currentUser.id) {
                        await createNotification(originalExtrait.user_id, 'share', data?.id || originalExtraitId, preview.substring(0, 100));
                    }
                } catch (e) {
                    console.warn('Erreur notif auteur original:', e);
                }
            })();
        }
        
        if (typeof loadUserStats === 'function') loadUserStats();
        
    } catch (err) {
        toast('Erreur : ' + (err.message || err));
    } finally {
        if (btn) btn.disabled = false;
    }
}

/**
 * Annuler un partage (suppression de l'extrait) avec confirmation
 */
async function cancelShareExtrait(extraitId) {
    if (!currentUser) {
        if (typeof openAuthModal === 'function') openAuthModal('login');
        toast('📝 Connectez-vous pour annuler un partage');
        return;
    }
    if (!supabaseClient || !extraitId) return;

    const confirmed = confirm('Annuler ce partage ?\nCette action est définitive.');
    if (!confirmed) return;

    const btn = document.getElementById(`unshareBtn-${extraitId}`);
    if (btn) btn.disabled = true;

    try {
        const { error } = await supabaseClient
            .from('extraits')
            .delete()
            .eq('id', extraitId)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        toast('✅ Partage annulé');

        // Nettoyer les caches locaux
        if (typeof extraitSharesCache !== 'undefined') {
            extraitSharesCache.delete(extraitId);
        }
        if (typeof extraitDataCache !== 'undefined') {
            extraitDataCache.delete(extraitId);
        }

        // Retirer la carte du DOM si présente
        const card = document.querySelector(`.extrait-card[data-id="${extraitId}"]`);
        if (card) card.remove();

        // Mettre à jour le feed social si affiché
        const socialContainer = document.getElementById('socialFeed');
        if (socialContainer && typeof socialExtraits !== 'undefined' && typeof renderSocialFeed === 'function') {
            socialExtraits = (socialExtraits || []).filter(e => e.id !== extraitId);
            await renderSocialFeed();
        }

        // Rafraîchir les compteurs de partages visibles
        if (typeof loadExtraitShareInfoBatch === 'function') {
            const visibleIds = Array.from(document.querySelectorAll('.extrait-card[data-id]'))
                .map(el => el.getAttribute('data-id'))
                .filter(Boolean);
            if (visibleIds.length > 0) {
                await loadExtraitShareInfoBatch(visibleIds);
            }
        }

        if (typeof loadUserStats === 'function') loadUserStats();
    } catch (err) {
        console.error('Erreur annulation partage:', err);
        toast('Erreur : ' + (err.message || err));
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

// ═══════════════════════════════════════════════════════════
// 💬 COMMENTAIRES COMPLETS - Cartes du feed (exploration)
// ═══════════════════════════════════════════════════════════

function syncCardCommentCountId(card, extraitId) {
    if (!card || !extraitId) return;
    const cardId = card.id;
    const countEl = document.getElementById(`commentCount-${cardId}`);
    if (countEl) {
        countEl.dataset.extraitId = extraitId;
        countEl.id = `commentCount-${extraitId}`;
    }
}

async function resolveExtraitForCard(card, createIfMissing = false) {
    if (!card || !supabaseClient) return null;

    const title = card.dataset.title || 'Sans titre';
    const author = card.dataset.author || 'Inconnu';
    const sourceUrl = card.dataset.url || '';
    const text = card.dataset.text || '';
    const lang = card.dataset.lang || 'fr';
    const textToStore = text.substring(0, 500);
    const { textHash, textLength } = buildExtraitKey(textToStore, title, author, sourceUrl);

    // Recherche prioritaire: URL + hash (clé stable)
    let extraitId = null;
    if (sourceUrl && textHash) {
        const { data: byStable } = await supabaseClient
            .from('extraits')
            .select('id')
            .eq('source_url', sourceUrl)
            .eq('text_hash', textHash)
            .order('created_at', { ascending: false })
            .maybeSingle();
        extraitId = byStable?.id || null;
    }

    if (!extraitId) {
        let query = supabaseClient
            .from('extraits')
            .select('id')
            .eq('source_title', title)
            .eq('source_author', author);
        if (sourceUrl) query = query.eq('source_url', sourceUrl);
        if (textHash) query = query.eq('text_hash', textHash);

        const { data: existingByHash } = await query.order('created_at', { ascending: false }).maybeSingle();
        extraitId = existingByHash?.id || null;
    }

    if (!extraitId) {
        let fallbackQuery = supabaseClient
            .from('extraits')
            .select('id')
            .eq('source_title', title)
            .eq('source_author', author);
        if (sourceUrl) fallbackQuery = fallbackQuery.eq('source_url', sourceUrl);
        const { data: existingFallback } = await fallbackQuery.order('created_at', { ascending: false }).maybeSingle();
        extraitId = existingFallback?.id || null;
    }

    if (!extraitId && createIfMissing) {
        if (!currentUser) return null;
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
                likes_count: 0,
                is_silent: true  // Extrait créé pour commentaires, pas un partage public
            })
            .select()
            .single();
        if (error) throw error;
        extraitId = newExtrait?.id || null;
    }

    if (extraitId) {
        card.dataset.extraitId = extraitId;
        syncCardCommentCountId(card, extraitId);
    }

    return extraitId;
}

async function openCardComments(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    if (!supabaseClient) return;

    const existingId = card.dataset.extraitId;
    let extraitId = existingId || await resolveExtraitForCard(card, false);

    if (!extraitId && !currentUser) {
        if (typeof openAuthModal === 'function') openAuthModal('login');
        toast('📝 Connectez-vous pour commenter');
        return;
    }

    if (!extraitId) {
        try {
            extraitId = await resolveExtraitForCard(card, true);
        } catch (e) {
            toast('Impossible de préparer les commentaires');
            return;
        }
    }

    if (!extraitId) return;

    let section = card.querySelector(`.comments-section[data-extrait-id="${extraitId}"]`);
    if (section) {
        toggleComments(extraitId);
        return;
    }

    const countEl = document.getElementById(`commentCount-${extraitId}`) || document.getElementById(`commentCount-${cardId}`);
    const countVal = parseInt(countEl?.textContent) || 0;

    section = document.createElement('div');
    section.className = 'comments-section';
    section.dataset.extraitId = extraitId;
    section.innerHTML = `
        <div class="comments-container open" id="comments-${extraitId}">
            <div class="comments-list" id="commentsList-${extraitId}">
                <div class="comments-empty">Chargement...</div>
            </div>
            <div class="comment-input-area">
                <textarea class="comment-input" id="commentInput-${extraitId}" placeholder="Écrire un commentaire..." rows="1" onkeypress="if(event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); postComment('${extraitId}'); }"></textarea>
                <button class="comment-send" onclick="postComment('${extraitId}')">➤</button>
            </div>
        </div>
    `;
    const foot = card.querySelector('.card-foot');
    if (foot) foot.after(section);
    else card.appendChild(section);

    if (countEl && countEl.id !== `commentCount-${extraitId}`) {
        countEl.id = `commentCount-${extraitId}`;
        countEl.dataset.extraitId = extraitId;
        countEl.textContent = countVal;
    }

    await loadComments(extraitId);
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
            .select('*')
            .eq('extrait_id', extraitId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (comments && comments.length > 0 && typeof loadProfilesMap === 'function') {
            const profileMap = await loadProfilesMap(comments.map(c => c.user_id));
            comments.forEach(c => {
                c.profiles = profileMap.get(c.user_id) || null;
            });
        }
        
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
                        likes_count: 0,
                        is_silent: true  // Extrait créé pour commentaires, pas un partage public
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
        
        // Notifier l'auteur de l'extrait
        if (extraitId && typeof createNotification === 'function') {
            try {
                const { data: extrait } = await supabaseClient
                    .from('extraits')
                    .select('user_id')
                    .eq('id', extraitId)
                    .single();
                
                if (extrait && extrait.user_id !== currentUser.id) {
                    await createNotification(extrait.user_id, 'comment', extraitId, comment.substring(0, 100));
                }
            } catch (e) {
                console.warn('Erreur notif auteur extrait:', e);
            }
        }
        
        // Notifier les utilisateurs mentionnés
        if (typeof notifyMentions === 'function') {
            await notifyMentions(comment, extraitId, comment.substring(0, 100));
        }
        
        // Afficher localement
        const username = currentUser?.user_metadata?.username || 'Moi';
        const listEl = card.querySelector('.inline-comments-list');
        if (listEl) {
            const formattedComment = typeof formatMentions === 'function' 
                ? formatMentions(escapeHtmlShare(comment))
                : escapeHtmlShare(comment);
            const el = document.createElement('div');
            el.className = 'inline-comment-item new';
            el.innerHTML = `
                <span class="inline-comment-avatar">${getAvatarSymbol(username)}</span>
                <span class="inline-comment-content"><strong>${escapeHtmlShare(username)}</strong> ${formattedComment}</span>
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
    btn.textContent = '⤴ Partager';
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
window.openCardComments = openCardComments;
window.syncCardCommentCountId = syncCardCommentCountId;
window.shareExtraitFromCard = shareExtraitFromCard;
window.getExtraitSharesInfo = getExtraitSharesInfo;
window.loadExtraitShareInfoBatch = loadExtraitShareInfoBatch;
window.updateExtraitShareButtons = updateExtraitShareButtons;
window.showSharers = showSharers;
window.closeSharersModal = closeSharersModal;
window.cancelShareExtrait = cancelShareExtrait;
window.extraitSharesCache = extraitSharesCache;
