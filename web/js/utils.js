/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔧 UTILS.JS - Palimpseste
 * Fonctions utilitaires réutilisables
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// 🎭 AVATAR - Symboles typographiques anciens
// ═══════════════════════════════════════════════════════════════════════════

/** Collection de symboles typographiques anciens pour les avatars */
const AVATAR_SYMBOLS = ['❧', '☙', '✦', '✧', '❦', '⚜', '۞', '✾', '❀', '✿', '☽', '☾', '⚘', '✺', '❈', '✵', '❋', '✤', '✥', '❊'];

/**
 * Génère un symbole d'avatar déterministe basé sur le username
 * Le même username donnera toujours le même symbole
 * @param {string} username - Nom d'utilisateur
 * @returns {string} Symbole typographique ancien
 */
function getAvatarSymbol(username) {
    if (!username) return '✦';
    // Hash simple du username pour un index déterministe
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = ((hash << 5) - hash) + username.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % AVATAR_SYMBOLS.length;
    return AVATAR_SYMBOLS[index];
}

// ═══════════════════════════════════════════════════════════════════════════
// 📅 FORMATAGE DE DATES ET TEMPS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Formate une date en temps relatif ("À l'instant", "5 min", "2 h", etc.)
 * @param {Date} date - La date à formater
 * @returns {string} Temps relatif formaté
 */
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' h';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' j';
    return date.toLocaleDateString('fr-FR');
}

/**
 * Formate l'heure d'un message (À l'instant, heure, jour, date)
 * @param {string} dateStr - Date en string ISO
 * @returns {string} Heure formatée
 */
function formatMessageTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' min';
    if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Formate un temps de lecture en secondes
 * @param {number} seconds - Temps en secondes
 * @returns {string} Temps formaté (ex: "5 min", "1h 30min")
 */
function formatReadingTime(seconds) {
    if (seconds < 60) return seconds + ' sec';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours + 'h ' + mins + 'min';
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔢 FORMATAGE DE NOMBRES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Formate un nombre de mots (ex: 1500 → "1.5k")
 * @param {number} words - Nombre de mots
 * @returns {string} Nombre formaté
 */
function formatWordsCount(words) {
    if (words < 1000) return words.toString();
    if (words < 10000) return (words / 1000).toFixed(1) + 'k';
    return Math.floor(words / 1000) + 'k';
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔐 SÉCURITÉ ET ÉCHAPPEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Échappe le HTML pour éviter les injections XSS
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Échappe les caractères spéciaux pour utilisation dans une regex
 * @param {string} string - Chaîne à échapper
 * @returns {string} Chaîne échappée
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧩 EXTRACT KEYING (commentaires/extraits)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalise un texte d'extrait pour génération de clé stable
 * @param {string} text - Texte brut
 * @returns {string} Texte normalisé
 */
function normalizeExcerptText(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
}

/**
 * Hash simple et déterministe d'un texte (non cryptographique)
 * @param {string} text - Texte à hasher
 * @returns {string} Hash hexadécimal
 */
function computeTextHash(text) {
    const normalized = normalizeExcerptText(text).toLowerCase();
    if (!normalized) return '';
    let hash = 5381;
    for (let i = 0; i < normalized.length; i++) {
        hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

/**
 * Construit les champs de clé stable pour un extrait
 * @param {string} text - Texte utilisé pour l'identification
 * @param {string} sourceTitle - Titre
 * @param {string} sourceAuthor - Auteur
 * @param {string} sourceUrl - URL source
 * @returns {{textHash:string, textLength:number, sourceTitle:string, sourceAuthor:string, sourceUrl:string}}
 */
function buildExtraitKey(text, sourceTitle, sourceAuthor, sourceUrl) {
    const normalizedText = normalizeExcerptText(text);
    return {
        textHash: computeTextHash(normalizedText),
        textLength: normalizedText.length,
        sourceTitle: (sourceTitle || '').trim(),
        sourceAuthor: (sourceAuthor || '').trim(),
        sourceUrl: (sourceUrl || '').trim()
    };
}

// Exposer les helpers globalement (utilisés dans app.js/share.js)
window.normalizeExcerptText = normalizeExcerptText;
window.computeTextHash = computeTextHash;
window.buildExtraitKey = buildExtraitKey;

// ═══════════════════════════════════════════════════════════════════════════
// 📦 STOCKAGE LOCAL
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'palimpseste';
const LANG_KEY = 'palimpseste_lang';

/**
 * Récupère les données du localStorage
 * @returns {Object} Données sauvegardées ou objet vide
 */
function getStorageData() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
        console.error('Erreur lecture localStorage:', e);
        return {};
    }
}

/**
 * Sauvegarde les données dans le localStorage
 * @param {Object} data - Données à sauvegarder
 */
function setStorageData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Erreur écriture localStorage:', e);
    }
}

/**
 * Récupère la langue sauvegardée
 * @returns {string|null} Code langue ou null
 */
function getSavedLanguage() {
    return localStorage.getItem(LANG_KEY);
}

/**
 * Sauvegarde la langue sélectionnée
 * @param {string} lang - Code langue
 */
function setSavedLanguage(lang) {
    localStorage.setItem(LANG_KEY, lang);
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔍 EXTRACTION DE TEXTE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Essaie d'extraire l'auteur depuis un titre
 * @param {string} title - Titre du texte
 * @returns {string|null} Nom de l'auteur ou null
 */
function extractAuthorFromTitle(title) {
    const patterns = [
        /^(.+?)\s*[-–—]\s*(.+)$/,  // "Titre - Auteur" ou "Auteur - Titre"
        /\(([^)]+)\)$/,             // "Titre (Auteur)"
        /by\s+(.+)$/i               // "Title by Author"
    ];
    
    for (const pattern of patterns) {
        const match = title.match(pattern);
        if (match) {
            const candidate = match[1] || match[2];
            // Vérifier si ça ressemble à un nom d'auteur
            if (candidate && candidate.length < 50 && /^[A-Za-zÀ-ÿ\s.'-]+$/.test(candidate)) {
                return candidate.trim();
            }
        }
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 HELPERS DIVERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Debounce - retarde l'exécution d'une fonction
 * @param {Function} func - Fonction à exécuter
 * @param {number} wait - Délai en ms
 * @returns {Function} Fonction avec debounce
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle - limite la fréquence d'exécution
 * @param {Function} func - Fonction à exécuter
 * @param {number} limit - Intervalle minimum en ms
 * @returns {Function} Fonction avec throttle
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Génère un ID unique
 * @returns {string} UUID v4
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Vérifie si l'appareil est mobile
 * @returns {boolean} true si mobile
 */
function isMobile() {
    return window.innerWidth <= (CONFIG?.BREAKPOINTS?.mobile || 900);
}

// 🌐 Exposer globalement pour rétrocompatibilité
window.formatTimeAgo = formatTimeAgo;
window.formatMessageTime = formatMessageTime;
window.formatReadingTime = formatReadingTime;
window.formatWordsCount = formatWordsCount;
window.escapeHtml = escapeHtml;
window.escapeRegex = escapeRegex;
window.getStorageData = getStorageData;
window.setStorageData = setStorageData;
window.getSavedLanguage = getSavedLanguage;
window.setSavedLanguage = setSavedLanguage;
window.extractAuthorFromTitle = extractAuthorFromTitle;
window.debounce = debounce;
window.throttle = throttle;
window.generateUUID = generateUUID;
window.isMobile = isMobile;
