// API Service for backend integration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Get token from localStorage
const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('auth_token') || localStorage.getItem('access_token');
  } catch {
    return null;
  }
};

// Get business_id from localStorage
const getBusinessId = (): string | null => {
  try {
    return localStorage.getItem('business_id');
  } catch {
    return null;
  }
};

// Generic fetch wrapper with auth
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  return response;
};

// Error handling helper
const handleApiError = async (response: Response): Promise<never> => {
  let errorMessage = 'An error occurred';
  try {
    const errorData = await response.json();
    errorMessage = errorData.error || errorData.message || JSON.stringify(errorData) || errorMessage;
  } catch {
    errorMessage = response.statusText || errorMessage;
  }
  throw new Error(errorMessage);
};

// ================================
// PARTY API
// ================================

export interface ApiPartyData {
  Category_type: 'Customer' | 'Supplier';
  is_active?: boolean;
  name: string;
  email?: string;
  phone_no?: string;
  Customer_code?: string;
  address?: string;
  open_balance?: number;
  credit_limmit?: number;
  preferred_payment_method?: string;
  loyalty_points?: number;
  referred_by?: string;
  notes?: string;
  code?: string;
}

export const partyApi = {
  getAll: async (categoryType?: 'Customer' | 'Supplier'): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    let url = `/parties/b${bid}/`;
    if (categoryType) url += `?category_type=${categoryType}`;
    const response = await fetchWithAuth(url);
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  getById: async (id: number): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    const response = await fetchWithAuth(`/parties/b${bid}/p${id}/`);
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  create: async (data: ApiPartyData): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    const response = await fetchWithAuth(`/parties/b${bid}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  update: async (id: number, data: Partial<ApiPartyData>): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    const response = await fetchWithAuth(`/parties/b${bid}/p${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  delete: async (id: number): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    const response = await fetchWithAuth(`/parties/b${bid}/p${id}/`, {
      method: 'DELETE',
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },
};

// ================================
// PRODUCT API
// ================================

export const productApi = {
  getAll: async (): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    const response = await fetchWithAuth(`/products/b${bid}/`);
    if (!response.ok) await handleApiError(response);
    return response.json();
  },
};

// ================================
// COUNTER API
// ================================

export interface ApiCounterData {
  counter_number: number;
  description?: string;
  is_active?: boolean;
}

export const counterApi = {
  getAll: async (): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    const response = await fetchWithAuth(`/counters/b${bid}/`);
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  create: async (data: ApiCounterData): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    const response = await fetchWithAuth(`/counters/b${bid}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },
};

// ================================
// ORDER / CART API
// ================================

export interface ApiOrderData {
  customer_id?: number;
  counter_id?: number;
  items: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
  }>;
  total_amount: number;
  discount?: number;
  tax?: number;
}

export const orderApi = {
  create: async (data: ApiOrderData): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    const response = await fetchWithAuth(`/orders/b${bid}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  addToCart: async (data: any): Promise<any> => {
    const response = await fetchWithAuth('/cart/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },
};

// ================================
// EXPENSE API
// ================================

export const expenseApi = {
  getAll: async (): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    const response = await fetchWithAuth(`/expenses/b${bid}/`);
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  create: async (data: any): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    const response = await fetchWithAuth(`/expenses/b${bid}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },
};

export default {
  party: partyApi,
  product: productApi,
  counter: counterApi,
  order: orderApi,
  expense: expenseApi,
};
