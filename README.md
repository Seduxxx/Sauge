# Sauge — version Bolt.new avec comptes Supabase

Projet Vite en JavaScript pur. Dépendance : `@supabase/supabase-js` (+ Vite pour le développement).

1. Lis **CONFIGURATION-SUPABASE.md** : c'est la liste de ce que tu dois configurer côté Supabase.
2. `npm install` puis `npm run dev` (Bolt le fait automatiquement).
3. `npm test` : 142 tests (logique des menus, validation des recettes, pont Supabase).
4. `npm run build` : version de production.

Sans clés Supabase dans `.env`, l'application fonctionne en **mode invité** (données sur l'appareil).

## Structure
- `src/` code de l'application · `src/styles/` CSS · `public/assets` photos · `public/fonts` police
- `src/supabase-api.js` pont entre l'interface et Supabase · `src/recipe-model.js` validation des recettes (navigateur)
- `supabase/schema.sql` tables, règles de sécurité et fonctions · `supabase/base-recipes.sql` recettes de base notables
- `tests/` tests Node · `tests-sql/` test du schéma SQL sur un vrai Postgres local (optionnel : `cd tests-sql && npm i && node --test schema.test.mjs`)
