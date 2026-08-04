(function(){
    var b=document.getElementById('burger'),m=document.getElementById('mnav');
    if(b&&m){
      b.addEventListener('click',function(){
        var open=m.classList.toggle('open');
        b.setAttribute('aria-expanded',open?'true':'false');
      });
      m.addEventListener('click',function(e){
        if(e.target.tagName==='A'){m.classList.remove('open');b.setAttribute('aria-expanded','false');}
      });
    }
    var yrEl=document.getElementById('yr');
    if(yrEl) yrEl.textContent=new Date().getFullYear();

    // ---- What We Do mega menu (stays open while moving to options) ----
    (function(){
      var dds=document.querySelectorAll('.nav-dd');
      if(!dds.length) return;
      dds.forEach(function(dd){
        var trigger=dd.querySelector('.nav-dd-trigger');
        var mega=dd.querySelector('.mega');
        if(!trigger||!mega) return;
        var closeTimer=null;
        function open(){
          clearTimeout(closeTimer);
          dd.classList.add('is-open');
        }
        function scheduleClose(){
          clearTimeout(closeTimer);
          closeTimer=setTimeout(function(){dd.classList.remove('is-open');},180);
        }
        trigger.addEventListener('mouseenter',open);
        mega.addEventListener('mouseenter',open);
        trigger.addEventListener('mouseleave',scheduleClose);
        mega.addEventListener('mouseleave',scheduleClose);
        trigger.addEventListener('focus',open);
        mega.addEventListener('focusin',open);
        dd.addEventListener('focusout',function(e){
          if(!dd.contains(e.relatedTarget)) scheduleClose();
        });
        trigger.addEventListener('keydown',function(e){
          if(e.key==='Escape'){dd.classList.remove('is-open');trigger.blur();}
        });
      });
      document.addEventListener('click',function(e){
        dds.forEach(function(dd){
          if(!dd.contains(e.target)) dd.classList.remove('is-open');
        });
      });
    })();

    // ---- CapCut-style 3D rotating logo (spin on its own axis, like a planet) ----
    (function(){
      var stages=document.querySelectorAll('[data-crown3d]');
      if(!stages.length) return;
      var layers=28;
      var step=2.5; // deep extruded rim like 3D logo lab
      var depth=(layers-1)*step;
      var zCenter=depth/2; // center on Z = spin in place on its axis (planet-style)
      stages.forEach(function(stage){
        var src=stage.getAttribute('data-crown3d')+'?v=geo1';
        var label=stage.getAttribute('aria-label')||'Crown logo';
        var spinner=document.createElement('div');
        spinner.className='crown-spinner';

        var back=document.createElement('img');
        back.src=src;
        back.alt='';
        back.setAttribute('aria-hidden','true');
        back.style.transform='rotateY(180deg) translateZ('+zCenter+'px)';
        spinner.appendChild(back);

        for(var i=0;i<layers;i++){
          var img=document.createElement('img');
          img.src=src;
          img.alt=i===layers-1?label:'';
          if(i!==layers-1) img.setAttribute('aria-hidden','true');
          img.style.transform='translateZ('+(i*step - zCenter)+'px)';
          spinner.appendChild(img);
        }

        stage.appendChild(spinner);
      });
    })();

    // ---- carousel (home / shared) ----
    (function(){
      var c=document.getElementById('carousel'); if(!c) return;
      var track=c.querySelector('.track'),
          slides=c.querySelectorAll('.slide'),
          dots=c.querySelectorAll('.dot'),
          prev=document.getElementById('cprev'),
          next=document.getElementById('cnext'),
          i=0,n=slides.length,timer,
          reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      function go(k){
        i=(k+n)%n;
        track.style.transform='translateX('+(-i*100)+'%)';
        dots.forEach(function(d,x){d.classList.toggle('is-active',x===i);});
        slides.forEach(function(s,x){s.classList.toggle('is-active',x===i);});
      }
      function nextS(){go(i+1);}
      function start(){if(reduce)return;stop();timer=setInterval(nextS,4500);}
      function stop(){if(timer)clearInterval(timer);}
      if(next) next.addEventListener('click',function(){go(i+1);start();});
      if(prev) prev.addEventListener('click',function(){go(i-1);start();});
      dots.forEach(function(d){d.addEventListener('click',function(){go(+d.dataset.i);start();});});
      c.addEventListener('mouseenter',stop);
      c.addEventListener('mouseleave',start);
      var x0=null;
      c.addEventListener('touchstart',function(e){x0=e.touches[0].clientX;stop();},{passive:true});
      c.addEventListener('touchend',function(e){
        if(x0===null)return;
        var dx=e.changedTouches[0].clientX-x0;
        if(Math.abs(dx)>40){go(dx<0?i+1:i-1);}
        x0=null;start();
      },{passive:true});
      start();
    })();

    // ---- gallery strip: drag + idle auto-scroll ----
    (function(){
      var root=document.getElementById('gstrip');
      var scroller=document.getElementById('gstrip-scroller');
      var track=document.getElementById('gstrip-track');
      var pill=document.getElementById('gstrip-pill');
      if(!root||!scroller||!track) return;

      var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      var originals=[].slice.call(track.children);
      if(!originals.length) return;

      // Duplicate cards so the strip can loop seamlessly
      originals.forEach(function(card){
        var clone=card.cloneNode(true);
        clone.setAttribute('aria-hidden','true');
        var img=clone.querySelector('img');
        if(img){img.alt='';img.removeAttribute('loading');}
        track.appendChild(clone);
      });

      var dragging=false;
      var moved=false;
      var startX=0;
      var startScroll=0;
      var idle=true;
      var resumeTimer=null;
      var raf=null;
      var SPEED=0.35; // px per frame at ~60fps — slow crawl

      function loopWidth(){
        return track.scrollWidth / 2;
      }

      function wrapScroll(){
        var half=loopWidth();
        if(half<=0) return;
        if(scroller.scrollLeft>=half){
          scroller.scrollLeft-=half;
        }else if(scroller.scrollLeft<0){
          scroller.scrollLeft+=half;
        }
      }

      function updatePill(){
        if(!pill) return;
        var half=loopWidth();
        if(half<=0) return;
        var meter=pill.parentElement;
        var travel=Math.max(0, meter.clientWidth - pill.offsetWidth);
        var t=(scroller.scrollLeft % half) / half;
        pill.style.transform='translateX('+(t*travel)+'px)';
      }

      function tick(){
        if(idle && !dragging && !reduce){
          scroller.scrollLeft+=SPEED;
          wrapScroll();
          updatePill();
        }
        raf=requestAnimationFrame(tick);
      }

      function pauseIdle(){
        idle=false;
        if(resumeTimer){clearTimeout(resumeTimer);resumeTimer=null;}
      }

      function scheduleResume(){
        if(reduce) return;
        if(resumeTimer) clearTimeout(resumeTimer);
        resumeTimer=setTimeout(function(){idle=true;}, 1400);
      }

      // Mouse: drag-to-scroll. Touch/trackpad: native horizontal scroll.
      scroller.addEventListener('pointerdown',function(e){
        pauseIdle();
        if(e.pointerType!=='mouse' || e.button!==0) return;
        dragging=true;
        moved=false;
        startX=e.clientX;
        startScroll=scroller.scrollLeft;
        scroller.classList.add('is-dragging');
        scroller.setPointerCapture(e.pointerId);
      });

      scroller.addEventListener('pointermove',function(e){
        if(!dragging) return;
        var dx=e.clientX-startX;
        if(Math.abs(dx)>3) moved=true;
        scroller.scrollLeft=startScroll-dx;
        wrapScroll();
        updatePill();
      });

      function endDrag(e){
        if(!dragging) return;
        dragging=false;
        scroller.classList.remove('is-dragging');
        try{scroller.releasePointerCapture(e.pointerId);}catch(_){}
        scheduleResume();
      }

      scroller.addEventListener('pointerup',function(e){
        if(dragging) endDrag(e);
        else scheduleResume();
      });
      scroller.addEventListener('pointercancel',function(e){
        if(dragging) endDrag(e);
        else scheduleResume();
      });

      scroller.addEventListener('click',function(e){
        if(moved){e.preventDefault();e.stopPropagation();}
      },true);

      scroller.addEventListener('wheel',function(e){
        if(Math.abs(e.deltaY)>Math.abs(e.deltaX) && Math.abs(e.deltaY)>0){
          scroller.scrollLeft+=e.deltaY;
          wrapScroll();
          updatePill();
          pauseIdle();
          scheduleResume();
          e.preventDefault();
        }else{
          pauseIdle();
          scheduleResume();
        }
      },{passive:false});

      scroller.addEventListener('scroll',function(){
        if(!dragging){
          wrapScroll();
          updatePill();
          if(idle) return;
          scheduleResume();
        }
      },{passive:true});

      window.addEventListener('resize',updatePill);

      updatePill();
      if(!reduce) raf=requestAnimationFrame(tick);
    })();

    // ---- Our Why: verse reveal (tap toggle for touch / keyboard) ----
    (function(){
      var expands=document.querySelectorAll('.verse-expand');
      if(!expands.length) return;
      var canHover=window.matchMedia('(hover:hover) and (pointer:fine)').matches;

      expands.forEach(function(el){
        // Scroll-reveal verses are driven by IntersectionObserver only
        if(el.closest('.why--scroll-reveal')) return;

        function setOpen(open){
          el.classList.toggle('is-open',open);
          el.setAttribute('aria-expanded',open?'true':'false');
        }
        el.addEventListener('click',function(e){
          e.stopPropagation();
          // Fine pointers use hover; touch/coarse toggles on tap
          if(canHover) return;
          setOpen(!el.classList.contains('is-open'));
        });
        el.addEventListener('keydown',function(e){
          if(e.key==='Enter'||e.key===' '){
            e.preventDefault();
            setOpen(!el.classList.contains('is-open'));
          }
          if(e.key==='Escape') setOpen(false);
        });
      });

      document.addEventListener('click',function(e){
        expands.forEach(function(el){
          if(el.closest('.why--scroll-reveal')) return;
          if(!el.contains(e.target)){
            el.classList.remove('is-open');
            el.setAttribute('aria-expanded','false');
          }
        });
      });
    })();

    // ---- Our Why: scroll-triggered verse reveal (test page) ----
    (function(){
      var block=document.querySelector('.why--scroll-reveal');
      if(!block) return;
      var expands=block.querySelectorAll('.verse-expand');
      if(!expands.length) return;

      function reveal(el){
        el.classList.add('is-revealed');
        el.setAttribute('aria-expanded','true');
      }

      if(!('IntersectionObserver' in window)){
        expands.forEach(reveal);
        return;
      }

      var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(!entry.isIntersecting) return;
          var el=entry.target;
          // Stagger the two cards slightly for a nicer beat
          var delay=reduce?0:(el===expands[1]?180:0);
          setTimeout(function(){reveal(el);},delay);
          io.unobserve(el);
        });
      },{
        threshold:0.35,
        rootMargin:'0px 0px -8% 0px'
      });

      expands.forEach(function(el){io.observe(el);});
    })();
  })();
