// src/lib/api.ts

// Use an empty base in development so requests go to the dev server origin
// and are proxied by Vite to the hosted API (avoids CORS). In production
// use the hosted API URL directly.
const API_BASE_URL = 'https://motofix-admin-dashboard.onrender.com';

// No hardcoded admin token here anymore — tokens must come from a real login.
const TOKEN_KEY = 'motofix_admin_token';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  // If no token, force user to login
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
    // Token invalid or expired -> clear and redirect to login
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

// Dashboard Stats
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

export interface RevenueData {
  date: string;
  amount: number;
}

export const fetchDashboardStats = async () => {
  const raw = await fetchWithAuth<any>('/admin/stats');
  return {
    totalRequests: raw.total_requests ?? 0,
    completedJobs: raw.completed_jobs ?? 0,
    pendingJobs: raw.pending_jobs ?? 0,
    totalMechanics: raw.total_mechanics ?? 0,
    verifiedMechanics: raw.verified_mechanics ?? 0,
    revenueCollected: raw.revenue_collected_ugx ?? 0,
    paidToMechanics: raw.paid_to_mechanics_ugx ?? 0,
    profit: raw.profit_ugx ?? ((raw.revenue_collected_ugx - raw.paid_to_mechanics_ugx) || 0),
  } as DashboardStats;
};

export const fetchRevenueChart = async (): Promise<RevenueData[]> => {
  // Backend currently exposes overall stats. Return a minimal timeseries
  // so frontend chart components have something to consume until a proper
  // time-series endpoint is implemented on the backend.
  const stats = await fetchWithAuth<any>('/admin/stats');
  const point = {
    date: stats.as_of ?? new Date().toISOString(),
    amount: stats.revenue_collected_ugx ?? 0,
  };
  return [point];
};

// Service Requests
export interface ServiceRequest {
  id: string;
  customerPhone: string;
  serviceType: string;
  location: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
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

export interface RequestsParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export const fetchServiceRequests = (params: RequestsParams) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);

  return fetchWithAuth<PaginatedResponse<ServiceRequest>>(`/admin/requests?${searchParams}`);
};

// Mechanics
export interface Mechanic {
  id: string;
  name: string;
  phone: string;
  location: string;
  rating: number;
  jobsCompleted: number;
  verified: boolean;
  joinedAt: string;
}

export interface MechanicsParams {
  page?: number;
  pageSize?: number;
  verifiedOnly?: boolean;
  search?: string;
}

export const fetchMechanics = (params: MechanicsParams) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params.verifiedOnly) searchParams.set('verified', 'true');
  if (params.search) searchParams.set('search', params.search);

  return fetchWithAuth<PaginatedResponse<Mechanic>>(`/admin/mechanics?${searchParams}`);
};

// Mechanic CRUD operations
// ─────────────────────── MECHANIC CRUD – FIXED FOR LIVE BACKEND ───────────────────────

// Remove these interfaces – not needed anymore (your DB doesn't have vehicleType or password)
export interface CreateMechanicData {
  name: string;
  phone: string;
  location: string;
  is_verified?: boolean;   // optional, defaults to false
}

export interface UpdateMechanicData {
  name?: string;
  phone?: string;
  location?: string;
  is_verified?: boolean;
}

// Fixed create – sends only what backend accepts
export const createMechanic = (data: CreateMechanicData) =>
  fetchWithAuth<Mechanic>('/admin/mechanics', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      phone: data.phone,
      location: data.location,
      is_verified: data.is_verified ?? false,
    }),
  });

// Fixed update – can toggle verification, edit name/phone/location
export const updateMechanic = (id: string, data: UpdateMechanicData) =>
  fetchWithAuth<Mechanic>(`/admin/mechanics/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// DELETE THIS ENTIRE FUNCTION – backend has no /verify route
// export const toggleMechanicVerification = ...

// To toggle verification, just call:
// updateMechanic(id, { is_verified: true })   or   false

// Fixed delete
export const deleteMechanic = (id: string) =>
  fetchWithAuth<any>(`/admin/mechanics/${id}`, {
    method: 'DELETE',
  });

// Payments
export interface Payment {
  id: string;
  date: string;
  transactionId: string;
  phone: string;
  amount: number;
  type: 'collection' | 'payout';
  status: 'success' | 'pending' | 'failed';
  reason?: string;
}

export interface PaymentStats {
  totalCollected: number;
  totalPaid: number;
}

export interface PaymentsParams {
  page?: number;
  pageSize?: number;
  type?: string;
  status?: string;
  search?: string;
}

export const fetchPayments = (params: PaymentsParams) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params.type && params.type !== 'all') searchParams.set('type', params.type);
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);

  return fetchWithAuth<PaginatedResponse<Payment>>(`/admin/payments?${searchParams}`);
};

export const fetchPaymentStats = async (): Promise<PaymentStats> => {
  const stats = await fetchWithAuth<any>('/admin/stats');
  return {
    totalCollected: stats.revenue_collected_ugx ?? 0,
    totalPaid: stats.paid_to_mechanics_ugx ?? 0,
  } as PaymentStats;
};

// Auth
// Calls backend login endpoint, stores token, and returns token info
export const adminLogin = async (password: string): Promise<{ access_token: string; token_type: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Invalid password');
  }

  const data = await response.json();
  if (data?.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
};
