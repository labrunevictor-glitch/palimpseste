# Revue d'Architecture — Palimpseste

> Audit complet : structure, cohérence, performance, sécurité, accessibilité, dette technique.
> Chaque constat est classé par **impact / effort** (P0 = critique, P1 = élevé, P2 = moyen, P3 = faible).

---

## 0. Vue d'ensemble

| Aspect | Détail |
|--------|--------|
| **Stack** | Vanilla JS (SPA), Supabase (PostgreSQL + Auth), Vercel |
| **Entrée** | `web/index.html` (998 lignes) charge 17 scripts séquentiels |
| **CSS** | 4 fichiers, 11 879 lignes au total (styles.css = 9 767 lignes) |
| **JS** | 17 modules, ≈ 650 KB de source non minifiée |
| **BDD** | 14 tables, RLS activée, compteurs dénormalisés |
| **Build** | Aucun (pas de bundler, pas de minification, pas de tree-shaking) |

### Points forts

- Architecture modulaire claire (un fichier = une responsabilité).
- Design system dark/light avec CSS variables.
- RLS Supabase active sur toutes les tables.
- Headers de sécurité Vercel (HSTS, X-Frame-Options, Permissions-Policy).
- Approche offline-first via localStorage + sync Supabase.

---

## 1. Sécurité

### P0 — XSS via contenu externe non assaini

| Fichier | Ligne | Problème |
|---------|-------|----------|
| `web/js/social.js` | 677 | `tempDiv.innerHTML = data.parse.text['*']` — HTML brut de l'API Wikipedia injecté sans sanitisation. Le nettoyage ultérieur des balises `<script>` est contournable (`<img onerror>`, `<svg onload>`, etc.). |
| `web/js/app.js` | 2289, 2302 | `onclick="exploreAuthor('${author.replace(/'/g, "\\'")}')"` — Échappement incomplet (backticks, guillemets doubles, HTML entities non gérés). |

**Correctif :** Intégrer [DOMPurify](https://github.com/cure53/DOMPurify) (3 KB gzip). Remplacer tout `innerHTML` recevant du contenu externe par `DOMPurify.sanitize(html)`. Pour les handlers inline, passer aux `data-*` attributes + event delegation.

### P0 — Absence de Content-Security-Policy

| Fichier | Problème |
|---------|----------|
| `vercel.json` | Aucun header `Content-Security-Policy`. Tous les scripts inline et CDN externes sont autorisés sans restriction. |

**Correctif :**
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' unpkg.com cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://*.wikimedia.org https://*.gutenberg.org https://poetrydb.org https://corsproxy.io; frame-ancestors 'none';"
}
```

### P1 — Clé Supabase anon exposée dans le code source

| Fichier | Ligne |
|---------|-------|
| `web/js/auth.js` | 5-6 |

La clé anon est publique par design dans Supabase, **mais** combinée à l'URL du projet, elle permet à quiconque d'interagir avec l'API. La sécurité repose entièrement sur les politiques RLS. Vérifier que **chaque table** a des policies couvrant SELECT, INSERT, UPDATE, DELETE.

### P1 — Proxy CORS tiers (`corsproxy.io`)

| Fichier | Ligne |
|---------|-------|
| `web/js/sources.js` | 575, 710 |

**Risques :** MitM, logging des requêtes, indisponibilité.
**Correctif :** Créer une Vercel Edge Function `/api/proxy` qui redirige les requêtes vers les sources externes avec les headers CORS appropriés.

### P2 — innerHTML massif avec échappement incohérent

534 usages de `innerHTML` répartis sur tous les fichiers JS. Deux fonctions d'échappement coexistent (`esc()` dans app.js, `escapeHtml()` dans utils.js) avec des comportements différents.

**Correctif :** Unifier sur une seule fonction `escapeHtml()` exportée, et auditer systématiquement chaque `.innerHTML` pour vérifier que toute donnée dynamique passe par cette fonction.

---

## 2. Performance

### P0 — Aucun bundling / minification

650 KB de JS chargés en 17 requêtes HTTP séquentielles (`<script>` bloquants). Pas de tree-shaking, pas de code-splitting, pas de compression à la source.

**Correctif (effort modéré) :**
- Adopter **Vite** (config minimale pour vanilla JS).
- Activer la minification et le code-splitting automatique.
- Gain estimé : 60-70% de réduction de taille, chargement parallèle.

### P0 — Requêtes N+1 en base de données

| Fichier | Ligne | Détail |
|---------|-------|--------|
| `web/js/search.js` | 176-186 | `Promise.all(users.map(…))` → 1 requête par utilisateur pour compter les extraits. |
| `web/js/followers.js` | 134-140 | Même pattern pour les profils (jusqu'à 50 requêtes). |
| `web/js/collections.js` | 82-89 | Boucle `for…of` séquentielle → 1 requête par collection. |

**Correctif :** Créer une fonction SQL `get_extrait_counts(user_ids UUID[])` retournant les compteurs en une seule requête, ou utiliser une vue matérialisée.

### P1 — Scroll handler sans throttling

| Fichier | Ligne | Détail |
|---------|-------|--------|
| `web/js/app.js` | 467 | `window.onscroll = () => { … }` — Exécuté à chaque pixel de scroll, avec mutations DOM multiples (`getElementById`, `style.width`). Pas de `passive: true`, pas de throttle. |

**Correctif :**
```javascript
window.addEventListener('scroll', throttle(() => {
    updateProgress();
    checkInfiniteScroll();
    updateScrollTopButton();
}, 100), { passive: true });
```

### P1 — `setInterval` sans nettoyage

| Fichier | Ligne | Détail |
|---------|-------|--------|
| `web/js/app.js` | 390 | `setInterval(updateFunStat, 15000)` — jamais nettoyé. |
| `web/js/auth.js` | 542 | `setInterval(updateLastSeen, 120000)` — jamais nettoyé. |

**Correctif :** Stocker les IDs et les nettoyer dans `beforeunload` ou via un `AbortController` pattern.

### P2 — Shuffle biaisé et inefficace

| Fichier | Ligne |
|---------|-------|
| `web/js/sources.js` | 1226 |

```javascript
state.textPool = state.textPool.sort(() => Math.random() - 0.5);
```

**Correctif :** Utiliser Fisher-Yates (O(n) au lieu de O(n log n), distribution uniforme).

### P2 — Event listeners jamais nettoyés

Fichiers `app.js` (400-442), `messaging.js` (553-604), `comments.js` (342-344) : des `addEventListener` sur `document` et `window` sans `removeEventListener` correspondant. Fuite mémoire progressive en session longue.

---

## 3. Accessibilité (WCAG 2.1)

### P0 — 13 champs de formulaire sans `<label>`

Tous les `<input>` dans `index.html` (lignes 346, 622, 773, 792-830, 852) n'ont pas de `<label for="…">` associé. Les lecteurs d'écran ne peuvent pas identifier ces champs.

**Correctif :** Ajouter un `<label>` visible ou un `aria-label` pour chaque input.

### P0 — 12 instances de `outline: none` sans alternative visible

| Fichier | Lignes |
|---------|--------|
| `web/css/styles.css` | 305, 1519, 1547, 2133, 4386, 4691, 5243, 6078, 7829, 8527, 8689 |

Les indicateurs de focus sont supprimés, rendant la navigation clavier impossible.

**Correctif :** Remplacer `outline: none` par un focus ring visible :
```css
:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}
```

### P0 — Pas de lien « Skip to content »

Aucun mécanisme pour sauter la navigation. L'utilisateur clavier doit tabuler à travers 20+ éléments pour atteindre le contenu.

### P1 — 21+ `<div>` avec `onclick` sans `role` ni `tabindex`

Éléments non interactifs (div, span) avec des handlers de clic mais sans sémantique ARIA (`role="button"`, `tabindex="0"`, `onkeydown`).

**Correctif :** Remplacer par des `<button>` natifs, ou ajouter `role="button" tabindex="0"` + handler `keydown` pour Enter/Space.

### P1 — Hiérarchie de titres absente

Aucun `<h1>`. Seulement des `<h3>` avec des emojis. Pas de structure `h1 > h2 > h3`.

---

## 4. Architecture & Dette technique

### P0 — Fichier CSS monolithique (9 767 lignes)

`styles.css` contient 1 541 sélecteurs, 75+ doublons, et 534 `!important`. `mobile.css` en contient **851** (57% de ses déclarations).

**Correctif :** Découper par composant (`card.css`, `modal.css`, `auth.css`, etc.) et éliminer les `!important` en corrigeant l'ordre de cascade.

### P0 — Z-index anarchique (59 déclarations, valeurs 1 → 100 000)

18+ déclarations avec z-index > 1000, dont `100000` et `99999`. Les variables CSS z-index définies dans `variables.css` ne sont presque jamais utilisées.

**Correctif :** Établir une échelle de 10 niveaux max et migrer toutes les valeurs vers les variables :
```
--z-base: 1, --z-dropdown: 100, --z-sticky: 200, --z-drawer: 300,
--z-modal: 400, --z-toast: 500, --z-tooltip: 600
```

### P1 — Pollution du namespace global

15+ fonctions attachées à `window` dans `utils.js`, plus des dizaines dans chaque module. Toutes les fonctions sont globales (pas de modules ES).

**Correctif (effort modéré) :** Migrer vers des ES Modules (`import`/`export`). Si un bundler est adopté (cf. Vite), c'est automatique.

### P1 — `initSupabase()` avec retry infini

| Fichier | Ligne |
|---------|-------|
| `web/js/auth.js` | 28 |

`setTimeout(initSupabase, 500)` sans limite de tentatives. Si le SDK ne charge jamais, boucle infinie.

**Correctif :** Ajouter un compteur `maxRetries = 10` et afficher un message d'erreur à l'utilisateur.

### P1 — Race conditions sur `state.loading`

`state.loading` est un simple booléen partagé entre `loadMore()`, `loadNewTextsOnTop()`, `exploreAuthor()`, etc. Si une opération async échoue sans remettre `loading = false`, l'application se bloque.

**Correctif :** Utiliser un `AbortController` par opération, ou un compteur de requêtes en vol.

### P2 — Variables CSS référencées mais jamais définies

| Variable | Fichier |
|----------|---------|
| `--bg-lighter` | `base.css:53` |
| `--text-muted` | `base.css:63, 69` |

Les scrollbars utilisent des couleurs qui retombent sur `initial`.

### P2 — 46 couleurs hardcodées dans `styles.css`

Des valeurs hex comme `#c0392b`, `#ff4757`, `#c9a227` apparaissent en dehors du système de design tokens, rendant le theming incomplet.

---

## 5. Base de données (Supabase)

### P0 — Compteurs dénormalisés sans triggers

5 compteurs (`likes_count`, `comments_count`, `followers_count`, `following_count`, `items_count`) sont maintenus par des appels RPC côté client. Aucun trigger PostgreSQL ne les protège. En cas d'échec du RPC, les compteurs se désynchronisent.

**Correctif :** Ajouter des triggers `AFTER INSERT/DELETE` pour chaque compteur.

### P1 — `ON DELETE CASCADE` manquant

| Table | Ligne | Conséquence |
|-------|-------|-------------|
| `profiles.id → auth.users` | 18 | La suppression d'un utilisateur échoue. |
| `extraits.user_id → auth.users` | 42 | Idem. |

### P1 — Contraintes CHECK manquantes

| Table | Contrainte manquante |
|-------|---------------------|
| `messages` | `sender_id != receiver_id` (pas d'auto-message) |
| `follows` | `follower_id != following_id` (pas d'auto-follow) |
| `collection_items` | Au moins un champ parmi `extrait_id`, `source_like_id`, `local_url` non NULL |

### P1 — Politique RLS incomplète sur `collection_items`

La policy INSERT (ligne 694) vérifie `auth.uid() = user_id` mais **ne vérifie pas** que l'utilisateur possède la collection cible. Un utilisateur pourrait insérer des items dans la collection d'un autre.

**Correctif :**
```sql
WITH CHECK (
    auth.uid() = user_id
    AND collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid())
)
```

### P2 — Index manquants

8+ index absents sur des colonnes fréquemment filtrées : `profiles.last_seen`, `follows(follower_id, created_at)`, `messages(sender_id, receiver_id)`, `extraits(user_id, created_at)`.

---

## 6. UX / Cohérence

### P1 — Navigation SPA sans URL

Aucun système de routage. L'utilisateur ne peut pas :
- Partager un lien vers un profil, une collection, ou un texte.
- Utiliser le bouton retour du navigateur.
- Bookmarker une vue.

**Correctif :** Implémenter un routage hash (`#/profile/id`, `#/collection/id`) minimal.

### P2 — Pas de loading skeleton / état vide

Les chargements asynchrones n'affichent pas de squelettes, ce qui provoque des sauts de layout (CLS).

### P2 — Double système de cache

`state.cache` (Map en mémoire) et `localStorage` coexistent sans politique d'invalidation claire.

---

## 7. Matrice de priorisation Impact / Effort

| # | Problème | Impact | Effort | Priorité |
|---|----------|--------|--------|----------|
| 1 | XSS via innerHTML externe (DOMPurify) | Critique | Faible | **P0** |
| 2 | Ajout CSP header | Critique | Faible | **P0** |
| 3 | Labels formulaires + skip nav | Élevé | Faible | **P0** |
| 4 | Focus visible (outline) | Élevé | Faible | **P0** |
| 5 | Triggers SQL pour compteurs | Élevé | Faible | **P0** |
| 6 | CASCADE + CHECK constraints SQL | Élevé | Faible | **P0** |
| 7 | RLS collection_items INSERT | Élevé | Faible | **P0** |
| 8 | Fix `initSupabase` retry infini | Élevé | Faible | **P1** |
| 9 | Throttle scroll handler | Élevé | Faible | **P1** |
| 10 | Requêtes N+1 → batch SQL | Élevé | Moyen | **P1** |
| 11 | Proxy CORS serveur (Edge Function) | Élevé | Moyen | **P1** |
| 12 | Routage hash minimal | Élevé | Moyen | **P1** |
| 13 | Sémantique ARIA (div→button) | Élevé | Moyen | **P1** |
| 14 | Nettoyage setInterval/listeners | Moyen | Faible | **P1** |
| 15 | Unification escapeHtml | Moyen | Faible | **P2** |
| 16 | Variables CSS manquantes | Moyen | Faible | **P2** |
| 17 | Index SQL manquants | Moyen | Faible | **P2** |
| 18 | Bundler (Vite) + minification | Élevé | Moyen | **P2** |
| 19 | Découpage CSS par composant | Moyen | Élevé | **P2** |
| 20 | Élimination !important (1 385 instances) | Moyen | Élevé | **P2** |
| 21 | Z-index refactoring | Moyen | Moyen | **P2** |
| 22 | ES Modules (import/export) | Moyen | Élevé | **P3** |
| 23 | Fisher-Yates shuffle | Faible | Faible | **P3** |
| 24 | Loading skeletons | Faible | Moyen | **P3** |
| 25 | Couleurs hardcodées → tokens | Faible | Moyen | **P3** |

---

## 8. Quick wins (< 30 min chacun)

1. **Ajouter DOMPurify** via CDN + `DOMPurify.sanitize()` sur `social.js:677`.
2. **Ajouter le header CSP** dans `vercel.json`.
3. **Ajouter `aria-label`** sur les 13 inputs dans `index.html`.
4. **Remplacer `outline: none`** par `:focus-visible` global dans `base.css`.
5. **Ajouter `<a href="#main" class="skip-link">` en haut de `index.html`**.
6. **Limiter retries** dans `initSupabase()` à 10 tentatives.
7. **Ajouter `{ passive: true }`** sur les touch/scroll listeners dans `app.js`.
8. **Définir `--bg-lighter` et `--text-muted`** dans `variables.css`.
9. **Ajouter les CHECK constraints** dans `supabase_setup.sql`.
10. **Corriger la policy RLS** de `collection_items` INSERT.
