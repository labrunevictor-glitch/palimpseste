/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PALIMPSESTE - Module Collections (collections.js)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Gestion des collections personnalisées de textes :
 * - Créer/modifier/supprimer des collections
 * - Ajouter/retirer des textes à une collection
 * - Organiser ses favoris par thèmes
 * 
 * Dépendances : app.js (state, toast), config.js (supabase), auth.js (currentUser)
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════
// 📊 ÉTAT DES COLLECTIONS
// ═══════════════════════════════════════════════════════════

let userCollections = [];
let collectionsLoaded = false;
let currentViewingCollection = null;
let extraitCollectionsCache = new Map();
let extraitCollectionsInFlight = new Map();

// Symboles suggérés pour les collections (style sobre et élégant)
const COLLECTION_EMOJIS = [
    '♡', '♢', '♤', '♧', '★', '☆', '◆', '◇',
    '❧', '§', '¶', '†', '‡', '※', '⁂', '⁕',
    '∞', '≈', '∴', '∵', '∷', '⊕', '⊗', '⊙',
    '●', '○', '◉', '◎', '■', '□', '▲', '△',
    '♪', '♫', '♬', '⚘', '❦', '❡', '✦', '✧',
    '⟐', '⟡', '⧫', '⬡', '⬢', '⬣', '⬤', '⬥',
    '⊛', '⊜', '⊝', '⊞', '⊟', '⊠', '⊡', '⍟'
];

// Couleurs suggérées pour les collections
const COLLECTION_COLORS = [
    '#5a7a8a', // Bleu ardoise (défaut)
    '#8b7355', // Sépia doré
    '#6b3a3a', // Bordeaux profond
    '#5c5470', // Prune grisé
    '#bf5af2', // Violet poésie
    '#30d158', // Vert fable
    '#ff9f0a', // Orange conte
    '#ff453a', // Rouge nouvelle
    '#64d2ff', // Bleu théâtre
    '#ffd60a', // Or mystique
    '#ac8e68', // Bronze philosophie
    '#ff6482', // Rose roman
];

// ═══════════════════════════════════════════════════════════
// 📥 CHARGEMENT DES COLLECTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Charger les collections de l'utilisateur
 */
async function loadUserCollections(forceReload = false) {
    if (!currentUser || !supabaseClient) {
        userCollections = [];
        collectionsLoaded = false;
        return [];
    }

    if (collectionsLoaded && !forceReload) {
        return userCollections;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('collections')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('position', { ascending: true });
        
        if (error) throw error;
        
        userCollections = data || [];
        
        // Charger le nombre d'items pour chaque collection
        for (const collection of userCollections) {
            const { count, error: countError } = await supabaseClient
                .from('collection_items')
                .select('*', { count: 'exact', head: true })
                .eq('collection_id', collection.id);
            
            collection.items_count = countError ? 0 : (count || 0);
        }
        
        collectionsLoaded = true;
        console.log('📚 Collections chargées:', userCollections.length);
        
        return userCollections;
    } catch (err) {
        console.error('Erreur chargement collections:', err);
        userCollections = [];
        return [];
    }
}

/**
 * Charger les items d'une collection spécifique
 */
async function loadCollectionItems(collectionId) {
    if (!supabaseClient) return [];
    
    try {
        const { data, error } = await supabaseClient
            .from('collection_items')
            .select(`
                *,
                extraits(id, texte, source_title, source_author, source_url, created_at),
                source_likes(id, title, author, source_url, preview)
            `)
            .eq('collection_id', collectionId)
            .order('position', { ascending: true });
        
        if (error) throw error;
        
        return data || [];
    } catch (err) {
        console.error('Erreur chargement items collection:', err);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════
// ✏️ CRÉATION / MODIFICATION / SUPPRESSION
// ═══════════════════════════════════════════════════════════

/**
 * Créer une nouvelle collection
 */
async function createCollection(name, emoji = '❧', color = '#5a7a8a', description = '', isPublic = false) {
    if (!currentUser || !supabaseClient) {
        toast('📝 Connectez-vous pour créer une collection');
        return null;
    }
    
    if (!name || name.trim().length === 0) {
        toast('❌ Le nom de la collection est requis');
        return null;
    }
    
    try {
        // Trouver la position max actuelle
        const maxPosition = userCollections.length > 0 
            ? Math.max(...userCollections.map(c => c.position || 0)) + 1 
            : 0;
        
        const { data, error } = await supabaseClient
            .from('collections')
            .insert({
                user_id: currentUser.id,
                name: name.trim(),
                emoji: emoji,
                color: color,
                description: description?.trim() || null,
                is_public: isPublic,
                position: maxPosition
            })
            .select()
            .single();
        
        if (error) throw error;
        
        userCollections.push(data);
        toast(`✅ Collection "${name}" créée`);
        
        // Rafraîchir l'UI
        if (typeof renderCollectionsList === 'function') {
            renderCollectionsList();
        }
        
        return data;
    } catch (err) {
        console.error('Erreur création collection:', err);
        toast('❌ Erreur lors de la création');
        return null;
    }
}

/**
 * Modifier une collection existante
 */
async function updateCollection(collectionId, updates) {
    if (!currentUser || !supabaseClient) return null;
    
    try {
        const { data, error } = await supabaseClient
            .from('collections')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', collectionId)
            .eq('user_id', currentUser.id)
            .select()
            .single();
        
        if (error) throw error;
        
        // Mettre à jour le cache local
        const idx = userCollections.findIndex(c => c.id === collectionId);
        if (idx !== -1) {
            userCollections[idx] = { ...userCollections[idx], ...data };
        }
        
        toast('✅ Collection mise à jour');
        return data;
    } catch (err) {
        console.error('Erreur modification collection:', err);
        toast('❌ Erreur lors de la modification');
        return null;
    }
}

/**
 * Supprimer une collection
 */
async function deleteCollection(collectionId) {
    if (!currentUser || !supabaseClient) return false;
    
    const collection = userCollections.find(c => c.id === collectionId);
    if (!collection) return false;
    
    if (!confirm(`Supprimer la collection "${collection.name}" ?\nLes textes ne seront pas supprimés de vos favoris.`)) {
        return false;
    }
    
    try {
        const { error } = await supabaseClient
            .from('collections')
            .delete()
            .eq('id', collectionId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        // Retirer du cache local
        userCollections = userCollections.filter(c => c.id !== collectionId);
        
        toast(`Collection "${collection.name}" supprimée`);
        
        // Rafraîchir l'UI
        if (typeof renderCollectionsList === 'function') {
            renderCollectionsList();
        }
        
        return true;
    } catch (err) {
        console.error('Erreur suppression collection:', err);
        toast('❌ Erreur lors de la suppression');
        return false;
    }
}

// ═══════════════════════════════════════════════════════════
// 📎 GESTION DES ITEMS DE COLLECTION
// ═══════════════════════════════════════════════════════════

/**
 * Ajouter un texte à une collection
 * @param {string} collectionId - ID de la collection
 * @param {object} item - L'item à ajouter (extrait, source_like, ou local)
 */
async function addToCollection(collectionId, item) {
    if (!currentUser || !supabaseClient) {
        toast('📝 Connectez-vous pour organiser vos collections');
        return false;
    }
    
    try {
        const insertData = {
            collection_id: collectionId,
            user_id: currentUser.id,
            position: 0 // Sera en haut de la liste
        };
        
        // Déterminer le type d'item
        if (item.extrait_id) {
            insertData.extrait_id = item.extrait_id;
        } else if (item.source_like_id) {
            insertData.source_like_id = item.source_like_id;
            // Snapshot local pour permettre l'affichage (y compris si la collection devient publique)
            // NB: les règles RLS de source_likes ne permettent pas forcément aux autres de lire la ligne.
            insertData.local_title = item.title || item.source_title || null;
            insertData.local_author = item.author || item.source_author || null;
            insertData.local_url = item.source_url || item.url || null;
            insertData.local_preview = item.preview || item.texte || item.text?.substring(0, 200) || null;
        } else {
            // Item local (depuis exploration)
            insertData.local_title = item.title;
            insertData.local_author = item.author;
            insertData.local_url = item.url || item.source_url;
            insertData.local_preview = item.preview || item.text?.substring(0, 200);
        }
        
        const { data, error } = await supabaseClient
            .from('collection_items')
            .insert(insertData)
            .select()
            .single();
        
        if (error) {
            if (error.code === '23505') { // Duplicate
                toast('📌 Déjà dans cette collection');
                return false;
            }
            throw error;
        }
        
        // Incrémenter le compteur
        await supabaseClient.rpc('increment_collection_items', { p_collection_id: collectionId });
        
        // Mettre à jour le cache local
        const collectionIdx = userCollections.findIndex(c => c.id === collectionId);
        if (collectionIdx !== -1) {
            userCollections[collectionIdx].items_count = (userCollections[collectionIdx].items_count || 0) + 1;
        }
        
        const collection = userCollections.find(c => c.id === collectionId);
        toast(`📌 Ajouté à "${collection?.name || 'collection'}"`);

        if (item.extrait_id) {
            const cached = extraitCollectionsCache.get(item.extrait_id);
            const newCount = Math.max(0, (cached?.count || 0) + 1);
            extraitCollectionsCache.set(item.extrait_id, { hasCollections: newCount > 0, count: newCount });
            updateExtraitCollectionsButtons([item.extrait_id], item.cardId || null);
            
            // Notifier l'auteur de l'extrait (si ce n'est pas nous)
            if (typeof createNotification === 'function') {
                try {
                    const { data: extrait } = await supabaseClient
                        .from('extraits')
                        .select('user_id')
                        .eq('id', item.extrait_id)
                        .single();
                    
                    if (extrait && extrait.user_id !== currentUser.id) {
                        await createNotification(extrait.user_id, 'collection_add', item.extrait_id, collection?.name || 'collection');
                        console.log('📣 Notification collection envoyée à l\'auteur');
                    }
                } catch (e) {
                    console.warn('Erreur notif collection:', e);
                }
            }
        }
        
        // Rafraîchir la vue de la collection si l'utilisateur la consulte actuellement
        if (currentViewingCollection && currentViewingCollection.id === collectionId) {
            await openCollection(collectionId);
        }
        
        return true;
    } catch (err) {
        console.error('Erreur ajout à collection:', err);
        toast('❌ Erreur lors de l\'ajout');
        return false;
    }
}

/**
 * Retirer un item d'une collection
 */
async function removeFromCollection(collectionId, itemId) {
    if (!currentUser || !supabaseClient) return false;
    
    try {
        let extraitIdToUpdate = null;
        const { data: existingItem } = await supabaseClient
            .from('collection_items')
            .select('extrait_id')
            .eq('id', itemId)
            .eq('user_id', currentUser.id)
            .maybeSingle();
        extraitIdToUpdate = existingItem?.extrait_id || null;

        const { error } = await supabaseClient
            .from('collection_items')
            .delete()
            .eq('id', itemId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        // Décrémenter le compteur
        await supabaseClient.rpc('decrement_collection_items', { p_collection_id: collectionId });
        
        // Mettre à jour le cache local
        const collectionIdx = userCollections.findIndex(c => c.id === collectionId);
        if (collectionIdx !== -1 && userCollections[collectionIdx].items_count > 0) {
            userCollections[collectionIdx].items_count--;
        }

        if (extraitIdToUpdate) {
            const cached = extraitCollectionsCache.get(extraitIdToUpdate);
            if (cached) {
                const newCount = Math.max(0, (cached.count || 0) - 1);
                extraitCollectionsCache.set(extraitIdToUpdate, { hasCollections: newCount > 0, count: newCount });
            } else {
                extraitCollectionsCache.delete(extraitIdToUpdate);
            }
            updateExtraitCollectionsButtons([extraitIdToUpdate]);
        }
        
        toast('Retiré de la collection');
        return true;
    } catch (err) {
        console.error('Erreur retrait de collection:', err);
        return false;
    }
}

/**
 * Vérifier dans quelles collections un item est présent
 */
async function getItemCollections(item) {
    if (!currentUser || !supabaseClient) return [];
    
    try {
        let query = supabaseClient
            .from('collection_items')
            .select('collection_id')
            .eq('user_id', currentUser.id);
        
        // Filtrer selon le type d'item
        if (item.extrait_id) {
            query = query.eq('extrait_id', item.extrait_id);
        } else if (item.source_like_id) {
            query = query.eq('source_like_id', item.source_like_id);
        } else if (item.url || item.source_url) {
            query = query.eq('local_url', item.url || item.source_url);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return data?.map(d => d.collection_id) || [];
    } catch (err) {
        console.error('Erreur vérification collections:', err);
        return [];
    }
}

/**
 * Récupérer le nombre de collections contenant un extrait
 */
async function getExtraitCollectionsInfo(extraitId) {
    if (!currentUser || !supabaseClient || !extraitId) return { hasCollections: false, count: 0 };

    if (extraitCollectionsCache.has(extraitId)) {
        return extraitCollectionsCache.get(extraitId);
    }

    try {
        const { count, error } = await supabaseClient
            .from('collection_items')
            .select('*', { count: 'exact', head: true })
            .eq('extrait_id', extraitId)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        const info = { hasCollections: (count || 0) > 0, count: count || 0 };
        extraitCollectionsCache.set(extraitId, info);
        return info;
    } catch (err) {
        console.error('Erreur vérification collections:', err);
        return { hasCollections: false, count: 0 };
    }
}

/**
 * Charger le statut des collections pour une liste d'extraits (batch)
 */
async function loadExtraitCollectionsInfoBatch(extraitIds) {
    if (!supabaseClient || !extraitIds || extraitIds.length === 0) return new Map();

    const uniqueIds = [...new Set(extraitIds.filter(Boolean))];
    const missingIds = uniqueIds.filter(id => !extraitCollectionsCache.has(id));
    const idsToFetch = missingIds.filter(id => !extraitCollectionsInFlight.has(id));
    if (missingIds.length === 0 || idsToFetch.length === 0) {
        updateExtraitCollectionsButtons(uniqueIds);
        return extraitCollectionsCache;
    }

    try {
        idsToFetch.forEach(id => extraitCollectionsInFlight.set(id, true));
        // Compter tous les ajouts en collection (tous utilisateurs) pour refléter la popularité
        const { data, error } = await supabaseClient
            .from('collection_items')
            .select('extrait_id')
            .in('extrait_id', idsToFetch);

        if (error) throw error;

        const counts = {};
        idsToFetch.forEach(id => { counts[id] = 0; });
        (data || []).forEach(row => {
            counts[row.extrait_id] = (counts[row.extrait_id] || 0) + 1;
        });

        idsToFetch.forEach(id => {
            const count = counts[id] || 0;
            extraitCollectionsCache.set(id, { hasCollections: count > 0, count });
        });

        updateExtraitCollectionsButtons(uniqueIds);
        return extraitCollectionsCache;
    } catch (err) {
        console.error('Erreur chargement collections batch:', err);
        return extraitCollectionsCache;
    } finally {
        idsToFetch.forEach(id => extraitCollectionsInFlight.delete(id));
    }
}

/**
 * Mettre à jour l'affichage du compteur de collections
 */
function updateExtraitCollectionsButtons(extraitIds, cardId = null) {
    if (!extraitIds || extraitIds.length === 0) return;

    extraitIds.forEach(id => {
        const info = extraitCollectionsCache.get(id);
        // Chercher par extraitId d'abord, puis par cardId si fourni, puis par data-extrait-id
        let countEl = document.getElementById(`collectionsCount-${id}`);
        if (!countEl && cardId) {
            countEl = document.getElementById(`collectionsCount-${cardId}`);
        }
        if (!countEl) {
            countEl = document.querySelector(`[id^="collectionsCount-"][data-extrait-id="${id}"]`);
        }

        if (!countEl) return;

        const count = info?.count || 0;
        countEl.textContent = count;
        countEl.classList.toggle('is-zero', count === 0);
    });
}

/**
 * Ouvrir le modal de sélection de collection pour un extrait
 */
async function openCollectionPickerForExtrait(extraitId) {
    if (!currentUser) {
        if (typeof openAuthModal === 'function') openAuthModal('login');
        toast('📝 Connectez-vous pour organiser vos collections');
        return;
    }

    if (typeof getExtraitData !== 'function') {
        toast('❌ Extrait introuvable');
        return;
    }

    const extrait = await getExtraitData(extraitId);
    if (!extrait) {
        toast('❌ Extrait introuvable');
        return;
    }

    const item = {
        extrait_id: extraitId,
        title: extrait.source_title,
        author: extrait.source_author,
        text: extrait.texte,
        url: extrait.source_url
    };

    openCollectionPicker(item);
}

/**
 * Ouvrir une collection depuis le modal des collections d'extrait
 */
async function openCollectionFromExtraitModal(collectionId) {
    const modal = document.querySelector('.extrait-collections-modal');
    if (modal) modal.remove();

    if (typeof openCollectionsView === 'function') {
        await openCollectionsView(true);
    }
    if (typeof openCollection === 'function') {
        openCollection(collectionId);
    }
}

/**
 * Afficher les collections contenant cet extrait
 */
async function showExtraitCollections(extraitId) {
    if (!currentUser) return;

    const collectionIds = await getItemCollections({ extrait_id: extraitId });
    if (!collectionIds || collectionIds.length === 0) {
        toast('📌 Cet extrait n\'est dans aucune collection');
        return;
    }

    await loadUserCollections(true);

    const collections = userCollections.filter(c => collectionIds.includes(c.id));
    if (collections.length === 0) {
        toast('📌 Cet extrait n\'est dans aucune collection');
        return;
    }

    const existing = document.querySelector('.extrait-collections-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'extrait-collections-modal';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="extrait-collections-content" onclick="event.stopPropagation()">
            <div class="extrait-collections-header">
                <h3>Collections (${collections.length})</h3>
                <button onclick="this.closest('.extrait-collections-modal').remove()">×</button>
            </div>
            <div class="extrait-collections-list">
                ${collections.map(c => `
                    <div class="collection-item" onclick="event.stopPropagation(); openCollectionFromExtraitModal('${c.id}'); document.querySelector('.extrait-collections-modal')?.remove();" style="cursor: pointer;">
                        <span class="collection-emoji">${c.emoji || '❧'}</span>
                        <span class="collection-name">${escapeHtml(c.name)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('open'), 10);
}

// ═══════════════════════════════════════════════════════════
// 🎨 MODAL DE SÉLECTION DE COLLECTION
// ═══════════════════════════════════════════════════════════

let pendingCollectionItem = null;

/**
 * Ouvrir le modal pour ajouter un texte à une collection
 */
async function openCollectionPicker(item) {
    if (!currentUser) {
        toast('📝 Connectez-vous pour utiliser les collections');
        return;
    }
    
    pendingCollectionItem = item;
    
    // Charger les collections si nécessaire
    await loadUserCollections(true);
    
    // Vérifier dans quelles collections l'item est déjà
    const existingCollections = await getItemCollections(item);
    
    // Créer ou récupérer le modal
    let modal = document.getElementById('collectionPickerModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'collectionPickerModal';
        modal.className = 'collection-picker-modal';
        modal.onclick = (e) => { if (e.target === modal) closeCollectionPicker(); };
        document.body.appendChild(modal);
    }
    
    // Contenu du modal
    modal.innerHTML = `
        <div class="collection-picker-content">
            <div class="collection-picker-header">
                <h3>+ Ajouter à une collection</h3>
                <button class="collection-picker-close" onclick="closeCollectionPicker()">✕</button>
            </div>
            
            <div class="collection-picker-item-preview">
                <div class="picker-preview-title">${escapeHtml(item.title || item.source_title || 'Sans titre')}</div>
                <div class="picker-preview-author">${escapeHtml(item.author || item.source_author || 'Auteur inconnu')}</div>
            </div>
            
            <div class="collection-picker-list" id="collectionPickerList">
                ${userCollections.length === 0 
                    ? '<div class="collection-picker-empty">Aucune collection. Créez-en une !</div>'
                    : userCollections.map(c => `
                        <button class="collection-picker-item ${existingCollections.includes(c.id) ? 'in-collection' : ''}" 
                                onclick="toggleItemInCollection('${c.id}')"
                                data-collection-id="${c.id}">
                            <span class="collection-picker-emoji">${c.emoji || '❧'}</span>
                            <div class="collection-picker-info">
                                <span class="collection-picker-name">${escapeHtml(c.name)}</span>
                                <span class="collection-picker-count">${c.items_count || 0} texte${(c.items_count || 0) > 1 ? 's' : ''}</span>
                            </div>
                            <span class="collection-picker-check">${existingCollections.includes(c.id) ? '✓' : '+'}</span>
                        </button>
                    `).join('')
                }
            </div>
            
            <div class="collection-picker-create">
                <button class="collection-picker-create-btn" onclick="showNewCollectionForm()">
                    <span>+</span> Nouvelle collection
                </button>
            </div>
            
            <div class="collection-picker-new-form" id="newCollectionForm" style="display:none;">
                <input type="text" id="newCollectionName" class="collection-input" placeholder="Nom de la collection">
                <div class="collection-emoji-picker">
                    ${COLLECTION_EMOJIS.slice(0, 16).map(e => `
                        <button class="emoji-btn ${e === '❧' ? 'selected' : ''}" onclick="selectCollectionEmoji('${e}')">${e}</button>
                    `).join('')}
                </div>
                <div class="collection-form-actions">
                    <button class="btn-cancel" onclick="hideNewCollectionForm()">Annuler</button>
                    <button class="btn-create" onclick="createNewCollectionFromPicker()">Créer</button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('open');
}

/**
 * Fermer le modal de sélection de collection
 */
function closeCollectionPicker() {
    const modal = document.getElementById('collectionPickerModal');
    if (modal) {
        modal.classList.remove('open');
    }
    pendingCollectionItem = null;
}

/**
 * Ajouter ou retirer l'item de la collection
 */
async function toggleItemInCollection(collectionId) {
    if (!pendingCollectionItem) return;
    
    const btn = document.querySelector(`.collection-picker-item[data-collection-id="${collectionId}"]`);
    const isInCollection = btn?.classList.contains('in-collection');
    
    if (isInCollection) {
        // TODO: Retirer de la collection (nécessite l'ID de l'item)
        toast('💡 Pour retirer, ouvrez la collection');
    } else {
        const success = await addToCollection(collectionId, pendingCollectionItem);
        if (success && btn) {
            btn.classList.add('in-collection');
            btn.querySelector('.collection-picker-check').textContent = '✓';
            // Mettre à jour le compteur
            const countEl = btn.querySelector('.collection-picker-count');
            if (countEl) {
                const currentCount = parseInt(countEl.textContent) || 0;
                countEl.textContent = `${currentCount + 1} texte${currentCount + 1 > 1 ? 's' : ''}`;
            }
        }
    }
}

/**
 * Afficher le formulaire de nouvelle collection
 */
function showNewCollectionForm() {
    const form = document.getElementById('newCollectionForm');
    if (form) {
        form.style.display = 'block';
        document.getElementById('newCollectionName')?.focus();
    }
}

/**
 * Masquer le formulaire de nouvelle collection
 */
function hideNewCollectionForm() {
    const form = document.getElementById('newCollectionForm');
    if (form) {
        form.style.display = 'none';
        const input = document.getElementById('newCollectionName');
        if (input) input.value = '';
    }
}

let selectedNewCollectionEmoji = '❧';

/**
 * Sélectionner un emoji pour la nouvelle collection
 */
function selectCollectionEmoji(emoji) {
    selectedNewCollectionEmoji = emoji;
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent === emoji);
    });
}

/**
 * Créer une nouvelle collection depuis le picker
 */
async function createNewCollectionFromPicker() {
    const nameInput = document.getElementById('newCollectionName');
    const name = nameInput?.value?.trim();
    
    if (!name) {
        toast('❌ Entrez un nom pour la collection');
        return;
    }
    
    const collection = await createCollection(name, selectedNewCollectionEmoji);
    
    if (collection && pendingCollectionItem) {
        // Ajouter l'item à la nouvelle collection
        await addToCollection(collection.id, pendingCollectionItem);
        
        // Rafraîchir le picker
        const existingCollections = await getItemCollections(pendingCollectionItem);
        const listContainer = document.getElementById('collectionPickerList');
        if (listContainer) {
            // Ajouter la nouvelle collection à la liste
            const newItem = document.createElement('button');
            newItem.className = 'collection-picker-item in-collection';
            newItem.dataset.collectionId = collection.id;
            newItem.onclick = () => toggleItemInCollection(collection.id);
            newItem.innerHTML = `
                <span class="collection-picker-emoji">${collection.emoji || '❧'}</span>
                <div class="collection-picker-info">
                    <span class="collection-picker-name">${escapeHtml(collection.name)}</span>
                    <span class="collection-picker-count">1 texte</span>
                </div>
                <span class="collection-picker-check">✓</span>
            `;
            
            // Retirer le message "vide" s'il existe
            const emptyMsg = listContainer.querySelector('.collection-picker-empty');
            if (emptyMsg) emptyMsg.remove();
            
            listContainer.insertBefore(newItem, listContainer.firstChild);
        }
    }
    
    hideNewCollectionForm();
}

// ═══════════════════════════════════════════════════════════
// 📋 AFFICHAGE DES COLLECTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Ouvrir la vue des collections
 */
async function openCollectionsView(forceReload = false) {
    if (!currentUser) {
        toast(t('connect_to_see_collections'));
        return;
    }
    
    // Charger les collections si nécessaire
    if (!collectionsLoaded || forceReload) {
        await loadUserCollections(forceReload);
    }
    
    // Utiliser l'overlay des favoris existant
    const overlay = document.getElementById('favoritesOverlay');
    const grid = document.getElementById('favoritesGrid');
    const title = overlay?.querySelector('.favorites-title');
    
    if (!overlay || !grid) return;
    
    if (title) title.innerHTML = t('my_collections');
    
    grid.innerHTML = `
        <div class="collections-view">
            <div class="collections-header">
                <button class="btn-new-collection" onclick="showCreateCollectionModal()">
                    <span>+</span> ${t('new_collection')}
                </button>
            </div>
            
            <div class="collections-list" id="collectionsListView">
                ${userCollections.length === 0 
                    ? `<div class="collections-empty">
                        <div class="collections-empty-icon">❧</div>
                        <div class="collections-empty-title">${t('no_collection_yet')}</div>
                        <div class="collections-empty-text">${t('create_collections_to_organize')}</div>
                        <button class="btn-create-first" onclick="showCreateCollectionModal()">${t('create_first_collection')}</button>
                       </div>`
                    : userCollections.map(c => {
                        const isPublic = !!c.is_public;
                        const count = c.items_count || 0;
                        const badge = `
                            <div class="collection-card-badges">
                                <span class="collection-card-badge ${isPublic ? 'public' : 'private'}">${isPublic ? t('public') : t('private')}</span>
                            </div>
                        `;
                        return `
                        <div class="collection-card" onclick="openCollection('${c.id}')">
                            <div class="collection-card-emoji" style="background: ${c.color}15; color: ${c.color}">${c.emoji || '❧'}</div>
                            <div class="collection-card-info">
                                <div class="collection-card-name">${escapeHtml(c.name)}</div>
                                <div class="collection-card-count">${count} ${count > 1 ? t('texts_count_plural') : t('texts_count')}</div>
                                ${badge}
                                ${c.description ? `<div class="collection-card-desc">${escapeHtml(c.description)}</div>` : ''}
                            </div>
                            <div class="collection-card-actions">
                                <button class="collection-card-action" onclick="event.stopPropagation(); editCollection('${c.id}')" title="${t('edit')}">✎</button>
                                <button class="collection-card-action" onclick="event.stopPropagation(); deleteCollection('${c.id}')" title="${t('delete')}">×</button>
                            </div>
                        </div>
                        `;
                    }).join('')
                }
            </div>
        </div>
    `;
    
    overlay.classList.add('open');
}

/**
 * Ouvrir une collection spécifique
 */
async function openCollection(collectionId) {
    const collection = userCollections.find(c => c.id === collectionId);
    if (!collection) return;
    
    currentViewingCollection = collection;
    
    // Charger les items
    const items = await loadCollectionItems(collectionId);
    
    const overlay = document.getElementById('favoritesOverlay');
    const grid = document.getElementById('favoritesGrid');
    const title = overlay?.querySelector('.favorites-title');
    
    if (!grid) return;
    
    if (title) title.innerHTML = `${collection.emoji || '❧'} ${escapeHtml(collection.name)}`;
    
    grid.innerHTML = `
        <div class="collection-view">
            <div class="collection-view-header">
                <button class="btn-back-collections" onclick="openCollectionsView()">${t('back_to_collections')}</button>
                ${collection.description ? `<p class="collection-description">${escapeHtml(collection.description)}</p>` : ''}
            </div>
            
            <div class="collection-items" id="collectionItemsView">
                ${items.length === 0 
                    ? `<div class="collection-empty">
                        <div class="collection-empty-icon">○</div>
                        <div class="collection-empty-title">${t('empty_collection')}</div>
                        <div class="collection-empty-text">${t('add_texts_to_collection')}</div>
                       </div>`
                    : items.map(item => {
                        // Déterminer les données de l'item
                        let title, author, preview, url, fullText;
                        if (item.extraits) {
                            title = item.extraits.source_title;
                            author = item.extraits.source_author;
                            preview = item.extraits.texte;
                            fullText = item.extraits.texte;
                            url = item.extraits.source_url;
                        } else if (item.source_likes) {
                            title = item.source_likes.title;
                            author = item.source_likes.author;
                            preview = item.source_likes.preview;
                            fullText = item.source_likes.preview;
                            url = item.source_likes.source_url;
                        } else {
                            title = item.local_title;
                            author = item.local_author;
                            preview = item.local_preview;
                            fullText = item.local_preview;
                            url = item.local_url;
                        }
                        
                        const itemId = item.id;
                        const extraitId = item.extraits?.id || null;
                        const previewText = preview ? preview.substring(0, 300) : '';
                        const previewTruncated = preview && preview.length > 300;
                        const hasRemoteSource = !!(url && url.trim() !== '');
                        const normPreview = normalizeCollectionText(previewText);
                        const normFull = normalizeCollectionText(fullText || '');
                        const hasFullMore = normFull.length > normPreview.length + 20;
                        const shouldShowExpand = previewTruncated || hasFullMore || hasRemoteSource;
                        const isLiked = extraitId && typeof isExtraitLiked === 'function' ? isExtraitLiked(extraitId) : false;
                        const likeCount = extraitId && typeof getLikeCount === 'function' ? getLikeCount(extraitId) : 0;
                        
                        // Encoder l'URL pour éviter les problèmes de quotes
                        const safeUrl = url ? encodeURIComponent(url) : '';
                        const safeTitle = title ? encodeURIComponent(title) : '';
                        const safeAuthor = author ? encodeURIComponent(author) : '';
                        
                        return `
                               <div class="collection-item-card" id="coll-item-${itemId}" data-expanded="false"
                                   data-preview-truncated="${previewTruncated ? 'true' : 'false'}" data-can-expand="${shouldShowExpand ? 'true' : 'false'}" data-url="${safeUrl}" data-title="${safeTitle}" data-author="${safeAuthor}">
                                  <div class="collection-item-content" onclick="toggleCollectionItemText('${itemId}', this, event)">
                                    <div class="collection-item-header">
                                        <div class="collection-item-title">${escapeHtml(title || 'Sans titre')}</div>
                                        <div class="collection-item-author">${escapeHtml(author || 'Auteur inconnu')}</div>
                                    </div>
                                    <div class="collection-item-text-container">
                                        <div class="collection-item-preview" id="preview-${itemId}">${escapeHtml(previewText)}${previewTruncated ? '...' : ''}</div>
                                        <div class="collection-item-full" id="full-${itemId}">${escapeHtml(fullText || '')}</div>
                                    </div>
                                    <button class="collection-item-expand${shouldShowExpand ? '' : ' is-hidden'}" id="expand-btn-${itemId}" type="button" aria-expanded="false" aria-label="Afficher le texte complet" onmousedown="event.preventDefault()" onclick="event.preventDefault(); event.stopPropagation(); toggleCollectionItemText('${itemId}', this, event)"><span class="expand-icon">▾</span></button>
                                    ${item.note ? `<div class="collection-item-note"><span class="note-icon">¶</span> ${escapeHtml(item.note)}</div>` : ''}
                                </div>
                                ${extraitId ? `
                                    <div class="extrait-actions" onclick="event.stopPropagation()">
                                        <button class="extrait-action like-btn ${isLiked ? 'liked' : ''}" id="likeBtn-${extraitId}" onclick="event.stopPropagation(); toggleLikeExtrait('${extraitId}')" data-extrait-id="${extraitId}">
                                            <span class="like-icon">${isLiked ? '♥' : '♡'}</span>
                                            <span class="like-count ${likeCount === 0 ? 'is-zero' : ''}" id="likeCount-${extraitId}" onclick="event.stopPropagation(); showLikers('${extraitId}')">${likeCount}</span>
                                        </button>
                                        <button class="extrait-action share-btn" onclick="event.stopPropagation(); shareExtraitFromCard('${extraitId}')">
                                            <span class="icon">⤴</span>
                                            <span class="share-count is-zero" id="shareCount-${extraitId}" onclick="event.stopPropagation(); event.preventDefault(); showSharers('${extraitId}')">0</span>
                                        </button>
                                        <button class="extrait-action collection-btn" onclick="event.stopPropagation(); openCollectionPickerForExtrait('${extraitId}')">
                                            <span class="icon">▦</span>
                                            <span class="collections-count is-zero" id="collectionsCount-${extraitId}" onclick="event.stopPropagation(); event.preventDefault(); showExtraitCollections('${extraitId}')">0</span>
                                        </button>
                                    </div>
                                ` : ''}
                                <div class="collection-item-actions" onclick="event.stopPropagation()">
                                    ${url ? `<button class="item-action action-load" onclick="loadTextFromCollectionById('${itemId}')" title="${t('load_full_text')}" aria-label="${t('load_full_text')}">
                                        <span class="icon">↻</span>
                                        <span class="label">${t('full_text')}</span>
                                    </button>` : ''}
                                    ${url ? `<button class="item-action action-open" onclick="window.open(decodeURIComponent('${safeUrl}'), '_blank')" title="${t('open_source')}">🔗</button>` : ''}
                                    <button class="item-action action-delete" onclick="removeFromCollection('${collectionId}', '${item.id}')" title="${t('remove')}">×</button>
                                </div>
                            </div>
                        `;
                    }).join('')
                }
            </div>
        </div>
    `;

    scheduleCollectionExpandCheck(grid);

    const extraitIdsInCollection = items.filter(i => i.extraits?.id).map(i => i.extraits.id);
    if (extraitIdsInCollection.length > 0) {
        if (typeof hydrateExtraitLikesUI === 'function') {
            hydrateExtraitLikesUI(extraitIdsInCollection);
        }
        if (typeof loadExtraitCollectionsInfoBatch === 'function') {
            loadExtraitCollectionsInfoBatch(extraitIdsInCollection);
        }
        if (typeof loadExtraitShareInfoBatch === 'function') {
            loadExtraitShareInfoBatch(extraitIdsInCollection);
        }
    }
}

/**
 * Ouvrir une collection par ID (utile pour ouvrir une collection publique depuis la recherche)
 */
async function openCollectionById(collectionId) {
    if (!supabaseClient) return;

    try {
        const { data: collection, error } = await supabaseClient
            .from('collections')
            .select('*')
            .eq('id', collectionId)
            .single();

        if (error) throw error;
        if (!collection) {
            toast('Collection introuvable');
            return;
        }

        currentViewingCollection = collection;

        // Charger les items
        const items = await loadCollectionItems(collectionId);

        const overlay = document.getElementById('favoritesOverlay');
        const grid = document.getElementById('favoritesGrid');
        const title = overlay?.querySelector('.favorites-title');

        if (!overlay || !grid) return;

        if (title) title.innerHTML = `${collection.emoji || '❧'} ${escapeHtml(collection.name)}`;

        grid.innerHTML = `
            <div class="collection-view">
                <div class="collection-view-header">
                    <button class="btn-back-collections" onclick="${currentUser ? 'openCollectionsView()' : 'closeFavoritesView()'}">← ${currentUser ? 'Collections' : 'Fermer'}</button>
                    ${collection.description ? `<p class="collection-description">${escapeHtml(collection.description)}</p>` : ''}
                </div>
                
                <div class="collection-items" id="collectionItemsView">
                    ${items.length === 0 
                        ? `<div class="collection-empty">
                            <div class="collection-empty-icon">○</div>
                            <div class="collection-empty-title">Collection vide</div>
                            <div class="collection-empty-text">Cette collection ne contient pas encore de textes</div>
                           </div>`
                        : items.map(item => {
                            // Déterminer les données de l'item
                            let itemTitle, itemAuthor, preview, url, fullText;
                            if (item.extraits) {
                                itemTitle = item.extraits.source_title;
                                itemAuthor = item.extraits.source_author;
                                preview = item.extraits.texte;
                                fullText = item.extraits.texte;
                                url = item.extraits.source_url;
                            } else if (item.source_likes) {
                                itemTitle = item.source_likes.title;
                                itemAuthor = item.source_likes.author;
                                preview = item.source_likes.preview;
                                fullText = item.source_likes.preview;
                                url = item.source_likes.source_url;
                            } else {
                                itemTitle = item.local_title;
                                itemAuthor = item.local_author;
                                preview = item.local_preview;
                                fullText = item.local_preview;
                                url = item.local_url;
                            }

                            const itemId = item.id;
                            const extraitId = item.extraits?.id || null;
                            const previewText = preview ? preview.substring(0, 300) : '';
                            const previewTruncated = preview && preview.length > 300;
                            const hasRemoteSource = !!(url && url.trim() !== '');
                            const normPreview = normalizeCollectionText(previewText);
                            const normFull = normalizeCollectionText(fullText || '');
                            const hasFullMore = normFull.length > normPreview.length + 20;
                            const shouldShowExpand = previewTruncated || hasFullMore || hasRemoteSource;
                            const isLiked = extraitId && typeof isExtraitLiked === 'function' ? isExtraitLiked(extraitId) : false;
                            const likeCount = extraitId && typeof getLikeCount === 'function' ? getLikeCount(extraitId) : 0;

                            // Encoder l'URL pour éviter les problèmes de quotes
                            const safeUrl = url ? encodeURIComponent(url) : '';
                            const safeTitle = itemTitle ? encodeURIComponent(itemTitle) : '';
                            const safeAuthor = itemAuthor ? encodeURIComponent(itemAuthor) : '';

                            return `
                                  <div class="collection-item-card" id="coll-item-${itemId}" data-expanded="false"
                                      data-preview-truncated="${previewTruncated ? 'true' : 'false'}" data-can-expand="${shouldShowExpand ? 'true' : 'false'}" data-url="${safeUrl}" data-title="${safeTitle}" data-author="${safeAuthor}">
                                    <div class="collection-item-content" onclick="toggleCollectionItemText('${itemId}', this, event)">
                                        <div class="collection-item-header">
                                            <div class="collection-item-title">${escapeHtml(itemTitle || 'Sans titre')}</div>
                                            <div class="collection-item-author">${escapeHtml(itemAuthor || 'Auteur inconnu')}</div>
                                        </div>
                                        <div class="collection-item-text-container">
                                            <div class="collection-item-preview" id="preview-${itemId}">${escapeHtml(previewText)}${previewTruncated ? '...' : ''}</div>
                                            <div class="collection-item-full" id="full-${itemId}">${escapeHtml(fullText || '')}</div>
                                        </div>
                                        <button class="collection-item-expand${shouldShowExpand ? '' : ' is-hidden'}" id="expand-btn-${itemId}" type="button" aria-expanded="false" aria-label="Afficher le texte complet" onmousedown="event.preventDefault()" onclick="event.preventDefault(); event.stopPropagation(); toggleCollectionItemText('${itemId}', this, event)"><span class="expand-icon">▾</span></button>
                                    </div>
                                    ${extraitId ? `
                                        <div class="extrait-actions" onclick="event.stopPropagation()">
                                            <button class="extrait-action like-btn ${isLiked ? 'liked' : ''}" id="likeBtn-${extraitId}" onclick="event.stopPropagation(); toggleLikeExtrait('${extraitId}')" data-extrait-id="${extraitId}">
                                                <span class="like-icon">${isLiked ? '♥' : '♡'}</span>
                                                <span class="like-count ${likeCount === 0 ? 'is-zero' : ''}" id="likeCount-${extraitId}" onclick="event.stopPropagation(); showLikers('${extraitId}')">${likeCount}</span>
                                            </button>
                                            <button class="extrait-action share-btn" onclick="event.stopPropagation(); shareExtraitFromCard('${extraitId}')">
                                                <span class="icon">⤴</span>
                                                <span class="share-count is-zero" id="shareCount-${extraitId}" onclick="event.stopPropagation(); event.preventDefault(); showSharers('${extraitId}')">0</span>
                                            </button>
                                            <button class="extrait-action collection-btn" onclick="event.stopPropagation(); openCollectionPickerForExtrait('${extraitId}')">
                                                <span class="icon">▦</span>
                                                <span class="collections-count is-zero" id="collectionsCount-${extraitId}" onclick="event.stopPropagation(); event.preventDefault(); showExtraitCollections('${extraitId}')">0</span>
                                            </button>
                                        </div>
                                    ` : ''}
                                    <div class="collection-item-actions" onclick="event.stopPropagation()">
                                        ${url ? `<button class="item-action action-load" onclick="loadTextFromCollectionById('${itemId}')" title="${t('load_full_text')}" aria-label="${t('load_full_text')}">
                                            <span class="icon">↻</span>
                                            <span class="label">${t('full_text')}</span>
                                        </button>` : ''}
                                        ${url ? `<button class="item-action action-open" onclick="window.open(decodeURIComponent('${safeUrl}'), '_blank')" title="${t('open_source')}">🔗</button>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')
                    }
                </div>
            </div>
        `;

        overlay.classList.add('open');
        scheduleCollectionExpandCheck(grid);

        const extraitIdsInCollection = items.filter(i => i.extraits?.id).map(i => i.extraits.id);
        if (typeof hydrateExtraitLikesUI === 'function') {
            hydrateExtraitLikesUI(extraitIdsInCollection);
        }
        if (typeof loadExtraitCollectionsInfoBatch === 'function') {
            loadExtraitCollectionsInfoBatch(extraitIdsInCollection);
        }
        if (typeof loadExtraitShareInfoBatch === 'function') {
            loadExtraitShareInfoBatch(extraitIdsInCollection);
        }
    } catch (err) {
        console.error('Erreur ouverture collection par ID:', err);
        toast('Erreur lors de l’ouverture');
    }
}

/**
 * Afficher le modal de création de collection
 */
function showCreateCollectionModal() {
    let modal = document.getElementById('createCollectionModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'createCollectionModal';
        modal.className = 'collection-modal';
        modal.onclick = (e) => { if (e.target === modal) closeCreateCollectionModal(); };
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="collection-modal-content">
            <div class="collection-modal-header">
                <h3>+ Nouvelle collection</h3>
                <button class="collection-modal-close" onclick="closeCreateCollectionModal()">✕</button>
            </div>
            
            <div class="collection-form">
                <div class="form-group">
                    <label>Nom</label>
                    <input type="text" id="createCollectionName" class="collection-input" placeholder="Ex: Poésie romantique">
                </div>
                
                <div class="form-group">
                    <label>Description (optionnel)</label>
                    <textarea id="createCollectionDesc" class="collection-textarea" placeholder="Une courte description..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>Emoji</label>
                    <div class="emoji-grid">
                        ${COLLECTION_EMOJIS.map(e => `
                            <button class="emoji-btn-large ${e === '❧' ? 'selected' : ''}" onclick="selectCreateEmoji('${e}')">${e}</button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Couleur</label>
                    <div class="color-grid">
                        ${COLLECTION_COLORS.map(c => `
                            <button class="color-btn ${c === '#5a7a8a' ? 'selected' : ''}" 
                                    style="background: ${c}" 
                                    onclick="selectCreateColor('${c}')"
                                    data-color="${c}"></button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="createCollectionPublic">
                        <span>Collection publique (visible par tous)</span>
                    </label>
                </div>
            </div>
            
            <div class="collection-modal-actions">
                <button class="btn-cancel" onclick="closeCreateCollectionModal()">Annuler</button>
                <button class="btn-primary" onclick="submitCreateCollection()">Créer</button>
            </div>
        </div>
    `;
    
    modal.classList.add('open');
    document.getElementById('createCollectionName')?.focus();
}

let createCollectionEmoji = '❧';
let createCollectionColor = '#5a7a8a';

function selectCreateEmoji(emoji) {
    createCollectionEmoji = emoji;
    document.querySelectorAll('#createCollectionModal .emoji-btn-large').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent === emoji);
    });
}

function selectCreateColor(color) {
    createCollectionColor = color;
    document.querySelectorAll('#createCollectionModal .color-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.color === color);
    });
}

async function submitCreateCollection() {
    const name = document.getElementById('createCollectionName')?.value?.trim();
    const description = document.getElementById('createCollectionDesc')?.value?.trim();
    const isPublic = document.getElementById('createCollectionPublic')?.checked || false;
    
    if (!name) {
        toast('❌ Entrez un nom pour la collection');
        return;
    }
    
    const collection = await createCollection(name, createCollectionEmoji, createCollectionColor, description, isPublic);
    
    if (collection) {
        closeCreateCollectionModal();
        openCollectionsView(); // Rafraîchir la vue
    }
}

function closeCreateCollectionModal() {
    const modal = document.getElementById('createCollectionModal');
    if (modal) {
        modal.classList.remove('open');
    }
    createCollectionEmoji = '❧';
    createCollectionColor = '#5a7a8a';
}

/**
 * Modifier une collection existante
 */
async function editCollection(collectionId) {
    const collection = userCollections.find(c => c.id === collectionId);
    if (!collection) return;
    
    let modal = document.getElementById('editCollectionModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'editCollectionModal';
        modal.className = 'collection-modal';
        modal.onclick = (e) => { if (e.target === modal) closeEditCollectionModal(); };
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="collection-modal-content">
            <div class="collection-modal-header">
                <h3>Modifier la collection</h3>
                <button class="collection-modal-close" onclick="closeEditCollectionModal()">✕</button>
            </div>
            
            <div class="collection-form">
                <div class="form-group">
                    <label>Nom</label>
                    <input type="text" id="editCollectionName" class="collection-input" value="${escapeHtml(collection.name)}">
                </div>
                
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="editCollectionDesc" class="collection-textarea">${escapeHtml(collection.description || '')}</textarea>
                </div>
                
                <div class="form-group">
                    <label>Emoji</label>
                    <div class="emoji-grid">
                        ${COLLECTION_EMOJIS.map(e => `
                            <button class="emoji-btn-large ${e === collection.emoji ? 'selected' : ''}" 
                                    onclick="selectEditEmoji('${e}')">${e}</button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Couleur</label>
                    <div class="color-grid">
                        ${COLLECTION_COLORS.map(c => `
                            <button class="color-btn ${c === collection.color ? 'selected' : ''}" 
                                    style="background: ${c}" 
                                    onclick="selectEditColor('${c}')"
                                    data-color="${c}"></button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="editCollectionPublic" ${collection.is_public ? 'checked' : ''}>
                        <span>Collection publique</span>
                    </label>
                </div>
            </div>
            
            <div class="collection-modal-actions">
                <button class="btn-cancel" onclick="closeEditCollectionModal()">Annuler</button>
                <button class="btn-primary" onclick="submitEditCollection('${collectionId}')">Enregistrer</button>
            </div>
        </div>
    `;
    
    editCollectionEmoji = collection.emoji || '📚';
    editCollectionColor = collection.color || '#5a7a8a';
    
    modal.classList.add('open');
}

let editCollectionEmoji = '📚';
let editCollectionColor = '#5a7a8a';

function selectEditEmoji(emoji) {
    editCollectionEmoji = emoji;
    document.querySelectorAll('#editCollectionModal .emoji-btn-large').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent === emoji);
    });
}

function selectEditColor(color) {
    editCollectionColor = color;
    document.querySelectorAll('#editCollectionModal .color-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.color === color);
    });
}

async function submitEditCollection(collectionId) {
    const name = document.getElementById('editCollectionName')?.value?.trim();
    const description = document.getElementById('editCollectionDesc')?.value?.trim();
    const isPublic = document.getElementById('editCollectionPublic')?.checked || false;
    
    if (!name) {
        toast('❌ Le nom est requis');
        return;
    }
    
    const updated = await updateCollection(collectionId, {
        name,
        description: description || null,
        emoji: editCollectionEmoji,
        color: editCollectionColor,
        is_public: isPublic
    });
    
    if (updated) {
        closeEditCollectionModal();
        openCollectionsView(); // Rafraîchir
    }
}

function closeEditCollectionModal() {
    const modal = document.getElementById('editCollectionModal');
    if (modal) {
        modal.classList.remove('open');
    }
}

// Helper pour échapper le HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function normalizeCollectionText(text) {
    return (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function updateCollectionExpandAvailability(card) {
    if (!card) return;
    const preview = card.querySelector('.collection-item-preview');
    const full = card.querySelector('.collection-item-full');
    const expandBtn = card.querySelector('.collection-item-expand');

    if (!preview || !expandBtn) return;

    const previewText = (preview.textContent || '').replace(/(\u2026|\.{3})\s*$/, '').trim();
    if (!card.dataset.previewText) {
        card.dataset.previewText = previewText;
    }

    const fullText = card.dataset.fullText || (full ? full.textContent : '') || '';
    const hasRemoteSource = !!(card.dataset.url && card.dataset.url.trim() !== '');
    const hasPreviewTruncation = card.dataset.previewTruncated === 'true';
    const hasOverflow = preview.scrollHeight > preview.clientHeight + 1;

    let hasFullMore = false;
    if (fullText) {
        const normPreview = normalizeCollectionText(previewText);
        const normFull = normalizeCollectionText(fullText);
        hasFullMore = normFull.length > normPreview.length + 20;
    }

    const canLoadFullText = hasRemoteSource && !card.dataset.fullText;
    const shouldShow = hasPreviewTruncation || hasOverflow || hasFullMore || canLoadFullText;
    expandBtn.classList.toggle('is-hidden', !shouldShow);
    card.dataset.canExpand = shouldShow ? 'true' : 'false';

    if (!shouldShow) {
        card.dataset.expanded = 'false';
        card.classList.remove('expanded');
        updateCollectionExpandButton(expandBtn, false);
    }
}

function refreshCollectionExpandButtons(container = document) {
    const cards = container.querySelectorAll ? container.querySelectorAll('.collection-item-card') : [];
    cards.forEach(updateCollectionExpandAvailability);
}

function scheduleCollectionExpandCheck(container) {
    if (!container) return;
    requestAnimationFrame(() => {
        refreshCollectionExpandButtons(container);
        setTimeout(() => refreshCollectionExpandButtons(container), 150);
    });
}

function updateCollectionExpandButton(expandBtn, isExpanded) {
    if (!expandBtn) return;
    const label = isExpanded ? t('collapse_text') : t('show_full_text');
    const icon = isExpanded ? '▴' : '▾';
    expandBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    expandBtn.setAttribute('aria-label', label);
    expandBtn.innerHTML = `<span class="expand-icon">${icon}</span>`;
}

function stabilizeCollectionsScroll(scrollEl, scrollTop) {
    if (!scrollEl) return;
    requestAnimationFrame(() => {
        if (scrollEl.scrollTop !== scrollTop) scrollEl.scrollTop = scrollTop;
        requestAnimationFrame(() => {
            if (scrollEl.scrollTop !== scrollTop) scrollEl.scrollTop = scrollTop;
        });
    });
}

/**
 * Toggle l'affichage du texte complet d'un item de collection
 */
function toggleCollectionItemText(itemId, triggerEl = null, evt = null) {
    const card = document.getElementById(`coll-item-${itemId}`);
    const preview = document.getElementById(`preview-${itemId}`);
    const full = document.getElementById(`full-${itemId}`);
    const expandBtn = document.getElementById(`expand-btn-${itemId}`);
    
    if (!card || !preview || !full) return;

    if (evt && typeof evt.preventDefault === 'function') {
        evt.preventDefault();
        evt.stopPropagation();
    }

    const blurTarget = triggerEl || expandBtn;
    if (blurTarget && typeof blurTarget.blur === 'function') blurTarget.blur();

    const scrollEl = card.closest('.favorites-overlay') || document.scrollingElement;
    const scrollTop = scrollEl ? scrollEl.scrollTop : window.scrollY;

    if (card.classList.contains('loading')) {
        return;
    }
    
    const isExpanded = card.dataset.expanded === 'true';

    if (!isExpanded && card.dataset.canExpand !== 'true') {
        return;
    }
    
    if (isExpanded) {
        // Réduire
        card.dataset.expanded = 'false';
        card.classList.remove('expanded');
        updateCollectionExpandButton(expandBtn, false);
    } else {
        // Étendre (si texte non chargé, le charger d'abord)
        if (!card.dataset.fullText && card.dataset.url) {
            loadTextFromCollectionById(itemId);
            return;
        }
        card.dataset.expanded = 'true';
        card.classList.add('expanded');
        updateCollectionExpandButton(expandBtn, true);
    }

    stabilizeCollectionsScroll(scrollEl, scrollTop);
}

/**
 * Charger le texte complet depuis l'ID de l'item (récupère les data-attributes)
 */
function loadTextFromCollectionById(itemId) {
    const card = document.getElementById(`coll-item-${itemId}`);
    if (!card) {
        toast('Erreur: élément introuvable');
        return;
    }

    // Si déjà chargé, basculer sans recharger
    if (card.dataset.fullText) {
        toggleCollectionItemText(itemId);
        return;
    }
    
    const url = card.dataset.url ? decodeURIComponent(card.dataset.url) : '';
    const title = card.dataset.title ? decodeURIComponent(card.dataset.title) : '';
    const author = card.dataset.author ? decodeURIComponent(card.dataset.author) : '';
    
    loadTextFromCollection(itemId, title, author, url);
}

/**
 * Charger le texte complet depuis la source et l'afficher dans la vue collection
 * Utilise le texte stocké si complet, sinon fallback sur Wikisource API
 */
async function loadTextFromCollection(itemId, title, author, url) {
    const fullContainer = document.getElementById(`full-${itemId}`);
    const card = document.getElementById(`coll-item-${itemId}`);
    const expandBtn = document.getElementById(`expand-btn-${itemId}`);
    const preview = document.getElementById(`preview-${itemId}`);
    
    if (!fullContainer || !card) {
        toast('Erreur: élément introuvable');
        return;
    }

    const scrollEl = card.closest('.favorites-overlay') || document.scrollingElement;
    const scrollTop = scrollEl ? scrollEl.scrollTop : window.scrollY;

    const startLoadingState = () => {
        card.classList.add('loading');
        card.setAttribute('aria-busy', 'true');
        if (expandBtn) {
            expandBtn.disabled = true;
            expandBtn.setAttribute('aria-busy', 'true');
            expandBtn.innerHTML = '<span class="expand-icon">⏳</span><span class="expand-label">Chargement…</span>';
        }
    };

    const finalizeLoadingState = (expand = true) => {
        card.classList.remove('loading');
        card.removeAttribute('aria-busy');
        if (expand) {
            card.dataset.expanded = 'true';
            card.classList.add('expanded');
        }
        if (expandBtn) {
            expandBtn.disabled = false;
            expandBtn.removeAttribute('aria-busy');
            updateCollectionExpandButton(expandBtn, expand);
        }
    };

    // Sauvegarder l'extrait actuel pour permettre le repli et l'alignement
    if (!card.dataset.previewText && preview) {
        card.dataset.previewText = preview.textContent || '';
    }
    
    // ═══════════════════════════════════════════════════════════
    // Vérifier si le texte stocké est déjà complet (nouveaux extraits)
    // Critère : longueur > 500 et ne finit pas par "…"
    // ═══════════════════════════════════════════════════════════
    const extraitId = card.dataset.extraitId;
    if (!card.dataset.fullText && extraitId && supabaseClient) {
        try {
            const { data } = await supabaseClient
                .from('extraits')
                .select('texte')
                .eq('id', extraitId)
                .single();
            
            if (data && data.texte && data.texte.length > 500 && !data.texte.endsWith('…')) {
                // Texte complet stocké en base - l'utiliser directement
                fullContainer.innerHTML = `<div class="collection-full-text">${escapeHtml(data.texte)}</div>`;
                card.dataset.fullText = data.texte;
                updateCollectionExpandAvailability(card);
                finalizeLoadingState(true);
                stabilizeCollectionsScroll(scrollEl, scrollTop);
                return;
            }
        } catch (e) {
            console.warn('Erreur récupération texte stocké:', e);
        }
    }
    
    // Fallback : charger depuis Wikisource (anciens extraits avec aperçu tronqué)

    // Afficher un loader compact
    fullContainer.innerHTML = `
        <div class="collection-loading" aria-live="polite">
            <div class="loading-line"></div>
            <div class="loading-line"></div>
            <div class="loading-line short"></div>
            <span class="loading-label">Chargement du texte complet...</span>
        </div>
    `;
    startLoadingState();
    
    if (url && url.includes('wikisource.org')) {
        try {
            // Extraire le titre de la page depuis l'URL
            let pageTitle = decodeURIComponent(url.split('/wiki/').pop());
            
            // Déterminer la langue depuis l'URL
            const langMatch = url.match(/https?:\/\/([a-z]+)\.wikisource/);
            const lang = langMatch ? langMatch[1] : 'fr';
            const baseUrl = `https://${lang}.wikisource.org`;
            
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
                const div = document.createElement('div');
                div.innerHTML = html;
                
                // Supprimer les éléments non-texte
                div.querySelectorAll('table, .noprint, .mw-editsection, script, style, .reference, sup.reference, .mw-cite-backlink, .ws-noexport, .navigation, .navbox, .infobox, .toc, .thumbinner, .magnify, .gallery').forEach(el => el.remove());
                
                // Extraire le texte des paragraphes et divs de poème
                let text = '';
                const elements = div.querySelectorAll('p, div.poem, div.verse, blockquote, .text, pre');
                elements.forEach(el => {
                    const t = el.textContent.trim();
                    if (t.length > 20) {
                        text += t + '\n\n';
                    }
                });
                
                // Si pas assez de texte, prendre tout le contenu
                if (text.length < 200) {
                    text = div.textContent
                        .replace(/\[\d+\]/g, '')
                        .replace(/\[modifier\]/gi, '')
                        .replace(/\s+/g, ' ')
                        .trim();
                }
                
                text = text.replace(/\n{3,}/g, '\n\n').trim();
                
                // Vérifier si c'est un sommaire (beaucoup de liens vers sous-pages, peu de texte)
                const basePage = title.split('/')[0];
                const subPageLinks = links.filter(l => {
                    const linkTitle = l['*'] || '';
                    return linkTitle.startsWith(basePage + '/') && l.ns === 0;
                });
                
                const isLikelySommaire = subPageLinks.length >= 3 && text.length < 500;
                
                if (isLikelySommaire && subPageLinks.length > 0) {
                    // C'est un sommaire - chercher une sous-page qui contient l'extrait
                    const previewText = card.dataset.previewText || '';
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
            
            let text = await loadPageWithFallback(pageTitle);
            
            if (text && text.length > 100) {
                // Aligner le début avec l'extrait déjà affiché
                const previewText = card.dataset.previewText || (preview ? preview.textContent : '') || '';
                const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
                const normPreview = normalize(previewText);
                
                if (normPreview && normPreview.length > 20) {
                    const normFull = normalize(text);
                    
                    // Chercher une correspondance significative
                    const searchLen = Math.min(normPreview.length, 80);
                    const searchSnippet = normPreview.substring(0, searchLen);
                    
                    const matchIdx = normFull.indexOf(searchSnippet);
                    
                    if (matchIdx >= 0) {
                        let origIdx = 0;
                        let normCount = 0;
                        
                        while (normCount < matchIdx && origIdx < text.length) {
                            if (!/\s/.test(text[origIdx]) || (origIdx > 0 && !/\s/.test(text[origIdx - 1]))) {
                                normCount++;
                            }
                            origIdx++;
                        }
                        
                        while (origIdx > 0 && text[origIdx - 1] !== '\n' && text[origIdx - 1] !== ' ') {
                            origIdx--;
                        }
                        
                        text = text.substring(origIdx).trim();
                    } else {
                        // Chercher une correspondance partielle
                        const previewWords = normPreview.split(' ').slice(0, 5).join(' ');
                        const partialIdx = normFull.indexOf(previewWords);
                        
                        if (partialIdx >= 0) {
                            let origIdx = 0;
                            let normCount = 0;
                            while (normCount < partialIdx && origIdx < text.length) {
                                if (!/\s/.test(text[origIdx]) || (origIdx > 0 && !/\s/.test(text[origIdx - 1]))) {
                                    normCount++;
                                }
                                origIdx++;
                            }
                            while (origIdx > 0 && text[origIdx - 1] !== '\n' && text[origIdx - 1] !== ' ') {
                                origIdx--;
                            }
                            text = text.substring(origIdx).trim();
                        }
                        // Si aucune correspondance, afficher le texte tel quel
                    }
                }
                
                fullContainer.innerHTML = `<div class="collection-full-text">${escapeHtml(text)}</div>`;
                card.dataset.fullText = text;
                updateCollectionExpandAvailability(card);
                toast('Texte complet chargé');
                finalizeLoadingState(true);
                stabilizeCollectionsScroll(scrollEl, scrollTop);
            } else {
                // Texte non trouvé
                fullContainer.innerHTML = `<div class="collection-error">Texte non disponible. <a href="${url}" target="_blank">Voir sur Wikisource →</a></div>`;
                finalizeLoadingState(true);
            }
        } catch (err) {
            console.error('Erreur chargement texte:', err);
            fullContainer.innerHTML = `<div class="collection-error">Erreur de chargement. <a href="${url}" target="_blank">Ouvrir la source</a></div>`;
            finalizeLoadingState(true);
        }
    } else if (url) {
        fullContainer.innerHTML = `<div class="collection-error">Source externe. <a href="${url}" target="_blank">Ouvrir dans un nouvel onglet</a></div>`;
        finalizeLoadingState(true);
    } else {
        fullContainer.innerHTML = '<div class="collection-error">Aucune source disponible</div>';
        finalizeLoadingState(true);
    }
}

// Fonction legacy pour compatibilité
function openCollectionItemReader(itemId, title, author, url) {
    toggleCollectionItemText(itemId);
}

// ═══════════════════════════════════════════════════════════
// 📤 EXPORTS GLOBAUX
// ═══════════════════════════════════════════════════════════

window.loadUserCollections = loadUserCollections;
window.loadCollectionItems = loadCollectionItems;
window.createCollection = createCollection;
window.updateCollection = updateCollection;
window.deleteCollection = deleteCollection;
window.addToCollection = addToCollection;
window.removeFromCollection = removeFromCollection;
window.getItemCollections = getItemCollections;
window.getExtraitCollectionsInfo = getExtraitCollectionsInfo;
window.loadExtraitCollectionsInfoBatch = loadExtraitCollectionsInfoBatch;
window.updateExtraitCollectionsButtons = updateExtraitCollectionsButtons;
window.openCollectionPicker = openCollectionPicker;
window.openCollectionPickerForExtrait = openCollectionPickerForExtrait;
window.closeCollectionPicker = closeCollectionPicker;
window.toggleItemInCollection = toggleItemInCollection;
window.showNewCollectionForm = showNewCollectionForm;
window.hideNewCollectionForm = hideNewCollectionForm;
window.selectCollectionEmoji = selectCollectionEmoji;
window.createNewCollectionFromPicker = createNewCollectionFromPicker;
window.openCollectionsView = openCollectionsView;
window.openCollection = openCollection;
window.openCollectionById = openCollectionById;
window.showExtraitCollections = showExtraitCollections;
window.openCollectionFromExtraitModal = openCollectionFromExtraitModal;
window.showCreateCollectionModal = showCreateCollectionModal;
window.closeCreateCollectionModal = closeCreateCollectionModal;
window.selectCreateEmoji = selectCreateEmoji;
window.selectCreateColor = selectCreateColor;
window.submitCreateCollection = submitCreateCollection;
window.editCollection = editCollection;
window.closeEditCollectionModal = closeEditCollectionModal;
window.selectEditEmoji = selectEditEmoji;
window.selectEditColor = selectEditColor;
window.submitEditCollection = submitEditCollection;
window.openCollectionItemReader = openCollectionItemReader;
window.toggleCollectionItemText = toggleCollectionItemText;
window.loadTextFromCollection = loadTextFromCollection;
window.loadTextFromCollectionById = loadTextFromCollectionById;
window.COLLECTION_EMOJIS = COLLECTION_EMOJIS;
window.COLLECTION_COLORS = COLLECTION_COLORS;
