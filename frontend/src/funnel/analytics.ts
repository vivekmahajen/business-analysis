// PostHog wrapper — gracefully no-ops if key not configured
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ph: any = null;

export async function initAnalytics() {
  if (!POSTHOG_KEY) return;
  try {
    // Dynamic import — posthog-js is optional; gracefully no-ops if missing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const posthog = (await import('posthog-js' as any)).default;
    posthog.init(POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      capture_pageview: true,
      autocapture: false,
      persistence: 'localStorage',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loaded: (p: any) => { if (import.meta.env.DEV) p.opt_out_capturing(); },
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
