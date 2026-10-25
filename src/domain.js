import {culinaryMethods} from './recipe-details.js';
import {desireResults} from './discovery.js';
import {kitchenLabel} from './measures.js';
import {preparationAdvice} from './preparation.js';
import {extraIngredients,extraRecipes,extraAllergens,meatIngredients,animalIngredients} from './catalogue.js';
import {recipePhotos,photoIngredients,photoIngredientAllergens,photoAnimalIngredients} from './photos.js';
export const ingredients={chicken:['Poulet','g',.016,'Protéines'],rice:['Riz','g',.004,'Garde-manger'],broccoli:['Brocoli','g',.006,'Fruits et légumes'],tofu:['Tofu','g',.009,'Protéines'],pepper:['Poivron','g',.008,'Fruits et légumes'],pasta:['Pâtes','g',.004,'Garde-manger'],tomato:['Tomates en conserve','g',.004,'Garde-manger'],lentils:['Lentilles cuites','g',.004,'Protéines'],carrot:['Carottes','g',.003,'Fruits et légumes'],potato:['Pommes de terre','g',.003,'Fruits et légumes'],chickpea:['Pois chiches cuits','g',.004,'Protéines'],...extraIngredients};
export const recipes=[
{id:'poulet',name:'Bol de poulet & brocoli',sub:'Un classique qui fait un excellent lunch.',emoji:'🥦',color:'sage',time:25,veg:false,items:{chicken:150,rice:75,broccoli:150},steps:['Cuire le riz selon les indications de l’emballage.','Couper le brocoli et le faire cuire à la vapeur.','Cuire complètement le poulet à la poêle; vérifier la cuisson avec un thermomètre.','Répartir le riz, le poulet et le brocoli. Réserver les portions lunch et les réfrigérer rapidement.']},
{id:'tofu',name:'Tofu doré aux poivrons',sub:'Coloré, économique, parfait à réchauffer.',emoji:'🫑',color:'peach',time:20,veg:true,items:{tofu:175,rice:75,pepper:150},steps:['Cuire le riz selon les indications de l’emballage.','Éponger le tofu, couper en cubes et dorer dans une poêle antiadhésive.','Ajouter les poivrons en lanières et un peu d’eau. Cuire jusqu’à tendreté.','Assaisonner au goût et répartir les portions.']},
{id:'pates',name:'Pâtes aux lentilles & tomates',sub:'Le réconfort du mercredi, tout simplement.',emoji:'🍝',color:'tomato',time:25,veg:true,items:{pasta:100,tomato:180,lentils:120,carrot:80},steps:['Cuire les pâtes selon les indications de l’emballage.','Râper les carottes et mijoter avec les tomates et un peu d’eau.','Ajouter les lentilles cuites, puis laisser mijoter 10 minutes.','Mélanger avec les pâtes et assaisonner au goût.']},
{id:'plaque',name:'Poulet & légumes sur plaque',sub:'Une plaque. Peu de vaisselle. Tout le monde mange.',emoji:'🥔',color:'sand',time:40,veg:false,items:{chicken:150,potato:220,carrot:140},steps:['Préchauffer le four à 200 °C.','Couper les légumes en petits morceaux et répartir sur une plaque avec papier cuisson.','Ajouter le poulet. Cuire jusqu’à cuisson complète du poulet, vérifiée au thermomètre, et tendreté des légumes.','Réserver les portions lunch et réfrigérer rapidement.']},
{id:'pois',name:'Mijoté de pois chiches',sub:'Le souper qui prend soin du portefeuille.',emoji:'🍲',color:'sage',time:30,veg:true,items:{chickpea:180,tomato:150,carrot:100,rice:60},steps:['Cuire le riz selon les indications de l’emballage.','Couper les carottes finement. Sauger avec les tomates et un peu d’eau.','Ajouter les pois chiches cuits et cuire jusqu’à tendreté des carottes.','Assaisonner et servir sur le riz.']}
];
export function consolidate(ids,portions,pantry={}){const totals={};ids.forEach(id=>{const r=recipes.find(r=>r.id===id);if(!r)return;Object.entries(r.items).forEach(([key,q])=>totals[key]=(totals[key]||0)+q*portions);});return Object.entries(totals).map(([id,total])=>({id,total,needed:Math.max(0,total-(Number(pantry[id])||0)),...{name:ingredients[id][0],unit:ingredients[id][1],price:ingredients[id][2],category:ingredients[id][3]}}));}
export function plan(vegetarian,fast,rotation=0){return generatePlan(normalizeProfile({veg:vegetarian,maxTime:fast?25:40}),{},rotation).ids;}

Object.assign(ingredients,{salmon:['Filet de saumon','g',.034,'Protéines'],beef:['Filet de bœuf','g',.055,'Protéines'],lemon:['Citron','g',.008,'Fruits et légumes'],oil:['Huile d’olive','ml',.014,'Garde-manger'],garlic:['Ail','g',.015,'Fruits et légumes'],soy:['Sauce soya','ml',.012,'Garde-manger'],maple:['Sirop d’érable','ml',.025,'Garde-manger'],cumin:['Cumin moulu','g',.05,'Garde-manger']});
const recipeDetails={poulet:{name:'Poulet doré, riz & brocoli',image:'chicken-rice',tag:'Le classique revisité',items:{oil:8,garlic:4,lemon:20}},tofu:{name:'Tofu laqué à l’érable',image:'tofu',tag:'Le végétal gourmand',items:{oil:8,soy:15,maple:12,garlic:4}},pates:{name:'Pâtes, ragù de lentilles',image:'pasta',tag:'L’esprit italien',items:{oil:8,garlic:4}},plaque:{name:'Poulet rôti, légumes fondants',image:'roast-chicken',tag:'Le souper du dimanche',items:{oil:10,garlic:4,lemon:20}},pois:{name:'Pois chiches, tomate & cumin',image:'chickpeas',tag:'Une touche d’ailleurs',items:{oil:8,garlic:4,cumin:2}}};
recipes.forEach(r=>{const d=recipeDetails[r.id];Object.assign(r,{name:d.name,image:d.image,tag:d.tag});Object.assign(r.items,d.items);});
recipes.find(r=>r.id==='poulet').steps=['Cuire le riz selon les indications de l’emballage. Réserver.','Séparer le brocoli en bouquets. Cuire à la vapeur jusqu’à tendreté.','Couper le poulet en lanières. Chauffer l’huile dans une poêle, saisir le poulet et ajouter l’ail haché. Poursuivre jusqu’à cuisson complète, vérifiée au thermomètre.','Ajouter le jus de citron. Répartir sur le riz avec le brocoli. Réserver les lunchs et les réfrigérer rapidement.'];
recipes.find(r=>r.id==='tofu').steps=['Cuire le riz selon les indications de l’emballage. Éponger le tofu et le couper en cubes.','Mélanger la sauce soya, le sirop d’érable et l’ail haché avec un peu d’eau.','Chauffer l’huile dans une poêle. Dorer le tofu, puis ajouter les poivrons émincés. Cuire jusqu’à tendreté.','Verser la sauce et laisser réduire légèrement. Servir sur le riz et réserver les portions lunch.'];
recipes.find(r=>r.id==='pates').steps=['Cuire les pâtes selon les indications de l’emballage. Garder un peu d’eau de cuisson.','Chauffer l’huile, ajouter l’ail haché et les carottes râpées. Faire revenir 3 minutes.','Ajouter les tomates et les lentilles cuites. Sauger 10 minutes.','Mélanger avec les pâtes; détendre avec l’eau de cuisson au besoin. Saler et poivrer au goût.'];
recipes.find(r=>r.id==='plaque').steps=['Préchauffer le four à 200 °C. Couper les pommes de terre et les carottes en petits morceaux.','Mélanger les légumes avec l’huile et l’ail haché sur une plaque. Ajouter le poulet et le citron en quartiers.','Cuire environ 30 minutes, en retournant les légumes à mi-cuisson. Vérifier au thermomètre que le poulet est complètement cuit et poursuivre au besoin.','Servir avec le jus de la plaque. Réserver les lunchs et les réfrigérer rapidement.'];
recipes.find(r=>r.id==='pois').steps=['Cuire le riz selon les indications de l’emballage.','Chauffer l’huile, faire revenir l’ail haché et le cumin une minute. Ajouter les carottes coupées finement.','Ajouter les tomates, les pois chiches cuits et un peu d’eau. Sauger jusqu’à tendreté des carottes.','Saler et poivrer au goût. Servir avec le riz et réserver les portions lunch.'];
recipes.push({id:'saumon',name:'Saumon saisi, citron & légumes',sub:'Une croûte dorée, un cœur tendre et juste ce qu’il faut de citron.',image:'salmon',tag:'Le plaisir de recevoir',time:25,veg:false,items:{salmon:160,potato:180,broccoli:120,lemon:25,oil:10,garlic:4},steps:['Couper les pommes de terre en petits cubes. Les faire cuire dans l’eau jusqu’à tendreté.','Cuire les bouquets de brocoli à la vapeur. Éponger les filets de saumon.','Chauffer l’huile dans une poêle. Saisir le saumon côté peau puis retourner délicatement. Ajouter l’ail; poursuivre jusqu’à cuisson complète, vérifiée au thermomètre.','Servir avec les légumes et le jus de citron. Réserver et réfrigérer rapidement les portions lunch.']},{id:'boeuf',name:'Filet de bœuf, pommes de terre dorées',sub:'Une belle pièce, une poêle bien chaude. Le goût des grandes occasions.',image:'hero',tag:'L’inspiration bistro',time:40,veg:false,items:{beef:160,potato:220,carrot:120,oil:12,garlic:5},steps:['Préchauffer le four à 200 °C. Couper les pommes de terre et carottes en petits morceaux.','Mélanger les légumes avec la moitié de l’huile et l’ail. Rôtir environ 30 minutes, jusqu’à tendreté.','Saisir le filet dans une poêle avec le reste de l’huile, sur chaque face. Terminer la cuisson au four au besoin et vérifier au thermomètre.','Laisser reposer la viande avant de servir avec les légumes. Réfrigérer rapidement les portions réservées.']});
export const allergenLabels={gluten:'Blé / gluten',soy:'Soya',fish:'Poisson',milk:'Lait',egg:'Œufs',peanut:'Arachides',nuts:'Noix',sesame:'Sésame',shellfish:'Crustacés / mollusques',mustard:'Moutarde',sulfites:'Sulfites'};
export const equipmentLabels={hob:'Plaque de cuisson',oven:'Four',airfryer:'Friteuse à air',bbq:'Barbecue',slowcooker:'Saugeuse',multicooker:'Multicuiseur',blender:'Mélangeur',microwave:'Micro-ondes',waffle:'Gaufrier',mixer:'Batteur électrique'};
export const eventLabels={romantic:'Soirée romantique',italian:'Dolce vita italienne',mexican:'Fiesta mexicaine',asian:'Escapade asiatique',brunch:'Brunch gourmand',bbq:'Barbecue entre amis',family:'Grande tablée'};
export const ingredientCategories=['Fruits et légumes','Protéines','Produits laitiers','Garde-manger'];
export function normalizeDayPlans(raw={}){const out={};for(const [key,v] of Object.entries(raw||{})){if(!/^[0-6]$/.test(key)||!v||typeof v!=='object')continue;out[key]={maxTime:[25,40,60,90,180].includes(Number(v.maxTime))?Number(v.maxTime):40,budget:Number(v.budget)>0?Math.min(1000,Number(v.budget)):null,type:['any','vegetarian','fish','chicken','pasta'].includes(v.type)?v.type:'any',desire:String(v.desire||'').slice(0,150)};}return out;}
export function matchesDayPlan(r,p,day,course='main'){const rule=p.dayPlans?.[day];if(!rule||course!=='main')return true;if(r.time>rule.maxTime)return false;if(rule.type==='vegetarian'&&!r.veg||rule.type==='fish'&&!['salmon','whiteFish','wholeFish','shrimp','wholeShrimp'].some(k=>r.items[k])||rule.type==='chicken'&&!r.items.chicken||rule.type==='pasta'&&!['pasta','gnocchi','noodle'].some(k=>r.items[k]))return false;if(rule.budget){if(Object.keys(r.items).some(k=>ingredients[k].priceKnown===false))return false;const full=Object.entries(r.items).reduce((n,[k,q])=>n+q*servingsForDay(p,day)*ingredients[k][2],0);if(full>rule.budget+.005)return false;}return !rule.desire||desireResults([r],rule.desire,{price:()=>0}).recipes.length>0;}
export function normalizeProfile(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 const number=(v,min,max,fallback)=>v!==''&&Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
 const diet=['varied','vegetarian','vegan','pescatarian'].includes(raw.diet)?raw.diet:raw.veg?'vegetarian':'varied';
 const weekend=!!raw.weekend;
 const activeDays=Array.isArray(raw.activeDays)?[...new Set(raw.activeDays.filter(n=>Number.isInteger(n)&&n>=0&&n<(weekend?7:5)))].sort():Array.from({length:weekend?7:5},(_,i)=>i);
 const people=Math.round(number(raw.people??2,1,12,2));
 const events={};for(const [index,value] of Object.entries(raw.events||{})){const day=Number(index);if(!Number.isInteger(day)||day<0||day>6||!value||!Object.hasOwn(eventLabels,value.theme))continue;events[day]={theme:value.theme,starter:!!value.starter,dessert:!!value.dessert,people:Math.round(number(value.people??people,1,12,people)),service:/^([01]\d|2[0-3]):[0-5]\d$/.test(value.service||'')?value.service:'19:00',maxTime:[25,40,60,90,180].includes(Number(value.maxTime))?Number(value.maxTime):60};}
 return {people,dayPlans:normalizeDayPlans(raw.dayPlans),lunchStyle:raw.lunchStyle==='transform'?'transform':'same',lunch:Math.round(number(raw.lunch??2,0,12,2)),diet,veg:['vegetarian','vegan'].includes(diet),goal:['discover','budget','waste','quick'].includes(raw.goal)?raw.goal:'discover',maxTime:[25,40,60].includes(Number(raw.maxTime))?Number(raw.maxTime):40,budget:number(raw.budget??120,1,3000,120),excluded:[...new Set((Array.isArray(raw.excluded)?raw.excluded:[]).filter(id=>Object.hasOwn(ingredients,id)))],allergens:[...new Set((Array.isArray(raw.allergens)?raw.allergens:[]).filter(id=>Object.hasOwn(allergenLabels,id)))],equipment:Array.isArray(raw.equipment)?[...new Set(raw.equipment.filter(id=>Object.hasOwn(equipmentLabels,id)))]:['hob','oven'],level:raw.level==='beginner'?'beginner':'comfortable',portionSize:['small','generous'].includes(raw.portionSize)?raw.portionSize:'standard',lunchMode:raw.lunchMode==='cold'?'cold':'warm',lunchDays:Array.isArray(raw.lunchDays)?[...new Set(raw.lunchDays.filter(n=>Number.isInteger(n)&&n>=0&&n<7))].sort():[0,1,2,3,4],allowLongCook:!!raw.allowLongCook,weekend,activeDays,events};
}

Object.assign(ingredients,photoIngredients);
const ingredientAllergens={pasta:['gluten'],tofu:['soy'],soy:['soy','gluten'],salmon:['fish'],...extraAllergens,...photoIngredientAllergens};
const practical={
 poulet:{prepTime:10,cookTime:15,level:1,equipment:['hob'],coldLunch:true,prepAhead:'Laver et détailler le brocoli. Préparer le citron et l’ail dans un contenant séparé du poulet cru.',lunchTip:'Réserver le riz, le brocoli et le poulet dans des compartiments séparés. Le citron peut être ajouté au moment de manger.',reheat:'Ajouter un trait d’eau au riz. Couvrir légèrement, réchauffer et remuer pour répartir la chaleur.',freezer:'Congeler en portions individuelles. Le brocoli sera plus tendre après décongélation.',textureTip:'Éponger le poulet avant de le saisir et éviter de surcharger la poêle.'},
 tofu:{prepTime:10,cookTime:10,level:1,equipment:['hob'],coldLunch:true,prepAhead:'Éponger le tofu, couper les poivrons et mélanger la sauce à part. Conserver au réfrigérateur.',lunchTip:'Garder la sauce et le riz séparés si vous préférez un tofu moins imbibé. Ce plat se mange aussi froid, en gardant le lunch au frais.',reheat:'Réchauffer doucement avec un peu d’eau pour détendre la sauce et le riz.',freezer:'Le tofu peut devenir plus spongieux après congélation. Préférer la version réfrigérée si vous aimez sa texture ferme.',textureTip:'Laisser le tofu dorer sans le remuer constamment avant d’ajouter la sauce.'},
 pates:{prepTime:10,cookTime:15,level:1,equipment:['hob'],coldLunch:true,prepAhead:'Râper les carottes et préparer l’ail. La sauce peut être cuisinée à l’avance et conservée séparément des pâtes.',lunchTip:'Garder un peu de sauce en plus pour le lunch : les pâtes absorbent le liquide. Pour les manger froides, assembler une portion et la garder au frais.',reheat:'Ajouter un trait d’eau, couvrir légèrement et remuer pendant le réchauffage.',freezer:'Congeler la sauce séparément pour conserver une meilleure texture des pâtes.',textureTip:'Garder un peu d’eau de cuisson pour lier la sauce avant de servir.'},
 plaque:{prepTime:10,cookTime:30,level:1,equipment:['oven'],coldLunch:false,prepAhead:'Laver les légumes et couper les carottes. Couper les pommes de terre au moment de la cuisson. Garder le poulet cru séparé.',lunchTip:'Réserver un peu du jus de cuisson avec le poulet pour éviter un lunch trop sec.',reheat:'Réchauffer couvert avec le jus de cuisson. Au four, couvrir le plat pour éviter de dessécher le poulet.',freezer:'Le poulet et les carottes se congèlent en portions. Les pommes de terre peuvent devenir plus friables.',textureTip:'Laisser de l’espace entre les morceaux sur la plaque pour qu’ils rôtissent au lieu de cuire à la vapeur.'},
 pois:{prepTime:10,cookTime:20,level:1,equipment:['hob'],coldLunch:false,prepAhead:'Rincer et égoutter les pois chiches cuits. Couper les carottes et préparer l’ail et le cumin.',lunchTip:'Emporter le riz à part. Ajouter un peu d’eau au mijoté s’il a épaissi pendant la nuit.',reheat:'Réchauffer en remuant, avec un peu d’eau pour retrouver la consistance désirée.',freezer:'Congeler le mijoté séparément du riz, en portions faciles à réchauffer.',textureTip:'Faire chauffer brièvement le cumin dans l’huile avant d’ajouter les tomates.'},
 saumon:{prepTime:10,cookTime:15,level:1,equipment:['hob'],coldLunch:false,prepAhead:'Laver les légumes, préparer l’ail et couper le citron. Garder le poisson au froid et le cuire le jour prévu.',lunchTip:'Réserver la portion de saumon délicatement et emporter le citron à part.',reheat:'Réchauffer couvert, avec un peu d’eau, pour limiter le dessèchement. Vérifier la température au cœur du poisson.',freezer:'Congeler en portions si le lunch ne sera pas mangé rapidement; la texture pourra être plus ferme.',textureTip:'Éponger le poisson avant cuisson pour favoriser une belle saisie.'},
 boeuf:{prepTime:10,cookTime:30,level:2,equipment:['hob','oven'],coldLunch:false,prepAhead:'Laver les légumes et préparer l’ail. Garder la viande au froid et la sortir uniquement pour sa préparation.',lunchTip:'Réserver les légumes et le jus de cuisson. Couper la viande seulement au moment de préparer le lunch pour mieux conserver son jus.',reheat:'Réchauffer doucement, couvert avec le jus, jusqu’à une température sûre au cœur.',freezer:'Congeler la viande et les légumes en portions. La texture des pommes de terre peut changer.',textureTip:'Laisser reposer la viande après cuisson avant de la couper.'}
};
recipes.push(...extraRecipes);
recipes.forEach(r=>{const photo=recipePhotos[r.id];if(photo?.verified){Object.assign(r,photo.recipePatch||{});r.image=photo.image;r.photoAlt=photo.alt;r.photoSource=photo.source;r.photoVerified=true;}else{r.image=null;r.photoVerified=false;}});
const baseThemes={poulet:['family'],tofu:['asian','family'],pates:['italian','family'],plaque:['family','romantic'],pois:['asian','family'],saumon:['romantic','family'],boeuf:['romantic','bbq','family']};
recipes.forEach(r=>{Object.assign(r,practical[r.id]);if(recipePhotos[r.id]?.verified)Object.assign(r,recipePhotos[r.id].recipePatch||{});if(recipePhotos[r.id]?.recipePatch?.items){r.prepAhead=recipePhotos[r.id].recipePatch.prepAhead||'Peser les ingrédients et laver les légumes de cette recette. Garder les produits crus et les ustensiles séparés des préparations prêtes à manger.';r.lunchTip=recipePhotos[r.id].recipePatch.lunchTip||'Réserver les portions avant de servir, les refroidir rapidement et les garder dans des contenants propres au réfrigérateur.';}r.course=r.course||'main';r.themes=r.themes||baseThemes[r.id]||['family'];r.veg=!Object.keys(r.items).some(id=>[...meatIngredients,'salmon','whiteFish','shrimp','wholeFish','wholeShrimp'].includes(id));r.vegan=!Object.keys(r.items).some(id=>[...animalIngredients,...photoAnimalIngredients].includes(id));r.allergens=[...new Set(Object.keys(r.items).flatMap(id=>ingredientAllergens[id]||[]))];});

export function dayCount(p){return p.weekend?7:5;}
export function activeDays(p){return (Array.isArray(p.activeDays)?p.activeDays:Array.from({length:dayCount(p)},(_,i)=>i)).filter(i=>i>=0&&i<dayCount(p));}
export function supperPeople(p,index){return p.events?.[index]?.people||Number(p.people)||0;}
export function lunchForDay(p,index){return activeDays(p).includes(index)&&(!Array.isArray(p.lunchDays)||p.lunchDays.includes(index))?Number(p.lunch)||0:0;}
export function servingsForDay(p,index){if(!activeDays(p).includes(index))return 0;const factor=p.portionSize==='generous'?1.25:p.portionSize==='small'?.75:1;return (supperPeople(p,index)+lunchForDay(p,index))*factor;}
export function courseServings(p,index){const factor=p.portionSize==='generous'?1.25:p.portionSize==='small'?.75:1;return supperPeople(p,index)*factor;}
export function weekEntries(ids,p,courses={}){const entries=[];ids.forEach((id,index)=>{if(!id||!activeDays(p).includes(index))return;entries.push({id,index,portions:servingsForDay(p,index),course:'main'});for(const course of ['starter','dessert'])if(p.events?.[index]?.[course]&&courses[index]?.[course])entries.push({id:courses[index][course],index,portions:courseServings(p,index),course});});return entries;}
export function consolidateWeek(ids,p,pantry={},courses={}){const totals={};weekEntries(ids,p,courses).forEach(entry=>{const r=recipes.find(r=>r.id===entry.id);if(!r)return;const variant=entry.course==='main'?lunchVariant(r,p):null;const lunch=variant?lunchForDay(p,entry.index)*(p.portionSize==='generous'?1.25:p.portionSize==='small'?.75:1):0;Object.entries(r.items).forEach(([key,q])=>totals[key]=(totals[key]||0)+q*(entry.portions-lunch));if(variant)Object.entries(variant.items).forEach(([key,q])=>totals[key]=(totals[key]||0)+q*lunch);});return Object.entries(totals).map(([id,total])=>({id,total,needed:Math.max(0,total-(Number(pantry[id])||0)),name:ingredients[id][0],unit:ingredients[id][1],price:ingredients[id][2],category:ingredients[id][3],priceKnown:ingredients[id].priceKnown!==false}));}
export function eligibleRecipes(p,day=null,course='main',selection={}){
 const diet=p.diet||(p.veg?'vegetarian':'varied');
 const hasLunch=course==='main'&&(day===null?Number(p.lunch)>0&&(!Array.isArray(p.lunchDays)||p.lunchDays.length>0):lunchForDay(p,day)>0);
 const occasion=day===null?null:p.events?.[day];
 return recipes.filter(r=>(r.photoVerified||r.accountRecipe)&&(!r.personal||selection.manual||r.autoInclude)&&(!r.unverifiedIngredients||!(p.allergens||[]).length)&&r.course===course&&matchesDayPlan(r,p,day,course)&&
  (diet!=='vegetarian'||r.veg)&&(diet!=='vegan'||r.vegan)&&
  (diet!=='pescatarian'||!Object.keys(r.items).some(id=>meatIngredients.includes(id)))&&
  (r.time<=(course==='main'&&p.dayPlans?.[day]?.maxTime||occasion?.maxTime||p.maxTime||40)||(r.longCook&&p.allowLongCook))&&
  (!r.longCook||p.allowLongCook)&&
  !(p.excluded||[]).some(id=>id in r.items)&&
  !(p.allergens||[]).some(a=>r.allergens.includes(a))&&
  (!Array.isArray(p.equipment)||r.equipment.every(e=>p.equipment.includes(e)))&&
  (p.level!=='beginner'||r.level===1)&&
  (!hasLunch||p.lunchMode!=='cold'||r.coldLunch||!!lunchVariant(r,p))&&
  (!occasion||r.themes.includes(occasion.theme))
 );
}
export function planCost(ids,p,pantry={},courses={}){return consolidateWeek(ids,p,pantry,courses).reduce((n,r)=>n+r.needed*r.price,0);}
export function generatePlan(p,pantry={},rotation=0,options={}){
 const length=dayCount(p),days=activeDays(p),ids=Array(length).fill(null),courses={};
 if(!days.length)return {ids:[],error:'Cochez au moins une journée à planifier.'};
 const records=days.map(index=>({index,course:'main',pool:eligibleRecipes(p,index,'main',{manual:!!options.locked?.[index]}),locked:options.locked?.[index]||null}));
 for(const index of days)for(const course of ['starter','dessert'])if(p.events?.[index]?.[course])records.push({index,course,pool:eligibleRecipes(p,index,course,{manual:!!options.fixedCourses?.[index]?.[course]}),locked:options.fixedCourses?.[index]?.[course]||null});
 const empty=records.find(r=>!r.pool.length);
 // Empty pools and uniqueness shortages are diagnosed together, preserving the valid part.
 const set=(record,id)=>{if(record.course==='main')ids[record.index]=id;else{courses[record.index]??={};courses[record.index][record.course]=id;}};
 const owners=new Map();
 for(const record of records.filter(r=>r.locked)){
  if(!record.pool.some(r=>r.id===record.locked))return {ids:[],error:'Un plat conservé ne correspond plus à vos préférences. Libérez-le ou ajustez vos choix.'};
  if(owners.has(record.locked))return {ids:[],error:'Deux plats conservés sont identiques. Libérez-en un pour composer un menu sans répétition.'};
  owners.set(record.locked,record);set(record,record.locked);
 }
 for(const record of records){
  record.ranked=record.pool.map((r,index)=>{const q=record.course==='main'?servingsForDay(p,record.index):courseServings(p,record.index);const unit=id=>options.offerPrices?.[id]??ingredients[id][2];const full=Object.entries(r.items).reduce((n,[id,v])=>n+v*q*unit(id),0);const remaining=Object.entries(r.items).reduce((n,[id,v])=>n+Math.max(0,v*q-(Number(pantry[id])||0))*unit(id),0);const offerCoverage=Object.entries(r.items).reduce((n,[id,v])=>n+(Object.hasOwn(options.offerPrices||{},id)?Math.max(0,v*q-(Number(pantry[id])||0))*unit(id):0),0);const priority=(options.priority||[]).reduce((n,id)=>n+Math.min(Number(pantry[id])||0,(r.items[id]||0)*q)*(ingredients[id]?.[2]||0),0);return {r,score:(p.goal==='budget'?remaining*3:p.goal==='waste'?-(full-remaining)*4:0)-priority*8-offerCoverage*2-(r.ratingCount>0?(((r.ratingAverage*r.ratingCount+3.5*5)/(r.ratingCount+5))-3.5)*2:0)+((options.recent||[]).includes(r.id)?4:0)+(p.goal==='budget'&&Object.keys(r.items).some(id=>ingredients[id].priceKnown===false)?20:0)+((index*13-rotation*7+record.pool.length*10000)%record.pool.length)};}).sort((a,b)=>a.score-b.score).map(x=>x.r);
 }
 function place(record,seen){
  for(const recipe of record.ranked)if(!seen.has(recipe.id)&&!owners.has(recipe.id)){seen.add(recipe.id);owners.set(recipe.id,record);set(record,recipe.id);return true;}
  for(const recipe of record.ranked){if(seen.has(recipe.id))continue;seen.add(recipe.id);const previous=owners.get(recipe.id);if(previous&&!previous.locked&&place(previous,seen)){owners.set(recipe.id,record);set(record,recipe.id);return true;}}
  return false;
 }
 for(const record of records.filter(r=>!r.locked).sort((a,b)=>a.pool.length-b.pool.length))place(record,new Set());
 const assigned=new Set(owners.values());
 const missing=records.filter(r=>!assigned.has(r));
 if(missing.length){
  ids.fill(null);for(const key of Object.keys(courses))delete courses[key];
  for(const [id,record] of owners)set(record,id);
  const labels={main:'plat',starter:'entrée',dessert:'dessert'},names=['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
  const shortages=missing.map(r=>({index:r.index,course:r.course,compatible:r.pool.length,reason:r.pool.length?'Les recettes compatibles sont déjà utilisées ailleurs.':'Aucune recette ne satisfait tous les choix de cette journée.'}));
  return {ids:[],error:`Il manque ${missing.length} recette${missing.length>1?'s':''} différente${missing.length>1?'s':''} : ${missing.map(r=>labels[r.course]+' du '+names[r.index]).join(', ')}. Votre régime, vos exclusions et vos équipements restent respectés. Aucun plat ne sera répété.`,shortages,partial:{ids,courses},matched:records.length-missing.length,requested:records.length};
 }
 const get=record=>record.course==='main'?ids[record.index]:courses[record.index]?.[record.course];
 const total=()=>planCost(ids,p,pantry,courses);
 for(let pass=0;pass<30&&total()>(Number(p.budget)||Infinity);pass++){
  const before=total();let best=null;
  const used=new Set(records.map(get));
  for(const record of records){if(record.locked)continue;const old=get(record);for(const r of record.pool){if(used.has(r.id))continue;set(record,r.id);const value=total();if(value<before-.001&&(!best||value<best.value))best={record,id:r.id,value};}set(record,old);}
  if(best){set(best.record,best.id);continue;}
  let swapped=false;
  for(let a=0;a<records.length&&!swapped;a++)for(let b=a+1;b<records.length&&!swapped;b++){const x=records[a],y=records[b];if(x.locked||y.locked||x.course!==y.course)continue;const xid=get(x),yid=get(y);if(!x.pool.some(r=>r.id===yid)||!y.pool.some(r=>r.id===xid))continue;set(x,yid);set(y,xid);if(total()<before-.001)swapped=true;else{set(x,xid);set(y,yid);}}
  if(!swapped)break;
 }
 const cost=total();return {ids,courses,cost,incompleteCost:consolidateWeek(ids,p,pantry,courses).some(r=>!r.priceKnown),overBudget:cost>(Number(p.budget)||Infinity)+.005,variety:days.length};
}

const physicalUnits={garlic:[3,'gousse','gousses'],onion:[150,'oignon moyen','oignons moyens'],carrot:[70,'carotte moyenne','carottes moyennes'],potato:[170,'pomme de terre moyenne','pommes de terre moyennes'],pepper:[150,'poivron','poivrons'],zucchini:[200,'courgette','courgettes'],freshTomato:[120,'tomate moyenne','tomates moyennes'],cucumber:[300,'concombre','concombres'],lemon:[120,'citron','citrons'],lime:[70,'lime','limes'],apple:[150,'pomme','pommes'],banana:[120,'banane épluchée','bananes épluchées'],orange:[130,'orange épluchée','oranges épluchées'],egg:[50,'œuf','œufs'],chicken:[150,'filet de 150 g','filets de 150 g'],salmon:[160,'pavé de 160 g','pavés de 160 g'],whiteFish:[180,'filet de 180 g','filets de 180 g'],pork:[180,'côtelette de 180 g','côtelettes de 180 g'],tortilla:[40,'tortilla de 40 g','tortillas de 40 g'],bun:[80,'pain à burger','pains à burger'],bread:[35,'tranche de pain','tranches de pain']};
const liquidDensity={oil:.91,soy:1.1,maple:1.33,milk:1.03,cream:1,coconutMilk:1.01,stock:1};
function friendlyNumber(n){if(n<.125)return 'moins de ¼';if(n>=8)return String(Math.round(n));const quarters=Math.round(n*4)/4;const whole=Math.floor(quarters),fraction=quarters-whole;return (whole||'')+({0:whole?'':'¼',.25:'¼',.5:'½',.75:'¾'})[fraction];}
export function physicalQuantity(id,quantity){
 if(!(quantity>0))return '';
 const unit=physicalUnits[id];if(unit){const count=quantity/unit[0];return 'env. '+(id==='garlic'&&count>1?String(Math.round(count)):friendlyNumber(count))+' '+(count>1.1?unit[2]:unit[1]);}
 if(ingredients[id]?.[1]==='ml'){if(quantity>=60)return 'env. '+new Intl.NumberFormat('fr-CA',{maximumFractionDigits:0}).format(quantity)+' ml';const spoon=quantity>=12?15:5;return 'env. '+friendlyNumber(quantity/spoon)+' c. à '+(spoon===15?'soupe':'thé');}
 if(id==='flour')return 'env. '+friendlyNumber(quantity/120)+' tasse'+(quantity/120>1.1?'s':'')+' de 240 ml';
 if(['cumin','paprika','currySpice','cinnamon','bakingPowder'].includes(id))return 'env. '+friendlyNumber(quantity/2.5)+' c. à thé';
 const packs={tofu:400,mozzarella:250,cheddar:400,yogurt:750,tomato:398,chickpea:240,blackBean:240,lentils:240,rice:500,pasta:500,quinoa:500,arborio:500,oat:500,redLentil:500,noodle:400,gnocchi:500,pizzaDough:300,chocolate:100};
 if(packs[id])return 'env. '+new Intl.NumberFormat('fr-CA',{maximumFractionDigits:2}).format(quantity/packs[id])+' '+(['chickpea','blackBean','lentils','tomato'].includes(id)?'boîte'+(quantity/packs[id]>1.1?'s':'')+(id==='tomato'?'':' égouttée'+(quantity/packs[id]>1.1?'s':'')):'paquet'+(quantity/packs[id]>1.1?'s':''))+' de '+packs[id]+' g';
 return '';
}
export function quantityLabel(id,quantity){return kitchenLabel(id,quantity,ingredients[id]);}

const lunchTransformations={
 poulet:{name:'Wrap de poulet aux champignons & crudités',omit:['rice','broccoli'],add:{tortilla:80,lettuce:40,freshTomato:70},steps:'Réserver le poulet et les champignons cuits avant de servir, puis les refroidir rapidement. Le lendemain, garnir les tortillas avec la portion réservée, la laitue et la tomate fraîche. Garder le wrap au froid.'},
 tofu:{name:'Wrap de tofu laqué & laitue croquante',omit:[],add:{tortilla:80,lettuce:50},steps:'Réserver le tofu et ses légumes cuits, puis les refroidir rapidement. Le lendemain, garnir les tortillas avec la laitue et le tofu froid. Conserver la sauce à part jusqu’au repas.'},
 saumon:{name:'Salade de saumon & légumes citronnés',omit:[],add:{lettuce:70,cucumber:60},steps:'Réserver le saumon et les légumes cuits, puis les refroidir rapidement. Le lendemain, déposer sur la laitue et le concombre frais, avec le jus de citron prévu. Garder au froid jusqu’au repas.'},
 'quinoa-citron':{name:'Wrap de quinoa, légumes & amandes',omit:[],add:{tortilla:80,lettuce:30},steps:'Réserver la salade de quinoa cuite et refroidie. Le lendemain, garnir les tortillas avec la salade et la laitue fraîche. Garder au froid jusqu’au repas.'}
};
export function lunchVariant(r,p){
 const variant=lunchTransformations[r?.id];if(p.lunchStyle!=='transform'||!variant)return null;
 const items={...r.items,...variant.add};for(const id of variant.omit)delete items[id];
 if((p.excluded||[]).some(id=>id in items)||(p.allergens||[]).some(a=>Object.keys(items).some(id=>(ingredientAllergens[id]||[]).includes(a))))return null;
 return {...variant,items};
}

// Cold dishes and desserts must never inherit generic reheating instructions.
const coldServiceIds=['quinoa-citron','salade-poischiches','caprese','houmous','concombre-yaourt','mousse-chocolat','yaourt-fraises'];
for(const r of recipes){if(coldServiceIds.includes(r.id)){r.reheat='Servir froid, en gardant la préparation au réfrigérateur jusqu’au repas. Le pain et le croquant se gardent à part.';r.freezer='La congélation du plat assemblé n’est pas conseillée pour conserver sa texture. Préférer une préparation fraîche et suivre les repères de conservation.';r.textureTip='Ajouter les garnitures fraîches et croquantes juste avant de servir.';}}
Object.assign(recipes.find(r=>r.id==='tofu'),{reheat:'Réchauffer doucement le tofu et ses légumes avec un peu d’eau pour détendre la sauce.'});
Object.assign(recipes.find(r=>r.id==='plaque'),{freezer:'Congeler le poulet et les légumes en portions. Les pommes de terre et courgettes peuvent devenir plus tendres après décongélation.'});
Object.assign(recipes.find(r=>r.id==='tacos-boeuf'),{sub:'Du bœuf saisi, de la lime et des tortillas à garnir à table.',reheat:'Réchauffer le bœuf séparément. Réchauffer les tortillas dans une poêle propre; ajouter oignon, coriandre et lime au service.'});
Object.assign(recipes.find(r=>r.id==='fraises-chantilly'),{reheat:'Servir une fois assemblé, sans réchauffer la crème. Conserver la crème et les fraises au froid, et la pâte cuite au sec avant assemblage.',textureTip:'Attendre que la pâte soit complètement froide avant d’ajouter la crème.'});
Object.assign(recipes.find(r=>r.id==='mug-chocolat'),{reheat:'Préparer de préférence au dernier moment. Laisser tiédir la tasse avant de manger; vérifier la température pour éviter les brûlures.',textureTip:'Arrêter la cuisson dès que le centre est pris pour éviter un gâteau sec.'});

for(const recipe of recipes)if(preparationAdvice[recipe.id])recipe.prepAhead=preparationAdvice[recipe.id];

export function installAccountCatalogue(payload={},userId=null){
 for(let i=recipes.length-1;i>=0;i--)if(recipes[i].accountRecipe)recipes.splice(i,1);
 for(const id of Object.keys(ingredients))if(id.startsWith('custom-'))delete ingredients[id];
 const rows=Array.isArray(payload.recipes)?payload.recipes:[],ownSources=new Set(rows.filter(r=>r.kind==='private'&&r.ownerId===userId).map(r=>r.id));
 for(const row of rows){
  if(!row||!/^own-[a-f0-9-]+$|^pub-[a-f0-9-]+$/.test(row.id)||!row.data||!Array.isArray(row.data.ingredients)||!Array.isArray(row.data.steps))continue;
  const personal=row.kind==='private';if(personal&&row.ownerId!==userId||!personal&&(row.kind!=='publication'||row.status!=='published'||ownSources.has(row.sourceId)))continue;
  const d=row.data;if(typeof d.name!=='string'||/[<>]/.test(d.name)||!Number.isFinite(d.servings)||d.servings<1)continue;
  const items={};let unknown=false;
  for(const item of d.ingredients){if(!item||typeof item.id!=='string'||!(item.amount>0)||!['g','ml','unit'].includes(item.unit))continue;if(!ingredients[item.id]){if(!/^custom-[a-f0-9]+$/.test(item.id)||typeof item.name!=='string'||/[<>]/.test(item.name))continue;const definition=[item.name,item.unit,0,'Garde-manger'];definition.priceKnown=false;ingredients[item.id]=definition;unknown=true;}if(item.known===false)unknown=true;items[item.id]=(items[item.id]||0)+item.amount/d.servings;}
  if(!Object.keys(items).length)continue;
  const idList=Object.keys(items),allergens=[...new Set(idList.flatMap(id=>ingredientAllergens[id]||[]))],animal=[...animalIngredients,...photoAnimalIngredients];
  recipes.push({id:row.id,name:d.name,sub:String(d.description||''),items,steps:d.steps.map(String),course:d.course,time:d.time,prepTime:d.prepTime,cookTime:d.cookTime,equipment:d.equipment||[],level:1,themes:['family'],photoVerified:false,userPhoto:/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(d.photo||'')?d.photo:'',accountRecipe:true,personal,autoInclude:!!d.autoInclude,creator:String(row.creator||'Membre'),sourceId:row.sourceId,unverifiedIngredients:unknown,veg:!unknown&&!idList.some(id=>[...meatIngredients,'salmon','whiteFish','shrimp','wholeFish','wholeShrimp'].includes(id)),vegan:!unknown&&!idList.some(id=>animal.includes(id)),allergens,coldLunch:false,tag:personal?'Ma recette':'La communauté',prepAhead:'Préparer les ingrédients listés dans cette recette. Suivre les gestes de mise en place indiqués dans les étapes du créateur.',lunchTip:'Réserver les portions avant de servir et les réfrigérer rapidement.',reheat:'Suivre les consignes de la recette et les repères de salubrité.',freezer:'La conservation et la congélation de cette recette personnelle restent à vérifier.',textureTip:'Suivre les étapes et les indications du créateur.'});
 }
 for(const r of recipes){const stats=payload.ratings?.[r.id]||{};r.ratingCount=Number.isInteger(stats.count)&&stats.count>0?stats.count:0;r.ratingAverage=r.ratingCount&&Number.isFinite(stats.average)?Math.max(1,Math.min(5,stats.average)):0;r.myRating=Number(stats.mine)||0;}
}

for(const recipe of recipes){if(culinaryMethods[recipe.id])Object.assign(recipe,culinaryMethods[recipe.id]);}
for(const [id,prepTime,cookTime] of [['poulet',10,20],['tofu',10,15],['houmous',10,5],['concombre-yaourt',10,5],['risotto-multicuiseur',12,38],['quinoa-citron',5,20]]){const r=recipes.find(r=>r.id===id);Object.assign(r,{prepTime,cookTime,time:prepTime+cookTime+(r.passiveTime||0)});}
