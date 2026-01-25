/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📁 GAMIFICATION.JS - Module de gamification et achievements
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Ce module gère tout le système de gamification de Palimpseste :
 * - Système de badges/achievements avec progression
 * - Sauts aléatoires (thématiques et purs)
 * - Messages fun et stats ludiques
 * - Chemin de lecture (reading path)
 * - Auteurs secrets (hidden gems)
 * 
 * @requires app.js - state, saveState, exploreAuthor, toast
 * @requires config.js - AMBIANCES (pour randomJump thématique)
 * 
 * @version 1.0.0
 * @date 2025-01-14
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════
// 💎 AUTEURS SECRETS - Pépites cachées mondiales
// ═══════════════════════════════════════════════════════════

/**
 * Liste des auteurs "secrets" - trésors littéraires à découvrir
 * Organisés par origine linguistique/culturelle
 */
const HIDDEN_GEMS = [
    // Français - Poètes maudits et symbolistes obscurs
    'Lautréamont', 'Aloysius Bertrand', 'Tristan Corbière', 'Jules Laforgue',
    // Anglais - Métaphysiques et visionnaires
    'John Donne', 'George Herbert', 'Thomas Traherne', 'Christopher Smart',
    // Allemand - Romantiques et expressionnistes
    'Novalis', 'Hölderlin', 'Rilke', 'Trakl',
    // Italien - Poètes du sentiment
    'Leopardi', 'Ungaretti', 'Montale',
    // Espagnol - Baroques et mystiques
    'Góngora', 'Quevedo', 'San Juan de la Cruz',
    // Russe - Âge d'argent
    'Tyutchev', 'Mandelstam', 'Akhmatova',
    // Latin - Élégiaques
    'Catullus', 'Propertius', 'Tibullus'
];

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
// ✦ SYSTÈME DE BADGES/ACHIEVEMENTS — 50 badges typographiques
// ═══════════════════════════════════════════════════════════

/**
 * Symboles typographiques élégants pour les badges
 * Inspirés des ornements de livres anciens et de la typographie classique
 */
const BADGE_SYMBOLS = {
    // Lecture & Progression
    reading: '❧',      // Hedera (feuille de lierre)
    journey: '☙',      // Hedera inversée
    chapter: '§',      // Section
    page: '¶',         // Pied de mouche
    book: '❦',         // Cœur floral
    
    // Exploration & Découverte
    compass: '✧',      // Étoile à 4 branches
    star: '✦',         // Étoile pleine
    cross: '✠',        // Croix de Malte
    fleur: '⚜',        // Fleur de lys
    diamond: '◆',      // Losange plein
    
    // Temps & Histoire
    hourglass: '⌛',    // Sablier
    sun: '☀',          // Soleil
    moon: '☾',         // Lune
    dawn: '✺',         // Étoile rayonnante
    
    // Passion & Cœur
    heart: '♥',        // Cœur
    spade: '♠',        // Pique
    club: '♣',         // Trèfle
    rose: '✿',         // Fleur
    
    // Mystère & Ésotérisme
    eye: '◉',          // Œil
    spiral: '۞',       // Ornement
    infinity: '∞',     // Infini
    ankh: '☥',         // Ankh
    
    // Noblesse & Prestige
    crown: '♔',        // Couronne
    scepter: '⚔',      // Épées
    shield: '◈',       // Diamant orné
    laurel: '❀',       // Fleur
    
    // Nature & Éléments
    leaf: '❧',         // Feuille
    wave: '≋',         // Vagues
    flame: '❋',        // Flamme stylisée
    mountain: '⌂',     // Sommet
};

/**
 * Définition complète des 50 badges du jeu
 * Chaque badge a : icon (symbole typographique), name, desc, category
 */
const ACHIEVEMENTS = {
    // ══════════════════════════════════════════
    // LECTURE — Progression de base (10 badges)
    // ══════════════════════════════════════════
    first_read: { 
        icon: '❧', 
        name: 'Premier pas', 
        desc: 'Lire votre premier texte',
        category: 'lecture'
    },
    reader_10: { 
        icon: '§', 
        name: 'Lecteur', 
        desc: 'Lire 10 textes',
        category: 'lecture'
    },
    reader_50: { 
        icon: '¶', 
        name: 'Bibliophile', 
        desc: 'Lire 50 textes',
        category: 'lecture'
    },
    reader_100: { 
        icon: '❦', 
        name: 'Dévoreur', 
        desc: 'Lire 100 textes',
        category: 'lecture'
    },
    reader_250: { 
        icon: '☙', 
        name: 'Érudit', 
        desc: 'Lire 250 textes',
        category: 'lecture'
    },
    marathon: { 
        icon: '∞', 
        name: 'Marathonien', 
        desc: 'Lire 25 textes d\'affilée',
        category: 'lecture'
    },
    words_10k: { 
        icon: '✦', 
        name: 'Dix mille mots', 
        desc: 'Lire 10 000 mots',
        category: 'lecture'
    },
    words_50k: { 
        icon: '✧', 
        name: 'Cinquante mille', 
        desc: 'Lire 50 000 mots',
        category: 'lecture'
    },
    words_100k: { 
        icon: '◆', 
        name: 'Cent mille', 
        desc: 'Lire 100 000 mots',
        category: 'lecture'
    },
    time_1h: { 
        icon: '⌛', 
        name: 'Une heure', 
        desc: 'Cumuler 1h de lecture',
        category: 'lecture'
    },

    // ══════════════════════════════════════════
    // EXPLORATION — Découverte d'auteurs (10 badges)
    // ══════════════════════════════════════════
    explorer_5: { 
        icon: '✧', 
        name: 'Curieux', 
        desc: 'Découvrir 5 auteurs',
        category: 'exploration'
    },
    explorer_15: { 
        icon: '✦', 
        name: 'Explorateur', 
        desc: 'Découvrir 15 auteurs',
        category: 'exploration'
    },
    explorer_30: { 
        icon: '⚜', 
        name: 'Aventurier', 
        desc: 'Découvrir 30 auteurs',
        category: 'exploration'
    },
    explorer_50: { 
        icon: '✠', 
        name: 'Corsaire', 
        desc: 'Découvrir 50 auteurs',
        category: 'exploration'
    },
    explorer_100: { 
        icon: '♔', 
        name: 'Maître des lettres', 
        desc: 'Découvrir 100 auteurs',
        category: 'exploration'
    },
    hidden_gem: { 
        icon: '◈', 
        name: 'Dénicheur', 
        desc: 'Trouver un auteur secret',
        category: 'exploration'
    },
    polyglot: { 
        icon: '۞', 
        name: 'Polyglotte', 
        desc: 'Lire en 3 langues différentes',
        category: 'exploration'
    },
    genre_master: { 
        icon: '◉', 
        name: 'Polymorphe', 
        desc: 'Explorer 5 genres différents',
        category: 'exploration'
    },
    random_10: { 
        icon: '✺', 
        name: 'Hasardeux', 
        desc: 'Faire 10 sauts aléatoires',
        category: 'exploration'
    },
    deep_dive: { 
        icon: '≋', 
        name: 'Plongée profonde', 
        desc: 'Lire 5 textes du même auteur',
        category: 'exploration'
    },

    // ══════════════════════════════════════════
    // TEMPS — Moments et régularité (8 badges)
    // ══════════════════════════════════════════
    night_owl: { 
        icon: '☾', 
        name: 'Noctambule', 
        desc: 'Lire après minuit',
        category: 'temps'
    },
    early_bird: { 
        icon: '☀', 
        name: 'Lève-tôt', 
        desc: 'Lire avant 7h du matin',
        category: 'temps'
    },
    streak_7: { 
        icon: '❋', 
        name: 'Semaine complète', 
        desc: '7 jours de lecture consécutifs',
        category: 'temps'
    },
    streak_30: { 
        icon: '♥', 
        name: 'Mois de dévotion', 
        desc: '30 jours de lecture consécutifs',
        category: 'temps'
    },
    century_jump: { 
        icon: '⌛', 
        name: 'Voyageur temporel', 
        desc: 'Passer du XIXe au XVIe siècle',
        category: 'temps'
    },
    weekend_reader: { 
        icon: '✿', 
        name: 'Lecteur du dimanche', 
        desc: 'Lire un dimanche',
        category: 'temps'
    },
    midnight_special: { 
        icon: '◉', 
        name: 'Minuit pile', 
        desc: 'Lire exactement à minuit',
        category: 'temps'
    },
    seasonal: { 
        icon: '❀', 
        name: 'Saisonnier', 
        desc: 'Lire pendant 4 saisons',
        category: 'temps'
    },

    // ══════════════════════════════════════════
    // PASSION — Likes et favoris (7 badges)
    // ══════════════════════════════════════════
    love_1: { 
        icon: '♥', 
        name: 'Premier coup de cœur', 
        desc: 'Aimer votre premier texte',
        category: 'passion'
    },
    love_10: { 
        icon: '❦', 
        name: 'Passionné', 
        desc: 'Aimer 10 textes',
        category: 'passion'
    },
    love_25: { 
        icon: '✿', 
        name: 'Collectionneur', 
        desc: 'Aimer 25 textes',
        category: 'passion'
    },
    love_50: { 
        icon: '❧', 
        name: 'Anthologiste', 
        desc: 'Aimer 50 textes',
        category: 'passion'
    },
    love_100: { 
        icon: '☙', 
        name: 'Trésorier', 
        desc: 'Aimer 100 textes',
        category: 'passion'
    },
    share_first: { 
        icon: '§', 
        name: 'Premier partage', 
        desc: 'Partager votre premier extrait',
        category: 'passion'
    },
    comment_first: { 
        icon: '¶', 
        name: 'Première annotation', 
        desc: 'Commenter un extrait',
        category: 'passion'
    },

    // ══════════════════════════════════════════
    // LITTÉRATURE — Courants et époques (10 badges)
    // ══════════════════════════════════════════
    romantique: { 
        icon: '❧', 
        name: 'Âme romantique', 
        desc: 'Explorer le romantisme',
        category: 'litterature'
    },
    symbolist: { 
        icon: '☾', 
        name: 'Symboliste', 
        desc: 'Découvrir Mallarmé et Verlaine',
        category: 'litterature'
    },
    classique: { 
        icon: '⚜', 
        name: 'Classique', 
        desc: 'Lire Molière, Racine ou Corneille',
        category: 'litterature'
    },
    lumieres: { 
        icon: '☀', 
        name: 'Lumières', 
        desc: 'Explorer Voltaire ou Diderot',
        category: 'litterature'
    },
    renaissance: { 
        icon: '✠', 
        name: 'Renaissance', 
        desc: 'Lire 3 auteurs du XVIe',
        category: 'litterature'
    },
    medieval: { 
        icon: '♔', 
        name: 'Médiéviste', 
        desc: 'Découvrir un auteur médiéval',
        category: 'litterature'
    },
    poete_maudit: { 
        icon: '♠', 
        name: 'Poète maudit', 
        desc: 'Découvrir Lautréamont',
        category: 'litterature'
    },
    mystique: { 
        icon: '☥', 
        name: 'Mystique', 
        desc: 'Explorer 5 textes mystiques',
        category: 'litterature'
    },
    naturaliste: { 
        icon: '◆', 
        name: 'Naturaliste', 
        desc: 'Lire Zola ou Maupassant',
        category: 'litterature'
    },
    surrealiste: { 
        icon: '∞', 
        name: 'Surréaliste', 
        desc: 'Découvrir Breton ou Éluard',
        category: 'litterature'
    },

    // ══════════════════════════════════════════
    // PRESTIGE — Accomplissements rares (5 badges)
    // ══════════════════════════════════════════
    completionist: { 
        icon: '♔', 
        name: 'Complétionniste', 
        desc: 'Débloquer 25 badges',
        category: 'prestige'
    },
    master: { 
        icon: '✠', 
        name: 'Grand Maître', 
        desc: 'Débloquer 40 badges',
        category: 'prestige'
    },
    legend: { 
        icon: '⚜', 
        name: 'Légende', 
        desc: 'Débloquer tous les badges',
        category: 'prestige'
    },
    founding: { 
        icon: '۞', 
        name: 'Pionnier', 
        desc: 'Membre des 100 premiers utilisateurs',
        category: 'prestige'
    },
    patron: { 
        icon: '❦', 
        name: 'Mécène', 
        desc: 'Soutenir le projet',
        category: 'prestige'
    }
};

// ═══════════════════════════════════════════════════════════
// 🎲 SAUT ALÉATOIRE PUR (sans thématique)
// ═══════════════════════════════════════════════════════════

/**
 * Effectue un saut aléatoire SANS respecter l'ambiance courante
 * Pioche dans tous les auteurs du monde et de toutes les époques
 * @returns {Promise<void>}
 */
async function pureRandomJump() {
    // Liste étendue d'auteurs classiques de toutes époques et cultures
    const classicAuthors = [
        // Français - Classiques
        'Victor Hugo', 'Charles Baudelaire', 'Gustave Flaubert', 'Émile Zola',
        'Marcel Proust', 'Stendhal', 'Honoré de Balzac', 'Guy de Maupassant',
        'Alexandre Dumas', 'Jules Verne', 'Voltaire', 'Molière', 'Jean Racine',
        'Arthur Rimbaud', 'Paul Verlaine', 'Gérard de Nerval', 'Alfred de Musset',
        'François Rabelais', 'Michel de Montaigne', 'Jean de La Fontaine',
        'Pierre Corneille', 'Denis Diderot', 'Alphonse Daudet', 'Théophile Gautier',
        // Français - Modernes
        'Albert Camus', 'Jean-Paul Sartre', 'Simone de Beauvoir', 'Marguerite Duras',
        'André Gide', 'Colette', 'Anatole France', 'Paul Claudel', 'André Malraux',
        // Français - Poètes
        'Stéphane Mallarmé', 'Paul Valéry', 'Guillaume Apollinaire', 'René Char',
        'Saint-John Perse', 'Francis Ponge', 'Henri Michaux', 'Yves Bonnefoy',
        // Anglais
        'Shakespeare', 'Oscar Wilde', 'Edgar Allan Poe', 'Mary Shelley',
        'Charles Dickens', 'Jane Austen', 'Emily Brontë', 'Charlotte Brontë',
        'Virginia Woolf', 'James Joyce', 'William Blake', 'John Milton',
        'Geoffrey Chaucer', 'Lord Byron', 'Percy Shelley', 'John Keats',
        'William Wordsworth', 'Samuel Taylor Coleridge', 'Alfred Tennyson',
        // Américains
        'Herman Melville', 'Nathaniel Hawthorne', 'Mark Twain', 'Walt Whitman',
        'Emily Dickinson', 'Henry David Thoreau', 'Ralph Waldo Emerson',
        'F. Scott Fitzgerald', 'Ernest Hemingway', 'William Faulkner',
        // Allemands
        'Johann Wolfgang von Goethe', 'Friedrich Schiller', 'Heinrich Heine',
        'Thomas Mann', 'Franz Kafka', 'Hermann Hesse', 'Rainer Maria Rilke',
        // Russes
        'Fiodor Dostoïevski', 'Léon Tolstoï', 'Anton Tchekhov', 'Alexandre Pouchkine',
        'Nicolas Gogol', 'Ivan Tourgueniev', 'Boris Pasternak', 'Anna Akhmatova',
        // Italiens
        'Dante Alighieri', 'Pétrarque', 'Boccace', 'Machiavel', 'Luigi Pirandello',
        'Giacomo Leopardi', 'Italo Calvino', 'Primo Levi',
        // Espagnols
        'Cervantes', 'Federico García Lorca', 'Jorge Luis Borges', 'Pablo Neruda',
        'Octavio Paz', 'Gabriel García Márquez', 'Julio Cortázar',
        // Portugais
        'Fernando Pessoa', 'Luís de Camões', 'José Saramago',
        // Japonais
        'Matsuo Bashō', 'Murasaki Shikibu', 'Sei Shōnagon', 'Yukio Mishima',
        // Autres
        'Omar Khayyam', 'Rabindranath Tagore', 'Khalil Gibran', 'Rûmî',
        'Confucius', 'Lao Tseu', 'Li Bai', 'Du Fu',
        // Antiques
        'Homère', 'Virgile', 'Ovide', 'Horace', 'Sophocle', 'Euripide',
        'Eschyle', 'Platon', 'Aristote', 'Cicéron', 'Sénèque', 'Marc Aurèle'
    ];
    
    const discoveredAuthors = Object.keys(window.state?.authorStats || {});
    const universalTerms = ['sonnet', 'elegy', 'ode', 'ballade', 'fable', 'nocturne', 'poème', 'conte', 'méditation', 'hymne', 'élégie', 'satire'];
    const allOptions = [...discoveredAuthors, ...HIDDEN_GEMS, ...universalTerms, ...classicAuthors];
    const unvisited = allOptions.filter(a => !(window.state?.authorStats?.[a]));
    const pool = unvisited.length > 3 ? unvisited : allOptions;
    
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    
    toast('✧ Découverte libre...');
    
    if (window.exploreAuthor) {
        await window.exploreAuthor(chosen);
    } else {
        console.error('exploreAuthor non disponible');
        toast('Chargement en cours, réessayez...');
        return;
    }
    checkAchievements();
    updateFunStat();
}

// ═══════════════════════════════════════════════════════════
// 🎯 SAUT ALÉATOIRE THÉMATIQUE (respecte l'ambiance)
// ═══════════════════════════════════════════════════════════

/**
 * Effectue un saut aléatoire EN RESPECTANT l'ambiance courante
 * Si mode libre, pioche dans les auteurs découverts + hidden gems
 * @returns {Promise<void>}
 */
async function randomJump() {
    const ambiance = AMBIANCES[currentAmbiance];
    let pool = [];
    
    // Si une ambiance spécifique est active, utiliser ses auteurs/mots-clés
    if (currentAmbiance !== 'libre' && ambiance.authors.length > 0) {
        pool = [...ambiance.authors, ...ambiance.keywords];
    } else {
        // Mode libre : comportement classique
        const discoveredAuthors = Object.keys(window.state?.authorStats || {});
        const universalTerms = ['sonnet', 'elegy', 'ode', 'ballade', 'fable', 'hymn', 'nocturne'];
        const allOptions = [...discoveredAuthors, ...HIDDEN_GEMS, ...universalTerms];
        const unvisited = allOptions.filter(a => !(window.state?.authorStats?.[a]) && !HIDDEN_GEMS.includes(a) || HIDDEN_GEMS.includes(a));
        pool = unvisited.length > 3 ? unvisited : allOptions;
    }
    
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    
    // Exploration directe sans message mystérieux
    if (window.exploreAuthor) {
        await window.exploreAuthor(chosen);
    }
    checkAchievements();
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
// ✓ VÉRIFICATION DES ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════

/**
 * Vérifie toutes les conditions de déblocage des badges
 * À appeler après chaque action significative (lecture, like, etc.)
 */
function checkAchievements() {
    const authorCount = Object.keys(state.authorStats).length;
    const readCount = state.readCount || 0;
    const likeCount = state.likes?.size || likedSourceUrls?.size || 0;
    const wordsRead = state.readingStats?.totalWordsRead || 0;
    const readingTime = state.readingStats?.totalReadingTime || 0;
    const streak = state.readingStats?.streak || 0;
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const unlockedCount = state.achievements?.length || 0;
    
    const checks = [
        // Lecture
        ['first_read', readCount >= 1],
        ['reader_10', readCount >= 10],
        ['reader_50', readCount >= 50],
        ['reader_100', readCount >= 100],
        ['reader_250', readCount >= 250],
        ['marathon', readCount >= 25],
        ['words_10k', wordsRead >= 10000],
        ['words_50k', wordsRead >= 50000],
        ['words_100k', wordsRead >= 100000],
        ['time_1h', readingTime >= 3600],
        
        // Exploration
        ['explorer_5', authorCount >= 5],
        ['explorer_15', authorCount >= 15],
        ['explorer_30', authorCount >= 30],
        ['explorer_50', authorCount >= 50],
        ['explorer_100', authorCount >= 100],
        ['hidden_gem', HIDDEN_GEMS.some(a => state.authorStats[a])],
        ['genre_master', Object.keys(state.genreStats || {}).length >= 5],
        ['deep_dive', Object.values(state.authorStats || {}).some(count => count >= 5)],
        
        // Temps
        ['night_owl', hour >= 0 && hour < 5],
        ['early_bird', hour >= 5 && hour < 7],
        ['streak_7', streak >= 7],
        ['streak_30', streak >= 30],
        ['weekend_reader', day === 0],
        ['midnight_special', hour === 0],
        
        // Passion
        ['love_1', likeCount >= 1],
        ['love_10', likeCount >= 10],
        ['love_25', likeCount >= 25],
        ['love_50', likeCount >= 50],
        ['love_100', likeCount >= 100],
        
        // Littérature
        ['mystique', (state.genreStats?.mystique || 0) >= 5],
        ['poete_maudit', !!state.authorStats['Comte de Lautréamont'] || !!state.authorStats['Lautréamont']],
        ['symbolist', state.authorStats['Stéphane Mallarmé'] && state.authorStats['Paul Verlaine']],
        ['classique', state.authorStats['Molière'] || state.authorStats['Jean Racine'] || state.authorStats['Pierre Corneille']],
        ['lumieres', state.authorStats['Voltaire'] || state.authorStats['Denis Diderot']],
        ['naturaliste', state.authorStats['Émile Zola'] || state.authorStats['Guy de Maupassant']],
        ['romantique', state.authorStats['Victor Hugo'] || state.authorStats['Alphonse de Lamartine']],
        
        // Prestige
        ['completionist', unlockedCount >= 25],
        ['master', unlockedCount >= 40],
        ['legend', unlockedCount >= 49]
    ];
    
    for (const [id, condition] of checks) {
        if (condition && !state.achievements.includes(id)) {
            unlockAchievement(id);
        }
    }
}

// ═══════════════════════════════════════════════════════════
// 🎉 DÉBLOCAGE D'ACHIEVEMENT
// ═══════════════════════════════════════════════════════════

/**
 * Anime et enregistre le déblocage d'un achievement
 * @param {string} id - Identifiant du badge (ex: 'first_read')
 */
function unlockAchievement(id) {
    const ach = ACHIEVEMENTS[id];
    if (!ach) return;
    
    state.achievements.push(id);
    saveState();
    
    // Notification discrète style toast
    const notif = document.createElement('div');
    notif.className = 'achievement-popup subtle';
    notif.innerHTML = `
        <span class="achievement-icon">${ach.icon}</span>
        <span class="achievement-name">${ach.name}</span>
    `;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.classList.add('show'), 100);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 2000);
    
    renderAchievements();
}

// ═══════════════════════════════════════════════════════════
// 🎨 AFFICHAGE DES BADGES
// ═══════════════════════════════════════════════════════════

/**
 * Affiche tous les badges avec leur état et progression
 * Organisés par catégorie avec des symboles typographiques
 */
function renderAchievements() {
    const container = document.getElementById('achievementList');
    if (!container) return;
    
    const authorCount = Object.keys(state.authorStats).length;
    const readCount = state.readCount || 0;
    const likeCount = state.likes?.size || likedSourceUrls?.size || 0;
    const wordsRead = state.readingStats?.totalWordsRead || 0;
    const readingTime = state.readingStats?.totalReadingTime || 0;
    const streak = state.readingStats?.streak || 0;
    const mystiqueCount = state.genreStats?.mystique || 0;
    const genreCount = Object.keys(state.genreStats || {}).length;
    const unlockedCount = state.achievements?.length || 0;
    
    // Calculer la progression pour chaque badge
    const getProgress = (id) => {
        const defaults = { current: 0, target: 1, text: ACHIEVEMENTS[id]?.desc || '', special: false };
        
        const progressMap = {
            // Lecture
            first_read: { current: Math.min(readCount, 1), target: 1 },
            reader_10: { current: Math.min(readCount, 10), target: 10 },
            reader_50: { current: Math.min(readCount, 50), target: 50 },
            reader_100: { current: Math.min(readCount, 100), target: 100 },
            reader_250: { current: Math.min(readCount, 250), target: 250 },
            marathon: { current: Math.min(readCount, 25), target: 25 },
            words_10k: { current: Math.min(wordsRead, 10000), target: 10000 },
            words_50k: { current: Math.min(wordsRead, 50000), target: 50000 },
            words_100k: { current: Math.min(wordsRead, 100000), target: 100000 },
            time_1h: { current: Math.min(readingTime, 3600), target: 3600 },
            
            // Exploration
            explorer_5: { current: Math.min(authorCount, 5), target: 5 },
            explorer_15: { current: Math.min(authorCount, 15), target: 15 },
            explorer_30: { current: Math.min(authorCount, 30), target: 30 },
            explorer_50: { current: Math.min(authorCount, 50), target: 50 },
            explorer_100: { current: Math.min(authorCount, 100), target: 100 },
            hidden_gem: { current: HIDDEN_GEMS.some(a => state.authorStats[a]) ? 1 : 0, target: 1 },
            genre_master: { current: Math.min(genreCount, 5), target: 5 },
            
            // Temps
            streak_7: { current: Math.min(streak, 7), target: 7 },
            streak_30: { current: Math.min(streak, 30), target: 30 },
            night_owl: { current: 0, target: 1, special: true },
            early_bird: { current: 0, target: 1, special: true },
            century_jump: { current: 0, target: 1, special: true },
            
            // Passion
            love_1: { current: Math.min(likeCount, 1), target: 1 },
            love_10: { current: Math.min(likeCount, 10), target: 10 },
            love_25: { current: Math.min(likeCount, 25), target: 25 },
            love_50: { current: Math.min(likeCount, 50), target: 50 },
            love_100: { current: Math.min(likeCount, 100), target: 100 },
            
            // Littérature
            mystique: { current: Math.min(mystiqueCount, 5), target: 5 },
            symbolist: { 
                current: (state.authorStats?.['Stéphane Mallarmé'] ? 1 : 0) + (state.authorStats?.['Paul Verlaine'] ? 1 : 0), 
                target: 2 
            },
            
            // Prestige
            completionist: { current: Math.min(unlockedCount, 25), target: 25 },
            master: { current: Math.min(unlockedCount, 40), target: 40 },
            legend: { current: Math.min(unlockedCount, 49), target: 49 }
        };
        
        return { ...defaults, ...progressMap[id] };
    };
    
    const totalBadges = Object.keys(ACHIEVEMENTS).length;
    
    // Mettre à jour le compteur
    const unlockedEl = document.getElementById('unlockedCount');
    const totalEl = document.getElementById('totalBadges');
    const inlineCountEl = document.getElementById('badgesCountInline');
    if (unlockedEl) unlockedEl.textContent = unlockedCount;
    if (totalEl) totalEl.textContent = totalBadges;
    if (inlineCountEl) inlineCountEl.textContent = `${unlockedCount}/${totalBadges}`;
    
    // Grouper par catégorie
    const categories = {
        lecture: { name: 'Lecture', icon: '❧' },
        exploration: { name: 'Exploration', icon: '✧' },
        temps: { name: 'Temps', icon: '☾' },
        passion: { name: 'Passion', icon: '♥' },
        litterature: { name: 'Littérature', icon: '⚜' },
        prestige: { name: 'Prestige', icon: '♔' }
    };
    
    const groupedBadges = {};
    for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
        const cat = ach.category || 'autre';
        if (!groupedBadges[cat]) groupedBadges[cat] = [];
        groupedBadges[cat].push({ id, ...ach });
    }
    
    container.innerHTML = Object.entries(categories).map(([catId, cat]) => {
        const badges = groupedBadges[catId] || [];
        if (badges.length === 0) return '';
        
        const unlockedInCat = badges.filter(b => state.achievements?.includes(b.id)).length;
        
        return `
            <div class="badge-category">
                <div class="badge-category-header">
                    <span class="badge-category-icon">${cat.icon}</span>
                    <span class="badge-category-name">${cat.name}</span>
                    <span class="badge-category-count">${unlockedInCat}/${badges.length}</span>
                </div>
                <div class="badge-category-grid">
                    ${badges.map(badge => {
                        const unlocked = state.achievements?.includes(badge.id);
                        const progress = getProgress(badge.id);
                        const percent = Math.min(100, Math.round((progress.current / progress.target) * 100));
                        
                        return `
                            <div class="achievement ${unlocked ? 'unlocked' : 'locked'}" 
                                 onclick="showBadgeDetails('${badge.id}')" 
                                 title="${badge.desc}">
                                <div class="badge-icon">${badge.icon}</div>
                                <div class="badge-info">
                                    <div class="badge-name">${badge.name}</div>
                                    ${!unlocked && !progress.special ? `
                                        <div class="badge-mini-progress" style="--progress: ${percent}%"></div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// 👁️ TOGGLE VUE DES BADGES
// ═══════════════════════════════════════════════════════════

/** État du panneau badges : étendu ou réduit */
let badgesExpanded = true;

/**
 * Bascule entre afficher tous les badges ou seulement les débloqués
 */
function toggleBadgesView() {
    badgesExpanded = !badgesExpanded;
    const container = document.getElementById('achievementList');
    const toggle = document.getElementById('badgesToggle');
    
    if (badgesExpanded) {
        container.classList.remove('collapsed');
        if (toggle) toggle.textContent = 'Voir tout';
    } else {
        container.classList.add('collapsed');
        if (toggle) toggle.textContent = 'Débloqués seulement';
    }
}

// ═══════════════════════════════════════════════════════════
// ℹ️ DÉTAILS D'UN BADGE
// ═══════════════════════════════════════════════════════════

/**
 * Affiche les détails et indices pour obtenir un badge
 * @param {string} id - Identifiant du badge
 */
function showBadgeDetails(id) {
    const ach = ACHIEVEMENTS[id];
    if (!ach) return;
    
    const unlocked = state.achievements.includes(id);
    
    // Indices pour aider le joueur
    const hints = {
        first_read: "Cliquez sur n'importe quel texte pour commencer votre voyage littéraire !",
        explorer_5: "Explorez différents auteurs en utilisant le bouton 🎲 ou la recherche.",
        explorer_15: "Continuez à découvrir de nouveaux auteurs. Chaque nom cache un univers !",
        explorer_30: "Devenez un véritable corsaire des lettres en naviguant entre 30 auteurs différents.",
        night_owl: "Les plus beaux textes se lisent parfois à la lueur de la lune... Revenez entre minuit et 5h !",
        century_jump: "Voyagez dans le temps ! Lisez un auteur du XIXe puis sautez au XVIe siècle.",
        hidden_gem: "Certains auteurs sont cachés... Cherchez les trésors oubliés de la littérature.",
        love_10: "Cliquez sur ♥ pour sauvegarder vos textes préférés. 10 coups de cœur = 1 badge !",
        marathon: "Lisez 25 textes sans vous arrêter. Un vrai marathon littéraire !",
        mystique: "Explorez les textes aux thèmes mystiques, ésotériques ou spirituels.",
        poete_maudit: "Recherchez 'Lautréamont' ou 'Maldoror' pour découvrir ce poète maudit légendaire.",
        renaissance: "Recherchez des auteurs du XVIe siècle : Ronsard, Du Bellay, Rabelais...",
        symbolist: "Les symbolistes Mallarmé et Verlaine vous attendent. Recherchez leurs noms !"
    };
    
    toast(`${ach.icon} ${ach.name}${unlocked ? ' (Débloqué !)' : ''} - ${hints[id] || ach.desc}`, 5000);
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
window.HIDDEN_GEMS = HIDDEN_GEMS;
window.FUN_MESSAGES = FUN_MESSAGES;
window.ACHIEVEMENTS = ACHIEVEMENTS;

// Fonctions exportées (accessibles globalement)
window.pureRandomJump = pureRandomJump;
window.randomJump = randomJump;
window.updateFunStat = updateFunStat;
window.checkAchievements = checkAchievements;
window.unlockAchievement = unlockAchievement;
window.renderAchievements = renderAchievements;
window.toggleBadgesView = toggleBadgesView;
window.showBadgeDetails = showBadgeDetails;
window.addToReadingPath = addToReadingPath;
window.renderReadingPath = renderReadingPath;
