// ═══════════════════════════════════════════════════════════
// 🔥 TENDANCES → trending.js
// 📤 PARTAGE → share.js
// 📱 FEED SOCIAL → social.js
// 💬 COMMENTAIRES → comments.js
// 💬 MESSAGERIE → messaging.js
// 👥 FOLLOWERS/PROFILS → followers.js
// 🌍 SOURCES → sources.js
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// 📊 ÉTAT GLOBAL DE L'APPLICATION
// ═══════════════════════════════════════════════════════════

// Graphe dynamique des connexions (enrichi au fur et à mesure)
let authorConnections = {};

let state = {
    likes: new Set(), readCount: 0, loading: false, cache: new Map(),
    textPool: [], shownPages: new Set(), cardIdx: 0,
    authorStats: {}, genreStats: {},
    likedAuthors: new Set(), discoveredConnections: new Set(),
    achievements: [], readingPath: [],
    // Statistiques de lecture
    readingStats: {
        totalWordsRead: 0,
        totalReadingTime: 0, // en secondes
        streak: 0,
        lastReadDate: null,
        sessionsToday: 0,
        bestStreak: 0,
        dailyWords: {} // { 'YYYY-MM-DD': wordsCount }
    }
};

// Timer de lecture
let readingTimer = null;
let sessionStartTime = null;

// ═══════════════════════════════════════════════════════════
// 🎨 GESTION DU THÈME (CLAIR/SOMBRE)
// ═══════════════════════════════════════════════════════════

function initTheme() {
    // Charger la préférence depuis localStorage
    const savedTheme = localStorage.getItem('palimpseste-theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    updateThemeIcons();
}

function toggleTheme() {
    const root = document.documentElement;
    const isLight = root.getAttribute('data-theme') === 'light';
    
    if (isLight) {
        // Passer en mode sombre
        root.removeAttribute('data-theme');
        localStorage.setItem('palimpseste-theme', 'dark');
    } else {
        // Passer en mode clair
        root.setAttribute('data-theme', 'light');
        localStorage.setItem('palimpseste-theme', 'light');
    }
    
    updateThemeIcons();
}

function updateThemeIcons() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    
    // Bouton header desktop
    const headerBtn = document.getElementById('themeToggle');
    if (headerBtn) {
        headerBtn.innerHTML = isLight ? '☾' : '☀︎';
        headerBtn.title = isLight ? 'Mode sombre' : 'Mode clair';
    }
    
    // Bouton drawer mobile - icône Lucide
    const drawerIcon = document.getElementById('drawerThemeIcon');
    const drawerText = document.getElementById('drawerThemeText');
    if (drawerIcon) {
        drawerIcon.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
        // Réinitialiser Lucide pour l'icône
        if (window.lucide) lucide.createIcons();
    }
    if (drawerText) drawerText.textContent = isLight ? 'Mode sombre' : 'Mode clair';
}

// ═══════════════════════════════════════════════════════════
// 👤 STATISTIQUES UTILISATEUR
// ═══════════════════════════════════════════════════════════

async function loadUserStats() {
    // Mettre à jour les likes locaux (indépendant de la connexion)
    updateLikeCount();
    
    if (!supabaseClient || !currentUser) return;
    
    // Compter les extraits partagés (vrais partages, pas les likes)
    const { count: extraitCount } = await supabaseClient
        .from('extraits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);
    
    // Sidebar desktop - section profil
    document.getElementById('myExtraitsCount').textContent = extraitCount || 0;
    
    // Panneau profil mobile
    const mobileExtraits = document.getElementById('mobileProfileExtraits');
    if (mobileExtraits) mobileExtraits.textContent = extraitCount || 0;
    
    // Aussi afficher le nombre d'abonnés
    const { count: followersCount } = await supabaseClient
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', currentUser.id);
}

// Helpers formatTimeAgo et escapeHtml sont dans utils.js

function openMyProfile() {
    closeUserDropdown();
    switchSocialTab('mine');
    openSocialFeed();
}

// ═══════════════════════════════════════════════════════════
// 💬 MESSAGERIE → messaging.js
// 🔔 NOTIFICATIONS → notifications.js
// ═══════════════════════════════════════════════════════════

// Fonction pour partager depuis une carte
function shareCardExtrait(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const fullText = card.dataset.text || '';
    const author = card.dataset.author || 'Inconnu';
    const title = card.dataset.title || 'Sans titre';
    
    // Priorité : sélection utilisateur > texte complet
    const selection = window.getSelection().toString().trim();
    const textToShare = selection.length >= 20 ? selection : fullText;
    
    // Construire l'URL Wikisource
    const lang = card.dataset.lang || 'fr';
    const sourceUrl = `https://${lang}.wikisource.org/wiki/${encodeURIComponent(title)}`;
    
    openShareModal(textToShare, author, title, sourceUrl, cardId);
}

// Partager rapidement et ouvrir les commentaires
async function quickShareAndComment(cardId) {
    if (!currentUser) {
        openAuthModal('login');
        toast('📝 Connectez-vous pour commenter');
        return;
    }
    
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const text = card.dataset.text || '';
    const author = card.dataset.author || 'Inconnu';
    const title = card.dataset.title || 'Sans titre';
    const lang = card.dataset.lang || 'fr';
    const sourceUrl = `https://${lang}.wikisource.org/wiki/${encodeURIComponent(title)}`;
    
    // Récupérer la sélection ou le teaser
    const selection = window.getSelection().toString().trim();
    const textToShare = selection.length >= 20 ? selection : text.substring(0, 500);
    
    // Vérifier si cet extrait existe déjà (même texte, même source)
    if (supabaseClient) {
        const { data: existing } = await supabaseClient
            .from('extraits')
            .select('id')
            .eq('texte', textToShare)
            .eq('source_title', title)
            .eq('user_id', currentUser.id)
            .maybeSingle();
        
        if (existing) {
            // Ouvrir le feed social et afficher cet extrait
            toast('Cet extrait existe déjà, ouverture...');
            openSocialFeed();
            setTimeout(async () => {
                await viewExtraitById(existing.id);
                // Ouvrir les commentaires
                setTimeout(() => toggleComments(existing.id), 300);
            }, 300);
            return;
        }
        
        // Créer l'extrait directement
        const { data: newExtrait, error } = await supabaseClient
            .from('extraits')
            .insert({
                user_id: currentUser.id,
                texte: textToShare,
                source_title: title,
                source_author: author,
                source_url: sourceUrl,
                commentary: '',
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) {
            console.error('Erreur création extrait:', error);
            toast('Erreur : ' + error.message);
            return;
        }
        
        toast('Extrait partagé !');
        
        // Ouvrir le feed social et afficher cet extrait avec les commentaires ouverts
        openSocialFeed();
        setTimeout(async () => {
            await viewExtraitById(newExtrait.id);
            // Ouvrir les commentaires automatiquement
            setTimeout(() => toggleComments(newExtrait.id), 300);
        }, 300);
    }
}


async function init() {
    // Initialiser le thème (clair/sombre) AVANT tout rendu
    initTheme();
    
    // Initialiser Supabase (social features)
    initSupabase();
    
    // Vérifier si c'est un retour depuis un email de reset password
    checkPasswordResetToken();
    
    loadState();
    
    // Restaurer le choix de langue ou détecter automatiquement
    const savedLang = localStorage.getItem('palimpseste_lang');
    const validLangs = ['all', ...WIKISOURCES.map(w => w.lang)];
    
    if (savedLang && validLangs.includes(savedLang)) {
        // Utiliser la langue sauvegardée
        setSelectedLang(savedLang);
    } else {
        // Détecter la langue du navigateur
        const browserLang = (navigator.language || navigator.userLanguage || 'fr').split('-')[0].toLowerCase();
        // Si la langue du navigateur est supportée, l'utiliser, sinon français par défaut
        const langToSet = validLangs.includes(browserLang) ? browserLang : 'fr';
        setSelectedLang(langToSet);
        localStorage.setItem('palimpseste_lang', langToSet);
    }
    
    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = getSelectedLang();
    
    updateStats();
    updateConnections();
    renderAchievements();
    renderReadingPath();
    renderFavorites();
    updateFavCount();
    updateFunStat();
    
    document.getElementById('loading').style.display = 'block';
    await fillPool();
    document.getElementById('loading').style.display = 'none';
    await loadMore();
    
    // Mise à jour périodique du fun stat
    setInterval(updateFunStat, 15000);
    
    // Créer le bouton scroll to top
    createScrollTopButton();
    
    // Pull to refresh - quand on tire vers le haut en étant au sommet (MOBILE)
    let pullStartY = 0;
    let isPulling = false;
    let pullIndicator = null;
    
    document.addEventListener('touchstart', (e) => {
        if (window.scrollY <= 5) {
            pullStartY = e.touches[0].clientY;
            isPulling = true;
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        if (!isPulling || window.scrollY > 5) return;
        
        const pullDistance = e.touches[0].clientY - pullStartY;
        if (pullDistance > 50 && !state.loading) {
            // Afficher indicateur de pull
            if (!pullIndicator) {
                pullIndicator = document.createElement('div');
                pullIndicator.className = 'pull-indicator';
                pullIndicator.innerHTML = '↓ Tirer pour rafraîchir';
                document.body.appendChild(pullIndicator);
            }
            pullIndicator.style.opacity = Math.min(1, (pullDistance - 50) / 80);
            pullIndicator.textContent = pullDistance > 130 ? '↻ Relâcher pour charger' : '↓ Tirer pour rafraîchir';
        }
    }, { passive: true });
    
    document.addEventListener('touchend', async () => {
        if (pullIndicator) {
            const shouldRefresh = pullIndicator.textContent.includes('Relâcher');
            pullIndicator.remove();
            pullIndicator = null;
            
            if (shouldRefresh && !state.loading) {
                await loadNewTextsOnTop();
            }
        }
        isPulling = false;
        pullStartY = 0;
    }, { passive: true });
    
    // Scroll vers le haut au sommet = charger nouveaux textes (DESKTOP)
    let wheelUpCount = 0;
    let wheelUpTimer = null;
    
    window.addEventListener('wheel', async (e) => {
        // Si on est en haut et qu'on scrolle vers le haut (deltaY négatif)
        if (window.scrollY <= 5 && e.deltaY < 0 && !state.loading) {
            wheelUpCount++;
            
            // Afficher indicateur après 2 scrolls vers le haut
            if (wheelUpCount >= 2 && !pullIndicator) {
                pullIndicator = document.createElement('div');
                pullIndicator.className = 'pull-indicator';
                pullIndicator.style.opacity = '1';
                pullIndicator.innerHTML = '↑ Continuer pour charger...';
                document.body.appendChild(pullIndicator);
            }
            
            // Charger après 4 scrolls vers le haut
            if (wheelUpCount >= 4) {
                if (pullIndicator) {
                    pullIndicator.textContent = '↻ Chargement...';
                }
                wheelUpCount = 0;
                await loadNewTextsOnTop();
                if (pullIndicator) {
                    pullIndicator.remove();
                    pullIndicator = null;
                }
            }
            
            // Reset le compteur après 800ms d'inactivité
            clearTimeout(wheelUpTimer);
            wheelUpTimer = setTimeout(() => {
                wheelUpCount = 0;
                if (pullIndicator) {
                    pullIndicator.remove();
                    pullIndicator = null;
                }
            }, 800);
        }
    }, { passive: true });
    
    // Headroom: cacher le header quand on scrolle vers le bas, afficher vers le haut
    let lastScrollY = 0;
    let headerHidden = false;
    const header = document.querySelector('header');
    const explorationContainer = document.getElementById('explorationContainer');
    
    window.onscroll = () => {
        document.getElementById('progress').style.width = 
            (scrollY / (document.body.scrollHeight - innerHeight) * 100) + '%';
        if (innerHeight + scrollY >= document.body.scrollHeight - 800 && !state.loading) loadMore();
        
        // Afficher/masquer le bouton scroll to top
        updateScrollTopButton();
        
        // Headroom behavior - seulement sur desktop et après un peu de scroll
        if (window.innerWidth > 900 && scrollY > 150) {
            const scrollingDown = scrollY > lastScrollY && scrollY > 100;
            const scrollingUp = scrollY < lastScrollY;
            
            if (scrollingDown && !headerHidden) {
                // Cacher le header et la barre d'exploration
                header.style.transform = 'translateY(-100%)';
                if (explorationContainer) explorationContainer.style.transform = 'translateY(-150px)';
                headerHidden = true;
            } else if (scrollingUp && headerHidden) {
                // Afficher le header
                header.style.transform = 'translateY(0)';
                if (explorationContainer) explorationContainer.style.transform = 'translateY(0)';
                headerHidden = false;
            }
        } else if (headerHidden) {
            // Toujours afficher en haut de page
            header.style.transform = 'translateY(0)';
            if (explorationContainer) explorationContainer.style.transform = 'translateY(0)';
            headerHidden = false;
        }
        
        lastScrollY = scrollY;
    };
}

function loadState() {
    try {
        const d = JSON.parse(localStorage.getItem('palimpseste') || '{}');
        console.log('📦 loadState - favoris chargés:', d.favorites?.length || 0, d.favorites);
        
        // Charger favoris d'abord
        state.favorites = d.favorites || [];
        
        // Reconstruire likes depuis favorites (source de vérité)
        state.likes = new Set(state.favorites.map(f => f.id));
        
        state.readCount = d.readCount || 0;
        state.authorStats = d.authorStats || {};
        state.genreStats = d.genreStats || {};
        state.likedAuthors = new Set(d.likedAuthors || []);
        state.discoveredConnections = new Set(d.discoveredConnections || []);
        state.achievements = d.achievements || [];
        state.readingPath = d.readingPath || [];
        
        // Charger les stats de lecture
        state.readingStats = d.readingStats || {
            totalWordsRead: 0,
            totalReadingTime: 0,
            streak: 0,
            lastReadDate: null,
            sessionsToday: 0,
            bestStreak: 0,
            dailyWords: {}
        };
        console.log('📦 Stats de lecture chargées:', state.readingStats);
        // Vérifier et mettre à jour le streak au chargement
        checkAndUpdateStreak();
    } catch(e) {
        console.error('❌ loadState error:', e);
    }
}

function saveState() {
    localStorage.setItem('palimpseste', JSON.stringify({ 
        likes: [...state.likes], 
        readCount: state.readCount,
        authorStats: state.authorStats,
        genreStats: state.genreStats,
        likedAuthors: [...state.likedAuthors],
        discoveredConnections: [...state.discoveredConnections],
        achievements: state.achievements || [],
        readingPath: state.readingPath || [],
        favorites: state.favorites || [],
        readingStats: state.readingStats
    }));
    updateStats();
}

function updateStats() {
    // Mettre à jour les stats du panneau
    document.getElementById('totalRead').textContent = state.readCount;
    document.getElementById('authorCount').textContent = Object.keys(state.authorStats).length;
    
    // Bouton favoris visible seulement si connecté
    const drawerFavBtn = document.getElementById('drawerFavBtn');
    if (drawerFavBtn) {
        drawerFavBtn.style.display = currentUser ? '' : 'none';
    }
    
    // Compteur header à 0 si non connecté
    if (!currentUser) {
        const favCountHeader = document.getElementById('favCount');
        if (favCountHeader) favCountHeader.textContent = 0;
    }
    
    // Section favoris locale cachée
    const favoritesSection = document.getElementById('favoritesSection');
    if (favoritesSection) favoritesSection.style.display = 'none';
    
    // Titre dynamique selon le contexte
    updateDynamicHeader();
    
    // Mettre à jour les barres d'auteurs
    renderAuthorBars();
    renderGenreChart();
    
    // Mettre à jour les statistiques de lecture
    updateReadingStatsUI();
}

// ═══════════════════════════════════════════════════════════
// 📊 STATISTIQUES DE LECTURE
// ═══════════════════════════════════════════════════════════

function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

function checkAndUpdateStreak() {
    const stats = state.readingStats;
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    console.log('🔥 checkAndUpdateStreak:', { today, yesterday, lastReadDate: stats.lastReadDate, streak: stats.streak });
    
    if (!stats.lastReadDate) {
        stats.streak = 0;
    } else if (stats.lastReadDate === today) {
        // Déjà lu aujourd'hui, streak maintenu
    } else if (stats.lastReadDate === yesterday) {
        // A lu hier, streak continue (sera incrémenté quand il lit aujourd'hui)
    } else {
        // Streak cassé - vérifier si c'est un bug ou vraiment cassé
        const lastDate = new Date(stats.lastReadDate);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate - lastDate) / 86400000);
        console.log('⚠️ Streak potentiellement cassé, écart:', daysDiff, 'jours');
        if (daysDiff > 1) {
            stats.streak = 0;
        }
    }
}

function recordReading(wordCount) {
    const stats = state.readingStats;
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    console.log('📖 recordReading avant:', { wordCount, today, yesterday, lastReadDate: stats.lastReadDate, streak: stats.streak, totalWords: stats.totalWordsRead });
    
    // Ajouter les mots lus
    stats.totalWordsRead = (stats.totalWordsRead || 0) + wordCount;
    
    // Mots par jour
    if (!stats.dailyWords) stats.dailyWords = {};
    stats.dailyWords[today] = (stats.dailyWords[today] || 0) + wordCount;
    
    // Gérer le streak
    if (stats.lastReadDate !== today) {
        // Première lecture du jour
        if (stats.lastReadDate === yesterday || !stats.lastReadDate) {
            stats.streak = (stats.streak || 0) + 1;
        } else {
            stats.streak = 1; // Recommencer le streak
        }
        stats.lastReadDate = today;
        stats.sessionsToday = 1;
        
        // Meilleur streak
        if (stats.streak > (stats.bestStreak || 0)) {
            stats.bestStreak = stats.streak;
            if (stats.streak >= 7) {
                toast('Streak record : ' + stats.streak + ' jours !');
            }
        }
    } else {
        stats.sessionsToday = (stats.sessionsToday || 0) + 1;
    }
    
    saveState();
}

function startReadingTimer() {
    if (!sessionStartTime) {
        sessionStartTime = Date.now();
    }
}

function stopReadingTimer() {
    if (sessionStartTime) {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        state.readingStats.totalReadingTime = (state.readingStats.totalReadingTime || 0) + elapsed;
        sessionStartTime = null;
        saveState();
    }
}

// formatReadingTime et formatWordsCount sont dans utils.js

function updateReadingStatsUI() {
    const stats = state.readingStats;
    
    // Temps de lecture
    const timeEl = document.getElementById('totalReadingTime');
    if (timeEl) {
        timeEl.textContent = formatReadingTime(stats.totalReadingTime || 0);
    }
    
    // Mots lus
    const wordsEl = document.getElementById('totalWordsRead');
    if (wordsEl) {
        wordsEl.textContent = formatWordsCount(stats.totalWordsRead || 0);
    }
    
    // Streak
    const streakEl = document.getElementById('currentStreak');
    if (streakEl) {
        streakEl.textContent = stats.streak || 0;
    }
    
    // Barre de progression streak (objectif 7 jours)
    const progressEl = document.getElementById('streakProgress');
    if (progressEl) {
        const progress = Math.min(100, ((stats.streak || 0) / 7) * 100);
        progressEl.style.width = progress + '%';
    }
    
    // Hint streak
    const hintEl = document.getElementById('streakHint');
    if (hintEl) {
        const streak = stats.streak || 0;
        if (streak === 0) {
            hintEl.textContent = 'Commencez à lire pour démarrer votre streak !';
        } else if (streak < 3) {
            hintEl.textContent = `${streak} jour${streak > 1 ? 's' : ''} - Continuez demain !`;
        } else if (streak < 7) {
            hintEl.textContent = `✶ ${streak} jours — Plus que ${7 - streak} pour la semaine !`;
        } else if (streak < 30) {
            hintEl.textContent = `✶ ${streak} jours — Vers le mois complet !`;
        } else {
            hintEl.textContent = `♔ ${streak} jours — Incroyable dévotion !`;
        }
    }
    
    // Graphique hebdomadaire
    renderWeeklyChart();
}

function renderWeeklyChart() {
    const container = document.getElementById('weeklyChart');
    if (!container) return;
    
    const stats = state.readingStats;
    const dailyWords = stats.dailyWords || {};
    const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const today = new Date();
    
    // Obtenir les 7 derniers jours
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();
        weekData.push({
            key,
            dayLabel: days[(dayOfWeek + 6) % 7], // Lundi = 0
            words: dailyWords[key] || 0,
            isToday: i === 0
        });
    }
    
    // Trouver le max pour normaliser
    const maxWords = Math.max(100, ...weekData.map(d => d.words));
    
    container.innerHTML = weekData.map(d => {
        const height = Math.max(4, (d.words / maxWords) * 45);
        const classes = ['weekly-bar'];
        if (d.words > 0) classes.push('active');
        if (d.isToday) classes.push('today');
        return `<div class="${classes.join(' ')}" style="height: ${height}px" data-day="${d.dayLabel}" title="${d.words} mots"></div>`;
    }).join('');
}

// Détecter quand l'utilisateur quitte la page
window.addEventListener('beforeunload', stopReadingTimer);
window.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopReadingTimer();
    } else {
        startReadingTimer();
    }
});

// Phrases d'en-tête dynamiques selon l'état de l'exploration
// Titre statique - plus de phrases dynamiques
function updateDynamicHeader() {
    // Ne rien faire - garder le titre par défaut
}

function renderAuthorBars() {
    const container = document.getElementById('authorBars');
    if (!container) return; // Section supprimée
    const sorted = Object.entries(state.authorStats).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = sorted[0]?.[1] || 1;
    const colors = ['#ff453a', '#ff9f0a', '#30d158', '#64d2ff', '#bf5af2', '#ff6482', '#ffd60a', '#ac8e68'];
    
    container.innerHTML = sorted.map(([author, count], i) => `
        <div class="author-bar">
            <span class="author-bar-name">${author.split(' ').pop()}</span>
            <div class="author-bar-track">
                <div class="author-bar-fill" style="width: ${(count/max)*100}%; background: ${colors[i % colors.length]}"></div>
            </div>
            <span class="author-bar-count">${count}</span>
        </div>
    `).join('');
}

function renderGenreChart() {
    const container = document.getElementById('genreChart');
    container.innerHTML = Object.entries(state.genreStats).map(([genre, count]) => `
        <div class="genre-pill" onclick="exploreCategory('${genre}')" title="Explorer l'arborescence ${genre}">
            <span class="genre-dot" style="background: ${GENRE_COLORS[genre] || '#6e6e73'}"></span>
            ${genre} <strong>${count}</strong>
        </div>
    `).join('');
}

function trackStats(author, tag) {
    state.authorStats[author] = (state.authorStats[author] || 0) + 1;
    state.genreStats[tag] = (state.genreStats[tag] || 0) + 1;
    saveState();
}

// Construire dynamiquement les connexions entre auteurs
// Les auteurs du même genre sont connectés entre eux
function buildAuthorConnections(author, tag) {
    if (!author || author === 'Anonyme') return;
    
    // Trouver les autres auteurs du même genre
    const sameGenreAuthors = Object.keys(state.authorStats).filter(a => {
        // On considère que les auteurs vus récemment dans la même session sont "connectés"
        return a !== author && a !== 'Anonyme';
    });
    
    // Ajouter des connexions bidirectionnelles
    if (!authorConnections[author]) authorConnections[author] = [];
    
    // Connecter avec les 5 derniers auteurs différents découverts
    const recentAuthors = sameGenreAuthors.slice(-5);
    for (const other of recentAuthors) {
        if (!authorConnections[author].includes(other)) {
            authorConnections[author].push(other);
        }
        if (!authorConnections[other]) authorConnections[other] = [];
        if (!authorConnections[other].includes(author)) {
            authorConnections[other].push(author);
        }
    }
    
    // Limiter à 10 connexions par auteur
    if (authorConnections[author].length > 10) {
        authorConnections[author] = authorConnections[author].slice(-10);
    }
}

// ═══════════════════════════════════════════════════════════
// 🔍 RECHERCHE → search.js
// ═══════════════════════════════════════════════════════════

// Nombre de nouveaux textes en attente
let pendingNewTexts = 0;
let newTextsBannerVisible = false;

async function shuffleFeed() {
    document.getElementById('feed').innerHTML = '';
    state.textPool = [];
    state.shownPages.clear();
    state.cardIdx = 0;
    hideNewTextsBanner();
    toast('🔄 Nouveaux textes...');
    await fillPool();
    await loadMore();
    // Scroll vers le haut de façon fluide
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Charger de nouveaux textes en HAUT du feed (style Twitter "Voir les nouveaux tweets")
async function loadNewTextsOnTop() {
    if (state.loading) return;
    state.loading = true;
    
    // Afficher un indicateur de chargement compact en haut
    const feed = document.getElementById('feed');
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'top-loading-indicator';
    loadingIndicator.id = 'topLoadingIndicator';
    loadingIndicator.innerHTML = '<div class="spinner-small"></div> Chargement...';
    feed.insertBefore(loadingIndicator, feed.firstChild);
    
    try {
    let loaded = 0, attempts = 0;
    const newCards = [];
    
    // Charger le pool si nécessaire
    if (state.textPool.length < 5) {
        await fillPool();
    }
    
    while (loaded < 3 && attempts < 10) {
        attempts++;
        if (state.textPool.length === 0) break;
        
        const item = state.textPool.shift();
        const itemKey = (item.source === 'poetrydb' ? 'poetrydb:' : '') + item.title;
        if (state.shownPages.has(itemKey)) continue;
        
        // Si c'est un item pré-chargé
        if (item.isPreloaded && item.text) {
            state.shownPages.add(itemKey);
            const cardEl = createCardElement({
                title: item.title,
                text: item.text,
                author: item.author,
                source: item.source
            }, item.title, { lang: item.lang, url: 'https://poetrydb.org', name: 'PoetryDB' });
            if (cardEl) newCards.push(cardEl);
            loaded++;
            continue;
        }
        
        // Sinon, récupérer depuis Wikisource
        const ws = item.wikisource || getCurrentWikisource();
        const result = await fetchText(item.title, 0, ws);
        if (result?.text?.length > 150) {
            state.shownPages.add(itemKey);
            const cardEl = createCardElement(result, item.title, ws);
            if (cardEl) newCards.push(cardEl);
            loaded++;
        }
    }
    
    // Supprimer l'indicateur de chargement
    loadingIndicator.remove();
    
    // Insérer les nouvelles cartes en haut avec animation
    if (newCards.length > 0) {
        // Insérer dans l'ordre inverse pour que la plus récente soit en haut
        for (let i = newCards.length - 1; i >= 0; i--) {
            const card = newCards[i];
            card.classList.add('card-new');
            feed.insertBefore(card, feed.firstChild);
            // Décaler légèrement l'animation pour chaque carte
            setTimeout(() => {
                card.classList.add('show');
                card.classList.add('card-highlight');
            }, (newCards.length - 1 - i) * 100);
        }
        
        // Retirer le highlight après quelques secondes
        setTimeout(() => {
            newCards.forEach(card => card.classList.remove('card-highlight', 'card-new'));
        }, 3000);
        
        // PAS de scroll automatique ni de toast - l'utilisateur reste où il est sans être dérangé
    }
    
    hideNewTextsBanner();
    } finally {
        state.loading = false;
        // Nettoyer l'indicateur si encore présent
        const indicator = document.getElementById('topLoadingIndicator');
        if (indicator) indicator.remove();
    }
}

// Bandeau nouveaux textes supprimé - ne pas déranger le lecteur

// Rafraîchir le feed en gardant les cartes actuelles et en ajoutant en haut
async function refreshFeed() {
    await loadNewTextsOnTop();
}

// Créer le bouton "scroll to top"
function createScrollTopButton() {
    let btn = document.getElementById('scrollTopBtn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'scrollTopBtn';
        btn.className = 'scroll-top-btn';
        btn.innerHTML = '↑';
        btn.title = 'Revenir en haut';
        btn.onclick = () => {
            if (newTextsBannerVisible) {
                loadNewTextsOnTop();
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        document.body.appendChild(btn);
    }
}

// Mettre à jour la visibilité du bouton scroll to top
function updateScrollTopButton() {
    const btn = document.getElementById('scrollTopBtn');
    if (!btn) return;
    
    if (window.scrollY > 500) {
        btn.classList.add('visible');
    } else {
        btn.classList.remove('visible');
    }
}

function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

async function loadMore() {
    if (state.loading) return;
    state.loading = true;
    document.getElementById('loading').style.display = 'block';

    try {
    let loaded = 0, attempts = 0;
    while (loaded < 3 && attempts < 15) {
        attempts++;
        const isExploringCategory = currentCategoryPath.length > 0;
        if (state.textPool.length < 3 && !isExploringCategory) {
            await fillPool();
        }
        if (state.textPool.length === 0) break;
        
        const item = state.textPool.shift();
        const itemKey = (item.source === 'poetrydb' ? 'poetrydb:' : '') + item.title;
        if (state.shownPages.has(itemKey)) continue;
        
        // Si c'est un item pré-chargé (PoetryDB), on l'affiche directement
        if (item.isPreloaded && item.text) {
            state.shownPages.add(itemKey);
            renderCard({
                title: item.title,
                text: item.text,
                author: item.author,
                source: item.source
            }, item.title, { lang: item.lang, url: 'https://poetrydb.org', name: 'PoetryDB' });
            loaded++;
            continue;
        }
        
        // Sinon, récupérer depuis Wikisource
        const ws = item.wikisource || getCurrentWikisource();
        const result = await fetchText(item.title, 0, ws);
        if (result?.text?.length > 150) {
            state.shownPages.add(itemKey);
            renderCard(result, item.title, ws);
            loaded++;
        }
    }
    } finally {
        document.getElementById('loading').style.display = 'none';
        state.loading = false;
    }
}

// Crée un élément de carte sans l'ajouter au DOM (pour insertion flexible)
function createCardElement(result, origTitle, wikisource = getCurrentWikisource()) {
    let title = result.title || origTitle;
    // Nettoyage agressif du titre
    title = title
        .replace(/<[^>]+>/g, '')
        .replace(/mw-page-title[^\s]*/gi, '')
        .replace(/Liste des [^\/]*/gi, '')
        .replace(/par ordre alphabétique/gi, '')
        .replace(/span class/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    if (!isValidTitle(title)) return null;
    
    const text = result.text;
    const lang = wikisource?.lang || 'fr';
    const author = detectAuthor(title, text, result.author);
    const tag = detectTag(title, text);
    const url = `${wikisource?.url || 'https://fr.wikisource.org'}/wiki/${encodeURIComponent(origTitle)}`;
    const cardId = 'card-' + (state.cardIdx++);
    
    let displayTitle = title.split('/').pop() || title.split('/')[0];
    if (displayTitle.length < 3) displayTitle = title.split('/')[0];
    displayTitle = displayTitle.replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (displayTitle.length < 3) displayTitle = title.split('/')[0] || 'Texte sans titre';
    
    const langBadge = lang !== 'fr' ? `<span class="lang-badge">${lang.toUpperCase()}</span>` : '';
    
    trackStats(author, tag);
    buildAuthorConnections(author, tag);

    const TEASER_LENGTH = 350;
    const CHUNK_LENGTH = 600;
    let teaser = text;
    let remaining = '';
    
    if (text.length > TEASER_LENGTH) {
        let cutPoint = text.lastIndexOf('. ', TEASER_LENGTH);
        if (cutPoint < TEASER_LENGTH * 0.5) cutPoint = text.lastIndexOf('\n', TEASER_LENGTH);
        if (cutPoint < TEASER_LENGTH * 0.5) cutPoint = text.lastIndexOf(' ', TEASER_LENGTH);
        if (cutPoint < TEASER_LENGTH * 0.5) cutPoint = TEASER_LENGTH;
        teaser = text.substring(0, cutPoint + 1).trim();
        remaining = text.substring(cutPoint + 1).trim();
    }
    
    const keywords = extractKeywords(text, title, author, tag);
    const keywordsHtml = keywords.map(kw => 
        `<span class="keyword-tag" onclick="exploreKeyword('${kw}')" title="Explorer #${kw}">${kw}</span>`
    ).join('');
    
    const card = document.createElement('div');
    card.className = 'card';
    card.id = cardId;
    card.innerHTML = `
        <div class="card-head" onclick="showRelatedAuthors('${cardId}')" style="cursor:pointer;" title="Cliquer pour découvrir des auteurs proches">
            <div>
                <div class="author">${esc(author)} ${langBadge} <span class="explore-hint">🕸️</span></div>
                <div class="work">${esc(displayTitle)}</div>
            </div>
            <span class="tag ${tag}" onclick="event.stopPropagation(); exploreCategory('${tag}')" title="Explorer ce genre">${tag}</span>
        </div>
        <div class="card-body" ondblclick="doubleTapLike('${cardId}', event)">
            <span class="like-heart-overlay" id="heart-${cardId}">❤️</span>
            <div class="text-teaser">${esc(teaser)}</div>
            <div class="text-full" id="full-${cardId}"></div>
            ${remaining ? `<button class="btn-suite" onclick="showMore('${cardId}')" id="suite-${cardId}">Lire la suite<span class="arrow">→</span></button>` : ''}
        </div>
        <div class="related-authors" id="related-${cardId}" style="display:none;"></div>
        <div class="card-foot">
            <div class="card-keywords">${keywordsHtml}</div>
            <div class="actions">
                <button class="btn btn-like" onclick="toggleLike('${cardId}',this)" title="Ajouter aux favoris">♥ <span class="btn-text">J'aime</span></button>
                <button class="btn btn-share" onclick="shareCardExtrait('${cardId}')" title="Partager">📤 <span class="btn-text">Partager</span></button>
                <button class="btn btn-comment" onclick="showInlineComment('${cardId}')" title="Commenter">💬 <span class="btn-text">Commenter</span></button>
                <button class="btn btn-explore" onclick="showRelatedAuthors('${cardId}')" title="Découvrir">🔗 <span class="btn-text">Explorer</span></button>
                <a class="btn btn-source" href="${url}" target="_blank" title="Source">↗ <span class="btn-text">Source</span></a>
            </div>
        </div>
    `;
    card.dataset.title = title;
    card.dataset.author = author;
    card.dataset.text = text;
    card.dataset.url = url;  // URL source pour le système de likes
    card.dataset.remaining = remaining;
    card.dataset.shown = '0';
    card.dataset.tag = tag;
    card.dataset.lang = lang;
    card.dataset.chunkSize = CHUNK_LENGTH;
    
    // Tracker ce texte comme lu
    state.readCount++;
    const teaserWords = teaser.split(/\s+/).filter(w => w.length > 0).length;
    recordReading(teaserWords);
    startReadingTimer();
    updateStats();
    saveState();
    
    return card;
}

function renderCard(result, origTitle, wikisource = getCurrentWikisource()) {
    let title = result.title || origTitle;
    // Nettoyage agressif du titre
    title = title
        .replace(/<[^>]+>/g, '')  // Supprimer tout HTML
        .replace(/mw-page-title[^\s]*/gi, '')  // Supprimer classes MW
        .replace(/Liste des [^\/]*/gi, '')  // Supprimer "Liste des..."
        .replace(/par ordre alphabétique/gi, '')
        .replace(/span class/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Si le titre est invalide, ne pas afficher cette carte
    if (!isValidTitle(title)) return;
    
    const text = result.text;
    const lang = wikisource?.lang || 'fr';
    // Utiliser l'auteur des métadonnées en priorité
    const author = detectAuthor(title, text, result.author);
    const tag = detectTag(title, text);
    const url = `${wikisource?.url || 'https://fr.wikisource.org'}/wiki/${encodeURIComponent(origTitle)}`;
    const cardId = 'card-' + (state.cardIdx++);
    
    // Extraire un titre propre pour l'affichage
    let displayTitle = title.split('/').pop() || title.split('/')[0];
    // Si c'est un titre générique, prendre la première partie
    if (displayTitle.length < 3) displayTitle = title.split('/')[0];
    // Supprimer les parenthèses avec l'auteur si redondant
    displayTitle = displayTitle.replace(/\s*\([^)]*\)\s*$/, '').trim();
    // Si displayTitle est vide ou trop court après nettoyage, utiliser le titre original
    if (displayTitle.length < 3) displayTitle = title.split('/')[0] || 'Texte sans titre';
    
    // Badge de langue
    const langBadge = lang !== 'fr' ? `<span class="lang-badge">${lang.toUpperCase()}</span>` : '';
    
    // Tracker les stats et construire les connexions
    trackStats(author, tag);
    buildAuthorConnections(author, tag);

    // Découper le texte en teaser + suite
    const TEASER_LENGTH = 350;
    const CHUNK_LENGTH = 600;
    let teaser = text;
    let remaining = '';
    
    if (text.length > TEASER_LENGTH) {
        // Couper proprement sur une phrase ou un retour à la ligne
        let cutPoint = text.lastIndexOf('. ', TEASER_LENGTH);
        if (cutPoint < TEASER_LENGTH * 0.5) cutPoint = text.lastIndexOf('\n', TEASER_LENGTH);
        if (cutPoint < TEASER_LENGTH * 0.5) cutPoint = text.lastIndexOf(' ', TEASER_LENGTH);
        if (cutPoint < TEASER_LENGTH * 0.5) cutPoint = TEASER_LENGTH;
        teaser = text.substring(0, cutPoint + 1).trim();
        remaining = text.substring(cutPoint + 1).trim();
    }
    
    // Générer les mots-clés pour ce texte
    const keywords = extractKeywords(text, title, author, tag);
    const keywordsHtml = keywords.map(kw => 
        `<span class="keyword-tag" onclick="exploreKeyword('${kw}')" title="Explorer #${kw}">${kw}</span>`
    ).join('');
    
    const card = document.createElement('div');
    card.className = 'card';
    card.id = cardId;
    card.innerHTML = `
        <div class="card-head" onclick="showRelatedAuthors('${cardId}')" style="cursor:pointer;" title="Cliquer pour découvrir des auteurs proches">
            <div>
                <div class="author">${esc(author)} ${langBadge} <span class="explore-hint">🕸️</span></div>
                <div class="work">${esc(displayTitle)}</div>
            </div>
            <span class="tag ${tag}" onclick="event.stopPropagation(); exploreCategory('${tag}')" title="Explorer ce genre">${tag}</span>
        </div>
        <div class="card-body" ondblclick="doubleTapLike('${cardId}', event)">
            <span class="like-heart-overlay" id="heart-${cardId}">❤️</span>
            <div class="text-teaser">${esc(teaser)}</div>
            <div class="text-full" id="full-${cardId}"></div>
            ${remaining ? `<button class="btn-suite" onclick="showMore('${cardId}')" id="suite-${cardId}">Lire la suite<span class="arrow">→</span></button>` : ''}
        </div>
        <div class="related-authors" id="related-${cardId}" style="display:none;"></div>
        <div class="card-foot">
            <div class="card-keywords">${keywordsHtml}</div>
            <div class="actions">
                <button class="btn btn-like" onclick="toggleLike('${cardId}',this)" title="Ajouter aux favoris">♥ <span class="btn-text">J'aime</span></button>
                <button class="btn btn-share" onclick="shareCardExtrait('${cardId}')" title="Partager">📤 <span class="btn-text">Partager</span></button>
                <button class="btn btn-comment" onclick="showInlineComment('${cardId}')" title="Commenter">💬 <span class="btn-text">Commenter</span></button>
                <button class="btn btn-explore" onclick="showRelatedAuthors('${cardId}')" title="Découvrir">🔗 <span class="btn-text">Explorer</span></button>
                <a class="btn btn-source" href="${url}" target="_blank" title="Source">↗ <span class="btn-text">Source</span></a>
            </div>
        </div>
    `;
    card.dataset.title = title;
    card.dataset.author = author;
    card.dataset.text = text;
    card.dataset.url = url;  // URL source pour le système de likes
    card.dataset.remaining = remaining;
    card.dataset.shown = '0';
    card.dataset.tag = tag;
    card.dataset.lang = lang;
    card.dataset.chunkSize = CHUNK_LENGTH;
    document.getElementById('feed').appendChild(card);
    setTimeout(() => card.classList.add('show'), 50);
    
    // Tracker ce texte comme lu
    state.readCount++;
    const teaserWords = teaser.split(/\s+/).filter(w => w.length > 0).length;
    recordReading(teaserWords);
    startReadingTimer();
    
    // Mettre à jour l'affichage
    updateStats();
    saveState();
}

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }

// Afficher la suite du texte - tout d'un coup au premier clic
function showMore(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const fullEl = document.getElementById('full-' + cardId);
    const btnEl = document.getElementById('suite-' + cardId);
    if (!fullEl || !btnEl) return;
    
    let remaining = card.dataset.remaining || '';
    
    if (!remaining) {
        btnEl.innerHTML = '✓ Texte complet';
        btnEl.classList.add('exhausted');
        btnEl.onclick = null;
        return;
    }
    
    // Afficher TOUT le texte restant d'un coup
    const chunkEl = document.createElement('div');
    chunkEl.className = 'text-chunk';
    chunkEl.style.animation = 'fadeIn 0.4s ease';
    chunkEl.innerHTML = esc(remaining);
    fullEl.appendChild(chunkEl);
    fullEl.classList.add('visible');
    
    // Tracker les mots lus
    const wordCount = remaining.split(/\s+/).filter(w => w.length > 0).length;
    recordReading(wordCount);
    startReadingTimer();
    
    // Marquer comme complet
    card.dataset.remaining = '';
    
    // Mettre à jour le bouton
    btnEl.innerHTML = '✓ Texte complet';
    btnEl.classList.add('exhausted');
    btnEl.onclick = null;
    
    // NE PAS scroller - garder l'écran stable pour ne pas gêner la lecture
}

// ═══════════════════════════════════════════════════════════
// ❤️ SYSTÈME DE LIKES DES CARTES - Simple et local
// ═══════════════════════════════════════════════════════════
// Les likes des cartes sont stockés localement par URL source
// Pas de création d'extrait - c'est juste un "favori personnel"
// Les extraits sont créés uniquement via le bouton "Partager"

// Cache local des likes (Map URL -> {timestamp, title, author, preview})
let likedSourceUrls = new Set();
let likedSourcesData = new Map(); // Stocke les métadonnées avec timestamp

// Charger les likes depuis localStorage ET Supabase
async function loadLikedSources() {
    try {
        // D'abord charger depuis localStorage (rapide, offline)
        const saved = localStorage.getItem('palimpseste-likes');
        const savedData = localStorage.getItem('palimpseste-likes-data');
        if (saved) {
            likedSourceUrls = new Set(JSON.parse(saved));
        }
        if (savedData) {
            const parsed = JSON.parse(savedData);
            likedSourcesData = new Map(Object.entries(parsed));
        }
        
        // Si connecté, synchroniser avec Supabase
        if (supabaseClient && currentUser) {
            await syncLikesFromSupabase();
        }
        
        // Migration : ajouter timestamp aux anciens likes sans data
        likedSourceUrls.forEach(url => {
            if (!likedSourcesData.has(url)) {
                likedSourcesData.set(url, { timestamp: Date.now() - 86400000 }); // Hier par défaut
            }
        });
    } catch (e) {
        console.error('Erreur chargement likes:', e);
    }
}

// Synchroniser les likes depuis Supabase
async function syncLikesFromSupabase() {
    if (!supabaseClient || !currentUser) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('source_likes')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Erreur sync likes:', error);
            return;
        }
        
        if (data && data.length > 0) {
            // Fusionner avec les likes locaux (Supabase = source de vérité)
            data.forEach(like => {
                likedSourceUrls.add(like.source_url);
                // Ne pas écraser si déjà présent avec plus d'infos
                if (!likedSourcesData.has(like.source_url) || !likedSourcesData.get(like.source_url).preview) {
                    likedSourcesData.set(like.source_url, {
                        timestamp: new Date(like.created_at).getTime(),
                        title: like.title || '',
                        author: like.author || '',
                        preview: like.preview || ''
                    });
                }
            });
            
            // Sauvegarder en local
            saveLikedSourcesLocal();
            updateLikeCount();
            console.log('✅ Likes synchronisés depuis Supabase:', data.length);
        }
    } catch (e) {
        console.error('Erreur syncLikesFromSupabase:', e);
    }
}

// Sauvegarder les likes localement uniquement
function saveLikedSourcesLocal() {
    try {
        localStorage.setItem('palimpseste-likes', JSON.stringify([...likedSourceUrls]));
        const dataObj = {};
        likedSourcesData.forEach((value, key) => dataObj[key] = value);
        localStorage.setItem('palimpseste-likes-data', JSON.stringify(dataObj));
    } catch (e) {
        console.error('Erreur sauvegarde likes locale:', e);
    }
}

// Sauvegarder les likes dans localStorage ET Supabase
async function saveLikedSources() {
    // Toujours sauvegarder en local
    saveLikedSourcesLocal();
}

// Ajouter un like dans Supabase
async function addLikeToSupabase(sourceUrl, metadata) {
    if (!supabaseClient || !currentUser) return;
    
    try {
        const { error } = await supabaseClient
            .from('source_likes')
            .upsert({
                user_id: currentUser.id,
                source_url: sourceUrl,
                title: metadata.title || '',
                author: metadata.author || '',
                preview: metadata.preview || ''
            }, { onConflict: 'user_id,source_url' });
        
        if (error) {
            console.error('Erreur ajout like Supabase:', error);
        }
    } catch (e) {
        console.error('Erreur addLikeToSupabase:', e);
    }
}

// Retirer un like de Supabase
async function removeLikeFromSupabase(sourceUrl) {
    if (!supabaseClient || !currentUser) return;
    
    try {
        const { error } = await supabaseClient
            .from('source_likes')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('source_url', sourceUrl);
        
        if (error) {
            console.error('Erreur suppression like Supabase:', error);
        }
    } catch (e) {
        console.error('Erreur removeLikeFromSupabase:', e);
    }
}

// Toggle like sur une carte (simple et instantané)
function toggleLike(cardId, btn) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const sourceUrl = card.dataset?.url || '';
    if (!sourceUrl) {
        toast('URL source manquante');
        return;
    }
    
    // Toggle le like
    if (likedSourceUrls.has(sourceUrl)) {
        // UNLIKE
        likedSourceUrls.delete(sourceUrl);
        likedSourcesData.delete(sourceUrl);
        btn?.classList?.remove('active');
        toast('Like retiré');
        // Sync avec Supabase
        removeLikeFromSupabase(sourceUrl);
    } else {
        // LIKE - stocker avec métadonnées
        const metadata = {
            timestamp: Date.now(),
            title: card.dataset.title || extractPageTitleFromUrl(sourceUrl),
            author: card.dataset.author || extractAuthorFromUrl(sourceUrl),
            preview: card.querySelector('.text-preview')?.textContent?.substring(0, 300) || ''
        };
        likedSourceUrls.add(sourceUrl);
        likedSourcesData.set(sourceUrl, metadata);
        btn?.classList?.add('active');
        toast('❤ Liké !');
        // Sync avec Supabase
        addLikeToSupabase(sourceUrl, metadata);
    }
    
    // Sauvegarder localement
    saveLikedSources();
    
    // Mettre à jour le compteur dans la sidebar
    updateLikeCount();
}

// Mettre à jour le compteur de likes
function updateLikeCount() {
    const count = likedSourceUrls.size;
    
    // Sidebar desktop
    const myLikesCount = document.getElementById('myLikesCount');
    if (myLikesCount) myLikesCount.textContent = count;
    
    // Header
    const favCount = document.getElementById('favCount');
    if (favCount) favCount.textContent = count;
    
    // Mobile
    const mobileLikes = document.getElementById('mobileProfileLikes');
    if (mobileLikes) mobileLikes.textContent = count;
}

// Vérifier si une URL est likée (pour l'affichage initial des boutons)
function isSourceLiked(sourceUrl) {
    return likedSourceUrls.has(sourceUrl);
}

// Initialiser les likes au chargement
document.addEventListener('DOMContentLoaded', () => {
    loadLikedSources();
    updateLikeCount();
});

// Double-tap pour liker (style Instagram)
function doubleTapLike(id, event) {
    event.preventDefault();
    const card = document.getElementById(id);
    const heart = document.getElementById('heart-' + id);
    const likeBtn = card?.querySelector('.card-foot .btn-like');
    const sourceUrl = card?.dataset?.url || '';
    
    // Afficher l'animation du coeur
    if (heart) {
        heart.classList.remove('animate');
        void heart.offsetWidth; // Force reflow
        heart.classList.add('animate');
    }
    
    // Si pas encore liké, liker. Sinon juste l'animation
    if (!isSourceLiked(sourceUrl)) {
        toggleLike(id, likeBtn);
    }
}

// Afficher la liste des favoris dans le panneau
function renderFavorites() {
    const container = document.getElementById('favoritesList');
    if (!container) return;
    
    const favorites = state.favorites || [];
    
    if (favorites.length === 0) {
        container.innerHTML = '<div class="favorites-empty">Cliquez ♥ pour sauvegarder</div>';
        return;
    }
    
    // Trier par date (plus récent d'abord)
    const sorted = [...favorites].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    container.innerHTML = sorted.map(fav => `
        <div class="favorite-item" onclick="scrollToCard('${fav.id}')">
            <div class="favorite-content">
                <div class="favorite-title">${esc(fav.title?.split('/').pop() || fav.title || 'Sans titre')}</div>
                <div class="favorite-author">${esc(fav.author || 'Anonyme')}</div>
                <div class="favorite-preview">${esc(fav.text || '')}</div>
            </div>
            <button class="favorite-remove" onclick="event.stopPropagation(); removeFavorite('${fav.id}')" title="Retirer">✕</button>
        </div>
    `).join('');
}

function scrollToCard(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.boxShadow = '0 0 30px rgba(255,69,58,0.5)';
        setTimeout(() => card.style.boxShadow = '', 2000);
    }
}

function removeFavorite(id) {
    // Legacy - pour les anciens favoris locaux
    state.favorites = (state.favorites || []).filter(f => f.id !== id);
    const btn = document.querySelector(`#${id} .btn-like.active`);
    if (btn) btn.classList.remove('active');
    saveState();
    renderFavorites();
    updateFavCount();
    toast('Retiré des favoris');
}

// === VUE FAVORIS/LIKES LOCAUX ===
async function openFavoritesView() {
    const overlay = document.getElementById('favoritesOverlay');
    const grid = document.getElementById('favoritesGrid');
    if (!overlay || !grid) return;
    
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    // Charger les sources likées avec leurs métadonnées, triées par date
    const likedItems = [];
    likedSourceUrls.forEach(url => {
        const data = likedSourcesData.get(url) || { timestamp: 0 };
        likedItems.push({
            url,
            timestamp: data.timestamp || 0,
            title: data.title || extractPageTitleFromUrl(url),
            author: data.author || extractAuthorFromUrl(url),
            preview: data.preview || ''
        });
    });
    
    // Trier par date décroissante (plus récent en premier)
    likedItems.sort((a, b) => b.timestamp - a.timestamp);
    
    if (likedItems.length === 0) {
        grid.innerHTML = `
            <div class="likes-empty">
                <div class="likes-empty-icon">♡</div>
                <h3>Votre bibliothèque est vide</h3>
                <p>Cliquez sur ♥ pour sauvegarder vos textes préférés et les retrouver ici.</p>
            </div>
        `;
        return;
    }
    
    // Générer le HTML avec un style plus attrayant
    grid.innerHTML = `
        <div class="likes-header-info">
            <span class="likes-count">♥ ${likedItems.length} texte${likedItems.length > 1 ? 's' : ''} dans votre bibliothèque</span>
        </div>
        <div class="likes-list">
            ${likedItems.map((item, index) => {
                const safeUrl = item.url.replace(/'/g, "\\'");
                const timeAgo = getTimeAgo(item.timestamp);
                // Toujours afficher un extrait, même court
                const excerpt = item.preview 
                    ? item.preview.substring(0, 150).trim() + (item.preview.length > 150 ? '…' : '')
                    : '« Cliquez pour découvrir ce texte »';
                return `
                <article class="liked-text-card" onclick="loadSourceByUrl('${safeUrl}')" style="animation-delay: ${index * 0.04}s">
                    <div class="liked-card-accent"></div>
                    <div class="liked-text-main">
                        <div class="liked-text-meta">
                            <span class="liked-text-author">${esc(item.author)}</span>
                            <span class="liked-text-dot">·</span>
                            <span class="liked-text-time">${timeAgo}</span>
                        </div>
                        <h3 class="liked-text-title">${esc(item.title)}</h3>
                        <p class="liked-text-excerpt">${esc(excerpt)}</p>
                        <div class="liked-text-cta">
                            <span class="liked-cta-text">Lire →</span>
                        </div>
                    </div>
                    <button class="liked-text-remove" onclick="event.stopPropagation(); unlikeByUrl('${safeUrl}')" title="Retirer de ma bibliothèque">✕</button>
                </article>
            `}).join('')}
        </div>
    `;
}

// Formater le temps écoulé
function getTimeAgo(timestamp) {
    if (!timestamp) return '';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'à l\'instant';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `il y a ${days}j`;
    if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`;
    return `il y a ${Math.floor(days / 30)} mois`;
}

// Extraire l'auteur depuis l'URL
function extractAuthorFromUrl(url) {
    const parts = url.split('/');
    // Format typique: .../Auteur/oeuvre.txt
    if (parts.length >= 2) {
        return decodeURIComponent(parts[parts.length - 2] || 'Anonyme');
    }
    return 'Anonyme';
}

// Extraire le titre de page Wikisource depuis l'URL
function extractPageTitleFromUrl(url) {
    // URL format: https://fr.wikisource.org/wiki/Titre_de_la_page
    const match = url.match(/\/wiki\/(.+)$/);
    if (match) {
        return decodeURIComponent(match[1]);
    }
    return null;
}

// Unlike via URL
function unlikeByUrl(url) {
    likedSourceUrls.delete(url);
    likedSourcesData.delete(url);
    saveLikedSources();
    updateLikeCount();
    
    // Sync avec Supabase
    removeLikeFromSupabase(url);
    
    // Mettre à jour le bouton si la carte est visible
    const card = document.querySelector(`.text-card[data-url="${url}"]`);
    if (card) {
        const btn = card.querySelector('.btn-like');
        if (btn) btn.classList.remove('active');
    }
    
    // Re-render la vue
    openFavoritesView();
}

// Charger une source par URL (si pas dans le feed)
async function loadSourceByUrl(url) {
    closeFavoritesView();
    
    // Extraire le titre de la page depuis l'URL
    const pageTitle = extractPageTitleFromUrl(url);
    if (!pageTitle) {
        toast('Impossible d\'extraire le titre');
        return;
    }
    
    // Déterminer le wikisource depuis l'URL
    let ws = getCurrentWikisource();
    const urlMatch = url.match(/https?:\/\/([a-z]{2})\.wikisource\.org/);
    if (urlMatch) {
        const lang = urlMatch[1];
        ws = WIKISOURCES.find(w => w.lang === lang) || ws;
    }
    
    toast('Chargement...');
    
    try {
        const result = await fetchText(pageTitle, 0, ws);
        if (result?.text) {
            // Ouvrir directement dans le reader
            const author = detectAuthor(pageTitle, result.text, result.author);
            const displayTitle = pageTitle.split('/').pop() || pageTitle;
            
            document.getElementById('readerTitle').textContent = `${author} — ${displayTitle}`;
            document.getElementById('readerContent').innerHTML = `
                <div style="white-space: pre-wrap; text-align: justify; line-height: 1.8;">${esc(result.text)}</div>
                <div style="margin-top: 2rem; text-align: center;">
                    <a href="${url}" target="_blank" style="color: var(--muted); font-size: 0.85rem;">Voir sur Wikisource →</a>
                </div>
            `;
            document.getElementById('reader').classList.add('open');
            document.body.style.overflow = 'hidden';
        } else {
            toast('Texte introuvable');
        }
    } catch (e) {
        console.error('Erreur chargement texte liké:', e);
        toast('Erreur de chargement');
    }
}

function closeFavoritesView() {
    const overlay = document.getElementById('favoritesOverlay');
    if (overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function openFavInReader(id) {
    const fav = (state.favorites || []).find(f => f.id === id);
    if (fav) {
        closeFavoritesView();
        // Chercher la carte dans le feed ou créer une vue reader
        const card = document.getElementById(id);
        if (card) {
            const btn = card.querySelector('.read-more-btn');
            if (btn) btn.click();
            else {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            // Ouvrir directement dans le reader avec le texte sauvegardé
            openReaderWithFav(fav);
        }
    }
}

function openReaderWithFav(fav) {
    const overlay = document.getElementById('readerOverlay');
    const content = document.getElementById('readerContent');
    if (!overlay || !content) return;
    
    content.innerHTML = `
        <div style="text-align:center; margin-bottom: 3rem;">
            <div style="font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 600;">${esc(fav.author || 'Anonyme')}</div>
            <div style="color: var(--muted); font-style: italic; margin-top: 0.5rem;">${esc(fav.title?.split('/').pop() || fav.title || '')}</div>
        </div>
        <div style="white-space: pre-wrap; text-align: justify;">${esc(fav.text || 'Texte non disponible')}</div>
    `;
    
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function removeFavoriteFromView(id) {
    removeFavorite(id);
    // Re-render la vue favoris
    openFavoritesView();
}

function updateFavCount() {
    // Les compteurs sont gérés par loadUserStats() depuis Supabase
    if (typeof loadUserStats === 'function' && currentUser) {
        loadUserStats();
    }
}

// Trouver les auteurs connexes basés sur les favoris et les découvertes
function getConnectedAuthors() {
    const connected = new Map(); // auteur -> source(s)
    
    // Utiliser les auteurs découverts comme base de recommandation
    // Un auteur "similaire" est un auteur lu dans la même session mais pas encore liké
    for (const likedAuthor of state.likedAuthors) {
        // Chercher des auteurs découverts récemment (dans authorConnections dynamique)
        const connections = authorConnections[likedAuthor] || [];
        for (const connectedAuthor of connections) {
            // Ne pas recommander un auteur déjà lu/liké
            if (state.likedAuthors.has(connectedAuthor)) continue;
            if (state.discoveredConnections.has(connectedAuthor)) continue;
            
            if (!connected.has(connectedAuthor)) {
                connected.set(connectedAuthor, []);
            }
            connected.get(connectedAuthor).push(likedAuthor);
        }
    }
    
    // Trier par nombre de connexions (auteurs recommandés par plusieurs sources d'abord)
    return [...connected.entries()]
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 6);
}

// Mettre à jour l'affichage des connexions
function updateConnections() {
    const connected = getConnectedAuthors();
    const section = document.getElementById('connectionsSection');
    const graph = document.getElementById('connectionGraph');
    const recoBanner = document.getElementById('recoBanner');
    const recoAuthors = document.getElementById('recoAuthors');
    
    if (connected.length === 0) {
        section.style.display = 'none';
        recoBanner.style.display = 'none';
        return;
    }
    
    // Afficher la section dans le panneau
    section.style.display = 'block';
    graph.innerHTML = connected.map(([author, sources]) => {
        const isDiscovered = state.discoveredConnections.has(author);
        const sourceList = sources.slice(0, 2).join(', ');
        return `
            <div class="connection-item" onclick="exploreAuthor('${author.replace(/'/g, "\\'")}')">
                <div class="connection-node ${isDiscovered ? 'discovered' : ''}">
                    <span class="connection-dot"></span>
                    <span>${author}</span>
                </div>
                <div class="connection-label">via ${sourceList}</div>
            </div>
        `;
    }).join('');
    
    // Afficher la bannière de recommandation
    recoBanner.style.display = 'block';
    recoAuthors.innerHTML = connected.slice(0, 4).map(([author]) => `
        <span class="reco-author" onclick="exploreAuthor('${author.replace(/'/g, "\\'")}')">${author}</span>
    `).join('');
}

// ═══════════════════════════════════════════════════════════
// 🕸️ AFFICHER LES AUTEURS LIÉS À UN TEXTE (clic sur carte)
// ═══════════════════════════════════════════════════════════
function showRelatedAuthors(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const author = card.dataset.author;
    const container = document.getElementById('related-' + cardId);
    
    // Toggle : si déjà visible, cacher
    if (container.style.display !== 'none') {
        container.style.display = 'none';
        return;
    }
    
    // Trouver les auteurs connectés (dynamiquement découverts)
    const connected = authorConnections[author] || [];
    
    // Ajouter des suggestions basées sur le genre
    const tag = card.dataset.tag;
    const genreAuthors = getAuthorsForGenre(tag, author);
    
    // Combiner et dédupliquer
    const allRelated = [...new Set([...connected, ...genreAuthors])].slice(0, 6);
    
    if (allRelated.length === 0) {
        container.innerHTML = `<div class="no-related">Aucune connexion connue. <button class="btn btn-small" onclick="randomJump()">🎲 Hasard</button></div>`;
    } else {
        container.innerHTML = `
            <div class="related-title">🕸️ Auteurs proches de ${author.split(' ').pop()}</div>
            <div class="related-list">
                ${allRelated.map(a => `
                    <button class="related-btn" onclick="exploreAuthor('${a.replace(/'/g, "\\'")}')">
                        ${a.split(' ').pop()}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    container.style.display = 'block';
    toast(`${allRelated.length} auteur(s) à explorer`);
}

// Trouver des auteurs du même genre (classiques mondiaux + dynamique)
function getAuthorsForGenre(genre, excludeAuthor) {
    // Auteurs classiques par genre (mix mondial)
    const genreMap = {
        'poésie': ['Baudelaire', 'Rimbaud', 'Shakespeare', 'Goethe', 'Dante', 'Petrarca', 'Pushkin', 'Neruda'],
        'poetry': ['Shakespeare', 'Keats', 'Byron', 'Wordsworth', 'Dickinson', 'Whitman', 'Poe'],
        'théâtre': ['Molière', 'Shakespeare', 'Goethe', 'Calderón', 'Goldoni', 'Chekhov'],
        'drama': ['Shakespeare', 'Marlowe', 'Ibsen', 'Chekhov', 'Wilde'],
        'roman': ['Balzac', 'Dickens', 'Dostoevsky', 'Tolstoy', 'Cervantes', 'Mann'],
        'novel': ['Dickens', 'Austen', 'Brontë', 'Twain', 'Melville', 'James'],
        'conte': ['Perrault', 'Grimm', 'Andersen', 'Maupassant'],
        'tale': ['Grimm', 'Andersen', 'Wilde', 'Poe'],
        'fable': ['La Fontaine', 'Ésope', 'Aesop', 'Krylov'],
        'texte': ['Hugo', 'Goethe', 'Dante', 'Cervantes'],
        'text': ['Milton', 'Bunyan', 'Swift', 'Defoe']
    };
    
    // Ajouter les auteurs découverts dynamiquement pour ce genre
    const discovered = Object.keys(state.authorStats);
    const baseList = genreMap[genre?.toLowerCase()] || [];
    const combined = [...baseList, ...discovered];
    
    return [...new Set(combined)]
        .filter(a => a !== excludeAuthor && a !== 'Anonyme')
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);
}

// Explorer un auteur spécifique (recherche ciblée) - charge les textes EN HAUT
async function exploreAuthor(author) {
    if (state.loading) return;
    state.loading = true;
    
    toast(`🔍 Exploration de ${author}...`);
    state.discoveredConnections.add(author);
    saveState();
    
    // Afficher indicateur de chargement en haut
    const feed = document.getElementById('feed');
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'top-loading-indicator';
    loadingIndicator.id = 'topLoadingIndicator';
    loadingIndicator.innerHTML = `<div class="spinner-small"></div> Recherche de ${author}...`;
    feed.insertBefore(loadingIndicator, feed.firstChild);
    
    // Recherches spécifiques pour cet auteur
    const searches = [`${author} poem`, `${author} text`, `${author} sonnet`, author];
    const newCards = [];
    
    // Utiliser les wikisources actives selon le filtre
    const activeSources = getActiveWikisources();
    const shuffledWS = [...activeSources].sort(() => Math.random() - 0.5).slice(0, Math.min(3, activeSources.length));
    
    for (const ws of shuffledWS) {
        for (const query of searches) {
            if (newCards.length >= 3) break; // Limiter à 3 textes
            const results = await searchTexts(query, 5, ws);
            for (const r of results) {
                if (newCards.length >= 3) break;
                if (!state.shownPages.has(r.title) && isValidTitle(r.title)) {
                    // Charger le texte complet
                    const result = await fetchText(r.title, 0, ws);
                    if (result?.text?.length > 150) {
                        state.shownPages.add(r.title);
                        const cardEl = createCardElement(result, r.title, ws);
                        if (cardEl) newCards.push(cardEl);
                    }
                }
            }
        }
        if (newCards.length >= 3) break;
    }
    
    // Supprimer l'indicateur de chargement
    loadingIndicator.remove();
    
    // Insérer les nouvelles cartes en haut avec animation
    if (newCards.length > 0) {
        for (let i = newCards.length - 1; i >= 0; i--) {
            const card = newCards[i];
            card.classList.add('card-new');
            feed.insertBefore(card, feed.firstChild);
            setTimeout(() => {
                card.classList.add('show');
                card.classList.add('card-highlight');
            }, (newCards.length - 1 - i) * 100);
        }
        
        setTimeout(() => {
            newCards.forEach(card => card.classList.remove('card-highlight', 'card-new'));
        }, 3000);
        
        // PAS de scroll automatique - ne pas perturber la lecture
        toast(`❧ ${newCards.length} texte${newCards.length > 1 ? 's' : ''} ajouté${newCards.length > 1 ? 's' : ''}`);
        toast(`✨ ${newCards.length} texte${newCards.length > 1 ? 's' : ''} de ${author} !`);
    } else {
        toast(`😕 Aucun texte trouvé pour ${author}`);
    }
    
    updateConnections();
    state.loading = false;
}

function openReader(id) {
    const card = document.getElementById(id);
    if (!card) return;
    const author = card.dataset.author;
    const title = card.dataset.title;
    const text = card.dataset.text || '';
    document.getElementById('readerTitle').textContent = `${author} — ${title.split('/')[0]}`;
    document.getElementById('readerContent').innerHTML = esc(text);
    document.getElementById('reader').classList.add('open');
    document.body.style.overflow = 'hidden';
    state.readCount++;
    
    // Tracker les mots lus
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    recordReading(wordCount);
    startReadingTimer();
    
    saveState();
    
    // Fonctionnalités fun
    addToReadingPath(author, title);
    checkAchievements();
    updateFunStat();
    updateStats();
}

function closeReader() {
    document.getElementById('reader').classList.remove('open');
    document.body.style.overflow = '';
    stopReadingTimer();
}
// ═══════════════════════════════════════════════════════════
// 🏷️ SYSTÈME DE MOTS-CLÉS - Extraction et exploration
// ═══════════════════════════════════════════════════════════

// Dictionnaire de thèmes littéraires pour enrichir l'extraction
const LITERARY_THEMES = {
    emotions: ['amour', 'haine', 'joie', 'tristesse', 'mélancolie', 'désespoir', 'espoir', 'passion', 'colère', 'peur', 'angoisse', 'bonheur', 'souffrance', 'douleur', 'extase', 'ennui', 'solitude', 'nostalgie', 'regret', 'jalousie'],
    nature: ['forêt', 'mer', 'océan', 'montagne', 'rivière', 'fleuve', 'lac', 'ciel', 'étoiles', 'lune', 'soleil', 'aurore', 'crépuscule', 'nuit', 'jour', 'saison', 'printemps', 'été', 'automne', 'hiver', 'tempête', 'orage', 'pluie', 'neige', 'vent', 'fleur', 'arbre', 'jardin', 'campagne', 'désert'],
    existence: ['mort', 'vie', 'âme', 'destin', 'temps', 'éternité', 'infini', 'néant', 'existence', 'être', 'devenir', 'mémoire', 'oubli', 'rêve', 'sommeil', 'éveil', 'conscience', 'liberté', 'fatalité', 'hasard'],
    societe: ['roi', 'reine', 'prince', 'peuple', 'guerre', 'paix', 'justice', 'loi', 'pouvoir', 'gloire', 'honneur', 'vertu', 'crime', 'châtiment', 'révolte', 'révolution', 'patrie', 'exil', 'prison', 'esclavage'],
    spirituel: ['dieu', 'diable', 'ange', 'démon', 'paradis', 'enfer', 'péché', 'grâce', 'prière', 'foi', 'doute', 'mystère', 'sacré', 'profane', 'miracle', 'prophétie', 'apocalypse', 'résurrection', 'salut', 'damnation'],
    corps: ['coeur', 'yeux', 'regard', 'visage', 'main', 'sang', 'larme', 'sourire', 'baiser', 'étreinte', 'beauté', 'laideur', 'jeunesse', 'vieillesse', 'maladie', 'guérison', 'blessure', 'cicatrice'],
    art: ['poésie', 'musique', 'chant', 'danse', 'peinture', 'sculpture', 'théâtre', 'roman', 'conte', 'fable', 'légende', 'mythe', 'héros', 'muse', 'inspiration', 'génie', 'création'],
    voyage: ['voyage', 'chemin', 'route', 'errance', 'aventure', 'découverte', 'horizon', 'lointain', 'ailleurs', 'retour', 'départ', 'arrivée', 'navire', 'île', 'continent', 'orient', 'occident'],
    amour_passion: ['amant', 'amante', 'maîtresse', 'époux', 'épouse', 'fiancé', 'séduction', 'désir', 'volupté', 'ivresse', 'abandon', 'trahison', 'fidélité', 'rupture', 'retrouvailles']
};

// Mots vides à ignorer
const STOP_WORDS = new Set(['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi', 'dont', 'ce', 'cette', 'ces', 'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses', 'notre', 'votre', 'leur', 'nos', 'vos', 'leurs', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'on', 'se', 'ne', 'pas', 'plus', 'moins', 'tout', 'tous', 'toute', 'toutes', 'autre', 'autres', 'bien', 'peu', 'trop', 'aussi', 'encore', 'jamais', 'toujours', 'rien', 'personne', 'chaque', 'quelque', 'aucun', 'sans', 'avec', 'pour', 'par', 'dans', 'sur', 'sous', 'entre', 'vers', 'chez', 'comme', 'ainsi', 'alors', 'puis', 'quand', 'avoir', 'faire', 'dire', 'voir', 'aller', 'venir', 'pouvoir', 'vouloir', 'devoir', 'falloir', 'savoir', 'prendre', 'mettre', 'fait', 'dit', 'sont', 'ont', 'aux', 'the', 'and', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'for', 'with', 'from', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'nor', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'now', 'its', 'this', 'that', 'these', 'those', 'myself', 'our', 'ours', 'ourselves', 'your', 'yours', 'yourself', 'yourselves', 'him', 'his', 'himself', 'her', 'hers', 'herself', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'whom', 'whose']);

function extractKeywords(text, title, author, tag) {
    const keywords = new Set();
    const fullText = (text + ' ' + title).toLowerCase();
    
    // 1. Chercher les thèmes littéraires présents dans le texte
    for (const [category, themes] of Object.entries(LITERARY_THEMES)) {
        for (const theme of themes) {
            if (fullText.includes(theme.toLowerCase())) {
                keywords.add(theme);
                if (keywords.size >= 8) break;
            }
        }
        if (keywords.size >= 8) break;
    }
    
    // 2. Extraire les mots significatifs du texte
    const words = fullText
        .replace(/[.,;:!?()\[\]{}"']/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 4 && !STOP_WORDS.has(w));
    
    // Compter les occurrences
    const wordCount = {};
    words.forEach(w => wordCount[w] = (wordCount[w] || 0) + 1);
    
    // Ajouter les mots les plus fréquents
    const sorted = Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    for (const [word] of sorted) {
        if (keywords.size < 5 && word.length > 3 && !keywords.has(word)) {
            keywords.add(word);
        }
    }
    
    // 3. Ajouter le genre comme mot-clé si pas assez
    if (tag && keywords.size < 5) {
        keywords.add(tag);
    }
    
    return [...keywords].slice(0, 5);
}

// Explorer un mot-clé
async function exploreKeyword(keyword) {
    toast(`🏷️ Exploration de #${keyword}...`);
    await exploreAuthor(keyword);
}

document.onkeydown = e => { if (e.key === 'Escape') closeReader(); };

// Exposer les fonctions et variables nécessaires pour les autres modules
window.state = state;
window.exploreAuthor = exploreAuthor;
window.syncLikesFromSupabase = syncLikesFromSupabase;

init();
