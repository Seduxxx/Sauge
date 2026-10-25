// Pure calculations. No retailer prices are fabricated or scraped.
export const storeDirectory={
 maxi:{name:'Maxi',url:'https://www.maxi.ca/fr/print-flyer'},
 iga:{name:'IGA',url:'https://www.iga.ca/fr/circulaire'},
 metro:{name:'Metro',url:'https://www.metro.ca/circulaire-rabais/circulaire'},
 superc:{name:'Super C',url:'https://www.superc.ca/circulaire'},
 walmart:{name:'Walmart',url:'https://www.walmart.ca/fr/flyer'},
 costco:{name:'Costco',url:'https://www.costco.ca/o/-/coupons'},
 other:{name:'Autre épicerie',url:null}
};
export function localDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;const date=new Date(value+'T12:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;}
export function normalizeStore(raw={}){raw=raw&&typeof raw==='object'?raw:{};const postal=String(raw.postal||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);return {id:Object.hasOwn(storeDirectory,raw.id)?raw.id:'',postal,branch:String(raw.branch||'').slice(0,100)};}
export function validPostal(postal){return /^[GHJ][0-9][ABCEGHJ-NPRSTV-Z][0-9][ABCEGHJ-NPRSTV-Z][0-9]$/.test(postal);}
export function normalizeOffer(raw,ingredientIds){
 if(!raw||!ingredientIds.includes(raw.ingredient)||!Object.hasOwn(storeDirectory,raw.store)||!validDate(raw.start)||!validDate(raw.end)||raw.end<raw.start)return null;
 const size=Number(raw.size),price=Number(raw.price),regular=raw.regular===''||raw.regular==null?null:Number(raw.regular);
 if(!(size>0&&size<=100000&&Number.isFinite(size)&&price>0&&price<=10000&&Number.isFinite(price))||regular!==null&&!(Number.isFinite(regular)&&regular>=price&&regular<=10000))return null;
 let source='';try{const u=new URL(raw.source);if(u.protocol!=='https:')return null;source=u.href;}catch{return null;}
 return {id:String(raw.id||'').replace(/[^a-zA-Z0-9-]/g,'').slice(0,50),ingredient:raw.ingredient,store:raw.store,size,price,regular,start:raw.start,end:raw.end,source,label:String(raw.label||'').slice(0,100),region:String(raw.region||'').slice(0,100),branch:String(raw.branch||'').slice(0,100),confirmed:!!raw.confirmed,origin:'manual',verified:false};
}
export function offerStatus(offer,store,today=localDate()){
 if(!validDate(today)||offer.end<today)return 'expired';
 if(offer.start>today)return 'future';
 if(offer.store!==store.id)return 'other-store';
 // A client must explicitly confirm their branch/region; a URL alone is not verification.
 if(!offer.confirmed||!validPostal(store.postal)||offer.region!==store.postal||offer.branch!==store.branch)return 'unconfirmed';
 return 'active';
}
export function purchaseEstimate(rows,offers,store,today=localDate()){
 const entries=rows.filter(r=>r.needed>0).map(row=>{
  const choices=offers.filter(o=>o.ingredient===row.id&&offerStatus(o,store,today)==='active').map(o=>({offer:o,packs:Math.ceil((row.needed-1e-8)/o.size)})).map(o=>({...o,total:o.packs*o.offer.price})).sort((a,b)=>a.total-b.total);
  const chosen=choices[0];if(!chosen)return {...row,covered:false,estimated:row.needed*row.price,savings:0};
  return {...row,covered:true,...chosen,surplus:chosen.packs*chosen.offer.size-row.needed,savings:chosen.offer.regular===null?0:chosen.packs*(chosen.offer.regular-chosen.offer.price)};
 });
 const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
 return {entries,covered:entries.filter(r=>r.covered).length,total:cents(entries.reduce((n,r)=>n+(r.covered?r.total:r.estimated),0)),savings:cents(entries.reduce((n,r)=>n+r.savings,0)),complete:entries.every(r=>r.covered),origin:'manual'};
}
export function parseClock(value){if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(value||''))return null;const [h,m]=value.split(':').map(Number);return h*60+m;}
export function clockLabel(minutes){const day=minutes<0?'la veille · ':minutes>=1440?'le lendemain · ':'';const n=((minutes%1440)+1440)%1440;return day+String(Math.floor(n/60)).padStart(2,'0')+' h '+String(n%60).padStart(2,'0');}
// Conservative single-cook schedule: no simultaneous use of a shared appliance.
export function occasionTimeline(entries,recipeList,service='19:00'){
 const start=parseClock(service);if(start===null)return [];
 const order={dessert:0,starter:1,main:2};let cursor=start;
 const sorted=entries.map(e=>({...e,recipe:recipeList.find(r=>r.id===e.id)})).filter(e=>e.recipe).sort((a,b)=>order[b.course]-order[a.course]);
 return sorted.map(e=>{const end=cursor;cursor-=e.recipe.time;const result={...e,start:cursor,end,label:clockLabel(cursor),equipment:e.recipe.equipment};cursor-=10;return result;}).reverse();
}
export function pantryBalance(rows,pantry){return Object.entries(pantry).filter(([,q])=>q>0).map(([id,q])=>({id,available:q,used:Math.min(q,rows.find(r=>r.id===id)?.total||0),left:Math.max(0,q-(rows.find(r=>r.id===id)?.total||0))}));}
