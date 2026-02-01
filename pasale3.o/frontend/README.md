# Pasale 2.0 - Nepali Business Management Application

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
</p>

A comprehensive business management application designed specifically for Nepali businesses. Features bilingual support (English/Nepali), Nepali date conversion, and NPR currency formatting.

## 🚀 Features

### Core Modules
- **Dashboard** - Real-time business analytics and KPI tracking
- **Transactions** - Complete income/expense management
- **Inventory** - Product stock management with low stock alerts
- **Parties** - Customer and supplier management
- **Billing** - Invoice generation and management
- **Reports** - Detailed business reports and analytics
- **POS (Point of Sale)** - Quick sales terminal
- **Expense Monitoring** - Track and categorize expenses

### Special Features
- 🇳🇵 **Bilingual Support** - English and Nepali languages
- 📅 **Nepali Date (Bikram Sambat)** - Full BS date support
- 💰 **NPR Currency** - Nepali Rupee formatting
- 🌙 **Dark Mode** - System-aware theme switching
- 📱 **Responsive Design** - Mobile-first approach
- 📊 **Interactive Charts** - Recharts visualization

---

## 📁 Project Structure

```
pasale2.0/
├── public/                     # Static assets
├── src/
│   ├── app/                    # Page components (routes)
│   │   ├── billing/           # Invoice management
│   │   ├── business-type/     # Business type selection
│   │   ├── dashboard/         # Main dashboard & KPI pages
│   │   │   ├── page.tsx       # Dashboard main page
│   │   │   ├── layout.tsx     # Dashboard layout wrapper
│   │   │   ├── kpi/[type]/    # Dynamic KPI detail pages
│   │   │   └── todays-sales/  # Today's sales page
│   │   ├── expense-monitoring/ # Expense tracking
│   │   ├── forgot-password/   # Password recovery
│   │   ├── inventory/         # Stock management
│   │   ├── ledger/[partyId]/  # Party ledger (dynamic)
│   │   ├── login/             # Authentication
│   │   ├── notifications/     # Notification center
│   │   ├── parties/           # Customer/Supplier management
│   │   ├── personal-verification/ # User profile setup
│   │   ├── pos/               # Point of Sale terminal
│   │   ├── profile/           # User profile
│   │   ├── reports/           # Business reports
│   │   ├── settings/          # App settings
│   │   ├── transactions/      # Transaction management
│   │   │   ├── page.tsx       # Transaction list
│   │   │   └── detail.tsx     # Transaction detail view
│   │   ├── verify-business/   # Business verification
│   │   └── welcome/           # Landing page
│   │
│   ├── components/            # Reusable UI components
│   │   ├── billing/           # Billing components
│   │   │   ├── InvoiceDetail.tsx
│   │   │   └── InvoiceList.tsx
│   │   ├── dashboard/         # Dashboard components
│   │   │   ├── AddNewDialog.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── KPICard.tsx       # KPI statistic cards
│   │   │   ├── LowStockAlert.tsx
│   │   │   ├── NotificationsDropdown.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── SalesChart.tsx
│   │   │   ├── SearchDropdown.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── inventory/         # Inventory components
│   │   │   └── AddProductDialog.tsx
│   │   ├── layout/            # Layout components
│   │   │   ├── LanguageSwitcher.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── ThemeSwitcher.tsx
│   │   ├── parties/           # Party components
│   │   │   └── AddPartyDialog.tsx
│   │   ├── reports/           # Report components
│   │   │   └── ReportView.tsx
│   │   ├── scanner/           # Barcode scanner
│   │   │   └── BarcodeScanner.tsx
│   │   ├── transactions/      # Transaction components
│   │   │   └── AddTransactionDialog.tsx
│   │   └── ui/                # Base UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       └── OTPInput.tsx
│   │
│   ├── hooks/                 # Custom React hooks
│   │   └── useTheme.ts
│   │
│   ├── locales/               # Translation files
│   │   ├── en.json           # English translations
│   │   └── np.json           # Nepali translations
│   │
│   ├── store/                 # Zustand state management
│   │   ├── authStore.ts      # Authentication state
│   │   ├── businessStore.ts  # Business info state
│   │   ├── dataStore.ts      # Main data state (transactions, parties, etc.)
│   │   ├── languageStore.ts  # Language preference state
│   │   └── themeStore.ts     # Theme preference state
│   │
│   ├── utils/                 # Utility functions
│   │   ├── currency.ts       # Currency formatting
│   │   ├── i18n.ts           # Internationalization hook
│   │   └── nepaliDate.ts     # Nepali date conversion
│   │
│   ├── App.tsx               # Main app component & routing
│   ├── index.css             # Global styles & Tailwind imports
│   └── main.tsx              # App entry point
│
├── index.html                # HTML template
├── package.json              # Dependencies
├── tailwind.config.js        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
└── eslint.config.js          # ESLint configuration
```

---

## 🛠️ Tech Stack

### Frontend Framework
| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.2.0 | UI library |
| TypeScript | 5.9.3 | Type safety |
| Vite | 7.2.4 | Build tool & dev server |

### Styling
| Package | Version | Purpose |
|---------|---------|---------|
| Tailwind CSS | 4.1.18 | Utility-first CSS framework |
| @tailwindcss/vite | 4.1.18 | Tailwind Vite plugin |
| PostCSS | 8.5.6 | CSS processing |
| Autoprefixer | 10.4.23 | Vendor prefix automation |

### State Management
| Package | Version | Purpose |
|---------|---------|---------|
| Zustand | 5.0.9 | Lightweight state management |

### Routing
| Package | Version | Purpose |
|---------|---------|---------|
| React Router DOM | 6.20.0 | Client-side routing |

### Data Visualization
| Package | Version | Purpose |
|---------|---------|---------|
| Recharts | 3.5.1 | Charts and graphs |

### Icons
| Package | Version | Purpose |
|---------|---------|---------|
| React Icons | 5.5.0 | Icon library (Feather Icons) |

### Internationalization
| Package | Version | Purpose |
|---------|---------|---------|
| i18next | 25.7.2 | Localization framework |

---

## 🎨 Icons System

### Icon Library
This project uses **React Icons** with primarily **Feather Icons (Fi)** for a consistent, minimal design.

### How Icons are Used

```tsx
// Import icons from react-icons/fi
import { 
  FiHome,        // Dashboard
  FiDollarSign,  // Money/Currency
  FiPackage,     // Inventory
  FiUsers,       // Parties/Customers
  FiFileText,    // Reports/Documents
  FiTrendingUp,  // Positive trends
  FiTrendingDown,// Negative trends
  FiSettings,    // Settings
  FiPlus,        // Add actions
  FiEdit2,       // Edit actions
  FiTrash2,      // Delete actions
  FiSearch,      // Search
  FiFilter,      // Filters
  FiDownload,    // Export/Download
  FiPrinter,     // Print
  FiX,           // Close/Cancel
  FiCheck,       // Confirm/Success
  FiAlertCircle, // Warning/Alert
  FiArrowLeft,   // Back navigation
  FiArrowRight,  // Forward navigation
  FiArrowUpRight,// External link
  FiArrowDownLeft,// Incoming
} from 'react-icons/fi';

// Usage in component
<FiHome className="w-5 h-5 text-gray-600" />
```

### Icon Naming Convention
- **Fi** prefix = Feather Icons
- Icons follow semantic naming (e.g., `FiDollarSign` for money-related features)
- Size controlled via Tailwind classes (`w-4 h-4`, `w-5 h-5`, `w-6 h-6`)

### Adding New Icons
1. Browse available icons at: https://react-icons.github.io/react-icons/icons?name=fi
2. Import from `react-icons/fi`
3. Use with Tailwind size/color classes

---

## 🌐 Internationalization (i18n)

### Translation Files
Translations are stored in JSON files under `src/locales/`:

```
src/locales/
├── en.json    # English translations
└── np.json    # Nepali translations
```

### Using Translations

```tsx
// Import the hook
import { useTranslation } from '../utils/i18n';

// In your component
const MyComponent = () => {
  const { t, n, c, p, d, language } = useTranslation();
  
  return (
    <div>
      {/* Text translation */}
      <h1>{t('dashboard.title')}</h1>
      
      {/* Number formatting (converts to Nepali numerals if np) */}
      <span>{n(1234)}</span> {/* Output: 1,234 or १,२३४ */}
      
      {/* Currency formatting */}
      <span>{c(5000)}</span> {/* Output: Rs. 5,000 or रु. ५,००० */}
      
      {/* Percentage formatting */}
      <span>{p(25)}</span> {/* Output: 25% or २५% */}
      
      {/* Date formatting */}
      <span>{d('2024-01-15')}</span> {/* Converts to Bikram Sambat if np */}
    </div>
  );
};
```

### Translation Hook Return Values
| Function | Purpose |
|----------|---------|
| `t(key)` | Get translated string by key |
| `n(num)` | Format number (Nepali numerals if np) |
| `c(amount)` | Format currency (NPR) |
| `p(percent)` | Format percentage |
| `d(date)` | Format date (Bikram Sambat if np) |
| `language` | Current language ('en' or 'np') |

### Adding New Translations
1. Add key to both `en.json` and `np.json`
2. Use nested keys for organization:
```json
// en.json
{
  "dashboard": {
    "title": "Dashboard",
    "totalSales": "Total Sales"
  }
}

// np.json  
{
  "dashboard": {
    "title": "ड्यासबोर्ड",
    "totalSales": "कुल बिक्री"
  }
}
```

---

## 🗄️ State Management (Zustand)

### Store Files

| Store | File | Purpose |
|-------|------|---------|
| Auth | `authStore.ts` | User authentication state |
| Business | `businessStore.ts` | Business profile data |
| Data | `dataStore.ts` | Transactions, parties, expenses |
| Language | `languageStore.ts` | Language preference |
| Theme | `themeStore.ts` | Dark/light mode |

### Using Stores

```tsx
// Import the store
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';

// In your component
const MyComponent = () => {
  // Destructure what you need
  const { transactions, addTransaction, parties, getTotalSales } = useDataStore();
  const { user, isAuthenticated, login, logout } = useAuthStore();
  
  // Use the data
  const totalSales = getTotalSales();
  
  // Add new data
  const handleAddTransaction = (data) => {
    addTransaction({
      id: Date.now().toString(),
      ...data
    });
  };
};
```

### Data Store Structure

```typescript
interface DataState {
  // Data
  transactions: Transaction[];
  parties: Party[];
  expenses: Expense[];
  notifications: Notification[];
  
  // Actions
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addParty: (party: Party) => void;
  updateParty: (party: Party) => void;
  addExpense: (expense: Expense) => void;
  
  // Computed values
  getTotalSales: () => number;
  getTotalReceivable: () => number;
  getTotalPayable: () => number;
  getCashInHand: () => number;
}
```

### Data Persistence
Data is automatically saved to `localStorage` with key `pasale-data`.

---

## 🎯 Component Patterns

### KPI Card Component
Used across all pages for consistent statistics display:

```tsx
// src/components/dashboard/KPICard.tsx
<KPICard
  title="Total Sales"
  value={50000}          // Formatted automatically
  change={12.5}          // Percentage change
  changeType="positive"  // or "negative"
  borderColor="green"    // green, blue, red, purple, orange
  onClick={() => navigate('/kpi/sales')}
/>
```

### Page Layout Pattern
All main pages follow this structure:

```tsx
const MyPage = () => {
  const { t, c, n } = useTranslation();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold">{t('page.title')}</h1>
            <p className="text-gray-500">{t('page.description')}</p>
          </div>
          <div className="flex gap-3">
            {/* Action buttons */}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* KPI Cards */}
        </div>

        {/* Main Content */}
        <Card className="p-6">
          {/* Content */}
        </Card>
      </div>
    </div>
  );
};
```

---

## 🔌 API Integration Guide

This frontend is designed to work with a REST API. Here's how to integrate:

### 1. Create API Client

Create a new file `src/utils/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiOptions extends RequestInit {
  data?: object;
}

export const api = async (endpoint: string, options: ApiOptions = {}) => {
  const { data, ...fetchOptions } = options;
  
  const config: RequestInit = {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
      // Add auth token if exists
      ...(localStorage.getItem('token') && {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      })
    }
  };
  
  if (data) {
    config.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
};

// Convenience methods
export const apiGet = (endpoint: string) => api(endpoint);
export const apiPost = (endpoint: string, data: object) => api(endpoint, { method: 'POST', data });
export const apiPut = (endpoint: string, data: object) => api(endpoint, { method: 'PUT', data });
export const apiDelete = (endpoint: string) => api(endpoint, { method: 'DELETE' });
```

### 2. API Endpoints to Implement

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Authentication** |||
| POST | `/auth/login` | Login user |
| POST | `/auth/register` | Register new user |
| POST | `/auth/logout` | Logout user |
| POST | `/auth/send-otp` | Send OTP verification |
| POST | `/auth/verify-otp` | Verify OTP |
| GET | `/auth/profile` | Get user profile |
| **Transactions** |||
| GET | `/transactions` | List all transactions |
| GET | `/transactions/:id` | Get single transaction |
| POST | `/transactions` | Create transaction |
| PUT | `/transactions/:id` | Update transaction |
| DELETE | `/transactions/:id` | Delete transaction |
| **Parties** |||
| GET | `/parties` | List all parties |
| GET | `/parties/:id` | Get single party |
| GET | `/parties/:id/ledger` | Get party ledger |
| POST | `/parties` | Create party |
| PUT | `/parties/:id` | Update party |
| DELETE | `/parties/:id` | Delete party |
| **Products** |||
| GET | `/products` | List all products |
| GET | `/products/:id` | Get single product |
| POST | `/products` | Create product |
| PUT | `/products/:id` | Update product |
| PATCH | `/products/:id/stock` | Adjust stock |
| DELETE | `/products/:id` | Delete product |
| **Reports** |||
| GET | `/reports/profit-loss` | Profit/Loss report |
| GET | `/reports/sales` | Sales report |
| GET | `/reports/expenses` | Expense report |
| GET | `/reports/inventory` | Inventory report |
| **Invoices** |||
| GET | `/invoices` | List all invoices |
| GET | `/invoices/:id` | Get single invoice |
| POST | `/invoices` | Create invoice |
| PUT | `/invoices/:id` | Update invoice |

### 3. Update Zustand Stores for API

Example modification to `dataStore.ts`:

```typescript
import { api, apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

export const useDataStore = create<DataState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  
  // Fetch transactions from API
  fetchTransactions: async () => {
    set({ isLoading: true });
    try {
      const data = await apiGet('/transactions');
      set({ transactions: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  // Add transaction via API
  addTransaction: async (transaction) => {
    set({ isLoading: true });
    try {
      const newTransaction = await apiPost('/transactions', transaction);
      set(state => ({ 
        transactions: [...state.transactions, newTransaction],
        isLoading: false 
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  // ... other methods
}));
```

### 4. Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Pasale
VITE_APP_VERSION=2.0.0
```

### 5. File Locations for API Integration

| Feature | Store File | API Methods Needed |
|---------|------------|-------------------|
| Authentication | `src/store/authStore.ts` | login, register, verify |
| Transactions | `src/store/dataStore.ts` | CRUD operations |
| Products | Create new store | CRUD + stock adjust |
| Reports | `src/store/dataStore.ts` | Computed getters |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/pasale2.0.git

# Navigate to project
cd pasale2.0

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `npm run dev` | Start development server |
| Build | `npm run build` | Build for production |
| Preview | `npm run preview` | Preview production build |
| Lint | `npm run lint` | Run ESLint |

### Build for Production

```bash
# Build
npm run build

# Preview build
npm run preview
```

Build output will be in the `dist/` folder.

---

## 📱 Responsive Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| Default | 0px | Mobile |
| sm | 640px | Small tablets |
| md | 768px | Tablets |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large screens |

---

## 🎨 Design System

### Colors (Light Mode)
- **Primary**: Blue (`blue-600`)
- **Success**: Emerald (`emerald-500`)
- **Warning**: Amber (`amber-500`)
- **Error**: Red (`red-500`)
- **Background**: Gray (`gray-50`)
- **Text**: Gray (`gray-900`)

### Colors (Dark Mode)
- **Background**: Gray (`gray-900`)
- **Cards**: Gray (`gray-800`)
- **Text**: Gray (`gray-100`)
- **Borders**: Gray (`gray-700`)

### KPI Card Color Meanings
- **Green/Emerald**: Income, Profit, Positive values
- **Blue**: Neutral metrics, Total counts
- **Red**: Expenses, Payable, Negative values
- **Purple**: Special metrics, Balance
- **Amber/Orange**: Warnings, Low stock

---

## 📄 License

This project is private and proprietary.

---

## 👨‍💻 Development Team

Made with ❤️ for Nepali businesses.