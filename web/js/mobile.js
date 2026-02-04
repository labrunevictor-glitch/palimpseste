// ═══════════════════════════════════════════════════════════
// 📱 MOBILE - Drawer et Navigation (style Twitter)
// ═══════════════════════════════════════════════════════════

// === BOTTOM SHEET FILTRES ===
function initFilterDrawer() {
    if (window.innerWidth > 900) return;
    
    const drawer = document.getElementById('explorationContainer');
    const toggle = drawer?.querySelector('.exploration-toggle');
    const overlay = document.getElementById('filterDrawerOverlay');
    
    if (!drawer || !toggle) return;
    
    // Tap pour toggle
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleFilterDrawer();
    });
    
    // Fermer via overlay
    overlay?.addEventListener('click', closeFilterDrawer);
    
    // Démarrer fermé
    drawer.classList.add('collapsed');
    document.body.classList.add('filters-collapsed');
    
    console.log('📱 Filter drawer initialisé');
}

function openFilterDrawer() {
    const drawer = document.getElementById('explorationContainer');
    const overlay = document.getElementById('filterDrawerOverlay');
    
    if (drawer) {
        drawer.classList.remove('collapsed');
        document.body.classList.remove('filters-collapsed');
    }
    overlay?.classList.add('active');
}

function closeFilterDrawer() {
    const drawer = document.getElementById('explorationContainer');
    const overlay = document.getElementById('filterDrawerOverlay');
    
    if (drawer) {
        drawer.classList.add('collapsed');
        document.body.classList.add('filters-collapsed');
    }
    overlay?.classList.remove('active');
}

function toggleFilterDrawer() {
    const drawer = document.getElementById('explorationContainer');
    if (drawer?.classList.contains('collapsed')) {
        openFilterDrawer();
    } else {
        closeFilterDrawer();
    }
}

// === DRAWER MENU (Stats, badges, favoris) ===
function openMobileDrawer() {
    const drawer = document.querySelector('.stats-panel');
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (drawer) {
        drawer.classList.add('open');
        overlay?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeMobileDrawer() {
    const drawer = document.querySelector('.stats-panel');
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (drawer) {
        drawer.classList.remove('open');
        overlay?.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// === PANNEAU PROFIL (Connexion/Déconnexion) ===
function openProfilePanel() {
    const panel = document.getElementById('mobileProfilePanel');
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (panel) {
        panel.classList.add('open');
        overlay?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeProfilePanel() {
    const panel = document.getElementById('mobileProfilePanel');
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (panel) {
        panel.classList.remove('open');
        overlay?.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Fermer tous les drawers
function closeAllDrawers() {
    closeMobileDrawer();
    closeProfilePanel();
}

function openCollectionsFromProfile() {
    closeAllDrawers();
    if (typeof openCollectionsView === 'function') {
        setTimeout(() => openCollectionsView(true), 50);
    }
}

// Avatar = Ouvrir le profil complet si connecté, sinon panneau connexion
function handleAvatarClick() {
    // Cacher le header sur mobile
    if (window.innerWidth <= 900) hideHeader();
    
    if (typeof currentUser !== 'undefined' && currentUser) {
        // Utilisateur connecté → ouvrir la modal profil complète
        if (typeof openMyProfile === 'function') {
            openMyProfile();
        } else if (typeof openUserProfile === 'function') {
            const username = currentUser.user_metadata?.username || 'Moi';
            openUserProfile(currentUser.id, username, 'extraits');
        } else {
            openProfilePanel();
        }
    } else {
        // Non connecté → panneau de connexion
        openProfilePanel();
    }
}

// Navigation mobile
let lastFeedTap = 0;

// === HEADER AUTO-HIDE AU SCROLL ===
let mobileLastScrollY = 0;
let headerHidden = false;

function hideHeader() {
    const header = document.querySelector('header');
    if (header && !headerHidden) {
        header.classList.add('header-hidden');
        headerHidden = true;
    }
}

function showHeader() {
    const header = document.querySelector('header');
    if (header && headerHidden) {
        header.classList.remove('header-hidden');
        headerHidden = false;
    }
}

function initHeaderAutoHide() {
    if (window.innerWidth > 900) return;
    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
}

function handleHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    
    const currentY = window.scrollY;
    const delta = currentY - mobileLastScrollY;
    
    // Ignorer les petits mouvements
    if (Math.abs(delta) < 8) return;
    
    // Toujours montrer en haut de page
    if (currentY < 80) {
        header.classList.remove('header-hidden');
        headerHidden = false;
        mobileLastScrollY = currentY;
        return;
    }
    
    if (delta > 0 && !headerHidden) {
        // Scroll vers le bas → cacher
        header.classList.add('header-hidden');
        headerHidden = true;
    } else if (delta < 0 && headerHidden) {
        // Scroll vers le haut → montrer
        header.classList.remove('header-hidden');
        headerHidden = false;
    }
    
    mobileLastScrollY = currentY;
}

// === AUTO-HIDE HEADERS DES MODALES ===
let socialLastScrollY = 0;
let profileLastScrollY = 0;

function initModalHeaderAutoHide() {
    if (window.innerWidth > 900) return;
    
    // Feed communautaire - le scroll est sur l'overlay lui-même
    const socialOverlay = document.getElementById('socialOverlay');
    if (socialOverlay) {
        socialOverlay.addEventListener('scroll', function() {
            const favView = this.querySelector('.favorites-view');
            if (!favView) return;
            
            const currentY = this.scrollTop;
            const delta = currentY - socialLastScrollY;
            
            if (Math.abs(delta) < 10) return;
            
            if (currentY < 50) {
                favView.classList.remove('header-hidden');
            } else if (delta > 0) {
                favView.classList.add('header-hidden');
            } else if (delta < -5) {
                favView.classList.remove('header-hidden');
            }
            
            socialLastScrollY = currentY;
        }, { passive: true });
    }
    
    // Modal profil - attacher directement sur .profile-content
    const profileModal = document.getElementById('userProfileModal');
    if (profileModal) {
        // Observer pour détecter quand profile-content est créé/visible
        const attachProfileScrollListener = () => {
            const profileContent = profileModal.querySelector('.profile-content');
            const userContent = profileModal.querySelector('.user-profile-content');
            
            if (profileContent && userContent && !profileContent.hasAttribute('data-scroll-listener')) {
                profileContent.setAttribute('data-scroll-listener', 'true');
                
                profileContent.addEventListener('scroll', function() {
                    const currentY = this.scrollTop;
                    const delta = currentY - profileLastScrollY;
                    
                    if (Math.abs(delta) < 10) return;
                    
                    if (currentY < 50) {
                        userContent.classList.remove('header-hidden');
                    } else if (delta > 0) {
                        userContent.classList.add('header-hidden');
                    } else if (delta < -5) {
                        userContent.classList.remove('header-hidden');
                    }
                    
                    profileLastScrollY = currentY;
                }, { passive: true });
            }
        };
        
        // Observer les changements dans le modal
        const observer = new MutationObserver(attachProfileScrollListener);
        observer.observe(profileModal, { childList: true, subtree: true });
        
        // Essayer d'attacher immédiatement aussi
        attachProfileScrollListener();
    }
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth <= 900) {
        initFilterDrawer();
        initHeaderAutoHide();
        initModalHeaderAutoHide();
    }
});

function mobileNavTo(section) {
    // Mettre à jour l'état actif
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-nav="${section}"]`)?.classList.add('active');
    
    switch(section) {
        case 'feed':
            // Double-tap sur Feed = rafraîchir (style Twitter/Instagram)
            const now = Date.now();
            if (now - lastFeedTap < 400 && window.scrollY < 100) {
                // Double-tap et déjà en haut → charger nouveaux textes
                if (typeof loadNewTextsOnTop === 'function') {
                    loadNewTextsOnTop();
                }
            } else {
                // Simple tap → scroll vers le haut
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            lastFeedTap = now;
            break;
        case 'search':
            // Focus sur la recherche
            document.getElementById('searchInput')?.focus();
            break;
        case 'social':
            hideHeader();
            if (typeof openSocialFeed === 'function') openSocialFeed();
            break;
        case 'notifs':
            if (typeof toggleNotifications === 'function') toggleNotifications();
            break;
    }
}

// Mettre à jour l'avatar mobile quand l'utilisateur se connecte
function updateMobileAvatar() {
    const mobileAvatar = document.getElementById('mobileAvatar');
    if (mobileAvatar && currentUser) {
        const profile = currentUser.user_metadata;
        if (profile?.avatar_url) {
            // Éviter l'injection via innerHTML/attributs
            mobileAvatar.innerHTML = '';
            const img = document.createElement('img');
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.borderRadius = '50%';
            img.style.objectFit = 'cover';
            img.alt = 'Avatar';

            try {
                const url = new URL(profile.avatar_url, window.location.href);
                if (url.protocol === 'http:' || url.protocol === 'https:') {
                    img.src = url.href;
                    mobileAvatar.appendChild(img);
                } else {
                    mobileAvatar.textContent = profile?.username ? getAvatarSymbol(profile.username) : '👤';
                }
            } catch (e) {
                mobileAvatar.textContent = profile?.username ? getAvatarSymbol(profile.username) : '👤';
            }
        } else if (profile?.username) {
            mobileAvatar.textContent = getAvatarSymbol(profile.username);
        }
    }
}

// Mettre à jour le badge de notifications mobile
function updateMobileNotifBadge(count) {
    const badge = document.getElementById('mobileNotifBadge');
    if (badge) {
        if (count && count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Swipe pour fermer le drawer
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const drawer = document.querySelector('.stats-panel');
    if (!drawer?.classList.contains('open')) return;
    
    const swipeDistance = touchStartX - touchEndX;
    // Swipe vers la gauche pour fermer
    if (swipeDistance > 80) {
        closeMobileDrawer();
    }
}

// Initialiser les éléments mobile
function initMobile() {
    // Bouton profil dans le header - utiliser handleAvatarClick
    const profileBtn = document.getElementById('mobileProfileBtn');
    if (profileBtn) {
        profileBtn.style.cssText = 'cursor:pointer !important; pointer-events:auto !important; touch-action:manipulation !important;';
        
        profileBtn.ontouchstart = function(e) {
            e.preventDefault();
            e.stopPropagation();
            handleAvatarClick();
            return false;
        };
        profileBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            handleAvatarClick();
            return false;
        };
        
        const avatar = profileBtn.querySelector('.mobile-profile-avatar');
        if (avatar) {
            avatar.style.cssText = 'cursor:pointer !important; pointer-events:auto !important;';
            avatar.ontouchstart = function(e) {
                e.preventDefault();
                e.stopPropagation();
                handleAvatarClick();
                return false;
            };
            avatar.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                handleAvatarClick();
                return false;
            };
        }
        
        console.log('📱 Mobile profile button READY');
    }
    
    // Bouton menu dans la nav bottom - ouvrir le drawer complet
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (menuBtn) {
        menuBtn.style.cssText = 'cursor:pointer !important; pointer-events:auto !important; touch-action:manipulation !important;';
        
        menuBtn.ontouchstart = function(e) {
            e.preventDefault();
            e.stopPropagation();
            openMobileDrawer();
            return false;
        };
        menuBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            openMobileDrawer();
            return false;
        };
        
        console.log('📱 Mobile menu button READY');
    }
    
    // Overlay - ferme tous les drawers
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeAllDrawers);
        overlay.addEventListener('touchstart', closeAllDrawers, { passive: true });
    }
    
    // Synchroniser langue
    const drawerLangSelect = document.getElementById('drawerLangSelect');
    const headerLangSelect = document.getElementById('langSelect');
    if (drawerLangSelect && headerLangSelect) {
        drawerLangSelect.value = headerLangSelect.value;
    }
    
    // Avatar
    if (typeof currentUser !== 'undefined' && currentUser) {
        updateMobileAvatar();
        updateMobileProfilePanel();
    }
    
    console.log('📱 Mobile initialisé');
}

// Mettre à jour le panneau profil mobile
function updateMobileProfilePanel() {
    const loggedOut = document.getElementById('mobileProfileLoggedOut');
    const loggedIn = document.getElementById('mobileProfileLoggedIn');
    
    if (typeof currentUser !== 'undefined' && currentUser) {
        if (loggedOut) loggedOut.style.display = 'none';
        if (loggedIn) loggedIn.style.display = 'block';
        
        const username = currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'Utilisateur';
        const avatarSymbol = getAvatarSymbol(username);
        
        const avatarEl = document.getElementById('mobileProfileAvatar');
        const nameEl = document.getElementById('mobileProfileName');
        if (avatarEl) avatarEl.textContent = avatarSymbol;
        if (nameEl) nameEl.textContent = username;
    } else {
        if (loggedOut) loggedOut.style.display = 'block';
        if (loggedIn) loggedIn.style.display = 'none';
    }
}

// Appeler l'init mobile après le chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initMobile, 50);
    });
} else {
    // DOM déjà chargé
    setTimeout(initMobile, 50);
}

// Rendre les fonctions accessibles globalement
window.openMobileDrawer = openMobileDrawer;
window.closeMobileDrawer = closeMobileDrawer;
window.openProfilePanel = openProfilePanel;
window.closeProfilePanel = closeProfilePanel;
window.closeAllDrawers = closeAllDrawers;
window.openCollectionsFromProfile = openCollectionsFromProfile;
window.handleAvatarClick = handleAvatarClick;
window.mobileNavTo = mobileNavTo;
window.updateMobileAvatar = updateMobileAvatar;
window.updateMobileNotifBadge = updateMobileNotifBadge;
window.updateMobileProfilePanel = updateMobileProfilePanel;
