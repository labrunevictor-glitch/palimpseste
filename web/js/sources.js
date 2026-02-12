/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PALIMPSESTE - Module Sources (sources.js)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Gestion des sources de textes littéraires :
 * - Wikisource (multilingue)
 * - Project Gutenberg
 * - PoetryDB
 * - Archive.org + Open Library
 * - Sacred Texts Archive (textes religieux/mystiques)
 * - Gallica (BnF)
 * - Perseus Digital Library (classiques grecs/latins)
 * - Navigation par catégories
 * 
 * Dépendances : app.js (state, toast), config.js (supabase)
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════
// 🌍 CONFIGURATION MULTILINGUE - Littérature mondiale
// ═══════════════════════════════════════════════════════════
const WIKISOURCES = [
    // Langues modernes
    { lang: 'fr', name: 'Français', url: 'https://fr.wikisource.org' },
    { lang: 'en', name: 'English', url: 'https://en.wikisource.org' },
    { lang: 'de', name: 'Deutsch', url: 'https://de.wikisource.org' },
    { lang: 'it', name: 'Italiano', url: 'https://it.wikisource.org' },
    { lang: 'es', name: 'Español', url: 'https://es.wikisource.org' },
    { lang: 'pt', name: 'Português', url: 'https://pt.wikisource.org' },
    { lang: 'ru', name: 'Русский', url: 'https://ru.wikisource.org' },
    { lang: 'zh', name: '中文', url: 'https://zh.wikisource.org' },
    { lang: 'ja', name: '日本語', url: 'https://ja.wikisource.org' },
    { lang: 'ar', name: 'العربية', url: 'https://ar.wikisource.org' },
    { lang: 'el', name: 'Ελληνικά (moderne)', url: 'https://el.wikisource.org' },
    // Langues anciennes
    { lang: 'la', name: 'Latina', url: 'https://la.wikisource.org' },
    { lang: 'grc', name: 'Ἀρχαία Ἑλληνική', url: null, perseusOnly: true }, // Pas de Wikisource dédié, utilise Perseus
    { lang: 'he', name: 'עברית', url: 'https://he.wikisource.org' },
    { lang: 'sa', name: 'संस्कृतम्', url: 'https://sa.wikisource.org' },
    { lang: 'yi', name: 'ייִדיש', url: 'https://yi.wikisource.org' },
];

// Sources alternatives (APIs propres sans scories)
const ALT_SOURCES = {
    poetrydb: {
        name: 'PoetryDB',
        url: 'https://poetrydb.org',
        lang: 'en'
    },
    gutenberg: {
        name: 'Project Gutenberg',
        url: 'https://www.gutenberg.org'
    },
    // ═══════════════════════════════════════════════════════════
    //  ARCHIVE.ORG - Internet Archive + Open Library
    // ═══════════════════════════════════════════════════════════
    archive: {
        name: 'Archive.org + Open Library',
        url: 'https://archive.org',
        openLibraryUrl: 'https://openlibrary.org'
    },
    // ═══════════════════════════════════════════════════════════
    //  INTERNET SACRED TEXT ARCHIVE - Textes religieux et mystiques
    // ═══════════════════════════════════════════════════════════
    sacredtexts: {
        name: 'Sacred Texts Archive',
        url: 'https://sacred-texts.com',
        lang: 'en'
    },
    // ═══════════════════════════════════════════════════════════
    //  GALLICA - Bibliothèque nationale de France
    // ═══════════════════════════════════════════════════════════
    gallica: {
        name: 'Gallica (BnF)',
        url: 'https://gallica.bnf.fr',
        lang: 'fr'
    },
    // ═══════════════════════════════════════════════════════════
    //  PERSEUS DIGITAL LIBRARY - Textes classiques grecs/latins
    // ═══════════════════════════════════════════════════════════
    perseus: {
        name: 'Perseus Digital Library',
        url: 'https://www.perseus.tufts.edu',
        lang: ['la', 'el', 'en']
    }
};

// Mots-clés de recherche par langue (termes qui fonctionnent bien sur Wikisource)
const SEARCH_TERMS = {
    fr: [],
    en: [],
    de: [],
    it: [],
    es: [],
    pt: [],
    ru: [],
    la: ['carmen', 'ode', 'epistula', 'liber', 'fabula', 'epigramma', 'versus'],
    grc: ['ποίημα', 'τραγῳδία', 'ἔπος', 'Ὅμηρος', 'Πλάτων', 'Ἀριστοτέλης', 'μῦθος'],
    zh: [],
    ja: [],
    ar: [],
    el: [],
    he: ['תורה', 'תהלים', 'משלי', 'שיר', 'ספר'],
    sa: ['गीता', 'वेद', 'उपनिषद', 'महाभारत', 'रामायण', 'श्लोक'],
    yi: [],
};

// ═══════════════════════════════════════════════════════════
// 🗂️ COULEURS ET BRANCHES DE GENRE
// ═══════════════════════════════════════════════════════════

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

// Branches enrichies par genre (Structure de concepts uniquement)
const GENRE_BRANCHES = {
    'philosophie': {
        'Courants': ['Rationalisme', 'Empirisme', 'Idéalisme', 'Existentialisme', 'Stoïcisme', 'Épicurisme', 'Scepticisme', 'Phénoménologie'],
        'Domaines': ['Métaphysique', 'Éthique', 'Épistémologie', 'Logique', 'Esthétique', 'Philosophie politique', 'Ontologie']
    },
    'poésie': {
        'Formes': ['Sonnet', 'Ode', 'Élégie', 'Ballade', 'Fable', 'Épopée', 'Haïku'],
        'Mouvements': ['Romantisme', 'Parnasse', 'Symbolisme', 'Surréalisme', 'Baroque']
    },
    'roman': {
        'Genres': ['Roman épistolaire', 'Roman historique', 'Roman réaliste', 'Roman naturaliste', 'Roman psychologique']
    },
    'théâtre': {
        'Genres': ['Tragédie', 'Comédie', 'Drame', 'Farce', 'Vaudeville']
    },
    'conte': {
        'Types': ['Conte merveilleux', 'Conte philosophique', 'Conte moral', 'Conte fantastique']
    },
    'nouvelle': {
        'Styles': ['Nouvelle réaliste', 'Nouvelle fantastique', 'Nouvelle psychologique']
    },
    'mystique': {
        'Traditions': ['Mystique chrétienne', 'Mystique soufie', 'Kabbale']
    },
    'fable': {
        'Types': ['Animalière']
    },
    'histoire': {
        'Périodes': ['Antiquité', 'Moyen Âge', 'Renaissance', 'Révolution française', 'XIXe siècle']
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

// ═══════════════════════════════════════════════════════════
// 🌐 ÉTAT ET CONFIGURATION DE LANGUE
// ═══════════════════════════════════════════════════════════

// État de la langue courante ('all' = toutes langues, ou code langue spécifique)
let selectedLang = 'all';
let currentWikisource = WIKISOURCES[0];

// État de la navigation par catégorie
let currentCategoryPath = [];
let currentBrowseMode = null; // 'category' ou 'search'

// Fonction pour changer la langue (contenus ET interface)
function changeLanguage(lang) {
    selectedLang = lang;
    localStorage.setItem('palimpseste_lang', lang);
    
    // Changer aussi la langue de l'interface si supportée
    const supportedUILanguages = ['fr', 'en', 'de', 'es', 'it', 'pt', 'ru', 'zh', 'ja', 'ar'];
    if (supportedUILanguages.includes(lang) && typeof changeUILanguage === 'function') {
        changeUILanguage(lang);
    } else {
        // Toast seulement si l'UI n'a pas changé (sinon changeUILanguage affiche déjà un toast)
        const langName = WIKISOURCES.find(w => w.lang === lang)?.name || lang;
        toast(lang === 'all' ? (typeof t === 'function' ? t('all_languages_activated') : '🌍 Toutes les langues activées') : `${typeof t === 'function' ? t('language_changed') : '🌐 Langue:'} ${langName}`);
    }
    
    // Recharger le feed avec la nouvelle langue
    shuffleFeed();
}

// Récupérer les Wikisources selon le filtre de langue
function getActiveWikisources() {
    if (selectedLang === 'all') {
        // Exclure les langues perseusOnly du mode "toutes langues"
        return WIKISOURCES.filter(w => !w.perseusOnly);
    }
    // Pour une langue spécifique, retourner seulement si elle a un wikisource
    const ws = WIKISOURCES.filter(w => w.lang === selectedLang && !w.perseusOnly);
    return ws;
}

// Vérifie si la langue sélectionnée utilise uniquement Perseus
function isPerseusOnlyLanguage() {
    const ws = WIKISOURCES.find(w => w.lang === selectedLang);
    return ws?.perseusOnly === true;
}

// ═══════════════════════════════════════════════════════════
// 🔍 RECHERCHE ET RÉCUPÉRATION DE TEXTES
// ═══════════════════════════════════════════════════════════

// Recherche via l'API - supporte plusieurs Wikisources (y compris multilingue)
async function searchTexts(query, limit = 20, wikisource = currentWikisource, offset = 0) {
    // Pour le Wikisource multilingue (grec ancien, etc.), préfixer la recherche avec le code langue
    let searchQuery = query;
    if (wikisource.multilingual) {
        // Sur wikisource.org, les pages sont dans des catégories ou préfixées par langue
        // On cherche dans les catégories de la langue (ex: "Ἀρχαία Ἑλληνική" ou "Ancient Greek")
        searchQuery = `${query} incategory:"${wikisource.lang.toUpperCase()}" OR ${query}`;
    }
    
    const url = `${wikisource.url}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srlimit=${limit}&sroffset=${offset}&srnamespace=0&format=json&origin=*`;

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
                    categories: (data.parse.categories || []).map(c => c['*']).filter(Boolean),
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

// ═══════════════════════════════════════════════════════════
// 🔬 ANALYSE ET NETTOYAGE HTML
// ═══════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════
// 📚 PROJECT GUTENBERG
// ═══════════════════════════════════════════════════════════
async function fetchGutenberg() {
    try {
        const fetchTextWithCorsFallback = async (rawUrl) => {
            if (!rawUrl) return null;
            
            // Utiliser notre proxy Gutenberg pour contourner CORS
            const proxyUrl = `/api/gutenberg-proxy?url=${encodeURIComponent(rawUrl)}`;
            
            try {
                const res = await fetch(proxyUrl);
                if (res.ok) return await res.text();
                
                // Si le proxy échoue, on log l'erreur mais on continue
                console.warn('Gutenberg proxy failed for:', rawUrl, res.status);
            } catch (err) {
                console.warn('Gutenberg fetch error:', err.message);
            }
            
            return null;
        };

        // Source API (CORS OK) : Gutendex (wrapper Gutenberg)
        // Objectif: récupérer quelques livres aléatoires sans listes en dur.
        const page = Math.floor(Math.random() * 50) + 1;
        const langParam = (selectedLang === 'en') ? 'en' : (selectedLang === 'fr' ? 'fr' : 'en');
        const url = `https://gutendex.com/books?languages=${encodeURIComponent(langParam)}&page=${page}`;

        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        const books = Array.isArray(data.results) ? data.results : [];
        if (books.length === 0) return [];

        // Prendre 2-3 livres au hasard (Fisher-Yates)
        const shuffled = shuffleArray(books.slice(0)).slice(0, 3);
        const results = [];

        for (const book of shuffled) {
            const id = book.id;
            const title = book.title;
            const author = book.authors?.map(a => a.name).join(', ') || 'Inconnu';

            // Tenter de trouver un format texte brut
            const formats = book.formats || {};
            const txtUrl =
                formats['text/plain; charset=utf-8'] ||
                formats['text/plain; charset=us-ascii'] ||
                formats['text/plain'] ||
                null;

            let excerpt = '';
            let finalUrl = `https://www.gutenberg.org/ebooks/${id}`;

            if (txtUrl) {
                try {
                    const full = await fetchTextWithCorsFallback(txtUrl);
                    if (full) {

                        // Nettoyage Gutenberg header/footer si présent
                        const startMarker = /\*\*\*\s*START OF(.*?)\*\*\*/is;
                        const endMarker = /\*\*\*\s*END OF(.*?)\*\*\*/is;
                        let body = full;
                        const startMatch = body.match(startMarker);
                        if (startMatch) {
                            body = body.slice(startMatch.index + startMatch[0].length);
                        }
                        const endMatch = body.match(endMarker);
                        if (endMatch) {
                            body = body.slice(0, endMatch.index);
                        }

                        // Prendre un extrait lisible (pas trop court)
                        const clean = body.replace(/\r\n/g, '\n').trim();
                        const start = Math.min(clean.length - 1, Math.floor(Math.random() * Math.max(1, clean.length / 3)));
                        const paraStart = clean.lastIndexOf('\n\n', start);
                        const from = paraStart > 0 ? paraStart : 0;
                        excerpt = clean.slice(from, from + 2200).trim();

                        // Fallback si extrait trop court
                        if (excerpt.length < 300) {
                            excerpt = clean.slice(0, 2200).trim();
                        }
                    }
                } catch (e) {
                    // CORS ou autres erreurs: on garde un fallback sans bloquer le flux
                    excerpt = '';
                }
            }

            // Si le texte n'a pas pu être récupéré (CORS/format), on affiche une carte “lien”
            if (!excerpt) {
                excerpt = `Texte non chargé automatiquement.\n\nOuvrir sur Project Gutenberg → ${finalUrl}`;
            } else {
                excerpt = `${excerpt}\n\n[...] (Lire la suite sur Project Gutenberg)\n${finalUrl}`;
            }

            results.push({
                title,
                text: excerpt,
                author,
                source: 'gutenberg',
                lang: (book.languages && book.languages[0]) ? book.languages[0] : langParam,
                url: finalUrl,
                isPreloaded: true
            });
        }

        return results;
    } catch (e) {
        console.error('Gutenberg error:', e);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════
// 📜 POETRYDB - Poésie anglaise de qualité
// ═══════════════════════════════════════════════════════════
async function fetchPoetryDB() {
    try {
        const fetchJsonWithCorsFallback = async (rawUrl) => {
            if (!rawUrl) return null;

            const tryFetch = async (url) => {
                const res = await fetch(url);
                if (!res.ok) return null;
                const text = await res.text();
                try {
                    return JSON.parse(text);
                } catch (_) {
                    return null;
                }
            };

            // 1) direct
            try {
                const direct = await tryFetch(rawUrl);
                if (direct) return direct;
            } catch (_) {
                // potentiellement CORS
            }

            // 2) fallbacks CORS (services tiers) - utilisés uniquement si le direct échoue.
            const proxies = [
                `https://api.allorigins.win/raw?url=${encodeURIComponent(rawUrl)}`,
                `https://corsproxy.io/?${encodeURIComponent(rawUrl)}`
            ];

            for (const proxied of proxies) {
                try {
                    const viaProxy = await tryFetch(proxied);
                    if (viaProxy) return viaProxy;
                } catch (_) {
                    // continuer
                }
            }

            return null;
        };

        // 1. Récupérer la liste de TOUS les auteurs disponibles (dynamique)
        const authorsData = await fetchJsonWithCorsFallback('https://poetrydb.org/author');
        
        const authors = Array.isArray(authorsData?.authors)
            ? authorsData.authors
            : (Array.isArray(authorsData) ? authorsData : []);

        if (!authors || authors.length === 0) return [];

        // 2. Essayer quelques auteurs au hasard (PoetryDB peut renvoyer vide/erreur selon proxy)
        for (let attempt = 0; attempt < 5; attempt++) {
            const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
            const poems = await fetchJsonWithCorsFallback(`https://poetrydb.org/author/${encodeURIComponent(randomAuthor)}/title,author,lines`);

            if (Array.isArray(poems) && poems.length > 0) {
                const shuffled = shuffleArray(poems.slice(0)).slice(0, 5);
                return shuffled.map(poem => ({
                    title: poem.title,
                    text: Array.isArray(poem.lines) ? poem.lines.join('\n') : poem.lines,
                    author: poem.author,
                    source: 'poetrydb',
                    lang: 'en'
                }));
            }
        }
    } catch (e) {
        console.error('PoetryDB error:', e);
    }
    return [];
}

// ═══════════════════════════════════════════════════════════
//  ARCHIVE.ORG - Internet Archive (API Recherche Dynamique)
// ═══════════════════════════════════════════════════════════
const ARCHIVE_TIMEOUT_MS = 8000;
const ARCHIVE_RETRIES = 1;

// Détecte si on est en environnement local (dev)
function isLocalEnvironment() {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.');
}

function archiveProxyUrl(url) {
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
}

function localArchiveProxyUrl(url) {
    // En local, pas de proxy serverless - on utilise directement les proxies CORS publics
    if (isLocalEnvironment()) {
        return null;
    }
    try {
        return `${window.location.origin}/api/archive-proxy?url=${encodeURIComponent(url)}`;
    } catch (e) {
        return null;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = ARCHIVE_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, {
            redirect: 'follow',
            cache: 'no-store',
            ...options,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

async function fetchWithRetry(url, options = {}, retries = ARCHIVE_RETRIES, timeoutMs = ARCHIVE_TIMEOUT_MS) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetchWithTimeout(url, options, timeoutMs);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res;
        } catch (err) {
            lastError = err;
            if (attempt < retries) await sleep(350 * (attempt + 1));
        }
    }
    throw lastError;
}

async function fetchArchiveJson(url) {
    try {
        const localProxy = localArchiveProxyUrl(url);
        if (localProxy) {
            try {
                const res = await fetchWithRetry(localProxy);
                return await res.json();
            } catch (err) {
                return null;
            }
        }
        const res = await fetchWithRetry(url);
        return await res.json();
    } catch (err) {
        try {
            const res = await fetchWithRetry(archiveProxyUrl(url), {}, ARCHIVE_RETRIES, ARCHIVE_TIMEOUT_MS + 2000);
            return await res.json();
        } catch (proxyErr) {
            console.warn('Archive.org JSON fetch failed', proxyErr);
            return null;
        }
    }
}

async function fetchArchiveText(url) {
    try {
        const localProxy = localArchiveProxyUrl(url);
        if (localProxy) {
            try {
                const res = await fetchWithRetry(localProxy);
                return await res.text();
            } catch (err) {
                return null;
            }
        }
        const res = await fetchWithRetry(url);
        return await res.text();
    } catch (err) {
        try {
            const res = await fetchWithRetry(archiveProxyUrl(url), {}, ARCHIVE_RETRIES, ARCHIVE_TIMEOUT_MS + 2000);
            return await res.text();
        } catch (proxyErr) {
            return null;
        }
    }
}

async function fetchArchiveMetadata(identifier) {
    const url = `https://archive.org/metadata/${encodeURIComponent(identifier)}`;
    return await fetchArchiveJson(url);
}

async function fetchArchiveTextByIdentifier(identifier) {
    if (!identifier) return null;
    const metadata = await fetchArchiveMetadata(identifier);
    const meta = metadata?.metadata || {};
    const accessRestricted = (meta['access-restricted'] ?? meta.access_restricted ?? meta.accessRestricted);
    if (accessRestricted === true || accessRestricted === 1 || `${accessRestricted}`.toLowerCase() === 'true' || `${accessRestricted}` === '1') {
        return null;
    }
    const files = Array.isArray(metadata?.files) ? metadata.files : [];

    const preferredFiles = files
        .filter(f => f?.name && typeof f.name === 'string')
        .filter(f => {
            const name = f.name.toString().toLowerCase();
            if (!name.endsWith('.txt')) return false;
            if (f.private === true || `${f.private}`.toLowerCase() === 'true') return false;
            const fmt = (f.format || '').toString().toLowerCase();
            if (fmt.includes('pdf')) return false;
            return fmt.includes('djvutxt') || fmt.includes('text') || fmt.includes('plain');
        })
        .map(f => f.name);

    const uniqueNames = Array.from(new Set(preferredFiles));
    const candidates = [...uniqueNames].filter(Boolean);

    for (const name of candidates) {
        const safeName = encodeURIComponent(name).replace(/%2F/g, '/');
        const serveUrl = `https://archive.org/serve/${identifier}/${safeName}`;
        const streamUrl = `https://archive.org/stream/${identifier}/${safeName}`;
        const downloadUrl = `https://archive.org/download/${identifier}/${safeName}`;

        const textFromServe = await fetchArchiveText(serveUrl);
        if (textFromServe && textFromServe.length > 200) return textFromServe;

        const textFromStream = await fetchArchiveText(streamUrl);
        if (textFromStream && textFromStream.length > 200) return textFromStream;

        const textFromDownload = await fetchArchiveText(downloadUrl);
        if (textFromDownload && textFromDownload.length > 200) return textFromDownload;
    }

    return null;
}

async function fetchArchiveOrg() {
    try {
        // 1. Déterminer la langue (Archive.org utilise des codes ISO 639-2)
        // Mapping des codes de langue vers les codes Archive.org
        const langMapping = {
            'fr': 'fre',
            'en': 'eng',
            'de': 'ger',
            'it': 'ita',
            'es': 'spa',
            'pt': 'por',
            'ru': 'rus',
            'zh': 'chi',
            'ja': 'jpn',
            'ar': 'ara',
            'la': 'lat',
            'grc': 'grc',  // Grec ancien
            'el': 'gre',   // Grec moderne
            'sa': 'san',   // Sanskrit
            'he': 'heb',   // Hébreu
            'ang': 'ang',  // Vieil anglais
            'fro': 'fro',  // Ancien français
        };
        
        let language;
        if (selectedLang === 'all' || !selectedLang) {
            // Par défaut, chercher en français et anglais
            language = '(fre OR eng)';
        } else if (langMapping[selectedLang]) {
            language = langMapping[selectedLang];
        } else {
            // Langue non supportée par Archive.org, utiliser fr/en par défaut
            language = '(fre OR eng)';
        }

        // 2. Paramètres aléatoires pour varier les résultats à chaque appel
        // Page aléatoire étendue pour explorer le catalogue en profondeur
        const page = Math.floor(Math.random() * 100) + 1;
        
        // Requête API "Advanced Search" d'Archive.org
        // mediatype:texts (Tout le catalogue textuel disponible) - Pas de restriction de sujet
        const query = `mediatype:texts AND language:${language}`;
        const fields = 'identifier,title,creator,date';
        
        // URL de l'API (supporte CORS)
        const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl=${fields}&rows=3&page=${page}&output=json&sort=random`;
        
        const data = await fetchArchiveJson(url);
        const docs = data?.response?.docs || [];

        const results = [];
        
        // 3. Récupérer le contenu textuel brut pour chaque résultat
        for (const doc of docs) {
            if (!doc?.identifier) continue;
            // URL du fichier texte brut (format classique Archive.org : identifier_djvu.txt)
            try {
                const fullText = await fetchArchiveTextByIdentifier(doc.identifier);
                if (fullText) {
                    
                    // 4. Nettoyage et découpage (l'OCR brut est souvent sale)
                    // On saute le début (souvent des métadonnées) et on prend un gros extrait
                    if (fullText.length > 2000) {
                        // Chercher un début de paragraphe propre après le header
                        const start = Math.floor(Math.random() * (fullText.length / 4));
                        const cleanStart = fullText.indexOf('\n\n', start);
                        const excerptStart = cleanStart > -1 ? cleanStart : start;
                        let excerpt = fullText.substring(excerptStart, excerptStart + 2500);
                        
                        // Nettoyage basique des artefacts OCR
                        excerpt = excerpt.replace(/_/g, ' ')
                                         .replace(/[\d+]/g, '') // Numéros de pages
                                         .replace(/\n{3,}/g, '\n\n') // Trop de sauts
                                         .trim();

                        if (excerpt.length > 200) {
                            results.push({
                                title: doc.title,
                                text: excerpt + '\n\n[...] (Read more on Archive.org)',
                                author: Array.isArray(doc.creator) ? doc.creator[0] : (doc.creator || 'Archive.org'),
                                source: 'archive', // Identifiant source
                                url: `https://archive.org/details/${doc.identifier}`,
                                lang: selectedLang && selectedLang !== 'all' ? selectedLang : 'en'
                            });
                        }
                    }
                }
            } catch (err) {
                console.warn(`Archive.org text fetch failed for ${doc.identifier}`, err);
            }
        }
        
        return results;

    } catch (e) {
        console.error('Archive.org search error:', e);
        return [];
    }
}

/**
 * Recherche spécifique sur Archive.org (par auteur/sujet)
 */
async function searchArchiveOrg(queryTerm) {
    // Vérifier si la source est autorisée
    const isAllowed = !state.activeSourceFilter || state.activeSourceFilter.includes('archive') || state.activeSourceFilter.includes('all');
    if (!isAllowed) return [];

    try {
        let language = '(fre OR eng)';
        if (selectedLang === 'fr') language = 'fre';
        else if (selectedLang === 'en') language = 'eng';

        // Recherche par créateur ou titre ou sujet
        const q = `(creator:(${queryTerm}) OR title:(${queryTerm})) AND mediatype:texts AND language:${language}`;
        const fields = 'identifier,title,creator,date';
        
        // Priorité aux résultats les plus pertinents (pas random)
        const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl=${fields}&rows=5&page=1&output=json`;
        
        const data = await fetchArchiveJson(url);
        const docs = data?.response?.docs || [];
        const results = [];

        for (const doc of docs) {
             if (!doc?.identifier) continue;
             try {
            const fullText = await fetchArchiveTextByIdentifier(doc.identifier);
            if (fullText) {
                    
                    if (fullText.length > 500) {
                        // Pour Archive.org, le texte brut est souvent très long et sale au début
                        // On essaie de trouver un morceau potable
                        const start = fullText.indexOf('\n\n', 500); // Sauter le header
                        const excerptStart = start > -1 ? start : 0;
                        let excerpt = fullText.substring(excerptStart, excerptStart + 3000);
                        
                        // Nettoyage
                        excerpt = excerpt.replace(/_/g, ' ')
                                         .replace(/[\d+]/g, '')
                                         .replace(/\n{3,}/g, '\n\n')
                                         .trim();

                        results.push({
                            title: doc.title,
                            text: excerpt + '\n\n[...] (Lire la suite sur Archive.org)',
                            author: Array.isArray(doc.creator) ? doc.creator[0] : (doc.creator || 'Archive.org'),
                            source: 'archive',
                            url: `https://archive.org/details/${doc.identifier}`,
                            lang: (doc.language === 'fre' || selectedLang === 'fr') ? 'fr' : 'en',
                            isPreloaded: true
                        });
                    }
                }
             } catch (err) { console.warn('Archive text fetch fail', err); }
        }
        return results;

    } catch (e) {
        console.error('Archive search specific error:', e);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════
// 📖 OPEN LIBRARY - Recherche combinée avec Archive.org
// ═══════════════════════════════════════════════════════════
async function fetchOpenLibrary() {
    try {
        // Open Library search API - cherche des livres du domaine public
        const subjects = ['classic_literature', 'poetry', 'philosophy', 'mythology', 'fiction'];
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        
        // API Open Library - recherche par sujet
        const url = `https://openlibrary.org/subjects/${subject}.json?limit=10&offset=${Math.floor(Math.random() * 50)}`;
        
        const res = await fetchWithTimeout(url);
        if (!res.ok) return [];
        const data = await res.json();
        
        const works = data?.works || [];
        if (works.length === 0) return [];
        
        const results = [];
        const shuffled = shuffleArray(works.slice(0)).slice(0, 3);
        
        for (const work of shuffled) {
            // Vérifier si le livre est disponible sur Archive.org via l'IA (lending)
            // On cherche l'identifiant Archive.org dans les métadonnées
            const iaId = work.ia;
            const ocaid = Array.isArray(iaId) ? iaId[0] : iaId;
            
            if (ocaid) {
                // Essayer de récupérer le texte via Archive.org
                const fullText = await fetchArchiveTextByIdentifier(ocaid);
                if (fullText && fullText.length > 500) {
                    const start = fullText.indexOf('\n\n', 500);
                    const excerptStart = start > -1 ? start : 0;
                    let excerpt = fullText.substring(excerptStart, excerptStart + 2500);
                    
                    excerpt = excerpt.replace(/_/g, ' ')
                                     .replace(/[\d+]/g, '')
                                     .replace(/\n{3,}/g, '\n\n')
                                     .trim();
                    
                    if (excerpt.length > 200) {
                        results.push({
                            title: work.title,
                            text: excerpt + '\n\n[...] (Lire la suite)',
                            author: work.authors?.[0]?.name || 'Inconnu',
                            source: 'archive',
                            url: `https://openlibrary.org${work.key}`,
                            lang: 'en',
                            isPreloaded: true
                        });
                    }
                }
            }
        }
        
        return results;
    } catch (e) {
        console.error('Open Library error:', e);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════
// 📜 SACRED TEXTS ARCHIVE - Textes religieux et mystiques
// ═══════════════════════════════════════════════════════════

// Catalogue de textes disponibles sur sacred-texts.com
// Ces URLs sont stables et bien documentées
// Note: Les textes sont des traductions anglaises sauf indication contraire
const SACRED_TEXTS_CATALOG = [
    // Textes bouddhistes (traductions anglaises du pali/sanskrit)
    { path: '/bud/sbe10/sbe1003.htm', title: 'Dhammapada - Chapter 1', author: 'Buddhist Tradition', category: 'Buddhism', lang: 'en', originalLang: 'pi' },
    { path: '/bud/sbe10/sbe1004.htm', title: 'Dhammapada - Chapter 2', author: 'Buddhist Tradition', category: 'Buddhism', lang: 'en', originalLang: 'pi' },
    { path: '/bud/btg/btg01.htm', title: 'The Gospel of Buddha', author: 'Paul Carus', category: 'Buddhism', lang: 'en' },
    // Textes taoïstes (traductions anglaises du chinois)
    { path: '/tao/taote.htm', title: 'Tao Te Ching', author: 'Lao Tzu', category: 'Taoism', lang: 'en', originalLang: 'zh' },
    { path: '/tao/salt/salt01.htm', title: 'The Sayings of Lao Tzu', author: 'Lao Tzu', category: 'Taoism', lang: 'en', originalLang: 'zh' },
    // Textes hindous (traductions anglaises du sanskrit)
    { path: '/hin/gita/agsgita.htm', title: 'Bhagavad Gita - Introduction', author: 'Hindu Tradition', category: 'Hinduism', lang: 'en', originalLang: 'sa' },
    { path: '/hin/sbe08/sbe0802.htm', title: 'Bhagavad Gita - Chapter 1', author: 'Hindu Tradition', category: 'Hinduism', lang: 'en', originalLang: 'sa' },
    // Textes islamiques/soufis (traductions anglaises du persan/arabe)
    { path: '/isl/masnavi/msn01.htm', title: 'Masnavi - Book 1', author: 'Rumi', category: 'Islam/Sufi', lang: 'en', originalLang: 'fa' },
    { path: '/isl/hanged/hanged.htm', title: 'The Hanged Poems', author: 'Arabic Tradition', category: 'Islam', lang: 'en', originalLang: 'ar' },
    // Textes chrétiens mystiques (traductions anglaises du latin)
    { path: '/chr/tic/tic00.htm', title: 'Imitation of Christ - Preface', author: 'Thomas à Kempis', category: 'Christianity', lang: 'en', originalLang: 'la' },
    { path: '/chr/ecf/101/1010001.htm', title: 'Confessions - Book 1', author: 'Saint Augustine', category: 'Christianity', lang: 'en', originalLang: 'la' },
    // Classiques grecs (traductions anglaises)
    { path: '/cla/homer/ili/ili01.htm', title: 'Iliad - Book 1', author: 'Homer', category: 'Classics', lang: 'en', originalLang: 'grc' },
    { path: '/cla/homer/ody/ody01.htm', title: 'Odyssey - Book 1', author: 'Homer', category: 'Classics', lang: 'en', originalLang: 'grc' },
    { path: '/cla/plato/allegory.htm', title: 'Allegory of the Cave', author: 'Plato', category: 'Classics', lang: 'en', originalLang: 'grc' },
    // Textes égyptiens (traductions anglaises)
    { path: '/egy/ebod/ebod04.htm', title: 'Egyptian Book of the Dead', author: 'Egyptian Tradition', category: 'Egypt', lang: 'en', originalLang: 'egy' },
    // Kabbale (traductions anglaises de l'hébreu)
    { path: '/jud/zdm/zdm001.htm', title: 'Sepher Ha-Zohar - Introduction', author: 'Kabbalistic Tradition', category: 'Judaism/Kabbalah', lang: 'en', originalLang: 'he' },
    // Textes nordiques (traductions anglaises du vieux norrois)
    { path: '/neu/poe/poe03.htm', title: 'Völuspá (Prophecy of the Seeress)', author: 'Poetic Edda', category: 'Norse', lang: 'en', originalLang: 'non' },
    { path: '/neu/poe/poe04.htm', title: 'Hávamál (Sayings of the High One)', author: 'Poetic Edda', category: 'Norse', lang: 'en', originalLang: 'non' },
    // Littérature médiévale anglaise
    { path: '/neu/eng/mect/mect00.htm', title: 'Canterbury Tales - Prologue', author: 'Geoffrey Chaucer', category: 'Literature', lang: 'en', originalLang: 'enm' },
];

async function fetchSacredTexts() {
    try {
        // Filtrer selon la langue sélectionnée
        // Sacred Texts contient principalement des traductions anglaises
        // mais on peut aussi filtrer par langue d'origine pour les utilisateurs intéressés
        let filteredCatalog = SACRED_TEXTS_CATALOG;
        if (selectedLang !== 'all') {
            // Accepter les textes dont la langue de traduction OU la langue d'origine correspond
            filteredCatalog = SACRED_TEXTS_CATALOG.filter(item => 
                item.lang === selectedLang || item.originalLang === selectedLang
            );
        }
        
        if (filteredCatalog.length === 0) {
            return [];
        }
        
        // Sélectionner quelques textes au hasard
        const shuffled = shuffleArray(filteredCatalog.slice(0)).slice(0, 2);
        const results = [];
        
        for (const item of shuffled) {
            try {
                // sacred-texts.com (avec www)
                const url = `https://www.sacred-texts.com${item.path}`;
                
                // Utiliser le helper fetchWithCorsProxy
                const res = await fetchWithCorsProxy(url, 6000);
                let html = res ? await res.text() : null;
                
                if (html && html.length > 500) {
                    // Parser le HTML pour extraire le texte
                    const div = document.createElement('div');
                    div.innerHTML = html;
                    
                    // Supprimer les éléments non désirés (Sacred Texts a une structure simple)
                    div.querySelectorAll('script, style, nav, header, footer, .navigation, .navbar, table, hr, font[size="1"]').forEach(el => el.remove());
                    
                    // Chercher le contenu principal - Sacred Texts utilise souvent des balises simples
                    let content = div.querySelector('body') || div;
                    
                    let text = content.innerText || content.textContent;
                    
                    // Nettoyer
                    text = text.replace(/\n{3,}/g, '\n\n')
                               .replace(/\[.*?\]/g, '') // Supprimer les références
                               .replace(/^\s*\d+\s*$/gm, '') // Supprimer les numéros de vers seuls
                               .trim();
                    
                    // Prendre un extrait
                    if (text.length > 300) {
                        let excerpt = text.substring(0, 2500);
                        const lastPara = excerpt.lastIndexOf('\n\n');
                        if (lastPara > 1500) excerpt = excerpt.substring(0, lastPara);
                        
                        results.push({
                            title: item.title,
                            text: excerpt + '\n\n[...] (Read more on Sacred Texts)',
                            author: item.author,
                            source: 'sacredtexts',
                            url: url,
                            lang: item.lang || 'en',
                            originalLang: item.originalLang,
                            categories: [item.category],
                            isPreloaded: true
                        });
                    }
                }
            } catch (e) {
                // Erreur silencieuse, on continue
            }
        }
        
        return results;
    } catch (e) {
        console.error('Sacred Texts error:', e);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════
// 🏛️ GALLICA - Bibliothèque nationale de France (API IIIF/SRU)
// ═══════════════════════════════════════════════════════════

// Helper pour fetch avec proxy CORS (utilise le proxy Vercel en prod, proxies publics en local)
async function fetchWithCorsProxy(url, timeoutMs = ARCHIVE_TIMEOUT_MS) {
    const isGallica = url.includes('gallica.bnf.fr');

    // En production (Vercel), utiliser notre propre proxy en PRIORITÉ
    if (!isLocalEnvironment()) {
        try {
            const proxyUrl = isGallica
                ? `/api/gallica-proxy?url=${encodeURIComponent(url)}`
                : `/api/archive-proxy?url=${encodeURIComponent(url)}`;
            const res = await fetchWithTimeout(proxyUrl, {}, timeoutMs);
            if (res.ok) {
                return res;
            }
        } catch (e) {
            // Fallback silencieux vers proxies publics
        }
    }
    
    // Essayer les proxies CORS publics (local ou fallback en prod)
    const proxies = [
        (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
        (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`
    ];
    
    for (let i = 0; i < proxies.length; i++) {
        const proxyFn = proxies[i];
        try {
            const proxiedUrl = proxyFn(url);
            const res = await fetchWithTimeout(proxiedUrl, {}, timeoutMs);
            if (res.ok) {
                return res;
            }
        } catch (e) {
            // Continue au prochain proxy
        }
    }
    console.warn('CORS proxies failed for:', url.substring(0, 80));
    return null;
}

// Cache pour éviter les requêtes répétées à Gallica (rate limiting strict)
const gallicaCache = new Map();
const GALLICA_CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

// NOTE: Gallica désactivé - l'endpoint /texteBrut retourne du HTML avec JS/UI
// et très peu de texte littéraire exploitable. L'API SRU fonctionne pour les
// métadonnées mais le contenu textuel n'est pas accessible proprement.
const GALLICA_ENABLED = false;

async function fetchGallica() {
    // Gallica désactivé par configuration
    if (!GALLICA_ENABLED) {
        return [];
    }
    
    try {
        // Termes de recherche pour Gallica - utiliser dc.title ou dc.subject (pas de noms d'auteurs en dur)
        const searchTerms = [
            { field: 'dc.title', term: 'fables' },
            { field: 'dc.title', term: 'poésies' },
            { field: 'dc.title', term: 'contes' },
            { field: 'dc.title', term: 'roman' },
            { field: 'dc.title', term: 'théâtre' },
            { field: 'dc.title', term: 'lettres' },
            { field: 'dc.title', term: 'mémoires' },
            { field: 'dc.title', term: 'nouvelles' },
            { field: 'dc.title', term: 'essais' },
            { field: 'dc.title', term: 'tragédie' },
            { field: 'dc.title', term: 'comédie' },
            { field: 'dc.subject', term: 'littérature' },
            { field: 'dc.subject', term: 'poésie française' },
            { field: 'dc.subject', term: 'romans français' },
            { field: 'dc.subject', term: 'philosophie' },
        ];
        const search = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        
        // API SRU de Gallica - UN SEUL document pour éviter le rate limiting
        const startRecord = Math.floor(Math.random() * 200) + 1;
        const sruUrl = `https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&maximumRecords=1&startRecord=${startRecord}&query=${search.field} all "${search.term}"`;
        
        // Vérifier le cache
        const cacheKey = `sru:${search.field}:${search.term}:${startRecord}`;
        const cached = gallicaCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < GALLICA_CACHE_DURATION) {
            return cached.results;
        }
        
        const res = await fetchWithCorsProxy(sruUrl);
        if (!res) {
            return [];
        }
        
        const xmlText = await res.text();
        
        // Parser le XML avec gestion des namespaces SRU
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        // Vérifier les erreurs de parsing XML
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            return [];
        }
        
        // Méthode robuste: extraire les records via regex puis parser individuellement
        const recordMatches = xmlText.match(/<srw:record>[\s\S]*?<\/srw:record>/gi);
        if (!recordMatches || recordMatches.length === 0) {
            return [];
        }
        
        const results = [];
        
        // Ne traiter qu'UN SEUL record pour éviter le rate limiting de Gallica
        const recordXml = recordMatches[0];
        try {
            // Extraire les métadonnées via regex (plus fiable que DOM avec namespaces)
            const titleMatch = recordXml.match(/<dc:title>([^<]+)<\/dc:title>/i);
            const creatorMatch = recordXml.match(/<dc:creator>([^<]+)<\/dc:creator>/i);
            const identifierMatch = recordXml.match(/<dc:identifier>([^<]+)<\/dc:identifier>/i);
            
            const title = titleMatch ? titleMatch[1].trim() : 'Sans titre';
            const creator = creatorMatch ? creatorMatch[1].trim() : 'Inconnu';
            const identifier = identifierMatch ? identifierMatch[1].trim() : null;
            
            if (identifier) {
                // Extraire l'ARK ID depuis l'identifier
                const arkMatch = identifier.match(/(ark:\/\d+\/\w+)/);
                if (arkMatch) {
                    const arkId = arkMatch[1];
                    
                    // URL du texte OCR - Gallica expose le texte via /texteBrut
                    const textUrl = `https://gallica.bnf.fr/${arkId}/texteBrut`;
                    
                    // Essayer de récupérer le texte (aussi via proxy CORS)
                    let text = null;
                    try {
                        const textRes = await fetchWithCorsProxy(textUrl, 10000);
                        if (textRes) {
                            let html = await textRes.text();
                            
                            // Gallica /texteBrut retourne une page HTML - extraire le contenu textuel
                            const div = document.createElement('div');
                            div.innerHTML = html;
                            
                            // Supprimer les scripts, styles, nav, footer, etc.
                            div.querySelectorAll('script, style, nav, header, footer, .header, .footer, .navbar, .menu, .navigation, noscript, iframe, form, button, input, select').forEach(el => el.remove());
                            
                            // Chercher le contenu textuel principal
                            let contentEl = div.querySelector('.texteIntegral, .ocr-content, .content, #texte, .texte, article, main, .main');
                            if (!contentEl) {
                                contentEl = div.querySelector('body') || div;
                            }
                            
                            text = contentEl.innerText || contentEl.textContent || '';
                        }
                    } catch (e) {
                        // Erreur silencieuse
                    }
                    
                    if (text && text.length > 500) {
                        // Nettoyer le texte OCR Gallica
                        text = text
                            .replace(/\{[^}]+\}/g, '') // Supprimer JSON résiduel
                            .replace(/"[^"]*":\s*"[^"]*"/g, '') // Supprimer paires JSON
                            .replace(/https?:\/\/[^\s]+/g, '') // Supprimer URLs
                            .replace(/\b(display|active|parameters|role|contenu|selected|etat|link|menu|button)\b/gi, '') // Mots-clés UI
                            .replace(/\n{3,}/g, '\n\n')
                            .replace(/^\s*\d+\s*$/gm, '') // Numéros de page seuls
                            .replace(/GALLICA/gi, '')
                            .replace(/BnF/gi, '')
                            .replace(/\s{3,}/g, ' ')
                            .trim();
                        
                        // Vérifier que le texte est vraiment du contenu littéraire (pas du JSON/UI)
                        const jsonScore = (text.match(/[{}[\]":,]/g) || []).length;
                        const textScore = text.length;
                        if (jsonScore <= textScore / 20) {
                            // Prendre un extrait (éviter les premières pages souvent des couvertures)
                            const start = Math.min(text.length / 4, 2000);
                            let excerpt = text.substring(start, start + 2500);
                            const paraStart = excerpt.indexOf('\n\n');
                            if (paraStart > 0 && paraStart < 200) {
                                excerpt = excerpt.substring(paraStart).trim();
                            }
                            
                            if (excerpt.length > 300) {
                                results.push({
                                    title: title.substring(0, 100),
                                    text: excerpt + '\n\n[...] (Lire la suite sur Gallica)',
                                    author: creator,
                                    source: 'gallica',
                                    url: `https://gallica.bnf.fr/${arkId}`,
                                    lang: 'fr',
                                    isPreloaded: true
                                });
                            }
                        }
                    }
                }
            }
        } catch (e) {
            // Erreur silencieuse
        }
        
        // Mettre en cache les résultats
        gallicaCache.set(cacheKey, { results, timestamp: Date.now() });
        
        return results;
    } catch (e) {
        console.error('Gallica error:', e);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════
// 🏛️ PERSEUS DIGITAL LIBRARY - Textes classiques grecs/latins
// ═══════════════════════════════════════════════════════════

// Catalogue de textes Perseus (URLs stables)
const PERSEUS_CATALOG = [
    // Textes latins (originaux)
    { urn: 'Perseus:text:1999.02.0054', title: 'Énéide', author: 'Virgile', lang: 'la', originalLang: 'la' },
    { urn: 'Perseus:text:1999.02.0055', title: 'Aeneid (English)', author: 'Virgil', lang: 'en', originalLang: 'la' },
    { urn: 'Perseus:text:1999.02.0060', title: 'Géorgiques', author: 'Virgile', lang: 'la', originalLang: 'la' },
    { urn: 'Perseus:text:1999.02.0003', title: 'De Bello Gallico', author: 'César', lang: 'la', originalLang: 'la' },
    { urn: 'Perseus:text:1999.02.0001', title: 'Gallic Wars (English)', author: 'Caesar', lang: 'en', originalLang: 'la' },
    { urn: 'Perseus:text:1999.02.0010', title: 'De Re Publica', author: 'Cicéron', lang: 'la', originalLang: 'la' },
    { urn: 'Perseus:text:2008.01.0540', title: 'Metamorphoses', author: 'Ovide', lang: 'la', originalLang: 'la' },
    { urn: 'Perseus:text:1999.02.0073', title: 'Carmina', author: 'Horace', lang: 'la', originalLang: 'la' },
    { urn: 'Perseus:text:1999.01.0233', title: 'Letters', author: 'Sénèque', lang: 'la', originalLang: 'la' },
    // Textes grecs anciens (originaux en grec)
    { urn: 'Perseus:text:1999.01.0132', title: 'Ἰλιάς', author: 'Ὅμηρος', lang: 'grc', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0134', title: 'Ὀδύσσεια', author: 'Ὅμηρος', lang: 'grc', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0130', title: 'Θεογονία', author: 'Ἡσίοδος', lang: 'grc', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0186', title: 'Ἀντιγόνη', author: 'Σοφοκλῆς', lang: 'grc', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0114', title: 'Οἰδίπους Τύραννος', author: 'Σοφοκλῆς', lang: 'grc', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0090', title: 'Μήδεια', author: 'Εὐριπίδης', lang: 'grc', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0168', title: 'Πολιτεία', author: 'Πλάτων', lang: 'grc', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0170', title: 'Συμπόσιον', author: 'Πλάτων', lang: 'grc', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0054', title: 'Ἠθικὰ Νικομάχεια', author: 'Ἀριστοτέλης', lang: 'grc', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0126', title: 'Ἱστορίαι', author: 'Ἡρόδοτος', lang: 'grc', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0200', title: 'Ξυγγραφή', author: 'Θουκυδίδης', lang: 'grc', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0036', title: 'Τὰ εἰς ἑαυτόν', author: 'Μᾶρκος Αὐρήλιος', lang: 'grc', originalLang: 'grc' },
    // Textes grecs (traductions anglaises)
    { urn: 'Perseus:text:1999.01.0133', title: 'Iliad', author: 'Homer', lang: 'en', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0135', title: 'Odyssey', author: 'Homer', lang: 'en', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0137', title: 'Theogony', author: 'Hesiod', lang: 'en', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0171', title: 'Antigone', author: 'Sophocle', lang: 'en', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0191', title: 'Medea', author: 'Euripide', lang: 'en', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0245', title: 'Republic', author: 'Platon', lang: 'en', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0051', title: 'Nicomachean Ethics', author: 'Aristote', lang: 'en', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0205', title: 'Histories', author: 'Hérodote', lang: 'en', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.01.0247', title: 'History of the Peloponnesian War', author: 'Thucydide', lang: 'en', originalLang: 'grc' },
    { urn: 'Perseus:text:1999.02.0137', title: 'Meditations', author: 'Marcus Aurelius', lang: 'en', originalLang: 'grc' },
];

async function fetchPerseus() {
    try {
        console.log('🏛️ Fetching Perseus Digital Library...');
        
        // Filtrer par langue si une langue est sélectionnée
        let catalog = PERSEUS_CATALOG;
        if (selectedLang && selectedLang !== 'all') {
            catalog = PERSEUS_CATALOG.filter(item => 
                item.lang === selectedLang || item.originalLang === selectedLang
            );
            console.log(`  Filtered Perseus catalog for lang '${selectedLang}':`, catalog.length, 'items');
            if (catalog.length === 0) {
                console.log('  No Perseus texts match selected language');
                return [];
            }
        }
        
        // Sélectionner quelques textes au hasard
        const shuffled = shuffleArray(catalog.slice(0)).slice(0, 2);
        const results = [];
        
        for (const item of shuffled) {
            try {
                // L'API Perseus Hopper permet de récupérer le texte
                const url = `https://www.perseus.tufts.edu/hopper/text?doc=${item.urn}`;
                console.log('  → Trying:', item.title);
                
                // Utiliser le helper fetchWithCorsProxy
                const res = await fetchWithCorsProxy(url, 6000);
                let html = res ? await res.text() : null;
                
                if (html && html.length > 500) {
                    console.log('  ✓ Got HTML for', item.title, '- length:', html.length);
                    // Parser le HTML
                    const div = document.createElement('div');
                    div.innerHTML = html;
                    
                    // Supprimer les éléments non désirés
                    div.querySelectorAll('script, style, nav, .header, .footer, .navbar, .toc, .note, .footer, table').forEach(el => el.remove());
                    
                    // Chercher le contenu du texte - Perseus utilise souvent <div class="text">
                    let content = div.querySelector('.text_container, .text, div.text, #text_container');
                    if (!content) content = div.querySelector('td.text') || div.body || div;
                    
                    let text = content.innerText || content.textContent;
                    
                    // Nettoyer
                    text = text.replace(/\n{3,}/g, '\n\n')
                               .replace(/\[\d+\]/g, '') // Supprimer les références
                               .replace(/^\s*\d+\s*$/gm, '') // Numéros de vers/lignes seuls
                               .replace(/Card\.?/gi, '')
                               .replace(/hide|show|Display/gi, '')
                               .trim();
                    
                    // Prendre un extrait
                    if (text.length > 300) {
                        // Sauter les premiers caractères (souvent navigation)
                        const startOffset = Math.min(500, text.length / 4);
                        let excerpt = text.substring(startOffset, startOffset + 2500);
                        
                        // Trouver un bon début de paragraphe
                        const paraStart = excerpt.indexOf('\n\n');
                        if (paraStart > 0 && paraStart < 300) {
                            excerpt = excerpt.substring(paraStart).trim();
                        }
                        
                        if (excerpt.length > 200) {
                            results.push({
                                title: item.title,
                                text: excerpt + '\n\n[...] (Read more on Perseus)',
                                author: item.author,
                                source: 'perseus',
                                url: url,
                                lang: item.lang,
                                originalLang: item.originalLang,
                                isPreloaded: true
                            });
                        }
                    }
                }
            } catch (e) {
                console.warn('Perseus fetch error:', e);
            }
        }
        
        return results;
    } catch (e) {
        console.error('Perseus error:', e);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════
// 🌍 ALIMENTER LE POOL - Littérature mondiale
// ═══════════════════════════════════════════════════════════
async function fillPool() {
    // Si aucun filtre n'est défini, on met Wikisource par défaut (sécurité)
    if (!state.activeSourceFilter || state.activeSourceFilter.length === 0) {
        state.activeSourceFilter = ['wikisource'];
    }

    // Contexte d'exploration (Kaléidoscope) : si des filtres sont actifs, on évite
    // d'ajouter des contenus "random" non alignés (PoetryDB/Gutenberg/Archive).
    const filterKeywords = window.getActiveFilterKeywords ? window.getActiveFilterKeywords() : [];
    const hasExplorationFilters = Array.isArray(filterKeywords) && filterKeywords.length > 0;
    const hasSearchContext = !!state.activeSearchTerm || hasExplorationFilters;

    // Helper pour vérifier si la source est autorisée
    const isSourceAllowed = (s) => state.activeSourceFilter.includes(s) || state.activeSourceFilter.includes('all');

    // Si l'utilisateur force une source unique "API" (PoetryDB/Gutenberg/Archive/etc.),
    // on ne bloque pas ces sources même si un contexte de recherche/filtres est actif.
    const altSourceIds = ['poetrydb', 'gutenberg', 'archive', 'sacredtexts', 'gallica', 'perseus'];
    const strictAltSourceMode = Array.isArray(state.activeSourceFilter)
        && state.activeSourceFilter.length === 1
        && altSourceIds.includes(state.activeSourceFilter[0]);

    // ⚡ OPTIMISATION: Lancer toutes les sources en PARALLÈLE pour un chargement rapide
    const sourcePromises = [];

    // === 1. POETRYDB (si anglais actif) - Qualité garantie ===
    const poetryLangOk = (selectedLang === 'all' || selectedLang === 'en') || (strictAltSourceMode && state.activeSourceFilter[0] === 'poetrydb');
    if ((!hasSearchContext || strictAltSourceMode) && poetryLangOk && isSourceAllowed('poetrydb')) {
        sourcePromises.push(
            fetchPoetryDB().then(poems => {
                for (const poem of poems) {
                    if (!state.shownPages.has('poetrydb:' + poem.title)) {
                        state.textPool.unshift({
                            title: poem.title,
                            text: poem.text,
                            author: poem.author,
                            lang: 'en',
                            source: 'poetrydb',
                            isPreloaded: true
                        });
                    }
                }
            }).catch(e => console.error('PoetryDB fillPool error:', e))
        );
    }
    
    // === 1.5 PROJECT GUTENBERG - Classiques du domaine public ===
    if ((!hasSearchContext || strictAltSourceMode) && isSourceAllowed('gutenberg')) {
        sourcePromises.push(
            fetchGutenberg().then(gutenbergTexts => {
                for (const item of gutenbergTexts) {
                    state.textPool.unshift({ ...item, isPreloaded: true });
                }
            }).catch(e => console.error('Gutenberg fillPool error:', e))
        );
    }
    
    // === 1.6 ARCHIVE.ORG + OPEN LIBRARY - Internet Archive ===
    const archiveSupportedLangs = ['all', 'fr', 'en', 'de', 'it', 'es', 'pt', 'ru', 'zh', 'ja', 'ar', 'la', 'grc', 'el', 'sa', 'he', 'ang', 'fro'];
    const archiveLangOk = archiveSupportedLangs.includes(selectedLang) || (strictAltSourceMode && state.activeSourceFilter[0] === 'archive');
    const archiveAllowed = isSourceAllowed('archive');
    if ((!hasSearchContext || strictAltSourceMode) && archiveLangOk && archiveAllowed) {
        console.log('📚 Archive.org - Loading...');
        sourcePromises.push(
            Promise.all([fetchArchiveOrg(), fetchOpenLibrary()]).then(([archiveTexts, openLibraryTexts]) => {
                const combinedTexts = [...archiveTexts, ...openLibraryTexts];
                for (const item of combinedTexts) {
                    state.textPool.unshift({ ...item, isPreloaded: true });
                }
            }).catch(e => console.error('Archive.org fillPool error:', e))
        );
    }
    
    // === 1.7 SACRED TEXTS ARCHIVE - Textes religieux et mystiques ===
    const sacredOriginalLangs = ['pi', 'zh', 'sa', 'fa', 'ar', 'la', 'grc', 'egy', 'he', 'non', 'enm', 'cop', 'ang'];
    const sacredLangOk = (selectedLang === 'all' || selectedLang === 'en' || sacredOriginalLangs.includes(selectedLang)) || (strictAltSourceMode && state.activeSourceFilter[0] === 'sacredtexts');
    const sacredAllowed = isSourceAllowed('sacredtexts');
    const sacredConditionOk = (!hasSearchContext || strictAltSourceMode);
    if (sacredConditionOk && sacredLangOk && sacredAllowed) {
        console.log('🕉️ Sacred Texts - Loading...');
        sourcePromises.push(
            fetchSacredTexts().then(sacredTexts => {
                console.log('🕉️ fetchSacredTexts returned:', sacredTexts.length, 'items');
                for (const item of sacredTexts) {
                    if (!state.shownPages.has('sacred:' + item.title)) {
                        state.textPool.unshift({ ...item, isPreloaded: true });
                    }
                }
            }).catch(e => console.error('Sacred Texts fillPool error:', e))
        );
    }
    
    // === 1.8 GALLICA (BnF) - Bibliothèque nationale de France ===
    const gallicaLangOk = (selectedLang === 'all' || selectedLang === 'fr') || (strictAltSourceMode && state.activeSourceFilter[0] === 'gallica');
    const gallicaAllowed = isSourceAllowed('gallica');
    const gallicaConditionOk = (!hasSearchContext || strictAltSourceMode);
    if (gallicaConditionOk && gallicaLangOk && gallicaAllowed) {
        console.log('📚 Gallica - Loading...');
        sourcePromises.push(
            fetchGallica().then(gallicaTexts => {
                console.log('📚 fetchGallica returned:', gallicaTexts.length, 'items');
                for (const item of gallicaTexts) {
                    if (!state.shownPages.has('gallica:' + item.title)) {
                        state.textPool.unshift({ ...item, isPreloaded: true });
                    }
                }
            }).catch(e => console.error('Gallica fillPool error:', e))
        );
    }
    
    // === 1.9 PERSEUS DIGITAL LIBRARY - Classiques grecs/latins ===
    const isPerseusOnlyLang = isPerseusOnlyLanguage();
    const perseusLangOk = isPerseusOnlyLang || (selectedLang === 'all' || ['en', 'la', 'grc', 'el'].includes(selectedLang)) || (strictAltSourceMode && state.activeSourceFilter[0] === 'perseus');
    const perseusAllowed = isPerseusOnlyLang || isSourceAllowed('perseus');
    const perseusConditionOk = isPerseusOnlyLang || (!hasSearchContext || strictAltSourceMode);
    if (perseusConditionOk && perseusLangOk && perseusAllowed) {
        console.log('🏛️ Perseus - Loading...');
        sourcePromises.push(
            fetchPerseus().then(perseusTexts => {
                console.log('🏛️ fetchPerseus returned:', perseusTexts.length, 'items');
                for (const item of perseusTexts) {
                    if (!state.shownPages.has('perseus:' + item.title)) {
                        state.textPool.unshift({ ...item, isPreloaded: true });
                    }
                }
            }).catch(e => console.error('Perseus fillPool error:', e))
        );
    }

    // ⚡ Attendre que toutes les sources alternatives soient chargées EN PARALLÈLE
    if (sourcePromises.length > 0) {
        await Promise.all(sourcePromises);
    }
    
    // === 2. WIKISOURCE (sources traditionnelles) ===
    // Pour les langues perseusOnly, on ne charge pas Wikisource
    if (isPerseusOnlyLang) {
        console.log('🏛️ Langue perseusOnly détectée, Wikisource ignoré');
        return;
    }
    
    if (!isSourceAllowed('wikisource')) return;

    
    // === 2. WIKISOURCE (sources traditionnelles) ===
    const activeSources = getActiveWikisources();
    if (activeSources.length === 0 && state.textPool.length === 0) {
        console.error('Aucune source active');
        return;
    }
    
    // Mélanger les sources
    const shuffledSources = shuffleArray([...activeSources]).slice(0, 3);
    
    // ⚡ OPTIMISATION: Charger toutes les Wikisources EN PARALLÈLE
    const wikisourcePromises = shuffledSources.map(async (ws) => {
        // A) Stratégie de remplissage
        // 1. Si un terme de recherche est actif (ex: clic sur hashtag), on l'utilise en priorité
        // 2. Sinon, on alterne entre mots-clés génériques et hasard total
        
        let searchTerm = null;
        let useRandom = false;

        const activeKeywords = window.getActiveFilterKeywords ? window.getActiveFilterKeywords() : [];
        const hasActiveFilters = activeKeywords.length > 0;
        const freeSuffix = (hasActiveFilters && state.filterFreeTerm) ? ` ${state.filterFreeTerm}` : '';

        if (state.activeSearchTerm) {
            searchTerm = state.activeSearchTerm;
            
            // SI UN FILTRE EST ACTIF (Exploration par thème/époque/genre)
            // Alors on veut "dériver" : on ne reste pas bloqué sur le terme initial (ex: "Chrétien de Troyes")
            // On re-pioche un nouveau mot-clé dans le filtre actif pour varier les plaisirs au scroll infinite
            if (hasActiveFilters && activeKeywords.includes(state.activeSearchTerm)) {
                 // Le terme actif vient probablement des filtres... on le change pour un autre du même filtre !
                 // C'est l'effet "relancer le dé" à chaque chargement de page
                 searchTerm = activeKeywords[Math.floor(Math.random() * activeKeywords.length)];
                 // On met à jour le state pour que l'offset reparte à 0 sur ce nouveau terme
                 if (searchTerm !== state.activeSearchTerm) {
                     state.activeSearchTerm = searchTerm;
                     state.searchOffset = 0;
                     console.log('🎲 Drift: switching to', searchTerm);
                 }
            }

            // Si on est en mode filtres + mot libre, on conserve toujours "filtre + mot" au scroll
            if (freeSuffix && searchTerm && !searchTerm.includes(state.filterFreeTerm)) {
                searchTerm = `${searchTerm}${freeSuffix}`;
            }

            // Message de chargement cohérent pendant le scroll
            state.loadingMessage = typeof t === 'function' ? t('searching').replace('{term}', searchTerm) : `Searching "${searchTerm}"...`;
            state.lastSearchTerm = searchTerm;
            if (window.setMainLoadingMessage) window.setMainLoadingMessage(state.loadingMessage);
        } else {
            // Mots-clés génériques par langue
            const GENERIC_TERMS = {
                fr: ['Poésie', 'Roman', 'Conte', 'Théâtre', 'Philosophie', 'Lettres', 'Histoire'],
                en: ['Poetry', 'Novel', 'Tale', 'Play', 'Philosophy', 'Letters', 'History'],
                de: ['Gedicht', 'Roman', 'Märchen', 'Theater', 'Philosophie'],
                it: ['Poesia', 'Romanzo', 'Favola', 'Teatro'],
                es: ['Poesía', 'Novela', 'Cuento', 'Teatro'],
                // Langues anciennes
                la: ['carmen', 'ode', 'epistula', 'liber', 'fabula', 'poema', 'oratio'],
                grc: ['ποίημα', 'τραγῳδία', 'ἔπος', 'λόγος', 'μῦθος', 'ὕμνος'],
                he: ['שיר', 'תהלים', 'משל', 'ספר', 'דבר'],
                sa: ['गीता', 'श्लोक', 'सूक्त', 'कथा', 'स्तोत्र'],
            };
            const fallbackTerms = GENERIC_TERMS[ws.lang] || GENERIC_TERMS['fr'];
            
            // 50% de chance d'utiliser l'API Random vs Recherche générique
            // SAUF SI des filtres sont actifs -> on force la recherche
            if (!hasActiveFilters && Math.random() > 0.5) {
                useRandom = true;
            } else {
                if (hasActiveFilters) {
                    // Si filtres actifs, on pioche un mot clé parmi ceux des filtres
                    searchTerm = activeKeywords[Math.floor(Math.random() * activeKeywords.length)] + freeSuffix;
                } else {
                    searchTerm = fallbackTerms[Math.floor(Math.random() * fallbackTerms.length)];
                }
            }
        }
            
        if (useRandom) {
             state.loadingMessage = typeof t === 'function' ? t('loading') : 'Loading...';
               state.lastSearchTerm = null;
             if (window.setMainLoadingMessage) window.setMainLoadingMessage(state.loadingMessage);
             // --- MODE RANDOM (Découverte pure) ---
             try {
                // Récupérer 5 pages aléatoires
                const url = `${ws.url}/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=5&format=json&origin=*`;
                const res = await fetch(url);
                const data = await res.json();
                const randomPages = data.query?.random || [];
                
                for (const page of randomPages) {
                    // On simule un objet "recherche" pour que le reste du flux l'accepte
                    const titleToCheck = page.title;
                    if (!state.shownPages.has(titleToCheck)) {
                        state.textPool.push({
                            title: page.title,
                            snippet: '...', 
                            lang: ws.lang,
                            wikisource: ws,
                            isRandom: true
                        });
                    }
                }
             } catch (e) {
                 console.error('Random API error:', e);
             }
        } else {
             // --- MODE RECHERCHE CIBLÉE OU GÉNÉRIQUE ---
             // Si on a un searchTerm (défini par le contexte ou fallback), on l'utilise
             const term = searchTerm || 'Poésie'; // Fallback ultime
               state.loadingMessage = typeof t === 'function' ? t('searching').replace('{term}', term) : `Searching "${term}"...`;
                         state.lastSearchTerm = term;
             if (window.setMainLoadingMessage) window.setMainLoadingMessage(state.loadingMessage);
             
             try {
                // On cherche plus de résultats pour avoir du choix
                // FIX: Gestion d'erreur renforcée pour éviter le blocage du scroll
                let results = [];
                try {
                    // Utiliser l'offset si recherche active
                    const offset = state.activeSearchTerm ? (state.searchOffset || 0) : 0;
                    results = await searchTexts(term, 10, ws, offset);
                    
                    // Incrémenter l'offset pour la prochaine fois seulement si on a eu des résultats
                    if (state.activeSearchTerm && results.length > 0) {
                        state.searchOffset = (state.searchOffset || 0) + 10;
                    }
                } catch(searchErr) {
                    console.warn(`Search failed for ${term} on ${ws.lang}`, searchErr);
                    results = []; 
                }
                
                // Si aucune réponse pour ce terme précis (ex: auteur inconnu dans cette langue)
                // On ne fait PLUS de fallback pour respecter la demande utilisateur
                // "je ne veux pas de gilet de sauvetage"
                if (results.length === 0 && state.activeSearchTerm) {
                    console.log(`No results for ${term} on ${ws.lang}`);
                    // results reste vide []
                }

                // On ajoute plusieurs résultats au pool si c'est une recherche ciblée
                if (results.length > 0) {
                    // Si recherche ciblée, on prend les meilleurs résultats
                    // Si générique, on prend un au hasard pour varier
                    const itemsToAdd = state.activeSearchTerm ? results.slice(0, 3) : [results[Math.floor(Math.random() * results.length)]];
                    
                    for (const r of itemsToAdd) {
                        if (r && !state.shownPages.has(r.title)) {
                            state.textPool.push({
                                title: r.title,
                                snippet: r.snippet,
                                lang: ws.lang,
                                wikisource: ws,
                                isContextual: !!state.activeSearchTerm // Marqueur pour debug
                            });
                        }
                    }
                }
             } catch (e) { console.error('Search error:', e); }
        }
    });
    
    // ⚡ Attendre toutes les Wikisources en parallèle
    await Promise.all(wikisourcePromises);
}

// ═══════════════════════════════════════════════════════════
// 📂 NAVIGATION PAR CATÉGORIES
// ═══════════════════════════════════════════════════════════

async function exploreCategory(categoryId, isNav = false) {
    const ws = currentWikisource || getActiveWikisources()[0];
    if (!ws) return;

    if (!isNav) {
        // Premier clic sur une racine
        currentCategoryPath = [categoryId];
        const nav = document.getElementById('categoryNav');
        if (nav) nav.style.display = 'block';
    } else {
        // Navigation dans l'arbre : on gère le fil d'ariane
        const idx = currentCategoryPath.indexOf(categoryId);
        if (idx !== -1) {
            // Retour en arrière
            currentCategoryPath = currentCategoryPath.slice(0, idx + 1);
        } else {
            // Niveau suivant
            currentCategoryPath.push(categoryId);
        }
    }
    
    if (window.renderBreadcrumbs) renderBreadcrumbs();
    if (window.fetchCategoryData) await fetchCategoryData(categoryId, ws);
}

function renderEnrichedBranches() {
    const container = document.getElementById('feed');
    const ws = currentWikisource || getActiveWikisources()[0];
    if (!ws) return;
    
    const branches = GENRE_BRANCHES[ws.lang] || GENRE_BRANCHES['fr'];
    let html = '<div class="genre-grid">';
    
    for (const [groupName, items] of Object.entries(branches)) {
        html += `<div class="branch-group">
            <div class="branch-group-title">${groupName}</div>
            <div class="branch-items">
                ${items.map(item => `<div class="cat-pill" onclick="exploreCategory('${item.replace(/'/g, "\\'")}', true)">${item}</div>`).join('')}
            </div>
        </div>`;
    }
    
    html += '</div>';
    if (container) {
        container.innerHTML = html;
        container.innerHTML += '<div class="empty-state">👆 Choisissez une branche ci-dessus pour explorer les textes</div>';
    }
}

// Recherche par terme (auteur, courant, etc.)
async function searchByTerm(term, wikisource) {
    // Ne pas re-vérifier loading car déjà fait dans exploreCategory
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
        
        // Mélanger et charger (Fisher-Yates)
        shuffleArray(state.textPool);
        
        if (state.textPool.length > 0) {
            // IMPORTANT: Remettre loading à false AVANT d'appeler loadMore
            // sinon loadMore() retourne immédiatement car state.loading est true
            state.loading = false;
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
        
        // Mélanger et charger (Fisher-Yates)
        shuffleArray(state.textPool);
        
        if (state.textPool.length > 0) {
            loadMore();
        } else if (subcats.length === 0) {
            document.getElementById('feed').innerHTML = '<div class="empty-state">Aucun texte direct dans cette catégorie.<br>Essayez une autre branche.</div>';
        }
        
    } catch (e) {
        console.error('Category error:', e);
        document.getElementById('catSubcategories').innerHTML = `<div style="color:var(--accent)">${typeof t === 'function' ? t('loading_error') : 'Loading error'}</div>`;
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
// 🎭 DÉTECTION D'AUTEUR ET DE GENRE
// ═══════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════
// 📤 EXPORTS GLOBAUX
// ═══════════════════════════════════════════════════════════

// Exposer les configurations et fonctions au scope global
window.WIKISOURCES = WIKISOURCES;
window.ALT_SOURCES = ALT_SOURCES;
window.SEARCH_TERMS = SEARCH_TERMS;
window.GENRE_COLORS = GENRE_COLORS;
window.GENRE_BRANCHES = GENRE_BRANCHES;
window.CATEGORY_ROOTS = CATEGORY_ROOTS;

// Exposer les variables d'état
window.getSelectedLang = () => selectedLang;
window.setSelectedLang = (lang) => { selectedLang = lang; };
window.getCurrentWikisource = () => currentWikisource;
window.setCurrentWikisource = (ws) => { currentWikisource = ws; };

// Exposer les fonctions
window.changeLanguage = changeLanguage;
window.getActiveWikisources = getActiveWikisources;
window.searchTexts = searchTexts;
window.fetchText = fetchText;
window.analyzeHtml = analyzeHtml;
window.isLikelyJunk = isLikelyJunk;
window.isValidTitle = isValidTitle;
window.analyzeContentQuality = analyzeContentQuality;
window.fetchGutenberg = fetchGutenberg;
window.fetchPoetryDB = fetchPoetryDB;
window.fetchArchiveOrg = fetchArchiveOrg;
window.fetchOpenLibrary = fetchOpenLibrary;
window.fetchSacredTexts = fetchSacredTexts;
window.fetchGallica = fetchGallica;
window.fetchPerseus = fetchPerseus;
window.fillPool = fillPool;
window.exploreCategory = exploreCategory;
window.renderEnrichedBranches = renderEnrichedBranches;
window.searchByTerm = searchByTerm;
window.fetchCategoryData = fetchCategoryData;
window.renderBreadcrumbs = renderBreadcrumbs;
window.renderSubcategories = renderSubcategories;
window.closeCategoryMode = closeCategoryMode;
window.normalizeAuthor = normalizeAuthor;
window.detectAuthor = detectAuthor;
window.detectTag = detectTag;
