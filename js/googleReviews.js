/**
 * Wolf Carpenters | Google Reviews Integration
 * ─────────────────────────────────────────────
 * Fetches live reviews from Google Places API (New).
 * Falls back to curated static reviews when the API key is not yet
 * configured or when the network request fails.
 *
 * Configuration: set window.WOLF_CONFIG in js/config.js before loading
 * this file.  See js/config.example.js for full setup instructions.
 *
 * API used: Google Places API (New)
 *   https://developers.google.com/maps/documentation/places/web-service/place-details
 *
 * CORS: The Places API (New) endpoint supports browser-side requests
 *   when the API key is restricted by HTTP referrer.
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     CONFIGURATION
  ═══════════════════════════════════════════════════════════ */

  const cfg       = (typeof window.WOLF_CONFIG !== 'undefined') ? window.WOLF_CONFIG : {};
  const API_KEY   = cfg.GOOGLE_PLACES_API_KEY || '';
  const PLACE_ID  = cfg.GOOGLE_PLACE_ID       || '';
  const CACHE_TTL = cfg.REVIEWS_CACHE_TTL     || 6 * 60 * 60 * 1000;
  const CACHE_KEY = 'wolf_google_reviews_v1';

  /** Google Maps page for Wolf Carpenters (used for badge links). */
  const MAPS_URL = 'https://www.google.com/maps/place/WOLF+CARPENTERS+SERVICES+CORP/@42.5217315,-70.9317122,17z';

  /* ═══════════════════════════════════════════════════════════
     FALLBACK / SEED REVIEWS
     ────────────────────────────────────────────────────────
     Displayed when the API key is not yet configured or when the
     API call fails.  Replace text with exact wording from Google
     once the API is connected and verified.
  ═══════════════════════════════════════════════════════════ */

  const FALLBACK_REVIEWS = [
    {
      authorName:   'Ana Beatriz S.',
      profilePhoto: null,
      rating:       5,
      text:         'Julio and his team were outstanding from start to finish. They completely remodeled our kitchen — new cabinets, countertops, backsplash, and flooring — and the result is absolutely beautiful. Professional, clean, and on time. I recommend Wolf Carpenters to everyone!',
      relativeTime: '4 months ago',
      mapsUrl:      MAPS_URL
    },
    {
      authorName:   'Patrick M.',
      profilePhoto: null,
      rating:       5,
      text:         'We hired Wolf Carpenters for a full second-story addition on our home. From the permit process to the final walkthrough, every step was handled with precision and transparency. Julio kept us informed throughout the entire project. Exceptional quality of work.',
      relativeTime: '6 months ago',
      mapsUrl:      MAPS_URL
    },
    {
      authorName:   'Lisa R.',
      profilePhoto: null,
      rating:       5,
      text:         'Incredible bathroom transformation. The tile work is flawless, everything was done on schedule, and the crew respected our home every single day. Wolf Carpenters is the only contractor we will ever call for renovations. Highly, highly recommend.',
      relativeTime: '2 months ago',
      mapsUrl:      MAPS_URL
    }
  ];

  /* ═══════════════════════════════════════════════════════════
     SECURITY HELPERS
  ═══════════════════════════════════════════════════════════ */

  /**
   * Escapes user-supplied text before inserting into innerHTML.
   * Prevents XSS from API-returned strings.
   */
  function esc(str) {
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  }

  /**
   * Validates that a profile photo URL comes from Google's CDN.
   * Returns null for any unexpected origin.
   */
  function safePhotoUrl(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (
        parsed.hostname === 'lh3.googleusercontent.com' ||
        parsed.hostname.endsWith('.googleusercontent.com')
      ) {
        // Request a 64px circular thumbnail
        return url.replace(/=s\d+-c.*$/, '') + '=s64-c';
      }
      return null;
    } catch {
      return null;
    }
  }

  /* ═══════════════════════════════════════════════════════════
     HTML BUILDERS
  ═══════════════════════════════════════════════════════════ */

  const STAR_PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

  function buildStars(rating) {
    return Array.from({ length: 5 }, (_, i) => {
      const cls = i < rating ? 'testi-star--filled' : 'testi-star--empty';
      return `<span class="testi-star ${cls}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="${STAR_PATH}"/></svg></span>`;
    }).join('');
  }

  /** Google colour logo used on every card as a "verified" badge. */
  const GOOGLE_BADGE_SVG = `
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>`;

  function buildCard(review, index) {
    const initials = esc(
      review.authorName
        .split(' ')
        .slice(0, 2)
        .map(n => n[0] || '')
        .join('')
        .toUpperCase()
    );

    const photoUrl  = safePhotoUrl(review.profilePhoto);
    const delay     = (index % 3) + 1;
    const cardUrl   = esc(review.mapsUrl || MAPS_URL);
    const ariaLabel = `${esc(review.authorName)}: ${review.rating} out of 5 stars`;

    // Avatar: real photo (background-image) or initials fallback
    const avatarHTML = photoUrl
      ? `<div class="testi-avatar testi-avatar--photo"
              style="background-image:url('${esc(photoUrl)}')"
              role="img"
              aria-label="Profile photo of ${esc(review.authorName)}"></div>`
      : `<div class="testi-avatar" aria-hidden="true">${initials}</div>`;

    return `
      <div class="testi-card testi-card--google" data-reveal data-reveal-delay="${delay}">
        <div class="testi-card__toprow">
          <div class="testi-stars" role="img" aria-label="${ariaLabel}">
            ${buildStars(review.rating)}
          </div>
          <a href="${cardUrl}"
             class="testi-google-badge"
             target="_blank"
             rel="noopener noreferrer"
             title="View on Google">
            ${GOOGLE_BADGE_SVG}
            <span class="testi-google-label">Google</span>
          </a>
        </div>
        <p class="testi-text">"${esc(review.text)}"</p>
        <div class="testi-author">
          ${avatarHTML}
          <div>
            <div class="testi-name">${esc(review.authorName)}</div>
            <div class="testi-location">${esc(review.relativeTime || 'Google Review')}</div>
          </div>
        </div>
      </div>`;
  }

  /** Three pulsing skeleton cards shown while the API request is in-flight. */
  function buildSkeletons() {
    const skeletonCard = `
      <div class="testi-card testi-skel" aria-hidden="true">
        <div class="testi-skel__stars"></div>
        <div class="testi-skel__line testi-skel__line--lg"></div>
        <div class="testi-skel__line testi-skel__line--md"></div>
        <div class="testi-skel__line testi-skel__line--sm"></div>
        <div class="testi-skel__author">
          <div class="testi-skel__avatar"></div>
          <div class="testi-skel__meta">
            <div class="testi-skel__line testi-skel__line--name"></div>
            <div class="testi-skel__line testi-skel__line--loc"></div>
          </div>
        </div>
      </div>`;
    return skeletonCard + skeletonCard + skeletonCard;
  }

  /* ═══════════════════════════════════════════════════════════
     SESSION CACHE
  ═══════════════════════════════════════════════════════════ */

  function getCached() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { ts, data } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  function setCache(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* ignore storage quota errors */ }
  }

  /* ═══════════════════════════════════════════════════════════
     GOOGLE PLACES API (NEW) – FETCH
     ────────────────────────────────────────────────────────
     Endpoint: https://places.googleapis.com/v1/places/{placeId}
     Field mask: reviews, displayName, rating, userRatingCount
     CORS: supported when API key is HTTP-referrer restricted.
  ═══════════════════════════════════════════════════════════ */

  async function fetchFromGoogleAPI() {
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      throw new Error('Google Places API key not configured in js/config.js');
    }
    if (!PLACE_ID || PLACE_ID === 'YOUR_PLACE_ID_HERE') {
      throw new Error('Google Place ID not configured in js/config.js');
    }

    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(PLACE_ID)}?key=${encodeURIComponent(API_KEY)}`;

    const response = await fetch(url, {
      method:  'GET',
      headers: {
        // Field mask tells the API exactly what data to return (cost + bandwidth optimisation)
        'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews'
      }
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        `Places API ${response.status}: ${err?.error?.message || response.statusText}`
      );
    }

    const body = await response.json();

    // Normalise API response → internal format
    return (body.reviews || [])
      .filter(r => r.rating >= 4)          // only 4-star and 5-star reviews
      .slice(0, 5)                          // cap at 5 (API returns max 5 anyway)
      .map(r => ({
        authorName:   r.authorAttribution?.displayName || 'Google Reviewer',
        profilePhoto: r.authorAttribution?.photoUri    || null,
        rating:       r.rating,
        text:         r.text?.text || '',
        relativeTime: r.relativePublishTimeDescription || '',
        mapsUrl:      r.authorAttribution?.uri         || MAPS_URL
      }));
  }

  /* ═══════════════════════════════════════════════════════════
     REVEAL ANIMATION FOR DYNAMICALLY INJECTED CARDS
  ═══════════════════════════════════════════════════════════ */

  function triggerReveal(container) {
    const els = container.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    if (!window.IntersectionObserver) {
      els.forEach(el => el.classList.add('revealed'));
      return;
    }

    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (!e.isIntersecting) return;
        const delay = Number(e.target.dataset.revealDelay || 0) * 150;
        setTimeout(() => e.target.classList.add('revealed'), delay);
        io.unobserve(e.target);
      }),
      { threshold: 0.1 }
    );

    els.forEach(el => {
      // If already in viewport (API responded quickly), reveal immediately
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const delay = Number(el.dataset.revealDelay || 0) * 150;
        setTimeout(() => el.classList.add('revealed'), delay);
      } else {
        io.observe(el);
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     MAIN INIT
  ═══════════════════════════════════════════════════════════ */

  async function initReviews() {
    const container = document.getElementById('reviews-container');
    if (!container) return;

    // 1. Show skeleton loaders while we fetch
    container.innerHTML = buildSkeletons();

    let reviews = null;

    // 2. Try session cache first (avoids redundant API calls)
    reviews = getCached();

    // 3. Try live API
    if (!reviews) {
      try {
        reviews = await fetchFromGoogleAPI();
        if (reviews && reviews.length >= 1) {
          setCache(reviews);
        }
        if (!reviews || reviews.length === 0) {
          console.info('[Wolf Reviews] API returned no reviews, using fallback.');
          reviews = null;
        }
      } catch (err) {
        console.info('[Wolf Reviews] API unavailable, using fallback reviews.', err.message);
        reviews = null;
      }
    }

    // 4. Fall back to curated static reviews
    if (!reviews || reviews.length < 1) {
      reviews = FALLBACK_REVIEWS;
    }

    // 5. Always show exactly 3 cards
    const display = reviews.slice(0, 3);
    if (display.length < 3) {
      // Pad with fallback if API returned fewer than 3
      const needed = 3 - display.length;
      FALLBACK_REVIEWS.slice(0, needed).forEach(r => display.push(r));
    }

    // 6. Render
    container.innerHTML = display.map((r, i) => buildCard(r, i)).join('');

    // 7. Animate in
    triggerReveal(container);
  }

  /* ─── Boot ──────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReviews);
  } else {
    initReviews();
  }

})();
