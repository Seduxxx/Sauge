// Validation et assainissement des recettes, version navigateur.
// (Portage de l'ancien recipe-model.mjs : plus de Buffer ni de node:crypto.)
// La base de données refait des contrôles de sécurité de son côté (voir supabase/schema.sql).
import {ingredients,equipmentLabels} from './domain.js';
import {toCanonical} from './measures.js';

class ModelError extends Error{constructor(message){super(message);this.status=400;}}

export const plain=(value,max=100)=>{
  if(typeof value!=='string'||!value.trim()||value.length>max||/[<>\u0000-\u0008]/.test(value))throw new ModelError('Texte invalide ou trop long.');
  return value.trim();
};

const key=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');

// Empreinte hexadécimale stable (FNV-1a 64 bits) pour les ingrédients personnalisés.
function shortHash(text){
  let h1=0x811c9dc5,h2=0x84222325;
  for(let i=0;i<text.length;i++){
    const c=text.charCodeAt(i);
    h1^=c;h1=Math.imul(h1,0x01000193)>>>0;
    h2^=c+i;h2=Math.imul(h2,0x01000193)>>>0;
  }
  return (h1.toString(16).padStart(8,'0')+h2.toString(16).padStart(8,'0')).slice(0,16)+'ab';
}

export function normalizeRecipe(raw){
  if(!raw||typeof raw!=='object')throw new ModelError('Recette invalide.');
  const name=plain(raw.name),description=raw.description?plain(raw.description,600):'',servings=Number(raw.servings),prepTime=Number(raw.prepTime),cookTime=Number(raw.cookTime);
  if(!Number.isInteger(servings)||servings<1||servings>24||![prepTime,cookTime].every(n=>Number.isInteger(n)&&n>=0&&n<=1440)||prepTime+cookTime<1)throw new ModelError('Vérifiez les portions et les temps.');
  if(!['main','starter','dessert'].includes(raw.course))throw new ModelError('Choisissez une catégorie.');
  if(!Array.isArray(raw.ingredients)||raw.ingredients.length<1||raw.ingredients.length>60)throw new ModelError('Ajoutez de 1 à 60 ingrédients.');
  const items=raw.ingredients.map(row=>{
    const label=plain(row.name,80),known=Object.hasOwn(ingredients,row.id)?row.id:Object.keys(ingredients).find(id=>key(ingredients[id][0])===key(label)),unit=String(row.unit||'g');
    if(!['g','ml','unit','tsp','tbsp','cup'].includes(unit))throw new ModelError('Unité non reconnue.');
    const amount=Number(row.amount);if(!(amount>0&&amount<=100000&&Number.isFinite(amount)))throw new ModelError('Quantité invalide.');
    if(known){let total;try{total=toCanonical(known,amount,unit,ingredients[known]);}catch(e){throw new ModelError(e.message);}if(total>100000)throw new ModelError('Quantité trop élevée.');return {id:known,name:ingredients[known][0],amount:total,unit:ingredients[known][1],known:true,enteredAmount:amount,enteredUnit:unit};}
    if(!['g','ml','unit'].includes(unit))throw new ModelError('Pour « '+label+' », indiquez des g, ml ou unités : sa conversion en tasse n’est pas connue.');
    return {id:'custom-'+shortHash(key(label)+'|'+unit),name:label,amount,unit,known:false,enteredAmount:amount,enteredUnit:unit};
  });
  const steps=(Array.isArray(raw.steps)?raw.steps:[]).map(s=>plain(s,1200));if(steps.length<1||steps.length>30)throw new ModelError('Ajoutez de 1 à 30 étapes.');
  const equipment=[...new Set((Array.isArray(raw.equipment)?raw.equipment:[]).filter(id=>Object.hasOwn(equipmentLabels,id)))];
  return {name,description,servings,prepTime,cookTime,time:prepTime+cookTime,course:raw.course,ingredients:items,steps,equipment,autoInclude:raw.autoInclude===true,photo:validatePhoto(raw.photo||''),rightsConfirmed:raw.rightsConfirmed===true};
}

function fromBase64(text){const bin=atob(text),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;}
function toBase64(bytes){let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(bin);}
function join(pieces){const out=new Uint8Array(pieces.reduce((n,p)=>n+p.length,0));let o=0;for(const p of pieces){out.set(p,o);o+=p.length;}return out;}
const u16=(b,o)=>(b[o]<<8)|b[o+1];
const u32=(b,o)=>((b[o]*16777216)+((b[o+1]<<16)|(b[o+2]<<8)|b[o+3]))>>>0;

function validatePhoto(data){
  if(!data)return '';if(typeof data!=='string'||data.length>1000000)throw new ModelError('Photo trop volumineuse (700 Ko maximum).');
  const match=data.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/);if(!match)throw new ModelError('Utilisez une photo JPEG ou PNG.');
  let bytes;try{bytes=fromBase64(match[2]);}catch{throw new ModelError('Photo invalide.');}
  if(bytes.length>700000||bytes.length<12)throw new ModelError('Photo invalide ou trop volumineuse.');
  if(match[1]==='jpeg'){
    if(bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)throw new ModelError('Fichier JPEG invalide.');
    // Retire les métadonnées (EXIF/GPS, commentaires) avant stockage ou publication.
    const pieces=[bytes.subarray(0,2)];let offset=2;
    while(offset<bytes.length){
      if(bytes[offset]!==255)throw new ModelError('Fichier JPEG invalide.');
      const marker=bytes[offset+1];
      if(marker===218||marker===217){pieces.push(bytes.subarray(offset));break;}
      if(offset+4>bytes.length)throw new ModelError('Photo invalide.');
      const len=u16(bytes,offset+2);
      if(len<2||offset+2+len>bytes.length)throw new ModelError('Photo invalide.');
      if(!(marker>=224&&marker<=239)&&marker!==254)pieces.push(bytes.subarray(offset,offset+2+len));
      offset+=2+len;
    }
    return 'data:image/jpeg;base64,'+toBase64(join(pieces));
  }
  const sig=[137,80,78,71,13,10,26,10];
  if(!sig.every((v,i)=>bytes[i]===v))throw new ModelError('Fichier PNG invalide.');
  const pieces=[bytes.subarray(0,8)];let offset=8,ended=false;
  while(offset+12<=bytes.length){
    const len=u32(bytes,offset),type=String.fromCharCode(...bytes.subarray(offset+4,offset+8));
    if(offset+12+len>bytes.length)throw new ModelError('Photo invalide.');
    if(['IHDR','PLTE','IDAT','IEND','tRNS','sRGB','gAMA','cHRM'].includes(type))pieces.push(bytes.subarray(offset,offset+12+len));
    if(type==='IHDR'&&(len!==13||u32(bytes,offset+8)>6000||u32(bytes,offset+12)>6000))throw new ModelError('Dimensions trop grandes.');
    offset+=12+len;
    if(type==='IEND'){ended=true;break;}
  }
  if(!ended)throw new ModelError('Photo PNG incomplète.');
  return 'data:image/png;base64,'+toBase64(join(pieces));
}
