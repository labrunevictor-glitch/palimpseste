/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💬 MESSAGING.JS - Palimpseste
 * Système de messagerie privée entre utilisateurs
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// 📦 ÉTAT DU MODULE
// ═══════════════════════════════════════════════════════════════════════════

let currentConversationUserId = null;
let messagesSubscription = null;

// ═══════════════════════════════════════════════════════════════════════════
// 🚪 OUVERTURE/FERMETURE DE LA MESSAGERIE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ouvrir le modal de messagerie
 */
async function openMessaging() {
    if (!currentUser) {
        openAuthModal('login');
        toast('📝 Connectez-vous pour accéder à vos messages');
        return;
    }
    
    document.getElementById('messagesModal').classList.add('open');
    document.getElementById('messagesModal').classList.remove('chat-open');
    document.getElementById('chatArea').style.display = 'none';
    document.getElementById('chatPlaceholder').style.display = 'flex';
    
    await loadConversations();
    subscribeToMessages();
}

/**
 * Fermer le modal de messagerie
 */
function closeMessaging() {
    document.getElementById('messagesModal').classList.remove('open');
    if (messagesSubscription) {
        messagesSubscription.unsubscribe();
        messagesSubscription = null;
    }
    currentConversationUserId = null;
}

/**
 * Retour aux conversations (mobile)
 */
function backToConversations() {
    document.getElementById('messagesModal').classList.remove('chat-open');
    document.getElementById('chatArea').style.display = 'none';
    document.getElementById('chatPlaceholder').style.display = 'flex';
    currentConversationUserId = null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 📋 LISTE DES CONVERSATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Charger toutes les conversations de l'utilisateur
 */
async function loadConversations() {
    if (!supabaseClient || !currentUser) return;
    
    const container = document.getElementById('conversationsList');
    container.innerHTML = '<div class="messages-empty">Chargement...</div>';
    
    try {
        // Récupérer tous les messages où l'utilisateur est impliqué
        const { data: sentMessages, error: err1 } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('sender_id', currentUser.id);
        
        const { data: receivedMessages, error: err2 } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('receiver_id', currentUser.id);
        
        if (err1 || err2) {
            console.error('Erreur messages:', err1 || err2);
            const errMsg = (err1 || err2)?.message || '';
            if (errMsg.includes('does not exist') || errMsg.includes('relation')) {
                container.innerHTML = '<div class="messages-empty">⚠️ La table messages n\'existe pas encore.<br><br>Exécutez le SQL dans Supabase pour activer la messagerie.</div>';
            } else {
                container.innerHTML = '<div class="messages-empty">Erreur de chargement<br><small>' + errMsg + '</small></div>';
            }
            return;
        }
        
        // Combiner et trier
        const allMessages = [...(sentMessages || []), ...(receivedMessages || [])];
        allMessages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        if (allMessages.length === 0) {
            container.innerHTML = '<div class="messages-empty">Aucune conversation.<br><br>Visitez le profil d\'un utilisateur et cliquez sur "💬 Message" pour démarrer une conversation.</div>';
            return;
        }
        
        // Grouper par conversation (autre utilisateur)
        const conversations = new Map();
        for (const msg of allMessages) {
            const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
            if (!conversations.has(otherUserId)) {
                conversations.set(otherUserId, {
                    otherUserId,
                    lastMessage: msg,
                    unreadCount: 0
                });
            }
            // Compter les messages non lus
            if (msg.receiver_id === currentUser.id && !msg.read_at) {
                const conv = conversations.get(otherUserId);
                conv.unreadCount++;
            }
        }
        
        // Récupérer les profils des autres utilisateurs
        const userIds = Array.from(conversations.keys());
        const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('id, username')
            .in('id', userIds);
        
        const profileMap = new Map();
        (profiles || []).forEach(p => profileMap.set(p.id, p));
        
        // Afficher les conversations
        container.innerHTML = '';
        for (const [userId, conv] of conversations) {
            const profile = profileMap.get(userId) || { username: 'Utilisateur' };
            const avatarSymbol = getAvatarSymbol(profile.username);
            const preview = conv.lastMessage.content.substring(0, 40) + (conv.lastMessage.content.length > 40 ? '...' : '');
            const time = formatMessageTime(conv.lastMessage.created_at);
            
            const item = document.createElement('div');
            item.className = 'conversation-item';
            if (currentConversationUserId === userId) item.classList.add('active');
            item.onclick = () => openConversation(userId, profile.username);
            item.innerHTML = `
                <div class="conversation-avatar">${avatarSymbol}</div>
                <div class="conversation-info">
                    <div class="conversation-name">${profile.username}</div>
                    <div class="conversation-preview">${conv.lastMessage.sender_id === currentUser.id ? 'Vous: ' : ''}${preview}</div>
                </div>
                <div class="conversation-meta">
                    <span class="conversation-time">${time}</span>
                    ${conv.unreadCount > 0 ? `<span class="conversation-unread">${conv.unreadCount}</span>` : ''}
                </div>
            `;
            container.appendChild(item);
        }
    } catch (err) {
        console.error('Erreur chargement conversations:', err);
        container.innerHTML = '<div class="messages-empty">Erreur de chargement<br><small>' + (err.message || err) + '</small></div>';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 💬 GESTION D'UNE CONVERSATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ouvrir une conversation avec un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} username - Nom d'utilisateur
 */
async function openConversation(userId, username) {
    currentConversationUserId = userId;
    
    // Afficher le chat
    document.getElementById('chatPlaceholder').style.display = 'none';
    document.getElementById('chatArea').style.display = 'flex';
    document.getElementById('messagesModal').classList.add('chat-open');
    
    // Header
    document.getElementById('chatAvatar').textContent = getAvatarSymbol(username);
    document.getElementById('chatUsername').textContent = username;
    
    // Charger les messages
    await loadMessages(userId);
    
    // Marquer comme lus
    markMessagesAsRead(userId);
    
    // Mettre à jour la liste (active)
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    loadConversations(); // Refresh pour les badges
}

/**
 * Charger les messages d'une conversation
 * @param {string} otherUserId - ID de l'autre utilisateur
 */
async function loadMessages(otherUserId) {
    if (!supabaseClient || !currentUser) return;
    
    const container = document.getElementById('chatMessages');
    container.innerHTML = '<div class="messages-empty">Chargement...</div>';
    
    try {
        // Récupérer les messages envoyés et reçus séparément
        const { data: sentMessages, error: err1 } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('sender_id', currentUser.id)
            .eq('receiver_id', otherUserId);
        
        const { data: receivedMessages, error: err2 } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('sender_id', otherUserId)
            .eq('receiver_id', currentUser.id);
        
        if (err1 || err2) throw (err1 || err2);
        
        // Combiner et trier par date
        const messages = [...(sentMessages || []), ...(receivedMessages || [])];
        messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        container.innerHTML = '';
        
        if (messages.length === 0) {
            container.innerHTML = '<div class="messages-empty" style="align-self: center; margin: auto;">Démarrez la conversation !</div>';
            return;
        }
        
        for (const msg of messages) {
            const isSent = msg.sender_id === currentUser.id;
            const msgEl = document.createElement('div');
            msgEl.className = `chat-message ${isSent ? 'sent' : 'received'}`;
            msgEl.innerHTML = `
                ${escapeHtml(msg.content)}
                <div class="chat-message-time">${formatMessageTime(msg.created_at)}</div>
            `;
            container.appendChild(msgEl);
        }
        
        // Scroll en bas
        container.scrollTop = container.scrollHeight;
    } catch (err) {
        console.error('Erreur chargement messages:', err);
        container.innerHTML = '<div class="messages-empty">Erreur de chargement</div>';
    }
}

/**
 * Envoyer un message
 */
async function sendMessage() {
    if (!supabaseClient || !currentUser || !currentConversationUserId) return;
    
    const input = document.getElementById('chatInput');
    const content = input.value.trim();
    
    if (!content) return;
    
    input.value = '';
    
    try {
        const { error } = await supabaseClient
            .from('messages')
            .insert({
                sender_id: currentUser.id,
                receiver_id: currentConversationUserId,
                content: content,
                created_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        // Rafraîchir les messages
        await loadMessages(currentConversationUserId);
        
    } catch (err) {
        console.error('Erreur envoi message:', err);
        toast('Erreur d\'envoi');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 📖 MARQUAGE COMME LU & BADGES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Marquer les messages d'un utilisateur comme lus
 * @param {string} fromUserId - ID de l'expéditeur
 */
async function markMessagesAsRead(fromUserId) {
    if (!supabaseClient || !currentUser) return;
    
    try {
        await supabaseClient
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('sender_id', fromUserId)
            .eq('receiver_id', currentUser.id)
            .is('read_at', null);
        
        updateUnreadBadge();
    } catch (err) {
        console.error('Erreur marquage lu:', err);
    }
}

/**
 * Mettre à jour le badge de messages non lus
 */
async function updateUnreadBadge() {
    if (!supabaseClient || !currentUser) return;
    
    try {
        const { count } = await supabaseClient
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', currentUser.id)
            .is('read_at', null);
        
        const badge = document.getElementById('unreadBadge');
        if (badge) {
            if (count && count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (err) {
        console.error('Erreur comptage non lus:', err);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔄 TEMPS RÉEL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * S'abonner aux nouveaux messages en temps réel
 */
function subscribeToMessages() {
    if (!supabaseClient || !currentUser || messagesSubscription) return;
    
    messagesSubscription = supabaseClient
        .channel('messages-channel')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages' },
            (payload) => {
                const msg = payload.new;
                if (msg.receiver_id === currentUser.id || msg.sender_id === currentUser.id) {
                    // Rafraîchir la conversation si elle est ouverte
                    if (currentConversationUserId === msg.sender_id || currentConversationUserId === msg.receiver_id) {
                        loadMessages(currentConversationUserId);
                    }
                    // Rafraîchir la liste des conversations
                    loadConversations();
                    // Mettre à jour le badge
                    updateUnreadBadge();
                }
            }
        )
        .subscribe();
}

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 DÉMARRAGE DE CONVERSATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Démarrer une conversation depuis le profil d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 */
function startConversation(userId) {
    if (!currentUser) {
        openAuthModal('login');
        toast('📝 Connectez-vous pour envoyer des messages');
        return;
    }
    
    if (userId === currentUser.id) {
        toast('😅 Vous ne pouvez pas vous écrire à vous-même');
        return;
    }
    
    closeUserProfile();
    openMessaging();
    
    // Ouvrir la conversation avec ce user
    const username = document.getElementById('profileUsername').textContent;
    setTimeout(() => {
        openConversation(userId, username);
    }, 300);
}
