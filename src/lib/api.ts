// src/lib/api.ts

const HOSTED_API = 'https://motofix-admin-dashboard.onrender.com';
const API_BASE_URL = import.meta.env.DEV ? '' : HOSTED_API;

const TOKEN_KEY = 'motofix_admin_token';

export const getAuthToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setAuthToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearAuthToken = () => localStorage.removeItem(TOKEN_KEY);
export const isAuthenticated = () => !!getAuthToken();

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  if (!token) {
    clearAuthToken();
    window.location.href = '/login';
    throw new ApiError(401, 'No auth token');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    clearAuthToken();
    window.location.href = '/login';
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, `API Error: ${text}`);
  }

  return response.json();
}

// ─────────────────────── DASHBOARD & STATS ───────────────────────
export interface DashboardStats {
  totalRequests: number;
  completedJobs: number;
  pendingJobs: number;
  totalMechanics: number;
  verifiedMechanics: number;
  revenueCollected: number;
  paidToMechanics: number;
  profit: number;
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const raw = await fetchWithAuth<any>('/admin/stats');
  return {
    totalRequests: raw.total_requests ?? 0,
    completedJobs: raw.completed_jobs ?? 0,
    pendingJobs: raw.pending_jobs ?? 0,
    totalMechanics: raw.total_mechanics ?? 0,
    verifiedMechanics: raw.verified_mechanics ?? 0,
    revenueCollected: raw.revenue_collected_ugx ?? 0,
    paidToMechanics: raw.paid_to_mechanics_ugx ?? 0,
    profit: raw.profit_ugx ?? 0,
  };
};

// ─────────────────────── SERVICE REQUESTS ───────────────────────
export interface ServiceRequest {
  id: string;
  customerPhone: string;
  serviceType: string;
  location: string;
  status: string;
  mechanicName?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const fetchServiceRequests = (params = {}) => {
  const sp = new URLSearchParams(params as any);
  return fetchWithAuth<PaginatedResponse<ServiceRequest>>(`/admin/requests?${sp}`);
};

// ─────────────────────── MECHANICS ───────────────────────
export interface Mechanic {
  id: string;
  name: string;
  phone: string;
  location: string;
  rating: number;
  jobsCompleted: number;
  is_verified: boolean;
  created_at: string;
}

export const fetchMechanics = (params = {}) => {
  const sp = new URLSearchParams(params as any);
  return fetchWithAuth<PaginatedResponse<Mechanic>>(`/admin/mechanics?${sp}`);
};

// FULLY COMPATIBLE WITH YOUR LIVE BACKEND
export const createMechanic = (data: { name: string; phone: string; location: string; is_verified?: boolean }) =>
  fetchWithAuth<Mechanic>('/admin/mechanics', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      phone: data.phone,
      location: data.location,
      is_verified: data.is_verified ?? false,
    }),
  });

export const updateMechanic = (id: string, data: Partial<Pick<Mechanic, 'name' | 'phone' | 'location' | 'is_verified'>>) =>
  fetchWithAuth<Mechanic>(`/admin/mechanics/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteMechanic = (id: string) =>
  fetchWithAuth<{ detail: string }>(`/admin/mechanics/${id}`, {
    method: 'DELETE',
  });

// ─────────────────────── PAYMENTS ───────────────────────
export interface Payment {
  id: string;
  transaction_id: string;
  phone: string;
  amount: number;
  type: 'collection' | 'payout';
  status: string;
  created_at: string;
}

export const fetchPayments = (params = {}) => {
  const sp = new URLSearchParams(params as any);
  return fetchWithAuth<PaginatedResponse<Payment>>(`/admin/payments?${sp}`);
};

// ─────────────────────── AUTH ───────────────────────
export const adminLogin = async (password: string) => {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new ApiError(response.status, err || 'Invalid password');
  }

  const data = await response.json();
  if (data?.access_token) setAuthToken(data.access_token);
  return data;
};