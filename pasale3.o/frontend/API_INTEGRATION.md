# API Integration Guide

This document explains how to integrate the backend API with the Pasale frontend application.

## Overview

The API layer is structured as follows:

```
src/services/api/
├── config.ts          # API configuration and endpoints
├── httpClient.ts      # HTTP client with auth token handling
├── authService.ts     # Authentication API calls
├── dashboardService.ts # Dashboard data API calls
├── userService.ts     # User profile API calls
└── index.ts           # Central exports

src/hooks/
├── useApi.ts          # Generic API hook
├── useAuth.ts         # Authentication hook
├── useDashboard.ts    # Dashboard data hook
└── index.ts           # Central exports
```

## Quick Start

### 1. Configure the API Base URL

Update the `.env.local` file (copy from `.env.example`):

```env
VITE_API_BASE_URL=http://your-backend-url/api
```

### 2. Switch from Mock to Real API

Each service file has mock implementations clearly marked with:
```typescript
// TODO: Remove mock data when backend is ready
// START MOCK
...mock code...
// END MOCK

// Uncomment below when backend is ready:
// ...real API code...
```

To switch to real API:
1. Remove or comment out the mock code section
2. Uncomment the real API code

## API Services

### Auth Service (`authService.ts`)

```typescript
import { authService } from '@/services/api';

// Login
const response = await authService.login({
  phone: '9812345678',  // or email: 'user@example.com'
  password: 'password123'
});

// Register
await authService.register({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '9812345678',
  password: 'password123',
  confirmPassword: 'password123',
  userType: 'personal'
});

// Send OTP
await authService.sendOTP({
  phone: '9812345678',
  type: 'phone',
  purpose: 'verification'
});

// Verify OTP
await authService.verifyOTP({
  phone: '9812345678',
  otp: '123456',
  purpose: 'verification'
});

// Forgot Password
await authService.forgotPassword({ phone: '9812345678' });

// Reset Password
await authService.resetPassword({
  phone: '9812345678',
  otp: '123456',
  newPassword: 'newPassword123',
  confirmPassword: 'newPassword123'
});

// Logout
await authService.logout();
```

### Dashboard Service (`dashboardService.ts`)

```typescript
import { dashboardService } from '@/services/api';

// Get KPI Stats
const stats = await dashboardService.getKPIStats();
// Returns: { totalSales, totalReceivable, totalPayable, cashInHand, netBalance, ...changes }

// Get Revenue Chart Data
const chartData = await dashboardService.getRevenueChartData('weekly');
// Returns: { weekly: [...], monthly: [...], yearly: [...] }

// Get Low Stock Items
const items = await dashboardService.getLowStockItems();
// Returns: [{ id, name, minStock, current }, ...]

// Get Complete Dashboard Summary
const summary = await dashboardService.getDashboardSummary();
// Returns all dashboard data in one call
```

### User Service (`userService.ts`)

```typescript
import { userService } from '@/services/api';

// Get Profile
const profile = await userService.getProfile();

// Update Profile
await userService.updateProfile({
  name: 'New Name',
  email: 'new@email.com'
});

// Upload Photo
await userService.uploadPhoto(file);

// Change Password
await userService.changePassword({
  currentPassword: 'oldPassword',
  newPassword: 'newPassword',
  confirmPassword: 'newPassword'
});
```

## Using Hooks

### useAuth Hook

```typescript
import { useAuth } from '@/hooks';

function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();

  const handleLogin = async () => {
    const success = await login({
      phone: '9812345678',
      password: 'password123'
    });
    
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {error && <p className="error">{error.message}</p>}
      <button disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
}
```

### useDashboard Hook

```typescript
import { useDashboard } from '@/hooks';

function DashboardPage() {
  const { 
    kpiStats, 
    chartData, 
    lowStockItems, 
    isLoading, 
    error, 
    refresh 
  } = useDashboard({
    autoFetch: true,
    refreshInterval: 60000 // Refresh every minute
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      <KPICards stats={kpiStats} />
      <RevenueChart data={chartData} />
      <LowStockAlert items={lowStockItems} />
    </div>
  );
}
```

### Generic useApi Hook

```typescript
import { useApi } from '@/hooks';
import { someApiFunction } from '@/services/api';

function SomeComponent() {
  const { execute, data, isLoading, error, reset } = useApi(someApiFunction);

  const handleAction = async () => {
    try {
      const result = await execute(params);
      // Handle success
    } catch (err) {
      // Error is already set in state
    }
  };

  return (
    // ...
  );
}
```

## API Endpoints Configuration

All endpoints are configured in `config.ts`:

```typescript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    // ...more
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    // ...more
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
    KPI: '/dashboard/kpi',
    // ...more
  },
  // ...more
};
```

## Token Management

Tokens are automatically managed:
- Stored in localStorage (`auth_token`, `refresh_token`)
- Automatically added to request headers
- Cleared on logout or 401 response

```typescript
import { getAuthToken, setAuthToken, clearTokens } from '@/services/api';

// Manually manage tokens if needed
const token = getAuthToken();
setAuthToken('new_token');
clearTokens();
```

## Error Handling

All API calls return consistent error format:

```typescript
interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}
```

Handle errors in components:

```typescript
const { error } = useAuth();

if (error) {
  // Display main error message
  console.log(error.message);
  
  // Display field-specific errors
  if (error.errors) {
    Object.entries(error.errors).forEach(([field, messages]) => {
      console.log(`${field}: ${messages.join(', ')}`);
    });
  }
}
```

## Backend API Requirements

The backend should implement these endpoints with the following request/response formats:

### POST /auth/login
Request:
```json
{
  "email": "user@example.com",  // or "phone": "9812345678"
  "password": "password123"
}
```
Response:
```json
{
  "user": {
    "id": "1",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "9812345678",
    "userType": "personal",
    "isEmailVerified": true,
    "isPhoneVerified": true,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "tokens": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600
  }
}
```

### POST /auth/send-otp
Request:
```json
{
  "phone": "9812345678",  // or "email": "user@example.com"
  "type": "phone",
  "purpose": "verification"  // or "password-reset"
}
```
Response:
```json
{
  "message": "OTP sent successfully"
}
```

### POST /auth/verify-otp
Request:
```json
{
  "phone": "9812345678",
  "otp": "123456",
  "purpose": "verification"
}
```
Response:
```json
{
  "verified": true,
  "tokens": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600
  }
}
```

### GET /dashboard/stats
Response:
```json
{
  "totalSales": 125000,
  "totalReceivable": 45000,
  "totalPayable": 32000,
  "cashInHand": 78000,
  "netBalance": 13000,
  "salesChange": 12.5,
  "receivableChange": -2.4,
  "payableChange": 5.1,
  "cashChange": 0,
  "balanceChange": 1.2
}
```

## Testing Mock Data

For development, the app uses mock data by default:
- Login: Phone `9812345678` or Email `demo@pasale.com` with password `demo123`
- OTP: Use `123456` for verification

## Migration Checklist

When your backend is ready:

1. [ ] Update `VITE_API_BASE_URL` in `.env.local`
2. [ ] In each service file:
   - [ ] Remove/comment mock code blocks
   - [ ] Uncomment real API calls
3. [ ] Test each endpoint:
   - [ ] Login/Register
   - [ ] OTP send/verify
   - [ ] Password reset
   - [ ] Dashboard data
   - [ ] User profile
4. [ ] Verify token handling
5. [ ] Test error scenarios
