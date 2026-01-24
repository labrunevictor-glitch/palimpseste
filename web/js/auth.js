/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔐 AUTH.JS - Palimpseste
 * Module d'authentification Supabase
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// 🐦 CONFIGURATION SUPABASE
// ═══════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://cqoepdrqifilqxnvflyy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2VwZHJxaWZpbHF4bnZmbHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzQxMTksImV4cCI6MjA4NDc1MDExOX0.e7dJmzUEgzDIix12ca38HvBmF7Cgp_fTZPT6gZ6Xy5s';

// Client et état utilisateur (globaux pour rétrocompatibilité)
let supabaseClient = null;
let currentUser = null;

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 INITIALISATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vérifie si Supabase est configuré
 * @returns {boolean}
 */
function isSupabaseConfigured() {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}

/**
 * Initialise le client Supabase
 * @returns {boolean} true si initialisé
 */
function initSupabase() {
    if (!isSupabaseConfigured()) {
        return false;
    }
    try {
        if (typeof window.supabase === 'undefined') {
            // SDK pas encore chargé - retry
            setTimeout(initSupabase, 500);
            return false;
        }
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Écouter les changements d'auth
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                currentUser = session.user;
                onUserLoggedIn();
            } else {
                currentUser = null;
                onUserLoggedOut();
            }
        });
        
        checkSession();
        return true;
    } catch (e) {
        console.error('Erreur init Supabase:', e);
        return false;
    }
}

/**
 * Vérifie la session active
 */
async function checkSession() {
    if (!supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
        currentUser = session.user;
        onUserLoggedIn();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 📝 MODAL D'AUTHENTIFICATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ouvre le modal d'authentification
 * @param {string} mode - 'login', 'register', 'forgot', 'reset'
 */
function openAuthModal(mode = 'login') {
    document.getElementById('authModal').classList.add('open');
    switchAuthForm(mode);
    closeUserDropdown();
}

/**
 * Ferme le modal d'authentification
 */
function closeAuthModal() {
    document.getElementById('authModal').classList.remove('open');
    // Reset errors
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('registerError').classList.remove('show');
    document.getElementById('forgotError').classList.remove('show');
    document.getElementById('forgotSuccess').classList.remove('show');
}

/**
 * Change de formulaire dans le modal
 * @param {string} mode - Type de formulaire
 */
function switchAuthForm(mode) {
    document.getElementById('loginForm').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = mode === 'register' ? 'block' : 'none';
    document.getElementById('forgotForm').style.display = mode === 'forgot' ? 'block' : 'none';
    document.getElementById('resetPasswordForm').style.display = mode === 'reset' ? 'block' : 'none';
    
    // Reset messages
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('registerError').classList.remove('show');
    document.getElementById('forgotError').classList.remove('show');
    document.getElementById('forgotSuccess').classList.remove('show');
    
    if (document.getElementById('resetError')) {
        document.getElementById('resetError').classList.remove('show');
    }
    if (document.getElementById('resetSuccess')) {
        document.getElementById('resetSuccess').classList.remove('show');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔑 CONNEXION / INSCRIPTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Connexion par email/mot de passe
 */
async function loginWithEmail() {
    if (!supabaseClient) {
        showAuthError('login', 'Supabase non configuré.');
        return;
    }
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showAuthError('login', 'Veuillez remplir tous les champs');
        return;
    }
    
    document.getElementById('loginBtn').disabled = true;
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    document.getElementById('loginBtn').disabled = false;
    
    if (error) {
        showAuthError('login', error.message);
    } else {
        closeAuthModal();
        toast('✅ Connexion réussie !');
    }
}

/**
 * Inscription par email
 */
async function registerWithEmail() {
    if (!supabaseClient) {
        showAuthError('register', 'Supabase non configuré.');
        return;
    }
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const password = document.getElementById('registerPassword').value;
    
    if (!username || !email || !password) {
        showAuthError('register', 'Veuillez remplir tous les champs');
        return;
    }
    
    if (password.length < 6) {
        showAuthError('register', 'Le mot de passe doit faire au moins 6 caractères');
        return;
    }
    
    // Validation du username
    if (!/^[a-zA-Z0-9_àâäéèêëïîôùûüç\-]+$/.test(username)) {
        showAuthError('register', 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores');
        return;
    }
    
    if (username.length < 2 || username.length > 30) {
        showAuthError('register', 'Le nom d\'utilisateur doit faire entre 2 et 30 caractères');
        return;
    }
    
    document.getElementById('registerBtn').disabled = true;
    document.getElementById('registerBtn').textContent = 'Inscription...';
    
    try {
        // Vérifier si le username existe déjà
        const { data: existingUser } = await supabaseClient
            .from('profiles')
            .select('username')
            .ilike('username', username)
            .maybeSingle();
        
        if (existingUser) {
            document.getElementById('registerBtn').disabled = false;
            document.getElementById('registerBtn').textContent = 'S\'inscrire';
            showAuthError('register', 'Ce nom d\'utilisateur est déjà pris.');
            return;
        }
        
        // Créer le compte
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { username } }
        });
        
        document.getElementById('registerBtn').disabled = false;
        document.getElementById('registerBtn').textContent = 'S\'inscrire';
        
        if (error) {
            let errorMsg = error.message;
            if (error.message.includes('already registered')) {
                errorMsg = 'Cette adresse email est déjà utilisée.';
            } else if (error.message.includes('Invalid email')) {
                errorMsg = 'L\'adresse email n\'est pas valide.';
            }
            showAuthError('register', errorMsg);
        } else {
            closeAuthModal();
            if (data.user && !data.user.email_confirmed_at) {
                toast('🎉 Compte créé ! Vérifiez votre email.');
            } else {
                toast('🎉 Compte créé avec succès !');
            }
        }
    } catch (e) {
        console.error('Erreur inscription:', e);
        document.getElementById('registerBtn').disabled = false;
        document.getElementById('registerBtn').textContent = 'S\'inscrire';
        showAuthError('register', 'Une erreur est survenue.');
    }
}

/**
 * Connexion via Google OAuth
 */
async function loginWithGoogle() {
    if (!supabaseClient) {
        toast('⚠️ Supabase non configuré');
        return;
    }
    
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
    
    if (error) {
        toast('❌ Erreur: ' + error.message);
    }
}

/**
 * Déconnexion
 */
async function logoutUser() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    closeUserDropdown();
    toast('👋 Déconnecté');
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔓 MOT DE PASSE OUBLIÉ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vérifie si l'URL contient un token de reset password
 */
function checkPasswordResetToken() {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
        setTimeout(() => {
            document.getElementById('authModal').classList.add('open');
            switchAuthForm('reset');
        }, 500);
    }
}

/**
 * Envoie un email de réinitialisation
 */
async function sendPasswordReset() {
    if (!supabaseClient) {
        showAuthError('forgot', 'Supabase non configuré.');
        return;
    }
    
    const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
    
    if (!email) {
        showAuthError('forgot', 'Veuillez entrer votre adresse email');
        return;
    }
    
    document.getElementById('forgotBtn').disabled = true;
    document.getElementById('forgotBtn').textContent = 'Envoi...';
    
    const redirectUrl = 'https://palimpseste.vercel.app/';
    
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl
        });
        
        document.getElementById('forgotBtn').disabled = false;
        document.getElementById('forgotBtn').textContent = 'Envoyer le lien';
        
        if (error) {
            showForgotErrorWithContact(error.message);
        } else {
            document.getElementById('forgotError').classList.remove('show');
            const successEl = document.getElementById('forgotSuccess');
            successEl.textContent = '✅ Email envoyé ! Vérifiez votre boîte de réception.';
            successEl.classList.add('show');
        }
    } catch (e) {
        console.error('Erreur reset password:', e);
        document.getElementById('forgotBtn').disabled = false;
        document.getElementById('forgotBtn').textContent = 'Envoyer le lien';
        showForgotErrorWithContact('Une erreur est survenue');
    }
}

/**
 * Affiche erreur avec option contact admin
 */
function showForgotErrorWithContact(errorMsg) {
    const errorEl = document.getElementById('forgotError');
    errorEl.innerHTML = `
        <div>❌ ${errorMsg}</div>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border);">
            <strong>Alternative :</strong> Contactez l'admin pour réinitialiser votre mot de passe.
        </div>
    `;
    errorEl.classList.add('show');
    document.getElementById('forgotSuccess').classList.remove('show');
}

/**
 * Met à jour le mot de passe (après reset)
 */
async function updatePassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!newPassword || !confirmPassword) {
        showAuthError('reset', 'Veuillez remplir tous les champs');
        return;
    }
    
    if (newPassword.length < 6) {
        showAuthError('reset', 'Le mot de passe doit contenir au moins 6 caractères');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showAuthError('reset', 'Les mots de passe ne correspondent pas');
        return;
    }
    
    document.getElementById('resetBtn').disabled = true;
    document.getElementById('resetBtn').textContent = 'Modification...';
    
    try {
        const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
        
        document.getElementById('resetBtn').disabled = false;
        document.getElementById('resetBtn').textContent = 'Changer le mot de passe';
        
        if (error) {
            showAuthError('reset', error.message);
        } else {
            document.getElementById('resetError').classList.remove('show');
            const successEl = document.getElementById('resetSuccess');
            successEl.textContent = '✅ Mot de passe modifié avec succès !';
            successEl.classList.add('show');
            
            history.replaceState(null, '', window.location.pathname);
            setTimeout(() => closeAuthModal(), 2000);
        }
    } catch (e) {
        console.error('Erreur:', e);
        document.getElementById('resetBtn').disabled = false;
        document.getElementById('resetBtn').textContent = 'Changer le mot de passe';
        showAuthError('reset', 'Une erreur est survenue.');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 👤 PROFIL UTILISATEUR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crée le profil utilisateur dans la table profiles
 */
async function createUserProfile(userId, username) {
    if (!supabaseClient) return;
    
    try {
        const { error } = await supabaseClient.from('profiles').upsert({
            id: userId,
            username: username,
            created_at: new Date().toISOString()
        }, { onConflict: 'id' });
        
        if (error) console.error('Erreur création profil:', error);
    } catch (e) {
        console.error('Exception création profil:', e);
    }
}

/**
 * S'assure que le profil existe
 */
async function ensureProfileExists() {
    if (!supabaseClient || !currentUser) return;
    
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('id, username')
        .eq('id', currentUser.id)
        .maybeSingle();
    
    if (!profile) {
        const username = currentUser.user_metadata?.username || 
                         currentUser.email?.split('@')[0] || 
                         'Utilisateur';
        await createUserProfile(currentUser.id, username);
    } else if (!profile.username && currentUser.user_metadata?.username) {
        await supabaseClient
            .from('profiles')
            .update({ username: currentUser.user_metadata.username })
            .eq('id', currentUser.id);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 UI AUTH
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Affiche une erreur sur un formulaire
 */
function showAuthError(form, message) {
    const el = document.getElementById(form + 'Error');
    if (el) {
        el.textContent = message;
        el.classList.add('show');
    }
}

/**
 * Callback quand l'utilisateur se connecte
 */
async function onUserLoggedIn() {
    await ensureProfileExists();
    
    const username = currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'Utilisateur';
    const initial = username.charAt(0).toUpperCase();
    
    // Header
    document.getElementById('headerAvatar').innerHTML = initial;
    document.getElementById('loginMenuItem').style.display = 'none';
    document.getElementById('registerMenuItem').style.display = 'none';
    document.getElementById('profileMenuItem').style.display = 'block';
    document.getElementById('logoutDivider').style.display = 'block';
    document.getElementById('logoutMenuItem').style.display = 'block';
    
    // Sidebar
    document.getElementById('profileLoggedOut').style.display = 'none';
    document.getElementById('profileLoggedIn').style.display = 'block';
    document.getElementById('sidebarAvatar').innerHTML = initial;
    document.getElementById('sidebarUsername').textContent = username;
    
    // Mobile
    const mobileAvatar = document.getElementById('mobileAvatar');
    if (mobileAvatar) mobileAvatar.textContent = initial;
    
    // Charger données utilisateur (fonctions définies dans app.js)
    if (typeof loadUserStats === 'function') loadUserStats();
    if (typeof updateUnreadBadge === 'function') updateUnreadBadge();
    if (typeof updateNotifBadge === 'function') updateNotifBadge();
    if (typeof subscribeToNotifications === 'function') subscribeToNotifications();
}

/**
 * Callback quand l'utilisateur se déconnecte
 */
function onUserLoggedOut() {
    document.getElementById('headerAvatar').innerHTML = '👤';
    document.getElementById('loginMenuItem').style.display = 'block';
    document.getElementById('registerMenuItem').style.display = 'block';
    document.getElementById('profileMenuItem').style.display = 'none';
    document.getElementById('logoutDivider').style.display = 'none';
    document.getElementById('logoutMenuItem').style.display = 'none';
    
    document.getElementById('profileLoggedOut').style.display = 'block';
    document.getElementById('profileLoggedIn').style.display = 'none';
    
    const mobileAvatar = document.getElementById('mobileAvatar');
    if (mobileAvatar) mobileAvatar.textContent = '👤';
}

/**
 * Toggle menu utilisateur
 */
function toggleUserDropdown() {
    document.getElementById('userDropdown').classList.toggle('open');
}

/**
 * Ferme le menu utilisateur
 */
function closeUserDropdown() {
    document.getElementById('userDropdown').classList.remove('open');
}

// Fermer dropdown si clic ailleurs
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        closeUserDropdown();
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// 🌐 EXPORTS GLOBAUX (rétrocompatibilité)
// ═══════════════════════════════════════════════════════════════════════════

window.supabaseClient = null; // Sera défini par initSupabase
window.currentUser = null;
window.isSupabaseConfigured = isSupabaseConfigured;
window.initSupabase = initSupabase;
window.checkSession = checkSession;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthForm = switchAuthForm;
window.loginWithEmail = loginWithEmail;
window.registerWithEmail = registerWithEmail;
window.loginWithGoogle = loginWithGoogle;
window.logoutUser = logoutUser;
window.checkPasswordResetToken = checkPasswordResetToken;
window.sendPasswordReset = sendPasswordReset;
window.updatePassword = updatePassword;
window.showAuthError = showAuthError;
window.createUserProfile = createUserProfile;
window.ensureProfileExists = ensureProfileExists;
window.onUserLoggedIn = onUserLoggedIn;
window.onUserLoggedOut = onUserLoggedOut;
window.toggleUserDropdown = toggleUserDropdown;
window.closeUserDropdown = closeUserDropdown;

// Exposer supabaseClient et currentUser globalement après init
Object.defineProperty(window, 'supabaseClient', {
    get: () => supabaseClient,
    set: (val) => { supabaseClient = val; }
});
Object.defineProperty(window, 'currentUser', {
    get: () => currentUser,
    set: (val) => { currentUser = val; }
});
