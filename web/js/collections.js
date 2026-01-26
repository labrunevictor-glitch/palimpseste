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
async function loadUserCollections() {
    if (!currentUser || !supabaseClient) {
        userCollections = [];
        collectionsLoaded = false;
        return [];
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
    if (!currentUser || !supabaseClient) return [];
    
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
    if (!collectionsLoaded) {
        await loadUserCollections();
    }
    
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
async function openCollectionsView() {
    if (!currentUser) {
        toast('📝 Connectez-vous pour voir vos collections');
        return;
    }
    
    // Charger les collections si nécessaire
    if (!collectionsLoaded) {
        await loadUserCollections();
    }
    
    // Utiliser l'overlay des favoris existant
    const overlay = document.getElementById('favoritesOverlay');
    const grid = document.getElementById('favoritesGrid');
    const title = overlay?.querySelector('.favorites-title');
    
    if (!overlay || !grid) return;
    
    if (title) title.innerHTML = '❧ MES COLLECTIONS';
    
    grid.innerHTML = `
        <div class="collections-view">
            <div class="collections-header">
                <button class="btn-new-collection" onclick="showCreateCollectionModal()">
                    <span>+</span> Nouvelle collection
                </button>
            </div>
            
            <div class="collections-list" id="collectionsListView">
                ${userCollections.length === 0 
                    ? `<div class="collections-empty">
                        <div class="collections-empty-icon">❧</div>
                        <div class="collections-empty-title">Pas encore de collection</div>
                        <div class="collections-empty-text">Créez des collections pour organiser vos textes favoris par thèmes</div>
                        <button class="btn-create-first" onclick="showCreateCollectionModal()">Créer ma première collection</button>
                       </div>`
                    : userCollections.map(c => `
                        <div class="collection-card" onclick="openCollection('${c.id}')">
                            <div class="collection-card-emoji" style="background: ${c.color}15; color: ${c.color}">${c.emoji || '❧'}</div>
                            <div class="collection-card-info">
                                <div class="collection-card-name">${escapeHtml(c.name)}</div>
                                <div class="collection-card-count">${c.items_count || 0} texte${(c.items_count || 0) > 1 ? 's' : ''}</div>
                                ${c.description ? `<div class="collection-card-desc">${escapeHtml(c.description)}</div>` : ''}
                            </div>
                            <div class="collection-card-actions">
                                <button class="collection-card-action" onclick="event.stopPropagation(); editCollection('${c.id}')" title="Modifier">✎</button>
                                <button class="collection-card-action" onclick="event.stopPropagation(); deleteCollection('${c.id}')" title="Supprimer">×</button>
                            </div>
                        </div>
                    `).join('')
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
                <button class="btn-back-collections" onclick="openCollectionsView()">← Collections</button>
                ${collection.description ? `<p class="collection-description">${escapeHtml(collection.description)}</p>` : ''}
            </div>
            
            <div class="collection-items" id="collectionItemsView">
                ${items.length === 0 
                    ? `<div class="collection-empty">
                        <div class="collection-empty-icon">○</div>
                        <div class="collection-empty-title">Collection vide</div>
                        <div class="collection-empty-text">Ajoutez des textes en cliquant sur + Collection sur une carte</div>
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
                        const previewText = preview ? preview.substring(0, 300) : '';
                        const hasMore = preview && preview.length > 300;
                        
                        // Encoder l'URL pour éviter les problèmes de quotes
                        const safeUrl = url ? encodeURIComponent(url) : '';
                        const safeTitle = title ? encodeURIComponent(title) : '';
                        const safeAuthor = author ? encodeURIComponent(author) : '';
                        
                        return `
                            <div class="collection-item-card" id="coll-item-${itemId}" data-expanded="false"
                                 data-url="${safeUrl}" data-title="${safeTitle}" data-author="${safeAuthor}">
                                <div class="collection-item-content" onclick="toggleCollectionItemText('${itemId}')">
                                    <div class="collection-item-header">
                                        <div class="collection-item-title">${escapeHtml(title || 'Sans titre')}</div>
                                        <div class="collection-item-author">${escapeHtml(author || 'Auteur inconnu')}</div>
                                    </div>
                                    <div class="collection-item-text-container">
                                        <div class="collection-item-preview" id="preview-${itemId}">${escapeHtml(previewText)}${hasMore ? '...' : ''}</div>
                                        <div class="collection-item-full" id="full-${itemId}" style="display:none;">${escapeHtml(fullText || '')}</div>
                                    </div>
                                    ${hasMore ? `<button class="collection-item-expand" id="expand-btn-${itemId}">Lire la suite →</button>` : ''}
                                    ${item.note ? `<div class="collection-item-note"><span class="note-icon">¶</span> ${escapeHtml(item.note)}</div>` : ''}
                                </div>
                                <div class="collection-item-actions" onclick="event.stopPropagation()">
                                    ${url ? `<button class="item-action" onclick="loadTextFromCollectionById('${itemId}')" title="Charger le texte complet">↻</button>` : ''}
                                    ${url ? `<button class="item-action" onclick="window.open(decodeURIComponent('${safeUrl}'), '_blank')" title="Ouvrir la source">↗</button>` : ''}
                                    <button class="item-action danger" onclick="removeFromCollection('${collectionId}', '${item.id}')" title="Retirer">×</button>
                                </div>
                            </div>
                        `;
                    }).join('')
                }
            </div>
        </div>
    `;
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

/**
 * Toggle l'affichage du texte complet d'un item de collection
 */
function toggleCollectionItemText(itemId) {
    const card = document.getElementById(`coll-item-${itemId}`);
    const preview = document.getElementById(`preview-${itemId}`);
    const full = document.getElementById(`full-${itemId}`);
    const expandBtn = document.getElementById(`expand-btn-${itemId}`);
    
    if (!card || !preview || !full) return;
    
    const isExpanded = card.dataset.expanded === 'true';
    
    if (isExpanded) {
        // Réduire
        preview.style.display = 'block';
        full.style.display = 'none';
        card.dataset.expanded = 'false';
        card.classList.remove('expanded');
        if (expandBtn) expandBtn.textContent = 'Lire la suite →';
    } else {
        // Étendre
        preview.style.display = 'none';
        full.style.display = 'block';
        card.dataset.expanded = 'true';
        card.classList.add('expanded');
        if (expandBtn) expandBtn.textContent = '← Réduire';
    }
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
    
    const url = card.dataset.url ? decodeURIComponent(card.dataset.url) : '';
    const title = card.dataset.title ? decodeURIComponent(card.dataset.title) : '';
    const author = card.dataset.author ? decodeURIComponent(card.dataset.author) : '';
    
    loadTextFromCollection(itemId, title, author, url);
}

/**
 * Charger le texte complet depuis la source et l'afficher dans la vue collection
 * Utilise la même méthode que fetchText (action=parse) pour un résultat fiable
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
    
    // Afficher un loader
    fullContainer.innerHTML = '<div class="collection-loading">Chargement du texte complet...</div>';
    fullContainer.style.display = 'block';
    if (preview) preview.style.display = 'none';
    card.dataset.expanded = 'true';
    card.classList.add('expanded');
    if (expandBtn) expandBtn.textContent = '← Réduire';
    
    if (url && url.includes('wikisource.org')) {
        try {
            // Extraire le titre de la page depuis l'URL
            const pageTitle = decodeURIComponent(url.split('/wiki/').pop());
            
            // Déterminer la langue depuis l'URL
            const langMatch = url.match(/https?:\/\/([a-z]+)\.wikisource/);
            const lang = langMatch ? langMatch[1] : 'fr';
            const baseUrl = `https://${lang}.wikisource.org`;
            
            // Utiliser action=parse comme fetchText (méthode fiable)
            const apiUrl = `${baseUrl}/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=text&format=json&origin=*&redirects=true`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.parse?.text) {
                const html = data.parse.text['*'];
                
                // Extraire le texte du HTML (même méthode que analyzeHtml)
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
                        .replace(/\[\d+\]/g, '')        // Notes [1], [2]
                        .replace(/\[modifier\]/gi, '')  // Liens d'édition
                        .replace(/\s+/g, ' ')           // Espaces multiples
                        .trim();
                }
                
                text = text
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();
                
                if (text.length > 100) {
                    fullContainer.innerHTML = `<div class="collection-full-text">${escapeHtml(text)}</div>`;
                    toast('Texte complet chargé');
                } else {
                    // Texte trop court = probablement une page d'index
                    fullContainer.innerHTML = `<div class="collection-error">Cette page est un sommaire. <a href="${url}" target="_blank">Voir sur Wikisource →</a></div>`;
                }
            } else if (data.error) {
                fullContainer.innerHTML = `<div class="collection-error">Page introuvable. <a href="${url}" target="_blank">Voir sur Wikisource →</a></div>`;
            } else {
                fullContainer.innerHTML = `<div class="collection-error">Texte non disponible. <a href="${url}" target="_blank">Voir sur Wikisource →</a></div>`;
            }
        } catch (err) {
            console.error('Erreur chargement texte:', err);
            fullContainer.innerHTML = `<div class="collection-error">Erreur de chargement. <a href="${url}" target="_blank">Ouvrir la source</a></div>`;
        }
    } else if (url) {
        fullContainer.innerHTML = `<div class="collection-error">Source externe. <a href="${url}" target="_blank">Ouvrir dans un nouvel onglet</a></div>`;
    } else {
        fullContainer.innerHTML = '<div class="collection-error">Aucune source disponible</div>';
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
window.openCollectionPicker = openCollectionPicker;
window.closeCollectionPicker = closeCollectionPicker;
window.toggleItemInCollection = toggleItemInCollection;
window.showNewCollectionForm = showNewCollectionForm;
window.hideNewCollectionForm = hideNewCollectionForm;
window.selectCollectionEmoji = selectCollectionEmoji;
window.createNewCollectionFromPicker = createNewCollectionFromPicker;
window.openCollectionsView = openCollectionsView;
window.openCollection = openCollection;
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
