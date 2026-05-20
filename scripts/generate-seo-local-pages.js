const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const BASE_URL = "https://wolfcarpenters.com";
const GA4_ID = "G-F1Z5VEGBBJ";
const GBP_URL = "https://share.google/Gc7Nx6ebbkfFhPbK9";
const PHONE_DISPLAY = "+1 978-419-3358";
const PHONE_TEL = "+19784193358";
const EMAIL = "info@wolfcarpenters.com";
const ADDRESS = {
  streetAddress: "17 Mason St",
  addressLocality: "Peabody",
  addressRegion: "MA",
  postalCode: "01960",
  addressCountry: "US",
};

const cities = [
  "Peabody",
  "Salem",
  "Danvers",
  "Beverly",
  "Lynn",
  "Marblehead",
  "Swampscott",
  "Saugus",
  "Wakefield",
  "Lynnfield",
  "Middleton",
  "Topsfield",
  "Boxford",
  "Hamilton",
  "Wenham",
  "Manchester-by-the-Sea",
  "Essex",
  "Gloucester",
  "Rockport",
  "Ipswich",
  "Rowley",
  "Georgetown",
  "Newburyport",
  "Amesbury",
  "Andover",
  "North Andover",
  "Haverhill",
  "Groveland",
  "Woburn",
  "Burlington",
  "Wilmington",
  "Tewksbury",
  "Winchester",
  "Lexington",
  "Arlington",
  "Cambridge",
  "Somerville",
  "Medford",
  "Malden",
  "Everett",
  "Reading",
  "Melrose",
  "Stoneham",
  "Boston",
  "Chelsea",
  "Winthrop",
  "Revere",
  "Nahant",
];

const services = [
  {
    name: "Kitchen Remodeling",
    slug: "kitchen-remodeling",
    pillar: "services/kitchen-remodeling.html",
    serviceType: "Kitchen renovation",
    image: "/images/wp-uploads/2024/06/KITCHEN.jpg",
    benefits: ["custom cabinetry", "countertops", "backsplash installation", "layout redesign"],
  },
  {
    name: "Bathroom Remodeling",
    slug: "bathroom-remodeling",
    pillar: "services/bathroom-remodeling.html",
    serviceType: "Bathroom renovation",
    image: "/images/wp-uploads/2024/06/BATHROOM.jpg",
    benefits: ["tile installation", "shower builds", "vanities", "waterproofing"],
  },
  {
    name: "Home Remodeling",
    slug: "home-remodeling",
    pillar: "services/home-remodeling.html",
    serviceType: "Residential remodeling",
    image: "/images/wp-uploads/2024/06/RESIDENCIAL.jpg",
    benefits: ["interior renovations", "custom carpentry", "trim work", "finish upgrades"],
  },
  {
    name: "Home Addition",
    slug: "home-addition",
    pillar: "services/addition.html",
    serviceType: "Home addition construction",
    image: "/videos/our-services/additions-1.webp",
    benefits: ["room additions", "framing", "structural coordination", "finish carpentry"],
  },
  {
    name: "Deck Installation",
    slug: "deck-installation",
    pillar: "services/deck-installation.html",
    serviceType: "Deck construction",
    image: "/images/wp-uploads/2024/06/DECK.jpg",
    benefits: ["deck framing", "composite decking", "wood decking", "railings"],
  },
  {
    name: "General Contractor",
    slug: "general-contractors",
    pillar: "services/general-contractors.html",
    serviceType: "General contracting",
    image: "/images/wp-uploads/2024/05/11.jpg",
    benefits: ["project management", "renovation planning", "trade coordination", "construction oversight"],
  },
];

const staticPages = [
  "",
  "about.html",
  "services.html",
  "blog.html",
  "contact.html",
  "services/kitchen-remodeling.html",
  "services/bathroom-remodeling.html",
  "services/home-remodeling.html",
  "services/addition.html",
  "services/deck-installation.html",
  "services/general-contractors.html",
  "services/commercial-services.html",
  "blog/5-signs-kitchen-remodel.html",
  "blog/bathroom-renovation-guide.html",
  "blog/composite-vs-wood-deck.html",
  "blog/custom-built-ins-vs-ikea.html",
  "blog/hardwood-flooring-guide.html",
  "blog/wall-prep-before-painting.html",
  "service-areas/",
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Convert a file path like "services/kitchen-remodeling.html" into the public
// URL "/services/kitchen-remodeling". index.html (root or nested) → "/" or "/dir/".
function prettyPath(filePath) {
  if (!filePath || filePath === "" || filePath === "/") return "/";
  let p = filePath.startsWith("/") ? filePath : `/${filePath}`;
  p = p.replace(/\/index\.html$/i, "/");
  p = p.replace(/\.html$/i, "");
  return p;
}

function prettyUrl(filePath) {
  return `${BASE_URL}${prettyPath(filePath)}`;
}

// Public URL for a service's pillar page (no .html).
function pillarUrl(service) {
  return prettyUrl(service.pillar);
}

function writeFile(relativePath, content) {
  const target = path.join(ROOT, relativePath);
  writeFileSafe(target, content);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function readFileSafe(file) {
  let lastError;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      return fs.readFileSync(file, "utf8");
    } catch (error) {
      lastError = error;
      sleep(150 * (attempt + 1));
    }
  }
  try {
    return execFileSync("/Users/bruno/mg-mirror/bin/mg-read", [file], {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (error) {
    lastError = error;
  }
  throw lastError;
}

function writeFileSafe(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = path.join("/tmp", `wolf-seo-${process.pid}-${Date.now()}-${path.basename(file)}`);
  fs.writeFileSync(tmp, content);
  let lastError;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      fs.copyFileSync(tmp, file);
      try { fs.unlinkSync(tmp); } catch (_) {}
      return;
    } catch (error) {
      lastError = error;
      sleep(200 * (attempt + 1));
    }
  }
  try {
    fs.writeFileSync(file, content);
    try { fs.unlinkSync(tmp); } catch (_) {}
    return;
  } catch (error) {
    lastError = error;
  }
  throw lastError;
}

function ga4Tag() {
  return `  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA4_ID}');
  </script>`;
}

function businessSchema(extra = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: "Wolf Carpenters",
    url: BASE_URL,
    telephone: PHONE_DISPLAY,
    image: `${BASE_URL}/images/wp-uploads/2024/05/logo-wolf-mobile.png`,
    address: {
      "@type": "PostalAddress",
      ...ADDRESS,
    },
    openingHoursSpecification: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ].map((dayOfWeek) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek,
      opens: "07:00",
      closes: "17:00",
    })),
    sameAs: [GBP_URL, "https://www.instagram.com/wolfcarpenters/"],
    areaServed: cities.map((city) => ({ "@type": "City", name: `${city}, MA` })),
    priceRange: "$$",
    ...extra,
  };
}

function jsonLd(data) {
  return `<script type="application/ld+json">
${JSON.stringify(data, null, 2)}
  </script>`;
}

function ensureGa4(html) {
  if (html.includes(GA4_ID)) return html;
  return html.replace("</head>", `${ga4Tag()}\n</head>`);
}

function ensureSeoCss(html, prefix = "") {
  if (html.includes("seo-local.css")) return html;
  const href = `${prefix}css/seo-local.css`;
  return html.replace("</head>", `  <link rel="stylesheet" href="${href}" />\n</head>`);
}

function ensureBusinessSchema(html, relativeUrl) {
  if (html.includes('"@type": "HomeAndConstructionBusiness"')) return html;
  // Build a pretty URL (no .html) so the schema @id matches the public canonical.
  const cleanPath = prettyPath(relativeUrl === "" ? "/" : relativeUrl);
  const cleanUrl = `${BASE_URL}${cleanPath}`;
  const schema = jsonLd(businessSchema({ "@id": `${cleanUrl}#business` }));
  return html.replace("</head>", `  <!-- Local Business Schema -->\n  ${schema}\n</head>`);
}

function updateExistingHtml() {
  const htmlFiles = walk(ROOT).filter((file) => file.endsWith(".html"));
  let touched = 0;
  for (const file of htmlFiles) {
    const relative = path.relative(ROOT, file).replace(/\\/g, "/");
    // Skip pages we re-generate from scratch in this run.
    if (relative.startsWith("service-areas/")) continue;
    if (relative.startsWith("services/")) {
      const parts = relative.split("/");
      // Skip generated matrix subfolder pages (services/<service>/<city>-ma/index.html)
      if (parts.length === 4 && parts[3] === "index.html") continue;
      // Skip the regenerated deck pillar (we re-write it below)
      if (relative === "services/deck-installation.html") continue;
    }
    let html;
    try {
      html = readFileSafe(file);
    } catch (error) {
      console.log(`!! skip ${relative} (read error: ${error.message})`);
      continue;
    }
    const before = html;
    html = ensureGa4(html);
    const depth = relative.split("/").length - 1;
    html = ensureSeoCss(html, depth > 0 ? "../".repeat(depth) : "");
    html = html.replace(/Greater Boston/g, "Peabody, MA & North Shore");
    html = html.replace(/Peabody, MA, Greater Boston/g, "17 Mason St, Peabody, MA 01960");
    html = html.replace(/<div class="footer-contact__text"><strong>Location<\/strong>Peabody, MA<\/div>/g, '<div class="footer-contact__text"><strong>Location</strong>17 Mason St, Peabody, MA 01960</div>');
    if (["index.html", "contact.html", "about.html"].includes(relative) || relative.startsWith("services/")) {
      html = ensureBusinessSchema(html, relative === "index.html" ? "" : relative.replace(/index\.html$/, ""));
    }
    if (html !== before) {
      writeFileSafe(file, html);
      touched += 1;
    }
  }
  console.log(`updateExistingHtml: touched ${touched} files`);
}

function areaLinks(prefix) {
  // `prefix` is the slug fragment for the service (e.g. "kitchen-remodeling/").
  // We emit path-absolute hrefs so the link works whether the visitor lands on
  // /services/<slug>, /services/<slug>.html, or any matrix child page.
  return cities
    .map((city) => `<a href="/services/${prefix}${slugify(city)}-ma/">${city}, MA</a>`)
    .join("\n");
}

function injectAreaSection(service) {
  const file = path.join(ROOT, service.pillar);
  if (!fs.existsSync(file)) return;
  let html = readFileSafe(file);
  // If the section is already there, strip the old one so we can re-inject with
  // updated link format. The marker class `seo-service-areas` is stable.
  if (html.includes("seo-service-areas")) {
    html = html.replace(
      /\n?<section class="section seo-service-areas">[\s\S]*?<\/section>\n?/,
      "\n"
    );
  }
  const cityLinks = areaLinks(`${service.slug}/`);
  const section = `
<section class="section seo-service-areas">
  <div class="container">
    <div class="section-tag">Service Areas</div>
    <h2>${service.name} across Peabody, MA & North Shore</h2>
    <p class="section-subtitle">Wolf Carpenters serves homeowners across ${cities.length} priority cities around Peabody with an in-house crew and local project experience.</p>
    <div class="seo-city-grid">
${cityLinks}
    </div>
  </div>
</section>
`;
  if (html.includes('id="contact-form"')) {
    html = html.replace(/<section class="section"[^>]*id="contact-form"[^>]*>/, `${section}\n$&`);
  } else {
    html = html.replace("</main>", `${section}\n</main>`);
  }
  writeFileSafe(file, html);
}

// ──────────────────────────────────────────────────────────────
// PAGE SHELL — uses the REAL Wolf header/footer markup
// ──────────────────────────────────────────────────────────────

function pageShell({ title, description, canonical, schema, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonical}" />

  <!-- Favicon -->
  <link rel="icon" href="/images/wp-uploads/2024/05/cropped-logo-wolf-desktop-32x32.png" />

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Roboto+Condensed:wght@700;900&display=swap" rel="stylesheet" />

  <!-- Styles -->
  <link rel="stylesheet" href="/css/styles.css" />
  <link rel="stylesheet" href="/css/seo-local.css" />

  <!-- Open Graph -->
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${BASE_URL}/images/wp-uploads/2024/05/logo-wolf-mobile.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />

${ga4Tag()}

${schema.map(jsonLd).join("\n")}
</head>
<body>
${topBar()}
${header()}
${body}
${footer()}
${floatingCtas()}
<script src="/js/main.js"></script>
</body>
</html>
`;
}

// ──────────────────────────────────────────────────────────────
// PARTIALS — extracted verbatim from index.html with URLs upgraded to absolute
// ──────────────────────────────────────────────────────────────

function topBar() {
  return `
<!-- ════════════════════════════════════════════════════════
     TOP BAR
════════════════════════════════════════════════════════ -->
<div class="topbar">
  <div class="container">
    <div class="topbar__left">
      <a href="tel:${PHONE_TEL}" class="topbar__item">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.5 11.5 0 003.61.58 1 1 0 011 1V21a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.26.2 2.49.58 3.61a1 1 0 01-.25 1.01l-2.21 2.17z"/></svg>
        ${PHONE_DISPLAY}
      </a>
      <a href="mailto:${EMAIL}" class="topbar__item">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm8 7L4 6h16l-8 5z"/></svg>
        ${EMAIL}
      </a>
    </div>
    <div class="topbar__right">
      <a href="https://www.instagram.com/wolfcarpenters/" class="topbar__item" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        @wolfcarpenters
      </a>
      <span class="topbar__item">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
        Peabody, MA
      </span>
    </div>
  </div>
</div>`;
}

function header() {
  return `
<!-- ════════════════════════════════════════════════════════
     HEADER / NAV
════════════════════════════════════════════════════════ -->
<header class="site-header" id="site-header">
  <div class="container">
    <nav class="nav">

      <!-- Logo -->
      <a href="/" class="nav__logo" aria-label="Wolf Carpenters Home">
        <img src="/images/wp-uploads/2024/05/logo-wolf-desktop.png"
             alt="Wolf Carpenters Logo" width="160" height="161" fetchpriority="high" />
      </a>

      <!-- Desktop links -->
      <ul class="nav__links">
        <li><a href="/">Home</a></li>
        <li><a href="/about">About Us</a></li>
        <li class="nav__dropdown">
          <a href="/services" aria-haspopup="true" aria-expanded="false" aria-controls="services-dropdown">Services
            <svg viewBox="0 0 10 6"><path d="M1 1l4 4 4-4"/></svg>
          </a>
          <div class="dropdown-menu" id="services-dropdown">
            <a href="/services/general-contractors" class="dropdown-item">
              <div class="icon"><img src="/images/wp-uploads/2024/05/11-150x150.jpg" alt="" loading="lazy" width="150" height="150" /></div>
              <span>General Contractors</span>
            </a>
            <a href="/services/commercial-services" class="dropdown-item">
              <div class="icon"><img src="/images/wp-uploads/2024/06/COMERCIAL-150x150.jpg" alt="" loading="lazy" width="150" height="150" /></div>
              <span>Commercial Services</span>
            </a>
            <a href="/services/home-remodeling" class="dropdown-item">
              <div class="icon"><img src="/images/wp-uploads/2024/06/RESIDENCIAL-150x150.jpg" alt="" loading="lazy" width="150" height="150" /></div>
              <span>Home Remodeling</span>
            </a>
            <a href="/services/kitchen-remodeling" class="dropdown-item">
              <div class="icon"><img src="/images/wp-uploads/2024/06/KITCHEN-150x150.jpg" alt="" loading="lazy" width="150" height="150" /></div>
              <span>Kitchen Remodeling</span>
            </a>
            <a href="/services/bathroom-remodeling" class="dropdown-item">
              <div class="icon"><img src="/images/wp-uploads/2024/06/BATHROOM-150x150.jpg" alt="" loading="lazy" width="150" height="150" /></div>
              <span>Bathroom Remodeling</span>
            </a>
            <a href="/services/addition" class="dropdown-item">
              <div class="icon"><img src="/videos/our-services/additions-1.webp" alt="" loading="lazy" width="150" height="150" /></div>
              <span>Home Addition</span>
            </a>
            <a href="/services/deck-installation" class="dropdown-item">
              <div class="icon"><img src="/images/wp-uploads/2024/06/DECK-150x150.jpg" alt="" loading="lazy" width="150" height="150" /></div>
              <span>Deck Installation</span>
            </a>
            <div class="dropdown-all">
              <a href="/services" class="btn btn--gold btn--sm">View All Services &rarr;</a>
            </div>
          </div>
        </li>
        <li><a href="/service-areas/">Service Areas</a></li>
        <li><a href="/blog">Blog</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>

      <!-- CTA Buttons -->
      <div class="nav__cta">
        <a href="/contact" class="btn btn--gold btn--sm btn--pulse">Get a Quote</a>
        <a href="tel:${PHONE_TEL}" class="btn btn--outline btn--sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.5 11.5 0 003.61.58 1 1 0 011 1V21a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.26.2 2.49.58 3.61a1 1 0 01-.25 1.01l-2.21 2.17z"/></svg>
          978-419-3358
        </a>
      </div>

      <!-- Hamburger -->
      <button class="hamburger" aria-label="Menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>

    </nav>
  </div>

  <!-- Mobile Menu -->
  <div class="mobile-menu">
    <div class="container">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About Us</a></li>
        <li><a href="/services">Services</a></li>
        <li><a href="/service-areas/">Service Areas</a></li>
        <li><a href="/blog">Blog</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
      <div class="mobile-cta">
        <a href="/contact" class="btn btn--gold">Get a Free Quote</a>
        <a href="tel:${PHONE_TEL}" class="btn btn--outline">Call Us Now</a>
      </div>
    </div>
  </div>
</header>`;
}

function footer() {
  return `
<!-- ════════════════════════════════════════════════════════
     FOOTER
════════════════════════════════════════════════════════ -->
<footer class="site-footer">

  <!-- Google Maps + Reviews strip -->
  <div class="footer-map-section">
    <div class="footer-map-section__inner">
      <div class="footer-map-wrap">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2964.07!2d-70.9317122!3d42.5217276!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89e31308f9a4cb99%3A0x31edbfe86520fc98!2sWOLF%20CARPENTERS%20SERVICES%20CORP!5e0!3m2!1sen!2sus!4v1716000000000!5m2!1sen!2sus"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="Wolf Carpenters location in Peabody, MA"
          allowfullscreen></iframe>
      </div>
      <div class="footer-reviews">
        <div>
          <div class="footer-reviews__top">
            <span class="footer-reviews__score">5.0</span>
            <span class="footer-reviews__out">/5</span>
          </div>
          <div class="footer-reviews__stars">
            <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <p class="footer-reviews__label">Based on 100+ Google Reviews</p>
        </div>
        <a href="https://maps.app.goo.gl/LNopETPziYvBu3cY8" target="_blank" rel="noopener" class="footer-reviews__cta">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
          View All Google Reviews
        </a>
        <a href="https://wa.me/19784193358" target="_blank" rel="noopener" class="btn btn--primary btn--sm" style="width:fit-content;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp Us
        </a>
      </div>
    </div>
  </div>

  <div class="footer-main">
    <div class="container">
      <div class="footer-grid">

        <!-- Brand -->
        <div>
          <img class="footer-brand__logo"
               src="/images/wp-uploads/2024/05/logo-wolf-desktop.png"
               alt="Wolf Carpenters" />
          <p>Wolf Carpenters is a family-owned construction and renovation company serving Peabody, MA &amp; North Shore for over 7 years. From foundation to finish. We build with pride.</p>
          <div class="footer-socials">
            <a href="https://www.instagram.com/wolfcarpenters/" class="footer-social" target="_blank" rel="noopener" aria-label="Instagram">
              <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://www.facebook.com/p/Wolfcarpenters-100072394400408/" class="footer-social" target="_blank" rel="noopener" aria-label="Facebook">
              <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://www.linkedin.com/company/wolf-carpenters/posts/?feedView=all" class="footer-social" target="_blank" rel="noopener" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="https://br.pinterest.com/wolfcarpenters/" class="footer-social" target="_blank" rel="noopener" aria-label="Pinterest">
              <svg viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>
            </a>
            <a href="https://www.youtube.com/@wolfcarpenters" class="footer-social" target="_blank" rel="noopener" aria-label="YouTube">
              <svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            <a href="https://www.tiktok.com/@wolfcarpenters?lang=en" class="footer-social" target="_blank" rel="noopener" aria-label="TikTok">
              <svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            </a>
            <a href="https://maps.app.goo.gl/LNopETPziYvBu3cY8" class="footer-social" target="_blank" rel="noopener" aria-label="Google Local">
              <svg viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
            </a>
          </div>
        </div>

        <!-- Navigation -->
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/service-areas/">Service Areas</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>

        <!-- Services -->
        <div class="footer-col">
          <h4>Services</h4>
          <ul>
            <li><a href="/services/addition">Home Addition</a></li>
            <li><a href="/services/kitchen-remodeling">Kitchen Remodeling</a></li>
            <li><a href="/services/bathroom-remodeling">Bathroom Remodeling</a></li>
            <li><a href="/services/deck-installation">Deck Installation</a></li>
            <li><a href="/services/home-remodeling">Home Remodeling</a></li>
            <li><a href="/services/general-contractors">General Contractors</a></li>
            <li><a href="/services">+ More Services</a></li>
          </ul>
        </div>

        <!-- Contact -->
        <div class="footer-col">
          <h4>Contact</h4>
          <div class="footer-contact">
            <div class="footer-contact__item">
              <div class="footer-contact__icon">
                <svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.5 11.5 0 003.61.58 1 1 0 011 1V21a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.26.2 2.49.58 3.61a1 1 0 01-.25 1.01l-2.21 2.17z"/></svg>
              </div>
              <div class="footer-contact__text">
                <strong>Phone</strong>
                <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a>
              </div>
            </div>
            <div class="footer-contact__item">
              <div class="footer-contact__icon">
                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
              </div>
              <div class="footer-contact__text">
                <strong>Location</strong>
                17 Mason St, Peabody, MA 01960
              </div>
            </div>
            <div class="footer-contact__item">
              <div class="footer-contact__icon">
                <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 2a8 8 0 100 16A8 8 0 0012 4zm1 4v5.414l3.293 3.293-1.414 1.414L11 14.586V8h2z"/></svg>
              </div>
              <div class="footer-contact__text">
                <strong>Working Hours</strong>
                Mon–Fri: 7am – 4pm<br>
                <span style="color:var(--gray);font-size:.85rem;">Closed Sat, Sun &amp; holidays</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <div class="container">
    <div class="footer-bottom">
      <p>&copy; 2025 Wolf Carpenters. All rights reserved.</p>
      <p>Construction &amp; Renovations in Peabody, MA · <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a></p>
    </div>
  </div>
</footer>`;
}

function floatingCtas() {
  return `
<!-- ════════════════════════════════════════════════════════
     FLOATING CTA BUTTONS
════════════════════════════════════════════════════════ -->
<div class="float-cta">
  <a href="https://wa.me/19784193358" class="float-btn float-btn--wa" target="_blank" rel="noopener" aria-label="WhatsApp">
    <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  </a>
  <a href="tel:${PHONE_TEL}" class="float-btn float-btn--phone" aria-label="Call">
    <svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.5 11.5 0 003.61.58 1 1 0 011 1V21a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.26.2 2.49.58 3.61a1 1 0 01-.25 1.01l-2.21 2.17z"/></svg>
  </a>
</div>`;
}

// ──────────────────────────────────────────────────────────────
// PAGE BUILDERS
// ──────────────────────────────────────────────────────────────

function servicePage(service, city) {
  const citySlug = slugify(city);
  const canonical = `${BASE_URL}/services/${service.slug}/${citySlug}-ma/`;
  const title = `${service.name} in ${city}, MA | Wolf Carpenters`;
  const description = `${service.name} in ${city}, MA by Wolf Carpenters. In-house crew, 7+ years on the North Shore. Request a free estimate today.`;
  const benefits = service.benefits.map((item) => `<li>${item}</li>`).join("");
  // Use path-absolute hrefs (no domain) so links work both on the local QA
  // server and the live site without forcing the user out to the real domain.
  const related = services
    .filter((item) => item.slug !== service.slug)
    .map((item) => `<a href="/services/${item.slug}/${citySlug}-ma/">${item.name} in ${city}</a>`)
    .join("");

  return pageShell({
    title,
    description,
    canonical,
    schema: [
      businessSchema({ "@id": `${canonical}#business` }),
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: `${service.name} in ${city}`,
        serviceType: service.serviceType,
        provider: { "@id": `${canonical}#business` },
        areaServed: { "@type": "City", name: `${city}, MA` },
        url: canonical,
      },
      faqSchema(service, city),
      breadcrumbSchema([
        ["Home", `${BASE_URL}/`],
        ["Services", `${BASE_URL}/services`],
        [service.name, pillarUrl(service)],
        [`${city}, MA`, canonical],
      ]),
    ],
    body: `
<main>
  <section class="seo-hero">
    <div class="container seo-hero__grid">
      <div>
        <div class="section-tag">${city}, MA</div>
        <h1>${service.name} in ${city}, MA</h1>
        <p>${service.name} done by Wolf Carpenters' in-house crew. No subcontractors, no shortcuts, and local experience across Peabody, ${city}, and the North Shore.</p>
        <div class="seo-actions">
          <a href="/contact" class="btn btn--gold">Request a Free Estimate</a>
          <a href="tel:${PHONE_TEL}" class="btn btn--outline">${PHONE_DISPLAY}</a>
        </div>
      </div>
      <img src="${service.image}" alt="${service.name} by Wolf Carpenters in ${city}, MA" loading="eager" fetchpriority="high">
    </div>
  </section>

  <section class="section">
    <div class="container seo-content">
      <div>
        <div class="section-tag">Local service</div>
        <h2>Built for ${city} homes</h2>
        <p>Homes in ${city}, MA need contractors who understand New England framing, weather, permits, older properties, and finish details. Wolf Carpenters manages ${service.name.toLowerCase()} projects from planning to final walkthrough with the same crew responsible for the work.</p>
        <p>Our Peabody-based team serves ${city} and nearby North Shore communities with clear communication, clean job sites, and craftsmanship built to last.</p>
      </div>
      <aside class="seo-panel">
        <h3>What's included</h3>
        <ul>${benefits}</ul>
      </aside>
    </div>
  </section>

  <section class="section section--muted">
    <div class="container">
      <div class="section-tag">Why Wolf</div>
      <h2>Why homeowners in ${city} choose Wolf Carpenters</h2>
      <div class="seo-card-grid">
        <article><h3>In-house crew</h3><p>The team that plans the work is the team that builds it. That keeps accountability clear from day one.</p></article>
        <article><h3>Local North Shore experience</h3><p>Wolf is based in Peabody and serves ${city}, Salem, Danvers, Beverly, Lynn, and surrounding cities.</p></article>
        <article><h3>Full-scope execution</h3><p>From framing and carpentry to finishes, Wolf handles the details that make remodels feel complete.</p></article>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container seo-content">
      <div>
        <div class="section-tag">FAQ</div>
        <h2>${service.name} questions in ${city}</h2>
        <details open><summary>Do you serve ${city}, MA?</summary><p>Yes. Wolf Carpenters serves ${city}, Peabody, and surrounding North Shore communities.</p></details>
        <details><summary>Do you use subcontractors?</summary><p>Wolf Carpenters emphasizes an in-house crew model, keeping the work accountable and consistent.</p></details>
        <details><summary>How do I start a ${service.name.toLowerCase()} project?</summary><p>Call ${PHONE_DISPLAY} or request an estimate through the contact page. The team will review the scope, timeline, and next steps.</p></details>
      </div>
      <aside class="seo-panel">
        <h3>Related in ${city}</h3>
        <div class="seo-link-list">${related}</div>
      </aside>
    </div>
  </section>
</main>`,
  });
}

function cityHubPage(city) {
  const citySlug = slugify(city);
  const canonical = `${BASE_URL}/service-areas/${citySlug}-ma/`;
  // Path-absolute hrefs only — see comment in servicePage().
  const serviceLinks = services
    .map((service) => `<a href="/services/${service.slug}/${citySlug}-ma/">${service.name}</a>`)
    .join("");
  return pageShell({
    title: `Construction & Remodeling in ${city}, MA | Wolf Carpenters`,
    description: `Wolf Carpenters serves ${city}, MA with remodeling, additions, decks, kitchen and bathroom renovations, and general contracting.`,
    canonical,
    schema: [
      businessSchema({ "@id": `${canonical}#business` }),
      breadcrumbSchema([
        ["Home", `${BASE_URL}/`],
        ["Service Areas", `${BASE_URL}/service-areas/`],
        [`${city}, MA`, canonical],
      ]),
    ],
    body: `
<main>
  <section class="seo-hero">
    <div class="container seo-hero__grid">
      <div>
        <div class="section-tag">Service Area</div>
        <h1>Construction & Remodeling in ${city}, MA</h1>
        <p>Wolf Carpenters serves ${city} with full-scope residential construction, remodeling, additions, decks, and finish carpentry from a Peabody-based in-house crew.</p>
        <div class="seo-actions">
          <a href="/contact" class="btn btn--gold">Request a Free Estimate</a>
          <a href="tel:${PHONE_TEL}" class="btn btn--outline">${PHONE_DISPLAY}</a>
        </div>
      </div>
      <img src="/images/wp-uploads/2024/06/RESIDENCIAL.jpg" alt="Construction and remodeling services in ${city}, MA" loading="eager" fetchpriority="high">
    </div>
  </section>
  <section class="section">
    <div class="container">
      <div class="section-tag">Available services</div>
      <h2>Wolf Carpenters services in ${city}</h2>
      <div class="seo-card-grid">${services.map((service) => `<article><h3>${service.name}</h3><p>${service.benefits.join(", ")} for homes in ${city}, MA.</p><a href="/services/${service.slug}/${citySlug}-ma/">View ${service.name}</a></article>`).join("")}</div>
    </div>
  </section>
  <section class="section section--muted">
    <div class="container seo-content">
      <div>
        <h2>Serving ${city} from Peabody</h2>
        <p>Because Wolf Carpenters is based at 17 Mason St in Peabody, the team can support nearby North Shore projects with fast communication, local context, and consistent project oversight.</p>
      </div>
      <aside class="seo-panel">
        <h3>Quick links</h3>
        <div class="seo-link-list">${serviceLinks}</div>
      </aside>
    </div>
  </section>
</main>`,
  });
}

function serviceAreasIndex() {
  // Path-absolute hrefs only.
  const cityCards = cities
    .map((city) => `<a href="/service-areas/${slugify(city)}-ma/">${city}, MA</a>`)
    .join("");
  return pageShell({
    title: "Service Areas in North Shore MA | Wolf Carpenters",
    description: `Wolf Carpenters serves ${cities.length} priority cities across Peabody, North Shore, Essex County, Middlesex County, and Suffolk County.`,
    canonical: `${BASE_URL}/service-areas/`,
    schema: [businessSchema({ "@id": `${BASE_URL}/service-areas/#business` })],
    body: `
<main>
  <section class="seo-hero">
    <div class="container">
      <div class="section-tag">Service Areas</div>
      <h1>Construction & Remodeling Service Areas</h1>
      <p>Wolf Carpenters serves ${cities.length} priority cities around Peabody, MA with remodeling, additions, decks, kitchens, bathrooms, and general contracting.</p>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <div class="seo-city-grid">${cityCards}</div>
    </div>
  </section>
</main>`,
  });
}

function deckPillarPage() {
  const deckUrl = `${BASE_URL}/services/deck-installation`;
  return pageShell({
    title: "Deck Installation in Peabody, MA & North Shore | Wolf Carpenters",
    description: "Deck installation and replacement in Peabody, MA and the North Shore. Composite and wood decks built by Wolf Carpenters' in-house crew.",
    canonical: deckUrl,
    schema: [
      businessSchema({ "@id": `${deckUrl}#business` }),
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Deck Installation",
        serviceType: "Deck construction",
        provider: { "@id": `${deckUrl}#business` },
        areaServed: cities.map((city) => ({ "@type": "City", name: `${city}, MA` })),
      },
    ],
    body: `
<main>
  <section class="seo-hero">
    <div class="container seo-hero__grid">
      <div>
        <div class="section-tag">Deck Installation</div>
        <h1>Deck Installation in Peabody, MA & North Shore</h1>
        <p>Custom wood and composite decks built by Wolf Carpenters' in-house crew for homeowners across Peabody and the North Shore.</p>
        <div class="seo-actions"><a href="/contact" class="btn btn--gold">Request a Free Estimate</a><a href="tel:${PHONE_TEL}" class="btn btn--outline">${PHONE_DISPLAY}</a></div>
      </div>
      <img src="/images/wp-uploads/2024/06/DECK.jpg" alt="Deck installation by Wolf Carpenters in Peabody, MA" loading="eager" fetchpriority="high">
    </div>
  </section>
  <section class="section">
    <div class="container seo-content">
      <div><div class="section-tag">Built outside, built right</div><h2>Decks designed for New England homes</h2><p>Wolf Carpenters builds deck structures, stairs, railings, and finishes with careful framing and practical material recommendations for Massachusetts weather.</p></div>
      <aside class="seo-panel"><h3>Deck services</h3><ul><li>New deck installation</li><li>Deck replacement</li><li>Composite decking</li><li>Wood decking</li><li>Railings and stairs</li></ul></aside>
    </div>
  </section>
  <section class="section seo-service-areas">
    <div class="container">
      <div class="section-tag">Service Areas</div>
      <h2>Deck Installation across Peabody, MA & North Shore</h2>
      <div class="seo-city-grid">${areaLinks("deck-installation/")}</div>
    </div>
  </section>
</main>`,
  });
}

function faqSchema(service, city) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Do you serve ${city}, MA?`,
        acceptedAnswer: { "@type": "Answer", text: `Yes. Wolf Carpenters serves ${city}, Peabody, and surrounding North Shore communities.` },
      },
      {
        "@type": "Question",
        name: "Do you use subcontractors?",
        acceptedAnswer: { "@type": "Answer", text: "Wolf Carpenters emphasizes an in-house crew model, keeping the work accountable and consistent." },
      },
      {
        "@type": "Question",
        name: `How do I start a ${service.name.toLowerCase()} project in ${city}?`,
        acceptedAnswer: { "@type": "Answer", text: `Call ${PHONE_DISPLAY} or request a free estimate through the contact page. The team will review your scope, timeline, and next steps.` },
      },
    ],
  };
}

function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, item], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item,
    })),
  };
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "wolfcarpenters.com") return [];
      return walk(full);
    }
    return [full];
  });
}

function sitemapUrl(pathname) {
  // Strip .html so the sitemap matches the public pretty URL.
  // Empty/root → "/". Folder-style ("foo/" or "foo/bar-ma/") passes through unchanged.
  let loc;
  if (pathname === "" || pathname === "/") {
    loc = `${BASE_URL}/`;
  } else {
    const cleaned = pathname
      .replace(/\/index\.html$/i, "/")
      .replace(/\.html$/i, "");
    loc = `${BASE_URL}/${cleaned}`;
  }
  return `  <url><loc>${loc}</loc><changefreq>weekly</changefreq><priority>${pathname === "" || pathname === "/" ? "1.0" : "0.8"}</priority></url>`;
}

function writeSitemap() {
  const urls = [...staticPages];
  for (const city of cities) {
    const citySlug = slugify(city);
    urls.push(`service-areas/${citySlug}-ma/`);
    for (const service of services) {
      urls.push(`services/${service.slug}/${citySlug}-ma/`);
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(sitemapUrl).join("\n")}
</urlset>
`;
  writeFile("sitemap.xml", xml);
  writeFile("robots.txt", `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`);
}

function appendCss() {
  const cssPath = path.join(ROOT, "css/seo-local.css");
  const css = `/* Wolf Carpenters — SEO local pages overlay
   Inherits dark theme from styles.css; only adds layout for SEO matrix pages.
*/

.seo-hero {
  background: var(--dark);
  color: var(--white);
  padding: 9rem 0 4rem;
}

.seo-hero h1 {
  color: var(--white);
  margin-top: .5rem;
}

.seo-hero p {
  color: var(--gray);
  font-size: 1.05rem;
  line-height: 1.6;
  margin-top: 1rem;
  max-width: 60ch;
}

.seo-hero__grid,
.seo-content {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 2.5rem;
  align-items: center;
}

.seo-content {
  align-items: flex-start;
}

.seo-hero img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, .35);
}

.seo-actions,
.seo-link-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.75rem;
}

.seo-city-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-top: 1.75rem;
}

.seo-city-grid a,
.seo-link-list a {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: inherit;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: border-color .2s ease, background .2s ease, color .2s ease;
}

.seo-city-grid a:hover,
.seo-link-list a:hover {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(225, 186, 72, 0.08);
}

.seo-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-top: 1.75rem;
}

.seo-card-grid article,
.seo-panel {
  background: var(--card);
  color: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.75rem;
}

.seo-card-grid article h3,
.seo-panel h3 {
  color: var(--gold);
  margin-bottom: .75rem;
}

.seo-card-grid article a {
  display: inline-block;
  margin-top: 1rem;
  color: var(--gold);
  text-decoration: none;
  font-weight: 600;
}

.seo-card-grid article a:hover {
  text-decoration: underline;
}

.seo-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.seo-panel ul li {
  padding: .5rem 0;
  border-bottom: 1px solid var(--border);
  color: var(--gray);
}

.seo-panel ul li:last-child {
  border-bottom: none;
}

.section--muted {
  background: var(--black);
}

details {
  border-bottom: 1px solid var(--border);
  padding: 1rem 0;
  color: var(--white);
}

details p {
  color: var(--gray);
  margin-top: .5rem;
}

summary {
  cursor: pointer;
  font-weight: 700;
  color: var(--white);
}

.seo-service-areas {
  background: var(--dark);
  color: var(--white);
}

.seo-service-areas h2 {
  color: var(--white);
}

.section-subtitle {
  color: var(--gray);
  margin-top: .75rem;
  max-width: 70ch;
}

@media (max-width: 768px) {
  .seo-hero {
    padding: 7rem 0 3rem;
  }
  .seo-hero__grid,
  .seo-content {
    grid-template-columns: 1fr;
  }
}
`;
  writeFileSafe(cssPath, css);
}

function heartbeat(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  process.stdout.write(`[${ts}] ${msg}\n`);
}

function main() {
  heartbeat("start: updating existing static HTML (GA4 + seo-local.css + footer fixes)");
  updateExistingHtml();

  heartbeat("regen: CSS overlay");
  appendCss();

  heartbeat("regen: deck pillar page");
  writeFile("services/deck-installation.html", deckPillarPage());

  heartbeat("regen: service-areas index");
  writeFile("service-areas/index.html", serviceAreasIndex());

  heartbeat("regen: city hubs + service×city matrix");
  let count = 0;
  const halfwayCity = cities[Math.floor(cities.length / 2)];
  for (const city of cities) {
    writeFile(`service-areas/${slugify(city)}-ma/index.html`, cityHubPage(city));
    count += 1;
    for (const service of services) {
      writeFile(`services/${service.slug}/${slugify(city)}-ma/index.html`, servicePage(service, city));
      count += 1;
    }
    if (city === halfwayCity) {
      heartbeat(`...${count} matrix pages written so far (halfway through cities)`);
    }
  }
  heartbeat(`regen: matrix done (${count} pages)`);

  heartbeat("regen: pillar 'service areas' section injection");
  for (const service of services) injectAreaSection(service);

  heartbeat("regen: sitemap + robots");
  writeSitemap();

  heartbeat(`DONE — generated ${cities.length * services.length} service-city pages, ${cities.length} city hubs, plus pillar/index/sitemap.`);
}

main();
