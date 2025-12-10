const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

export const fetchDashboardStats = () =>
  fetchWithAuth<DashboardStats>('/admin/dashboard/stats');

export const fetchRevenueChart = () =>
  fetchWithAuth<RevenueData[]>('/admin/dashboard/revenue-chart');

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
export interface CreateMechanicData {
  name: string;
  phone: string;
  location: string;
  vehicleType: string;
  password: string;
}

export interface UpdateMechanicData {
  name?: string;
  phone?: string;
  location?: string;
  vehicleType?: string;
  password?: string;
}

export const createMechanic = (data: CreateMechanicData) =>
  fetchWithAuth<Mechanic>('/admin/mechanics', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateMechanic = (id: string, data: UpdateMechanicData) =>
  fetchWithAuth<Mechanic>(`/admin/mechanics/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const toggleMechanicVerification = (id: string, verified: boolean) =>
  fetchWithAuth<Mechanic>(`/admin/mechanics/${id}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({ verified }),
  });

export const deleteMechanic = (id: string) =>
  fetchWithAuth<{ success: boolean }>(`/admin/mechanics/${id}`, {
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

export const fetchPaymentStats = () =>
  fetchWithAuth<PaymentStats>('/admin/payments/stats');

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