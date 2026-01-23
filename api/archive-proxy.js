export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).end();
        return;
    }

    try {
        const { url } = req.query || {};
        if (!url || typeof url !== 'string') {
            console.error('Archive proxy: Missing url parameter');
            res.status(400).send('Missing url');
            return;
        }

        console.log('Archive proxy: Fetching:', url.substring(0, 100));

        let parsed;
        try {
            parsed = new URL(url);
        } catch (e) {
            console.error('Archive proxy: Invalid URL:', url);
            res.status(400).send('Invalid url');
            return;
        }

        const hostname = parsed.hostname.toLowerCase();
        
        // Liste blanche des domaines autorisés (sources littéraires)
        const allowedDomains = [
            'archive.org',
            'openlibrary.org',
            'gallica.bnf.fr',
            'sacred-texts.com',
            'www.sacred-texts.com',
            'perseus.tufts.edu',
            'www.perseus.tufts.edu'
        ];
        
        const allowed = allowedDomains.some(domain => 
            hostname === domain || hostname.endsWith('.' + domain)
        );
        
        if (!allowed) {
            console.error('Archive proxy: Forbidden domain:', hostname);
            res.status(403).send(`Forbidden: ${hostname} not in whitelist`);
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        console.log('Archive proxy: Making request to:', hostname);
        
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

        console.log('Archive proxy: Response status:', upstream.status);

        if (!upstream.ok) {
            const errorText = await upstream.text().catch(() => 'Unknown error');
            console.error('Archive proxy: Upstream error:', upstream.status, errorText.substring(0, 200));
            res.status(upstream.status).send(errorText);
            return;
        }

        const contentType = upstream.headers.get('content-type') || 'text/plain; charset=utf-8';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-store');

        const body = await upstream.arrayBuffer();
        console.log('Archive proxy: Success, body size:', body.byteLength);
        res.status(200).send(Buffer.from(body));
    } catch (err) {
        console.error('Archive proxy: Error:', err.message);
        res.status(502).send('Archive proxy error: ' + err.message);
    }
}
