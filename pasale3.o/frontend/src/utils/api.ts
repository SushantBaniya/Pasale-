import { apiClient, getBusinessId } from './apiClient';

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
    return apiClient.get(url);
  },

  getById: async (id: number | string): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.get(`/parties/b${bid}/p${id}/`);
  },

  create: async (data: ApiPartyData): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.post(`/parties/b${bid}/`, data);
  },

  update: async (id: number | string, data: Partial<ApiPartyData>): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.put(`/parties/b${bid}/p${id}/`, data);
  },

  delete: async (id: number | string): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.delete(`/parties/b${bid}/p${id}/`);
  },
};

// ================================
// PRODUCT API
// ================================

export const productApi = {
  getAll: async (): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.get(`/products/b${bid}/`);
  },
  
  getOne: async (id: number | string): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.get(`/products/b${bid}/p${id}/`);
  },

  create: async (data: any): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.post(`/products/b${bid}/`, data);
  },

  update: async (id: number | string, data: any): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.put(`/products/b${bid}/p${id}/`, data);
  },

  delete: async (id: number | string): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.delete(`/products/b${bid}/p${id}/`);
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
    return apiClient.get(`/counters/b${bid}/`);
  },

  create: async (data: ApiCounterData): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.post(`/counters/b${bid}/`, data);
  },
  
  update: async (id: number | string, data: Partial<ApiCounterData>): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.put(`/counters/b${bid}/c${id}/`, data);
  },

  delete: async (id: number | string): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.delete(`/counters/b${bid}/c${id}/`);
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
  getAll: async (filters?: { counterId?: number | string, customerId?: number | string }): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    let url = `/orders/b${bid}/`;
    if (filters?.counterId) url += `cntr${filters.counterId}/`;
    else if (filters?.customerId) url += `c${filters.customerId}/`;
    return apiClient.get(url);
  },

  getOne: async (id: number | string): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.get(`/orders/b${bid}/o${id}/`);
  },

  create: async (data: ApiOrderData): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.post(`/orders/b${bid}/`, data);
  },

  addToCart: async (data: any): Promise<any> => {
    return apiClient.post('/cart/', data);
  },

  getStatuses: async (): Promise<any> => {
    return apiClient.get('/order-statuses/');
  },

  update: async (id: number | string, data: any): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.put(`/orders/b${bid}/o${id}/`, data);
  },
};

// ================================
// EXPENSE API
// ================================

export interface ApiExpenseData {
  category: string;
  amount: number;
  date: string;
  description?: string;
  is_necessary?: boolean;
}

export const expenseApi = {
  getAll: async (): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.get(`/expenses/b${bid}/`);
  },

  create: async (data: any): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.post(`/expenses/b${bid}/`, data);
  },
  
  update: async (id: number | string, data: any): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.put(`/expenses/b${bid}/?id=${id}`, data);
  },

  delete: async (id: number | string): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.delete(`/expenses/b${bid}/?id=${id}`);
  },
};

// ================================
// BILLING API
// ================================

export const billingApi = {
  getAll: async (filters?: { status?: string }): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    let url = `/billing/b${bid}/`;
    if (filters?.status) url += `?status=${filters.status}`;
    return apiClient.get(url);
  },

  getById: async (id: number | string): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.get(`/billing/b${bid}/b${id}/`);
  },

  create: async (data: any): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.post(`/billing/b${bid}/`, data);
  },

  update: async (id: number | string, data: any): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.put(`/billing/b${bid}/?id=${id}`, data);
  },

  delete: async (id: number | string): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.delete(`/billing/b${bid}/?id=${id}`);
  },
};

// ================================
// EMPLOYEE API
// ================================

export const employeeApi = {
  getAll: async (): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.get(`/employees/b${bid}/`);
  },

  getById: async (id: number | string): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.get(`/employees/b${bid}/e${id}/`);
  },

  create: async (data: any): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.post(`/employees/b${bid}/`, data);
  },
};

// ================================
// SCHEDULER API
// ================================

export const schedulerApi = {
  getAll: async (): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.get(`/scheduler/b${bid}/`);
  },
  
  create: async (data: any): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.post(`/scheduler/b${bid}/`, data);
  },
};

// ================================
// INVENTORY INTELLIGENCE API
// ================================

export const inventoryApi = {
  getRules: async (): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.get(`/inventory/rules/b${bid}/`);
  },

  getSuggestions: async (): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.get(`/inventory/suggestions/b${bid}/`);
  },

  getAlerts: async (): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.get(`/inventory/alerts/b${bid}/`);
  },

  resolveAlert: async (alertId: number | string): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.put(`/inventory/alerts/b${bid}/${alertId}/resolve/`, {});
  },

  retrain: async (): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    return apiClient.post(`/inventory/retrain/b${bid}/`, {});
  },
};

// ================================
// BUSINESS API
// ================================

export const businessApi = {
  getProfile: async (): Promise<any> => {
    return apiClient.get('/business/profile/');
  },
  
  updateProfile: async (data: any): Promise<any> => {
    return apiClient.put('/business/profile/', data);
  }
};

// ================================
// REPORT API
// ================================

export const reportApi = {
  getSummary: async (params?: { start_date?: string, end_date?: string }): Promise<any> => {
    const bid = getBusinessId();
    if (!bid) throw new Error('Business ID not found');
    let url = `/reports/summary/b${bid}/`;
    if (params) {
      const query = new URLSearchParams(params as any).toString();
      if (query) url += `?${query}`;
    }
    return apiClient.get(url);
  },
};

export default {
  party: partyApi,
  product: productApi,
  counter: counterApi,
  order: orderApi,
  expense: expenseApi,
  billing: billingApi,
  employee: employeeApi,
  scheduler: schedulerApi,
  inventory: inventoryApi,
  business: businessApi,
  report: reportApi,
};
