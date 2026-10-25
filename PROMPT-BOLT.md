Refais complètement mon site web « Sauge » de façon propre, complète et bien organisée, en conservant toutes ses fonctions.

## Contexte
Sauge est une application web en français québécois (fr-CA) qui planifie les soupers de la semaine : menus selon les goûts, les allergies, le temps, les portions et le budget, avec liste d’épicerie, inventaire et recettes détaillées. Ce dépôt contient une version qui fonctionne, mais le code de l’interface est dense et mal organisé (un seul fichier de 145 Ko, `src/luxe.js`). Je veux la même application, reconstruite proprement. Les anciens fichiers servent de référence pour les fonctions et le contenu.

## Technique
- Vite + React + TypeScript + Tailwind CSS + React Router + `@supabase/supabase-js`.
- Dossiers clairs (`src/pages`, `src/components`, `src/lib`, `src/hooks`, `src/styles`), composants courts, pas de fichier de plus de 300 lignes, types explicites, aucun code mort.
- Les règles métier et les données restent **identiques** : déplace `catalogue.js`, `recipe-details.js`, `photos.js`, `preparation.js`, `measures.js`, `commerce.js`, `discovery.js`, `domain.js` dans `src/lib/` et convertis-les en TypeScript lisible SANS changer leurs résultats (allergènes, régimes, planification sans doublon, portions, conversions, budget indicatif, lunchs, occasions). Les tests du dossier `tests/` doivent continuer de passer (adapte seulement les chemins). `npm test` et `npm run build` doivent réussir sans erreur.
- Toutes les images viennent de `public/assets` (31 recettes ont une photo; les 19 autres restent masquées). Aucune image externe.

## Design : « table verte »
Vert forêt profond, fonds de table chauds, doré doux, contrastes lisibles. Titres en Cormorant Garamond (fichiers dans `public/fonts`), texte en sans-serif lisible, quelques touches manuscrites. Illustrations d’ambiance : `forest-table-v1.png`, `forest-layers-v1.png`, `sauge-layers-cutout-v2.png`. Mobile d’abord (navigation en bas, boutons tactiles), accessible au clavier, `aria` corrects, respect de `prefers-reduced-motion`, impression propre de la liste d’épicerie.

## Pages et fonctions
Navigation principale : **Découvrir**, **Ma semaine**, **Épicerie** ; **Mon compte** à part.
- Accueil : composition culinaire, explication du parcours, sélection de vraies recettes, occasions.
- Découvrir : recherche par envie et par ingrédient, filtres facultatifs, 12 suggestions, bouton « D’autres idées », favoris, fiche recette (étapes, quantités ajustables, températures °C/°F, minuterie, notes privées, étoiles).
- Questionnaire : portions, contraintes alimentaires et allergies, jours de la semaine (7 jours, choix par jour), équipement, objectif et inventaire facultatifs. Un jour impossible ne vide pas les autres. Aucune contrainte retirée en silence pour atteindre un budget : diagnostic clair et menu partiel seulement si la personne le choisit.
- Ma semaine : menu des 7 soupers sans doublon, remplacement et échange de plats, « Sauve mon souper », « Cuisine une fois, mange deux plats » (variante lunch), nouvelle semaine avec archivage et annulation, historique de 20 semaines.
- Épicerie : liste regroupée, inventaire et dates à surveiller, magasin et code postal, budget indicatif séparé, export/impression. L’inventaire n’est modifié qu’après confirmation.
- Occasions (Plus) : convives, entrée et dessert, heure de service, déroulé des préparations.
- Mon compte : connexion/inscription, mes recettes (créer, modifier, supprimer, proposer pour publication), administration des recettes (admin seulement), sauvegarde/restauration, mode démo local clairement identifié comme simulation.
- Mode invité : sans compte, tout fonctionne et reste sur l’appareil (stockage local, export/import de sauvegarde).

## Offre
Gratuit : jusqu’à 7 soupers par semaine, recherche, recettes détaillées, restrictions, portions, budget indicatif, épicerie, inventaire, favoris, historique. Plus : variantes lunch, occasions, invités, entrée et dessert, coordination des préparations. Prix **proposés** : 9,99 $ CA/mois ou 79,99 $ CA/an avant taxes, essai de 14 jours sans carte. **Aucun paiement ni essai n’est actif** : présente ces éléments comme « bientôt », sans bouton d’achat qui fonctionne.

## Comptes : Supabase (déjà conçu, à utiliser tel quel)
- Utilise `supabase/schema.sql` et `supabase/base-recipes.sql` sans les modifier. Tous les appels passent par les fonctions `api_*` (voir `src/supabase-api.js` : garde la même logique, réécrite en TypeScript). Le navigateur n’accède jamais directement aux tables.
- Variables : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`. Jamais de clé `service_role` dans le code. Le rôle admin et la formule Plus ne se choisissent jamais côté client.
- Si les variables manquent, affiche un message clair « Comptes non configurés » et garde le mode invité.
- Garde `CONFIGURATION-SUPABASE.md` à jour : c’est la liste de ce que je dois configurer moi-même (projet Supabase, SQL, clés, réglages d’authentification, me nommer administrateur).
- Ajoute l’écran « Mot de passe oublié » (`resetPasswordForEmail` puis `updateUser`).

## Interdits
Aucune fausse donnée : pas de faux prix, rabais, avis, témoignages ou statistiques. Ne prétends jamais que l’IA, les prix automatiques des détaillants ou le paiement fonctionnent. N’affirme pas qu’une recette a été testée en cuisine. Ne supprime aucune fonction existante.

## Façon de travailler
Procède par étapes : 1) structure, `src/lib` et tests, 2) pages et design, 3) comptes Supabase, 4) finitions (accessibilité, mobile, performance). Vérifie l’affichage sur ordinateur et téléphone et corrige. À la fin, donne-moi la liste de ce qui reste à faire de mon côté et les écarts avec l’ancienne version.
