/* ============================================================
   WOLF CARPENTERS — main.js
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

  /* ── Form submit feedback ──────────────────────────────── */
  const forms = document.querySelectorAll('form[data-feedback]');
  forms.forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const msg = form.querySelector('.form-success');
      if (msg) {
        msg.style.display = 'block';
        form.querySelectorAll('input,textarea,select').forEach(f => (f.value = ''));
        setTimeout(() => (msg.style.display = 'none'), 5000);
      }
    });
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
