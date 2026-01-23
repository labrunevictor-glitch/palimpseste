/**
 * search.js - Module de recherche unifiée pour Palimpseste
 *
 * Recherche interne (Supabase) :
 * - Utilisateurs (profiles)
 * - Textes (extraits)
 * - Collections (collections)
 *
 * Dépendances: utils.js, followers.js (renderUserCard, toggleFollow, loadUserFollowing)
 */

// ═══════════════════════════════════════════════════════════
// 🔍 ÉTAT DE LA RECHERCHE
// ═══════════════════════════════════════════════════════════

let searchResults = {
    texts: [],
    collections: [],
    users: [],
    // Sources externes ("bases" comme avant)
    wikisource: [],
    poetrydb: [],
    gutenberg: []
};
let currentSearchTab = 'all';
let currentSearchQuery = '';

let searchRequestId = 0;

// ═══════════════════════════════════════════════════════════
// 🎯 INITIALISATION
// ═══════════════════════════════════════════════════════════

// Gérer l'affichage du bouton clear
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    
    if (searchInput && searchClear) {
        searchInput.addEventListener('input', () => {
            searchClear.classList.toggle('visible', searchInput.value.length > 0);
        });
    }
});

/**
 * Efface le champ de recherche
 */
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        document.getElementById('searchClear')?.classList.remove('visible');
        searchInput.focus();
    }
}

// ═══════════════════════════════════════════════════════════
// 🔍 RECHERCHE PRINCIPALE
// ═══════════════════════════════════════════════════════════

/**
 * Recherche depuis la barre principale (hero section)
 */
function performMainSearch() {
    const input = document.getElementById('mainSearchInput');
    if (!input) return;
    const query = input.value.trim();
    if (!query || query.length < 2) {
        toast('⚠️ Entrez au moins 2 caractères');
        return;
    }
    // Réutiliser la logique de performSearch
    document.getElementById('searchInput').value = query;
    performSearch();
}

/**
 * Lance la recherche multi-sources
 */
async function performSearch() {
    const mainInput = document.getElementById('mainSearchInput');
    const headerInput = document.getElementById('searchInput');
    const query = (mainInput?.value || headerInput?.value || '').trim();
    
    if (!query || query.length < 2) {
        toast('⚠️ Entrez au moins 2 caractères');
        return;
    }
    
    currentSearchQuery = query;

    const requestId = ++searchRequestId;
    
    // Afficher l'overlay avec loading
    const overlay = document.getElementById('searchResultsOverlay');
    const grid = document.getElementById('searchResultsGrid');
    const tabs = document.getElementById('searchResultsTabs');
    
    document.getElementById('searchQueryDisplay').textContent = query;
    overlay.classList.add('open');
    
    grid.innerHTML = '<div class="search-loading"><div class="spinner"></div><p>Recherche en cours...</p></div>';
    tabs.innerHTML = '';
    
    // Réinitialiser les résultats
    searchResults = { texts: [], collections: [], users: [], wikisource: [], poetrydb: [], gutenberg: [] };
    
    // Lancer les recherches en parallèle
    toast('🔍 Recherche...');
    
    await Promise.all([
        // Interne
        searchUsers(query, requestId),
        searchPalimpsesteTexts(query, requestId),
        searchCollections(query, requestId),
        // Externe (bases)
        searchWikisource(query, requestId),
        searchPoetryDB(query, requestId),
        searchGutenberg(query, requestId)
    ]);

    // Si une autre recherche a démarré pendant celle-ci, ne pas écraser l'UI
    if (requestId !== searchRequestId) return;
    
    // Afficher les résultats
    renderSearchTabs();
    renderSearchResults('all');
}

function getAllNonUserResults() {
    return [
        ...((searchResults.users || []).map(r => ({ ...r, _kind: 'users' }))),
        ...((searchResults.texts || []).map(r => ({ ...r, _kind: 'texts' }))),
        ...((searchResults.collections || []).map(r => ({ ...r, _kind: 'collections' }))),
        ...((searchResults.wikisource || []).map(r => ({ ...r, _kind: 'wikisource' }))),
        ...((searchResults.poetrydb || []).map(r => ({ ...r, _kind: 'poetrydb' }))),
        ...((searchResults.gutenberg || []).map(r => ({ ...r, _kind: 'gutenberg' })))
    ];
}

function getExternalSourceResults() {
    return [
        ...((searchResults.wikisource || []).map(r => ({ ...r, _kind: 'wikisource' }))),
        ...((searchResults.poetrydb || []).map(r => ({ ...r, _kind: 'poetrydb' }))),
        ...((searchResults.gutenberg || []).map(r => ({ ...r, _kind: 'gutenberg' })))
    ];
}

// ═══════════════════════════════════════════════════════════
// 👥 RECHERCHE UTILISATEURS
// ═══════════════════════════════════════════════════════════

/**
 * Recherche d'utilisateurs sur Palimpseste
 */
async function searchUsers(query) {
    if (!supabaseClient) return;
    
    try {
        const { data: users } = await supabaseClient
            .from('profiles')
            .select('id, username, created_at')
            .ilike('username', `%${query}%`)
            .limit(20);
        
        if (users && users.length > 0) {
            // Charger qui on suit
            await loadUserFollowing();

            if (arguments.length >= 2) {
                const requestId = arguments[1];
                if (requestId !== searchRequestId) return;
            }
            
            // Compter les extraits pour tous les users en une seule requete (exclure silencieux)
            const userIds = users.map(u => u.id);
            const { data: extraitCounts } = await supabaseClient
                .from('extraits')
                .select('user_id')
                .in('user_id', userIds)
                .or('is_silent.is.null,is_silent.eq.false');

            const countMap = {};
            if (extraitCounts) {
                extraitCounts.forEach(e => {
                    countMap[e.user_id] = (countMap[e.user_id] || 0) + 1;
                });
            }

            const enriched = users.map(u => ({
                ...u,
                extraitCount: countMap[u.id] || 0,
                source: 'users'
            }));

            if (arguments.length >= 2) {
                const requestId = arguments[1];
                if (requestId !== searchRequestId) return;
            }

            searchResults.users = enriched;
        }
    } catch (e) {
        console.error('User search error:', e);
    }
}

// ═══════════════════════════════════════════════════════════
// 📜 RECHERCHE TEXTES (EXTRAITS)
// ═══════════════════════════════════════════════════════════

/**
 * Recherche dans les extraits (aperçus) stockés dans Supabase
 */
async function searchPalimpsesteTexts(query, requestId) {
    if (!supabaseClient) return;

    // Supabase .or() utilise des virgules comme séparateurs
    const safeQuery = String(query || '').replace(/,/g, ' ').trim();
    if (!safeQuery) return;

    try {
        const { data, error } = await supabaseClient
            .from('extraits')
            .select('id, texte, source_title, source_author, source_url, created_at, user_id')
            .or(`texte.ilike.%${safeQuery}%,source_title.ilike.%${safeQuery}%,source_author.ilike.%${safeQuery}%`)
            .order('created_at', { ascending: false })
            .limit(30);

        if (error) throw error;

        if (requestId !== searchRequestId) return;

        let profileMap = new Map();
        if (typeof loadProfilesMap === 'function') {
            profileMap = await loadProfilesMap((data || []).map(e => e.user_id));
        }

        searchResults.texts = (data || []).map(e => ({
            id: e.id,
            preview: e.texte,
            title: e.source_title,
            author: e.source_author,
            url: e.source_url,
            created_at: e.created_at,
            sharedBy: profileMap.get(e.user_id)?.username || null,
            source: 'palimpseste_text'
        }));
    } catch (e) {
        console.error('Texts search error:', e);
    }
}

// ═══════════════════════════════════════════════════════════
// 📚 RECHERCHE COLLECTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Recherche dans les collections (publiques + les vôtres si connecté)
 */
async function searchCollections(query, requestId) {
    if (!supabaseClient) return;

    const safeQuery = String(query || '').replace(/,/g, ' ').trim();
    if (!safeQuery) return;

    try {
        const { data, error } = await supabaseClient
            .from('collections')
            .select('id, name, description, emoji, color, is_public, items_count, user_id')
            .or(`name.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`)
            .order('updated_at', { ascending: false })
            .limit(30);

        if (error) throw error;

        if (requestId !== searchRequestId) return;

        searchResults.collections = (data || []).map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            emoji: c.emoji,
            color: c.color,
            is_public: !!c.is_public,
            items_count: c.items_count || 0,
            user_id: c.user_id,
            source: 'collections'
        }));
    } catch (e) {
        console.error('Collections search error:', e);
    }
}

// ═══════════════════════════════════════════════════════════
// 📜 RECHERCHE WIKISOURCE
// ═══════════════════════════════════════════════════════════

/**
 * Recherche sur Wikisource (multi-langues)
 */
async function searchWikisource(query, requestId) {
    try {
        const wikisources = getActiveWikisources();
        const allResults = [];
        
        // Fonction pour chercher les œuvres d'un auteur via sa catégorie
        async function searchAuthorWorks(ws, authorName) {
            const results = [];
            // Normaliser le nom de l'auteur (première lettre majuscule pour chaque mot)
            const normalizedName = authorName.trim().split(/\s+/)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ');
            
            // D'abord, essayer de trouver la page Auteur pour récupérer le nom complet
            let fullAuthorName = normalizedName;
            try {
                // Chercher la page Auteur avec le nom
                const authorSearchUrl = `${ws.url}/w/api.php?action=query&list=search&srsearch=intitle:${encodeURIComponent(normalizedName)}&srnamespace=102&srlimit=5&format=json&origin=*`;
                const authorSearchRes = await fetch(authorSearchUrl);
                const authorSearchData = await authorSearchRes.json();
                const authorPages = authorSearchData.query?.search || [];
                
                if (authorPages.length > 0) {
                    // Extraire le nom de la page Auteur (ex: "Auteur:Arthur Schopenhauer")
                    const authorPage = authorPages[0].title;
                    fullAuthorName = authorPage.replace(/^Auteur:|^Author:|^Autor:/, '').trim();
                }
            } catch (e) { /* Ignorer */ }
            
            // Essayer différents formats de catégorie selon la langue
            const categoryFormats = {
                'fr': [
                    `Catégorie:Œuvres d'${fullAuthorName}`,
                    `Catégorie:Œuvres de ${fullAuthorName}`,
                    `Catégorie:${fullAuthorName}`
                ],
                'en': [
                    `Category:Works by ${fullAuthorName}`,
                    `Category:${fullAuthorName}`
                ],
                'de': [
                    `Kategorie:${fullAuthorName}`,
                    `Kategorie:Werke von ${fullAuthorName}`
                ],
                'it': [
                    `Categoria:Opere di ${fullAuthorName}`,
                    `Categoria:${fullAuthorName}`
                ],
                'es': [
                    `Categoría:Obras de ${fullAuthorName}`,
                    `Categoría:${fullAuthorName}`
                ]
            };
            
            const categories = categoryFormats[ws.lang] || [`Category:${fullAuthorName}`];
            
            for (const catName of categories) {
                try {
                    const catUrl = `${ws.url}/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(catName)}&cmlimit=20&cmnamespace=0&format=json&origin=*`;
                    const res = await fetch(catUrl);
                    const data = await res.json();
                    const members = data.query?.categorymembers || [];
                    if (members.length > 0) {
                        return members.map(m => ({
                            title: m.title,
                            snippet: `📚 Œuvre de ${fullAuthorName}`,
                            source: 'wikisource',
                            lang: ws.lang,
                            wikisource: ws,
                            isAuthorWork: true
                        }));
                    }
                } catch (e) { /* Ignorer si catégorie non trouvée */ }
            }
            return results;
        }
        
        // Pour chaque wikisource, faire une recherche standard ET une recherche par auteur
        for (const ws of wikisources) {
            // Recherche standard
            const standardPromise = fetch(`${ws.url}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=15&srnamespace=0&format=json&origin=*`)
                .then(res => res.json())
                .then(data => {
                    return (data.query?.search || []).map(r => ({
                        title: r.title,
                        snippet: r.snippet || '',
                        source: 'wikisource',
                        lang: ws.lang,
                        wikisource: ws
                    }));
                })
                .catch(() => []);
            
            // Recherche par catégorie d'auteur (si la requête ressemble à un nom)
            const authorPromise = searchAuthorWorks(ws, query);
            
            const [standardResults, authorResults] = await Promise.all([standardPromise, authorPromise]);
            
            // Fusionner en mettant les œuvres de l'auteur en premier
            const combined = [...authorResults, ...standardResults];
            
            // Dédupliquer par titre
            const seen = new Set();
            const unique = combined.filter(r => {
                if (seen.has(r.title)) return false;
                seen.add(r.title);
                return true;
            });
            
            allResults.push(...unique);
        }
        
        if (requestId !== searchRequestId) return;
        searchResults.wikisource = allResults;
    } catch (e) {
        console.error('Wikisource search error:', e);
    }
}

// ═══════════════════════════════════════════════════════════
// 🎭 RECHERCHE POETRYDB
// ═══════════════════════════════════════════════════════════

/**
 * Recherche sur PoetryDB (poésie anglaise)
 */
async function searchPoetryDB(query, requestId) {
    try {
        // Recherche par auteur
        const authorRes = await fetch(`https://poetrydb.org/author/${encodeURIComponent(query)}`);
        let authorData = [];
        if (authorRes.ok) {
            const data = await authorRes.json();
            if (Array.isArray(data)) {
                authorData = data.slice(0, 10).map(p => ({
                    title: p.title,
                    author: p.author,
                    snippet: p.lines?.slice(0, 3).join(' / ') || '',
                    lines: p.lines,
                    source: 'poetrydb',
                    lang: 'en'
                }));
            }
        }
        
        // Recherche par titre
        const titleRes = await fetch(`https://poetrydb.org/title/${encodeURIComponent(query)}`);
        let titleData = [];
        if (titleRes.ok) {
            const data = await titleRes.json();
            if (Array.isArray(data)) {
                titleData = data.slice(0, 10).map(p => ({
                    title: p.title,
                    author: p.author,
                    snippet: p.lines?.slice(0, 3).join(' / ') || '',
                    lines: p.lines,
                    source: 'poetrydb',
                    lang: 'en'
                }));
            }
        }
        
        // Combiner et dédupliquer
        const combined = [...authorData, ...titleData];
        const seen = new Set();
        if (requestId !== searchRequestId) return;

        searchResults.poetrydb = combined.filter(p => {
            const key = p.title + p.author;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    } catch (e) {
        console.error('PoetryDB search error:', e);
    }
}

// ═══════════════════════════════════════════════════════════
// 📖 RECHERCHE GUTENBERG
// ═══════════════════════════════════════════════════════════

/**
 * Recherche sur Project Gutenberg
 */
async function searchGutenberg(query, requestId) {
    try {
        const res = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (requestId !== searchRequestId) return;

        searchResults.gutenberg = (data.results || []).slice(0, 15).map(book => ({
            title: book.title,
            author: book.authors?.map(a => a.name).join(', ') || 'Inconnu',
            snippet: book.subjects?.slice(0, 3).join(' • ') || '',
            id: book.id,
            source: 'gutenberg',
            lang: book.languages?.[0] || 'en',
            formats: book.formats
        }));
    } catch (e) {
        console.error('Gutenberg search error:', e);
    }
}

// ═══════════════════════════════════════════════════════════
// 🎨 AFFICHAGE DES RÉSULTATS
// ═══════════════════════════════════════════════════════════

/**
 * Affiche les onglets de résultats
 */
function renderSearchTabs() {
    const tabs = document.getElementById('searchResultsTabs');
    const usersCount = searchResults.users?.length || 0;
    const textsCount = searchResults.texts?.length || 0;
    const collectionsCount = searchResults.collections?.length || 0;
    const wikisourceCount = searchResults.wikisource?.length || 0;
    const poetryCount = searchResults.poetrydb?.length || 0;
    const gutenbergCount = searchResults.gutenberg?.length || 0;
    const sourcesCount = wikisourceCount + poetryCount + gutenbergCount;
    const allCount = usersCount + textsCount + collectionsCount + wikisourceCount + poetryCount + gutenbergCount;

    tabs.innerHTML = `
        <button class="search-tab ${currentSearchTab === 'all' ? 'active' : ''}" onclick="switchSearchTab('all')">
            Tout <span class="count">${allCount}</span>
        </button>
        <button class="search-tab ${currentSearchTab === 'users' ? 'active' : ''}" onclick="switchSearchTab('users')">
            Utilisateurs <span class="count">${usersCount}</span>
        </button>
        <button class="search-tab ${currentSearchTab === 'texts' ? 'active' : ''}" onclick="switchSearchTab('texts')">
            Extraits partagés <span class="count">${textsCount}</span>
        </button>
        <button class="search-tab ${currentSearchTab === 'collections' ? 'active' : ''}" onclick="switchSearchTab('collections')">
            Collections <span class="count">${collectionsCount}</span>
        </button>
        <button class="search-tab ${currentSearchTab === 'sources' ? 'active' : ''}" onclick="switchSearchTab('sources')" title="Wikisource • PoetryDB (EN) • Gutenberg">
            Sources <span class="count">${sourcesCount}</span>
        </button>
    `;
}

/**
 * Change d'onglet de résultats
 */
function switchSearchTab(tab) {
    currentSearchTab = tab;
    renderSearchTabs();
    renderSearchResults(tab);
}

async function hydrateSearchExtraitActions(extraitIds) {
    if (!extraitIds || extraitIds.length === 0) return;

    // Load batch data then update buttons in parallel
    const promises = [];
    if (typeof hydrateExtraitLikesUI === 'function') {
        hydrateExtraitLikesUI(extraitIds);
    }
    if (typeof loadExtraitShareInfoBatch === 'function') {
        promises.push(loadExtraitShareInfoBatch(extraitIds));
    }
    if (typeof loadExtraitCollectionsInfoBatch === 'function') {
        promises.push(loadExtraitCollectionsInfoBatch(extraitIds));
    }
    await Promise.all(promises);
}

/**
 * Affiche les résultats de recherche
 */
function renderSearchResults(tab) {
    const grid = document.getElementById('searchResultsGrid');
    
    // Si onglet utilisateurs
    if (tab === 'users') {
        const users = searchResults.users || [];
        
        if (users.length === 0) {
            grid.innerHTML = `
                <div class="search-no-results">
                    <div class="search-no-results-icon">👤</div>
                    <p>Aucun utilisateur trouvé pour "${escapeHtml(currentSearchQuery)}"</p>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem;">Vérifiez l'orthographe du pseudo</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = `
            <div class="discover-grid" style="padding: 0.5rem;">
                ${users.map(u => {
                    const isMe = currentUser && u.id === currentUser.id;
                    if (isMe) {
                        return `
                            <div class="discover-card">
                                <div class="discover-avatar" onclick="openUserProfile('${u.id}', '${u.username}')">${getAvatarSymbol(u.username || '?')}</div>
                                <div class="discover-info" onclick="openUserProfile('${u.id}', '${u.username}')">
                                    <div class="discover-name">${escapeHtml(u.username || 'Anonyme')}</div>
                                    <div class="discover-stats">${u.extraitCount} extrait${u.extraitCount > 1 ? 's' : ''}</div>
                                </div>
                                <span style="color:var(--muted);font-size:0.8rem;">C'est vous</span>
                            </div>
                        `;
                    }
                    return renderUserCard(
                        u.id, 
                        u.username, 
                        `${u.extraitCount} extrait${u.extraitCount > 1 ? 's' : ''}`,
                        true,
                        'toggleFollowFromSearch'
                    );
                }).join('')}
            </div>
        `;
        return;
    }

    const results = tab === 'all'
        ? getAllNonUserResults()
        : tab === 'sources'
            ? getExternalSourceResults()
            : (searchResults[tab] || []);
    
    if (results.length === 0) {
        grid.innerHTML = `
            <div class="search-no-results">
                <div class="search-no-results-icon">📭</div>
                <p>Aucun résultat pour "${escapeHtml(currentSearchQuery)}"</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem;">Essayez avec d'autres mots-clés ou un nom d'auteur</p>
            </div>
        `;
        return;
    }

    // Onglet Tout : affichage mixte (extraits + collections + sources externes)
    if (tab === 'all') {
        const queryRegex = new RegExp(`(${escapeRegex(currentSearchQuery)})`, 'gi');

        grid.innerHTML = results.map((r, idx) => {
            const kind = r._kind || r.source;

            if (kind === 'users') {
                const avatar = getAvatarSymbol(r.username || '?');
                const username = r.username || 'Anonyme';
                const safeUsername = String(username).replace(/'/g, "\\'");
                const count = r.extraitCount || 0;
                return `
                    <div class="search-result-card" onclick="openUserProfile('${r.id}', '${safeUsername}')">
                        <div class="search-result-title">${avatar} ${escapeHtml(username)}</div>
                        <div class="search-result-author">${count} extrait${count > 1 ? 's' : ''}</div>
                        <div class="search-result-meta">
                            <span class="search-result-source">👤 Utilisateurs</span>
                        </div>
                    </div>
                `;
            }

            if (kind === 'collections') {
                const emoji = r.emoji || '❧';
                const color = r.color || '#5a7a8a';
                const subtitle = `${r.items_count || 0} texte${(r.items_count || 0) > 1 ? 's' : ''}${r.is_public ? ' • public' : ''}`;
                const desc = r.description ? escapeHtml(r.description) : '';
                return `
                    <div class="search-result-card" onclick="openSearchResult(${idx}, 'all')">
                        <div class="search-result-title">${emoji} ${escapeHtml(r.name || 'Sans titre')}</div>
                        <div class="search-result-author">${escapeHtml(subtitle)}</div>
                        ${desc ? `<div class="search-result-snippet">${desc}</div>` : ''}
                        <div class="search-result-meta">
                            <span class="search-result-source" style="border-color:${color}55;">❧ Collections</span>
                        </div>
                    </div>
                `;
            }

            if (kind === 'wikisource' || kind === 'poetrydb' || kind === 'gutenberg') {
                const sourceIcon = kind === 'wikisource' ? '§' : kind === 'poetrydb' ? '❧' : '¶';
                const sourceName = kind === 'wikisource' ? 'Wikisource' : kind === 'poetrydb' ? 'PoetryDB' : 'Gutenberg';
                const authorFromTitle = (typeof extractAuthorFromTitle === 'function')
                    ? extractAuthorFromTitle(r.title)
                    : extractAuthorFromTitleLocal(r.title);
                const author = r.author || authorFromTitle || '';

                let snippet = r.snippet || '';
                snippet = snippet.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
                snippet = escapeHtml(snippet).replace(queryRegex, '<mark>$1</mark>');

                return `
                    <div class="search-result-card" onclick="openSearchResult(${idx}, 'all')">
                        <div class="search-result-title">${escapeHtml(r.title)}</div>
                        ${author ? `<div class="search-result-author">${escapeHtml(author)}</div>` : ''}
                        <div class="search-result-snippet">${snippet}</div>
                        <div class="search-result-meta">
                            <span class="search-result-source">${sourceIcon} ${sourceName}</span>
                            ${r.lang ? `<span>🌐 ${String(r.lang).toUpperCase()}</span>` : ''}
                        </div>
                    </div>
                `;
            }

            // Par défaut : extrait interne
            const fallbackTitle = (r.preview || '').replace(/\s+/g, ' ').trim().slice(0, 60);
            const title = (r.title && String(r.title).trim()) ? r.title : (fallbackTitle || 'Extrait');
            const author = (r.author && String(r.author).trim()) ? r.author : '';
            const bylineParts = [];
            if (author) bylineParts.push(escapeHtml(author));
            if (r.sharedBy) bylineParts.push(`partagé par ${escapeHtml(r.sharedBy)}`);
            const byline = bylineParts.length ? bylineParts.join(' • ') : 'Extrait partagé';
            const isLiked = typeof isExtraitLiked === 'function' ? isExtraitLiked(r.id) : false;
            const likeCount = typeof getLikeCount === 'function' ? getLikeCount(r.id) : 0;
            const sInfo = typeof extraitSharesCache !== 'undefined' && extraitSharesCache.get(r.id);
            const sCount = sInfo?.count || 0;
            const cInfo = typeof extraitCollectionsCache !== 'undefined' && extraitCollectionsCache.get(r.id);
            const cCount = cInfo?.count || 0;

            let snippet = r.preview || '';
            snippet = escapeHtml(snippet).replace(queryRegex, '<mark>$1</mark>');

            return `
                <div class="search-result-card" onclick="openSearchResult(${idx}, 'all')">
                    <div class="search-result-title">${escapeHtml(title)}</div>
                    <div class="search-result-author">${byline}</div>
                    <div class="search-result-snippet">${snippet}</div>
                    <div class="search-result-meta">
                        <span class="search-result-source">¶ Extraits partagés</span>
                    </div>
                    <div class="extrait-actions" onclick="event.stopPropagation()">
                        <button class="extrait-action like-btn ${isLiked ? 'liked' : ''}" id="likeBtn-${r.id}" onclick="event.stopPropagation(); toggleLikeExtrait('${r.id}')" data-extrait-id="${r.id}">
                            <span class="like-icon">${isLiked ? '♥' : '♡'}</span>
                            <span class="like-count ${likeCount === 0 ? 'is-zero' : ''}" id="likeCount-${r.id}" onclick="event.stopPropagation(); showLikers('${r.id}')">${likeCount}</span>
                        </button>
                        <button class="extrait-action share-btn" onclick="event.stopPropagation(); shareExtraitFromCard('${r.id}')">
                            <span class="icon">⤴</span>
                            <span class="share-count ${sCount === 0 ? 'is-zero' : ''}" id="shareCount-${r.id}" onclick="event.stopPropagation(); event.preventDefault(); showSharers('${r.id}')">${sCount}</span>
                        </button>
                        <button class="extrait-action collection-btn" onclick="event.stopPropagation(); openCollectionPickerForExtrait('${r.id}')">
                            <span class="icon">▦</span>
                            <span class="collections-count ${cCount === 0 ? 'is-zero' : ''}" id="collectionsCount-${r.id}" onclick="event.stopPropagation(); event.preventDefault(); showExtraitCollections('${r.id}')">${cCount}</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        const extraitIds = results
            .filter(r => (r._kind || r.source) === 'texts')
            .map(r => r.id);
        hydrateSearchExtraitActions(extraitIds);
        return;
    }
    

    if (tab === 'collections') {
        grid.innerHTML = results.map((c, idx) => {
            const emoji = c.emoji || '❧';
            const color = c.color || '#5a7a8a';
            const subtitle = `${c.items_count || 0} texte${(c.items_count || 0) > 1 ? 's' : ''}${c.is_public ? ' • public' : ''}`;
            const desc = c.description ? escapeHtml(c.description) : '';

            return `
                <div class="search-result-card" onclick="openSearchResult(${idx}, 'collections')">
                    <div class="search-result-title">${emoji} ${escapeHtml(c.name || 'Sans titre')}</div>
                    <div class="search-result-author">${escapeHtml(subtitle)}</div>
                    ${desc ? `<div class="search-result-snippet">${desc}</div>` : ''}
                    <div class="search-result-meta">
                        <span class="search-result-source" style="border-color:${color}55;">❧ Collections</span>
                    </div>
                </div>
            `;
        }).join('');
        return;
    }

    // Onglet sources externes (bases)
    if (tab === 'sources') {
        grid.innerHTML = results.map((r, idx) => {
            const kind = r._kind || r.source;
            const sourceIcon = kind === 'wikisource' ? '§' : kind === 'poetrydb' ? '❧' : '¶';
            const sourceName = kind === 'wikisource' ? 'Wikisource' : kind === 'poetrydb' ? 'PoetryDB' : 'Gutenberg';
            const authorFromTitle = (typeof extractAuthorFromTitle === 'function')
                ? extractAuthorFromTitle(r.title)
                : extractAuthorFromTitleLocal(r.title);
            const author = r.author || authorFromTitle || '';

            let snippet = r.snippet || '';
            snippet = snippet.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

            const queryRegex = new RegExp(`(${escapeRegex(currentSearchQuery)})`, 'gi');
            snippet = escapeHtml(snippet).replace(queryRegex, '<mark>$1</mark>');

            return `
                <div class="search-result-card" onclick="openSearchResult(${idx}, 'sources')">
                    <div class="search-result-title">${escapeHtml(r.title)}</div>
                    ${author ? `<div class="search-result-author">${escapeHtml(author)}</div>` : ''}
                    <div class="search-result-snippet">${snippet}</div>
                    <div class="search-result-meta">
                        <span class="search-result-source">${sourceIcon} ${sourceName}</span>
                        ${r.lang ? `<span>🌐 ${String(r.lang).toUpperCase()}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        return;
    }

    // Onglet textes (extraits internes)
    grid.innerHTML = results.map((r, idx) => {
        const fallbackTitle = (r.preview || '').replace(/\s+/g, ' ').trim().slice(0, 60);
        const title = (r.title && String(r.title).trim()) ? r.title : (fallbackTitle || 'Extrait');
        const author = (r.author && String(r.author).trim()) ? r.author : '';
        const bylineParts = [];
        if (author) bylineParts.push(escapeHtml(author));
        if (r.sharedBy) bylineParts.push(`partagé par ${escapeHtml(r.sharedBy)}`);
        const byline = bylineParts.length ? bylineParts.join(' • ') : 'Extrait partagé';
        const isLiked = typeof isExtraitLiked === 'function' ? isExtraitLiked(r.id) : false;
        const likeCount = typeof getLikeCount === 'function' ? getLikeCount(r.id) : 0;
        const sInfo = typeof extraitSharesCache !== 'undefined' && extraitSharesCache.get(r.id);
        const sCount = sInfo?.count || 0;
        const cInfo = typeof extraitCollectionsCache !== 'undefined' && extraitCollectionsCache.get(r.id);
        const cCount = cInfo?.count || 0;
        let snippet = r.preview || '';

        // Highlight query dans le snippet
        const queryRegex = new RegExp(`(${escapeRegex(currentSearchQuery)})`, 'gi');
        snippet = escapeHtml(snippet).replace(queryRegex, '<mark>$1</mark>');

        return `
            <div class="search-result-card" onclick="openSearchResult(${idx}, 'texts')">
                <div class="search-result-title">${escapeHtml(title)}</div>
                <div class="search-result-author">${byline}</div>
                <div class="search-result-snippet">${snippet}</div>
                <div class="search-result-meta">
                    <span class="search-result-source">¶ Extraits partagés</span>
                </div>
                <div class="extrait-actions" onclick="event.stopPropagation()">
                    <button class="extrait-action like-btn ${isLiked ? 'liked' : ''}" id="likeBtn-${r.id}" onclick="event.stopPropagation(); toggleLikeExtrait('${r.id}')" data-extrait-id="${r.id}">
                        <span class="like-icon">${isLiked ? '♥' : '♡'}</span>
                        <span class="like-count ${likeCount === 0 ? 'is-zero' : ''}" id="likeCount-${r.id}" onclick="event.stopPropagation(); showLikers('${r.id}')">${likeCount}</span>
                    </button>
                    <button class="extrait-action share-btn" onclick="event.stopPropagation(); shareExtraitFromCard('${r.id}')">
                        <span class="icon">⤴</span>
                        <span class="share-count ${sCount === 0 ? 'is-zero' : ''}" id="shareCount-${r.id}" onclick="event.stopPropagation(); event.preventDefault(); showSharers('${r.id}')">${sCount}</span>
                    </button>
                    <button class="extrait-action collection-btn" onclick="event.stopPropagation(); openCollectionPickerForExtrait('${r.id}')">
                        <span class="icon">▦</span>
                        <span class="collections-count ${cCount === 0 ? 'is-zero' : ''}" id="collectionsCount-${r.id}" onclick="event.stopPropagation(); event.preventDefault(); showExtraitCollections('${r.id}')">${cCount}</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    const extraitIds = results.map(r => r.id);
    hydrateSearchExtraitActions(extraitIds);
}

// ═══════════════════════════════════════════════════════════
// 🎬 ACTIONS SUR LES RÉSULTATS
// ═══════════════════════════════════════════════════════════

/**
 * Follow depuis la recherche
 */
async function toggleFollowFromSearch(userId, event) {
    event.stopPropagation();
    await toggleFollow(userId);
    // Re-render les résultats pour mettre à jour les boutons
    renderSearchResults(currentSearchTab);
}

/**
 * Extraction d'auteur depuis le titre (locale)
 */
function extractAuthorFromTitleLocal(title) {
    // Essayer d'extraire l'auteur depuis des patterns courants
    const patterns = [
        /^(.+?)\s*[-–—]\s*(.+)$/,  // "Titre - Auteur" ou "Auteur - Titre"
        /\(([^)]+)\)$/,             // "Titre (Auteur)"
        /by\s+(.+)$/i               // "Title by Author"
    ];
    
    for (const pattern of patterns) {
        const match = title.match(pattern);
        if (match) {
            const candidate = match[1] || match[2];
            // Vérifier si ça ressemble à un nom d'auteur
            if (candidate && candidate.length < 50 && /^[A-Za-zÀ-ÿ\s.'-]+$/.test(candidate)) {
                return candidate.trim();
            }
        }
    }
    return null;
}

/**
 * Ouvre un résultat de recherche
 */
async function openSearchResult(idx, tab) {
    let result;
    if (tab === 'all') {
        result = getAllNonUserResults()[idx];
    } else if (tab === 'sources') {
        result = getExternalSourceResults()[idx];
    } else {
        result = searchResults[tab]?.[idx];
    }
    
    if (!result) return;
    
    closeSearchResults();
    toast('Chargement...');

    if (tab === 'texts' || result._kind === 'texts') {
        if (typeof openSocialFeed === 'function') {
            openSocialFeed();
        }
        if (typeof viewExtraitById === 'function') {
            setTimeout(() => viewExtraitById(result.id), 300);
        } else {
            toast("Impossible d'ouvrir ce texte");
        }
        return;
    }

    if (tab === 'collections' || result._kind === 'collections') {
        if (typeof openCollectionById === 'function') {
            await openCollectionById(result.id);
        } else if (typeof openCollectionsView === 'function') {
            await openCollectionsView();
        } else {
            toast("Impossible d'ouvrir cette collection");
        }
        return;
    }

    // Externe (bases)
    const kind = result._kind || tab;
    if (kind === 'wikisource' || result.source === 'wikisource') {
        const renderSearchTextCard = (rawText, authorOverride = null) => {
            if (!rawText) return false;
            document.getElementById('feed').innerHTML = '';
            state.cardIdx = 0;
            renderCard({
                title: result.title,
                text: rawText,
                author: authorOverride || null,
                source: 'wikisource'
            }, result.title, result.wikisource, true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return true;
        };

        // Chargement exact de la page (éviter les redirections heuristiques)
        try {
            const rawUrl = `${result.wikisource.url}/w/api.php?action=parse&page=${encodeURIComponent(result.title)}&prop=text|displaytitle|links|categories&format=json&origin=*&redirects=true`;
            const res = await fetch(rawUrl);
            const data = await res.json();
            const html = data.parse?.text?.['*'] || '';
            if (html) {
                const analysis = typeof analyzeHtml === 'function' ? analyzeHtml(html) : null;
                const rawText = analysis?.text || '';
                if (rawText && rawText.length > 20) {
                    if (renderSearchTextCard(rawText, analysis?.authorFromHtml || null)) return;
                }
            }
        } catch (e) {
            // ignore parse errors
        }

        toast('Impossible de charger ce texte');
        return;
    }

    if (kind === 'poetrydb' || result.source === 'poetrydb') {
        document.getElementById('feed').innerHTML = '';
        state.cardIdx = 0;
        renderCard({
            title: result.title,
            text: result.lines?.join('\n') || result.snippet,
            author: result.author,
            source: 'poetrydb'
        }, result.title, { lang: 'en', url: 'https://poetrydb.org', name: 'PoetryDB' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    if (kind === 'gutenberg' || result.source === 'gutenberg') {
        const readUrl = result.id ? `https://www.gutenberg.org/ebooks/${result.id}` : (result.url || 'https://www.gutenberg.org');
        window.open(readUrl, '_blank');
        toast('Ouverture sur Project Gutenberg');
    }
}

/**
 * Ferme l'overlay des résultats de recherche
 */
function closeSearchResults() {
    document.getElementById('searchResultsOverlay').classList.remove('open');
}
