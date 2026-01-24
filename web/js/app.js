// ═══════════════════════════════════════════════════════════
// 🔥 TENDANCES → trending.js
// 📤 PARTAGE → share.js
// 📱 FEED SOCIAL → social.js
// 💬 COMMENTAIRES → comments.js
// 💬 MESSAGERIE → messaging.js
// 👥 FOLLOWERS/PROFILS → followers.js
// ═══════════════════════════════════════════════════════════

async function loadUserStats() {
    if (!supabaseClient || !currentUser) return;
    
    // Compter les extraits
    const { count: extraitCount } = await supabaseClient
        .from('extraits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);
    
    // Compter les vrais likes reçus (depuis la table likes)
    const { data: myExtraits } = await supabaseClient
        .from('extraits')
        .select('id')
        .eq('user_id', currentUser.id);
    
    let totalLikes = 0;
    if (myExtraits && myExtraits.length > 0) {
        const extraitIds = myExtraits.map(e => e.id);
        const { count: likesCount } = await supabaseClient
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .in('extrait_id', extraitIds);
        totalLikes = likesCount || 0;
    }
    
    document.getElementById('myExtraitsCount').textContent = extraitCount || 0;
    document.getElementById('myLikesCount').textContent = totalLikes;
    
    // Aussi afficher le nombre d'abonnés
    const { count: followersCount } = await supabaseClient
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', currentUser.id);
}

// Helpers formatTimeAgo et escapeHtml sont dans utils.js

function openMyProfile() {
    closeUserDropdown();
    switchSocialTab('mine');
    openSocialFeed();
}

// ═══════════════════════════════════════════════════════════
// 💬 MESSAGERIE → messaging.js
// 🔔 NOTIFICATIONS → notifications.js
// ═══════════════════════════════════════════════════════════

// Fonction pour partager depuis une carte
function shareCardExtrait(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const text = card.dataset.text || '';
    const author = card.dataset.author || 'Inconnu';
    const title = card.dataset.title || 'Sans titre';
    
    // Récupérer la sélection si elle existe, sinon utiliser le teaser
    const selection = window.getSelection().toString().trim();
    const textToShare = selection.length >= 20 ? selection : text.substring(0, 500);
    
    // Construire l'URL Wikisource
    const lang = card.dataset.lang || 'fr';
    const sourceUrl = `https://${lang}.wikisource.org/wiki/${encodeURIComponent(title)}`;
    
    openShareModal(textToShare, author, title, sourceUrl);
}

// Partager rapidement et ouvrir les commentaires
async function quickShareAndComment(cardId) {
    if (!currentUser) {
        openAuthModal('login');
        toast('📝 Connectez-vous pour commenter');
        return;
    }
    
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const text = card.dataset.text || '';
    const author = card.dataset.author || 'Inconnu';
    const title = card.dataset.title || 'Sans titre';
    const lang = card.dataset.lang || 'fr';
    const sourceUrl = `https://${lang}.wikisource.org/wiki/${encodeURIComponent(title)}`;
    
    // Récupérer la sélection ou le teaser
    const selection = window.getSelection().toString().trim();
    const textToShare = selection.length >= 20 ? selection : text.substring(0, 500);
    
    // Vérifier si cet extrait existe déjà (même texte, même source)
    if (supabaseClient) {
        const { data: existing } = await supabaseClient
            .from('extraits')
            .select('id')
            .eq('texte', textToShare)
            .eq('source_title', title)
            .eq('user_id', currentUser.id)
            .maybeSingle();
        
        if (existing) {
            // Ouvrir le feed social et afficher cet extrait
            toast('📖 Cet extrait existe déjà, ouverture...');
            openSocialFeed();
            setTimeout(async () => {
                await viewExtraitById(existing.id);
                // Ouvrir les commentaires
                setTimeout(() => toggleComments(existing.id), 300);
            }, 300);
            return;
        }
        
        // Créer l'extrait directement
        const { data: newExtrait, error } = await supabaseClient
            .from('extraits')
            .insert({
                user_id: currentUser.id,
                texte: textToShare,
                source_title: title,
                source_author: author,
                source_url: sourceUrl,
                commentary: '',
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) {
            console.error('Erreur création extrait:', error);
            toast('❌ Erreur: ' + error.message);
            return;
        }
        
        toast('✅ Extrait partagé ! Ajoutez votre commentaire');
        
        // Ouvrir le feed social et afficher cet extrait avec les commentaires ouverts
        openSocialFeed();
        setTimeout(async () => {
            await viewExtraitById(newExtrait.id);
            // Ouvrir les commentaires automatiquement
            setTimeout(() => toggleComments(newExtrait.id), 300);
        }, 300);
    }
}

// ═══════════════════════════════════════════════════════════
// 🌍 CONFIGURATION MULTILINGUE - Littérature mondiale
// ═══════════════════════════════════════════════════════════
const WIKISOURCES = [
    { lang: 'fr', name: 'Français', url: 'https://fr.wikisource.org' },
    { lang: 'en', name: 'English', url: 'https://en.wikisource.org' },
    { lang: 'de', name: 'Deutsch', url: 'https://de.wikisource.org' },
    { lang: 'it', name: 'Italiano', url: 'https://it.wikisource.org' },
    { lang: 'es', name: 'Español', url: 'https://es.wikisource.org' },
    { lang: 'pt', name: 'Português', url: 'https://pt.wikisource.org' },
    { lang: 'ru', name: 'Русский', url: 'https://ru.wikisource.org' },
    { lang: 'la', name: 'Latina', url: 'https://la.wikisource.org' },
    { lang: 'zh', name: '中文', url: 'https://zh.wikisource.org' },
    { lang: 'ja', name: '日本語', url: 'https://ja.wikisource.org' },
    { lang: 'ar', name: 'العربية', url: 'https://ar.wikisource.org' },
    { lang: 'el', name: 'Ελληνικά', url: 'https://el.wikisource.org' },
];

// Sources alternatives (APIs propres sans scories)
const ALT_SOURCES = {
    poetrydb: {
        name: 'PoetryDB',
        url: 'https://poetrydb.org',
        lang: 'en',
        // Auteurs disponibles dans PoetryDB
        authors: ['Shakespeare', 'Emily Dickinson', 'William Blake', 'John Keats', 
                  'Percy Shelley', 'Lord Byron', 'William Wordsworth', 'Edgar Allan Poe',
                  'Walt Whitman', 'Robert Frost', 'Oscar Wilde', 'Alfred Tennyson']
    },
    gutenberg: {
        name: 'Project Gutenberg',
        url: 'https://www.gutenberg.org',
        // Œuvres populaires avec leurs IDs Gutenberg (domaine public)
        works: [
            { id: 1342, title: 'Pride and Prejudice', author: 'Jane Austen', lang: 'en' },
            { id: 11, title: 'Alice\'s Adventures in Wonderland', author: 'Lewis Carroll', lang: 'en' },
            { id: 84, title: 'Frankenstein', author: 'Mary Shelley', lang: 'en' },
            { id: 1661, title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', lang: 'en' },
            { id: 2701, title: 'Moby Dick', author: 'Herman Melville', lang: 'en' },
            { id: 1232, title: 'The Prince', author: 'Niccolò Machiavelli', lang: 'en' },
            { id: 174, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', lang: 'en' },
            { id: 345, title: 'Dracula', author: 'Bram Stoker', lang: 'en' },
            { id: 1400, title: 'Great Expectations', author: 'Charles Dickens', lang: 'en' },
            { id: 98, title: 'A Tale of Two Cities', author: 'Charles Dickens', lang: 'en' },
            { id: 2600, title: 'War and Peace', author: 'Leo Tolstoy', lang: 'en' },
            { id: 2554, title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', lang: 'en' },
            { id: 4300, title: 'Ulysses', author: 'James Joyce', lang: 'en' },
            { id: 1080, title: 'A Modest Proposal', author: 'Jonathan Swift', lang: 'en' },
            { id: 76, title: 'Adventures of Huckleberry Finn', author: 'Mark Twain', lang: 'en' },
            { id: 74, title: 'The Adventures of Tom Sawyer', author: 'Mark Twain', lang: 'en' },
            { id: 219, title: 'Heart of Darkness', author: 'Joseph Conrad', lang: 'en' },
            { id: 5200, title: 'Metamorphosis', author: 'Franz Kafka', lang: 'en' },
            { id: 1952, title: 'The Yellow Wallpaper', author: 'Charlotte Perkins Gilman', lang: 'en' },
            { id: 120, title: 'Treasure Island', author: 'Robert Louis Stevenson', lang: 'en' },
            // Français
            { id: 17489, title: 'Les Misérables', author: 'Victor Hugo', lang: 'fr' },
            { id: 13951, title: 'Le Comte de Monte-Cristo', author: 'Alexandre Dumas', lang: 'fr' },
            { id: 14287, title: 'Les Trois Mousquetaires', author: 'Alexandre Dumas', lang: 'fr' },
            { id: 4650, title: 'Du côté de chez Swann', author: 'Marcel Proust', lang: 'fr' },
            { id: 17396, title: 'Madame Bovary', author: 'Gustave Flaubert', lang: 'fr' },
            { id: 13704, title: 'Le Rouge et le Noir', author: 'Stendhal', lang: 'fr' },
            { id: 5053, title: 'Germinal', author: 'Émile Zola', lang: 'fr' },
            // Autres langues
            { id: 2000, title: 'Don Quixote', author: 'Miguel de Cervantes', lang: 'es' },
            { id: 1012, title: 'The Divine Comedy', author: 'Dante Alighieri', lang: 'it' },
            { id: 2229, title: 'The Sorrows of Young Werther', author: 'Johann Wolfgang von Goethe', lang: 'de' },
            { id: 7849, title: 'Faust', author: 'Johann Wolfgang von Goethe', lang: 'de' }
        ]
    }
};

// Mots-clés de recherche par langue (termes qui fonctionnent bien sur Wikisource)
const SEARCH_TERMS = {
    fr: [
        'Les Fleurs du Mal', 'Fables de La Fontaine', 'Les Contemplations',
        'Baudelaire', 'Hugo poème', 'Verlaine', 'Rimbaud',
        'Maupassant nouvelle', 'Balzac', 'Zola chapitre',
        'Molière acte', 'Racine tragédie', 'La Fontaine fable',
        'Musset poésie', 'Lamartine méditation', 'Nerval sonnet',
        'Flaubert', 'Stendhal', 'Voltaire conte'
    ],
    en: [
        'Shakespeare sonnet', 'Milton Paradise', 'Keats ode',
        'Byron poem', 'Shelley', 'Wordsworth', 'Blake songs',
        'Dickens chapter', 'Austen', 'Poe tale',
        'Whitman leaves', 'Dickinson poem', 'Tennyson'
    ],
    de: [
        'Goethe Faust', 'Schiller', 'Heine Gedicht',
        'Rilke', 'Novalis', 'Hölderlin', 'Grimm Märchen',
        'Kafka', 'Mann Kapitel', 'Nietzsche'
    ],
    it: [
        'Dante Divina', 'Petrarca sonetto', 'Leopardi canto',
        'Manzoni capitolo', 'Boccaccio novella', 'Ariosto',
        'Pirandello', 'Foscolo', 'Carducci'
    ],
    es: [
        'Cervantes Quijote', 'Góngora soneto', 'Quevedo',
        'Lorca poema', 'Machado', 'Bécquer rima',
        'Calderón', 'Lope de Vega'
    ],
    pt: ['Camões soneto', 'Pessoa poema', 'Eça de Queirós', 'Machado de Assis'],
    ru: ['Пушкин стихотворение', 'Толстой глава', 'Достоевский', 'Чехов рассказ', 'Лермонтов'],
    la: ['Vergilius Aeneis', 'Horatius ode', 'Ovidius', 'Cicero', 'Catullus carmen'],
    zh: ['李白 詩', '杜甫', '蘇軾', '白居易'],
    ja: ['芥川龍之介', '夏目漱石', '太宰治', '宮沢賢治'],
    ar: ['المتنبي قصيدة', 'أبو تمام', 'البحتري'],
    el: ['Ομήρου', 'Σαπφώ', 'Πίνδαρος'],
};

// État de la langue courante ('all' = toutes langues, ou code langue spécifique)
let selectedLang = 'all';
let currentWikisource = WIKISOURCES[0];

// Fonction pour changer la langue
function changeLanguage(lang) {
    selectedLang = lang;
    localStorage.setItem('palimpseste_lang', lang);
    toast(lang === 'all' ? '🌍 Toutes les langues activées' : `🌐 Langue: ${WIKISOURCES.find(w => w.lang === lang)?.name || lang}`);
    // Recharger le feed avec la nouvelle langue
    shuffleFeed();
}

// Récupérer les Wikisources selon le filtre de langue
function getActiveWikisources() {
    if (selectedLang === 'all') return WIKISOURCES;
    return WIKISOURCES.filter(w => w.lang === selectedLang);
}

const GENRE_COLORS = {
    'poésie': '#bf5af2', 'poetry': '#bf5af2', 'Gedicht': '#bf5af2', 'poesia': '#bf5af2', 'poema': '#bf5af2',
    'fable': '#30d158', 'Fabel': '#30d158', 'favola': '#30d158', 'fábula': '#30d158',
    'conte': '#ff9f0a', 'tale': '#ff9f0a', 'Märchen': '#ff9f0a', 'racconto': '#ff9f0a', 'cuento': '#ff9f0a',
    'nouvelle': '#ff453a', 'story': '#ff453a', 'Novelle': '#ff453a', 'novella': '#ff453a',
    'théâtre': '#64d2ff', 'drama': '#64d2ff', 'theater': '#64d2ff', 'teatro': '#64d2ff',
    'texte': '#6e6e73', 'text': '#6e6e73',
    'mystique': '#ffd60a', 'mystic': '#ffd60a',
    'philosophie': '#ac8e68', 'philosophy': '#ac8e68',
    'roman': '#ff6482', 'novel': '#ff6482', 'Roman': '#ff6482', 'romanzo': '#ff6482'
};

// Graphe dynamique des connexions (enrichi au fur et à mesure)
let authorConnections = {};

let state = {
    likes: new Set(), readCount: 0, loading: false, cache: new Map(),
    textPool: [], shownPages: new Set(), cardIdx: 0,
    authorStats: {}, genreStats: {},
    likedAuthors: new Set(), discoveredConnections: new Set(),
    achievements: [], readingPath: [],
    // Statistiques de lecture
    readingStats: {
        totalWordsRead: 0,
        totalReadingTime: 0, // en secondes
        streak: 0,
        lastReadDate: null,
        sessionsToday: 0,
        bestStreak: 0,
        dailyWords: {} // { 'YYYY-MM-DD': wordsCount }
    }
};

// Timer de lecture
let readingTimer = null;
let sessionStartTime = null;


// Recherche via l'API - supporte plusieurs Wikisources
async function searchTexts(query, limit = 20, wikisource = currentWikisource) {
    const url = `${wikisource.url}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${limit}&srnamespace=0&format=json&origin=*`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        const results = (data.query?.search || []).map(r => ({ ...r, lang: wikisource.lang, wikisource }));

        return results;
    } catch (e) { 
        console.error('searchTexts error:', e);
        return []; 
    }
}

// Récupère le texte avec gestion intelligente (multilingue)
async function fetchText(page, depth = 0, wikisource = currentWikisource) {
    if (depth > 4) {

        return null;
    }
    
    // Filtrage précoce des pages indésirables
    if (!isValidTitle(page)) {

        return null;
    }
    
    const cacheKey = `${wikisource.lang}:${page}`;
    if (state.cache.has(cacheKey)) return state.cache.get(cacheKey);

    // Requête enrichie : texte + catégories + liens pour analyse du graphe
    const url = `${wikisource.url}/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=text|displaytitle|categories|links&pllimit=500&format=json&origin=*&redirects=true`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) return null;
        
        if (data.parse?.text) {
            // Vérifier le displaytitle aussi
            const displayTitle = data.parse.displaytitle || '';
            if (!isValidTitle(displayTitle)) return null;
            
            const html = data.parse.text['*'];
            const links = data.parse.links || [];
            
            // ═══ ANALYSE DU GRAPHE DES LIENS ═══
            // Compter les liens vers des sous-pages (même préfixe + "/")
            const basePage = page.split('/')[0];
            const subPageLinks = links.filter(l => {
                const title = l['*'] || '';
                return title.startsWith(basePage + '/') && l.ns === 0;
            });
            
            // Si la page a beaucoup de liens vers ses sous-pages, c'est un sommaire
            const isLikelySommaire = subPageLinks.length >= 5;
            
            if (isLikelySommaire && subPageLinks.length > 0) {
                // Choisir une sous-page au hasard et la suivre
                const randomSub = subPageLinks[Math.floor(Math.random() * subPageLinks.length)];

                return await fetchText(randomSub['*'], depth + 1, wikisource);
            }
            
            const analysis = analyzeHtml(html);
            
            // Si page d'index classique (redirections, éditions multiples)
            if (analysis.isIndex && analysis.subLink) {
                return await fetchText(analysis.subLink, depth + 1, wikisource);
            }
            
            // ═══ ANALYSE STATISTIQUE DE QUALITÉ ═══
            // Filtrage des "faux textes" (pages de garde, listes, etc.)
            const quality = analyzeContentQuality(analysis.text, links, page);
            if (!quality.isGood) {

                 // Si c'est rejeté parce que c'est un sommaire/liste, on essaie de trouver un lien pertinent
                 if (quality.reason === 'link_density' || quality.reason === 'listy') {
                     const contentLinks = links.filter(l => l.ns === 0 && !l['*'].includes(':'));
                     if (contentLinks.length > 0) {
                         const randomLink = contentLinks[Math.floor(Math.random() * contentLinks.length)];
                         return await fetchText(randomLink['*'], depth + 1, wikisource);
                     }
                 }
                 return null;
            }

            if (analysis.text && analysis.text.length > 150) {
                // Nettoyer le titre (supprimer HTML et spans)
                let cleanTitle = (data.parse.displaytitle || page)
                    .replace(/<[^>]+>/g, '')  // Supprimer tout HTML
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/mw-page-title[^\s]*/gi, '')  // Supprimer classes MW résiduelles
                    .trim();
                
                // Double vérification du titre nettoyé
                if (!isValidTitle(cleanTitle)) return null;
                
                // ===== DÉTECTION AUTEUR (multilingue) =====
                let detectedAuthor = null;
                
                // 1. Chercher dans les liens de la page (liens "Auteur:XXX" / "Author:XXX" / etc.)
                const authorPrefixes = ['Auteur:', 'Author:', 'Autor:', 'Autore:', '作者:'];
                const links = data.parse.links || [];
                for (const link of links) {
                    const linkTitle = link['*'] || '';
                    for (const prefix of authorPrefixes) {
                        if (linkTitle.startsWith(prefix)) {
                            const authorName = linkTitle.replace(prefix, '').trim();
                            if (authorName.length > 2 && authorName.length < 50) {
                                detectedAuthor = authorName;
                                break;
                            }
                        }
                    }
                    if (detectedAuthor) break;
                }
                
                // 2. Chercher dans les catégories (patterns multilingues)
                if (!detectedAuthor) {
                    const categories = data.parse.categories || [];
                    for (const cat of categories) {
                        const catName = cat['*'] || '';
                        // Patterns multilingues
                        const authorMatch = catName.match(/(?:Textes|Poèmes|Œuvres|Works|Texts|Poems|Werke|Opere|Obras)\s+(?:de|by|von|di)\s+(.+)/i);
                        if (authorMatch && authorMatch[1].length > 2) {
                            detectedAuthor = authorMatch[1].trim();
                            break;
                        }
                    }
                }
                
                // 3. Chercher un lien Auteur: dans le HTML
                if (!detectedAuthor) {
                    detectedAuthor = analysis.authorFromHtml;
                }
                
                const result = { 
                    text: analysis.text, 
                    title: cleanTitle,
                    author: detectedAuthor,
                    lang: wikisource.lang,
                    wikisource: wikisource
                };
                state.cache.set(cacheKey, result);
                return result;
            }
        }
        return null;
    } catch (e) { return null; }
}

function analyzeHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // ===== EXTRAIRE L'AUTEUR DEPUIS LE HTML =====
    let authorFromHtml = null;
    
    // 1. Chercher les liens "Auteur:XXX" dans le HTML
    const authorLinks = div.querySelectorAll('a[href*="Auteur:"]');
    for (const a of authorLinks) {
        const href = a.getAttribute('href') || '';
        const match = href.match(/Auteur:([^"&?#]+)/);
        if (match) {
            authorFromHtml = decodeURIComponent(match[1]).replace(/_/g, ' ').trim();
            break;
        }
    }
    
    // 2. Chercher dans les éléments de header/metadata Wikisource
    if (!authorFromHtml) {
        const headerAuthor = div.querySelector('.ws-author, .author, .auteur, [class*="auteur"]');
        if (headerAuthor) {
            const authorText = headerAuthor.textContent.trim();
            if (authorText.length > 2 && authorText.length < 50) {
                authorFromHtml = authorText;
            }
        }
    }
    
    // 3. Chercher le pattern "par XXX" ou "de XXX" en début de page
    if (!authorFromHtml) {
        const firstLines = div.textContent.substring(0, 500);
        const parMatch = firstLines.match(/(?:^|\n)\s*(?:par|de)\s+([A-ZÀ-Ü][a-zà-ü]+(?:\s+(?:de\s+)?[A-ZÀ-Ü][a-zà-ü\-]+){0,3})\s*(?:\n|$)/m);
        if (parMatch && parMatch[1].length > 3 && parMatch[1].length < 40) {
            authorFromHtml = parMatch[1].trim();
        }
    }
    
    // Supprimer tous les spans avec page-title AVANT toute analyse
    div.querySelectorAll('span[class*="page-title"], .mw-page-title-main, .mw-page-title').forEach(el => el.remove());
    
    // Détecter page d'index/sommaire (simplifié - seulement les cas évidents)
    const isRedirect = !!div.querySelector('.redirectMsg');
    const txt = div.textContent;
    const hasEditions = txt.includes('propose plusieurs éditions') || 
                       txt.includes('Cette page répertorie');
    
    // Seulement les redirections et pages d'éditions multiples sont des index
    const isIndex = isRedirect || hasEditions;
    
    // Trouver un sous-lien utile si c'est un index
    let subLink = null;
    if (isIndex) {
        const links = div.querySelectorAll('a[href^="/wiki/"]');
        for (const a of links) {
            const href = a.getAttribute('href');
            if (href && !href.includes(':') && !href.includes('Auteur') && !href.includes('Discussion')) {
                const name = decodeURIComponent(href.replace('/wiki/', ''));
                // Chercher des pages qui ressemblent à du contenu réel
                if (name.includes('/') && !name.endsWith('/')) {
                    // Éviter les pages de métadonnées
                    if (!name.includes('Préface') && !name.includes('Notice') && 
                        !name.includes('Table') && !name.includes('Index')) {
                        subLink = name;
                        break;
                    }
                }
            }
        }
    }
    
    // Nettoyer - supprimer tous les éléments non désirés
    div.querySelectorAll('.ws-noexport, .noprint, .mw-editsection, script, style, .reference, .toc, .navbox, .infobox, .metadata, .hatnote, .ambox, .catlinks, .mw-headline, .redirectMsg, .homonymie, .bandeau-homonymie, .bandeau-portail, .headertemplate, .ws-header, .mw-page-title-main, .mw-page-title, span[class*="page-title"], .titreoeuvre, .auteur-oeuvre, .header').forEach(el => el.remove());
    
    let content = div.querySelector('.prp-pages-output, .poem') || div.querySelector('.mw-parser-output') || div;
    
    // Supprimer TOUS les spans de MediaWiki
    content.querySelectorAll('span').forEach(el => {
        const cls = el.className || '';
        if (cls.includes('page-title') || cls.includes('mw-') || cls.includes('ws-')) {
            el.remove();
        }
    });
    
    let text = content.innerText || content.textContent;
    
    // Nettoyer les résidus HTML et MediaWiki
    text = text.replace(/\[modifier[^\]]*\]/g, '').replace(/\[\d+\]/g, '')
               .replace(/modifier le wikicode/gi, '').replace(/\n{3,}/g, '\n\n')
               .replace(/<span[^>]*>|<\/span>/gi, '')  // Supprimer spans résiduels
               .replace(/<[^>]+>/g, '')  // Supprimer tout HTML résiduel
               .replace(/mw-page-title[^\s]*/gi, '')  // Supprimer classes MW
               .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
               .replace(/Poésies \([^)]+\)/g, '')  // Supprimer titres de recueils parasites
               .trim();
    
    // Enlever métadonnées, préfaces, mentions de conférence en début
    const lines = text.split('\n');
    let start = 0;
    for (let i = 0; i < Math.min(15, lines.length); i++) {
        const l = lines[i].toLowerCase();
        const line = lines[i].trim();
        if (l.includes('sommaire') || l.includes('édition') || l.includes('navigation') || 
            l.includes('conférence') || l.includes('présenté') || l.includes('siège') ||
            l.includes('présidée par') || l.includes('professeur') || l.includes('faculté') ||
            l.includes('mw-page-title') || l.includes('span class') ||
            line.length < 3 || (line.startsWith('(') && line.endsWith(')'))) {
            start = i + 1;
        } else if (line.length > 40) break;
    }
    text = lines.slice(start).join('\n').trim();
    
    if (text.length > 5000) {
        text = text.substring(0, 5000);
        const cut = Math.max(text.lastIndexOf('\n\n'), text.lastIndexOf('. '));
        if (cut > 4000) text = text.substring(0, cut + 1);
        text += '\n\n[...]';
    }
    
    // ═══ DÉTECTION ROBUSTE DES SCORIES ═══
    if (isLikelyJunk(text)) {
        return { text: '', isIndex: true, subLink, authorFromHtml };
    }
    
    return { text, isIndex, subLink, authorFromHtml };
}

// ═══════════════════════════════════════════════════════════
// 🛡️ FILTRE MINIMAL - On laisse le graphe des liens faire le travail
// ═══════════════════════════════════════════════════════════
function isLikelyJunk(text) {
    // Filtre minimal : juste vérifier qu'il y a du contenu
    if (!text || text.length < 100) return true;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return true;
    return false;
}

// ═══════════════════════════════════════════════════════════
// 🕸️ EXPLORATION PAR ARBORESCENCE (Catégories)
// ═══════════════════════════════════════════════════════════

let currentCategoryPath = [];
let currentBrowseMode = null; // 'category' ou 'search'

// Branches enrichies par genre (auteurs majeurs + courants)
const GENRE_BRANCHES = {
    'philosophie': {
        'Courants': ['Rationalisme', 'Empirisme', 'Idéalisme', 'Existentialisme', 'Stoïcisme', 'Épicurisme', 'Scepticisme', 'Phénoménologie'],
        'Domaines': ['Métaphysique', 'Éthique', 'Épistémologie', 'Logique', 'Esthétique', 'Philosophie politique', 'Ontologie'],
        'Antiquité': ['Platon', 'Aristote', 'Épictète', 'Marc Aurèle', 'Sénèque', 'Cicéron', 'Lucrèce'],
        'XVIIe siècle': ['Descartes', 'Pascal', 'Spinoza', 'Leibniz', 'Malebranche', 'Hobbes', 'Locke'],
        'XVIIIe siècle': ['Voltaire', 'Rousseau', 'Montesquieu', 'Diderot', 'Hume', 'Kant', 'Condillac'],
        'XIXe siècle': ['Hegel', 'Schopenhauer', 'Nietzsche', 'Kierkegaard', 'Comte', 'Marx', 'Bergson']
    },
    'poésie': {
        'Formes': ['Sonnet', 'Ode', 'Élégie', 'Ballade', 'Fable', 'Épopée', 'Haïku'],
        'Mouvements': ['Romantisme', 'Parnasse', 'Symbolisme', 'Surréalisme', 'Baroque'],
        'XVIe siècle': ['Ronsard', 'Du Bellay', 'Louise Labé', 'Marot'],
        'XVIIe siècle': ['La Fontaine', 'Malherbe', 'Boileau', 'Racine'],
        'XIXe siècle': ['Hugo', 'Baudelaire', 'Verlaine', 'Rimbaud', 'Mallarmé', 'Lamartine', 'Musset', 'Nerval'],
        'XXe siècle': ['Apollinaire', 'Éluard', 'Aragon', 'Prévert', 'Char', 'Valéry']
    },
    'roman': {
        'Genres': ['Roman épistolaire', 'Roman historique', 'Roman réaliste', 'Roman naturaliste', 'Roman psychologique'],
        'XVIIe siècle': ['Madame de La Fayette', 'Scarron', 'Fénelon'],
        'XVIIIe siècle': ['Voltaire', 'Rousseau', 'Diderot', 'Laclos', 'Prévost', 'Bernardin de Saint-Pierre'],
        'XIXe siècle': ['Balzac', 'Stendhal', 'Flaubert', 'Zola', 'Maupassant', 'Hugo', 'Dumas', 'Sand'],
        'XXe siècle': ['Proust', 'Gide', 'Céline', 'Camus', 'Sartre', 'Colette']
    },
    'théâtre': {
        'Genres': ['Tragédie', 'Comédie', 'Drame', 'Farce', 'Vaudeville'],
        'Antiquité': ['Sophocle', 'Euripide', 'Eschyle', 'Aristophane', 'Plaute', 'Térence'],
        'XVIIe siècle': ['Molière', 'Racine', 'Corneille', 'Marivaux'],
        'XVIIIe siècle': ['Beaumarchais', 'Voltaire', 'Marivaux'],
        'XIXe siècle': ['Hugo', 'Musset', 'Rostand', 'Labiche'],
        'XXe siècle': ['Claudel', 'Giraudoux', 'Anouilh', 'Ionesco', 'Beckett']
    },
    'conte': {
        'Types': ['Conte merveilleux', 'Conte philosophique', 'Conte moral', 'Conte fantastique'],
        'Auteurs': ['Perrault', 'Grimm', 'Andersen', 'Voltaire', 'Maupassant', 'Hoffmann']
    },
    'nouvelle': {
        'Styles': ['Nouvelle réaliste', 'Nouvelle fantastique', 'Nouvelle psychologique'],
        'Auteurs': ['Maupassant', 'Mérimée', 'Balzac', 'Flaubert', 'Zola', 'Villiers de l\'Isle-Adam']
    },
    'mystique': {
        'Traditions': ['Mystique chrétienne', 'Mystique soufie', 'Kabbale'],
        'Auteurs': ['Thérèse d\'Avila', 'Jean de la Croix', 'Maître Eckhart', 'François de Sales', 'Fénelon', 'Bossuet']
    },
    'fable': {
        'Auteurs': ['La Fontaine', 'Ésope', 'Phèdre', 'Florian']
    },
    'histoire': {
        'Périodes': ['Antiquité', 'Moyen Âge', 'Renaissance', 'Révolution française', 'XIXe siècle'],
        'Historiens': ['Hérodote', 'Thucydide', 'Tacite', 'Michelet', 'Tocqueville', 'Voltaire']
    }
};

// Mappage des genres simples vers les catégories racines Wikisource
const CATEGORY_ROOTS = {
    fr: {
        'poésie': 'Catégorie:Poésie',
        'roman': 'Catégorie:Romans',
        'théâtre': 'Catégorie:Théâtre',
        'philosophie': 'Catégorie:Philosophie',
        'conte': 'Catégorie:Contes',
        'fable': 'Catégorie:Fables',
        'nouvelle': 'Catégorie:Nouvelles',
        'essai': 'Catégorie:Essais',
        'histoire': 'Catégorie:Histoire',
        'lettres': 'Catégorie:Correspondances',
        'mystique': 'Catégorie:Textes_spirituels'
    },
    en: {
        'poetry': 'Category:Poetry',
        'novel': 'Category:Novels',
        'drama': 'Category:Plays',
        'philosophy': 'Category:Philosophy',
        'tale': 'Category:Tales',
        'history': 'Category:History',
        'essay': 'Category:Essays'
    },
    de: {
        'Gedicht': 'Kategorie:Gedicht_Titel',
        'Roman': 'Kategorie:Roman',
        'Märchen': 'Kategorie:Märchen'
    }
};

async function exploreCategory(genreOrCategoryName, isSubCat = false) {
    const wikisource = currentWikisource;
    const lang = wikisource.lang;
    const genreLower = genreOrCategoryName.toLowerCase();
    
    // Afficher l'UI
    document.getElementById('categoryNav').style.display = 'block';
    document.getElementById('catSubcategories').innerHTML = '<div style="color:var(--muted)">Chargement...</div>';
    document.getElementById('feed').innerHTML = '';
    state.textPool = [];
    
    // Cas 1: C'est un genre racine avec branches enrichies
    if (!isSubCat && GENRE_BRANCHES[genreLower]) {
        currentCategoryPath = [genreOrCategoryName];
        currentBrowseMode = 'branches';
        renderBreadcrumbs();
        renderEnrichedBranches(genreLower);
        return;
    }
    
    // Cas 2: C'est une branche (recherche par terme)
    if (!isSubCat) {
        currentCategoryPath = [genreOrCategoryName];
    } else if (!currentCategoryPath.includes(genreOrCategoryName)) {
        currentCategoryPath.push(genreOrCategoryName);
    } else {
        const index = currentCategoryPath.indexOf(genreOrCategoryName);
        currentCategoryPath = currentCategoryPath.slice(0, index + 1);
    }
    
    renderBreadcrumbs();
    currentBrowseMode = 'search';
    
    // Rechercher sur Wikisource
    await searchByTerm(genreOrCategoryName, wikisource);
}

// Affiche les branches enrichies pour un genre
function renderEnrichedBranches(genre) {
    const branches = GENRE_BRANCHES[genre];
    if (!branches) return;
    
    const container = document.getElementById('catSubcategories');
    let html = '<div class="branches-container">';
    
    for (const [groupName, items] of Object.entries(branches)) {
        html += `<div class="branch-group">
            <div class="branch-group-title">${groupName}</div>
            <div class="branch-items">
                ${items.map(item => `<div class="cat-pill" onclick="exploreCategory('${item.replace(/'/g, "\\'")}', true)">${item}</div>`).join('')}
            </div>
        </div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Message d'info
    document.getElementById('feed').innerHTML = '<div class="empty-state">👆 Choisissez une branche ci-dessus pour explorer les textes</div>';
}

// Recherche par terme (auteur, courant, etc.)
async function searchByTerm(term, wikisource) {
    document.getElementById('catSubcategories').innerHTML = `<div style="color:var(--muted)">🔍 Recherche "${term}"...</div>`;
    
    try {
        // Recherche élargie sur Wikisource
        const results = await searchTexts(term, 50, wikisource);
        
        // Filtrer les résultats valides
        const validResults = results.filter(r => isValidTitle(r.title) && r.snippet?.length > 20);
        
        // Info sur les résultats
        const container = document.getElementById('catSubcategories');
        if (validResults.length > 0) {
            container.innerHTML = `<div style="font-size:0.8rem; color:var(--accent);">📚 ${validResults.length} texte${validResults.length > 1 ? 's' : ''} trouvé${validResults.length > 1 ? 's' : ''} pour "${term}"</div>`;
        } else {
            container.innerHTML = `<div style="font-size:0.8rem; color:var(--muted);">Aucun résultat pour "${term}"</div>`;
        }
        
        // Remplir le pool
        state.textPool = validResults.map(r => ({
            title: r.title,
            snippet: r.snippet,
            lang: wikisource.lang,
            wikisource: wikisource,
            source: 'search_exploration'
        }));
        
        // Mélanger et charger
        state.textPool = state.textPool.sort(() => Math.random() - 0.5);
        
        if (state.textPool.length > 0) {
            loadMore();
        } else {
            document.getElementById('feed').innerHTML = `<div class="empty-state">Aucun texte trouvé pour "${term}".<br>Essayez un autre terme.</div>`;
        }
        
    } catch (e) {
        console.error('Search error:', e);
        document.getElementById('catSubcategories').innerHTML = '<div style="color:var(--accent)">Erreur de recherche</div>';
    }
}

async function fetchCategoryData(categoryName, wikisource) {
    // Récupérer sous-catégories et pages
    const url = `${wikisource.url}/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(categoryName)}&cmlimit=100&format=json&origin=*`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        const members = data.query?.categorymembers || [];
        
        const subcats = members.filter(m => m.ns === 14); // 14 = Category
        const pages = members.filter(m => m.ns === 0);    // 0 = Page
        
        renderSubcategories(subcats, pages.length);
        
        // Remplir le pool avec les pages trouvées
        state.textPool = []; // Reset pour cette catégorie
        for (const p of pages) {
            if (isValidTitle(p.title)) {
                 state.textPool.push({
                     title: p.title,
                     lang: wikisource.lang,
                     wikisource: wikisource,
                     source: 'category_exploration'
                 });
            }
        }
        

        
        // Mélanger et charger
        state.textPool = state.textPool.sort(() => Math.random() - 0.5);
        
        if (state.textPool.length > 0) {
            loadMore();
        } else if (subcats.length === 0) {
            document.getElementById('feed').innerHTML = '<div class="empty-state">Aucun texte direct dans cette catégorie.<br>Essayez une autre branche.</div>';
        }
        
    } catch (e) {
        console.error('Category error:', e);
        document.getElementById('catSubcategories').innerHTML = '<div style="color:var(--accent)">Erreur de chargement</div>';
    }
}

function renderBreadcrumbs() {
    const container = document.getElementById('catBreadcrumbs');
    container.innerHTML = currentCategoryPath.map((cat, idx) => {
        const name = cat.split(':')[1] || cat;
        const isLast = idx === currentCategoryPath.length - 1;
        return `
            <span class="cat-crumb ${isLast ? 'active' : ''}" onclick="exploreCategory('${cat.replace(/'/g, "\\'")}', true)">${name}</span>
            ${!isLast ? '<span class="cat-sep">></span>' : ''}
        `;
    }).join('');
}

function renderSubcategories(subcats, pageCount = 0) {
    const container = document.getElementById('catSubcategories');
    
    let html = '';
    
    // Info sur les pages directes
    if (pageCount > 0) {
        html += `<div style="font-size:0.8rem; color:var(--accent); margin-bottom:0.5rem;">📚 ${pageCount} texte${pageCount > 1 ? 's' : ''} dans cette catégorie</div>`;
    }
    
    if (subcats.length === 0) {
        if (pageCount === 0) {
            html += '<div style="font-size:0.8rem; color:var(--muted); font-style:italic;">Catégorie vide ou sous-pages uniquement</div>';
        }
        container.innerHTML = html;
        return;
    }
    
    html += `<div style="font-size:0.75rem; color:var(--muted); margin-bottom:0.3rem;">↳ ${subcats.length} sous-catégorie${subcats.length > 1 ? 's' : ''} :</div>`;
    html += subcats.map(c => {
        const name = (c.title.split(':')[1] || c.title).replace(/_/g, ' ');
        return `<div class="cat-pill" onclick="exploreCategory('${c.title.replace(/'/g, "\\'")}', true)">${name}</div>`;
    }).join('');
    
    container.innerHTML = html;
}

function closeCategoryMode() {
    document.getElementById('categoryNav').style.display = 'none';
    currentCategoryPath = [];
    shuffleFeed(); // Revenir au mode normal
}

// ═══════════════════════════════════════════════════════════
// � PROJECT GUTENBERG - Classiques du domaine public
// ═══════════════════════════════════════════════════════════
async function fetchGutenberg() {
    const works = ALT_SOURCES.gutenberg.works;
    // Filtrer par langue si nécessaire
    const filtered = selectedLang === 'all' 
        ? works 
        : works.filter(w => w.lang === selectedLang);
    
    if (filtered.length === 0) return [];
    
    // Choisir une œuvre au hasard
    const work = filtered[Math.floor(Math.random() * filtered.length)];
    const cacheKey = `gutenberg:${work.id}`;
    
    // Éviter les doublons
    if (state.shownPages.has(cacheKey)) return [];
    
    try {
        // Utiliser l'API de téléchargement texte de Gutenberg
        const res = await fetch(`https://www.gutenberg.org/files/${work.id}/${work.id}-0.txt`, {
            mode: 'cors'
        }).catch(() => 
            // Fallback sur un autre format
            fetch(`https://www.gutenberg.org/cache/epub/${work.id}/pg${work.id}.txt`)
        );
        
        if (!res.ok) throw new Error('Gutenberg fetch failed');
        
        let text = await res.text();
        
        // Nettoyer le texte Gutenberg (retirer header/footer légaux)
        const startMarkers = ['*** START OF', '***START OF', 'START OF THE PROJECT'];
        const endMarkers = ['*** END OF', '***END OF', 'END OF THE PROJECT', 'End of Project'];
        
        for (const marker of startMarkers) {
            const idx = text.indexOf(marker);
            if (idx !== -1) {
                const nextLine = text.indexOf('\n', idx);
                text = text.substring(nextLine + 1);
                break;
            }
        }
        
        for (const marker of endMarkers) {
            const idx = text.indexOf(marker);
            if (idx !== -1) {
                text = text.substring(0, idx);
                break;
            }
        }
        
        // Prendre un extrait aléatoire (pas tout le livre!)
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 100);
        if (paragraphs.length > 10) {
            // Choisir un passage au hasard (pas le début)
            const startIdx = Math.floor(Math.random() * Math.max(1, paragraphs.length - 10)) + 5;
            const excerpt = paragraphs.slice(startIdx, startIdx + 5).join('\n\n');
            

            
            return [{
                title: work.title,
                text: excerpt.trim(),
                author: work.author,
                source: 'gutenberg',
                lang: work.lang,
                gutenbergId: work.id
            }];
        }
    } catch (e) {
        console.error('Gutenberg error:', work.title, e);
    }
    return [];
}

// ═══════════════════════════════════════════════════════════
// �📜 POETRYDB - Poésie anglaise de qualité (pas de scories!)
// ═══════════════════════════════════════════════════════════
async function fetchPoetryDB() {
    const authors = ALT_SOURCES.poetrydb.authors;
    const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
    
    try {
        const res = await fetch(`https://poetrydb.org/author/${encodeURIComponent(randomAuthor)}/title,author,lines`);
        const poems = await res.json();
        
        if (Array.isArray(poems) && poems.length > 0) {
            // Prendre quelques poèmes au hasard
            const shuffled = poems.sort(() => Math.random() - 0.5).slice(0, 5);

            
            return shuffled.map(poem => ({
                title: poem.title,
                text: poem.lines.join('\n'),
                author: poem.author,
                source: 'poetrydb',
                lang: 'en'
            }));
        }
    } catch (e) {
        console.error('PoetryDB error:', e);
    }
    return [];
}

// ═══════════════════════════════════════════════════════════
// 🌍 ALIMENTER LE POOL - Littérature mondiale
// ═══════════════════════════════════════════════════════════
async function fillPool() {
    // === 1. POETRYDB (si anglais actif) - Qualité garantie ===
    if (selectedLang === 'all' || selectedLang === 'en') {
        try {
            const poems = await fetchPoetryDB();
            for (const poem of poems) {
                if (!state.shownPages.has('poetrydb:' + poem.title)) {
                    // Ajouter EN PRIORITÉ (pas de scories!)
                    state.textPool.unshift({
                        title: poem.title,
                        text: poem.text,
                        author: poem.author,
                        lang: 'en',
                        source: 'poetrydb',
                        isPreloaded: true // Texte déjà chargé
                    });
                }
            }
        } catch (e) {
            console.error('PoetryDB fillPool error:', e);
        }
    }
    
    // === 1.5 PROJECT GUTENBERG - Classiques du domaine public ===
    try {
        const gutenbergTexts = await fetchGutenberg();
        for (const item of gutenbergTexts) {
            state.textPool.unshift({
                ...item,
                isPreloaded: true
            });
        }
    } catch (e) {
        console.error('Gutenberg fillPool error:', e);
    }
    
    // === 2. WIKISOURCE (sources traditionnelles) ===
    const activeSources = getActiveWikisources();
    if (activeSources.length === 0 && state.textPool.length === 0) {
        console.error('Aucune source active');
        return;
    }
    const shuffledSources = [...activeSources].sort(() => Math.random() - 0.5).slice(0, Math.min(3, activeSources.length));
    

    
    for (const ws of shuffledSources) {
        const terms = [...(SEARCH_TERMS[ws.lang] || SEARCH_TERMS.en)];
        const selectedTerms = terms.sort(() => Math.random() - 0.5).slice(0, 5);
        
        for (const term of selectedTerms) {
            try {
                const results = await searchTexts(term, 15, ws);
                for (const r of results) {
                    if (!state.shownPages.has(r.title) && !state.textPool.some(t => t.title === r.title)) {
                        // Filtrage généraliste par structure du titre
                        if (isValidTitle(r.title) && r.snippet?.length > 20) {
                            // Prioriser les sous-pages (contenu réel)
                            const item = { 
                                title: r.title, 
                                snippet: r.snippet, 
                                lang: ws.lang,
                                wikisource: ws 
                            };
                            if (r.title.includes('/')) {
                                state.textPool.unshift(item);
                            } else {
                                state.textPool.push(item);
                            }
                        }
                    }
                }
            } catch (e) { 
                console.error('fillPool error:', e);
            }
        }
    }
    state.textPool = [...state.textPool].sort(() => Math.random() - 0.5);
}

// Filtrage généraliste du titre (exclut les pages non littéraires)
function isValidTitle(title) {
    if (!title || title.length < 3) return false;
    const t = title.toLowerCase();
    
    // Exclure les namespaces spéciaux (universel)
    if (t.includes('category:') || t.includes('catégorie:') || 
        t.includes('kategorie:') || t.includes('categoria:')) return false;
    
    // Liste étendue des namespaces wiki
    if (/^(help|aide|hilfe|aiuto|ayuda|ajuda|manual|project|projet|image|file|fichier|template|modèle|module|media|special|spécial):/i.test(t)) return false;

    if (t.includes('author:') || t.includes('auteur:') || 
        t.includes('autor:') || t.includes('autore:')) return false;
    if (t.includes('talk:') || t.includes('discussion:') || 
        t.includes('diskussion:') || t.includes('discussione:')) return false;
    if (t.includes('index:') || t.includes('page:') || t.includes('file:')) return false;
    
    // Exclure les listes (pattern universel)
    if (/^list[ea]?\s+(de|of|di|von)/i.test(t)) return false;
    if (t.startsWith('index ') || t.endsWith(' index')) return false;
    if (t.includes('table des matières') || t.includes('table of contents') || t.includes('inhaltsverzeichnis')) return false;
    if (t.includes('bibliographie') || t.includes('bibliography')) return false;
    
    // Exclure les études biographiques et critiques (souvent des pages de garde)
    if (t.includes('sa vie et son œuvre') || t.includes('sa vie et son oeuvre')) return false;
    if (t.includes('his life and work') || t.includes('sein leben')) return false;
    if (t.includes('étude biographique') || t.includes('étude sur')) return false;
    if (t.includes('biographical study') || t.includes('biography of')) return false;
    if (/\bbiograph/i.test(t) && !t.includes('/')) return false;
    
    // Exclure les œuvres complètes sans sous-page (ce sont des sommaires)
    if ((t.includes('œuvres complètes') || t.includes('complete works') || 
         t.includes('gesammelte werke') || t.includes('opere complete')) && !t.includes('/')) return false;
    
    return true;
}

// ═══════════════════════════════════════════════════════════
// 🕵️ ANALYSE DE QUALITÉ DU CONTENU (Heuristiques)
// ═══════════════════════════════════════════════════════════
function analyzeContentQuality(text, links, title) {
    if (!text) return { isGood: false, reason: 'empty' };
    const len = text.length;
    
    // 1. Trop court = Fragment ou erreur
    if (len < 300) return { isGood: false, reason: 'too_short' };
    
    // 2. Trop long = Livre entier non découpé (mauvaise UX)
    if (len > 80000) return { isGood: false, reason: 'too_long' };
    
    // 3. Densité de liens (Link Density)
    // Si une page est composée à 20% de liens, c'est un sommaire/hub
    // On estime ~30 chars par lien en moyenne (titre + balise)
    const linkCharsEstimate = links.length * 30;
    const linkDensity = linkCharsEstimate / len;
    
    // Seuil : > 25% de liens = Sommaire
    if (linkDensity > 0.25) return { isGood: false, reason: 'link_density' };
    
    // 4. Structure "Paragraphe" vs "Liste"
    // Un vrai texte a des phrases qui finissent par des points.
    // Une liste a des retours à la ligne fréquents sans ponctuation.
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const avgLineLength = len / Math.max(1, lines.length);
    
    // Si lignes très courtes (< 50 chars) ET pas de ponctuation finale
    if (avgLineLength < 60) {
        // Exception pour la poésie : lignes courtes mais strophes
        // Vérifier la ponctuation
        const linesEndingWithPunctuation = lines.filter(l => /[.!?…:;]$/.test(l.trim())).length;
        const punctuationRatio = linesEndingWithPunctuation / lines.length;
        
        // Si peu de ponctuation finale (< 30%), c'est une liste brute
        if (punctuationRatio < 0.3) return { isGood: false, reason: 'listy' };
    }
    
    // 5. Structure Words (Meta-titres)
    const t = title.toLowerCase();
    const badWords = ['sommaire', 'contents', 'inhalt', 'table', 'index', 'chapitres', 'chapters'];
    if (badWords.some(w => t.includes(w))) return { isGood: false, reason: 'title_blacklist' };

    return { isGood: true };
}

// Normalise un nom d'auteur (simplifié - accepte tout nom valide)
function normalizeAuthor(rawAuthor) {
    if (!rawAuthor) return null;
    // Nettoyer le nom
    let clean = rawAuthor
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Vérifier que c'est un nom valide (commence par majuscule, longueur raisonnable)
    if (clean.length > 2 && clean.length < 60 && /^[A-ZÀ-ÜА-Яぁ-んァ-ン一-龯\u0600-\u06FF]/.test(clean)) {
        return clean;
    }
    return null;
}

function detectAuthor(title, text, metadataAuthor = null) {
    // 1. PRIORITÉ : Auteur des métadonnées Wikisource (liens, catégories)
    if (metadataAuthor) {
        const normalized = normalizeAuthor(metadataAuthor);
        if (normalized) return normalized;
    }
    
    // 2. Chercher dans le titre (format "Œuvre (Auteur)")
    const parenthMatch = title.match(/\(([^)]+)\)$/);
    if (parenthMatch) {
        const potentialAuthor = parenthMatch[1].trim();
        // Vérifier que ça ressemble à un nom de personne
        if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü]+)*$/.test(potentialAuthor)) {
            return potentialAuthor;
        }
    }
    
    // 3. Chercher dans le titre - format "Auteur - Œuvre" ou "Œuvre - Auteur"
    const dashMatch = title.match(/^([^—–\-]+)[—–\-](.+)$/);
    if (dashMatch) {
        const part1 = dashMatch[1].trim();
        const part2 = dashMatch[2].trim();
        // Tester si l'une des parties est un nom de personne
        if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü]+)*$/.test(part1)) return part1;
        if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü]+)*$/.test(part2)) return part2;
    }
    
    return 'Anonyme';
}

function detectTag(title, text) {
    const t = (title + ' ' + (text || '').substring(0, 500)).toLowerCase();
    const titleLower = title.toLowerCase();
    
    // Théâtre (prioritaire - mots très spécifiques)
    if (t.includes('acte ') || t.includes('scène ') || titleLower.includes('tragédie') || 
        titleLower.includes('comédie') || t.includes('personnages:') || t.includes('le chœur')) return 'théâtre';
    
    // Fable (prioritaire)
    if (titleLower.includes('fable') || (t.includes('morale') && t.includes('la fontaine'))) return 'fable';
    
    // Conte
    if (titleLower.includes('conte') || titleLower.includes('il était une fois')) return 'conte';
    
    // Poésie (mots spécifiques au genre)
    if (titleLower.includes('sonnet') || titleLower.includes('poème') || titleLower.includes('poésie') ||
        titleLower.includes('ode ') || titleLower.includes('ballade') || titleLower.includes('élégie') ||
        titleLower.includes('stances') || titleLower.includes('hymne') || titleLower.includes('rondeau') ||
        titleLower.includes('complainte') || titleLower.includes('chanson')) return 'poésie';
    // Détection poésie par structure (vers courts, rimes)
    const lines = (text || '').split('\n').slice(0, 20);
    const shortLines = lines.filter(l => l.trim().length > 5 && l.trim().length < 60);
    if (shortLines.length > 10) return 'poésie';
    
    // Nouvelle
    if (titleLower.includes('nouvelle')) return 'nouvelle';
    
    // Roman
    if (titleLower.includes('chapitre') || titleLower.includes('roman') || 
        titleLower.includes('livre ') || titleLower.includes('partie ')) return 'roman';
    
    // Philosophie (termes spécifiques)
    if (titleLower.includes('pensées') || titleLower.includes('maximes') || titleLower.includes('réflexions') ||
        titleLower.includes('essai') || titleLower.includes('discours sur') || titleLower.includes('traité') ||
        titleLower.includes('lettres à') || titleLower.includes('entretiens')) return 'philosophie';
    
    // Mystique (termes TRÈS spécifiques seulement)
    if (titleLower.includes('sermon') || titleLower.includes('oraison') || titleLower.includes('prière') ||
        titleLower.includes('méditation') || titleLower.includes('spirituel') || titleLower.includes('mystique') ||
        titleLower.includes('contemplation') || titleLower.includes('extase') || titleLower.includes('château intérieur') ||
        titleLower.includes('nuit obscure') || titleLower.includes('imitation de')) return 'mystique';
    
    return 'texte';
}

async function init() {
    // Initialiser Supabase (social features)
    initSupabase();
    
    // Vérifier si c'est un retour depuis un email de reset password
    checkPasswordResetToken();
    
    loadState();
    
    // Restaurer le choix de langue ou détecter automatiquement
    const savedLang = localStorage.getItem('palimpseste_lang');
    const validLangs = ['all', ...WIKISOURCES.map(w => w.lang)];
    
    if (savedLang && validLangs.includes(savedLang)) {
        // Utiliser la langue sauvegardée
        selectedLang = savedLang;
    } else {
        // Détecter la langue du navigateur
        const browserLang = (navigator.language || navigator.userLanguage || 'fr').split('-')[0].toLowerCase();
        // Si la langue du navigateur est supportée, l'utiliser, sinon français par défaut
        selectedLang = validLangs.includes(browserLang) ? browserLang : 'fr';
        localStorage.setItem('palimpseste_lang', selectedLang);
    }
    
    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = selectedLang;
    
    updateStats();
    updateConnections();
    renderAchievements();
    renderReadingPath();
    renderFavorites();
    updateFavCount();
    updateFunStat();
    
    document.getElementById('loading').style.display = 'block';
    await fillPool();
    document.getElementById('loading').style.display = 'none';
    await loadMore();
    
    // Mise à jour périodique du fun stat
    setInterval(updateFunStat, 15000);
    
    window.onscroll = () => {
        document.getElementById('progress').style.width = 
            (scrollY / (document.body.scrollHeight - innerHeight) * 100) + '%';
        if (innerHeight + scrollY >= document.body.scrollHeight - 800 && !state.loading) loadMore();
    };
}

function loadState() {
    try {
        const d = JSON.parse(localStorage.getItem('palimpseste') || '{}');
        state.likes = new Set(d.likes || []);
        state.readCount = d.readCount || 0;
        state.authorStats = d.authorStats || {};
        state.genreStats = d.genreStats || {};
        state.likedAuthors = new Set(d.likedAuthors || []);
        state.discoveredConnections = new Set(d.discoveredConnections || []);
        state.achievements = d.achievements || [];
        state.readingPath = d.readingPath || [];
        state.favorites = d.favorites || [];
        // Charger les stats de lecture
        state.readingStats = d.readingStats || {
            totalWordsRead: 0,
            totalReadingTime: 0,
            streak: 0,
            lastReadDate: null,
            sessionsToday: 0,
            bestStreak: 0,
            dailyWords: {}
        };
        // Vérifier et mettre à jour le streak au chargement
        checkAndUpdateStreak();
    } catch(e) {}
}

function saveState() {
    localStorage.setItem('palimpseste', JSON.stringify({ 
        likes: [...state.likes], 
        readCount: state.readCount,
        authorStats: state.authorStats,
        genreStats: state.genreStats,
        likedAuthors: [...state.likedAuthors],
        discoveredConnections: [...state.discoveredConnections],
        achievements: state.achievements || [],
        readingPath: state.readingPath || [],
        favorites: state.favorites || [],
        readingStats: state.readingStats
    }));
    updateStats();
}

function updateStats() {
    // Mettre à jour les stats du panneau
    document.getElementById('totalRead').textContent = state.readCount;
    document.getElementById('likeCountPanel').textContent = state.likes.size;
    document.getElementById('authorCount').textContent = Object.keys(state.authorStats).length;
    
    // Titre dynamique selon le contexte
    updateDynamicHeader();
    
    // Mettre à jour les barres d'auteurs
    renderAuthorBars();
    renderGenreChart();
    
    // Mettre à jour les statistiques de lecture
    updateReadingStatsUI();
}

// ═══════════════════════════════════════════════════════════
// 📊 STATISTIQUES DE LECTURE
// ═══════════════════════════════════════════════════════════

function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

function checkAndUpdateStreak() {
    const stats = state.readingStats;
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (!stats.lastReadDate) {
        stats.streak = 0;
    } else if (stats.lastReadDate === today) {
        // Déjà lu aujourd'hui, streak maintenu
    } else if (stats.lastReadDate === yesterday) {
        // A lu hier, streak continue (sera incrémenté quand il lit aujourd'hui)
    } else {
        // Streak cassé
        stats.streak = 0;
    }
}

function recordReading(wordCount) {
    const stats = state.readingStats;
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Ajouter les mots lus
    stats.totalWordsRead = (stats.totalWordsRead || 0) + wordCount;
    
    // Mots par jour
    if (!stats.dailyWords) stats.dailyWords = {};
    stats.dailyWords[today] = (stats.dailyWords[today] || 0) + wordCount;
    
    // Gérer le streak
    if (stats.lastReadDate !== today) {
        // Première lecture du jour
        if (stats.lastReadDate === yesterday || !stats.lastReadDate) {
            stats.streak = (stats.streak || 0) + 1;
        } else {
            stats.streak = 1; // Recommencer le streak
        }
        stats.lastReadDate = today;
        stats.sessionsToday = 1;
        
        // Meilleur streak
        if (stats.streak > (stats.bestStreak || 0)) {
            stats.bestStreak = stats.streak;
            if (stats.streak >= 7) {
                toast('🔥 Streak record : ' + stats.streak + ' jours !');
            }
        }
    } else {
        stats.sessionsToday = (stats.sessionsToday || 0) + 1;
    }
    
    saveState();
}

function startReadingTimer() {
    if (!sessionStartTime) {
        sessionStartTime = Date.now();
    }
}

function stopReadingTimer() {
    if (sessionStartTime) {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        state.readingStats.totalReadingTime = (state.readingStats.totalReadingTime || 0) + elapsed;
        sessionStartTime = null;
        saveState();
    }
}

// formatReadingTime et formatWordsCount sont dans utils.js

function updateReadingStatsUI() {
    const stats = state.readingStats;
    
    // Temps de lecture
    const timeEl = document.getElementById('totalReadingTime');
    if (timeEl) {
        timeEl.textContent = formatReadingTime(stats.totalReadingTime || 0);
    }
    
    // Mots lus
    const wordsEl = document.getElementById('totalWordsRead');
    if (wordsEl) {
        wordsEl.textContent = formatWordsCount(stats.totalWordsRead || 0);
    }
    
    // Streak
    const streakEl = document.getElementById('currentStreak');
    if (streakEl) {
        streakEl.textContent = stats.streak || 0;
    }
    
    // Barre de progression streak (objectif 7 jours)
    const progressEl = document.getElementById('streakProgress');
    if (progressEl) {
        const progress = Math.min(100, ((stats.streak || 0) / 7) * 100);
        progressEl.style.width = progress + '%';
    }
    
    // Hint streak
    const hintEl = document.getElementById('streakHint');
    if (hintEl) {
        const streak = stats.streak || 0;
        if (streak === 0) {
            hintEl.textContent = 'Commencez à lire pour démarrer votre streak !';
        } else if (streak < 3) {
            hintEl.textContent = `${streak} jour${streak > 1 ? 's' : ''} - Continuez demain !`;
        } else if (streak < 7) {
            hintEl.textContent = `🔥 ${streak} jours ! Plus que ${7 - streak} pour la semaine complète !`;
        } else if (streak < 30) {
            hintEl.textContent = `🔥🔥 ${streak} jours ! Vers le mois complet !`;
        } else {
            hintEl.textContent = `🏆 ${streak} jours ! Incroyable dévotion !`;
        }
    }
    
    // Graphique hebdomadaire
    renderWeeklyChart();
}

function renderWeeklyChart() {
    const container = document.getElementById('weeklyChart');
    if (!container) return;
    
    const stats = state.readingStats;
    const dailyWords = stats.dailyWords || {};
    const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const today = new Date();
    
    // Obtenir les 7 derniers jours
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();
        weekData.push({
            key,
            dayLabel: days[(dayOfWeek + 6) % 7], // Lundi = 0
            words: dailyWords[key] || 0,
            isToday: i === 0
        });
    }
    
    // Trouver le max pour normaliser
    const maxWords = Math.max(100, ...weekData.map(d => d.words));
    
    container.innerHTML = weekData.map(d => {
        const height = Math.max(4, (d.words / maxWords) * 45);
        const classes = ['weekly-bar'];
        if (d.words > 0) classes.push('active');
        if (d.isToday) classes.push('today');
        return `<div class="${classes.join(' ')}" style="height: ${height}px" data-day="${d.dayLabel}" title="${d.words} mots"></div>`;
    }).join('');
}

// Détecter quand l'utilisateur quitte la page
window.addEventListener('beforeunload', stopReadingTimer);
window.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopReadingTimer();
    } else {
        startReadingTimer();
    }
});

// Phrases d'en-tête dynamiques selon l'état de l'exploration
const HEADER_PHRASES = {
    start: [
        "Laissez-vous dériver...",
        "Un texte vous attend...",
        "La bibliothèque murmure...",
        "Plongez dans l'inconnu..."
    ],
    exploring: [
        "Le voyage continue...",
        "Vous vous enfoncez...",
        "Les pages tournent...",
        "Le labyrinthe s'ouvre..."
    ],
    deep: [
        "Vous êtes loin du rivage...",
        "Les profondeurs vous appellent...",
        "Le temps se suspend...",
        "Bienvenue dans l'abîme..."
    ],
    expert: [
        "Vous êtes un érudit...",
        "Les auteurs vous reconnaissent...",
        "Le palimpseste se révèle...",
        "Maître des mots anciens..."
    ]
};

function updateDynamicHeader() {
    const authorCount = Object.keys(state.authorStats).length;
    const readCount = state.readCount || 0;
    
    let phrases;
    if (readCount < 3) phrases = HEADER_PHRASES.start;
    else if (authorCount < 10) phrases = HEADER_PHRASES.exploring;
    else if (authorCount < 25) phrases = HEADER_PHRASES.deep;
    else phrases = HEADER_PHRASES.expert;
    
    const headerEl = document.getElementById('headerTitle');
    if (headerEl && Math.random() < 0.3) { // 30% de chance de changer
        headerEl.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    }
}

function renderAuthorBars() {
    const container = document.getElementById('authorBars');
    const sorted = Object.entries(state.authorStats).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = sorted[0]?.[1] || 1;
    const colors = ['#ff453a', '#ff9f0a', '#30d158', '#64d2ff', '#bf5af2', '#ff6482', '#ffd60a', '#ac8e68'];
    
    container.innerHTML = sorted.map(([author, count], i) => `
        <div class="author-bar">
            <span class="author-bar-name">${author.split(' ').pop()}</span>
            <div class="author-bar-track">
                <div class="author-bar-fill" style="width: ${(count/max)*100}%; background: ${colors[i % colors.length]}"></div>
            </div>
            <span class="author-bar-count">${count}</span>
        </div>
    `).join('');
}

function renderGenreChart() {
    const container = document.getElementById('genreChart');
    container.innerHTML = Object.entries(state.genreStats).map(([genre, count]) => `
        <div class="genre-pill" onclick="exploreCategory('${genre}')" title="Explorer l'arborescence ${genre}">
            <span class="genre-dot" style="background: ${GENRE_COLORS[genre] || '#6e6e73'}"></span>
            ${genre} <strong>${count}</strong>
        </div>
    `).join('');
}

function trackStats(author, tag) {
    state.authorStats[author] = (state.authorStats[author] || 0) + 1;
    state.genreStats[tag] = (state.genreStats[tag] || 0) + 1;
    saveState();
}

// Construire dynamiquement les connexions entre auteurs
// Les auteurs du même genre sont connectés entre eux
function buildAuthorConnections(author, tag) {
    if (!author || author === 'Anonyme') return;
    
    // Trouver les autres auteurs du même genre
    const sameGenreAuthors = Object.keys(state.authorStats).filter(a => {
        // On considère que les auteurs vus récemment dans la même session sont "connectés"
        return a !== author && a !== 'Anonyme';
    });
    
    // Ajouter des connexions bidirectionnelles
    if (!authorConnections[author]) authorConnections[author] = [];
    
    // Connecter avec les 5 derniers auteurs différents découverts
    const recentAuthors = sameGenreAuthors.slice(-5);
    for (const other of recentAuthors) {
        if (!authorConnections[author].includes(other)) {
            authorConnections[author].push(other);
        }
        if (!authorConnections[other]) authorConnections[other] = [];
        if (!authorConnections[other].includes(author)) {
            authorConnections[other].push(author);
        }
    }
    
    // Limiter à 10 connexions par auteur
    if (authorConnections[author].length > 10) {
        authorConnections[author] = authorConnections[author].slice(-10);
    }
}

// ═══════════════════════════════════════════════════════════
// 🔍 RECHERCHE → search.js
// ═══════════════════════════════════════════════════════════

async function shuffleFeed() {
    document.getElementById('feed').innerHTML = '';
    state.textPool = [];
    state.shownPages.clear();
    state.cardIdx = 0;
    toast('Nouveaux textes...');
    await fillPool();
    await loadMore();
}

function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

async function loadMore() {
    if (state.loading) return;
    state.loading = true;
    document.getElementById('loading').style.display = 'block';

    let loaded = 0, attempts = 0;
    while (loaded < 3 && attempts < 15) {
        attempts++;
        const isExploringCategory = currentCategoryPath.length > 0;
        if (state.textPool.length < 3 && !isExploringCategory) {
            await fillPool();
        }
        if (state.textPool.length === 0) break;
        
        const item = state.textPool.shift();
        const itemKey = (item.source === 'poetrydb' ? 'poetrydb:' : '') + item.title;
        if (state.shownPages.has(itemKey)) continue;
        
        // Si c'est un item pré-chargé (PoetryDB), on l'affiche directement
        if (item.isPreloaded && item.text) {
            state.shownPages.add(itemKey);
            renderCard({
                title: item.title,
                text: item.text,
                author: item.author,
                source: item.source
            }, item.title, { lang: item.lang, url: 'https://poetrydb.org', name: 'PoetryDB' });
            loaded++;
            continue;
        }
        
        // Sinon, récupérer depuis Wikisource
        const ws = item.wikisource || currentWikisource;
        const result = await fetchText(item.title, 0, ws);
        if (result?.text?.length > 150) {
            state.shownPages.add(itemKey);
            renderCard(result, item.title, ws);
            loaded++;
        }
    }

    document.getElementById('loading').style.display = 'none';
    state.loading = false;
}

function renderCard(result, origTitle, wikisource = currentWikisource) {
    let title = result.title || origTitle;
    // Nettoyage agressif du titre
    title = title
        .replace(/<[^>]+>/g, '')  // Supprimer tout HTML
        .replace(/mw-page-title[^\s]*/gi, '')  // Supprimer classes MW
        .replace(/Liste des [^\/]*/gi, '')  // Supprimer "Liste des..."
        .replace(/par ordre alphabétique/gi, '')
        .replace(/span class/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Si le titre est invalide, ne pas afficher cette carte
    if (!isValidTitle(title)) return;
    
    const text = result.text;
    const lang = wikisource?.lang || 'fr';
    // Utiliser l'auteur des métadonnées en priorité
    const author = detectAuthor(title, text, result.author);
    const tag = detectTag(title, text);
    const url = `${wikisource?.url || 'https://fr.wikisource.org'}/wiki/${encodeURIComponent(origTitle)}`;
    const cardId = 'card-' + (state.cardIdx++);
    
    // Extraire un titre propre pour l'affichage
    let displayTitle = title.split('/').pop() || title.split('/')[0];
    // Si c'est un titre générique, prendre la première partie
    if (displayTitle.length < 3) displayTitle = title.split('/')[0];
    // Supprimer les parenthèses avec l'auteur si redondant
    displayTitle = displayTitle.replace(/\s*\([^)]*\)\s*$/, '').trim();
    // Si displayTitle est vide ou trop court après nettoyage, utiliser le titre original
    if (displayTitle.length < 3) displayTitle = title.split('/')[0] || 'Texte sans titre';
    
    // Badge de langue
    const langBadge = lang !== 'fr' ? `<span class="lang-badge">${lang.toUpperCase()}</span>` : '';
    
    // Tracker les stats et construire les connexions
    trackStats(author, tag);
    buildAuthorConnections(author, tag);

    // Découper le texte en teaser + suite
    const TEASER_LENGTH = 350;
    const CHUNK_LENGTH = 600;
    let teaser = text;
    let remaining = '';
    
    if (text.length > TEASER_LENGTH) {
        // Couper proprement sur une phrase ou un retour à la ligne
        let cutPoint = text.lastIndexOf('. ', TEASER_LENGTH);
        if (cutPoint < TEASER_LENGTH * 0.5) cutPoint = text.lastIndexOf('\n', TEASER_LENGTH);
        if (cutPoint < TEASER_LENGTH * 0.5) cutPoint = text.lastIndexOf(' ', TEASER_LENGTH);
        if (cutPoint < TEASER_LENGTH * 0.5) cutPoint = TEASER_LENGTH;
        teaser = text.substring(0, cutPoint + 1).trim();
        remaining = text.substring(cutPoint + 1).trim();
    }
    
    // Générer les mots-clés pour ce texte
    const keywords = extractKeywords(text, title, author, tag);
    const keywordsHtml = keywords.map(kw => 
        `<span class="keyword-tag" onclick="exploreKeyword('${kw}')" title="Explorer #${kw}">${kw}</span>`
    ).join('');
    
    const card = document.createElement('div');
    card.className = 'card';
    card.id = cardId;
    card.innerHTML = `
        <div class="card-head" onclick="showRelatedAuthors('${cardId}')" style="cursor:pointer;" title="Cliquer pour découvrir des auteurs proches">
            <div>
                <div class="author">${esc(author)} ${langBadge} <span class="explore-hint">🕸️</span></div>
                <div class="work">${esc(displayTitle)}</div>
            </div>
            <span class="tag ${tag}" onclick="event.stopPropagation(); exploreCategory('${tag}')" title="Explorer ce genre">${tag}</span>
        </div>
        <div class="card-body" ondblclick="doubleTapLike('${cardId}', event)">
            <span class="like-heart-overlay" id="heart-${cardId}">❤️</span>
            <div class="text-teaser">${esc(teaser)}</div>
            <div class="text-full" id="full-${cardId}"></div>
            ${remaining ? `<button class="btn-suite" onclick="showMore('${cardId}')" id="suite-${cardId}">Lire la suite<span class="arrow">→</span></button>` : ''}
        </div>
        <div class="related-authors" id="related-${cardId}" style="display:none;"></div>
        <div class="card-foot">
            <div class="card-keywords">${keywordsHtml}</div>
            <div class="actions">
                <button class="btn" onclick="toggleLike('${cardId}',this)">♥</button>
                <button class="btn btn-share" onclick="shareCardExtrait('${cardId}')" title="Partager cet extrait">🐦 Partager</button>
                <button class="btn" onclick="quickShareAndComment('${cardId}')" title="Partager et commenter">💬</button>
                <button class="btn" onclick="showRelatedAuthors('${cardId}')" title="Explorer auteurs proches">🔗</button>
                <a class="btn" href="${url}" target="_blank">↗ Wikisource</a>
            </div>
        </div>
    `;
    card.dataset.title = title;
    card.dataset.author = author;
    card.dataset.text = text;
    card.dataset.remaining = remaining;
    card.dataset.shown = '0';
    card.dataset.tag = tag;
    card.dataset.lang = lang;
    card.dataset.chunkSize = CHUNK_LENGTH;
    document.getElementById('feed').appendChild(card);
    setTimeout(() => card.classList.add('show'), 50);
    
    // Tracker ce texte comme lu
    state.readCount++;
    const teaserWords = teaser.split(/\s+/).filter(w => w.length > 0).length;
    recordReading(teaserWords);
    startReadingTimer();
    
    // Mettre à jour l'affichage
    updateStats();
    saveState();
}

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }

// Afficher la suite du texte - tout d'un coup au premier clic
function showMore(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const fullEl = document.getElementById('full-' + cardId);
    const btnEl = document.getElementById('suite-' + cardId);
    if (!fullEl || !btnEl) return;
    
    let remaining = card.dataset.remaining || '';
    
    if (!remaining) {
        btnEl.innerHTML = '✓ Texte complet';
        btnEl.classList.add('exhausted');
        btnEl.onclick = null;
        return;
    }
    
    // Afficher TOUT le texte restant d'un coup
    const chunkEl = document.createElement('div');
    chunkEl.className = 'text-chunk';
    chunkEl.style.animation = 'fadeIn 0.4s ease';
    chunkEl.innerHTML = esc(remaining);
    fullEl.appendChild(chunkEl);
    fullEl.classList.add('visible');
    
    // Tracker les mots lus
    const wordCount = remaining.split(/\s+/).filter(w => w.length > 0).length;
    recordReading(wordCount);
    startReadingTimer();
    
    // Marquer comme complet
    card.dataset.remaining = '';
    
    // Mettre à jour le bouton
    btnEl.innerHTML = '✓ Texte complet';
    btnEl.classList.add('exhausted');
    btnEl.onclick = null;
    
    // Scroll doux vers le nouveau contenu
    setTimeout(() => chunkEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function toggleLike(id, btn) {
    const card = document.getElementById(id);
    const author = card?.dataset?.author;
    const title = card?.dataset?.title;
    const text = card?.dataset?.text;
    
    if (state.likes.has(id)) { 
        state.likes.delete(id); 
        // Supprimer des favoris stockés
        state.favorites = (state.favorites || []).filter(f => f.id !== id);
        btn?.classList?.remove('active');
        // Retirer l'auteur des likedAuthors si plus aucune carte likée
        if (author && author !== 'Anonyme') {
            const hasOtherLikes = [...state.likes].some(likeId => {
                const c = document.getElementById(likeId);
                return c?.dataset?.author === author;
            });
            if (!hasOtherLikes) state.likedAuthors.delete(author);
        }
    } else { 
        state.likes.add(id); 
        // Ajouter aux favoris stockés
        if (!state.favorites) state.favorites = [];
        state.favorites.push({
            id: id,
            title: title,
            author: author,
            text: text?.substring(0, 200) || '',
            timestamp: Date.now()
        });
        btn?.classList?.add('active'); 
        toast('💎 Ajouté aux favoris');
        // Ajouter l'auteur aux likedAuthors
        if (author && author !== 'Anonyme') {
            state.likedAuthors.add(author);
        }
    }
    saveState();
    updateConnections();
    renderFavorites();
    updateFavCount();
}

// Double-tap pour liker (style Instagram)
function doubleTapLike(id, event) {
    event.preventDefault();
    const card = document.getElementById(id);
    const heart = document.getElementById('heart-' + id);
    const likeBtn = card?.querySelector('.card-foot .btn');
    
    // Afficher l'animation du coeur
    if (heart) {
        heart.classList.remove('animate');
        void heart.offsetWidth; // Force reflow
        heart.classList.add('animate');
    }
    
    // Si pas déjà liké, liker
    if (!state.likes.has(id)) {
        toggleLike(id, likeBtn);
    } else {
        // Déjà liké, juste montrer le coeur (feedback visuel)
        toast('❤️ Déjà dans tes favoris !');
    }
}

// Afficher la liste des favoris dans le panneau
function renderFavorites() {
    const container = document.getElementById('favoritesList');
    if (!container) return;
    
    const favorites = state.favorites || [];
    
    if (favorites.length === 0) {
        container.innerHTML = '<div class="favorites-empty">Cliquez ♥ pour sauvegarder</div>';
        return;
    }
    
    // Trier par date (plus récent d'abord)
    const sorted = [...favorites].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    container.innerHTML = sorted.map(fav => `
        <div class="favorite-item" onclick="scrollToCard('${fav.id}')">
            <div class="favorite-content">
                <div class="favorite-title">${esc(fav.title?.split('/').pop() || fav.title || 'Sans titre')}</div>
                <div class="favorite-author">${esc(fav.author || 'Anonyme')}</div>
                <div class="favorite-preview">${esc(fav.text || '')}</div>
            </div>
            <button class="favorite-remove" onclick="event.stopPropagation(); removeFavorite('${fav.id}')" title="Retirer">✕</button>
        </div>
    `).join('');
}

function scrollToCard(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.boxShadow = '0 0 30px rgba(255,69,58,0.5)';
        setTimeout(() => card.style.boxShadow = '', 2000);
    }
}

function removeFavorite(id) {
    state.likes.delete(id);
    state.favorites = (state.favorites || []).filter(f => f.id !== id);
    const btn = document.querySelector(`#${id} .btn.active`);
    if (btn) btn.classList.remove('active');
    saveState();
    renderFavorites();
    updateFavCount();
    toast('Retiré des favoris');
}

// === VUE FAVORIS COMPLÈTE ===
function openFavoritesView() {
    const overlay = document.getElementById('favoritesOverlay');
    const grid = document.getElementById('favoritesGrid');
    if (!overlay || !grid) return;
    
    const favorites = state.favorites || [];
    
    if (favorites.length === 0) {
        grid.innerHTML = `
            <div class="fav-empty">
                <div class="fav-empty-icon">♥</div>
                <div class="fav-empty-text">Aucun favori pour l'instant</div>
                <p style="margin-top: 1rem; color: var(--muted); font-size: 0.9rem;">
                    Cliquez sur le cœur ♥ d'un texte pour le sauvegarder ici
                </p>
            </div>
        `;
    } else {
        const sorted = [...favorites].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        grid.innerHTML = sorted.map(fav => `
            <div class="fav-card">
                <div class="fav-card-head">
                    <div>
                        <div class="fav-card-author">${esc(fav.author || 'Anonyme')}</div>
                        <div class="fav-card-title">${esc(fav.title?.split('/').pop() || fav.title || 'Sans titre')}</div>
                    </div>
                </div>
                <div class="fav-card-text">${esc(fav.text || '').substring(0, 500)}${(fav.text?.length || 0) > 500 ? '...' : ''}</div>
                <div class="fav-card-actions">
                    <button class="btn" onclick="openFavInReader('${fav.id}')">Lire</button>
                    <button class="btn" onclick="removeFavoriteFromView('${fav.id}')">Retirer</button>
                </div>
            </div>
        `).join('');
    }
    
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeFavoritesView() {
    const overlay = document.getElementById('favoritesOverlay');
    if (overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function openFavInReader(id) {
    const fav = (state.favorites || []).find(f => f.id === id);
    if (fav) {
        closeFavoritesView();
        // Chercher la carte dans le feed ou créer une vue reader
        const card = document.getElementById(id);
        if (card) {
            const btn = card.querySelector('.read-more-btn');
            if (btn) btn.click();
            else {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            // Ouvrir directement dans le reader avec le texte sauvegardé
            openReaderWithFav(fav);
        }
    }
}

function openReaderWithFav(fav) {
    const overlay = document.getElementById('readerOverlay');
    const content = document.getElementById('readerContent');
    if (!overlay || !content) return;
    
    content.innerHTML = `
        <div style="text-align:center; margin-bottom: 3rem;">
            <div style="font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 600;">${esc(fav.author || 'Anonyme')}</div>
            <div style="color: var(--muted); font-style: italic; margin-top: 0.5rem;">${esc(fav.title?.split('/').pop() || fav.title || '')}</div>
        </div>
        <div style="white-space: pre-wrap; text-align: justify;">${esc(fav.text || 'Texte non disponible')}</div>
    `;
    
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function removeFavoriteFromView(id) {
    removeFavorite(id);
    // Re-render la vue favoris
    openFavoritesView();
}

function updateFavCount() {
    const countEl = document.getElementById('favCount');
    if (countEl) {
        const count = (state.favorites || []).length;
        countEl.textContent = count;
    }
}

// Trouver les auteurs connexes basés sur les favoris et les découvertes
function getConnectedAuthors() {
    const connected = new Map(); // auteur -> source(s)
    
    // Utiliser les auteurs découverts comme base de recommandation
    // Un auteur "similaire" est un auteur lu dans la même session mais pas encore liké
    for (const likedAuthor of state.likedAuthors) {
        // Chercher des auteurs découverts récemment (dans authorConnections dynamique)
        const connections = authorConnections[likedAuthor] || [];
        for (const connectedAuthor of connections) {
            // Ne pas recommander un auteur déjà lu/liké
            if (state.likedAuthors.has(connectedAuthor)) continue;
            if (state.discoveredConnections.has(connectedAuthor)) continue;
            
            if (!connected.has(connectedAuthor)) {
                connected.set(connectedAuthor, []);
            }
            connected.get(connectedAuthor).push(likedAuthor);
        }
    }
    
    // Trier par nombre de connexions (auteurs recommandés par plusieurs sources d'abord)
    return [...connected.entries()]
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 6);
}

// Mettre à jour l'affichage des connexions
function updateConnections() {
    const connected = getConnectedAuthors();
    const section = document.getElementById('connectionsSection');
    const graph = document.getElementById('connectionGraph');
    const recoBanner = document.getElementById('recoBanner');
    const recoAuthors = document.getElementById('recoAuthors');
    
    if (connected.length === 0) {
        section.style.display = 'none';
        recoBanner.style.display = 'none';
        return;
    }
    
    // Afficher la section dans le panneau
    section.style.display = 'block';
    graph.innerHTML = connected.map(([author, sources]) => {
        const isDiscovered = state.discoveredConnections.has(author);
        const sourceList = sources.slice(0, 2).join(', ');
        return `
            <div class="connection-item" onclick="exploreAuthor('${author.replace(/'/g, "\\'")}')">
                <div class="connection-node ${isDiscovered ? 'discovered' : ''}">
                    <span class="connection-dot"></span>
                    <span>${author}</span>
                </div>
                <div class="connection-label">via ${sourceList}</div>
            </div>
        `;
    }).join('');
    
    // Afficher la bannière de recommandation
    recoBanner.style.display = 'block';
    recoAuthors.innerHTML = connected.slice(0, 4).map(([author]) => `
        <span class="reco-author" onclick="exploreAuthor('${author.replace(/'/g, "\\'")}')">${author}</span>
    `).join('');
}

// ═══════════════════════════════════════════════════════════
// 🕸️ AFFICHER LES AUTEURS LIÉS À UN TEXTE (clic sur carte)
// ═══════════════════════════════════════════════════════════
function showRelatedAuthors(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const author = card.dataset.author;
    const container = document.getElementById('related-' + cardId);
    
    // Toggle : si déjà visible, cacher
    if (container.style.display !== 'none') {
        container.style.display = 'none';
        return;
    }
    
    // Trouver les auteurs connectés (dynamiquement découverts)
    const connected = authorConnections[author] || [];
    
    // Ajouter des suggestions basées sur le genre
    const tag = card.dataset.tag;
    const genreAuthors = getAuthorsForGenre(tag, author);
    
    // Combiner et dédupliquer
    const allRelated = [...new Set([...connected, ...genreAuthors])].slice(0, 6);
    
    if (allRelated.length === 0) {
        container.innerHTML = `<div class="no-related">Aucune connexion connue. <button class="btn btn-small" onclick="randomJump()">🎲 Hasard</button></div>`;
    } else {
        container.innerHTML = `
            <div class="related-title">🕸️ Auteurs proches de ${author.split(' ').pop()}</div>
            <div class="related-list">
                ${allRelated.map(a => `
                    <button class="related-btn" onclick="exploreAuthor('${a.replace(/'/g, "\\'")}')">
                        ${a.split(' ').pop()}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    container.style.display = 'block';
    toast(`${allRelated.length} auteur(s) à explorer`);
}

// Trouver des auteurs du même genre (classiques mondiaux + dynamique)
function getAuthorsForGenre(genre, excludeAuthor) {
    // Auteurs classiques par genre (mix mondial)
    const genreMap = {
        'poésie': ['Baudelaire', 'Rimbaud', 'Shakespeare', 'Goethe', 'Dante', 'Petrarca', 'Pushkin', 'Neruda'],
        'poetry': ['Shakespeare', 'Keats', 'Byron', 'Wordsworth', 'Dickinson', 'Whitman', 'Poe'],
        'théâtre': ['Molière', 'Shakespeare', 'Goethe', 'Calderón', 'Goldoni', 'Chekhov'],
        'drama': ['Shakespeare', 'Marlowe', 'Ibsen', 'Chekhov', 'Wilde'],
        'roman': ['Balzac', 'Dickens', 'Dostoevsky', 'Tolstoy', 'Cervantes', 'Mann'],
        'novel': ['Dickens', 'Austen', 'Brontë', 'Twain', 'Melville', 'James'],
        'conte': ['Perrault', 'Grimm', 'Andersen', 'Maupassant'],
        'tale': ['Grimm', 'Andersen', 'Wilde', 'Poe'],
        'fable': ['La Fontaine', 'Ésope', 'Aesop', 'Krylov'],
        'texte': ['Hugo', 'Goethe', 'Dante', 'Cervantes'],
        'text': ['Milton', 'Bunyan', 'Swift', 'Defoe']
    };
    
    // Ajouter les auteurs découverts dynamiquement pour ce genre
    const discovered = Object.keys(state.authorStats);
    const baseList = genreMap[genre?.toLowerCase()] || [];
    const combined = [...baseList, ...discovered];
    
    return [...new Set(combined)]
        .filter(a => a !== excludeAuthor && a !== 'Anonyme')
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);
}

// Explorer un auteur spécifique (recherche ciblée)
async function exploreAuthor(author) {
    toast(`Exploration de ${author}...`);
    state.discoveredConnections.add(author);
    saveState();
    
    // Recherches spécifiques pour cet auteur
    const searches = [`${author} poem`, `${author} text`, `${author} sonnet`];
    
    // Utiliser les wikisources actives selon le filtre
    const activeSources = getActiveWikisources();
    const shuffledWS = [...activeSources].sort(() => Math.random() - 0.5).slice(0, Math.min(3, activeSources.length));
    
    for (const ws of shuffledWS) {
        for (const query of searches) {
            const results = await searchTexts(query, 3, ws);
            for (const r of results) {
                if (!state.shownPages.has(r.title) && isValidTitle(r.title)) {
                    state.textPool.unshift({ ...r, wikisource: ws }); // Ajouter en priorité
                }
            }
        }
    }
    
    // Charger immédiatement
    await loadMore();
    updateConnections();
    
    // Scroll vers le nouveau contenu
    window.scrollTo({ top: document.body.scrollHeight - window.innerHeight - 400, behavior: 'smooth' });
}

function openReader(id) {
    const card = document.getElementById(id);
    if (!card) return;
    const author = card.dataset.author;
    const title = card.dataset.title;
    const text = card.dataset.text || '';
    document.getElementById('readerTitle').textContent = `${author} — ${title.split('/')[0]}`;
    document.getElementById('readerContent').innerHTML = esc(text);
    document.getElementById('reader').classList.add('open');
    document.body.style.overflow = 'hidden';
    state.readCount++;
    
    // Tracker les mots lus
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    recordReading(wordCount);
    startReadingTimer();
    
    saveState();
    
    // Fonctionnalités fun
    addToReadingPath(author, title);
    checkAchievements();
    updateFunStat();
    updateStats();
}

function closeReader() {
    document.getElementById('reader').classList.remove('open');
    document.body.style.overflow = '';
    stopReadingTimer();
}

// ═══════════════════════════════════════════════════════════
// � AMBIANCES DE LECTURE
// ═══════════════════════════════════════════════════════════

const AMBIANCES = {
    libre: {
        name: 'Dérive libre',
        icon: '🌊',
        description: 'Laissez-vous porter par le hasard des textes',
        authors: [], // Utilise les auteurs par défaut
        keywords: [],
        color: '#64b5f6'
    },
    gothique: {
        name: 'Gothique',
        icon: '🦇',
        description: 'Châteaux hantés, spectres et terreurs nocturnes',
        authors: ['Edgar Allan Poe', 'Ann Radcliffe', 'Matthew Lewis', 'Horace Walpole', 'Mary Shelley', 'Bram Stoker', 'Charles Maturin', 'Sheridan Le Fanu', 'Théophile Gautier', 'Villiers de l\'Isle-Adam'],
        keywords: ['fantôme', 'spectre', 'château', 'terreur', 'nuit', 'vampire', 'mort', 'tombe', 'ténèbres', 'effroi'],
        color: '#6a1b9a'
    },
    surrealiste: {
        name: 'Surréaliste',
        icon: '🎭',
        description: 'L\'inconscient libéré, les rêves éveillés',
        authors: ['André Breton', 'Paul Éluard', 'Robert Desnos', 'Philippe Soupault', 'Louis Aragon', 'Benjamin Péret', 'René Crevel', 'Antonin Artaud', 'Lautréamont', 'Alfred Jarry'],
        keywords: ['rêve', 'automatique', 'hasard', 'inconscient', 'merveilleux', 'étrange', 'absurde'],
        color: '#ff6f00'
    },
    romantique: {
        name: 'Romantique',
        icon: '🌹',
        description: 'Passions intenses et âmes tourmentées',
        authors: ['Victor Hugo', 'Alphonse de Lamartine', 'Alfred de Musset', 'Alfred de Vigny', 'Gérard de Nerval', 'François-René de Chateaubriand', 'George Sand', 'Lord Byron', 'Percy Shelley', 'John Keats'],
        keywords: ['amour', 'passion', 'coeur', 'âme', 'sentiment', 'larmes', 'désespoir', 'nature'],
        color: '#e91e63'
    },
    melancolie: {
        name: 'Mélancolie',
        icon: '🌧️',
        description: 'Spleen, tristesse douce et contemplation',
        authors: ['Charles Baudelaire', 'Paul Verlaine', 'Jules Laforgue', 'Maurice Rollinat', 'Sully Prudhomme', 'Albert Samain', 'Francis Jammes', 'Giacomo Leopardi'],
        keywords: ['spleen', 'ennui', 'tristesse', 'automne', 'pluie', 'brume', 'solitude', 'regret', 'nostalgie'],
        color: '#546e7a'
    },
    mystique: {
        name: 'Mystique',
        icon: '🔮',
        description: 'Quêtes spirituelles et visions ésotériques',
        authors: ['William Blake', 'Emanuel Swedenborg', 'Jakob Böhme', 'Angelus Silesius', 'San Juan de la Cruz', 'Sainte Thérèse d\'Avila', 'Maître Eckhart', 'Hildegarde de Bingen', 'Rûmî'],
        keywords: ['âme', 'divin', 'extase', 'vision', 'lumière', 'éternel', 'sacré', 'céleste', 'spirituel'],
        color: '#7e57c2'
    },
    epique: {
        name: 'Épique',
        icon: '⚔️',
        description: 'Héros, batailles et destinées grandioses',
        authors: ['Homère', 'Virgile', 'Le Tasse', 'L\'Arioste', 'Milton', 'Camoens', 'Dante Alighieri', 'Victor Hugo'],
        keywords: ['héros', 'bataille', 'gloire', 'honneur', 'guerre', 'victoire', 'destin', 'épée', 'conquête'],
        color: '#d32f2f'
    },
    pastoral: {
        name: 'Pastoral',
        icon: '🌾',
        description: 'Campagnes idylliques et nature apaisante',
        authors: ['Théocrite', 'Virgile', 'Pierre de Ronsard', 'Joachim du Bellay', 'Maurice Scève', 'Francis Jammes', 'Jean Giono', 'Colette'],
        keywords: ['berger', 'prairie', 'champ', 'fleur', 'ruisseau', 'oiseau', 'printemps', 'nature', 'campagne'],
        color: '#66bb6a'
    },
    decadent: {
        name: 'Décadent',
        icon: '💀',
        description: 'Fin de siècle, artifice et beauté morbide',
        authors: ['Joris-Karl Huysmans', 'Jean Lorrain', 'Rachilde', 'Villiers de l\'Isle-Adam', 'Jules Barbey d\'Aurevilly', 'Oscar Wilde', 'Gabriele D\'Annunzio', 'Maurice Rollinat'],
        keywords: ['artifice', 'opium', 'décadence', 'luxe', 'pervers', 'morbide', 'exquis', 'raffiné', 'poison'],
        color: '#4a148c'
    },
    nocturne: {
        name: 'Nocturne',
        icon: '🌙',
        description: 'Nuits blanches, insomnies et rêveries lunaires',
        authors: ['Gérard de Nerval', 'Novalis', 'Charles Baudelaire', 'Paul Verlaine', 'Rainer Maria Rilke', 'Federico García Lorca', 'E.T.A. Hoffmann', 'Aloysius Bertrand'],
        keywords: ['nuit', 'lune', 'étoiles', 'ténèbres', 'rêve', 'insomnie', 'ombre', 'silence', 'minuit'],
        color: '#1a237e'
    },
    voyage: {
        name: 'Antique',
        icon: '🏛️',
        description: 'Sagesse grecque et grandeur romaine',
        authors: ['Homère', 'Sophocle', 'Euripide', 'Platon', 'Aristote', 'Virgile', 'Ovide', 'Horace', 'Sénèque', 'Marc Aurèle', 'Cicéron'],
        keywords: ['Olympe', 'dieux', 'muse', 'oracle', 'temple', 'philosophe', 'vertu', 'sagesse'],
        color: '#8d6e63'
    },
    voyage: {
        name: 'Voyage',
        icon: '🚢',
        description: 'Horizons lointains et découvertes',
        authors: ['Jules Verne', 'Pierre Loti', 'Joseph Conrad', 'Herman Melville', 'Robert Louis Stevenson', 'Jack London', 'Marco Polo', 'Ibn Battûta'],
        keywords: ['voyage', 'mer', 'île', 'horizon', 'aventure', 'découverte', 'navire', 'explorateur', 'orient'],
        color: '#0288d1'
    },
    philosophie: {
        name: 'Philosophie',
        icon: '🧠',
        description: 'Méditations sur l\'existence et la pensée',
        authors: ['Platon', 'Aristote', 'Montaigne', 'Blaise Pascal', 'René Descartes', 'Jean-Jacques Rousseau', 'Voltaire', 'Friedrich Nietzsche', 'Arthur Schopenhauer', 'Sénèque'],
        keywords: ['pensée', 'raison', 'vérité', 'existence', 'mort', 'liberté', 'sagesse', 'doute', 'être'],
        color: '#455a64'
    }
};

// ═══════════════════════════════════════════════════════════
// 📜 ÉPOQUES LITTÉRAIRES
// ═══════════════════════════════════════════════════════════

const EPOQUES = {
    antiquite: {
        name: 'Antiquité',
        icon: '🏺',
        period: 'VIIIᵉ s. av. J.-C. – Vᵉ s.',
        description: 'L\'aube de la littérature : épopées, tragédies et sagesse des anciens',
        authors: ['Homère', 'Sophocle', 'Euripide', 'Eschyle', 'Aristophane', 'Platon', 'Aristote', 'Virgile', 'Ovide', 'Horace', 'Sénèque', 'Marc Aurèle', 'Cicéron', 'Lucrèce', 'Apulée', 'Pétrone'],
        keywords: ['mythologie', 'olympe', 'tragédie', 'héros', 'oracle', 'destin'],
        color: '#8d6e63'
    },
    medieval: {
        name: 'Moyen Âge',
        icon: '⚔️',
        period: 'Vᵉ – XVᵉ siècle',
        description: 'Chevaliers, troubadours et enluminures',
        authors: ['Chrétien de Troyes', 'François Villon', 'Dante Alighieri', 'Boccace', 'Pétrarque', 'Guillaume de Machaut', 'Marie de France', 'Jean de Meung', 'Rutebeuf', 'Christine de Pizan'],
        keywords: ['chevalier', 'amour courtois', 'quête', 'graal', 'troubadour', 'roman'],
        color: '#5d4037'
    },
    renaissance: {
        name: 'Renaissance',
        icon: '🎨',
        period: 'XVIᵉ siècle',
        description: 'Humanisme, redécouverte antique et soif de savoir',
        authors: ['François Rabelais', 'Michel de Montaigne', 'Pierre de Ronsard', 'Joachim du Bellay', 'Louise Labé', 'Clément Marot', 'Agrippa d\'Aubigné', 'Étienne de La Boétie', 'Maurice Scève', 'Shakespeare'],
        keywords: ['humanisme', 'éducation', 'sonnet', 'pléiade', 'amour', 'nature'],
        color: '#ff8f00'
    },
    classique: {
        name: 'Grand Siècle',
        icon: '👑',
        period: 'XVIIᵉ siècle',
        description: 'L\'âge d\'or français : raison, mesure et passions tragiques',
        authors: ['Molière', 'Jean Racine', 'Pierre Corneille', 'Jean de La Fontaine', 'Blaise Pascal', 'Madame de La Fayette', 'Nicolas Boileau', 'Jean de La Bruyère', 'François de La Rochefoucauld', 'Madame de Sévigné', 'Bossuet'],
        keywords: ['honnête homme', 'bienséance', 'tragédie', 'comédie', 'fable', 'moraliste'],
        color: '#ffd700'
    },
    lumieres: {
        name: 'Lumières',
        icon: '💡',
        period: 'XVIIIᵉ siècle',
        description: 'Raison critique, esprit philosophique et émancipation',
        authors: ['Voltaire', 'Jean-Jacques Rousseau', 'Denis Diderot', 'Montesquieu', 'Beaumarchais', 'Marivaux', 'L\'Abbé Prévost', 'Choderlos de Laclos', 'Bernardin de Saint-Pierre', 'Marquis de Sade', 'Condorcet'],
        keywords: ['raison', 'progrès', 'philosophie', 'encyclopédie', 'liberté', 'tolérance'],
        color: '#ffeb3b'
    },
    xixe: {
        name: 'XIXᵉ siècle',
        icon: '🏭',
        period: '1800 – 1900',
        description: 'Le siècle des révolutions : romantisme, réalisme, décadence',
        authors: ['Victor Hugo', 'Honoré de Balzac', 'Gustave Flaubert', 'Émile Zola', 'Stendhal', 'Charles Baudelaire', 'Arthur Rimbaud', 'Paul Verlaine', 'Gérard de Nerval', 'Alexandre Dumas', 'Guy de Maupassant', 'Théophile Gautier'],
        keywords: ['révolution', 'passion', 'société', 'naturalisme', 'symbolisme', 'spleen'],
        color: '#795548'
    },
    belleepoque: {
        name: 'Belle Époque',
        icon: '🎭',
        period: '1880 – 1914',
        description: 'Fêtes galantes, décadence et avant-gardes naissantes',
        authors: ['Marcel Proust', 'Colette', 'Guillaume Apollinaire', 'Paul Valéry', 'André Gide', 'Oscar Wilde', 'Rainer Maria Rilke', 'Joris-Karl Huysmans', 'Jean Lorrain', 'Maurice Maeterlinck'],
        keywords: ['salon', 'mondain', 'décadence', 'symbolisme', 'impressionnisme', 'art nouveau'],
        color: '#e91e63'
    },
    xxe: {
        name: 'XXᵉ siècle',
        icon: '💣',
        period: '1900 – 2000',
        description: 'Guerres, existentialisme et révolutions littéraires',
        authors: ['Albert Camus', 'Jean-Paul Sartre', 'Simone de Beauvoir', 'André Breton', 'Louis-Ferdinand Céline', 'Samuel Beckett', 'Marguerite Duras', 'Boris Vian', 'Marguerite Yourcenar', 'Antoine de Saint-Exupéry', 'Jean Genet'],
        keywords: ['absurde', 'existentialisme', 'surréalisme', 'engagement', 'modernité', 'guerre'],
        color: '#f44336'
    }
};

// ═══════════════════════════════════════════════════════════
// 🏛️ COURANTS LITTÉRAIRES
// ═══════════════════════════════════════════════════════════

const COURANTS = {
    humanisme: {
        name: 'Humanisme',
        icon: '📚',
        period: 'XVIᵉ siècle',
        description: 'Foi en l\'homme, éducation et sagesse antique retrouvée',
        authors: ['Michel de Montaigne', 'François Rabelais', 'Érasme', 'Thomas More', 'Étienne de La Boétie', 'Guillaume Budé'],
        keywords: ['homme', 'éducation', 'sagesse', 'vertu', 'raison', 'antiquité'],
        color: '#4caf50'
    },
    baroque: {
        name: 'Baroque',
        icon: '🎭',
        period: 'Fin XVIᵉ – début XVIIᵉ',
        description: 'Mouvement, illusion et vanité du monde',
        authors: ['Agrippa d\'Aubigné', 'Théophile de Viau', 'Saint-Amant', 'Tristan L\'Hermite', 'Góngora', 'Shakespeare'],
        keywords: ['inconstance', 'métamorphose', 'illusion', 'mort', 'vanité', 'spectacle'],
        color: '#9c27b0'
    },
    classicisme: {
        name: 'Classicisme',
        icon: '⚖️',
        period: 'XVIIᵉ siècle',
        description: 'Raison, équilibre et imitation des Anciens',
        authors: ['Molière', 'Jean Racine', 'Pierre Corneille', 'Jean de La Fontaine', 'Nicolas Boileau', 'Madame de La Fayette'],
        keywords: ['raison', 'règle', 'vraisemblance', 'bienséance', 'nature', 'universel'],
        color: '#607d8b'
    },
    romantisme: {
        name: 'Romantisme',
        icon: '🌹',
        period: '1820 – 1850',
        description: 'Exaltation du moi, passion et communion avec la nature',
        authors: ['Victor Hugo', 'Alphonse de Lamartine', 'Alfred de Musset', 'Alfred de Vigny', 'Gérard de Nerval', 'François-René de Chateaubriand', 'George Sand', 'Novalis', 'Lord Byron', 'John Keats'],
        keywords: ['moi', 'passion', 'nature', 'mélancolie', 'liberté', 'génie', 'sublime'],
        color: '#e91e63'
    },
    realisme: {
        name: 'Réalisme',
        icon: '🔬',
        period: '1850 – 1880',
        description: 'Peinture fidèle de la société et des moeurs',
        authors: ['Honoré de Balzac', 'Gustave Flaubert', 'Stendhal', 'Guy de Maupassant', 'Prosper Mérimée', 'Champfleury', 'Fiodor Dostoïevski', 'Léon Tolstoï'],
        keywords: ['société', 'observation', 'objectivité', 'bourgeoisie', 'argent', 'ambition'],
        color: '#795548'
    },
    naturalisme: {
        name: 'Naturalisme',
        icon: '🏭',
        period: '1870 – 1890',
        description: 'Roman expérimental et déterminisme social',
        authors: ['Émile Zola', 'Guy de Maupassant', 'Alphonse Daudet', 'Edmond et Jules de Goncourt', 'Joris-Karl Huysmans'],
        keywords: ['hérédité', 'milieu', 'expérimental', 'ouvrier', 'misère', 'déterminisme'],
        color: '#3e2723'
    },
    symbolisme: {
        name: 'Symbolisme',
        icon: '🌸',
        period: '1880 – 1900',
        description: 'Musique des mots, symboles et correspondances secrètes',
        authors: ['Charles Baudelaire', 'Stéphane Mallarmé', 'Paul Verlaine', 'Arthur Rimbaud', 'Jean Moréas', 'Gustave Kahn', 'Maurice Maeterlinck', 'Émile Verhaeren'],
        keywords: ['symbole', 'suggestion', 'musique', 'synesthésie', 'idéal', 'mystère'],
        color: '#7b1fa2'
    },
    surrealisme: {
        name: 'Surréalisme',
        icon: '👁️',
        period: '1920 – 1960',
        description: 'Libération de l\'inconscient et automatisme psychique',
        authors: ['André Breton', 'Paul Éluard', 'Louis Aragon', 'Robert Desnos', 'Philippe Soupault', 'Benjamin Péret', 'René Crevel', 'Antonin Artaud'],
        keywords: ['rêve', 'inconscient', 'automatisme', 'hasard', 'merveilleux', 'révolution'],
        color: '#ff5722'
    },
    existentialisme: {
        name: 'Existentialisme',
        icon: '🚬',
        period: '1940 – 1960',
        description: 'L\'existence précède l\'essence, liberté et engagement',
        authors: ['Jean-Paul Sartre', 'Albert Camus', 'Simone de Beauvoir', 'Jean Genet', 'Maurice Merleau-Ponty', 'Gabriel Marcel'],
        keywords: ['existence', 'liberté', 'absurde', 'engagement', 'angoisse', 'autrui'],
        color: '#212121'
    },
    absurde: {
        name: 'Absurde',
        icon: '🎪',
        period: '1950 – 1970',
        description: 'Théâtre de l\'incommunicabilité et du non-sens',
        authors: ['Samuel Beckett', 'Eugène Ionesco', 'Jean Genet', 'Arthur Adamov', 'Harold Pinter', 'Fernando Arrabal'],
        keywords: ['absurde', 'attente', 'langage', 'vide', 'dérision', 'tragique'],
        color: '#424242'
    }
};

let currentAmbiance = 'libre';
let currentExplorationMode = 'derives';

// ═══════════════════════════════════════════════════════════
// 🔄 NAVIGATION ENTRE MODES D'EXPLORATION
// ═══════════════════════════════════════════════════════════

function switchExplorationMode(mode) {
    currentExplorationMode = mode;
    
    // Mettre à jour les onglets
    document.querySelectorAll('.exploration-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    
    // Afficher la bonne barre
    document.getElementById('ambianceBar').style.display = mode === 'derives' ? 'flex' : 'none';
    document.getElementById('epoquesBar').style.display = mode === 'epoques' ? 'flex' : 'none';
    document.getElementById('courantsBar').style.display = mode === 'courants' ? 'flex' : 'none';
    
    // Réinitialiser les sélections
    document.querySelectorAll('.ambiance-pill').forEach(pill => pill.classList.remove('active'));
    if (mode === 'derives') {
        document.querySelector('[data-ambiance="libre"]')?.classList.add('active');
    }
    
    // Cacher l'intro
    document.getElementById('ambianceIntro').style.display = 'none';
}

// Sélectionner une époque
async function setEpoque(epoqueId) {
    const epoque = EPOQUES[epoqueId];
    if (!epoque) return;
    
    // Mettre à jour l'UI
    document.querySelectorAll('#epoquesBar .ambiance-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.ambiance === epoqueId);
    });
    
    // Afficher l'intro
    const introEl = document.getElementById('ambianceIntro');
    introEl.innerHTML = `
        <button class="close-intro" onclick="closeAmbianceIntro()" title="Fermer">✕</button>
        <h2>${epoque.icon} ${epoque.name}</h2>
        <p class="period-badge">${epoque.period}</p>
        <p>${epoque.description}</p>
        <div class="ambiance-tags">
            ${epoque.authors.slice(0, 6).map(a => `<span class="ambiance-tag" onclick="exploreFromAmbiance('${a.replace(/'/g, "\\'")}')" title="Explorer ${a}">${a}</span>`).join('')}
            ${epoque.authors.length > 6 ? `<span class="ambiance-tag more-authors" title="${epoque.authors.slice(6).join(', ')}">+${epoque.authors.length - 6}</span>` : ''}
        </div>
    `;
    introEl.style.display = 'block';
    
    // Effacer et recharger
    document.getElementById('feed').innerHTML = '';
    state.loading = false;
    
    toast(`${epoque.icon} ${epoque.name} – ${epoque.period}`);
    
    // Charger des auteurs de cette époque
    const shuffled = [...epoque.authors].sort(() => Math.random() - 0.5);
    for (const author of shuffled.slice(0, 3)) {
        await exploreAuthor(author);
    }
}

// Sélectionner un courant
async function setCourant(courantId) {
    const courant = COURANTS[courantId];
    if (!courant) return;
    
    // Mettre à jour l'UI
    document.querySelectorAll('#courantsBar .ambiance-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.ambiance === courantId);
    });
    
    // Afficher l'intro
    const introEl = document.getElementById('ambianceIntro');
    introEl.innerHTML = `
        <button class="close-intro" onclick="closeAmbianceIntro()" title="Fermer">✕</button>
        <h2>${courant.icon} ${courant.name}</h2>
        <p class="period-badge">${courant.period}</p>
        <p>${courant.description}</p>
        <div class="ambiance-tags">
            ${courant.authors.slice(0, 6).map(a => `<span class="ambiance-tag" onclick="exploreFromAmbiance('${a.replace(/'/g, "\\'")}')" title="Explorer ${a}">${a}</span>`).join('')}
            ${courant.authors.length > 6 ? `<span class="ambiance-tag more-authors" title="${courant.authors.slice(6).join(', ')}">+${courant.authors.length - 6}</span>` : ''}
        </div>
    `;
    introEl.style.display = 'block';
    
    // Effacer et recharger
    document.getElementById('feed').innerHTML = '';
    state.loading = false;
    
    toast(`${courant.icon} ${courant.name}`);
    
    // Charger des auteurs de ce courant
    const shuffled = [...courant.authors].sort(() => Math.random() - 0.5);
    for (const author of shuffled.slice(0, 3)) {
        await exploreAuthor(author);
    }
}

// Changer d'ambiance
async function setAmbiance(ambianceId) {
    const ambiance = AMBIANCES[ambianceId];
    if (!ambiance) return;
    
    currentAmbiance = ambianceId;
    
    // Mettre à jour l'UI
    document.querySelectorAll('#ambianceBar .ambiance-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.ambiance === ambianceId);
    });
    
    // Afficher l'intro si ce n'est pas "libre"
    const introEl = document.getElementById('ambianceIntro');
    if (ambianceId !== 'libre') {
        introEl.innerHTML = `
            <button class="close-intro" onclick="closeAmbianceIntro()" title="Fermer">✕</button>
            <h2>${ambiance.icon} ${ambiance.name}</h2>
            <p>${ambiance.description}</p>
            <div class="ambiance-tags">
                ${ambiance.authors.slice(0, 5).map(a => `<span class="ambiance-tag" onclick="exploreFromAmbiance('${a.replace(/'/g, "\\'")}')" title="Explorer ${a}">${a}</span>`).join('')}
                ${ambiance.authors.length > 5 ? `<span class="ambiance-tag more-authors" title="${ambiance.authors.slice(5).join(', ')}">+${ambiance.authors.length - 5} auteurs</span>` : ''}
            </div>
        `;
        introEl.style.display = 'block';
        introEl.style.position = 'relative';
    } else {
        introEl.style.display = 'none';
    }
    
    // Effacer le feed et recharger avec la nouvelle ambiance
    document.getElementById('feed').innerHTML = '';
    state.loading = false;
    
    // Toast
    toast(`${ambiance.icon} Mode ${ambiance.name} activé`);
    
    // Charger les textes de cette ambiance
    await loadAmbianceContent(ambianceId);
}

// Fermer l'intro d'ambiance
function closeAmbianceIntro() {
    const introEl = document.getElementById('ambianceIntro');
    introEl.style.display = 'none';
}

// Explorer un auteur depuis l'encart d'ambiance
async function exploreFromAmbiance(author) {
    toast(`🔍 Exploration de ${author}...`);
    await exploreAuthor(author);
}

// Charger le contenu d'une ambiance
async function loadAmbianceContent(ambianceId) {
    const ambiance = AMBIANCES[ambianceId];
    
    // Auteurs classiques par défaut
    const classicAuthors = ['Victor Hugo', 'Charles Baudelaire', 'Gustave Flaubert', 'Marcel Proust', 'Stendhal', 'Voltaire'];
    
    if (ambianceId === 'libre' || !ambiance.authors.length) {
        // Mode libre : utiliser un auteur classique au hasard
        await exploreAuthor(classicAuthors[Math.floor(Math.random() * classicAuthors.length)]);
        return;
    }
    
    // Choisir des auteurs/mots-clés de l'ambiance au hasard
    const shuffledAuthors = [...ambiance.authors].sort(() => Math.random() - 0.5);
    const shuffledKeywords = [...ambiance.keywords].sort(() => Math.random() - 0.5);
    
    // Charger 2-3 auteurs + 1-2 mots-clés pour variété
    const toLoad = [
        ...shuffledAuthors.slice(0, 2),
        ...shuffledKeywords.slice(0, 1)
    ];
    
    for (const term of toLoad) {
        await exploreAuthor(term);
    }
}

// Modifier randomJump pour respecter l'ambiance
// ═══════════════════════════════════════════════════════════
// �🎲 FONCTIONNALITÉS FUN - Le génie des graphes
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// 🏷️ SYSTÈME DE MOTS-CLÉS - Extraction et exploration
// ═══════════════════════════════════════════════════════════

// Dictionnaire de thèmes littéraires pour enrichir l'extraction
const LITERARY_THEMES = {
    emotions: ['amour', 'haine', 'joie', 'tristesse', 'mélancolie', 'désespoir', 'espoir', 'passion', 'colère', 'peur', 'angoisse', 'bonheur', 'souffrance', 'douleur', 'extase', 'ennui', 'solitude', 'nostalgie', 'regret', 'jalousie'],
    nature: ['forêt', 'mer', 'océan', 'montagne', 'rivière', 'fleuve', 'lac', 'ciel', 'étoiles', 'lune', 'soleil', 'aurore', 'crépuscule', 'nuit', 'jour', 'saison', 'printemps', 'été', 'automne', 'hiver', 'tempête', 'orage', 'pluie', 'neige', 'vent', 'fleur', 'arbre', 'jardin', 'campagne', 'désert'],
    existence: ['mort', 'vie', 'âme', 'destin', 'temps', 'éternité', 'infini', 'néant', 'existence', 'être', 'devenir', 'mémoire', 'oubli', 'rêve', 'sommeil', 'éveil', 'conscience', 'liberté', 'fatalité', 'hasard'],
    societe: ['roi', 'reine', 'prince', 'peuple', 'guerre', 'paix', 'justice', 'loi', 'pouvoir', 'gloire', 'honneur', 'vertu', 'crime', 'châtiment', 'révolte', 'révolution', 'patrie', 'exil', 'prison', 'esclavage'],
    spirituel: ['dieu', 'diable', 'ange', 'démon', 'paradis', 'enfer', 'péché', 'grâce', 'prière', 'foi', 'doute', 'mystère', 'sacré', 'profane', 'miracle', 'prophétie', 'apocalypse', 'résurrection', 'salut', 'damnation'],
    corps: ['coeur', 'yeux', 'regard', 'visage', 'main', 'sang', 'larme', 'sourire', 'baiser', 'étreinte', 'beauté', 'laideur', 'jeunesse', 'vieillesse', 'maladie', 'guérison', 'blessure', 'cicatrice'],
    art: ['poésie', 'musique', 'chant', 'danse', 'peinture', 'sculpture', 'théâtre', 'roman', 'conte', 'fable', 'légende', 'mythe', 'héros', 'muse', 'inspiration', 'génie', 'création'],
    voyage: ['voyage', 'chemin', 'route', 'errance', 'aventure', 'découverte', 'horizon', 'lointain', 'ailleurs', 'retour', 'départ', 'arrivée', 'navire', 'île', 'continent', 'orient', 'occident'],
    amour_passion: ['amant', 'amante', 'maîtresse', 'époux', 'épouse', 'fiancé', 'séduction', 'désir', 'volupté', 'ivresse', 'abandon', 'trahison', 'fidélité', 'rupture', 'retrouvailles']
};

// Mots vides à ignorer
const STOP_WORDS = new Set(['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi', 'dont', 'ce', 'cette', 'ces', 'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses', 'notre', 'votre', 'leur', 'nos', 'vos', 'leurs', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'on', 'se', 'ne', 'pas', 'plus', 'moins', 'tout', 'tous', 'toute', 'toutes', 'autre', 'autres', 'bien', 'peu', 'trop', 'aussi', 'encore', 'jamais', 'toujours', 'rien', 'personne', 'chaque', 'quelque', 'aucun', 'sans', 'avec', 'pour', 'par', 'dans', 'sur', 'sous', 'entre', 'vers', 'chez', 'comme', 'ainsi', 'alors', 'puis', 'quand', 'avoir', 'faire', 'dire', 'voir', 'aller', 'venir', 'pouvoir', 'vouloir', 'devoir', 'falloir', 'savoir', 'prendre', 'mettre', 'fait', 'dit', 'sont', 'ont', 'aux', 'the', 'and', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'for', 'with', 'from', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'nor', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'now', 'its', 'this', 'that', 'these', 'those', 'myself', 'our', 'ours', 'ourselves', 'your', 'yours', 'yourself', 'yourselves', 'him', 'his', 'himself', 'her', 'hers', 'herself', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'whom', 'whose']);

function extractKeywords(text, title, author, tag) {
    const keywords = new Set();
    const fullText = (text + ' ' + title).toLowerCase();
    
    // 1. Chercher les thèmes littéraires présents dans le texte
    for (const [category, themes] of Object.entries(LITERARY_THEMES)) {
        for (const theme of themes) {
            if (fullText.includes(theme.toLowerCase())) {
                keywords.add(theme);
                if (keywords.size >= 8) break;
            }
        }
        if (keywords.size >= 8) break;
    }
    
    // 2. Extraire les mots significatifs du texte
    const words = fullText
        .replace(/[.,;:!?()\[\]{}"']/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 4 && !STOP_WORDS.has(w));
    
    // Compter les occurrences
    const wordCount = {};
    words.forEach(w => wordCount[w] = (wordCount[w] || 0) + 1);
    
    // Ajouter les mots les plus fréquents
    const sorted = Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    for (const [word] of sorted) {
        if (keywords.size < 5 && word.length > 3 && !keywords.has(word)) {
            keywords.add(word);
        }
    }
    
    // 3. Ajouter le genre comme mot-clé si pas assez
    if (tag && keywords.size < 5) {
        keywords.add(tag);
    }
    
    return [...keywords].slice(0, 5);
}

// Explorer un mot-clé
async function exploreKeyword(keyword) {
    toast(`🏷️ Exploration de #${keyword}...`);
    await exploreAuthor(keyword);
}

document.onkeydown = e => { if (e.key === 'Escape') closeReader(); };

init();