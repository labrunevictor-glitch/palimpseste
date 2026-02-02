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
        'followers': 'abonnés',
        'following': 'abonnements',
        'shared': 'partagés',
        'liked': 'likés',
        'follow': 'Suivre',
        'unfollow': 'Ne plus suivre',
        'message': 'Message',
        'extracts': 'Extraits',
        'likes': 'Likés',
        
        // Feed social
        'social_feed': '🐦 FEED COMMUNAUTAIRE',
        'activity': '❤️ Activité',
        'subscriptions': '👥 Abonnements',
        'subscribers': '💌 Abonnés',
        'discover': '🔎 Découvrir',
        'live': '🟢 En direct',
        
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
        'connect_to_see_collections': '📝 Connectez-vous pour voir vos collections'
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
        'followers': 'followers',
        'following': 'following',
        'shared': 'shared',
        'liked': 'liked',
        'follow': 'Follow',
        'unfollow': 'Unfollow',
        'message': 'Message',
        'extracts': 'Extracts',
        'likes': 'Liked',
        
        // Feed social
        'social_feed': '🐦 COMMUNITY FEED',
        'activity': '❤️ Activity',
        'subscriptions': '👥 Following',
        'subscribers': '💌 Followers',
        'discover': '🔎 Discover',
        'live': '🟢 Live',
        
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
        'connect_to_see_collections': '📝 Sign in to see your collections'
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
        'likes': 'Geliked',
        
        // Feed social
        'social_feed': '🐦 COMMUNITY-FEED',
        'activity': '❤️ Aktivität',
        'subscriptions': '👥 Abonnements',
        'subscribers': '💌 Follower',
        'discover': '🔎 Entdecken',
        'live': '🟢 Live',
        
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
        
        // Messages
        'write_message': 'Nachricht schreiben...',
        'select_conversation': 'Konversation auswählen',
        
        // Partage
        'share_extract': '📤 Diesen Auszug teilen',
        'add_comment': 'Kommentar hinzufügen... (optional)',
        'cancel': 'Abbrechen',
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
        
        // Langues
        'modern_languages': 'Moderne Sprachen',
        'ancient_languages': 'Alte Sprachen',
        'all_languages_filter': 'Alle',
        'language_all': 'Sprache: Alle',
        
        // Toast messages
        'all_languages_activated': '🌍 Alle Sprachen aktiviert',
        'language_changed': '🌐 Sprache:',
        'interface_changed': '🌐 Oberfläche auf Deutsch'
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
        'likes': 'Favoritos',
        
        // Feed social
        'social_feed': '🐦 FEED COMUNITARIO',
        'activity': '❤️ Actividad',
        'subscriptions': '👥 Siguiendo',
        'subscribers': '💌 Seguidores',
        'discover': '🔎 Descubrir',
        'live': '🟢 En directo',
        
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
        
        // Messages
        'write_message': 'Escribe un mensaje...',
        'select_conversation': 'Selecciona una conversación',
        
        // Partage
        'share_extract': '📤 Compartir este extracto',
        'add_comment': 'Añade un comentario... (opcional)',
        'cancel': 'Cancelar',
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
        
        // Langues
        'modern_languages': 'Idiomas modernos',
        'ancient_languages': 'Idiomas antiguos',
        'all_languages_filter': 'Todos',
        'language_all': 'Idioma: Todos',
        
        // Toast messages
        'all_languages_activated': '🌍 Todos los idiomas activados',
        'language_changed': '🌐 Idioma:',
        'interface_changed': '🌐 Interfaz en español'
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
        'likes': 'Preferiti',
        
        // Feed social
        'social_feed': '🐦 FEED DELLA COMUNITÀ',
        'activity': '❤️ Attività',
        'subscriptions': '👥 Seguiti',
        'subscribers': '💌 Follower',
        'discover': '🔎 Scopri',
        'live': '🟢 In diretta',
        
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
        
        // Messages
        'write_message': 'Scrivi un messaggio...',
        'select_conversation': 'Seleziona una conversazione',
        
        // Partage
        'share_extract': '📤 Condividi questo estratto',
        'add_comment': 'Aggiungi un commento... (opzionale)',
        'cancel': 'Annulla',
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
        
        // Langues
        'modern_languages': 'Lingue moderne',
        'ancient_languages': 'Lingue antiche',
        'all_languages_filter': 'Tutte',
        'language_all': 'Lingua: Tutte',
        
        // Toast messages
        'all_languages_activated': '🌍 Tutte le lingue attivate',
        'language_changed': '🌐 Lingua:',
        'interface_changed': "🌐 Interfaccia in italiano"
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
        'likes': 'Curtidos',
        
        // Feed social
        'social_feed': '🐦 FEED DA COMUNIDADE',
        'activity': '❤️ Atividade',
        'subscriptions': '👥 Seguindo',
        'subscribers': '💌 Seguidores',
        'discover': '🔎 Descobrir',
        'live': '🟢 Ao vivo',
        
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
        
        // Messages
        'write_message': 'Escreva uma mensagem...',
        'select_conversation': 'Selecione uma conversa',
        
        // Partage
        'share_extract': '📤 Compartilhar este extrato',
        'add_comment': 'Adicione um comentário... (opcional)',
        'cancel': 'Cancelar',
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
        
        // Langues
        'modern_languages': 'Línguas modernas',
        'ancient_languages': 'Línguas antigas',
        'all_languages_filter': 'Todas',
        'language_all': 'Idioma: Todas',
        
        // Toast messages
        'all_languages_activated': '🌍 Todas as línguas ativadas',
        'language_changed': '🌐 Idioma:',
        'interface_changed': '🌐 Interface em português'
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
    // Si la langue n'existe pas dans les traductions, utiliser le français
    const langDict = translations[useLang] || translations['fr'];
    return langDict[key] || translations['fr'][key] || key;
}

/**
 * Applique les traductions à tous les éléments de la page
 */
function applyTranslations() {
    // Mise à jour de l'attribut lang du document
    document.documentElement.lang = currentUILang;
    
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
    const drawerTrending = document.querySelector('.drawer-action-btn[onclick*="openTrendingFeed"]');
    if (drawerTrending) {
        const textNode = [...drawerTrending.childNodes].find(n => n.nodeType === 3);
        if (textNode) textNode.textContent = ' ' + t('trending');
        else drawerTrending.innerHTML = drawerTrending.innerHTML.replace(/Tendances/g, t('trending'));
    }
    
    const drawerFav = document.querySelector('.drawer-action-btn[onclick*="openFavoritesView"]');
    if (drawerFav) {
        drawerFav.innerHTML = drawerFav.innerHTML.replace(/Mes likés/g, t('my_likes'));
    }
    
    const drawerCollections = document.querySelector('.drawer-action-btn[onclick*="openCollectionsView"]');
    if (drawerCollections) {
        drawerCollections.innerHTML = drawerCollections.innerHTML.replace(/Collections/g, t('collections'));
    }
    
    const drawerSocial = document.querySelector('.drawer-action-btn[onclick*="openSocialFeed"]');
    if (drawerSocial) {
        drawerSocial.innerHTML = drawerSocial.innerHTML.replace(/Social/g, t('community'));
    }
    
    const drawerMessages = document.querySelector('.drawer-action-btn[onclick*="openMessaging"]');
    if (drawerMessages) {
        drawerMessages.innerHTML = drawerMessages.innerHTML.replace(/Messages/g, t('messages'));
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
    
    // Sources button
    const sourcesBtn = document.querySelector('.sources-btn');
    if (sourcesBtn) {
        sourcesBtn.innerHTML = sourcesBtn.innerHTML.replace(/Sources/g, t('sources'));
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
    
    // Social tabs
    const tabRecent = document.getElementById('tabRecent');
    if (tabRecent) tabRecent.innerHTML = '🔥 ' + t('trending');
    
    const tabActivity = document.getElementById('tabActivity');
    if (tabActivity) tabActivity.textContent = t('activity');
    
    const tabFriends = document.getElementById('tabFriends');
    if (tabFriends) tabFriends.textContent = t('subscriptions');
    
    const tabFollowers = document.getElementById('tabFollowers');
    if (tabFollowers) tabFollowers.textContent = t('subscribers');
    
    const tabDiscover = document.getElementById('tabDiscover');
    if (tabDiscover) tabDiscover.textContent = t('discover');
    
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
    
    // Search results
    const searchResultsTitle = document.querySelector('.search-results-title');
    if (searchResultsTitle) {
        const querySpan = searchResultsTitle.querySelector('.search-results-query');
        const queryText = querySpan ? querySpan.textContent : '';
        searchResultsTitle.innerHTML = t('results_for') + ' "<span class="search-results-query" id="searchQueryDisplay">' + queryText + '</span>"';
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
    const supportedUILanguages = ['fr', 'en', 'de', 'es', 'it', 'pt'];
    
    if (!supportedUILanguages.includes(lang)) {
        return;
    }
    
    setUILanguage(lang);
    applyTranslations();
    syncLanguageSelectors(lang);
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
    
    // Synchroniser les sélecteurs avec la langue sauvegardée des contenus
    const savedContentLang = localStorage.getItem('palimpseste_lang') || 'all';
    syncLanguageSelectors(savedContentLang);
}

// ═══════════════════════════════════════════════════════════
// 🌐 EXPORTS GLOBAUX
// ═══════════════════════════════════════════════════════════

window.t = t;
window.getUILanguage = getUILanguage;
window.setUILanguage = setUILanguage;
window.changeUILanguage = changeUILanguage;
window.applyTranslations = applyTranslations;
window.initI18n = initI18n;
window.syncLanguageSelectors = syncLanguageSelectors;
window.translations = translations;
