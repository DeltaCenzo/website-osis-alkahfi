/* =========================================================
   OSIS AL-KAHFI — V42 AURORA GATE
   Perspective gate, crest FLIP handoff, school-photo focus,
   nav morph indicator, and staggered section choreography.
   ========================================================= */
(()=>{
  'use strict';

  const root=document.documentElement;
  const body=document.body;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
  const saveData=Boolean(navigator.connection?.saveData);
  const lowMemory=Boolean(navigator.deviceMemory&&navigator.deviceMemory<=3);
  const lite=reduced||saveData||lowMemory||root.classList.contains('perf-lite');

  root.classList.add('v42-active');
  root.classList.remove('v41-active','v40-active');

  // V42 has one motion language. Remove older generated scenery so effects do not stack.
  document.querySelectorAll([
    '.motion-canvas-v32','.pointer-aura-v32','.scene-orb-v32','.scene-kicker-v32',
    '.motion-rail-v32','header .hero-orbits-v32','header .hero-scan-v32',
    'header .hero-grid-v31','header .hero-sheen-v31','.v37-liquid-canvas',
    '.v37-liquid-fallback','.v37-hero-wave','.v37-hero-glint',
    'header .v40-hero-lightpass','header .v40-hero-frame','header .v41-hero-veil',
    '.card-arrival-sheen-v32'
  ].join(',')).forEach((node)=>node.remove());

  const header=document.querySelector('header');
  const heroBg=header?.querySelector('.hero-bg-v32');
  if(heroBg&&!heroBg.querySelector('.v40-school-photo')){
    heroBg.classList.add('v40-bg-shell');
    const photo=document.createElement('div');
    photo.className='v40-school-photo';
    photo.setAttribute('aria-hidden','true');
    heroBg.appendChild(photo);
  }else if(heroBg){
    heroBg.classList.add('v40-bg-shell');
  }

  if(header){
    const lens=document.createElement('span');
    lens.className='v42-hero-lens';
    lens.setAttribute('aria-hidden','true');
    header.appendChild(lens);

    const horizon=document.createElement('span');
    horizon.className='v42-hero-horizon';
    horizon.setAttribute('aria-hidden','true');
    header.appendChild(horizon);
  }

  const loader=document.getElementById('v42-loader');
  const meter=document.getElementById('v42-meter-fill');
  const status=document.getElementById('v42-status');
  const emblem=document.getElementById('v42-emblem');
  const emblemImage=emblem?.querySelector('img');
  const targetLogo=header?.querySelector('.hero-logo-osis-v39 .logo-img');

  let heroLive=false;
  const releaseHero=()=>{
    if(heroLive) return;
    heroLive=true;
    body.classList.add('v40-hero-live','v42-hero-live');
    body.classList.remove('v42-loader-lock');
    document.dispatchEvent(new CustomEvent('osis:hero-live'));
  };

  const landLogo=()=>body.classList.add('v42-logo-landed');

  const morphCrest=()=>{
    if(!emblemImage||!targetLogo||reduced){landLogo();return Promise.resolve();}
    const from=emblemImage.getBoundingClientRect();
    const to=targetLogo.getBoundingClientRect();
    if(!from.width||!to.width){landLogo();return Promise.resolve();}

    const dx=(to.left+to.width/2)-(from.left+from.width/2);
    const dy=(to.top+to.height/2)-(from.top+from.height/2);
    const scale=Math.max(.2,Math.min(1.4,to.width/from.width));
    loader?.classList.add('is-morphing');

    const anim=emblemImage.animate([
      {transform:'translate3d(0,0,18px) scale(1)',filter:'brightness(1)',opacity:1,offset:0},
      {transform:`translate3d(${dx*.42}px,${dy*.32}px,90px) scale(${Math.max(scale,1.04)})`,filter:'brightness(1.35)',opacity:1,offset:.38},
      {transform:`translate3d(${dx}px,${dy}px,0) scale(${scale})`,filter:'brightness(1)',opacity:1,offset:.88},
      {transform:`translate3d(${dx}px,${dy}px,0) scale(${scale})`,filter:'brightness(1)',opacity:0,offset:1}
    ],{
      duration:lite?650:1080,
      easing:'cubic-bezier(.16,1,.3,1)',
      fill:'forwards'
    });

    return anim.finished.catch(()=>{}).then(()=>{landLogo();});
  };

  if(loader){
    body.classList.add('v42-loader-lock');
    body.classList.remove('v40-hero-live','v42-hero-live','v42-logo-landed');

    const minDuration=reduced?520:(lite?1500:3300);
    const hardLimit=reduced?900:(lite?2800:5400);
    const started=performance.now();
    let loaded=document.readyState==='complete';
    let finishing=false;
    if(!loaded) addEventListener('load',()=>{loaded=true;},{once:true});

    const phases=[
      [0,'MENYIAPKAN RUANG'],
      [.24,'MENGUNCI IDENTITAS'],
      [.48,'MENYELARASKAN VISUAL'],
      [.72,'MEMBANGUN MOMENTUM'],
      [.9,'SIAP MEMBUKA']
    ];

    const update=(ratio)=>{
      const p=Math.max(0,Math.min(1,ratio));
      meter?.style.setProperty('transform',`scaleX(${p.toFixed(4)})`);
      if(status){
        let label=phases[0][1];
        for(const [at,text] of phases){if(p>=at) label=text;}
        status.textContent=label;
      }
      if(p>.18) loader.classList.add('is-calibrating');
      if(p>.72) loader.classList.add('is-armed');
    };

    const finish=()=>{
      if(finishing) return;
      finishing=true;
      update(1);
      loader.classList.add('is-armed');
      const charge=reduced?20:(lite?90:260);
      setTimeout(()=>{
        body.classList.add('v42-reveal-start');
        loader.classList.add('is-breaking');
        // The school photo starts focusing before the gate moves, so the center reveal has depth.
        setTimeout(()=>loader.classList.add('is-opening'),reduced?30:(lite?110:230));
        setTimeout(()=>{
          morphCrest();
          releaseHero();
        },reduced?40:(lite?260:510));
        setTimeout(()=>body.classList.add('v42-reveal-complete'),reduced?180:(lite?900:1550));
        setTimeout(()=>{
          landLogo();
          loader.remove();
          body.classList.remove('v42-reveal-start');
        },reduced?260:(lite?1250:2050));
      },charge);
    };

    const tick=(now)=>{
      const elapsed=now-started;
      const raw=Math.min(1,elapsed/minDuration);
      // Deliberate build-up: quick initial response, slower tension before the break.
      const eased=raw<.68
        ? .62*(1-Math.pow(1-raw/.68,2.25))
        : .62+((raw-.68)/.32)*.38;
      const normalized=Math.max(0,Math.min(1,eased));
      const waiting=elapsed>=minDuration&&!loaded&&elapsed<hardLimit;
      update(waiting?Math.min(.94,normalized):Math.min(.997,normalized));
      if((elapsed>=minDuration&&loaded)||elapsed>=hardLimit){finish();return;}
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }else{
    landLogo();
    releaseHero();
  }

  /* ---------- Hero camera: smooth inertia, low amplitude ---------- */
  if(header&&heroBg&&!lite){
    let tx=0,ty=0,cx=0,cy=0,raf=0,visible=true;
    const paint=()=>{
      raf=0;
      cx+=(tx-cx)*.055;
      cy+=(ty-cy)*.055;
      header.style.setProperty('--v42-depth-x',`${cx.toFixed(2)}px`);
      header.style.setProperty('--v42-depth-y',`${cy.toFixed(2)}px`);
      header.style.setProperty('--v42-spot-x',`${(50+cx*.55).toFixed(2)}%`);
      header.style.setProperty('--v42-spot-y',`${(40+cy*.7).toFixed(2)}%`);
      if(Math.abs(tx-cx)>.03||Math.abs(ty-cy)>.03) raf=requestAnimationFrame(paint);
    };
    const schedule=()=>{if(!raf&&visible) raf=requestAnimationFrame(paint);};
    if(fine){
      header.addEventListener('pointermove',(event)=>{
        const r=header.getBoundingClientRect();
        const nx=(event.clientX-r.left)/Math.max(1,r.width)-.5;
        const ny=(event.clientY-r.top)/Math.max(1,r.height)-.5;
        tx=Math.max(-6,Math.min(6,nx*12));
        ty=Math.max(-4,Math.min(4,ny*8));
        schedule();
      },{passive:true});
      header.addEventListener('pointerleave',()=>{tx=0;ty=0;schedule();},{passive:true});
    }
    if('IntersectionObserver' in window){
      new IntersectionObserver(([entry])=>{visible=Boolean(entry?.isIntersecting);if(visible)schedule();},{threshold:.02}).observe(header);
    }
  }

  /* ---------- One morphing navigation pill ---------- */
  const nav=document.querySelector('body > nav[aria-label="Navigasi utama"]');
  const navLinksWrap=nav?.querySelector('.nav-links');
  const sectionIds=['struktur','visi-misi','proker','pengumuman','galeri','kritik-saran','kontak'];
  const navMap=new Map();
  sectionIds.forEach((id)=>{
    const link=navLinksWrap?.querySelector(`a[href="#${id}"]`);
    if(link) navMap.set(id,link);
  });
  let currentNav=[...navMap.values()][0]||null;
  let pill=null;

  const movePill=(target)=>{
    if(!pill||!navLinksWrap||!target||innerWidth<=900) return;
    const host=navLinksWrap.getBoundingClientRect();
    const rect=target.getBoundingClientRect();
    navLinksWrap.style.setProperty('--v42-nav-x',`${(rect.left-host.left).toFixed(1)}px`);
    navLinksWrap.style.setProperty('--v42-nav-y',`${(rect.top-host.top).toFixed(1)}px`);
    navLinksWrap.style.setProperty('--v42-nav-w',`${rect.width.toFixed(1)}px`);
    navLinksWrap.style.setProperty('--v42-nav-h',`${rect.height.toFixed(1)}px`);
    pill.classList.add('is-visible');
  };

  if(navLinksWrap&&fine){
    pill=document.createElement('span');
    pill.className='v42-nav-pill';
    pill.setAttribute('aria-hidden','true');
    navLinksWrap.prepend(pill);
    [...navLinksWrap.querySelectorAll('a,button')].forEach((item)=>item.addEventListener('pointerenter',()=>movePill(item),{passive:true}));
    navLinksWrap.addEventListener('pointerleave',()=>movePill(currentNav),{passive:true});
    addEventListener('resize',()=>movePill(currentNav),{passive:true});
  }

  /* ---------- Section choreography + card staggers ---------- */
  const sections=sectionIds.map((id)=>document.getElementById(id)).filter(Boolean);
  sections.forEach((section)=>section.classList.add('v42-section'));

  const cardSelector=[
    '.leadership-card-v12','.board-support-card-v12','.division-card-v12',
    '#visi-misi .card-box','#proker .card-box','#pengumuman .card-box',
    '.gallery-item','#kritik-saran .aspirasi-card','.contact-card-v13','.social-hub-v13'
  ].join(',');
  const cardSeen=new WeakSet();
  let cardObserver=null;

  const decorate=(card)=>{
    if(!(card instanceof Element)||cardSeen.has(card)||!card.matches(cardSelector)) return;
    cardSeen.add(card);
    card.classList.add('v42-card');
    const siblings=[...card.parentElement?.children||[]].filter((node)=>node instanceof Element&&node.matches(cardSelector));
    const index=Math.max(0,siblings.indexOf(card));
    card.style.setProperty('--v42-stagger',`${Math.min(420,index*72)}ms`);
    if(cardObserver) cardObserver.observe(card); else card.classList.add('v42-card-live');

    if(fine&&!lite){
      card.addEventListener('pointermove',(event)=>{
        const r=card.getBoundingClientRect();
        const x=Math.max(0,Math.min(100,(event.clientX-r.left)/Math.max(1,r.width)*100));
        const y=Math.max(0,Math.min(100,(event.clientY-r.top)/Math.max(1,r.height)*100));
        card.style.setProperty('--v42-card-x',`${x.toFixed(1)}%`);
        card.style.setProperty('--v42-card-y',`${y.toFixed(1)}%`);
      },{passive:true});
    }
  };

  if('IntersectionObserver' in window&&!reduced){
    cardObserver=new IntersectionObserver((entries)=>{
      entries.forEach((entry)=>{
        if(!entry.isIntersecting) return;
        entry.target.classList.add('v42-card-live');
        cardObserver.unobserve(entry.target);
      });
    },{threshold:.12,rootMargin:'0px 0px -4% 0px'});
  }
  document.querySelectorAll(cardSelector).forEach(decorate);

  const mutations=new MutationObserver((records)=>records.forEach((record)=>record.addedNodes.forEach((node)=>{
    if(!(node instanceof Element)) return;
    decorate(node);
    node.querySelectorAll?.(cardSelector).forEach(decorate);
  })));
  mutations.observe(document.body,{childList:true,subtree:true});

  if('IntersectionObserver' in window&&!reduced){
    const sectionObserver=new IntersectionObserver((entries)=>{
      entries.forEach((entry)=>{
        if(!entry.isIntersecting) return;
        entry.target.classList.add('v42-in-view');
        const link=navMap.get(entry.target.id);
        if(link){currentNav=link;movePill(link);}
      });
    },{threshold:.22,rootMargin:'-12% 0px -38% 0px'});
    sections.forEach((section)=>sectionObserver.observe(section));
  }else{
    sections.forEach((section)=>section.classList.add('v42-in-view'));
  }

  let scrollFrame=0;
  const paintScroll=()=>{
    scrollFrame=0;
    body.classList.toggle('v40-scrolled',scrollY>36);
    const vh=Math.max(innerHeight,1);
    sections.forEach((section)=>{
      const r=section.getBoundingClientRect();
      if(r.bottom<0||r.top>vh) return;
      const norm=Math.max(-1,Math.min(1,(r.top+r.height/2-vh/2)/vh));
      section.style.setProperty('--v42-section-shift',`${(-norm*18).toFixed(1)}px`);
    });
  };
  const scheduleScroll=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(paintScroll);};
  addEventListener('scroll',scheduleScroll,{passive:true});
  addEventListener('resize',scheduleScroll,{passive:true});
  scheduleScroll();

  /* ---------- Footer gets a deliberate final arrival ---------- */
  const footer=document.querySelector('.footer-v13');
  if(footer&&'IntersectionObserver' in window&&!reduced){
    new IntersectionObserver(([entry],observer)=>{
      if(!entry?.isIntersecting) return;
      footer.classList.add('v40-footer-live');
      observer.disconnect();
    },{threshold:.12}).observe(footer);
  }
})();
