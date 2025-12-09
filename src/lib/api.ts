const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://motofix-admin-dashboard.onrender.com';

// Hardcoded admin token for now
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE';

export const getAuthToken = () => {
  return localStorage.getItem('motofix_admin_token') || ADMIN_TOKEN;
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('motofix_admin_token', token);
};

export const clearAuthToken = () => {
  localStorage.removeItem('motofix_admin_token');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('motofix_admin_token');
};

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  
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
    throw new ApiError(response.status, `API Error: ${response.statusText}`);
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
export const adminLogin = async (password: string): Promise<{ token: string }> => {
  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Invalid password');
  }

  return response.json();
};
