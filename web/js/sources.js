/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PALIMPSESTE - Module Sources (sources.js)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Gestion des sources de textes littéraires :
 * - Wikisource (multilingue)
 * - Project Gutenberg
 * - PoetryDB
 * - Navigation par catégories
 * 
 * Dépendances : app.js (state, toast), config.js (supabase)
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════
// 🌍 CONFIGURATION MULTILINGUE - Littérature mondiale
// ═══════════════════════════════════════════════════════════
const WIKISOURCES = [
    { lang: 'fr', name: 'Français', url: 'https://fr.wikisource.org' },
    { lang: 'en', name: 'English', url: 'https://en.wikisource.org' },
    { lang: 'de', name: 'Deutsch', url: 'https://de.wikisource.org' },
    { lang: 'it', name: 'Italiano', url: 'https://it.wikisource.org' },
    { lang: 'es', name: 'Español', url: 'https://es.wikisource.org' },
    { lang: 'pt', name: 'Português', url: 'https://pt.wikisource.org' },
    { lang: 'ru', name: 'Русский', url: 'https://ru.wikisource.org' },
    { lang: 'la', name: 'Latina', url: 'https://la.wikisource.org' },
    { lang: 'zh', name: '中文', url: 'https://zh.wikisource.org' },
    { lang: 'ja', name: '日本語', url: 'https://ja.wikisource.org' },
    { lang: 'ar', name: 'العربية', url: 'https://ar.wikisource.org' },
    { lang: 'el', name: 'Ελληνικά', url: 'https://el.wikisource.org' },
];

// Sources alternatives (APIs propres sans scories)
const ALT_SOURCES = {
    poetrydb: {
        name: 'PoetryDB',
        url: 'https://poetrydb.org',
        lang: 'en',
        // Auteurs disponibles dans PoetryDB
        authors: ['Shakespeare', 'Emily Dickinson', 'William Blake', 'John Keats', 
                  'Percy Shelley', 'Lord Byron', 'William Wordsworth', 'Edgar Allan Poe',
                  'Walt Whitman', 'Robert Frost', 'Oscar Wilde', 'Alfred Tennyson']
    },
    gutenberg: {
        name: 'Project Gutenberg',
        url: 'https://www.gutenberg.org',
        // Œuvres populaires avec leurs IDs Gutenberg (domaine public)
        works: [
            { id: 1342, title: 'Pride and Prejudice', author: 'Jane Austen', lang: 'en' },
            { id: 11, title: 'Alice\'s Adventures in Wonderland', author: 'Lewis Carroll', lang: 'en' },
            { id: 84, title: 'Frankenstein', author: 'Mary Shelley', lang: 'en' },
            { id: 1661, title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', lang: 'en' },
            { id: 2701, title: 'Moby Dick', author: 'Herman Melville', lang: 'en' },
            { id: 1232, title: 'The Prince', author: 'Niccolò Machiavelli', lang: 'en' },
            { id: 174, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', lang: 'en' },
            { id: 345, title: 'Dracula', author: 'Bram Stoker', lang: 'en' },
            { id: 1400, title: 'Great Expectations', author: 'Charles Dickens', lang: 'en' },
            { id: 98, title: 'A Tale of Two Cities', author: 'Charles Dickens', lang: 'en' },
            { id: 2600, title: 'War and Peace', author: 'Leo Tolstoy', lang: 'en' },
            { id: 2554, title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', lang: 'en' },
            { id: 4300, title: 'Ulysses', author: 'James Joyce', lang: 'en' },
            { id: 1080, title: 'A Modest Proposal', author: 'Jonathan Swift', lang: 'en' },
            { id: 76, title: 'Adventures of Huckleberry Finn', author: 'Mark Twain', lang: 'en' },
            { id: 74, title: 'The Adventures of Tom Sawyer', author: 'Mark Twain', lang: 'en' },
            { id: 219, title: 'Heart of Darkness', author: 'Joseph Conrad', lang: 'en' },
            { id: 5200, title: 'Metamorphosis', author: 'Franz Kafka', lang: 'en' },
            { id: 1952, title: 'The Yellow Wallpaper', author: 'Charlotte Perkins Gilman', lang: 'en' },
            { id: 120, title: 'Treasure Island', author: 'Robert Louis Stevenson', lang: 'en' },
            // Français
            { id: 17489, title: 'Les Misérables', author: 'Victor Hugo', lang: 'fr' },
            { id: 13951, title: 'Le Comte de Monte-Cristo', author: 'Alexandre Dumas', lang: 'fr' },
            { id: 14287, title: 'Les Trois Mousquetaires', author: 'Alexandre Dumas', lang: 'fr' },
            { id: 4650, title: 'Du côté de chez Swann', author: 'Marcel Proust', lang: 'fr' },
            { id: 17396, title: 'Madame Bovary', author: 'Gustave Flaubert', lang: 'fr' },
            { id: 13704, title: 'Le Rouge et le Noir', author: 'Stendhal', lang: 'fr' },
            { id: 5053, title: 'Germinal', author: 'Émile Zola', lang: 'fr' },
            // Autres langues
            { id: 2000, title: 'Don Quixote', author: 'Miguel de Cervantes', lang: 'es' },
            { id: 1012, title: 'The Divine Comedy', author: 'Dante Alighieri', lang: 'it' },
            { id: 2229, title: 'The Sorrows of Young Werther', author: 'Johann Wolfgang von Goethe', lang: 'de' },
            { id: 7849, title: 'Faust', author: 'Johann Wolfgang von Goethe', lang: 'de' }
        ]
    },
    // ═══════════════════════════════════════════════════════════
    // 📚 BIBLIOTHÈQUE NATIONALE DE FRANCE - Gallica
    // ═══════════════════════════════════════════════════════════
    gallica: {
        name: 'Gallica (BNF)',
        url: 'https://gallica.bnf.fr',
        lang: 'fr',
        // Œuvres classiques disponibles via l'API Gallica
        collections: [
            { query: 'Baudelaire Fleurs du mal', author: 'Charles Baudelaire' },
            { query: 'Rimbaud Illuminations', author: 'Arthur Rimbaud' },
            { query: 'Verlaine Fêtes galantes', author: 'Paul Verlaine' },
            { query: 'Victor Hugo Contemplations', author: 'Victor Hugo' },
            { query: 'Mallarmé poésies', author: 'Stéphane Mallarmé' },
            { query: 'Nerval Chimères', author: 'Gérard de Nerval' },
            { query: 'Lamartine Méditations', author: 'Alphonse de Lamartine' },
            { query: 'Musset Nuits', author: 'Alfred de Musset' },
            { query: 'Chateaubriand René', author: 'François-René de Chateaubriand' },
            { query: 'Montaigne Essais', author: 'Michel de Montaigne' },
            { query: 'La Rochefoucauld Maximes', author: 'François de La Rochefoucauld' },
            { query: 'Pascal Pensées', author: 'Blaise Pascal' }
        ]
    },
    // ═══════════════════════════════════════════════════════════
    // 📖 ARCHIVE.ORG - Internet Archive
    // ═══════════════════════════════════════════════════════════
    archiveorg: {
        name: 'Archive.org',
        url: 'https://archive.org',
        // Identifiants de livres classiques sur Archive.org
        works: [
            // Français
            { id: 'lesmisrables00hugogoog', title: 'Les Misérables', author: 'Victor Hugo', lang: 'fr' },
            { id: 'lesfleursdumal00baud', title: 'Les Fleurs du mal', author: 'Charles Baudelaire', lang: 'fr' },
            { id: 'germinalleszougoog', title: 'Germinal', author: 'Émile Zola', lang: 'fr' },
            { id: 'madamebovary00flau', title: 'Madame Bovary', author: 'Gustave Flaubert', lang: 'fr' },
            { id: 'lecomtedemontec01duma', title: 'Le Comte de Monte-Cristo', author: 'Alexandre Dumas', lang: 'fr' },
            { id: 'lespenseesdepas00pasc', title: 'Pensées', author: 'Blaise Pascal', lang: 'fr' },
            { id: 'lesessaisdemon01mont', title: 'Essais', author: 'Michel de Montaigne', lang: 'fr' },
            // Anglais
            { id: 'completeworksof00shakuoft', title: 'Complete Works', author: 'William Shakespeare', lang: 'en' },
            { id: 'prideandprejudi00aust', title: 'Pride and Prejudice', author: 'Jane Austen', lang: 'en' },
            { id: 'janeeyre00bron', title: 'Jane Eyre', author: 'Charlotte Brontë', lang: 'en' },
            { id: 'wutheringheight00bron', title: 'Wuthering Heights', author: 'Emily Brontë', lang: 'en' },
            { id: 'greatexpectatio00dick', title: 'Great Expectations', author: 'Charles Dickens', lang: 'en' }
        ]
    },
    // ═══════════════════════════════════════════════════════════
    // 📱 FEEDBOOKS - Livres libres de droits
    // ═══════════════════════════════════════════════════════════
    feedbooks: {
        name: 'Feedbooks',
        url: 'https://www.feedbooks.com',
        // Livres gratuits du domaine public
        works: [
            // Français - Classiques
            { id: 28, title: 'Le Père Goriot', author: 'Honoré de Balzac', lang: 'fr' },
            { id: 27, title: 'Eugénie Grandet', author: 'Honoré de Balzac', lang: 'fr' },
            { id: 58, title: 'Bel-Ami', author: 'Guy de Maupassant', lang: 'fr' },
            { id: 59, title: 'Une Vie', author: 'Guy de Maupassant', lang: 'fr' },
            { id: 38, title: 'Candide', author: 'Voltaire', lang: 'fr' },
            { id: 39, title: 'Zadig', author: 'Voltaire', lang: 'fr' },
            { id: 40, title: 'Micromégas', author: 'Voltaire', lang: 'fr' },
            { id: 143, title: 'Les Liaisons dangereuses', author: 'Pierre Choderlos de Laclos', lang: 'fr' },
            { id: 49, title: 'La Princesse de Clèves', author: 'Madame de La Fayette', lang: 'fr' },
            { id: 88, title: 'Paul et Virginie', author: 'Bernardin de Saint-Pierre', lang: 'fr' },
            { id: 50, title: 'Manon Lescaut', author: 'Abbé Prévost', lang: 'fr' },
            { id: 2612, title: 'Le Horla', author: 'Guy de Maupassant', lang: 'fr' },
            { id: 7016, title: 'Boule de Suif', author: 'Guy de Maupassant', lang: 'fr' },
            // Poésie française
            { id: 282, title: 'Les Fleurs du mal', author: 'Charles Baudelaire', lang: 'fr' },
            { id: 5618, title: 'Romances sans paroles', author: 'Paul Verlaine', lang: 'fr' },
            { id: 5619, title: 'Sagesse', author: 'Paul Verlaine', lang: 'fr' },
            { id: 5664, title: 'Une Saison en enfer', author: 'Arthur Rimbaud', lang: 'fr' },
            { id: 5663, title: 'Illuminations', author: 'Arthur Rimbaud', lang: 'fr' },
            // Anglais
            { id: 61, title: 'Frankenstein', author: 'Mary Shelley', lang: 'en' },
            { id: 62, title: 'Dracula', author: 'Bram Stoker', lang: 'en' },
            { id: 5, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', lang: 'en' },
            { id: 2546, title: 'The Importance of Being Earnest', author: 'Oscar Wilde', lang: 'en' },
            { id: 23, title: 'A Study in Scarlet', author: 'Arthur Conan Doyle', lang: 'en' },
            { id: 24, title: 'The Sign of the Four', author: 'Arthur Conan Doyle', lang: 'en' },
            { id: 8, title: 'The Strange Case of Dr Jekyll and Mr Hyde', author: 'Robert Louis Stevenson', lang: 'en' },
            { id: 254, title: 'A Christmas Carol', author: 'Charles Dickens', lang: 'en' }
        ]
    }
};

// Mots-clés de recherche par langue (termes qui fonctionnent bien sur Wikisource)
const SEARCH_TERMS = {
    fr: [
        'Les Fleurs du Mal', 'Fables de La Fontaine', 'Les Contemplations',
        'Baudelaire', 'Hugo poème', 'Verlaine', 'Rimbaud',
        'Maupassant nouvelle', 'Balzac', 'Zola chapitre',
        'Molière acte', 'Racine tragédie', 'La Fontaine fable',
        'Musset poésie', 'Lamartine méditation', 'Nerval sonnet',
        'Flaubert', 'Stendhal', 'Voltaire conte'
    ],
    en: [
        'Shakespeare sonnet', 'Milton Paradise', 'Keats ode',
        'Byron poem', 'Shelley', 'Wordsworth', 'Blake songs',
        'Dickens chapter', 'Austen', 'Poe tale',
        'Whitman leaves', 'Dickinson poem', 'Tennyson'
    ],
    de: [
        'Goethe Faust', 'Schiller', 'Heine Gedicht',
        'Rilke', 'Novalis', 'Hölderlin', 'Grimm Märchen',
        'Kafka', 'Mann Kapitel', 'Nietzsche'
    ],
    it: [
        'Dante Divina', 'Petrarca sonetto', 'Leopardi canto',
        'Manzoni capitolo', 'Boccaccio novella', 'Ariosto',
        'Pirandello', 'Foscolo', 'Carducci'
    ],
    es: [
        'Cervantes Quijote', 'Góngora soneto', 'Quevedo',
        'Lorca poema', 'Machado', 'Bécquer rima',
        'Calderón', 'Lope de Vega'
    ],
    pt: ['Camões soneto', 'Pessoa poema', 'Eça de Queirós', 'Machado de Assis'],
    ru: ['Пушкин стихотворение', 'Толстой глава', 'Достоевский', 'Чехов рассказ', 'Лермонтов'],
    la: ['Vergilius Aeneis', 'Horatius ode', 'Ovidius', 'Cicero', 'Catullus carmen'],
    zh: ['李白 詩', '杜甫', '蘇軾', '白居易'],
    ja: ['芥川龍之介', '夏目漱石', '太宰治', '宮沢賢治'],
    ar: ['المتنبي قصيدة', 'أبو تمام', 'البحتري'],
    el: ['Ομήρου', 'Σαπφώ', 'Πίνδαρος'],
};

// ═══════════════════════════════════════════════════════════
// 🗂️ COULEURS ET BRANCHES DE GENRE
// ═══════════════════════════════════════════════════════════

const GENRE_COLORS = {
    'poésie': '#bf5af2', 'poetry': '#bf5af2', 'Gedicht': '#bf5af2', 'poesia': '#bf5af2', 'poema': '#bf5af2',
    'fable': '#30d158', 'Fabel': '#30d158', 'favola': '#30d158', 'fábula': '#30d158',
    'conte': '#ff9f0a', 'tale': '#ff9f0a', 'Märchen': '#ff9f0a', 'racconto': '#ff9f0a', 'cuento': '#ff9f0a',
    'nouvelle': '#ff453a', 'story': '#ff453a', 'Novelle': '#ff453a', 'novella': '#ff453a',
    'théâtre': '#64d2ff', 'drama': '#64d2ff', 'theater': '#64d2ff', 'teatro': '#64d2ff',
    'texte': '#6e6e73', 'text': '#6e6e73',
    'mystique': '#ffd60a', 'mystic': '#ffd60a',
    'philosophie': '#ac8e68', 'philosophy': '#ac8e68',
    'roman': '#ff6482', 'novel': '#ff6482', 'Roman': '#ff6482', 'romanzo': '#ff6482'
};

// Branches enrichies par genre (auteurs majeurs + courants)
const GENRE_BRANCHES = {
    'philosophie': {
        'Courants': ['Rationalisme', 'Empirisme', 'Idéalisme', 'Existentialisme', 'Stoïcisme', 'Épicurisme', 'Scepticisme', 'Phénoménologie'],
        'Domaines': ['Métaphysique', 'Éthique', 'Épistémologie', 'Logique', 'Esthétique', 'Philosophie politique', 'Ontologie'],
        'Antiquité': ['Platon', 'Aristote', 'Épictète', 'Marc Aurèle', 'Sénèque', 'Cicéron', 'Lucrèce'],
        'XVIIe siècle': ['Descartes', 'Pascal', 'Spinoza', 'Leibniz', 'Malebranche', 'Hobbes', 'Locke'],
        'XVIIIe siècle': ['Voltaire', 'Rousseau', 'Montesquieu', 'Diderot', 'Hume', 'Kant', 'Condillac'],
        'XIXe siècle': ['Hegel', 'Schopenhauer', 'Nietzsche', 'Kierkegaard', 'Comte', 'Marx', 'Bergson']
    },
    'poésie': {
        'Formes': ['Sonnet', 'Ode', 'Élégie', 'Ballade', 'Fable', 'Épopée', 'Haïku'],
        'Mouvements': ['Romantisme', 'Parnasse', 'Symbolisme', 'Surréalisme', 'Baroque'],
        'XVIe siècle': ['Ronsard', 'Du Bellay', 'Louise Labé', 'Marot'],
        'XVIIe siècle': ['La Fontaine', 'Malherbe', 'Boileau', 'Racine'],
        'XIXe siècle': ['Hugo', 'Baudelaire', 'Verlaine', 'Rimbaud', 'Mallarmé', 'Lamartine', 'Musset', 'Nerval'],
        'XXe siècle': ['Apollinaire', 'Éluard', 'Aragon', 'Prévert', 'Char', 'Valéry']
    },
    'roman': {
        'Genres': ['Roman épistolaire', 'Roman historique', 'Roman réaliste', 'Roman naturaliste', 'Roman psychologique'],
        'XVIIe siècle': ['Madame de La Fayette', 'Scarron', 'Fénelon'],
        'XVIIIe siècle': ['Voltaire', 'Rousseau', 'Diderot', 'Laclos', 'Prévost', 'Bernardin de Saint-Pierre'],
        'XIXe siècle': ['Balzac', 'Stendhal', 'Flaubert', 'Zola', 'Maupassant', 'Hugo', 'Dumas', 'Sand'],
        'XXe siècle': ['Proust', 'Gide', 'Céline', 'Camus', 'Sartre', 'Colette']
    },
    'théâtre': {
        'Genres': ['Tragédie', 'Comédie', 'Drame', 'Farce', 'Vaudeville'],
        'Antiquité': ['Sophocle', 'Euripide', 'Eschyle', 'Aristophane', 'Plaute', 'Térence'],
        'XVIIe siècle': ['Molière', 'Racine', 'Corneille', 'Marivaux'],
        'XVIIIe siècle': ['Beaumarchais', 'Voltaire', 'Marivaux'],
        'XIXe siècle': ['Hugo', 'Musset', 'Rostand', 'Labiche'],
        'XXe siècle': ['Claudel', 'Giraudoux', 'Anouilh', 'Ionesco', 'Beckett']
    },
    'conte': {
        'Types': ['Conte merveilleux', 'Conte philosophique', 'Conte moral', 'Conte fantastique'],
        'Auteurs': ['Perrault', 'Grimm', 'Andersen', 'Voltaire', 'Maupassant', 'Hoffmann']
    },
    'nouvelle': {
        'Styles': ['Nouvelle réaliste', 'Nouvelle fantastique', 'Nouvelle psychologique'],
        'Auteurs': ['Maupassant', 'Mérimée', 'Balzac', 'Flaubert', 'Zola', 'Villiers de l\'Isle-Adam']
    },
    'mystique': {
        'Traditions': ['Mystique chrétienne', 'Mystique soufie', 'Kabbale'],
        'Auteurs': ['Thérèse d\'Avila', 'Jean de la Croix', 'Maître Eckhart', 'François de Sales', 'Fénelon', 'Bossuet']
    },
    'fable': {
        'Auteurs': ['La Fontaine', 'Ésope', 'Phèdre', 'Florian']
    },
    'histoire': {
        'Périodes': ['Antiquité', 'Moyen Âge', 'Renaissance', 'Révolution française', 'XIXe siècle'],
        'Historiens': ['Hérodote', 'Thucydide', 'Tacite', 'Michelet', 'Tocqueville', 'Voltaire']
    }
};

// Mappage des genres simples vers les catégories racines Wikisource
const CATEGORY_ROOTS = {
    fr: {
        'poésie': 'Catégorie:Poésie',
        'roman': 'Catégorie:Romans',
        'théâtre': 'Catégorie:Théâtre',
        'philosophie': 'Catégorie:Philosophie',
        'conte': 'Catégorie:Contes',
        'fable': 'Catégorie:Fables',
        'nouvelle': 'Catégorie:Nouvelles',
        'essai': 'Catégorie:Essais',
        'histoire': 'Catégorie:Histoire',
        'lettres': 'Catégorie:Correspondances',
        'mystique': 'Catégorie:Textes_spirituels'
    },
    en: {
        'poetry': 'Category:Poetry',
        'novel': 'Category:Novels',
        'drama': 'Category:Plays',
        'philosophy': 'Category:Philosophy',
        'tale': 'Category:Tales',
        'history': 'Category:History',
        'essay': 'Category:Essays'
    },
    de: {
        'Gedicht': 'Kategorie:Gedicht_Titel',
        'Roman': 'Kategorie:Roman',
        'Märchen': 'Kategorie:Märchen'
    }
};

// ═══════════════════════════════════════════════════════════
// 🌐 ÉTAT ET CONFIGURATION DE LANGUE
// ═══════════════════════════════════════════════════════════

// État de la langue courante ('all' = toutes langues, ou code langue spécifique)
let selectedLang = 'all';
let currentWikisource = WIKISOURCES[0];

// État de la navigation par catégorie
let currentCategoryPath = [];
let currentBrowseMode = null; // 'category' ou 'search'

// Fonction pour changer la langue
function changeLanguage(lang) {
    selectedLang = lang;
    localStorage.setItem('palimpseste_lang', lang);
    toast(lang === 'all' ? '🌍 Toutes les langues activées' : `🌐 Langue: ${WIKISOURCES.find(w => w.lang === lang)?.name || lang}`);
    // Recharger le feed avec la nouvelle langue
    shuffleFeed();
}

// Récupérer les Wikisources selon le filtre de langue
function getActiveWikisources() {
    if (selectedLang === 'all') return WIKISOURCES;
    return WIKISOURCES.filter(w => w.lang === selectedLang);
}

// ═══════════════════════════════════════════════════════════
// 🔍 RECHERCHE ET RÉCUPÉRATION DE TEXTES
// ═══════════════════════════════════════════════════════════

// Recherche via l'API - supporte plusieurs Wikisources
async function searchTexts(query, limit = 20, wikisource = currentWikisource) {
    const url = `${wikisource.url}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${limit}&srnamespace=0&format=json&origin=*`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        const results = (data.query?.search || []).map(r => ({ ...r, lang: wikisource.lang, wikisource }));
        return results;
    } catch (e) { 
        console.error('searchTexts error:', e);
        return []; 
    }
}

// Récupère le texte avec gestion intelligente (multilingue)
async function fetchText(page, depth = 0, wikisource = currentWikisource) {
    if (depth > 4) {
        return null;
    }
    
    // Filtrage précoce des pages indésirables
    if (!isValidTitle(page)) {
        return null;
    }
    
    const cacheKey = `${wikisource.lang}:${page}`;
    if (state.cache.has(cacheKey)) return state.cache.get(cacheKey);

    // Requête enrichie : texte + catégories + liens pour analyse du graphe
    const url = `${wikisource.url}/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=text|displaytitle|categories|links&pllimit=500&format=json&origin=*&redirects=true`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) return null;
        
        if (data.parse?.text) {
            // Vérifier le displaytitle aussi
            const displayTitle = data.parse.displaytitle || '';
            if (!isValidTitle(displayTitle)) return null;
            
            const html = data.parse.text['*'];
            const links = data.parse.links || [];
            
            // ═══ ANALYSE DU GRAPHE DES LIENS ═══
            // Compter les liens vers des sous-pages (même préfixe + "/")
            const basePage = page.split('/')[0];
            const subPageLinks = links.filter(l => {
                const title = l['*'] || '';
                return title.startsWith(basePage + '/') && l.ns === 0;
            });
            
            // Si la page a beaucoup de liens vers ses sous-pages, c'est un sommaire
            const isLikelySommaire = subPageLinks.length >= 5;
            
            if (isLikelySommaire && subPageLinks.length > 0) {
                // Choisir une sous-page au hasard et la suivre
                const randomSub = subPageLinks[Math.floor(Math.random() * subPageLinks.length)];
                return await fetchText(randomSub['*'], depth + 1, wikisource);
            }
            
            const analysis = analyzeHtml(html);
            
            // Si page d'index classique (redirections, éditions multiples)
            if (analysis.isIndex && analysis.subLink) {
                return await fetchText(analysis.subLink, depth + 1, wikisource);
            }
            
            // ═══ ANALYSE STATISTIQUE DE QUALITÉ ═══
            // Filtrage des "faux textes" (pages de garde, listes, etc.)
            const quality = analyzeContentQuality(analysis.text, links, page);
            if (!quality.isGood) {
                 // Si c'est rejeté parce que c'est un sommaire/liste, on essaie de trouver un lien pertinent
                 if (quality.reason === 'link_density' || quality.reason === 'listy') {
                     const contentLinks = links.filter(l => l.ns === 0 && !l['*'].includes(':'));
                     if (contentLinks.length > 0) {
                         const randomLink = contentLinks[Math.floor(Math.random() * contentLinks.length)];
                         return await fetchText(randomLink['*'], depth + 1, wikisource);
                     }
                 }
                 return null;
            }

            if (analysis.text && analysis.text.length > 150) {
                // Nettoyer le titre (supprimer HTML et spans)
                let cleanTitle = (data.parse.displaytitle || page)
                    .replace(/<[^>]+>/g, '')  // Supprimer tout HTML
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/mw-page-title[^\s]*/gi, '')  // Supprimer classes MW résiduelles
                    .trim();
                
                // Double vérification du titre nettoyé
                if (!isValidTitle(cleanTitle)) return null;
                
                // ===== DÉTECTION AUTEUR (multilingue) =====
                let detectedAuthor = null;
                
                // 1. Chercher dans les liens de la page (liens "Auteur:XXX" / "Author:XXX" / etc.)
                const authorPrefixes = ['Auteur:', 'Author:', 'Autor:', 'Autore:', '作者:'];
                for (const link of links) {
                    const linkTitle = link['*'] || '';
                    for (const prefix of authorPrefixes) {
                        if (linkTitle.startsWith(prefix)) {
                            const authorName = linkTitle.replace(prefix, '').trim();
                            if (authorName.length > 2 && authorName.length < 50) {
                                detectedAuthor = authorName;
                                break;
                            }
                        }
                    }
                    if (detectedAuthor) break;
                }
                
                // 2. Chercher dans les catégories (patterns multilingues)
                if (!detectedAuthor) {
                    const categories = data.parse.categories || [];
                    for (const cat of categories) {
                        const catName = cat['*'] || '';
                        // Patterns multilingues
                        const authorMatch = catName.match(/(?:Textes|Poèmes|Œuvres|Works|Texts|Poems|Werke|Opere|Obras)\s+(?:de|by|von|di)\s+(.+)/i);
                        if (authorMatch && authorMatch[1].length > 2) {
                            detectedAuthor = authorMatch[1].trim();
                            break;
                        }
                    }
                }
                
                // 3. Chercher un lien Auteur: dans le HTML
                if (!detectedAuthor) {
                    detectedAuthor = analysis.authorFromHtml;
                }
                
                const result = { 
                    text: analysis.text, 
                    title: cleanTitle,
                    author: detectedAuthor,
                    lang: wikisource.lang,
                    wikisource: wikisource
                };
                state.cache.set(cacheKey, result);
                return result;
            }
        }
        return null;
    } catch (e) { return null; }
}

// ═══════════════════════════════════════════════════════════
// 🔬 ANALYSE ET NETTOYAGE HTML
// ═══════════════════════════════════════════════════════════

function analyzeHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // ===== EXTRAIRE L'AUTEUR DEPUIS LE HTML =====
    let authorFromHtml = null;
    
    // 1. Chercher les liens "Auteur:XXX" dans le HTML
    const authorLinks = div.querySelectorAll('a[href*="Auteur:"]');
    for (const a of authorLinks) {
        const href = a.getAttribute('href') || '';
        const match = href.match(/Auteur:([^"&?#]+)/);
        if (match) {
            authorFromHtml = decodeURIComponent(match[1]).replace(/_/g, ' ').trim();
            break;
        }
    }
    
    // 2. Chercher dans les éléments de header/metadata Wikisource
    if (!authorFromHtml) {
        const headerAuthor = div.querySelector('.ws-author, .author, .auteur, [class*="auteur"]');
        if (headerAuthor) {
            const authorText = headerAuthor.textContent.trim();
            if (authorText.length > 2 && authorText.length < 50) {
                authorFromHtml = authorText;
            }
        }
    }
    
    // 3. Chercher le pattern "par XXX" ou "de XXX" en début de page
    if (!authorFromHtml) {
        const firstLines = div.textContent.substring(0, 500);
        const parMatch = firstLines.match(/(?:^|\n)\s*(?:par|de)\s+([A-ZÀ-Ü][a-zà-ü]+(?:\s+(?:de\s+)?[A-ZÀ-Ü][a-zà-ü\-]+){0,3})\s*(?:\n|$)/m);
        if (parMatch && parMatch[1].length > 3 && parMatch[1].length < 40) {
            authorFromHtml = parMatch[1].trim();
        }
    }
    
    // Supprimer tous les spans avec page-title AVANT toute analyse
    div.querySelectorAll('span[class*="page-title"], .mw-page-title-main, .mw-page-title').forEach(el => el.remove());
    
    // Détecter page d'index/sommaire (simplifié - seulement les cas évidents)
    const isRedirect = !!div.querySelector('.redirectMsg');
    const txt = div.textContent;
    const hasEditions = txt.includes('propose plusieurs éditions') || 
                       txt.includes('Cette page répertorie');
    
    // Seulement les redirections et pages d'éditions multiples sont des index
    const isIndex = isRedirect || hasEditions;
    
    // Trouver un sous-lien utile si c'est un index
    let subLink = null;
    if (isIndex) {
        const links = div.querySelectorAll('a[href^="/wiki/"]');
        for (const a of links) {
            const href = a.getAttribute('href');
            if (href && !href.includes(':') && !href.includes('Auteur') && !href.includes('Discussion')) {
                const name = decodeURIComponent(href.replace('/wiki/', ''));
                // Chercher des pages qui ressemblent à du contenu réel
                if (name.includes('/') && !name.endsWith('/')) {
                    // Éviter les pages de métadonnées
                    if (!name.includes('Préface') && !name.includes('Notice') && 
                        !name.includes('Table') && !name.includes('Index')) {
                        subLink = name;
                        break;
                    }
                }
            }
        }
    }
    
    // Nettoyer - supprimer tous les éléments non désirés
    div.querySelectorAll('.ws-noexport, .noprint, .mw-editsection, script, style, .reference, .toc, .navbox, .infobox, .metadata, .hatnote, .ambox, .catlinks, .mw-headline, .redirectMsg, .homonymie, .bandeau-homonymie, .bandeau-portail, .headertemplate, .ws-header, .mw-page-title-main, .mw-page-title, span[class*="page-title"], .titreoeuvre, .auteur-oeuvre, .header').forEach(el => el.remove());
    
    let content = div.querySelector('.prp-pages-output, .poem') || div.querySelector('.mw-parser-output') || div;
    
    // Supprimer TOUS les spans de MediaWiki
    content.querySelectorAll('span').forEach(el => {
        const cls = el.className || '';
        if (cls.includes('page-title') || cls.includes('mw-') || cls.includes('ws-')) {
            el.remove();
        }
    });
    
    let text = content.innerText || content.textContent;
    
    // Nettoyer les résidus HTML et MediaWiki
    text = text.replace(/\[modifier[^\]]*\]/g, '').replace(/\[\d+\]/g, '')
               .replace(/modifier le wikicode/gi, '').replace(/\n{3,}/g, '\n\n')
               .replace(/<span[^>]*>|<\/span>/gi, '')  // Supprimer spans résiduels
               .replace(/<[^>]+>/g, '')  // Supprimer tout HTML résiduel
               .replace(/mw-page-title[^\s]*/gi, '')  // Supprimer classes MW
               .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
               .replace(/Poésies \([^)]+\)/g, '')  // Supprimer titres de recueils parasites
               .trim();
    
    // Enlever métadonnées, préfaces, mentions de conférence en début
    const lines = text.split('\n');
    let start = 0;
    for (let i = 0; i < Math.min(15, lines.length); i++) {
        const l = lines[i].toLowerCase();
        const line = lines[i].trim();
        if (l.includes('sommaire') || l.includes('édition') || l.includes('navigation') || 
            l.includes('conférence') || l.includes('présenté') || l.includes('siège') ||
            l.includes('présidée par') || l.includes('professeur') || l.includes('faculté') ||
            l.includes('mw-page-title') || l.includes('span class') ||
            line.length < 3 || (line.startsWith('(') && line.endsWith(')'))) {
            start = i + 1;
        } else if (line.length > 40) break;
    }
    text = lines.slice(start).join('\n').trim();
    
    if (text.length > 5000) {
        text = text.substring(0, 5000);
        const cut = Math.max(text.lastIndexOf('\n\n'), text.lastIndexOf('. '));
        if (cut > 4000) text = text.substring(0, cut + 1);
        text += '\n\n[...]';
    }
    
    // ═══ DÉTECTION ROBUSTE DES SCORIES ═══
    if (isLikelyJunk(text)) {
        return { text: '', isIndex: true, subLink, authorFromHtml };
    }
    
    return { text, isIndex, subLink, authorFromHtml };
}

// ═══════════════════════════════════════════════════════════
// 🛡️ FILTRE MINIMAL - On laisse le graphe des liens faire le travail
// ═══════════════════════════════════════════════════════════
function isLikelyJunk(text) {
    // Filtre minimal : juste vérifier qu'il y a du contenu
    if (!text || text.length < 100) return true;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return true;
    return false;
}

// Filtrage généraliste du titre (exclut les pages non littéraires)
function isValidTitle(title) {
    if (!title || title.length < 3) return false;
    const t = title.toLowerCase();
    
    // Exclure les namespaces spéciaux (universel)
    if (t.includes('category:') || t.includes('catégorie:') || 
        t.includes('kategorie:') || t.includes('categoria:')) return false;
    
    // Liste étendue des namespaces wiki
    if (/^(help|aide|hilfe|aiuto|ayuda|ajuda|manual|project|projet|image|file|fichier|template|modèle|module|media|special|spécial):/i.test(t)) return false;

    if (t.includes('author:') || t.includes('auteur:') || 
        t.includes('autor:') || t.includes('autore:')) return false;
    if (t.includes('talk:') || t.includes('discussion:') || 
        t.includes('diskussion:') || t.includes('discussione:')) return false;
    if (t.includes('index:') || t.includes('page:') || t.includes('file:')) return false;
    
    // Exclure les listes (pattern universel)
    if (/^list[ea]?\s+(de|of|di|von)/i.test(t)) return false;
    if (t.startsWith('index ') || t.endsWith(' index')) return false;
    if (t.includes('table des matières') || t.includes('table of contents') || t.includes('inhaltsverzeichnis')) return false;
    if (t.includes('bibliographie') || t.includes('bibliography')) return false;
    
    // Exclure les études biographiques et critiques (souvent des pages de garde)
    if (t.includes('sa vie et son œuvre') || t.includes('sa vie et son oeuvre')) return false;
    if (t.includes('his life and work') || t.includes('sein leben')) return false;
    if (t.includes('étude biographique') || t.includes('étude sur')) return false;
    if (t.includes('biographical study') || t.includes('biography of')) return false;
    if (/\bbiograph/i.test(t) && !t.includes('/')) return false;
    
    // Exclure les œuvres complètes sans sous-page (ce sont des sommaires)
    if ((t.includes('œuvres complètes') || t.includes('complete works') || 
         t.includes('gesammelte werke') || t.includes('opere complete')) && !t.includes('/')) return false;
    
    return true;
}

// ═══════════════════════════════════════════════════════════
// 🕵️ ANALYSE DE QUALITÉ DU CONTENU (Heuristiques)
// ═══════════════════════════════════════════════════════════
function analyzeContentQuality(text, links, title) {
    if (!text) return { isGood: false, reason: 'empty' };
    const len = text.length;
    
    // 1. Trop court = Fragment ou erreur
    if (len < 300) return { isGood: false, reason: 'too_short' };
    
    // 2. Trop long = Livre entier non découpé (mauvaise UX)
    if (len > 80000) return { isGood: false, reason: 'too_long' };
    
    // 3. Densité de liens (Link Density)
    // Si une page est composée à 20% de liens, c'est un sommaire/hub
    // On estime ~30 chars par lien en moyenne (titre + balise)
    const linkCharsEstimate = links.length * 30;
    const linkDensity = linkCharsEstimate / len;
    
    // Seuil : > 25% de liens = Sommaire
    if (linkDensity > 0.25) return { isGood: false, reason: 'link_density' };
    
    // 4. Structure "Paragraphe" vs "Liste"
    // Un vrai texte a des phrases qui finissent par des points.
    // Une liste a des retours à la ligne fréquents sans ponctuation.
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const avgLineLength = len / Math.max(1, lines.length);
    
    // Si lignes très courtes (< 50 chars) ET pas de ponctuation finale
    if (avgLineLength < 60) {
        // Exception pour la poésie : lignes courtes mais strophes
        // Vérifier la ponctuation
        const linesEndingWithPunctuation = lines.filter(l => /[.!?…:;]$/.test(l.trim())).length;
        const punctuationRatio = linesEndingWithPunctuation / lines.length;
        
        // Si peu de ponctuation finale (< 30%), c'est une liste brute
        if (punctuationRatio < 0.3) return { isGood: false, reason: 'listy' };
    }
    
    // 5. Structure Words (Meta-titres)
    const t = title.toLowerCase();
    const badWords = ['sommaire', 'contents', 'inhalt', 'table', 'index', 'chapitres', 'chapters'];
    if (badWords.some(w => t.includes(w))) return { isGood: false, reason: 'title_blacklist' };

    return { isGood: true };
}

// ═══════════════════════════════════════════════════════════
// 📚 PROJECT GUTENBERG - Classiques du domaine public
// ═══════════════════════════════════════════════════════════
async function fetchGutenberg() {
    const works = ALT_SOURCES.gutenberg.works;
    // Filtrer par langue si nécessaire
    const filtered = selectedLang === 'all' 
        ? works 
        : works.filter(w => w.lang === selectedLang);
    
    if (filtered.length === 0) return [];
    
    // Choisir une œuvre au hasard
    const work = filtered[Math.floor(Math.random() * filtered.length)];
    const cacheKey = `gutenberg:${work.id}`;
    
    // Éviter les doublons
    if (state.shownPages.has(cacheKey)) return [];
    
    try {
        // Utiliser l'API de téléchargement texte de Gutenberg
        const res = await fetch(`https://www.gutenberg.org/files/${work.id}/${work.id}-0.txt`, {
            mode: 'cors'
        }).catch(() => 
            // Fallback sur un autre format
            fetch(`https://www.gutenberg.org/cache/epub/${work.id}/pg${work.id}.txt`)
        );
        
        if (!res.ok) throw new Error('Gutenberg fetch failed');
        
        let text = await res.text();
        
        // Nettoyer le texte Gutenberg (retirer header/footer légaux)
        const startMarkers = ['*** START OF', '***START OF', 'START OF THE PROJECT'];
        const endMarkers = ['*** END OF', '***END OF', 'END OF THE PROJECT', 'End of Project'];
        
        for (const marker of startMarkers) {
            const idx = text.indexOf(marker);
            if (idx !== -1) {
                const nextLine = text.indexOf('\n', idx);
                text = text.substring(nextLine + 1);
                break;
            }
        }
        
        for (const marker of endMarkers) {
            const idx = text.indexOf(marker);
            if (idx !== -1) {
                text = text.substring(0, idx);
                break;
            }
        }
        
        // Prendre un extrait aléatoire (pas tout le livre!)
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 100);
        if (paragraphs.length > 10) {
            // Choisir un passage au hasard (pas le début)
            const startIdx = Math.floor(Math.random() * Math.max(1, paragraphs.length - 10)) + 5;
            const excerpt = paragraphs.slice(startIdx, startIdx + 5).join('\n\n');
            
            return [{
                title: work.title,
                text: excerpt.trim(),
                author: work.author,
                source: 'gutenberg',
                lang: work.lang,
                gutenbergId: work.id
            }];
        }
    } catch (e) {
        console.error('Gutenberg error:', work.title, e);
    }
    return [];
}

// ═══════════════════════════════════════════════════════════
// 📜 POETRYDB - Poésie anglaise de qualité (pas de scories!)
// ═══════════════════════════════════════════════════════════
async function fetchPoetryDB() {
    const authors = ALT_SOURCES.poetrydb.authors;
    const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
    
    try {
        const res = await fetch(`https://poetrydb.org/author/${encodeURIComponent(randomAuthor)}/title,author,lines`);
        const poems = await res.json();
        
        if (Array.isArray(poems) && poems.length > 0) {
            // Prendre quelques poèmes au hasard
            const shuffled = poems.sort(() => Math.random() - 0.5).slice(0, 5);
            
            return shuffled.map(poem => ({
                title: poem.title,
                text: poem.lines.join('\n'),
                author: poem.author,
                source: 'poetrydb',
                lang: 'en'
            }));
        }
    } catch (e) {
        console.error('PoetryDB error:', e);
    }
    return [];
}

// ═══════════════════════════════════════════════════════════
// 📚 GALLICA (BNF) - Bibliothèque Nationale de France
// ═══════════════════════════════════════════════════════════
async function fetchGallica() {
    if (selectedLang !== 'all' && selectedLang !== 'fr') return [];
    
    const collections = ALT_SOURCES.gallica.collections;
    const collection = collections[Math.floor(Math.random() * collections.length)];
    const cacheKey = `gallica:${collection.query}`;
    
    // Éviter les doublons
    if (state.shownPages.has(cacheKey)) return [];
    
    try {
        // Recherche via l'API SRU de Gallica (documents textuels)
        const searchUrl = `https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=dc.title%20all%20"${encodeURIComponent(collection.query)}"&maximumRecords=10&startRecord=1`;
        
        const res = await fetch(searchUrl);
        const xmlText = await res.text();
        
        // Parser le XML pour extraire les identifiants ARK
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, 'text/xml');
        const records = xml.querySelectorAll('record');
        
        const results = [];
        for (const record of records) {
            const identifier = record.querySelector('identifier')?.textContent;
            const title = record.querySelector('title')?.textContent || collection.query;
            
            if (identifier && identifier.includes('ark:')) {
                const arkId = identifier.match(/ark:\/\d+\/\w+/)?.[0];
                if (arkId) {
                    results.push({
                        title: title.split('/')[0].trim(),
                        author: collection.author,
                        arkId: arkId,
                        source: 'gallica',
                        lang: 'fr',
                        sourceUrl: `https://gallica.bnf.fr/${arkId}`
                    });
                }
            }
        }
        
        // Retourner un résultat aléatoire avec un extrait simulé
        if (results.length > 0) {
            const item = results[Math.floor(Math.random() * results.length)];
            return [{
                title: item.title,
                author: item.author,
                text: `[Extrait de "${item.title}" disponible sur Gallica]\n\nConsultez l'œuvre complète sur gallica.bnf.fr`,
                source: 'gallica',
                sourceUrl: item.sourceUrl,
                lang: 'fr',
                isPreloaded: true
            }];
        }
    } catch (e) {
        console.error('Gallica error:', e);
    }
    return [];
}

// ═══════════════════════════════════════════════════════════
// 📖 ARCHIVE.ORG - Internet Archive (textes complets)
// ═══════════════════════════════════════════════════════════
async function fetchArchiveOrg() {
    const works = ALT_SOURCES.archiveorg.works;
    // Filtrer par langue si nécessaire
    const filtered = selectedLang === 'all' 
        ? works 
        : works.filter(w => w.lang === selectedLang);
    
    if (filtered.length === 0) return [];
    
    // Choisir une œuvre au hasard
    const work = filtered[Math.floor(Math.random() * filtered.length)];
    const cacheKey = `archiveorg:${work.id}`;
    
    // Éviter les doublons
    if (state.shownPages.has(cacheKey)) return [];
    
    try {
        // Utiliser l'API metadata pour obtenir des infos
        const metaRes = await fetch(`https://archive.org/metadata/${work.id}`);
        const metadata = await metaRes.json();
        
        // Chercher un fichier texte dans les fichiers disponibles
        const textFile = metadata.files?.find(f => 
            f.name.endsWith('.txt') && !f.name.includes('_djvu')
        );
        
        if (textFile) {
            const textUrl = `https://archive.org/download/${work.id}/${textFile.name}`;
            const textRes = await fetch(textUrl);
            let text = await textRes.text();
            
            // Nettoyer et extraire un passage
            const paragraphs = text.split(/\n\n+/).filter(p => 
                p.trim().length > 100 && 
                !p.includes('Internet Archive') &&
                !p.includes('Digitized by')
            );
            
            if (paragraphs.length > 10) {
                const startIdx = Math.floor(Math.random() * Math.max(1, paragraphs.length - 8)) + 5;
                const excerpt = paragraphs.slice(startIdx, startIdx + 4).join('\n\n');
                
                return [{
                    title: work.title,
                    text: excerpt.trim(),
                    author: work.author,
                    source: 'archiveorg',
                    sourceUrl: `https://archive.org/details/${work.id}`,
                    lang: work.lang,
                    archiveId: work.id
                }];
            }
        }
    } catch (e) {
        console.error('Archive.org error:', work.title, e);
    }
    return [];
}

// ═══════════════════════════════════════════════════════════
// 📱 FEEDBOOKS - Livres du domaine public (OPDS)
// ═══════════════════════════════════════════════════════════
async function fetchFeedbooks() {
    const works = ALT_SOURCES.feedbooks.works;
    // Filtrer par langue si nécessaire
    const filtered = selectedLang === 'all' 
        ? works 
        : works.filter(w => w.lang === selectedLang);
    
    if (filtered.length === 0) return [];
    
    // Choisir une œuvre au hasard
    const work = filtered[Math.floor(Math.random() * filtered.length)];
    const cacheKey = `feedbooks:${work.id}`;
    
    // Éviter les doublons
    if (state.shownPages.has(cacheKey)) return [];
    
    try {
        // L'API OPDS de Feedbooks permet de récupérer les métadonnées
        // Note: L'accès direct au texte nécessite de télécharger l'EPUB
        // On retourne les métadonnées avec un lien vers la source
        
        return [{
            title: work.title,
            author: work.author,
            text: `[Œuvre complète disponible sur Feedbooks]\n\n"${work.title}" de ${work.author}\n\nCe texte du domaine public est disponible gratuitement en téléchargement.`,
            source: 'feedbooks',
            sourceUrl: `https://www.feedbooks.com/book/${work.id}`,
            lang: work.lang,
            feedbooksId: work.id,
            isPreloaded: true
        }];
    } catch (e) {
        console.error('Feedbooks error:', work.title, e);
    }
    return [];
}

// ═══════════════════════════════════════════════════════════
// 🌍 ALIMENTER LE POOL - Littérature mondiale
// ═══════════════════════════════════════════════════════════
async function fillPool() {
    // === 1. POETRYDB (si anglais actif) - Qualité garantie ===
    if (selectedLang === 'all' || selectedLang === 'en') {
        try {
            const poems = await fetchPoetryDB();
            for (const poem of poems) {
                if (!state.shownPages.has('poetrydb:' + poem.title)) {
                    // Ajouter EN PRIORITÉ (pas de scories!)
                    state.textPool.unshift({
                        title: poem.title,
                        text: poem.text,
                        author: poem.author,
                        lang: 'en',
                        source: 'poetrydb',
                        isPreloaded: true // Texte déjà chargé
                    });
                }
            }
        } catch (e) {
            console.error('PoetryDB fillPool error:', e);
        }
    }
    
    // === 1.5 PROJECT GUTENBERG - Classiques du domaine public ===
    try {
        const gutenbergTexts = await fetchGutenberg();
        for (const item of gutenbergTexts) {
            state.textPool.unshift({
                ...item,
                isPreloaded: true
            });
        }
    } catch (e) {
        console.error('Gutenberg fillPool error:', e);
    }
    
    // === 1.6 ARCHIVE.ORG - Internet Archive ===
    try {
        const archiveTexts = await fetchArchiveOrg();
        for (const item of archiveTexts) {
            state.textPool.unshift({
                ...item,
                isPreloaded: true
            });
        }
    } catch (e) {
        console.error('Archive.org fillPool error:', e);
    }
    
    // === 1.7 FEEDBOOKS - Domaine public (français) ===
    if (selectedLang === 'all' || selectedLang === 'fr') {
        try {
            const feedbooksTexts = await fetchFeedbooks();
            for (const item of feedbooksTexts) {
                state.textPool.unshift({
                    ...item,
                    isPreloaded: true
                });
            }
        } catch (e) {
            console.error('Feedbooks fillPool error:', e);
        }
    }
    
    // === 2. WIKISOURCE (sources traditionnelles) ===
    const activeSources = getActiveWikisources();
    if (activeSources.length === 0 && state.textPool.length === 0) {
        console.error('Aucune source active');
        return;
    }
    const shuffledSources = [...activeSources].sort(() => Math.random() - 0.5).slice(0, Math.min(3, activeSources.length));
    
    for (const ws of shuffledSources) {
        const terms = [...(SEARCH_TERMS[ws.lang] || SEARCH_TERMS.en)];
        const selectedTerms = terms.sort(() => Math.random() - 0.5).slice(0, 5);
        
        for (const term of selectedTerms) {
            try {
                const results = await searchTexts(term, 15, ws);
                for (const r of results) {
                    if (!state.shownPages.has(r.title) && !state.textPool.some(t => t.title === r.title)) {
                        // Filtrage généraliste par structure du titre
                        if (isValidTitle(r.title) && r.snippet?.length > 20) {
                            // Prioriser les sous-pages (contenu réel)
                            const item = { 
                                title: r.title, 
                                snippet: r.snippet, 
                                lang: ws.lang,
                                wikisource: ws 
                            };
                            if (r.title.includes('/')) {
                                state.textPool.unshift(item);
                            } else {
                                state.textPool.push(item);
                            }
                        }
                    }
                }
            } catch (e) { 
                console.error('fillPool error:', e);
            }
        }
    }
    state.textPool = [...state.textPool].sort(() => Math.random() - 0.5);
}

// ═══════════════════════════════════════════════════════════
// 🕸️ EXPLORATION PAR ARBORESCENCE (Catégories)
// ═══════════════════════════════════════════════════════════

async function exploreCategory(genreOrCategoryName, isSubCat = false) {
    // Protection contre les clics multiples
    if (state.loading) {
        console.log('🛑 Chargement en cours, ignoré');
        return;
    }
    state.loading = true;
    
    const wikisource = currentWikisource;
    const lang = wikisource.lang;
    const genreLower = genreOrCategoryName.toLowerCase();
    
    // Afficher l'UI
    document.getElementById('categoryNav').style.display = 'block';
    document.getElementById('catSubcategories').innerHTML = '<div style="color:var(--muted)">Chargement...</div>';
    document.getElementById('feed').innerHTML = '';
    state.textPool = [];
    
    // Cas 1: C'est un genre racine avec branches enrichies
    if (!isSubCat && GENRE_BRANCHES[genreLower]) {
        currentCategoryPath = [genreOrCategoryName];
        currentBrowseMode = 'branches';
        renderBreadcrumbs();
        renderEnrichedBranches(genreLower);
        state.loading = false;
        return;
    }
    
    // Cas 2: C'est une branche (recherche par terme)
    if (!isSubCat) {
        currentCategoryPath = [genreOrCategoryName];
    } else if (!currentCategoryPath.includes(genreOrCategoryName)) {
        currentCategoryPath.push(genreOrCategoryName);
    } else {
        const index = currentCategoryPath.indexOf(genreOrCategoryName);
        currentCategoryPath = currentCategoryPath.slice(0, index + 1);
    }
    
    renderBreadcrumbs();
    currentBrowseMode = 'search';
    
    // Rechercher sur Wikisource
    try {
        await searchByTerm(genreOrCategoryName, wikisource);
    } finally {
        state.loading = false;
    }
}

// Affiche les branches enrichies pour un genre
function renderEnrichedBranches(genre) {
    const branches = GENRE_BRANCHES[genre];
    if (!branches) return;
    
    const container = document.getElementById('catSubcategories');
    let html = '<div class="branches-container">';
    
    for (const [groupName, items] of Object.entries(branches)) {
        html += `<div class="branch-group">
            <div class="branch-group-title">${groupName}</div>
            <div class="branch-items">
                ${items.map(item => `<div class="cat-pill" onclick="exploreCategory('${item.replace(/'/g, "\\'")}', true)">${item}</div>`).join('')}
            </div>
        </div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Message d'info
    document.getElementById('feed').innerHTML = '<div class="empty-state">👆 Choisissez une branche ci-dessus pour explorer les textes</div>';
}

// Recherche par terme (auteur, courant, etc.)
async function searchByTerm(term, wikisource) {
    // Ne pas re-vérifier loading car déjà fait dans exploreCategory
    document.getElementById('catSubcategories').innerHTML = `<div style="color:var(--muted)">🔍 Recherche "${term}"...</div>`;
    
    try {
        // Recherche élargie sur Wikisource
        const results = await searchTexts(term, 50, wikisource);
        
        // Filtrer les résultats valides
        const validResults = results.filter(r => isValidTitle(r.title) && r.snippet?.length > 20);
        
        // Info sur les résultats
        const container = document.getElementById('catSubcategories');
        if (validResults.length > 0) {
            container.innerHTML = `<div style="font-size:0.8rem; color:var(--accent);">📚 ${validResults.length} texte${validResults.length > 1 ? 's' : ''} trouvé${validResults.length > 1 ? 's' : ''} pour "${term}"</div>`;
        } else {
            container.innerHTML = `<div style="font-size:0.8rem; color:var(--muted);">Aucun résultat pour "${term}"</div>`;
        }
        
        // Remplir le pool
        state.textPool = validResults.map(r => ({
            title: r.title,
            snippet: r.snippet,
            lang: wikisource.lang,
            wikisource: wikisource,
            source: 'search_exploration'
        }));
        
        // Mélanger et charger
        state.textPool = state.textPool.sort(() => Math.random() - 0.5);
        
        if (state.textPool.length > 0) {
            // IMPORTANT: Remettre loading à false AVANT d'appeler loadMore
            // sinon loadMore() retourne immédiatement car state.loading est true
            state.loading = false;
            loadMore();
        } else {
            document.getElementById('feed').innerHTML = `<div class="empty-state">Aucun texte trouvé pour "${term}".<br>Essayez un autre terme.</div>`;
        }
        
    } catch (e) {
        console.error('Search error:', e);
        document.getElementById('catSubcategories').innerHTML = '<div style="color:var(--accent)">Erreur de recherche</div>';
    }
}

async function fetchCategoryData(categoryName, wikisource) {
    // Récupérer sous-catégories et pages
    const url = `${wikisource.url}/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(categoryName)}&cmlimit=100&format=json&origin=*`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        const members = data.query?.categorymembers || [];
        
        const subcats = members.filter(m => m.ns === 14); // 14 = Category
        const pages = members.filter(m => m.ns === 0);    // 0 = Page
        
        renderSubcategories(subcats, pages.length);
        
        // Remplir le pool avec les pages trouvées
        state.textPool = []; // Reset pour cette catégorie
        for (const p of pages) {
            if (isValidTitle(p.title)) {
                 state.textPool.push({
                     title: p.title,
                     lang: wikisource.lang,
                     wikisource: wikisource,
                     source: 'category_exploration'
                 });
            }
        }
        
        // Mélanger et charger
        state.textPool = state.textPool.sort(() => Math.random() - 0.5);
        
        if (state.textPool.length > 0) {
            loadMore();
        } else if (subcats.length === 0) {
            document.getElementById('feed').innerHTML = '<div class="empty-state">Aucun texte direct dans cette catégorie.<br>Essayez une autre branche.</div>';
        }
        
    } catch (e) {
        console.error('Category error:', e);
        document.getElementById('catSubcategories').innerHTML = '<div style="color:var(--accent)">Erreur de chargement</div>';
    }
}

function renderBreadcrumbs() {
    const container = document.getElementById('catBreadcrumbs');
    container.innerHTML = currentCategoryPath.map((cat, idx) => {
        const name = cat.split(':')[1] || cat;
        const isLast = idx === currentCategoryPath.length - 1;
        return `
            <span class="cat-crumb ${isLast ? 'active' : ''}" onclick="exploreCategory('${cat.replace(/'/g, "\\'")}', true)">${name}</span>
            ${!isLast ? '<span class="cat-sep">></span>' : ''}
        `;
    }).join('');
}

function renderSubcategories(subcats, pageCount = 0) {
    const container = document.getElementById('catSubcategories');
    
    let html = '';
    
    // Info sur les pages directes
    if (pageCount > 0) {
        html += `<div style="font-size:0.8rem; color:var(--accent); margin-bottom:0.5rem;">📚 ${pageCount} texte${pageCount > 1 ? 's' : ''} dans cette catégorie</div>`;
    }
    
    if (subcats.length === 0) {
        if (pageCount === 0) {
            html += '<div style="font-size:0.8rem; color:var(--muted); font-style:italic;">Catégorie vide ou sous-pages uniquement</div>';
        }
        container.innerHTML = html;
        return;
    }
    
    html += `<div style="font-size:0.75rem; color:var(--muted); margin-bottom:0.3rem;">↳ ${subcats.length} sous-catégorie${subcats.length > 1 ? 's' : ''} :</div>`;
    html += subcats.map(c => {
        const name = (c.title.split(':')[1] || c.title).replace(/_/g, ' ');
        return `<div class="cat-pill" onclick="exploreCategory('${c.title.replace(/'/g, "\\'")}', true)">${name}</div>`;
    }).join('');
    
    container.innerHTML = html;
}

function closeCategoryMode() {
    document.getElementById('categoryNav').style.display = 'none';
    currentCategoryPath = [];
    shuffleFeed(); // Revenir au mode normal
}

// ═══════════════════════════════════════════════════════════
// 🎭 DÉTECTION D'AUTEUR ET DE GENRE
// ═══════════════════════════════════════════════════════════

// Normalise un nom d'auteur (simplifié - accepte tout nom valide)
function normalizeAuthor(rawAuthor) {
    if (!rawAuthor) return null;
    // Nettoyer le nom
    let clean = rawAuthor
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Vérifier que c'est un nom valide (commence par majuscule, longueur raisonnable)
    if (clean.length > 2 && clean.length < 60 && /^[A-ZÀ-ÜА-Яぁ-んァ-ン一-龯\u0600-\u06FF]/.test(clean)) {
        return clean;
    }
    return null;
}

function detectAuthor(title, text, metadataAuthor = null) {
    // 1. PRIORITÉ : Auteur des métadonnées Wikisource (liens, catégories)
    if (metadataAuthor) {
        const normalized = normalizeAuthor(metadataAuthor);
        if (normalized) return normalized;
    }
    
    // 2. Chercher dans le titre (format "Œuvre (Auteur)")
    const parenthMatch = title.match(/\(([^)]+)\)$/);
    if (parenthMatch) {
        const potentialAuthor = parenthMatch[1].trim();
        // Vérifier que ça ressemble à un nom de personne
        if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü]+)*$/.test(potentialAuthor)) {
            return potentialAuthor;
        }
    }
    
    // 3. Chercher dans le titre - format "Auteur - Œuvre" ou "Œuvre - Auteur"
    const dashMatch = title.match(/^([^—–\-]+)[—–\-](.+)$/);
    if (dashMatch) {
        const part1 = dashMatch[1].trim();
        const part2 = dashMatch[2].trim();
        // Tester si l'une des parties est un nom de personne
        if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü]+)*$/.test(part1)) return part1;
        if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü]+)*$/.test(part2)) return part2;
    }
    
    return 'Anonyme';
}

function detectTag(title, text) {
    const t = (title + ' ' + (text || '').substring(0, 500)).toLowerCase();
    const titleLower = title.toLowerCase();
    
    // Théâtre (prioritaire - mots très spécifiques)
    if (t.includes('acte ') || t.includes('scène ') || titleLower.includes('tragédie') || 
        titleLower.includes('comédie') || t.includes('personnages:') || t.includes('le chœur')) return 'théâtre';
    
    // Fable (prioritaire)
    if (titleLower.includes('fable') || (t.includes('morale') && t.includes('la fontaine'))) return 'fable';
    
    // Conte
    if (titleLower.includes('conte') || titleLower.includes('il était une fois')) return 'conte';
    
    // Poésie (mots spécifiques au genre)
    if (titleLower.includes('sonnet') || titleLower.includes('poème') || titleLower.includes('poésie') ||
        titleLower.includes('ode ') || titleLower.includes('ballade') || titleLower.includes('élégie') ||
        titleLower.includes('stances') || titleLower.includes('hymne') || titleLower.includes('rondeau') ||
        titleLower.includes('complainte') || titleLower.includes('chanson')) return 'poésie';
    // Détection poésie par structure (vers courts, rimes)
    const lines = (text || '').split('\n').slice(0, 20);
    const shortLines = lines.filter(l => l.trim().length > 5 && l.trim().length < 60);
    if (shortLines.length > 10) return 'poésie';
    
    // Nouvelle
    if (titleLower.includes('nouvelle')) return 'nouvelle';
    
    // Roman
    if (titleLower.includes('chapitre') || titleLower.includes('roman') || 
        titleLower.includes('livre ') || titleLower.includes('partie ')) return 'roman';
    
    // Philosophie (termes spécifiques)
    if (titleLower.includes('pensées') || titleLower.includes('maximes') || titleLower.includes('réflexions') ||
        titleLower.includes('essai') || titleLower.includes('discours sur') || titleLower.includes('traité') ||
        titleLower.includes('lettres à') || titleLower.includes('entretiens')) return 'philosophie';
    
    // Mystique (termes TRÈS spécifiques seulement)
    if (titleLower.includes('sermon') || titleLower.includes('oraison') || titleLower.includes('prière') ||
        titleLower.includes('méditation') || titleLower.includes('spirituel') || titleLower.includes('mystique') ||
        titleLower.includes('contemplation') || titleLower.includes('extase') || titleLower.includes('château intérieur') ||
        titleLower.includes('nuit obscure') || titleLower.includes('imitation de')) return 'mystique';
    
    return 'texte';
}

// ═══════════════════════════════════════════════════════════
// 📤 EXPORTS GLOBAUX
// ═══════════════════════════════════════════════════════════

// Exposer les configurations et fonctions au scope global
window.WIKISOURCES = WIKISOURCES;
window.ALT_SOURCES = ALT_SOURCES;
window.SEARCH_TERMS = SEARCH_TERMS;
window.GENRE_COLORS = GENRE_COLORS;
window.GENRE_BRANCHES = GENRE_BRANCHES;
window.CATEGORY_ROOTS = CATEGORY_ROOTS;

// Exposer les variables d'état
window.getSelectedLang = () => selectedLang;
window.setSelectedLang = (lang) => { selectedLang = lang; };
window.getCurrentWikisource = () => currentWikisource;
window.setCurrentWikisource = (ws) => { currentWikisource = ws; };

// Exposer les fonctions
window.changeLanguage = changeLanguage;
window.getActiveWikisources = getActiveWikisources;
window.searchTexts = searchTexts;
window.fetchText = fetchText;
window.analyzeHtml = analyzeHtml;
window.isLikelyJunk = isLikelyJunk;
window.isValidTitle = isValidTitle;
window.analyzeContentQuality = analyzeContentQuality;
window.fetchGutenberg = fetchGutenberg;
window.fetchPoetryDB = fetchPoetryDB;
window.fetchGallica = fetchGallica;
window.fetchArchiveOrg = fetchArchiveOrg;
window.fetchFeedbooks = fetchFeedbooks;
window.fillPool = fillPool;
window.exploreCategory = exploreCategory;
window.renderEnrichedBranches = renderEnrichedBranches;
window.searchByTerm = searchByTerm;
window.fetchCategoryData = fetchCategoryData;
window.renderBreadcrumbs = renderBreadcrumbs;
window.renderSubcategories = renderSubcategories;
window.closeCategoryMode = closeCategoryMode;
window.normalizeAuthor = normalizeAuthor;
window.detectAuthor = detectAuthor;
window.detectTag = detectTag;
