# Revue d'Architecture — Palimpseste

> Mise à jour : février 2026.
> Statut de chaque constat de l'audit initial + axes restants.

---

## 0. Vue d'ensemble

| Aspect | Détail |
|--------|--------|
| **Stack** | Vanilla JS (SPA), Supabase (PostgreSQL + Auth + Realtime), Vercel |
| **Entrée** | `web/index.html` (~1 160 lignes) charge 19 scripts + DOMPurify |
| **CSS** | 4 fichiers (~12 000 lignes) |
| **JS** | 19 modules + Service Worker (~700 KB source) |
| **BDD** | 14 tables, RLS activée, compteurs dénormalisés |
| **PWA** | manifest.json, Service Worker (cache-first/network-first), icônes SVG |
| **SEO** | OG/Twitter meta, Schema.org JSON-LD, sitemap.xml, robots.txt |
| **i18n** | 10 langues d'interface (fr, en, de, es, it, pt, ru, zh, ja, ar) |
| **Routeur** | Hash-based SPA router (router.js) |

---

## 1. Problèmes résolus

### Sécurité

| Problème | Correctif appliqué |
|----------|-------------------|
| XSS via innerHTML externe | DOMPurify intégré via CDN, `sanitize()` sur social.js |
| Absence de CSP | Header `Content-Security-Policy` ajouté dans vercel.json |
| initSupabase retry infini | Limité à 10 tentatives (`_supabaseMaxRetries`) |

### Performance

| Problème | Correctif appliqué |
|----------|-------------------|
| Scroll handler sans throttle/passive | `{ passive: true }` + throttle (80ms) sur tous les scroll/touch listeners |
| Shuffle biaisé (Math.random) | Fisher-Yates (`shuffleArray()`) sur les 8 points de mélange dans sources.js |

### Accessibilité

| Problème | Correctif appliqué |
|----------|-------------------|
| Inputs sans label | `aria-label` sur 17 champs de formulaire |
| outline:none sans alternative | `:focus-visible` global dans base.css |
| Pas de skip-to-content | `<a href="#feed" class="skip-link">` en haut de index.html |

### Architecture

| Problème | Correctif appliqué |
|----------|-------------------|
| Navigation SPA sans URL | Routeur hash (router.js) avec 10 routes |
| Variables CSS manquantes | `--bg-lighter` et `--text-muted` définis dans variables.css |

### SEO & Distribution

| Ajout | Détail |
|-------|--------|
| Meta tags | OG, Twitter Card, Schema.org JSON-LD dans index.html |
| PWA | manifest.json, sw.js, icônes SVG 192/512 |
| SEO | robots.txt, sitemap.xml (routes + auteurs populaires) |
| Partage | Lien partageable avec aperçu (route #/preview), widget embed (embed.html) |
| i18n +4 langues | Russe, Chinois, Japonais, Arabe ajoutés (10 langues UI) |
| Vercel caching | Headers immutable pour assets, no-cache pour SW |

---

## 2. Axes d'amélioration restants

Classés par **impact / effort**.

### P1 — Sécurité avancée

| # | Problème | Détail |
|---|----------|--------|
| 1 | ~~innerHTML massif (534 usages)~~ | **Résolu.** `escapeHtml()` canonique dans utils.js (avec guard null), doublon dans collections.js supprimé. `esc()` dans app.js est un wrapper légitime (ajoute `\n` → `<br>`). |
| 2 | ~~Proxy CORS tiers (corsproxy.io)~~ | **Résolu.** `/api/proxy.js` générique créé, corsproxy.io / allorigins.win / r.jina.ai supprimés du code et de la CSP. |
| 3 | Clé Supabase anon exposée | Par design, mais vérifier exhaustivité des policies RLS (SELECT/INSERT/UPDATE/DELETE sur chaque table). |

### P1 — Performance

| # | Problème | Détail |
|---|----------|--------|
| 4 | Aucun bundling / minification | 700 KB en 19 requêtes. Adopter Vite → gain ~60-70%. |
| 5 | Requêtes N+1 (search.js, followers.js, collections.js) | Créer des fonctions SQL batch (`get_extrait_counts(user_ids UUID[])`). |
| 6 | ~~setInterval sans nettoyage~~ | **Résolu.** Les 3 setInterval sont stockés et nettoyés (`_lastSeenIntervalId`, `_funStatInterval`, poll supabase). |
| 7 | ~~Event listeners jamais supprimés~~ | **Résolu.** Les listeners sans removeEventListener sont tous intentionnellement permanents (app-lifetime) ou fire-once (DOMContentLoaded). Les listeners de reaction-picker (messaging/comments) sont correctement pairés. |

### P1 — Base de données

| # | Problème | Détail |
|---|----------|--------|
| 8 | ~~Compteurs dénormalisés sans triggers~~ | **Résolu.** Triggers `AFTER INSERT/DELETE` sur likes, comments, follows, collection_items. |
| 9 | ~~ON DELETE CASCADE manquant~~ | **Résolu.** CASCADE présent sur toutes les FK. |
| 10 | ~~Contraintes CHECK manquantes~~ | **Résolu.** `no_self_follow`, `no_self_message` en place. |
| 11 | ~~RLS collection_items INSERT~~ | **Résolu.** Policy vérifie `collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid())`. |
| 12 | ~~Index manquants~~ | **Résolu.** 6 index additionnels ajoutés (profiles.last_seen, follows, messages, extraits, notifications). |

### P2 — Accessibilité avancée

| # | Problème | Détail |
|---|----------|--------|
| 13 | 21+ `<div>` avec onclick sans role/tabindex | Remplacer par `<button>` natifs ou ajouter `role="button" tabindex="0"`. |
| 14 | Hiérarchie de titres absente | Pas de `<h1>`, seulement des `<h3>` avec emojis. |

### P2 — CSS / Architecture front

| # | Problème | Détail |
|---|----------|--------|
| 15 | CSS monolithique (styles.css ~10 000 lignes) | Découper par composant (card, modal, auth, etc.). |
| 16 | 1 385 `!important` + 851 dans mobile.css | Corriger l'ordre de cascade. |
| 17 | Z-index anarchique (59 déclarations, 1 → 100 000) | Migrer vers les variables CSS (`--z-base`, `--z-modal`, etc.). |
| 18 | 46 couleurs hardcodées | Migrer vers les tokens du design system. |
| 19 | Pollution namespace global | 15+ fonctions sur `window`. Migrer vers ES Modules. |

### P3 — UX

| # | Problème | Détail |
|---|----------|--------|
| 20 | Pas de loading skeletons | CLS lors des chargements asynchrones. |
| 21 | Double système de cache | `state.cache` (Map) et `localStorage` sans politique d'invalidation claire. |

---

## 3. Priorisation recommandée

| Phase | Actions | Effort |
|-------|---------|--------|
| ~~**Sprint 1**~~ | ~~Edge Function CORS proxy (#2), SQL triggers/contraintes (#8-12)~~ | **Fait** |
| ~~**Sprint 1b**~~ | ~~Unifier escapeHtml (#1), nettoyage intervals (#6-7)~~ | **Fait** (audit : déjà propres) |
| **Sprint 2** | Vite bundler (#4), N+1 batch SQL (#5) | 2-3 jours |
| **Sprint 3** | ARIA buttons (#13), heading hierarchy (#14) | 1-2 jours |
| **Long terme** | CSS split (#15-18), ES Modules (#19), skeletons (#20) | 1-2 semaines |
