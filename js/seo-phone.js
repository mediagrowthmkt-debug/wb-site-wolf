/* Wolf Carpenters · número de SEO só pra visita orgânica (Google/Bing/DDG/Yahoo)
 * Orgânico = referrer de buscador e SEM gclid/gbraid/wbraid/fbclid/msclkid/gad_source/utm_*.
 * A origem fica no sessionStorage: navegação interna e reload não sobrescrevem.
 * Não mexe em: rodapé (NAP), JSON-LD, nem página que já usa o 797-8315.
 * MediaGrowth · Frank · 2026-11-20 */
(function () {
  'use strict';
  var KEY = 'mg_origin_v1';
  var REAL = '9784193358';
  var SEO_HREF = 'tel:+19787978315';
  var SEO_DIGITS = '9787978315';
  var ENGINES = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.com|search\.yahoo\.com)$/i;
  var PAID = /[?&](gclid|gbraid|wbraid|fbclid|msclkid|gad_source|dclid|utm_[a-z_]+)=/i;

  function store(v) { try { sessionStorage.setItem(KEY, v); } catch (_) {} }
  function stored() { try { return sessionStorage.getItem(KEY); } catch (_) { return null; } }

  function refHost() {
    try { return document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''; } catch (_) { return ''; }
  }

  function origin() {
    var host = refHost();
    var self = location.hostname.toLowerCase();
    var external = host && host !== self && host.replace(/^www\./, '') !== self.replace(/^www\./, '');
    var hasParams = PAID.test(location.search);
    var prev = stored();
    if (prev && !external && !hasParams) return prev;
    var v = (!hasParams && external && ENGINES.test(host)) ? 'organic' : (external || hasParams ? 'other' : (prev || 'direct'));
    store(v);
    return v;
  }

  function swapText(node) {
    var re = /(\+?1[\s.\-]?)?(\(?)978(\)?[\s.\-]?)419([\s.\-]?)3358/g;
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
    var t;
    while ((t = walker.nextNode())) {
      if (re.test(t.nodeValue)) { re.lastIndex = 0; t.nodeValue = t.nodeValue.replace(re, '$1$2978$3797$48315'); }
      re.lastIndex = 0;
    }
    var al = node.getAttribute('aria-label');
    if (al && /419[\s.\-]?3358/.test(al)) node.setAttribute('aria-label', al.replace(/419([\s.\-]?)3358/g, '797$18315'));
  }

  function swap() {
    if (document.querySelector('a[href^="tel:"][href*="' + SEO_DIGITS + '"]:not([data-mg-phone])')) return;
    var links = document.querySelectorAll('a[href^="tel:"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (a.getAttribute('href').replace(/\D/g, '').slice(-10) !== REAL) continue;
      if (a.closest('footer, .site-footer, [data-phone-keep]')) continue;
      a.setAttribute('href', SEO_HREF);
      a.setAttribute('data-mg-phone', 'seo');
      swapText(a);
    }
  }

  var o = origin();
  window.MG_TRAFFIC_ORIGIN = o;
  document.documentElement.setAttribute('data-mg-origin', o);
  if (o !== 'organic') return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', swap);
  else swap();
})();
