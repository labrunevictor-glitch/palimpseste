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

// Édition de message (1 à la fois)
let editingMessageId = null;

// Picker réactions (un seul ouvert)
let activeReactionPicker = null;
const MESSAGE_REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

// Long-press (mobile)
let longPressTimer = null;
let longPressTargetEl = null;
let messageGlobalHandlersInstalled = false;

function ensureMessageGlobalHandlersInstalled() {
    if (messageGlobalHandlersInstalled) return;
    messageGlobalHandlersInstalled = true;

    document.addEventListener('click', (e) => {
        const clickedInsideMessage = e.target && (e.target.closest?.('.chat-message') || e.target.closest?.('.msg-reaction-picker'));
        if (!clickedInsideMessage) {
            clearAllMessageActions();
            closeReactionPicker();
        }
    });
}

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
    container.innerHTML = `<div class="messages-empty">${t('loading')}</div>`;
    
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
            if (conv.unreadCount > 0) item.classList.add('has-unread');
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
    const chatAvatar = document.getElementById('chatAvatar');
    const chatUsername = document.getElementById('chatUsername');
    if (chatAvatar) {
        chatAvatar.textContent = getAvatarSymbol(username);
        chatAvatar.style.cursor = 'pointer';
        chatAvatar.title = 'Voir le profil';
        chatAvatar.onclick = () => {
            if (typeof openUserProfile === 'function') {
                openUserProfile(userId, username);
            }
        };
    }
    if (chatUsername) {
        chatUsername.textContent = username;
        chatUsername.style.cursor = 'pointer';
        chatUsername.title = 'Voir le profil';
        chatUsername.onclick = () => {
            if (typeof openUserProfile === 'function') {
                openUserProfile(userId, username);
            }
        };
    }
    
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
    container.innerHTML = `<div class="messages-empty">${t('loading')}</div>`;
    
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
        
        // Charger les réactions associées
        const messageIds = messages.map(m => m.id);
        const reactionsByMessage = new Map();
        const myReactionByMessage = new Map();
        if (messageIds.length > 0) {
            const { data: reactions } = await supabaseClient
                .from('message_reactions')
                .select('message_id, user_id, emoji')
                .in('message_id', messageIds);

            (reactions || []).forEach(r => {
                if (!reactionsByMessage.has(r.message_id)) reactionsByMessage.set(r.message_id, new Map());
                const emojiCounts = reactionsByMessage.get(r.message_id);
                emojiCounts.set(r.emoji, (emojiCounts.get(r.emoji) || 0) + 1);
                if (currentUser && r.user_id === currentUser.id) {
                    myReactionByMessage.set(r.message_id, r.emoji);
                }
            });
        }

        for (const msg of messages) {
            const isSent = msg.sender_id === currentUser.id;
            const msgEl = document.createElement('div');
            msgEl.className = `chat-message ${isSent ? 'sent' : 'received'}`;
            msgEl.dataset.messageId = msg.id;
            
            // Indicateur de lecture pour les messages envoyés
            let readIndicator = '';
            if (isSent) {
                readIndicator = msg.read_at 
                    ? `<span class="msg-read-indicator read" title="${t('tooltip_read')}">✓✓</span>` 
                    : `<span class="msg-read-indicator" title="${t('tooltip_sent')}">✓</span>`;
            }
            
            // Format WhatsApp: heure + "Modifié" si applicable
            const timeHtml = `<span class="msg-time-text">${formatMessageTime(msg.created_at)}</span>`;
            const editedHtml = msg.edited_at ? `<span class="msg-edited-label" title="${t('tooltip_modified_at')} ${formatMessageTime(msg.edited_at)}">${t('modified')}</span>` : '';
            
            const reactionsHtml = renderMessageReactions(msg.id, reactionsByMessage, myReactionByMessage);
            const actionButtons = `
                <div class="msg-footer-actions">
                    <div class="msg-actions">
                        <button class="msg-action-btn msg-react-btn" title="${t('tooltip_react')}" onclick="openMessageReactionPicker('${msg.id}', this)">😊</button>
                        ${isSent ? `<button class="msg-action-btn msg-edit-btn" title="${t('tooltip_modify')}" onclick="startEditMessage('${msg.id}')">✎</button>` : ''}
                    </div>
                    <button class="msg-menu-btn" title="${t('tooltip_actions')}" onclick="toggleMessageActions('${msg.id}')">⋯</button>
                </div>
            `;

            msgEl.innerHTML = `
                <div class="msg-body">${escapeHtml(msg.content)}</div>
                ${reactionsHtml}
                <div class="msg-footer">
                    <div class="chat-message-time">
                        ${editedHtml}
                        ${timeHtml}
                        ${readIndicator}
                    </div>
                    ${actionButtons}
                </div>
            `;
            container.appendChild(msgEl);

            attachMessageInteractions(msgEl, msg.id, isSent);
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
    
    // Si on édite, on ne vide qu'après succès
    
    try {
        if (editingMessageId) {
            const { error } = await supabaseClient
                .rpc('edit_message', {
                    p_message_id: editingMessageId,
                    p_content: content
                });

            if (error) throw error;

            cancelEditMessage();
            input.value = '';
        } else {
            const { error } = await supabaseClient
                .from('messages')
                .insert({
                    sender_id: currentUser.id,
                    receiver_id: currentConversationUserId,
                    content: content,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
            input.value = '';

            // Notifier le destinataire
            if (typeof createNotification === 'function') {
                await createNotification(currentConversationUserId, 'message', null, content.substring(0, 100));
            }
        }
        
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
        await supabaseClient.rpc('mark_messages_read', { p_from_user_id: fromUserId });
        
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
        .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'messages' },
            (payload) => {
                const msg = payload.new;
                if (msg.receiver_id === currentUser.id || msg.sender_id === currentUser.id) {
                    if (currentConversationUserId === msg.sender_id || currentConversationUserId === msg.receiver_id) {
                        loadMessages(currentConversationUserId);
                    }
                    loadConversations();
                    updateUnreadBadge();
                }
            }
        )
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'message_reactions' },
            (payload) => {
                const r = payload.new || payload.old;
                if (!r?.message_id || !currentConversationUserId) return;
                // Simple: recharger si une conversation est ouverte
                loadMessages(currentConversationUserId);
            }
        )
        .subscribe();
}

// ═══════════════════════════════════════════════════════════════════════════
// 😊 RÉACTIONS (LIKES/EMOJIS)
// ═══════════════════════════════════════════════════════════════════════════

function renderMessageReactions(messageId, reactionsByMessage, myReactionByMessage) {
    const emojiCounts = reactionsByMessage.get(messageId);
    if (!emojiCounts || emojiCounts.size === 0) return '';

    const myEmoji = myReactionByMessage.get(messageId);
    const pills = Array.from(emojiCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([emoji, count]) => {
            const mine = myEmoji === emoji ? ' mine' : '';
            const label = count > 1 ? `${emoji} ${count}` : `${emoji}`;
            return `<button class="msg-reaction-pill${mine}" onclick="setMessageReaction('${messageId}', '${emoji}')" title="Réagir ${emoji}">${label}</button>`;
        })
        .join('');

    return `<div class="msg-reactions" aria-label="Réactions">${pills}</div>`;
}

function closeReactionPicker() {
    if (activeReactionPicker) {
        activeReactionPicker.remove();
        activeReactionPicker = null;
    }
}

function openMessageReactionPicker(messageId, anchorEl) {
    closeReactionPicker();

    const picker = document.createElement('div');
    picker.className = 'msg-reaction-picker';
    picker.innerHTML = MESSAGE_REACTION_EMOJIS.map(e => `<button class="msg-reaction-emoji" onclick="setMessageReaction('${messageId}', '${e}')">${e}</button>`).join('');
    picker.style.visibility = 'hidden';
    document.body.appendChild(picker);

    // Positionner près de l'ancre (fixé viewport, clamp dans l'écran)
    const rect = anchorEl.getBoundingClientRect();
    const pickerRect = picker.getBoundingClientRect();
    const margin = 8;

    let top = rect.top - pickerRect.height - margin;
    if (top < margin) top = rect.bottom + margin;

    let left = rect.left + (rect.width / 2) - (pickerRect.width / 2);
    left = Math.max(margin, Math.min(left, window.innerWidth - pickerRect.width - margin));

    picker.style.top = `${top}px`;
    picker.style.left = `${left}px`;
    picker.style.visibility = '';

    activeReactionPicker = picker;

    // Fermer au clic extérieur + scroll/resize
    setTimeout(() => {
        const onDocClick = (ev) => {
            if (!picker.contains(ev.target)) {
                closeReactionPicker();
                document.removeEventListener('click', onDocClick);
                window.removeEventListener('scroll', onViewportChange, true);
                window.removeEventListener('resize', onViewportChange);
            }
        };
        const onViewportChange = () => {
            closeReactionPicker();
            document.removeEventListener('click', onDocClick);
            window.removeEventListener('scroll', onViewportChange, true);
            window.removeEventListener('resize', onViewportChange);
        };
        document.addEventListener('click', onDocClick);
        window.addEventListener('scroll', onViewportChange, true);
        window.addEventListener('resize', onViewportChange);
    }, 0);
}

function clearAllMessageActions() {
    document.querySelectorAll('.chat-message.show-actions').forEach(el => el.classList.remove('show-actions'));
}

function toggleMessageActions(messageId) {
    const msgEl = document.querySelector(`.chat-message[data-message-id="${messageId}"]`);
    if (!msgEl) return;
    const willShow = !msgEl.classList.contains('show-actions');
    clearAllMessageActions();
    if (willShow) msgEl.classList.add('show-actions');
}

function attachMessageInteractions(msgContainerEl, messageId, isSent) {
    // Desktop: hover handled by CSS
    // Mobile: long-press to show actions (and keep them visible briefly)
    const supportsHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    if (supportsHover) return;

    ensureMessageGlobalHandlersInstalled();

    const start = (ev) => {
        if (ev.type === 'mousedown' && ev.button !== 0) return;

        clearTimeout(longPressTimer);
        longPressTargetEl = msgContainerEl;

        longPressTimer = setTimeout(() => {
            clearAllMessageActions();
            msgContainerEl.classList.add('show-actions');
            // (Optionnel) ouvrir directement le picker au long-press
            // openMessageReactionPicker(messageId, msgContainerEl);
        }, 450);
    };

    const cancel = () => {
        clearTimeout(longPressTimer);
        longPressTimer = null;
        longPressTargetEl = null;
    };

    msgContainerEl.addEventListener('touchstart', start, { passive: true });
    msgContainerEl.addEventListener('touchend', cancel, { passive: true });
    msgContainerEl.addEventListener('touchmove', cancel, { passive: true });
    msgContainerEl.addEventListener('mousedown', start);
    msgContainerEl.addEventListener('mouseup', cancel);
    msgContainerEl.addEventListener('mouseleave', cancel);

}

async function setMessageReaction(messageId, emoji) {
    if (!currentUser) {
        openAuthModal('login');
        toast('😊 Connectez-vous pour réagir');
        return;
    }
    if (!supabaseClient) return;

    try {
        const { data: existing } = await supabaseClient
            .from('message_reactions')
            .select('emoji')
            .eq('message_id', messageId)
            .eq('user_id', currentUser.id)
            .maybeSingle();

        if (existing?.emoji === emoji) {
            const { error } = await supabaseClient
                .from('message_reactions')
                .delete()
                .eq('message_id', messageId)
                .eq('user_id', currentUser.id);
            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('message_reactions')
                .upsert({
                    message_id: messageId,
                    user_id: currentUser.id,
                    emoji,
                    created_at: new Date().toISOString()
                }, { onConflict: 'message_id,user_id' });
            if (error) throw error;

            // Notifier l'auteur du message
            if (typeof createNotification === 'function') {
                const { data: msg } = await supabaseClient
                    .from('messages')
                    .select('sender_id')
                    .eq('id', messageId)
                    .maybeSingle();
                if (msg && msg.sender_id !== currentUser.id) {
                    await createNotification(msg.sender_id, 'reaction', null, emoji);
                }
            }
        }

        closeReactionPicker();
        if (currentConversationUserId) await loadMessages(currentConversationUserId);
    } catch (err) {
        console.error('Erreur réaction message:', err);
        toast('Erreur réaction');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ✎ ÉDITION
// ═══════════════════════════════════════════════════════════════════════════

function startEditMessage(messageId) {
    const msgEl = document.querySelector(`.chat-message[data-message-id="${messageId}"] .msg-body`);
    if (!msgEl) return;

    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const content = msgEl.textContent || '';

    editingMessageId = messageId;
    input.value = content;
    input.focus();
    if (sendBtn) sendBtn.textContent = '✓';

    // Afficher un bandeau simple “édition”
    let banner = document.getElementById('chatEditBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'chatEditBanner';
        banner.className = 'chat-edit-banner';
        banner.innerHTML = `Modification du message <button class="chat-edit-cancel" onclick="cancelEditMessage()">Annuler</button>`;
        const chatArea = document.getElementById('chatArea');
        const inputArea = chatArea?.querySelector('.chat-input-area');
        if (inputArea) {
            inputArea.parentNode.insertBefore(banner, inputArea);
        }
    }
}

function cancelEditMessage() {
    editingMessageId = null;
    const sendBtn = document.getElementById('chatSendBtn');
    if (sendBtn) sendBtn.textContent = '➤';
    const banner = document.getElementById('chatEditBanner');
    if (banner) banner.remove();
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

// ═══════════════════════════════════════════════════════════════════════════
// 🌐 EXPOSITION GLOBALE DES FONCTIONS
// ═══════════════════════════════════════════════════════════════════════════

window.openMessaging = openMessaging;
window.closeMessaging = closeMessaging;
window.backToConversations = backToConversations;
window.openConversation = openConversation;
window.sendMessage = sendMessage;
window.startConversation = startConversation;
window.openMessageReactionPicker = openMessageReactionPicker;
window.setMessageReaction = setMessageReaction;
window.toggleMessageActions = toggleMessageActions;
window.startEditMessage = startEditMessage;
window.cancelEditMessage = cancelEditMessage;
