// ═══════════════════════════════════════════════════════════
// 🔔 NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

var notificationsSubscription = null;

// Afficher/masquer les notifications
function toggleNotifications() {
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

// Fermer dropdown quand on clique ailleurs
document.addEventListener('click', (e) => {
    const notifBtn = document.querySelector('.notif-btn');
    if (notifBtn && !notifBtn.contains(e.target)) {
        document.getElementById('notifDropdown')?.classList.remove('open');
    }
});

// Charger les notifications
async function loadNotifications() {
    if (!supabaseClient || !currentUser) return;
    
    const container = document.getElementById('notifList');
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
            const initial = fromName.charAt(0).toUpperCase();
            const timeAgo = formatTimeAgo(new Date(notif.created_at));
            const isUnread = !notif.read_at;
            
            let icon = '🔔';
            let text = '';
            
            if (notif.type === 'like') {
                icon = '❤️';
                text = `<strong>${escapeHtml(fromName)}</strong> a aimé votre extrait`;
            } else if (notif.type === 'comment') {
                icon = '💬';
                text = `<strong>${escapeHtml(fromName)}</strong> a commenté votre extrait`;
            } else if (notif.type === 'follow') {
                icon = '👤';
                text = `<strong>${escapeHtml(fromName)}</strong> vous suit`;
            }
            
            return `
                <div class="notif-item ${isUnread ? 'unread' : ''}" onclick="handleNotifClick('${notif.id}', '${notif.type}', '${notif.extrait_id || ''}', '${notif.from_user_id}', '${escapeHtml(fromName)}')">
                    <div class="notif-avatar">${initial}</div>
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
    // Marquer comme lue
    if (supabaseClient && currentUser) {
        await supabaseClient
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', notifId);
    }
    
    // Fermer le dropdown
    document.getElementById('notifDropdown').classList.remove('open');
    
    // Action selon le type
    if (type === 'like' || type === 'comment') {
        if (extraitId && typeof viewExtraitById === 'function') {
            viewExtraitById(extraitId);
        }
    } else if (type === 'follow') {
        if (typeof openUserProfile === 'function') {
            openUserProfile(fromUserId, fromName);
        }
    }
    
    // Mettre à jour le badge
    updateNotifBadge();
}

// Marquer toutes les notifications comme lues
async function markAllNotifsRead() {
    if (!supabaseClient || !currentUser) return;
    
    try {
        await supabaseClient
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', currentUser.id)
            .is('read_at', null);
        
        toast('✅ Toutes les notifications marquées comme lues');
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
    if (!supabaseClient || !currentUser) return;
    if (userId === currentUser.id) return; // Pas de notif pour soi-même
    
    try {
        await supabaseClient
            .from('notifications')
            .insert({
                user_id: userId,
                from_user_id: currentUser.id,
                type: type,
                extrait_id: extraitId,
                content: content,
                created_at: new Date().toISOString()
            });
    } catch (err) {
        console.warn('Notification non créée:', err);
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
