import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PlatformLayout } from '@/components/platform/PlatformLayout';
import { FeatureGate, PlatformRoute, ProtectedRoute } from '@/components/auth/RouteGuards';
import { DialogProvider } from '@/contexts/DialogContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { DailyReportsPage } from '@/features/daily-reports/DailyReportsPage';
import { HakedisPage } from '@/features/hakedis/HakedisPage';
import { InventoryPage } from '@/features/inventory/InventoryPage';
import { MetrajPage } from '@/features/metraj/MetrajPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { PuantajPage } from '@/features/puantaj/PuantajPage';
import { UsersPage } from '@/features/users/UsersPage';
import { DemoRequestPage } from '@/features/marketing/DemoRequestPage';
import { LandingPage } from '@/features/marketing/LandingPage';
import { PlatformDemoRequestsPage } from '@/features/platform/PlatformDemoRequestsPage';
import { PlatformDashboardPage } from '@/features/platform/PlatformDashboardPage';
import { PlatformNewTenantWizardPage } from '@/features/platform/PlatformNewTenantWizardPage';
import { PlatformPlansPage } from '@/features/platform/PlatformPlansPage';
import { PlatformSubscriptionsPage } from '@/features/platform/PlatformSubscriptionsPage';
import { PlatformTenantDetailPage } from '@/features/platform/PlatformTenantDetailPage';
import { PlatformTenantsPage } from '@/features/platform/PlatformTenantsPage';

export default function App() {
  return (
    <DialogProvider>
      <AuthProvider>
        <TenantProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/demo-talep" element={<DemoRequestPage />} />
              <Route path="/register" element={<Navigate to="/demo-talep" replace />} />

              <Route path="/platform" element={<PlatformRoute />}>
                <Route element={<PlatformLayout />}>
                  <Route index element={<PlatformDashboardPage />} />
                  <Route path="tenants" element={<PlatformTenantsPage />} />
                  <Route path="tenants/new" element={<PlatformNewTenantWizardPage />} />
                  <Route path="tenants/:tenantId" element={<PlatformTenantDetailPage />} />
                  <Route path="demo-requests" element={<PlatformDemoRequestsPage />} />
                  <Route path="plans" element={<PlatformPlansPage />} />
                  <Route path="subscriptions" element={<PlatformSubscriptionsPage />} />
                </Route>
              </Route>

              <Route path="/app" element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route
                    path="projects"
                    element={
                      <FeatureGate anyClaim={['Projects.Admin', 'Sites.Admin']}>
                        <ProjectsPage />
                      </FeatureGate>
                    }
                  />
                  <Route
                    path="users"
                    element={
                      <FeatureGate claim="Users.Read">
                        <UsersPage />
                      </FeatureGate>
                    }
                  />
                  <Route
                    path="metraj"
                    element={
                      <FeatureGate module="Metraj">
                        <MetrajPage />
                      </FeatureGate>
                    }
                  />
                  <Route
                    path="puantaj"
                    element={
                      <FeatureGate module="Puantaj">
                        <PuantajPage />
                      </FeatureGate>
                    }
                  />
                  <Route
                    path="gunluk-saha-raporu"
                    element={
                      <FeatureGate module="Puantaj" claim="DailySiteReports.Read">
                        <DailyReportsPage />
                      </FeatureGate>
                    }
                  />
                  <Route
                    path="malzeme-stok"
                    element={
                      <FeatureGate
                        module="Puantaj"
                        claim="Inventory.Read"
                      >
                        <InventoryPage />
                      </FeatureGate>
                    }
                  />
                  <Route
                    path="hakedis"
                    element={
                      <FeatureGate module="Hakedis">
                        <HakedisPage />
                      </FeatureGate>
                    }
                  />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TenantProvider>
      </AuthProvider>
    </DialogProvider>
  );
}
