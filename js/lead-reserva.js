/* lead-reserva (site Wolf) · envio reserva + sinais anti-spam do formulário. MediaGrowth · Frank · 2026-11-24
 * 1) Envio reserva: todo POST pro webhook do n8n (wolf-site-lead) que falhar, der erro (não 2xx) ou passar de 8 s
 *    vai, com o MESMO corpo, pra /api/lead-reserva.php (Hostinger). Se o principal responde OK, nada muda (sem lead duplicado).
 * 2) Anti-spam: anota quanto tempo a pessoa levou preenchendo (mg_fill_s) e se o campo escondido "company" veio
 *    preenchido (mg_hp). O lead suspeito NÃO some mais: segue com esses sinais e o n8n põe a etiqueta de revisão.
 * Carregar com defer ANTES de mg-clid.js (o mg-clid embrulha por fora e já entrega o corpo com a origem). No envio reserva
 * este arquivo mesmo completa os campos de IA (window.mgIa) e dispara o generate_lead no GA4, que o main.js só faz no principal. */
(function () {
  'use strict';
  if (!window.fetch || window.fetch.__mgReserva) return;
  var RESERVA = 'https://wolfcarpenters.com/api/lead-reserva.php';
  var LIMITE_MS = 8000;
  var t0 = Date.now();
  var inicio = (typeof WeakMap === 'function') ? new WeakMap() : null;
  var ultimo = { form: null, hp: '', em: 0 };

  function isLead(u) { return /\/webhook\/wolf-site-lead(\?|$)/.test(String(u || '')); }

  function marcaInicio(e) {
    var f = e.target && e.target.form;
    if (f && inicio && !inicio.has(f)) inicio.set(f, Date.now());
  }
  document.addEventListener('focusin', marcaInicio, true);
  document.addEventListener('input', marcaInicio, true);

  // captura (antes do handler do formulário): guarda o honeypot e limpa o campo pra o envio seguir com a marca de revisão
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.tagName !== 'FORM') return;
    var hp = f.querySelector('[name="company"]');
    ultimo = { form: f, hp: hp && hp.value ? String(hp.value).slice(0, 80) : '', em: Date.now() };
    if (hp && hp.value) hp.value = '';
  }, true);

  function sinais() {
    var f = ultimo.form, base = (f && inicio && inicio.get(f)) || t0;
    var s = { mg_fill_s: Math.max(0, Math.round((Date.now() - base) / 1000)) };
    if (ultimo.hp && Date.now() - ultimo.em < 60000) s.mg_hp = ultimo.hp;
    return s;
  }

  function anexa(body) {
    if (typeof body !== 'string') return body;
    try {
      var d = JSON.parse(body);
      if (!d || typeof d !== 'object' || Array.isArray(d)) return body;
      var s = sinais();
      for (var k in s) if (d[k] === undefined || d[k] === '') d[k] = s[k];
      if (!d.mg_envio_id) d.mg_envio_id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      return JSON.stringify(d);
    } catch (_) { return body; }
  }

  function vazio(body) {
    try { var d = JSON.parse(body); return !(String(d.name || '').trim() && (String(d.email || '').trim() || String(d.phone || '').trim())); }
    catch (_) { return false; }
  }

  function ok(via) {
    return new Response(JSON.stringify({ ok: true, via: via }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  var f0 = window.fetch;
  var f1 = function (input, init) {
    var u = typeof input === 'string' ? input : (input && input.url);
    if (!isLead(u) || !init || typeof init.body !== 'string') return f0.apply(this, arguments);
    var body = anexa(init.body);
    // nunca manda lead vazio (sem nome ou sem telefone/e-mail) pro webhook
    if (vazio(body)) return Promise.resolve(new Response('{"ok":false,"error":"empty"}', { status: 422, headers: { 'Content-Type': 'application/json' } }));
    var opts = Object.assign({}, init, { body: body });
    var self = this;

    function reserva(motivo) {
      var d; try { d = JSON.parse(body); } catch (_) { d = {}; }
      d.mg_reserva_motivo = motivo;
      try { var ia = window.mgIa ? window.mgIa() : {}; for (var k in ia) if (!d[k]) d[k] = ia[k]; } catch (_) {}
      return f0.call(self, RESERVA, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d), keepalive: true })
        .then(function (r) {
          if (!(r && r.ok)) throw new Error('reserva ' + (r && r.status));
          try { if (window.gtag) window.gtag('event', 'generate_lead', { lead_source: d.source || 'website', lead_path: 'reserva' }); } catch (_) {}
          return ok('reserva');
        });
    }

    return new Promise(function (resolve, reject) {
      var feito = false, ctl = (typeof AbortController === 'function') ? new AbortController() : null;
      if (ctl) opts.signal = ctl.signal;
      var timer = setTimeout(function () {
        if (feito) return; feito = true;
        if (ctl) try { ctl.abort(); } catch (_) {}
        reserva('timeout').then(resolve, reject);
      }, LIMITE_MS);
      f0.call(self, u, opts).then(function (r) {
        if (feito) return; feito = true; clearTimeout(timer);
        if (r && r.ok) return resolve(r);
        reserva('http_' + (r && r.status)).then(resolve, function () { resolve(r); });
      }, function (err) {
        if (feito) return; feito = true; clearTimeout(timer);
        reserva('rede').then(resolve, function () { reject(err); });
      });
    });
  };
  f1.__mgReserva = true;
  window.fetch = f1;
})();
