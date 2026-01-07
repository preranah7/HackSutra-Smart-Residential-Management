// src/components/landlord/LandlordDashboard.jsx
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Home, DollarSign, Users, TrendingUp, LogOut } from 'lucide-react';

function LandlordDashboard() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Landlord Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, {userProfile.name}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-xl p-12 text-white text-center mb-8">
          <div className="bg-white/20 backdrop-blur-sm w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Home className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Landlord Portal</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Manage your rental properties, track payments, and communicate with tenants - all in one place.
          </p>
          <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30">
            <div className="animate-pulse w-3 h-3 bg-white rounded-full mr-3"></div>
            <span className="font-semibold">Coming in Version 2.0</span>
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Payment Tracking
            </h3>
            <p className="text-gray-600 text-sm">
              Monitor rent payments, track outstanding amounts, and view payment history for all your properties.
            </p>
          </div>

          <div className="card">
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tenant Management
            </h3>
            <p className="text-gray-600 text-sm">
              View tenant details, lease agreements, and communication history all in one dashboard.
            </p>
          </div>

          <div className="card">
            <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Financial Reports
            </h3>
            <p className="text-gray-600 text-sm">
              Generate comprehensive reports on rental income, expenses, and ROI across all properties.
            </p>
          </div>
        </div>

        {/* Sample Properties Preview */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Properties (Preview)</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card opacity-60 cursor-not-allowed">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                      {i}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Flat {300 + i}</p>
                      <p className="text-sm text-gray-600">Sunshine Apartments</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{15 + i},000/month</p>
                    <span className="badge badge-success">Occupied</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandlordDashboard;