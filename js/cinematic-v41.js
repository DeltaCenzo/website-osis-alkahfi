/* =========================================================
   OSIS AL-KAHFI — V41 SILK MOTION SYSTEM
   Split-screen opening + school-photo depth + cinematic
   section choreography. No character/word splitting.
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

  root.classList.add('v40-active','v41-active');

  // Remove generic V32 decorations that make the interface feel templated.
  document.querySelectorAll([
    '.motion-canvas-v32','.pointer-aura-v32','.scene-orb-v32','.scene-kicker-v32',
    '.motion-rail-v32','header .hero-orbits-v32','header .hero-scan-v32',
    'header .hero-grid-v31','header .hero-sheen-v31','.v37-liquid-canvas',
    '.v37-liquid-fallback','.v37-hero-wave','.v37-hero-glint'
  ].join(',')).forEach((node)=>node.remove());

  const header=document.querySelector('header');
  const mainNav=document.querySelector('body > nav[aria-label="Navigasi utama"]');

  // Create a nested school-photo plane so idle drift and pointer depth never
  // fight over the same transform property.
  const heroBg=header?.querySelector('.hero-bg-v32');
  if(heroBg&&!heroBg.querySelector('.v40-school-photo')){
    heroBg.classList.add('v40-bg-shell');
    const photo=document.createElement('div');
    photo.className='v40-school-photo';
    photo.setAttribute('aria-hidden','true');
    heroBg.appendChild(photo);
  }

  if(header){
    const light=document.createElement('span');
    light.className='v40-hero-lightpass';
    light.setAttribute('aria-hidden','true');
    header.appendChild(light);

    const frame=document.createElement('span');
    frame.className='v40-hero-frame';
    frame.setAttribute('aria-hidden','true');
    header.appendChild(frame);

    const veil=document.createElement('span');
    veil.className='v41-hero-veil';
    veil.setAttribute('aria-hidden','true');
    header.appendChild(veil);
  }

  // Clean logo treatment: no orbit, no pointer tilt. The image itself stays stable.
  header?.querySelectorAll('.hero-logo-v39').forEach((logo)=>{
    logo.style.removeProperty('--crest-rx');
    logo.style.removeProperty('--crest-ry');
  });

  /* ---------- Split-screen loader ---------- */
  const loader=document.getElementById('v40-loader');
  const ring=document.getElementById('v40-loader-progress-ring');
  const loaderStatus=document.getElementById('v40-loader-status');

  let heroLiveDispatched=false;
  const markHeroLive=()=>{
    body.classList.add('v40-hero-live');
    body.classList.remove('v40-loader-lock');
    if(!heroLiveDispatched){
      heroLiveDispatched=true;
      document.dispatchEvent(new CustomEvent('osis:hero-live'));
    }
  };

  if(loader){
    body.classList.add('v40-loader-lock');
    const minDuration=reduced?360:(lite?1180:2850);
    const hardLimit=reduced?850:(lite?2350:4700);
    const started=performance.now();
    let loaded=document.readyState==='complete';
    let finishing=false;

    if(!loaded) addEventListener('load',()=>{loaded=true;},{once:true});

    const phases=[
      [0,'INITIALIZING'],
      [.28,'SYNCING INTERFACE'],
      [.58,'PREPARING SCHOOL VIEW'],
      [.82,'READY TO ENTER']
    ];

    const updateProgress=(ratio)=>{
      const safe=Math.max(0,Math.min(1,ratio));
      ring?.style.setProperty('--v40-load',`${(safe*360).toFixed(1)}deg`);
      if(loaderStatus){
        let text=phases[0][1];
        for(const [at,label] of phases){if(safe>=at) text=label;}
        loaderStatus.textContent=text;
      }
      if(safe>.78) loader.classList.add('is-charged');
    };

    const finish=()=>{
      if(finishing) return;
      finishing=true;
      updateProgress(1);
      loader.classList.add('is-charged');
      const chargePause=reduced?20:(lite?120:210);
      const heroDelay=reduced?10:(lite?230:470);
      const settleDelay=reduced?250:(lite?1040:1580);
      const removeDelay=reduced?330:(lite?1220:1740);
      setTimeout(()=>{
        body.classList.add('v41-reveal-start');
        // Two rAFs let the browser commit the charged state before the panels move.
        requestAnimationFrame(()=>requestAnimationFrame(()=>loader.classList.add('is-opening')));
        setTimeout(markHeroLive,heroDelay);
        setTimeout(()=>body.classList.add('v41-reveal-complete'),settleDelay);
        setTimeout(()=>{
          loader.remove();
          body.classList.remove('v41-reveal-start');
        },removeDelay);
      },chargePause);
    };

    const tick=(now)=>{
      const elapsed=now-started;
      const raw=Math.min(1,elapsed/minDuration);
      const eased=raw<.5 ? 2*raw*raw : 1-Math.pow(-2*raw+2,2)/2;
      const waiting=elapsed>=minDuration&&!loaded&&elapsed<hardLimit;
      updateProgress(waiting?Math.min(.93,eased*.96):Math.min(.995,eased*.995));
      if((elapsed>=minDuration&&loaded)||elapsed>=hardLimit){finish();return;}
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }else{
    markHeroLive();
  }

  /* ---------- Hero depth ---------- */
  if(header&&heroBg&&!lite){
    let tx=0,ty=0,cx=0,cy=0,raf=0;
    let heroVisible=true;

    const paint=()=>{
      raf=0;
      cx+=(tx-cx)*.065;
      cy+=(ty-cy)*.065;
      header.style.setProperty('--v40-bg-x',`${cx.toFixed(2)}px`);
      header.style.setProperty('--v40-bg-y',`${cy.toFixed(2)}px`);
      header.style.setProperty('--v40-light-x',`${(50+cx*.62).toFixed(2)}%`);
      header.style.setProperty('--v40-light-y',`${(42+cy*.7).toFixed(2)}%`);
      if(Math.abs(tx-cx)>.04||Math.abs(ty-cy)>.04) raf=requestAnimationFrame(paint);
    };
    const schedule=()=>{if(!raf&&heroVisible) raf=requestAnimationFrame(paint)};

    if(fine){
      header.addEventListener('pointermove',(event)=>{
        const r=header.getBoundingClientRect();
        const nx=(event.clientX-r.left)/Math.max(r.width,1)-.5;
        const ny=(event.clientY-r.top)/Math.max(r.height,1)-.5;
        tx=Math.max(-7,Math.min(7,nx*14));
        ty=Math.max(-5,Math.min(5,ny*10));
        schedule();
      },{passive:true});
      header.addEventListener('pointerleave',()=>{tx=0;ty=0;schedule()},{passive:true});
    }

    if('IntersectionObserver' in window){
      new IntersectionObserver(([entry])=>{
        heroVisible=Boolean(entry?.isIntersecting);
        if(heroVisible) schedule();
      },{threshold:.02}).observe(header);
    }
  }

  /* ---------- Section choreography ---------- */
  const sectionIds=['struktur','visi-misi','proker','pengumuman','galeri','kritik-saran','kontak'];
  const sections=sectionIds.map((id)=>document.getElementById(id)).filter(Boolean);
  sections.forEach((section)=>section.classList.add('v40-section-stage'));

  const cardSelector=[
    '.leadership-card-v12','.board-support-card-v12','.division-card-v12',
    '#visi-misi .card-box','#proker .card-box','#pengumuman .card-box',
    '.gallery-item','#kritik-saran .aspirasi-card','.contact-card-v13','.social-hub-v13'
  ].join(',');

  const cardSeen=new WeakSet();
  const decorateCard=(card)=>{
    if(!(card instanceof Element)||cardSeen.has(card)||!card.matches(cardSelector)) return;
    cardSeen.add(card);
    card.classList.add('v40-motion-card');
    if(cardObserver) cardObserver.observe(card);
    else card.classList.add('v40-card-live');
  };

  let cardObserver=null;
  if('IntersectionObserver' in window&&!reduced){
    cardObserver=new IntersectionObserver((entries)=>{
      entries.forEach((entry)=>{
        if(!entry.isIntersecting) return;
        entry.target.classList.add('v40-card-live');
        cardObserver.unobserve(entry.target);
      });
    },{threshold:.16,rootMargin:'0px 0px -5% 0px'});
  }
  document.querySelectorAll(cardSelector).forEach(decorateCard);

  const dynamicObserver=new MutationObserver((mutations)=>{
    mutations.forEach((mutation)=>mutation.addedNodes.forEach((node)=>{
      if(!(node instanceof Element)) return;
      decorateCard(node);
      node.querySelectorAll?.(cardSelector).forEach(decorateCard);
    }));
  });
  dynamicObserver.observe(document.body,{childList:true,subtree:true});

  if('IntersectionObserver' in window&&!reduced){
    const sectionObserver=new IntersectionObserver((entries)=>{
      entries.forEach((entry)=>{
        if(entry.isIntersecting) entry.target.classList.add('v40-section-live');
      });
    },{threshold:.12,rootMargin:'0px 0px -10% 0px'});
    sections.forEach((section)=>sectionObserver.observe(section));
  }else{
    sections.forEach((section)=>section.classList.add('v40-section-live'));
  }

  // Scroll-driven ambient shift across section backlights. It moves scenery,
  // never text or content boxes.
  let scrollFrame=0;
  const paintScroll=()=>{
    scrollFrame=0;
    const vh=Math.max(innerHeight,1);
    body.classList.toggle('v40-scrolled',scrollY>40);
    sections.forEach((section)=>{
      const r=section.getBoundingClientRect();
      if(r.bottom<0||r.top>vh) return;
      const center=r.top+r.height/2;
      const norm=Math.max(-1,Math.min(1,(center-vh/2)/vh));
      section.style.setProperty('--v40-section-shift',`${(-norm*22).toFixed(1)}px`);
    });
  };
  const scheduleScroll=()=>{if(!scrollFrame) scrollFrame=requestAnimationFrame(paintScroll)};
  addEventListener('scroll',scheduleScroll,{passive:true});
  addEventListener('resize',scheduleScroll,{passive:true});
  scheduleScroll();

  /* ---------- Aspirasi focus lighting ---------- */
  const aspirasiCard=document.querySelector('#kritik-saran .aspirasi-card');
  if(aspirasiCard&&fine&&!lite){
    aspirasiCard.addEventListener('pointermove',(event)=>{
      const r=aspirasiCard.getBoundingClientRect();
      const x=Math.max(0,Math.min(100,(event.clientX-r.left)/Math.max(r.width,1)*100));
      const y=Math.max(0,Math.min(100,(event.clientY-r.top)/Math.max(r.height,1)*100));
      aspirasiCard.style.setProperty('--v40-form-x',`${x.toFixed(1)}%`);
      aspirasiCard.style.setProperty('--v40-form-y',`${y.toFixed(1)}%`);
    },{passive:true});
  }

  /* ---------- Footer arrival ---------- */
  const footer=document.querySelector('.footer-v13');
  if(footer){
    if('IntersectionObserver' in window&&!reduced){
      new IntersectionObserver(([entry],observer)=>{
        if(entry?.isIntersecting){footer.classList.add('v40-footer-live');observer.disconnect();}
      },{threshold:.12}).observe(footer);
    }else footer.classList.add('v40-footer-live');
  }
})();
