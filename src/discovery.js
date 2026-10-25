// Local discovery remains useful before the server-side AI and price feeds are connected.
export function normalWords(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[^a-z0-9$ ]/g,' ').replace(/\s+/g,' ').trim();}
const foodWords={chicken:'poulet chicken',beef:'boeuf steak filet',pork:'porc cotelette',salmon:'saumon salmon',wholeFish:'poisson',shrimp:'crevette crevettes gambas',tofu:'tofu',pasta:'pate pates penne spaghetti',rice:'riz',mushroom:'champignon champignons',chickpea:'pois chiche pois chiches',redLentil:'lentille lentilles dahl',quinoa:'quinoa',chocolate:'chocolat chocolate',strawberry:'fraise fraises',potato:'patate patates pomme de terre pommes de terre',garlic:'ail',lemon:'citron citrons',egg:'oeuf oeufs omelette',mozzarella:'mozzarella',cheddar:'cheddar',yogurt:'yogourt yaourt'};
const foodPatterns={chicken:/\bpoulet\b|\bchicken\b/,beef:/\bboeuf\b|\bsteak\b/,pork:/\bporc\b|\bcotelettes?\b/,salmon:/\bsaumon\b/,wholeFish:/\bpoisson\b/,shrimp:/\bcrevettes?\b|\bgambas\b/,tofu:/\btofu\b/,pasta:/\bpates?\b|\bpenne\b|\bspaghetti\b/,rice:/\briz\b/,mushroom:/\bchampignons?\b/,chickpea:/\bpois chiches?\b/,redLentil:/\blentilles?\b|\bdahl\b/,quinoa:/\bquinoa\b/,chocolate:/\bchocolat\b/,strawberry:/\bfraises?\b/,potato:/\bpatates?\b|\bpommes? de terre\b/,garlic:/\bail\b/,lemon:/\bcitrons?\b/,egg:/\boeufs?\b|\bomelette\b/,mozzarella:/\bmozzarella\b/,cheddar:/\bcheddar\b/,yogurt:/\byogourt\b|\byaourt\b/};
export function desireIntent(value){
 const text=normalWords(value),excluded=[],allergens=[];let positive=text;
 for(const clause of text.matchAll(/(?:\bsans\b|\bpas de\b)\s+(.+?)(?=\bavec\b|\bmais\b|\ben \d|$)/g)){
  for(const [id,pattern] of Object.entries(foodPatterns))if(pattern.test(clause[1]))excluded.push(id);
  if(/lait|lactose|laitier|fromage/.test(clause[1]))allergens.push('milk');
  if(/gluten|ble/.test(clause[1]))allergens.push('gluten');
  if(/noix|amande|pistache/.test(clause[1]))allergens.push('nuts');
  if(/arachide/.test(clause[1]))allergens.push('peanut');
  positive=positive.replace(clause[0],' ');
 }
 const ingredients=Object.entries(foodPatterns).filter(([,pattern])=>pattern.test(positive)).map(([id])=>id);
 const time=text.match(/\b(\d{1,3})\s*(?:min|minutes?)\b/);
 const diet=/\bvegan\b|\bvegetalien/.test(text)?'vegan':/\bvegetarien|\bvege\b|\bvegetal\b|sans viande/.test(text)?'vegetarian':null;
 const theme=/italien|dolce|italie/.test(text)?'italian':/mexic|fiesta/.test(text)?'mexican':/asiati|japon|thai/.test(text)?'asian':/romanti|amoureux/.test(text)?'romantic':/brunch/.test(text)?'brunch':/barbecue|\bbbq\b/.test(text)?'bbq':null;
 const course=/dessert|douceur|sucre/.test(text)?'dessert':/\bentree|aperitif/.test(text)?'starter':/\bsouper\b|\brepas\b|\bdiner\b|plat principal/.test(text)?'main':null;
 const creamy=/cremeu|reconfort|onctueu/.test(text),budget=/economi|pas cher|petit budget/.test(text);
 const known=ingredients.length||excluded.length||allergens.length||time||diet||theme||course||creamy||budget||/rapide/.test(text);
 const keywords=known?[]:positive.split(' ').filter(w=>w.length>2&&!['envie','veux','voudrais','pour','avec','une','des','les','dans','soir','souper','repas','recette','recettes','faire','manger','moi','quelque','chose','bon','bonne','delicieux','aimerais','plait','nous','cherche','cuisine'].includes(w));
 return {text,ingredients,excluded:[...new Set(excluded)],allergens:[...new Set(allergens)],maxTime:time?Math.max(1,Math.min(1440,Number(time[1]))):/rapide/.test(text)?25:null,diet,theme,course,creamy,budget,keywords};
}
function ingredientMatches(r,id){return id==='wholeFish'?['wholeFish','whiteFish','salmon'].some(k=>r.items[k]):id==='beef'?!!(r.items.beef||r.items.groundBeef):id==='shrimp'?!!(r.items.shrimp||r.items.wholeShrimp):id==='redLentil'?!!(r.items.redLentil||r.items.lentils):!!r.items[id];}
export function desireResults(list,request,options={}){
 const intent=desireIntent(request),profile=options.profile;
 const found=list.filter(r=>(r.photoVerified||r.accountRecipe)&&
  (!options.favorites||options.favorites.includes(r.id))&&
  (!options.course||options.course==='all'||r.course===options.course)&&
  (!options.theme||r.themes.includes(options.theme))&&
  (!intent.course||r.course===intent.course)&&(!intent.theme||r.themes.includes(intent.theme))&&
  (!intent.maxTime||r.time<=intent.maxTime)&&
  (!intent.diet||(intent.diet==='vegan'?r.vegan:r.veg))&&
  intent.ingredients.every(id=>ingredientMatches(r,id))&&
  !intent.excluded.some(id=>ingredientMatches(r,id))&&!intent.allergens.some(a=>r.allergens.includes(a))&&
  (!profile||((profile.diet!=='vegan'||r.vegan)&&(profile.diet!=='vegetarian'||r.veg)&&(profile.diet!=='pescatarian'||!['chicken','beef','groundBeef','pork'].some(id=>r.items[id]))&&!profile.excluded.some(id=>r.items[id])&&!profile.allergens.some(a=>r.allergens.includes(a))))&&
  (options.filter!=='veg'||r.veg)&&(options.filter!=='quick'||r.time<=25)&&
  (options.filter!=='budget'||options.price(r)<3)&&
  (!intent.creamy||/cremeu|fondant|velout|dahl|risotto|creme|yogourt/.test(normalWords(r.name+' '+r.sub))||r.items.coconutMilk)&&
  (!intent.keywords.length||intent.keywords.some(w=>normalWords(r.name+' '+r.sub+' '+Object.keys(r.items).map(id=>foodWords[id]||id).join(' ')).includes(w)))
 );
 if(intent.budget&&options.price)found.sort((a,b)=>options.price(a)-options.price(b));
 return {intent,recipes:found};
}
export function discoveryBatch(list,round=0,size=12,exclude=[]){
 const unseen=list.filter(r=>!exclude.includes(r.id)),pool=unseen.length?unseen:list;
 if(!pool.length)return [];
 const offset=unseen.length?0:(round*size)%pool.length;
 return [...pool.slice(offset),...pool.slice(0,offset)].slice(0,size);
}
export function createExperienceGateway(config={},request=globalThis.fetch){
 let base='';try{const url=new URL(config.apiBase);if(url.protocol==='https:'&&!url.username&&!url.password)base=url.href.replace(/\/$/,'');}catch{}
 const connected=!!base&&typeof request==='function';
 async function post(route,payload,signal){
  if(!connected)return {status:'not-connected'};
  const controller=typeof AbortController==='function'?new AbortController():null;
  const abort=()=>controller?.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
  let timer;const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{abort();reject(new Error('service-timeout'));},12000);});
  try{
   const response=await Promise.race([request(base+route,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(payload),signal:controller?.signal||signal}),timeout]);
   if(!response.ok)throw new Error('service-unavailable');
   const result=await Promise.race([response.json(),timeout]);if(!result||typeof result!=='object')throw new Error('invalid-response');return result;
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
 }
 return {connected,suggest:(payload,signal)=>post('/recipe-suggestions',payload,signal),offers:(payload,signal)=>post('/offers',payload,signal)};
}
// Only the trusted configured backend can supply partner offers. AI recipe text cannot supply prices.
export function approvedRecipeIds(response,list){
 if(!Array.isArray(response?.recipeIds))return [];
 const known=new Set(list.filter(r=>r.photoVerified||r.accountRecipe).map(r=>r.id));
 return [...new Set(response.recipeIds.filter(id=>typeof id==='string'&&known.has(id)))].slice(0,60);
}
