/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PALIMPSESTE - Module Internationalisation (i18n.js)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Gestion des traductions de l'interface utilisateur
 * Langues supportées : Français (fr), Anglais (en), Allemand (de), 
 *                      Italien (it), Espagnol (es), Portugais (pt)
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════
// 📚 DICTIONNAIRES DE TRADUCTION
// ═══════════════════════════════════════════════════════════

const translations = {
    fr: {
        // Navigation & Header
        'random': 'Hasard',
        'trending': 'Tendances',
        'all_languages': 'Toutes',
        'search_placeholder': 'Rechercher un auteur, un mot, un thème...',
        'my_likes': 'Mes likés',
        'collections': 'Collections',
        'community': 'Communauté',
        'messages': 'Messages',
        'notifications': 'Notifications',
        'change_theme': 'Changer de thème',
        'light_mode': 'Mode clair',
        'dark_mode': 'Mode sombre',
        
        // Authentification
        'welcome_back': 'Bon retour 📚',
        'connect_to_share': 'Connectez-vous pour partager vos extraits',
        'email_or_username': 'Email ou pseudo',
        'password': 'Mot de passe',
        'forgot_password': 'Mot de passe oublié ?',
        'login': 'Se connecter',
        'or': 'ou',
        'continue_google': '🌐 Continuer avec Google',
        'no_account': "Pas encore de compte ?",
        'register': "S'inscrire",
        'welcome': 'Bienvenue 🌟',
        'create_account_subtitle': 'Créez votre compte pour rejoindre la communauté',
        'username': "Nom d'utilisateur",
        'email': 'Email',
        'password_min': 'Mot de passe (min. 6 caractères)',
        'create_account': 'Créer mon compte',
        'already_account': 'Déjà un compte ?',
        'logout': 'Déconnexion',
        'forgot_title': 'Mot de passe oublié 🔑',
        'forgot_subtitle': 'Entrez votre email pour recevoir un lien de réinitialisation',
        'send_link': 'Envoyer le lien',
        'back_to_login': '← Retour à la connexion',
        'new_password_title': 'Nouveau mot de passe 🔐',
        'new_password_subtitle': 'Choisissez votre nouveau mot de passe',
        'new_password': 'Nouveau mot de passe (min. 6 caractères)',
        'confirm_password': 'Confirmer le mot de passe',
        'change_password': 'Changer le mot de passe',
        
        // Profil
        'my_profile': 'Mon profil',
        'followers': 'Abonnés',
        'following': 'Abonnements',
        'shared': 'partagés',
        'liked': 'likés',
        'follow': 'Suivre',
        'unfollow': 'Ne plus suivre',
        'message': 'Message',
        'extracts': 'Extraits',
        'extraits': 'extraits',
        'likes': 'Likés',
        'online': 'En ligne',
        
        // Tooltips header
        'tooltip_home': 'Accueil',
        'tooltip_random': 'Découvrir un texte au hasard',
        'tooltip_trending': 'Textes populaires',
        'tooltip_choose_lang': 'Choisir les langues',
        'tooltip_my_likes': 'Mes likés',
        'tooltip_my_collections': 'Mes collections',
        'tooltip_community': 'Communauté',
        'tooltip_messages': 'Messages',
        'tooltip_notifications': 'Notifications',
        'tooltip_change_theme': 'Changer de thème',
        'tooltip_menu': 'Menu',
        'tooltip_sources': 'Sources & Bibliothèques',
        'tooltip_view_profile': 'Voir mon profil',
        'tooltip_manage_sources': 'Gérer les sources',
        'tooltip_clear_filters': 'Effacer les filtres',
        'tooltip_reroll': 'Relancer',
        'seen_ago_min': 'Vu il y a {n} min',
        'seen_ago_hours': 'Vu il y a {n}h',
        'seen_yesterday': 'Vu hier',
        'seen_ago_days': 'Vu il y a {n} jours',
        'seen_on': 'Vu le',
        
        // Feed social
        'social_feed': '🐦 FEED COMMUNAUTAIRE',
        'trending': 'Tendances',
        'activity': 'Activité',
        'following': 'Suivis',
        'followers': 'Abonnés',
        'users': 'Utilisateurs',
        'subscriptions': '👥 Abonnements',
        'subscribers': '💌 Abonnés',
        'discover': '🔎 Découvrir',
        'live': '🟢 En direct',
        
        // Activités & Notifications
        'activity_liked_extract': 'a aimé un extrait de',
        'activity_commented_extract': 'a commenté un extrait de',
        'activity_shared_extract': 'a partagé un extrait de',
        'activity_followed': "s'est abonné à",
        'notif_liked_your_extract': 'a aimé votre extrait',
        'notif_liked_your_comment': 'a aimé votre commentaire',
        'notif_commented_your_extract': 'a commenté votre extrait',
        'notif_mentioned_you': 'vous a mentionné',
        'notif_replied_your_comment': 'a répondu à votre commentaire',
        'notif_follows_you': 'vous suit',
        'notif_sent_message': 'vous a envoyé un message',
        'notif_reacted': 'a réagi',
        'notif_to_your_content': 'à votre contenu',
        'notif_added_to_collection': 'a ajouté votre extrait à une collection',
        'notif_shared_your_extract': 'a partagé votre extrait',
        'someone': 'Quelqu\'un',
        
        // Bandeaux et messages vides
        'new_texts_loading': 'Nouveaux textes...',
        'users_to_discover': 'Utilisateurs à découvrir',
        'follow_users_hint': 'Suivez des personnes pour voir leurs extraits dans l\'onglet "Abonnements"',
        'no_activity': 'Pas d\'activité',
        'follow_for_activity': 'Suivez des personnes pour voir leur activité ici !',
        'share_for_interactions': 'Partagez des extraits pour voir qui interagit avec !',
        'be_first_to_interact': 'Soyez le premier à interagir !',
        'be_first_to_invite': 'Soyez le premier à inviter des amis !',
        'share_to_attract': 'Partagez des extraits pour attirer des lecteurs !',
        'be_first_to_share': 'Soyez le premier à partager un extrait !',
        'followed': 'Suivi',
        'follow_btn': 'Suivre',
        'activity_feed': 'Fil d\'activité',
        'follow_whats_happening': 'Suivez ce qui se passe dans la communauté',
        'your_followers': 'Vos abonnés',
        'followers_see_extracts': 'Ces personnes vous suivent et voient vos extraits',
        'follows_you_since': 'Vous suit depuis',
        'filter_all': 'Tout',
        'filter_following': 'Abonnements',
        'filter_on_my_extracts': 'Sur mes extraits',
        'filter_likes': 'Likes',
        'filter_comments': 'Commentaires',
        'extract_count': 'extrait',
        'extract_count_plural': 'extraits',
        'its_you': 'C\'est vous',
        
        // Drawer mobile
        'sources': 'Sources',
        'welcome_guest': 'Bienvenue',
        'connect_to_participate': 'Connectez-vous pour participer',
        
        // Filtres exploration
        'form': '❧ Forme',
        'era': '※ Époque',
        'register_tone': '◆ Registre',
        'all': '∞ tout',
        'free': '∞ libre',
        'poetry': 'Poésie',
        'narrative': 'Récit',
        'theater': 'Théâtre',
        'prose_ideas': "Prose d'idées",
        'sonnet': 'sonnet',
        'ode': 'ode',
        'elegy': 'élégie',
        'ballad': 'ballade',
        'hymn': 'hymne',
        'prose_poem': 'poème en prose',
        'tale': 'conte',
        'fable': 'fable',
        'legend': 'légende',
        'myth': 'mythe',
        'novel': 'roman',
        'short_story': 'nouvelle',
        'tragedy': 'tragédie',
        'comedy': 'comédie',
        'drama': 'drame',
        'essay': 'essai',
        'maxim': 'maxime',
        'aphorism': 'aphorisme',
        'speech': 'discours',
        'letter': 'lettre',
        'diary': 'journal',
        'memoirs': 'mémoires',
        'antiquity': 'Antiquité',
        'middle_ages': 'Moyen Âge',
        'xvii_xviii': 'XVIIe-XVIIIe',
        'xix_century': 'XIXe siècle',
        'xx_century': 'XXe siècle',
        'greek_antiquity': 'Grèce antique',
        'roman_antiquity': 'Rome antique',
        'renaissance': 'Renaissance',
        'baroque': 'Baroque',
        'classicism': 'Classicisme',
        'enlightenment': 'Lumières',
        'romanticism': 'Romantisme',
        'realism': 'Réalisme',
        'naturalism': 'Naturalisme',
        'symbolism': 'Symbolisme',
        'decadentism': 'Décadentisme',
        'surrealism': 'Surréalisme',
        'existentialism': 'Existentialisme',
        'absurd': 'Absurde',
        'nouveau_roman': 'Nouveau roman',
        'emotion': 'Émotion',
        'heroism': 'Héroïsme',
        'imaginary': 'Imaginaire',
        'comic': 'Comique',
        'nature': 'Nature',
        'lyric': 'lyrique',
        'elegiac': 'élégiaque',
        'melancholic': 'mélancolique',
        'tragic': 'tragique',
        'erotic': 'érotique',
        'libertine': 'libertin',
        'epic': 'épique',
        'heroic': 'héroïque',
        'chivalric': 'chevaleresque',
        'gothic': 'gothique',
        'fantastic': 'fantastique',
        'dreamlike': 'onirique',
        'mystic': 'mystique',
        'satirical': 'satirique',
        'ironic': 'ironique',
        'burlesque': 'burlesque',
        'pastoral': 'pastoral',
        'bucolic': 'bucolique',
        'contemplative': 'contemplatif',
        'free_keyword': 'Mot-clé libre…',
        'clear_filters': 'Effacer les filtres',
        'roll': 'Relancer',
        'launch': 'Lancer →',
        
        // Stats & Badges
        'your_drift': '🎲 Votre dérive',
        'texts_traversed': 'textes traversés',
        'authors': 'auteurs',
        'reading_time': 'min',
        'words': 'mots',
        'threads_to_pull': '🕸️ Fils à tirer',
        'click_to_lose': 'Cliquez pour vous perdre...',
        'badges': '🏆 Badges',
        'path': '❧ Parcours',
        
        // Lecteur
        'full_text': 'Texte complet',
        'loading': 'Chargement...',
        'searching': 'Recherche de "{term}"...',
        'loading_trends': '🔥 Chargement des tendances...',
        'loading_error': 'Erreur de chargement',
        
        // Favoris
        'my_liked': '♥ MES LIKÉS',
        'connect_to_like': 'Connectez-vous pour liker',
        
        // Recherche
        'results_for': '🔍 Résultats pour',
        'results_for_label': 'Résultats pour',
        
        // Messages
        'write_message': 'Écrire un message...',
        'select_conversation': 'Sélectionnez une conversation',
        
        // Partage
        'share_extract': '📤 Partager cet extrait',
        'add_comment': 'Ajoutez un commentaire... (optionnel)',
        'cancel': 'Annuler',
        'publish': '🚀 Publier',
        
        // Modal Likers
        'liked_by': '❤️ Aimé par',
        'shared_by': '⤴ Partagé par',
        'no_likes_yet': 'Aucun like pour le moment',
        'no_shares_yet': 'Aucun partage pour le moment',
        
        // Sources
        'libraries': '📚 Bibliothèques',
        'select_sources': 'Sélectionnez les sources utilisées pour générer le palimpseste infini.',
        'main_sources': '📚 Sources principales',
        'specialized_sources': '🏛️ Sources spécialisées',
        'apply_changes': 'Appliquer les changements',
        'wikisource_desc': 'Bibliothèque libre participative. Meilleure qualité et formatage.',
        'archive_desc': 'Scanner de livres anciens. Textes bruts (OCR parfois imparfait).',
        'gutenberg_desc': 'Classiques du domaine public.',
        'gallica_desc': 'Bibliothèque nationale de France. Textes français numérisés.',
        'perseus_desc': 'Textes classiques grecs et latins (traductions anglaises).',
        'sacredtexts_desc': 'Textes religieux et mystiques en anglais (traductions de sanskrit, hébreu, grec ancien, etc.).',
        'poetrydb_desc': 'Base de données dédiée à la poésie anglophone.',
        
        // Filtres
        'collapse_filters': 'Replier les filtres',
        'expand_filters': 'Déplier les filtres',
        
        // Notifications
        'mark_all_read': 'Tout marquer lu',
        'no_notifications': 'Aucune notification',
        
        // Actions
        'close': 'Fermer',
        'read_more': 'Lire la suite',
        'show_more': 'Voir plus',
        'show_less': 'Voir moins',
        'view_full_text': '📖 Voir le texte complet',
        'load_full_text': 'Charger le texte complet',
        'show_full_text': 'Afficher le texte complet',
        'collapse_text': 'Réduire le texte',
        'collapse': '▲ Réduire',
        'open_source': 'Ouvrir la source',
        'open': 'Ouvrir',
        'remove': 'Retirer',
        
        // Tooltips boutons
        'tooltip_like': 'J\'aime',
        'tooltip_share': 'Partager',
        'tooltip_comment': 'Commenter',
        'tooltip_add_collection': 'Ajouter à une collection',
        'tooltip_cancel_share': 'Annuler le partage',
        'tooltip_read_wikisource': 'Lire sur Wikisource',
        'tooltip_filter_tag': 'Filtrer par ce tag',
        'tooltip_explore': 'Explorer',
        'tooltip_discover_authors': 'Cliquer pour découvrir des auteurs proches',
        'tooltip_actions': 'Actions',
        'tooltip_react': 'Réagir',
        'tooltip_modify': 'Modifier',
        'tooltip_delete': 'Supprimer',
        'tooltip_sent': 'Envoyé',
        'tooltip_read': 'Lu',
        'tooltip_modified_at': 'Modifié à',
        'tooltip_explore_tree': 'Explorer l\'arborescence',
        
        // Commentaires
        'comment_singular': 'commentaire',
        'comment_plural': 'commentaires',
        'write_comment': 'Écrire un commentaire...',
        'loading_comments': 'Chargement...',
        'modified': 'Modifié',
        'modified_on': 'Modifié le',
        'no_comments_yet': 'Aucun commentaire. Soyez le premier !',
        'view_source': '🔗 Voir la source',
        
        // Tags littéraires (pour les cartes)
        'tag_poetry': 'poésie',
        'tag_novel': 'roman',
        'tag_theater': 'théâtre',
        'tag_essay': 'essai',
        'tag_tale': 'conte',
        'tag_short_story': 'nouvelle',
        'tag_fable': 'fable',
        'tag_letter': 'lettre',
        'tag_memoir': 'mémoires',
        'tag_speech': 'discours',
        
        // Boutons suivre
        'followed': '✓ Suivi',
        'follow_short': '+ Suivre',
        
        // Langues (pour le sélecteur)
        'modern_languages': 'Langues modernes',
        'ancient_languages': 'Langues anciennes',
        'all_languages_filter': 'Toutes',
        'language_all': 'Langue: Toutes',
        
        // Toast messages
        'all_languages_activated': '🌍 Toutes les langues activées',
        'language_changed': '🌐 Langue:',
        'interface_changed': '🌐 Interface en français',
        
        // Collections
        'my_collections': '❧ MES COLLECTIONS',
        'new_collection': 'Nouvelle collection',
        'no_collection_yet': 'Pas encore de collection',
        'create_collections_to_organize': 'Créez des collections pour organiser vos textes favoris par thèmes',
        'create_first_collection': 'Créer ma première collection',
        'public': 'Publique',
        'private': 'Privée',
        'texts_count': 'texte',
        'texts_count_plural': 'textes',
        'back_to_collections': '← Collections',
        'empty_collection': 'Cette collection est vide',
        'add_texts_to_collection': 'Ajoutez des textes depuis le lecteur',
        'edit': 'Modifier',
        'delete': 'Supprimer',
        'collection_name': 'Nom de la collection',
        'collection_description': 'Description (optionnel)',
        'create_collection': 'Créer la collection',
        'save_changes': 'Enregistrer',
        'delete_collection_confirm': 'Supprimer cette collection ?',
        'connect_to_see_collections': '📝 Connectez-vous pour voir vos collections',
        
        // Modals collection
        'new_collection_title': '+ Nouvelle collection',
        'edit_collection_title': 'Modifier la collection',
        'collection_name_label': 'Nom',
        'collection_name_placeholder': 'Ex: Poésie romantique',
        'collection_desc_label': 'Description (optionnel)',
        'collection_desc_placeholder': 'Une courte description...',
        'collection_emoji_label': 'Emoji',
        'collection_color_label': 'Couleur',
        'collection_public_label': 'Collection publique (visible par tous)',
        'collection_public_short': 'Collection publique',
        'enter_collection_name': '❌ Entrez un nom pour la collection',
        'loading_text': 'Chargement…',
        'text_unavailable': 'Texte non disponible.',
        'view_on_wikisource': 'Voir sur Wikisource →',
        'loading_error': 'Erreur de chargement.',
        'open_source_link': 'Ouvrir la source',
        'external_source': 'Source externe.',
        'open_in_new_tab': 'Ouvrir dans un nouvel onglet',
        'no_source_available': 'Aucune source disponible',
        'without_title': 'Sans titre',
        'unknown_author': 'Auteur inconnu',
        'show_full_text_aria': 'Afficher le texte complet',
        
        // Collection picker
        'add_to_collection': '+ Ajouter à une collection',
        'no_collection_create': 'Aucune collection. Créez-en une !',
        'texts_count': 'texte',
        'texts_count_plural': 'textes',
        'to_remove_open_collection': '💡 Pour retirer, ouvrez la collection',
        'error_creation': '❌ Erreur lors de la création',
        'error_modification': '❌ Erreur lors de la modification',
        'error_deletion': '❌ Erreur lors de la suppression',
        'error_adding': '❌ Erreur lors de l\'ajout',
        'delete_collection_prompt': 'Supprimer la collection "{name}" ?\nLes textes ne seront pas supprimés de vos favoris.',
        'connect_to_create_collection': '📝 Connectez-vous pour créer une collection',
        'collection_name_required': '❌ Le nom de la collection est requis',
        'collection_created': '✅ Collection "{name}" créée',
        'collection_updated': '✅ Collection mise à jour',
        'collection_deleted': 'Collection "{name}" supprimée',
        'connect_to_organize_collections': '📝 Connectez-vous pour organiser vos collections',
        'already_in_collection': '📌 Déjà dans cette collection',
        'added_to_collection': '📌 Ajouté à "{name}"',
        'removed_from_collection': 'Retiré de la collection',
        'confirm_remove_title': 'Retirer de la collection ?',
        'confirm_remove_message': 'Voulez-vous vraiment retirer cet extrait de la collection ?',
        'confirm': 'Confirmer',
        'extrait_not_found': '❌ Extrait introuvable',
        'extrait_in_no_collection': '📌 Cet extrait n\'est dans aucune collection',
        'connect_to_use_collections': '📝 Connectez-vous pour utiliser les collections',
        'collection_not_found': 'Collection introuvable',
        'error_opening': 'Erreur lors de l\'ouverture',
        'name_required': '❌ Le nom est requis',
        'element_not_found': 'Erreur: élément introuvable',
        'full_text_loaded': 'Texte complet chargé',

        // Share
        'share_link': '🔗 Partager le lien',
        'link_copied': '🔗 Lien copié !',
        'discover_palimpseste': 'Découvrir Palimpseste'
    },
    
    en: {
        // Navigation & Header
        'random': 'Random',
        'trending': 'Trending',
        'all_languages': 'All',
        'search_placeholder': 'Search an author, a word, a theme...',
        'my_likes': 'My likes',
        'collections': 'Collections',
        'community': 'Community',
        'messages': 'Messages',
        'notifications': 'Notifications',
        'change_theme': 'Change theme',
        'light_mode': 'Light mode',
        'dark_mode': 'Dark mode',
        
        // Authentification
        'welcome_back': 'Welcome back 📚',
        'connect_to_share': 'Sign in to share your extracts',
        'email_or_username': 'Email or username',
        'password': 'Password',
        'forgot_password': 'Forgot password?',
        'login': 'Sign in',
        'or': 'or',
        'continue_google': '🌐 Continue with Google',
        'no_account': "Don't have an account?",
        'register': 'Sign up',
        'welcome': 'Welcome 🌟',
        'create_account_subtitle': 'Create your account to join the community',
        'username': 'Username',
        'email': 'Email',
        'password_min': 'Password (min. 6 characters)',
        'create_account': 'Create my account',
        'already_account': 'Already have an account?',
        'logout': 'Logout',
        'forgot_title': 'Forgot password 🔑',
        'forgot_subtitle': 'Enter your email to receive a reset link',
        'send_link': 'Send link',
        'back_to_login': '← Back to login',
        'new_password_title': 'New password 🔐',
        'new_password_subtitle': 'Choose your new password',
        'new_password': 'New password (min. 6 characters)',
        'confirm_password': 'Confirm password',
        'change_password': 'Change password',
        
        // Profil
        'my_profile': 'My profile',
        'followers': 'Followers',
        'following': 'Following',
        'shared': 'shared',
        'liked': 'liked',
        'follow': 'Follow',
        'unfollow': 'Unfollow',
        'message': 'Message',
        'extracts': 'Extracts',
        'extraits': 'extracts',
        'likes': 'Liked',
        'online': 'Online',
        
        // Tooltips header
        'tooltip_home': 'Home',
        'tooltip_random': 'Discover a random text',
        'tooltip_trending': 'Popular texts',
        'tooltip_choose_lang': 'Choose languages',
        'tooltip_my_likes': 'My likes',
        'tooltip_my_collections': 'My collections',
        'tooltip_community': 'Community',
        'tooltip_messages': 'Messages',
        'tooltip_notifications': 'Notifications',
        'tooltip_change_theme': 'Change theme',
        'tooltip_menu': 'Menu',
        'tooltip_sources': 'Sources & Libraries',
        'tooltip_view_profile': 'View my profile',
        'tooltip_manage_sources': 'Manage sources',
        'tooltip_clear_filters': 'Clear filters',
        'tooltip_reroll': 'Reroll',
        'seen_ago_min': 'Seen {n} min ago',
        'seen_ago_hours': 'Seen {n}h ago',
        'seen_yesterday': 'Seen yesterday',
        'seen_ago_days': 'Seen {n} days ago',
        'seen_on': 'Seen on',
        
        // Feed social
        'social_feed': '🐦 COMMUNITY FEED',
        'trending': 'Trending',
        'activity': 'Activity',
        'following': 'Following',
        'followers': 'Followers',
        'users': 'Users',
        'subscriptions': '👥 Following',
        'subscribers': '💌 Followers',
        'discover': '🔎 Discover',
        'live': '🟢 Live',
        
        // Activities & Notifications
        'activity_liked_extract': 'liked an extract from',
        'activity_commented_extract': 'commented on an extract from',
        'activity_shared_extract': 'shared an extract from',
        'activity_followed': 'followed',
        'notif_liked_your_extract': 'liked your extract',
        'notif_liked_your_comment': 'liked your comment',
        'notif_commented_your_extract': 'commented on your extract',
        'notif_mentioned_you': 'mentioned you',
        'notif_replied_your_comment': 'replied to your comment',
        'notif_follows_you': 'follows you',
        'notif_sent_message': 'sent you a message',
        'notif_reacted': 'reacted',
        'notif_to_your_content': 'to your content',
        'notif_added_to_collection': 'added your extract to a collection',
        'notif_shared_your_extract': 'shared your extract',
        'someone': 'Someone',
        
        // Banners and empty messages
        'new_texts_loading': 'New texts...',
        'users_to_discover': 'Users to discover',
        'follow_users_hint': 'Follow people to see their extracts in the "Following" tab',
        'no_activity': 'No activity',
        'follow_for_activity': 'Follow people to see their activity here!',
        'share_for_interactions': 'Share extracts to see who interacts with them!',
        'be_first_to_interact': 'Be the first to interact!',
        'be_first_to_invite': 'Be the first to invite friends!',
        'share_to_attract': 'Share extracts to attract readers!',
        'be_first_to_share': 'Be the first to share an extract!',
        'followed': 'Following',
        'follow_btn': 'Follow',
        'activity_feed': 'Activity feed',
        'follow_whats_happening': 'Follow what\'s happening in the community',
        'your_followers': 'Your followers',
        'followers_see_extracts': 'These people follow you and see your extracts',
        'follows_you_since': 'Follows you since',
        'filter_all': 'All',
        'filter_following': 'Following',
        'filter_on_my_extracts': 'On my extracts',
        'filter_likes': 'Likes',
        'filter_comments': 'Comments',
        'extract_count': 'extract',
        'extract_count_plural': 'extracts',
        'its_you': 'It\'s you',
        
        // Drawer mobile
        'sources': 'Sources',
        'welcome_guest': 'Welcome',
        'connect_to_participate': 'Sign in to participate',
        
        // Filtres exploration
        'form': '❧ Form',
        'era': '※ Era',
        'register_tone': '◆ Register',
        'all': '∞ all',
        'free': '∞ free',
        'poetry': 'Poetry',
        'narrative': 'Narrative',
        'theater': 'Theater',
        'prose_ideas': 'Prose of ideas',
        'sonnet': 'sonnet',
        'ode': 'ode',
        'elegy': 'elegy',
        'ballad': 'ballad',
        'hymn': 'hymn',
        'prose_poem': 'prose poem',
        'tale': 'tale',
        'fable': 'fable',
        'legend': 'legend',
        'myth': 'myth',
        'novel': 'novel',
        'short_story': 'short story',
        'tragedy': 'tragedy',
        'comedy': 'comedy',
        'drama': 'drama',
        'essay': 'essay',
        'maxim': 'maxim',
        'aphorism': 'aphorism',
        'speech': 'speech',
        'letter': 'letter',
        'diary': 'diary',
        'memoirs': 'memoirs',
        'antiquity': 'Antiquity',
        'middle_ages': 'Middle Ages',
        'xvii_xviii': '17th-18th c.',
        'xix_century': '19th century',
        'xx_century': '20th century',
        'greek_antiquity': 'Greek antiquity',
        'roman_antiquity': 'Roman antiquity',
        'renaissance': 'Renaissance',
        'baroque': 'Baroque',
        'classicism': 'Classicism',
        'enlightenment': 'Enlightenment',
        'romanticism': 'Romanticism',
        'realism': 'Realism',
        'naturalism': 'Naturalism',
        'symbolism': 'Symbolism',
        'decadentism': 'Decadentism',
        'surrealism': 'Surrealism',
        'existentialism': 'Existentialism',
        'absurd': 'Absurd',
        'nouveau_roman': 'Nouveau roman',
        'emotion': 'Emotion',
        'heroism': 'Heroism',
        'imaginary': 'Imaginary',
        'comic': 'Comic',
        'nature': 'Nature',
        'lyric': 'lyric',
        'elegiac': 'elegiac',
        'melancholic': 'melancholic',
        'tragic': 'tragic',
        'erotic': 'erotic',
        'libertine': 'libertine',
        'epic': 'epic',
        'heroic': 'heroic',
        'chivalric': 'chivalric',
        'gothic': 'gothic',
        'fantastic': 'fantastic',
        'dreamlike': 'dreamlike',
        'mystic': 'mystic',
        'satirical': 'satirical',
        'ironic': 'ironic',
        'burlesque': 'burlesque',
        'pastoral': 'pastoral',
        'bucolic': 'bucolic',
        'contemplative': 'contemplative',
        'free_keyword': 'Free keyword…',
        'clear_filters': 'Clear filters',
        'roll': 'Reroll',
        'launch': 'Launch →',
        
        // Stats & Badges
        'your_drift': '🎲 Your drift',
        'texts_traversed': 'texts traversed',
        'authors': 'authors',
        'reading_time': 'min',
        'words': 'words',
        'threads_to_pull': '🕸️ Threads to pull',
        'click_to_lose': 'Click to get lost...',
        'badges': '🏆 Badges',
        'path': '❧ Path',
        
        // Lecteur
        'full_text': 'Full text',
        'loading': 'Loading...',
        'searching': 'Searching "{term}"...',
        'loading_trends': '🔥 Loading trends...',
        'loading_error': 'Loading error',
        
        // Favoris
        'my_liked': '♥ MY LIKES',
        'connect_to_like': 'Sign in to like',
        
        // Recherche
        'results_for': '🔍 Results for',
        'results_for_label': 'Results for',
        
        // Messages
        'write_message': 'Write a message...',
        'select_conversation': 'Select a conversation',
        
        // Partage
        'share_extract': '📤 Share this extract',
        'add_comment': 'Add a comment... (optional)',
        'cancel': 'Cancel',
        'publish': '🚀 Publish',
        
        // Modal Likers
        'liked_by': '❤️ Liked by',
        'shared_by': '⤴ Shared by',
        'no_likes_yet': 'No likes yet',
        'no_shares_yet': 'No shares yet',
        
        // Sources
        'libraries': '📚 Libraries',
        'select_sources': 'Select the sources used to generate the infinite palimpsest.',
        'main_sources': '📚 Main sources',
        'specialized_sources': '🏛️ Specialized sources',
        'apply_changes': 'Apply changes',
        'wikisource_desc': 'Free collaborative library. Best quality and formatting.',
        'archive_desc': 'Old book scanner. Raw texts (sometimes imperfect OCR).',
        'gutenberg_desc': 'Public domain classics.',
        'gallica_desc': 'National Library of France. Digitized French texts.',
        'perseus_desc': 'Classical Greek and Latin texts (English translations).',
        'sacredtexts_desc': 'Religious and mystical texts in English (translations from Sanskrit, Hebrew, Ancient Greek, etc.).',
        'poetrydb_desc': 'Database dedicated to English-language poetry.',
        
        // Filters
        'collapse_filters': 'Collapse filters',
        'expand_filters': 'Expand filters',
        
        // Notifications
        'mark_all_read': 'Mark all as read',
        'no_notifications': 'No notifications',
        
        // Actions
        'close': 'Close',
        'read_more': 'Read more',
        'show_more': 'Show more',
        'show_less': 'Show less',
        'view_full_text': '📖 View full text',
        'load_full_text': 'Load full text',
        'show_full_text': 'Show full text',
        'collapse_text': 'Collapse text',
        'collapse': '▲ Collapse',
        'open_source': 'Open source',
        'open': 'Open',
        'remove': 'Remove',
        
        // Tooltips buttons
        'tooltip_like': 'Like',
        'tooltip_share': 'Share',
        'tooltip_comment': 'Comment',
        'tooltip_add_collection': 'Add to collection',
        'tooltip_cancel_share': 'Cancel share',
        'tooltip_read_wikisource': 'Read on Wikisource',
        'tooltip_filter_tag': 'Filter by this tag',
        'tooltip_explore': 'Explore',
        'tooltip_discover_authors': 'Click to discover related authors',
        'tooltip_actions': 'Actions',
        'tooltip_react': 'React',
        'tooltip_modify': 'Edit',
        'tooltip_delete': 'Delete',
        'tooltip_sent': 'Sent',
        'tooltip_read': 'Read',
        'tooltip_modified_at': 'Modified at',
        'tooltip_explore_tree': 'Explore tree',
        
        // Comments
        'comment_singular': 'comment',
        'comment_plural': 'comments',
        'write_comment': 'Write a comment...',
        'loading_comments': 'Loading...',
        'modified': 'Modified',
        'modified_on': 'Modified on',
        'no_comments_yet': 'No comments yet. Be the first!',
        'view_source': '🔗 View source',
        
        // Literary tags (for cards)
        'tag_poetry': 'poetry',
        'tag_novel': 'novel',
        'tag_theater': 'theater',
        'tag_essay': 'essay',
        'tag_tale': 'tale',
        'tag_short_story': 'short story',
        'tag_fable': 'fable',
        'tag_letter': 'letter',
        'tag_memoir': 'memoirs',
        'tag_speech': 'speech',
        
        // Follow buttons
        'followed': '✓ Following',
        'follow_short': '+ Follow',
        
        // Langues (pour le sélecteur)
        'modern_languages': 'Modern languages',
        'ancient_languages': 'Ancient languages',
        'all_languages_filter': 'All',
        'language_all': 'Language: All',
        
        // Toast messages
        'all_languages_activated': '🌍 All languages activated',
        'language_changed': '🌐 Language:',
        'interface_changed': '🌐 Interface in English',
        
        // Collections
        'my_collections': '❧ MY COLLECTIONS',
        'new_collection': 'New collection',
        'no_collection_yet': 'No collection yet',
        'create_collections_to_organize': 'Create collections to organize your favorite texts by themes',
        'create_first_collection': 'Create my first collection',
        'public': 'Public',
        'private': 'Private',
        'texts_count': 'text',
        'texts_count_plural': 'texts',
        'back_to_collections': '← Collections',
        'empty_collection': 'This collection is empty',
        'add_texts_to_collection': 'Add texts from the reader',
        'edit': 'Edit',
        'delete': 'Delete',
        'collection_name': 'Collection name',
        'collection_description': 'Description (optional)',
        'create_collection': 'Create collection',
        'save_changes': 'Save',
        'delete_collection_confirm': 'Delete this collection?',
        'connect_to_see_collections': '📝 Sign in to see your collections',
        
        // Modals collection
        'new_collection_title': '+ New collection',
        'edit_collection_title': 'Edit collection',
        'collection_name_label': 'Name',
        'collection_name_placeholder': 'E.g.: Romantic poetry',
        'collection_desc_label': 'Description (optional)',
        'collection_desc_placeholder': 'A short description...',
        'collection_emoji_label': 'Emoji',
        'collection_color_label': 'Color',
        'collection_public_label': 'Public collection (visible to everyone)',
        'collection_public_short': 'Public collection',
        'enter_collection_name': '❌ Enter a name for the collection',
        'loading_text': 'Loading…',
        'text_unavailable': 'Text unavailable.',
        'view_on_wikisource': 'View on Wikisource →',
        'loading_error': 'Loading error.',
        'open_source_link': 'Open source',
        'external_source': 'External source.',
        'open_in_new_tab': 'Open in a new tab',
        'no_source_available': 'No source available',
        'without_title': 'Untitled',
        'unknown_author': 'Unknown author',
        'show_full_text_aria': 'Show full text',
        
        // Collection picker
        'add_to_collection': '+ Add to collection',
        'no_collection_create': 'No collection. Create one!',
        'texts_count': 'text',
        'texts_count_plural': 'texts',
        'to_remove_open_collection': '💡 To remove, open the collection',
        'error_creation': '❌ Error during creation',
        'error_modification': '❌ Error during modification',
        'error_deletion': '❌ Error during deletion',
        'error_adding': '❌ Error while adding',
        'delete_collection_prompt': 'Delete collection "{name}"?\nTexts will not be removed from your favorites.',
        'connect_to_create_collection': '📝 Sign in to create a collection',
        'collection_name_required': '❌ Collection name is required',
        'collection_created': '✅ Collection "{name}" created',
        'collection_updated': '✅ Collection updated',
        'collection_deleted': 'Collection "{name}" deleted',
        'connect_to_organize_collections': '📝 Sign in to organize your collections',
        'already_in_collection': '📌 Already in this collection',
        'added_to_collection': '📌 Added to "{name}"',
        'removed_from_collection': 'Removed from collection',
        'confirm_remove_title': 'Remove from collection?',
        'confirm_remove_message': 'Do you really want to remove this excerpt from the collection?',
        'confirm': 'Confirm',
        'extrait_not_found': '❌ Excerpt not found',
        'extrait_in_no_collection': '📌 This excerpt is not in any collection',
        'connect_to_use_collections': '📝 Sign in to use collections',
        'collection_not_found': 'Collection not found',
        'error_opening': 'Error opening',
        'name_required': '❌ Name is required',
        'element_not_found': 'Error: element not found',
        'full_text_loaded': 'Full text loaded',

        // Share
        'share_link': '🔗 Share link',
        'link_copied': '🔗 Link copied!',
        'discover_palimpseste': 'Discover Palimpseste'
    },
    
    de: {
        // Navigation & Header
        'random': 'Zufall',
        'trending': 'Trends',
        'all_languages': 'Alle',
        'search_placeholder': 'Suche nach Autor, Wort, Thema...',
        'my_likes': 'Meine Likes',
        'collections': 'Sammlungen',
        'community': 'Gemeinschaft',
        'messages': 'Nachrichten',
        'notifications': 'Benachrichtigungen',
        'change_theme': 'Design ändern',
        'light_mode': 'Heller Modus',
        'dark_mode': 'Dunkler Modus',
        
        // Authentification
        'welcome_back': 'Willkommen zurück 📚',
        'connect_to_share': 'Melden Sie sich an, um Ihre Auszüge zu teilen',
        'email_or_username': 'E-Mail oder Benutzername',
        'password': 'Passwort',
        'forgot_password': 'Passwort vergessen?',
        'login': 'Anmelden',
        'or': 'oder',
        'continue_google': '🌐 Mit Google fortfahren',
        'no_account': 'Noch kein Konto?',
        'register': 'Registrieren',
        'welcome': 'Willkommen 🌟',
        'create_account_subtitle': 'Erstellen Sie Ihr Konto, um der Community beizutreten',
        'username': 'Benutzername',
        'email': 'E-Mail',
        'password_min': 'Passwort (min. 6 Zeichen)',
        'create_account': 'Konto erstellen',
        'already_account': 'Bereits ein Konto?',
        'logout': 'Abmelden',
        'forgot_title': 'Passwort vergessen 🔑',
        'forgot_subtitle': 'Geben Sie Ihre E-Mail ein, um einen Link zum Zurücksetzen zu erhalten',
        'send_link': 'Link senden',
        'back_to_login': '← Zurück zur Anmeldung',
        'new_password_title': 'Neues Passwort 🔐',
        'new_password_subtitle': 'Wählen Sie Ihr neues Passwort',
        'new_password': 'Neues Passwort (min. 6 Zeichen)',
        'confirm_password': 'Passwort bestätigen',
        'change_password': 'Passwort ändern',
        
        // Profil
        'my_profile': 'Mein Profil',
        'followers': 'Follower',
        'following': 'Folge ich',
        'shared': 'geteilt',
        'liked': 'geliked',
        'follow': 'Folgen',
        'unfollow': 'Entfolgen',
        'message': 'Nachricht',
        'extracts': 'Auszüge',
        'extraits': 'Auszüge',
        'likes': 'Geliked',
        'online': 'Online',
        'seen_ago_min': 'Vor {n} Min gesehen',
        'seen_ago_hours': 'Vor {n}h gesehen',
        'seen_yesterday': 'Gestern gesehen',
        'seen_ago_days': 'Vor {n} Tagen gesehen',
        'seen_on': 'Gesehen am',
        
        // Feed social
        'social_feed': '🐦 COMMUNITY-FEED',
        'activity': '❤️ Aktivität',
        'subscriptions': '👥 Abonnements',
        'subscribers': '💌 Follower',
        'discover': '🔎 Entdecken',
        'live': '🟢 Live',
        
        // Aktivitäten & Benachrichtigungen
        'activity_liked_extract': 'hat einen Auszug von',
        'activity_commented_extract': 'hat einen Auszug von',
        'activity_shared_extract': 'hat einen Auszug von',
        'activity_followed': 'folgt jetzt',
        'notif_liked_your_extract': 'hat Ihren Auszug geliked',
        'notif_liked_your_comment': 'hat Ihren Kommentar geliked',
        'notif_commented_your_extract': 'hat Ihren Auszug kommentiert',
        'notif_mentioned_you': 'hat Sie erwähnt',
        'notif_replied_your_comment': 'hat auf Ihren Kommentar geantwortet',
        'notif_follows_you': 'folgt Ihnen',
        'notif_sent_message': 'hat Ihnen eine Nachricht gesendet',
        'notif_reacted': 'hat reagiert',
        'notif_to_your_content': 'auf Ihren Inhalt',
        'notif_added_to_collection': 'hat Ihren Auszug zu einer Sammlung hinzugefügt',
        'notif_shared_your_extract': 'hat Ihren Auszug geteilt',
        'someone': 'Jemand',
        
        // Banner und leere Nachrichten
        'new_texts_loading': 'Neue Texte...',
        'users_to_discover': 'Benutzer entdecken',
        'follow_users_hint': 'Folgen Sie Personen, um ihre Auszüge im Tab "Abonnements" zu sehen',
        'no_activity': 'Keine Aktivität',
        'follow_for_activity': 'Folgen Sie Personen, um ihre Aktivität hier zu sehen!',
        'share_for_interactions': 'Teilen Sie Auszüge, um zu sehen, wer damit interagiert!',
        'be_first_to_interact': 'Seien Sie der Erste, der interagiert!',
        'be_first_to_invite': 'Seien Sie der Erste, der Freunde einlädt!',
        'share_to_attract': 'Teilen Sie Auszüge, um Leser anzuziehen!',
        'be_first_to_share': 'Seien Sie der Erste, der einen Auszug teilt!',
        'followed': 'Gefolgt',
        'follow_btn': 'Folgen',
        'activity_feed': 'Aktivitätsfeed',
        'follow_whats_happening': 'Verfolgen Sie, was in der Community passiert',
        'your_followers': 'Ihre Follower',
        'followers_see_extracts': 'Diese Personen folgen Ihnen und sehen Ihre Auszüge',
        'follows_you_since': 'Folgt Ihnen seit',
        'filter_all': 'Alle',
        'filter_following': 'Abonnements',
        'filter_on_my_extracts': 'Auf meinen Auszügen',
        'filter_likes': 'Likes',
        'filter_comments': 'Kommentare',
        'extract_count': 'Auszug',
        'extract_count_plural': 'Auszüge',
        'its_you': 'Das sind Sie',
        
        // Drawer mobile
        'sources': 'Quellen',
        'welcome_guest': 'Willkommen',
        'connect_to_participate': 'Anmelden zum Teilnehmen',
        
        // Filtres exploration
        'form': '❧ Form',
        'era': '※ Epoche',
        'register_tone': '◆ Register',
        'all': '∞ alle',
        'free': '∞ frei',
        'poetry': 'Poesie',
        'narrative': 'Erzählung',
        'theater': 'Theater',
        'prose_ideas': 'Ideenprosa',
        'sonnet': 'Sonett',
        'ode': 'Ode',
        'elegy': 'Elegie',
        'ballad': 'Ballade',
        'hymn': 'Hymne',
        'prose_poem': 'Prosagedicht',
        'tale': 'Märchen',
        'fable': 'Fabel',
        'legend': 'Legende',
        'myth': 'Mythos',
        'novel': 'Roman',
        'short_story': 'Kurzgeschichte',
        'tragedy': 'Tragödie',
        'comedy': 'Komödie',
        'drama': 'Drama',
        'essay': 'Essay',
        'maxim': 'Maxime',
        'aphorism': 'Aphorismus',
        'speech': 'Rede',
        'letter': 'Brief',
        'diary': 'Tagebuch',
        'memoirs': 'Memoiren',
        'antiquity': 'Antike',
        'middle_ages': 'Mittelalter',
        'xvii_xviii': '17.-18. Jh.',
        'xix_century': '19. Jahrhundert',
        'xx_century': '20. Jahrhundert',
        'greek_antiquity': 'Griechische Antike',
        'roman_antiquity': 'Römische Antike',
        'renaissance': 'Renaissance',
        'baroque': 'Barock',
        'classicism': 'Klassizismus',
        'enlightenment': 'Aufklärung',
        'romanticism': 'Romantik',
        'realism': 'Realismus',
        'naturalism': 'Naturalismus',
        'symbolism': 'Symbolismus',
        'decadentism': 'Dekadenz',
        'surrealism': 'Surrealismus',
        'existentialism': 'Existenzialismus',
        'absurd': 'Absurd',
        'nouveau_roman': 'Nouveau roman',
        'emotion': 'Emotion',
        'heroism': 'Heldentum',
        'imaginary': 'Imaginär',
        'comic': 'Komisch',
        'nature': 'Natur',
        'lyric': 'lyrisch',
        'elegiac': 'elegisch',
        'melancholic': 'melancholisch',
        'tragic': 'tragisch',
        'erotic': 'erotisch',
        'libertine': 'libertinär',
        'epic': 'episch',
        'heroic': 'heroisch',
        'chivalric': 'ritterlich',
        'gothic': 'gotisch',
        'fantastic': 'fantastisch',
        'dreamlike': 'traumhaft',
        'mystic': 'mystisch',
        'satirical': 'satirisch',
        'ironic': 'ironisch',
        'burlesque': 'burlesk',
        'pastoral': 'pastoral',
        'bucolic': 'bukolisch',
        'contemplative': 'kontemplativ',
        'free_keyword': 'Freies Stichwort…',
        'clear_filters': 'Filter löschen',
        'roll': 'Neu würfeln',
        'launch': 'Starten →',
        
        // Stats & Badges
        'your_drift': '🎲 Ihre Drift',
        'texts_traversed': 'Texte durchquert',
        'authors': 'Autoren',
        'reading_time': 'Min',
        'words': 'Wörter',
        'threads_to_pull': '🕸️ Fäden zum Ziehen',
        'click_to_lose': 'Klicken zum Verirren...',
        'badges': '🏆 Abzeichen',
        'path': '❧ Weg',
        
        // Lecteur
        'full_text': 'Volltext',
        'loading': 'Laden...',
        'searching': 'Suche nach "{term}"...',
        'loading_trends': '🔥 Trends laden...',
        'loading_error': 'Ladefehler',
        
        // Favoris
        'my_liked': '♥ MEINE LIKES',
        'connect_to_like': 'Anmelden zum Liken',
        
        // Recherche
        'results_for': '🔍 Ergebnisse für',
        'results_for_label': 'Ergebnisse für',
        
        // Messages
        'write_message': 'Nachricht schreiben...',
        'select_conversation': 'Konversation auswählen',
        
        // Partage
        'share_extract': '📤 Diesen Auszug teilen',
        'add_comment': 'Kommentar hinzufügen... (optional)',
        'cancel': 'Abbrechen',
        'confirm': 'Bestätigen',
        'publish': '🚀 Veröffentlichen',
        
        // Modal Likers
        'liked_by': '❤️ Geliked von',
        'shared_by': '⤴ Geteilt von',
        'no_likes_yet': 'Noch keine Likes',
        'no_shares_yet': 'Noch keine Shares',
        
        // Sources
        'libraries': '📚 Bibliotheken',
        'select_sources': 'Wählen Sie die Quellen aus, die zur Generierung des unendlichen Palimpsests verwendet werden.',
        'main_sources': '📚 Hauptquellen',
        'specialized_sources': '🏛️ Spezialisierte Quellen',
        'apply_changes': 'Änderungen anwenden',
        
        // Notifications
        'mark_all_read': 'Alle als gelesen markieren',
        'no_notifications': 'Keine Benachrichtigungen',
        
        // Actions
        'close': 'Schließen',
        'read_more': 'Mehr lesen',
        'show_more': 'Mehr anzeigen',
        'show_less': 'Weniger anzeigen',
        
        // Langues
        'modern_languages': 'Moderne Sprachen',
        'ancient_languages': 'Alte Sprachen',
        'all_languages_filter': 'Alle',
        'language_all': 'Sprache: Alle',
        
        // Toast messages
        'all_languages_activated': '🌍 Alle Sprachen aktiviert',
        'language_changed': '🌐 Sprache:',
        'interface_changed': '🌐 Oberfläche auf Deutsch',

        // Share
        'share_link': '🔗 Link teilen',
        'link_copied': '🔗 Link kopiert!',
        'discover_palimpseste': 'Palimpseste entdecken'
    },
    
    es: {
        // Navigation & Header
        'random': 'Azar',
        'trending': 'Tendencias',
        'all_languages': 'Todos',
        'search_placeholder': 'Buscar un autor, una palabra, un tema...',
        'my_likes': 'Mis favoritos',
        'collections': 'Colecciones',
        'community': 'Comunidad',
        'messages': 'Mensajes',
        'notifications': 'Notificaciones',
        'change_theme': 'Cambiar tema',
        'light_mode': 'Modo claro',
        'dark_mode': 'Modo oscuro',
        
        // Authentification
        'welcome_back': 'Bienvenido de nuevo 📚',
        'connect_to_share': 'Inicia sesión para compartir tus extractos',
        'email_or_username': 'Email o usuario',
        'password': 'Contraseña',
        'forgot_password': '¿Olvidaste tu contraseña?',
        'login': 'Iniciar sesión',
        'or': 'o',
        'continue_google': '🌐 Continuar con Google',
        'no_account': '¿No tienes cuenta?',
        'register': 'Registrarse',
        'welcome': 'Bienvenido 🌟',
        'create_account_subtitle': 'Crea tu cuenta para unirte a la comunidad',
        'username': 'Nombre de usuario',
        'email': 'Email',
        'password_min': 'Contraseña (mín. 6 caracteres)',
        'create_account': 'Crear mi cuenta',
        'already_account': '¿Ya tienes cuenta?',
        'logout': 'Cerrar sesión',
        'forgot_title': 'Contraseña olvidada 🔑',
        'forgot_subtitle': 'Introduce tu email para recibir un enlace de restablecimiento',
        'send_link': 'Enviar enlace',
        'back_to_login': '← Volver al inicio de sesión',
        'new_password_title': 'Nueva contraseña 🔐',
        'new_password_subtitle': 'Elige tu nueva contraseña',
        'new_password': 'Nueva contraseña (mín. 6 caracteres)',
        'confirm_password': 'Confirmar contraseña',
        'change_password': 'Cambiar contraseña',
        
        // Profil
        'my_profile': 'Mi perfil',
        'followers': 'seguidores',
        'following': 'siguiendo',
        'shared': 'compartidos',
        'liked': 'favoritos',
        'follow': 'Seguir',
        'unfollow': 'Dejar de seguir',
        'message': 'Mensaje',
        'extracts': 'Extractos',
        'extraits': 'extractos',
        'likes': 'Favoritos',
        'online': 'En línea',
        'seen_ago_min': 'Visto hace {n} min',
        'seen_ago_hours': 'Visto hace {n}h',
        'seen_yesterday': 'Visto ayer',
        'seen_ago_days': 'Visto hace {n} días',
        'seen_on': 'Visto el',
        
        // Feed social
        'social_feed': '🐦 FEED COMUNITARIO',
        'activity': '❤️ Actividad',
        'subscriptions': '👥 Siguiendo',
        'subscribers': '💌 Seguidores',
        'discover': '🔎 Descubrir',
        'live': '🟢 En directo',
        
        // Actividades & Notificaciones
        'activity_liked_extract': 'le gustó un extracto de',
        'activity_commented_extract': 'comentó un extracto de',
        'activity_shared_extract': 'compartió un extracto de',
        'activity_followed': 'siguió a',
        'notif_liked_your_extract': 'le gustó tu extracto',
        'notif_liked_your_comment': 'le gustó tu comentario',
        'notif_commented_your_extract': 'comentó tu extracto',
        'notif_mentioned_you': 'te mencionó',
        'notif_replied_your_comment': 'respondió a tu comentario',
        'notif_follows_you': 'te sigue',
        'notif_sent_message': 'te envió un mensaje',
        'notif_reacted': 'reaccionó',
        'notif_to_your_content': 'a tu contenido',
        'notif_added_to_collection': 'añadió tu extracto a una colección',
        'notif_shared_your_extract': 'compartió tu extracto',
        'someone': 'Alguien',
        
        // Banners y mensajes vacíos
        'new_texts_loading': 'Nuevos textos...',
        'users_to_discover': 'Usuarios por descubrir',
        'follow_users_hint': 'Sigue a personas para ver sus extractos en la pestaña "Siguiendo"',
        'no_activity': 'Sin actividad',
        'follow_for_activity': '¡Sigue a personas para ver su actividad aquí!',
        'share_for_interactions': '¡Comparte extractos para ver quién interactúa!',
        'be_first_to_interact': '¡Sé el primero en interactuar!',
        'be_first_to_invite': '¡Sé el primero en invitar amigos!',
        'share_to_attract': '¡Comparte extractos para atraer lectores!',
        'be_first_to_share': '¡Sé el primero en compartir un extracto!',
        'followed': 'Siguiendo',
        'follow_btn': 'Seguir',
        'activity_feed': 'Feed de actividad',
        'follow_whats_happening': 'Sigue lo que pasa en la comunidad',
        'your_followers': 'Tus seguidores',
        'followers_see_extracts': 'Estas personas te siguen y ven tus extractos',
        'follows_you_since': 'Te sigue desde',
        'filter_all': 'Todo',
        'filter_following': 'Siguiendo',
        'filter_on_my_extracts': 'En mis extractos',
        'filter_likes': 'Me gusta',
        'filter_comments': 'Comentarios',
        'extract_count': 'extracto',
        'extract_count_plural': 'extractos',
        'its_you': 'Eres tú',
        
        // Drawer mobile
        'sources': 'Fuentes',
        'welcome_guest': 'Bienvenido',
        'connect_to_participate': 'Inicia sesión para participar',
        
        // Filtres exploration
        'form': '❧ Forma',
        'era': '※ Época',
        'register_tone': '◆ Registro',
        'all': '∞ todo',
        'free': '∞ libre',
        'poetry': 'Poesía',
        'narrative': 'Narración',
        'theater': 'Teatro',
        'prose_ideas': 'Prosa de ideas',
        'sonnet': 'soneto',
        'ode': 'oda',
        'elegy': 'elegía',
        'ballad': 'balada',
        'hymn': 'himno',
        'prose_poem': 'poema en prosa',
        'tale': 'cuento',
        'fable': 'fábula',
        'legend': 'leyenda',
        'myth': 'mito',
        'novel': 'novela',
        'short_story': 'relato corto',
        'tragedy': 'tragedia',
        'comedy': 'comedia',
        'drama': 'drama',
        'essay': 'ensayo',
        'maxim': 'máxima',
        'aphorism': 'aforismo',
        'speech': 'discurso',
        'letter': 'carta',
        'diary': 'diario',
        'memoirs': 'memorias',
        'antiquity': 'Antigüedad',
        'middle_ages': 'Edad Media',
        'xvii_xviii': 'Siglos XVII-XVIII',
        'xix_century': 'Siglo XIX',
        'xx_century': 'Siglo XX',
        'greek_antiquity': 'Antigüedad griega',
        'roman_antiquity': 'Antigüedad romana',
        'renaissance': 'Renacimiento',
        'baroque': 'Barroco',
        'classicism': 'Clasicismo',
        'enlightenment': 'Ilustración',
        'romanticism': 'Romanticismo',
        'realism': 'Realismo',
        'naturalism': 'Naturalismo',
        'symbolism': 'Simbolismo',
        'decadentism': 'Decadentismo',
        'surrealism': 'Surrealismo',
        'existentialism': 'Existencialismo',
        'absurd': 'Absurdo',
        'nouveau_roman': 'Nouveau roman',
        'emotion': 'Emoción',
        'heroism': 'Heroísmo',
        'imaginary': 'Imaginario',
        'comic': 'Cómico',
        'nature': 'Naturaleza',
        'lyric': 'lírico',
        'elegiac': 'elegíaco',
        'melancholic': 'melancólico',
        'tragic': 'trágico',
        'erotic': 'erótico',
        'libertine': 'libertino',
        'epic': 'épico',
        'heroic': 'heroico',
        'chivalric': 'caballeresco',
        'gothic': 'gótico',
        'fantastic': 'fantástico',
        'dreamlike': 'onírico',
        'mystic': 'místico',
        'satirical': 'satírico',
        'ironic': 'irónico',
        'burlesque': 'burlesco',
        'pastoral': 'pastoral',
        'bucolic': 'bucólico',
        'contemplative': 'contemplativo',
        'free_keyword': 'Palabra clave libre…',
        'clear_filters': 'Borrar filtros',
        'roll': 'Relanzar',
        'launch': 'Lanzar →',
        
        // Stats & Badges
        'your_drift': '🎲 Tu deriva',
        'texts_traversed': 'textos recorridos',
        'authors': 'autores',
        'reading_time': 'min',
        'words': 'palabras',
        'threads_to_pull': '🕸️ Hilos por tirar',
        'click_to_lose': 'Haz clic para perderte...',
        'badges': '🏆 Insignias',
        'path': '❧ Recorrido',
        
        // Lecteur
        'full_text': 'Texto completo',
        'loading': 'Cargando...',
        'searching': 'Buscando "{term}"...',
        'loading_trends': '🔥 Cargando tendencias...',
        'loading_error': 'Error de carga',
        
        // Favoris
        'my_liked': '♥ MIS FAVORITOS',
        'connect_to_like': 'Inicia sesión para dar like',
        
        // Recherche
        'results_for': '🔍 Resultados para',
        'results_for_label': 'Resultados para',
        
        // Messages
        'write_message': 'Escribe un mensaje...',
        'select_conversation': 'Selecciona una conversación',
        
        // Partage
        'share_extract': '📤 Compartir este extracto',
        'add_comment': 'Añade un comentario... (opcional)',
        'cancel': 'Cancelar',
        'confirm': 'Confirmar',
        'publish': '🚀 Publicar',
        
        // Modal Likers
        'liked_by': '❤️ Le gusta a',
        'shared_by': '⤴ Compartido por',
        'no_likes_yet': 'Ningún like aún',
        'no_shares_yet': 'Ningún compartido aún',
        
        // Sources
        'libraries': '📚 Bibliotecas',
        'select_sources': 'Selecciona las fuentes utilizadas para generar el palimpsesto infinito.',
        'main_sources': '📚 Fuentes principales',
        'specialized_sources': '🏛️ Fuentes especializadas',
        'apply_changes': 'Aplicar cambios',
        
        // Notifications
        'mark_all_read': 'Marcar todo como leído',
        'no_notifications': 'Sin notificaciones',
        
        // Actions
        'close': 'Cerrar',
        'read_more': 'Leer más',
        'show_more': 'Ver más',
        'show_less': 'Ver menos',
        
        // Langues
        'modern_languages': 'Idiomas modernos',
        'ancient_languages': 'Idiomas antiguos',
        'all_languages_filter': 'Todos',
        'language_all': 'Idioma: Todos',
        
        // Toast messages
        'all_languages_activated': '🌍 Todos los idiomas activados',
        'language_changed': '🌐 Idioma:',
        'interface_changed': '🌐 Interfaz en español',

        // Share
        'share_link': '🔗 Compartir enlace',
        'link_copied': '🔗 ¡Enlace copiado!',
        'discover_palimpseste': 'Descubrir Palimpseste'
    },
    
    it: {
        // Navigation & Header
        'random': 'Casuale',
        'trending': 'Tendenze',
        'all_languages': 'Tutte',
        'search_placeholder': 'Cerca un autore, una parola, un tema...',
        'my_likes': 'I miei preferiti',
        'collections': 'Collezioni',
        'community': 'Comunità',
        'messages': 'Messaggi',
        'notifications': 'Notifiche',
        'change_theme': 'Cambia tema',
        'light_mode': 'Modalità chiara',
        'dark_mode': 'Modalità scura',
        
        // Authentification
        'welcome_back': 'Bentornato 📚',
        'connect_to_share': 'Accedi per condividere i tuoi estratti',
        'email_or_username': 'Email o nome utente',
        'password': 'Password',
        'forgot_password': 'Password dimenticata?',
        'login': 'Accedi',
        'or': 'o',
        'continue_google': '🌐 Continua con Google',
        'no_account': 'Non hai un account?',
        'register': 'Registrati',
        'welcome': 'Benvenuto 🌟',
        'create_account_subtitle': 'Crea il tuo account per unirti alla comunità',
        'username': 'Nome utente',
        'email': 'Email',
        'password_min': 'Password (min. 6 caratteri)',
        'create_account': 'Crea il mio account',
        'already_account': 'Hai già un account?',
        'logout': 'Esci',
        'forgot_title': 'Password dimenticata 🔑',
        'forgot_subtitle': 'Inserisci la tua email per ricevere un link di reset',
        'send_link': 'Invia link',
        'back_to_login': '← Torna al login',
        'new_password_title': 'Nuova password 🔐',
        'new_password_subtitle': 'Scegli la tua nuova password',
        'new_password': 'Nuova password (min. 6 caratteri)',
        'confirm_password': 'Conferma password',
        'change_password': 'Cambia password',
        
        // Profil
        'my_profile': 'Il mio profilo',
        'followers': 'follower',
        'following': 'seguiti',
        'shared': 'condivisi',
        'liked': 'preferiti',
        'follow': 'Segui',
        'unfollow': 'Smetti di seguire',
        'message': 'Messaggio',
        'extracts': 'Estratti',
        'extraits': 'estratti',
        'likes': 'Preferiti',
        'online': 'Online',
        'seen_ago_min': 'Visto {n} min fa',
        'seen_ago_hours': 'Visto {n}h fa',
        'seen_yesterday': 'Visto ieri',
        'seen_ago_days': 'Visto {n} giorni fa',
        'seen_on': 'Visto il',
        
        // Feed social
        'social_feed': '🐦 FEED DELLA COMUNITÀ',
        'activity': '❤️ Attività',
        'subscriptions': '👥 Seguiti',
        'subscribers': '💌 Follower',
        'discover': '🔎 Scopri',
        'live': '🟢 In diretta',
        
        // Attività & Notifiche
        'activity_liked_extract': 'ha apprezzato un estratto di',
        'activity_commented_extract': 'ha commentato un estratto di',
        'activity_shared_extract': 'ha condiviso un estratto di',
        'activity_followed': 'ha iniziato a seguire',
        'notif_liked_your_extract': 'ha apprezzato il tuo estratto',
        'notif_liked_your_comment': 'ha apprezzato il tuo commento',
        'notif_commented_your_extract': 'ha commentato il tuo estratto',
        'notif_mentioned_you': 'ti ha menzionato',
        'notif_replied_your_comment': 'ha risposto al tuo commento',
        'notif_follows_you': 'ti segue',
        'notif_sent_message': 'ti ha inviato un messaggio',
        'notif_reacted': 'ha reagito',
        'notif_to_your_content': 'al tuo contenuto',
        'notif_added_to_collection': 'ha aggiunto il tuo estratto a una collezione',
        'notif_shared_your_extract': 'ha condiviso il tuo estratto',
        'someone': 'Qualcuno',
        
        // Banner e messaggi vuoti
        'new_texts_loading': 'Nuovi testi...',
        'users_to_discover': 'Utenti da scoprire',
        'follow_users_hint': 'Segui persone per vedere i loro estratti nella scheda "Seguiti"',
        'no_activity': 'Nessuna attività',
        'follow_for_activity': 'Segui persone per vedere la loro attività qui!',
        'share_for_interactions': 'Condividi estratti per vedere chi interagisce!',
        'be_first_to_interact': 'Sii il primo a interagire!',
        'be_first_to_invite': 'Sii il primo a invitare amici!',
        'share_to_attract': 'Condividi estratti per attirare lettori!',
        'be_first_to_share': 'Sii il primo a condividere un estratto!',
        'followed': 'Seguito',
        'follow_btn': 'Segui',
        'activity_feed': 'Feed attività',
        'follow_whats_happening': 'Segui cosa succede nella comunità',
        'your_followers': 'I tuoi follower',
        'followers_see_extracts': 'Queste persone ti seguono e vedono i tuoi estratti',
        'follows_you_since': 'Ti segue da',
        'filter_all': 'Tutto',
        'filter_following': 'Seguiti',
        'filter_on_my_extracts': 'Sui miei estratti',
        'filter_likes': 'Mi piace',
        'filter_comments': 'Commenti',
        'extract_count': 'estratto',
        'extract_count_plural': 'estratti',
        'its_you': 'Sei tu',
        
        // Drawer mobile
        'sources': 'Fonti',
        'welcome_guest': 'Benvenuto',
        'connect_to_participate': 'Accedi per partecipare',
        
        // Filtres exploration
        'form': '❧ Forma',
        'era': '※ Epoca',
        'register_tone': '◆ Registro',
        'all': '∞ tutto',
        'free': '∞ libero',
        'poetry': 'Poesia',
        'narrative': 'Narrativa',
        'theater': 'Teatro',
        'prose_ideas': 'Prosa di idee',
        'sonnet': 'sonetto',
        'ode': 'ode',
        'elegy': 'elegia',
        'ballad': 'ballata',
        'hymn': 'inno',
        'prose_poem': 'poema in prosa',
        'tale': 'fiaba',
        'fable': 'favola',
        'legend': 'leggenda',
        'myth': 'mito',
        'novel': 'romanzo',
        'short_story': 'racconto',
        'tragedy': 'tragedia',
        'comedy': 'commedia',
        'drama': 'dramma',
        'essay': 'saggio',
        'maxim': 'massima',
        'aphorism': 'aforisma',
        'speech': 'discorso',
        'letter': 'lettera',
        'diary': 'diario',
        'memoirs': 'memorie',
        'antiquity': 'Antichità',
        'middle_ages': 'Medioevo',
        'xvii_xviii': 'XVII-XVIII sec.',
        'xix_century': 'XIX secolo',
        'xx_century': 'XX secolo',
        'greek_antiquity': 'Antichità greca',
        'roman_antiquity': 'Antichità romana',
        'renaissance': 'Rinascimento',
        'baroque': 'Barocco',
        'classicism': 'Classicismo',
        'enlightenment': 'Illuminismo',
        'romanticism': 'Romanticismo',
        'realism': 'Realismo',
        'naturalism': 'Naturalismo',
        'symbolism': 'Simbolismo',
        'decadentism': 'Decadentismo',
        'surrealism': 'Surrealismo',
        'existentialism': 'Esistenzialismo',
        'absurd': 'Assurdo',
        'nouveau_roman': 'Nouveau roman',
        'emotion': 'Emozione',
        'heroism': 'Eroismo',
        'imaginary': 'Immaginario',
        'comic': 'Comico',
        'nature': 'Natura',
        'lyric': 'lirico',
        'elegiac': 'elegiaco',
        'melancholic': 'malinconico',
        'tragic': 'tragico',
        'erotic': 'erotico',
        'libertine': 'libertino',
        'epic': 'epico',
        'heroic': 'eroico',
        'chivalric': 'cavalleresco',
        'gothic': 'gotico',
        'fantastic': 'fantastico',
        'dreamlike': 'onirico',
        'mystic': 'mistico',
        'satirical': 'satirico',
        'ironic': 'ironico',
        'burlesque': 'burlesco',
        'pastoral': 'pastorale',
        'bucolic': 'bucolico',
        'contemplative': 'contemplativo',
        'free_keyword': 'Parola chiave libera…',
        'clear_filters': 'Cancella filtri',
        'roll': 'Rilancia',
        'launch': 'Lancia →',
        
        // Stats & Badges
        'your_drift': '🎲 La tua deriva',
        'texts_traversed': 'testi attraversati',
        'authors': 'autori',
        'reading_time': 'min',
        'words': 'parole',
        'threads_to_pull': '🕸️ Fili da tirare',
        'click_to_lose': 'Clicca per perderti...',
        'badges': '🏆 Badge',
        'path': '❧ Percorso',
        
        // Lecteur
        'full_text': 'Testo completo',
        'loading': 'Caricamento...',
        'searching': 'Ricerca di "{term}"...',
        'loading_trends': '🔥 Caricamento tendenze...',
        'loading_error': 'Errore di caricamento',
        
        // Favoris
        'my_liked': '♥ I MIEI PREFERITI',
        'connect_to_like': 'Accedi per mettere like',
        
        // Recherche
        'results_for': '🔍 Risultati per',
        'results_for_label': 'Risultati per',
        
        // Messages
        'write_message': 'Scrivi un messaggio...',
        'select_conversation': 'Seleziona una conversazione',
        
        // Partage
        'share_extract': '📤 Condividi questo estratto',
        'add_comment': 'Aggiungi un commento... (opzionale)',
        'cancel': 'Annulla',
        'confirm': 'Conferma',
        'publish': '🚀 Pubblica',
        
        // Modal Likers
        'liked_by': '❤️ Piaciuto a',
        'shared_by': '⤴ Condiviso da',
        'no_likes_yet': 'Nessun like ancora',
        'no_shares_yet': 'Nessuna condivisione ancora',
        
        // Sources
        'libraries': '📚 Biblioteche',
        'select_sources': 'Seleziona le fonti utilizzate per generare il palinsesto infinito.',
        'main_sources': '📚 Fonti principali',
        'specialized_sources': '🏛️ Fonti specializzate',
        'apply_changes': 'Applica modifiche',
        
        // Notifications
        'mark_all_read': 'Segna tutto come letto',
        'no_notifications': 'Nessuna notifica',
        
        // Actions
        'close': 'Chiudi',
        'read_more': 'Leggi di più',
        'show_more': 'Mostra di più',
        'show_less': 'Mostra meno',
        
        // Langues
        'modern_languages': 'Lingue moderne',
        'ancient_languages': 'Lingue antiche',
        'all_languages_filter': 'Tutte',
        'language_all': 'Lingua: Tutte',
        
        // Toast messages
        'all_languages_activated': '🌍 Tutte le lingue attivate',
        'language_changed': '🌐 Lingua:',
        'interface_changed': "🌐 Interfaccia in italiano",

        // Share
        'share_link': '🔗 Condividi link',
        'link_copied': '🔗 Link copiato!',
        'discover_palimpseste': 'Scopri Palimpseste'
    },
    
    pt: {
        // Navigation & Header
        'random': 'Aleatório',
        'trending': 'Tendências',
        'all_languages': 'Todas',
        'search_placeholder': 'Pesquisar um autor, uma palavra, um tema...',
        'my_likes': 'Meus favoritos',
        'collections': 'Coleções',
        'community': 'Comunidade',
        'messages': 'Mensagens',
        'notifications': 'Notificações',
        'change_theme': 'Mudar tema',
        'light_mode': 'Modo claro',
        'dark_mode': 'Modo escuro',
        
        // Authentification
        'welcome_back': 'Bem-vindo de volta 📚',
        'connect_to_share': 'Faça login para compartilhar seus extratos',
        'email_or_username': 'Email ou nome de usuário',
        'password': 'Senha',
        'forgot_password': 'Esqueceu a senha?',
        'login': 'Entrar',
        'or': 'ou',
        'continue_google': '🌐 Continuar com Google',
        'no_account': 'Não tem uma conta?',
        'register': 'Cadastrar',
        'welcome': 'Bem-vindo 🌟',
        'create_account_subtitle': 'Crie sua conta para se juntar à comunidade',
        'username': 'Nome de usuário',
        'email': 'Email',
        'password_min': 'Senha (mín. 6 caracteres)',
        'create_account': 'Criar minha conta',
        'already_account': 'Já tem uma conta?',
        'logout': 'Sair',
        'forgot_title': 'Esqueceu a senha 🔑',
        'forgot_subtitle': 'Digite seu email para receber um link de redefinição',
        'send_link': 'Enviar link',
        'back_to_login': '← Voltar ao login',
        'new_password_title': 'Nova senha 🔐',
        'new_password_subtitle': 'Escolha sua nova senha',
        'new_password': 'Nova senha (mín. 6 caracteres)',
        'confirm_password': 'Confirmar senha',
        'change_password': 'Alterar senha',
        
        // Profil
        'my_profile': 'Meu perfil',
        'followers': 'seguidores',
        'following': 'seguindo',
        'shared': 'compartilhados',
        'liked': 'curtidos',
        'follow': 'Seguir',
        'unfollow': 'Deixar de seguir',
        'message': 'Mensagem',
        'extracts': 'Extratos',
        'extraits': 'extratos',
        'likes': 'Curtidos',
        'online': 'Online',
        'seen_ago_min': 'Visto há {n} min',
        'seen_ago_hours': 'Visto há {n}h',
        'seen_yesterday': 'Visto ontem',
        'seen_ago_days': 'Visto há {n} dias',
        'seen_on': 'Visto em',
        
        // Feed social
        'social_feed': '🐦 FEED DA COMUNIDADE',
        'activity': '❤️ Atividade',
        'subscriptions': '👥 Seguindo',
        'subscribers': '💌 Seguidores',
        'discover': '🔎 Descobrir',
        'live': '🟢 Ao vivo',
        
        // Atividades & Notificações
        'activity_liked_extract': 'curtiu um trecho de',
        'activity_commented_extract': 'comentou um trecho de',
        'activity_shared_extract': 'compartilhou um trecho de',
        'activity_followed': 'seguiu',
        'notif_liked_your_extract': 'curtiu seu trecho',
        'notif_liked_your_comment': 'curtiu seu comentário',
        'notif_commented_your_extract': 'comentou seu trecho',
        'notif_mentioned_you': 'mencionou você',
        'notif_replied_your_comment': 'respondeu ao seu comentário',
        'notif_follows_you': 'segue você',
        'notif_sent_message': 'enviou uma mensagem',
        'notif_reacted': 'reagiu',
        'notif_to_your_content': 'ao seu conteúdo',
        'notif_added_to_collection': 'adicionou seu trecho a uma coleção',
        'notif_shared_your_extract': 'compartilhou seu trecho',
        'someone': 'Alguém',
        
        // Banners e mensagens vazias
        'new_texts_loading': 'Novos textos...',
        'users_to_discover': 'Usuários para descobrir',
        'follow_users_hint': 'Siga pessoas para ver seus trechos na aba "Seguindo"',
        'no_activity': 'Sem atividade',
        'follow_for_activity': 'Siga pessoas para ver a atividade delas aqui!',
        'share_for_interactions': 'Compartilhe trechos para ver quem interage!',
        'be_first_to_interact': 'Seja o primeiro a interagir!',
        'be_first_to_invite': 'Seja o primeiro a convidar amigos!',
        'share_to_attract': 'Compartilhe trechos para atrair leitores!',
        'be_first_to_share': 'Seja o primeiro a compartilhar um trecho!',
        'followed': 'Seguindo',
        'follow_btn': 'Seguir',
        'activity_feed': 'Feed de atividade',
        'follow_whats_happening': 'Acompanhe o que acontece na comunidade',
        'your_followers': 'Seus seguidores',
        'followers_see_extracts': 'Essas pessoas te seguem e veem seus trechos',
        'follows_you_since': 'Te segue desde',
        'filter_all': 'Tudo',
        'filter_following': 'Seguindo',
        'filter_on_my_extracts': 'Nos meus trechos',
        'filter_likes': 'Curtidas',
        'filter_comments': 'Comentários',
        'extract_count': 'trecho',
        'extract_count_plural': 'trechos',
        'its_you': 'É você',
        
        // Drawer mobile
        'sources': 'Fontes',
        'welcome_guest': 'Bem-vindo',
        'connect_to_participate': 'Faça login para participar',
        
        // Filtres exploration
        'form': '❧ Forma',
        'era': '※ Época',
        'register_tone': '◆ Registro',
        'all': '∞ tudo',
        'free': '∞ livre',
        'poetry': 'Poesia',
        'narrative': 'Narrativa',
        'theater': 'Teatro',
        'prose_ideas': 'Prosa de ideias',
        'sonnet': 'soneto',
        'ode': 'ode',
        'elegy': 'elegia',
        'ballad': 'balada',
        'hymn': 'hino',
        'prose_poem': 'poema em prosa',
        'tale': 'conto',
        'fable': 'fábula',
        'legend': 'lenda',
        'myth': 'mito',
        'novel': 'romance',
        'short_story': 'conto curto',
        'tragedy': 'tragédia',
        'comedy': 'comédia',
        'drama': 'drama',
        'essay': 'ensaio',
        'maxim': 'máxima',
        'aphorism': 'aforismo',
        'speech': 'discurso',
        'letter': 'carta',
        'diary': 'diário',
        'memoirs': 'memórias',
        'antiquity': 'Antiguidade',
        'middle_ages': 'Idade Média',
        'xvii_xviii': 'Séc. XVII-XVIII',
        'xix_century': 'Século XIX',
        'xx_century': 'Século XX',
        'greek_antiquity': 'Antiguidade grega',
        'roman_antiquity': 'Antiguidade romana',
        'renaissance': 'Renascimento',
        'baroque': 'Barroco',
        'classicism': 'Classicismo',
        'enlightenment': 'Iluminismo',
        'romanticism': 'Romantismo',
        'realism': 'Realismo',
        'naturalism': 'Naturalismo',
        'symbolism': 'Simbolismo',
        'decadentism': 'Decadentismo',
        'surrealism': 'Surrealismo',
        'existentialism': 'Existencialismo',
        'absurd': 'Absurdo',
        'nouveau_roman': 'Nouveau roman',
        'emotion': 'Emoção',
        'heroism': 'Heroísmo',
        'imaginary': 'Imaginário',
        'comic': 'Cômico',
        'nature': 'Natureza',
        'lyric': 'lírico',
        'elegiac': 'elegíaco',
        'melancholic': 'melancólico',
        'tragic': 'trágico',
        'erotic': 'erótico',
        'libertine': 'libertino',
        'epic': 'épico',
        'heroic': 'heroico',
        'chivalric': 'cavaleiresco',
        'gothic': 'gótico',
        'fantastic': 'fantástico',
        'dreamlike': 'onírico',
        'mystic': 'místico',
        'satirical': 'satírico',
        'ironic': 'irônico',
        'burlesque': 'burlesco',
        'pastoral': 'pastoral',
        'bucolic': 'bucólico',
        'contemplative': 'contemplativo',
        'free_keyword': 'Palavra-chave livre…',
        'clear_filters': 'Limpar filtros',
        'roll': 'Relançar',
        'launch': 'Lançar →',
        
        // Stats & Badges
        'your_drift': '🎲 Sua deriva',
        'texts_traversed': 'textos percorridos',
        'authors': 'autores',
        'reading_time': 'min',
        'words': 'palavras',
        'threads_to_pull': '🕸️ Fios para puxar',
        'click_to_lose': 'Clique para se perder...',
        'badges': '🏆 Distintivos',
        'path': '❧ Percurso',
        
        // Lecteur
        'full_text': 'Texto completo',
        'loading': 'Carregando...',
        'searching': 'Pesquisando "{term}"...',
        'loading_trends': '🔥 Carregando tendências...',
        'loading_error': 'Erro de carregamento',
        
        // Favoris
        'my_liked': '♥ MEUS FAVORITOS',
        'connect_to_like': 'Faça login para curtir',
        
        // Recherche
        'results_for': '🔍 Resultados para',
        'results_for_label': 'Resultados para',
        
        // Messages
        'write_message': 'Escreva uma mensagem...',
        'select_conversation': 'Selecione uma conversa',
        
        // Partage
        'share_extract': '📤 Compartilhar este extrato',
        'add_comment': 'Adicione um comentário... (opcional)',
        'cancel': 'Cancelar',
        'confirm': 'Confirmar',
        'publish': '🚀 Publicar',
        
        // Modal Likers
        'liked_by': '❤️ Curtido por',
        'shared_by': '⤴ Compartilhado por',
        'no_likes_yet': 'Nenhuma curtida ainda',
        'no_shares_yet': 'Nenhum compartilhamento ainda',
        
        // Sources
        'libraries': '📚 Bibliotecas',
        'select_sources': 'Selecione as fontes usadas para gerar o palimpsesto infinito.',
        'main_sources': '📚 Fontes principais',
        'specialized_sources': '🏛️ Fontes especializadas',
        'apply_changes': 'Aplicar alterações',
        
        // Notifications
        'mark_all_read': 'Marcar tudo como lido',
        'no_notifications': 'Sem notificações',
        
        // Actions
        'close': 'Fechar',
        'read_more': 'Ler mais',
        'show_more': 'Ver mais',
        'show_less': 'Ver menos',
        
        // Langues
        'modern_languages': 'Línguas modernas',
        'ancient_languages': 'Línguas antigas',
        'all_languages_filter': 'Todas',
        'language_all': 'Idioma: Todas',
        
        // Toast messages
        'all_languages_activated': '🌍 Todas as línguas ativadas',
        'language_changed': '🌐 Idioma:',
        'interface_changed': '🌐 Interface em português',

        // Share
        'share_link': '🔗 Compartilhar link',
        'link_copied': '🔗 Link copiado!',
        'discover_palimpseste': 'Descobrir Palimpseste'
    },

    // ═══════════════════════════════════════════════════════════
    // 🇷🇺 RUSSE
    // ═══════════════════════════════════════════════════════════
    ru: {
        // Navigation & Header
        'random': 'Случайный',
        'trending': 'Популярное',
        'all_languages': 'Все',
        'search_placeholder': 'Автор, слово, тема...',
        'my_likes': 'Избранное',
        'collections': 'Коллекции',
        'community': 'Сообщество',
        'messages': 'Сообщения',
        'notifications': 'Уведомления',
        'change_theme': 'Сменить тему',
        'light_mode': 'Светлая тема',
        'dark_mode': 'Тёмная тема',

        // Authentification
        'welcome_back': 'С возвращением 📚',
        'connect_to_share': 'Войдите, чтобы делиться отрывками',
        'email_or_username': 'Email или имя пользователя',
        'password': 'Пароль',
        'forgot_password': 'Забыли пароль?',
        'login': 'Войти',
        'or': 'или',
        'continue_google': '🌐 Продолжить через Google',
        'no_account': 'Нет аккаунта?',
        'register': 'Регистрация',
        'welcome': 'Добро пожаловать 🌟',
        'create_account_subtitle': 'Создайте аккаунт, чтобы присоединиться к сообществу',
        'username': 'Имя пользователя',
        'email': 'Email',
        'password_min': 'Пароль (мин. 6 символов)',
        'create_account': 'Создать аккаунт',
        'already_account': 'Уже есть аккаунт?',
        'logout': 'Выйти',
        'forgot_title': 'Забыли пароль 🔑',
        'forgot_subtitle': 'Введите email для восстановления',
        'send_link': 'Отправить ссылку',
        'back_to_login': '← Назад ко входу',
        'new_password_title': 'Новый пароль 🔐',
        'new_password_subtitle': 'Выберите новый пароль',
        'new_password': 'Новый пароль (мин. 6 символов)',
        'confirm_password': 'Подтвердите пароль',
        'change_password': 'Сменить пароль',

        // Profil
        'my_profile': 'Мой профиль',
        'followers': 'Подписчики',
        'following': 'Подписки',
        'shared': 'поделился',
        'liked': 'понравилось',
        'follow': 'Подписаться',
        'unfollow': 'Отписаться',
        'message': 'Сообщение',
        'extracts': 'Отрывки',
        'extraits': 'отрывков',
        'likes': 'Избранное',
        'online': 'В сети',

        // Tooltips header
        'tooltip_home': 'Главная',
        'tooltip_random': 'Случайный текст',
        'tooltip_trending': 'Популярные тексты',
        'tooltip_choose_lang': 'Выбрать языки',
        'tooltip_my_likes': 'Моё избранное',
        'tooltip_my_collections': 'Мои коллекции',
        'tooltip_community': 'Сообщество',
        'tooltip_messages': 'Сообщения',
        'tooltip_notifications': 'Уведомления',
        'tooltip_change_theme': 'Сменить тему',
        'tooltip_menu': 'Меню',
        'tooltip_sources': 'Источники и библиотеки',
        'tooltip_view_profile': 'Мой профиль',
        'tooltip_manage_sources': 'Управление источниками',
        'tooltip_clear_filters': 'Сбросить фильтры',
        'tooltip_reroll': 'Обновить',
        'seen_ago_min': '{n} мин назад',
        'seen_ago_hours': '{n} ч назад',
        'seen_yesterday': 'Вчера',
        'seen_ago_days': '{n} дн назад',
        'seen_on': 'Был(а)',

        // Feed social
        'social_feed': '🐦 ЛЕНТА СООБЩЕСТВА',
        'activity': 'Активность',
        'users': 'Пользователи',
        'subscriptions': '👥 Подписки',
        'subscribers': '💌 Подписчики',
        'discover': '🔎 Открыть',
        'live': '🟢 Онлайн',

        // Activities & Notifications
        'activity_liked_extract': 'оценил(а) отрывок из',
        'activity_commented_extract': 'прокомментировал(а) отрывок из',
        'activity_shared_extract': 'поделился отрывком из',
        'activity_followed': 'подписался на',
        'notif_liked_your_extract': 'оценил(а) ваш отрывок',
        'notif_liked_your_comment': 'оценил(а) ваш комментарий',
        'notif_commented_your_extract': 'прокомментировал(а) ваш отрывок',
        'notif_mentioned_you': 'упомянул(а) вас',
        'notif_replied_your_comment': 'ответил(а) на ваш комментарий',
        'notif_follows_you': 'подписался на вас',
        'notif_sent_message': 'отправил(а) сообщение',
        'notif_reacted': 'отреагировал(а)',
        'notif_to_your_content': 'на ваш контент',
        'notif_added_to_collection': 'добавил(а) ваш отрывок в коллекцию',
        'notif_shared_your_extract': 'поделился вашим отрывком',
        'someone': 'Кто-то',

        // Banners and empty messages
        'new_texts_loading': 'Новые тексты...',
        'users_to_discover': 'Пользователи',
        'follow_users_hint': 'Подпишитесь, чтобы видеть отрывки во вкладке «Подписки»',
        'no_activity': 'Нет активности',
        'follow_for_activity': 'Подпишитесь, чтобы видеть активность здесь!',
        'share_for_interactions': 'Делитесь, чтобы видеть взаимодействия!',
        'be_first_to_interact': 'Будьте первым!',
        'be_first_to_invite': 'Пригласите друзей!',
        'share_to_attract': 'Делитесь отрывками!',
        'be_first_to_share': 'Поделитесь первым!',
        'followed': 'Подписки',
        'follow_btn': 'Подписаться',
        'activity_feed': 'Лента активности',
        'follow_whats_happening': 'Следите за событиями сообщества',
        'your_followers': 'Ваши подписчики',
        'followers_see_extracts': 'Эти люди подписаны на вас',
        'follows_you_since': 'Подписан(а) с',
        'filter_all': 'Все',
        'filter_following': 'Подписки',
        'filter_on_my_extracts': 'Мои отрывки',
        'filter_likes': 'Лайки',
        'filter_comments': 'Комментарии',
        'extract_count': 'отрывок',
        'extract_count_plural': 'отрывков',
        'its_you': 'Это вы',

        // Drawer mobile
        'sources': 'Источники',
        'welcome_guest': 'Добро пожаловать',
        'connect_to_participate': 'Войдите для участия',

        // Filtres exploration
        'form': '❧ Форма',
        'era': '※ Эпоха',
        'register_tone': '◆ Регистр',
        'all': '∞ все',
        'free': '∞ свободно',
        'poetry': 'Поэзия',
        'narrative': 'Проза',
        'theater': 'Театр',
        'prose_ideas': 'Эссеистика',
        'sonnet': 'сонет',
        'ode': 'ода',
        'elegy': 'элегия',
        'ballad': 'баллада',
        'hymn': 'гимн',
        'prose_poem': 'стихотворение в прозе',
        'tale': 'сказка',
        'fable': 'басня',
        'legend': 'легенда',
        'myth': 'миф',
        'novel': 'роман',
        'short_story': 'рассказ',
        'tragedy': 'трагедия',
        'comedy': 'комедия',
        'drama': 'драма',
        'essay': 'эссе',
        'maxim': 'максима',
        'aphorism': 'афоризм',
        'speech': 'речь',
        'letter': 'письмо',
        'diary': 'дневник',
        'memoirs': 'мемуары',
        'antiquity': 'Античность',
        'middle_ages': 'Средневековье',
        'xvii_xviii': 'XVII–XVIII вв.',
        'xix_century': 'XIX век',
        'xx_century': 'XX век',
        'greek_antiquity': 'Древняя Греция',
        'roman_antiquity': 'Древний Рим',
        'renaissance': 'Возрождение',
        'baroque': 'Барокко',
        'classicism': 'Классицизм',
        'enlightenment': 'Просвещение',
        'romanticism': 'Романтизм',
        'realism': 'Реализм',
        'naturalism': 'Натурализм',
        'symbolism': 'Символизм',
        'decadentism': 'Декаданс',
        'surrealism': 'Сюрреализм',
        'existentialism': 'Экзистенциализм',
        'absurd': 'Абсурд',
        'nouveau_roman': 'Новый роман',
        'emotion': 'Эмоция',
        'heroism': 'Героизм',
        'imaginary': 'Воображение',
        'comic': 'Комизм',
        'nature': 'Природа',
        'lyric': 'лирический',
        'elegiac': 'элегический',
        'melancholic': 'меланхоличный',
        'tragic': 'трагический',
        'erotic': 'эротический',
        'libertine': 'либертинский',
        'epic': 'эпический',
        'heroic': 'героический',
        'chivalric': 'рыцарский',
        'gothic': 'готический',
        'fantastic': 'фантастический',
        'dreamlike': 'грёзы',
        'mystic': 'мистический',
        'satirical': 'сатирический',
        'ironic': 'ироничный',
        'burlesque': 'бурлескный',
        'pastoral': 'пасторальный',
        'bucolic': 'буколический',
        'contemplative': 'созерцательный',
        'free_keyword': 'Свободное слово…',
        'clear_filters': 'Сбросить фильтры',
        'roll': 'Обновить',
        'launch': 'Запуск →',

        // Stats & Badges
        'your_drift': '🎲 Ваш дрейф',
        'texts_traversed': 'текстов',
        'authors': 'авторов',
        'reading_time': 'мин',
        'words': 'слов',
        'threads_to_pull': '🕸️ Нити для изучения',
        'click_to_lose': 'Нажмите, чтобы погрузиться...',
        'badges': '🏆 Значки',
        'path': '❧ Путь',

        // Lecteur
        'full_text': 'Полный текст',
        'loading': 'Загрузка...',
        'searching': 'Поиск «{term}»...',
        'loading_trends': '🔥 Загрузка трендов...',
        'loading_error': 'Ошибка загрузки',

        // Favoris
        'my_liked': '♥ ИЗБРАННОЕ',
        'connect_to_like': 'Войдите, чтобы отмечать',

        // Recherche
        'results_for': '🔍 Результаты по запросу',
        'results_for_label': 'Результаты по запросу',

        // Messages
        'write_message': 'Написать сообщение...',
        'select_conversation': 'Выберите беседу',

        // Partage
        'share_extract': '📤 Поделиться отрывком',
        'add_comment': 'Комментарий... (необязательно)',
        'cancel': 'Отмена',
        'publish': '🚀 Опубликовать',

        // Modal Likers
        'liked_by': '❤️ Понравилось',
        'shared_by': '⤴ Поделились',
        'no_likes_yet': 'Пока нет лайков',
        'no_shares_yet': 'Пока никто не поделился',

        // Sources
        'libraries': '📚 Библиотеки',
        'select_sources': 'Выберите источники для бесконечного палимпсеста.',
        'main_sources': '📚 Основные источники',
        'specialized_sources': '🏛️ Специализированные источники',
        'apply_changes': 'Применить',
        'wikisource_desc': 'Свободная библиотека. Лучшее качество и форматирование.',
        'archive_desc': 'Сканер старых книг. Сырые тексты (иногда несовершенный OCR).',
        'gutenberg_desc': 'Классика общественного достояния.',
        'gallica_desc': 'Национальная библиотека Франции. Оцифрованные французские тексты.',
        'perseus_desc': 'Классические греческие и латинские тексты (переводы на английский).',
        'sacredtexts_desc': 'Религиозные и мистические тексты на английском.',
        'poetrydb_desc': 'База данных англоязычной поэзии.',

        // Filters
        'collapse_filters': 'Свернуть фильтры',
        'expand_filters': 'Развернуть фильтры',

        // Notifications
        'mark_all_read': 'Отметить все прочитанными',
        'no_notifications': 'Нет уведомлений',

        // Actions
        'close': 'Закрыть',
        'read_more': 'Читать далее',
        'show_more': 'Показать ещё',
        'show_less': 'Показать меньше',
        'view_full_text': '📖 Полный текст',
        'load_full_text': 'Загрузить полный текст',
        'show_full_text': 'Показать полный текст',
        'collapse_text': 'Свернуть текст',
        'collapse': '▲ Свернуть',
        'open_source': 'Открыть источник',
        'open': 'Открыть',
        'remove': 'Удалить',

        // Tooltips buttons
        'tooltip_like': 'Нравится',
        'tooltip_share': 'Поделиться',
        'tooltip_comment': 'Комментарий',
        'tooltip_add_collection': 'Добавить в коллекцию',
        'tooltip_cancel_share': 'Отменить',
        'tooltip_read_wikisource': 'Читать на Wikisource',
        'tooltip_filter_tag': 'Фильтр по тегу',
        'tooltip_explore': 'Исследовать',
        'tooltip_discover_authors': 'Откройте связанных авторов',
        'tooltip_actions': 'Действия',
        'tooltip_react': 'Реакция',
        'tooltip_modify': 'Редактировать',
        'tooltip_delete': 'Удалить',
        'tooltip_sent': 'Отправлено',
        'tooltip_read': 'Прочитано',
        'tooltip_modified_at': 'Изменено',
        'tooltip_explore_tree': 'Исследовать дерево',

        // Comments
        'comment_singular': 'комментарий',
        'comment_plural': 'комментариев',
        'write_comment': 'Написать комментарий...',
        'loading_comments': 'Загрузка...',
        'modified': 'Изменено',
        'modified_on': 'Изменено',
        'no_comments_yet': 'Пока нет комментариев. Будьте первым!',
        'view_source': '🔗 Источник',

        // Literary tags
        'tag_poetry': 'поэзия',
        'tag_novel': 'роман',
        'tag_theater': 'театр',
        'tag_essay': 'эссе',
        'tag_tale': 'сказка',
        'tag_short_story': 'рассказ',
        'tag_fable': 'басня',
        'tag_letter': 'письмо',
        'tag_memoir': 'мемуары',
        'tag_speech': 'речь',

        // Follow buttons
        'followed': '✓ Подписан(а)',
        'follow_short': '+ Подписаться',

        // Langues
        'modern_languages': 'Современные языки',
        'ancient_languages': 'Древние языки',
        'all_languages_filter': 'Все',
        'language_all': 'Язык: Все',

        // Toast messages
        'all_languages_activated': '🌍 Все языки активированы',
        'language_changed': '🌐 Язык:',
        'interface_changed': '🌐 Интерфейс на русском',

        // Collections
        'my_collections': '❧ МОИ КОЛЛЕКЦИИ',
        'new_collection': 'Новая коллекция',
        'no_collection_yet': 'Пока нет коллекций',
        'create_collections_to_organize': 'Создайте коллекции для организации текстов по темам',
        'create_first_collection': 'Создать первую коллекцию',
        'public': 'Публичная',
        'private': 'Приватная',
        'texts_count': 'текст',
        'texts_count_plural': 'текстов',
        'back_to_collections': '← Коллекции',
        'empty_collection': 'Коллекция пуста',
        'add_texts_to_collection': 'Добавьте тексты из ридера',
        'edit': 'Редактировать',
        'delete': 'Удалить',
        'collection_name': 'Название коллекции',
        'collection_description': 'Описание (необязательно)',
        'create_collection': 'Создать коллекцию',
        'save_changes': 'Сохранить',
        'delete_collection_confirm': 'Удалить коллекцию?',
        'connect_to_see_collections': '📝 Войдите, чтобы увидеть коллекции',

        // Modals collection
        'new_collection_title': '+ Новая коллекция',
        'edit_collection_title': 'Редактировать коллекцию',
        'collection_name_label': 'Название',
        'collection_name_placeholder': 'Напр.: Романтическая поэзия',
        'collection_desc_label': 'Описание (необязательно)',
        'collection_desc_placeholder': 'Краткое описание...',
        'collection_emoji_label': 'Эмодзи',
        'collection_color_label': 'Цвет',
        'collection_public_label': 'Публичная коллекция (видна всем)',
        'collection_public_short': 'Публичная коллекция',
        'enter_collection_name': '❌ Введите название коллекции',
        'loading_text': 'Загрузка…',
        'text_unavailable': 'Текст недоступен.',
        'view_on_wikisource': 'Смотреть на Wikisource →',
        'loading_error': 'Ошибка загрузки.',
        'open_source_link': 'Открыть источник',
        'external_source': 'Внешний источник.',
        'open_in_new_tab': 'Открыть в новой вкладке',
        'no_source_available': 'Нет доступного источника',
        'without_title': 'Без названия',
        'unknown_author': 'Неизвестный автор',
        'show_full_text_aria': 'Показать полный текст',

        // Collection picker
        'add_to_collection': '+ Добавить в коллекцию',
        'no_collection_create': 'Нет коллекций. Создайте!',
        'to_remove_open_collection': '💡 Для удаления откройте коллекцию',
        'error_creation': '❌ Ошибка создания',
        'error_modification': '❌ Ошибка изменения',
        'error_deletion': '❌ Ошибка удаления',
        'error_adding': '❌ Ошибка добавления',
        'delete_collection_prompt': 'Удалить коллекцию «{name}»?\nТексты не будут удалены из избранного.',
        'connect_to_create_collection': '📝 Войдите, чтобы создать коллекцию',
        'collection_name_required': '❌ Необходимо имя коллекции',
        'collection_created': '✅ Коллекция «{name}» создана',
        'collection_updated': '✅ Коллекция обновлена',
        'collection_deleted': 'Коллекция «{name}» удалена',
        'connect_to_organize_collections': '📝 Войдите для управления коллекциями',
        'already_in_collection': '📌 Уже в коллекции',
        'added_to_collection': '📌 Добавлено в «{name}»',
        'removed_from_collection': 'Удалено из коллекции',
        'confirm_remove_title': 'Удалить из коллекции?',
        'confirm_remove_message': 'Вы уверены, что хотите удалить этот отрывок из коллекции?',
        'confirm': 'Подтвердить',
        'extrait_not_found': '❌ Отрывок не найден',
        'extrait_in_no_collection': '📌 Отрывок не в коллекции',
        'connect_to_use_collections': '📝 Войдите, чтобы использовать коллекции',
        'collection_not_found': 'Коллекция не найдена',
        'error_opening': 'Ошибка открытия',
        'name_required': '❌ Необходимо имя',
        'element_not_found': 'Ошибка: элемент не найден',
        'full_text_loaded': 'Полный текст загружен',

        // Share
        'share_link': '🔗 Поделиться ссылкой',
        'link_copied': '🔗 Ссылка скопирована!',
        'discover_palimpseste': 'Открыть Palimpseste'
    },

    // ═══════════════════════════════════════════════════════════
    // 🇨🇳 CHINOIS
    // ═══════════════════════════════════════════════════════════
    zh: {
        // Navigation & Header
        'random': '随机',
        'trending': '热门',
        'all_languages': '全部',
        'search_placeholder': '搜索作者、词语、主题...',
        'my_likes': '我的收藏',
        'collections': '合集',
        'community': '社区',
        'messages': '消息',
        'notifications': '通知',
        'change_theme': '切换主题',
        'light_mode': '浅色模式',
        'dark_mode': '深色模式',

        // Authentification
        'welcome_back': '欢迎回来 📚',
        'connect_to_share': '登录以分享摘录',
        'email_or_username': '邮箱或用户名',
        'password': '密码',
        'forgot_password': '忘记密码？',
        'login': '登录',
        'or': '或',
        'continue_google': '🌐 使用Google继续',
        'no_account': '没有账户？',
        'register': '注册',
        'welcome': '欢迎 🌟',
        'create_account_subtitle': '创建账户加入社区',
        'username': '用户名',
        'email': '邮箱',
        'password_min': '密码（至少6个字符）',
        'create_account': '创建账户',
        'already_account': '已有账户？',
        'logout': '退出',
        'forgot_title': '忘记密码 🔑',
        'forgot_subtitle': '输入邮箱接收重置链接',
        'send_link': '发送链接',
        'back_to_login': '← 返回登录',
        'new_password_title': '新密码 🔐',
        'new_password_subtitle': '选择新密码',
        'new_password': '新密码（至少6个字符）',
        'confirm_password': '确认密码',
        'change_password': '更改密码',

        // Profil
        'my_profile': '我的主页',
        'followers': '粉丝',
        'following': '关注',
        'shared': '已分享',
        'liked': '已喜欢',
        'follow': '关注',
        'unfollow': '取消关注',
        'message': '私信',
        'extracts': '摘录',
        'extraits': '篇摘录',
        'likes': '喜欢',
        'online': '在线',

        // Tooltips header
        'tooltip_home': '首页',
        'tooltip_random': '发现随机文本',
        'tooltip_trending': '热门文本',
        'tooltip_choose_lang': '选择语言',
        'tooltip_my_likes': '我的收藏',
        'tooltip_my_collections': '我的合集',
        'tooltip_community': '社区',
        'tooltip_messages': '消息',
        'tooltip_notifications': '通知',
        'tooltip_change_theme': '切换主题',
        'tooltip_menu': '菜单',
        'tooltip_sources': '来源与图书馆',
        'tooltip_view_profile': '查看主页',
        'tooltip_manage_sources': '管理来源',
        'tooltip_clear_filters': '清除筛选',
        'tooltip_reroll': '刷新',
        'seen_ago_min': '{n}分钟前',
        'seen_ago_hours': '{n}小时前',
        'seen_yesterday': '昨天',
        'seen_ago_days': '{n}天前',
        'seen_on': '上次在线',

        // Feed social
        'social_feed': '🐦 社区动态',
        'activity': '动态',
        'users': '用户',
        'subscriptions': '👥 关注',
        'subscribers': '💌 粉丝',
        'discover': '🔎 发现',
        'live': '🟢 在线',

        // Activities & Notifications
        'activity_liked_extract': '喜欢了一篇摘录来自',
        'activity_commented_extract': '评论了一篇摘录来自',
        'activity_shared_extract': '分享了一篇摘录来自',
        'activity_followed': '关注了',
        'notif_liked_your_extract': '喜欢了你的摘录',
        'notif_liked_your_comment': '喜欢了你的评论',
        'notif_commented_your_extract': '评论了你的摘录',
        'notif_mentioned_you': '提到了你',
        'notif_replied_your_comment': '回复了你的评论',
        'notif_follows_you': '关注了你',
        'notif_sent_message': '发了消息',
        'notif_reacted': '回应了',
        'notif_to_your_content': '你的内容',
        'notif_added_to_collection': '将你的摘录添加到合集',
        'notif_shared_your_extract': '分享了你的摘录',
        'someone': '有人',

        // Banners and empty messages
        'new_texts_loading': '加载新文本...',
        'users_to_discover': '发现用户',
        'follow_users_hint': '关注他人以在"关注"标签中查看摘录',
        'no_activity': '暂无动态',
        'follow_for_activity': '关注他人以查看动态！',
        'share_for_interactions': '分享摘录以查看互动！',
        'be_first_to_interact': '成为第一个互动的人！',
        'be_first_to_invite': '邀请朋友吧！',
        'share_to_attract': '分享摘录吸引读者！',
        'be_first_to_share': '成为第一个分享的人！',
        'followed': '已关注',
        'follow_btn': '关注',
        'activity_feed': '动态流',
        'follow_whats_happening': '关注社区动态',
        'your_followers': '你的粉丝',
        'followers_see_extracts': '这些人关注你',
        'follows_you_since': '关注你自',
        'filter_all': '全部',
        'filter_following': '关注',
        'filter_on_my_extracts': '我的摘录',
        'filter_likes': '喜欢',
        'filter_comments': '评论',
        'extract_count': '篇摘录',
        'extract_count_plural': '篇摘录',
        'its_you': '就是你',

        // Drawer mobile
        'sources': '来源',
        'welcome_guest': '欢迎',
        'connect_to_participate': '登录以参与',

        // Filtres exploration
        'form': '❧ 体裁',
        'era': '※ 时代',
        'register_tone': '◆ 风格',
        'all': '∞ 全部',
        'free': '∞ 自由',
        'poetry': '诗歌',
        'narrative': '叙事',
        'theater': '戏剧',
        'prose_ideas': '随笔',
        'sonnet': '十四行诗',
        'ode': '颂歌',
        'elegy': '挽歌',
        'ballad': '叙事诗',
        'hymn': '赞美诗',
        'prose_poem': '散文诗',
        'tale': '童话',
        'fable': '寓言',
        'legend': '传说',
        'myth': '神话',
        'novel': '长篇小说',
        'short_story': '短篇小说',
        'tragedy': '悲剧',
        'comedy': '喜剧',
        'drama': '正剧',
        'essay': '散文',
        'maxim': '格言',
        'aphorism': '箴言',
        'speech': '演讲',
        'letter': '书信',
        'diary': '日记',
        'memoirs': '回忆录',
        'antiquity': '古代',
        'middle_ages': '中世纪',
        'xvii_xviii': '十七至十八世纪',
        'xix_century': '十九世纪',
        'xx_century': '二十世纪',
        'greek_antiquity': '古希腊',
        'roman_antiquity': '古罗马',
        'renaissance': '文艺复兴',
        'baroque': '巴洛克',
        'classicism': '古典主义',
        'enlightenment': '启蒙运动',
        'romanticism': '浪漫主义',
        'realism': '现实主义',
        'naturalism': '自然主义',
        'symbolism': '象征主义',
        'decadentism': '颓废主义',
        'surrealism': '超现实主义',
        'existentialism': '存在主义',
        'absurd': '荒诞派',
        'nouveau_roman': '新小说',
        'emotion': '情感',
        'heroism': '英雄主义',
        'imaginary': '想象',
        'comic': '喜剧性',
        'nature': '自然',
        'lyric': '抒情',
        'elegiac': '哀歌式',
        'melancholic': '忧郁',
        'tragic': '悲剧性',
        'erotic': '情色',
        'libertine': '放荡',
        'epic': '史诗',
        'heroic': '英雄',
        'chivalric': '骑士',
        'gothic': '哥特',
        'fantastic': '奇幻',
        'dreamlike': '梦幻',
        'mystic': '神秘',
        'satirical': '讽刺',
        'ironic': '反讽',
        'burlesque': '滑稽',
        'pastoral': '田园',
        'bucolic': '牧歌',
        'contemplative': '沉思',
        'free_keyword': '自由关键词…',
        'clear_filters': '清除筛选',
        'roll': '刷新',
        'launch': '启动 →',

        // Stats & Badges
        'your_drift': '🎲 你的漂流',
        'texts_traversed': '篇文本',
        'authors': '位作者',
        'reading_time': '分钟',
        'words': '字',
        'threads_to_pull': '🕸️ 待探索的线索',
        'click_to_lose': '点击迷失其中...',
        'badges': '🏆 徽章',
        'path': '❧ 路径',

        // Lecteur
        'full_text': '全文',
        'loading': '加载中...',
        'searching': '搜索"{term}"...',
        'loading_trends': '🔥 加载热门...',
        'loading_error': '加载错误',

        // Favoris
        'my_liked': '♥ 我的收藏',
        'connect_to_like': '登录以收藏',

        // Recherche
        'results_for': '🔍 搜索结果',
        'results_for_label': '搜索结果',

        // Messages
        'write_message': '写消息...',
        'select_conversation': '选择对话',

        // Partage
        'share_extract': '📤 分享此摘录',
        'add_comment': '添加评论...（可选）',
        'cancel': '取消',
        'publish': '🚀 发布',

        // Modal Likers
        'liked_by': '❤️ 喜欢的人',
        'shared_by': '⤴ 分享的人',
        'no_likes_yet': '暂无喜欢',
        'no_shares_yet': '暂无分享',

        // Sources
        'libraries': '📚 图书馆',
        'select_sources': '选择生成无限重写本的来源。',
        'main_sources': '📚 主要来源',
        'specialized_sources': '🏛️ 专业来源',
        'apply_changes': '应用更改',
        'wikisource_desc': '自由协作图书馆。最佳质量和排版。',
        'archive_desc': '旧书扫描仪。原始文本（OCR可能不完美）。',
        'gutenberg_desc': '公共领域经典作品。',
        'gallica_desc': '法国国家图书馆。数字化法语文本。',
        'perseus_desc': '古典希腊和拉丁文本（英文翻译）。',
        'sacredtexts_desc': '英文宗教和神秘文本。',
        'poetrydb_desc': '英语诗歌数据库。',

        // Filters
        'collapse_filters': '收起筛选',
        'expand_filters': '展开筛选',

        // Notifications
        'mark_all_read': '全部标为已读',
        'no_notifications': '暂无通知',

        // Actions
        'close': '关闭',
        'read_more': '阅读更多',
        'show_more': '显示更多',
        'show_less': '显示更少',
        'view_full_text': '📖 查看全文',
        'load_full_text': '加载全文',
        'show_full_text': '显示全文',
        'collapse_text': '收起文本',
        'collapse': '▲ 收起',
        'open_source': '打开来源',
        'open': '打开',
        'remove': '移除',

        // Tooltips buttons
        'tooltip_like': '喜欢',
        'tooltip_share': '分享',
        'tooltip_comment': '评论',
        'tooltip_add_collection': '添加到合集',
        'tooltip_cancel_share': '取消分享',
        'tooltip_read_wikisource': '在Wikisource阅读',
        'tooltip_filter_tag': '按标签筛选',
        'tooltip_explore': '探索',
        'tooltip_discover_authors': '发现相关作者',
        'tooltip_actions': '操作',
        'tooltip_react': '回应',
        'tooltip_modify': '编辑',
        'tooltip_delete': '删除',
        'tooltip_sent': '已发送',
        'tooltip_read': '已读',
        'tooltip_modified_at': '修改于',
        'tooltip_explore_tree': '探索树',

        // Comments
        'comment_singular': '条评论',
        'comment_plural': '条评论',
        'write_comment': '写评论...',
        'loading_comments': '加载中...',
        'modified': '已修改',
        'modified_on': '修改于',
        'no_comments_yet': '暂无评论。来第一个评论吧！',
        'view_source': '🔗 查看来源',

        // Literary tags
        'tag_poetry': '诗歌',
        'tag_novel': '小说',
        'tag_theater': '戏剧',
        'tag_essay': '散文',
        'tag_tale': '童话',
        'tag_short_story': '短篇',
        'tag_fable': '寓言',
        'tag_letter': '书信',
        'tag_memoir': '回忆录',
        'tag_speech': '演讲',

        // Follow buttons
        'followed': '✓ 已关注',
        'follow_short': '+ 关注',

        // Langues
        'modern_languages': '现代语言',
        'ancient_languages': '古代语言',
        'all_languages_filter': '全部',
        'language_all': '语言：全部',

        // Toast messages
        'all_languages_activated': '🌍 已激活所有语言',
        'language_changed': '🌐 语言：',
        'interface_changed': '🌐 界面语言：中文',

        // Collections
        'my_collections': '❧ 我的合集',
        'new_collection': '新建合集',
        'no_collection_yet': '暂无合集',
        'create_collections_to_organize': '创建合集按主题整理喜欢的文本',
        'create_first_collection': '创建第一个合集',
        'public': '公开',
        'private': '私密',
        'texts_count': '篇文本',
        'texts_count_plural': '篇文本',
        'back_to_collections': '← 合集',
        'empty_collection': '合集为空',
        'add_texts_to_collection': '从阅读器添加文本',
        'edit': '编辑',
        'delete': '删除',
        'collection_name': '合集名称',
        'collection_description': '描述（可选）',
        'create_collection': '创建合集',
        'save_changes': '保存',
        'delete_collection_confirm': '删除此合集？',
        'connect_to_see_collections': '📝 登录查看合集',

        // Modals collection
        'new_collection_title': '+ 新建合集',
        'edit_collection_title': '编辑合集',
        'collection_name_label': '名称',
        'collection_name_placeholder': '例如：浪漫诗歌',
        'collection_desc_label': '描述（可选）',
        'collection_desc_placeholder': '简短描述...',
        'collection_emoji_label': '表情',
        'collection_color_label': '颜色',
        'collection_public_label': '公开合集（所有人可见）',
        'collection_public_short': '公开合集',
        'enter_collection_name': '❌ 请输入合集名称',
        'loading_text': '加载中…',
        'text_unavailable': '文本不可用。',
        'view_on_wikisource': '在Wikisource查看 →',
        'loading_error': '加载错误。',
        'open_source_link': '打开来源',
        'external_source': '外部来源。',
        'open_in_new_tab': '在新标签页打开',
        'no_source_available': '无可用来源',
        'without_title': '无标题',
        'unknown_author': '未知作者',
        'show_full_text_aria': '显示全文',

        // Collection picker
        'add_to_collection': '+ 添加到合集',
        'no_collection_create': '暂无合集。创建一个！',
        'to_remove_open_collection': '💡 打开合集以移除',
        'error_creation': '❌ 创建错误',
        'error_modification': '❌ 修改错误',
        'error_deletion': '❌ 删除错误',
        'error_adding': '❌ 添加错误',
        'delete_collection_prompt': '删除合集"{name}"？\n文本不会从收藏中移除。',
        'connect_to_create_collection': '📝 登录以创建合集',
        'collection_name_required': '❌ 合集名称为必填',
        'collection_created': '✅ 合集"{name}"已创建',
        'collection_updated': '✅ 合集已更新',
        'collection_deleted': '合集"{name}"已删除',
        'connect_to_organize_collections': '📝 登录以管理合集',
        'already_in_collection': '📌 已在合集中',
        'added_to_collection': '📌 已添加到"{name}"',
        'removed_from_collection': '已从合集移除',
        'confirm_remove_title': '从合集移除？',
        'confirm_remove_message': '确定从合集中移除此摘录？',
        'confirm': '确认',
        'extrait_not_found': '❌ 未找到摘录',
        'extrait_in_no_collection': '📌 此摘录不在任何合集中',
        'connect_to_use_collections': '📝 登录以使用合集',
        'collection_not_found': '未找到合集',
        'error_opening': '打开错误',
        'name_required': '❌ 名称为必填',
        'element_not_found': '错误：未找到元素',
        'full_text_loaded': '全文已加载',

        // Share
        'share_link': '🔗 分享链接',
        'link_copied': '🔗 链接已复制！',
        'discover_palimpseste': '探索 Palimpseste'
    },

    // ═══════════════════════════════════════════════════════════
    // 🇯🇵 JAPONAIS
    // ═══════════════════════════════════════════════════════════
    ja: {
        // Navigation & Header
        'random': 'ランダム',
        'trending': 'トレンド',
        'all_languages': 'すべて',
        'search_placeholder': '著者、単語、テーマを検索...',
        'my_likes': 'お気に入り',
        'collections': 'コレクション',
        'community': 'コミュニティ',
        'messages': 'メッセージ',
        'notifications': '通知',
        'change_theme': 'テーマ変更',
        'light_mode': 'ライトモード',
        'dark_mode': 'ダークモード',

        // Authentification
        'welcome_back': 'おかえりなさい 📚',
        'connect_to_share': 'ログインして抜粋を共有',
        'email_or_username': 'メールまたはユーザー名',
        'password': 'パスワード',
        'forgot_password': 'パスワードを忘れた？',
        'login': 'ログイン',
        'or': 'または',
        'continue_google': '🌐 Googleで続行',
        'no_account': 'アカウントがない？',
        'register': '新規登録',
        'welcome': 'ようこそ 🌟',
        'create_account_subtitle': 'アカウントを作成してコミュニティに参加',
        'username': 'ユーザー名',
        'email': 'メール',
        'password_min': 'パスワード（6文字以上）',
        'create_account': 'アカウント作成',
        'already_account': 'すでにアカウントをお持ち？',
        'logout': 'ログアウト',
        'forgot_title': 'パスワードを忘れた 🔑',
        'forgot_subtitle': 'リセットリンクを送信',
        'send_link': 'リンク送信',
        'back_to_login': '← ログインに戻る',
        'new_password_title': '新しいパスワード 🔐',
        'new_password_subtitle': '新しいパスワードを選択',
        'new_password': '新しいパスワード（6文字以上）',
        'confirm_password': 'パスワード確認',
        'change_password': 'パスワード変更',

        // Profil
        'my_profile': 'マイプロフィール',
        'followers': 'フォロワー',
        'following': 'フォロー中',
        'shared': '共有済み',
        'liked': 'いいね済み',
        'follow': 'フォロー',
        'unfollow': 'フォロー解除',
        'message': 'メッセージ',
        'extracts': '抜粋',
        'extraits': '件の抜粋',
        'likes': 'いいね',
        'online': 'オンライン',

        // Tooltips header
        'tooltip_home': 'ホーム',
        'tooltip_random': 'ランダムテキスト',
        'tooltip_trending': '人気テキスト',
        'tooltip_choose_lang': '言語を選択',
        'tooltip_my_likes': 'お気に入り',
        'tooltip_my_collections': 'マイコレクション',
        'tooltip_community': 'コミュニティ',
        'tooltip_messages': 'メッセージ',
        'tooltip_notifications': '通知',
        'tooltip_change_theme': 'テーマ変更',
        'tooltip_menu': 'メニュー',
        'tooltip_sources': 'ソースとライブラリ',
        'tooltip_view_profile': 'プロフィール表示',
        'tooltip_manage_sources': 'ソース管理',
        'tooltip_clear_filters': 'フィルタークリア',
        'tooltip_reroll': '更新',
        'seen_ago_min': '{n}分前',
        'seen_ago_hours': '{n}時間前',
        'seen_yesterday': '昨日',
        'seen_ago_days': '{n}日前',
        'seen_on': '最終ログイン',

        // Feed social
        'social_feed': '🐦 コミュニティフィード',
        'activity': 'アクティビティ',
        'users': 'ユーザー',
        'subscriptions': '👥 フォロー中',
        'subscribers': '💌 フォロワー',
        'discover': '🔎 発見',
        'live': '🟢 オンライン',

        // Activities & Notifications
        'activity_liked_extract': 'の抜粋をいいねしました',
        'activity_commented_extract': 'の抜粋にコメントしました',
        'activity_shared_extract': 'の抜粋を共有しました',
        'activity_followed': 'をフォローしました',
        'notif_liked_your_extract': 'あなたの抜粋をいいねしました',
        'notif_liked_your_comment': 'あなたのコメントをいいねしました',
        'notif_commented_your_extract': 'あなたの抜粋にコメントしました',
        'notif_mentioned_you': 'あなたをメンションしました',
        'notif_replied_your_comment': 'あなたのコメントに返信しました',
        'notif_follows_you': 'あなたをフォローしました',
        'notif_sent_message': 'メッセージを送りました',
        'notif_reacted': 'リアクションしました',
        'notif_to_your_content': 'あなたのコンテンツに',
        'notif_added_to_collection': 'あなたの抜粋をコレクションに追加しました',
        'notif_shared_your_extract': 'あなたの抜粋を共有しました',
        'someone': '誰か',

        // Banners and empty messages
        'new_texts_loading': '新しいテキスト...',
        'users_to_discover': 'ユーザーを発見',
        'follow_users_hint': 'フォローして「フォロー中」タブで抜粋を見よう',
        'no_activity': 'アクティビティなし',
        'follow_for_activity': 'フォローしてアクティビティを見よう！',
        'share_for_interactions': '共有してインタラクションを見よう！',
        'be_first_to_interact': '最初にインタラクションしよう！',
        'be_first_to_invite': '友達を招待しよう！',
        'share_to_attract': '抜粋を共有して読者を引きつけよう！',
        'be_first_to_share': '最初に共有しよう！',
        'followed': 'フォロー中',
        'follow_btn': 'フォロー',
        'activity_feed': 'アクティビティフィード',
        'follow_whats_happening': 'コミュニティの動向をフォロー',
        'your_followers': 'あなたのフォロワー',
        'followers_see_extracts': 'あなたをフォローしている人',
        'follows_you_since': 'フォロー開始',
        'filter_all': 'すべて',
        'filter_following': 'フォロー中',
        'filter_on_my_extracts': '自分の抜粋',
        'filter_likes': 'いいね',
        'filter_comments': 'コメント',
        'extract_count': '件の抜粋',
        'extract_count_plural': '件の抜粋',
        'its_you': 'あなたです',

        // Drawer mobile
        'sources': 'ソース',
        'welcome_guest': 'ようこそ',
        'connect_to_participate': 'ログインして参加',

        // Filtres exploration
        'form': '❧ 形式',
        'era': '※ 時代',
        'register_tone': '◆ 調子',
        'all': '∞ すべて',
        'free': '∞ 自由',
        'poetry': '詩',
        'narrative': '散文',
        'theater': '演劇',
        'prose_ideas': '評論',
        'sonnet': 'ソネット',
        'ode': '頌歌',
        'elegy': '挽歌',
        'ballad': 'バラード',
        'hymn': '賛歌',
        'prose_poem': '散文詩',
        'tale': '物語',
        'fable': '寓話',
        'legend': '伝説',
        'myth': '神話',
        'novel': '長編小説',
        'short_story': '短編小説',
        'tragedy': '悲劇',
        'comedy': '喜劇',
        'drama': '劇',
        'essay': 'エッセイ',
        'maxim': '格言',
        'aphorism': '箴言',
        'speech': '演説',
        'letter': '書簡',
        'diary': '日記',
        'memoirs': '回想録',
        'antiquity': '古代',
        'middle_ages': '中世',
        'xvii_xviii': '17〜18世紀',
        'xix_century': '19世紀',
        'xx_century': '20世紀',
        'greek_antiquity': '古代ギリシャ',
        'roman_antiquity': '古代ローマ',
        'renaissance': 'ルネサンス',
        'baroque': 'バロック',
        'classicism': '古典主義',
        'enlightenment': '啓蒙時代',
        'romanticism': 'ロマン主義',
        'realism': '写実主義',
        'naturalism': '自然主義',
        'symbolism': '象徴主義',
        'decadentism': 'デカダンス',
        'surrealism': 'シュルレアリスム',
        'existentialism': '実存主義',
        'absurd': '不条理',
        'nouveau_roman': 'ヌーヴォー・ロマン',
        'emotion': '感情',
        'heroism': '英雄主義',
        'imaginary': '想像',
        'comic': '滑稽',
        'nature': '自然',
        'lyric': '叙情的',
        'elegiac': '哀歌的',
        'melancholic': '憂鬱',
        'tragic': '悲劇的',
        'erotic': '官能的',
        'libertine': '放蕩',
        'epic': '叙事的',
        'heroic': '英雄的',
        'chivalric': '騎士的',
        'gothic': 'ゴシック',
        'fantastic': '幻想的',
        'dreamlike': '夢幻的',
        'mystic': '神秘的',
        'satirical': '風刺的',
        'ironic': '皮肉的',
        'burlesque': '道化的',
        'pastoral': '牧歌的',
        'bucolic': '田園的',
        'contemplative': '瞑想的',
        'free_keyword': '自由キーワード…',
        'clear_filters': 'フィルタークリア',
        'roll': '更新',
        'launch': '開始 →',

        // Stats & Badges
        'your_drift': '🎲 あなたの漂流',
        'texts_traversed': 'テキスト',
        'authors': '著者',
        'reading_time': '分',
        'words': '語',
        'threads_to_pull': '🕸️ 探るべき糸',
        'click_to_lose': 'クリックして迷い込む...',
        'badges': '🏆 バッジ',
        'path': '❧ 軌跡',

        // Lecteur
        'full_text': '全文',
        'loading': '読み込み中...',
        'searching': '「{term}」を検索中...',
        'loading_trends': '🔥 トレンド読み込み中...',
        'loading_error': '読み込みエラー',

        // Favoris
        'my_liked': '♥ お気に入り',
        'connect_to_like': 'ログインしていいね',

        // Recherche
        'results_for': '🔍 検索結果',
        'results_for_label': '検索結果',

        // Messages
        'write_message': 'メッセージを書く...',
        'select_conversation': '会話を選択',

        // Partage
        'share_extract': '📤 抜粋を共有',
        'add_comment': 'コメント追加...（任意）',
        'cancel': 'キャンセル',
        'publish': '🚀 公開',

        // Modal Likers
        'liked_by': '❤️ いいねした人',
        'shared_by': '⤴ 共有した人',
        'no_likes_yet': 'まだいいねなし',
        'no_shares_yet': 'まだ共有なし',

        // Sources
        'libraries': '📚 図書館',
        'select_sources': '無限の重写本に使用するソースを選択。',
        'main_sources': '📚 主要ソース',
        'specialized_sources': '🏛️ 専門ソース',
        'apply_changes': '変更を適用',
        'wikisource_desc': '自由な共同図書館。最高品質。',
        'archive_desc': '古書スキャナー。生テキスト（OCR精度に差あり）。',
        'gutenberg_desc': 'パブリックドメインの古典。',
        'gallica_desc': 'フランス国立図書館。デジタル化されたフランス語テキスト。',
        'perseus_desc': '古典ギリシャ語・ラテン語テキスト（英訳）。',
        'sacredtexts_desc': '英語の宗教・神秘テキスト。',
        'poetrydb_desc': '英語詩のデータベース。',

        // Filters
        'collapse_filters': 'フィルターを閉じる',
        'expand_filters': 'フィルターを開く',

        // Notifications
        'mark_all_read': 'すべて既読にする',
        'no_notifications': '通知なし',

        // Actions
        'close': '閉じる',
        'read_more': '続きを読む',
        'show_more': 'もっと見る',
        'show_less': '閉じる',
        'view_full_text': '📖 全文を見る',
        'load_full_text': '全文を読み込む',
        'show_full_text': '全文を表示',
        'collapse_text': 'テキストを閉じる',
        'collapse': '▲ 閉じる',
        'open_source': 'ソースを開く',
        'open': '開く',
        'remove': '削除',

        // Tooltips buttons
        'tooltip_like': 'いいね',
        'tooltip_share': '共有',
        'tooltip_comment': 'コメント',
        'tooltip_add_collection': 'コレクションに追加',
        'tooltip_cancel_share': '共有キャンセル',
        'tooltip_read_wikisource': 'Wikisourceで読む',
        'tooltip_filter_tag': 'タグでフィルター',
        'tooltip_explore': '探索',
        'tooltip_discover_authors': '関連著者を発見',
        'tooltip_actions': '操作',
        'tooltip_react': 'リアクション',
        'tooltip_modify': '編集',
        'tooltip_delete': '削除',
        'tooltip_sent': '送信済み',
        'tooltip_read': '既読',
        'tooltip_modified_at': '編集日時',
        'tooltip_explore_tree': 'ツリーを探索',

        // Comments
        'comment_singular': '件のコメント',
        'comment_plural': '件のコメント',
        'write_comment': 'コメントを書く...',
        'loading_comments': '読み込み中...',
        'modified': '編集済み',
        'modified_on': '編集日時',
        'no_comments_yet': 'まだコメントなし。最初にコメントしよう！',
        'view_source': '🔗 ソースを見る',

        // Literary tags
        'tag_poetry': '詩',
        'tag_novel': '小説',
        'tag_theater': '演劇',
        'tag_essay': 'エッセイ',
        'tag_tale': '物語',
        'tag_short_story': '短編',
        'tag_fable': '寓話',
        'tag_letter': '書簡',
        'tag_memoir': '回想録',
        'tag_speech': '演説',

        // Follow buttons
        'followed': '✓ フォロー中',
        'follow_short': '+ フォロー',

        // Langues
        'modern_languages': '現代語',
        'ancient_languages': '古代語',
        'all_languages_filter': 'すべて',
        'language_all': '言語：すべて',

        // Toast messages
        'all_languages_activated': '🌍 すべての言語を有効化',
        'language_changed': '🌐 言語：',
        'interface_changed': '🌐 インターフェース：日本語',

        // Collections
        'my_collections': '❧ マイコレクション',
        'new_collection': '新規コレクション',
        'no_collection_yet': 'コレクションなし',
        'create_collections_to_organize': 'テーマ別にテキストを整理するコレクションを作成',
        'create_first_collection': '最初のコレクションを作成',
        'public': '公開',
        'private': '非公開',
        'texts_count': '件のテキスト',
        'texts_count_plural': '件のテキスト',
        'back_to_collections': '← コレクション',
        'empty_collection': 'コレクションは空です',
        'add_texts_to_collection': 'リーダーからテキストを追加',
        'edit': '編集',
        'delete': '削除',
        'collection_name': 'コレクション名',
        'collection_description': '説明（任意）',
        'create_collection': 'コレクション作成',
        'save_changes': '保存',
        'delete_collection_confirm': 'コレクションを削除？',
        'connect_to_see_collections': '📝 ログインしてコレクションを見る',

        // Modals collection
        'new_collection_title': '+ 新規コレクション',
        'edit_collection_title': 'コレクション編集',
        'collection_name_label': '名前',
        'collection_name_placeholder': '例：ロマン派の詩',
        'collection_desc_label': '説明（任意）',
        'collection_desc_placeholder': '短い説明...',
        'collection_emoji_label': '絵文字',
        'collection_color_label': '色',
        'collection_public_label': '公開コレクション（全員に公開）',
        'collection_public_short': '公開コレクション',
        'enter_collection_name': '❌ コレクション名を入力',
        'loading_text': '読み込み中…',
        'text_unavailable': 'テキストは利用できません。',
        'view_on_wikisource': 'Wikisourceで見る →',
        'loading_error': '読み込みエラー。',
        'open_source_link': 'ソースを開く',
        'external_source': '外部ソース。',
        'open_in_new_tab': '新しいタブで開く',
        'no_source_available': '利用可能なソースなし',
        'without_title': '無題',
        'unknown_author': '著者不明',
        'show_full_text_aria': '全文を表示',

        // Collection picker
        'add_to_collection': '+ コレクションに追加',
        'no_collection_create': 'コレクションなし。作成しよう！',
        'to_remove_open_collection': '💡 削除するにはコレクションを開く',
        'error_creation': '❌ 作成エラー',
        'error_modification': '❌ 変更エラー',
        'error_deletion': '❌ 削除エラー',
        'error_adding': '❌ 追加エラー',
        'delete_collection_prompt': 'コレクション「{name}」を削除？\nテキストはお気に入りから削除されません。',
        'connect_to_create_collection': '📝 ログインしてコレクション作成',
        'collection_name_required': '❌ コレクション名は必須',
        'collection_created': '✅ コレクション「{name}」を作成',
        'collection_updated': '✅ コレクション更新済み',
        'collection_deleted': 'コレクション「{name}」を削除',
        'connect_to_organize_collections': '📝 ログインして管理',
        'already_in_collection': '📌 すでにコレクションに追加済み',
        'added_to_collection': '📌「{name}」に追加',
        'removed_from_collection': 'コレクションから削除',
        'confirm_remove_title': 'コレクションから削除？',
        'confirm_remove_message': 'コレクションからこの抜粋を削除しますか？',
        'confirm': '確認',
        'extrait_not_found': '❌ 抜粋が見つかりません',
        'extrait_in_no_collection': '📌 この抜粋はどのコレクションにもありません',
        'connect_to_use_collections': '📝 ログインしてコレクションを使う',
        'collection_not_found': 'コレクションが見つかりません',
        'error_opening': 'オープンエラー',
        'name_required': '❌ 名前は必須',
        'element_not_found': 'エラー：要素が見つかりません',
        'full_text_loaded': '全文を読み込みました',

        // Share
        'share_link': '🔗 リンクを共有',
        'link_copied': '🔗 リンクをコピーしました！',
        'discover_palimpseste': 'Palimpseste を発見'
    },

    // ═══════════════════════════════════════════════════════════
    // 🇸🇦 ARABE
    // ═══════════════════════════════════════════════════════════
    ar: {
        // Navigation & Header
        'random': 'عشوائي',
        'trending': 'رائج',
        'all_languages': 'الكل',
        'search_placeholder': 'ابحث عن مؤلف، كلمة، موضوع...',
        'my_likes': 'المفضلة',
        'collections': 'مجموعات',
        'community': 'المجتمع',
        'messages': 'الرسائل',
        'notifications': 'الإشعارات',
        'change_theme': 'تغيير المظهر',
        'light_mode': 'وضع فاتح',
        'dark_mode': 'وضع داكن',

        // Authentification
        'welcome_back': 'مرحبًا بعودتك 📚',
        'connect_to_share': 'سجّل الدخول لمشاركة مقتطفاتك',
        'email_or_username': 'البريد أو اسم المستخدم',
        'password': 'كلمة المرور',
        'forgot_password': 'نسيت كلمة المرور؟',
        'login': 'تسجيل الدخول',
        'or': 'أو',
        'continue_google': '🌐 متابعة مع Google',
        'no_account': 'ليس لديك حساب؟',
        'register': 'إنشاء حساب',
        'welcome': 'مرحبًا 🌟',
        'create_account_subtitle': 'أنشئ حسابك للانضمام إلى المجتمع',
        'username': 'اسم المستخدم',
        'email': 'البريد الإلكتروني',
        'password_min': 'كلمة المرور (6 أحرف على الأقل)',
        'create_account': 'إنشاء حسابي',
        'already_account': 'لديك حساب بالفعل؟',
        'logout': 'تسجيل الخروج',
        'forgot_title': 'نسيت كلمة المرور 🔑',
        'forgot_subtitle': 'أدخل بريدك لتلقي رابط إعادة التعيين',
        'send_link': 'إرسال الرابط',
        'back_to_login': '← العودة لتسجيل الدخول',
        'new_password_title': 'كلمة مرور جديدة 🔐',
        'new_password_subtitle': 'اختر كلمة المرور الجديدة',
        'new_password': 'كلمة مرور جديدة (6 أحرف على الأقل)',
        'confirm_password': 'تأكيد كلمة المرور',
        'change_password': 'تغيير كلمة المرور',

        // Profil
        'my_profile': 'ملفي الشخصي',
        'followers': 'المتابعون',
        'following': 'المتابَعون',
        'shared': 'مُشارك',
        'liked': 'مُعجب',
        'follow': 'متابعة',
        'unfollow': 'إلغاء المتابعة',
        'message': 'رسالة',
        'extracts': 'مقتطفات',
        'extraits': 'مقتطفات',
        'likes': 'الإعجابات',
        'online': 'متصل',

        // Tooltips header
        'tooltip_home': 'الرئيسية',
        'tooltip_random': 'نص عشوائي',
        'tooltip_trending': 'النصوص الرائجة',
        'tooltip_choose_lang': 'اختر اللغات',
        'tooltip_my_likes': 'مفضلتي',
        'tooltip_my_collections': 'مجموعاتي',
        'tooltip_community': 'المجتمع',
        'tooltip_messages': 'الرسائل',
        'tooltip_notifications': 'الإشعارات',
        'tooltip_change_theme': 'تغيير المظهر',
        'tooltip_menu': 'القائمة',
        'tooltip_sources': 'المصادر والمكتبات',
        'tooltip_view_profile': 'عرض ملفي',
        'tooltip_manage_sources': 'إدارة المصادر',
        'tooltip_clear_filters': 'مسح الفلاتر',
        'tooltip_reroll': 'تحديث',
        'seen_ago_min': 'منذ {n} دقيقة',
        'seen_ago_hours': 'منذ {n} ساعة',
        'seen_yesterday': 'أمس',
        'seen_ago_days': 'منذ {n} يوم',
        'seen_on': 'آخر ظهور',

        // Feed social
        'social_feed': '🐦 تغذية المجتمع',
        'activity': 'النشاط',
        'users': 'المستخدمون',
        'subscriptions': '👥 المتابَعون',
        'subscribers': '💌 المتابعون',
        'discover': '🔎 اكتشاف',
        'live': '🟢 متصل',

        // Activities & Notifications
        'activity_liked_extract': 'أعجب بمقتطف من',
        'activity_commented_extract': 'علّق على مقتطف من',
        'activity_shared_extract': 'شارك مقتطفًا من',
        'activity_followed': 'تابع',
        'notif_liked_your_extract': 'أعجب بمقتطفك',
        'notif_liked_your_comment': 'أعجب بتعليقك',
        'notif_commented_your_extract': 'علّق على مقتطفك',
        'notif_mentioned_you': 'ذكرك',
        'notif_replied_your_comment': 'ردّ على تعليقك',
        'notif_follows_you': 'يتابعك',
        'notif_sent_message': 'أرسل لك رسالة',
        'notif_reacted': 'تفاعل',
        'notif_to_your_content': 'مع محتواك',
        'notif_added_to_collection': 'أضاف مقتطفك إلى مجموعة',
        'notif_shared_your_extract': 'شارك مقتطفك',
        'someone': 'شخص ما',

        // Banners and empty messages
        'new_texts_loading': 'نصوص جديدة...',
        'users_to_discover': 'مستخدمون للاكتشاف',
        'follow_users_hint': 'تابع أشخاصًا لرؤية مقتطفاتهم في تبويب «المتابَعون»',
        'no_activity': 'لا نشاط',
        'follow_for_activity': 'تابع أشخاصًا لرؤية نشاطهم هنا!',
        'share_for_interactions': 'شارك مقتطفات لرؤية التفاعلات!',
        'be_first_to_interact': 'كن أول من يتفاعل!',
        'be_first_to_invite': 'كن أول من يدعو أصدقاءه!',
        'share_to_attract': 'شارك مقتطفات لجذب القراء!',
        'be_first_to_share': 'كن أول من يشارك مقتطفًا!',
        'followed': 'المتابَعون',
        'follow_btn': 'متابعة',
        'activity_feed': 'تغذية النشاط',
        'follow_whats_happening': 'تابع ما يحدث في المجتمع',
        'your_followers': 'متابعوك',
        'followers_see_extracts': 'هؤلاء يتابعونك ويرون مقتطفاتك',
        'follows_you_since': 'يتابعك منذ',
        'filter_all': 'الكل',
        'filter_following': 'المتابَعون',
        'filter_on_my_extracts': 'مقتطفاتي',
        'filter_likes': 'إعجابات',
        'filter_comments': 'تعليقات',
        'extract_count': 'مقتطف',
        'extract_count_plural': 'مقتطفات',
        'its_you': 'هذا أنت',

        // Drawer mobile
        'sources': 'المصادر',
        'welcome_guest': 'مرحبًا',
        'connect_to_participate': 'سجّل للمشاركة',

        // Filtres exploration
        'form': '❧ الشكل',
        'era': '※ العصر',
        'register_tone': '◆ النبرة',
        'all': '∞ الكل',
        'free': '∞ حر',
        'poetry': 'شعر',
        'narrative': 'سرد',
        'theater': 'مسرح',
        'prose_ideas': 'نثر فكري',
        'sonnet': 'سوناتة',
        'ode': 'قصيدة',
        'elegy': 'رثاء',
        'ballad': 'قصة شعرية',
        'hymn': 'ترنيمة',
        'prose_poem': 'قصيدة نثرية',
        'tale': 'حكاية',
        'fable': 'خرافة',
        'legend': 'أسطورة',
        'myth': 'ميثولوجيا',
        'novel': 'رواية',
        'short_story': 'قصة قصيرة',
        'tragedy': 'مأساة',
        'comedy': 'ملهاة',
        'drama': 'دراما',
        'essay': 'مقال',
        'maxim': 'حكمة',
        'aphorism': 'شذرة',
        'speech': 'خطاب',
        'letter': 'رسالة',
        'diary': 'يوميات',
        'memoirs': 'مذكرات',
        'antiquity': 'العصور القديمة',
        'middle_ages': 'القرون الوسطى',
        'xvii_xviii': 'القرنان 17-18',
        'xix_century': 'القرن 19',
        'xx_century': 'القرن 20',
        'greek_antiquity': 'اليونان القديمة',
        'roman_antiquity': 'روما القديمة',
        'renaissance': 'عصر النهضة',
        'baroque': 'الباروك',
        'classicism': 'الكلاسيكية',
        'enlightenment': 'عصر التنوير',
        'romanticism': 'الرومانسية',
        'realism': 'الواقعية',
        'naturalism': 'الطبيعية',
        'symbolism': 'الرمزية',
        'decadentism': 'الانحطاطية',
        'surrealism': 'السريالية',
        'existentialism': 'الوجودية',
        'absurd': 'العبثية',
        'nouveau_roman': 'الرواية الجديدة',
        'emotion': 'عاطفة',
        'heroism': 'بطولة',
        'imaginary': 'خيال',
        'comic': 'فكاهي',
        'nature': 'طبيعة',
        'lyric': 'غنائي',
        'elegiac': 'رثائي',
        'melancholic': 'كئيب',
        'tragic': 'مأساوي',
        'erotic': 'غزلي',
        'libertine': 'ماجن',
        'epic': 'ملحمي',
        'heroic': 'بطولي',
        'chivalric': 'فروسي',
        'gothic': 'قوطي',
        'fantastic': 'خيالي',
        'dreamlike': 'حالم',
        'mystic': 'صوفي',
        'satirical': 'هجائي',
        'ironic': 'ساخر',
        'burlesque': 'هزلي',
        'pastoral': 'رعوي',
        'bucolic': 'ريفي',
        'contemplative': 'تأملي',
        'free_keyword': 'كلمة حرة…',
        'clear_filters': 'مسح الفلاتر',
        'roll': 'تحديث',
        'launch': 'انطلاق →',

        // Stats & Badges
        'your_drift': '🎲 انجرافك',
        'texts_traversed': 'نصوص',
        'authors': 'مؤلفين',
        'reading_time': 'دقيقة',
        'words': 'كلمات',
        'threads_to_pull': '🕸️ خيوط للاستكشاف',
        'click_to_lose': 'انقر لتتوه...',
        'badges': '🏆 شارات',
        'path': '❧ المسار',

        // Lecteur
        'full_text': 'النص الكامل',
        'loading': 'جاري التحميل...',
        'searching': 'بحث عن "{term}"...',
        'loading_trends': '🔥 تحميل الرائج...',
        'loading_error': 'خطأ في التحميل',

        // Favoris
        'my_liked': '♥ المفضلة',
        'connect_to_like': 'سجّل للإعجاب',

        // Recherche
        'results_for': '🔍 نتائج البحث عن',
        'results_for_label': 'نتائج البحث',

        // Messages
        'write_message': 'اكتب رسالة...',
        'select_conversation': 'اختر محادثة',

        // Partage
        'share_extract': '📤 مشاركة المقتطف',
        'add_comment': 'أضف تعليقًا... (اختياري)',
        'cancel': 'إلغاء',
        'publish': '🚀 نشر',

        // Modal Likers
        'liked_by': '❤️ أُعجب به',
        'shared_by': '⤴ شاركه',
        'no_likes_yet': 'لا إعجابات بعد',
        'no_shares_yet': 'لا مشاركات بعد',

        // Sources
        'libraries': '📚 المكتبات',
        'select_sources': 'اختر المصادر لتوليد الطرس اللانهائي.',
        'main_sources': '📚 المصادر الرئيسية',
        'specialized_sources': '🏛️ المصادر المتخصصة',
        'apply_changes': 'تطبيق التغييرات',
        'wikisource_desc': 'مكتبة تعاونية حرة. أفضل جودة وتنسيق.',
        'archive_desc': 'ماسح كتب قديمة. نصوص خام (OCR قد يكون ناقصًا).',
        'gutenberg_desc': 'كلاسيكيات الملك العام.',
        'gallica_desc': 'المكتبة الوطنية الفرنسية. نصوص فرنسية رقمية.',
        'perseus_desc': 'نصوص يونانية ولاتينية كلاسيكية (ترجمات إنجليزية).',
        'sacredtexts_desc': 'نصوص دينية وروحانية بالإنجليزية.',
        'poetrydb_desc': 'قاعدة بيانات الشعر الإنجليزي.',

        // Filters
        'collapse_filters': 'طي الفلاتر',
        'expand_filters': 'توسيع الفلاتر',

        // Notifications
        'mark_all_read': 'تعيين الكل كمقروء',
        'no_notifications': 'لا إشعارات',

        // Actions
        'close': 'إغلاق',
        'read_more': 'اقرأ المزيد',
        'show_more': 'عرض المزيد',
        'show_less': 'عرض أقل',
        'view_full_text': '📖 عرض النص الكامل',
        'load_full_text': 'تحميل النص الكامل',
        'show_full_text': 'عرض النص الكامل',
        'collapse_text': 'طي النص',
        'collapse': '▲ طي',
        'open_source': 'فتح المصدر',
        'open': 'فتح',
        'remove': 'حذف',

        // Tooltips buttons
        'tooltip_like': 'إعجاب',
        'tooltip_share': 'مشاركة',
        'tooltip_comment': 'تعليق',
        'tooltip_add_collection': 'إضافة إلى مجموعة',
        'tooltip_cancel_share': 'إلغاء المشاركة',
        'tooltip_read_wikisource': 'قراءة على Wikisource',
        'tooltip_filter_tag': 'تصفية بالوسم',
        'tooltip_explore': 'استكشاف',
        'tooltip_discover_authors': 'اكتشف مؤلفين مرتبطين',
        'tooltip_actions': 'إجراءات',
        'tooltip_react': 'تفاعل',
        'tooltip_modify': 'تعديل',
        'tooltip_delete': 'حذف',
        'tooltip_sent': 'مُرسل',
        'tooltip_read': 'مقروء',
        'tooltip_modified_at': 'عُدّل في',
        'tooltip_explore_tree': 'استكشاف الشجرة',

        // Comments
        'comment_singular': 'تعليق',
        'comment_plural': 'تعليقات',
        'write_comment': 'اكتب تعليقًا...',
        'loading_comments': 'جاري التحميل...',
        'modified': 'معدّل',
        'modified_on': 'عُدّل في',
        'no_comments_yet': 'لا تعليقات بعد. كن الأول!',
        'view_source': '🔗 عرض المصدر',

        // Literary tags
        'tag_poetry': 'شعر',
        'tag_novel': 'رواية',
        'tag_theater': 'مسرح',
        'tag_essay': 'مقال',
        'tag_tale': 'حكاية',
        'tag_short_story': 'قصة قصيرة',
        'tag_fable': 'خرافة',
        'tag_letter': 'رسالة',
        'tag_memoir': 'مذكرات',
        'tag_speech': 'خطاب',

        // Follow buttons
        'followed': '✓ متابَع',
        'follow_short': '+ متابعة',

        // Langues
        'modern_languages': 'لغات حديثة',
        'ancient_languages': 'لغات قديمة',
        'all_languages_filter': 'الكل',
        'language_all': 'اللغة: الكل',

        // Toast messages
        'all_languages_activated': '🌍 تم تفعيل جميع اللغات',
        'language_changed': '🌐 اللغة:',
        'interface_changed': '🌐 الواجهة بالعربية',

        // Collections
        'my_collections': '❧ مجموعاتي',
        'new_collection': 'مجموعة جديدة',
        'no_collection_yet': 'لا مجموعات بعد',
        'create_collections_to_organize': 'أنشئ مجموعات لتنظيم نصوصك بحسب الموضوع',
        'create_first_collection': 'إنشاء أول مجموعة',
        'public': 'عامة',
        'private': 'خاصة',
        'texts_count': 'نص',
        'texts_count_plural': 'نصوص',
        'back_to_collections': '← المجموعات',
        'empty_collection': 'المجموعة فارغة',
        'add_texts_to_collection': 'أضف نصوصًا من القارئ',
        'edit': 'تعديل',
        'delete': 'حذف',
        'collection_name': 'اسم المجموعة',
        'collection_description': 'الوصف (اختياري)',
        'create_collection': 'إنشاء مجموعة',
        'save_changes': 'حفظ',
        'delete_collection_confirm': 'حذف هذه المجموعة؟',
        'connect_to_see_collections': '📝 سجّل لرؤية المجموعات',

        // Modals collection
        'new_collection_title': '+ مجموعة جديدة',
        'edit_collection_title': 'تعديل المجموعة',
        'collection_name_label': 'الاسم',
        'collection_name_placeholder': 'مثال: شعر رومانسي',
        'collection_desc_label': 'الوصف (اختياري)',
        'collection_desc_placeholder': 'وصف مختصر...',
        'collection_emoji_label': 'رمز تعبيري',
        'collection_color_label': 'اللون',
        'collection_public_label': 'مجموعة عامة (مرئية للجميع)',
        'collection_public_short': 'مجموعة عامة',
        'enter_collection_name': '❌ أدخل اسم المجموعة',
        'loading_text': 'جاري التحميل…',
        'text_unavailable': 'النص غير متوفر.',
        'view_on_wikisource': 'عرض على Wikisource →',
        'loading_error': 'خطأ في التحميل.',
        'open_source_link': 'فتح المصدر',
        'external_source': 'مصدر خارجي.',
        'open_in_new_tab': 'فتح في تبويب جديد',
        'no_source_available': 'لا مصدر متاح',
        'without_title': 'بدون عنوان',
        'unknown_author': 'مؤلف مجهول',
        'show_full_text_aria': 'عرض النص الكامل',

        // Collection picker
        'add_to_collection': '+ إضافة إلى مجموعة',
        'no_collection_create': 'لا مجموعات. أنشئ واحدة!',
        'to_remove_open_collection': '💡 للحذف، افتح المجموعة',
        'error_creation': '❌ خطأ في الإنشاء',
        'error_modification': '❌ خطأ في التعديل',
        'error_deletion': '❌ خطأ في الحذف',
        'error_adding': '❌ خطأ في الإضافة',
        'delete_collection_prompt': 'حذف مجموعة "{name}"؟\nلن تُحذف النصوص من المفضلة.',
        'connect_to_create_collection': '📝 سجّل لإنشاء مجموعة',
        'collection_name_required': '❌ اسم المجموعة مطلوب',
        'collection_created': '✅ مجموعة "{name}" أُنشئت',
        'collection_updated': '✅ تم تحديث المجموعة',
        'collection_deleted': 'مجموعة "{name}" حُذفت',
        'connect_to_organize_collections': '📝 سجّل لتنظيم مجموعاتك',
        'already_in_collection': '📌 موجود بالفعل في المجموعة',
        'added_to_collection': '📌 أُضيف إلى "{name}"',
        'removed_from_collection': 'أُزيل من المجموعة',
        'confirm_remove_title': 'إزالة من المجموعة؟',
        'confirm_remove_message': 'هل تريد فعلاً إزالة هذا المقتطف من المجموعة؟',
        'confirm': 'تأكيد',
        'extrait_not_found': '❌ لم يُعثر على المقتطف',
        'extrait_in_no_collection': '📌 هذا المقتطف ليس في أي مجموعة',
        'connect_to_use_collections': '📝 سجّل لاستخدام المجموعات',
        'collection_not_found': 'لم يُعثر على المجموعة',
        'error_opening': 'خطأ في الفتح',
        'name_required': '❌ الاسم مطلوب',
        'element_not_found': 'خطأ: العنصر غير موجود',
        'full_text_loaded': 'تم تحميل النص الكامل',

        // Share
        'share_link': '🔗 مشاركة الرابط',
        'link_copied': '🔗 تم نسخ الرابط!',
        'discover_palimpseste': 'اكتشف Palimpseste'
    }
};

// ═══════════════════════════════════════════════════════════
// 🌐 LANGUE DE L'INTERFACE (séparée de la langue des contenus)
// ═══════════════════════════════════════════════════════════

const UI_LANG_KEY = 'palimpseste_ui_lang';
let currentUILang = 'fr'; // Par défaut français

/**
 * Récupère la langue de l'interface sauvegardée
 */
function getUILanguage() {
    return localStorage.getItem(UI_LANG_KEY) || 'fr';
}

/**
 * Sauvegarde la langue de l'interface
 */
function setUILanguage(lang) {
    localStorage.setItem(UI_LANG_KEY, lang);
    currentUILang = lang;
}

/**
 * Obtient une traduction pour la clé donnée
 * @param {string} key - Clé de traduction
 * @param {string} [lang] - Langue (utilise la langue courante si non spécifiée)
 * @returns {string} Traduction ou clé si non trouvée
 */
function t(key, lang = null) {
    const useLang = lang || currentUILang;
    // Si la langue n'existe pas dans les traductions, utiliser l'anglais comme fallback
    const langDict = translations[useLang] || translations['en'];
    return langDict[key] || translations['en'][key] || key;
}

/**
 * Applique les traductions à tous les éléments de la page
 */
function applyTranslations() {
    // Mise à jour de l'attribut lang du document
    document.documentElement.lang = currentUILang;
    
    // ═══════════════════════════════════════════════════════════
    // HEADER TOOLTIPS
    // ═══════════════════════════════════════════════════════════
    
    // Mobile nav buttons
    const mobileNavFeed = document.querySelector('[data-nav="feed"]');
    if (mobileNavFeed) mobileNavFeed.title = t('tooltip_home');
    
    const mobileNavRandom = document.querySelector('[data-nav="random"]');
    if (mobileNavRandom) mobileNavRandom.title = t('random');
    
    const mobileNavMessages = document.querySelector('[data-nav="messages"]');
    if (mobileNavMessages) mobileNavMessages.title = t('messages');
    
    const mobileNavMenu = document.querySelector('[data-nav="menu"]');
    if (mobileNavMenu) mobileNavMenu.title = t('tooltip_menu');
    
    // Desktop header buttons
    const randomBtnDesktop = document.querySelector('.header-btn[onclick*="pureRandomJump"]');
    if (randomBtnDesktop) randomBtnDesktop.title = t('tooltip_random');
    
    const trendingBtnDesktop = document.querySelector('.header-btn[onclick*="openTrendingFeed"]');
    if (trendingBtnDesktop) trendingBtnDesktop.title = t('tooltip_trending');
    
    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.title = t('tooltip_choose_lang');
    
    const favoritesBtn = document.querySelector('.favorites-btn');
    if (favoritesBtn) favoritesBtn.title = t('tooltip_my_likes');
    
    const collectionsBtn = document.querySelector('.collections-btn');
    if (collectionsBtn) collectionsBtn.title = t('tooltip_my_collections');
    
    const socialBtn = document.querySelector('[onclick*="openSocialFeed"]');
    if (socialBtn && socialBtn.classList.contains('header-btn')) socialBtn.title = t('tooltip_community');
    
    const messagesBtn = document.querySelector('.header-btn[onclick*="openMessaging"]');
    if (messagesBtn) messagesBtn.title = t('tooltip_messages');
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.title = t('tooltip_change_theme');
    
    const notifBtn = document.querySelector('.header-btn[onclick*="toggleNotifications"]');
    if (notifBtn) notifBtn.title = t('tooltip_notifications');
    
    const mobileNotifBtn = document.querySelector('.mobile-notif-btn');
    if (mobileNotifBtn) mobileNotifBtn.title = t('tooltip_notifications');
    
    // Drawer tooltips
    const sourcesDrawerBtn = document.querySelector('.drawer-icon-btn[onclick*="openSourceSettingsModal"]');
    if (sourcesDrawerBtn) sourcesDrawerBtn.title = t('tooltip_sources');
    
    const profileHeaderCard = document.querySelector('.profile-header-card');
    if (profileHeaderCard) profileHeaderCard.title = t('tooltip_view_profile');
    
    const sourcesBtn = document.querySelector('.sources-btn');
    if (sourcesBtn) sourcesBtn.title = t('tooltip_manage_sources');
    
    // Filter summary tooltips
    const clearFiltersBtn = document.querySelector('.filter-summary-clear');
    if (clearFiltersBtn) clearFiltersBtn.title = t('tooltip_clear_filters');
    
    const rerollBtn = document.querySelector('.filter-summary-random');
    if (rerollBtn) rerollBtn.title = t('tooltip_reroll');
    
    // ═══════════════════════════════════════════════════════════
    // HEADER BUTTON TEXT
    // ═══════════════════════════════════════════════════════════
    
    // Header - Boutons
    const randomBtns = document.querySelectorAll('[onclick*="pureRandomJump"]');
    randomBtns.forEach(btn => {
        const span = btn.querySelector('span');
        if (span) span.textContent = t('random');
    });
    
    const trendingBtns = document.querySelectorAll('[onclick*="openTrendingFeed"]');
    trendingBtns.forEach(btn => {
        const span = btn.querySelector('span');
        if (span) span.textContent = t('trending');
    });
    
    // Barre de recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.placeholder = t('search_placeholder');
    
    // Drawer mobile - actions rapides
    const drawerTrending = document.querySelector('.drawer-action-btn[onclick*="openTrendingFeed"] span');
    if (drawerTrending) {
        drawerTrending.textContent = t('trending');
    }
    
    const drawerFav = document.querySelector('.drawer-action-btn[onclick*="openFavoritesView"] span');
    if (drawerFav) {
        drawerFav.textContent = t('my_likes');
    }

    const drawerCollections = document.querySelector('.drawer-action-btn[onclick*="openCollectionsView"] span');
    if (drawerCollections) {
        drawerCollections.textContent = t('collections');
    }
    
    const drawerSocial = document.querySelector('.drawer-action-btn[onclick*="openSocialFeed"] span');
    if (drawerSocial) {
        drawerSocial.textContent = t('community');
    }

    const drawerMessages = document.querySelector('.drawer-action-btn[onclick*="openMessaging"] span');
    if (drawerMessages) {
        drawerMessages.textContent = t('messages');
    }
    
    // Theme toggle drawer
    const drawerThemeText = document.getElementById('drawerThemeText');
    if (drawerThemeText) {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        drawerThemeText.textContent = isLight ? t('dark_mode') : t('light_mode');
    }
    
    // Logout button
    const drawerLogout = document.getElementById('drawerLogoutBtn');
    if (drawerLogout) {
        drawerLogout.innerHTML = drawerLogout.innerHTML.replace(/Déconnexion/g, t('logout'));
    }
    
    // Mobile profile panel
    const mobileProfileTitle = document.querySelector('.mobile-profile-title');
    if (mobileProfileTitle) mobileProfileTitle.textContent = t('welcome_guest');
    
    const mobileProfileSubtitle = document.querySelector('.mobile-profile-subtitle');
    if (mobileProfileSubtitle) mobileProfileSubtitle.textContent = t('connect_to_participate');
    
    const mobileLoginBtn = document.querySelector('.mobile-profile-btn-primary');
    if (mobileLoginBtn) mobileLoginBtn.textContent = t('login');
    
    const mobileRegisterBtn = document.querySelector('.mobile-profile-btn-secondary');
    if (mobileRegisterBtn) mobileRegisterBtn.textContent = t('create_account');
    
    // Profile stats labels
    document.querySelectorAll('.mobile-profile-stat-label').forEach((label, index) => {
        const labels = [t('shared'), t('liked'), t('followers'), t('following')];
        if (labels[index]) label.textContent = labels[index];
    });
    
    // Mobile logout
    const mobileLogout = document.querySelector('.mobile-profile-btn-logout');
    if (mobileLogout) mobileLogout.innerHTML = '⎋ ' + t('logout');
    
    // Sidebar profile section
    const loginPromptText = document.querySelector('.login-prompt-text');
    if (loginPromptText) loginPromptText.textContent = t('connect_to_share');
    
    const loginPromptBtn = document.querySelector('.login-prompt-btn:not(.secondary)');
    if (loginPromptBtn) loginPromptBtn.textContent = t('login');
    
    const loginPromptBtnSecondary = document.querySelector('.login-prompt-btn.secondary');
    if (loginPromptBtnSecondary) loginPromptBtnSecondary.textContent = t('create_account');
    
    // Sidebar stats labels
    document.querySelectorAll('.stat-label').forEach((label, index) => {
        const labels = [t('shared'), t('liked'), t('followers'), t('following')];
        if (labels[index]) label.textContent = labels[index];
    });
    
    // Sidebar logout
    const sidebarLogout = document.querySelector('.drawer-logout-btn');
    if (sidebarLogout) sidebarLogout.innerHTML = '⎋ ' + t('logout');
    
    // Sources button (update content - title already set earlier)
    const sourcesBtnContent = document.querySelector('.sources-btn');
    if (sourcesBtnContent) {
        // Reconstruire entièrement le contenu du bouton pour éviter les bugs de langue
        sourcesBtnContent.innerHTML = '<i data-lucide="settings" style="width: 16px; height: 16px; margin-right: 6px;"></i> ' + t('sources');
        // Réinitialiser l'icône Lucide
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    // Stats sections
    const statsHeaders = document.querySelectorAll('.stats-section h3');
    statsHeaders.forEach(h3 => {
        if (h3.textContent.includes('dérive')) h3.innerHTML = t('your_drift');
        if (h3.textContent.includes('Fils')) h3.innerHTML = t('threads_to_pull');
        if (h3.textContent.includes('likés')) h3.innerHTML = t('my_liked').replace('♥ ', '💎 ');
        if (h3.textContent.includes('Badges')) {
            const badge = h3.querySelector('.badges-count-inline');
            h3.innerHTML = t('badges') + ' ';
            if (badge) h3.appendChild(badge);
        }
        if (h3.textContent.includes('Parcours')) h3.innerHTML = t('path');
    });
    
    // Exploration filters
    const filterLabels = document.querySelectorAll('.filter-label');
    filterLabels.forEach(label => {
        if (label.textContent.includes('Forme')) label.textContent = t('form');
        if (label.textContent.includes('Époque')) label.textContent = t('era');
        if (label.textContent.includes('Registre')) label.textContent = t('register_tone');
    });
    
    // Filter chips - categories
    updateFilterChipTranslations();
    
    // Free keyword input
    const freeInput = document.getElementById('explorationFreeInput');
    if (freeInput) freeInput.placeholder = t('free_keyword');
    
    // Filter summary buttons
    const clearBtn = document.querySelector('.filter-summary-clear');
    if (clearBtn) clearBtn.title = t('clear_filters');
    
    const randomBtn = document.querySelector('.filter-summary-random');
    if (randomBtn) randomBtn.title = t('roll');
    
    const launchBtn = document.querySelector('.filter-summary-go');
    if (launchBtn) launchBtn.textContent = t('launch');
    
    // Toggle filters button
    const toggleText = document.getElementById('toggleFiltersText');
    const container = document.getElementById('explorationContainer');
    if (toggleText) {
        const isCollapsed = container && container.classList.contains('collapsed');
        toggleText.textContent = isCollapsed ? t('expand_filters') : t('collapse_filters');
    }
    
    // Loading indicator
    const loadingText = document.querySelector('#loading span');
    if (loadingText) loadingText.textContent = t('loading');
    
    // Reader overlay
    const readerTitle = document.getElementById('readerTitle');
    if (readerTitle && readerTitle.textContent === 'Texte complet') {
        readerTitle.textContent = t('full_text');
    }
    
    // Favorites overlay
    const favTitle = document.querySelector('#favoritesOverlay .favorites-title');
    if (favTitle) favTitle.textContent = t('my_liked');
    
    // Social overlay
    const socialTitle = document.querySelector('#socialOverlay .favorites-title');
    if (socialTitle) socialTitle.textContent = t('social_feed');
    
    // Social tabs - mettre à jour seulement les .tab-label si présents
    const tabRecent = document.getElementById('tabRecent');
    const tabRecentLabel = tabRecent?.querySelector('.tab-label');
    if (tabRecentLabel) tabRecentLabel.textContent = t('trending');
    else if (tabRecent) tabRecent.innerHTML = '🔥 ' + t('trending');
    
    const tabActivity = document.getElementById('tabActivity');
    const tabActivityLabel = tabActivity?.querySelector('.tab-label');
    if (tabActivityLabel) tabActivityLabel.textContent = t('activity');
    else if (tabActivity) tabActivity.textContent = t('activity');
    
    const tabFriends = document.getElementById('tabFriends');
    const tabFriendsLabel = tabFriends?.querySelector('.tab-label');
    if (tabFriendsLabel) tabFriendsLabel.textContent = t('following');
    else if (tabFriends) tabFriends.textContent = t('subscriptions');
    
    const tabFollowers = document.getElementById('tabFollowers');
    const tabFollowersLabel = tabFollowers?.querySelector('.tab-label');
    if (tabFollowersLabel) tabFollowersLabel.textContent = t('followers');
    else if (tabFollowers) tabFollowers.textContent = t('subscribers');
    
    const tabDiscover = document.getElementById('tabDiscover');
    const tabDiscoverLabel = tabDiscover?.querySelector('.tab-label');
    if (tabDiscoverLabel) tabDiscoverLabel.textContent = t('users');
    else if (tabDiscover) tabDiscover.textContent = t('users');
    
    const liveIndicator = document.getElementById('liveIndicator');
    if (liveIndicator) liveIndicator.textContent = t('live');
    
    // Floating close button
    const floatingClose = document.querySelector('.floating-close-btn');
    if (floatingClose) floatingClose.textContent = '✕ ' + t('close');
    
    // User profile modal
    const followBtn = document.getElementById('profileFollowBtn');
    if (followBtn && followBtn.textContent === 'Suivre') {
        followBtn.textContent = t('follow');
    }
    
    // Profile stats labels in modal
    const profileStats = document.querySelectorAll('.profile-stats .profile-stat');
    if (profileStats.length >= 4) {
        // Preserve the <strong> values but update labels
        profileStats[0].innerHTML = profileStats[0].querySelector('strong')?.outerHTML + ' ' + t('followers');
        profileStats[1].innerHTML = profileStats[1].querySelector('strong')?.outerHTML + ' ' + t('following');
        profileStats[2].innerHTML = profileStats[2].querySelector('strong')?.outerHTML + ' ' + t('extraits');
        profileStats[3].innerHTML = profileStats[3].querySelector('strong')?.outerHTML + ' ' + t('collections');
    }
    
    // Profile tabs
    const profileTabLabels = document.querySelectorAll('.profile-tab .tab-label');
    const profileTabNames = [t('extracts'), t('likes'), t('collections'), t('followers'), t('following')];
    profileTabLabels.forEach((label, i) => {
        if (profileTabNames[i]) label.textContent = profileTabNames[i];
    });
    
    // Messaging modal
    const msgTitle = document.querySelector('.messages-sidebar-title');
    if (msgTitle) msgTitle.textContent = '💬 ' + t('messages');
    
    const chatPlaceholder = document.getElementById('chatPlaceholder');
    if (chatPlaceholder) chatPlaceholder.textContent = t('select_conversation');
    
    const chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.placeholder = t('write_message');
    
    // Auth modal
    updateAuthModalTranslations();
    
    // Sources modal
    updateSourcesModalTranslations();
    
    // Share modal
    const shareTitle = document.querySelector('.share-title');
    if (shareTitle) shareTitle.textContent = t('share_extract');
    
    const shareCommentary = document.getElementById('shareCommentary');
    if (shareCommentary) shareCommentary.placeholder = t('add_comment');
    
    const cancelBtn = document.querySelector('.share-btn.secondary');
    if (cancelBtn) cancelBtn.textContent = t('cancel');
    
    const publishBtn = document.getElementById('publishBtn');
    if (publishBtn) publishBtn.textContent = t('publish');
    
    // Likers modal
    const likersTitle = document.querySelector('.likers-header h3');
    if (likersTitle) likersTitle.textContent = t('liked_by');
    
    // Search results - Traduire le label
    const searchLabel = document.querySelector('.search-results-title [data-i18n="results_for_label"]');
    if (searchLabel) {
        searchLabel.textContent = t('results_for_label');
    }
    
    // Source settings modal
    const sourceModalTitle = document.querySelector('#sourceSettingsModal .favorites-title');
    if (sourceModalTitle) sourceModalTitle.textContent = t('libraries');
    
    const sourceDesc = document.querySelector('#sourceSettingsModal p');
    if (sourceDesc) sourceDesc.textContent = t('select_sources');
    
    // Notifications
    const notifTitle = document.querySelector('.notif-title');
    if (notifTitle) notifTitle.innerHTML = '<i data-lucide="bell" class="notif-title-icon"></i> ' + t('notifications');
    
    const markReadBtn = document.querySelector('.notif-mark-read');
    if (markReadBtn) markReadBtn.textContent = t('mark_all_read');
    
    const notifEmpty = document.querySelector('.notif-empty');
    if (notifEmpty) notifEmpty.textContent = t('no_notifications');
    
    // Apply changes button in source modal
    const applyBtn = document.querySelector('#sourceSettingsModal .btn-primary');
    if (applyBtn) applyBtn.textContent = t('apply_changes');
    
    // Réinitialiser les icônes Lucide
    if (window.lucide) lucide.createIcons();
}

/**
 * Met à jour les traductions des filtres d'exploration
 */
function updateFilterChipTranslations() {
    const chipMappings = {
        // Forme
        'category-poesie': 'poetry',
        'category-recit': 'narrative', 
        'category-theatre': 'theater',
        'category-idees': 'prose_ideas',
        'sonnet': 'sonnet',
        'ode': 'ode',
        'elegie': 'elegy',
        'ballade': 'ballad',
        'hymne': 'hymn',
        'poeme-prose': 'prose_poem',
        'conte': 'tale',
        'fable': 'fable',
        'legende': 'legend',
        'mythe': 'myth',
        'roman': 'novel',
        'nouvelle': 'short_story',
        'tragedie': 'tragedy',
        'comedie': 'comedy',
        'drame': 'drama',
        'essai': 'essay',
        'maxime': 'maxim',
        'aphorisme': 'aphorism',
        'discours': 'speech',
        'lettre': 'letter',
        'journal': 'diary',
        'memoires': 'memoirs',
        // Époque
        'category-antiquite': 'antiquity',
        'category-medieval': 'middle_ages',
        'category-classique-group': 'xvii_xviii',
        'category-xixe': 'xix_century',
        'category-xxe': 'xx_century',
        'antiquite-grecque': 'greek_antiquity',
        'antiquite-romaine': 'roman_antiquity',
        'medieval': 'middle_ages',
        'renaissance': 'renaissance',
        'baroque': 'baroque',
        'classique': 'classicism',
        'lumieres': 'enlightenment',
        'romantisme': 'romanticism',
        'realisme': 'realism',
        'naturalisme': 'naturalism',
        'symbolisme': 'symbolism',
        'decadentisme': 'decadentism',
        'surrealisme': 'surrealism',
        'existentialisme': 'existentialism',
        'absurde': 'absurd',
        'nouveau-roman': 'nouveau_roman',
        // Registre
        'category-emotion': 'emotion',
        'category-heroisme': 'heroism',
        'category-imaginaire': 'imaginary',
        'category-comique': 'comic',
        'category-nature': 'nature',
        'lyrique': 'lyric',
        'elegiaque': 'elegiac',
        'melancolique': 'melancholic',
        'tragique': 'tragic',
        'erotique': 'erotic',
        'libertin': 'libertine',
        'epique': 'epic',
        'heroique': 'heroic',
        'chevaleresque': 'chivalric',
        'gothique': 'gothic',
        'fantastique': 'fantastic',
        'onirique': 'dreamlike',
        'mystique': 'mystic',
        'satirique': 'satirical',
        'ironique': 'ironic',
        'burlesque': 'burlesque',
        'pastoral': 'pastoral',
        'bucolique': 'bucolic',
        'contemplatif': 'contemplative'
    };
    
    document.querySelectorAll('.filter-chip').forEach(chip => {
        const value = chip.dataset.value;
        if (value === 'all') {
            const filter = chip.dataset.filter;
            chip.textContent = filter === 'ton' ? t('free') : t('all');
        } else if (chipMappings[value]) {
            chip.textContent = t(chipMappings[value]);
        }
    });
}

/**
 * Met à jour les traductions du modal d'authentification
 */
function updateAuthModalTranslations() {
    // Login form
    const loginTitle = document.querySelector('#loginForm .auth-title');
    if (loginTitle) loginTitle.textContent = t('welcome_back');
    
    const loginSubtitle = document.querySelector('#loginForm .auth-subtitle');
    if (loginSubtitle) loginSubtitle.textContent = t('connect_to_share');
    
    const loginEmail = document.getElementById('loginEmail');
    if (loginEmail) loginEmail.placeholder = t('email_or_username');
    
    const loginPassword = document.getElementById('loginPassword');
    if (loginPassword) loginPassword.placeholder = t('password');
    
    const forgotLink = document.querySelector('.auth-forgot a');
    if (forgotLink) forgotLink.textContent = t('forgot_password');
    
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.textContent = t('login');
    
    const orDividers = document.querySelectorAll('.auth-divider span');
    orDividers.forEach(span => span.textContent = t('or'));
    
    const googleBtns = document.querySelectorAll('.auth-btn.secondary');
    googleBtns.forEach(btn => {
        if (btn.textContent.includes('Google')) btn.textContent = t('continue_google');
    });
    
    const loginSwitchText = document.querySelector('#loginForm .auth-switch');
    if (loginSwitchText) {
        loginSwitchText.innerHTML = t('no_account') + ' <a onclick="switchAuthForm(\'register\')">' + t('register') + '</a>';
    }
    
    // Register form
    const registerTitle = document.querySelector('#registerForm .auth-title');
    if (registerTitle) registerTitle.textContent = t('welcome');
    
    const registerSubtitle = document.querySelector('#registerForm .auth-subtitle');
    if (registerSubtitle) registerSubtitle.textContent = t('create_account_subtitle');
    
    const registerUsername = document.getElementById('registerUsername');
    if (registerUsername) registerUsername.placeholder = t('username');
    
    const registerEmail = document.getElementById('registerEmail');
    if (registerEmail) registerEmail.placeholder = t('email');
    
    const registerPassword = document.getElementById('registerPassword');
    if (registerPassword) registerPassword.placeholder = t('password_min');
    
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) registerBtn.textContent = t('create_account');
    
    const registerSwitchText = document.querySelector('#registerForm .auth-switch');
    if (registerSwitchText) {
        registerSwitchText.innerHTML = t('already_account') + ' <a onclick="switchAuthForm(\'login\')">' + t('login') + '</a>';
    }
    
    // Forgot form
    const forgotTitle = document.querySelector('#forgotForm .auth-title');
    if (forgotTitle) forgotTitle.textContent = t('forgot_title');
    
    const forgotSubtitle = document.querySelector('#forgotForm .auth-subtitle');
    if (forgotSubtitle) forgotSubtitle.textContent = t('forgot_subtitle');
    
    const forgotEmailInput = document.getElementById('forgotEmail');
    if (forgotEmailInput) forgotEmailInput.placeholder = t('email');
    
    const forgotBtn = document.getElementById('forgotBtn');
    if (forgotBtn) forgotBtn.textContent = t('send_link');
    
    const backToLogin = document.querySelector('#forgotForm .auth-switch a');
    if (backToLogin) backToLogin.textContent = t('back_to_login');
    
    // Reset password form
    const resetTitle = document.querySelector('#resetPasswordForm .auth-title');
    if (resetTitle) resetTitle.textContent = t('new_password_title');
    
    const resetSubtitle = document.querySelector('#resetPasswordForm .auth-subtitle');
    if (resetSubtitle) resetSubtitle.textContent = t('new_password_subtitle');
    
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) newPasswordInput.placeholder = t('new_password');
    
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) confirmPasswordInput.placeholder = t('confirm_password');
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.textContent = t('change_password');
}

/**
 * Met à jour les traductions du modal des sources
 */
function updateSourcesModalTranslations() {
    const title = document.getElementById('sourcesModalTitle');
    if (title) title.textContent = t('libraries');
    
    const subtitle = document.getElementById('sourcesModalSubtitle');
    if (subtitle) subtitle.textContent = t('select_sources');
    
    const mainLabel = document.getElementById('mainSourcesLabel');
    if (mainLabel) mainLabel.textContent = t('main_sources');
    
    const specializedLabel = document.getElementById('specializedSourcesLabel');
    if (specializedLabel) specializedLabel.textContent = t('specialized_sources');
    
    const wikisourceDesc = document.getElementById('wikisourceDesc');
    if (wikisourceDesc) wikisourceDesc.textContent = t('wikisource_desc');
    
    const archiveDesc = document.getElementById('archiveDesc');
    if (archiveDesc) archiveDesc.textContent = t('archive_desc');
    
    const gutenbergDesc = document.getElementById('gutenbergDesc');
    if (gutenbergDesc) gutenbergDesc.textContent = t('gutenberg_desc');
    
    const gallicaDesc = document.getElementById('gallicaDesc');
    if (gallicaDesc) gallicaDesc.textContent = t('gallica_desc');
    
    const perseusDesc = document.getElementById('perseusDesc');
    if (perseusDesc) perseusDesc.textContent = t('perseus_desc');
    
    const sacredtextsDesc = document.getElementById('sacredtextsDesc');
    if (sacredtextsDesc) sacredtextsDesc.textContent = t('sacredtexts_desc');
    
    const poetrydbDesc = document.getElementById('poetrydbDesc');
    if (poetrydbDesc) poetrydbDesc.textContent = t('poetrydb_desc');
    
    const applyBtn = document.getElementById('applySourcesBtn');
    if (applyBtn) applyBtn.textContent = t('apply_changes');
}

/**
 * Change la langue de l'interface
 * @param {string} lang - Code de langue (fr, en, de, es, it, pt)
 */
function changeUILanguage(lang) {
    // Vérifier que la langue est supportée pour l'interface
    const supportedUILanguages = ['fr', 'en', 'de', 'es', 'it', 'pt', 'ru', 'zh', 'ja', 'ar'];
    
    if (!supportedUILanguages.includes(lang)) {
        return;
    }
    
    setUILanguage(lang);
    applyTranslations();
    // Ne PAS synchroniser les sélecteurs ici - ils contrôlent la langue du CONTENU
    // et peuvent avoir une valeur différente de la langue de l'UI (ex: "all", "ru", etc.)
    toast(t('interface_changed'));
}

/**
 * Synchronise les sélecteurs de langue (desktop et mobile)
 * @param {string} lang - Code de langue sélectionné
 */
function syncLanguageSelectors(lang) {
    const langSelect = document.getElementById('langSelect');
    const drawerLangSelect = document.getElementById('drawerLangSelect');
    
    if (langSelect && langSelect.value !== lang) {
        langSelect.value = lang;
    }
    if (drawerLangSelect && drawerLangSelect.value !== lang) {
        drawerLangSelect.value = lang;
    }
}

/**
 * Initialise le système de traduction
 */
function initI18n() {
    currentUILang = getUILanguage();
    applyTranslations();
    // Les sélecteurs sont synchronisés par app.js avec la langue du CONTENU
    // Ne pas interférer ici avec la langue de l'UI
}

// ═══════════════════════════════════════════════════════════
// 🌐 EXPORTS GLOBAUX
// ═══════════════════════════════════════════════════════════

/**
 * Traduit un tag littéraire (poésie, roman, etc.) selon la langue de l'UI
 * @param {string} tag - Le tag à traduire
 * @returns {string} Tag traduit
 */
function translateTag(tag) {
    if (!tag) return tag;
    const tagLower = tag.toLowerCase();
    
    // Mapping des tags vers les clés de traduction
    const tagKeyMap = {
        'poésie': 'tag_poetry', 'poetry': 'tag_poetry', 'poesie': 'tag_poetry',
        'roman': 'tag_novel', 'novel': 'tag_novel', 'romanzo': 'tag_novel',
        'théâtre': 'tag_theater', 'theater': 'tag_theater', 'theatre': 'tag_theater', 'teatro': 'tag_theater',
        'essai': 'tag_essay', 'essay': 'tag_essay', 'saggio': 'tag_essay',
        'conte': 'tag_tale', 'tale': 'tag_tale', 'racconto': 'tag_tale',
        'nouvelle': 'tag_short_story', 'short story': 'tag_short_story', 'novella': 'tag_short_story',
        'fable': 'tag_fable', 'favola': 'tag_fable',
        'lettre': 'tag_letter', 'letter': 'tag_letter', 'lettera': 'tag_letter',
        'mémoires': 'tag_memoir', 'memoirs': 'tag_memoir', 'memoir': 'tag_memoir',
        'discours': 'tag_speech', 'speech': 'tag_speech', 'discorso': 'tag_speech'
    };
    
    const key = tagKeyMap[tagLower];
    return key ? t(key) : tag;
}

window.t = t;
window.translateTag = translateTag;
window.getUILanguage = getUILanguage;
window.setUILanguage = setUILanguage;
window.changeUILanguage = changeUILanguage;
window.applyTranslations = applyTranslations;
window.initI18n = initI18n;
window.syncLanguageSelectors = syncLanguageSelectors;
window.translations = translations;
