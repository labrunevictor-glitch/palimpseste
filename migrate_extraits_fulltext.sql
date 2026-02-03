-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Identifier les extraits tronqués à migrer
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Ce script identifie les extraits qui ont un aperçu tronqué (finit par "…")
-- et dont la source est Wikisource. Ces extraits devront être mis à jour
-- avec le texte complet via le script Node.js de migration.
--
-- Usage : Exécuter ce script dans la console SQL Supabase pour voir les extraits
--         à migrer, puis utiliser migrate_extraits_fulltext.js pour la migration.
-- ═══════════════════════════════════════════════════════════════════════════

-- Compter les extraits tronqués à migrer
SELECT COUNT(*) as extraits_a_migrer
FROM extraits 
WHERE texte LIKE '%…'
AND source_url LIKE '%wikisource.org%';

-- Liste des extraits tronqués avec détails
SELECT 
    id, 
    user_id,
    LEFT(texte, 50) || '...' as apercu_texte,
    source_title,
    source_author,
    source_url,
    created_at
FROM extraits 
WHERE texte LIKE '%…'
AND source_url LIKE '%wikisource.org%'
ORDER BY created_at DESC
LIMIT 100;

-- Statistiques par type de source
SELECT 
    CASE 
        WHEN source_url LIKE '%wikisource.org%' THEN 'Wikisource'
        WHEN source_url LIKE '%gutenberg.org%' THEN 'Gutenberg'
        ELSE 'Autre'
    END as source_type,
    COUNT(*) as total,
    SUM(CASE WHEN texte LIKE '%…' THEN 1 ELSE 0 END) as tronques,
    SUM(CASE WHEN texte NOT LIKE '%…' AND LENGTH(texte) > 500 THEN 1 ELSE 0 END) as complets
FROM extraits
GROUP BY 1
ORDER BY 2 DESC;
