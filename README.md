# ❧ Palimpseste

An infinite scroll reader for world literature, with social features.

**[Live Demo](https://palimpseste.vercel.app)** · [Installation](#installation) · [Contributing](#contributing)

---

## About

Palimpseste lets you drift through literary excerpts from antiquity to the 20th century. Texts are pulled from 7 digital libraries across 12 languages and displayed in a continuous feed. Filter by genre, era, or tone — or let serendipity guide you.

The app includes a social layer: share passages you love, follow other readers, build collections, and discuss interpretations.

### Philosophy

Mainstream social networks optimize for engagement through low-quality content. Palimpseste explores a different path: can we build an addictive feed experience around intellectually substantial material?

The hypothesis: the same infinite scroll mechanics that make platforms captivating can be redirected toward literature, philosophy, and poetry.

This is an experiment in making great literature as accessible and engaging as any modern feed.

### Open Source by Design

Open source is not just a technical choice — it's essential to this project's identity.

**Open texts:** Palimpseste's philosophy is to curate and share quality literature free from copyright restrictions. All content comes from public domain sources (Wikisource, Project Gutenberg, Gallica, Archive.org, Perseus...). 

**Open code:** The platform itself is fully open source. In an era where social networks are opaque systems designed to extract value from users, transparency matters. Anyone can inspect how Palimpseste works, suggest improvements, or fork it to build something new. The community owns this project as much as its creator.

This dual openness — of content and code — reflects a belief that knowledge and the tools to share it should be commons, not commodities.

### Features

| Reading | Social | Personalization |
|---------|--------|----------------|
| Infinite scroll feed | Share excerpts | Personal collections |
| 7 literary sources | Likes & comments | Reading statistics |
| 12 content languages | Follow users | 50+ badges |
| Hierarchical filters | Trending feed | 6 interface languages |
| Full-text reader | Private messaging | Theme (light/dark) |

---

## Project Structure

```
palimpseste/
├── web/
│   ├── index.html
│   ├── css/           # variables, base, styles, mobile
│   └── js/
│       ├── app.js           # Core logic
│       ├── sources.js       # Wikisource, Gutenberg, etc.
│       ├── exploration.js   # Filter system
│       ├── social.js        # Feed & interactions
│       ├── i18n.js          # 6 languages
│       ├── auth.js          # Supabase auth
│       ├── messaging.js     # Private messages
│       └── ...              # notifications, gamification, collections
├── api/                     # Serverless CORS proxy
└── supabase_setup.sql       # Database schema
```

---

## Sources

| Source | Languages | Content |
|--------|-----------|---------|
| **Wikisource** | FR, EN, DE, IT, ES, PT, RU, ZH, JA, AR, EL, LA | Full texts, poetry, essays |
| **Project Gutenberg** | EN (primarily) | 70,000+ public domain ebooks |
| **PoetryDB** | EN | Poetry database |
| **Archive.org** | Multiple | Millions of scanned books |
| **Gallica** | FR | French National Library |
| **Perseus** | Greek, Latin | Classical antiquity |
| **Sacred Texts** | Multiple | Religious & mystical texts |

---

## Installation

### Local Development

```bash
git clone https://github.com/vicoolz/palimpseste.git
cd palimpseste/web

# Serve static files
python -m http.server 8080
# or
npx serve
```

Access at `http://localhost:8080`

### Backend Setup (Social Features)

Social features require a Supabase instance.

1. Create a project at [supabase.com](https://supabase.com)
2. Execute SQL scripts in order:
   ```
   supabase_setup.sql
   create_notification_rpc.sql
   sync_badges.sql
   fix_notifications_rls.sql
   ```
3. Configure `web/js/config.js`:
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```
4. Enable authentication providers (Email, Google OAuth) in Supabase dashboard

---

## Stack

- **Frontend:** Vanilla JS + CSS (no framework)
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Hosting:** Vercel
- **Icons:** Lucide

---

## Filters

Three-dimensional filtering:

- **Form:** Poetry (sonnet, ode...), Narrative (tale, novel...), Theater, Prose (essay, letter...)
- **Era:** Antiquity → Middle Ages → Renaissance → Baroque → Classicism → Romanticism → Realism → Symbolism → Surrealism → Existentialism
- **Register:** Lyric, epic, tragic, gothic, fantastic, satirical, pastoral...

---

## Contributing

This project is still in its early stages. The goal is to grow a community of readers and eventually deploy a more polished version.

Contributions, feedback, and ideas are welcome — whether it's code, translations, or simply sharing the project with others who might enjoy it.

### Future Considerations

If the project gains traction, one idea worth exploring would be allowing users to submit their own texts, stories, or poems. However, this would require careful thought and would only be considered in a later phase. The priority is to preserve the quality and depth of the reading experience — Palimpseste should never become another Twitter.

```bash
git clone https://github.com/YOUR_USERNAME/palimpseste.git
# test locally, then submit PR
```

---

## License

MIT

---

## Author

vicoolz — [@vicoolz](https://github.com/vicoolz)
