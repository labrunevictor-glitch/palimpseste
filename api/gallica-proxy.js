const gallicaCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
const COOLDOWN_MS = 1000 * 60; // 1 minute
let gallicaCooldownUntil = 0;

function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        setCors(res);
        res.status(204).end();
        return;
    }

    try {
        const { url } = req.query || {};
        if (!url || typeof url !== 'string') {
            console.error('Gallica proxy: Missing url parameter');
            res.status(400).send('Missing url');
            return;
        }

        let parsed;
        try {
            parsed = new URL(url);
        } catch (e) {
            console.error('Gallica proxy: Invalid URL:', url);
            res.status(400).send('Invalid url');
            return;
        }

        const hostname = parsed.hostname.toLowerCase();
        if (hostname !== 'gallica.bnf.fr' && !hostname.endsWith('.gallica.bnf.fr')) {
            console.error('Gallica proxy: Forbidden domain:', hostname);
            res.status(403).send(`Forbidden: ${hostname} not in whitelist`);
            return;
        }

        if (Date.now() < gallicaCooldownUntil) {
            setCors(res);
            res.setHeader('Retry-After', Math.ceil((gallicaCooldownUntil - Date.now()) / 1000));
            res.status(429).send('Gallica rate limit cooldown');
            return;
        }

        const cacheKey = url;
        const cached = gallicaCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            setCors(res);
            res.setHeader('Content-Type', cached.contentType);
            res.setHeader('Cache-Control', 'public, max-age=600');
            res.status(200).send(Buffer.from(cached.body));
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const upstream = await fetch(url, {
            redirect: 'follow',
            cache: 'no-store',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                'Accept': 'text/plain, application/json, text/html, text/xml, application/xml, */*',
                'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!upstream.ok) {
            const errorText = await upstream.text().catch(() => 'Unknown error');
            if (upstream.status === 429 || upstream.status === 503) {
                gallicaCooldownUntil = Date.now() + COOLDOWN_MS;
            }
            setCors(res);
            res.status(upstream.status).send(errorText);
            return;
        }

        const contentType = upstream.headers.get('content-type') || 'text/plain; charset=utf-8';
        const body = await upstream.arrayBuffer();

        gallicaCache.set(cacheKey, {
            timestamp: Date.now(),
            contentType,
            body: Buffer.from(body)
        });

        setCors(res);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=600');
        res.status(200).send(Buffer.from(body));
    } catch (err) {
        console.error('Gallica proxy: Error:', err.message);
        setCors(res);
        res.status(502).send('Gallica proxy error: ' + err.message);
    }
}
