/* mg-clid (site Wolf) · anexa a origem da visita no POST do lead (webhook n8n), sem mexer nos campos do formulário.
 * Campos: mg_origin, utm_source, utm_medium, utm_campaign, gclid, gbraid, wbraid, fbclid, landing_page.
 * Lê window.MG_ATTR (js/seo-phone.js) ou o sessionStorage mg_attr_v2. Nunca sobrescreve um campo que o form já mandou.
 * MediaGrowth · Frank · 2026-11-22 */
(function () {
  'use strict';
  var SEND = ['mg_origin', 'utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'landing_page'];
  function attr() {
    var o = window.MG_ATTR;
    if (!o) { try { o = JSON.parse(sessionStorage.getItem('mg_attr_v2') || 'null'); } catch (_) { o = null; } }
    o = o || { mg_origin: 'site', landing_page: location.href };
    var r = {};
    SEND.forEach(function (k) { r[k] = o[k] || ''; });
    if (!r.mg_origin) r.mg_origin = 'site';
    return r;
  }
  window.mgLeadAttr = attr;
  function isLead(u) { return /easypanel\.host\/webhook\//.test(String(u || '')); }
  function enrich(body) {
    if (typeof body !== 'string') return body;
    try {
      var d = JSON.parse(body);
      if (!d || typeof d !== 'object' || Array.isArray(d)) return body;
      var a = attr();
      for (var k in a) if (d[k] === undefined || d[k] === null || d[k] === '') d[k] = a[k];
      return JSON.stringify(d);
    } catch (_) { return body; }
  }
  if (window.fetch && !window.fetch.__mgClid) {
    var f0 = window.fetch;
    var f1 = function (input, init) {
      try {
        var u = typeof input === 'string' ? input : (input && input.url);
        if (isLead(u) && init && init.body) init = Object.assign({}, init, { body: enrich(init.body) });
      } catch (_) {}
      return f0.call(this, input, init);
    };
    f1.__mgClid = true;
    window.fetch = f1;
  }
  if (navigator.sendBeacon) {
    var b0 = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (u, data) {
      try { if (isLead(u) && typeof data === 'string') data = enrich(data); } catch (_) {}
      return b0(u, data);
    };
  }
})();
