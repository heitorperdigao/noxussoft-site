(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;
  try { seen = sessionStorage.getItem('noxus-intro') === '1'; } catch (e) {}

  var body = document.body;
  var intro = document.getElementById('intro');
  var nav = document.getElementById('navbar');
  var hero = document.querySelector('.hero');
  var timers = [];

  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function clearAll() { timers.forEach(clearTimeout); timers = []; }

  /* ---------- intro ---------- */

  function buildHero(delay) {
    at(delay, function () { hero.classList.add('built'); });
  }

  function finishIntro(instant) {
    clearAll();
    removeSkip();
    try { sessionStorage.setItem('noxus-intro', '1'); } catch (e) {}
    nav.classList.add('in');
    body.classList.remove('lock');
    if (instant) {
      intro.style.display = 'none';
      buildHero(500);
    } else {
      intro.classList.add('hide');
      at(500, function () { intro.style.display = 'none'; });
      buildHero(900);
    }
  }

  var skipHandler = function () { finishIntro(true); };

  function addSkip() {
    intro.addEventListener('click', skipHandler);
    window.addEventListener('keydown', skipHandler);
    window.addEventListener('wheel', skipHandler, { passive: true });
    window.addEventListener('touchmove', skipHandler, { passive: true });
  }

  function removeSkip() {
    intro.removeEventListener('click', skipHandler);
    window.removeEventListener('keydown', skipHandler);
    window.removeEventListener('wheel', skipHandler);
    window.removeEventListener('touchmove', skipHandler);
  }

  function playIntro() {
    addSkip();

    var mesh = intro.querySelectorAll('#introMesh path');
    var pieces = ['ip1', 'ip2', 'ip3', 'ip4'].map(function (id) { return document.getElementById(id); });
    var words = intro.querySelectorAll('#introTag .tw');
    var glow = document.getElementById('introGlow');
    var brand = document.getElementById('introBrand');
    var tag = document.getElementById('introTag');
    var meshSvg = document.getElementById('introMesh');

    pieces.forEach(function (p, i) {
      p.style.transform = ['translateX(-20px)', 'translateY(-20px)', 'translateX(20px)', 'scale(1.15)'][i];
      p.style.transformOrigin = '50% 50%';
    });

    at(120, function () {
      mesh.forEach(function (p, i) {
        p.style.transition = 'stroke-dashoffset .9s ease-out ' + (i * 0.05) + 's';
        p.style.strokeDashoffset = '0';
      });
    });

    at(650, function () {
      pieces.forEach(function (p, i) {
        at(i * 160, function () {
          p.style.transition = 'transform .45s cubic-bezier(.2,.8,.2,1), opacity .3s ease';
          p.style.opacity = p.id === 'ip4' ? '0.85' : '1';
          p.style.transform = 'none';
        });
      });
    });

    at(1400, function () {
      glow.style.transition = 'opacity .35s ease-out';
      glow.style.opacity = '0.8';
    });
    at(1800, function () {
      glow.style.transition = 'opacity .9s ease-in';
      glow.style.opacity = '0.25';
    });

    [1550, 1780, 2010].forEach(function (t, i) {
      at(t, function () {
        var w = words[i];
        w.style.transition = 'transform .3s cubic-bezier(.2,.9,.3,1.4), opacity .2s ease';
        w.style.opacity = '1';
        w.style.transform = 'scale(1)';
      });
    });

    at(2750, function () {
      removeSkip();
      try { sessionStorage.setItem('noxus-intro', '1'); } catch (e) {}

      tag.style.transition = 'opacity .3s ease';
      tag.style.opacity = '0';
      meshSvg.style.transition = 'opacity .6s ease';
      meshSvg.style.opacity = '0';
      glow.style.transition = 'opacity .6s ease';
      glow.style.opacity = '0';
      intro.classList.add('bare');

      var mono = document.getElementById('introMono');
      var target = document.getElementById('navMark');
      nav.classList.add('in');

      requestAnimationFrame(function () {
        var from = mono.getBoundingClientRect();
        var to = target.getBoundingClientRect();
        var scale = to.width / from.width;
        var dx = (to.left + to.width / 2) - (from.left + from.width / 2);
        var dy = (to.top + to.height / 2) - (from.top + from.height / 2);
        brand.style.transition = 'transform .65s cubic-bezier(.7,0,.2,1), opacity .2s ease .55s';
        brand.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')';
        brand.style.opacity = '0';
      });

      at(700, function () {
        intro.classList.add('hide');
        body.classList.remove('lock');
        at(450, function () { intro.style.display = 'none'; });
        buildHero(500);
      });
    });
  }

  if (reduced) {
    intro.style.display = 'none';
    nav.classList.add('in');
    body.classList.remove('lock');
    hero.classList.add('built');
  } else if (seen) {
    intro.style.display = 'none';
    nav.classList.add('in');
    body.classList.remove('lock');
    buildHero(350);
  } else {
    playIntro();
  }

  window.addEventListener('scroll', function once() {
    hero.classList.add('built');
    window.removeEventListener('scroll', once);
  }, { passive: true });

  /* ---------- navbar ---------- */

  var lastScrolled = false;
  window.addEventListener('scroll', function () {
    var s = window.scrollY > 24;
    if (s !== lastScrolled) {
      lastScrolled = s;
      nav.classList.toggle('scrolled', s);
    }
  }, { passive: true });

  /* ---------- reveals ---------- */

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('on');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.rv, [data-build]').forEach(function (el) {
    if (reduced) { el.classList.add('on'); }
    else { io.observe(el); }
  });

  /* ---------- scroll horizontal (desktop) ---------- */

  var outer = document.getElementById('hsOuter');
  var track = document.getElementById('hsTrack');
  var bgw1 = document.getElementById('bgw1');
  var bgw2 = document.getElementById('bgw2');
  var hsActive = false;
  var maxShift = 0;

  function setupHS() {
    var desktop = window.innerWidth > 980 && !reduced;
    if (!desktop) {
      hsActive = false;
      outer.style.height = '';
      track.style.transform = '';
      return;
    }
    maxShift = track.scrollWidth - window.innerWidth;
    if (maxShift <= 0) { hsActive = false; outer.style.height = ''; return; }
    outer.style.height = (window.innerHeight + maxShift) + 'px';
    hsActive = true;
    onHS();
  }

  function onHS() {
    if (!hsActive) return;
    var rect = outer.getBoundingClientRect();
    var progress = Math.min(1, Math.max(0, -rect.top / (outer.offsetHeight - window.innerHeight)));
    var x = -progress * maxShift;
    track.style.transform = 'translate3d(' + x + 'px,0,0)';
    bgw1.style.transform = 'translate3d(' + (-progress * 120) + 'px,0,0)';
    bgw2.style.transform = 'translate3d(' + (progress * 160) + 'px,0,0)';
  }

  window.addEventListener('scroll', onHS, { passive: true });
  window.addEventListener('resize', setupHS);
  window.addEventListener('orientationchange', setupHS);
  window.addEventListener('load', setupHS);
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(setupHS); }
  setTimeout(setupHS, 600);
  setTimeout(setupHS, 1800);
  setupHS();

  /* ---------- configurador ---------- */

  var picks = { tipo: null, objetivo: null, prazo: null };
  var bubble = document.getElementById('cfgBubble');
  var msgEl = document.getElementById('cfgMsg');
  var timeEl = document.getElementById('cfgTime');
  var sendBtn = document.getElementById('cfgSend');
  var finalCta = document.getElementById('finalCta');
  var fwa = document.querySelector('.fwa');

  function nowTime() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  timeEl.textContent = nowTime();

  function buildMsg() {
    if (!picks.tipo && !picks.objetivo && !picks.prazo) {
      return 'Olá, NoxusSoft! Quero conversar sobre um projeto. Podem me ajudar?';
    }
    var m = 'Olá, NoxusSoft! Preciso de ' + (picks.tipo || 'um projeto');
    if (picks.objetivo) m += ' para ' + picks.objetivo;
    if (picks.prazo) m += ', ' + picks.prazo;
    m += '. Podemos conversar?';
    return m;
  }

  function updateCfg() {
    var m = buildMsg();
    bubble.style.opacity = '0';
    setTimeout(function () {
      msgEl.textContent = m;
      timeEl.textContent = nowTime();
      bubble.style.opacity = '1';
    }, 180);
    var url = 'https://wa.me/5543999081379?text=' + encodeURIComponent(m);
    sendBtn.href = url;
    finalCta.href = url;
  }

  document.querySelectorAll('.q').forEach(function (q) {
    var key = q.getAttribute('data-q');
    q.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var active = chip.getAttribute('aria-pressed') === 'true';
        q.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        if (active) {
          picks[key] = null;
        } else {
          chip.setAttribute('aria-pressed', 'true');
          picks[key] = chip.getAttribute('data-v');
        }
        updateCfg();
      });
    });
  });

  /* ---------- luz ambiente errante ---------- */

  (function () {
    if (reduced) return;
    var blobs = document.querySelectorAll('.ambient i');
    if (!blobs.length) return;

    function rand(min, max) { return min + Math.random() * (max - min); }

    function wander(blob) {
      // sorteia um destino e um tempo bem lento; ao chegar, sorteia outro
      var x = rand(-28, 28); // vw
      var y = rand(-24, 24); // vh
      var s = rand(0.9, 1.25);
      var dur = rand(18, 35); // segundos
      blob.style.transition = 'transform ' + dur.toFixed(1) + 's ease-in-out';
      blob.style.transform = 'translate(' + x.toFixed(1) + 'vw,' + y.toFixed(1) + 'vh) scale(' + s.toFixed(2) + ')';
      blob._t = setTimeout(function () { wander(blob); }, dur * 1000);
    }

    blobs.forEach(function (blob, i) {
      // primeiro trajeto começa em momentos diferentes pra dessincronizar
      setTimeout(function () { wander(blob); }, i * 400 + 100);
    });
  })();

  /* ---------- tilt do mockup do hero ---------- */

  (function () {
    if (reduced) return;
    var wrap = document.querySelector('.hero-right');
    var shot = document.querySelector('.hero-shot');
    if (!wrap || !shot) return;

    var raf = null;

    wrap.addEventListener('mousemove', function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        var r = shot.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        dx = Math.max(-1, Math.min(1, dx));
        dy = Math.max(-1, Math.min(1, dy));
        shot.classList.remove('snap-back');
        // lado do mouse afunda, lado oposto levanta; brilho, glow e logo seguem o cursor
        shot.style.setProperty('--dx', dx.toFixed(3));
        shot.style.setProperty('--dy', dy.toFixed(3));
        shot.style.setProperty('--hov', '1');
      });
    });

    wrap.addEventListener('mouseleave', function () {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      shot.classList.add('snap-back');
      shot.style.setProperty('--dx', '0');
      shot.style.setProperty('--dy', '0');
      shot.style.setProperty('--hov', '0');
    });
  })();

  /* ---------- menu mobile ---------- */

  (function () {
    var burger = document.getElementById('navBurger');
    var mmenu = document.getElementById('mmenu');
    if (!burger || !mmenu) return;

    function setMenu(open) {
      body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      mmenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    }

    burger.addEventListener('click', function () {
      setMenu(!body.classList.contains('menu-open'));
    });

    mmenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) setMenu(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 760 && body.classList.contains('menu-open')) setMenu(false);
    });
  })();

  /* ---------- botões magnéticos ---------- */

  (function () {
    if (reduced) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var strength = 0.32;
    var limit = 9;

    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var mx = (e.clientX - (r.left + r.width / 2)) * strength;
        var my = (e.clientY - (r.top + r.height / 2)) * strength;
        mx = Math.max(-limit, Math.min(limit, mx));
        my = Math.max(-limit, Math.min(limit, my));
        btn.style.setProperty('--mx', mx.toFixed(1) + 'px');
        btn.style.setProperty('--my', my.toFixed(1) + 'px');
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });
  })();

  /* ---------- ano ---------- */

  document.getElementById('year').textContent = new Date().getFullYear();
})();
