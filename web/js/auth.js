// ═══════════════════════════════════════════════════════════
// 🐦 SUPABASE - Configuration Social
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://cqoepdrqifilqxnvflyy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2VwZHJxaWZpbHF4bnZmbHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzQxMTksImV4cCI6MjA4NDc1MDExOX0.e7dJmzUEgzDIix12ca38HvBmF7Cgp_fTZPT6gZ6Xy5s';

// Client Supabase (initialisé si configuré)
var supabaseClient = null;
var currentUser = null;

// Vérifie si Supabase est configuré
function isSupabaseConfigured() {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}

// Initialise Supabase si configuré
function initSupabase() {
    if (!isSupabaseConfigured()) {
        // Mode local uniquement
        return false;
    }
    try {
        // Vérifier que le SDK est chargé
        if (typeof window.supabase === 'undefined') {
            // SDK pas encore chargé - retry
            // Réessayer dans 500ms (le SDK est en async)
            setTimeout(initSupabase, 500);
            return false;
        }
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // Supabase prêt
        
        // Écouter les changements d'auth
        supabaseClient.auth.onAuthStateChange((event, session) => {
            // Auth state changed
            if (session?.user) {
                currentUser = session.user;
                onUserLoggedIn();
            } else {
                currentUser = null;
                onUserLoggedOut();
            }
        });
        
        // Vérifier si déjà connecté
        checkSession();
        return true;
    } catch (e) {
        console.error('Erreur init Supabase:', e);
        return false;
    }
}

async function checkSession() {
    if (!supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
        currentUser = session.user;
        onUserLoggedIn();
    }
}

// ═══════════════════════════════════════════════════════════
// 🔐 AUTHENTIFICATION
// ═══════════════════════════════════════════════════════════

function openAuthModal(mode = 'login') {
    // Fermer le drawer mobile d'abord (sinon l'écran reste grisé)
    if (typeof closeMobileDrawer === 'function') {
        closeMobileDrawer();
    }
    // Petit délai pour laisser le drawer se fermer
    setTimeout(() => {
        document.getElementById('authModal').classList.add('open');
        switchAuthForm(mode);
        closeUserDropdown();
    }, 50);
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('open');
    // Reset errors
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('registerError').classList.remove('show');
    document.getElementById('forgotError').classList.remove('show');
    document.getElementById('forgotSuccess').classList.remove('show');
}

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

// Vérifier si l'URL contient un token de reset password
function checkPasswordResetToken() {
    // Supabase met les paramètres dans le hash (#) de l'URL
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
        // C'est un lien de récupération de mot de passe
        console.log('Token de récupération détecté');
        // Ouvrir le modal avec le formulaire de nouveau mot de passe
        setTimeout(() => {
            document.getElementById('authModal').classList.add('open');
            switchAuthForm('reset');
        }, 500);
    }
}

// Fonction pour mettre à jour le mot de passe
async function updatePassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
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
        const { data, error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });
        
        document.getElementById('resetBtn').disabled = false;
        document.getElementById('resetBtn').textContent = 'Changer le mot de passe';
        
        if (error) {
            console.error('Erreur update password:', error);
            showAuthError('reset', error.message);
        } else {
            // Succès !
            document.getElementById('resetError').classList.remove('show');
            const successEl = document.getElementById('resetSuccess');
            successEl.textContent = '✅ Mot de passe modifié avec succès !';
            successEl.classList.add('show');
            
            // Nettoyer l'URL (enlever le hash)
            history.replaceState(null, '', window.location.pathname);
            
            // Fermer le modal après 2 secondes et rediriger vers connexion
            setTimeout(() => {
                closeAuthModal();
                // Si l'utilisateur est maintenant connecté, tant mieux
                // Sinon il pourra se reconnecter avec son nouveau mdp
            }, 2000);
        }
    } catch (e) {
        console.error('Erreur:', e);
        document.getElementById('resetBtn').disabled = false;
        document.getElementById('resetBtn').textContent = 'Changer le mot de passe';
        showAuthError('reset', 'Une erreur est survenue. Réessayez.');
    }
}

// Helper pour afficher les erreurs sur le formulaire reset
function showAuthError(formType, message) {
    const errorEl = document.getElementById(formType + 'Error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
}

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
    
    // URL de redirection - utiliser l'URL de production
    const redirectUrl = 'https://palimpseste.vercel.app/';
    
    try {
        const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl
        });
        
        console.log('Reset password response:', { data, error });
        
        document.getElementById('forgotBtn').disabled = false;
        document.getElementById('forgotBtn').textContent = 'Envoyer le lien';
        
        if (error) {
            console.error('Reset password error:', error);
            // Afficher le message d'erreur avec option de contacter l'admin
            showForgotErrorWithContact(error.message);
        } else {
            // Afficher le message de succès
            document.getElementById('forgotError').classList.remove('show');
            const successEl = document.getElementById('forgotSuccess');
            successEl.textContent = '✅ Email envoyé ! Vérifiez votre boîte de réception (et les spams).';
            successEl.classList.add('show');
        }
    } catch (e) {
        console.error('Erreur reset password:', e);
        document.getElementById('forgotBtn').disabled = false;
        document.getElementById('forgotBtn').textContent = 'Envoyer le lien';
        showForgotErrorWithContact('Une erreur est survenue');
    }
}

// Afficher erreur mot de passe oublié avec option contact admin
function showForgotErrorWithContact(errorMsg) {
    const errorEl = document.getElementById('forgotError');
    errorEl.innerHTML = `
        <div>${errorMsg}</div>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border);">
            <strong>Alternative :</strong> Contactez l'admin sur Discord ou par email pour réinitialiser votre mot de passe manuellement.
        </div>
    `;
    errorEl.classList.add('show');
    document.getElementById('forgotSuccess').classList.remove('show');
}

async function loginWithEmail() {
    if (!supabaseClient) {
        showAuthError('login', 'Supabase non configuré. Voir console pour instructions.');
        return;
    }
    
    let identifier = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!identifier || !password) {
        showAuthError('login', 'Veuillez remplir tous les champs');
        return;
    }
    
    document.getElementById('loginBtn').disabled = true;
    document.getElementById('loginBtn').textContent = 'Connexion...';
    
    let email = identifier;
    
    // Si ce n'est pas un email (pas de @), c'est un pseudo
    if (!identifier.includes('@')) {
        try {
            // Chercher l'email associé au pseudo
            const { data: profile, error: profileError } = await supabaseClient
                .from('profiles')
                .select('email')
                .ilike('username', identifier)
                .maybeSingle();
            
            if (profileError || !profile || !profile.email) {
                document.getElementById('loginBtn').disabled = false;
                document.getElementById('loginBtn').textContent = 'Se connecter';
                showAuthError('login', 'Pseudo introuvable. Vérifiez votre saisie.');
                return;
            }
            
            email = profile.email;
        } catch (e) {
            console.error('Erreur recherche pseudo:', e);
            document.getElementById('loginBtn').disabled = false;
            document.getElementById('loginBtn').textContent = 'Se connecter';
            showAuthError('login', 'Erreur lors de la recherche du pseudo.');
            return;
        }
    }
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    document.getElementById('loginBtn').disabled = false;
    document.getElementById('loginBtn').textContent = 'Se connecter';
    
    if (error) {
        // Améliorer le message d'erreur
        let errorMsg = error.message;
        if (error.message.includes('Invalid login credentials')) {
            errorMsg = 'Identifiants incorrects. Vérifiez votre email/pseudo et mot de passe.';
        }
        showAuthError('login', errorMsg);
    } else {
        closeAuthModal();
        toast('Connexion réussie');
    }
}

async function registerWithEmail() {
    if (!supabaseClient) {
        showAuthError('register', 'Supabase non configuré. Voir console pour instructions.');
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
    
    // Validation du username (pas de caractères spéciaux problématiques)
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
        // Vérifier d'abord si le username existe déjà
        const { data: existingUser, error: checkError } = await supabaseClient
            .from('profiles')
            .select('username')
            .ilike('username', username)
            .maybeSingle();
        
        if (existingUser) {
            document.getElementById('registerBtn').disabled = false;
            document.getElementById('registerBtn').textContent = 'S\'inscrire';
            showAuthError('register', 'Ce nom d\'utilisateur est déjà pris. Choisissez-en un autre.');
            return;
        }
        
        // Créer le compte
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        });
        
        document.getElementById('registerBtn').disabled = false;
        document.getElementById('registerBtn').textContent = 'S\'inscrire';
        
        if (error) {
            // Améliorer les messages d'erreur courants
            let errorMsg = error.message;
            console.error('Erreur inscription:', error);
            console.error('Code erreur:', error.code);
            console.error('Status:', error.status);
            
            if (error.message.includes('already registered') || error.message.includes('User already registered')) {
                errorMsg = 'Cette adresse email est déjà utilisée. Connectez-vous ou utilisez une autre adresse.';
            } else if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
                if (error.message.includes('username')) {
                    errorMsg = 'Ce nom d\'utilisateur est déjà pris. Choisissez-en un autre.';
                } else if (error.message.includes('email')) {
                    errorMsg = 'Cette adresse email est déjà utilisée.';
                } else {
                    errorMsg = 'Ce compte existe déjà.';
                }
            } else if (error.message.includes('Database error')) {
                // Erreur générique de base de données - probablement le trigger qui échoue
                errorMsg = 'Erreur base de données. Détail: ' + error.message;
            } else if (error.message.includes('Invalid email')) {
                errorMsg = 'L\'adresse email n\'est pas valide.';
            } else if (error.message.includes('Password')) {
                errorMsg = 'Le mot de passe ne respecte pas les critères requis (min. 6 caractères).';
            }
            showAuthError('register', errorMsg);
        } else {
            // Succès ! Le profil est créé automatiquement par un trigger Supabase
            closeAuthModal();
            if (data.user && !data.user.email_confirmed_at) {
                toast('Compte créé ! Vérifiez votre email.');
            } else {
                toast('Compte créé !');
            }
        }
    } catch (e) {
        console.error('Exception lors de l\'inscription:', e);
        document.getElementById('registerBtn').disabled = false;
        document.getElementById('registerBtn').textContent = 'S\'inscrire';
        showAuthError('register', 'Une erreur est survenue. Veuillez réessayer.');
    }
}

async function loginWithGoogle() {
    if (!supabaseClient) {
        toast('⚠️ Supabase non configuré');
        return;
    }
    
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });
    
    if (error) {
        toast('Erreur : ' + error.message);
    }
}

async function logoutUser() {
    if (!supabaseClient) return;
    
    await supabaseClient.auth.signOut();
    closeUserDropdown();
    toast('👋 Déconnecté');
}

// Alias pour compatibilité avec le HTML
window.logout = logoutUser;

async function createUserProfile(userId, username) {
    if (!supabaseClient) return;
    
    try {
        // Utiliser upsert pour créer ou mettre à jour le profil
        const { error } = await supabaseClient.from('profiles').upsert({
            id: userId,
            username: username,
            created_at: new Date().toISOString()
        }, { onConflict: 'id' });
        
        if (error) {
            console.error('Erreur création profil:', error);
        }
    } catch (e) {
        console.error('Exception création profil:', e);
    }
}

// S'assurer que le profil existe (appelé à chaque connexion)
async function ensureProfileExists() {
    if (!supabaseClient || !currentUser) return;
    
    // Vérifier si le profil existe
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('id, username')
        .eq('id', currentUser.id)
        .maybeSingle();
    
    if (!profile) {
        // Profil n'existe pas, le créer
        const username = currentUser.user_metadata?.username || 
                         currentUser.email?.split('@')[0] || 
                         'Utilisateur';
        await createUserProfile(currentUser.id, username);
    } else if (!profile.username && currentUser.user_metadata?.username) {
        // Profil existe mais sans username, le mettre à jour
        await supabaseClient
            .from('profiles')
            .update({ username: currentUser.user_metadata.username })
            .eq('id', currentUser.id);
    }
}

// Callbacks auth
async function onUserLoggedIn() {
    // S'assurer que le profil existe dans la table profiles
    await ensureProfileExists();
    
    const username = currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'Utilisateur';
    const avatarSymbol = getAvatarSymbol(username);
    
    // Update header
    document.getElementById('headerAvatar').innerHTML = avatarSymbol;
    document.getElementById('loginMenuItem').style.display = 'none';
    document.getElementById('registerMenuItem').style.display = 'none';
    document.getElementById('profileMenuItem').style.display = 'block';
    document.getElementById('logoutDivider').style.display = 'block';
    document.getElementById('logoutMenuItem').style.display = 'block';
    
    // Update sidebar
    document.getElementById('profileLoggedOut').style.display = 'none';
    document.getElementById('profileLoggedIn').style.display = 'block';
    document.getElementById('sidebarAvatar').innerHTML = avatarSymbol;
    document.getElementById('sidebarUsername').textContent = username;
    
    // Update mobile avatar
    const mobileAvatar = document.getElementById('mobileAvatar');
    if (mobileAvatar) {
        mobileAvatar.textContent = avatarSymbol;
    }
    
    // Charger le cache des likes de l'utilisateur
    if (typeof loadUserLikesCache === 'function') loadUserLikesCache();
    
    // Synchroniser les likes de sources depuis Supabase
    if (typeof syncLikesFromSupabase === 'function') syncLikesFromSupabase();
    
    // Load user stats (défini dans app.js)
    if (typeof loadUserStats === 'function') loadUserStats();
    
    // Mettre à jour le badge de messages non lus
    if (typeof updateUnreadBadge === 'function') updateUnreadBadge();
    
    // Mettre à jour le badge de notifications et s'abonner
    if (typeof updateNotifBadge === 'function') updateNotifBadge();
    if (typeof subscribeToNotifications === 'function') subscribeToNotifications();
    
    // Mettre à jour le panneau profil mobile
    if (typeof updateMobileProfilePanel === 'function') updateMobileProfilePanel();
}

function onUserLoggedOut() {
    document.getElementById('headerAvatar').innerHTML = '👤';
    document.getElementById('loginMenuItem').style.display = 'block';
    document.getElementById('registerMenuItem').style.display = 'block';
    document.getElementById('profileMenuItem').style.display = 'none';
    document.getElementById('logoutDivider').style.display = 'none';
    document.getElementById('logoutMenuItem').style.display = 'none';
    
    document.getElementById('profileLoggedOut').style.display = 'block';
    document.getElementById('profileLoggedIn').style.display = 'none';
    
    // Reset mobile avatar
    const mobileAvatar = document.getElementById('mobileAvatar');
    if (mobileAvatar) {
        mobileAvatar.textContent = '👤';
    }
    
    // Réinitialiser le cache des likes
    if (typeof resetLikesCache === 'function') resetLikesCache();
    
    // Mettre à jour le panneau profil mobile
    if (typeof updateMobileProfilePanel === 'function') updateMobileProfilePanel();
}

function toggleUserDropdown() {
    document.getElementById('userDropdown').classList.toggle('open');
}

function closeUserDropdown() {
    document.getElementById('userDropdown').classList.remove('open');
}

// Fermer dropdown si clic ailleurs
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        closeUserDropdown();
    }
});
