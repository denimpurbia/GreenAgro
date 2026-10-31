import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { PublicLayout } from './layouts/PublicLayout';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute, RoleProtectedRoute } from './components/auth/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { GoogleAuthSuccessPage } from './pages/GoogleAuthSuccessPage';
import { DashboardPage } from './pages/DashboardPage';
import { GovernmentDashboardPage } from './pages/GovernmentDashboardPage';
import { AccountVerificationPage } from './pages/AccountVerificationPage';
import { SchemesPage } from './pages/SchemesPage';
import { MyFarmPage } from './pages/MyFarmPage';
import { SatellitePage } from './pages/SatellitePage';
import { SoilHealthPage } from './pages/SoilHealthPage';
import { WeatherPage } from './pages/WeatherPage';
import { CropDoctorPage } from './pages/CropDoctorPage';
import { RegenerativePage } from './pages/RegenerativePage';
import { AssistantPage } from './pages/AssistantPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { SettingsPage } from './pages/SettingsPage';
import { LakesPage } from './pages/LakesPage';
import { LakeDetailPage } from './pages/LakeDetailPage';
import { WatershedPage } from './pages/WatershedPage';
import { AravalliPage } from './pages/AravalliPage';
import { CommunityReportsPage } from './pages/CommunityReportsPage';
import { MarketPage } from './pages/MarketPage';
import { LandscapePage } from './pages/LandscapePage';
import { AlertsPage } from './pages/AlertsPage';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes with Public Header & Footer */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<LandingPage />} />
            <Route path="/about" element={<LandingPage />} />
            <Route path="/brics-network" element={<KnowledgePage />} />
            <Route path="/contact" element={<LandingPage />} />
            <Route path="/reports" element={<CommunityReportsPage />} />
            <Route path="/lakes" element={<Navigate to="/app/lakes" replace />} />
            <Route path="/aravalli" element={<Navigate to="/app/aravalli" replace />} />
            <Route path="/landscape" element={<Navigate to="/app/landscape" replace />} />
          </Route>

          {/* Authentication Screen (Login & Create Account) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage />} />

          {/* Google OAuth success handler — reads JWT from URL, establishes session */}
          <Route path="/auth/google/success" element={<GoogleAuthSuccessPage />} />

          {/* Protected App Shell - Requires Verified Authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppLayout />}>
              {/* Farmer & Shared Modules */}
              <Route index element={<DashboardPage />} />
              <Route path="farm" element={<MyFarmPage />} />
              <Route path="satellite" element={<SatellitePage />} />
              <Route path="soil" element={<SoilHealthPage />} />
              <Route path="weather" element={<WeatherPage />} />
              <Route path="disease" element={<CropDoctorPage />} />
              <Route path="market" element={<MarketPage />} />
              <Route path="reports" element={<CommunityReportsPage />} />
              <Route path="regenerative" element={<RegenerativePage />} />
              <Route path="assistant" element={<AssistantPage />} />
              <Route path="knowledge" element={<KnowledgePage />} />
              <Route path="schemes" element={<SchemesPage />} />
              <Route path="settings" element={<SettingsPage />} />

              {/* Government / Organization Admin Protected Modules */}
              <Route element={<RoleProtectedRoute allowedRoles={['govt_org']} />}>
                <Route path="gov" element={<GovernmentDashboardPage />} />
                <Route path="gov/regional" element={<GovernmentDashboardPage />} />
                <Route path="gov/verifications" element={<AccountVerificationPage />} />
                <Route path="admin/verifications" element={<AccountVerificationPage />} />
                <Route path="landscape" element={<LandscapePage />} />
                <Route path="lakes" element={<LakesPage />} />
                <Route path="lakes/:slug" element={<LakeDetailPage />} />
                <Route path="watershed" element={<WatershedPage />} />
                <Route path="aravalli" element={<AravalliPage />} />
                <Route path="alerts" element={<AlertsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
