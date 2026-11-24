/* mg-perf (site Wolf) · página mais leve sem mudar o visual. MediaGrowth · Frank · 2026-11-24
 * 1) reCAPTCHA (≈380 KB) só carrega quando a pessoa vai usar o formulário: abre o popup, chega perto de um
 *    formulário com captcha, foca num campo ou faz a primeira interação (toque, rolagem, tecla).
 * 2) Vídeos marcados com data-mg-autoplay (antes eram autoplay) só baixam e tocam depois que a página carregou
 *    e quando aparecem na tela; pausam fora da tela. Até lá fica o poster. */
(function () {
  'use strict';
  var rc = false;
  function carregaRecaptcha() {
    if (rc) return; rc = true;
    if (window.grecaptcha && window.grecaptcha.render) return;
    var s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js';
    s.async = true; s.defer = true;
    document.head.appendChild(s);
  }
  window.mgCarregaRecaptcha = carregaRecaptcha;
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && t.closest && t.closest('[data-leadsite-open],[data-lead-open],a[href*="#lead"],a[href*="#quote"]')) carregaRecaptcha();
  }, true);
  document.addEventListener('focusin', function (e) {
    var f = e.target && e.target.form;
    if (f && f.querySelector('.g-recaptcha')) carregaRecaptcha();
  }, true);
  ['scroll', 'pointerdown', 'touchstart', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function um() { window.removeEventListener(ev, um, true); carregaRecaptcha(); }, { capture: true, passive: true });
  });
  function observaCaptcha() {
    var els = document.querySelectorAll('.g-recaptcha');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { carregaRecaptcha(); return; }
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { carregaRecaptcha(); io.disconnect(); }
    }, { rootMargin: '600px' });
    els.forEach(function (el) { io.observe(el); });
  }

  function tocaVideos() {
    var vs = Array.prototype.slice.call(document.querySelectorAll('video[data-mg-autoplay]'));
    if (!vs.length) return;
    function play(v) {
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
    if (!('IntersectionObserver' in window)) { vs.forEach(play); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) play(v); else if (!v.paused) v.pause();
      });
    }, { threshold: 0.25 });
    vs.forEach(function (v) { io.observe(v); });
  }

  function aposCarregar() { setTimeout(tocaVideos, 300); }
  if (document.readyState === 'complete') aposCarregar(); else window.addEventListener('load', aposCarregar);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observaCaptcha); else observaCaptcha();
})();
