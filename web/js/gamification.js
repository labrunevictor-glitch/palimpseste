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
 */
const FUN_MESSAGES = [
    "🦇 Vous vous enfoncez dans les ténèbres littéraires...",
    "🌀 La spirale des mots vous aspire...",
    "📚 Les livres murmurent votre nom...",
    "🕯️ Une bougie vacille dans la bibliothèque...",
    "🗝️ Vous avez trouvé une porte secrète...",
    "🦉 Un hibou vous observe depuis les étagères...",
    "🌙 La lune éclaire un passage inconnu...",
    "🎭 Les personnages vous guettent...",
    "⚗️ L'encre des siècles vous enivre...",
    "🏚️ Vous errez dans le grenier des âmes...",
    "🌊 Les vers déferlent comme des vagues...",
    "🔮 Le cristal révèle un auteur oublié...",
    "🕸️ La toile littéraire se tisse autour de vous...",
    "☄️ Un météore de mots traverse votre esprit...",
    "🎪 Bienvenue dans le cirque des poètes maudits..."
];

// ═══════════════════════════════════════════════════════════
// 🏆 SYSTÈME DE BADGES/ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════

/**
 * Définition complète de tous les badges du jeu
 * Chaque badge a : icon, name, desc
 */
const ACHIEVEMENTS = {
    first_read: { 
        icon: '📖', 
        name: 'Premier pas', 
        desc: 'Lire votre premier texte' 
    },
    explorer_5: { 
        icon: '🗺️', 
        name: 'Explorateur', 
        desc: 'Découvrir 5 auteurs' 
    },
    explorer_15: { 
        icon: '🧭', 
        name: 'Aventurier', 
        desc: 'Découvrir 15 auteurs' 
    },
    explorer_30: { 
        icon: '🏴‍☠️', 
        name: 'Corsaire littéraire', 
        desc: 'Découvrir 30 auteurs' 
    },
    night_owl: { 
        icon: '🦉', 
        name: 'Noctambule', 
        desc: 'Lire après minuit' 
    },
    century_jump: { 
        icon: '⏳', 
        name: 'Voyageur temporel', 
        desc: 'Passer du XIXe au XVIe siècle' 
    },
    hidden_gem: { 
        icon: '💎', 
        name: 'Dénicheur', 
        desc: 'Trouver un auteur secret' 
    },
    love_10: { 
        icon: '❤️‍🔥', 
        name: 'Passionné', 
        desc: 'Aimer 10 textes' 
    },
    marathon: { 
        icon: '🏃', 
        name: 'Marathonien', 
        desc: 'Lire 25 textes d\'affilée' 
    },
    mystique: { 
        icon: '✨', 
        name: 'Mystique', 
        desc: 'Explorer 5 textes mystiques' 
    },
    poete_maudit: { 
        icon: '🖤', 
        name: 'Poète maudit', 
        desc: 'Découvrir Lautréamont' 
    },
    renaissance: { 
        icon: '🏛️', 
        name: 'Renaissance', 
        desc: 'Lire 3 auteurs du XVIe' 
    },
    symbolist: { 
        icon: '🦢', 
        name: 'Symboliste', 
        desc: 'Explorer Mallarmé et Verlaine' 
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
    
    const discoveredAuthors = Object.keys(state.authorStats);
    const universalTerms = ['sonnet', 'elegy', 'ode', 'ballade', 'fable', 'nocturne', 'poème', 'conte', 'méditation', 'hymne', 'élégie', 'satire'];
    const allOptions = [...discoveredAuthors, ...HIDDEN_GEMS, ...universalTerms, ...classicAuthors];
    const unvisited = allOptions.filter(a => !state.authorStats[a]);
    const pool = unvisited.length > 3 ? unvisited : allOptions;
    
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    
    toast('🎲 Découverte libre...');
    
    await exploreAuthor(chosen);
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
        const discoveredAuthors = Object.keys(state.authorStats);
        const universalTerms = ['sonnet', 'elegy', 'ode', 'ballade', 'fable', 'hymn', 'nocturne'];
        const allOptions = [...discoveredAuthors, ...HIDDEN_GEMS, ...universalTerms];
        const unvisited = allOptions.filter(a => !state.authorStats[a] && !HIDDEN_GEMS.includes(a) || HIDDEN_GEMS.includes(a));
        pool = unvisited.length > 3 ? unvisited : allOptions;
    }
    
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    
    toast(FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)]);
    
    setTimeout(async () => {
        await exploreAuthor(chosen);
        checkAchievements();
        updateFunStat();
    }, 1500);
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
    const sessionMinutes = Math.floor((Date.now() - (state.sessionStart || Date.now())) / 60000);
    
    // Calculs dérivés
    const echoRatio = authorCount > 0 ? Math.round((likeCount / Math.max(1, readCount)) * 100) : 0;
    const wanderIndex = Math.floor(Math.sqrt(readCount * authorCount));
    const silenceGap = Math.max(0, 7 - (readCount % 7));
    
    const funStats = [
        `☽ Encre consommée : ${(readCount * 0.3).toFixed(1)} ml`,
        `◎ Orbite littéraire : ${authorCount} astres visités`,
        `❧ Résonances : ${likeCount} textes vous ont reconnu`,
        `⧖ Indice d'errance : ${wanderIndex}`,
        `☾ Prochaine éclipse : dans ${silenceGap} textes`,
        `✧ Ratio d'écho : ${echoRatio}% des textes résonnent`,
        `⚗ Distillation : ${Math.floor(readCount / 3)} essences extraites`,
        `༄ Temps de dérive : ${sessionMinutes || '∞'} minutes`,
        `◬ Fragments collectés : ${readCount} sur ∞`,
        `⛧ Connexions secrètes : ${Math.floor(authorCount * 1.7)}`,
    ];
    
    el.textContent = funStats[Math.floor(Math.random() * funStats.length)];
    el.style.opacity = '0';
    setTimeout(() => el.style.opacity = '1', 100);
}

// ═══════════════════════════════════════════════════════════
// ✅ VÉRIFICATION DES ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════

/**
 * Vérifie toutes les conditions de déblocage des badges
 * À appeler après chaque action significative (lecture, like, etc.)
 */
function checkAchievements() {
    const authorCount = Object.keys(state.authorStats).length;
    const readCount = state.readCount || 0;
    const likeCount = state.likes?.size || 0;
    const hour = new Date().getHours();
    
    const checks = [
        ['first_read', readCount >= 1],
        ['explorer_5', authorCount >= 5],
        ['explorer_15', authorCount >= 15],
        ['explorer_30', authorCount >= 30],
        ['night_owl', hour >= 0 && hour < 5],
        ['love_10', likeCount >= 10],
        ['marathon', readCount >= 25],
        ['mystique', (state.genreStats?.mystique || 0) >= 5],
        ['hidden_gem', HIDDEN_GEMS.some(a => state.authorStats[a])],
        ['poete_maudit', !!state.authorStats['Comte de Lautréamont']],
        ['symbolist', state.authorStats['Stéphane Mallarmé'] && state.authorStats['Paul Verlaine']]
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
    
    // Notification spéciale animée
    const notif = document.createElement('div');
    notif.className = 'achievement-popup';
    notif.innerHTML = `
        <div class="achievement-icon">${ach.icon}</div>
        <div class="achievement-info">
            <div class="achievement-title">🏆 Badge débloqué !</div>
            <div class="achievement-name">${ach.name}</div>
            <div class="achievement-desc">${ach.desc}</div>
        </div>
    `;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.classList.add('show'), 100);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 500);
    }, 4000);
    
    renderAchievements();
}

// ═══════════════════════════════════════════════════════════
// 🎨 AFFICHAGE DES BADGES
// ═══════════════════════════════════════════════════════════

/**
 * Affiche tous les badges avec leur état et progression
 * Mis à jour dans le panneau des achievements
 */
function renderAchievements() {
    const container = document.getElementById('achievementList');
    if (!container) return;
    
    const authorCount = Object.keys(state.authorStats).length;
    const readCount = state.readCount || 0;
    const likeCount = state.likes?.size || 0;
    const mystiqueCount = state.genreStats?.mystique || 0;
    
    // Définir la progression pour chaque badge
    const badgeProgress = {
        first_read: { 
            current: Math.min(readCount, 1), 
            target: 1, 
            text: readCount >= 1 ? 'Complété !' : `${readCount}/1 texte lu` 
        },
        explorer_5: { 
            current: Math.min(authorCount, 5), 
            target: 5, 
            text: authorCount >= 5 ? 'Complété !' : `${authorCount}/5 auteurs découverts` 
        },
        explorer_15: { 
            current: Math.min(authorCount, 15), 
            target: 15, 
            text: authorCount >= 15 ? 'Complété !' : `${authorCount}/15 auteurs découverts` 
        },
        explorer_30: { 
            current: Math.min(authorCount, 30), 
            target: 30, 
            text: authorCount >= 30 ? 'Complété !' : `${authorCount}/30 auteurs découverts` 
        },
        night_owl: { 
            current: 0, 
            target: 1, 
            text: 'Lisez entre minuit et 5h du matin', 
            special: true 
        },
        century_jump: { 
            current: 0, 
            target: 1, 
            text: 'Passez du XIXe au XVIe siècle', 
            special: true 
        },
        hidden_gem: { 
            current: HIDDEN_GEMS.some(a => state.authorStats[a]) ? 1 : 0, 
            target: 1, 
            text: HIDDEN_GEMS.some(a => state.authorStats[a]) ? 'Complété !' : 'Trouvez un auteur secret caché' 
        },
        love_10: { 
            current: Math.min(likeCount, 10), 
            target: 10, 
            text: likeCount >= 10 ? 'Complété !' : `${likeCount}/10 textes aimés` 
        },
        marathon: { 
            current: Math.min(readCount, 25), 
            target: 25, 
            text: readCount >= 25 ? 'Complété !' : `${readCount}/25 textes lus d'affilée` 
        },
        mystique: { 
            current: Math.min(mystiqueCount, 5), 
            target: 5, 
            text: mystiqueCount >= 5 ? 'Complété !' : `${mystiqueCount}/5 textes mystiques explorés` 
        },
        poete_maudit: { 
            current: state.authorStats['Comte de Lautréamont'] ? 1 : 0, 
            target: 1, 
            text: state.authorStats['Comte de Lautréamont'] ? 'Complété !' : 'Découvrez Lautréamont' 
        },
        renaissance: { 
            current: 0, 
            target: 3, 
            text: 'Lisez 3 auteurs du XVIe siècle', 
            special: true 
        },
        symbolist: { 
            current: (state.authorStats['Stéphane Mallarmé'] ? 1 : 0) + (state.authorStats['Paul Verlaine'] ? 1 : 0), 
            target: 2, 
            text: `Découvrez Mallarmé ${state.authorStats['Stéphane Mallarmé'] ? '✓' : '○'} et Verlaine ${state.authorStats['Paul Verlaine'] ? '✓' : '○'}` 
        }
    };
    
    const unlockedCount = state.achievements.length;
    const totalBadges = Object.keys(ACHIEVEMENTS).length;
    
    // Mettre à jour le compteur
    const unlockedEl = document.getElementById('unlockedCount');
    const totalEl = document.getElementById('totalBadges');
    if (unlockedEl) unlockedEl.textContent = unlockedCount;
    if (totalEl) totalEl.textContent = totalBadges;
    
    container.innerHTML = Object.entries(ACHIEVEMENTS).map(([id, ach]) => {
        const unlocked = state.achievements.includes(id);
        const progress = badgeProgress[id] || { current: 0, target: 1, text: ach.desc };
        const percent = Math.min(100, Math.round((progress.current / progress.target) * 100));
        
        return `
            <div class="achievement ${unlocked ? 'unlocked' : 'locked'}" onclick="showBadgeDetails('${id}')">
                <div class="badge-icon">${ach.icon}</div>
                <div class="badge-info">
                    <div class="badge-name">
                        ${ach.name}
                        ${unlocked ? '<span class="unlocked-check">✓</span>' : ''}
                    </div>
                    <div class="badge-desc">${ach.desc}</div>
                    ${!unlocked && !progress.special ? `
                        <div class="badge-progress">
                            <div class="badge-progress-bar">
                                <div class="badge-progress-fill" style="width: ${percent}%"></div>
                            </div>
                            <div class="badge-progress-text">${progress.text}</div>
                        </div>
                    ` : !unlocked && progress.special ? `
                        <div class="badge-progress">
                            <div class="badge-progress-text">💡 ${progress.text}</div>
                        </div>
                    ` : ''}
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
