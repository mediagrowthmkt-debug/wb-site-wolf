/* ============================================================
   WOLF CARPENTERS | main.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Active nav link ───────────────────────────────────── */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a').forEach(a => {
    if (a.getAttribute('href') === currentPath) a.classList.add('active');
  });

  /* ── Sticky header shadow ──────────────────────────────── */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 30);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Mobile hamburger menu ─────────────────────────────── */
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });
    // close on nav link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      });
    });
  }

  /* ── Services dropdown: tap-toggle on mobile ───────────── */
  const dropdownTrigger = document.querySelector('.nav__dropdown > a');
  const dropdownParent  = document.querySelector('.nav__dropdown');
  if (dropdownTrigger && dropdownParent) {
    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

    dropdownTrigger.setAttribute('aria-expanded', 'false');
    dropdownTrigger.setAttribute('aria-haspopup', 'true');

    dropdownTrigger.addEventListener('click', e => {
      if (!isMobile()) return; // desktop: CSS :hover handles it
      e.preventDefault();
      const isOpen = dropdownParent.classList.toggle('nav__dropdown--open');
      dropdownTrigger.setAttribute('aria-expanded', String(isOpen));
    });

    // close if user taps outside
    document.addEventListener('click', e => {
      if (!dropdownParent.contains(e.target)) {
        dropdownParent.classList.remove('nav__dropdown--open');
        dropdownTrigger.setAttribute('aria-expanded', 'false');
      }
    });

    // close on Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        dropdownParent.classList.remove('nav__dropdown--open');
        dropdownTrigger.setAttribute('aria-expanded', 'false');
        dropdownTrigger.focus();
      }
    });
  }

  /* ── Scroll reveal ─────────────────────────────────────── */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('revealed'));
  }

  /* ── Counter animation ─────────────────────────────────── */
  const counters = document.querySelectorAll('.counter-num');
  const animateCounter = (el) => {
    const target = +el.dataset.target;
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const tick = () => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toLocaleString();
      if (current < target) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          counterIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterIO.observe(c));
  }

  /* ── Photo carousel ────────────────────────────────────── */
  const track = document.querySelector('.photo-carousel__track');
  const prevBtn = document.querySelector('.carousel-nav .prev');
  const nextBtn = document.querySelector('.carousel-nav .next');

  if (track && prevBtn && nextBtn) {
    const slides = track.querySelectorAll('.photo-carousel__slide');
    let idx = 0;
    const perView = () => {
      if (window.innerWidth <= 540) return 2;
      if (window.innerWidth <= 900) return 3;
      return 5;
    };

    const move = () => {
      const pv = perView();
      const maxIdx = Math.max(0, slides.length - pv);
      idx = Math.min(idx, maxIdx);
      const slideW = slides[0].getBoundingClientRect().width + 12;
      track.style.transform = `translateX(-${idx * slideW}px)`;
    };

    nextBtn.addEventListener('click', () => { idx++; move(); });
    prevBtn.addEventListener('click', () => { idx = Math.max(0, idx - 1); move(); });
    window.addEventListener('resize', () => move());
  }

  /* ── Services carousel (home) ──────────────────────────── */
  const svcTrack = document.querySelector('.services-carousel-track');
  const svcPrev  = document.querySelector('.svc-prev');
  const svcNext  = document.querySelector('.svc-next');

  if (svcTrack && svcPrev && svcNext) {
    const svcSlides = svcTrack.querySelectorAll('.service-card');
    let svcIdx = 0;
    const svcPerView = () => {
      if (window.innerWidth <= 540) return 2;
      if (window.innerWidth <= 900) return 3;
      return 4;
    };

    const moveServices = () => {
      const pv = svcPerView();
      const max = Math.max(0, svcSlides.length - pv);
      svcIdx = Math.min(svcIdx, max);
      const w = svcSlides[0].getBoundingClientRect().width + 2;
      svcTrack.style.transform = `translateX(-${svcIdx * w}px)`;
    };

    svcNext.addEventListener('click', () => { svcIdx++; moveServices(); });
    svcPrev.addEventListener('click', () => { svcIdx = Math.max(0, svcIdx - 1); moveServices(); });
    window.addEventListener('resize', moveServices);
  }

  /* ── Smooth anchor scroll ──────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── Quote modal / form ────────────────────────────────── */
  const quoteModal  = document.getElementById('quoteModal');
  const quoteOpen   = document.querySelectorAll('[data-modal="quote"]');
  const quoteClose  = document.querySelector('.modal__close');

  if (quoteModal) {
    quoteOpen.forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        quoteModal.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });
    if (quoteClose) {
      quoteClose.addEventListener('click', () => {
        quoteModal.classList.remove('open');
        document.body.style.overflow = '';
      });
    }
    quoteModal.addEventListener('click', e => {
      if (e.target === quoteModal) {
        quoteModal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── Form submit → GHL (handled by js/ghl-form.js) ─────── */
  // ghl-form.js, loaded after main.js, owns all form submissions.

  /* ── Video sound toggle (global, hero .vid-wrap em todas as páginas) ── */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-vid-sound]');
    if (!b) return;
    const wrap = b.closest('.vid-wrap');
    const v = wrap && wrap.querySelector('video');
    if (!v) return;
    v.muted = !v.muted;
    b.classList.toggle('unmuted', !v.muted);
  });

  /* ── Video sound toggle ────────────────────────────────── */
  const videoSoundBtn = document.getElementById('videoSoundBtn');
  const aboutVideo = document.getElementById('aboutVideo');
  if (videoSoundBtn && aboutVideo) {
    videoSoundBtn.addEventListener('click', () => {
      if (aboutVideo.muted) {
        aboutVideo.muted = false;
        videoSoundBtn.classList.add('unmuted');
      } else {
        aboutVideo.muted = true;
        videoSoundBtn.classList.remove('unmuted');
      }
    });
  }

  /* ── Lazy-load home about video (performance) ──────────── */
  if (aboutVideo && (aboutVideo.dataset.src || aboutVideo.dataset.poster)) {
    const loadAboutVideo = () => {
      if (aboutVideo.dataset.poster) {
        aboutVideo.poster = aboutVideo.dataset.poster;
        aboutVideo.removeAttribute('data-poster');
      }
      if (!aboutVideo.dataset.src) return;
      aboutVideo.src = aboutVideo.dataset.src;
      aboutVideo.removeAttribute('data-src');
      aboutVideo.play().catch(() => {});
    };
    if ('IntersectionObserver' in window) {
      const vio = new IntersectionObserver((entries, obs) => {
        entries.forEach(e => { if (e.isIntersecting) { loadAboutVideo(); obs.disconnect(); } });
      }, { rootMargin: '0px 0px 100px 0px', threshold: 0.01 });
      vio.observe(aboutVideo);
    } else {
      loadAboutVideo();
    }
  }

  /* ── Service cards video hover ─────────────────────────── */
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach(card => {
    const img = card.querySelector('.service-image');
    const video = card.querySelector('.service-video');
    
    if (img && video) {
      card.addEventListener('mouseenter', () => {
        img.style.display = 'none';
        video.style.display = 'block';
        video.play();
      });
      
      card.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
        video.style.display = 'none';
        img.style.display = 'block';
      });
    }
  });

});

/* mg-ia v1 (MediaGrowth): marca o lead que chegou por IA (ChatGPT, Perplexity, Gemini, Copilot, Claude).
   1ª visita vinda de IA fica guardada 30 dias; no envio do lead pro n8n vai ai_source/ai_referrer/ai_landing
   e, se o envio deu certo, dispara generate_lead no GA4. Não mexe em nenhum outro campo do formulário. */
(function () {
  var KEY = 'mg_ia', TTL = 30 * 864e5;
  var MAPA = [
    [/(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$|(^|\.)openai\.com$/, 'ChatGPT'],
    [/(^|\.)perplexity\.ai$/, 'Perplexity'],
    [/(^|\.)gemini\.google\.com$|(^|\.)bard\.google\.com$/, 'Gemini'],
    [/(^|\.)copilot\.microsoft\.com$|(^|\.)copilot\.cloud\.microsoft$/, 'Copilot'],
    [/(^|\.)claude\.ai$/, 'Claude']
  ];
  function qual(h) {
    h = String(h || '').toLowerCase().replace(/^www\./, '');
    for (var i = 0; i < MAPA.length; i++) if (MAPA[i][0].test(h)) return MAPA[i][1];
    return '';
  }
  function qualUtm(u) {
    u = String(u || '').toLowerCase();
    if (!u) return '';
    if (/chatgpt|openai/.test(u)) return 'ChatGPT';
    if (/perplexity/.test(u)) return 'Perplexity';
    if (/gemini|bard/.test(u)) return 'Gemini';
    if (/copilot/.test(u)) return 'Copilot';
    if (/claude/.test(u)) return 'Claude';
    return qual(u);
  }
  function setCookie(v) {
    try { document.cookie = KEY + '=' + encodeURIComponent(v) + ';max-age=' + (TTL / 1000) + ';path=/;SameSite=Lax' + (location.protocol === 'https:' ? ';Secure' : ''); } catch (e) {}
  }
  function getCookie() {
    var m = document.cookie.match(new RegExp('(?:^|; )' + KEY + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  function load() {
    var raw = '';
    try { raw = localStorage.getItem(KEY) || ''; } catch (e) {}
    if (!raw) raw = getCookie();
    try {
      var o = JSON.parse(raw || '{}');
      if (!o || !o.ia || !o._t || Date.now() - o._t > TTL) return null;
      return o;
    } catch (e) { return null; }
  }
  try {
    if (!load()) {
      var ref = document.referrer || '', host = '';
      try { host = ref ? new URL(ref).hostname : ''; } catch (e) {}
      var q = new URLSearchParams(location.search);
      var ia = qual(host) || qualUtm(q.get('utm_source'));
      if (ia) {
        var s = JSON.stringify({ ia: ia, ref: ref.slice(0, 200), land: (location.pathname + location.search).slice(0, 200), _t: Date.now() });
        try { localStorage.setItem(KEY, s); } catch (e) {}
        setCookie(s);
        if (window.gtag) try { gtag('set', 'user_properties', { ai_source: ia }); } catch (e) {}
      }
    }
  } catch (e) {}
  window.mgIa = function () {
    var o = load();
    return o ? { ai_source: o.ia, ai_referrer: o.ref || '', ai_landing: o.land || '' } : {};
  };
  function isLead(u) { return /easypanel\.host\/webhook\//.test(String(u || '')); }
  function enrich(body) {
    if (typeof body !== 'string') return body;
    try {
      var d = JSON.parse(body);
      if (!d || typeof d !== 'object' || Array.isArray(d)) return body;
      var c = window.mgIa();
      for (var k in c) if (!d[k]) d[k] = c[k];
      return JSON.stringify(d);
    } catch (e) { return body; }
  }
  function lead(body) {
    if (!window.gtag) return;
    try {
      var d = JSON.parse(body || '{}'), p = { lead_source: d.source || 'website' };
      if (d.ai_source) p.ai_source = d.ai_source;
      gtag('event', 'generate_lead', p);
    } catch (e) {}
  }
  if (window.fetch) {
    var f0 = window.fetch;
    window.fetch = function (input, init) {
      var u = '', lido = false;
      try {
        u = typeof input === 'string' ? input : (input && input.url);
        if (isLead(u) && init && init.body) { init = Object.assign({}, init, { body: enrich(init.body) }); lido = true; }
      } catch (e) {}
      var r = f0.call(this, input, init);
      if (lido && r && r.then) r.then(function (res) { if (res && res.ok) lead(init.body); }, function () {});
      return r;
    };
  }
})();
