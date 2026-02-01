import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { Header } from '../../components/dashboard/Header';
import { useAuthStore } from '../../store/authStore';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pasale-sidebar-collapsed') === 'true';
    }
    return false;
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { onboardingComplete } = useAuthStore();

  const handleToggleCollapsed = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('pasale-sidebar-collapsed', String(newState));
      return newState;
    });
  };

  React.useEffect(() => {
    if (!onboardingComplete) {
      navigate('/business-type');
    }
  }, [onboardingComplete, navigate]);

  // Close sidebar when route changes on mobile
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen h-full bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapsed}
      />

      {/* Main content area */}
      <div className={`flex-1 w-full transition-all duration-300 ease-in-out flex flex-col min-h-screen overflow-x-hidden ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <main
          className="pt-16 sm:pt-18 lg:pt-20 flex-1 w-full pb-20 sm:pb-6 overflow-y-auto overflow-x-hidden"
        >
          {/* Responsive container with max-width for large screens - added safe bottom padding for mobile */}
          <div className="w-full max-w-1600px mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 h-full pb-safe">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

