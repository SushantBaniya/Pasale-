import React, { Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from './components/layout/ThemeProvider';
import { LoadingScreen } from './components/layout/LoadingScreen';
import { Toaster } from 'react-hot-toast';

// Pages (lazy-loaded to reduce initial bundle)
const WelcomePage = React.lazy(() => import('./app/welcome/page'));
const LoginPage = React.lazy(() => import('./app/login/page'));
const SignupPage = React.lazy(() => import('./app/signup/page'));
const ForgotPasswordPage = React.lazy(() => import('./app/forgot-password/page'));
const BusinessTypePage = React.lazy(() => import('./app/business-type/page'));
const PersonalVerificationPage = React.lazy(() => import('./app/personal-verification/page'));
const VerifyBusinessPage = React.lazy(() => import('./app/verify-business/page'));
const DashboardLayout = React.lazy(() => import('./app/dashboard/layout'));
const DashboardPage = React.lazy(() => import('./app/dashboard/page'));
const TransactionsPage = React.lazy(() => import('./app/transactions/page'));
const PartiesPage = React.lazy(() => import('./app/parties/page'));

const ExpenseMonitoringPage = React.lazy(() => import('./app/expense/page'));
const NotificationsPage = React.lazy(() => import('./app/notifications/page'));
const SettingsPage = React.lazy(() => import('./app/settings/page'));
const InventoryPage = React.lazy(() => import('./app/inventory/InventoryPage'));
const AddNewItemPage = React.lazy(() => import('./app/inventory/new'));
const ReportsPage = React.lazy(() => import('./app/reports/page'));
const BillingPage = React.lazy(() => import('./app/billing/page'));
const SalesPage = React.lazy(() => import('./app/sales/page'));
const CreateSalesInvoicePage = React.lazy(() => import('./app/sales/new'));
const PurchasePage = React.lazy(() => import('./app/purchase/page'));
const CreatePurchaseBillPage = React.lazy(() => import('./app/purchase/new'));
const QuickPOSPage = React.lazy(() => import('./app/quick-pos/page'));
const KPIDetailPage = React.lazy(() => import('./app/dashboard/kpi/[type]/page'));
const TransactionDetailPage = React.lazy(() => import('./app/transactions/detail'));
const TodaysSalesPage = React.lazy(() => import('./app/dashboard/todays-sales/page'));
const LedgerPage = React.lazy(() => import('./app/ledger/[partyId]/page'));
const PartyDetailPage = React.lazy(() => import('./app/parties/[partyId]/page'));
const ProfilePage = React.lazy(() => import('./app/profile/page'));
const OrderCartPage = React.lazy(() => import('./app/order-cart/page'));
const CountersPage = React.lazy(() => import('./app/counters/page'));
const EmployeesPage = React.lazy(() => import('./app/employees/page'));

// Route Guards - Public routes (welcome, login, forgot-password)
const PublicRoute = () => {
  return <Outlet />;
};

const OnboardingRoute = () => {
  const { isAuthenticated, onboardingComplete } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }
  if (onboardingComplete) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

const ProtectedRoute = () => {
  const { isAuthenticated, onboardingComplete } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!onboardingComplete) {
    return <Navigate to="/business-type" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-right" />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public pages - accessible without login */}
          <Route element={<PublicRoute />}>
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Onboarding-only pages */}
          <Route element={<OnboardingRoute />}>
            <Route path="/business-type" element={<BusinessTypePage />} />
            <Route path="/personal-verification" element={<PersonalVerificationPage />} />
            <Route path="/business-verification" element={<VerifyBusinessPage />} />
          </Route>

          {/* Protected app */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/transactions/:id" element={<TransactionDetailPage />} />
              <Route path="/parties" element={<PartiesPage />} />
              <Route path="/parties/:partyId" element={<PartyDetailPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/expense-monitoring" element={<ExpenseMonitoringPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/inventory/new" element={<AddNewItemPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/sales/new" element={<CreateSalesInvoicePage />} />
              <Route path="/purchase" element={<PurchasePage />} />
              <Route path="/purchase/new" element={<CreatePurchaseBillPage />} />
              <Route path="/quick-pos" element={<QuickPOSPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/dashboard/kpi/:type" element={<KPIDetailPage />} />
              <Route path="/dashboard/todays-sales" element={<TodaysSalesPage />} />
              <Route path="/ledger/:partyId" element={<LedgerPage />} />
              <Route path="/order-cart" element={<OrderCartPage />} />
              <Route path="/counters" element={<CountersPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
