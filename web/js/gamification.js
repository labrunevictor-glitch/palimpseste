/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📁 GAMIFICATION.JS - Module de gamification simplifié
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Ce module gère les fonctionnalités ludiques de Palimpseste :
 * - Sauts aléatoires (thématiques et purs)
 * - Messages fun et stats ludiques
 * - Chemin de lecture (reading path)
 * 
 * @requires app.js - state, saveState, exploreAuthor, toast
 * @requires config.js - AMBIANCES (pour randomJump thématique)
 * 
 * @version 2.0.0
 * @date 2026-02-03
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════
// 🎭 MESSAGES FUN - Ambiance immersive
// ═══════════════════════════════════════════════════════════

/**
 * Messages atmosphériques aléatoires affichés lors des sauts
 * Thème : bibliothèque hantée / exploration nocturne
 * Utilisant des symboles typographiques au lieu d'émojis
 */
const FUN_MESSAGES = [
    "❧ Vous vous enfoncez dans les ténèbres littéraires...",
    "∞ La spirale des mots vous aspire...",
    "§ Les livres murmurent votre nom...",
    "✦ Une bougie vacille dans la bibliothèque...",
    "☙ Vous avez trouvé une porte secrète...",
    "☾ Un hibou vous observe depuis les étagères...",
    "✧ La lune éclaire un passage inconnu...",
    "◈ Les personnages vous guettent...",
    "۞ L'encre des siècles vous enivre...",
    "⚜ Vous errez dans le grenier des âmes...",
    "≋ Les vers déferlent comme des vagues...",
    "◉ Le cristal révèle un auteur oublié...",
    "✺ La toile littéraire se tisse autour de vous...",
    "❋ Un météore de mots traverse votre esprit...",
    "♔ Bienvenue dans le cirque des poètes maudits..."
];

// ═══════════════════════════════════════════════════════════
// 🎲 SAUT ALÉATOIRE PUR (sans thématique)
// ═══════════════════════════════════════════════════════════

/**
 * Effectue un saut aléatoire SANS respecter l'ambiance courante
 * Utilise l'API Random de Wikisource pour une découverte totale
 * @returns {Promise<void>}
 */
async function pureRandomJump() {
    toast('✧ Saut dans l\'inconnu...');
    
    // Tente de récupérer une page au hasard via l'API Wikisource
    try {
        // Détection de la langue active pour l'API
        let lang = 'fr'; // défaut
        if (typeof selectedLang !== 'undefined' && selectedLang !== 'all') {
            lang = selectedLang;
        }
        
        const apiUrl = `https://${lang}.wikisource.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.query && data.query.random && data.query.random.length > 0) {
            const pageTitle = data.query.random[0].title;
            
            toast(`✧ Découverte : ${pageTitle}`);
            
            if (window.exploreAuthor) {
                // setContext = false : le terme aléatoire ne doit pas devenir un filtre persistant
                await window.exploreAuthor(pageTitle, false);
            }
        } else {
            throw new Error("Pas de résultat aléatoire");
        }
        
    } catch (e) {
        console.error("Erreur saut aléatoire", e);
        // Fallback sur un terme générique si l'API échoue
        const fallbacks = ['Poésie', 'Roman', 'Théâtre', 'Philosophie', 'Histoire'];
        const randomTerm = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        toast('✧ Navigation aléatoire...');
        // setContext = false : le terme aléatoire ne doit pas devenir un filtre persistant
        if (window.exploreAuthor) await window.exploreAuthor(randomTerm, false);
    }

    updateFunStat();
}

// ═══════════════════════════════════════════════════════════
// 🎯 SAUT ALÉATOIRE CONTEXTUEL
// ═══════════════════════════════════════════════════════════

/**
 * Effectue un saut aléatoire basé sur les filtres actifs (s'il y en a)
 * Sinon, comportement purement aléatoire.
 * @returns {Promise<void>}
 */
async function randomJump() {
    // Si des filtres sont actifs dans exploration.js, on les utilise
    if (window.activeFilters && window.applyFilters && 
        (!window.activeFilters.forme.includes('all') || 
         !window.activeFilters.epoque.includes('all') || 
         !window.activeFilters.ton.includes('all') || 
         (window.activeFilters.pensee && !window.activeFilters.pensee.includes('all')))) {
        
        toast('✧ Saut contextuel (filtres)...');
        await window.applyFilters();
    } else {
        // Sinon saut aléatoire pur
        await pureRandomJump();
    }
    
    updateFunStat();
}

// ═══════════════════════════════════════════════════════════
// 📊 STATISTIQUES FUN
// ═══════════════════════════════════════════════════════════

/**
 * Met à jour le message fun affiché dans l'interface
 * Affiche des stats ludiques et poétiques
 */
function updateFunStat() {
    const el = document.getElementById('funStat');
    if (!el) return;
    
    const authorCount = Object.keys(state.authorStats).length;
    const readCount = state.readCount || 0;
    const likeCount = state.likes?.size || 0;
    
    // Affichage simple et clair
    el.textContent = `${readCount} textes · ${authorCount} auteurs · ${likeCount} favoris`;
}

// ═══════════════════════════════════════════════════════════
// 🛤️ CHEMIN DE LECTURE (Reading Path)
// ═══════════════════════════════════════════════════════════

/**
 * Ajoute un nœud au chemin de lecture (breadcrumb visuel)
 * @param {string} author - Nom de l'auteur
 * @param {string} title - Titre du texte
 */
function addToReadingPath(author, title) {
    if (!state.readingPath) state.readingPath = [];
    
    // Garder les 8 derniers
    state.readingPath.push({ 
        author, 
        title: title?.split('/')[0] || '?', 
        time: Date.now() 
    });
    if (state.readingPath.length > 8) state.readingPath.shift();
    
    renderReadingPath();
    saveState();
}

/**
 * Affiche le chemin de lecture dans l'interface
 * Montre les derniers auteurs visités avec des flèches
 */
function renderReadingPath() {
    const container = document.getElementById('readingPath');
    if (!container || !state.readingPath?.length) return;
    
    container.innerHTML = state.readingPath.map((node, i) => `
        <span class="path-node" title="${node.title}">
            ${node.author.split(' ').pop()}
        </span>
        ${i < state.readingPath.length - 1 ? '<span class="path-arrow">→</span>' : ''}
    `).join('');
}

// ═══════════════════════════════════════════════════════════
// 📤 EXPORTS GLOBAUX
// ═══════════════════════════════════════════════════════════

// Constantes exportées (accessibles globalement)
window.FUN_MESSAGES = FUN_MESSAGES;

// Fonctions exportées (accessibles globalement)
window.pureRandomJump = pureRandomJump;
window.randomJump = randomJump;
window.updateFunStat = updateFunStat;
window.addToReadingPath = addToReadingPath;
window.renderReadingPath = renderReadingPath;

// Stubs pour éviter les erreurs (fonctions supprimées mais peut-être appelées ailleurs)
window.checkAchievements = function() {};
window.renderAchievements = function() {};
window.unlockAchievement = function() {};
window.syncProgressWithCloud = function() { return Promise.resolve(false); };
window.loadProgressFromCloud = function() { return Promise.resolve(null); };
window.forceSyncToCloud = function() { return Promise.resolve(); };
