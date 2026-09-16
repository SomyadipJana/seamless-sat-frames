import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import SatellitesPage from './pages/SatellitesPage';
import ModelConfigPage from './pages/ModelConfigPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page Route */}
        <Route path="/landing" element={<LandingPage />} />
        
        {/* Dashboard Layout and Nested Routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="satellites" element={<SatellitesPage />} />
          <Route path="config" element={<ModelConfigPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
