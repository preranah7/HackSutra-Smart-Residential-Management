// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Auth
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import PrivateRoute from './components/auth/PrivateRoute';

// Dashboards 
import TenantDashboard from './components/tenant/TenantDashboard';
import LandlordDashboard from './components/landlord/LandlordDashboard';
import AdminDashboard from './components/admin/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route 
            path="/tenant/*" 
            element={
              <PrivateRoute allowedRoles={['tenant']}>
                <TenantDashboard />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/landlord/*" 
            element={
              <PrivateRoute allowedRoles={['landlord']}>
                <LandlordDashboard />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/admin/*" 
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;