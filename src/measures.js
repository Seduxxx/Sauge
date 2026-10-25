// Metric kitchen convention: 1 cup = 250 ml, tbsp = 15 ml, tsp = 5 ml.
// Weight-to-volume factors are ingredient-specific approximations, never a universal density.
export const kitchenMeasures={
 garlic:{piece:3,singular:'gousse',plural:'gousses'},carrot:{piece:100,singular:'grosse carotte',plural:'grosses carottes'},onion:{piece:150,singular:'oignon moyen',plural:'oignons moyens'},potato:{piece:170,singular:'pomme de terre moyenne',plural:'pommes de terre moyennes'},pepper:{piece:150,singular:'poivron',plural:'poivrons'},zucchini:{piece:200,singular:'courgette',plural:'courgettes'},cucumber:{piece:300,singular:'concombre',plural:'concombres'},freshTomato:{piece:120,singular:'tomate moyenne',plural:'tomates moyennes'},apple:{piece:150,singular:'pomme',plural:'pommes'},banana:{piece:120,singular:'banane épluchée',plural:'bananes épluchées'},lemon:{piece:120,singular:'citron',plural:'citrons'},lime:{piece:70,singular:'lime',plural:'limes'},egg:{piece:50,singular:'œuf',plural:'œufs'},bread:{piece:35,singular:'tranche',plural:'tranches'},tortilla:{piece:40,singular:'tortilla',plural:'tortillas'},bun:{piece:80,singular:'pain à burger',plural:'pains à burger'},
 strawberry:{cup:150},raspberry:{cup:130},blueberry:{cup:150},rice:{cup:200},arborio:{cup:200},quinoa:{cup:180},redLentil:{cup:200},lentils:{cup:200},chickpea:{cup:170},blackBean:{cup:170},flour:{cup:130},sugar:{cup:210},oat:{cup:90},yogurt:{cup:260},tomato:{cup:250},butter:{tbsp:14},cocoa:{tsp:2},cumin:{tsp:2.1},paprika:{tsp:2.3},currySpice:{tsp:2.5},cinnamon:{tsp:2.6},bakingPowder:{tsp:4},sesame:{tbsp:9},tahini:{tbsp:16}
};
export function kitchenNumber(value){const whole=Math.floor(value),fraction=value-whole;const candidates=[[0,''],[.125,'⅛'],[.25,'¼'],[1/3,'⅓'],[.375,'⅜'],[.5,'½'],[.625,'⅝'],[2/3,'⅔'],[.75,'¾'],[5/6,'⅚'],[.875,'⅞'],[1,'']];let [part,label]=candidates.reduce((a,b)=>Math.abs(b[0]-fraction)<Math.abs(a[0]-fraction)?b:a);const rounded=whole+part;if(rounded>0&&Math.abs(rounded-value)<=Math.max(.065,value*.07)){return {text:part===1?String(whole+1):(whole?String(whole)+(label?' ':''):'')+label,approx:Math.abs(rounded-value)>.001};}return {text:new Intl.NumberFormat('fr-CA',{maximumFractionDigits:2}).format(value),approx:false};}
export function kitchenLabel(id,amount,definition){
 if(!(amount>0))return '0';const def=definition||{},unit=def[1]||def.unit||'g',reference=new Intl.NumberFormat('fr-CA',{maximumFractionDigits:1}).format(amount)+' '+unit,m=kitchenMeasures[id];
 let n,label,approx=false;
 if(unit==='ml'){if(amount>=60){n=amount/250;label='tasse';}else if(amount>=12){n=amount/15;label='c. à soupe';}else{n=amount/5;label='c. à thé';}}
 else if(m?.piece){n=amount/m.piece;label=n>1?m.plural:m.singular;approx=true;}
 else if(m?.cup){const ml=amount/m.cup*250;if(ml<12){n=ml/5;label='c. à thé';}else if(ml<60){n=ml/15;label='c. à soupe';}else{n=ml/250;label='tasse';}approx=true;}
 else if(m?.tbsp){n=amount/m.tbsp;label='c. à soupe';approx=true;}
 else if(m?.tsp){n=amount/m.tsp;label='c. à thé';approx=true;}
 else if(unit==='unit'){n=amount;label=def.countLabel||'unité';}
 else return reference;
 const number=kitchenNumber(n);if(label==='tasse'&&n>1.01)label='tasses';if(m?.label&&label.startsWith('tasse'))label=m.label.replace(/^tasse/,n>1.01?'tasses':'tasse');if(label==='unité'&&n>1.01)label='unités';return (approx||number.approx?'env. ':'')+number.text+' '+label+(unit==='unit'?'':' ('+reference+')');
}
export function toCanonical(id,amount,unit,definition){
 const q=Number(amount);if(!(q>0&&q<=100000))throw Error('Quantité invalide.');const target=definition?.[1]||definition?.unit||'g',m=kitchenMeasures[id];
 if(unit===target)return q;
 if(['tsp','tbsp','cup'].includes(unit)){
  const ml=q*({tsp:5,tbsp:15,cup:250}[unit]);if(target==='ml')return ml;
  const gramsPerMl=m?.cup?m.cup/250:m?.tbsp?m.tbsp/15:m?.tsp?m.tsp/5:null;
  if(gramsPerMl)return ml*gramsPerMl;
 }
 if(unit==='unit'&&m?.piece)return q*m.piece;
 throw Error('Conversion inconnue pour cet ingrédient. Utilisez son poids, son volume ou un ingrédient reconnu.');
}
// Repères par aliment; tailles/emballages explicitement indiqués, jamais une densité universelle.
Object.assign(kitchenMeasures,{
 mushroom:{cup:82,label:'tasse de champignons émincés'},parmesan:{cup:106,label:'tasse de parmesan râpé'},cheddar:{cup:119,label:'tasse de cheddar râpé'},mozzarella:{cup:119,label:'tasse de mozzarella râpée'},chocolate:{cup:180,label:'tasse de chocolat haché'},almond:{cup:91,label:'tasse d’amandes effilées'},
 chicken:{piece:150,singular:'filet de poulet de 150 g',plural:'filets de poulet de 150 g'},salmon:{piece:150,singular:'filet de saumon de 150 g',plural:'filets de saumon de 150 g'},whiteFish:{piece:150,singular:'filet de poisson de 150 g',plural:'filets de poisson de 150 g'},beef:{piece:150,singular:'pavé de bœuf de 150 g',plural:'pavés de bœuf de 150 g'},pork:{piece:150,singular:'côtelette de 150 g',plural:'côtelettes de 150 g'},shrimp:{piece:20,singular:'crevette de 20 g',plural:'crevettes de 20 g'},wholeShrimp:{piece:40,singular:'gambas de 40 g',plural:'gambas de 40 g'},wholeFish:{piece:500,singular:'poisson entier de 500 g',plural:'poissons entiers de 500 g'},
 tofu:{piece:450,singular:'bloc de tofu de 450 g',plural:'blocs de tofu de 450 g'},groundBeef:{piece:500,singular:'paquet de bœuf haché de 500 g',plural:'paquets de bœuf haché de 500 g'},pasta:{piece:450,singular:'paquet de pâtes de 450 g',plural:'paquets de pâtes de 450 g'},noodle:{piece:450,singular:'paquet de nouilles de 450 g',plural:'paquets de nouilles de 450 g'},gnocchi:{piece:500,singular:'paquet de gnocchis de 500 g',plural:'paquets de gnocchis de 500 g'},pizzaDough:{piece:250,singular:'boule de pâte de 250 g',plural:'boules de pâte de 250 g'},puffPastry:{piece:250,singular:'rouleau de pâte feuilletée de 250 g',plural:'rouleaux de pâte feuilletée de 250 g'},
 broccoli:{piece:300,singular:'tête de brocoli de 300 g',plural:'têtes de brocoli de 300 g'},avocado:{piece:150,singular:'avocat donnant 150 g de chair',plural:'avocats donnant chacun 150 g de chair'},orange:{piece:130,singular:'orange donnant 130 g de chair',plural:'oranges donnant chacune 130 g de chair'},squash:{piece:500,singular:'portion de courge de 500 g',plural:'portions de courge de 500 g'},pineapple:{piece:500,singular:'portion d’ananas de 500 g',plural:'portions d’ananas de 500 g'},ginger:{piece:10,singular:'morceau de gingembre de 10 g',plural:'morceaux de gingembre de 10 g'},spinach:{piece:142,singular:'sachet d’épinards de 142 g',plural:'sachets d’épinards de 142 g'},lettuce:{piece:200,singular:'laitue de 200 g',plural:'laitues de 200 g'},basil:{piece:15,singular:'bouquet de basilic de 15 g',plural:'bouquets de basilic de 15 g'},cilantro:{piece:30,singular:'bouquet de coriandre de 30 g',plural:'bouquets de coriandre de 30 g'},mint:{piece:15,singular:'bouquet de menthe de 15 g',plural:'bouquets de menthe de 15 g'},pistachio:{piece:100,singular:'sachet de pistaches de 100 g',plural:'sachets de pistaches de 100 g'}
});
