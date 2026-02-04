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
    pensee: ['all'],
    source: ['all']
};

/**
 * Groupe de sous-filtres ouverts par catégorie
 */
const openGroups = {
    forme: null,
    epoque: null,
    ton: null,
    pensee: null,
    source: null
};

/**
 * Mapping des formes vers des mots-clés de recherche et auteurs
 */
const FORMES = {
    // Catégories Générales (Recherche large)
    'category-poesie': { keywords: ['poésie', 'poème', 'vers', 'rime', 'strophe', 'lyrique', 'chanter'] },
    'category-recit': { keywords: ['récit', 'histoire', 'narration', 'fiction', 'roman', 'conte', 'légende'] },
    'category-theatre': { keywords: ['théâtre', 'pièce', 'scène', 'dramatique', 'acte', 'dialogue'] },
    'category-idees': { keywords: ['essai', 'pensée', 'réflexion', 'philosophie', 'mémoire', 'moraliste'] },

    // Poésie détaillée
    'sonnet': { keywords: ['sonnet', 'quatrain', 'tercet'] },
    'ode': { keywords: ['ode', 'strophe', 'chant'] },
    'elegie': { keywords: ['élégie', 'plainte', 'deuil', 'lamentation'] },
    'ballade': { keywords: ['ballade', 'refrain', 'envoi'] },
    'hymne': { keywords: ['hymne', 'louange', 'célébration', 'gloire'] },
    'poeme-prose': { keywords: ['poème en prose', 'petit poème'] },
    // Récits courts
    'conte': { keywords: ['conte', 'il était une fois', 'fée', 'merveilleux', 'enchanté'] },
    'fable': { keywords: ['fable', 'morale', 'la cigale', 'le corbeau', 'le loup'] },
    'legende': { keywords: ['légende', 'légendes', 'merveilleux', 'héros légendaire'] },
    'mythe': { keywords: ['mythe', 'dieu', 'olympe', 'titan', 'héros'] },
    // Récits longs
    'roman': { keywords: ['roman', 'chapitre', 'partie première'] },
    'nouvelle': { keywords: ['nouvelle', 'court récit'] },
    'recit': { keywords: ['récit', 'narration', 'histoire'] },
    // Théâtre détaillé
    'tragedie': { keywords: ['tragédie', 'acte', 'chœur', 'catharsis'] },
    'comedie': { keywords: ['comédie', 'scène', 'rire', 'valet'] },
    'drame': { keywords: ['drame', 'romantique', 'mélodrame'] },
    // Prose d'idées
    'essai': { keywords: ['essai', 'essais', 'réflexion', 'méditation'] },
    'maxime': { keywords: ['maxime', 'sentence', 'réflexion morale'] },
    'aphorisme': { keywords: ['aphorisme', 'pensée', 'fragment'] },
    'discours': { keywords: ['discours', 'éloquence', 'oraison', 'plaidoyer', 'harangue'] },
    'lettre': { keywords: ['lettre', 'correspondance', 'épître', 'mon cher'] },
    'journal': { keywords: ['journal', 'intime', 'carnet', 'ce jour'] },
    'memoires': { keywords: ['mémoires', 'souvenirs', 'autobiographie'] }
};

/**
 * Mapping des époques/courants (SANS AUTEURS - Recherche pure)
 */
const EPOQUES_FILTER = {
    // ═══════════════════════════════════════════════════════════
    // Périodes Générales (Les grands siècles)
    // ═══════════════════════════════════════════════════════════
    'category-antiquite': { 
        period: 'Antiquité', 
        keywords: [
            'tragédie grecque', 'comédie antique', 'épopée antique', 'rhétorique latine', 'littérature latine', 'mythologie grecque', 'philosophie antique', 'stoïcisme', 'épicurisme', 'poésie lyrique', 
            'littérature gréco-romaine', 'théâtre antique', 'mythes et légendes', 'dialogues philosophiques', 'poésie élégiaque'
        ] 
    },
    'category-medieval': { 
        period: 'Moyen Âge', 
        keywords: [
            'amour courtois', 'chevalerie', 'chanson de geste', 'roman courtois', 'littérature médiévale', 'rondeaux', 'ballades', 'lais', 'fabliaux', 'chroniques', 
            'poésie médiévale', 'théâtre médiéval', 'mystère', 'farce', 'roman de chevalerie', 'quire', 'manuscrit'
        ] 
    },
    'category-classique-group': { 
        period: 'Siècle classique', 
        keywords: [
            'tragédie classique', 'comédie de caractère', 'fables', 'maximes', 'bienséance', 'vraisemblance', 'règle des trois unités', 'honnête homme', 'moralistes', 
            'grand siècle', 'littérature classique', 'éloquence sacrée', 'correspondances', 'contes de fées', 'classicisme français'
        ] 
    },
    'category-xixe': { 
        period: 'XIXe siècle', 
        keywords: [
            'romantisme', 'réalisme', 'naturalisme', 'symbolisme', 'parnasse', 'poésie lyrique', 'roman-feuilleton', 'littérature fantastique', 'spleen', 'idéal', 
            'poèmes maudits', 'orientalisme', 'dandysme', 'roman historique', 'drame romantique', 'poésie moderne', 'vers libre'
        ] 
    },
    'category-xxe': { 
        period: 'XXe siècle', 
        keywords: [
            'surréalisme', 'existentialisme', 'théâtre de l\'absurde', 'nouveau roman', 'poésie contemporaine', 'littérature engagée', 'autofiction', 'oulipo', 
            'écriture automatique', 'inconscient', 'humanisme', 'roman moderne', 'expérimentation littéraire', 'calligrammes', 'versatilité'
        ] 
    },

    // ═══════════════════════════════════════════════════════════
    // Antiquité détaillée
    // ═══════════════════════════════════════════════════════════
    'antiquite-grecque': { 
        period: 'Grèce antique', 
        keywords: ['tragédie grecque', 'comédie ancienne', 'épopée homérique', 'lyrisme grec', 'philosophie socratique', 'dialectique', 'mythes grecs', 'dithyrambe', 'chœur antique'] 
    },
    'antiquite-romaine': { 
        period: 'Rome antique', 
        keywords: ['littérature latine', 'épopée virgilienne', 'satire romaine', 'élégie latine', 'rhétorique romaine', 'stoïcisme romain', 'art d\'aimer', 'histoire romaine', 'comédie latine'] 
    },

    // ═══════════════════════════════════════════════════════════
    // Moyen Âge et Renaissance
    // ═══════════════════════════════════════════════════════════
    'medieval': { 
        period: 'Moyen Âge', 
        keywords: ['fin\'amor', 'roman de chevalerie', 'matière de bretagne', 'cycle arthurien', 'poésie des troubadours', 'trouvères', 'littérature allégorique', 'bestiaires', 'chanson de toile'] 
    },
    'renaissance': { 
        period: 'Renaissance', 
        keywords: ['humanisme', 'pléiade', 'sonnet', 'pétrarquisme', 'littérature de la renaissance', 'retour à l\'antique', 'imitatio', 'lyrisme amoureux', 'essais philosophiques', 'blason poétique'] 
    },

    // ═══════════════════════════════════════════════════════════
    // XVIIe siècle
    // ═══════════════════════════════════════════════════════════
    'baroque': { 
        period: 'Baroque', 
        keywords: ['poésie baroque', 'inconstance', 'illusion', 'métamorphose', 'vanité', 'memento mori', 'théâtre baroque', 'ornementation', 'prédication', 'roman pastoral'] 
    },
    'classique': { 
        period: 'Classicisme', 
        keywords: ['doctrines classiques', 'tragédie pure', 'haute comédie', 'art poétique', 'raison', 'mesure', 'nature humaine', 'jansénisme', 'port-royal', 'éloquence'] 
    },

    // ═══════════════════════════════════════════════════════════
    // XVIIIe siècle
    // ═══════════════════════════════════════════════════════════
    'lumieres': { 
        period: 'Lumières', 
        keywords: ['philosophie des lumières', 'encyclopédie', 'conte philosophique', 'roman épistolaire', 'raison et progrès', 'tolérance', 'libertinage', 'droits de l\'homme', 'théâtre de la foire', 'drame bourgeois'] 
    },

    // ═══════════════════════════════════════════════════════════
    // XIXe siècle détaillé
    // ═══════════════════════════════════════════════════════════
    'romantisme': { 
        period: 'Romantisme', 
        keywords: ['mal du siècle', 'lyrisme personnel', 'contemplation de la nature', 'goût des ruines', 'passion', 'exotisme', 'romantisme noir', 'grotesque et sublime', 'engagement politique', 'roman historique'] 
    },
    'realisme': { 
        period: 'Réalisme', 
        keywords: ['roman réaliste', 'description minutieuse', 'mœurs', 'milieu social', 'illusion référentielle', 'types sociaux', 'argent', 'bourgeoisie', 'ambition sociale', 'scènes de la vie'] 
    },
    'naturalisme': { 
        period: 'Naturalisme', 
        keywords: ['roman expérimental', 'déterminisme', 'hérédité', 'milieu ouvrier', 'physiologie', 'pathologie', 'documentaire social', 'lutte des classes', 'instincts'] 
    },
    'symbolisme': { 
        period: 'Symbolisme', 
        keywords: ['vers libre', 'correspondances', 'synesthésie', 'musicalité', 'hermétisme', 'monde sensible', 'spleen', 'symboles', 'rêve et inconscient', 'mystère', 'poésie pure'] 
    },
    'decadentisme': { 
        period: 'Décadentisme', 
        keywords: ['esprit décadent', 'fin de siècle', 'pessimisme', 'raffinement', 'artifice', 'névrose', 'esthétisme', 'dandysme', 'satanisme', 'romantisme désespéré'] 
    },

    // ═══════════════════════════════════════════════════════════
    // XXe siècle détaillé
    // ═══════════════════════════════════════════════════════════
    'surrealisme': { 
        period: 'Surréalisme', 
        keywords: ['écriture automatique', 'inconscient', 'révolte', 'amour fou', 'hasard objectif', 'cadavre exquis', 'imaginaire', 'liberté', 'merveilleux', 'association libre'] 
    },
    'existentialisme': { 
        period: 'Existentialisme', 
        keywords: ['philosophie de l\'existence', 'liberté et responsabilité', 'engagement', 'angoisse', 'contingence', 'situation', 'humanisme', 'roman à thèse', 'théâtre des idées'] 
    },
    'absurde': { 
        period: 'Absurde', 
        keywords: ['théâtre de l\'absurde', 'incommunicabilité', 'condition humaine', 'dérision', 'non-sens', 'répétition', 'tragicomique', 'vide existentiel', 'anti-théâtre'] 
    },
    'nouveau-roman': { 
        period: 'Nouveau roman', 
        keywords: ['école du regard', 'mort du personnage', 'refus de l\'intrigue', 'roman objectif', 'description géométrique', 'anti-roman', 'structure narrative', 'ère du soupçon', 'labyrinthe'] 
    }
};

/**
 * Mapping des registres/tonalités
 */
const TONS = {
    // Tonalités Générales
    'category-emotion': { keywords: ['émotion', 'sentiment', 'sensibilité', 'passion', 'amour'] },
    'category-heroisme': { keywords: ['héroïsme', 'héros', 'gloire', 'courage', 'épique'] },
    'category-imaginaire': { keywords: ['imaginaire', 'fantastique', 'merveilleux', 'rêve', 'étrange'] },
    'category-comique': { keywords: ['comique', 'rire', 'humour', 'plaisanterie', 'ironie'] },
    'category-nature': { keywords: ['nature', 'paysage', 'campagne', 'monde', 'terre'] },

    // Lyrisme et émotion
    'lyrique': { keywords: ['amour', 'cœur', 'âme', 'sentiment', 'émotion', 'passion'] },
    'elegiaque': { keywords: ['élégie', 'plainte', 'regret', 'perte', 'deuil', 'larmes'] },
    'melancolique': { keywords: ['spleen', 'ennui', 'tristesse', 'automne', 'solitude', 'nostalgie', 'vague'] },
    'tragique': { keywords: ['destin', 'fatalité', 'mort', 'sacrifice', 'héros', 'chute'] },
    // Héroïsme
    'epique': { keywords: ['héros', 'bataille', 'gloire', 'honneur', 'guerre', 'conquête', 'exploit'] },
    'heroique': { keywords: ['héros', 'courage', 'vaillance', 'combat', 'victoire'] },
    'chevaleresque': { keywords: ['chevalier', 'quête', 'graal', 'dame', 'honneur', 'tournoi'] },
    // Fantastique et imagination
    'gothique': { keywords: ['fantôme', 'spectre', 'château', 'terreur', 'nuit', 'vampire', 'mort', 'ténèbres'] },
    'fantastique': { keywords: ['étrange', 'surnaturel', 'apparition', 'mystère', 'inexplicable'] },
    'onirique': { keywords: ['rêve', 'songe', 'vision', 'sommeil', 'chimère', 'illusion'] },
    'mystique': { keywords: ['âme', 'divin', 'extase', 'vision', 'lumière', 'sacré', 'éternel'] },
    // Comique et critique
    'satirique': { keywords: ['satire', 'critique', 'moquerie', 'ridicule', 'vice'] },
    'ironique': { keywords: ['ironie', 'double sens', 'antiphrase', 'sous-entendu'] },
    'burlesque': { keywords: ['burlesque', 'parodie', 'grotesque', 'carnaval', 'farce'] },
    // Nature et contemplation
    'pastoral': { keywords: ['berger', 'prairie', 'fleur', 'ruisseau', 'troupeau', 'nature'] },
    'bucolique': { keywords: ['campagne', 'champ', 'moisson', 'vendange', 'paysan'] },
    'contemplatif': { keywords: ['méditation', 'silence', 'solitude', 'harmonie', 'sérénité'] },
    // Sensualité
    'erotique': { keywords: ['désir', 'volupté', 'baiser', 'caresse', 'corps', 'plaisir'] },
    'libertin': { keywords: ['libertinage', 'séduction', 'plaisir', 'jouissance'] }
};

/**
 * Mapping des courants de pensée/philosophie
 */
const PENSEES = {
    // Pensées Générales
    'category-antique': { keywords: ['philosophie antique', 'sagesse', 'grecs', 'romains'] },
    'category-moderne': { keywords: ['philosophie moderne', 'raison', 'conscience', 'liberté'] },
    'category-ethique': { keywords: ['éthique', 'morale', 'bien', 'mal', 'vertu', 'devoir'] },

    // Philosophie antique
    'stoicisme': { keywords: ['vertu', 'sagesse', 'raison', 'nature', 'destin', 'apathie'] },
    'epicurisme': { keywords: ['plaisir', 'bonheur', 'ataraxie', 'amitié', 'nature'] },
    'platonisme': { keywords: ['idée', 'beauté', 'vérité', 'bien', 'âme', 'caverne'] },
    'scepticisme': { keywords: ['doute', 'suspension', 'apparence', 'relativité'] },
    // Renaissance et âge classique
    'humanisme': { keywords: ['homme', 'éducation', 'dignité', 'liberté', 'culture'] },
    'rationalisme': { keywords: ['raison', 'méthode', 'évidence', 'cogito', 'vérité'] },
    'empirisme': { keywords: ['expérience', 'sensation', 'observation', 'connaissance'] },
    // Philosophie moderne
    'idealisme': { keywords: ['esprit', 'conscience', 'absolu', 'dialectique'] },
    'nihilisme': { keywords: ['néant', 'absurdité', 'valeur', 'destruction', 'surhomme'] },
    'existentialisme-p': { keywords: ['existence', 'liberté', 'angoisse', 'choix', 'authenticité', 'engagement'] },
    'absurde-p': { keywords: ['absurde', 'révolte', 'Sisyphe', 'sens', 'condition humaine'] },
    // Éthique et société
    'moraliste': { keywords: ['morale', 'vertu', 'vice', 'caractère', 'nature humaine', 'passion'] },
    'utopie': { keywords: ['utopie', 'idéal', 'cité', 'société parfaite', 'bonheur'] },
    'spiritualite': { keywords: ['âme', 'prière', 'mystique', 'foi', 'contemplation', 'Dieu'] }
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
        activeFilters[category] = ['all'];
    } else {
        let next = filters.filter(v => v !== 'all');
        if (next.includes(value)) {
            next = next.filter(v => v !== value);
        } else {
            next.push(value);
        }
        if (next.length === 0) {
            next = ['all'];
        }
        activeFilters[category] = next;
    }

    updateFilterUI();
    updateFilterSummary();
}

// Ajouter un tag (poésie/roman/...) à la barre de filtres et lancer la recherche
function applyTagFilter(rawTag) {
    if (!rawTag) return;

    const normalize = (str) => String(str || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const tag = normalize(rawTag);

    const TAG_TO_FILTER = {
        poesie: { category: 'forme', value: 'category-poesie' },
        roman: { category: 'forme', value: 'roman' },
        nouvelle: { category: 'forme', value: 'nouvelle' },
        conte: { category: 'forme', value: 'conte' },
        fable: { category: 'forme', value: 'fable' },
        theatre: { category: 'forme', value: 'category-theatre' },
        philosophie: { category: 'forme', value: 'category-idees' },
        mystique: { category: 'ton', value: 'mystique' }
    };

    const mapping = TAG_TO_FILTER[tag];
    if (!mapping) return;

    if (!activeFilters[mapping.category]) {
        activeFilters[mapping.category] = ['all'];
    }

    let next = activeFilters[mapping.category].filter(v => v !== 'all');
    if (!next.includes(mapping.value)) next.push(mapping.value);
    if (next.length === 0) next = ['all'];
    activeFilters[mapping.category] = next;

    updateFilterUI();
    updateFilterSummary();
    if (typeof applyFilters === 'function') applyFilters();
}

/**
 * Ouvre/ferme un groupe de sous-filtres
 */
function toggleFilterGroup(category, group) {
    const subchips = document.getElementById(`subchips-${category}-${group}`);
    const parentBtn = document.querySelector(`.filter-parent[data-filter="${category}"][data-group="${group}"]`);
    if (!subchips) return;

    if (openGroups[category] && openGroups[category] !== group) {
        const prevSubchips = document.getElementById(`subchips-${category}-${openGroups[category]}`);
        const prevParent = document.querySelector(`.filter-parent[data-filter="${category}"][data-group="${openGroups[category]}"]`);
        if (prevSubchips) prevSubchips.style.display = 'none';
        if (prevParent) prevParent.classList.remove('expanded');
    }

    const isOpen = openGroups[category] === group;
    subchips.style.display = isOpen ? 'none' : 'flex';
    if (parentBtn) parentBtn.classList.toggle('expanded', !isOpen);
    openGroups[category] = isOpen ? null : group;
}

/**
 * Met à jour l'état visuel des filtres
 */
function updateFilterUI() {
    Object.keys(activeFilters).forEach(category => {
        const chips = document.querySelectorAll(`.filter-chip[data-filter="${category}"][data-value]`);
        chips.forEach(chip => {
            const value = chip.getAttribute('data-value');
            chip.classList.toggle('active', activeFilters[category]?.includes(value));
        });

        const parents = document.querySelectorAll(`.filter-parent[data-filter="${category}"]`);
        parents.forEach(parent => {
            const group = parent.getAttribute('data-group');
            const children = document.querySelectorAll(`#subchips-${category}-${group} .filter-chip[data-value]`);
            const anyActive = Array.from(children).some(child => {
                const value = child.getAttribute('data-value');
                return activeFilters[category]?.includes(value);
            });
            parent.classList.toggle('active', anyActive);
        });
    });
}


/**
 * Récupère les termes de recherche pour le scrolling infini (persistent)
 * Retourne un tableau de mots-clés dérivés des filtres actifs
 */
function getActiveFilterKeywords() {
    const keywords = [];
    
    // Forme
    if (!activeFilters.forme.includes('all')) {
        activeFilters.forme.forEach(f => {
            if (FORMES[f]?.keywords) keywords.push(...FORMES[f].keywords);
        });
    }
    
    // Époque
    if (!activeFilters.epoque.includes('all')) {
        activeFilters.epoque.forEach(e => {
            const filter = EPOQUES_FILTER[e];
            if (filter) {
                if (filter.keywords && filter.keywords.length > 0) {
                    keywords.push(...filter.keywords);
                } else if (filter.period) {
                    keywords.push(filter.period);
                }
            }
        });
    }
    
    // Ton
    if (!activeFilters.ton.includes('all')) {
        activeFilters.ton.forEach(t => {
            if (TONS[t]?.keywords) keywords.push(...TONS[t].keywords);
        });
    }
    
    // Pensée
    if (activeFilters.pensee && !activeFilters.pensee.includes('all')) {
        activeFilters.pensee.forEach(p => {
            if (PENSEES[p]?.keywords) keywords.push(...PENSEES[p].keywords);
        });
    }
    
    return keywords;
}

// Exposer pour sources.js
window.getActiveFilterKeywords = getActiveFilterKeywords;

/**
 * Met à jour le résumé des filtres actifs
 */
function updateFilterSummary() {
    const summary = document.getElementById('filterSummary');
    const summaryText = document.getElementById('filterSummaryText');
    if (!summary || !summaryText) return;

    const getChipLabel = (category, value) => {
        const el = document.querySelector(`.filter-chip[data-filter="${category}"][data-value="${value}"]`);
        const label = el ? (el.textContent || '').trim() : '';
        return label || value;
    };

    const addRemovableTag = (text, onRemove, ariaLabel = 'Retirer') => {
        const tag = document.createElement('span');
        tag.className = 'filter-tag filter-tag-removable';

        const label = document.createElement('span');
        label.className = 'filter-tag-label';
        label.textContent = text;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filter-tag-remove';
        btn.setAttribute('aria-label', ariaLabel);
        btn.textContent = '×';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof onRemove === 'function') onRemove();
        });

        tag.appendChild(label);
        tag.appendChild(btn);
        summaryText.appendChild(tag);
    };

    summaryText.innerHTML = '';

    // Tag de contexte (clic hashtag / auteur / recherche libre)
    if (window.state?.activeSearchTerm) {
        const term = String(window.state.activeSearchTerm);
        const type = window.state.activeSearchContextType || 'term';
        const label = type === 'keyword'
            ? (term.startsWith('#') ? term : `#${term}`)
            : `Recherche: "${term}"`;
        addRemovableTag(label, clearActiveSearchContext, 'Retirer le filtre de recherche');
    }

    // Tags Forme (supprimables)
    if (!activeFilters.forme.includes('all')) {
        activeFilters.forme.forEach(v => {
            addRemovableTag(
                getChipLabel('forme', v),
                () => toggleFilter('forme', v),
                'Retirer le filtre de forme'
            );
        });
    }
    // Tags Époque (supprimables)
    if (!activeFilters.epoque.includes('all')) {
        activeFilters.epoque.forEach(v => {
            addRemovableTag(
                getChipLabel('epoque', v),
                () => toggleFilter('epoque', v),
                'Retirer le filtre d\'époque'
            );
        });
    }
    // Tags Registre (supprimables)
    if (!activeFilters.ton.includes('all')) {
        activeFilters.ton.forEach(v => {
            addRemovableTag(
                getChipLabel('ton', v),
                () => toggleFilter('ton', v),
                'Retirer le filtre de tonalité'
            );
        });
    }
    // Tags Pensée (supprimables)
    if (activeFilters.pensee && !activeFilters.pensee.includes('all')) {
        activeFilters.pensee.forEach(v => {
            addRemovableTag(
                getChipLabel('pensee', v),
                () => toggleFilter('pensee', v),
                'Retirer le filtre de pensée'
            );
        });
    }

    // Toujours visible pour permettre la saisie libre
    summary.style.display = 'flex';
}

function getExplorationFreeTerm() {
    const input = document.getElementById('explorationFreeInput');
    return input ? input.value.trim() : '';
}

/**
 * Efface uniquement le contexte de recherche (ex: clic hashtag/auteur)
 * sans toucher aux filtres (forme/époque/ton/pensée).
 */
function clearActiveSearchContext() {
    if (!window.state) return;

    window.state.activeSearchTerm = null;
    window.state.activeSearchContextType = null;
    window.state.searchOffset = 0;
    window.state.lastSearchTerm = null;
    window.state.loadingMessage = typeof t === 'function' ? t('loading') : 'Loading...';
    if (window.setMainLoadingMessage) window.setMainLoadingMessage(window.state.loadingMessage);
    if (Array.isArray(window.state.textPool)) window.state.textPool = [];

    if (typeof window.fillPool === 'function') window.fillPool();
    updateFilterSummary();
    toast('🔎 Filtre retiré');
}

/**
 * Efface tous les filtres
 */
function clearAllFilters() {
    activeFilters.forme = ['all'];
    activeFilters.epoque = ['all'];
    activeFilters.ton = ['all'];
    activeFilters.pensee = ['all'];
    // activeFilters.source conservé (paramètre global)

    // Revenir au mode standard (scroll = chargement générique / random)
    if (window.state) {
        window.state.activeSearchTerm = null;
        window.state.activeSearchContextType = null;
        window.state.searchOffset = 0;
        window.state.lastSearchTerm = null;
        window.state.filterFreeTerm = null;
        window.state.loadingMessage = typeof t === 'function' ? t('loading') : 'Loading...';
        if (window.setMainLoadingMessage) window.setMainLoadingMessage(window.state.loadingMessage);
        if (Array.isArray(window.state.textPool)) window.state.textPool = [];
    }

    // Si on repasse en mode standard, on efface aussi le mot libre
    const input = document.getElementById('explorationFreeInput');
    if (input) input.value = '';

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
    // 🧪 1. Collecter les "ingrédients" par catégorie
    const ingredients = {
        forme: [],
        epoque: [],
        ton: [],
        pensee: []
    };

    const freeTerm = getExplorationFreeTerm();
    
    // Le filtre de source est géré globalement via les paramètres, on ne le touche pas ici
    
    // Récolte Forme
    if (!activeFilters.forme.includes('all')) {
        activeFilters.forme.forEach(f => {
            if (FORMES[f]?.keywords) ingredients.forme.push(...FORMES[f].keywords);
        });
    }
    
    // Récolte Époque (On utilise la période comme ingrédient principal)
    if (!activeFilters.epoque.includes('all')) {
        activeFilters.epoque.forEach(e => {
            const filter = EPOQUES_FILTER[e];
            if (filter) {
                // Priorité aux mots-clés spécifiques s'ils existent (évite les recherches génériques pauvres)
                if (filter.keywords && filter.keywords.length > 0) {
                    ingredients.epoque.push(...filter.keywords);
                } else if (filter.period) {
                    ingredients.epoque.push(filter.period);
                }
            }
        });
    }
    
    // Récolte Ton
    if (!activeFilters.ton.includes('all')) {
        activeFilters.ton.forEach(t => {
            if (TONS[t]?.keywords) ingredients.ton.push(...TONS[t].keywords);
        });
    }
    
    // Récolte Pensée
    if (activeFilters.pensee && !activeFilters.pensee.includes('all')) {
        activeFilters.pensee.forEach(p => {
            if (PENSEES[p]?.keywords) ingredients.pensee.push(...PENSEES[p].keywords);
        });
    }

    // 🧹 Nettoyage UI
    const feed = document.getElementById('feed');
    if (feed) feed.innerHTML = '';
    state.loading = false;

    // IMPORTANT: vider le pool pour que le scroll infini utilise la nouvelle recherche
    if (state && Array.isArray(state.textPool)) {
        state.textPool = [];
    }
    if (state) {
        state.searchOffset = 0;
    }
    
    // 🎲 2. Création des "Chimères" (Combinaisons de recherche)
    // On va générer 3 types de requêtes pour maximiser la chance et le fun
    
    const queries = [];
    
    // Helper pour piocher un élément au hasard
    const pick = (arr) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

    const suffix = freeTerm ? ` ${freeTerm}` : '';

    // --- STRATÉGIE A : Le "Cadravre Exquis" (Intersection stricte) ---
    // On essaie de combiner un élément de chaque catégorie active
    let chimeraParts = [];
    if (ingredients.forme.length) chimeraParts.push(pick(ingredients.forme));
    if (ingredients.epoque.length) chimeraParts.push(pick(ingredients.epoque));
    if (ingredients.ton.length) chimeraParts.push(pick(ingredients.ton));
    if (ingredients.pensee.length) chimeraParts.push(pick(ingredients.pensee));
    
    if (chimeraParts.length > 1) {
        queries.push({
            term: chimeraParts.join(' ') + suffix,
            type: 'chimera' // Pour le fun
        });
    }

    // --- STRATÉGIE B : Le "Duo Choc" (Forme + Époque ou Ton + Pensée) ---
    // Souvent plus pertinent historiquement
    if (ingredients.forme.length && ingredients.epoque.length) {
        queries.push({
            term: `${pick(ingredients.forme)} ${pick(ingredients.epoque)}` + suffix,
            type: 'history'
        });
    } else if (ingredients.ton.length && ingredients.pensee.length) {
         queries.push({
            term: `${pick(ingredients.ton)} ${pick(ingredients.pensee)}` + suffix,
            type: 'philosophy'
        });
    }

    // --- STRATÉGIE C : L' "Electron Libre" (Un mot clé simple mais fort) ---
    // Fallback pour être sûr d'avoir des résultats
    const allKeywords = [...ingredients.forme, ...ingredients.epoque, ...ingredients.ton, ...ingredients.pensee];
    if (allKeywords.length > 0) {
        queries.push({
            term: (pick(allKeywords) || '') + suffix,
            type: 'simple'
        });
    }

    // Si aucun filtre mais un terme libre, on recherche exactement ce terme
    if (allKeywords.length === 0 && freeTerm) {
        queries.length = 0;
        queries.push({ term: freeTerm, type: 'free' });
    }
    
    // Fallback ultime si aucun filtre
    if (queries.length === 0) {
        const defaults = ['Poésie', 'Roman', 'Philosophie', 'Théâtre'];
        queries.push({ term: pick(defaults), type: 'random' });
    }

    // Limiter à 3 requêtes et dédupliquer les termes
    const uniqueQueries = [...new Map(queries.map(q => [q.term, q])).values()].slice(0, 3);

    // 🚀 3. Lancement
    if (uniqueQueries.length === 1 && uniqueQueries[0].type === 'free') {
        toast(typeof t === 'function' ? t('searching').replace('{term}', uniqueQueries[0].term) : `Searching "${uniqueQueries[0].term}"...`);
    } else {
        const termsStr = uniqueQueries.map(q => `"${q.term}"`).join(', ');
        toast(typeof t === 'function' ? t('searching').replace('{term}', termsStr) : `Searching ${termsStr}...`);
    }

    // Contexte pour le scroll infini:
    // - Si recherche libre seule: on garde le contexte = le terme libre (scroll = suite de la recherche)
    // - Sinon: on ne verrouille pas sur un terme unique (drift via filtres)
    const hasAnyFilterKeywords =
        ingredients.forme.length > 0 ||
        ingredients.epoque.length > 0 ||
        ingredients.ton.length > 0 ||
        ingredients.pensee.length > 0;

    if (state) {
        // Suffixe persistant: si des filtres sont actifs, le scroll doit continuer à chercher "filtre + mot"
        state.filterFreeTerm = freeTerm || null;

        if (!hasAnyFilterKeywords && freeTerm) {
            state.activeSearchTerm = freeTerm;
            state.activeSearchContextType = 'free';
            state.searchOffset = 0;
            state.loadingMessage = typeof t === 'function' ? t('searching').replace('{term}', freeTerm) : `Searching "${freeTerm}"...`;
            if (window.setMainLoadingMessage) window.setMainLoadingMessage(state.loadingMessage);
        } else {
            state.activeSearchTerm = null;
            state.activeSearchContextType = null;
            state.searchOffset = 0;
        }
    }

    // Si recherche libre seule: une seule requête, et on verrouille le contexte
    if (!hasAnyFilterKeywords && freeTerm) {
        await exploreAuthor(freeTerm, true, 'free');
        return;
    }

    for (const q of uniqueQueries) {
        // Petit délai pour l'effet dramatique (et l'API)
        // False = ne pas verrouiller le contexte sur ce terme spécifique
        await exploreAuthor(q.term, false);
    }
}

// 🎲 Bouton "dés" : si texte libre => lance la recherche, sinon randomize + lance
function rollExploration() {
    const freeTerm = getExplorationFreeTerm();
    if (freeTerm) {
        applyFilters();
        return;
    }
    randomizeFilters();
    applyFilters();
}

// (Sections "genres/époques favorites" supprimées)

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
 * Ajuste le padding-top du main via CSS variable (instantané)
 */
function adjustMainPadding() {
    const container = document.getElementById('explorationContainer');
    if (!container || window.innerWidth <= 900) return;
    
    // Met à jour la variable CSS - le navigateur applique instantanément
    const explorationHeight = container.offsetHeight;
    document.documentElement.style.setProperty('--exploration-height', explorationHeight + 'px');
}

/**
 * Toggle manuel de la rétraction
 */
function toggleExplorationCollapse() {
    const container = document.getElementById('explorationContainer');
    if (!container) return;
    
    // Sur mobile, utiliser le système de drawer
    if (window.innerWidth <= 900 && typeof toggleFilterDrawer === 'function') {
        toggleFilterDrawer();
        return;
    }
    
    userManuallyToggled = true;
    isExplorationCollapsed = !isExplorationCollapsed;
    container.classList.toggle('collapsed', isExplorationCollapsed);
    
    // Mettre à jour le texte du bouton (avec traduction)
    const toggleText = document.getElementById('toggleFiltersText');
    if (toggleText && typeof t === 'function') {
        toggleText.textContent = isExplorationCollapsed ? t('expand_filters') : t('collapse_filters');
    }
    
    // Ajouter/retirer la classe sur body
    document.body.classList.toggle('filters-collapsed', isExplorationCollapsed);
    
    // Ajuster le padding via CSS variable (avec RAF pour fluidité)
    const animate = () => {
        adjustMainPadding();
        if (container.offsetHeight > 42 && isExplorationCollapsed) {
            requestAnimationFrame(animate);
        } else if (container.offsetHeight < 150 && !isExplorationCollapsed) {
            requestAnimationFrame(animate);
        }
    };
    requestAnimationFrame(animate);
    
    // Fallback: arrêter après 400ms
    setTimeout(adjustMainPadding, 400);
    
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
    
    // Ajuster le padding initial
    adjustMainPadding();
    // Réajuster après le rendu complet
    requestAnimationFrame(adjustMainPadding);
    
    // Réajuster lors du redimensionnement
    window.addEventListener('resize', adjustMainPadding);
});

// Exports globaux pour le nouveau système
window.toggleFilter = toggleFilter;
window.toggleFilterGroup = toggleFilterGroup;
window.toggleExplorationCollapse = toggleExplorationCollapse;
window.clearAllFilters = clearAllFilters;
window.randomizeFilters = randomizeFilters;
window.applyFilters = applyFilters;
window.rollExploration = rollExploration;
window.activeFilters = activeFilters;
window.updateFilterSummary = updateFilterSummary;
window.clearActiveSearchContext = clearActiveSearchContext;
window.applyTagFilter = applyTagFilter;

// ═══════════════════════════════════════════════════════════
// 🎨 AMBIANCES DE LECTURE (Supprimé)
// ═══════════════════════════════════════════════════════════
// (Section supprimée à la demande de l'utilisateur pour alléger le code et éviter les listes d'auteurs en dur)

const AMBIANCES = {
    libre: {
        name: 'Dérive libre',
        icon: '๏',
        description: '',
        authors: [],
        keywords: [],
        color: '#7d8471'
    }
};

// ═══════════════════════════════════════════════════════════
// 📜 ÉPOQUES LITTÉRAIRES
// ═══════════════════════════════════════════════════════════

/**
 * Définition des grandes époques de l'histoire littéraire
 * Chaque époque : name, icon, period, description, keywords[], color
 */
const EPOQUES = {
    antiquite: {
        name: 'Antiquité',
        icon: '☤',
        period: 'VIIIᵉ s. av. J.-C. – Vᵉ s.',
        description: '',
        keywords: ['mythologie', 'olympe', 'tragédie', 'héros', 'oracle', 'destin'],
        color: '#a67c52'
    },
    medieval: {
        name: 'Moyen Âge',
        icon: '✠',
        period: 'Vᵉ – XVᵉ siècle',
        description: '',
        keywords: ['chevalier', 'amour courtois', 'quête', 'graal', 'troubadour', 'roman', 'chanson de geste'],
        color: '#635d4e'
    },
    renaissance: {
        name: 'Renaissance',
        icon: '✡',
        period: 'XVIᵉ siècle',
        description: '',
        keywords: ['humanisme', 'éducation', 'sonnet', 'pléiade', 'amour', 'nature'],
        color: '#a67c52'
    },
    classique: {
        name: 'Grand Siècle',
        icon: '✧',
        period: 'XVIIᵉ siècle',
        description: '',
        keywords: ['honnête homme', 'bienséance', 'tragédie', 'comédie', 'fable', 'moraliste'],
        color: '#a67c52'
    },
    lumieres: {
        name: 'Lumières',
        icon: '✶',
        period: 'XVIIIᵉ siècle',
        description: '',
        keywords: ['raison', 'progrès', 'philosophie', 'encyclopédie', 'liberté', 'tolérance'],
        color: '#a67c52'
    },
    xixe: {
        name: 'XIXᵉ siècle',
        icon: '⚗',
        period: '1800 – 1900',
        description: '',
        keywords: ['révolution', 'passion', 'société', 'naturalisme', 'symbolisme', 'spleen'],
        color: '#635d4e'
    },
    belleepoque: {
        name: 'Belle Époque',
        icon: '❦',
        period: '1880 – 1914',
        description: '',
        keywords: ['salon', 'mondain', 'décadence', 'symbolisme', 'impressionnisme', 'art nouveau'],
        color: '#5c5470'
    },
    xxe: {
        name: 'XXᵉ siècle',
        icon: '☢',
        period: '1900 – 2000',
        description: '',
        keywords: ['absurde', 'existentialisme', 'surréalisme', 'engagement', 'modernité', 'guerre'],
        color: '#6b3a3a'
    }
};

// ═══════════════════════════════════════════════════════════
// 🏛️ COURANTS LITTÉRAIRES
// ═══════════════════════════════════════════════════════════

/**
 * Définition des grands courants/mouvements littéraires
 * Chaque courant : name, icon, period, description, keywords[], color
 */
const COURANTS = {
    humanisme: {
        name: 'Humanisme',
        icon: '❁',
        period: 'XVIᵉ siècle',
        description: '',
        keywords: ['homme', 'éducation', 'sagesse', 'vertu', 'raison', 'antiquité'],
        color: '#7d8471'
    },
    baroque: {
        name: 'Baroque',
        icon: '❀',
        period: 'Fin XVIᵉ – début XVIIᵉ',
        description: '',
        keywords: ['inconstance', 'métamorphose', 'illusion', 'mort', 'vanité', 'spectacle'],
        color: '#5c5470'
    },
    classicisme: {
        name: 'Classicisme',
        icon: '⚖︎',
        period: 'XVIIᵉ siècle',
        description: '',
        keywords: ['raison', 'règle', 'vraisemblance', 'bienséance', 'nature', 'universel'],
        color: '#635d4e'
    },
    romantisme: {
        name: 'Romantisme',
        icon: '❧',
        period: '1820 – 1850',
        description: '',
        keywords: ['moi', 'passion', 'nature', 'mélancolie', 'liberté', 'génie', 'sublime', 'poésie lyrique'],
        color: '#6b3a3a'
    },
    realisme: {
        name: 'Réalisme',
        icon: '◉',
        period: '1850 – 1880',
        description: '',
        keywords: ['société', 'observation', 'objectivité', 'bourgeoisie', 'argent', 'ambition', 'description'],
        color: '#635d4e'
    },
    naturalisme: {
        name: 'Naturalisme',
        icon: '⚗',
        period: '1870 – 1890',
        description: '',
        keywords: ['hérédité', 'milieu', 'expérimental', 'ouvrier', 'misère', 'déterminisme', 'science'],
        color: '#3d3d3d'
    },
    symbolisme: {
        name: 'Symbolisme',
        icon: '✶',
        period: '1880 – 1900',
        description: '',
        keywords: ['symbole', 'suggestion', 'musique', 'synesthésie', 'idéal', 'mystère', 'vers libre'],
        color: '#5c5470'
    },
    surrealisme: {
        name: 'Surréalisme',
        icon: '◬',
        period: '1920 – 1960',
        description: '',
        keywords: ['rêve', 'inconscient', 'automatisme', 'hasard', 'merveilleux', 'révolution'],
        color: '#a67c52'
    },
    existentialisme: {
        name: 'Existentialisme',
        icon: '⦿',
        period: '1940 – 1960',
        description: '',
        keywords: ['existence', 'liberté', 'absurde', 'engagement', 'angoisse', 'autrui'],
        color: '#212121'
    },
    absurde: {
        name: 'Absurde',
        icon: '⧖',
        period: '1950 – 1970',
        description: '',
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
            <button class="close-intro" onclick="closeAmbianceIntro()" title="${t('close')}">✕</button>
            <h2>${epoque.icon} ${epoque.name}</h2>
            <p class="period-badge">${epoque.period}</p>
            <p>${epoque.description}</p>
            <div class="ambiance-tags">
                ${epoque.keywords.slice(0, 6).map(a => `<span class="ambiance-tag" onclick="exploreFromAmbiance('${a.replace(/'/g, "\\'")}')" title="${t('tooltip_explore')} ${a}">${a}</span>`).join('')}
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
    
    // Charger par mots-clés
    const shuffled = [...epoque.keywords].sort(() => Math.random() - 0.5);
    for (const kw of shuffled.slice(0, 3)) {
        await exploreAuthor(kw); // ExploreAuthor gère aussi les recherches génériques
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
            <button class="close-intro" onclick="closeAmbianceIntro()" title="${t('close')}">✕</button>
            <h2>${courant.icon} ${courant.name}</h2>
            <p class="period-badge">${courant.period}</p>
            <p>${courant.description}</p>
            <div class="ambiance-tags">
                ${courant.keywords.slice(0, 6).map(a => `<span class="ambiance-tag" onclick="exploreFromAmbiance('${a.replace(/'/g, "\\'")}')" title="${t('tooltip_explore')} ${a}">${a}</span>`).join('')}
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
    
    // Charger par mots-clés
    const shuffled = [...courant.keywords].sort(() => Math.random() - 0.5);
    for (const kw of shuffled.slice(0, 3)) {
        await exploreAuthor(kw);
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
                <button class="close-intro" onclick="closeAmbianceIntro()" title="${t('close')}">✕</button>
                <h2>${ambiance.icon} ${ambiance.name}</h2>
                <p>${ambiance.description}</p>
                <div class="ambiance-tags">
                    ${ambiance.authors.slice(0, 5).map(a => `<span class="ambiance-tag" onclick="exploreFromAmbiance('${a.replace(/'/g, "\\'")}')" title="${t('tooltip_explore')} ${a}">${a}</span>`).join('')}
                    ${ambiance.authors.length > 5 ? `<span class="ambiance-tag more-authors" title="${ambiance.authors.slice(5).join(', ')}">+${ambiance.authors.length - 5} ${t('authors')}</span>` : ''}
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
    
    // Fallback search term if ambiance is empty or free
    // Instead of specific authors, we use generic terms or random
    const genericTerms = ['Poésie', 'Roman', 'Théâtre', 'Philosophie'];

    if (ambianceId === 'libre') {
        // Mode libre : reset du contexte de recherche pour revenir au drift aléatoire
        state.activeSearchTerm = null;

        // Mode libre : recherche générique aléatoire
        const randomTerm = genericTerms[Math.floor(Math.random() * genericTerms.length)];
        const ws = window.getCurrentWikisource ? window.getCurrentWikisource() : null;
        if (ws && window.searchByTerm) {
             await window.searchByTerm(randomTerm, ws);
        } else {
             console.warn("Exploration: generic search unavailable");
        }
        return;
    }
    
    // Choisir des mots-clés de l'ambiance au hasard
    const shuffledKeywords = [...(ambiance.keywords || [])].sort(() => Math.random() - 0.5);
    
    // Charger 2-3 mots-clés pour variété
    const toLoad = shuffledKeywords.slice(0, 3);
    
    // Si pas assez de mots clés, compléter avec generic
    if (toLoad.length === 0) {
        toLoad.push(genericTerms[Math.floor(Math.random() * genericTerms.length)]);
    }

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
