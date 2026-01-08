// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import TenantDashboard from './components/tenant/TenantDashboard';
import LandlordDashboard from './components/landlord/LandlordDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import InitializeData from './components/admin/InitializeData';
import PrivateRoute from './components/auth/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Initialization Routes */}
          <Route 
            path="/initialize" 
            element={
              <PrivateRoute>
                <InitializeData />
              </PrivateRoute>
            } 
          />
          
          {/* Tenant Routes */}
          <Route 
            path="/tenant/*" 
            element={
              <PrivateRoute allowedRoles={['tenant']}>
                <TenantDashboard />
              </PrivateRoute>
            } 
          />
          
          {/* Landlord Routes */}
          <Route 
            path="/landlord/*" 
            element={
              <PrivateRoute allowedRoles={['landlord']}>
                <LandlordDashboard />
              </PrivateRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/*" 
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
