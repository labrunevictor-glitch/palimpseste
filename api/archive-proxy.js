export default async function handler(req, res) {
    try {
        const { url } = req.query || {};
        if (!url || typeof url !== 'string') {
            res.status(400).send('Missing url');
            return;
        }

        let parsed;
        try {
            parsed = new URL(url);
        } catch (e) {
            res.status(400).send('Invalid url');
            return;
        }

        const hostname = parsed.hostname.toLowerCase();
        const allowed = hostname === 'archive.org' || hostname.endsWith('.archive.org');
        if (!allowed) {
            res.status(403).send('Forbidden');
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const upstream = await fetch(url, {
            redirect: 'follow',
            cache: 'no-store',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                'Accept': 'text/plain, application/json, */*',
                'Referer': 'https://archive.org/'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!upstream.ok) {
            res.status(upstream.status).send(await upstream.text());
            return;
        }

        const contentType = upstream.headers.get('content-type') || 'text/plain; charset=utf-8';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-store');

        const body = await upstream.arrayBuffer();
        res.status(200).send(Buffer.from(body));
    } catch (err) {
        res.status(502).send('Archive proxy error');
    }
}
