// Génère le SQL qui déclare les recettes de base notables (photo vérifiée).
// À relancer et à exécuter dans Supabase chaque fois que le catalogue de base change :
//   npm run seed:sql > supabase/base-recipes.sql
import {recipes} from '../src/domain.js';
const ids=recipes.filter(r=>r.photoVerified&&!r.accountRecipe).map(r=>r.id);
console.log('-- Recettes de base avec photo vérifiée ('+ids.length+')');
console.log('insert into public.base_recipes(id) values');
console.log(ids.map(id=>"  ('"+id.replace(/'/g,"''")+"')").join(',\n'));
console.log('on conflict (id) do nothing;');
