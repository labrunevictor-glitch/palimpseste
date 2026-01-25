/**
 * search.js - Module de recherche unifiée pour Palimpseste
 * 
 * Gère la recherche multi-sources :
 * - Wikisource (littérature multilingue)
 * - PoetryDB (poésie anglaise)
 * - Project Gutenberg (livres du domaine public)
 * - Utilisateurs Palimpseste
 * 
 * Dépendances: utils.js, followers.js (pour renderUserCard, toggleFollow, loadUserFollowing)
 */

// ═══════════════════════════════════════════════════════════
// 🔍 ÉTAT DE LA RECHERCHE
// ═══════════════════════════════════════════════════════════

let searchResults = {
    wikisource: [],
    poetrydb: [],
    gutenberg: [],
    users: []
};
let currentSearchTab = 'all';
let currentSearchQuery = '';

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
    
    // Afficher l'overlay avec loading
    const overlay = document.getElementById('searchResultsOverlay');
    const grid = document.getElementById('searchResultsGrid');
    const tabs = document.getElementById('searchResultsTabs');
    
    document.getElementById('searchQueryDisplay').textContent = query;
    overlay.classList.add('open');
    
    grid.innerHTML = '<div class="search-loading"><div class="spinner"></div><p>Recherche en cours...</p></div>';
    tabs.innerHTML = '';
    
    // Réinitialiser les résultats
    searchResults = { wikisource: [], poetrydb: [], gutenberg: [], users: [] };
    
    // Lancer les recherches en parallèle
    toast('🔍 Recherche...');
    
    await Promise.all([
        searchWikisource(query),
        searchPoetryDB(query),
        searchGutenberg(query),
        searchUsers(query)
    ]);
    
    // Afficher les résultats
    renderSearchTabs();
    renderSearchResults('all');
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
            
            // Compter les extraits pour chaque user
            searchResults.users = await Promise.all(users.map(async (u) => {
                const { count } = await supabaseClient
                    .from('extraits')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', u.id);
                return {
                    ...u,
                    extraitCount: count || 0,
                    source: 'users'
                };
            }));
        }
    } catch (e) {
        console.error('User search error:', e);
    }
}

// ═══════════════════════════════════════════════════════════
// 📜 RECHERCHE WIKISOURCE
// ═══════════════════════════════════════════════════════════

/**
 * Recherche sur Wikisource (multi-langues)
 */
async function searchWikisource(query) {
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
async function searchPoetryDB(query) {
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
async function searchGutenberg(query) {
    try {
        const res = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        
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
    const totalAll = searchResults.wikisource.length + searchResults.poetrydb.length + searchResults.gutenberg.length;
    const usersCount = searchResults.users?.length || 0;
    
    tabs.innerHTML = `
        <button class="search-tab ${currentSearchTab === 'users' ? 'active' : ''}" onclick="switchSearchTab('users')">
            Utilisateurs <span class="count">${usersCount}</span>
        </button>
        <button class="search-tab ${currentSearchTab === 'all' ? 'active' : ''}" onclick="switchSearchTab('all')">
            Textes <span class="count">${totalAll}</span>
        </button>
        <button class="search-tab ${currentSearchTab === 'wikisource' ? 'active' : ''}" onclick="switchSearchTab('wikisource')">
            Wikisource <span class="count">${searchResults.wikisource.length}</span>
        </button>
        <button class="search-tab ${currentSearchTab === 'poetrydb' ? 'active' : ''}" onclick="switchSearchTab('poetrydb')">
            Poésie <span class="count">${searchResults.poetrydb.length}</span>
        </button>
        <button class="search-tab ${currentSearchTab === 'gutenberg' ? 'active' : ''}" onclick="switchSearchTab('gutenberg')">
            Gutenberg <span class="count">${searchResults.gutenberg.length}</span>
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
    
    let results = [];
    if (tab === 'all') {
        results = [
            ...searchResults.wikisource,
            ...searchResults.poetrydb,
            ...searchResults.gutenberg
        ];
    } else {
        results = searchResults[tab] || [];
    }
    
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
    
    grid.innerHTML = results.map((r, idx) => {
        const sourceIcon = r.source === 'wikisource' ? '§' : r.source === 'poetrydb' ? '❧' : '¶';
        const sourceName = r.source === 'wikisource' ? 'Wikisource' : r.source === 'poetrydb' ? 'PoetryDB' : 'Gutenberg';
        const author = r.author || extractAuthorFromTitle(r.title) || '';
        
        // Nettoyer le snippet HTML
        let snippet = r.snippet || '';
        snippet = snippet.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        
        // Highlight query dans le snippet
        const queryRegex = new RegExp(`(${escapeRegex(currentSearchQuery)})`, 'gi');
        snippet = snippet.replace(queryRegex, '<mark>$1</mark>');
        
        return `
            <div class="search-result-card" onclick="openSearchResult(${idx}, '${r.source}')">
                <div class="search-result-title">${escapeHtml(r.title)}</div>
                ${author ? `<div class="search-result-author">${escapeHtml(author)}</div>` : ''}
                <div class="search-result-snippet">${snippet}</div>
                <div class="search-result-meta">
                    <span class="search-result-source">${sourceIcon} ${sourceName}</span>
                    ${r.lang ? `<span>🌐 ${r.lang.toUpperCase()}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
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
async function openSearchResult(idx, source) {
    let result;
    if (currentSearchTab === 'all') {
        const allResults = [
            ...searchResults.wikisource,
            ...searchResults.poetrydb,
            ...searchResults.gutenberg
        ];
        result = allResults[idx];
    } else {
        result = searchResults[currentSearchTab]?.[idx];
    }
    
    if (!result) return;
    
    closeSearchResults();
    toast('Chargement...');
    
    if (result.source === 'wikisource') {
        // Charger le texte depuis Wikisource
        const text = await fetchText(result.title, 0, result.wikisource);
        if (text) {
            document.getElementById('feed').innerHTML = '';
            state.cardIdx = 0;
            renderCard(text, result.title, result.wikisource);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            toast('Impossible de charger ce texte');
        }
    } else if (result.source === 'poetrydb') {
        // Afficher directement le poème
        document.getElementById('feed').innerHTML = '';
        state.cardIdx = 0;
        renderCard({
            title: result.title,
            text: result.lines?.join('\n') || result.snippet,
            author: result.author,
            source: 'poetrydb'
        }, result.title, { lang: 'en', url: 'https://poetrydb.org', name: 'PoetryDB' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (result.source === 'gutenberg') {
        // Ouvrir le livre sur Gutenberg
        const readUrl = `https://www.gutenberg.org/ebooks/${result.id}`;
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
