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
    likes: new Set(), readCount: 0, loading: false, prefetching: false, cache: new Map(),
    textPool: [], shownPages: new Set(), cardIdx: 0,
    activeSearchTerm: null, searchOffset: 0, // Le contexte courant de l'exploration (null = drift)
    authorStats: {}, genreStats: {},
    // Stats basées sur les textes likés/partagés (vos vrais goûts)
    likedGenreStats: {}, likedAuthorStats: {},
    likedAuthors: new Set(), discoveredConnections: new Set(),
    readingPath: [],
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
    
    // Bouton header desktop - icône Lucide
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
    }
    
    // Bouton drawer mobile - icône Lucide
    const drawerIcon = document.getElementById('drawerThemeIcon');
    const drawerText = document.getElementById('drawerThemeText');
    if (drawerIcon) {
        drawerIcon.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
    }
    // Utiliser les traductions si disponibles
    if (drawerText) {
        const darkText = typeof t === 'function' ? t('dark_mode') : 'Mode sombre';
        const lightText = typeof t === 'function' ? t('light_mode') : 'Mode clair';
        drawerText.textContent = isLight ? darkText : lightText;
    }
    
    // Réinitialiser Lucide pour les icônes
    if (window.lucide) lucide.createIcons();
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
    
    // Compter les abonnés (personnes qui me suivent)
    const { count: followersCount } = await supabaseClient
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', currentUser.id);
    
    const myFollowersEl = document.getElementById('myFollowersCount');
    if (myFollowersEl) myFollowersEl.textContent = followersCount || 0;
    
    const mobileFollowers = document.getElementById('mobileProfileFollowers');
    if (mobileFollowers) mobileFollowers.textContent = followersCount || 0;
    
    // Compter les abonnements (personnes que je suis)
    const { count: followingCount } = await supabaseClient
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', currentUser.id);
    
    const myFollowingEl = document.getElementById('myFollowingCount');
    if (myFollowingEl) myFollowingEl.textContent = followingCount || 0;
    
    const mobileFollowing = document.getElementById('mobileProfileFollowing');
    if (mobileFollowing) mobileFollowing.textContent = followingCount || 0;
}

/**
 * Ouvrir la liste de mes abonnés
 */
function showMyFollowers() {
    if (!currentUser) return;
    // Ouvrir mon propre profil directement sur l'onglet abonnés
    openUserProfile(currentUser.id, currentUser.user_metadata?.username || 'Moi', 'followers');
}

/**
 * Ouvrir la liste de mes abonnements
 */
function showMyFollowing() {
    if (!currentUser) return;
    // Ouvrir mon propre profil directement sur l'onglet abonnements
    openUserProfile(currentUser.id, currentUser.user_metadata?.username || 'Moi', 'following');
}

// Exposer les fonctions
window.showMyFollowers = showMyFollowers;
window.showMyFollowing = showMyFollowing;

// Helpers formatTimeAgo et escapeHtml sont dans utils.js

function openMyProfile() {
    closeUserDropdown();
    if (!currentUser) {
        openAuthModal('login');
        toast('Connectez-vous pour voir votre profil');
        return;
    }
    // Ouvrir le profil de l'utilisateur connecté
    const username = currentUser.user_metadata?.username || 'Moi';
    if (typeof openUserProfile === 'function') {
        openUserProfile(currentUser.id, username, 'extraits');
    } else {
        // Fallback
        switchSocialTab('mine');
        openSocialFeed();
    }
}

// ═══════════════════════════════════════════════════════════
// 💬 MESSAGERIE → messaging.js
// 🔔 NOTIFICATIONS → notifications.js
// ═══════════════════════════════════════════════════════════

// Fonction pour partager depuis une carte
async function shareCardExtrait(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const fullText = card.dataset.text || '';
    const author = card.dataset.author || 'Inconnu';
    const title = card.dataset.title || 'Sans titre';
    const tag = card.dataset.tag || '';
    
    // Priorité : sélection utilisateur > texte complet
    const selection = window.getSelection().toString().trim();
    const textToShare = selection.length >= 20 ? selection : fullText;
    
    // Construire l'URL (Wikisource ou autre)
    const lang = card.dataset.lang || 'fr';
    const sourceUrl = card.dataset.url || `https://${lang}.wikisource.org/wiki/${encodeURIComponent(title)}`;
    
    // Récupérer ou créer l'extrait_id pour cette carte
    let extraitId = card.dataset.extraitId;
    if (!extraitId && typeof resolveExtraitIdForCard === 'function') {
        extraitId = await resolveExtraitIdForCard(card, true);
    }
    
    // Passer l'extraitId et le cardId pour pouvoir mettre à jour les compteurs
    openShareModal(textToShare, author, title, sourceUrl, extraitId, tag, cardId);
}

// Fonction pour ajouter une carte à une collection
async function openCollectionPickerFromCard(cardId) {
    const card = document.getElementById(cardId);
    if (!card) {
        toast('❌ Carte introuvable');
        return;
    }
    
    // Récupérer ou créer l'extrait_id pour cette carte
    let extraitId = card.dataset.extraitId;
    if (!extraitId && typeof resolveExtraitIdForCard === 'function') {
        extraitId = await resolveExtraitIdForCard(card, true);
    }
    
    const item = {
        type: 'source', // Texte source (pas un extrait partagé)
        extrait_id: extraitId || null, // Passer l'extrait_id si disponible
        title: card.dataset.title || 'Sans titre',
        author: card.dataset.author || 'Inconnu',
        text: card.dataset.text || '',
        url: card.dataset.url || '',
        tag: card.dataset.tag || '',
        lang: card.dataset.lang || 'fr',
        cardId: cardId
    };
    
    // Appeler la fonction du module collections
    if (typeof openCollectionPicker === 'function') {
        openCollectionPicker(item);
    } else {
        toast('❌ Module collections non chargé');
    }
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
    // Utiliser l'URL stockée dans dataset si disponible (ex: Archive.org)
    const sourceUrl = card.dataset.url || `https://${lang}.wikisource.org/wiki/${encodeURIComponent(title)}`;
    
    // Récupérer la sélection ou le teaser
    const selection = window.getSelection().toString().trim();
    const textToShare = selection.length >= 20 ? selection : text.substring(0, 500);
    const { textHash, textLength } = buildExtraitKey(textToShare, title, author, sourceUrl);
    
    // Vérifier si cet extrait existe déjà (même texte, même source)
    if (supabaseClient) {
        let existing = null;
        let existingQuery = supabaseClient
            .from('extraits')
            .select('id')
            .eq('source_title', title)
            .eq('source_author', author);

        if (sourceUrl) existingQuery = existingQuery.eq('source_url', sourceUrl);
        if (textHash) existingQuery = existingQuery.eq('text_hash', textHash);

        const { data: existingByHash } = await existingQuery
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        existing = existingByHash || null;

        if (!existing) {
            let existingFallbackQuery = supabaseClient
                .from('extraits')
                .select('id')
                .eq('source_title', title)
                .eq('source_author', author);
            if (sourceUrl) existingFallbackQuery = existingFallbackQuery.eq('source_url', sourceUrl);

            const { data: existingFallback } = await existingFallbackQuery
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            existing = existingFallback || null;
        }
        
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
                text_hash: textHash || null,
                text_length: textLength || null,
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
    
    // Initialiser Supabase (social features) - NON BLOQUANT
    initSupabase();
    
    // ═══════════════════════════════════════════════════════════
    // 🔗 DÉTECTION DES LIENS DE PARTAGE (query params)
    // Les liens partagés utilisent ?eid=... (extrait ID) directement
    // pour survivre au partage via WhatsApp, Messenger, etc.
    // ═══════════════════════════════════════════════════════════
    const shareParams = new URLSearchParams(window.location.search);
    const sharedExtraitId = shareParams.get('eid');
    if (sharedExtraitId) {
        // Nettoyer l'URL sans recharger
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState(null, '', cleanUrl + '#/text/' + sharedExtraitId);
    }
    
    // Vérifier si c'est un retour depuis un email de reset password
    checkPasswordResetToken();
    
    loadState();

    // ═══════════════════════════════════════════════════════════════
    // 🧭 ROUTER - Initialisation des routes
    // ═══════════════════════════════════════════════════════════════
    if (typeof Router !== 'undefined') {
        Router.on('/', () => {
            // Page d'accueil — dérive libre (default behavior)
        });
        Router.on('trending', () => {
            if (typeof openTrendingFeed === 'function') openTrendingFeed();
        });
        Router.on('social', () => {
            if (typeof openSocialFeed === 'function') openSocialFeed();
        });
        Router.on('profile/:id', (params) => {
            if (typeof openUserProfile === 'function') openUserProfile(params.id);
        });
        Router.on('text/:id', (params) => {
            // Ouvrir l'overlay social d'abord (comme la recherche), puis charger l'extrait
            if (typeof openSocialFeed === 'function') openSocialFeed();
            if (typeof viewExtraitById === 'function') {
                setTimeout(() => viewExtraitById(params.id), 300);
            }
        });
        Router.on('collection/:id', (params) => {
            if (typeof openCollectionById === 'function') openCollectionById(params.id);
        });
        Router.on('explore/:keyword', (params) => {
            if (typeof exploreKeyword === 'function') exploreKeyword(decodeURIComponent(params.keyword));
        });
        Router.on('author/:name', (params) => {
            exploreAuthor(decodeURIComponent(params.name));
        });
        Router.on('random', () => {
            if (typeof pureRandomJump === 'function') pureRandomJump();
        });
        Router.on('collections', () => {
            if (typeof openCollectionsView === 'function') openCollectionsView();
        });
        Router.on('preview', (params, query) => {
            // Afficher un aperçu de texte partagé via lien
            showSharedPreview(query);
        });
        // N'initialiser le router qu'après le chargement initial (avoid premature navigation)
        window._routerReady = true;
    }
    
    // Mettre à jour le lang HTML dynamiquement
    const interfaceLang = localStorage.getItem('palimpseste_interface_lang') || 'fr';
    document.documentElement.setAttribute('lang', interfaceLang);
    
    // Restaurer le choix de langue ou détecter automatiquement
    const savedLang = localStorage.getItem('palimpseste_lang');
    const validLangs = ['all', ...WIKISOURCES.map(w => w.lang)];
    
    if (savedLang && validLangs.includes(savedLang)) {
        // Utiliser la langue sauvegardée
        setSelectedLang(savedLang);
    } else {
        // Détecter la langue du navigateur
        const browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0].toLowerCase();
        // Si la langue du navigateur est supportée, l'utiliser, sinon anglais par défaut
        const langToSet = validLangs.includes(browserLang) ? browserLang : 'en';
        setSelectedLang(langToSet);
        localStorage.setItem('palimpseste_lang', langToSet);
    }
    
    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = getSelectedLang();
    
    // Charger les likes en arrière-plan (NON BLOQUANT)
    if (typeof loadLikedSources === 'function') {
        loadLikedSources().catch(e => console.warn('loadLikedSources deferred:', e));
    }
    
    // Mise à jour UI légère en parallèle (pas d'await)
    updateStats();
    updateConnections();
    renderReadingPath();
    renderFavorites();
    updateFavCount();
    updateFunStat();
    
    // ⚡ CHARGEMENT RAPIDE: Afficher le loader et lancer immédiatement fillPool + loadMore
    document.getElementById('loading').style.display = 'block';
    
    // Lancer fillPool et loadMore dès que possible
    await fillPool();
    document.getElementById('loading').style.display = 'none';
    await loadMore();
    
    // ✅ Marquer que le chargement initial est terminé (permet le scroll vers le haut)
    window.initialLoadComplete = true;
    
    // 🧭 Initialiser le router maintenant que tout est chargé
    if (typeof Router !== 'undefined' && window._routerReady) {
        Router.init();
    }
    
    // ⚡ Précharger immédiatement du contenu vers le HAUT (comme pour le bas)
    // Cela permet à l'utilisateur de scroller vers le haut dès l'ouverture
    setTimeout(() => {
        loadNewTextsOnTop();
    }, 100);
    
    // Mise à jour périodique du fun stat
    var _funStatInterval = setInterval(updateFunStat, 15000);
    window.addEventListener('beforeunload', function() { clearInterval(_funStatInterval); });
    
    // Créer le bouton scroll to top
    createScrollTopButton();

    // Pull to refresh - UNIQUEMENT quand on tire vers le BAS depuis le sommet (MOBILE)
    // Système optimisé pour éviter les déclenchements accidentels
    let pullStartY = 0;
    let pullStartScrollY = 0;
    let isPulling = false;
    let pullIndicator = null;
    let pullCancelled = false;
    let lastTouchY = 0;
    let pullRefreshCooldown = false; // Empêcher les déclenchements multiples
    
    document.addEventListener('touchstart', (e) => {
        // Reset à chaque nouveau touch
        pullCancelled = false;
        pullStartScrollY = window.scrollY;
        pullStartY = e.touches[0].clientY;
        lastTouchY = pullStartY;
        
        // N'activer que si on est vraiment tout en haut ET pas en cooldown
        if (window.scrollY <= 0 && !pullRefreshCooldown && !state.loading) {
            isPulling = true;
        } else {
            isPulling = false;
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        const currentY = e.touches[0].clientY;
        const movingDown = currentY > lastTouchY; // Doigt qui descend = tire vers le bas
        lastTouchY = currentY;
        
        // Annuler si on a scrollé depuis le début (évite le bug de "rebond")
        if (window.scrollY > 5 || pullStartScrollY > 5) {
            isPulling = false;
            pullCancelled = true;
            if (pullIndicator) {
                pullIndicator.remove();
                pullIndicator = null;
            }
            return;
        }
        
        if (!isPulling || pullCancelled || state.loading) return;
        
        const pullDistance = currentY - pullStartY;
        
        // Seuils réduits pour déclenchement facile (30px affiche, 70px déclenche)
        if (pullDistance > 30 && !state.loading) {
            // Afficher indicateur de pull
            if (!pullIndicator) {
                pullIndicator = document.createElement('div');
                pullIndicator.className = 'pull-indicator';
                pullIndicator.innerHTML = '↓ Tirer pour rafraîchir';
                document.body.appendChild(pullIndicator);
            }
            pullIndicator.style.opacity = Math.min(1, (pullDistance - 30) / 40);
            pullIndicator.textContent = pullDistance > 70 ? '↻ Relâcher pour charger' : '↓ Tirer pour rafraîchir';
        } else if (pullIndicator && pullDistance < 30) {
            // Cacher si on revient en arrière
            pullIndicator.remove();
            pullIndicator = null;
        }
    }, { passive: true });
    
    document.addEventListener('touchend', async () => {
        if (pullIndicator && !pullCancelled && !state.loading) {
            const shouldRefresh = pullIndicator.textContent.includes('Relâcher');
            pullIndicator.remove();
            pullIndicator = null;
            
            if (shouldRefresh) {
                // Activer le cooldown pour éviter les déclenchements multiples
                pullRefreshCooldown = true;
                setTimeout(() => { pullRefreshCooldown = false; }, 1000);
                
                await loadNewTextsOnTop();
            }
        } else if (pullIndicator) {
            pullIndicator.remove();
            pullIndicator = null;
        }
        isPulling = false;
        pullCancelled = false;
        pullStartY = 0;
        pullStartScrollY = 0;
    }, { passive: true });
    
    // Scroll vers le haut au sommet = charger nouveaux textes (DESKTOP)
    // ⚡ OPTIMISÉ: Déclenchement immédiat au premier scroll vers le haut
    let wheelUpCooldown = false;
    
    window.addEventListener('wheel', async (e) => {
        // Si on est en haut et qu'on scrolle vers le haut (deltaY négatif)
        // loadNewTextsOnTop gère son propre flag loadingTop, indépendant de state.loading
        if (window.scrollY <= 5 && e.deltaY < 0 && !wheelUpCooldown) {
            // Déclenchement immédiat au premier scroll vers le haut
            wheelUpCooldown = true;
            await loadNewTextsOnTop();
            // Cooldown de 1 seconde pour éviter les déclenchements multiples
            setTimeout(() => { wheelUpCooldown = false; }, 1000);
        }
    }, { passive: true });
    
    // Headroom: cacher le header quand on scrolle vers le bas, afficher vers le haut
    let lastScrollY = 0;
    let headerHidden = false;
    const header = document.querySelector('header');
    const explorationContainer = document.getElementById('explorationContainer');
    
    // IntersectionObserver pour infinite scroll vers le BAS (plus fiable que scroll event)
    const scrollSentinel = document.getElementById('scrollSentinel');
    if (scrollSentinel && 'IntersectionObserver' in window) {
        const infiniteScrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !state.loading) {
                    loadMore();
                }
            });
        }, {
            rootMargin: '1500px 0px' // Déclenche 1500px avant d'être visible
        });
        infiniteScrollObserver.observe(scrollSentinel);
    }
    
    // ⚡ IntersectionObserver pour infinite scroll vers le HAUT
    // Créer et observer une sentinelle en haut du feed
    const feed = document.getElementById('feed');
    if (feed && 'IntersectionObserver' in window) {
        // Créer la sentinelle en haut
        let topSentinel = document.getElementById('topScrollSentinel');
        if (!topSentinel) {
            topSentinel = document.createElement('div');
            topSentinel.id = 'topScrollSentinel';
            topSentinel.className = 'top-scroll-sentinel';
            topSentinel.setAttribute('aria-hidden', 'true');
            feed.insertBefore(topSentinel, feed.firstChild);
        }
        
        let topScrollCooldown = false;
        
        const topScrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Déclencher quand la sentinelle est visible ET qu'on est proche du haut
                // loadNewTextsOnTop gère son propre flag loadingTop, indépendant de state.loading
                if (entry.isIntersecting && window.scrollY <= 100 && !topScrollCooldown) {
                    topScrollCooldown = true;
                    loadNewTextsOnTop().finally(() => {
                        // Cooldown pour éviter les déclenchements répétés
                        setTimeout(() => { topScrollCooldown = false; }, 2000);
                    });
                }
            });
        }, {
            rootMargin: '500px 0px 0px 0px', // Marge généreuse pour déclencher tôt (comme le scroll vers le bas)
            threshold: 0
        });
        topScrollObserver.observe(topSentinel);
    }
    
    window.addEventListener('scroll', throttle(() => {
        document.getElementById('progress').style.width =
            (scrollY / (document.body.scrollHeight - innerHeight) * 100) + '%';
        // Fallback: déclencher si IntersectionObserver n'a pas fonctionné
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
    }, 80), { passive: true });
}
async function showSourceLikers(sourceUrl) {
    if (!supabaseClient || !sourceUrl) return;

    try {
        const { data } = await supabaseClient
            .from('extraits')
            .select('id')
            .eq('source_url', sourceUrl)
            .order('created_at', { ascending: false })
            .limit(1);

        const extraitId = data?.[0]?.id || null;
        if (extraitId && typeof showLikers === 'function') {
            showLikers(extraitId);
            return;
        }
    } catch (err) {
        console.warn('Impossible de résoudre l\'extrait pour showSourceLikers:', err);
    }

    openLikersModalWithMessage('Aucun like pour le moment');
}

function openLikersModalWithMessage(message) {
    let modal = document.getElementById('likersModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'likersModal';
        modal.className = 'likers-modal';
        modal.innerHTML = `
            <div class="likers-content">
                <div class="likers-header">
                    <h3>❤️ Aimé par</h3>
                    <button class="likers-close" onclick="closeLikersModal()">✕</button>
                </div>
                <div class="likers-list" id="likersList">
                    <div class="likers-loading">${t('loading')}</div>
                </div>
            </div>
        `;
        modal.onclick = (e) => { if (e.target === modal) closeLikersModal(); };
        document.body.appendChild(modal);
    }

    modal.classList.add('open');
    const listContainer = document.getElementById('likersList');
    if (listContainer) {
        listContainer.innerHTML = `<div class="likers-empty">${message}</div>`;
    }
}

async function showCardLikers(cardId) {
    if (!supabaseClient) return;
    const card = document.getElementById(cardId);
    if (!card) return;

    const extraitId = await resolveExtraitIdForCard(card, false);
    if (extraitId && typeof showLikers === 'function') {
        showLikers(extraitId);
        return;
    }

    openLikersModalWithMessage('Aucun like pour le moment');
}

async function showCardSharers(cardId) {
    if (!supabaseClient) return;
    const card = document.getElementById(cardId);
    if (!card) return;

    const extraitId = await resolveExtraitIdForCard(card, false);
    if (extraitId && typeof showSharers === 'function') {
        showSharers(extraitId);
        return;
    }

    if (typeof toast === 'function') toast('Aucun partage pour le moment');
}

async function showCardCollections(cardId) {
    if (!supabaseClient) return;
    const card = document.getElementById(cardId);
    if (!card) return;

    const extraitId = await resolveExtraitIdForCard(card, false);
    if (extraitId && typeof showExtraitCollections === 'function') {
        showExtraitCollections(extraitId);
        return;
    }

    if (typeof toast === 'function') toast('Aucune collection pour le moment');
}

function loadState() {
    try {
        const d = JSON.parse(localStorage.getItem('palimpseste') || '{}');
        
        // Charger favoris d'abord
        state.favorites = d.favorites || [];
        
        // Reconstruire likes depuis favorites (source de vérité)
        state.likes = new Set(state.favorites.map(f => f.id));
        
        state.readCount = d.readCount || 0;
        state.authorStats = d.authorStats || {};
        state.genreStats = d.genreStats || {};
        // Stats basées sur les textes likés/partagés (vos vrais goûts)
        state.likedGenreStats = d.likedGenreStats || {};
        state.likedAuthorStats = d.likedAuthorStats || {};
        state.likedAuthors = new Set(d.likedAuthors || []);
        state.discoveredConnections = new Set(d.discoveredConnections || []);
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
        // Stats basées sur les textes likés/partagés
        likedGenreStats: state.likedGenreStats,
        likedAuthorStats: state.likedAuthorStats,
        likedAuthors: [...state.likedAuthors],
        discoveredConnections: [...state.discoveredConnections],
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
    
    // Mettre à jour les statistiques de lecture
    updateReadingStatsUI();
}

// ═══════════════════════════════════════════════════════════

function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

function checkAndUpdateStreak() {
    const stats = state.readingStats;
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
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
        if (daysDiff > 1) {
            stats.streak = 0;
        }
    }
}

function recordReading(wordCount) {
    const stats = state.readingStats;
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
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
        <div class="genre-pill" onclick="exploreCategory('${escapeJsString(genre)}')" title="${escapeAttr(t('tooltip_explore_tree') + ' ' + genre)}">
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

// Détecter le tag probable depuis l'auteur (heuristique simple)
function detectTagFromAuthor(author) {
    if (!author) return 'Prose';
    
    // Essayer de déduire des informations contextuelles si disponible
    // Si l'auteur contient "Poète" ou "Poesis"
    if (/poè|poé|poet/i.test(author)) return 'Poésie';
    
    // Par défaut, nous considérons que c'est de la prose
    // La classification se fera principalement par les métadonnées de la source
    return 'Prose'; 
}

// Mapping auteur -> tag pour les connexions thématiques
const authorTagMapping = {};

// Construire dynamiquement les connexions entre auteurs
// Les auteurs du même genre (tag) sont connectés entre eux
function buildAuthorConnections(author, tag) {
    if (!author || author === 'Anonyme') return;
    if (!tag) return;
    
    // Mémoriser le tag principal de cet auteur
    if (!authorTagMapping[author]) {
        authorTagMapping[author] = tag;
    }
    
    // Trouver les autres auteurs du MÊME GENRE (tag)
    const sameGenreAuthors = Object.keys(authorTagMapping).filter(a => {
        return a !== author && a !== 'Anonyme' && authorTagMapping[a] === tag;
    });
    
    // Ajouter des connexions bidirectionnelles
    if (!authorConnections[author]) authorConnections[author] = [];
    
    // Connecter avec les auteurs du même genre découverts
    for (const other of sameGenreAuthors) {
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
    // hideNewTextsBanner(); // Removed
    toast('🔄 ' + t('new_texts_loading'));
    await fillPool();
    await loadMore();
    // Scroll vers le haut de façon fluide
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Charger de nouveaux textes en HAUT du feed (style Twitter "Voir les nouveaux tweets")
// Ne supprime JAMAIS les cartes existantes - ajoute uniquement en haut
// Utilise un flag séparé pour ne pas bloquer le chargement initial vers le bas
let loadingTop = false;
async function loadNewTextsOnTop() {
    if (loadingTop) return;
    loadingTop = true;
    
    const feed = document.getElementById('feed');
    if (!feed) {
        loadingTop = false;
        return;
    }
    
    // Sauvegarder la position de scroll actuelle pour ne pas perturber l'utilisateur
    const scrollBefore = window.scrollY;
    const firstCard = feed.querySelector('.card');
    const firstCardTop = firstCard?.getBoundingClientRect().top || 0;

    // Afficher un mini-indicateur en haut uniquement pendant le chargement
    const existing = document.getElementById('topLoadingIndicator');
    if (existing) existing.remove();
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'top-loading-indicator';
    loadingIndicator.id = 'topLoadingIndicator';
    loadingIndicator.innerHTML = `<div class="spinner-small"></div> ${getContextualLoadingMessage()}`;
    feed.insertBefore(loadingIndicator, feed.firstChild);
    
    try {
    const newCards = [];
    
    // Charger le pool si nécessaire
    if (state.textPool.length < 5) {
        await fillPool();
    }
    
    // ⚡ OPTIMISATION: Collecter les items à charger et les traiter en parallèle
    const itemsToLoad = [];
    let attempts = 0;
    
    while (itemsToLoad.length < 3 && attempts < 10) {
        attempts++;
        if (state.textPool.length === 0) break;
        
        const item = state.textPool.shift();
        const itemKey = (item.source ? (item.source + ':') : '') + item.title;
        if (state.shownPages.has(itemKey)) continue;
        
        state.shownPages.add(itemKey);
        
        // Si c'est un item pré-chargé, créer la carte directement
        if (item.isPreloaded && item.text) {
            const sourceInfo = {
               lang: item.lang,
               url: item.url || 'https://poetrydb.org',
               name: item.source === 'archive' ? 'Archive.org' : (item.source === 'gutenberg' ? 'Gutenberg' : 'PoetryDB')
            };
            const cardEl = createCardElement({
                title: item.title,
                text: item.text,
                author: item.author,
                source: item.source,
                url: item.url
            }, item.title, sourceInfo);
            if (cardEl) newCards.push(cardEl);
        } else {
            // Ajouter à la liste pour chargement parallèle
            itemsToLoad.push(item);
        }
    }
    
    // ⚡ Charger les textes Wikisource EN PARALLÈLE
    if (itemsToLoad.length > 0) {
        const results = await Promise.all(itemsToLoad.map(async (item) => {
            const ws = item.wikisource || getCurrentWikisource();
            const result = await fetchText(item.title, 0, ws);
            return { item, result, ws };
        }));
        
        for (const { item, result, ws } of results) {
            if (result?.text?.length > 150) {
                const cardEl = createCardElement(result, item.title, ws);
                if (cardEl) newCards.push(cardEl);
            }
        }
    }
    
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
    
    // hideNewTextsBanner(); // Removed
    } finally {
        loadingTop = false;
        // Nettoyer les cartes en bas (on charge en haut, donc les vieilles sont en bas)
        cleanupOldCards(false);

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

function setMainLoadingMessage(message) {
    const el = document.querySelector('#loading span');
    if (el) el.textContent = message;
}

// Exposer pour sources.js (mise à jour dynamique pendant fillPool)
window.setMainLoadingMessage = setMainLoadingMessage;

function getContextualLoadingMessage() {
    // Si l'utilisateur force une source unique "API" (pas Wikisource),
    // on évite d'afficher des messages de recherche Wikisource (ex: "Roman").
    const activeSources = Array.isArray(state.activeSourceFilter) ? state.activeSourceFilter : [];
    if (activeSources.length === 1) {
        const s = activeSources[0];
        if (s === 'gutenberg') return 'Chargement Gutenberg...';
        if (s === 'poetrydb') return 'Chargement PoetryDB...';
        if (s === 'archive') return 'Chargement Archive.org...';
    }

    const activeKeywords = window.getActiveFilterKeywords ? window.getActiveFilterKeywords() : [];
    const hasFilters = Array.isArray(activeKeywords) && activeKeywords.length > 0;

    // Priorité: contexte verrouillé (recherche libre / exploreAuthor)
    const term = state.activeSearchTerm || state.lastSearchTerm;

    if (hasFilters) {
        // Avec filtres: TOUJOURS en mode recherche (jamais "Chargement..." random)
        const driftTerm = term || activeKeywords[Math.floor(Math.random() * activeKeywords.length)];
        return typeof t === 'function' ? t('searching').replace('{term}', driftTerm) : `Searching "${driftTerm}"...`;
    }

    if (term) {
        return typeof t === 'function' ? t('searching').replace('{term}', term) : `Searching "${term}"...`;
    }

    return typeof t === 'function' ? t('loading') : 'Loading...';
}

async function loadMore() {
    if (state.loading) return;
    state.loading = true;
    setMainLoadingMessage(getContextualLoadingMessage());
    document.getElementById('loading').style.display = 'block';

    try {
    let loaded = 0, attempts = 0;
    while (loaded < 3 && attempts < 15) {
        attempts++;
        const isExploringCategory = currentCategoryPath.length > 0;
        if (state.textPool.length < 5 && !isExploringCategory) {
            await fillPool();
        }
        if (state.textPool.length === 0) break;
        
        const item = state.textPool.shift();
        const itemKey = (item.source ? (item.source + ':') : '') + item.title;
        if (state.shownPages.has(itemKey)) continue;
        
        // Si c'est un item pré-chargé, on l'affiche directement
        if (item.isPreloaded && item.text) {
            state.shownPages.add(itemKey);
            const sourceInfo = {
                lang: item.lang,
                url: item.url || (item.source === 'archive' ? 'https://archive.org' : (item.source === 'gutenberg' ? 'https://www.gutenberg.org' : 'https://poetrydb.org')),
                name: item.source === 'archive' ? 'Archive.org' : (item.source === 'gutenberg' ? 'Gutenberg' : 'PoetryDB')
            };
            renderCard({
                title: item.title,
                text: item.text,
                author: item.author,
                source: item.source
            }, item.title, sourceInfo);
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
        // Nettoyer les cartes en haut (on scroll vers le bas, donc les vieilles sont en haut)
        cleanupOldCards(true);
        
        // Préchargement en arrière-plan si le pool est bas
        if (state.textPool.length < 8 && !state.prefetching) {
            state.prefetching = true;
            fillPool().finally(() => { state.prefetching = false; });
        }
    }
}

// Nettoyer les cartes anciennes pour éviter l'accumulation en mémoire
const MAX_CARDS = 50;
function cleanupOldCards(fromTop = false) {
    const feed = document.getElementById('feed');
    if (!feed) return;
    const cards = feed.querySelectorAll('.card');
    if (cards.length > MAX_CARDS) {
        const toRemove = cards.length - MAX_CARDS;
        if (fromTop) {
            // Supprimer les cartes en haut (quand on scroll vers le bas)
            for (let i = 0; i < toRemove; i++) {
                cards[i].remove();
            }
        } else {
            // Supprimer les cartes en bas (quand on charge en haut)
            for (let i = cards.length - 1; i >= cards.length - toRemove; i--) {
                cards[i].remove();
            }
        }
    }
}

// Crée un élément de carte sans l'ajouter au DOM (pour insertion flexible)
function createCardElement(result, origTitle, wikisource = getCurrentWikisource(), allowInvalidTitle = false) {
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
    
    if (!allowInvalidTitle && !isValidTitle(title)) return null;
    
    const text = result.text;
    const lang = wikisource?.lang || 'fr';
    const author = detectAuthor(title, text, result.author);
    const tag = detectTag(title, text);
    // Priorité à l'URL fournie dans le résultat (ex: Archive.org), sinon construction Wikisource
    const url = result.url || `${wikisource?.url || 'https://fr.wikisource.org'}/wiki/${encodeURIComponent(origTitle)}`;
    const safeUrl = (url || '').replace(/'/g, "\\'");
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
    
    const keywords = extractKeywords(text, title, author, tag, result.categories || []);
    const keywordsHtml = keywords.map(kw => 
        `<span class="keyword-tag" onclick="exploreKeyword('${escapeAttr(kw)}')" title="${escapeAttr(t('tooltip_explore'))} #${escapeAttr(kw)}">${esc(kw)}</span>`
    ).join('');
    
    const card = document.createElement('div');
    card.className = 'card';
    card.id = cardId;
    const translatedTag = typeof translateTag === 'function' ? translateTag(tag) : tag;
    card.innerHTML = `
        <div class="card-head" onclick="showRelatedAuthors('${cardId}')" style="cursor:pointer;" title="${t('tooltip_discover_authors')}">
            <div>
                <div class="author">${esc(author)} ${langBadge} <span class="explore-hint">🕸️</span></div>
                <div class="work">${esc(displayTitle)} <a href="${url}" target="_blank" class="source-link" onclick="event.stopPropagation()" title="${t('tooltip_read_wikisource')}">🔗</a></div>
            </div>
            <span class="tag ${tag}" onclick="event.stopPropagation(); applyTagFilter('${tag}')" title="${t('tooltip_filter_tag')}">${translatedTag}</span>
        </div>
        <div class="card-body" ondblclick="doubleTapLike('${cardId}', event)">
            <span class="like-heart-overlay" id="heart-${cardId}">♥</span>
            <div class="text-teaser">${esc(teaser)}</div>
            <div class="text-full" id="full-${cardId}"></div>
            ${remaining ? `<button class="btn-suite" onclick="showMore('${cardId}')" id="suite-${cardId}">${t('read_more')}<span class="arrow">→</span></button>` : ''}
        </div>
        <div class="related-authors" id="related-${cardId}" style="display:none;"></div>
        <div class="card-foot">
            <div class="card-keywords">${keywordsHtml}</div>
            <div class="actions">
                <button class="btn btn-like" onclick="toggleLike('${cardId}',this)" title="${t('tooltip_like')}">
                    <span class="like-icon">♥</span>
                    <span class="like-count is-zero clickable" id="likeCount-${cardId}" data-card-id="${cardId}" onclick="event.stopPropagation(); showCardLikers('${cardId}')">0</span>
                </button>
                <button class="btn btn-share" onclick="shareCardExtrait('${cardId}')" title="${t('tooltip_share')}"><span class="share-icon">⤴</span> <span class="share-count is-zero" id="shareCount-${cardId}" onclick="event.stopPropagation(); event.preventDefault(); showCardSharers('${cardId}')">0</span></button>
                <button class="btn btn-comment" onclick="openCardComments('${cardId}')" title="${t('tooltip_comment')}">
                    💬 <span id="commentCount-${cardId}" class="comment-count is-zero">0</span>
                </button>
                <button class="btn btn-collection card-btn-collection" onclick="openCollectionPickerFromCard('${cardId}')" title="${t('tooltip_add_collection')}">▦ <span class="collections-count is-zero" id="collectionsCount-${cardId}" onclick="event.stopPropagation(); event.preventDefault(); showCardCollections('${cardId}')">0</span></button>
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

    // Ajouter le bouton partager le lien (à droite, icône type share iOS)
    const actionsDiv = card.querySelector('.actions');
    if (actionsDiv) {
        const shareLinkBtn = document.createElement('button');
        shareLinkBtn.className = 'btn btn-share-external';
        shareLinkBtn.title = typeof t === 'function' ? t('share_link') : 'Partager le lien';
        shareLinkBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>';
        shareLinkBtn.style.marginLeft = 'auto';
        shareLinkBtn.onclick = () => shareCardLink(cardId);
        actionsDiv.appendChild(shareLinkBtn);
    }

    // Tracker ce texte comme lu
    state.readCount++;
    const teaserWords = teaser.split(/\s+/).filter(w => w.length > 0).length;
    recordReading(teaserWords);
    startReadingTimer();
    updateStats();
    saveState();
    
    // Charger le nombre de commentaires existants de façon asynchrone
    loadCardCommentCount(cardId, title, author, url);
    loadCardLikeCount(cardId, url);
    
    return card;
}

async function loadCardCommentCount(cardId, title, author, url) {
    if (!supabaseClient) return;
    
    try {
        const card = document.getElementById(cardId);
        const extraitId = await resolveExtraitIdForCard(card, false);

        if (!extraitId) return;

        const { count, error: countError } = await supabaseClient
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('extrait_id', extraitId);

        if (countError) {
            console.log(`Erreur comptage commentaires pour "${title}":`, countError);
            return;
        }

        // Stocker l'ID pour usage ultérieur
        if (card) {
            card.dataset.extraitId = extraitId;
            if (typeof syncCardCommentCountId === 'function') {
                syncCardCommentCountId(card, extraitId);
                if (typeof syncCardLikeCountId === 'function') {
                    syncCardLikeCountId(card, extraitId);
                }
            } else {
                const countEl = document.getElementById(`commentCount-${cardId}`);
                if (countEl) {
                    countEl.dataset.extraitId = extraitId;
                    countEl.id = `commentCount-${extraitId}`;
                }
            }
        }

        // Mettre à jour le compteur
        updateCardCommentCount(cardId, count || 0);
    } catch (err) {
        console.log('Impossible de charger le nombre de commentaires:', err);
    }
}

function updateCardCommentCount(cardId, count) {
    let countEl = document.getElementById(`commentCount-${cardId}`);
    if (!countEl) {
        const card = document.getElementById(cardId);
        const extraitId = card?.dataset?.extraitId;
        if (extraitId) {
            countEl = document.getElementById(`commentCount-${extraitId}`) || card.querySelector(`[data-extrait-id="${extraitId}"]`);
        }
    }
    if (!countEl) return;
    
    countEl.textContent = count;
    countEl.classList.toggle('is-zero', count === 0);
}

function syncCardLikeCountId(card, extraitId) {
    if (!card || !extraitId) return;
    const cardId = card.id;
    const countEl = document.getElementById(`likeCount-${cardId}`);
    if (countEl) {
        countEl.dataset.extraitId = extraitId;
        countEl.id = `likeCount-${extraitId}`;
    }
}

function syncCardShareCountId(card, extraitId) {
    if (!card || !extraitId) return;
    const cardId = card.id;
    const countEl = document.getElementById(`shareCount-${cardId}`);
    if (countEl) {
        countEl.dataset.extraitId = extraitId;
        countEl.id = `shareCount-${extraitId}`;
    }
}

function syncCardCollectionsCountId(card, extraitId) {
    if (!card || !extraitId) return;
    const cardId = card.id;
    const countEl = document.getElementById(`collectionsCount-${cardId}`);
    if (countEl) {
        countEl.dataset.extraitId = extraitId;
        countEl.id = `collectionsCount-${extraitId}`;
    }
}

async function resolveExtraitIdForCard(card, createIfMissing = false) {
    if (!card || !supabaseClient) return null;
    if (card.dataset.extraitId) return card.dataset.extraitId;

    if (typeof resolveExtraitForCard === 'function') {
        try {
            const resolved = await resolveExtraitForCard(card, createIfMissing);
            if (resolved) {
                card.dataset.extraitId = resolved;
                syncCardLikeCountId(card, resolved);
                syncCardShareCountId(card, resolved);
                syncCardCollectionsCountId(card, resolved);
                return resolved;
            }
        } catch (err) {
            console.warn('resolveExtraitForCard indisponible:', err);
        }
    }

    const title = card.dataset.title || 'Sans titre';
    const author = card.dataset.author || 'Inconnu';
    const sourceUrl = card.dataset.url || '';
    const text = card.dataset.text || '';
    const lang = card.dataset.lang || 'fr';
    const textToStore = text.substring(0, 10000);
    const { textHash, textLength } = buildExtraitKey(textToStore, title, author, sourceUrl);

    let query = supabaseClient
        .from('extraits')
        .select('id')
        .eq('source_title', title)
        .eq('source_author', author);
    if (sourceUrl) query = query.eq('source_url', sourceUrl);
    if (textHash) query = query.eq('text_hash', textHash);

    const { data: byKey } = await query.order('created_at', { ascending: false }).limit(1);
    let extraitId = byKey?.[0]?.id || null;

    if (!extraitId && createIfMissing && currentUser) {
        const { data: newExtrait, error } = await supabaseClient
            .from('extraits')
            .insert({
                user_id: currentUser.id,
                texte: textToStore,
                source_title: title,
                source_author: author,
                source_url: sourceUrl || `https://${lang}.wikisource.org/wiki/${encodeURIComponent(title)}`,
                text_hash: textHash || null,
                text_length: textLength || null,
                likes_count: 0,
                is_silent: true  // Marqueur : extrait créé pour like/collection, pas un partage public
            })
            .select()
            .single();
        if (!error) extraitId = newExtrait?.id || null;
    }

    if (extraitId) {
        card.dataset.extraitId = extraitId;
        syncCardLikeCountId(card, extraitId);
        syncCardShareCountId(card, extraitId);
        syncCardCollectionsCountId(card, extraitId);
    }

    return extraitId;
}

function updateCardLikeCount(cardId, count) {
    let countEl = document.getElementById(`likeCount-${cardId}`);
    if (!countEl) {
        const card = document.getElementById(cardId);
        const extraitId = card?.dataset?.extraitId;
        if (extraitId) {
            countEl = document.getElementById(`likeCount-${extraitId}`) || card.querySelector(`[data-extrait-id="${extraitId}"]`);
        }
    }
    if (!countEl) return;
    countEl.textContent = count || 0;
    countEl.classList.toggle('is-zero', !count);
}

async function loadCardLikeCount(cardId, url) {
    if (!supabaseClient) return;
    const card = document.getElementById(cardId);
    if (!card) return;

    try {
        const extraitId = await resolveExtraitIdForCard(card, false);
        if (!extraitId) {
            updateCardLikeCount(cardId, 0);
            return;
        }

        if (currentUser && typeof loadUserLikesCache === 'function' && typeof likesLoaded !== 'undefined' && !likesLoaded) {
            await loadUserLikesCache();
        }

        const { count, error } = await supabaseClient
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('extrait_id', extraitId);
        if (error) return;

        if (typeof likesCountCache !== 'undefined') {
            likesCountCache[extraitId] = count || 0;
        }
        updateCardLikeCount(cardId, count || 0);

        const btn = card.querySelector('.btn-like');
        if (btn && typeof isExtraitLiked === 'function') {
            btn.classList.toggle('active', isExtraitLiked(extraitId));
        }

        if (typeof loadExtraitShareInfoBatch === 'function') {
            loadExtraitShareInfoBatch([extraitId]);
        }
        if (typeof loadExtraitCollectionsInfoBatch === 'function') {
            loadExtraitCollectionsInfoBatch([extraitId]);
        }
    } catch (e) {
        // ignore
    }
}

function renderCard(result, origTitle, wikisource = getCurrentWikisource(), allowInvalidTitle = false) {
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
    if (!allowInvalidTitle && !isValidTitle(title)) return;
    
    const text = result.text;
    const lang = wikisource?.lang || 'fr';
    // Utiliser l'auteur des métadonnées en priorité
    const author = detectAuthor(title, text, result.author);
    const tag = detectTag(title, text);
    const url = `${wikisource?.url || 'https://fr.wikisource.org'}/wiki/${encodeURIComponent(origTitle)}`;
    const safeUrl = (url || '').replace(/'/g, "\\'");
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
    const keywords = extractKeywords(text, title, author, tag, result.categories || []);
    const keywordsHtml = keywords.map(kw => 
        `<span class="keyword-tag" onclick="exploreKeyword('${escapeAttr(kw)}')" title="${escapeAttr(t('tooltip_explore'))} #${escapeAttr(kw)}">${esc(kw)}</span>`
    ).join('');
    
    const card = document.createElement('div');
    card.className = 'card';
    card.id = cardId;
    const translatedTag2 = typeof translateTag === 'function' ? translateTag(tag) : tag;
    card.innerHTML = `
        <div class="card-head" onclick="showRelatedAuthors('${cardId}')" style="cursor:pointer;" title="${t('tooltip_discover_authors')}">
            <div>
                <div class="author">${esc(author)} ${langBadge} <span class="explore-hint">🕸️</span></div>
                <div class="work">${esc(displayTitle)} <a href="${url}" target="_blank" class="source-link" onclick="event.stopPropagation()" title="${t('tooltip_read_wikisource')}">🔗</a></div>
            </div>
            <span class="tag ${tag}" onclick="event.stopPropagation(); applyTagFilter('${tag}')" title="${t('tooltip_filter_tag')}">${translatedTag2}</span>
        </div>
        <div class="card-body" ondblclick="doubleTapLike('${cardId}', event)">
            <span class="like-heart-overlay" id="heart-${cardId}">♥</span>
            <div class="text-teaser">${esc(teaser)}</div>
            <div class="text-full" id="full-${cardId}"></div>
            ${remaining ? `<button class="btn-suite" onclick="showMore('${cardId}')" id="suite-${cardId}">${t('read_more')}<span class="arrow">→</span></button>` : ''}
        </div>
        <div class="related-authors" id="related-${cardId}" style="display:none;"></div>
        <div class="card-foot">
            <div class="card-keywords">${keywordsHtml}</div>
            <div class="actions">
                <button class="btn btn-like" onclick="toggleLike('${cardId}',this)" title="${t('tooltip_like')}">
                    <span class="like-icon">♥</span>
                    <span class="like-count is-zero clickable" id="likeCount-${cardId}" data-card-id="${cardId}" onclick="event.stopPropagation(); showCardLikers('${cardId}')">0</span>
                </button>
                <button class="btn btn-share" onclick="shareCardExtrait('${cardId}')" title="${t('tooltip_share')}"><span class="share-icon">⤴</span> <span class="share-count is-zero" id="shareCount-${cardId}" onclick="event.stopPropagation(); event.preventDefault(); showCardSharers('${cardId}')">0</span></button>
                <button class="btn btn-comment" onclick="openCardComments('${cardId}')" title="${t('tooltip_comment')}">
                    💬 <span id="commentCount-${cardId}" class="comment-count is-zero">0</span>
                </button>
                <button class="btn btn-collection card-btn-collection" onclick="openCollectionPickerFromCard('${cardId}')" title="${t('tooltip_add_collection')}">▦ <span class="collections-count is-zero" id="collectionsCount-${cardId}" onclick="event.stopPropagation(); event.preventDefault(); showCardCollections('${cardId}')">0</span></button>
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

    // Ajouter le bouton partager le lien (à droite, icône type share iOS)
    const actionsDiv2 = card.querySelector('.actions');
    if (actionsDiv2) {
        const shareLinkBtn2 = document.createElement('button');
        shareLinkBtn2.className = 'btn btn-share-external';
        shareLinkBtn2.title = typeof t === 'function' ? t('share_link') : 'Partager le lien';
        shareLinkBtn2.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>';
        shareLinkBtn2.style.marginLeft = 'auto';
        shareLinkBtn2.onclick = () => shareCardLink(cardId);
        actionsDiv2.appendChild(shareLinkBtn2);
    }

    document.getElementById('feed').appendChild(card);
    setTimeout(() => card.classList.add('show'), 50);
    
    // Charger le nombre de commentaires existants de façon asynchrone
    loadCardCommentCount(cardId, title, author, url);
    loadCardLikeCount(cardId, url);
    
    // Tracker ce texte comme lu
    state.readCount++;
    const teaserWords = teaser.split(/\s+/).filter(w => w.length > 0).length;
    recordReading(teaserWords);
    startReadingTimer();
    
    // Mettre à jour l'affichage
    updateStats();
    saveState();
}

function esc(s) { return escapeHtml(s || '').replace(/\n/g,'<br>'); }

// Afficher la suite du texte - tout d'un coup au premier clic
function showMore(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const fullEl = document.getElementById('full-' + cardId);
    const btnEl = document.getElementById('suite-' + cardId);
    if (!fullEl || !btnEl) return;
    
    let remaining = card.dataset.remaining || '';
    const sourceUrl = card.dataset.url || '';
    
    // Fonction pour remplacer le bouton par un lien vers la source
    const replaceWithSourceLink = () => {
        if (sourceUrl) {
            btnEl.outerHTML = `<a href="${escapeHtml(sourceUrl)}" target="_blank" class="btn-source-link">${t('view_source')}</a>`;
        } else {
            btnEl.style.display = 'none';
        }
    };
    
    if (!remaining) {
        replaceWithSourceLink();
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
    
    // Remplacer le bouton par un lien vers la source
    replaceWithSourceLink();
    
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
let sourceLikesSynced = false;
async function syncLikesFromSupabase() {
    if (!supabaseClient || !currentUser) return;
    if (sourceLikesSynced) return; // Éviter les syncs redondants
    
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
            sourceLikesSynced = true;
            // Likes synchronisés depuis Supabase
        } else {
            sourceLikesSynced = true; // Pas de données mais sync faite
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

// Toggle like sur une carte (global, basé sur extraits)
async function toggleLike(cardId, btn, forceLike = false) {
    if (!currentUser) {
        if (typeof openAuthModal === 'function') openAuthModal('login');
        toast('📝 Connectez-vous pour liker');
        return;
    }
    if (!supabaseClient) return;

    const card = document.getElementById(cardId);
    if (!card) return;

    const pending = (typeof pendingLikeOperations !== 'undefined') ? pendingLikeOperations : (window.pendingCardLikeOperations || (window.pendingCardLikeOperations = {}));
    const pendingKey = card.dataset.extraitId || cardId;
    if (pending[pendingKey]) return;
    pending[pendingKey] = true;

    const likeBtn = btn || card.querySelector('.btn-like');

    try {
        const extraitId = await resolveExtraitIdForCard(card, true);
        if (!extraitId) {
            toast('Impossible de liker cet extrait');
            return;
        }

        const likeCountEl = document.getElementById(`likeCount-${extraitId}`) || document.getElementById(`likeCount-${cardId}`);
        const currentCount = parseInt(likeCountEl?.textContent) || 0;

        if (typeof loadUserLikesCache === 'function' && typeof likesLoaded !== 'undefined' && !likesLoaded) {
            await loadUserLikesCache();
        }

        let wasLiked = false;
        if (typeof isExtraitLiked === 'function') {
            wasLiked = isExtraitLiked(extraitId);
        } else {
            const { data: existingLike } = await supabaseClient
                .from('likes')
                .select('id')
                .eq('user_id', currentUser.id)
                .eq('extrait_id', extraitId)
                .maybeSingle();
            wasLiked = !!existingLike;
        }

        if (forceLike && wasLiked) return;

        const newCount = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;

        if (typeof userLikesCache !== 'undefined') {
            if (wasLiked) userLikesCache.delete(extraitId);
            else userLikesCache.add(extraitId);
        }
        if (typeof likesCountCache !== 'undefined') {
            likesCountCache[extraitId] = newCount;
        }

        if (likeBtn) {
            likeBtn.classList.toggle('active', !wasLiked);
            likeBtn.classList.add('like-animating');
            setTimeout(() => likeBtn.classList.remove('like-animating'), 300);
        }
        if (likeCountEl) {
            likeCountEl.textContent = newCount;
            likeCountEl.classList.toggle('is-zero', newCount === 0);
        }

        if (wasLiked) {
            // Supprimer le like (le trigger met à jour likes_count)
            const { error } = await supabaseClient
                .from('likes')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('extrait_id', extraitId);
            if (error) throw error;
        } else {
            // Ajouter le like (le trigger met à jour likes_count)
            const { error } = await supabaseClient
                .from('likes')
                .insert({ user_id: currentUser.id, extrait_id: extraitId });
            if (error) throw error;

            const extrait = socialExtraits?.find?.(e => e.id === extraitId);
            if (extrait && extrait.user_id !== currentUser.id && typeof createNotification === 'function') {
                await createNotification(extrait.user_id, 'like', extraitId);
            }
        }

        if (typeof loadUserStats === 'function') loadUserStats();
    } catch (err) {
        console.error('Erreur like:', err);

        if (typeof loadUserLikesCache === 'function') await loadUserLikesCache();
        if (typeof loadLikesCountForExtraits === 'function') {
            const extraitId = card.dataset.extraitId;
            if (extraitId) await loadLikesCountForExtraits([extraitId]);
        }

        const extraitId = card.dataset.extraitId;
        const isNowLiked = extraitId && typeof isExtraitLiked === 'function' ? isExtraitLiked(extraitId) : false;
        const countEl = extraitId ? document.getElementById(`likeCount-${extraitId}`) : document.getElementById(`likeCount-${cardId}`);
        const realCount = extraitId && typeof getLikeCount === 'function' ? getLikeCount(extraitId) : (parseInt(countEl?.textContent) || 0);

        if (likeBtn) likeBtn.classList.toggle('active', isNowLiked);
        if (countEl) {
            countEl.textContent = realCount || 0;
            countEl.classList.toggle('is-zero', !realCount);
        }
        toast('Erreur de synchronisation');
    } finally {
        delete pending[pendingKey];
    }
}

// Mettre à jour le compteur de likes
function updateLikeCount() {
    const count = (currentUser && typeof userLikesCache !== 'undefined') ? userLikesCache.size : 0;
    
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

function isCardLiked(card) {
    const extraitId = card?.dataset?.extraitId;
    if (!extraitId || typeof isExtraitLiked !== 'function') return false;
    return isExtraitLiked(extraitId);
}

// Initialiser les likes au chargement
document.addEventListener('DOMContentLoaded', async () => {
    if (currentUser && typeof loadUserLikesCache === 'function') {
        await loadUserLikesCache();
    }
    updateLikeCount();

    // Fermer les overlays en tapant en dehors du contenu
    document.querySelectorAll('.favorites-overlay').forEach(function(overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target !== overlay) return;
            if (overlay.id === 'socialOverlay' && typeof closeSocialFeed === 'function') {
                closeSocialFeed();
            } else {
                overlay.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
    });
});

// Double-tap pour liker (style Instagram)
async function doubleTapLike(id, event) {
    event.preventDefault();
    const card = document.getElementById(id);
    const heart = document.getElementById('heart-' + id);
    const likeBtn = card?.querySelector('.card-foot .btn-like');
    
    // Afficher l'animation du coeur
    if (heart) {
        heart.classList.remove('animate');
        void heart.offsetWidth; // Force reflow
        heart.classList.add('animate');
    }
    
    // Si pas encore liké, liker. Sinon juste l'animation
    if (!isCardLiked(card)) {
        await toggleLike(id, likeBtn, true);
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

// === VUE FAVORIS/LIKES - Redirige vers le profil ===
async function openFavoritesView() {
    if (!currentUser) {
        toast('📝 Connectez-vous d\'abord');
        return;
    }
    // Ouvrir mon profil sur l'onglet likes
    openUserProfile(currentUser.id, currentUser.user_metadata?.username || 'Moi', 'likes');
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
    
    toast(typeof t === 'function' ? t('loading') : 'Loading...');
    
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
            <div class="connection-item" onclick="exploreAuthor('${escapeJsString(author)}')">
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
        <span class="reco-author" onclick="exploreAuthor('${escapeJsString(author)}')">${escapeHtml(author)}</span>
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
                    <button class="related-btn" onclick="exploreAuthor('${escapeJsString(a)}')">
                        ${escapeHtml(a.split(' ').pop())}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    container.style.display = 'block';
    toast(`${allRelated.length} auteur(s) à explorer`);
}

// Trouver des auteurs du même genre (basé sur le tag)
function getAuthorsForGenre(genre, excludeAuthor) {
    // Priorité 1 : auteurs du même genre (tag)
    const sameGenreAuthors = Object.keys(authorTagMapping).filter(a => {
        return a !== excludeAuthor && 
               a !== 'Anonyme' && 
               authorTagMapping[a] === genre;
    });
    
    if (sameGenreAuthors.length > 0) {
        // Retourner une sélection aléatoire des auteurs du même genre
        return sameGenreAuthors.sort(() => Math.random() - 0.5).slice(0, 4);
    }
    
    // Priorité 2 : si pas d'auteurs du même genre, chercher dans les connexions existantes
    const connected = authorConnections[excludeAuthor] || [];
    if (connected.length > 0) {
        return connected.sort(() => Math.random() - 0.5).slice(0, 4);
    }
    
    // Priorité 3 : derniers auteurs découverts (tous genres confondus)
    const discovered = Object.keys(state.authorStats).filter(a => 
        a !== excludeAuthor && a !== 'Anonyme'
    );
    
    if (discovered.length > 0) {
        return discovered.slice(-6).sort(() => Math.random() - 0.5).slice(0, 4);
    }
    
    // Sinon, aucune suggestion (l'UI affichera le bouton "Hasard")
    return [];
}

// Explorer un auteur spécifique (recherche ciblée) - charge les textes EN HAUT
async function exploreAuthor(author, setContext = true, contextType = 'author') {
    if (state.loading) return;
    state.loading = true;
    
    // Définir le contexte pour la navigation future (infinite scroll pertinent)
    if (setContext) {
        state.activeSearchTerm = author;
        state.activeSearchContextType = contextType || 'author';
        state.searchOffset = 0;
        if (Array.isArray(state.textPool)) state.textPool = [];
        state.loadingMessage = typeof t === 'function' ? t('searching').replace('{term}', author) : `Searching "${author}"...`;
        if (window.setMainLoadingMessage) window.setMainLoadingMessage(state.loadingMessage);
        if (window.updateFilterSummary) window.updateFilterSummary();
    }
    
    toast(typeof t === 'function' ? t('searching').replace('{term}', author) : `Searching "${author}"...`);
    state.discoveredConnections.add(author);
    saveState();

    const feed = document.getElementById('feed');
    
    // Recherches spécifiques pour cet auteur
    const searches = [`${author} poem`, `${author} text`, `${author} sonnet`, author];
    const newCards = [];
    
    // FILTRES DE SOURCES
    const isArchiveAllowed = !state.activeSourceFilter || state.activeSourceFilter.includes('archive') || state.activeSourceFilter.includes('all');
    const isWikiAllowed = !state.activeSourceFilter || state.activeSourceFilter.includes('wikisource') || state.activeSourceFilter.includes('all');

    // 1. RECHERCHE ARCHIVE.ORG (si active)
    if (isArchiveAllowed && (!isWikiAllowed || Math.random() > 0.5)) {
        if (typeof searchArchiveOrg === 'function') {
            const archiveResults = await searchArchiveOrg(author);
            for (const item of archiveResults) {
                if (newCards.length >= 3) break;
                // Clé unique pour éviter doublons (on préfixe pour différencier)
                const itemKey = 'archive:' + item.title; 
                
                // Vérifier grossièrement si on a pas déjà ce titre (même sans préfixe)
                let alreadyShown = false;
                state.shownPages.forEach(k => { if (k.includes(item.title)) alreadyShown = true; });

                if (!state.shownPages.has(itemKey) && !alreadyShown) {
                    state.shownPages.add(itemKey);
                    // createCardElement utilise result.url (passé dans item)
                    const cardEl = createCardElement(item, item.title, { lang: item.lang || 'en', name: 'Archive.org', url: 'https://archive.org' });
                    if (cardEl) newCards.push(cardEl);
                }
            }
        }
    }

    // 2. RECHERCHE WIKISOURCE (si active et qu'on a encore de la place)
    if (isWikiAllowed && newCards.length < 3) {
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
    }
    
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
const GENERIC_WORDS = new Set([
    'temps', 'homme', 'femme', 'monde', 'jour', 'nuit', 'ciel', 'terre', 'main', 'coeur', 'regard',
    'vie', 'mort', 'amour', 'haine', 'joie', 'tristesse', 'bonheur', 'douleur', 'peur', 'esprit',
    'coeur', 'âme', 'ame', 'être', 'etre', 'peuple', 'roi', 'reine', 'dieu', 'diable', 'ange',
    'chose', 'rien', 'tout', 'journee', 'journée', 'nuitée', 'nuit', 'saison', 'histoire', 'roman'
]);

function extractKeywords(text, title, author, tag, categories = []) {
    const keywords = new Set();
    const fullText = (text + ' ' + title).toLowerCase();
    const titleText = (title || '').toLowerCase();
    const introText = (text || '').split('\n').slice(0, 6).join(' ').toLowerCase();

    const normalizeKey = (str) => String(str || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const tokenize = (str) => {
        const tokens = str.match(/[\p{L}\p{N}'’-]+/gu) || [];
        return tokens
            .map(t => t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase())
            .filter(Boolean);
    };

    const isStopOrGeneric = (w) => {
        const k = normalizeKey(w);
        return STOP_WORDS.has(k) || GENERIC_WORDS.has(k) || k.length < 4;
    };

    // 0) Catégories Wikisource (métadonnées réelles) -> tags prioritaires
    const normalizeCategoryName = (cat) => {
        if (!cat) return '';
        return String(cat)
            .replace(/^cat[ée]gorie\s*:\s*/i, '')
            .replace(/^category\s*:\s*/i, '')
            .replace(/_/g, ' ')
            .trim();
    };

    const isBadCategory = (name) => {
        if (!name) return true;
        const bad = [
            /wikisource/i,
            /pages? (with|containing)/i,
            /à (relire|corriger|vérifier)/i,
            /maintenance/i,
            /index/i,
            /portail/i,
            /aide/i,
            /transclusion/i,
            /licen[cs]e/i,
            /domaine public/i,
            /public domain/i,
            /commons/i
        ];
        return bad.some(r => r.test(name));
    };

    const informativeCategoryScore = (name) => {
        const n = name.toLowerCase();
        let score = 0;
        // Formes/genres
        if (/(sonnet|ode|élégie|elegie|ballade|hymne|poème|poeme|roman|nouvelle|conte|fable|légende|legende|mythe|tragédie|tragedie|comédie|comedie|drame|essai|discours|lettre|journal|mémoires|memoires)/i.test(name)) score += 4;
        // Époques / mouvements
        if (/(antiquit|moyen âge|renaissance|baroque|classicisme|lumières|romantisme|réalisme|realisme|naturalisme|symbolisme|surréalisme|surrealisme|existentialisme|absurde|nouveau roman)/i.test(name)) score += 3;
        if (/\b(xvi|xvii|xviii|xix|xx)[eᵉ]*\b/i.test(name)) score += 2;
        // Catégories “d’auteur” (souvent informatives mais moins précises sur le texte)
        if (/(textes|poèmes|œuvres|oeuvres)\s+(de|by|von|di)\s+/i.test(name)) score += 1;
        // Pénaliser les catégories trop longues
        if (name.length > 60) score -= 2;
        return score;
    };

    const cleanedCats = (categories || [])
        .map(normalizeCategoryName)
        .filter(name => name.length >= 3 && name.length <= 80)
        .filter(name => !isBadCategory(name));

    const topCats = cleanedCats
        .map(name => ({ name, score: informativeCategoryScore(name) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(x => x.name);

    for (const c of topCats) {
        keywords.add(c);
        if (keywords.size >= 3) break;
    }

    // 1) Indices structurels (prose/vers, théâtre)
    const lineBreaks = (text.match(/\n/g) || []).length;
    const shortLines = text.split('\n').filter(l => l.trim().length > 0 && l.trim().length <= 60).length;
    const verseLikely = lineBreaks > 10 && shortLines / Math.max(1, text.split('\n').filter(l => l.trim().length > 0).length) > 0.55;
    if (verseLikely) keywords.add('vers');
    if (/\b(acte|scène|scene|personnages)\b/i.test(text)) keywords.add('dialogue');

    // 2) Chercher les thèmes littéraires présents dans le texte
    const themeLimit = topCats.length > 0 ? 2 : 4;
    let themeCount = 0;
    for (const [, themes] of Object.entries(LITERARY_THEMES)) {
        for (const theme of themes) {
            if (fullText.includes(theme.toLowerCase()) && !isStopOrGeneric(theme)) {
                keywords.add(theme);
                themeCount++;
                if (themeCount >= themeLimit || keywords.size >= 8) break;
            }
        }
        if (themeCount >= themeLimit || keywords.size >= 8) break;
    }

    // 2. Extraire des mots-clés pondérés (titre + intro + texte)
    const weighted = new Map();
    const addWeighted = (w, score) => {
        const key = normalizeKey(w);
        if (!key || isStopOrGeneric(key)) return;
        weighted.set(key, (weighted.get(key) || 0) + score);
    };

    const titleTokens = tokenize(titleText);
    const introTokens = tokenize(introText);
    const bodyTokens = tokenize(fullText);

    titleTokens.forEach(w => addWeighted(w, 3));
    introTokens.forEach(w => addWeighted(w, 2));
    bodyTokens.forEach(w => addWeighted(w, 1));

    // 2b) Bigrams (paires de mots) pour qualifier mieux le texte
    const buildBigrams = (tokens) => {
        const bigrams = new Map();
        for (let i = 0; i < tokens.length - 1; i++) {
            const a = tokens[i];
            const b = tokens[i + 1];
            if (isStopOrGeneric(a) || isStopOrGeneric(b)) continue;
            const key = `${normalizeKey(a)} ${normalizeKey(b)}`.trim();
            if (key.length < 6) continue;
            bigrams.set(key, (bigrams.get(key) || 0) + 1);
        }
        return bigrams;
    };

    const bigrams = buildBigrams([...titleTokens, ...introTokens]);
    const topBigrams = [...bigrams.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([k]) => k);

    for (const bg of topBigrams) {
        if (keywords.size < 5 && !keywords.has(bg)) {
            keywords.add(bg);
        }
    }

    const sortedWeighted = [...weighted.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([k]) => k);

    for (const word of sortedWeighted) {
        if (keywords.size < 5 && !keywords.has(word)) {
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
    await exploreAuthor(keyword, true, 'keyword');
}


// ═══════════════════════════════════════════════════════════
// ⚙️ GESTION DES SOURCES (PARAMÈTRES)
// ═══════════════════════════════════════════════════════════

function openSourceSettingsModal() {
    
    const modal = document.getElementById('sourceSettingsModal');
    if (modal) {
        modal.classList.add('open');
        // Force display in case CSS fails
        modal.style.display = 'flex';
        updateSourceSettingsUI();
    } else {
        console.error('Modal sourceSettingsModal not found');
    }
}

function closeSourceSettingsModal() {
    const modal = document.getElementById('sourceSettingsModal');
    if (modal) {
        modal.classList.remove('open');
        modal.style.display = ''; // Revert to CSS/inline default
    }
    saveState();
    // Recharger le pool si changement drastique
    if (state.textPool.length < 5) fillPool();
}

function toggleSourceSetting(source) {
    if (!state.activeSourceFilter) state.activeSourceFilter = ['wikisource']; // Défaut strict
    
    // Logique checkboxes
    if (state.activeSourceFilter.includes(source)) {
        // Empêcher de tout désélectionner (garder au moins une source)
        if (state.activeSourceFilter.length > 1) {
            state.activeSourceFilter = state.activeSourceFilter.filter(s => s !== source);
        } else {
            toast('Il faut au moins une source active !');
            return;
        }
    } else {
        state.activeSourceFilter.push(source);
    }
    
    updateSourceSettingsUI();
    // Vider le pool pour purger les anciennes sources non désirées
    state.textPool = [];
    toast('Flux mis à jour. Rechargez pour voir les effets immédiats.');
}

function updateSourceSettingsUI() {
    ['wikisource', 'archive', 'gutenberg', 'poetrydb', 'sacredtexts', 'gallica', 'perseus'].forEach(s => {
        const check = document.getElementById(`check-${s}`);
        if (check) {
            const isActive = !state.activeSourceFilter || state.activeSourceFilter.includes(s) || state.activeSourceFilter.includes('all');
            check.classList.toggle('active', isActive);
            check.textContent = isActive ? '✓' : '';
        }
    });
}


document.onkeydown = e => { if (e.key === 'Escape') closeReader(); };

// 
// SHARED PREVIEW (route #/preview?t=...&a=...&s=...)
// 

function showSharedPreview(query) {
    const snippet = query?.t || '';
    const author = query?.a || 'Anonyme';
    const source = query?.s || '';

    if (!snippet) return;

    const mainContent = document.getElementById('feed') || document.getElementById('main-content') || document.querySelector('.content');
    if (!mainContent) return;

    const escapedText = snippet.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedAuthor = author.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedSource = source.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    mainContent.innerHTML = `
        <div class="shared-preview-overlay" style="display:flex;justify-content:center;align-items:center;min-height:60vh;padding:2rem;">
            <div class="shared-preview-card" style="
                max-width:600px;width:100%;
                background:var(--bg-card,#1e1e2e);
                border:1px solid var(--border,#333);
                border-radius:16px;
                padding:2.5rem;
                text-align:center;
                box-shadow:0 8px 32px rgba(0,0,0,0.3);
            ">
                <div style="font-size:2rem;margin-bottom:1rem;"></div>
                <blockquote style="
                    font-size:1.15rem;line-height:1.7;
                    font-style:italic;color:var(--text,#e0e0e0);
                    margin:0 0 1.5rem;
                    border-left:3px solid var(--accent,#d4a574);
                    padding-left:1rem;
                    text-align:left;
                ">&laquo; ${escapedText}&hellip; &raquo;</blockquote>
                <p style="font-weight:600;color:var(--accent,#d4a574);margin:0 0 0.5rem;">&mdash; ${escapedAuthor}</p>
                ${escapedSource ? `<p style="font-size:0.85rem;color:var(--text-muted,#888);margin:0 0 1.5rem;">${escapedSource}</p>` : ''}
                <a href="/" class="btn" style="
                    display:inline-block;padding:12px 28px;
                    background:var(--accent,#d4a574);color:#000;
                    border-radius:8px;text-decoration:none;font-weight:600;
                    margin-top:1rem;
                ">
                    ${typeof t === 'function' ? t('discover_palimpseste') : 'Découvrir Palimpseste'} →
                </a>
            </div>
        </div>
    `;
}

window.showSharedPreview = showSharedPreview;

// ═══════════════════════════════════════════════════════════
// � SHARE CARD LINK
// ═══════════════════════════════════════════════════════════

async function shareCardLink(cardIdOrEl) {
    let text = '', author = 'Anonyme', title = '', extraitId = '';

    // Si c'est un élément DOM (bouton cliqué), remonter au conteneur le plus proche
    const el = (typeof cardIdOrEl === 'string') ? document.getElementById(cardIdOrEl) : cardIdOrEl;
    if (!el) return;

    // Cas 1 : carte du feed principal (a data-text, data-author, data-title)
    const feedCard = (typeof cardIdOrEl === 'string') ? el : el.closest('.text-card, [data-text]');
    if (feedCard && feedCard.dataset.text) {
        text = feedCard.dataset.text;
        author = feedCard.dataset.author || 'Anonyme';
        title = feedCard.dataset.title || '';
        extraitId = feedCard.dataset.extraitId || '';
        // Résoudre l'ID si absent (créer en base si nécessaire)
        if (!extraitId && typeof resolveExtraitIdForCard === 'function') {
            extraitId = await resolveExtraitIdForCard(feedCard, true) || '';
        }
    } else {
        // Cas 2 : carte extrait (social, trending, profil, collections)
        const card = el.closest('.extrait-card, .trending-card, .collection-item-card');
        if (card) {
            // ID de l'extrait en base
            extraitId = card.dataset.id || card.dataset.extraitId || '';
            // Texte : data-full-text ou premier élément texte visible
            text = card.dataset.fullText
                || card.querySelector('.extrait-text, .trending-text, .collection-item-preview')?.textContent
                || '';
            // Auteur / titre depuis la source
            const sourceEl = card.querySelector('.extrait-source, .trending-source');
            if (sourceEl) {
                const strong = sourceEl.querySelector('strong');
                author = strong?.textContent || 'Anonyme';
                // Le titre est après le tiret
                const fullSource = sourceEl.textContent || '';
                const dashIdx = fullSource.indexOf('—');
                if (dashIdx > -1) title = fullSource.substring(dashIdx + 1).trim();
            }
            // Collections : data-author, data-title (encodés)
            if (card.dataset.author) author = decodeURIComponent(card.dataset.author);
            if (card.dataset.title) title = decodeURIComponent(card.dataset.title);
        }
    }

    // Extrait court (150 chars max) pour l'aperçu dans le texte de partage
    const snippet = text.replace(/\s+/g, ' ').trim().substring(0, 150);

    // Construire l'URL de partage avec l'ID de l'extrait
    // Utilise des query params (pas de hash) pour survivre au partage
    // via WhatsApp, Messenger, SMS etc. qui suppriment souvent le fragment #
    let shareUrl;
    if (extraitId) {
        shareUrl = `${window.location.origin}${window.location.pathname}?eid=${encodeURIComponent(extraitId)}`;
    } else {
        // Fallback si pas d'ID : utiliser le hash (fonctionne en navigation directe)
        const params = new URLSearchParams();
        params.set('t', snippet);
        params.set('a', author);
        if (title) params.set('s', title);
        shareUrl = `${window.location.origin}${window.location.pathname}#/preview?${params.toString()}`;
    }

    // Web Share API (mobile) ou copie dans le presse-papier (desktop)
    const shareData = {
        title: `${author} — Palimpseste`,
        text: `« ${snippet}… » — ${author}`,
        url: shareUrl
    };

    try {
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
        }
    } catch (e) {
        // Fallback to clipboard
    }

    // Copier dans le presse-papier
    try {
        await navigator.clipboard.writeText(shareUrl);
        if (typeof toast === 'function') toast(typeof t === 'function' ? t('link_copied') : '🔗 Lien copié !');
    } catch (e) {
        // Fallback : prompt
        prompt(typeof t === 'function' ? t('link_copied') : 'Copiez ce lien :', shareUrl);
    }
}

// ═══════════════════════════════════════════════════════════
// 📋 GENERATE EMBED CODE
// ═══════════════════════════════════════════════════════════

function generateEmbedCode(text, author, title) {
    const params = new URLSearchParams({
        text: (text || '').substring(0, 500),
        author: author || '',
        title: title || '',
        url: window.location.href
    });
    return `<iframe src="https://palimpseste.vercel.app/embed.html?${params}" width="100%" height="300" frameborder="0" style="border-radius:12px;max-width:500px;"></iframe>`;
}

window.shareCardLink = shareCardLink;
window.generateEmbedCode = generateEmbedCode;

// Exposer les fonctions et variables nécessaires pour les autres modules
window.state = state;
window.exploreAuthor = exploreAuthor;
window.syncLikesFromSupabase = syncLikesFromSupabase;
window.openSourceSettingsModal = openSourceSettingsModal;
window.closeSourceSettingsModal = closeSourceSettingsModal;
window.toggleSourceSetting = toggleSourceSetting;

init();

