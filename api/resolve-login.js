/**
 * Vercel Serverless Function
 * Resolves a login identifier (email or username) into an email.
 *
 * Required env vars on Vercel:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

function json(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(body));
}

function normalizeIdentifier(value) {
    return String(value || '').trim();
}

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return json(res, 405, { error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return json(res, 500, { error: 'Server not configured' });
    }

    const identifier = normalizeIdentifier(req.query?.identifier);
    if (!identifier) {
        return json(res, 400, { error: 'Missing identifier' });
    }

    // Email passes through.
    if (identifier.includes('@')) {
        return json(res, 200, { email: identifier.toLowerCase() });
    }

    const usernameLower = identifier.toLowerCase();

    try {
        const url = new URL(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/auth_lookup`);
        url.searchParams.set('select', 'email');
        url.searchParams.set('username_lower', `eq.${usernameLower}`);
        url.searchParams.set('limit', '1');

        const resp = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
                Accept: 'application/json'
            }
        });

        if (!resp.ok) {
            const text = await resp.text();
            return json(res, 502, { error: 'Supabase lookup failed', details: text });
        }

        const rows = await resp.json();
        const email = rows?.[0]?.email;
        if (!email) {
            return json(res, 404, { error: 'Username not found' });
        }

        return json(res, 200, { email });
    } catch (e) {
        return json(res, 500, { error: 'Unexpected error', details: String(e?.message || e) });
    }
};
