/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🧭 ROUTER.JS - Palimpseste
 * Système de routage hash minimal pour SPA
 * Permet les URLs partageables, le bouton retour, et les bookmarks
 * ═══════════════════════════════════════════════════════════════════════════
 */

const Router = (() => {
    // Définition des routes
    const routes = {};
    let currentRoute = null;
    let previousRoute = null;

    /**
     * Enregistre une route
     * @param {string} pattern - Pattern de route (ex: 'profile/:id', 'collection/:id')
     * @param {Function} handler - Fonction appelée quand la route match
     */
    function on(pattern, handler) {
        routes[pattern] = handler;
    }

    /**
     * Parse le hash actuel et retourne la route + params
     * @returns {{ route: string, params: Object, query: Object }}
     */
    function parseHash() {
        const hash = window.location.hash.slice(1) || '/';
        const [pathPart, queryPart] = hash.split('?');
        const segments = pathPart.split('/').filter(Boolean);

        // Parse query string
        const query = {};
        if (queryPart) {
            queryPart.split('&').forEach(pair => {
                const [key, val] = pair.split('=');
                if (key) query[decodeURIComponent(key)] = decodeURIComponent(val || '');
            });
        }

        return { path: pathPart, segments, query };
    }

    /**
     * Match une route contre un pattern
     * @param {string[]} segments - Segments de l'URL
     * @param {string} pattern - Pattern à matcher
     * @returns {Object|null} Paramètres extraits ou null
     */
    function matchRoute(segments, pattern) {
        const patternSegments = pattern.split('/').filter(Boolean);
        
        // Wildcard pattern '/' matches empty segments
        if (pattern === '/' && segments.length === 0) return {};
        
        if (patternSegments.length !== segments.length) return null;

        const params = {};
        for (let i = 0; i < patternSegments.length; i++) {
            if (patternSegments[i].startsWith(':')) {
                params[patternSegments[i].slice(1)] = decodeURIComponent(segments[i]);
            } else if (patternSegments[i] !== segments[i]) {
                return null;
            }
        }
        return params;
    }

    /**
     * Résout et exécute la route correspondante au hash actuel
     */
    function resolve() {
        const { segments, query } = parseHash();

        for (const [pattern, handler] of Object.entries(routes)) {
            const params = matchRoute(segments, pattern);
            if (params !== null) {
                previousRoute = currentRoute;
                currentRoute = { pattern, params, query };
                handler(params, query);
                // Mettre à jour les meta tags dynamiquement
                updateMetaForRoute(pattern, params);
                return;
            }
        }

        // Route par défaut: page d'accueil
        if (routes['/']) {
            previousRoute = currentRoute;
            currentRoute = { pattern: '/', params: {}, query };
            routes['/'](query);
            updateMetaForRoute('/', {});
        }
    }

    /**
     * Navigue vers une route
     * @param {string} hash - Le hash de destination (sans #)
     */
    function navigate(hash) {
        window.location.hash = hash;
    }

    /**
     * Remplace la route actuelle sans ajouter d'entrée dans l'historique
     * @param {string} hash
     */
    function replace(hash) {
        window.history.replaceState(null, '', '#' + hash);
        resolve();
    }

    /**
     * Retourne à la route précédente
     */
    function back() {
        window.history.back();
    }

    /**
     * Retourne la route courante
     */
    function getCurrent() {
        return currentRoute;
    }

    /**
     * Met à jour les meta tags en fonction de la route
     */
    function updateMetaForRoute(pattern, params) {
        const baseTitle = 'Palimpseste';
        const baseDesc = 'Dérivez à travers la littérature mondiale. Lecture infinie, 7 sources, 12 langues.';
        
        let title = baseTitle;
        let description = baseDesc;
        let ogType = 'website';

        switch (pattern) {
            case 'profile/:id':
                title = `Profil — ${baseTitle}`;
                description = `Découvrez le profil d'un lecteur sur ${baseTitle}`;
                ogType = 'profile';
                break;
            case 'collection/:id':
                title = `Collection — ${baseTitle}`;
                description = `Explorez cette collection littéraire sur ${baseTitle}`;
                break;
            case 'text/:id':
                title = `Extrait — ${baseTitle}`;
                description = `Lisez cet extrait littéraire sur ${baseTitle}`;
                ogType = 'article';
                break;
            case 'trending':
                title = `Tendances — ${baseTitle}`;
                description = `Les textes les plus populaires sur ${baseTitle}`;
                break;
            case 'explore/:keyword':
                title = `${decodeURIComponent(params.keyword || '')} — ${baseTitle}`;
                description = `Explorez "${decodeURIComponent(params.keyword || '')}" sur ${baseTitle}`;
                break;
            case 'author/:name':
                title = `${decodeURIComponent(params.name || '')} — ${baseTitle}`;
                description = `Découvrez les textes de ${decodeURIComponent(params.name || '')} sur ${baseTitle}`;
                ogType = 'profile';
                break;
            case 'preview':
                // Shared preview: query params contain the snippet
                const qs = new URLSearchParams(window.location.hash.split('?')[1] || '');
                const previewAuthor = qs.get('a') || 'Anonyme';
                const previewSnippet = (qs.get('t') || '').substring(0, 100);
                title = `${previewAuthor} — ${baseTitle}`;
                description = `« ${previewSnippet}… » — ${previewAuthor}`;
                ogType = 'article';
                break;
        }

        document.title = title;
        
        // Update meta tags
        setMeta('description', description);
        setMeta('og:title', title, 'property');
        setMeta('og:description', description, 'property');
        setMeta('og:type', ogType, 'property');
        setMeta('og:url', window.location.href, 'property');
        setMeta('twitter:title', title, 'name');
        setMeta('twitter:description', description, 'name');
    }

    /**
     * Helper pour créer/modifier les meta tags
     */
    function setMeta(name, content, attr = 'name') {
        let el = document.querySelector(`meta[${attr}="${name}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, name);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    }

    /**
     * Initialise le router
     */
    function init() {
        window.addEventListener('hashchange', resolve);
        // Résoudre la route initiale
        resolve();
    }

    return { on, navigate, replace, back, getCurrent, init, parseHash, setMeta };
})();

// Exposer globalement
window.Router = Router;
