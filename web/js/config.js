/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔧 CONFIG.JS - Palimpseste
 * Configuration centralisée et constantes
 * ═══════════════════════════════════════════════════════════════════════════
 */

// 🔗 Supabase (déjà défini dans app.js, on expose juste la config)
const CONFIG = {
    SUPABASE_URL: 'https://cqoepdrqifilqxnvflyy.supabase.co',
    
    // 📐 Breakpoints
    BREAKPOINTS: {
        mobile: 900
    },
    
    // 🌍 Langues supportées
    LANGUAGES: {
        fr: { name: 'Français', flag: '🇫🇷', wikisource: 'fr' },
        en: { name: 'English', flag: '🇬🇧', wikisource: 'en' },
        de: { name: 'Deutsch', flag: '🇩🇪', wikisource: 'de' },
        it: { name: 'Italiano', flag: '🇮🇹', wikisource: 'it' },
        es: { name: 'Español', flag: '🇪🇸', wikisource: 'es' },
        pt: { name: 'Português', flag: '🇵🇹', wikisource: 'pt' },
        ru: { name: 'Русский', flag: '🇷🇺', wikisource: 'ru' },
        la: { name: 'Latina', flag: '🏛️', wikisource: 'la' },
        zh: { name: '中文', flag: '🇨🇳', wikisource: 'zh' },
        ja: { name: '日本語', flag: '🇯🇵', wikisource: 'ja' },
        ar: { name: 'العربية', flag: '🇸🇦', wikisource: 'ar' },
        el: { name: 'Ελληνικά', flag: '🇬🇷', wikisource: 'el' }
    },
    
    // 🎭 Genres littéraires
    GENRES: {
        poesie: { name: 'Poésie', icon: '🎭', color: '#9b5de5' },
        roman: { name: 'Roman', icon: '📖', color: '#f4a261' },
        theatre: { name: 'Théâtre', icon: '🎪', color: '#e63946' },
        philosophie: { name: 'Philosophie', icon: '🧠', color: '#2a9d8f' },
        essai: { name: 'Essai', icon: '📝', color: '#457b9d' },
        conte: { name: 'Conte', icon: '🏰', color: '#e9c46a' },
        nouvelle: { name: 'Nouvelle', icon: '📃', color: '#8ecae6' },
        correspondance: { name: 'Correspondance', icon: '✉️', color: '#bc6c25' },
        texte: { name: 'Texte', icon: '📜', color: '#6c757d' }
    },
    
    // 🌊 Ambiances / Dérives
    AMBIANCES: {
        libre: { name: 'Dérive libre', icon: '🌊', color: '#3498db' },
        gothique: { name: 'Gothique', icon: '🦇', color: '#2c3e50' },
        surrealiste: { name: 'Surréaliste', icon: '🎭', color: '#9b59b6' },
        romantique: { name: 'Romantique', icon: '🌹', color: '#e74c3c' },
        melancolie: { name: 'Mélancolie', icon: '🌧️', color: '#7f8c8d' },
        mystique: { name: 'Mystique', icon: '🔮', color: '#8e44ad' },
        epique: { name: 'Épique', icon: '⚔️', color: '#c0392b' },
        pastoral: { name: 'Pastoral', icon: '🌾', color: '#27ae60' },
        decadent: { name: 'Décadent', icon: '💀', color: '#34495e' },
        nocturne: { name: 'Nocturne', icon: '🌙', color: '#2c3e50' },
        voyage: { name: 'Voyage', icon: '🚢', color: '#16a085' },
        philosophie: { name: 'Philosophie', icon: '🧠', color: '#f39c12' }
    },
    
    // 📜 Époques littéraires
    EPOQUES: {
        antiquite: { name: 'Antiquité', icon: '🏺', years: 'Avant 476' },
        medieval: { name: 'Moyen Âge', icon: '⚔️', years: '476 - 1492' },
        renaissance: { name: 'Renaissance', icon: '🎨', years: '1492 - 1610' },
        classique: { name: 'Grand Siècle', icon: '👑', years: '1610 - 1715' },
        lumieres: { name: 'Lumières', icon: '💡', years: '1715 - 1789' },
        xixe: { name: 'XIXᵉ siècle', icon: '🏭', years: '1789 - 1900' },
        belleepoque: { name: 'Belle Époque', icon: '🎭', years: '1871 - 1914' },
        xxe: { name: 'XXᵉ siècle', icon: '💣', years: '1900 - 2000' }
    },
    
    // 🏛️ Courants littéraires
    COURANTS: {
        humanisme: { name: 'Humanisme', icon: '📚', color: '#1abc9c' },
        baroque: { name: 'Baroque', icon: '🎭', color: '#9b59b6' },
        classicisme: { name: 'Classicisme', icon: '⚖️', color: '#3498db' },
        romantisme: { name: 'Romantisme', icon: '🌹', color: '#e74c3c' },
        realisme: { name: 'Réalisme', icon: '🔬', color: '#95a5a6' },
        naturalisme: { name: 'Naturalisme', icon: '🏭', color: '#7f8c8d' },
        symbolisme: { name: 'Symbolisme', icon: '🌸', color: '#8e44ad' },
        surrealisme: { name: 'Surréalisme', icon: '👁️', color: '#e67e22' },
        existentialisme: { name: 'Existentialisme', icon: '🚬', color: '#2c3e50' },
        absurde: { name: 'Absurde', icon: '🎪', color: '#f39c12' }
    },
    
    // 🏆 Achievements
    ACHIEVEMENTS: {
        premier_pas: { name: 'Premier pas', icon: '👣', description: 'Lire votre premier texte' },
        explorateur: { name: 'Explorateur', icon: '🧭', description: 'Lire 10 textes' },
        bibliophile: { name: 'Bibliophile', icon: '📚', description: 'Ajouter 10 favoris' },
        polyglotte: { name: 'Polyglotte', icon: '🌍', description: 'Lire dans 3 langues différentes' },
        noctambule: { name: 'Noctambule', icon: '🦉', description: 'Lire entre minuit et 5h' },
        leve_tot: { name: 'Lève-tôt', icon: '🌅', description: 'Lire entre 5h et 7h' },
        social: { name: 'Social', icon: '🤝', description: 'Suivre 5 utilisateurs' },
        critique: { name: 'Critique', icon: '✍️', description: 'Écrire 5 commentaires' },
        partageur: { name: 'Partageur', icon: '📤', description: 'Partager un extrait' },
        voyageur: { name: 'Voyageur littéraire', icon: '🚀', description: 'Lire 100 textes' }
    }
};

// 🌐 Exposer globalement pour rétrocompatibilité
window.CONFIG = CONFIG;
