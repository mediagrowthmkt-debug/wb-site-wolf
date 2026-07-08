/* ================================================
 * MG Analytics v1.3 — eventos custom GA4 + Clarity
 * Frank · MediaGrowth · NÃO EDITAR SEM AVISAR
 * 7 comportamento + 5 conversão (call/whatsapp/
 * free_estimate/form_start/form_submit) — SEMPRE
 * ================================================ */
(function() {
  'use strict';

  if (typeof gtag === 'undefined') {
    console.warn('[mg-analytics] gtag não disponível — GA4 não carregou.');
    return;
  }

  // Helper unificado: envia pro GA4 + tag custom no Clarity
  function track(eventName, params) {
    try {
      gtag('event', eventName, params || {});
      if (typeof clarity === 'function') {
        clarity('event', eventName);
        // Set custom tag pra filtrar sessions no painel Clarity
        if (params && params.label) clarity('set', eventName, String(params.label));
      }
    } catch (e) { console.warn('[mg-analytics]', e); }
  }

  // 1. SCROLL DEPTH (25, 50, 75, 100)
  const scrollMarks = [25, 50, 75, 100];
  const scrollFired = new Set();
  function onScroll() {
    const h = document.documentElement;
    const scrolled = (h.scrollTop + window.innerHeight) / h.scrollHeight * 100;
    scrollMarks.forEach(mark => {
      if (scrolled >= mark && !scrollFired.has(mark)) {
        scrollFired.add(mark);
        track('scroll_depth', { percent: mark, label: mark + '%' });
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // 2. CTA CLICK — qualquer elemento com data-track ou class="cta"
  document.addEventListener('click', function(e) {
    const el = e.target.closest('[data-track], .cta, .btn-cta, button[type="submit"]');
    if (!el) return;
    const name = el.dataset.track || el.textContent.trim().slice(0, 50) || 'cta_sem_nome';
    track('cta_click', {
      label: name,
      cta_text: el.textContent.trim().slice(0, 100),
      cta_href: el.href || null,
      cta_id:   el.id   || null
    });
  });

  // 3. FORM SUBMIT — todos os <form> da página
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    const formName = form.id || form.name || form.dataset.formName || 'form_sem_nome';
    track('form_submit', {
      label: formName,
      form_id: form.id || null,
      form_action: form.action || null,
      page_url: window.location.href
    });
    // Tag dedicada pra Clarity filtrar sessões que converteram
    if (typeof clarity === 'function') clarity('set', 'converted', 'true');
  });

  // 4. OUTBOUND LINK (clique em link pra outro domínio)
  document.addEventListener('click', function(e) {
    const a = e.target.closest('a[href]');
    if (!a || !a.href) return;
    try {
      const url = new URL(a.href, window.location.href);
      if (url.host && url.host !== window.location.host) {
        track('outbound_click', {
          label: url.host,
          outbound_url: a.href,
          link_text: a.textContent.trim().slice(0, 80)
        });
      }
    } catch (_) {}
  });

  // 5. ENGAGEMENT TIME (manda a cada 30s ativos — não conta aba em background)
  let engagedSec = 0;
  let lastTick = Date.now();
  let isVisible = document.visibilityState === 'visible';
  document.addEventListener('visibilitychange', function() {
    isVisible = document.visibilityState === 'visible';
    lastTick = Date.now();
  });
  setInterval(function() {
    const now = Date.now();
    if (isVisible) engagedSec += Math.round((now - lastTick) / 1000);
    lastTick = now;
    if (engagedSec >= 30) {
      track('engagement_30s', { label: '30s_active' });
      engagedSec = 0;
    }
  }, 5000);

  // 6. PAGE VIEW ENRIQUECIDO — manda referrer + utm na 1ª view
  (function() {
    const params = new URLSearchParams(window.location.search);
    track('page_view_mg', {
      page_url:    window.location.href,
      page_title:  document.title,
      referrer:    document.referrer || '(direct)',
      utm_source:  params.get('utm_source')  || null,
      utm_medium:  params.get('utm_medium')  || null,
      utm_campaign:params.get('utm_campaign')|| null,
      utm_content: params.get('utm_content') || null
    });
  })();

  // 7. HASH CHANGE (SPA / âncora) — útil pra LPs que mudam de seção via #
  window.addEventListener('hashchange', function() {
    track('hash_change', {
      label: window.location.hash || '(removed)',
      new_url: window.location.href
    });
  });

  /* ============================================================
   * CONVERSÕES MG — 5 eventos NOMEADOS e OBRIGATÓRIOS (v1.3)
   * SEMPRE presentes em toda LP. Nomes fixos p/ marcar como
   * conversão no GA4. Auto-detecção + override por LP via
   * window.MG_CONV_CFG (seletores). Medir clique nos botões
   * importantes de cada LP não é opcional.
   * ============================================================ */
  var CFG = (window.MG_CONV_CFG || {});
  var SEL = {
    call:     CFG.call     || 'a[href^="tel:"], [data-cta="call"]',
    whatsapp: CFG.whatsapp || 'a[href*="wa.me"], a[href*="whatsapp.com"], a[href*="api.whatsapp"], [data-cta="whatsapp"]',
    estimate: CFG.estimate || '[data-cta="free_estimate"], [data-track="free_estimate"]',
    form:     CFG.form     || 'form[data-form="free_estimate"]'
  };
  // Texto de botão que denota "orçamento / free estimate" (PT + EN) quando não há data-attr
  var ESTIMATE_TXT = CFG.estimateText ||
    /(free\s*(estimate|quote)|get\s*(a\s*)?(free\s*)?(estimate|quote)|request\s*(an?\s*)?estimate|book\s*(a\s*)?(free\s*)?(estimate|quote)|or[çc]amento(\s*(gr[áa]tis|gratuito))?|solicitar\s*or[çc]amento|pe[çc]a\s*(seu\s*)?or[çc]amento)/i;

  function hit(el, sel) { try { return el && el.closest ? el.closest(sel) : null; } catch (_) { return null; } }
  function actionable(el) { return el && el.closest ? el.closest('a, button, [role="button"], .btn, .cta, .btn-cta, input[type="submit"]') : null; }

  // click_call · click_whatsapp · click_free_estimate — 1 listener (capture p/ sobreviver a stopPropagation)
  document.addEventListener('click', function(e) {
    var t = e.target;
    var call = hit(t, SEL.call);
    if (call) track('click_call', { label: 'call', link_href: call.href || null, link_text: (call.textContent || '').trim().slice(0, 80) });
    var wa = hit(t, SEL.whatsapp);
    if (wa) track('click_whatsapp', { label: 'whatsapp', link_href: wa.href || null, link_text: (wa.textContent || '').trim().slice(0, 80) });
    var est = hit(t, SEL.estimate);
    if (!est) { var b = actionable(t); if (b && b !== call && b !== wa && ESTIMATE_TXT.test((b.textContent || '').trim())) est = b; }
    if (est && est !== call && est !== wa) track('click_free_estimate', { label: 'free_estimate', cta_text: (est.textContent || '').trim().slice(0, 100), cta_href: est.href || null, cta_id: est.id || null });
  }, true);

  // Resolve o formulário de orçamento: data-form > match id/name/action/classe > 1º form da página
  function estimateForm() {
    var f = document.querySelector(SEL.form);
    if (f) return f;
    var forms = Array.prototype.slice.call(document.querySelectorAll('form'));
    var byMeta = forms.filter(function(fm) {
      var s = ((fm.id || '') + ' ' + (fm.name || '') + ' ' + (fm.getAttribute('action') || '') + ' ' + (fm.className || '')).toLowerCase();
      return /estimate|quote|or[çc]ament/.test(s);
    });
    if (byMeta.length) return byMeta[0];
    return forms.length ? forms[0] : null; // LP costuma ter 1 form = o de orçamento
  }

  // form_start_free_estimate — dispara UMA vez no 1º foco de campo do form de orçamento
  var estStarted = false;
  document.addEventListener('focusin', function(e) {
    if (estStarted) return;
    var fld = e.target.closest && e.target.closest('input, textarea, select');
    if (!fld) return;
    var f = estimateForm();
    if (f && f.contains(fld)) {
      estStarted = true;
      track('form_start_free_estimate', { label: 'free_estimate', form_id: f.id || f.name || null });
    }
  }, true);

  // form_submit_free_estimate — no submit do form de orçamento (+ tag no Clarity)
  document.addEventListener('submit', function(e) {
    var f = e.target;
    if (!f || f.tagName !== 'FORM') return;
    var est = estimateForm();
    if (est && f === est) {
      track('form_submit_free_estimate', { label: 'free_estimate', form_id: f.id || f.name || null, page_url: window.location.href });
      if (typeof clarity === 'function') clarity('set', 'free_estimate_submit', 'true');
    }
  }, true);

  console.log('✅ mg-analytics v1.3 ativo (7 comportamento + 5 conversão)');
})();
