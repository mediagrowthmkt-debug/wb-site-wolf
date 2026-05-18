/**
 * Wolf Carpenters – Site Configuration (EXAMPLE / TEMPLATE)
 *
 * USAGE:
 *   1. Copy this file to js/config.js
 *   2. Fill in your real credentials below
 *   3. NEVER commit js/config.js with a real API key to a public repository
 *
 * ─────────────────────────────────────────────────────────────
 * HOW TO GET YOUR GOOGLE PLACES API KEY
 * ─────────────────────────────────────────────────────────────
 *  1. Go to https://console.cloud.google.com/
 *  2. Create (or select) a project
 *  3. Navigate to "APIs & Services" → "Library"
 *  4. Enable "Places API (New)"
 *  5. Navigate to "APIs & Services" → "Credentials" → "Create Credentials" → "API key"
 *  6. Click "Edit API key" and apply TWO restrictions:
 *       a) Application restrictions: HTTP referrers
 *          Add: wolfcarpenters.com/*  and  www.wolfcarpenters.com/*
 *               (also add localhost for local testing: localhost:*  and  127.0.0.1:*)
 *       b) API restrictions: Restrict to "Places API (New)" only
 *
 * ─────────────────────────────────────────────────────────────
 * HOW TO FIND YOUR GOOGLE PLACE ID
 * ─────────────────────────────────────────────────────────────
 *  Option A – Place ID Finder Tool (no code required):
 *    1. Visit https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
 *    2. Search for "Wolf Carpenters Services Corp Peabody MA"
 *    3. Click on the result – the Place ID (ChIJ…) appears below the map
 *
 *  Option B – Places API query (requires API key):
 *    Paste in your browser (replace YOUR_KEY):
 *    https://places.googleapis.com/v1/places:searchText?key=YOUR_KEY
 *    POST body: { "textQuery": "Wolf Carpenters Services Corp Peabody MA" }
 *    The response contains "name": "places/ChIJ..." → copy the ChIJ part.
 *
 *  Option C – From the Google Maps URL:
 *    Open https://maps.app.goo.gl/LNopETPziYvBu3cY8 in a browser,
 *    then use the "Place ID Finder" above to confirm.
 *
 * ─────────────────────────────────────────────────────────────
 */

window.WOLF_CONFIG = {
  /**
   * Your Google Places API key (restricted by HTTP referrer).
   * Replace with your real key.
   */
  GOOGLE_PLACES_API_KEY: 'YOUR_API_KEY_HERE',

  /**
   * The Place ID for "Wolf Carpenters Services Corp".
   * Format: ChIJ followed by a 22-character string.
   * See instructions above to find the real value.
   */
  GOOGLE_PLACE_ID: 'YOUR_PLACE_ID_HERE',

  /**
   * How long to cache reviews in sessionStorage (milliseconds).
   * Default: 6 hours. Prevents unnecessary API calls on every page load.
   */
  REVIEWS_CACHE_TTL: 6 * 60 * 60 * 1000
};
