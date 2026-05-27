const API_BASE = '/api';

console.log('[SiteAnalyzer] API base:', API_BASE);

function getToken(): string | null {
  return localStorage.getItem('sap_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${API_BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err) {
    throw new Error(`Cannot reach API at ${url} — check VITE_API_URL and Railway status`);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  register: (name: string, email: string, password: string) =>
    request<{ user: { id: string; name: string; email: string }; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ user: { id: string; name: string; email: string }; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getReports: () =>
    request<Array<{ id: string; url: string; radius: number; at: string; data: unknown }>>('/reports'),

  checkReport: (url: string) =>
    request<{ found: boolean; report?: unknown }>(`/reports/check?url=${encodeURIComponent(url)}`),

  deleteReport: (id: string) =>
    request<{ message: string }>(`/reports/${id}`, { method: 'DELETE' }),

  createPaymentIntent: (url: string, radius: number) =>
    request<{ clientSecret: string; publishableKey: string }>('/payments/intent', {
      method: 'POST',
      body: JSON.stringify({ url, radius }),
    }),

  confirmPayment: (paymentIntentId: string, url: string, radius: number) =>
    request<unknown>('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId, url, radius }),
    }),

  generateReportAdmin: (url: string, radius: number) =>
    request<unknown>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ url, radius }),
    }),
};
