(function(){
    // Set your Google Analytics 4 Measurement ID to enable analytics (e.g. 'G-XXXXXXXXXX').
    // Leave empty to keep analytics off until you have an ID.
    var GA_MEASUREMENT_ID='';

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

    // ---- Analytics (GA4) — only loads when GA_MEASUREMENT_ID is set ----
    (function(){
      if(!GA_MEASUREMENT_ID||!/^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID)) return;
      window.dataLayer=window.dataLayer||[];
      function gtag(){window.dataLayer.push(arguments);}
      window.gtag=gtag;
      gtag('js',new Date());
      gtag('config',GA_MEASUREMENT_ID,{anonymize_ip:true});
      var s=document.createElement('script');
      s.async=true;
      s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA_MEASUREMENT_ID);
      document.head.appendChild(s);
    })();

    // ---- Shared FormSubmit helpers ----
    var FORMSUBMIT_ENDPOINT='https://formsubmit.co/ajax/hello@nhneathletics.org';
    function isValidEmail(email){
      return !!email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    function setFormStatus(status,msg,kind){
      if(!status) return;
      status.textContent=msg;
      status.classList.remove('is-ok','is-err');
      if(kind) status.classList.add(kind);
    }
    function postFormSubmit(payload){
      return fetch(FORMSUBMIT_ENDPOINT,{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Accept':'application/json'
        },
        body:JSON.stringify(Object.assign({
          _template:'table',
          _captcha:'false'
        },payload))
      }).then(function(res){
        if(!res.ok) throw new Error('Request failed');
        return res.json().catch(function(){return {};});
      });
    }

    // ---- Email signup (news & events notifications) ----
    // Submissions go to hello@nhneathletics.org via FormSubmit.
    // First submission triggers a one-time activation email to that inbox.
    (function(){
      var SHOW_DELAY_MS=1200;
      var CLOSE_AFTER_SUCCESS_MS=1600;

      function submitSignup(form,onSuccess){
        var emailInput=form.querySelector('input[name="email"]');
        var honey=form.querySelector('input[name="_honey"]');
        var status=form.querySelector('[data-signup-status]');
        var btn=form.querySelector('button[type="submit"]');
        var email=emailInput?emailInput.value.trim():'';

        if(honey&&honey.value) return;
        if(!isValidEmail(email)){
          setFormStatus(status,'Please enter a valid email address.','is-err');
          if(emailInput) emailInput.focus();
          return;
        }

        var prevLabel=btn?btn.textContent:'';
        if(btn){btn.disabled=true;btn.textContent='Sending…';}
        setFormStatus(status,'Signing you up…','');

        postFormSubmit({
          email:email,
          _subject:'NHNE Athletics — News & Events signup',
          message:'Please add this email to the news and events notification list.'
        }).then(function(){
          setFormStatus(status,"You're on the list — we'll keep you posted.",'is-ok');
          form.reset();
          if(typeof onSuccess==='function') onSuccess();
        }).catch(function(){
          setFormStatus(status,'Something went wrong. Email us at hello@nhneathletics.org.','is-err');
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
        try{localStorage.setItem(VISIT_KEY,String(n));}catch(err){}
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

    // ---- Contact / donate interest / event RSVP forms ----
    (function(){
      function val(form,name){
        var el=form.querySelector('[name="'+name+'"]');
        return el?String(el.value||'').trim():'';
      }

      function submitGeneric(form,opts){
        var honey=form.querySelector('input[name="_honey"]');
        var status=form.querySelector('[data-signup-status]');
        var btn=form.querySelector('button[type="submit"]');
        if(honey&&honey.value) return;

        var email=val(form,'email');
        var name=val(form,'name');
        if(!name){
          setFormStatus(status,'Please enter your name.','is-err');
          var nameEl=form.querySelector('[name="name"]');
          if(nameEl) nameEl.focus();
          return;
        }
        if(!isValidEmail(email)){
          setFormStatus(status,'Please enter a valid email address.','is-err');
          var emailEl=form.querySelector('[name="email"]');
          if(emailEl) emailEl.focus();
          return;
        }

        var prevLabel=btn?btn.textContent:'';
        if(btn){btn.disabled=true;btn.textContent='Sending…';}
        setFormStatus(status,opts.pendingMsg||'Sending…','');

        var payload=opts.buildPayload(form);
        postFormSubmit(payload).then(function(){
          setFormStatus(status,opts.okMsg||'Message sent — we will follow up soon.','is-ok');
          form.reset();
          if(opts.preserveHidden){
            Object.keys(opts.preserveHidden).forEach(function(k){
              var el=form.querySelector('[name="'+k+'"]');
              if(el) el.value=opts.preserveHidden[k];
            });
          }
        }).catch(function(){
          setFormStatus(status,'Something went wrong. Email us at hello@nhneathletics.org.','is-err');
        }).finally(function(){
          if(btn){btn.disabled=false;btn.textContent=prevLabel;}
        });
      }

      // Prefill contact form from ?interest=&event= query params
      (function(){
        var form=document.querySelector('[data-contact-form]');
        if(!form) return;
        var params=new URLSearchParams(window.location.search);
        var interest=params.get('interest');
        var eventName=params.get('event');
        var interestEl=form.querySelector('[name="interest"]');
        var messageEl=form.querySelector('[name="message"]');
        if(interest&&interestEl){
          for(var i=0;i<interestEl.options.length;i++){
            if(interestEl.options[i].value===interest){
              interestEl.value=interest;
              break;
            }
          }
        }
        if(eventName&&messageEl&&!messageEl.value){
          messageEl.value='I am interested in: '+eventName;
          if(interestEl&&!interestEl.value) interestEl.value='event';
        }
      })();

      document.addEventListener('submit',function(e){
        var contact=e.target.closest('[data-contact-form]');
        if(contact){
          e.preventDefault();
          submitGeneric(contact,{
            pendingMsg:'Sending your message…',
            okMsg:'Thanks — a team leader will follow up with you.',
            buildPayload:function(form){
              return {
                name:val(form,'name'),
                email:val(form,'email'),
                phone:val(form,'phone')||'—',
                interest:val(form,'interest')||'general',
                message:val(form,'message')||'—',
                _subject:'NHNE Athletics — Contact form'
              };
            }
          });
          return;
        }

        var donate=e.target.closest('[data-donate-form]');
        if(donate){
          e.preventDefault();
          submitGeneric(donate,{
            pendingMsg:'Sending…',
            okMsg:'Thank you — we will reach out with giving details.',
            buildPayload:function(form){
              return {
                name:val(form,'name'),
                email:val(form,'email'),
                amount:val(form,'amount')||'—',
                message:val(form,'message')||'—',
                _subject:'NHNE Athletics — Donate / support interest'
              };
            }
          });
          return;
        }

        var rsvp=e.target.closest('[data-rsvp-form]');
        if(rsvp){
          e.preventDefault();
          var eventTitle=rsvp.getAttribute('data-event')||val(rsvp,'event')||'Upcoming event';
          submitGeneric(rsvp,{
            pendingMsg:'Sending RSVP…',
            okMsg:'RSVP received — we will follow up with details.',
            preserveHidden:{event:eventTitle},
            buildPayload:function(form){
              return {
                name:val(form,'name'),
                email:val(form,'email'),
                event:eventTitle,
                message:val(form,'message')||'Please send me details / save my spot.',
                _subject:'NHNE Athletics — Event RSVP: '+eventTitle
              };
            }
          });
        }
      });
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
        var setCount=originals.length;
        if(!setCount) return;

        // Three identical sets → browse the middle copy for seamless looping
        function cloneSet(){
          originals.forEach(function(card){
            var clone=card.cloneNode(true);
            clone.setAttribute('aria-hidden','true');
            clone.removeAttribute('id');
            var img=clone.querySelector('img');
            if(img){
              img.alt='';
              img.removeAttribute('loading');
              // Eager-decode so middle-set clones aren't blank after seed
              try{if(img.decode) img.decode().catch(function(){});}catch(_){}
            }
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
        var seeded=false;
        var SPEED=0.35;

        // Exact set width from layout (flex gap-safe). scrollWidth/3 drifts.
        function unitWidth(){
          var cards=track.children;
          if(cards.length<setCount*2) return 0;
          var a=cards[0];
          var b=cards[setCount];
          if(!a||!b) return 0;
          var w=b.offsetLeft-a.offsetLeft;
          return w>1?w:0;
        }

        function wrapScroll(){
          var unit=unitWidth();
          if(unit<=1) return 0;
          var shifted=0;
          // Keep position inside the middle set
          while(scroller.scrollLeft>=unit*2){
            scroller.scrollLeft-=unit;
            shifted-=unit;
          }
          while(scroller.scrollLeft<unit){
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
          if(!meter) return;
          var travel=Math.max(0, meter.clientWidth-pill.offsetWidth);
          var t=((scroller.scrollLeft%unit)+unit)%unit/unit;
          pill.style.transform='translateX('+(t*travel)+'px)';
        }

        function cardsHaveSize(){
          var card=track.children[0];
          return !!(card && card.offsetWidth>1 && card.offsetHeight>1);
        }

        function seedLoop(force){
          if(!cardsHaveSize()) return;
          var unit=unitWidth();
          if(unit<=1) return;
          // Only jump when unset, forced, or clearly outside the loop band
          var sl=scroller.scrollLeft;
          if(force || !seeded || sl<unit*0.5 || sl>=unit*2.5){
            wrapping=true;
            scroller.scrollLeft=unit;
            wrapping=false;
            seeded=true;
          }else{
            wrapping=true;
            wrapScroll();
            wrapping=false;
          }
          updatePill();
        }

        function tick(){
          if(idle && !dragging && !reduce && seeded){
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
          if(moved){
            e.preventDefault();
            e.stopPropagation();
          }
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

        var resizeTimer=null;
        window.addEventListener('resize',function(){
          clearTimeout(resizeTimer);
          // Mobile URL bar show/hide fires resize — don't hard-jump every time
          resizeTimer=setTimeout(function(){seedLoop(false);}, 120);
        });

        // Seed after layout is real (avoids blank middle-set jump)
        seedLoop(true);
        requestAnimationFrame(function(){seedLoop(true);});
        window.addEventListener('load',function(){seedLoop(true);});

        if(typeof ResizeObserver!=='undefined'){
          var ro=new ResizeObserver(function(){seedLoop(false);});
          ro.observe(track);
          ro.observe(scroller);
        }

        // If an image finishes late and sizes were 0 before, re-seed
        track.querySelectorAll('img').forEach(function(img){
          if(img.complete) return;
          img.addEventListener('load',function(){seedLoop(false);},{once:true});
          img.addEventListener('error',function(){seedLoop(false);},{once:true});
        });

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

    // ---- Instagram-style gallery lightbox ----
    (function(){
      var cells=[].slice.call(document.querySelectorAll('[data-lightbox]'));
      if(!cells.length) return;
      var lb=null;
      var lastFocus=null;

      function ensureLightbox(){
        if(lb) return lb;
        lb=document.createElement('div');
        lb.className='ig-lightbox';
        lb.setAttribute('role','dialog');
        lb.setAttribute('aria-modal','true');
        lb.setAttribute('aria-label','Photo viewer');
        lb.innerHTML=
          '<div class="ig-lightbox-backdrop" data-lb-close></div>'+
          '<div class="ig-lightbox-dialog">'+
            '<button type="button" class="ig-lightbox-close" data-lb-close aria-label="Close">&times;</button>'+
            '<img src="" alt="">'+
          '</div>';
        document.body.appendChild(lb);
        lb.addEventListener('click',function(e){
          if(e.target.closest('[data-lb-close]')) close();
        });
        document.addEventListener('keydown',function(e){
          if(e.key==='Escape'&&lb.classList.contains('is-open')) close();
        });
        return lb;
      }

      function open(src,alt){
        var box=ensureLightbox();
        var img=box.querySelector('img');
        lastFocus=document.activeElement;
        img.src=src;
        img.alt=alt||'';
        box.classList.add('is-open');
        document.body.classList.add('ig-lightbox-open');
        box.querySelector('[data-lb-close]').focus();
      }

      function close(){
        if(!lb) return;
        lb.classList.remove('is-open');
        document.body.classList.remove('ig-lightbox-open');
        var img=lb.querySelector('img');
        if(img){img.removeAttribute('src');img.alt='';}
        if(lastFocus&&typeof lastFocus.focus==='function') lastFocus.focus();
      }

      cells.forEach(function(cell){
        cell.addEventListener('click',function(e){
          e.preventDefault();
          var img=cell.querySelector('img');
          open(cell.getAttribute('href')||(img&&img.src), img?img.alt:'');
        });
      });
    })();

    // ---- Duo CTA: fade-in character cutout ----
    (function(){
      var figures=document.querySelectorAll('[data-duo-character]');
      if(!figures.length) return;
      var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function show(el){el.classList.add('is-in');}

      if(reduce||!('IntersectionObserver' in window)){
        figures.forEach(show);
        return;
      }

      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(!entry.isIntersecting) return;
          show(entry.target);
          io.unobserve(entry.target);
        });
      },{threshold:0.35,rootMargin:'0px 0px -8% 0px'});

      figures.forEach(function(el){io.observe(el);});
    })();
  })();
