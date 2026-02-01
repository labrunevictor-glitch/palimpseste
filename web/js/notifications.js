// ═══════════════════════════════════════════════════════════
// 🔔 NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

var notificationsSubscription = null;

/**
 * Diagnostiquer le système de notifications
 * Appeler diagNotifications() dans la console pour vérifier
 */
function diagNotifications() {
    console.group('🔔 Diagnostic Notifications');
    
    console.log('1. supabaseClient:', typeof supabaseClient !== 'undefined' ? '✅ Défini' : '❌ Non défini');
    console.log('2. currentUser:', typeof currentUser !== 'undefined' && currentUser ? `✅ Connecté (${currentUser.id?.substring(0, 8)}...)` : '❌ Non connecté');
    
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        console.log('3. URL Supabase:', supabaseClient.supabaseUrl || '?');
    }
    
    // Test de connexion à la table notifications
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient.from('notifications').select('count', { count: 'exact', head: true }).then(({ count, error }) => {
            if (error) {
                console.log('4. Table notifications:', '❌ Erreur -', error.message);
                if (error.message?.includes('does not exist')) {
                    console.log('   💡 La table "notifications" n\'existe pas. Exécutez le SQL de setup.');
                }
            } else {
                console.log('4. Table notifications:', '✅ Accessible');
            }
        });
    }
    
    console.log('5. createNotification:', typeof createNotification === 'function' ? '✅ Disponible' : '❌ Non disponible');
    console.log('6. notifyMentions:', typeof notifyMentions === 'function' ? '✅ Disponible' : '❌ Non disponible');
    
    console.groupEnd();
    
    console.log('💡 Pour tester: await createNotification("USER_ID", "like", "EXTRAIT_ID")');
}
window.diagNotifications = diagNotifications;

// Afficher/masquer les notifications
function toggleNotifications() {
    // Sur mobile, ouvrir le drawer et afficher les notifications
    if (window.innerWidth <= 900) {
        openMobileNotifications();
        return;
    }
    
    // Sur desktop, utiliser le dropdown
    const dropdown = document.getElementById('notifDropdown');
    const isOpen = dropdown.classList.contains('open');
    
    // Fermer les autres dropdowns
    document.getElementById('userDropdown')?.classList.remove('open');
    
    if (isOpen) {
        dropdown.classList.remove('open');
    } else {
        dropdown.classList.add('open');
        loadNotifications();
    }
}

// Notifications mobile - utilise une modal simple
function openMobileNotifications() {
    // Créer une modal temporaire pour les notifications
    let modal = document.getElementById('mobileNotifModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'mobileNotifModal';
        modal.className = 'mobile-modal';
        modal.innerHTML = `
            <div class="mobile-modal-content">
                <div class="mobile-modal-header">
                    <h3>🔔 Notifications</h3>
                    <button class="mobile-modal-close" onclick="closeMobileNotifications()">✕</button>
                </div>
                <div class="mobile-modal-body" id="mobileNotifList">
                    <div class="notif-empty">Chargement...</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Ajouter les styles si pas déjà présents
        if (!document.getElementById('mobileModalStyles')) {
            const styles = document.createElement('style');
            styles.id = 'mobileModalStyles';
            styles.textContent = `
                .mobile-modal {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    z-index: 300;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                }
                .mobile-modal-content {
                    background: var(--bg-card);
                    width: 100%;
                    max-height: 80vh;
                    border-radius: 16px 16px 0 0;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .mobile-modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px;
                    border-bottom: 2px solid var(--border);
                }
                .mobile-modal-header h3 {
                    margin: 0;
                    font-size: 1.1rem;
                }
                .mobile-modal-close {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 8px;
                }
                .mobile-modal-body {
                    padding: 16px;
                    overflow-y: auto;
                    flex: 1;
                }
            `;
            document.head.appendChild(styles);
        }
    }
    
    modal.style.display = 'flex';
    loadNotifications('mobileNotifList');
}

function closeMobileNotifications() {
    const modal = document.getElementById('mobileNotifModal');
    if (modal) modal.style.display = 'none';
}

// Fermer dropdown quand on clique ailleurs
document.addEventListener('click', (e) => {
    const notifBtn = document.querySelector('.notif-btn');
    if (notifBtn && !notifBtn.contains(e.target)) {
        document.getElementById('notifDropdown')?.classList.remove('open');
    }
});

// Charger les notifications
async function loadNotifications(containerId = 'notifList') {
    if (!supabaseClient || !currentUser) {
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = '<div class="notif-empty">Connectez-vous pour voir vos notifications</div>';
        return;
    }
    
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<div class="notif-empty">Chargement...</div>';
    
    try {
        const { data: notifs, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(30);
        
        if (error) {
            console.error('Erreur notifications:', error);
            if (error.message?.includes('does not exist')) {
                container.innerHTML = '<div class="notif-empty">⚠️ Table non créée</div>';
            } else {
                container.innerHTML = '<div class="notif-empty">Erreur</div>';
            }
            return;
        }
        
        if (!notifs || notifs.length === 0) {
            container.innerHTML = '<div class="notif-empty">Aucune notification</div>';
            return;
        }
        
        // Récupérer les profils des expéditeurs
        const fromUserIds = [...new Set(notifs.map(n => n.from_user_id))];
        const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('id, username')
            .in('id', fromUserIds);
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        
        container.innerHTML = notifs.map(notif => {
            const fromUser = profileMap.get(notif.from_user_id);
            const fromName = fromUser?.username || 'Quelqu\'un';
            const avatarSymbol = getAvatarSymbol(fromName);
            const timeAgo = formatTimeAgo(new Date(notif.created_at));
            const isUnread = !notif.read_at;
            
            let icon = '🔔';
            let text = '';
            
            if (notif.type === 'like') {
                icon = '❤️';
                text = `<strong>${escapeHtml(fromName)}</strong> a aimé votre extrait`;
            } else if (notif.type === 'comment_like') {
                icon = '💜';
                text = `<strong>${escapeHtml(fromName)}</strong> a aimé votre commentaire`;
            } else if (notif.type === 'comment') {
                icon = '💬';
                text = `<strong>${escapeHtml(fromName)}</strong> a commenté votre extrait`;
            } else if (notif.type === 'mention') {
                icon = '@';
                const preview = notif.content ? ` : "${escapeHtml(notif.content.substring(0, 50))}${notif.content.length > 50 ? '…' : ''}"` : '';
                text = `<strong>${escapeHtml(fromName)}</strong> vous a mentionné${preview}`;
            } else if (notif.type === 'reply') {
                icon = '↩️';
                text = `<strong>${escapeHtml(fromName)}</strong> a répondu à votre commentaire`;
            } else if (notif.type === 'follow') {
                icon = '👤';
                text = `<strong>${escapeHtml(fromName)}</strong> vous suit`;
            } else if (notif.type === 'message') {
                icon = '✉️';
                const preview = notif.content ? ` : "${escapeHtml(notif.content.substring(0, 50))}${notif.content.length > 50 ? '…' : ''}"` : '';
                text = `<strong>${escapeHtml(fromName)}</strong> vous a envoyé un message${preview}`;
            } else if (notif.type === 'reaction') {
                icon = notif.content || '😊';
                text = `<strong>${escapeHtml(fromName)}</strong> a réagi ${notif.content || ''} à votre contenu`;
            } else if (notif.type === 'collection_add') {
                icon = '📁';
                text = `<strong>${escapeHtml(fromName)}</strong> a ajouté votre extrait à une collection`;
            } else if (notif.type === 'share') {
                icon = '↗️';
                text = `<strong>${escapeHtml(fromName)}</strong> a partagé votre extrait`;
            }
            
            return `
                <div class="notif-item ${isUnread ? 'unread' : ''}" onclick="handleNotifClick('${notif.id}', '${notif.type}', '${notif.extrait_id || ''}', '${notif.from_user_id}', '${escapeHtml(fromName)}')">
                    <div class="notif-avatar">${avatarSymbol}</div>
                    <div class="notif-content">
                        <div class="notif-text">${text}</div>
                        <div class="notif-time">${timeAgo}</div>
                    </div>
                    <div class="notif-icon">${icon}</div>
                </div>
            `;
        }).join('');
        
    } catch (err) {
        console.error('Erreur chargement notifications:', err);
        container.innerHTML = '<div class="notif-empty">Erreur</div>';
    }
}

// Gérer le clic sur une notification
async function handleNotifClick(notifId, type, extraitId, fromUserId, fromName) {
    console.log('🔔 handleNotifClick:', { notifId, type, extraitId, fromUserId, fromName });
    
    // Marquer comme lue
    if (supabaseClient && currentUser) {
        await supabaseClient
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', notifId);
    }
    
    // Fermer le dropdown et la modal mobile
    document.getElementById('notifDropdown')?.classList.remove('open');
    closeMobileNotifications();
    
    // Normaliser extraitId (string vide → null)
    const normalizedExtraitId = extraitId && extraitId !== '' && extraitId !== 'null' && extraitId !== 'undefined' ? extraitId : null;
    
    // Action selon le type
    if (type === 'like' || type === 'comment' || type === 'comment_like' || type === 'mention' || type === 'reply' || type === 'reaction' || type === 'collection_add' || type === 'share') {
        // Ouvrir l'extrait concerné
        if (normalizedExtraitId) {
            const success = await openExtraitFromNotification(normalizedExtraitId);
            if (success) {
                // Si c'est un commentaire ou mention, ouvrir aussi les commentaires
                if (type === 'comment' || type === 'mention' || type === 'reply' || type === 'comment_like') {
                    setTimeout(() => {
                        if (typeof toggleComments === 'function') {
                            toggleComments(normalizedExtraitId);
                        }
                    }, 500);
                }
            } else {
                toast('❌ Extrait introuvable');
            }
        } else {
            console.warn('⚠️ Notification sans extrait_id:', notifId);
            toast('Extrait non disponible');
        }
    } else if (type === 'follow') {
        if (typeof openUserProfile === 'function') {
            openUserProfile(fromUserId, fromName);
        }
    } else if (type === 'message') {
        // Ouvrir la messagerie et la conversation avec cet utilisateur
        if (typeof openMessaging === 'function') {
            await openMessaging();
            // Ouvrir la conversation avec l'expéditeur
            if (typeof openConversation === 'function') {
                setTimeout(() => openConversation(fromUserId, fromName), 300);
            }
        }
    }
    
    // Mettre à jour le badge
    updateNotifBadge();
}

/**
 * Ouvrir un extrait depuis une notification
 * Gère l'ouverture de l'overlay et l'affichage de l'extrait spécifique
 */
async function openExtraitFromNotification(extraitId) {
    if (!supabaseClient || !extraitId) return false;
    
    console.log('📖 Ouverture extrait depuis notification:', extraitId);
    
    try {
        // Charger l'extrait
        const { data: extrait, error } = await supabaseClient
            .from('extraits')
            .select('*')
            .eq('id', extraitId)
            .single();
        
        if (error || !extrait) {
            console.error('❌ Extrait non trouvé:', error?.message || 'null');
            return false;
        }
        
        // Charger le profil de l'auteur
        if (typeof loadProfilesMap === 'function') {
            const profileMap = await loadProfilesMap([extrait.user_id]);
            extrait.profiles = profileMap.get(extrait.user_id) || null;
        }
        
        // IMPORTANT: Mettre l'extrait AVANT d'ouvrir l'overlay
        // pour éviter que loadSocialFeed() ne l'écrase
        if (typeof window.socialExtraits !== 'undefined') {
            window.socialExtraits = [extrait];
        }
        
        // Ouvrir l'overlay social SANS recharger le feed
        const overlay = document.getElementById('socialOverlay');
        if (overlay) {
            overlay.classList.add('open');
        }
        
        // Afficher l'extrait unique
        if (typeof renderSocialFeed === 'function') {
            await renderSocialFeed();
        }
        
        // Scroll vers le haut pour voir l'extrait
        const socialFeed = document.getElementById('socialFeed');
        if (socialFeed) {
            socialFeed.scrollTop = 0;
        }
        
        // Highlight temporaire de la carte
        setTimeout(() => {
            const card = document.querySelector(`.extrait-card[data-id="${extraitId}"]`);
            if (card) {
                card.classList.add('highlight-notification');
                setTimeout(() => card.classList.remove('highlight-notification'), 2000);
            }
        }, 300);
        
        console.log('✅ Extrait affiché:', extrait.id);
        return true;
        
    } catch (err) {
        console.error('❌ Erreur ouverture extrait:', err);
        return false;
    }
}

window.openExtraitFromNotification = openExtraitFromNotification;

// Marquer toutes les notifications comme lues
async function markAllNotifsRead() {
    if (!supabaseClient || !currentUser) return;
    
    try {
        await supabaseClient
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', currentUser.id)
            .is('read_at', null);
        
        toast('Notifications lues');
        loadNotifications();
        updateNotifBadge();
    } catch (err) {
        console.error('Erreur marquage lu:', err);
    }
}

// Mettre à jour le badge de notifications
async function updateNotifBadge() {
    if (!supabaseClient || !currentUser) return;
    
    try {
        const { count } = await supabaseClient
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id)
            .is('read_at', null);
        
        const badge = document.getElementById('notifBadge');
        if (badge) {
            if (count && count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
        
        // Mettre à jour aussi le badge mobile
        if (typeof updateMobileNotifBadge === 'function') {
            updateMobileNotifBadge(count || 0);
        }
    } catch (err) {
        // Ignorer si la table n'existe pas
    }
}

// Créer une notification
async function createNotification(userId, type, extraitId = null, content = null) {
    console.log('🔔 createNotification appelée:', { userId, type, extraitId, content: content?.substring(0, 50) });
    
    if (!supabaseClient) {
        console.warn('❌ createNotification: supabaseClient non initialisé');
        return false;
    }
    if (!currentUser) {
        console.warn('❌ createNotification: currentUser non défini (pas connecté)');
        return false;
    }
    if (!userId) {
        console.warn('❌ createNotification: userId manquant');
        return false;
    }
    if (userId === currentUser.id) {
        console.log('ℹ️ Notification ignorée (même utilisateur)');
        return false;
    }
    
    console.log(`📩 Création notification: type=${type}, pour user=${userId}, extrait=${extraitId}`);

    try {
        // Utiliser la fonction RPC qui bypasse RLS de manière sécurisée
        const { data, error } = await supabaseClient.rpc('create_notification', {
            p_user_id: userId,
            p_type: type,
            p_extrait_id: extraitId,
            p_content: content
        });
        
        if (error) {
            // Fallback sur insert direct si RPC n'existe pas
            if (error.message?.includes('function') || error.code === '42883') {
                console.log('⚠️ RPC create_notification non disponible, fallback insert direct');
                return await createNotificationDirect(userId, type, extraitId, content);
            }
            console.error('❌ Erreur création notification:', error.message, error);
            return false;
        }
        
        console.log('✅ Notification créée via RPC:', data);
        return true;
    } catch (err) {
        console.error('❌ Exception notification:', err);
        return false;
    }
}

// Fallback: insert direct (pour compatibilité si RPC pas créée)
async function createNotificationDirect(userId, type, extraitId, content) {
    try {
        const { data, error } = await supabaseClient
            .from('notifications')
            .insert({
                user_id: userId,
                from_user_id: currentUser.id,
                type: type,
                extrait_id: extraitId,
                content: content,
                created_at: new Date().toISOString()
            })
            .select();
        
        if (error) {
            console.error('❌ Erreur insert direct notification:', error.message, error);
            return false;
        }
        
        console.log('✅ Notification créée (direct):', data?.[0]?.id);
        return true;
    } catch (err) {
        console.error('❌ Exception insert direct:', err);
        return false;
    }
}

// S'abonner aux notifications en temps réel
function subscribeToNotifications() {
    if (!supabaseClient || !currentUser || notificationsSubscription) return;
    
    notificationsSubscription = supabaseClient
        .channel('notif-channel')
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
            (payload) => {
                console.log('Nouvelle notification:', payload);
                updateNotifBadge();
                // Notification visuelle
                toast('🔔 Nouvelle notification !');
            }
        )
        .subscribe();
}

// Rendre les fonctions accessibles globalement
window.toggleNotifications = toggleNotifications;
window.loadNotifications = loadNotifications;
window.handleNotifClick = handleNotifClick;
window.markAllNotifsRead = markAllNotifsRead;
window.updateNotifBadge = updateNotifBadge;
window.createNotification = createNotification;
window.subscribeToNotifications = subscribeToNotifications;

// ═══════════════════════════════════════════════════════════
// 📣 SYSTÈME DE MENTIONS @pseudo
// ═══════════════════════════════════════════════════════════

/**
 * Extrait les @mentions d'un texte
 * @param {string} text - Le texte contenant des mentions
 * @returns {string[]} - Liste des pseudos mentionnés (sans @)
 */
function extractMentions(text) {
    if (!text) return [];
    // Match @pseudo (lettres, chiffres, tirets, underscores)
    const regex = /@([a-zA-Z0-9_-]+)/g;
    const mentions = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        const username = match[1];
        if (!mentions.includes(username.toLowerCase())) {
            mentions.push(username.toLowerCase());
        }
    }
    return mentions;
}

/**
 * Résout les @mentions vers les IDs utilisateurs
 * @param {string[]} usernames - Liste des pseudos
 * @returns {Promise<Map<string, string>>} - Map pseudo -> userId
 */
async function resolveMentions(usernames) {
    if (!supabaseClient || !usernames.length) return new Map();
    
    try {
        // Recherche case-insensitive
        const { data: profiles, error } = await supabaseClient
            .from('profiles')
            .select('id, username')
            .in('username', usernames);
        
        if (error) {
            console.warn('Erreur résolution mentions:', error);
            return new Map();
        }
        
        const map = new Map();
        (profiles || []).forEach(p => {
            map.set(p.username.toLowerCase(), p.id);
        });
        return map;
    } catch (e) {
        console.error('Exception résolution mentions:', e);
        return new Map();
    }
}

/**
 * Crée des notifications pour toutes les mentions dans un texte
 * @param {string} text - Texte contenant les mentions
 * @param {string} extraitId - ID de l'extrait concerné
 * @param {string} [contentPreview] - Aperçu du contenu pour la notification
 */
async function notifyMentions(text, extraitId, contentPreview = null) {
    if (!currentUser || !supabaseClient) return;
    
    const mentions = extractMentions(text);
    if (!mentions.length) return;
    
    console.log('📣 Mentions trouvées:', mentions);
    
    const userMap = await resolveMentions(mentions);
    
    for (const [username, userId] of userMap) {
        if (userId !== currentUser.id) {
            await createNotification(userId, 'mention', extraitId, contentPreview || text.substring(0, 100));
            console.log('📣 Notification mention envoyée à:', username);
        }
    }
}

/**
 * Formatte un texte en rendant les @mentions cliquables
 * @param {string} text - Texte brut
 * @returns {string} - HTML avec liens vers les profils
 */
function formatMentions(text) {
    if (!text) return '';
    return text.replace(/@([a-zA-Z0-9_-]+)/g, '<span class="mention" onclick="searchAndOpenProfile(\'$1\')">@$1</span>');
}

/**
 * Recherche et ouvre le profil d'un utilisateur par pseudo
 * @param {string} username - Pseudo de l'utilisateur
 */
async function searchAndOpenProfile(username) {
    if (!supabaseClient) return;
    
    try {
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('id, username')
            .ilike('username', username)
            .maybeSingle();
        
        if (profile && typeof openUserProfile === 'function') {
            openUserProfile(profile.id, profile.username);
        } else {
            toast('Utilisateur non trouvé');
        }
    } catch (e) {
        console.error('Erreur recherche profil:', e);
    }
}

// Exposer les fonctions de mentions
window.extractMentions = extractMentions;
window.resolveMentions = resolveMentions;
window.notifyMentions = notifyMentions;
window.formatMentions = formatMentions;
window.searchAndOpenProfile = searchAndOpenProfile;
