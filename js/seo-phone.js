/* Wolf Carpenters · origem da visita + telefone por origem (mapa único MediaGrowth, igual ao do CRM)
 * Origem (1ª página da sessão; navegação interna mantém; nova entrada com parâmetro de campanha regrava):
 *   1) gclid/gbraid/wbraid .............................. google-ads
 *   2) fbclid ou utm_source=facebook/instagram/fb/ig/meta meta-ads
 *   3) utm_source=pinterest ............................. pinterest-ads
 *   4) utm_source=gbp ................................... gbp
 *   5) utm_medium=cpc/ppc ............................... google-ads
 *   referrer de buscador sem nenhum parâmetro acima .... seo
 *   resto (direto, outros sites, outras utm) ........... site
 * Telefone nos botões (fora do rodapé e do JSON-LD, que ficam com o NAP 419-3358):
 *   google-ads 781-650-9187 · gbp 978-915-7190 · seo 978-797-8315 · demais 978-717-0502 (padrão do HTML)
 * Expõe window.MG_TRAFFIC_ORIGIN, window.MG_ATTR e window.MG_PHONE.
 * MediaGrowth · Frank · 2026-11-22 (v2.1: ordem igual ao n8n v2) */
(function () {
  'use strict';
  var KEY = 'mg_attr_v2';
  var PHONES = {
    'google-ads': '7816509187',
    'gbp': '9789157190',
    'seo': '9787978315',
    'meta-ads': '9787170502',
    'pinterest-ads': '9787170502',
    'site': '9787170502'
  };
  var SWAPPABLE = ['9787170502', '9784193358', '9787978315', '7816509187', '9789157190', '7813364594'];
  var ENGINES = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.com|search\.yahoo\.com|ecosia\.org|search\.brave\.com)$/i;
  var FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid', 'fbclid'];

  function load() { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (_) { return null; } }
  function save(o) { try { sessionStorage.setItem(KEY, JSON.stringify(o)); } catch (_) {} }
  function refHost() { try { return document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''; } catch (_) { return ''; } }

  function classify(p, host) {
    var src = (p.utm_source || '').toLowerCase(), med = (p.utm_medium || '').toLowerCase();
    if (p.gclid || p.gbraid || p.wbraid) return 'google-ads';
    if (p.fbclid || src === 'facebook' || src === 'instagram' || src === 'fb' || src === 'ig' || src === 'meta') return 'meta-ads';
    if (src === 'pinterest') return 'pinterest-ads';
    if (src === 'gbp') return 'gbp';
    if (med === 'cpc' || med === 'ppc') return 'google-ads';
    var anyUtm = FIELDS.some(function (k) { return k.indexOf('utm_') === 0 && p[k]; });
    if (!anyUtm && host && ENGINES.test(host)) return 'seo';
    return 'site';
  }

  function current() {
    var q, p = {}, has = false;
    try { q = new URLSearchParams(location.search); } catch (_) { q = null; }
    FIELDS.forEach(function (k) { var v = q && q.get(k); if (v) { p[k] = v; has = true; } });
    var prev = load();
    if (prev && prev.mg_origin && !has) return prev;
    var host = refHost();
    var self = location.hostname.toLowerCase().replace(/^www\./, '');
    if (host.replace(/^www\./, '') === self) host = '';
    var o = { mg_origin: classify(p, host), landing_page: location.href, referrer: document.referrer || '' };
    FIELDS.forEach(function (k) { o[k] = p[k] || ''; });
    save(o);
    return o;
  }

  function fmt(oldText, d) {
    var a = d.slice(0, 3), b = d.slice(3, 6), c = d.slice(6);
    return oldText.replace(/(\(?)(\d{3})(\)?[\s.\-]?)(\d{3})([\s.\-]?)(\d{4})/, function (m, p1, x, p3, y, p5) { return p1 + a + p3 + b + p5 + c; });
  }
  function swapNode(el, d) {
    var re = /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), t;
    while ((t = walker.nextNode())) { if (re.test(t.nodeValue)) t.nodeValue = fmt(t.nodeValue, d); }
    var al = el.getAttribute('aria-label');
    if (al && re.test(al)) el.setAttribute('aria-label', fmt(al, d));
  }
  function swap(d) {
    var links = document.querySelectorAll('a[href^="tel:"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var cur = a.getAttribute('href').replace(/\D/g, '').slice(-10);
      if (SWAPPABLE.indexOf(cur) < 0 || cur === d) continue;
      if (a.closest('footer, .site-footer, [data-phone-keep]')) continue;
      a.setAttribute('href', 'tel:+1' + d);
      a.setAttribute('data-mg-phone', d);
      swapNode(a, d);
    }
  }

  var attr = current();
  window.MG_ATTR = attr;
  window.MG_TRAFFIC_ORIGIN = attr.mg_origin;
  window.MG_PHONE = PHONES[attr.mg_origin] || PHONES.site;
  document.documentElement.setAttribute('data-mg-origin', attr.mg_origin);
  var run = function () { swap(window.MG_PHONE); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
