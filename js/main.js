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

    // ---- Email signup (news & events notifications) ----
    // Submissions go to hello@nhneathletics.org via FormSubmit.
    // First submission triggers a one-time activation email to that inbox.
    (function(){
      var ENDPOINT='https://formsubmit.co/ajax/hello@nhneathletics.org';
      var SHOW_DELAY_MS=1200;
      var CLOSE_AFTER_SUCCESS_MS=1600;

      function setStatus(status,msg,kind){
        if(!status) return;
        status.textContent=msg;
        status.classList.remove('is-ok','is-err');
        if(kind) status.classList.add(kind);
      }

      function submitSignup(form,onSuccess){
        var emailInput=form.querySelector('input[name="email"]');
        var honey=form.querySelector('input[name="_honey"]');
        var status=form.querySelector('[data-signup-status]');
        var btn=form.querySelector('button[type="submit"]');
        var email=emailInput?emailInput.value.trim():'';

        if(honey&&honey.value) return;
        if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
          setStatus(status,'Please enter a valid email address.','is-err');
          if(emailInput) emailInput.focus();
          return;
        }

        var prevLabel=btn?btn.textContent:'';
        if(btn){btn.disabled=true;btn.textContent='Sending…';}
        setStatus(status,'Signing you up…','');

        fetch(ENDPOINT,{
          method:'POST',
          headers:{
            'Content-Type':'application/json',
            'Accept':'application/json'
          },
          body:JSON.stringify({
            email:email,
            _subject:'NHNE Athletics — News & Events signup',
            message:'Please add this email to the news and events notification list.',
            _template:'table',
            _captcha:'false'
          })
        }).then(function(res){
          if(!res.ok) throw new Error('Request failed');
          return res.json().catch(function(){return {};});
        }).then(function(){
          setStatus(status,"You're on the list — we'll keep you posted.",'is-ok');
          form.reset();
          if(typeof onSuccess==='function') onSuccess();
        }).catch(function(){
          setStatus(status,'Something went wrong. Email us at hello@nhneathletics.org.','is-err');
        }).finally(function(){
          if(btn){btn.disabled=false;btn.textContent=prevLabel;}
        });
      }

      document.addEventListener('submit',function(e){
        var form=e.target.closest('[data-signup-form]');
        if(!form) return;
        e.preventDefault();
        var isPopup=!!form.closest('#signup-modal');
        submitSignup(form,isPopup?function(){
          setTimeout(closePopup,CLOSE_AFTER_SUCCESS_MS);
        }:null);
      });

      // Popup on home page every 3rd load/refresh for that browser
      var popup=null;
      var lastFocus=null;
      var VISIT_KEY='nhne_home_visits';
      var SHOW_EVERY=3;
      var path=window.location.pathname.replace(/\/+$/,'');
      var page=path.split('/').pop()||'';
      var isHome=page===''||page==='index.html';

      function getHomeVisits(){
        try{
          var n=parseInt(localStorage.getItem(VISIT_KEY)||'0',10);
          return isNaN(n)?0:n;
        }catch(err){return 0;}
      }
      function setHomeVisits(n){
        try{localStorage.setItem(VISIT_KEY,String(n);}catch(err){}
      }
      function shouldShowPopup(){
        var visits=getHomeVisits()+1;
        setHomeVisits(visits);
        return visits%SHOW_EVERY===0;
      }

      function closePopup(){
        if(!popup) return;
        popup.classList.remove('is-open');
        popup.setAttribute('aria-hidden','true');
        document.body.classList.remove('signup-modal-open');
        if(lastFocus&&typeof lastFocus.focus==='function') lastFocus.focus();
      }

      function openPopup(){
        if(!popup) return;
        lastFocus=document.activeElement;
        popup.classList.add('is-open');
        popup.setAttribute('aria-hidden','false');
        document.body.classList.add('signup-modal-open');
        var input=popup.querySelector('input[name="email"]');
        if(input) setTimeout(function(){input.focus();},50);
      }

      function dismissPopup(){
        closePopup();
      }

      function buildPopup(){
        var el=document.createElement('div');
        el.id='signup-modal';
        el.className='signup-modal';
        el.setAttribute('role','dialog');
        el.setAttribute('aria-modal','true');
        el.setAttribute('aria-labelledby','signup-modal-title');
        el.setAttribute('aria-hidden','true');
        el.innerHTML=
          '<div class="signup-modal-backdrop" data-signup-dismiss></div>'+
          '<div class="signup-modal-dialog">'+
            '<button type="button" class="signup-modal-close" data-signup-dismiss aria-label="Close">&times;</button>'+
            '<span class="signup-modal-kicker">Events &amp; News</span>'+
            '<h2 id="signup-modal-title">Stay in the loop</h2>'+
            '<p>Sign up for notifications about the latest news and upcoming events from NHNE Athletics.</p>'+
            '<form class="signup-form" data-signup-form>'+
              '<input class="signup-honey" type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">'+
              '<div class="signup-row">'+
                '<input type="email" name="email" required autocomplete="email" inputmode="email" placeholder="Your email address" aria-label="Email address">'+
                '<button type="submit" class="btn btn-gold">Sign Up</button>'+
              '</div>'+
              '<p class="signup-status" data-signup-status role="status" aria-live="polite"></p>'+
            '</form>'+
            '<button type="button" class="signup-modal-skip" data-signup-dismiss>Continue to page</button>'+
          '</div>';
        document.body.appendChild(el);

        el.addEventListener('click',function(e){
          if(e.target.closest('[data-signup-dismiss]')) dismissPopup();
        });

        document.addEventListener('keydown',function(e){
          if(e.key==='Escape'&&el.classList.contains('is-open')) dismissPopup();
        });

        return el;
      }

      if(isHome&&shouldShowPopup()){
        popup=buildPopup();
        setTimeout(openPopup,SHOW_DELAY_MS);
      }
    })();

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
      // One centered extrusion stack — continuous full 360° spin (both faces stay 3D)
      var layers=18;
      var step=3.0;
      var depth=(layers-1)*step;
      var zCenter=depth/2;
      var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      stages.forEach(function(stage){
        var base=stage.getAttribute('data-crown3d');
        var face=base+'?v=geo12';
        var label=stage.getAttribute('aria-label')||'Crown logo';
        var spinner=document.createElement('div');
        spinner.className='crown-spinner';

        // Hollow crown on every layer; no backface-hiding so the spin reads as a full 360
        for(var i=0;i<layers;i++){
          var img=document.createElement('img');
          var isFront=i===layers-1;
          img.src=face;
          img.alt=isFront?label:'';
          if(!isFront) img.setAttribute('aria-hidden','true');
          img.style.transform='translateZ('+(i*step - zCenter)+'px)';
          spinner.appendChild(img);
        }

        stage.appendChild(spinner);

        if(!reduce){
          var angle=0;
          var last=performance.now();
          function tick(now){
            var dt=Math.min(32, now-last); last=now;
            angle=(angle + dt*0.072) % 360; // ~5s per full turn
            spinner.style.transform='rotateY('+angle+'deg)';
            requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }else{
          spinner.style.transform='rotateY(-25deg)';
        }
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

    // ---- gallery strip: drag + idle auto-scroll (infinite loop) ----
    (function(){
      var roots=[].slice.call(document.querySelectorAll('.gstrip'));
      if(!roots.length) return;
      var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;

      roots.forEach(function(root){
        var scroller=root.querySelector('.gstrip-scroller');
        var track=root.querySelector('.gstrip-track');
        var pill=root.querySelector('.gstrip-pill');
        if(!scroller||!track) return;

        var originals=[].slice.call(track.children);
        if(!originals.length) return;

        // Three sets → always browse the middle copy (true infinite loop)
        function cloneSet(){
          originals.forEach(function(card){
            var clone=card.cloneNode(true);
            clone.setAttribute('aria-hidden','true');
            var img=clone.querySelector('img');
            if(img){img.alt='';img.removeAttribute('loading');}
            track.appendChild(clone);
          });
        }
        cloneSet();
        cloneSet();

        var dragging=false;
        var moved=false;
        var startX=0;
        var startScroll=0;
        var idle=true;
        var resumeTimer=null;
        var wrapping=false;
        var SPEED=0.35; // px per frame at ~60fps — slow crawl

        function unitWidth(){
          return track.scrollWidth / 3;
        }

        function wrapScroll(){
          var unit=unitWidth();
          if(unit<=1) return 0;
          var shifted=0;
          if(scroller.scrollLeft>=unit*2){
            scroller.scrollLeft-=unit;
            shifted-=unit;
          }else if(scroller.scrollLeft<unit){
            scroller.scrollLeft+=unit;
            shifted+=unit;
          }
          return shifted;
        }

        function updatePill(){
          if(!pill) return;
          var unit=unitWidth();
          if(unit<=0) return;
          var meter=pill.parentElement;
          var travel=Math.max(0, meter.clientWidth - pill.offsetWidth);
          var t=((scroller.scrollLeft % unit) + unit) % unit / unit;
          pill.style.transform='translateX('+(t*travel)+'px)';
        }

        function seedLoop(){
          var unit=unitWidth();
          if(unit>1) scroller.scrollLeft=unit;
          updatePill();
        }

        function tick(){
          if(idle && !dragging && !reduce){
            wrapping=true;
            scroller.scrollLeft+=SPEED;
            wrapScroll();
            wrapping=false;
            updatePill();
          }
          requestAnimationFrame(tick);
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
          wrapping=true;
          scroller.scrollLeft=startScroll-dx;
          var shifted=wrapScroll();
          if(shifted) startScroll+=shifted;
          wrapping=false;
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
            wrapping=true;
            scroller.scrollLeft+=e.deltaY;
            wrapScroll();
            wrapping=false;
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
          if(wrapping) return;
          wrapping=true;
          wrapScroll();
          wrapping=false;
          updatePill();
          if(!idle) scheduleResume();
        },{passive:true});

        window.addEventListener('resize',seedLoop);
        seedLoop();
        requestAnimationFrame(seedLoop);
        window.addEventListener('load',seedLoop);
        if(!reduce) requestAnimationFrame(tick);
      });
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

    // ---- Pull quote: word-by-word scroll reveal ----
    (function(){
      var pulls=document.querySelectorAll('[data-pull]');
      if(!pulls.length) return;

      var punch=/\b(physical|solution|spiritual|problem)\b/i;
      var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;

      pulls.forEach(function(el){
        var text=el.textContent.trim();
        var parts=text.split(/(\s+)/);
        var i=0;
        el.setAttribute('aria-label',text);
        el.innerHTML=parts.map(function(part){
          if(/^\s+$/.test(part)) return part;
          var cls='pull-word'+(punch.test(part.replace(/[^\w]/g,''))?' is-punch':'');
          var html='<span class="'+cls+'" style="--i:'+i+'">'+part+'</span>';
          i+=1;
          return html;
        }).join('');

        if(reduce||!('IntersectionObserver' in window)){
          el.classList.add('is-in');
          return;
        }

        var io=new IntersectionObserver(function(entries){
          entries.forEach(function(entry){
            if(!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          });
        },{
          threshold:0.45,
          rootMargin:'0px 0px -10% 0px'
        });
        io.observe(el);
      });
    })();
  })();
