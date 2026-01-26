/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📁 EXPLORATION.JS - Module d'exploration littéraire
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Ce module gère les différents modes d'exploration de Palimpseste :
 * - Système de filtres croisés (Kaléidoscope) : Forme × Époque × Ton
 * - Ambiances de lecture (gothique, romantique, mystique, etc.)
 * - Époques littéraires (Antiquité → XXe siècle)
 * 
 * @requires app.js - state, exploreAuthor, toast
 * 
 * @version 2.0.0
 * @date 2026-01-26
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════
// 🎯 SYSTÈME DE FILTRES CROISÉS (KALÉIDOSCOPE)
// ═══════════════════════════════════════════════════════════

/**
 * État actuel des filtres
 */
const activeFilters = {
    forme: ['all'],
    epoque: ['all'],
    ton: ['all'],
    pensee: ['all']
};

/**
 * Mapping des formes vers des mots-clés de recherche et auteurs
 */
const FORMES = {
    // Poésie détaillée
    'sonnet': { keywords: ['sonnet', 'quatrain', 'tercet'], authors: ['Pierre de Ronsard', 'Joachim du Bellay', 'Charles Baudelaire', 'José-Maria de Heredia', 'Gérard de Nerval'] },
    'ode': { keywords: ['ode', 'strophe', 'chant'], authors: ['Pierre de Ronsard', 'Victor Hugo', 'Paul Claudel', 'Pindare', 'Horace'] },
    'elegie': { keywords: ['élégie', 'plainte', 'deuil', 'lamentation'], authors: ['André Chénier', 'Alphonse de Lamartine', 'Properce', 'Tibulle', 'Ovide'] },
    'ballade': { keywords: ['ballade', 'refrain', 'envoi'], authors: ['François Villon', 'Charles d\'Orléans', 'Christine de Pizan', 'Guillaume de Machaut'] },
    'hymne': { keywords: ['hymne', 'louange', 'célébration', 'gloire'], authors: ['Pierre de Ronsard', 'Victor Hugo', 'Paul Claudel', 'Pindare'] },
    'poeme-prose': { keywords: ['poème en prose', 'petit poème'], authors: ['Charles Baudelaire', 'Arthur Rimbaud', 'Aloysius Bertrand', 'Max Jacob', 'Francis Ponge'] },
    // Récits courts
    'conte': { keywords: ['conte', 'il était une fois', 'fée', 'merveilleux', 'enchanté'], authors: ['Charles Perrault', 'Madame d\'Aulnoy', 'Madame Leprince de Beaumont', 'Hans Christian Andersen'] },
    'fable': { keywords: ['fable', 'morale', 'la cigale', 'le corbeau', 'le loup'], authors: ['Jean de La Fontaine', 'Ésope', 'Phèdre', 'Florian'] },
    'legende': { keywords: ['légende', 'légendes', 'merveilleux', 'héros légendaire'], authors: ['Jacques de Voragine', 'Victor Hugo', 'Gustave Flaubert'] },
    'mythe': { keywords: ['mythe', 'dieu', 'olympe', 'titan', 'héros'], authors: ['Homère', 'Hésiode', 'Ovide', 'Apollodore'] },
    // Récits longs
    'roman': { keywords: ['roman', 'chapitre', 'partie première'], authors: ['Honoré de Balzac', 'Gustave Flaubert', 'Émile Zola', 'Stendhal', 'Victor Hugo', 'Marcel Proust'] },
    'nouvelle': { keywords: ['nouvelle', 'court récit'], authors: ['Guy de Maupassant', 'Prosper Mérimée', 'Théophile Gautier', 'Edgar Allan Poe', 'Henry James'] },
    'recit': { keywords: ['récit', 'narration', 'histoire'], authors: ['Albert Camus', 'Marguerite Duras', 'André Gide'] },
    // Théâtre détaillé
    'tragedie': { keywords: ['tragédie', 'acte', 'chœur', 'catharsis'], authors: ['Jean Racine', 'Pierre Corneille', 'Sophocle', 'Euripide', 'Eschyle'] },
    'comedie': { keywords: ['comédie', 'scène', 'rire', 'valet'], authors: ['Molière', 'Marivaux', 'Beaumarchais', 'Aristophane', 'Plaute'] },
    'drame': { keywords: ['drame', 'romantique', 'mélodrame'], authors: ['Victor Hugo', 'Alfred de Musset', 'Alexandre Dumas'] },
    // Prose d'idées
    'essai': { keywords: ['essai', 'essais', 'réflexion', 'méditation'], authors: ['Michel de Montaigne', 'Blaise Pascal', 'Jean-Jacques Rousseau', 'Albert Camus'] },
    'maxime': { keywords: ['maxime', 'sentence', 'réflexion morale'], authors: ['François de La Rochefoucauld', 'Vauvenargues', 'Chamfort'] },
    'aphorisme': { keywords: ['aphorisme', 'pensée', 'fragment'], authors: ['Blaise Pascal', 'Friedrich Nietzsche', 'La Bruyère', 'Emil Cioran'] },
    'discours': { keywords: ['discours', 'éloquence', 'oraison', 'plaidoyer', 'harangue'], authors: ['Cicéron', 'Bossuet', 'Victor Hugo', 'Jean Jaurès'] },
    'lettre': { keywords: ['lettre', 'correspondance', 'épître', 'mon cher'], authors: ['Madame de Sévigné', 'Voltaire', 'Denis Diderot', 'Gustave Flaubert'] },
    'journal': { keywords: ['journal', 'intime', 'carnet', 'ce jour'], authors: ['André Gide', 'Jules Renard', 'Stendhal', 'Benjamin Constant'] },
    'memoires': { keywords: ['mémoires', 'souvenirs', 'autobiographie'], authors: ['Saint-Simon', 'Chateaubriand', 'Simone de Beauvoir', 'Jean-Jacques Rousseau'] }
};

/**
 * Mapping des époques/courants vers des auteurs
 */
const EPOQUES_FILTER = {
    // Antiquité détaillée
    'antiquite-grecque': { period: 'Grèce antique', authors: ['Homère', 'Sophocle', 'Euripide', 'Eschyle', 'Aristophane', 'Platon', 'Aristote', 'Sappho', 'Pindare'] },
    'antiquite-romaine': { period: 'Rome antique', authors: ['Virgile', 'Ovide', 'Horace', 'Sénèque', 'Cicéron', 'Lucrèce', 'Tacite', 'Pétrone', 'Marc Aurèle'] },
    // Moyen Âge et Renaissance
    'medieval': { period: 'Moyen Âge', authors: ['Chrétien de Troyes', 'François Villon', 'Dante Alighieri', 'Marie de France', 'Rutebeuf', 'Guillaume de Lorris', 'Charles d\'Orléans'] },
    'renaissance': { period: 'Renaissance', authors: ['François Rabelais', 'Michel de Montaigne', 'Pierre de Ronsard', 'Joachim du Bellay', 'Louise Labé', 'Clément Marot', 'Maurice Scève'] },
    // XVIIe siècle
    'baroque': { period: 'Baroque', authors: ['Agrippa d\'Aubigné', 'Théophile de Viau', 'Saint-Amant', 'Tristan L\'Hermite', 'Honoré d\'Urfé'] },
    'classique': { period: 'Classicisme', authors: ['Molière', 'Jean Racine', 'Pierre Corneille', 'Jean de La Fontaine', 'Blaise Pascal', 'Madame de La Fayette', 'Nicolas Boileau', 'La Bruyère'] },
    // XVIIIe siècle
    'lumieres': { period: 'Lumières', authors: ['Voltaire', 'Jean-Jacques Rousseau', 'Denis Diderot', 'Montesquieu', 'Beaumarchais', 'Marivaux', 'L\'Abbé Prévost', 'Choderlos de Laclos'] },
    // XIXe siècle détaillé
    'romantisme': { period: 'Romantisme', authors: ['Victor Hugo', 'Alphonse de Lamartine', 'Alfred de Musset', 'Alfred de Vigny', 'Gérard de Nerval', 'Chateaubriand', 'George Sand'] },
    'realisme': { period: 'Réalisme', authors: ['Honoré de Balzac', 'Gustave Flaubert', 'Stendhal', 'Prosper Mérimée'] },
    'naturalisme': { period: 'Naturalisme', authors: ['Émile Zola', 'Guy de Maupassant', 'Alphonse Daudet', 'Edmond de Goncourt', 'Jules de Goncourt'] },
    'symbolisme': { period: 'Symbolisme', authors: ['Charles Baudelaire', 'Stéphane Mallarmé', 'Paul Verlaine', 'Arthur Rimbaud', 'Gustave Kahn', 'Jean Moréas'] },
    'decadentisme': { period: 'Décadentisme', authors: ['Joris-Karl Huysmans', 'Jean Lorrain', 'Rachilde', 'Villiers de l\'Isle-Adam', 'Jules Barbey d\'Aurevilly'] },
    // XXe siècle détaillé
    'surrealisme': { period: 'Surréalisme', authors: ['André Breton', 'Paul Éluard', 'Louis Aragon', 'Robert Desnos', 'Philippe Soupault', 'René Char', 'Antonin Artaud'] },
    'existentialisme': { period: 'Existentialisme', authors: ['Jean-Paul Sartre', 'Albert Camus', 'Simone de Beauvoir', 'Jean Genet', 'Boris Vian'] },
    'absurde': { period: 'Absurde', authors: ['Samuel Beckett', 'Eugène Ionesco', 'Arthur Adamov', 'Jean Genet'] },
    'nouveau-roman': { period: 'Nouveau roman', authors: ['Alain Robbe-Grillet', 'Nathalie Sarraute', 'Michel Butor', 'Claude Simon', 'Marguerite Duras'] }
};

/**
 * Mapping des registres/tonalités vers des mots-clés et auteurs
 */
const TONS = {
    // Lyrisme et émotion
    'lyrique': { keywords: ['amour', 'cœur', 'âme', 'sentiment', 'émotion', 'passion'], authors: ['Pierre de Ronsard', 'Alphonse de Lamartine', 'Paul Verlaine', 'Paul Éluard'] },
    'elegiaque': { keywords: ['élégie', 'plainte', 'regret', 'perte', 'deuil', 'larmes'], authors: ['André Chénier', 'Alphonse de Lamartine', 'Marceline Desbordes-Valmore'] },
    'melancolique': { keywords: ['spleen', 'ennui', 'tristesse', 'automne', 'solitude', 'nostalgie', 'vague'], authors: ['Charles Baudelaire', 'Paul Verlaine', 'Gérard de Nerval', 'Giacomo Leopardi'] },
    'tragique': { keywords: ['destin', 'fatalité', 'mort', 'sacrifice', 'héros', 'chute'], authors: ['Jean Racine', 'Sophocle', 'Pierre Corneille', 'Albert Camus'] },
    // Héroïsme
    'epique': { keywords: ['héros', 'bataille', 'gloire', 'honneur', 'guerre', 'conquête', 'exploit'], authors: ['Homère', 'Virgile', 'Le Tasse', 'Victor Hugo'] },
    'heroique': { keywords: ['héros', 'courage', 'vaillance', 'combat', 'victoire'], authors: ['Pierre Corneille', 'Victor Hugo', 'Alexandre Dumas'] },
    'chevaleresque': { keywords: ['chevalier', 'quête', 'graal', 'dame', 'honneur', 'tournoi'], authors: ['Chrétien de Troyes', 'L\'Arioste', 'Le Tasse', 'Thomas Malory'] },
    // Fantastique et imagination
    'gothique': { keywords: ['fantôme', 'spectre', 'château', 'terreur', 'nuit', 'vampire', 'mort', 'ténèbres'], authors: ['Edgar Allan Poe', 'Ann Radcliffe', 'Mary Shelley', 'Bram Stoker', 'Théophile Gautier'] },
    'fantastique': { keywords: ['étrange', 'surnaturel', 'apparition', 'mystère', 'inexplicable'], authors: ['Edgar Allan Poe', 'Guy de Maupassant', 'Théophile Gautier', 'E.T.A. Hoffmann', 'Prosper Mérimée'] },
    'onirique': { keywords: ['rêve', 'songe', 'vision', 'sommeil', 'chimère', 'illusion'], authors: ['Gérard de Nerval', 'André Breton', 'Robert Desnos', 'Lewis Carroll'] },
    'mystique': { keywords: ['âme', 'divin', 'extase', 'vision', 'lumière', 'sacré', 'éternel'], authors: ['San Juan de la Cruz', 'Sainte Thérèse d\'Avila', 'Maître Eckhart', 'William Blake', 'Rûmî'] },
    // Comique et critique
    'satirique': { keywords: ['satire', 'critique', 'moquerie', 'ridicule', 'vice'], authors: ['Voltaire', 'Molière', 'Jonathan Swift', 'La Bruyère', 'Juvénal'] },
    'ironique': { keywords: ['ironie', 'double sens', 'antiphrase', 'sous-entendu'], authors: ['Voltaire', 'Stendhal', 'Gustave Flaubert', 'Anatole France'] },
    'burlesque': { keywords: ['burlesque', 'parodie', 'grotesque', 'carnaval', 'farce'], authors: ['Paul Scarron', 'Rabelais', 'Alfred Jarry', 'Théophile Gautier'] },
    // Nature et contemplation
    'pastoral': { keywords: ['berger', 'prairie', 'fleur', 'ruisseau', 'troupeau', 'nature'], authors: ['Théocrite', 'Virgile', 'Honoré d\'Urfé', 'Francis Jammes'] },
    'bucolique': { keywords: ['campagne', 'champ', 'moisson', 'vendange', 'paysan'], authors: ['Virgile', 'George Sand', 'Jean Giono', 'Colette'] },
    'contemplatif': { keywords: ['méditation', 'silence', 'solitude', 'harmonie', 'sérénité'], authors: ['Jean-Jacques Rousseau', 'Alphonse de Lamartine', 'Francis Jammes'] },
    // Sensualité
    'erotique': { keywords: ['désir', 'volupté', 'baiser', 'caresse', 'corps', 'plaisir'], authors: ['Pierre de Ronsard', 'Ovide', 'Pierre Louÿs', 'Paul Verlaine'] },
    'libertin': { keywords: ['libertinage', 'séduction', 'plaisir', 'jouissance'], authors: ['Choderlos de Laclos', 'Marquis de Sade', 'Crébillon fils', 'Restif de la Bretonne'] }
};

/**
 * Mapping des courants de pensée/philosophie
 */
const PENSEES = {
    // Philosophie antique
    'stoicisme': { keywords: ['vertu', 'sagesse', 'raison', 'nature', 'destin', 'apathie'], authors: ['Sénèque', 'Marc Aurèle', 'Épictète', 'Cicéron'] },
    'epicurisme': { keywords: ['plaisir', 'bonheur', 'ataraxie', 'amitié', 'nature'], authors: ['Épicure', 'Lucrèce', 'Horace'] },
    'platonisme': { keywords: ['idée', 'beauté', 'vérité', 'bien', 'âme', 'caverne'], authors: ['Platon', 'Plotin', 'Marsile Ficin'] },
    'scepticisme': { keywords: ['doute', 'suspension', 'apparence', 'relativité'], authors: ['Pyrrhon', 'Sextus Empiricus', 'Montaigne'] },
    // Renaissance et âge classique
    'humanisme': { keywords: ['homme', 'éducation', 'dignité', 'liberté', 'culture'], authors: ['Michel de Montaigne', 'Érasme', 'Thomas More', 'Rabelais'] },
    'rationalisme': { keywords: ['raison', 'méthode', 'évidence', 'cogito', 'vérité'], authors: ['René Descartes', 'Baruch Spinoza', 'Nicolas Malebranche', 'Leibniz'] },
    'empirisme': { keywords: ['expérience', 'sensation', 'observation', 'connaissance'], authors: ['John Locke', 'David Hume', 'Condillac'] },
    // Philosophie moderne
    'idealisme': { keywords: ['esprit', 'conscience', 'absolu', 'dialectique'], authors: ['Emmanuel Kant', 'Hegel', 'Fichte', 'Schelling'] },
    'nihilisme': { keywords: ['néant', 'absurdité', 'valeur', 'destruction', 'surhomme'], authors: ['Friedrich Nietzsche', 'Fiodor Dostoïevski', 'Emil Cioran'] },
    'existentialisme-p': { keywords: ['existence', 'liberté', 'angoisse', 'choix', 'authenticité', 'engagement'], authors: ['Jean-Paul Sartre', 'Albert Camus', 'Simone de Beauvoir', 'Martin Heidegger', 'Søren Kierkegaard'] },
    'absurde-p': { keywords: ['absurde', 'révolte', 'Sisyphe', 'sens', 'condition humaine'], authors: ['Albert Camus', 'Samuel Beckett', 'Eugène Ionesco'] },
    // Éthique et société
    'moraliste': { keywords: ['morale', 'vertu', 'vice', 'caractère', 'nature humaine', 'passion'], authors: ['La Rochefoucauld', 'La Bruyère', 'Pascal', 'Vauvenargues', 'Chamfort'] },
    'utopie': { keywords: ['utopie', 'idéal', 'cité', 'société parfaite', 'bonheur'], authors: ['Thomas More', 'Tommaso Campanella', 'Voltaire', 'Fourier'] },
    'spiritualite': { keywords: ['âme', 'prière', 'mystique', 'foi', 'contemplation', 'Dieu'], authors: ['Blaise Pascal', 'Bossuet', 'Fénelon', 'Maître Eckhart', 'Simone Weil'] }
};

/**
 * Toggle un filtre (ajouter/retirer de la sélection)
 * @param {string} category - 'forme', 'epoque', 'ton', ou 'pensee'
 * @param {string} value - La valeur du filtre
 */
function toggleFilter(category, value) {
    // Initialiser la catégorie si elle n'existe pas
    if (!activeFilters[category]) {
        activeFilters[category] = ['all'];
    }
    
    const filters = activeFilters[category];
    
    if (value === 'all') {
        // Cliquer sur "tout" réinitialise cette catégorie
        activeFilters[category] = ['all'];
    } else {
        // Retirer 'all' si on sélectionne autre chose
        const allIndex = filters.indexOf('all');
        if (allIndex > -1) {
            filters.splice(allIndex, 1);
        }
        
        // Toggle la valeur
        const index = filters.indexOf(value);
        if (index > -1) {
            filters.splice(index, 1);
            // Si plus rien, remettre 'all'
            if (filters.length === 0) {
                filters.push('all');
            }
        } else {
            filters.push(value);
        }
    }
    
    // Mettre à jour l'UI
    updateFilterUI();
    updateFilterSummary();
}

/**
 * État des groupes ouverts
 */
const openGroups = {
    forme: null,
    epoque: null,
    ton: null,
    pensee: null
};

/**
 * Toggle l'ouverture/fermeture d'un groupe de filtres
 * @param {string} category - La catégorie (forme, epoque, ton, pensee)
 * @param {string} group - Le groupe à ouvrir/fermer
 */
function toggleFilterGroup(category, group) {
    const subchipsId = `subchips-${category}-${group}`;
    const subchips = document.getElementById(subchipsId);
    const parentBtn = document.querySelector(`.filter-parent[data-filter="${category}"][data-group="${group}"]`);
    
    // Si ce groupe est déjà ouvert, le fermer
    if (openGroups[category] === group) {
        subchips.style.display = 'none';
        parentBtn.classList.remove('expanded');
        openGroups[category] = null;
    } else {
        // Fermer l'ancien groupe ouvert de cette catégorie
        if (openGroups[category]) {
            const oldSubchips = document.getElementById(`subchips-${category}-${openGroups[category]}`);
            const oldParent = document.querySelector(`.filter-parent[data-filter="${category}"][data-group="${openGroups[category]}"]`);
            if (oldSubchips) oldSubchips.style.display = 'none';
            if (oldParent) oldParent.classList.remove('expanded');
        }
        
        // Ouvrir le nouveau groupe
        subchips.style.display = 'flex';
        parentBtn.classList.add('expanded');
        openGroups[category] = group;
    }
}

/**
 * Met à jour l'affichage des chips de filtres
 */
function updateFilterUI() {
    ['forme', 'epoque', 'ton', 'pensee'].forEach(category => {
        const chips = document.querySelectorAll(`.filter-chip[data-filter="${category}"]`);
        chips.forEach(chip => {
            const value = chip.dataset.value;
            if (value) { // Seulement les chips avec data-value (pas les parents)
                const isActive = activeFilters[category] && activeFilters[category].includes(value);
                chip.classList.toggle('active', isActive);
            }
        });
    });
}

/**
 * Met à jour le résumé des filtres actifs
 */
function updateFilterSummary() {
    const summary = document.getElementById('filterSummary');
    const summaryText = document.getElementById('filterSummaryText');
    
    const hasActiveFilters = 
        !activeFilters.forme.includes('all') ||
        !activeFilters.epoque.includes('all') ||
        !activeFilters.ton.includes('all') ||
        (activeFilters.pensee && !activeFilters.pensee.includes('all'));
    
    if (hasActiveFilters) {
        const parts = [];
        if (!activeFilters.forme.includes('all')) {
            parts.push(activeFilters.forme.join(' + '));
        }
        if (!activeFilters.epoque.includes('all')) {
            const epochs = activeFilters.epoque.map(e => EPOQUES_FILTER[e]?.period || e);
            parts.push(epochs.join(' + '));
        }
        if (!activeFilters.ton.includes('all')) {
            parts.push(activeFilters.ton.join(' + '));
        }
        if (activeFilters.pensee && !activeFilters.pensee.includes('all')) {
            parts.push(activeFilters.pensee.join(' + '));
        }
        summaryText.textContent = parts.join(' × ');
        summary.style.display = 'flex';
    } else {
        summary.style.display = 'none';
    }
}

/**
 * Efface tous les filtres
 */
function clearAllFilters() {
    activeFilters.forme = ['all'];
    activeFilters.epoque = ['all'];
    activeFilters.ton = ['all'];
    updateFilterUI();
    updateFilterSummary();
    toast('🔄 Filtres effacés');
}

/**
 * Sélectionne des filtres au hasard
 */
function randomizeFilters() {
    const formes = Object.keys(FORMES);
    const epoques = Object.keys(EPOQUES_FILTER);
    const tons = Object.keys(TONS);
    const pensees = Object.keys(PENSEES);
    
    activeFilters.forme = [formes[Math.floor(Math.random() * formes.length)]];
    activeFilters.epoque = [epoques[Math.floor(Math.random() * epoques.length)]];
    activeFilters.ton = [tons[Math.floor(Math.random() * tons.length)]];
    activeFilters.pensee = [pensees[Math.floor(Math.random() * pensees.length)]];
    
    updateFilterUI();
    updateFilterSummary();
    toast('🎲 Filtres mélangés !');
}

/**
 * Applique les filtres et lance l'exploration
 */
async function applyFilters() {
    // Collecter les auteurs et mots-clés en fonction des filtres
    let authors = [];
    let keywords = [];
    
    // Filtres de forme
    if (!activeFilters.forme.includes('all')) {
        activeFilters.forme.forEach(forme => {
            if (FORMES[forme]) {
                authors.push(...FORMES[forme].authors);
                keywords.push(...FORMES[forme].keywords);
            }
        });
    }
    
    // Filtres d'époque
    if (!activeFilters.epoque.includes('all')) {
        activeFilters.epoque.forEach(epoque => {
            if (EPOQUES_FILTER[epoque]) {
                authors.push(...EPOQUES_FILTER[epoque].authors);
            }
        });
    }
    
    // Filtres de ton
    if (!activeFilters.ton.includes('all')) {
        activeFilters.ton.forEach(ton => {
            if (TONS[ton]) {
                authors.push(...TONS[ton].authors);
                keywords.push(...TONS[ton].keywords);
            }
        });
    }
    
    // Filtres de pensée/philosophie
    if (activeFilters.pensee && !activeFilters.pensee.includes('all')) {
        activeFilters.pensee.forEach(pensee => {
            if (PENSEES[pensee]) {
                authors.push(...PENSEES[pensee].authors);
                keywords.push(...PENSEES[pensee].keywords);
            }
        });
    }
    
    // Dédupliquer
    authors = [...new Set(authors)];
    keywords = [...new Set(keywords)];
    
    // Si pas de filtres spécifiques, mode libre
    if (authors.length === 0 && keywords.length === 0) {
        const classicAuthors = ['Victor Hugo', 'Charles Baudelaire', 'Gustave Flaubert', 'Voltaire'];
        authors = classicAuthors;
    }
    
    // Effacer le feed
    const feed = document.getElementById('feed');
    if (feed) feed.innerHTML = '';
    state.loading = false;
    
    // Toast
    toast('🧭 Exploration en cours...');
    
    // Mélanger et charger
    const shuffledAuthors = [...authors].sort(() => Math.random() - 0.5);
    const shuffledKeywords = [...keywords].sort(() => Math.random() - 0.5);
    
    // Charger 2-3 auteurs
    for (const author of shuffledAuthors.slice(0, 3)) {
        await exploreAuthor(author);
    }
    
    // Et éventuellement un mot-clé
    if (shuffledKeywords.length > 0 && Math.random() > 0.5) {
        await exploreAuthor(shuffledKeywords[0]);
    }
}

/**
 * Rendu des barres de territoires dans la sidebar
 * Basé sur les textes likés/partagés (vos vrais goûts)
 */
function renderTerritoryBars() {
    const container = document.getElementById('territoryBars');
    if (!container) return;
    
    // Utiliser likedGenreStats (textes aimés) au lieu de genreStats (tous les textes vus)
    const entries = Object.entries(state.likedGenreStats || {});
    if (entries.length === 0) {
        container.innerHTML = '<div class="territory-empty">Likez des textes pour voir vos genres favoris ❤️</div>';
        return;
    }
    
    const total = entries.reduce((sum, [_, count]) => sum + count, 0);
    const sorted = entries.sort((a, b) => b[1] - a[1]).slice(0, 5);
    
    container.innerHTML = sorted.map(([genre, count]) => {
        const percent = Math.round((count / total) * 100);
        return `
            <div class="territory-bar" onclick="filterByTerritory('forme', '${genre}')" title="Explorer ${genre}">
                <span class="territory-bar-label">${genre}</span>
                <div class="territory-bar-track">
                    <div class="territory-bar-fill" style="width: ${percent}%"></div>
                </div>
                <span class="territory-bar-value">${percent}%</span>
            </div>
        `;
    }).join('');
}

/**
 * Rendu des barres d'époques dans la sidebar
 * Basé sur les auteurs des textes likés/partagés
 */
function renderEpochBars() {
    const container = document.getElementById('epochBars');
    if (!container) return;
    
    // Utiliser likedAuthorStats (textes aimés) au lieu de authorStats (tous les textes vus)
    const epochCounts = {};
    Object.entries(state.likedAuthorStats || {}).forEach(([author, count]) => {
        // Trouver l'époque de cet auteur
        for (const [epochId, epoch] of Object.entries(EPOQUES_FILTER)) {
            if (epoch.authors.some(a => a.toLowerCase().includes(author.toLowerCase()) || author.toLowerCase().includes(a.toLowerCase()))) {
                epochCounts[epoch.period] = (epochCounts[epoch.period] || 0) + count;
            }
        }
    });
    
    const entries = Object.entries(epochCounts);
    if (entries.length === 0) {
        container.innerHTML = '<div class="territory-empty">Likez des textes pour voir vos époques favorites ❤️</div>';
        return;
    }
    
    const total = entries.reduce((sum, [_, count]) => sum + count, 0);
    const sorted = entries.sort((a, b) => b[1] - a[1]).slice(0, 4);
    
    container.innerHTML = sorted.map(([epoch, count]) => {
        const percent = Math.round((count / total) * 100);
        const epochId = Object.keys(EPOQUES_FILTER).find(k => EPOQUES_FILTER[k].period === epoch) || '';
        return `
            <div class="territory-bar" onclick="filterByTerritory('epoque', '${epochId}')" title="Explorer ${epoch}">
                <span class="territory-bar-label">${epoch}</span>
                <div class="territory-bar-track">
                    <div class="territory-bar-fill" style="width: ${percent}%"></div>
                </div>
                <span class="territory-bar-value">${percent}%</span>
            </div>
        `;
    }).join('');
}

/**
 * Filtre depuis la sidebar (clic sur une barre)
 */
function filterByTerritory(category, value) {
    if (category === 'forme' && FORMES[value]) {
        activeFilters.forme = [value];
    } else if (category === 'epoque' && value) {
        activeFilters.epoque = [value];
    }
    updateFilterUI();
    updateFilterSummary();
    applyFilters();
}

// ═══════════════════════════════════════════════════════════
// 📐 RÉTRACTION AUTOMATIQUE AU SCROLL
// ═══════════════════════════════════════════════════════════

let lastScrollY = 0;
let isExplorationCollapsed = false;
let userManuallyToggled = false;

/**
 * Détecte si on est sur mobile
 */
function isMobileDevice() {
    return window.innerWidth <= 768;
}

/**
 * Gère la rétraction automatique au scroll (DÉSACTIVÉ - contrôle manuel uniquement)
 */
function handleExplorationScroll() {
    // Comportement de scroll auto désactivé
    // L'utilisateur contrôle manuellement via le bouton toggle
    return;
}

/**
 * Ferme tous les groupes de filtres ouverts
 */
function closeAllFilterGroups() {
    ['forme', 'epoque', 'ton', 'pensee'].forEach(cat => {
        if (openGroups[cat]) {
            const subchips = document.getElementById(`subchips-${cat}-${openGroups[cat]}`);
            const parentBtn = document.querySelector(`.filter-parent[data-filter="${cat}"][data-group="${openGroups[cat]}"]`);
            if (subchips) subchips.style.display = 'none';
            if (parentBtn) parentBtn.classList.remove('expanded');
            openGroups[cat] = null;
        }
    });
}

/**
 * Toggle manuel de la rétraction
 */
function toggleExplorationCollapse() {
    const container = document.getElementById('explorationContainer');
    if (!container) return;
    
    userManuallyToggled = true;
    isExplorationCollapsed = !isExplorationCollapsed;
    container.classList.toggle('collapsed', isExplorationCollapsed);
    
    // Ajouter/retirer la classe sur body pour adapter le padding du main
    document.body.classList.toggle('filters-collapsed', isExplorationCollapsed);
    
    if (isExplorationCollapsed) {
        closeAllFilterGroups();
    }
    
    // Réinitialiser après 10 secondes pour permettre le scroll auto à nouveau
    setTimeout(() => {
        userManuallyToggled = false;
    }, 10000);
}

// Attacher l'écouteur de scroll et initialiser l'état
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('scroll', handleExplorationScroll, { passive: true });
    
    // Initialiser l'état du body selon l'état des filtres
    const container = document.getElementById('explorationContainer');
    if (container && container.classList.contains('collapsed')) {
        document.body.classList.add('filters-collapsed');
        isExplorationCollapsed = true;
    }
});

// Exports globaux pour le nouveau système
window.toggleFilter = toggleFilter;
window.toggleFilterGroup = toggleFilterGroup;
window.toggleExplorationCollapse = toggleExplorationCollapse;
window.clearAllFilters = clearAllFilters;
window.randomizeFilters = randomizeFilters;
window.applyFilters = applyFilters;
window.renderTerritoryBars = renderTerritoryBars;
window.renderEpochBars = renderEpochBars;
window.filterByTerritory = filterByTerritory;
window.activeFilters = activeFilters;

// ═══════════════════════════════════════════════════════════
// 🎨 AMBIANCES DE LECTURE (conservé pour compatibilité)
// ═══════════════════════════════════════════════════════════

/**
 * Définition des ambiances thématiques de lecture
 * Chaque ambiance : name, icon, description, authors[], keywords[], color
 */
const AMBIANCES = {
    libre: {
        name: 'Dérive libre',
        icon: '๏',
        description: '',
        authors: [],
        keywords: [],
        color: '#7d8471'
    },
    gothique: {
        name: 'Gothique',
        icon: '⛧',
        description: '',
        authors: ['Edgar Allan Poe', 'Ann Radcliffe', 'Matthew Lewis', 'Horace Walpole', 'Mary Shelley', 'Bram Stoker', 'Charles Maturin', 'Sheridan Le Fanu', 'Théophile Gautier', 'Villiers de l\'Isle-Adam'],
        keywords: ['fantôme', 'spectre', 'château', 'terreur', 'nuit', 'vampire', 'mort', 'tombe', 'ténèbres', 'effroi'],
        color: '#5c5470'
    },
    surrealiste: {
        name: 'Surréaliste',
        icon: '◬',
        description: '',
        authors: ['André Breton', 'Paul Éluard', 'Robert Desnos', 'Philippe Soupault', 'Louis Aragon', 'Benjamin Péret', 'René Crevel', 'Antonin Artaud', 'Lautréamont', 'Alfred Jarry'],
        keywords: ['rêve', 'automatique', 'hasard', 'inconscient', 'merveilleux', 'étrange', 'absurde'],
        color: '#a67c52'
    },
    romantique: {
        name: 'Romantique',
        icon: '❧',
        description: '',
        authors: ['Victor Hugo', 'Alphonse de Lamartine', 'Alfred de Musset', 'Alfred de Vigny', 'Gérard de Nerval', 'François-René de Chateaubriand', 'George Sand', 'Lord Byron', 'Percy Shelley', 'John Keats'],
        keywords: ['amour', 'passion', 'coeur', 'âme', 'sentiment', 'larmes', 'désespoir', 'nature'],
        color: '#6b3a3a'
    },
    melancolie: {
        name: 'Mélancolie',
        icon: '☁︎',
        description: '',
        authors: ['Charles Baudelaire', 'Paul Verlaine', 'Jules Laforgue', 'Maurice Rollinat', 'Sully Prudhomme', 'Albert Samain', 'Francis Jammes', 'Giacomo Leopardi'],
        keywords: ['spleen', 'ennui', 'tristesse', 'automne', 'pluie', 'brume', 'solitude', 'regret', 'nostalgie'],
        color: '#635d4e'
    },
    mystique: {
        name: 'Mystique',
        icon: '⍟',
        description: '',
        authors: ['William Blake', 'Emanuel Swedenborg', 'Jakob Böhme', 'Angelus Silesius', 'San Juan de la Cruz', 'Sainte Thérèse d\'Avila', 'Maître Eckhart', 'Hildegarde de Bingen', 'Rûmî'],
        keywords: ['âme', 'divin', 'extase', 'vision', 'lumière', 'éternel', 'sacré', 'céleste', 'spirituel'],
        color: '#5c5470'
    },
    epique: {
        name: 'Épique',
        icon: '☬',
        description: '',
        authors: ['Homère', 'Virgile', 'Le Tasse', 'L\'Arioste', 'Milton', 'Camoens', 'Dante Alighieri', 'Victor Hugo'],
        keywords: ['héros', 'bataille', 'gloire', 'honneur', 'guerre', 'victoire', 'destin', 'épée', 'conquête'],
        color: '#6b3a3a'
    },
    pastoral: {
        name: 'Pastoral',
        icon: '⚘',
        description: '',
        authors: ['Théocrite', 'Virgile', 'Pierre de Ronsard', 'Joachim du Bellay', 'Maurice Scève', 'Francis Jammes', 'Jean Giono', 'Colette'],
        keywords: ['berger', 'prairie', 'champ', 'fleur', 'ruisseau', 'oiseau', 'printemps', 'nature', 'campagne'],
        color: '#7d8471'
    },
    decadent: {
        name: 'Décadent',
        icon: '♱',
        description: '',
        authors: ['Joris-Karl Huysmans', 'Jean Lorrain', 'Rachilde', 'Villiers de l\'Isle-Adam', 'Jules Barbey d\'Aurevilly', 'Oscar Wilde', 'Gabriele D\'Annunzio', 'Maurice Rollinat'],
        keywords: ['artifice', 'opium', 'décadence', 'luxe', 'pervers', 'morbide', 'exquis', 'raffiné', 'poison'],
        color: '#5c5470'
    },
    nocturne: {
        name: 'Nocturne',
        icon: '☾',
        description: '',
        authors: ['Gérard de Nerval', 'Novalis', 'Charles Baudelaire', 'Paul Verlaine', 'Rainer Maria Rilke', 'Federico García Lorca', 'E.T.A. Hoffmann', 'Aloysius Bertrand'],
        keywords: ['nuit', 'lune', 'étoiles', 'ténèbres', 'rêve', 'insomnie', 'ombre', 'silence', 'minuit'],
        color: '#201e16'
    },
    antique: {
        name: 'Antique',
        icon: '☤',
        description: '',
        authors: ['Homère', 'Sophocle', 'Euripide', 'Platon', 'Aristote', 'Virgile', 'Ovide', 'Horace', 'Sénèque', 'Marc Aurèle', 'Cicéron'],
        keywords: ['Olympe', 'dieux', 'muse', 'oracle', 'temple', 'philosophe', 'vertu', 'sagesse'],
        color: '#a67c52'
    },
    voyage: {
        name: 'Voyage',
        icon: '⚓︎',
        description: '',
        authors: ['Jules Verne', 'Pierre Loti', 'Joseph Conrad', 'Herman Melville', 'Robert Louis Stevenson', 'Jack London', 'Marco Polo', 'Ibn Battûta'],
        keywords: ['voyage', 'mer', 'île', 'horizon', 'aventure', 'découverte', 'navire', 'explorateur', 'orient'],
        color: '#7d8471'
    },
    philosophie: {
        name: 'Philosophie',
        icon: '◎',
        description: '',
        authors: ['Platon', 'Aristote', 'Montaigne', 'Blaise Pascal', 'René Descartes', 'Jean-Jacques Rousseau', 'Voltaire', 'Friedrich Nietzsche', 'Arthur Schopenhauer', 'Sénèque'],
        keywords: ['pensée', 'raison', 'vérité', 'existence', 'mort', 'liberté', 'sagesse', 'doute', 'être'],
        color: '#635d4e'
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
        icon: '☤',
        period: 'VIIIᵉ s. av. J.-C. – Vᵉ s.',
        description: '',
        authors: ['Homère', 'Sophocle', 'Euripide', 'Eschyle', 'Aristophane', 'Platon', 'Aristote', 'Virgile', 'Ovide', 'Horace', 'Sénèque', 'Marc Aurèle', 'Cicéron', 'Lucrèce', 'Apulée', 'Pétrone'],
        keywords: ['mythologie', 'olympe', 'tragédie', 'héros', 'oracle', 'destin'],
        color: '#a67c52'
    },
    medieval: {
        name: 'Moyen Âge',
        icon: '✠',
        period: 'Vᵉ – XVᵉ siècle',
        description: '',
        authors: ['Chrétien de Troyes', 'François Villon', 'Dante Alighieri', 'Boccace', 'Pétrarque', 'Guillaume de Machaut', 'Marie de France', 'Jean de Meung', 'Rutebeuf', 'Christine de Pizan'],
        keywords: ['chevalier', 'amour courtois', 'quête', 'graal', 'troubadour', 'roman'],
        color: '#635d4e'
    },
    renaissance: {
        name: 'Renaissance',
        icon: '✡',
        period: 'XVIᵉ siècle',
        description: '',
        authors: ['François Rabelais', 'Michel de Montaigne', 'Pierre de Ronsard', 'Joachim du Bellay', 'Louise Labé', 'Clément Marot', 'Agrippa d\'Aubigné', 'Étienne de La Boétie', 'Maurice Scève', 'Shakespeare'],
        keywords: ['humanisme', 'éducation', 'sonnet', 'pléiade', 'amour', 'nature'],
        color: '#a67c52'
    },
    classique: {
        name: 'Grand Siècle',
        icon: '✧',
        period: 'XVIIᵉ siècle',
        description: '',
        authors: ['Molière', 'Jean Racine', 'Pierre Corneille', 'Jean de La Fontaine', 'Blaise Pascal', 'Madame de La Fayette', 'Nicolas Boileau', 'Jean de La Bruyère', 'François de La Rochefoucauld', 'Madame de Sévigné', 'Bossuet'],
        keywords: ['honnête homme', 'bienséance', 'tragédie', 'comédie', 'fable', 'moraliste'],
        color: '#a67c52'
    },
    lumieres: {
        name: 'Lumières',
        icon: '✶',
        period: 'XVIIIᵉ siècle',
        description: '',
        authors: ['Voltaire', 'Jean-Jacques Rousseau', 'Denis Diderot', 'Montesquieu', 'Beaumarchais', 'Marivaux', 'L\'Abbé Prévost', 'Choderlos de Laclos', 'Bernardin de Saint-Pierre', 'Marquis de Sade', 'Condorcet'],
        keywords: ['raison', 'progrès', 'philosophie', 'encyclopédie', 'liberté', 'tolérance'],
        color: '#a67c52'
    },
    xixe: {
        name: 'XIXᵉ siècle',
        icon: '⚗',
        period: '1800 – 1900',
        description: '',
        authors: ['Victor Hugo', 'Honoré de Balzac', 'Gustave Flaubert', 'Émile Zola', 'Stendhal', 'Charles Baudelaire', 'Arthur Rimbaud', 'Paul Verlaine', 'Gérard de Nerval', 'Alexandre Dumas', 'Guy de Maupassant', 'Théophile Gautier'],
        keywords: ['révolution', 'passion', 'société', 'naturalisme', 'symbolisme', 'spleen'],
        color: '#635d4e'
    },
    belleepoque: {
        name: 'Belle Époque',
        icon: '❦',
        period: '1880 – 1914',
        description: '',
        authors: ['Marcel Proust', 'Colette', 'Guillaume Apollinaire', 'Paul Valéry', 'André Gide', 'Oscar Wilde', 'Rainer Maria Rilke', 'Joris-Karl Huysmans', 'Jean Lorrain', 'Maurice Maeterlinck'],
        keywords: ['salon', 'mondain', 'décadence', 'symbolisme', 'impressionnisme', 'art nouveau'],
        color: '#5c5470'
    },
    xxe: {
        name: 'XXᵉ siècle',
        icon: '☢',
        period: '1900 – 2000',
        description: '',
        authors: ['Albert Camus', 'Jean-Paul Sartre', 'Simone de Beauvoir', 'André Breton', 'Louis-Ferdinand Céline', 'Samuel Beckett', 'Marguerite Duras', 'Boris Vian', 'Marguerite Yourcenar', 'Antoine de Saint-Exupéry', 'Jean Genet'],
        keywords: ['absurde', 'existentialisme', 'surréalisme', 'engagement', 'modernité', 'guerre'],
        color: '#6b3a3a'
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
        icon: '❁',
        period: 'XVIᵉ siècle',
        description: '',
        authors: ['Michel de Montaigne', 'François Rabelais', 'Érasme', 'Thomas More', 'Étienne de La Boétie', 'Guillaume Budé'],
        keywords: ['homme', 'éducation', 'sagesse', 'vertu', 'raison', 'antiquité'],
        color: '#7d8471'
    },
    baroque: {
        name: 'Baroque',
        icon: '❀',
        period: 'Fin XVIᵉ – début XVIIᵉ',
        description: '',
        authors: ['Agrippa d\'Aubigné', 'Théophile de Viau', 'Saint-Amant', 'Tristan L\'Hermite', 'Góngora', 'Shakespeare'],
        keywords: ['inconstance', 'métamorphose', 'illusion', 'mort', 'vanité', 'spectacle'],
        color: '#5c5470'
    },
    classicisme: {
        name: 'Classicisme',
        icon: '⚖︎',
        period: 'XVIIᵉ siècle',
        description: '',
        authors: ['Molière', 'Jean Racine', 'Pierre Corneille', 'Jean de La Fontaine', 'Nicolas Boileau', 'Madame de La Fayette'],
        keywords: ['raison', 'règle', 'vraisemblance', 'bienséance', 'nature', 'universel'],
        color: '#635d4e'
    },
    romantisme: {
        name: 'Romantisme',
        icon: '❧',
        period: '1820 – 1850',
        description: '',
        authors: ['Victor Hugo', 'Alphonse de Lamartine', 'Alfred de Musset', 'Alfred de Vigny', 'Gérard de Nerval', 'François-René de Chateaubriand', 'George Sand', 'Novalis', 'Lord Byron', 'John Keats'],
        keywords: ['moi', 'passion', 'nature', 'mélancolie', 'liberté', 'génie', 'sublime'],
        color: '#6b3a3a'
    },
    realisme: {
        name: 'Réalisme',
        icon: '◉',
        period: '1850 – 1880',
        description: '',
        authors: ['Honoré de Balzac', 'Gustave Flaubert', 'Stendhal', 'Guy de Maupassant', 'Prosper Mérimée', 'Champfleury', 'Fiodor Dostoïevski', 'Léon Tolstoï'],
        keywords: ['société', 'observation', 'objectivité', 'bourgeoisie', 'argent', 'ambition'],
        color: '#635d4e'
    },
    naturalisme: {
        name: 'Naturalisme',
        icon: '⚗',
        period: '1870 – 1890',
        description: '',
        authors: ['Émile Zola', 'Guy de Maupassant', 'Alphonse Daudet', 'Edmond et Jules de Goncourt', 'Joris-Karl Huysmans'],
        keywords: ['hérédité', 'milieu', 'expérimental', 'ouvrier', 'misère', 'déterminisme'],
        color: '#3d3d3d'
    },
    symbolisme: {
        name: 'Symbolisme',
        icon: '✶',
        period: '1880 – 1900',
        description: '',
        authors: ['Charles Baudelaire', 'Stéphane Mallarmé', 'Paul Verlaine', 'Arthur Rimbaud', 'Jean Moréas', 'Gustave Kahn', 'Maurice Maeterlinck', 'Émile Verhaeren'],
        keywords: ['symbole', 'suggestion', 'musique', 'synesthésie', 'idéal', 'mystère'],
        color: '#5c5470'
    },
    surrealisme: {
        name: 'Surréalisme',
        icon: '◬',
        period: '1920 – 1960',
        description: '',
        authors: ['André Breton', 'Paul Éluard', 'Louis Aragon', 'Robert Desnos', 'Philippe Soupault', 'Benjamin Péret', 'René Crevel', 'Antonin Artaud'],
        keywords: ['rêve', 'inconscient', 'automatisme', 'hasard', 'merveilleux', 'révolution'],
        color: '#a67c52'
    },
    existentialisme: {
        name: 'Existentialisme',
        icon: '⦿',
        period: '1940 – 1960',
        description: '',
        authors: ['Jean-Paul Sartre', 'Albert Camus', 'Simone de Beauvoir', 'Jean Genet', 'Maurice Merleau-Ponty', 'Gabriel Marcel'],
        keywords: ['existence', 'liberté', 'absurde', 'engagement', 'angoisse', 'autrui'],
        color: '#212121'
    },
    absurde: {
        name: 'Absurde',
        icon: '⧖',
        period: '1950 – 1970',
        description: '',
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
        document.body.classList.remove('has-ambiance-intro');
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
        document.body.classList.add('has-ambiance-intro');
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
        document.body.classList.add('has-ambiance-intro');
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
            document.body.classList.add('has-ambiance-intro');
        } else {
            introEl.style.display = 'none';
            document.body.classList.remove('has-ambiance-intro');
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
        document.body.classList.remove('has-ambiance-intro');
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
