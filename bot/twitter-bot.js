/**
 * Bot Twitter/X — Palimpseste
 * 
 * Poste automatiquement des extraits littéraires depuis la banque de citations.
 * Exécuté via GitHub Actions (2x/jour).
 * 
 * Nécessite les variables d'environnement :
 *   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
 */

const crypto = require('crypto');
const https = require('https');
const quotes = require('./quotes.json');

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
    // Utilise la date + heure comme seed pour ne pas répéter
    const today = new Date();
    const dayIndex = today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate();
    const hourSlot = today.getUTCHours() < 12 ? 0 : 1; // 2 posts/jour
    const index = (dayIndex * 2 + hourSlot) % quotes.length;
    return quotes[index];
}

function formatTweet(quote) {
    const maxLen = 280;
    const link = `\nhttps://palimpseste.vercel.app/#/author/${encodeURIComponent(quote.author)}`;
    const hashtags = quote.hashtags ? `\n${quote.hashtags}` : '\n#littérature #palimpseste';
    const suffix = `\n\n— ${quote.author}${link}${hashtags}`;
    
    // Tronquer la citation si besoin
    let text = quote.text;
    const available = maxLen - suffix.length - 3; // 3 pour "..."
    if (text.length > available) {
        text = text.substring(0, available).replace(/\s+\S*$/, '') + '…';
    }
    
    return `${text}\n\n— ${quote.author}${link}${hashtags}`;
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

    const quote = pickQuote();
    const tweet = formatTweet(quote);

    console.log(`📝 Posting tweet (${tweet.length} chars):\n${tweet}\n`);

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
