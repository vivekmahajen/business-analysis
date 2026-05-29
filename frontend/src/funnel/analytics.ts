// PostHog wrapper — gracefully no-ops if key not configured
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || '';

let ph: typeof import('posthog-js').default | null = null;

export async function initAnalytics() {
  if (!POSTHOG_KEY) return;
  try {
    const posthog = (await import('posthog-js')).default;
    posthog.init(POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      capture_pageview: true,
      autocapture: false,
      persistence: 'localStorage',
      loaded: (p) => { if (import.meta.env.DEV) p.opt_out_capturing(); },
    });
    ph = posthog;
  } catch {}
}

export function track(event: string, props: Record<string, unknown> = {}) {
  try { ph?.capture(event, props); } catch {}
}

export function identify(emailHash: string, props: Record<string, unknown> = {}) {
  try { ph?.identify(emailHash, props); } catch {}
}

export function extractDomain(url: string): string {
  try { return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, ''); } catch { return url; }
}
