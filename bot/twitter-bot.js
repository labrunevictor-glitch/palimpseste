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
    // Supprimer les balises non-contenu
    let text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<(sup|sub|span class="reference")[^>]*>[\s\S]*?<\/\1>/gi, '')
        .replace(/<(table|div class="(ws-noexport|noprint|navbox|infobox|metadata|hatnote|ambox|toc|catlinks|mw-editsection|headertemplate|ws-header)")[\s\S]*?<\/\1>/gi, '')
        .replace(/<[^>]+>/g, '')         // Toutes les balises HTML
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#\d+;/g, '')
        .replace(/&[a-z]+;/g, '')
        .replace(/\[modifier[^\]]*\]/g, '')
        .replace(/\[\d+\]/g, '')
        .replace(/modifier le wikicode/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    // Supprimer les lignes d'en-tête (métadonnées)
    const lines = text.split('\n');
    let start = 0;
    const metaPatterns = /^(sommaire|table des matières|contents|édition|texte établi|navigation|catégorie|category|source|auteur|author|titre|title|index|pages|voir aussi|see also|modifier)/i;
    for (let i = 0; i < Math.min(15, lines.length); i++) {
        if (metaPatterns.test(lines[i].trim()) || lines[i].trim().length === 0) {
            start = i + 1;
        } else {
            break;
        }
    }
    text = lines.slice(start).join('\n').trim();

    return text;
}

function detectAuthor(parsed) {
    if (!parsed) return null;
    // Chercher dans les liens de la page
    const links = parsed.links || [];
    for (const link of links) {
        const t = link['*'] || '';
        const match = t.match(/^(?:Auteur:|Author:)(.+)/);
        if (match) return match[1].trim();
    }
    // Chercher dans le titre de la page (souvent "Œuvre/Auteur" ou "Auteur/Œuvre")
    const title = parsed.displaytitle || parsed.title || '';
    const cleanTitle = title.replace(/<[^>]+>/g, '');
    const slashParts = cleanTitle.split('/');
    if (slashParts.length >= 2) return slashParts[0].trim();
    return null;
}

function isGoodTitle(title) {
    const bad = /^(catégor|category|auteur:|author:|index:|page:|discussion|talk:|aide:|help:|modèle:|template:|portail|portal|wiki)/i;
    const badEnd = /(sommaire|contents|table des matières|index|œuvres complètes)$/i;
    return !bad.test(title) && !badEnd.test(title) && title.length > 3 && title.length < 200;
}

function extractBestQuote(text) {
    if (!text || text.length < 50) return null;

    // Chercher des strophes de poésie (blocs séparés par des lignes vides)
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 20);
    if (paragraphs.length === 0) return null;

    // Chercher un paragraphe de bonne taille (80-500 chars)
    const good = paragraphs.filter(p => p.trim().length >= 80 && p.trim().length <= 500);
    if (good.length > 0) {
        return good[Math.floor(Math.random() * good.length)].trim();
    }

    // Sinon, prendre le premier paragraphe assez long et couper
    for (const p of paragraphs) {
        const trimmed = p.trim();
        if (trimmed.length >= 50) {
            if (trimmed.length <= 500) return trimmed;
            // Couper à la dernière phrase avant 500 chars
            const cut = trimmed.substring(0, 500);
            const lastSentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
            if (lastSentence > 200) return cut.substring(0, lastSentence + 1);
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
