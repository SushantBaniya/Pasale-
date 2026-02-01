import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from './components/layout/ThemeProvider';
import { LoadingScreen } from './components/layout/LoadingScreen';

// Pages
import WelcomePage from './app/welcome/page';
import LoginPage from './app/login/page';
import SignupPage from './app/signup/page';
import ForgotPasswordPage from './app/forgot-password/page';
import BusinessTypePage from './app/business-type/page';
import PersonalVerificationPage from './app/personal-verification/page';
import VerifyBusinessPage from './app/verify-business/page';
import DashboardLayout from './app/dashboard/layout';
import DashboardPage from './app/dashboard/page';
import TransactionsPage from './app/transactions/page';
import PartiesPage from './app/parties/page';

import ExpenseMonitoringPage from './app/expense-monitoring/page';
import NotificationsPage from './app/notifications/page';
import SettingsPage from './app/settings/page';
import InventoryPage from './app/inventory/page';
import ReportsPage from './app/reports/page';
import BillingPage from './app/billing/page';
import KPIDetailPage from './app/dashboard/kpi/[type]/page';
import TransactionDetailPage from './app/transactions/detail';
import TodaysSalesPage from './app/dashboard/todays-sales/page';
import LedgerPage from './app/ledger/[partyId]/page';
import PartyDetailPage from './app/parties/[partyId]/page';
import ProfilePage from './app/profile/page';

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
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      {isLoading && <LoadingScreen />}
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
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/dashboard/kpi/:type" element={<KPIDetailPage />} />
            <Route path="/dashboard/todays-sales" element={<TodaysSalesPage />} />
            <Route path="/ledger/:partyId" element={<LedgerPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
