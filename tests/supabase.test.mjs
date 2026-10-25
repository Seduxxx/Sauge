import {test} from 'node:test';import assert from 'node:assert/strict';
import {normalizeRecipe} from '../src/recipe-model.js';
import {createSupabaseApi,accountsConfigured} from '../src/supabase-api.js';

const base=(extra={})=>({name:'Riz citronné',servings:2,prepTime:10,cookTime:20,course:'main',ingredients:[{name:'Riz',amount:150,unit:'g'},{name:'Poudre de baobab',amount:20,unit:'g'}],steps:['Cuire.'],rightsConfirmed:true,...extra});
const b64=bytes=>'data:image/%s;base64,'+Buffer.from(bytes).toString('base64');
const chunk=(type,data)=>Buffer.concat([Buffer.from([0,0,0,data.length].slice(-4)),Buffer.from(type),Buffer.from(data),Buffer.from([1,2,3,4])]);

test('recette : ingrédient inconnu reconnu comme personnalisé, balises refusées',()=>{
  const r=normalizeRecipe(base());
  assert.equal(r.ingredients[0].known,true);assert.match(r.ingredients[1].id,/^custom-[a-f0-9]+$/);assert.equal(r.ingredients[1].known,false);
  assert.equal(normalizeRecipe(base()).ingredients[1].id,r.ingredients[1].id);
  assert.throws(()=>normalizeRecipe(base({name:'<b>x</b>'})),/invalide/);
  assert.throws(()=>normalizeRecipe(base({course:'autre'})),/catégorie/);
});
test('photo JPEG : métadonnées EXIF retirées; PNG : blocs texte retirés; autres formats refusés',()=>{
  const jpeg=[0xff,0xd8,0xff,0xe1,0,8,0x45,0x78,0x69,0x66,0,0,0xff,0xda,0,2,0xff,0xd9];
  const out=normalizeRecipe(base({photo:b64(jpeg).replace('%s','jpeg')})).photo;
  const bytes=Buffer.from(out.split(',')[1],'base64');assert.equal(bytes.includes(Buffer.from('Exif')),false);assert.equal(bytes[0],0xff);assert.equal(bytes.at(-1),0xd9);
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(10,0);ihdr.writeUInt32BE(10,4);
  const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('tEXt',Buffer.from('GPS=45.5')),chunk('IDAT',Buffer.alloc(0)),chunk('IEND',Buffer.alloc(0))]);
  const outPng=Buffer.from(normalizeRecipe(base({photo:b64(png).replace('%s','png')})).photo.split(',')[1],'base64');assert.equal(outPng.includes(Buffer.from('GPS')),false);
  assert.throws(()=>normalizeRecipe(base({photo:'data:image/gif;base64,AAAA'})),/JPEG ou PNG/);
  assert.throws(()=>normalizeRecipe(base({photo:b64([1,2,3,4,5,6,7,8,9,10,11,12,13]).replace('%s','jpeg')})),/JPEG invalide/);
});

function fakeClient({rpcResult={ok:true},rpcError=null,session=null,signUp={data:{session:null},error:null},signIn={error:null}}={}){
  const calls=[];
  return {calls,client:{
    rpc:async(name,args)=>{calls.push(['rpc',name,args]);return rpcError?{data:null,error:rpcError}:{data:rpcResult,error:null};},
    auth:{getSession:async()=>({data:{session}}),signUp:async o=>{calls.push(['signUp',o]);return signUp;},signInWithPassword:async o=>{calls.push(['signIn',o]);return signIn;},signOut:async()=>{calls.push(['signOut']);return {};}}}};
}
test('sans variables Supabase, les comptes restent désactivés (mode invité)',()=>{assert.equal(accountsConfigured,false);});
test('routes : chaque route de l’interface appelle la bonne fonction SQL',async()=>{
  const f=fakeClient({session:{}});const {api}=createSupabaseApi(f.client);
  await api('/session');await api('/catalogue');await api('/state','PUT',{data:{a:1},revision:3});
  await api('/recipes','POST',{...base(),submit:true});await api('/recipes/own-1','PUT',{...base(),version:2});await api('/recipes/own-1','DELETE');await api('/recipes/own-1/submit','POST',{});
  await api('/ratings/poulet','PUT',{stars:4});await api('/admin/recipes');await api('/admin/recipes/own-1','PUT',{...base(),version:3});
  await api('/admin/recipes/own-1','POST',{action:'approve',reviewed:true,reason:'',version:3});
  assert.deepEqual(f.calls.map(c=>c[1]),['api_session','api_catalogue','api_state_put','api_recipe_create','api_recipe_edit','api_recipe_delete','api_recipe_submit','api_rate','api_admin_list','api_admin_edit','api_admin_moderate']);
  assert.deepEqual(f.calls[2][2],{p_data:{a:1},p_revision:3});assert.equal(f.calls[3][2].p_submit,true);assert.equal(f.calls[4][2].p_version,2);
  assert.deepEqual(f.calls.at(-1)[2],{p_id:'own-1',p_action:'approve',p_version:3,p_reviewed:true,p_reason:''});
  await assert.rejects(()=>api('/inconnue'),e=>e.status===404);
});
test('session invité : aucun appel à la base',async()=>{const f=fakeClient();assert.deepEqual(await createSupabaseApi(f.client).api('/session'),{user:null,snapshot:null});assert.equal(f.calls.length,0);});
test('erreurs de la base : message français et statut conservés',async()=>{
  const f=fakeClient({rpcError:{code:'P0001',message:'Cette recette a changé. Rechargez-la.',hint:'409'}});
  await assert.rejects(()=>createSupabaseApi(f.client).api('/recipes/own-1','DELETE'),e=>e.status===409&&/changé/.test(e.message));
  const g=fakeClient({rpcError:{code:'XX000',message:'detail interne secret'}});
  await assert.rejects(()=>createSupabaseApi(g.client).api('/catalogue'),e=>e.status===500&&!/secret/.test(e.message));
});
test('inscription : validation, pseudonyme nettoyé, courriel à confirmer',async()=>{
  const f=fakeClient();const {api}=createSupabaseApi(f.client);
  await assert.rejects(()=>api('/auth/register','POST',{email:'pas-un-courriel',password:'UnePhraseSecrete123',pseudonym:'Moi'}),e=>e.status===400);
  await assert.rejects(()=>api('/auth/register','POST',{email:'a@b.co',password:'court',pseudonym:'Moi'}),e=>e.status===400);
  await assert.rejects(()=>api('/auth/register','POST',{email:'a@b.co',password:'UnePhraseSecrete123',pseudonym:'<b>'}),e=>e.status===400);
  assert.equal(f.calls.length,0);
  await assert.rejects(()=>api('/auth/register','POST',{email:' A@B.co ',password:'UnePhraseSecrete123',pseudonym:' Moi ',role:'admin'}),e=>e.status===202);
  assert.deepEqual(f.calls[0][1],{email:'a@b.co',password:'UnePhraseSecrete123',options:{data:{pseudonym:'Moi'}}});
  const g=fakeClient({signUp:{data:{session:{}},error:null},rpcResult:{user:{id:'u',role:'member'},snapshot:{data:null,revision:0}}});
  assert.equal((await createSupabaseApi(g.client).api('/auth/register','POST',{email:'a@b.co',password:'UnePhraseSecrete123',pseudonym:'Moi'})).user.role,'member');
});
test('connexion et déconnexion',async()=>{
  const bad=fakeClient({signIn:{error:{message:'Invalid login credentials'}}});
  await assert.rejects(()=>createSupabaseApi(bad.client).api('/auth/login','POST',{email:'a@b.co',password:'x'}),e=>e.status===401&&/incorrect/.test(e.message));
  const ok=fakeClient({rpcResult:{user:{id:'u'},snapshot:{data:null,revision:0}}});const {api}=createSupabaseApi(ok.client);
  assert.equal((await api('/auth/login','POST',{email:'A@b.co',password:'UnePhraseSecrete123'})).user.id,'u');
  assert.deepEqual(await api('/auth/logout','POST',{}),{ok:true});assert.equal(ok.calls.at(-1)[0],'signOut');
});
