// src/components/landlord/LandlordDashboard.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, DollarSign, Users, LogOut, Building, Plus, Receipt
} from 'lucide-react';
import { 
  getLandlordProperties, 
  getLandlordRevenue 
} from '../../services/landlordService';
import { getLandlordBillingStats } from '../../services/billingService';
import LoadingSpinner from '../common/LoadingSpinner';
import PropertyManagement from './PropertyManagement';
import BillGeneration from './BillGeneration';

function LandlordDashboard() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [properties, setProperties] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [billingStats, setBillingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (userProfile?.uid) {
      loadDashboardData();
      // Real-time updates every 30 seconds
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [userProfile]);

  async function loadDashboardData() {
    try {
      const [propertiesData, revenueData, billingData] = await Promise.all([
        getLandlordProperties(userProfile.uid),
        getLandlordRevenue(userProfile.uid),
        getLandlordBillingStats(userProfile.uid)
      ]);

      setProperties(propertiesData);
      setRevenue(revenueData);
      setBillingStats(billingData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  const currentPath = location.pathname.split('/')[2] || 'dashboard';

  const menuItems = [
    { path: '', label: 'Dashboard', icon: Home },
    { path: 'properties', label: 'Properties', icon: Building },
    { path: 'generate-bill', label: 'Generate Bills', icon: Receipt }
  ];

  if (loading && currentPath === 'dashboard') {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">Landlord Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
                <p className="text-xs text-gray-500">{userProfile.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="p-4 space-y-2">
            {menuItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(`/landlord/${item.path}`)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPath === (item.path || 'dashboard')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={
              <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Welcome back, {userProfile.name}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Manage your rental properties and track payments
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Properties</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {properties.length}
                        </p>
                      </div>
                      <Home className="w-12 h-12 text-blue-500 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          ₹{revenue?.totalMonthly?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <DollarSign className="w-12 h-12 text-green-500 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Collected</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          ₹{billingStats?.collected?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <Receipt className="w-12 h-12 text-yellow-500 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          ₹{billingStats?.pending?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <DollarSign className="w-12 h-12 text-red-500 opacity-20" />
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => navigate('/landlord/properties')}
                    className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Plus className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Add New Property</h3>
                        <p className="text-sm text-gray-500">Register a new rental property</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/landlord/generate-bill')}
                    className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 p-3 rounded-lg">
                        <Receipt className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Generate Bills</h3>
                        <p className="text-sm text-gray-500">Create bills using AI</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            } />
            <Route path="/properties" element={<PropertyManagement />} />
            <Route path="/generate-bill" element={<BillGeneration />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default LandlordDashboard;
