// ─────────────────────────────────────────────────────────────
// Limer's Capital — Analytics
//
// PostHog-optional event tracker. Works with zero config (dev
// console logging) and lights up automatically when
// VITE_POSTHOG_KEY is set in Cloudflare Pages env vars.
//
// How to enable PostHog:
//   1. Create free account at posthog.com (1M events/mo free)
//   2. Set VITE_POSTHOG_KEY=phc_xxx in Cloudflare Pages
//   3. Optionally set VITE_POSTHOG_HOST=https://eu.posthog.com
//      (EU data residency — recommended for Caribbean/GDPR)
//   That's it. No code changes needed.
// ─────────────────────────────────────────────────────────────

const KEY  = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
const DEV  = import.meta.env.DEV;

/** Load PostHog from CDN and initialise */
export function initAnalytics() {
  if (!KEY || typeof window === 'undefined') return;

  // Inject PostHog array.js snippet (same as their official snippet)
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split('.');2==o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement('script')).type='text/javascript',p.async=!0,p.src=s.api_host.replace('.i.posthog.com','-assets.i.posthog.com')+'/static/array.js',(r=t.getElementsByTagName('script')[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a='posthog',u.people=u.people||[],u.toString=function(t){var e='posthog';return'posthog'!==a&&(e+='.'+a),t||(e+=' (stub)'),e},u.people.toString=function(){return u.toString(1)+'.people (stub)'},o='capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId'.split(' '),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  window.posthog.init(KEY, {
    api_host: HOST,
    autocapture: false,        // manual tracking only — full control
    capture_pageview: false,   // we track tab views manually
    persistence: 'localStorage+cookie',
    loaded: (ph) => {
      if (DEV) console.debug('[analytics] PostHog ready', ph.get_distinct_id());
    },
  });
}

/**
 * Fire a named event with optional properties.
 * Safe to call even if PostHog is not initialised.
 */
export function track(event, props = {}) {
  if (typeof window !== 'undefined' && window.posthog?.capture) {
    window.posthog.capture(event, { platform: 'limerscapital', ...props });
  } else if (DEV) {
    console.debug('[analytics]', event, props);
  }
}

/**
 * Identify a user. Call on wallet connect.
 * @param {string} userId   — wallet address (public key, not sensitive)
 * @param {object} traits   — { tier, xp, limerPoints, cluster }
 */
export function identify(userId, traits = {}) {
  if (typeof window !== 'undefined' && window.posthog?.identify) {
    window.posthog.identify(userId, traits);
    if (DEV) console.debug('[analytics] identify', userId, traits);
  }
}

/** Reset on wallet disconnect */
export function analyticsReset() {
  if (typeof window !== 'undefined' && window.posthog?.reset) {
    window.posthog.reset();
  }
}
