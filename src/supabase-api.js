// Pont entre l'interface et Supabase.
// L'interface parle toujours le même « langage » (routes /session, /catalogue, /recipes…),
// ce fichier traduit chaque route en appel Supabase (authentification + fonctions SQL api_*).
// Toute la sécurité réelle est dans supabase/schema.sql ; ici on ne fait que traduire et valider pour l'utilisateur.
import {createClient} from '@supabase/supabase-js';
import {normalizeRecipe,plain} from './recipe-model.js';

const env=import.meta.env||{};
export const accountsConfigured=Boolean(env.VITE_SUPABASE_URL&&env.VITE_SUPABASE_ANON_KEY);

function fail(message,status=500){const error=new Error(message);error.status=status;return error;}

// Convertit une erreur Supabase/Postgres en message lisible. Les erreurs voulues par le schéma (code P0001)
// portent un message en français et le statut HTTP équivalent dans « hint ».
function fromRpc(error){
  if(error.code==='P0001')return fail(error.message,Number(error.hint)||400);
  if(error.code==='42501'||error.status===401)return fail('Connectez-vous pour utiliser votre espace personnel.',401);
  return fail('Erreur du service. Réessayez.',500);
}

export function createSupabaseApi(client=createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}})){
  async function rpc(name,args){const {data,error}=await client.rpc(name,args);if(error)throw fromRpc(error);return data;}
  const session=()=>rpc('api_session');

  async function register({email,password,pseudonym}={}){
    email=String(email||'').trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||typeof password!=='string'||password.length<10||password.length>128)throw fail('Courriel valide et mot de passe de 10 à 128 caractères requis.',400);
    pseudonym=plain(pseudonym,40);
    const {data,error}=await client.auth.signUp({email,password,options:{data:{pseudonym}}});
    if(error)throw fail(/already|registered|exists/i.test(error.message)?'Impossible de créer ce compte. Essayez de vous connecter.':'Impossible de créer ce compte pour le moment.',/already|registered|exists/i.test(error.message)?409:400);
    // Si la confirmation par courriel est activée dans Supabase, aucune session n'est ouverte tout de suite.
    if(!data.session)throw fail('Compte créé. Confirmez votre courriel, puis connectez-vous.',202);
    return session();
  }
  async function login({email,password}={}){
    const {error}=await client.auth.signInWithPassword({email:String(email||'').trim().toLowerCase(),password:String(password||'').slice(0,129)});
    if(error)throw fail('Courriel ou mot de passe incorrect.',401);
    return session();
  }
  const recipeId=route=>decodeURIComponent((route.match(/^\/(?:admin\/)?(?:recipes|ratings)\/([^/]+)/)||[])[1]||'');

  async function api(route,method='GET',body={}){
    body=body||{};
    if(route==='/session'&&method==='GET'){const {data}=await client.auth.getSession();return data.session?session():{user:null,snapshot:null};}
    if(route==='/auth/register'&&method==='POST')return register(body);
    if(route==='/auth/login'&&method==='POST')return login(body);
    if(route==='/auth/logout'&&method==='POST'){await client.auth.signOut();return {ok:true};}
    if((route==='/catalogue'||route==='/recipes')&&method==='GET')return rpc('api_catalogue');
    if(route==='/state'&&method==='GET')return rpc('api_state_get');
    if(route==='/state'&&method==='PUT')return rpc('api_state_put',{p_data:body.data,p_revision:Number(body.revision)});
    if(route==='/recipes'&&method==='POST')return rpc('api_recipe_create',{p_data:normalizeRecipe(body),p_submit:body.submit===true});
    if(/^\/recipes\/[^/]+\/submit$/.test(route)&&method==='POST')return rpc('api_recipe_submit',{p_id:recipeId(route)});
    if(/^\/recipes\/[^/]+$/.test(route)&&method==='PUT')return rpc('api_recipe_edit',{p_id:recipeId(route),p_version:Number(body.version),p_data:normalizeRecipe(body)});
    if(/^\/recipes\/[^/]+$/.test(route)&&method==='DELETE')return rpc('api_recipe_delete',{p_id:recipeId(route)});
    if(/^\/ratings\/[^/]+$/.test(route)&&method==='PUT')return rpc('api_rate',{p_id:recipeId(route),p_stars:Number(body.stars)});
    if(route==='/admin/recipes'&&method==='GET')return rpc('api_admin_list');
    if(/^\/admin\/recipes\/[^/]+$/.test(route)&&method==='PUT')return rpc('api_admin_edit',{p_id:recipeId(route),p_version:Number(body.version),p_data:normalizeRecipe(body)});
    if(/^\/admin\/recipes\/[^/]+$/.test(route)&&method==='POST')return rpc('api_admin_moderate',{p_id:recipeId(route),p_action:String(body.action||''),p_version:Number(body.version),p_reviewed:body.reviewed===true,p_reason:String(body.reason||'')});
    throw fail('Service non disponible.',404);
  }
  return {api,client};
}
