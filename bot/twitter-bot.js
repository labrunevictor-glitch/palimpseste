/**
 * Bot Twitter/X — Palimpseste
 * 
 * Poste automatiquement des extraits littéraires récupérés en live depuis Wikisource.
 * Exécuté via GitHub Actions (2x/jour).
 * 
 * Nécessite les variables d'environnement :
 *   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
 */

const crypto = require('crypto');
const https = require('https');

// ─── Wikisource Config ───

const WIKISOURCES = [
    { lang: 'fr', url: 'https://fr.wikisource.org', terms: ['Poésie', 'Roman', 'Conte', 'Théâtre', 'Philosophie', 'Lettres', 'Fable'] },
    { lang: 'en', url: 'https://en.wikisource.org', terms: ['Poetry', 'Novel', 'Tale', 'Play', 'Philosophy'] },
    { lang: 'de', url: 'https://de.wikisource.org', terms: ['Gedicht', 'Roman', 'Märchen', 'Theater'] },
    { lang: 'it', url: 'https://it.wikisource.org', terms: ['Poesia', 'Romanzo', 'Favola', 'Teatro'] },
    { lang: 'es', url: 'https://es.wikisource.org', terms: ['Poesía', 'Novela', 'Cuento', 'Teatro'] },
    { lang: 'la', url: 'https://la.wikisource.org', terms: ['carmen', 'ode', 'epistula', 'fabula'] },
];

// Pondération : français plus souvent
const LANG_WEIGHTS = { fr: 5, en: 2, de: 1, it: 1, es: 1, la: 1 };

// ─── HTTP Helper ───

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

// ─── Wikisource Fetching ───

function pickWeightedLang() {
    const pool = [];
    for (const ws of WIKISOURCES) {
        const w = LANG_WEIGHTS[ws.lang] || 1;
        for (let i = 0; i < w; i++) pool.push(ws);
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

async function searchWikisource(ws) {
    const term = ws.terms[Math.floor(Math.random() * ws.terms.length)];
    const offset = Math.floor(Math.random() * 50);
    const url = `${ws.url}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&srlimit=10&sroffset=${offset}&srnamespace=0&format=json&origin=*`;
    const data = await httpGet(url);
    return data?.query?.search || [];
}

async function getRandomPages(ws) {
    const url = `${ws.url}/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=5&format=json&origin=*`;
    const data = await httpGet(url);
    return data?.query?.random || [];
}

async function parsePage(ws, title) {
    const url = `${ws.url}/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text|displaytitle|links&format=json&origin=*&redirects=true`;
    const data = await httpGet(url);
    return data?.parse || null;
}

function extractText(html) {
    if (!html) return '';

    // ── Phase 1 : cibler le contenu principal (comme l'app) ──
    // Extraire .prp-pages-output ou .poem en priorité, sinon .mw-parser-output
    let content = html;
    const prpMatch = html.match(/<div[^>]*class="[^"]*prp-pages-output[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div|$)/i);
    const poemMatch = html.match(/<div[^>]*class="[^"]*poem[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const mwMatch = html.match(/<div[^>]*class="[^"]*mw-parser-output[^"]*"[^>]*>([\s\S]*)/i);
    if (prpMatch) content = prpMatch[1];
    else if (poemMatch) content = poemMatch[1];
    else if (mwMatch) content = mwMatch[1];

    // ── Phase 2 : supprimer les blocs non-contenu (élargi comme l'app) ──
    let text = content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        // Références, notes de bas de page
        .replace(/<(sup|sub)[^>]*>[\s\S]*?<\/\1>/gi, '')
        .replace(/<span[^>]*class="[^"]*reference[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
        // Éléments MediaWiki non-contenu (liste étendue depuis l'app)
        .replace(/<(div|table|ul|section|nav|aside|span)[^>]*class="[^"]*(?:ws-noexport|noprint|navbox|infobox|metadata|hatnote|ambox|toc|catlinks|mw-editsection|headertemplate|ws-header|header|homonymie|bandeau-homonymie|bandeau-portail|titreoeuvre|auteur-oeuvre|redirectMsg|mw-headline|mw-page-title)[^"]*"[^>]*>[\s\S]*?<\/\1>/gi, '')
        // Spans MediaWiki parasites (page-title, mw-*, ws-*)
        .replace(/<span[^>]*class="[^"]*(?:page-title|mw-page-title|mw-[a-z]+|ws-[a-z]+)[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
        // Toutes les balises HTML restantes
        .replace(/<[^>]+>/g, '')
        // Entités HTML
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#\d+;/g, '')
        .replace(/&[a-z]+;/g, '')
        // Résidus MediaWiki
        .replace(/\[modifier[^\]]*\]/g, '')
        .replace(/\[\d+\]/g, '')
        .replace(/modifier le wikicode/gi, '')
        .replace(/mw-page-title[^\s]*/gi, '')
        // Titres de recueils parasites
        .replace(/Poésies \([^)]+\)/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    // ── Phase 3 : supprimer les en-têtes métadonnées (élargi comme l'app) ──
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

    // 1. Chercher les liens "Auteur:XXX" / "Author:XXX" / "Autor:XXX" / "Autore:XXX"
    const links = parsed.links || [];
    for (const link of links) {
        const t = link['*'] || '';
        const match = t.match(/^(?:Auteur|Author|Autor|Autore):(.+)/);
        if (match) return match[1].replace(/_/g, ' ').trim();
    }

    // 2. Chercher les classes CSS d'auteur dans le HTML brut
    const html = parsed.text?.['*'] || '';
    const classMatch = html.match(/<[^>]*class="[^"]*(?:ws-author|author|auteur|auteur-oeuvre)[^"]*"[^>]*>([^<]+)</i);
    if (classMatch) {
        const authorText = classMatch[1].trim();
        if (authorText.length > 2 && authorText.length < 50) return authorText;
    }

    // 3. Chercher les liens href contenant "Auteur:" dans le HTML brut
    const hrefMatch = html.match(/href="[^"]*(?:Auteur|Author|Autor|Autore):([^"&?#]+)"/i);
    if (hrefMatch) {
        return decodeURIComponent(hrefMatch[1]).replace(/_/g, ' ').trim();
    }

    // 4. Chercher le pattern "par XXX" ou "de XXX" dans le texte initial
    const rawText = html.replace(/<[^>]+>/g, ' ').substring(0, 500);
    const parMatch = rawText.match(/(?:^|\n)\s*(?:par|de|by)\s+([A-ZÀ-Ü][a-zà-ü]+(?:\s+(?:de\s+)?[A-ZÀ-Ü][a-zà-ü\-]+){0,3})\s*(?:\n|$)/m);
    if (parMatch && parMatch[1].length > 3 && parMatch[1].length < 40) {
        return parMatch[1].trim();
    }

    // 5. Fallback : titre de la page (souvent "Œuvre/Auteur" ou "Auteur/Œuvre")
    const title = parsed.displaytitle || parsed.title || '';
    const cleanTitle = title.replace(/<[^>]+>/g, '');
    const slashParts = cleanTitle.split('/');
    if (slashParts.length >= 2) return slashParts[0].trim();

    return null;
}

function isGoodTitle(title) {
    if (!title || title.length < 3 || title.length > 200) return false;
    const t = title.toLowerCase();

    // Namespaces spéciaux (multilingue, étendu comme l'app)
    if (/^(catégor|category|kategorie|categoria)/i.test(t)) return false;
    if (/^(help|aide|hilfe|aiuto|ayuda|ajuda|manual|project|projet|image|file|fichier|template|modèle|module|media|special|spécial):/i.test(t)) return false;
    if (/^(auteur|author|autor|autore):/i.test(t)) return false;
    if (/^(discussion|talk|diskussion|discussione):/i.test(t)) return false;
    if (/^(index|page|file|portail|portal|wiki):/i.test(t)) return false;

    // Listes et sommaires
    if (/^list[ea]?\s+(de|of|di|von)/i.test(t)) return false;
    if (t.startsWith('index ') || t.endsWith(' index')) return false;
    if (t.includes('table des matières') || t.includes('table of contents') || t.includes('inhaltsverzeichnis')) return false;
    if (t.includes('bibliographie') || t.includes('bibliography')) return false;

    // Biographies et études critiques (pas du contenu littéraire)
    if (t.includes('sa vie et son œuvre') || t.includes('sa vie et son oeuvre')) return false;
    if (t.includes('his life and work') || t.includes('sein leben')) return false;
    if (t.includes('étude biographique') || t.includes('étude sur')) return false;
    if (t.includes('biographical study') || t.includes('biography of')) return false;
    if (/\bbiograph/i.test(t) && !t.includes('/')) return false;

    // Œuvres complètes sans sous-page = sommaires
    if ((t.includes('œuvres complètes') || t.includes('complete works') ||
        t.includes('gesammelte werke') || t.includes('opere complete')) && !t.includes('/')) return false;

    // Fins de titre parasites
    if (/(sommaire|contents|table des matières)$/i.test(t)) return false;

    return true;
}

// ── Analyse qualité (porté depuis l'app: analyzeContentQuality) ──
function isContentGoodQuality(text, parsed) {
    if (!text || text.length < 100) return false;

    // Trop court pour un vrai texte littéraire
    if (text.length < 200) return false;

    // Détecter les redirections
    const html = parsed?.text?.['*'] || '';
    if (html.includes('redirectMsg') || html.includes('propose plusieurs éditions') ||
        html.includes('Cette page répertorie')) return false;

    // Densité de liens : si >25% c'est un sommaire/hub
    const links = parsed?.links || [];
    const linkCharsEstimate = links.length * 30;
    if (text.length > 0 && linkCharsEstimate / text.length > 0.25) return false;

    // Structure paragraphe vs liste
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) return false;
    const avgLineLength = text.length / lines.length;

    if (avgLineLength < 60) {
        // Exception poésie : lignes courtes mais ponctuation finale
        const withPunct = lines.filter(l => /[.!?…:;]$/.test(l.trim())).length;
        const punctRatio = withPunct / lines.length;
        // Si < 30% de ponctuation finale → liste brute
        if (punctRatio < 0.3) return false;
    }

    return true;
}

function extractBestQuote(text) {
    if (!text || text.length < 80) return null;

    // Chercher des blocs (strophes, paragraphes) séparés par des lignes vides
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 20);
    if (paragraphs.length === 0) return null;

    // Priorité 1 : paragraphes de taille idéale (100-450 chars) — meilleure qualité tweet
    const ideal = paragraphs.filter(p => {
        const len = p.trim().length;
        return len >= 100 && len <= 450;
    });
    if (ideal.length > 0) {
        return ideal[Math.floor(Math.random() * ideal.length)].trim();
    }

    // Priorité 2 : paragraphes acceptables (80-500 chars)
    const good = paragraphs.filter(p => {
        const len = p.trim().length;
        return len >= 80 && len <= 500;
    });
    if (good.length > 0) {
        return good[Math.floor(Math.random() * good.length)].trim();
    }

    // Priorité 3 : couper un paragraphe long à une limite de phrase
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
            // Couper au dernier espace pour ne pas couper un mot
            const lastSpace = cut.lastIndexOf(' ');
            if (lastSpace > 300) return cut.substring(0, lastSpace) + '…';
            return cut + '…';
        }
    }
    return null;
}

async function fetchQuoteFromWikisource(maxRetries = 8) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const ws = pickWeightedLang();
            console.log(`  Tentative ${attempt + 1}: ${ws.lang}.wikisource.org`);

            // 50/50 : random ou search
            const pages = Math.random() < 0.5
                ? await getRandomPages(ws)
                : await searchWikisource(ws);

            if (!pages.length) continue;

            // Mélanger et tester plusieurs pages
            const shuffled = pages.sort(() => Math.random() - 0.5);

            for (const page of shuffled) {
                const title = page.title;
                if (!isGoodTitle(title)) continue;

                console.log(`    Parsing: ${title}`);
                const parsed = await parsePage(ws, title);
                if (!parsed?.text?.['*']) continue;

                const text = extractText(parsed.text['*']);
                if (text.length < 100) continue;

                // Analyse qualité (densité liens, structure, redirections)
                if (!isContentGoodQuality(text, parsed)) continue;

                const quote = extractBestQuote(text);
                if (!quote) continue;

                const author = detectAuthor(parsed);
                const cleanTitle = (parsed.displaytitle || title).replace(/<[^>]+>/g, '');

                console.log(`    ✓ Found: "${quote.substring(0, 60)}…" by ${author || 'Unknown'}`);

                return {
                    text: quote,
                    author: author || cleanTitle,
                    title: cleanTitle,
                    lang: ws.lang,
                    source: `${ws.url}/wiki/${encodeURIComponent(title)}`
                };
            }
        } catch (err) {
            console.log(`    ✗ Error: ${err.message}`);
        }
    }
    return null;
}

// ─── Twitter OAuth 1.0a ───

function percentEncode(str) {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/\*/g, '%2A')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29');
}

function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys.map(k => `${percentEncode(k)}=${percentEncode(params[k])}`).join('&');
    const baseString = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`;
    const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
    return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
}

function buildOAuthHeader(method, url, apiKey, apiSecret, accessToken, accessSecret, extraParams = {}) {
    const oauthParams = {
        oauth_consumer_key: apiKey,
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_token: accessToken,
        oauth_version: '1.0'
    };

    const allParams = { ...oauthParams, ...extraParams };
    const signature = generateOAuthSignature(method, url, allParams, apiSecret, accessSecret);
    oauthParams.oauth_signature = signature;

    const headerParts = Object.keys(oauthParams).sort()
        .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
        .join(', ');
    return `OAuth ${headerParts}`;
}

// ─── Post tweet via X API v2 ───

function postTweet(text, apiKey, apiSecret, accessToken, accessSecret) {
    return new Promise((resolve, reject) => {
        const url = 'https://api.twitter.com/2/tweets';
        const body = JSON.stringify({ text });
        const authHeader = buildOAuthHeader('POST', url, apiKey, apiSecret, accessToken, accessSecret);

        const options = {
            hostname: 'api.twitter.com',
            path: '/2/tweets',
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 201) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Twitter API ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// ─── Pick a quote ───

function pickQuote() {
    // Not used anymore — replaced by fetchQuoteFromWikisource()
}

function formatTweet(quote) {
    const maxLen = 280;
    const authorLink = `\nhttps://palimpseste.vercel.app/#/author/${encodeURIComponent(quote.author)}`;
    const hashtag = '\n#littérature #palimpseste';
    const suffix = `\n\n— ${quote.author}${authorLink}${hashtag}`;
    
    // Tronquer la citation si besoin
    let text = quote.text;
    const available = maxLen - suffix.length - 3;
    if (text.length > available) {
        text = text.substring(0, available).replace(/\s+\S*$/, '') + '…';
    }
    
    return `${text}\n\n— ${quote.author}${authorLink}${hashtag}`;
}

// ─── Main ───

async function main() {
    const apiKey = process.env.X_API_KEY;
    const apiSecret = process.env.X_API_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN;
    const accessSecret = process.env.X_ACCESS_TOKEN_SECRET;

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
        console.error('❌ Missing X/Twitter API credentials in environment variables');
        console.error('   Required: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET');
        process.exit(1);
    }

    console.log('🔍 Fetching quote from Wikisource…\n');
    const quote = await fetchQuoteFromWikisource();

    if (!quote) {
        console.error('❌ Could not find a suitable quote after multiple attempts');
        process.exit(1);
    }

    const tweet = formatTweet(quote);

    console.log(`\n📝 Posting tweet (${tweet.length} chars):\n${tweet}\n`);
    console.log(`📖 Source: ${quote.source}\n`);

    try {
        const result = await postTweet(tweet, apiKey, apiSecret, accessToken, accessSecret);
        console.log(`✅ Tweet posted! ID: ${result.data.id}`);
        console.log(`   https://x.com/i/status/${result.data.id}`);
    } catch (err) {
        console.error(`❌ Failed to post tweet: ${err.message}`);
        process.exit(1);
    }
}

main();
