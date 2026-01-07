// src/components/auth/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

function PrivateRoute({ children, allowedRoles }) {
  const { currentUser, userProfile, loading } = useAuth();

  console.log('PrivateRoute:', { currentUser: !!currentUser, userProfile: !!userProfile, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (!currentUser) {
    console.log('No current user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!userProfile) {
    console.log('No user profile, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    console.log('Wrong role, redirecting to:', userProfile.role);
    return <Navigate to={`/${userProfile.role}`} replace />;
  }

  console.log('Rendering protected content for role:', userProfile.role);
  return children;
}

export default PrivateRoute;