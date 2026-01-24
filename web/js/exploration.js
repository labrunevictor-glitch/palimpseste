/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📁 EXPLORATION.JS - Module d'exploration littéraire
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Ce module gère les différents modes d'exploration de Palimpseste :
 * - Ambiances de lecture (gothique, romantique, mystique, etc.)
 * - Époques littéraires (Antiquité → XXe siècle)
 * - Courants littéraires (humanisme, symbolisme, surréalisme, etc.)
 * 
 * @requires app.js - state, exploreAuthor, toast
 * 
 * @version 1.0.0
 * @date 2025-01-24
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════
// 🎨 AMBIANCES DE LECTURE
// ═══════════════════════════════════════════════════════════

/**
 * Définition des ambiances thématiques de lecture
 * Chaque ambiance : name, icon, description, authors[], keywords[], color
 */
const AMBIANCES = {
    libre: {
        name: 'Dérive libre',
        icon: '🌊',
        description: 'Laissez-vous porter par le hasard des textes',
        authors: [],
        keywords: [],
        color: '#64b5f6'
    },
    gothique: {
        name: 'Gothique',
        icon: '🦇',
        description: 'Châteaux hantés, spectres et terreurs nocturnes',
        authors: ['Edgar Allan Poe', 'Ann Radcliffe', 'Matthew Lewis', 'Horace Walpole', 'Mary Shelley', 'Bram Stoker', 'Charles Maturin', 'Sheridan Le Fanu', 'Théophile Gautier', 'Villiers de l\'Isle-Adam'],
        keywords: ['fantôme', 'spectre', 'château', 'terreur', 'nuit', 'vampire', 'mort', 'tombe', 'ténèbres', 'effroi'],
        color: '#6a1b9a'
    },
    surrealiste: {
        name: 'Surréaliste',
        icon: '🎭',
        description: 'L\'inconscient libéré, les rêves éveillés',
        authors: ['André Breton', 'Paul Éluard', 'Robert Desnos', 'Philippe Soupault', 'Louis Aragon', 'Benjamin Péret', 'René Crevel', 'Antonin Artaud', 'Lautréamont', 'Alfred Jarry'],
        keywords: ['rêve', 'automatique', 'hasard', 'inconscient', 'merveilleux', 'étrange', 'absurde'],
        color: '#ff6f00'
    },
    romantique: {
        name: 'Romantique',
        icon: '🌹',
        description: 'Passions intenses et âmes tourmentées',
        authors: ['Victor Hugo', 'Alphonse de Lamartine', 'Alfred de Musset', 'Alfred de Vigny', 'Gérard de Nerval', 'François-René de Chateaubriand', 'George Sand', 'Lord Byron', 'Percy Shelley', 'John Keats'],
        keywords: ['amour', 'passion', 'coeur', 'âme', 'sentiment', 'larmes', 'désespoir', 'nature'],
        color: '#e91e63'
    },
    melancolie: {
        name: 'Mélancolie',
        icon: '🌧️',
        description: 'Spleen, tristesse douce et contemplation',
        authors: ['Charles Baudelaire', 'Paul Verlaine', 'Jules Laforgue', 'Maurice Rollinat', 'Sully Prudhomme', 'Albert Samain', 'Francis Jammes', 'Giacomo Leopardi'],
        keywords: ['spleen', 'ennui', 'tristesse', 'automne', 'pluie', 'brume', 'solitude', 'regret', 'nostalgie'],
        color: '#546e7a'
    },
    mystique: {
        name: 'Mystique',
        icon: '🔮',
        description: 'Quêtes spirituelles et visions ésotériques',
        authors: ['William Blake', 'Emanuel Swedenborg', 'Jakob Böhme', 'Angelus Silesius', 'San Juan de la Cruz', 'Sainte Thérèse d\'Avila', 'Maître Eckhart', 'Hildegarde de Bingen', 'Rûmî'],
        keywords: ['âme', 'divin', 'extase', 'vision', 'lumière', 'éternel', 'sacré', 'céleste', 'spirituel'],
        color: '#7e57c2'
    },
    epique: {
        name: 'Épique',
        icon: '⚔️',
        description: 'Héros, batailles et destinées grandioses',
        authors: ['Homère', 'Virgile', 'Le Tasse', 'L\'Arioste', 'Milton', 'Camoens', 'Dante Alighieri', 'Victor Hugo'],
        keywords: ['héros', 'bataille', 'gloire', 'honneur', 'guerre', 'victoire', 'destin', 'épée', 'conquête'],
        color: '#d32f2f'
    },
    pastoral: {
        name: 'Pastoral',
        icon: '🌾',
        description: 'Campagnes idylliques et nature apaisante',
        authors: ['Théocrite', 'Virgile', 'Pierre de Ronsard', 'Joachim du Bellay', 'Maurice Scève', 'Francis Jammes', 'Jean Giono', 'Colette'],
        keywords: ['berger', 'prairie', 'champ', 'fleur', 'ruisseau', 'oiseau', 'printemps', 'nature', 'campagne'],
        color: '#66bb6a'
    },
    decadent: {
        name: 'Décadent',
        icon: '💀',
        description: 'Fin de siècle, artifice et beauté morbide',
        authors: ['Joris-Karl Huysmans', 'Jean Lorrain', 'Rachilde', 'Villiers de l\'Isle-Adam', 'Jules Barbey d\'Aurevilly', 'Oscar Wilde', 'Gabriele D\'Annunzio', 'Maurice Rollinat'],
        keywords: ['artifice', 'opium', 'décadence', 'luxe', 'pervers', 'morbide', 'exquis', 'raffiné', 'poison'],
        color: '#4a148c'
    },
    nocturne: {
        name: 'Nocturne',
        icon: '🌙',
        description: 'Nuits blanches, insomnies et rêveries lunaires',
        authors: ['Gérard de Nerval', 'Novalis', 'Charles Baudelaire', 'Paul Verlaine', 'Rainer Maria Rilke', 'Federico García Lorca', 'E.T.A. Hoffmann', 'Aloysius Bertrand'],
        keywords: ['nuit', 'lune', 'étoiles', 'ténèbres', 'rêve', 'insomnie', 'ombre', 'silence', 'minuit'],
        color: '#1a237e'
    },
    antique: {
        name: 'Antique',
        icon: '🏛️',
        description: 'Sagesse grecque et grandeur romaine',
        authors: ['Homère', 'Sophocle', 'Euripide', 'Platon', 'Aristote', 'Virgile', 'Ovide', 'Horace', 'Sénèque', 'Marc Aurèle', 'Cicéron'],
        keywords: ['Olympe', 'dieux', 'muse', 'oracle', 'temple', 'philosophe', 'vertu', 'sagesse'],
        color: '#8d6e63'
    },
    voyage: {
        name: 'Voyage',
        icon: '🚢',
        description: 'Horizons lointains et découvertes',
        authors: ['Jules Verne', 'Pierre Loti', 'Joseph Conrad', 'Herman Melville', 'Robert Louis Stevenson', 'Jack London', 'Marco Polo', 'Ibn Battûta'],
        keywords: ['voyage', 'mer', 'île', 'horizon', 'aventure', 'découverte', 'navire', 'explorateur', 'orient'],
        color: '#0288d1'
    },
    philosophie: {
        name: 'Philosophie',
        icon: '🧠',
        description: 'Méditations sur l\'existence et la pensée',
        authors: ['Platon', 'Aristote', 'Montaigne', 'Blaise Pascal', 'René Descartes', 'Jean-Jacques Rousseau', 'Voltaire', 'Friedrich Nietzsche', 'Arthur Schopenhauer', 'Sénèque'],
        keywords: ['pensée', 'raison', 'vérité', 'existence', 'mort', 'liberté', 'sagesse', 'doute', 'être'],
        color: '#455a64'
    }
};

// ═══════════════════════════════════════════════════════════
// 📜 ÉPOQUES LITTÉRAIRES
// ═══════════════════════════════════════════════════════════

/**
 * Définition des grandes époques de l'histoire littéraire
 * Chaque époque : name, icon, period, description, authors[], keywords[], color
 */
const EPOQUES = {
    antiquite: {
        name: 'Antiquité',
        icon: '🏺',
        period: 'VIIIᵉ s. av. J.-C. – Vᵉ s.',
        description: 'L\'aube de la littérature : épopées, tragédies et sagesse des anciens',
        authors: ['Homère', 'Sophocle', 'Euripide', 'Eschyle', 'Aristophane', 'Platon', 'Aristote', 'Virgile', 'Ovide', 'Horace', 'Sénèque', 'Marc Aurèle', 'Cicéron', 'Lucrèce', 'Apulée', 'Pétrone'],
        keywords: ['mythologie', 'olympe', 'tragédie', 'héros', 'oracle', 'destin'],
        color: '#8d6e63'
    },
    medieval: {
        name: 'Moyen Âge',
        icon: '⚔️',
        period: 'Vᵉ – XVᵉ siècle',
        description: 'Chevaliers, troubadours et enluminures',
        authors: ['Chrétien de Troyes', 'François Villon', 'Dante Alighieri', 'Boccace', 'Pétrarque', 'Guillaume de Machaut', 'Marie de France', 'Jean de Meung', 'Rutebeuf', 'Christine de Pizan'],
        keywords: ['chevalier', 'amour courtois', 'quête', 'graal', 'troubadour', 'roman'],
        color: '#5d4037'
    },
    renaissance: {
        name: 'Renaissance',
        icon: '🎨',
        period: 'XVIᵉ siècle',
        description: 'Humanisme, redécouverte antique et soif de savoir',
        authors: ['François Rabelais', 'Michel de Montaigne', 'Pierre de Ronsard', 'Joachim du Bellay', 'Louise Labé', 'Clément Marot', 'Agrippa d\'Aubigné', 'Étienne de La Boétie', 'Maurice Scève', 'Shakespeare'],
        keywords: ['humanisme', 'éducation', 'sonnet', 'pléiade', 'amour', 'nature'],
        color: '#ff8f00'
    },
    classique: {
        name: 'Grand Siècle',
        icon: '👑',
        period: 'XVIIᵉ siècle',
        description: 'L\'âge d\'or français : raison, mesure et passions tragiques',
        authors: ['Molière', 'Jean Racine', 'Pierre Corneille', 'Jean de La Fontaine', 'Blaise Pascal', 'Madame de La Fayette', 'Nicolas Boileau', 'Jean de La Bruyère', 'François de La Rochefoucauld', 'Madame de Sévigné', 'Bossuet'],
        keywords: ['honnête homme', 'bienséance', 'tragédie', 'comédie', 'fable', 'moraliste'],
        color: '#ffd700'
    },
    lumieres: {
        name: 'Lumières',
        icon: '💡',
        period: 'XVIIIᵉ siècle',
        description: 'Raison critique, esprit philosophique et émancipation',
        authors: ['Voltaire', 'Jean-Jacques Rousseau', 'Denis Diderot', 'Montesquieu', 'Beaumarchais', 'Marivaux', 'L\'Abbé Prévost', 'Choderlos de Laclos', 'Bernardin de Saint-Pierre', 'Marquis de Sade', 'Condorcet'],
        keywords: ['raison', 'progrès', 'philosophie', 'encyclopédie', 'liberté', 'tolérance'],
        color: '#ffeb3b'
    },
    xixe: {
        name: 'XIXᵉ siècle',
        icon: '🏭',
        period: '1800 – 1900',
        description: 'Le siècle des révolutions : romantisme, réalisme, décadence',
        authors: ['Victor Hugo', 'Honoré de Balzac', 'Gustave Flaubert', 'Émile Zola', 'Stendhal', 'Charles Baudelaire', 'Arthur Rimbaud', 'Paul Verlaine', 'Gérard de Nerval', 'Alexandre Dumas', 'Guy de Maupassant', 'Théophile Gautier'],
        keywords: ['révolution', 'passion', 'société', 'naturalisme', 'symbolisme', 'spleen'],
        color: '#795548'
    },
    belleepoque: {
        name: 'Belle Époque',
        icon: '🎭',
        period: '1880 – 1914',
        description: 'Fêtes galantes, décadence et avant-gardes naissantes',
        authors: ['Marcel Proust', 'Colette', 'Guillaume Apollinaire', 'Paul Valéry', 'André Gide', 'Oscar Wilde', 'Rainer Maria Rilke', 'Joris-Karl Huysmans', 'Jean Lorrain', 'Maurice Maeterlinck'],
        keywords: ['salon', 'mondain', 'décadence', 'symbolisme', 'impressionnisme', 'art nouveau'],
        color: '#e91e63'
    },
    xxe: {
        name: 'XXᵉ siècle',
        icon: '💣',
        period: '1900 – 2000',
        description: 'Guerres, existentialisme et révolutions littéraires',
        authors: ['Albert Camus', 'Jean-Paul Sartre', 'Simone de Beauvoir', 'André Breton', 'Louis-Ferdinand Céline', 'Samuel Beckett', 'Marguerite Duras', 'Boris Vian', 'Marguerite Yourcenar', 'Antoine de Saint-Exupéry', 'Jean Genet'],
        keywords: ['absurde', 'existentialisme', 'surréalisme', 'engagement', 'modernité', 'guerre'],
        color: '#f44336'
    }
};

// ═══════════════════════════════════════════════════════════
// 🏛️ COURANTS LITTÉRAIRES
// ═══════════════════════════════════════════════════════════

/**
 * Définition des grands courants/mouvements littéraires
 * Chaque courant : name, icon, period, description, authors[], keywords[], color
 */
const COURANTS = {
    humanisme: {
        name: 'Humanisme',
        icon: '📚',
        period: 'XVIᵉ siècle',
        description: 'Foi en l\'homme, éducation et sagesse antique retrouvée',
        authors: ['Michel de Montaigne', 'François Rabelais', 'Érasme', 'Thomas More', 'Étienne de La Boétie', 'Guillaume Budé'],
        keywords: ['homme', 'éducation', 'sagesse', 'vertu', 'raison', 'antiquité'],
        color: '#4caf50'
    },
    baroque: {
        name: 'Baroque',
        icon: '🎭',
        period: 'Fin XVIᵉ – début XVIIᵉ',
        description: 'Mouvement, illusion et vanité du monde',
        authors: ['Agrippa d\'Aubigné', 'Théophile de Viau', 'Saint-Amant', 'Tristan L\'Hermite', 'Góngora', 'Shakespeare'],
        keywords: ['inconstance', 'métamorphose', 'illusion', 'mort', 'vanité', 'spectacle'],
        color: '#9c27b0'
    },
    classicisme: {
        name: 'Classicisme',
        icon: '⚖️',
        period: 'XVIIᵉ siècle',
        description: 'Raison, équilibre et imitation des Anciens',
        authors: ['Molière', 'Jean Racine', 'Pierre Corneille', 'Jean de La Fontaine', 'Nicolas Boileau', 'Madame de La Fayette'],
        keywords: ['raison', 'règle', 'vraisemblance', 'bienséance', 'nature', 'universel'],
        color: '#607d8b'
    },
    romantisme: {
        name: 'Romantisme',
        icon: '🌹',
        period: '1820 – 1850',
        description: 'Exaltation du moi, passion et communion avec la nature',
        authors: ['Victor Hugo', 'Alphonse de Lamartine', 'Alfred de Musset', 'Alfred de Vigny', 'Gérard de Nerval', 'François-René de Chateaubriand', 'George Sand', 'Novalis', 'Lord Byron', 'John Keats'],
        keywords: ['moi', 'passion', 'nature', 'mélancolie', 'liberté', 'génie', 'sublime'],
        color: '#e91e63'
    },
    realisme: {
        name: 'Réalisme',
        icon: '🔬',
        period: '1850 – 1880',
        description: 'Peinture fidèle de la société et des moeurs',
        authors: ['Honoré de Balzac', 'Gustave Flaubert', 'Stendhal', 'Guy de Maupassant', 'Prosper Mérimée', 'Champfleury', 'Fiodor Dostoïevski', 'Léon Tolstoï'],
        keywords: ['société', 'observation', 'objectivité', 'bourgeoisie', 'argent', 'ambition'],
        color: '#795548'
    },
    naturalisme: {
        name: 'Naturalisme',
        icon: '🏭',
        period: '1870 – 1890',
        description: 'Roman expérimental et déterminisme social',
        authors: ['Émile Zola', 'Guy de Maupassant', 'Alphonse Daudet', 'Edmond et Jules de Goncourt', 'Joris-Karl Huysmans'],
        keywords: ['hérédité', 'milieu', 'expérimental', 'ouvrier', 'misère', 'déterminisme'],
        color: '#3e2723'
    },
    symbolisme: {
        name: 'Symbolisme',
        icon: '🌸',
        period: '1880 – 1900',
        description: 'Musique des mots, symboles et correspondances secrètes',
        authors: ['Charles Baudelaire', 'Stéphane Mallarmé', 'Paul Verlaine', 'Arthur Rimbaud', 'Jean Moréas', 'Gustave Kahn', 'Maurice Maeterlinck', 'Émile Verhaeren'],
        keywords: ['symbole', 'suggestion', 'musique', 'synesthésie', 'idéal', 'mystère'],
        color: '#7b1fa2'
    },
    surrealisme: {
        name: 'Surréalisme',
        icon: '👁️',
        period: '1920 – 1960',
        description: 'Libération de l\'inconscient et automatisme psychique',
        authors: ['André Breton', 'Paul Éluard', 'Louis Aragon', 'Robert Desnos', 'Philippe Soupault', 'Benjamin Péret', 'René Crevel', 'Antonin Artaud'],
        keywords: ['rêve', 'inconscient', 'automatisme', 'hasard', 'merveilleux', 'révolution'],
        color: '#ff5722'
    },
    existentialisme: {
        name: 'Existentialisme',
        icon: '🚬',
        period: '1940 – 1960',
        description: 'L\'existence précède l\'essence, liberté et engagement',
        authors: ['Jean-Paul Sartre', 'Albert Camus', 'Simone de Beauvoir', 'Jean Genet', 'Maurice Merleau-Ponty', 'Gabriel Marcel'],
        keywords: ['existence', 'liberté', 'absurde', 'engagement', 'angoisse', 'autrui'],
        color: '#212121'
    },
    absurde: {
        name: 'Absurde',
        icon: '🎪',
        period: '1950 – 1970',
        description: 'Théâtre de l\'incommunicabilité et du non-sens',
        authors: ['Samuel Beckett', 'Eugène Ionesco', 'Jean Genet', 'Arthur Adamov', 'Harold Pinter', 'Fernando Arrabal'],
        keywords: ['absurde', 'attente', 'langage', 'vide', 'dérision', 'tragique'],
        color: '#424242'
    }
};

// ═══════════════════════════════════════════════════════════
// 🔧 ÉTAT DE L'EXPLORATION
// ═══════════════════════════════════════════════════════════

/** Ambiance de lecture courante */
let currentAmbiance = 'libre';

/** Mode d'exploration courant : 'derives', 'epoques', 'courants' */
let currentExplorationMode = 'derives';

// ═══════════════════════════════════════════════════════════
// 🔄 NAVIGATION ENTRE MODES D'EXPLORATION
// ═══════════════════════════════════════════════════════════

/**
 * Change le mode d'exploration (Dérives / Époques / Courants)
 * @param {string} mode - 'derives', 'epoques', ou 'courants'
 */
function switchExplorationMode(mode) {
    currentExplorationMode = mode;
    
    // Mettre à jour les onglets
    document.querySelectorAll('.exploration-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    
    // Afficher la bonne barre
    const ambianceBar = document.getElementById('ambianceBar');
    const epoquesBar = document.getElementById('epoquesBar');
    const courantsBar = document.getElementById('courantsBar');
    
    if (ambianceBar) ambianceBar.style.display = mode === 'derives' ? 'flex' : 'none';
    if (epoquesBar) epoquesBar.style.display = mode === 'epoques' ? 'flex' : 'none';
    if (courantsBar) courantsBar.style.display = mode === 'courants' ? 'flex' : 'none';
    
    // Réinitialiser les sélections
    document.querySelectorAll('.ambiance-pill').forEach(pill => pill.classList.remove('active'));
    if (mode === 'derives') {
        document.querySelector('[data-ambiance="libre"]')?.classList.add('active');
    }
    
    // Cacher l'intro
    const introEl = document.getElementById('ambianceIntro');
    if (introEl) {
        introEl.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════
// 📜 SÉLECTION D'UNE ÉPOQUE
// ═══════════════════════════════════════════════════════════

/**
 * Sélectionne une époque littéraire et charge ses auteurs
 * @param {string} epoqueId - Identifiant de l'époque
 */
async function setEpoque(epoqueId) {
    const epoque = EPOQUES[epoqueId];
    if (!epoque) return;
    
    // Mettre à jour l'UI
    document.querySelectorAll('#epoquesBar .ambiance-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.ambiance === epoqueId);
    });
    
    // Afficher l'intro
    const introEl = document.getElementById('ambianceIntro');
    if (introEl) {
        introEl.innerHTML = `
            <button class="close-intro" onclick="closeAmbianceIntro()" title="Fermer">✕</button>
            <h2>${epoque.icon} ${epoque.name}</h2>
            <p class="period-badge">${epoque.period}</p>
            <p>${epoque.description}</p>
            <div class="ambiance-tags">
                ${epoque.authors.slice(0, 6).map(a => `<span class="ambiance-tag" onclick="exploreFromAmbiance('${a.replace(/'/g, "\\'")}')" title="Explorer ${a}">${a}</span>`).join('')}
                ${epoque.authors.length > 6 ? `<span class="ambiance-tag more-authors" title="${epoque.authors.slice(6).join(', ')}">+${epoque.authors.length - 6}</span>` : ''}
            </div>
        `;
        introEl.style.display = 'block';
    }
    
    // Effacer et recharger
    const feed = document.getElementById('feed');
    if (feed) feed.innerHTML = '';
    state.loading = false;
    
    toast(`${epoque.icon} ${epoque.name} – ${epoque.period}`);
    
    // Charger des auteurs de cette époque
    const shuffled = [...epoque.authors].sort(() => Math.random() - 0.5);
    for (const author of shuffled.slice(0, 3)) {
        await exploreAuthor(author);
    }
}

// ═══════════════════════════════════════════════════════════
// 🏛️ SÉLECTION D'UN COURANT
// ═══════════════════════════════════════════════════════════

/**
 * Sélectionne un courant littéraire et charge ses auteurs
 * @param {string} courantId - Identifiant du courant
 */
async function setCourant(courantId) {
    const courant = COURANTS[courantId];
    if (!courant) return;
    
    // Mettre à jour l'UI
    document.querySelectorAll('#courantsBar .ambiance-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.ambiance === courantId);
    });
    
    // Afficher l'intro
    const introEl = document.getElementById('ambianceIntro');
    if (introEl) {
        introEl.innerHTML = `
            <button class="close-intro" onclick="closeAmbianceIntro()" title="Fermer">✕</button>
            <h2>${courant.icon} ${courant.name}</h2>
            <p class="period-badge">${courant.period}</p>
            <p>${courant.description}</p>
            <div class="ambiance-tags">
                ${courant.authors.slice(0, 6).map(a => `<span class="ambiance-tag" onclick="exploreFromAmbiance('${a.replace(/'/g, "\\'")}')" title="Explorer ${a}">${a}</span>`).join('')}
                ${courant.authors.length > 6 ? `<span class="ambiance-tag more-authors" title="${courant.authors.slice(6).join(', ')}">+${courant.authors.length - 6}</span>` : ''}
            </div>
        `;
        introEl.style.display = 'block';
    }
    
    // Effacer et recharger
    const feed = document.getElementById('feed');
    if (feed) feed.innerHTML = '';
    state.loading = false;
    
    toast(`${courant.icon} ${courant.name}`);
    
    // Charger des auteurs de ce courant
    const shuffled = [...courant.authors].sort(() => Math.random() - 0.5);
    for (const author of shuffled.slice(0, 3)) {
        await exploreAuthor(author);
    }
}

// ═══════════════════════════════════════════════════════════
// 🎨 SÉLECTION D'UNE AMBIANCE
// ═══════════════════════════════════════════════════════════

/**
 * Change l'ambiance de lecture courante
 * @param {string} ambianceId - Identifiant de l'ambiance
 */
async function setAmbiance(ambianceId) {
    const ambiance = AMBIANCES[ambianceId];
    if (!ambiance) return;
    
    currentAmbiance = ambianceId;
    
    // Mettre à jour l'UI
    document.querySelectorAll('#ambianceBar .ambiance-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.ambiance === ambianceId);
    });
    
    // Afficher l'intro si ce n'est pas "libre"
    const introEl = document.getElementById('ambianceIntro');
    const mainEl = document.getElementById('feed');
    if (introEl) {
        if (ambianceId !== 'libre') {
            introEl.innerHTML = `
                <button class="close-intro" onclick="closeAmbianceIntro()" title="Fermer">✕</button>
                <h2>${ambiance.icon} ${ambiance.name}</h2>
                <p>${ambiance.description}</p>
                <div class="ambiance-tags">
                    ${ambiance.authors.slice(0, 5).map(a => `<span class="ambiance-tag" onclick="exploreFromAmbiance('${a.replace(/'/g, "\\'")}')" title="Explorer ${a}">${a}</span>`).join('')}
                    ${ambiance.authors.length > 5 ? `<span class="ambiance-tag more-authors" title="${ambiance.authors.slice(5).join(', ')}">+${ambiance.authors.length - 5} auteurs</span>` : ''}
                </div>
            `;
            introEl.style.display = 'block';
        } else {
            introEl.style.display = 'none';
        }
    }
    
    // Effacer le feed et recharger avec la nouvelle ambiance
    const feed = document.getElementById('feed');
    if (feed) feed.innerHTML = '';
    state.loading = false;
    
    // Toast
    toast(`${ambiance.icon} Mode ${ambiance.name} activé`);
    
    // Charger les textes de cette ambiance
    await loadAmbianceContent(ambianceId);
}

// ═══════════════════════════════════════════════════════════
// 🔧 FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════

/**
 * Ferme l'encart d'introduction d'ambiance/époque/courant
 */
function closeAmbianceIntro() {
    const introEl = document.getElementById('ambianceIntro');
    if (introEl) {
        introEl.style.display = 'none';
    }
}

/**
 * Explore un auteur depuis l'encart d'ambiance
 * @param {string} author - Nom de l'auteur à explorer
 */
async function exploreFromAmbiance(author) {
    toast(`🔍 Exploration de ${author}...`);
    await exploreAuthor(author);
}

/**
 * Charge le contenu correspondant à une ambiance
 * @param {string} ambianceId - Identifiant de l'ambiance
 */
async function loadAmbianceContent(ambianceId) {
    const ambiance = AMBIANCES[ambianceId];
    
    // Auteurs classiques par défaut
    const classicAuthors = ['Victor Hugo', 'Charles Baudelaire', 'Gustave Flaubert', 'Marcel Proust', 'Stendhal', 'Voltaire'];
    
    if (ambianceId === 'libre' || !ambiance.authors.length) {
        // Mode libre : utiliser un auteur classique au hasard
        await exploreAuthor(classicAuthors[Math.floor(Math.random() * classicAuthors.length)]);
        return;
    }
    
    // Choisir des auteurs/mots-clés de l'ambiance au hasard
    const shuffledAuthors = [...ambiance.authors].sort(() => Math.random() - 0.5);
    const shuffledKeywords = [...ambiance.keywords].sort(() => Math.random() - 0.5);
    
    // Charger 2-3 auteurs + 1-2 mots-clés pour variété
    const toLoad = [
        ...shuffledAuthors.slice(0, 2),
        ...shuffledKeywords.slice(0, 1)
    ];
    
    for (const term of toLoad) {
        await exploreAuthor(term);
    }
}

// ═══════════════════════════════════════════════════════════
// 📤 EXPORTS GLOBAUX
// ═══════════════════════════════════════════════════════════

// Constantes exportées (accessibles globalement)
window.AMBIANCES = AMBIANCES;
window.EPOQUES = EPOQUES;
window.COURANTS = COURANTS;

// Variables d'état exportées (accessibles globalement via getters/setters)
window.getCurrentAmbiance = () => currentAmbiance;
window.setCurrentAmbiance = (val) => { currentAmbiance = val; };
window.getCurrentExplorationMode = () => currentExplorationMode;

// Fonctions exportées (accessibles globalement)
window.switchExplorationMode = switchExplorationMode;
window.setEpoque = setEpoque;
window.setCourant = setCourant;
window.setAmbiance = setAmbiance;
window.closeAmbianceIntro = closeAmbianceIntro;
window.exploreFromAmbiance = exploreFromAmbiance;
window.loadAmbianceContent = loadAmbianceContent;
