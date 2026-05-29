const BASE = '/api/funnel';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const funnelApi = {
  analyze: (url: string, radius = 25) =>
    post<{ success: boolean; url: string; data: Record<string, unknown> }>('/analyze', { url, radius }),

  captureEmail: (params: {
    email: string;
    firstName?: string;
    businessName?: string;
    analyzedUrl: string;
    reportData?: Record<string, unknown>;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
  }) => post<{ success: boolean; leadId: string; reportData: Record<string, unknown> }>('/gate', params),
};
