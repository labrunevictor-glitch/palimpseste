// ═══════════════════════════════════════════════════════════
// 📱 MOBILE - Drawer et Navigation (style Twitter)
// ═══════════════════════════════════════════════════════════

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

// Fermer le drawer en cliquant sur le bouton "Fermer" (pseudo-element)
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 900) {
        const drawer = document.querySelector('.stats-panel');
        if (drawer && drawer.classList.contains('open')) {
            // Vérifier si on clique sur la zone du bouton fermer (haut du drawer)
            const rect = drawer.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            if (clickY < 40 && e.target === drawer) {
                closeMobileDrawer();
            }
        }
    }
});

// Navigation mobile
let lastFeedTap = 0;

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
            mobileAvatar.innerHTML = `<img src="${profile.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else if (profile?.username) {
            mobileAvatar.textContent = profile.username[0].toUpperCase();
        }
    }
}

// Mettre à jour le badge de notifications mobile
function updateMobileNotifBadge(count) {
    const badge = document.getElementById('mobileNotifBadge');
    if (badge) {
        badge.textContent = count > 0 ? (count > 9 ? '9+' : count) : '';
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
    // Bouton profil dans le header - utiliser event delegation
    const profileBtn = document.getElementById('mobileProfileBtn');
    if (profileBtn) {
        // Forcer le style cliquable
        profileBtn.style.cssText = 'cursor:pointer !important; pointer-events:auto !important; touch-action:manipulation !important;';
        
        // Handler direct
        profileBtn.ontouchstart = function(e) {
            e.preventDefault();
            e.stopPropagation();
            openMobileDrawer();
            return false;
        };
        profileBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            openMobileDrawer();
            return false;
        };
        
        // Aussi sur l'avatar à l'intérieur
        const avatar = profileBtn.querySelector('.mobile-profile-avatar');
        if (avatar) {
            avatar.style.cssText = 'cursor:pointer !important; pointer-events:auto !important;';
            avatar.ontouchstart = function(e) {
                e.preventDefault();
                e.stopPropagation();
                openMobileDrawer();
                return false;
            };
            avatar.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                openMobileDrawer();
                return false;
            };
        }
        
        console.log('📱 Mobile profile button READY');
    }
    
    // Bouton menu dans la nav bottom
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
    
    // Overlay
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeMobileDrawer);
        overlay.addEventListener('touchstart', closeMobileDrawer, { passive: true });
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
    }
    
    console.log('📱 Mobile initialisé');
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
window.mobileNavTo = mobileNavTo;
window.updateMobileAvatar = updateMobileAvatar;
window.updateMobileNotifBadge = updateMobileNotifBadge;
