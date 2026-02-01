/**
 * Enhanced API Client with JWT Token Refresh
 * Handles automatic token refresh on 401 errors
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Track if we're currently refreshing the token
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Subscribe to token refresh
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Notify all subscribers with new token
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Get tokens from storage
export const getAccessToken = (): string | null => {
  try {
    // First try the direct auth_token (set by login page)
    const directToken = localStorage.getItem('auth_token');
    if (directToken) {
      return directToken;
    }

    // Then try access_token
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      return accessToken;
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

export const getRefreshToken = (): string | null => {
  try {
    // First try direct refresh_token
    const directRefresh = localStorage.getItem('refresh_token');
    if (directRefresh) {
      return directRefresh;
    }

    // Then try the Zustand persist store
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      if (parsed.state?.refreshToken) {
        return parsed.state.refreshToken;
      }
    }
  } catch {
    // ignore
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

// Save tokens to storage
export const setTokens = (accessToken: string, refreshToken?: string) => {
  try {
    // Save to direct localStorage
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('access_token', accessToken);

    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }

    // Also update Zustand persist store
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      parsed.state = {
        ...parsed.state,
        accessToken,
        refreshToken: refreshToken || parsed.state?.refreshToken,
        isAuthenticated: true,
      };
      localStorage.setItem('auth-storage', JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
};

// Clear tokens from storage
export const clearTokens = () => {
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Update Zustand persist store
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      parsed.state = {
        ...parsed.state,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      };
      localStorage.setItem('auth-storage', JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
};

// Refresh the access token
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    console.log('No refresh token available');
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      console.error('Token refresh failed:', response.status);
      // If refresh fails, clear all tokens
      clearTokens();
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access;

    if (newAccessToken) {
      setTokens(newAccessToken, data.refresh || refreshToken);
      console.log('Token refreshed successfully');
      return newAccessToken;
    }

    return null;
  } catch (error) {
    console.error('Token refresh error:', error);
    clearTokens();
    return null;
  }
};

// Main API client class with automatic token refresh
class ApiClient {
  async request<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: string | null; status: number }> {
    const token = getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    try {
      let response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      // If 401, try to refresh the token
      if (response.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;

          const newToken = await refreshAccessToken();

          isRefreshing = false;

          if (newToken) {
            onRefreshed(newToken);

            // Retry the original request with new token
            headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(fullUrl, {
              ...options,
              headers,
            });
          } else {
            // Token refresh failed, redirect to login
            window.location.href = '/login';
            return { data: null, error: 'Session expired. Please login again.', status: 401 };
          }
        } else {
          // Wait for the token to be refreshed
          return new Promise((resolve) => {
            subscribeTokenRefresh(async (newToken) => {
              headers['Authorization'] = `Bearer ${newToken}`;
              const retryResponse = await fetch(fullUrl, {
                ...options,
                headers,
              });

              if (retryResponse.ok) {
                const data = await retryResponse.json();
                resolve({ data, error: null, status: retryResponse.status });
              } else {
                resolve({ data: null, error: 'Request failed after token refresh', status: retryResponse.status });
              }
            });
          });
        }
      }

      if (!response.ok) {
        let errorMessage = 'An error occurred';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        return { data: null, error: errorMessage, status: response.status };
      }

      const data = await response.json();
      return { data, error: null, status: response.status };
    } catch (error) {
      console.error('API request error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0
      };
    }
  }

  // Helper methods that throw on error and return data directly
  async get<T = any>(url: string): Promise<T> {
    const result = await this.request<T>(url, { method: 'GET' });
    if (result.error) {
      throw new Error(result.error);
    }
    return result.data as T;
  }

  async post<T = any>(url: string, data: any): Promise<T> {
    const result = await this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (result.error) {
      throw new Error(result.error);
    }
    return result.data as T;
  }

  async put<T = any>(url: string, data: any): Promise<T> {
    const result = await this.request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (result.error) {
      throw new Error(result.error);
    }
    return result.data as T;
  }

  async patch<T = any>(url: string, data: any): Promise<T> {
    const result = await this.request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (result.error) {
      throw new Error(result.error);
    }
    return result.data as T;
  }

  async delete<T = any>(url: string): Promise<T> {
    const result = await this.request<T>(url, { method: 'DELETE' });
    if (result.error) {
      throw new Error(result.error);
    }
    return result.data as T;
  }
}

export const apiClient = new ApiClient();

export default apiClient;