const API_BASE = '/api';

console.log('[SiteAnalyzer] API base:', API_BASE);

function getToken(): string | null {
  return localStorage.getItem('sap_token');
}

export class CreditExhaustedError extends Error {
  public readonly code = 'CREDITS_EXHAUSTED';
  public readonly plan: string;
  public readonly creditsRemaining: number;
  constructor(data: { error: string; plan: string; creditsRemaining: number }) {
    super(data.error);
    this.plan = data.plan;
    this.creditsRemaining = data.creditsRemaining;
  }
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
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(res.ok ? 'Unexpected server response' : `Server error ${res.status} — please try again`);
  }
  if (res.status === 402 && data.code === 'CREDITS_EXHAUSTED') {
    throw new CreditExhaustedError(data as { error: string; plan: string; creditsRemaining: number });
  }
  if (!res.ok) throw new Error((data.error as string) || 'Request failed');
  return data as T;
}

export interface BillingStatus {
  plan: string;
  planName: string;
  creditsRemaining: number;
  creditsTotal: number;
  unlimited: boolean;
  hasSubscription: boolean;
  planExpiresAt: string | null;
}

export const api = {
  register: (name: string, email: string, password: string) =>
    request<{ user: { id: string; name: string; email: string }; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, agreedToTerms: true }),
    }),

  login: (email: string, password: string) =>
    request<{ user: { id: string; name: string; email: string }; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
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

  generateReport: (url: string, radius: number) =>
    request<unknown>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ url, radius }),
    }),

  generateGrowthReport: (url: string, radius: number, city: string, state: string) =>
    request<unknown>('/reports/generate-growth', {
      method: 'POST',
      body: JSON.stringify({ url, radius, city, state }),
    }),

  // kept for admin backwards-compat
  generateReportAdmin: (url: string, radius: number) =>
    request<unknown>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ url, radius }),
    }),

  generateGrowthReportAdmin: (url: string, radius: number, city: string, state: string) =>
    request<unknown>('/reports/generate-growth', {
      method: 'POST',
      body: JSON.stringify({ url, radius, city, state }),
    }),

  createGrowthPaymentIntent: (url: string, radius: number, city: string, state: string) =>
    request<{ clientSecret: string; publishableKey: string }>('/payments/intent', {
      method: 'POST',
      body: JSON.stringify({ url, radius, city, state, reportType: 'growth' }),
    }),

  // Billing
  getBillingPlans: () =>
    request<{ plans: unknown[]; addonPacks: unknown[] }>('/billing/plans'),

  getBillingStatus: () =>
    request<BillingStatus>('/billing/status'),

  getBillingUsage: () =>
    request<{ transactions: unknown[] }>('/billing/usage'),

  createCheckout: (planId: string, interval: 'month' | 'year') =>
    request<{ url: string }>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ planId, interval }),
    }),

  createAddonCheckout: (packId: string) =>
    request<{ url: string }>('/billing/addon-checkout', {
      method: 'POST',
      body: JSON.stringify({ packId }),
    }),

  openBillingPortal: () =>
    request<{ url: string }>('/billing/portal', { method: 'POST' }),

  // Admin Lead Discovery
  adminDiscover: (params: {
    category: string; state: string; city: string;
    ratingCeiling?: number; minReviews?: number; maxResults?: number; forceRefresh?: boolean;
  }) =>
    request<import('../types').LeadDiscoveryResult>('/admin/discover', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  adminGetLeads: (filters?: {
    category?: string; state?: string; city?: string; status?: string;
    sort?: string; page?: number; limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (filters?.category) qs.set('category', filters.category);
    if (filters?.state) qs.set('state', filters.state);
    if (filters?.city) qs.set('city', filters.city);
    if (filters?.status) qs.set('status', filters.status);
    if (filters?.sort) qs.set('sort', filters.sort);
    if (filters?.page) qs.set('page', String(filters.page));
    if (filters?.limit) qs.set('limit', String(filters.limit));
    const q = qs.toString();
    return request<import('../types').LeadDiscoveryResult & { total: number; page: number }>(`/admin/leads${q ? '?' + q : ''}`);
  },

  adminGetLead: (id: string) =>
    request<import('../types').AdminLead>(`/admin/leads/${id}`),

  adminUpdateLeadStatus: (id: string, status: string) =>
    request<import('../types').AdminLead>(`/admin/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  adminDeleteLead: (id: string) =>
    request<{ message: string }>(`/admin/leads/${id}`, { method: 'DELETE' }),

  adminGetCategories: () =>
    request<string[]>('/admin/categories'),

  adminGetStates: (category: string) =>
    request<string[]>(`/admin/states/${encodeURIComponent(category)}`),

  adminGetCities: (category: string, state: string) =>
    request<string[]>(`/admin/cities/${encodeURIComponent(category)}/${encodeURIComponent(state)}`),
};
