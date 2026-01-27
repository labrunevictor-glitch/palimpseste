/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PALIMPSESTE - Module Sources (sources.js)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Gestion des sources de textes littéraires :
 * - Wikisource (multilingue)
 * - Project Gutenberg
 * - PoetryDB
 * - Navigation par catégories
 * 
 * Dépendances : app.js (state, toast), config.js (supabase)
 * ═══════════════════════════════════════════════════════════════════════════
 */

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
        lang: 'en'
    },
    gutenberg: {
        name: 'Project Gutenberg',
        url: 'https://www.gutenberg.org'
    },
    // ═══════════════════════════════════════════════════════════
    //  ARCHIVE.ORG - Internet Archive
    // ═══════════════════════════════════════════════════════════
    archiveorg: {
        name: 'Archive.org',
        url: 'https://archive.org'
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
    la: [],
    zh: [],
    ja: [],
    ar: [],
    el: [],
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

// ═══════════════════════════════════════════════════════════
// 🔍 RECHERCHE ET RÉCUPÉRATION DE TEXTES
// ═══════════════════════════════════════════════════════════

// Recherche via l'API - supporte plusieurs Wikisources
async function searchTexts(query, limit = 20, wikisource = currentWikisource, offset = 0) {
    const url = `${wikisource.url}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${limit}&sroffset=${offset}&srnamespace=0&format=json&origin=*`;

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
    // Note: Sans liste d'IDs "Works", Gutenberg est difficile à exploiter proprement via API JS simple.
    // L'utilisateur a demandé de ne pas avoir de listes d'auteurs/oeuvres en dur.
    // Pour l'instant on retourne vide, sauf si on implémente une recherche miroir (complexe sans backend).
    return [];
}

// ═══════════════════════════════════════════════════════════
// 📜 POETRYDB - Poésie anglaise de qualité
// ═══════════════════════════════════════════════════════════
async function fetchPoetryDB() {
    try {
        // 1. Récupérer la liste de TOUS les auteurs disponibles (dynamique)
        const authorsRes = await fetch('https://poetrydb.org/author');
        const authorsData = await authorsRes.json();
        
        if (!authorsData || !authorsData.authors || authorsData.authors.length === 0) return [];
        
        // 2. Choisir un auteur au hasard
        const randomAuthor = authorsData.authors[Math.floor(Math.random() * authorsData.authors.length)];
        
        // 3. Récupérer ses poèmes
        const res = await fetch(`https://poetrydb.org/author/${encodeURIComponent(randomAuthor)}/title,author,lines`);
        const poems = await res.json();
        
        if (Array.isArray(poems) && poems.length > 0) {
            // Prendre quelques poèmes au hasard
            const shuffled = poems.sort(() => Math.random() - 0.5).slice(0, 5);
            
            return shuffled.map(poem => ({
                title: poem.title,
                text: Array.isArray(poem.lines) ? poem.lines.join('\n') : poem.lines,
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
//  ARCHIVE.ORG - Internet Archive (API Recherche Dynamique)
// ═══════════════════════════════════════════════════════════
async function fetchArchiveOrg() {
    try {
        // 1. Déterminer la langue (Archive.org)
        let language = '(fre OR eng)';
        
        if (selectedLang === 'fr') {
            language = 'fre';
        } else if (selectedLang === 'en') {
            language = 'eng';
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
        
        const res = await fetch(url);
        const data = await res.json();
        const docs = data.response?.docs || [];

        const results = [];
        
        // 3. Récupérer le contenu textuel brut pour chaque résultat
        for (const doc of docs) {
            // URL du fichier texte brut (format classique Archive.org : identifier_djvu.txt)
            const textUrl = `https://archive.org/download/${doc.identifier}/${doc.identifier}_djvu.txt`;
            
            try {
                // On tente de récupérer le texte
                const textRes = await fetch(textUrl);
                if (textRes.ok) {
                    let fullText = await textRes.text();
                    
                    // 4. Nettoyage et découpage (l'OCR brut est souvent sale)
                    // On saute le début (souvent des métadonnées) et on prend un gros extrait
                    if (fullText.length > 2000) {
                        // Chercher un début de paragraphe propre après le header
                        const start = Math.floor(Math.random() * (fullText.length / 4));
                        const cleanStart = fullText.indexOf('\n\n', start);
                        
                        let excerpt = fullText.substring(cleanStart > -1 ? cleanStart : start, start + 2500);
                        
                        // Nettoyage basique des artefacts OCR
                        excerpt = excerpt.replace(/_/g, ' ')
                                         .replace(/[\d+]/g, '') // Numéros de pages
                                         .replace(/\n{3,}/g, '\n\n') // Trop de sauts
                                         .trim();

                        if (excerpt.length > 200) {
                            results.push({
                                title: doc.title,
                                text: excerpt + '\n\n[...] (Lire la suite sur Archive.org)',
                                author: Array.isArray(doc.creator) ? doc.creator[0] : (doc.creator || 'Archive.org'),
                                source: 'archive', // Identifiant source
                                url: `https://archive.org/details/${doc.identifier}`,
                                lang: (doc.language === 'fre' || selectedLang === 'fr') ? 'fr' : 'en'
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
        
        const res = await fetch(url);
        const data = await res.json();
        const docs = data.response?.docs || [];
        const results = [];

        for (const doc of docs) {
             const textUrl = `https://archive.org/download/${doc.identifier}/${doc.identifier}_djvu.txt`;
             try {
                const textRes = await fetch(textUrl);
                if (textRes.ok) {
                    let fullText = await textRes.text();
                    
                    if (fullText.length > 500) {
                        // Pour Archive.org, le texte brut est souvent très long et sale au début
                        // On essaie de trouver un morceau potable
                        const start = fullText.indexOf('\n\n', 500); // Sauter le header
                        let excerpt = fullText.substring(start > -1 ? start : 0, start + 3000);
                        
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
// 🌍 ALIMENTER LE POOL - Littérature mondiale
// ═══════════════════════════════════════════════════════════
async function fillPool() {
    // Si aucun filtre n'est défini, on met Wikisource par défaut (sécurité)
    if (!state.activeSourceFilter || state.activeSourceFilter.length === 0) {
        state.activeSourceFilter = ['wikisource'];
    }

    // Helper pour vérifier si la source est autorisée
    const isSourceAllowed = (s) => state.activeSourceFilter.includes(s) || state.activeSourceFilter.includes('all');

    // === 1. POETRYDB (si anglais actif) - Qualité garantie ===
    if ((selectedLang === 'all' || selectedLang === 'en') && isSourceAllowed('poetrydb')) {
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
    if (isSourceAllowed('gutenberg')) {
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
    }
    
    // === 1.6 ARCHIVE.ORG - Internet Archive ===
    if (isSourceAllowed('archive')) {
    try {
        const archiveTexts = await fetchArchiveOrg();
        for (const item of archiveTexts) {
            state.textPool.unshift({
                ...item,
                isPreloaded: true
            });
        }
    } catch (e) {
    }
    }
    
    // === 2. WIKISOURCE (sources traditionnelles) ===
    if (!isSourceAllowed('wikisource')) return;

    
    // === 2. WIKISOURCE (sources traditionnelles) ===
    const activeSources = getActiveWikisources();
    if (activeSources.length === 0 && state.textPool.length === 0) {
        console.error('Aucune source active');
        return;
    }
    
    // Mélanger les sources
    const shuffledSources = [...activeSources].sort(() => Math.random() - 0.5).slice(0, 3);
    
    for (const ws of shuffledSources) {
        // A) Stratégie de remplissage
        // 1. Si un terme de recherche est actif (ex: clic sur hashtag), on l'utilise en priorité
        // 2. Sinon, on alterne entre mots-clés génériques et hasard total
        
        let searchTerm = null;
        let useRandom = false;

        if (state.activeSearchTerm) {
            searchTerm = state.activeSearchTerm;
            
            // SI UN FILTRE EST ACTIF (Exploration par thème/époque/genre)
            // Alors on veut "dériver" : on ne reste pas bloqué sur le terme initial (ex: "Chrétien de Troyes")
            // On re-pioche un nouveau mot-clé dans le filtre actif pour varier les plaisirs au scroll infinite
            const activeKeywords = window.getActiveFilterKeywords ? window.getActiveFilterKeywords() : [];
            const hasActiveFilters = activeKeywords.length > 0;
            
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
        } else {
            // Mots-clés génériques par langue
            const GENERIC_TERMS = {
                fr: ['Poésie', 'Roman', 'Conte', 'Théâtre', 'Philosophie', 'Lettres', 'Histoire'],
                en: ['Poetry', 'Novel', 'Tale', 'Play', 'Philosophy', 'Letters', 'History'],
                de: ['Gedicht', 'Roman', 'Märchen', 'Theater', 'Philosophie'],
                it: ['Poesia', 'Romanzo', 'Favola', 'Teatro'],
                es: ['Poesía', 'Novela', 'Cuento', 'Teatro']
            };
            const fallbackTerms = GENERIC_TERMS[ws.lang] || GENERIC_TERMS['fr'];
            
            // 50% de chance d'utiliser l'API Random vs Recherche générique
            // SAUF SI des filtres sont actifs -> on force la recherche
            const activeKeywords = window.getActiveFilterKeywords ? window.getActiveFilterKeywords() : [];
            const hasActiveFilters = activeKeywords.length > 0;

            if (!hasActiveFilters && Math.random() > 0.5) {
                useRandom = true;
            } else {
                if (hasActiveFilters) {
                    // Si filtres actifs, on pioche un mot clé parmi ceux des filtres
                    searchTerm = activeKeywords[Math.floor(Math.random() * activeKeywords.length)];
                } else {
                    searchTerm = fallbackTerms[Math.floor(Math.random() * fallbackTerms.length)];
                }
            }
        }
            
        if (useRandom) {
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
    }
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
        
        // Mélanger et charger
        state.textPool = state.textPool.sort(() => Math.random() - 0.5);
        
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
