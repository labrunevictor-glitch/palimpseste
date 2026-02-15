/**
 * Bot X (ex-Twitter) — Palimpseste
 * 
 * Poste automatiquement des extraits littéraires sur X.
 * Source primaire : tendances Supabase (extraits curés par les utilisateurs).
 * Fallback : récupération live depuis Wikisource.
 * Exécuté via GitHub Actions (1x/heure, 24h/24, audience internationale).
 * 
 * Utilise l'API X v2 avec OAuth 1.0a (User Context).
 * 
 * Nécessite les variables d'environnement :
 *   X_API_KEY            (Consumer Key / API Key)
 *   X_API_SECRET         (Consumer Secret / API Secret)
 *   X_ACCESS_TOKEN       (Access Token)
 *   X_ACCESS_TOKEN_SECRET (Access Token Secret)
 *   SUPABASE_SERVICE_ROLE_KEY  (clé service_role pour écrire dans la base, bypass RLS)
 */

const https = require('https');
const crypto = require('crypto');

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

// ─── Supabase Trending Config ───

const SUPABASE_URL = 'https://cqoepdrqifilqxnvflyy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2VwZHJxaWZpbHF4bnZmbHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzQxMTksImV4cCI6MjA4NDc1MDExOX0.e7dJmzUEgzDIix12ca38HvBmF7Cgp_fTZPT6gZ6Xy5s';

/**
 * Fetch trending extraits from Supabase (the app's user-curated content).
 * Returns a quote object { text, author, source, lang } or null.
 */
async function fetchTrendingQuote(forceLang, excludeUrls = new Set()) {
    try {
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

        const valid = data.filter(e =>
            e.texte && e.texte.trim().length >= 30 &&
            e.source_author && e.source_author.trim().length > 1 &&
            isQuotePostWorthy(e.texte, e.source_author) &&
            !excludeUrls.has(e.source_url)
        );

        if (valid.length === 0) {
            console.log('   No valid extraits after filtering');
            return null;
        }

        const pool = [];
        valid.forEach((e, i) => {
            const weight = i < 5 ? 3 : i < 15 ? 2 : 1;
            for (let w = 0; w < weight; w++) pool.push(e);
        });
        const pick = pool[Math.floor(Math.random() * pool.length)];

        let lang = forceLang || 'fr';
        if (pick.source_url) {
            if (pick.source_url.includes('fr.wikisource') || pick.source_url.includes('/fr/')) lang = 'fr';
            else if (pick.source_url.includes('en.wikisource') || pick.source_url.includes('/en/')) lang = 'en';
            else if (pick.source_url.includes('de.wikisource')) lang = 'de';
            else if (pick.source_url.includes('it.wikisource')) lang = 'it';
            else if (pick.source_url.includes('es.wikisource')) lang = 'es';
            else if (pick.source_url.includes('la.wikisource')) lang = 'la';
        }

        if (forceLang && lang !== forceLang) {
            console.log(`   Picked extrait is ${lang} but need ${forceLang}, trying another…`);
            const langMatches = valid.filter(e => {
                if (!e.source_url) return forceLang === 'fr';
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

// ─── Supabase Insert (sauvegarde des extraits Wikisource) ───

const BOT_USER_ID = '00000000-0000-4000-a000-b07b07b07b07';
const BOT_EMAIL = 'bot@palimpseste.app';

async function ensureBotUserExists(serviceRoleKey) {
    try {
        const body = JSON.stringify({
            id: BOT_USER_ID,
            email: BOT_EMAIL,
            password: `bot-${Date.now()}-notrealpassword`,
            email_confirm: true,
        });
        const url = new URL(`${SUPABASE_URL}/auth/v1/admin/users`);
        await new Promise((resolve, reject) => {
            const options = {
                hostname: url.hostname,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    'apikey': serviceRoleKey,
                    'Authorization': `Bearer ${serviceRoleKey}`,
                }
            };
            const req = https.request(options, (res) => {
                let responseBody = '';
                res.on('data', chunk => responseBody += chunk);
                res.on('end', () => {
                    if (res.statusCode < 500) resolve();
                    else reject(new Error(`Auth Admin ${res.statusCode}: ${responseBody}`));
                });
            });
            req.on('error', reject);
            req.write(body);
            req.end();
        });
    } catch (err) {
        console.log(`   ⚠️ Bot user check failed: ${err.message} (non-fatal)`);
    }
}

async function saveExtraitToSupabase(quote) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        console.log('   ⚠️ SUPABASE_SERVICE_ROLE_KEY not set, skipping save');
        return null;
    }

    try {
        await ensureBotUserExists(serviceRoleKey);

        const texte = (quote.text || '').substring(0, 150).trim();
        const body = JSON.stringify({
            user_id: BOT_USER_ID,
            texte,
            source_title: quote.title || quote.author || 'Wikisource',
            source_author: quote.author || 'Anonyme',
            source_url: quote.source || null,
            is_silent: true,
            likes_count: 0,
            comments_count: 0,
        });

        const url = new URL(`${SUPABASE_URL}/rest/v1/extraits`);

        const data = await new Promise((resolve, reject) => {
            const options = {
                hostname: url.hostname,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    'apikey': serviceRoleKey,
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Prefer': 'return=representation',
                    'Accept': 'application/json',
                }
            };
            const req = https.request(options, (res) => {
                let responseBody = '';
                res.on('data', chunk => responseBody += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseBody);
                        if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
                        else reject(new Error(`Supabase INSERT ${res.statusCode}: ${responseBody}`));
                    } catch (e) { reject(new Error(`Supabase INSERT parse: ${e.message}`)); }
                });
            });
            req.on('error', reject);
            req.write(body);
            req.end();
        });

        const inserted = Array.isArray(data) ? data[0] : data;
        if (inserted?.id) {
            console.log(`   💾 Saved to Supabase: ${inserted.id} (is_silent=true)`);
            return inserted.id;
        }
        console.log('   ⚠️ Supabase INSERT returned no id');
        return null;

    } catch (err) {
        console.log(`   ⚠️ Supabase save failed: ${err.message}`);
        return null;
    }
}

// ─── Déduplication : historique des posts du bot ───

async function fetchRecentBotPosts() {
    try {
        const query = new URLSearchParams({
            select: 'source_url',
            user_id: `eq.${BOT_USER_ID}`,
            'source_url': 'not.is.null',
            order: 'created_at.desc',
            limit: '1000',
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
                        else resolve([]);
                    } catch (e) { resolve([]); }
                });
            }).on('error', () => resolve([]));
        });

        const urls = new Set(data.filter(e => e.source_url).map(e => e.source_url));
        console.log(`   📋 Bot history: ${urls.size} previously posted URLs`);
        return urls;
    } catch (err) {
        console.log(`   ⚠️ Could not fetch bot history: ${err.message}`);
        return new Set();
    }
}

// ─── Universal Post Quality Gate ───

function isQuotePostWorthy(text, author) {
    if (!text || !author) return false;
    const t = text.trim();
    const a = author.trim().toLowerCase();

    if (/public domain|domaine public|united states|federal government|17\s*U\.?S\.?C/i.test(t)) return false;
    if (/copyright|©|all rights reserved|creative commons|free documentation license/i.test(t)) return false;
    if (/this work is (in the |)public domain/i.test(t)) return false;

    if (/encyclop[aæ]edia|encyclopédie|dictionnaire|dictionary|wörterbuch/i.test(a)) return false;
    if (/^\d{4}\s/i.test(a)) return false;
    if (/wikisource|wikipedia|wiki/i.test(a)) return false;

    const upper = (t.match(/[A-ZÀ-Ü]/g) || []).length;
    const lower = (t.match(/[a-zà-ü]/g) || []).length;
    if (upper + lower > 20 && upper / (upper + lower) > 0.55) return false;

    const words = t.split(/\s+/);
    const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase() && /[A-ZÀ-Ü]/.test(w));
    if (words.length > 5 && capsWords.length / words.length > 0.3) return false;

    if (/\b(libraire|imprimeur|éditeur|typograph|imprimerie|chez\s[A-Z])\b/i.test(t) &&
        /\bPARIS\b|\bLONDON\b|\bLYON\b|\bBRUXELLES\b/.test(t)) return false;

    if (t.length < 40) return false;

    if (/\uFFFD|ï¿½|Ã©|Ã¨|Ã |â€™|â€œ/.test(t)) return false;

    const lines = t.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 3 && t.length / lines.length < 30) return false;

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
    if (terms.length === 0) return getRandomPages(ws);
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

async function parsePage(ws, title) {
    const url = `${ws.url}/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text|displaytitle|categories|links&pllimit=500&format=json&origin=*&redirects=true`;
    const data = await httpGet(url);
    return data?.parse || null;
}

function extractText(html) {
    if (!html) return '';

    let content = html;
    const prpMatch = html.match(/<div[^>]*class="[^"]*prp-pages-output[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div|$)/i);
    const poemMatch = html.match(/<div[^>]*class="[^"]*poem[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const mwMatch = html.match(/<div[^>]*class="[^"]*mw-parser-output[^"]*"[^>]*>([\s\S]*)/i);
    if (prpMatch) content = prpMatch[1];
    else if (poemMatch) content = poemMatch[1];
    else if (mwMatch) content = mwMatch[1];

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
        .replace(/^\d{2,5}\s*/gm, '')
        .replace(/^\s*[IVXLCDM]{1,10}\s*$/gm, '')
        .replace(/^(?:CHAPTER|CHAPITRE|CANTO|LIVRE|BOOK)\s+[IVXLCDM\d]+\s*/gim, '')
        .replace(/^[IVXLCDM]{2,10}\s+/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

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

    const categories = parsed.categories || [];
    for (const cat of categories) {
        const catName = cat['*'] || '';
        const authorMatch = catName.match(/(?:Textes|Poèmes|Œuvres|Works|Texts|Poems|Werke|Opere|Obras)\s+(?:de|by|von|di)\s+(.+)/i);
        if (authorMatch && authorMatch[1].length > 2 && authorMatch[1].length < 50) {
            return authorMatch[1].trim();
        }
    }

    const html = parsed.text?.['*'] || '';
    const classMatch = html.match(/<[^>]*class="[^"]*(?:ws-author|author|auteur|auteur-oeuvre)[^"]*"[^>]*>([^<]+)/i);
    if (classMatch) {
        const authorText = classMatch[1].trim();
        if (authorText.length > 2 && authorText.length < 50) return authorText;
    }

    const hrefMatch = html.match(/href="[^"]*(?:Auteur|Author|Autor|Autore):([^"&?#]+)"/i);
    if (hrefMatch) {
        return decodeURIComponent(hrefMatch[1]).replace(/_/g, ' ').trim();
    }

    const rawText = html.replace(/<[^>]+>/g, ' ').substring(0, 500);
    const parMatch = rawText.match(/(?:^|\n)\s*(?:par|de|by)\s+([A-ZÀ-Ü][a-zà-ü]+(?:\s+(?:de\s+)?[A-ZÀ-Ü][a-zà-ü\-]+){0,3})\s*(?:\n|$)/m);
    if (parMatch && parMatch[1].length > 3 && parMatch[1].length < 40) {
        return parMatch[1].trim();
    }

    const title = parsed.displaytitle || parsed.title || '';
    const cleanTitle = title.replace(/<[^>]+>/g, '');
    const parenthMatch = cleanTitle.match(/\(([^)]+)\)$/);
    if (parenthMatch) {
        const potentialAuthor = parenthMatch[1].trim();
        if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü]+)*$/.test(potentialAuthor)) {
            return potentialAuthor;
        }
    }

    const dashMatch = cleanTitle.match(/^([^—–\-]+)[—–\-](.+)$/);
    if (dashMatch) {
        const part1 = dashMatch[1].trim();
        const part2 = dashMatch[2].trim();
        if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü]+)*$/.test(part1)) return part1;
        if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü]+)*$/.test(part2)) return part2;
    }

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

    const title = (parsed.displaytitle || parsed.title || '').toLowerCase();
    const badWords = ['sommaire', 'contents', 'inhalt', 'table', 'index', 'chapitres', 'chapters'];
    if (badWords.some(w => title.includes(w))) return { isGood: false, reason: 'title_blacklist' };

    const archaicMarkers = /\b(chevalch|comande|ne·l|oiël|mult\b|\bert\b|\bfant\b|\bço\b|\bki\b|destr|guerpir|chalcier|seignurs|vassal[sz]|\bcuntre\b|\bpuis\b que|\bnuls\b hom)/i;
    const sample = text.substring(0, 500);
    const archaicHits = (sample.match(archaicMarkers) || []).length;
    if (archaicHits > 0) {
        const deepMarkers = sample.match(/\b(ert|fant|mult|comand[ea]|chevalch|oiël|guerpir|\bço\b|\bki\b|seignurs)\b/gi);
        if (deepMarkers && deepMarkers.length >= 2) return { isGood: false, reason: 'archaic' };
    }

    return { isGood: true };
}

function detectIndexAndSubLink(parsed) {
    const html = parsed?.text?.['*'] || '';

    const isRedirect = html.includes('redirectMsg');
    const hasEditions = html.includes('propose plusieurs éditions') ||
                        html.includes('Cette page répertorie');
    const isIndex = isRedirect || hasEditions;

    let subLink = null;
    if (isIndex) {
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
        .filter(p => !/^\s*[IVXLCDM]{2,10}\b/.test(p))
        .filter(p => !/^\s*(CHAPTER|CHAPITRE|CANTO|LIVRE|BOOK)\s/i.test(p))
        .filter(p => !(p.length < 60 && /^[A-ZÀ-Ü\s\-']+$/.test(p)))
        .filter(p => (p.match(/\d+/g) || []).length < p.split(' ').length * 0.3);

    if (paragraphs.length === 0) return null;

    const ideal = paragraphs.filter(p => {
        const len = p.trim().length;
        return len >= 100 && len <= 400; // Plus court que Bluesky/Mastodon (280 chars X)
    });
    if (ideal.length > 0) {
        return ideal[Math.floor(Math.random() * ideal.length)].trim();
    }

    const good = paragraphs.filter(p => {
        const len = p.trim().length;
        return len >= 80 && len <= 450;
    });
    if (good.length > 0) {
        return good[Math.floor(Math.random() * good.length)].trim();
    }

    for (const p of paragraphs) {
        const trimmed = p.trim();
        if (trimmed.length >= 60) {
            if (trimmed.length <= 450) return trimmed;
            const cut = trimmed.substring(0, 450);
            const lastSentence = Math.max(
                cut.lastIndexOf('. '), cut.lastIndexOf('.\n'),
                cut.lastIndexOf('! '), cut.lastIndexOf('? '),
                cut.lastIndexOf('…')
            );
            if (lastSentence > 150) return cut.substring(0, lastSentence + 1);
            const lastSpace = cut.lastIndexOf(' ');
            if (lastSpace > 250) return cut.substring(0, lastSpace) + '…';
            return cut + '…';
        }
    }
    return null;
}

async function fetchTextFromPage(ws, title, depth = 0) {
    if (depth > 4) return null;
    if (!isGoodTitle(title)) return null;

    console.log(`${'    '.repeat(depth + 1)}Parsing: ${title} (depth ${depth})`);
    const parsed = await parsePage(ws, title);
    if (!parsed?.text?.['*']) return null;

    const html = parsed.text['*'];
    const links = parsed.links || [];

    const basePage = title.split('/')[0];
    const subPageLinks = links.filter(l => {
        const t = l['*'] || '';
        return t.startsWith(basePage + '/') && l.ns === 0;
    });

    if (subPageLinks.length >= 5) {
        const randomSub = subPageLinks[Math.floor(Math.random() * subPageLinks.length)];
        console.log(`${'    '.repeat(depth + 1)}↳ Sommaire détecté (${subPageLinks.length} sous-pages), suit: ${randomSub['*']}`);
        return await fetchTextFromPage(ws, randomSub['*'], depth + 1);
    }

    const { isIndex, subLink } = detectIndexAndSubLink(parsed);
    if (isIndex && subLink) {
        console.log(`${'    '.repeat(depth + 1)}↳ Index détecté, suit: ${subLink}`);
        return await fetchTextFromPage(ws, subLink, depth + 1);
    }

    const text = extractText(html);
    if (text.length < 100) return null;

    const quality = isContentGoodQuality(text, parsed);
    if (!quality.isGood) {
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

async function fetchQuoteFromWikisource(maxRetries = 8, forceLang = null, excludeUrls = new Set()) {
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
                if (result && excludeUrls.has(result.source)) {
                    console.log(`    ⚠️ Already posted: ${result.source}, skipping`);
                    continue;
                }
                if (result) return result;
            }
        } catch (err) {
            console.log(`    ✗ Error: ${err.message}`);
        }
    }
    return null;
}

// ─── X API v2 — OAuth 1.0a ───

/**
 * Encode une chaîne selon RFC 3986 (percent-encoding).
 * Requis par la spécification OAuth 1.0a.
 */
function percentEncode(str) {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/\*/g, '%2A')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29');
}

/**
 * Génère un nonce aléatoire pour OAuth.
 */
function generateNonce() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Construit la signature OAuth 1.0a HMAC-SHA1.
 * @param {string} method - HTTP method (POST)
 * @param {string} url - Full URL (without query params)
 * @param {Object} params - All OAuth + request params combined
 * @param {string} consumerSecret - API Secret
 * @param {string} tokenSecret - Access Token Secret
 * @returns {string} Base64-encoded signature
 */
function buildOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
    // 1. Sort params alphabetically by key
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
        .map(k => `${percentEncode(k)}=${percentEncode(params[k])}`)
        .join('&');

    // 2. Build signature base string
    const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;

    // 3. Build signing key
    const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

    // 4. HMAC-SHA1
    const hmac = crypto.createHmac('sha1', signingKey);
    hmac.update(baseString);
    return hmac.digest('base64');
}

/**
 * Construit le header Authorization OAuth 1.0a.
 * @param {string} method - HTTP method
 * @param {string} url - Full URL
 * @param {Object} bodyParams - Body params (pour POST form-encoded ; vide pour JSON body)
 * @param {Object} credentials - { apiKey, apiSecret, accessToken, accessTokenSecret }
 * @returns {string} Authorization header value
 */
function buildOAuthHeader(method, url, bodyParams, credentials) {
    const oauthParams = {
        oauth_consumer_key: credentials.apiKey,
        oauth_nonce: generateNonce(),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_token: credentials.accessToken,
        oauth_version: '1.0',
    };

    // Combiner OAuth params + body params pour la signature
    // Note : pour X API v2 avec JSON body, bodyParams est vide
    const allParams = { ...oauthParams, ...bodyParams };

    const signature = buildOAuthSignature(
        method, url, allParams,
        credentials.apiSecret, credentials.accessTokenSecret
    );

    oauthParams.oauth_signature = signature;

    // Construire le header Authorization
    const headerParts = Object.keys(oauthParams)
        .sort()
        .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
        .join(', ');

    return `OAuth ${headerParts}`;
}

/**
 * Poste un tweet via l'API X v2.
 * Endpoint : POST https://api.x.com/2/tweets
 * Body JSON : { "text": "..." }
 * Auth : OAuth 1.0a (User Context)
 */
async function postTweet(text, credentials) {
    const url = 'https://api.x.com/2/tweets';
    const method = 'POST';
    const body = JSON.stringify({ text });

    // Pour X API v2 avec JSON body, on ne passe PAS le body dans la signature
    // (seuls les form-encoded params sont inclus dans la signature base string)
    const authHeader = buildOAuthHeader(method, url, {}, credentials);

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.x.com',
            path: '/2/tweets',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'Authorization': authHeader,
                'User-Agent': 'PalimpsestBot/1.0',
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        const errorDetail = parsed.detail || parsed.title || JSON.stringify(parsed);
                        reject(new Error(`X API ${res.statusCode}: ${errorDetail}`));
                    }
                } catch (e) {
                    reject(new Error(`X API ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

/**
 * Vérifie les credentials X en récupérant les infos de l'utilisateur authentifié.
 * GET https://api.x.com/2/users/me
 */
async function verifyXCredentials(credentials) {
    const url = 'https://api.x.com/2/users/me';
    const method = 'GET';

    const authHeader = buildOAuthHeader(method, url, {}, credentials);

    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'Authorization': authHeader,
                'User-Agent': 'PalimpsestBot/1.0',
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed.data);
                    } else {
                        reject(new Error(`X verify ${res.statusCode}: ${data}`));
                    }
                } catch (e) {
                    reject(new Error(`X verify ${res.statusCode}: ${data}`));
                }
            });
        }).on('error', reject);
    });
}

// ─── Hashtags dynamiques basés sur le contenu ───

/**
 * Catégories de mots-clés pour détecter le thème du texte.
 * Hashtags courts optimisés pour X (limite 280 caractères).
 * 
 * Hashtags pertinents sur X littéraire :
 *   #BookTwitter / #BookX — communauté livres (très actif)
 *   #WritingCommunity — communauté auteurs
 *   #poetry #literature — universels, très suivis
 */
const CONTENT_TAGS = {
    // Formes
    poetry:     { hashtag: 'poetry',     keywords: ['poésie', 'poème', 'vers', 'rime', 'strophe', 'sonnet', 'ode', 'élégie', 'ballade', 'hymne', 'poem', 'verse', 'rhyme', 'lyric'] },
    novel:      { hashtag: 'novel',      keywords: ['roman', 'chapitre', 'novel', 'chapter', 'fiction', 'récit', 'histoire', 'narration'] },
    theatre:    { hashtag: 'theatre',    keywords: ['théâtre', 'scène', 'acte', 'tragédie', 'comédie', 'drame', 'theater', 'play', 'scene', 'act', 'tragedy', 'comedy'] },
    philo:      { hashtag: 'philo',      keywords: ['philosophie', 'pensée', 'réflexion', 'sagesse', 'raison', 'vérité', 'philosophy', 'wisdom', 'truth', 'reason'] },
    fable:      { hashtag: 'fable',      keywords: ['fable', 'conte', 'morale', 'il était une fois', 'tale', 'once upon', 'fairy'] },
    // Tons
    love:       { hashtag: 'love',       keywords: ['amour', 'cœur', 'âme', 'passion', 'désir', 'baiser', 'love', 'heart', 'soul', 'desire', 'kiss', 'beloved'] },
    melancholy: { hashtag: 'melancholy', keywords: ['spleen', 'mélancolie', 'tristesse', 'solitude', 'nostalgie', 'regret', 'melancholy', 'sorrow', 'loneliness'] },
    nature:     { hashtag: 'nature',     keywords: ['nature', 'fleur', 'arbre', 'mer', 'ciel', 'soleil', 'lune', 'étoile', 'flower', 'tree', 'sea', 'sky', 'sun', 'moon', 'star', 'forest', 'river'] },
    gothic:     { hashtag: 'gothic',     keywords: ['fantôme', 'spectre', 'ténèbres', 'terreur', 'nuit', 'mort', 'ombre', 'ghost', 'shadow', 'darkness', 'terror', 'death'] },
    epic:       { hashtag: 'epic',       keywords: ['héros', 'bataille', 'gloire', 'honneur', 'guerre', 'conquête', 'hero', 'battle', 'glory', 'honor', 'war', 'sword'] },
    mystic:     { hashtag: 'mystic',     keywords: ['divin', 'extase', 'sacré', 'éternel', 'lumière', 'prière', 'divine', 'sacred', 'eternal', 'prayer', 'spirit'] },
    dream:      { hashtag: 'dream',      keywords: ['rêve', 'songe', 'vision', 'sommeil', 'chimère', 'illusion', 'dream', 'vision', 'sleep', 'reverie'] },
    humor:      { hashtag: 'humor',      keywords: ['rire', 'comique', 'ironie', 'satire', 'moquerie', 'ridicule', 'laugh', 'irony', 'satire', 'wit', 'comedy'] },
};

/**
 * Hashtag communautaire Twitter (fixe, toujours inclus).
 * #BookTwitter est la communauté littéraire la plus active sur Twitter/X.
 */
const PLATFORM_TAG = '#BookTwitter';

/**
 * Analyse le texte et retourne les hashtags dynamiques courts.
 * @param {string} text - Le texte de l'extrait
 * @param {string} lang - La langue
 * @param {number} max - Nombre max de hashtags de contenu (défaut: 2)
 * @returns {string} Ex: "#poetry #love #BookTwitter"
 */
function buildDynamicHashtags(text, lang, max = 2) {
    const lower = (text || '').toLowerCase();
    const scores = {};

    for (const [cat, { keywords }] of Object.entries(CONTENT_TAGS)) {
        let score = 0;
        for (const kw of keywords) {
            if (lower.includes(kw.toLowerCase())) score++;
        }
        if (score > 0) scores[cat] = score;
    }

    const top = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, max)
        .map(([cat]) => `#${CONTENT_TAGS[cat].hashtag}`);

    if (top.length === 0) {
        top.push('#literature');
    }

    top.push(PLATFORM_TAG);
    return top.join(' ');
}

// ─── Format Post ───

/**
 * Twitter/X a une limite de 280 caractères.
 * Les URLs comptent pour 23 caractères (t.co wrapping).
 * 
 * Lien intelligent :
 *   - Si extraitId → lien direct #text/{id}
 *   - Sinon → lien #preview?t=snippet&a=auteur&s=source
 *     (l'app affiche une carte de prévisualisation avec le texte)
 * 
 * Retourne le texte complet du tweet.
 */
function formatPost(quote) {
    const maxChars = 280;
    // Twitter raccourcit toutes les URLs à 23 caractères via t.co
    const URL_LENGTH = 23;

    const lang = quote.lang || 'fr';

    // Construire le lien intelligent
    let appLink;
    if (quote.extraitId) {
        appLink = `https://palimpseste.vercel.app/#text/${quote.extraitId}`;
    } else {
        const snippet = (quote.text || '').substring(0, 80).trim();
        const params = new URLSearchParams({
            t: snippet,
            a: quote.author || 'Anonyme',
        });
        if (quote.source) params.set('s', quote.source);
        appLink = `https://palimpseste.vercel.app/#preview?${params.toString()}`;
    }

    const hashtags = buildDynamicHashtags(quote.text, lang, 2);

    // Calculer la taille du suffixe (avec URL comptant 23 chars)
    const hashtagLine = `\n${hashtags}`;
    const suffixTemplate = `\n\n— ${quote.author}\n${appLink}${hashtagLine}`;
    // Taille réelle : remplacer l'URL par 23 chars
    const suffixLength = suffixTemplate.length - appLink.length + URL_LENGTH;

    let text = quote.text;
    const available = maxChars - suffixLength - 1;

    if (text.length > available) {
        text = text.substring(0, available);
        const lastSpace = text.lastIndexOf(' ');
        if (lastSpace > text.length * 0.6) {
            text = text.substring(0, lastSpace);
        }
        text += '…';
    }

    return `${text}\n\n— ${quote.author}\n${appLink}${hashtagLine}`;
}

// ─── Main ───

async function main() {
    const apiKey = process.env.X_API_KEY;
    const apiSecret = process.env.X_API_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN;
    const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;
    const langArg = process.argv.find(a => a.startsWith('--lang='));
    const forceLang = langArg ? langArg.split('=')[1] : null;

    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
        console.error('❌ Missing X credentials in environment variables');
        console.error('   Required: X_API_KEY, X_API_SECRET,');
        console.error('             X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET');
        console.error('');
        console.error('   Setup guide:');
        console.error('   1. Go to https://developer.x.com/en/portal/dashboard');
        console.error('   2. Create a Project + App (Free tier: 1,500 tweets/month)');
        console.error('   3. In App Settings > Keys and tokens:');
        console.error('      - Generate API Key & Secret (Consumer Keys)');
        console.error('      - Generate Access Token & Secret (with Read+Write)');
        console.error('   4. Set them as GitHub Actions secrets');
        process.exit(1);
    }

    const credentials = { apiKey, apiSecret, accessToken, accessTokenSecret };

    let quote = null;

    // 0) Charger l'historique des posts du bot pour éviter les doublons
    console.log('📋 Loading bot post history…');
    const excludeUrls = await fetchRecentBotPosts();

    // 1) Essayer d'abord les tendances Supabase (contenu curé par les utilisateurs)
    console.log(`🔥 Fetching trending quote from Supabase${forceLang ? ` (lang: ${forceLang})` : ''}…`);
    quote = await fetchTrendingQuote(forceLang, excludeUrls);

    if (quote) {
        console.log(`   ✅ Got trending quote by ${quote.author} (${quote.lang})`);
    } else {
        // 2) Fallback: Wikisource live
        console.log(`\n🔍 Fallback: fetching from Wikisource${forceLang ? ` (lang: ${forceLang})` : ''}…\n`);
        quote = await fetchQuoteFromWikisource(8, forceLang, excludeUrls);
    }

    if (!quote) {
        console.error('❌ Could not find a suitable quote from trending or Wikisource');
        process.exit(1);
    }

    // 3) Sauvegarder dans Supabase (pour le lien ET pour le tracking anti-doublon)
    if (!quote.extraitId) {
        console.log('\n💾 Saving Wikisource extract to Supabase…');
        const savedId = await saveExtraitToSupabase(quote);
        if (savedId) {
            quote.extraitId = savedId;
            console.log(`   ✅ Extract saved, link will use #text/${savedId}`);
        } else {
            console.log('   ⚠️ Could not save, link will use #preview fallback');
        }
    } else {
        // Trending quote : sauvegarder aussi pour le tracking (éviter repost)
        console.log('\n💾 Saving trending extract reference for dedup tracking…');
        await saveExtraitToSupabase(quote);
    }

    const post = formatPost(quote);

    // Calculer la taille réelle (URLs → 23 chars chacune)
    const urlRegex = /https?:\/\/[^\s]+/g;
    let displayLength = post.length;
    let match;
    while ((match = urlRegex.exec(post)) !== null) {
        displayLength = displayLength - match[0].length + 23;
    }

    console.log(`\n📝 Posting to X (${displayLength}/280 chars, lang: ${quote.lang}, source: ${quote.fromTrending ? 'TRENDING' : 'WIKISOURCE'}):\n${post}\n`);
    console.log(`📖 Source: ${quote.source}\n`);

    try {
        console.log('🔐 Verifying X credentials…');
        const user = await verifyXCredentials(credentials);
        console.log(`   Logged in as @${user.username} (${user.name})`);

        const result = await postTweet(post, credentials);
        const tweetId = result?.data?.id;
        console.log(`✅ Posted to X!`);
        if (tweetId) {
            console.log(`   https://x.com/${user.username}/status/${tweetId}`);
        }
    } catch (err) {
        console.error(`❌ Failed to post: ${err.message}`);
        process.exit(1);
    }
}

main();
