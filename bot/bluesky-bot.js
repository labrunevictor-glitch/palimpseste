/**
 * Bot Bluesky — Palimpseste
 * 
 * Poste automatiquement des extraits littéraires.
 * Source primaire : tendances Supabase (extraits curés par les utilisateurs).
 * Fallback : récupération live depuis Wikisource.
 * Exécuté via GitHub Actions (1x/heure, FR + EN).
 * 
 * Nécessite les variables d'environnement :
 *   BLUESKY_IDENTIFIER  (ex: palimpseste.bsky.social)
 *   BLUESKY_APP_PASSWORD (mot de passe d'app généré dans Settings)
 */

const https = require('https');

// ─── Wikisource Config (identique à l'app sources.js) ───

const WIKISOURCES = [
    // Langues modernes
    { lang: 'fr', url: 'https://fr.wikisource.org' },
    { lang: 'en', url: 'https://en.wikisource.org' },
    { lang: 'de', url: 'https://de.wikisource.org' },
    { lang: 'it', url: 'https://it.wikisource.org' },
    { lang: 'es', url: 'https://es.wikisource.org' },
    { lang: 'pt', url: 'https://pt.wikisource.org' },
    { lang: 'ru', url: 'https://ru.wikisource.org' },
    { lang: 'zh', url: 'https://zh.wikisource.org' },
    { lang: 'ja', url: 'https://ja.wikisource.org' },
    { lang: 'ar', url: 'https://ar.wikisource.org' },
    { lang: 'el', url: 'https://el.wikisource.org' },
    // Langues anciennes
    { lang: 'la', url: 'https://la.wikisource.org' },
    { lang: 'he', url: 'https://he.wikisource.org' },
    { lang: 'sa', url: 'https://sa.wikisource.org' },
    { lang: 'yi', url: 'https://yi.wikisource.org' },
];

// Mots-clés de recherche par langue (identique à l'app)
const SEARCH_TERMS = {
    fr: ['Poésie', 'Roman', 'Conte', 'Théâtre', 'Philosophie', 'Lettres', 'Histoire'],
    en: ['Poetry', 'Novel', 'Tale', 'Play', 'Philosophy', 'Letters', 'History'],
    de: ['Gedicht', 'Roman', 'Märchen', 'Theater', 'Philosophie'],
    it: ['Poesia', 'Romanzo', 'Favola', 'Teatro'],
    es: ['Poesía', 'Novela', 'Cuento', 'Teatro'],
    pt: ['Poesia', 'Romance', 'Conto', 'Teatro'],
    ru: ['поэзия', 'роман', 'сказка', 'театр', 'философия'],
    zh: ['詩', '小說', '戲劇', '哲學'],
    ja: ['詩', '小説', '戯曲', '物語'],
    ar: ['شعر', 'رواية', 'قصة', 'مسرح'],
    el: ['ποίηση', 'μυθιστόρημα', 'θέατρο', 'φιλοσοφία'],
    la: ['carmen', 'ode', 'epistula', 'liber', 'fabula', 'poema', 'oratio'],
    he: ['שיר', 'תהלים', 'משל', 'ספר', 'דבר'],
    sa: ['गीता', 'श्लोक', 'सूक्त', 'कथा', 'स्तोत्र'],
    yi: [],
};

const LANG_WEIGHTS = { fr: 5, en: 3, de: 1, it: 1, es: 1, pt: 1, ru: 1, zh: 1, ja: 1, ar: 1, el: 1, la: 1, he: 1, sa: 1, yi: 1 };

// ─── HTTP Helpers ───

function httpGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'PalimpsestBot/1.0 (https://palimpseste.vercel.app)' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error(`JSON parse error for ${url}: ${e.message}`)); }
            });
        }).on('error', reject);
    });
}

function httpPost(hostname, path, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const jsonBody = JSON.stringify(body);
        const options = {
            hostname,
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(jsonBody),
                ...headers
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
                    else reject(new Error(`Bluesky API ${res.statusCode}: ${JSON.stringify(parsed)}`));
                } catch (e) {
                    reject(new Error(`Bluesky API ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(jsonBody);
        req.end();
    });
}

// ─── Supabase Trending Config ───

const SUPABASE_URL = 'https://cqoepdrqifilqxnvflyy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2VwZHJxaWZpbHF4bnZmbHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzQxMTksImV4cCI6MjA4NDc1MDExOX0.e7dJmzUEgzDIix12ca38HvBmF7Cgp_fTZPT6gZ6Xy5s';

/**
 * Fetch trending extraits from Supabase (the app's user-curated content).
 * Returns a quote object { text, author, source, lang } or null.
 */
async function fetchTrendingQuote(forceLang) {
    try {
        // Query Supabase REST API for top-liked extracts
        // Note: is_silent can be NULL (most rows), so we use or filter
        const query = new URLSearchParams({
            select: 'id,texte,source_title,source_author,source_url,likes_count',
            order: 'likes_count.desc,created_at.desc',
            limit: '30',
            'or': '(is_silent.is.null,is_silent.eq.false)',
            'source_author': 'not.is.null',
            'texte': 'not.is.null',
        });

        const url = `${SUPABASE_URL}/rest/v1/extraits?${query.toString()}`;

        const data = await new Promise((resolve, reject) => {
            https.get(url, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Accept': 'application/json',
                    'User-Agent': 'PalimpsestBot/1.0',
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(body);
                        if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
                        else reject(new Error(`Supabase ${res.statusCode}: ${body}`));
                    } catch (e) { reject(new Error(`Supabase JSON parse: ${e.message}`)); }
                });
            }).on('error', reject);
        });

        if (!Array.isArray(data) || data.length === 0) {
            console.log('   No trending extraits found in Supabase');
            return null;
        }

        console.log(`   Found ${data.length} trending extraits in Supabase`);

        // Filter: need texte >= 30 chars, real author, not junk content
        const valid = data.filter(e =>
            e.texte && e.texte.trim().length >= 30 &&
            e.source_author && e.source_author.trim().length > 1 &&
            isQuotePostWorthy(e.texte, e.source_author)
        );

        if (valid.length === 0) {
            console.log('   No valid extraits after filtering');
            return null;
        }

        // Pick a random one from top results (weighted toward top)
        // Top 5 get 3x weight, next 10 get 2x, rest get 1x
        const pool = [];
        valid.forEach((e, i) => {
            const weight = i < 5 ? 3 : i < 15 ? 2 : 1;
            for (let w = 0; w < weight; w++) pool.push(e);
        });
        const pick = pool[Math.floor(Math.random() * pool.length)];

        // Detect language from source_url or default based on forceLang
        let lang = forceLang || 'fr';
        if (pick.source_url) {
            if (pick.source_url.includes('fr.wikisource') || pick.source_url.includes('/fr/')) lang = 'fr';
            else if (pick.source_url.includes('en.wikisource') || pick.source_url.includes('/en/')) lang = 'en';
            else if (pick.source_url.includes('de.wikisource')) lang = 'de';
            else if (pick.source_url.includes('it.wikisource')) lang = 'it';
            else if (pick.source_url.includes('es.wikisource')) lang = 'es';
            else if (pick.source_url.includes('la.wikisource')) lang = 'la';
        }

        // If forceLang is specified and doesn't match, skip (we'll fall back to Wikisource)
        if (forceLang && lang !== forceLang) {
            console.log(`   Picked extrait is ${lang} but need ${forceLang}, trying another…`);
            // Try to find one that matches forceLang
            const langMatches = valid.filter(e => {
                if (!e.source_url) return forceLang === 'fr'; // default assume French
                if (e.source_url.includes(`${forceLang}.wikisource`)) return true;
                if (e.source_url.includes(`/${forceLang}/`)) return true;
                return false;
            });
            if (langMatches.length === 0) {
                console.log(`   No trending extraits for lang=${forceLang}`);
                return null;
            }
            const langPick = langMatches[Math.floor(Math.random() * langMatches.length)];
            return {
                text: langPick.texte.trim(),
                author: langPick.source_author.trim(),
                source: langPick.source_url || `${langPick.source_title}`,
                lang: forceLang,
                fromTrending: true,
                extraitId: langPick.id || null,
            };
        }

        return {
            text: pick.texte.trim(),
            author: pick.source_author.trim(),
            source: pick.source_url || `${pick.source_title}`,
            lang,
            fromTrending: true,
            extraitId: pick.id || null,
        };

    } catch (err) {
        console.log(`   ⚠️ Supabase trending fetch failed: ${err.message}`);
        return null;
    }
}

// ─── Universal Post Quality Gate ───

/**
 * Vérifie qu'un texte + auteur sont dignes d'être postés.
 * Appliqué à TOUTES les sources (trending ET Wikisource).
 */
function isQuotePostWorthy(text, author) {
    if (!text || !author) return false;
    const t = text.trim();
    const a = author.trim().toLowerCase();

    // ── Rejeter les notices légales / copyright ──
    if (/public domain|domaine public|united states|federal government|17\s*U\.?S\.?C/i.test(t)) return false;
    if (/copyright|©|all rights reserved|creative commons|free documentation license/i.test(t)) return false;
    if (/this work is (in the |)public domain/i.test(t)) return false;

    // ── Rejeter les encyclopédies / dictionnaires ──
    if (/encyclop[aæ]edia|encyclopédie|dictionnaire|dictionary|wörterbuch/i.test(a)) return false;
    if (/^\d{4}\s/i.test(a)) return false; // "1911 Encyclopædia…"
    if (/wikisource|wikipedia|wiki/i.test(a)) return false;

    // ── Rejeter les pages de titre / frontispices (texte très majoritairement en MAJUSCULES) ──
    const upper = (t.match(/[A-ZÀ-Ü]/g) || []).length;
    const lower = (t.match(/[a-zà-ü]/g) || []).length;
    if (upper + lower > 20 && upper / (upper + lower) > 0.55) return false;

    // ── Rejeter le texte avec trop de mots TOUT EN MAJUSCULES ──
    const words = t.split(/\s+/);
    const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase() && /[A-ZÀ-Ü]/.test(w));
    if (words.length > 5 && capsWords.length / words.length > 0.3) return false;

    // ── Rejeter le texte qui ressemble à des métadonnées éditeur ──
    if (/\b(libraire|imprimeur|éditeur|typograph|imprimerie|chez\s[A-Z])\b/i.test(t) &&
        /\bPARIS\b|\bLONDON\b|\bLYON\b|\bBRUXELLES\b/.test(t)) return false;

    // ── Rejeter les textes trop courts pour un post intéressant ──
    if (t.length < 40) return false;

    // ── Rejeter les problèmes d'encodage (caractères de remplacement) ──
    if (/\uFFFD|ï¿½|Ã©|Ã¨|Ã |â€™|â€œ/.test(t)) return false;

    // ── Rejeter les listes / index (trop de retours à la ligne relatifs au texte) ──
    const lines = t.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 3 && t.length / lines.length < 30) return false;

    // ── Rejeter les textes qui commencent par des formules de catalogue ──
    if (/^(AUGMENT[ÉE]|NOUVELLE [ÉE]DITION|PREMI[ÈE]RE PARTIE|TOME [IVXLCDM]+|VOL\.?\s)/i.test(t.trim())) return false;
    if (/^(FABLES|TABLE DES|SOMMAIRE|CONTENTS|PRÉFACE|PREFACE|INTRODUCTION)\b/i.test(t.trim())) return false;

    return true;
}

// ─── Wikisource Fetching ───

function pickWeightedLang(forceLang) {
    if (forceLang) {
        const ws = WIKISOURCES.find(w => w.lang === forceLang);
        if (ws) return ws;
    }
    const pool = [];
    for (const ws of WIKISOURCES) {
        const w = LANG_WEIGHTS[ws.lang] || 1;
        for (let i = 0; i < w; i++) pool.push(ws);
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

async function searchWikisource(ws) {
    const terms = SEARCH_TERMS[ws.lang] || SEARCH_TERMS['fr'];
    if (terms.length === 0) return getRandomPages(ws); // fallback si pas de termes
    const term = terms[Math.floor(Math.random() * terms.length)];
    const offset = Math.floor(Math.random() * 50);
    const url = `${ws.url}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&srlimit=20&sroffset=${offset}&srnamespace=0&format=json&origin=*`;
    const data = await httpGet(url);
    return data?.query?.search || [];
}

async function getRandomPages(ws) {
    const url = `${ws.url}/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=5&format=json&origin=*`;
    const data = await httpGet(url);
    return data?.query?.random || [];
}

// Parse avec catégories (comme l'app: prop=text|displaytitle|categories|links)
async function parsePage(ws, title) {
    const url = `${ws.url}/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text|displaytitle|categories|links&pllimit=500&format=json&origin=*&redirects=true`;
    const data = await httpGet(url);
    return data?.parse || null;
}

function extractText(html) {
    if (!html) return '';

    // ── Phase 1 : cibler le contenu principal (comme l'app) ──
    let content = html;
    const prpMatch = html.match(/<div[^>]*class="[^"]*prp-pages-output[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div|$)/i);
    const poemMatch = html.match(/<div[^>]*class="[^"]*poem[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const mwMatch = html.match(/<div[^>]*class="[^"]*mw-parser-output[^"]*"[^>]*>([\s\S]*)/i);
    if (prpMatch) content = prpMatch[1];
    else if (poemMatch) content = poemMatch[1];
    else if (mwMatch) content = mwMatch[1];

    // ── Phase 2 : supprimer les blocs non-contenu ──
    let text = content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<(sup|sub)[^>]*>[\s\S]*?<\/\1>/gi, '')
        .replace(/<span[^>]*class="[^"]*reference[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
        .replace(/<(div|table|ul|section|nav|aside|span)[^>]*class="[^"]*(?:ws-noexport|noprint|navbox|infobox|metadata|hatnote|ambox|toc|catlinks|mw-editsection|headertemplate|ws-header|header|homonymie|bandeau-homonymie|bandeau-portail|titreoeuvre|auteur-oeuvre|redirectMsg|mw-headline|mw-page-title)[^"]*"[^>]*>[\s\S]*?<\/\1>/gi, '')
        .replace(/<span[^>]*class="[^"]*(?:page-title|mw-page-title|mw-[a-z]+|ws-[a-z]+)[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#\d+;/g, '')
        .replace(/&[a-z]+;/g, '')
        .replace(/\[modifier[^\]]*\]/g, '')
        .replace(/\[\d+\]/g, '')
        .replace(/modifier le wikicode/gi, '')
        .replace(/mw-page-title[^\s]*/gi, '')
        .replace(/Poésies \([^)]+\)/g, '')
        // Nettoyer numéros de vers/lignes (ex: "5555«Quant..." ou "1234 Le roi")
        .replace(/^\d{2,5}\s*/gm, '')
        // Nettoyer numéros de chapitre romains seuls sur une ligne
        .replace(/^\s*[IVXLCDM]{1,10}\s*$/gm, '')
        // Nettoyer marqueurs de chapitre en début de paragraphe ("XVIII ", "CHAPTER XII")
        .replace(/^(?:CHAPTER|CHAPITRE|CANTO|LIVRE|BOOK)\s+[IVXLCDM\d]+\s*/gim, '')
        .replace(/^[IVXLCDM]{2,10}\s+/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    // ── Phase 3 : supprimer les en-têtes métadonnées ──
    const lines = text.split('\n');
    let start = 0;
    for (let i = 0; i < Math.min(15, lines.length); i++) {
        const l = lines[i].toLowerCase();
        const line = lines[i].trim();
        if (l.includes('sommaire') || l.includes('édition') || l.includes('navigation') ||
            l.includes('conférence') || l.includes('présenté') || l.includes('siège') ||
            l.includes('présidée par') || l.includes('professeur') || l.includes('faculté') ||
            l.includes('table des matières') || l.includes('contents') ||
            l.includes('texte établi') || l.includes('catégorie') || l.includes('category') ||
            l.includes('voir aussi') || l.includes('see also') || l.includes('modifier') ||
            l.includes('mw-page-title') || l.includes('span class') ||
            line.length < 3 || (line.startsWith('(') && line.endsWith(')'))) {
            start = i + 1;
        } else if (line.length > 40) break;
    }
    text = lines.slice(start).join('\n').trim();

    return text;
}

function detectAuthor(parsed) {
    if (!parsed) return null;

    // 1. Liens "Auteur:XXX" / "Author:XXX" / "Autor:XXX" / "Autore:XXX" / "作者:XXX"
    //    (identique à l'app sources.js)
    const links = parsed.links || [];
    const authorPrefixes = ['Auteur:', 'Author:', 'Autor:', 'Autore:', '作者:'];
    for (const link of links) {
        const linkTitle = link['*'] || '';
        for (const prefix of authorPrefixes) {
            if (linkTitle.startsWith(prefix)) {
                const authorName = linkTitle.replace(prefix, '').replace(/_/g, ' ').trim();
                if (authorName.length > 2 && authorName.length < 50) return authorName;
            }
        }
    }

    // 2. Chercher dans les catégories (comme l'app: "Textes de XXX", "Works by XXX"…)
    const categories = parsed.categories || [];
    for (const cat of categories) {
        const catName = cat['*'] || '';
        const authorMatch = catName.match(/(?:Textes|Poèmes|Œuvres|Works|Texts|Poems|Werke|Opere|Obras)\s+(?:de|by|von|di)\s+(.+)/i);
        if (authorMatch && authorMatch[1].length > 2 && authorMatch[1].length < 50) {
            return authorMatch[1].trim();
        }
    }

    // 3. Classes CSS d'auteur dans le HTML brut
    const html = parsed.text?.['*'] || '';
    const classMatch = html.match(/<[^>]*class="[^"]*(?:ws-author|author|auteur|auteur-oeuvre)[^"]*"[^>]*>([^<]+)/i);
    if (classMatch) {
        const authorText = classMatch[1].trim();
        if (authorText.length > 2 && authorText.length < 50) return authorText;
    }

    // 4. Liens href contenant "Auteur:" dans le HTML brut
    const hrefMatch = html.match(/href="[^"]*(?:Auteur|Author|Autor|Autore):([^"&?#]+)"/i);
    if (hrefMatch) {
        return decodeURIComponent(hrefMatch[1]).replace(/_/g, ' ').trim();
    }

    // 5. Pattern "par XXX" ou "de XXX" / "by XXX" dans le texte initial
    const rawText = html.replace(/<[^>]+>/g, ' ').substring(0, 500);
    const parMatch = rawText.match(/(?:^|\n)\s*(?:par|de|by)\s+([A-ZÀ-Ü][a-zà-ü]+(?:\s+(?:de\s+)?[A-ZÀ-Ü][a-zà-ü\-]+){0,3})\s*(?:\n|$)/m);
    if (parMatch && parMatch[1].length > 3 && parMatch[1].length < 40) {
        return parMatch[1].trim();
    }

    // 6. Titre : format "Œuvre (Auteur)" (comme l'app)
    const title = parsed.displaytitle || parsed.title || '';
    const cleanTitle = title.replace(/<[^>]+>/g, '');
    const parenthMatch = cleanTitle.match(/\(([^)]+)\)$/);
    if (parenthMatch) {
        const potentialAuthor = parenthMatch[1].trim();
        if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü]+)*$/.test(potentialAuthor)) {
            return potentialAuthor;
        }
    }

    // 7. Titre : format "Auteur - Œuvre" ou "Œuvre - Auteur" (comme l'app)
    const dashMatch = cleanTitle.match(/^([^—–\-]+)[—–\-](.+)$/);
    if (dashMatch) {
        const part1 = dashMatch[1].trim();
        const part2 = dashMatch[2].trim();
        if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü]+)*$/.test(part1)) return part1;
        if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü]+)*$/.test(part2)) return part2;
    }

    // 8. Titre : format "Œuvre/Auteur" (slash)
    const slashParts = cleanTitle.split('/');
    if (slashParts.length >= 2) return slashParts[0].trim();

    return null;
}

function isGoodTitle(title) {
    if (!title || title.length < 3 || title.length > 200) return false;
    const t = title.toLowerCase();

    if (/^(catégor|category|kategorie|categoria)/i.test(t)) return false;
    if (/^(help|aide|hilfe|aiuto|ayuda|ajuda|manual|project|projet|image|file|fichier|template|modèle|module|media|special|spécial):/i.test(t)) return false;
    if (/^(auteur|author|autor|autore):/i.test(t)) return false;
    if (/^(discussion|talk|diskussion|discussione):/i.test(t)) return false;
    if (/^(index|page|file|portail|portal|wiki):/i.test(t)) return false;

    if (/^list[ea]?\s+(de|of|di|von)/i.test(t)) return false;
    if (t.startsWith('index ') || t.endsWith(' index')) return false;
    if (t.includes('table des matières') || t.includes('table of contents') || t.includes('inhaltsverzeichnis')) return false;
    if (t.includes('bibliographie') || t.includes('bibliography')) return false;

    if (t.includes('sa vie et son œuvre') || t.includes('sa vie et son oeuvre')) return false;
    if (t.includes('his life and work') || t.includes('sein leben')) return false;
    if (t.includes('étude biographique') || t.includes('étude sur')) return false;
    if (t.includes('biographical study') || t.includes('biography of')) return false;
    if (/\bbiograph/i.test(t) && !t.includes('/')) return false;

    if ((t.includes('œuvres complètes') || t.includes('complete works') ||
        t.includes('gesammelte werke') || t.includes('opere complete')) && !t.includes('/')) return false;

    if (/(sommaire|contents|table des matières)$/i.test(t)) return false;

    return true;
}

// ── Analyse qualité (identique à l'app analyzeContentQuality) ──
function isContentGoodQuality(text, parsed) {
    if (!text || text.length < 200) return { isGood: false, reason: 'too_short' };
    if (text.length > 80000) return { isGood: false, reason: 'too_long' };

    const html = parsed?.text?.['*'] || '';
    if (html.includes('redirectMsg') || html.includes('propose plusieurs éditions') ||
        html.includes('Cette page répertorie')) return { isGood: false, reason: 'index' };

    const links = parsed?.links || [];
    const linkCharsEstimate = links.length * 30;
    if (text.length > 0 && linkCharsEstimate / text.length > 0.25) return { isGood: false, reason: 'link_density' };

    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) return { isGood: false, reason: 'too_short' };
    const avgLineLength = text.length / lines.length;

    if (avgLineLength < 60) {
        const withPunct = lines.filter(l => /[.!?…:;]$/.test(l.trim())).length;
        const punctRatio = withPunct / lines.length;
        if (punctRatio < 0.3) return { isGood: false, reason: 'listy' };
    }

    // Mots black-listés dans le titre
    const title = (parsed.displaytitle || parsed.title || '').toLowerCase();
    const badWords = ['sommaire', 'contents', 'inhalt', 'table', 'index', 'chapitres', 'chapters'];
    if (badWords.some(w => title.includes(w))) return { isGood: false, reason: 'title_blacklist' };

    // Détecter le vieux français / texte médiéval illisible
    const archaicMarkers = /\b(chevalch|comande|ne·l|oiël|mult\b|\bert\b|\bfant\b|\bço\b|\bki\b|destr|guerpir|chalcier|seignurs|vassal[sz]|\bcuntre\b|\bpuis\b que|\bnuls\b hom)/i;
    const sample = text.substring(0, 500);
    const archaicHits = (sample.match(archaicMarkers) || []).length;
    if (archaicHits > 0) {
        const deepMarkers = sample.match(/\b(ert|fant|mult|comand[ea]|chevalch|oiël|guerpir|\bço\b|\bki\b|seignurs)\b/gi);
        if (deepMarkers && deepMarkers.length >= 2) return { isGood: false, reason: 'archaic' };
    }

    return { isGood: true };
}

// ── Détection d'index / sommaire et extraction de sous-lien (comme l'app) ──
function detectIndexAndSubLink(parsed) {
    const html = parsed?.text?.['*'] || '';
    
    // Détecter redirect ou page d'éditions multiples
    const isRedirect = html.includes('redirectMsg');
    const hasEditions = html.includes('propose plusieurs éditions') ||
                        html.includes('Cette page répertorie');
    const isIndex = isRedirect || hasEditions;
    
    let subLink = null;
    if (isIndex) {
        // Chercher un sous-lien utile (page de contenu réel)
        const linkRegex = /href="\/wiki\/([^"]+)"/g;
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
            const name = decodeURIComponent(match[1]);
            if (name.includes(':') || name.includes('Auteur') || name.includes('Discussion')) continue;
            if (name.includes('/') && !name.endsWith('/')) {
                if (!name.includes('Préface') && !name.includes('Notice') &&
                    !name.includes('Table') && !name.includes('Index')) {
                    subLink = name;
                    break;
                }
            }
        }
    }
    return { isIndex, subLink };
}

function extractBestQuote(text) {
    if (!text || text.length < 80) return null;

    const paragraphs = text.split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 20)
        // Nettoyer : retirer les paragraphes qui commencent par un numéro de chapitre
        .filter(p => !/^\s*[IVXLCDM]{2,10}\b/.test(p))
        .filter(p => !/^\s*(CHAPTER|CHAPITRE|CANTO|LIVRE|BOOK)\s/i.test(p))
        // Retirer les paragraphes qui sont juste un titre/heading
        .filter(p => !(p.length < 60 && /^[A-ZÀ-Ü\s\-']+$/.test(p)))
        // Retirer les paragraphes avec trop de numéros (tables, index)
        .filter(p => (p.match(/\d+/g) || []).length < p.split(' ').length * 0.3);

    if (paragraphs.length === 0) return null;

    // Priorité 1 : taille idéale (100-450 chars)
    const ideal = paragraphs.filter(p => {
        const len = p.trim().length;
        return len >= 100 && len <= 450;
    });
    if (ideal.length > 0) {
        return ideal[Math.floor(Math.random() * ideal.length)].trim();
    }

    // Priorité 2 : acceptable (80-500 chars)
    const good = paragraphs.filter(p => {
        const len = p.trim().length;
        return len >= 80 && len <= 500;
    });
    if (good.length > 0) {
        return good[Math.floor(Math.random() * good.length)].trim();
    }

    // Priorité 3 : couper un paragraphe long
    for (const p of paragraphs) {
        const trimmed = p.trim();
        if (trimmed.length >= 60) {
            if (trimmed.length <= 500) return trimmed;
            const cut = trimmed.substring(0, 500);
            const lastSentence = Math.max(
                cut.lastIndexOf('. '), cut.lastIndexOf('.\n'),
                cut.lastIndexOf('! '), cut.lastIndexOf('? '),
                cut.lastIndexOf('…')
            );
            if (lastSentence > 200) return cut.substring(0, lastSentence + 1);
            const lastSpace = cut.lastIndexOf(' ');
            if (lastSpace > 300) return cut.substring(0, lastSpace) + '…';
            return cut + '…';
        }
    }
    return null;
}

/**
 * Tente de récupérer un texte depuis une page Wikisource (avec récursion dans les sous-pages).
 * Logique identique à l'app fetchText() : récursion 4 niveaux, suivi sommaire, link graph.
 */
async function fetchTextFromPage(ws, title, depth = 0) {
    if (depth > 4) return null;
    if (!isGoodTitle(title)) return null;

    console.log(`${'    '.repeat(depth + 1)}Parsing: ${title} (depth ${depth})`);
    const parsed = await parsePage(ws, title);
    if (!parsed?.text?.['*']) return null;

    const html = parsed.text['*'];
    const links = parsed.links || [];

    // ═══ ANALYSE DU GRAPHE DES LIENS (comme l'app) ═══
    // Compter les liens vers des sous-pages (même préfixe + "/")
    const basePage = title.split('/')[0];
    const subPageLinks = links.filter(l => {
        const t = l['*'] || '';
        return t.startsWith(basePage + '/') && l.ns === 0;
    });

    // Si la page a beaucoup de liens vers ses sous-pages, c'est un sommaire
    if (subPageLinks.length >= 5) {
        const randomSub = subPageLinks[Math.floor(Math.random() * subPageLinks.length)];
        console.log(`${'    '.repeat(depth + 1)}↳ Sommaire détecté (${subPageLinks.length} sous-pages), suit: ${randomSub['*']}`);
        return await fetchTextFromPage(ws, randomSub['*'], depth + 1);
    }

    // Détecter page d'index classique (redirections, éditions multiples)
    const { isIndex, subLink } = detectIndexAndSubLink(parsed);
    if (isIndex && subLink) {
        console.log(`${'    '.repeat(depth + 1)}↳ Index détecté, suit: ${subLink}`);
        return await fetchTextFromPage(ws, subLink, depth + 1);
    }

    const text = extractText(html);
    if (text.length < 100) return null;

    // ═══ ANALYSE STATISTIQUE DE QUALITÉ (comme l'app) ═══
    const quality = isContentGoodQuality(text, parsed);
    if (!quality.isGood) {
        // Si c'est rejeté parce que c'est un sommaire/liste, on essaie de trouver un lien pertinent
        if (quality.reason === 'link_density' || quality.reason === 'listy') {
            const contentLinks = links.filter(l => l.ns === 0 && !(l['*'] || '').includes(':'));
            if (contentLinks.length > 0) {
                const randomLink = contentLinks[Math.floor(Math.random() * contentLinks.length)];
                console.log(`${'    '.repeat(depth + 1)}↳ Contenu ${quality.reason}, suit lien: ${randomLink['*']}`);
                return await fetchTextFromPage(ws, randomLink['*'], depth + 1);
            }
        }
        return null;
    }

    const quote = extractBestQuote(text);
    if (!quote) return null;

    const author = detectAuthor(parsed);
    const cleanTitle = (parsed.displaytitle || title).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();

    if (!author) {
        console.log(`${'    '.repeat(depth + 1)}✗ No author found for: ${cleanTitle}`);
        return null;
    }

    if (!isQuotePostWorthy(quote, author)) {
        console.log(`${'    '.repeat(depth + 1)}✗ Post not worthy: "${quote.substring(0, 50)}…" by ${author}`);
        return null;
    }

    console.log(`${'    '.repeat(depth + 1)}✓ Found: "${quote.substring(0, 60)}…" by ${author}`);
    return {
        text: quote,
        author,
        title: cleanTitle,
        lang: ws.lang,
        source: `${ws.url}/wiki/${encodeURIComponent(title)}`
    };
}

async function fetchQuoteFromWikisource(maxRetries = 8, forceLang = null) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const ws = pickWeightedLang(forceLang);
            console.log(`  Tentative ${attempt + 1}: ${ws.lang}.wikisource.org`);

            const pages = Math.random() < 0.5
                ? await getRandomPages(ws)
                : await searchWikisource(ws);

            if (!pages.length) continue;

            const shuffled = pages.sort(() => Math.random() - 0.5);

            for (const page of shuffled) {
                const result = await fetchTextFromPage(ws, page.title, 0);
                if (result) return result;
            }
        } catch (err) {
            console.log(`    ✗ Error: ${err.message}`);
        }
    }
    return null;
}

// ─── Bluesky AT Protocol ───

async function blueskyLogin(identifier, appPassword) {
    return httpPost('bsky.social', '/xrpc/com.atproto.server.createSession', {
        identifier,
        password: appPassword
    });
}

/**
 * Construit les facets (liens cliquables, hashtags) pour Bluesky.
 * Bluesky utilise les "graphèmes" UTF-8 (= octets UTF-8) pour les positions.
 */
function buildFacets(text) {
    const facets = [];
    const encoder = new TextEncoder();

    // Détecter les URLs
    const urlRegex = /https?:\/\/[^\s)]+/g;
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
        const before = encoder.encode(text.substring(0, match.index));
        const target = encoder.encode(match[0]);
        facets.push({
            index: { byteStart: before.length, byteEnd: before.length + target.length },
            features: [{ $type: 'app.bsky.richtext.facet#link', uri: match[0] }]
        });
    }

    // Détecter les hashtags
    const hashRegex = /#[a-zA-ZÀ-ÿ]\w*/g;
    while ((match = hashRegex.exec(text)) !== null) {
        const before = encoder.encode(text.substring(0, match.index));
        const target = encoder.encode(match[0]);
        facets.push({
            index: { byteStart: before.length, byteEnd: before.length + target.length },
            features: [{ $type: 'app.bsky.richtext.facet#tag', tag: match[0].slice(1) }]
        });
    }

    return facets;
}

async function postToBluesky(session, text, lang) {
    const facets = buildFacets(text);

    const record = {
        $type: 'app.bsky.feed.post',
        text,
        facets,
        createdAt: new Date().toISOString(),
        langs: [lang || 'fr']
    };

    return httpPost('bsky.social', '/xrpc/com.atproto.repo.createRecord', {
        repo: session.did,
        collection: 'app.bsky.feed.post',
        record
    }, {
        'Authorization': `Bearer ${session.accessJwt}`
    });
}

// ─── Hashtags par langue ───

const HASHTAGS = {
    fr: '#littérature #livres #citation #wikisource',
    en: '#literature #books #quote #wikisource',
    de: '#literatur #bücher #zitat #wikisource',
    it: '#letteratura #libri #citazione #wikisource',
    es: '#literatura #libros #cita #wikisource',
    pt: '#literatura #livros #citação #wikisource',
    ru: '#литература #книги #цитата #wikisource',
    zh: '#文学 #书籍 #引用 #wikisource',
    ja: '#文学 #本 #引用 #wikisource',
    ar: '#أدب #كتب #اقتباس #wikisource',
    el: '#λογοτεχνία #βιβλία #wikisource',
    la: '#literature #classics #latin #wikisource',
    he: '#ספרות #ספרים #wikisource',
    sa: '#साहित्य #संस्कृत #wikisource',
    yi: '#ליטעראטור #ביכער #wikisource',
};

// ─── Format Post ───

/**
 * Compte les graphemes (caractères Unicode) d'un texte.
 * Bluesky compte en graphemes, pas en bytes UTF-8.
 */
function countGraphemes(str) {
    // Segmenter si disponible (Node 16+), sinon fallback Array.from
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter('fr', { granularity: 'grapheme' });
        return [...segmenter.segment(str)].length;
    }
    return [...str].length;
}

function formatPost(quote) {
    const maxGraphemes = 300;

    const lang = quote.lang || 'fr';
    // Lien direct vers l'extrait si disponible (trending), sinon lien général
    const appLink = quote.extraitId 
        ? `\nhttps://palimpseste.vercel.app/#text/${quote.extraitId}`
        : `\nhttps://palimpseste.vercel.app`;
    const hashtag = `\n${HASHTAGS[lang] || HASHTAGS['en']}`;
    const suffix = `\n\n— ${quote.author}${appLink}${hashtag}`;
    const suffixGraphemes = countGraphemes(suffix);

    let text = quote.text;
    const available = maxGraphemes - suffixGraphemes - 1;

    // Tronquer si besoin (sur les graphemes, pas les bytes)
    let chars = [...text];
    if (chars.length > available) {
        // Reconstruire et couper au dernier espace
        text = chars.slice(0, available).join('');
        const lastSpace = text.lastIndexOf(' ');
        if (lastSpace > text.length * 0.6) {
            text = text.substring(0, lastSpace);
        }
        text += '…';
    }

    return `${text}\n\n— ${quote.author}${appLink}${hashtag}`;
}

// ─── Main ───

async function main() {
    const identifier = process.env.BLUESKY_IDENTIFIER;
    const appPassword = process.env.BLUESKY_APP_PASSWORD;
    // Paramètre --lang (fr, en, etc.) passé en CLI
    const langArg = process.argv.find(a => a.startsWith('--lang='));
    const forceLang = langArg ? langArg.split('=')[1] : null;

    if (!identifier || !appPassword) {
        console.error('❌ Missing Bluesky credentials in environment variables');
        console.error('   Required: BLUESKY_IDENTIFIER, BLUESKY_APP_PASSWORD');
        process.exit(1);
    }

    let quote = null;

    // 1) Essayer d'abord les tendances Supabase (contenu curé par les utilisateurs)
    console.log(`🔥 Fetching trending quote from Supabase${forceLang ? ` (lang: ${forceLang})` : ''}…`);
    quote = await fetchTrendingQuote(forceLang);

    if (quote) {
        console.log(`   ✅ Got trending quote by ${quote.author} (${quote.lang})`);
    } else {
        // 2) Fallback: Wikisource live
        console.log(`\n🔍 Fallback: fetching from Wikisource${forceLang ? ` (lang: ${forceLang})` : ''}…\n`);
        quote = await fetchQuoteFromWikisource(8, forceLang);
    }

    if (!quote) {
        console.error('❌ Could not find a suitable quote from trending or Wikisource');
        process.exit(1);
    }

    const post = formatPost(quote);
    const encoder = new TextEncoder();

    console.log(`\n📝 Posting to Bluesky (${encoder.encode(post).length} bytes, lang: ${quote.lang}, source: ${quote.fromTrending ? 'TRENDING' : 'WIKISOURCE'}):\n${post}\n`);
    console.log(`📖 Source: ${quote.source}\n`);

    try {
        console.log('🔐 Logging in to Bluesky…');
        const session = await blueskyLogin(identifier, appPassword);
        console.log(`   Logged in as ${session.handle}`);

        const result = await postToBluesky(session, post, quote.lang);
        console.log(`✅ Posted to Bluesky!`);
        console.log(`   https://bsky.app/profile/${session.handle}/post/${result.uri.split('/').pop()}`);
    } catch (err) {
        console.error(`❌ Failed to post: ${err.message}`);
        process.exit(1);
    }
}

main();
