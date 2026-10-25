let saugeObserver=null,saugeMotionBound=false,saugeMotionEnabled=true;
export function bindAtmosphere(root=document){
 const html=document.documentElement;if(!html)return;
 const reduced=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 try{saugeMotionEnabled=localStorage.getItem('sauge-motion-v1')!=='off';}catch{}
 html.dataset.atmosphere=saugeMotionEnabled&&!reduced?'on':'off';
 root.querySelectorAll('[data-motion-toggle]').forEach(button=>{button.textContent=saugeMotionEnabled?'Ambiance animée : activée':'Ambiance animée : désactivée';button.setAttribute('aria-pressed',String(saugeMotionEnabled));button.onclick=()=>{saugeMotionEnabled=!saugeMotionEnabled;try{localStorage.setItem('sauge-motion-v1',saugeMotionEnabled?'on':'off');}catch{}bindAtmosphere(document);};});
 if(!saugeMotionEnabled||reduced){if(saugeObserver)saugeObserver.disconnect();document.querySelectorAll('[data-reveal-state]').forEach(el=>el.dataset.revealState='visible');return;}
 if(typeof IntersectionObserver==='function'){if(saugeObserver&&root===document)saugeObserver.disconnect();
  if(!saugeObserver)saugeObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.dataset.revealState='visible';saugeObserver.unobserve(entry.target);}},{threshold:.06,rootMargin:'0px 0px -25px 0px'});
  root.querySelectorAll('.forest-intro,.forest-story-copy,.forest-story-art,.forest-steps article,.forest-collection .dish,.forest-occasion-card,.sauge-trust article,.sauge-plan-teaser,.forest-last-call,.discovery-grid .dish').forEach((el,i)=>{if(el.dataset.revealState==='visible')return;el.style.setProperty('--reveal-delay',(i%4)*65+'ms');el.dataset.revealState='waiting';saugeObserver.observe(el);});
 }
 if(typeof requestAnimationFrame!=='function')return;
 root.querySelectorAll('.forest-hero').forEach(hero=>{if(hero.dataset.motionBound)return;hero.dataset.motionBound='yes';let pending=false,dx=0,dy=0;const apply=()=>{pending=false;if(html.dataset.atmosphere!=='on')return;hero.style.setProperty('--scene-x',dx+'px');hero.style.setProperty('--scene-y',dy+'px');};hero.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const box=hero.getBoundingClientRect();dx=((e.clientX-box.left)/box.width-.5)*14;dy=((e.clientY-box.top)/box.height-.5)*8;if(!pending){pending=true;requestAnimationFrame(apply);}},{passive:true});hero.addEventListener('pointerleave',()=>{dx=0;dy=0;if(!pending){pending=true;requestAnimationFrame(apply);}},{passive:true});});
 if(!saugeMotionBound){saugeMotionBound=true;let ticking=false;const update=()=>{ticking=false;const max=html.scrollHeight-window.innerHeight;html.style.setProperty('--reading-progress',max>0?Math.min(1,Math.max(0,window.scrollY/max)):0);};window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}},{passive:true});window.addEventListener('resize',update,{passive:true});document.addEventListener('visibilitychange',()=>html.dataset.motionPause=document.hidden?'yes':'no');update();}
}
