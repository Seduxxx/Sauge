// Teste le schéma Supabase contre un vrai Postgres local (PGlite), sans compte Supabase.
// Usage : cd tests-sql && npm i && node --test schema.test.mjs
import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const read=f=>readFileSync(new URL('../supabase/'+f,import.meta.url),'utf8');
const A='aaaaaaaa-0000-4000-8000-000000000001',B='bbbbbbbb-0000-4000-8000-000000000002',C='cccccccc-0000-4000-8000-000000000003';
const db=new PGlite();
await db.exec(`create role anon nologin; create role authenticated nologin;
 create schema auth; create table auth.users(id uuid primary key default gen_random_uuid(), raw_user_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema public,auth to anon,authenticated;`);
await db.exec(read('schema.sql'));await db.exec(read('base-recipes.sql'));
await db.exec(`insert into auth.users(id,raw_user_meta_data) values('${A}','{"pseudonym":"Alice"}'),('${B}','{"pseudonym":"Bob","role":"admin"}'),('${C}','{"pseudonym":"<b>x</b>"}');`);
async function as(uid,fn){await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid||'']);await db.exec('set role '+(uid?'authenticated':'anon'));try{return await fn();}finally{await db.exec('reset role');}}
const call=(uid,sql,params=[])=>as(uid,async()=>(await db.query('select '+sql+' as r',params)).rows[0].r);
async function fails(uid,sql,params,status,text){await assert.rejects(()=>call(uid,sql,params),e=>{assert.equal(String(e.hint),String(status),'statut '+e.message+' / '+e.hint);if(text)assert.match(e.message,text);return true;});}
const recipe=(extra={})=>({name:'Riz citronné',description:'',servings:2,prepTime:10,cookTime:20,time:30,course:'main',ingredients:[{id:'rice',name:'Riz',amount:150,unit:'g',known:true}],steps:['Cuire.'],equipment:[],autoInclude:false,photo:'',rightsConfirmed:true,...extra});

test('profil créé automatiquement; rôle jamais choisi par l’inscription; pseudonyme nettoyé',async()=>{
  const rows=(await db.query('select id,pseudonym,role,plan from public.profiles order by pseudonym')).rows;
  assert.deepEqual(rows.map(r=>[r.pseudonym,r.role,r.plan]),[['Alice','member','free'],['Bob','member','free'],['Membre','member','free']]);
});
test('tables fermées : aucun accès direct ni auto-promotion',async()=>{
  await assert.rejects(()=>as(A,()=>db.exec("update public.profiles set role='admin' where id='"+A+"'")),/permission denied/);
  await assert.rejects(()=>as(A,()=>db.exec('select * from public.recipes')),/permission denied/);
  await assert.rejects(()=>as(null,()=>db.exec('select * from public.profiles')),/permission denied/);
});
test('session : invité vs membre',async()=>{
  assert.equal((await call(null,'public.api_session()')).user,null);
  const s=await call(A,'public.api_session()');assert.equal(s.user.pseudonym,'Alice');assert.equal(s.snapshot.revision,0);assert.equal(s.snapshot.data,null);
  await assert.rejects(()=>call(null,'public.api_state_get()'),/permission denied/);
});
test('sauvegarde : révisions, conflit 409, formule Plus',async()=>{
  assert.deepEqual(await call(A,'public.api_state_put($1::jsonb,0)',[JSON.stringify({profile:{people:3},ids:[]})]),{revision:1});
  await fails(A,'public.api_state_put($1::jsonb,0)',[JSON.stringify({profile:{people:4}})],409);
  assert.equal((await call(A,'public.api_state_put($1::jsonb,1)',[JSON.stringify({profile:{people:4}})])).revision,2);
  assert.equal((await call(A,'public.api_session()')).snapshot.data.profile.people,4);
  await fails(A,'public.api_state_put($1::jsonb,2)',[JSON.stringify({profile:{lunchStyle:'transform'}})],403,/Plus/);
  await fails(A,'public.api_state_put($1::jsonb,2)',[JSON.stringify({profile:{events:{noel:{}}}})],403,/Plus/);
  await db.exec("update public.profiles set plan='plus' where id='"+A+"'");
  assert.equal((await call(A,'public.api_state_put($1::jsonb,2)',[JSON.stringify({profile:{lunchStyle:'transform'}})])).revision,3);
  await db.exec("update public.profiles set plan='free' where id='"+A+"'");
});
let own;
test('recettes privées : création, version, droits, propriétaire',async()=>{
  own=await call(A,'public.api_recipe_create($1::jsonb,false)',[JSON.stringify(recipe())]);
  assert.match(own.id,/^own-[a-f0-9-]+$/);assert.equal(own.status,'private');assert.equal(own.creator,'Alice');
  await fails(A,'public.api_recipe_create($1::jsonb,false)',[JSON.stringify(recipe({name:'<img src=x onerror=1>'}))],400);
  await fails(A,'public.api_recipe_create($1::jsonb,true)',[JSON.stringify(recipe({rightsConfirmed:false}))],400,/droits/);
  await fails(A,'public.api_recipe_create($1::jsonb,false)',[JSON.stringify(recipe({ingredients:[]}))],400);
  await fails(A,'public.api_recipe_create($1::jsonb,false)',[JSON.stringify(recipe({photo:'data:text/html;base64,AAAA'}))],400);
  await fails(C,'public.api_recipe_edit($1,1,$2::jsonb)',[own.id,JSON.stringify(recipe())],404);
  await fails(C,'public.api_recipe_delete($1)',[own.id],404);
  await fails(A,'public.api_recipe_edit($1,99,$2::jsonb)',[own.id,JSON.stringify(recipe())],409);
  const edited=await call(A,'public.api_recipe_edit($1,1,$2::jsonb)',[own.id,JSON.stringify(recipe({name:'Riz doré'}))]);
  assert.equal(edited.version,2);assert.equal(edited.data.name,'Riz doré');
  const sub=await call(A,'public.api_recipe_submit($1)',[own.id]);assert.equal(sub.status,'pending');own=sub;
});
test('catalogue : le brouillon d’un autre membre reste invisible',async()=>{
  assert.equal((await call(A,'public.api_catalogue()')).recipes.length,1);
  assert.equal((await call(C,'public.api_catalogue()')).recipes.length,0);
  assert.equal((await call(null,'public.api_catalogue()')).recipes.length,0);
});
test('modération réservée aux administrateurs, avec version et confirmation',async()=>{
  await fails(A,'public.api_admin_list()',[],403);
  await fails(A,"public.api_admin_moderate($1,'approve',$2,true,'')",[own.id,own.version],403);
  await db.exec("update public.profiles set role='admin' where id='"+B+"'");
  assert.equal((await call(B,'public.api_admin_list()')).recipes.length,1);
  await fails(B,"public.api_admin_moderate($1,'approve',$2,false,'')",[own.id,own.version],400,/vérification/);
  await fails(B,"public.api_admin_moderate($1,'approve',99,true,'')",[own.id],409);
  await fails(B,"public.api_admin_moderate($1,'danse',$2,true,'')",[own.id,own.version],400);
  await call(B,"public.api_admin_edit($1,$2,$3::jsonb)",[own.id,own.version,JSON.stringify(recipe({name:'Riz doré (révisé)'}))]);
  const list=(await call(B,'public.api_admin_list()')).recipes;const pending=list.find(r=>r.id===own.id);
  assert.equal(pending.data.name,'Riz doré (révisé)');
  await call(B,"public.api_admin_moderate($1,'approve',$2,true,'')",[own.id,pending.version]);
  const cat=await call(C,'public.api_catalogue()');
  assert.equal(cat.recipes.length,1);assert.equal(cat.recipes[0].kind,'publication');assert.equal(cat.recipes[0].data.name,'Riz doré (révisé)');assert.equal(cat.recipes[0].creator,'Alice');
  assert.equal((await call(null,'public.api_catalogue()')).recipes.length,1);
  assert.equal((await db.query('select count(*)::int n from public.moderation_log')).rows[0].n,1);
});
test('étoiles : recette publiée et recette de base, valeurs invalides',async()=>{
  const pub=(await call(C,'public.api_catalogue()')).recipes[0];
  assert.deepEqual(await call(C,'public.api_rate($1,4)',[pub.id]),{count:1,average:4,mine:4});
  await call(A,'public.api_rate($1,2)',[pub.id]);
  const cat=await call(C,'public.api_catalogue()');assert.equal(cat.ratings[pub.id].count,2);assert.equal(cat.ratings[pub.id].average,3);assert.equal(cat.ratings[pub.id].mine,4);
  assert.equal((await call(C,"public.api_rate('poulet',5)")).mine,5);
  assert.equal(cat.ratings.poulet.count,0);
  await fails(C,'public.api_rate($1,6)',[pub.id],400);await fails(C,"public.api_rate('inconnue',3)",[],404);await fails(C,"public.api_rate($1,3)",[own.id],404);
});
test('retrait de la publication',async()=>{
  const pub=(await call(B,'public.api_admin_list()')).recipes.find(r=>r.kind==='publication');
  await call(B,"public.api_admin_moderate($1,'unpublish',$2,false,'')",[pub.id,pub.version]);
  assert.equal((await call(C,'public.api_catalogue()')).recipes.length,0);
});
test('refus avec raison visible par l’auteur',async()=>{
  const r2=await call(A,'public.api_recipe_create($1::jsonb,true)',[JSON.stringify(recipe({name:'Autre riz'}))]);assert.equal(r2.status,'pending');
  await call(B,"public.api_admin_moderate($1,'reject',$2,false,'Préciser le citron.')",[r2.id,r2.version]);
  const mine=(await call(A,'public.api_catalogue()')).recipes.find(r=>r.id===r2.id);assert.equal(mine.status,'rejected');assert.equal(mine.reason,'Préciser le citron.');
  assert.deepEqual(await call(A,'public.api_recipe_delete($1)',[r2.id]),{ok:true});
});
