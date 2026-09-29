import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { PublicLayout } from './layouts/PublicLayout';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { GoogleAuthSuccessPage } from './pages/GoogleAuthSuccessPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyFarmPage } from './pages/MyFarmPage';
import { SatellitePage } from './pages/SatellitePage';
import { SoilHealthPage } from './pages/SoilHealthPage';
import { WeatherPage } from './pages/WeatherPage';
import { CropDoctorPage } from './pages/CropDoctorPage';
import { RegenerativePage } from './pages/RegenerativePage';
import { AssistantPage } from './pages/AssistantPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { SettingsPage } from './pages/SettingsPage';

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
          </Route>

          {/* Authentication Screen (Login & Create Account) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage />} />

          {/* Google OAuth success handler — reads JWT from URL, establishes session */}
          <Route path="/auth/google/success" element={<GoogleAuthSuccessPage />} />

          {/* Protected Farmer App Shell - Requires Authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="farm" element={<MyFarmPage />} />
              <Route path="satellite" element={<SatellitePage />} />
              <Route path="soil" element={<SoilHealthPage />} />
              <Route path="weather" element={<WeatherPage />} />
              <Route path="disease" element={<CropDoctorPage />} />
              <Route path="regenerative" element={<RegenerativePage />} />
              <Route path="assistant" element={<AssistantPage />} />
              <Route path="knowledge" element={<KnowledgePage />} />
              <Route path="settings" element={<SettingsPage />} />
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
