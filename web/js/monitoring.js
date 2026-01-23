/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📊 MONITORING.JS - Palimpseste Analytics
 * Tracking des événements utilisateurs
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Session ID unique pour cette visite
const SESSION_ID = crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });

// Configuration du monitoring
const MONITORING_CONFIG = {
    enabled: true,                    // Activer/désactiver le tracking
    trackPageViews: true,             // Tracker les vues de page
    trackSearches: true,              // Tracker les recherches
    trackShares: true,                // Tracker les partages
    trackExploration: true,           // Tracker l'exploration
    trackSocial: true,                // Tracker les interactions sociales
    debounceMs: 1000,                 // Debounce pour éviter le spam
    maxEventsPerMinute: 60,           // Rate limiting
    debug: false                      // Mode debug (console.log)
};

// Rate limiting
let _eventCount = 0;
let _eventCountResetTime = Date.now();

// Debounce storage
const _lastEventTime = {};

/**
 * Enregistre un événement analytics
 * @param {string} eventType - Type d'événement ('login', 'search', 'share', etc.)
 * @param {object} eventData - Données additionnelles
 */
async function trackEvent(eventType, eventData = {}) {
    if (!MONITORING_CONFIG.enabled) return;
    if (!supabaseClient) return;
    
    // Rate limiting
    const now = Date.now();
    if (now - _eventCountResetTime > 60000) {
        _eventCount = 0;
        _eventCountResetTime = now;
    }
    if (_eventCount >= MONITORING_CONFIG.maxEventsPerMinute) {
        if (MONITORING_CONFIG.debug) console.warn('[Monitoring] Rate limit reached');
        return;
    }
    
    // Debounce par type d'événement
    const debounceKey = `${eventType}_${JSON.stringify(eventData)}`;
    if (_lastEventTime[debounceKey] && (now - _lastEventTime[debounceKey]) < MONITORING_CONFIG.debounceMs) {
        return;
    }
    _lastEventTime[debounceKey] = now;
    _eventCount++;
    
    try {
        const eventRecord = {
            user_id: currentUser?.id || null,
            event_type: eventType,
            event_data: eventData,
            user_agent: navigator.userAgent,
            session_id: SESSION_ID
        };
        
        if (MONITORING_CONFIG.debug) {
            console.log('[Monitoring] Track:', eventType, eventData);
        }
        
        // Envoi asynchrone (fire and forget)
        supabaseClient
            .from('analytics_events')
            .insert(eventRecord)
            .then(({ error }) => {
                if (error && MONITORING_CONFIG.debug) {
                    console.error('[Monitoring] Error:', error);
                }
            });
            
    } catch (e) {
        if (MONITORING_CONFIG.debug) console.error('[Monitoring] Exception:', e);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 📌 ÉVÉNEMENTS PRÉ-DÉFINIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track une connexion utilisateur
 */
function trackLogin(method = 'email') {
    trackEvent('login', { method });
}

/**
 * Track une déconnexion
 */
function trackLogout() {
    trackEvent('logout', {});
}

/**
 * Track une inscription
 */
function trackSignup(method = 'email') {
    trackEvent('signup', { method });
}

/**
 * Track une vue de page/section
 */
function trackPageView(page, details = {}) {
    if (!MONITORING_CONFIG.trackPageViews) return;
    trackEvent('page_view', { page, ...details });
}

/**
 * Track une recherche
 */
function trackSearch(query, source = 'wikisource', resultsCount = 0) {
    if (!MONITORING_CONFIG.trackSearches) return;
    trackEvent('search', { 
        query: query.substring(0, 100), // Limiter la taille
        source, 
        results_count: resultsCount 
    });
}

/**
 * Track un partage d'extrait
 */
function trackShare(extraitId, source = 'wikisource') {
    if (!MONITORING_CONFIG.trackShares) return;
    trackEvent('share', { extrait_id: extraitId, source });
}

/**
 * Track une exploration/dérive
 */
function trackExploration(type, details = {}) {
    if (!MONITORING_CONFIG.trackExploration) return;
    trackEvent('exploration', { type, ...details });
}

/**
 * Track une interaction sociale (like, comment, follow)
 */
function trackSocial(action, targetType, targetId) {
    if (!MONITORING_CONFIG.trackSocial) return;
    trackEvent('social', { action, target_type: targetType, target_id: targetId });
}

/**
 * Track une erreur
 */
function trackError(errorType, errorMessage, context = {}) {
    trackEvent('error', { 
        error_type: errorType, 
        message: errorMessage.substring(0, 500),
        ...context 
    });
}

/**
 * Track le temps passé sur une section
 */
let _sectionStartTime = {};
function trackSectionEnter(sectionName) {
    _sectionStartTime[sectionName] = Date.now();
}

function trackSectionLeave(sectionName) {
    if (_sectionStartTime[sectionName]) {
        const duration = Math.round((Date.now() - _sectionStartTime[sectionName]) / 1000);
        if (duration > 2) { // Ne tracker que si > 2 secondes
            trackEvent('section_time', { section: sectionName, duration_seconds: duration });
        }
        delete _sectionStartTime[sectionName];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 INTÉGRATION AUTOMATIQUE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialise le monitoring et les hooks automatiques
 */
function initMonitoring() {
    if (!MONITORING_CONFIG.enabled) return;
    
    // Track la visite initiale
    trackEvent('session_start', {
        referrer: document.referrer || 'direct',
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
        language: navigator.language
    });
    
    // Track quand l'utilisateur quitte
    window.addEventListener('beforeunload', () => {
        trackEvent('session_end', {
            duration_seconds: Math.round((Date.now() - performance.timing.navigationStart) / 1000)
        });
    });
    
    // Track les erreurs JavaScript
    window.addEventListener('error', (e) => {
        trackError('js_error', e.message, {
            filename: e.filename,
            line: e.lineno,
            col: e.colno
        });
    });
    
    // Track les promesses rejetées non gérées
    window.addEventListener('unhandledrejection', (e) => {
        trackError('unhandled_promise', String(e.reason));
    });
    
    if (MONITORING_CONFIG.debug) {
        console.log('[Monitoring] Initialized with session:', SESSION_ID);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 📊 DASHBOARD ADMIN (optionnel)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Récupère les statistiques globales (admin uniquement)
 */
async function getAnalyticsStats() {
    if (!supabaseClient || !currentUser) return null;
    
    try {
        const { data, error } = await supabaseClient.rpc('get_analytics_stats');
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('Error fetching analytics:', e);
        return null;
    }
}

/**
 * Récupère les connexions récentes (admin uniquement)
 */
async function getRecentLogins(limit = 50) {
    if (!supabaseClient || !currentUser) return [];
    
    try {
        const { data, error } = await supabaseClient
            .from('analytics_events')
            .select(`
                created_at,
                user_id,
                event_data,
                user_agent
            `)
            .eq('event_type', 'login')
            .order('created_at', { ascending: false })
            .limit(limit);
            
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('Error fetching recent logins:', e);
        return [];
    }
}

/**
 * Récupère les utilisateurs actifs (admin uniquement)
 */
async function getActiveUsers(hours = 24) {
    if (!supabaseClient || !currentUser) return [];
    
    try {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabaseClient
            .from('analytics_events')
            .select('user_id, created_at')
            .gte('created_at', since)
            .not('user_id', 'is', null);
            
        if (error) throw error;
        
        // Dédupliquer et compter
        const userMap = new Map();
        (data || []).forEach(e => {
            if (!userMap.has(e.user_id) || new Date(e.created_at) > new Date(userMap.get(e.user_id))) {
                userMap.set(e.user_id, e.created_at);
            }
        });
        
        return Array.from(userMap.entries()).map(([user_id, last_seen]) => ({
            user_id,
            last_seen
        }));
    } catch (e) {
        console.error('Error fetching active users:', e);
        return [];
    }
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que Supabase soit prêt
    setTimeout(initMonitoring, 1000);
});
