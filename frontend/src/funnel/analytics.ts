import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || '';

let initialized = false;

export function initAnalytics() {
  if (!POSTHOG_KEY || initialized) return;
  posthog.init(POSTHOG_KEY, {
    api_host: 'https://app.posthog.com',
    capture_pageview: true,
    autocapture: false,
    persistence: 'localStorage',
    loaded: (p) => { if (import.meta.env.DEV) p.opt_out_capturing(); },
  });
  initialized = true;
}

export function track(event: string, props: Record<string, unknown> = {}) {
  if (!initialized) return;
  try { posthog.capture(event, props); } catch {}
}

export function identify(emailHash: string, props: Record<string, unknown> = {}) {
  if (!initialized) return;
  try { posthog.identify(emailHash, props); } catch {}
}

export function extractDomain(url: string): string {
  try { return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, ''); } catch { return url; }
}
