// API Service for backend integration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Get token from localStorage (checks multiple possible locations)
const getAuthToken = (): string | null => {
  try {
    // First try the direct auth_token (set by login page)
    const directToken = localStorage.getItem('auth_token');
    if (directToken) {
      return directToken;
    }
    
    // Then try the Zustand persist store
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      if (parsed.state?.accessToken) {
        return parsed.state.accessToken;
      }
    }
  } catch {
    // ignore
  }
  return null;
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
    errorMessage = errorData.error || errorData.message || errorMessage;
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
  // Customer fields
  name: string;
  email?: string;
  phone_no?: string;
  Customer_code?: string;
  address?: string;
  open_balance?: number;
  credit_limmit?: number;
  preferred_payment_method?: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'UPI';
  loyalty_points?: number;
  referred_by?: string;
  notes?: string;
  // Supplier fields
  code?: string;
}

export interface ApiPartyResponse {
  message: string;
  party: {
    id: number;
    Category_type: string;
    is_active: boolean;
    is_updated_at: string;
  };
  customer?: {
    id: number;
    party: number;
    name: string;
    email: string | null;
    phone_no: string | null;
    Customer_code: string | null;
    address: string | null;
    open_balance: string;
    credit_limmit: string;
    preferred_payment_method: string | null;
    loyalty_points: number;
    referred_by: string | null;
    notes: string | null;
  };
  supplier?: {
    id: number;
    party: number;
    name: string;
    code: string;
  };
}

export interface ApiPartiesListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{
    id: number;
    Category_type: string;
    is_active: boolean;
    is_updated_at: string;
  }>;
}

export const partyApi = {
  // Get all parties
  getAll: async (categoryType?: 'Customer' | 'Supplier'): Promise<ApiPartiesListResponse> => {
    let url = '/parties/';
    if (categoryType) {
      url += `?category_type=${categoryType}`;
    }
    const response = await fetchWithAuth(url);
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  // Get single party by ID
  getById: async (id: number): Promise<ApiPartyResponse> => {
    const response = await fetchWithAuth(`/parties/?id=${id}`);
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  // Create new party (customer or supplier)
  create: async (data: ApiPartyData): Promise<ApiPartyResponse> => {
    const response = await fetchWithAuth('/parties/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  // Update party
  update: async (id: number, data: Partial<ApiPartyData>): Promise<ApiPartyResponse> => {
    const response = await fetchWithAuth(`/parties/?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  // Delete party
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await fetchWithAuth(`/parties/?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },
};

// ================================
// EXPENSE API
// ================================

export interface ApiExpenseData {
  category: 'Rent' | 'Utilities' | 'Salary' | 'Inventory' | 'Transport' | 'Food' | 'Office Supplies' | 'Phone' | 'Marketing' | 'Other';
  amount: number;
  description?: string;
  date: string; // YYYY-MM-DD format
  is_necessary?: boolean;
}

export interface ApiExpenseResponse {
  message: string;
  expense: {
    id: number;
    user: number;
    category: string;
    amount: string;
    description: string | null;
    date: string;
    is_necessary: boolean;
  };
}

export interface ApiExpensesListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{
    id: number;
    user: number;
    category: string;
    amount: string;
    description: string | null;
    date: string;
    is_necessary: boolean;
  }>;
}

export const expenseApi = {
  // Get all expenses
  getAll: async (): Promise<ApiExpensesListResponse> => {
    const response = await fetchWithAuth('/expenses/');
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  // Create new expense
  create: async (data: ApiExpenseData): Promise<ApiExpenseResponse> => {
    const response = await fetchWithAuth('/expenses/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  // Update expense
  update: async (id: number, data: Partial<ApiExpenseData>): Promise<ApiExpenseResponse> => {
    const response = await fetchWithAuth(`/expenses/?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  // Delete expense
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await fetchWithAuth(`/expenses/?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },
};

// ================================
// AUTH API (for storing tokens)
// ================================

export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      parsed.state = {
        ...parsed.state,
        accessToken,
        refreshToken,
      };
      localStorage.setItem('auth-storage', JSON.stringify(parsed));
    } else {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          accessToken,
          refreshToken,
          isAuthenticated: true,
        },
        version: 0,
      }));
    }
  } catch {
    // ignore
  }
};

export const clearAuthTokens = () => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      delete parsed.state?.accessToken;
      delete parsed.state?.refreshToken;
      localStorage.setItem('auth-storage', JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
};

export default {
  party: partyApi,
  expense: expenseApi,
  setAuthTokens,
  clearAuthTokens,
};
