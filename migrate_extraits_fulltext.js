/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MIGRATION : Mise à jour des extraits tronqués avec le texte complet
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Ce script récupère les extraits tronqués (finissant par "…") depuis Supabase,
 * charge le texte complet depuis Wikisource, et met à jour la base de données.
 * 
 * Prérequis :
 * - Node.js 18+ (pour fetch natif)
 * - Variables d'environnement : SUPABASE_URL, SUPABASE_SERVICE_KEY
 * 
 * Usage :
 *   node migrate_extraits_fulltext.js [--dry-run] [--limit=N]
 * 
 * Options :
 *   --dry-run   Affiche les extraits à migrer sans modifier la base
 *   --limit=N   Limite le nombre d'extraits à traiter (défaut: 100)
 * ═══════════════════════════════════════════════════════════════════════════
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Variables d\'environnement manquantes: SUPABASE_URL et SUPABASE_SERVICE_KEY');
    process.exit(1);
}

// Parse arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const BATCH_LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : 100;

console.log(`
═══════════════════════════════════════════════════════════════
   MIGRATION DES EXTRAITS TRONQUÉS VERS TEXTE COMPLET
═══════════════════════════════════════════════════════════════
   Mode: ${dryRun ? '🔍 DRY RUN (aucune modification)' : '⚡ LIVE'}
   Limite: ${BATCH_LIMIT} extraits
═══════════════════════════════════════════════════════════════
`);

/**
 * Récupérer les extraits tronqués depuis Supabase
 */
async function fetchTruncatedExtraits() {
    const url = `${SUPABASE_URL}/rest/v1/extraits?texte=like.*%E2%80%A6&source_url=like.*wikisource.org*&select=id,texte,source_url,source_title&limit=${BATCH_LIMIT}`;
    
    const response = await fetch(url, {
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Erreur Supabase: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
}

/**
 * Charger le texte complet depuis Wikisource
 */
async function fetchFullTextFromWikisource(sourceUrl, previewText) {
    const wikisourceMatch = sourceUrl.match(/https?:\/\/(\w+)\.wikisource\.org\/wiki\/(.+)/);
    if (!wikisourceMatch) return null;
    
    const lang = wikisourceMatch[1];
    let pageTitle = decodeURIComponent(wikisourceMatch[2]);
    const baseUrl = `https://${lang}.wikisource.org`;
    
    // Fonction récursive pour gérer les sommaires
    const loadPageWithFallback = async (title, depth = 0) => {
        if (depth > 3) return null;
        
        const apiUrl = `${baseUrl}/w/api.php?` + new URLSearchParams({
            action: 'parse',
            page: title,
            prop: 'text|links',
            pllimit: '100',
            format: 'json',
            origin: '*',
            redirects: 'true'
        });
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.error || !data.parse?.text?.['*']) return null;
        
        const html = data.parse.text['*'];
        const links = data.parse.links || [];
        
        // Extraire le texte (version simplifiée pour Node.js)
        let text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<table[^>]*>[\s\S]*?<\/table>/gi, '')
            .replace(/<[^>]+>/g, '\n')
            .replace(/\[\d+\]/g, '')
            .replace(/\[modifier\]/gi, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Vérifier si c'est un sommaire
        const basePage = title.split('/')[0];
        const subPageLinks = links.filter(l => {
            const linkTitle = l['*'] || '';
            return linkTitle.startsWith(basePage + '/') && l.ns === 0;
        });
        
        const isLikelySommaire = subPageLinks.length >= 3 && text.length < 500;
        
        if (isLikelySommaire && subPageLinks.length > 0) {
            const normPreview = previewText.replace(/\s+/g, ' ').trim().toLowerCase().substring(0, 50);
            
            // Essayer les sous-pages
            for (const subLink of subPageLinks.slice(0, 5)) {
                const subResult = await loadPageWithFallback(subLink['*'], depth + 1);
                if (subResult && subResult.length > 200) {
                    const normSub = subResult.replace(/\s+/g, ' ').trim().toLowerCase();
                    if (normSub.includes(normPreview.substring(0, 30))) {
                        return subResult;
                    }
                }
            }
            
            // Fallback: première sous-page avec contenu
            for (const subLink of subPageLinks.slice(0, 3)) {
                const subResult = await loadPageWithFallback(subLink['*'], depth + 1);
                if (subResult && subResult.length > 300) {
                    return subResult;
                }
            }
        }
        
        return text.length > 100 ? text : null;
    };
    
    return loadPageWithFallback(pageTitle);
}

/**
 * Mettre à jour un extrait dans Supabase
 */
async function updateExtrait(id, fullText) {
    const url = `${SUPABASE_URL}/rest/v1/extraits?id=eq.${id}`;
    
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ texte: fullText })
    });
    
    if (!response.ok) {
        throw new Error(`Erreur mise à jour: ${response.status} ${response.statusText}`);
    }
    
    return true;
}

/**
 * Fonction principale de migration
 */
async function migrate() {
    try {
        console.log('📥 Récupération des extraits tronqués...');
        const extraits = await fetchTruncatedExtraits();
        
        console.log(`   → ${extraits.length} extraits à migrer\n`);
        
        if (extraits.length === 0) {
            console.log('✅ Aucun extrait à migrer !');
            return;
        }
        
        let success = 0;
        let failed = 0;
        let skipped = 0;
        
        for (let i = 0; i < extraits.length; i++) {
            const extrait = extraits[i];
            const progress = `[${i + 1}/${extraits.length}]`;
            
            console.log(`${progress} ID: ${extrait.id}`);
            console.log(`         Source: ${extrait.source_title || extrait.source_url}`);
            
            try {
                // Récupérer le texte complet depuis Wikisource
                const fullText = await fetchFullTextFromWikisource(extrait.source_url, extrait.texte);
                
                if (!fullText || fullText.length < 200) {
                    console.log(`         ⚠️  Texte non récupéré ou trop court`);
                    skipped++;
                    continue;
                }
                
                console.log(`         📄 ${fullText.length} caractères récupérés`);
                
                if (dryRun) {
                    console.log(`         🔍 DRY RUN - pas de modification`);
                    success++;
                } else {
                    await updateExtrait(extrait.id, fullText);
                    console.log(`         ✅ Mis à jour !`);
                    success++;
                }
                
                // Pause pour éviter le rate limiting
                await new Promise(r => setTimeout(r, 500));
                
            } catch (err) {
                console.log(`         ❌ Erreur: ${err.message}`);
                failed++;
            }
            
            console.log('');
        }
        
        console.log(`
═══════════════════════════════════════════════════════════════
   RÉSULTAT DE LA MIGRATION
═══════════════════════════════════════════════════════════════
   ✅ Réussis:  ${success}
   ❌ Échoués:  ${failed}
   ⚠️  Ignorés: ${skipped}
   ─────────────────────────
   Total:       ${extraits.length}
═══════════════════════════════════════════════════════════════
`);
        
    } catch (err) {
        console.error('❌ Erreur fatale:', err);
        process.exit(1);
    }
}

// Lancer la migration
migrate();
