import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { FeatureGate, ProtectedRoute } from '@/components/auth/RouteGuards';
import { AuthProvider } from '@/contexts/AuthContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { HakedisPage } from '@/features/hakedis/HakedisPage';
import { MetrajPage } from '@/features/metraj/MetrajPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { PuantajPage } from '@/features/puantaj/PuantajPage';
import { TenantsPage } from '@/features/tenants/TenantsPage';

export default function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route
                  path="tenants"
                  element={
                    <FeatureGate adminOnly>
                      <TenantsPage />
                    </FeatureGate>
                  }
                />
                <Route path="projects" element={<ProjectsPage />} />
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
  );
}
