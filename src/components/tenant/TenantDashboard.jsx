// src/components/tenant/TenantDashboard.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToBills } from '../../services/billingService';
import {
  Receipt, Download, Calendar, TrendingUp, AlertCircle, CheckCircle,
  Clock, LogOut, Menu, X, Car, Trash2, Home, MessageSquare
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import ParkingManagement from './ParkingManagement';
import WasteManagement from './WasteManagement';
import Complaints from './Complaints';

function TenantDashboard() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real-time bills subscription
  useEffect(() => {
    if (userProfile?.uid) {
      setLoading(true);
      const unsubscribe = subscribeToBills(userProfile.uid, (billsData) => {
        if (billsData.length === 0) {
          // Show sample bill if no real data
          setBills([{
            id: 'sample',
            month: new Date().toISOString().slice(0, 7),
            rent: 15000,
            maintenance: 2000,
            parking: 1000,
            water: 500,
            electricity: 800,
            total: 19300,
            status: 'pending',
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
          }]);
        } else {
          setBills(billsData);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [userProfile]);

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
    { path: 'parking', label: 'Parking', icon: Car },
    { path: 'waste', label: 'Waste Management', icon: Trash2 },
    { path: 'complaints', label: 'Complaints', icon: MessageSquare }
  ];

  if (loading && currentPath === 'dashboard') {
    return <LoadingSpinner />;
  }

  const currentBill = bills[0];
  const pendingBills = bills.filter(b => b.status === 'pending');
  const overdueBills = bills.filter(b => b.status === 'overdue');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center ml-4 lg:ml-0">
                <Home className="w-8 h-8 text-blue-600" />
                <h1 className="ml-2 text-xl font-bold text-gray-900">Tenant Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
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
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          mt-16 lg:mt-0
        `}>
          <nav className="p-4 space-y-2">
            {menuItems.map(item => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(`/tenant/${item.path}`);
                  setSidebarOpen(false);
                }}
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
                {/* Welcome Section */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome back, {userProfile.name}!
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Here's what's happening with your flat today
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Flat Number</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {userProfile.flatNumber || 'N/A'}
                        </p>
                      </div>
                      <Home className="w-12 h-12 text-blue-500 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Current Rent</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          ₹{currentBill?.rent?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <Receipt className="w-12 h-12 text-green-500 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending Bills</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {pendingBills.length}
                        </p>
                      </div>
                      <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Overdue</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {overdueBills.length}
                        </p>
                      </div>
                      <AlertCircle className="w-12 h-12 text-red-500 opacity-20" />
                    </div>
                  </div>
                </div>

                {/* Current Bill Section */}
                {currentBill && (
                  <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Current Month Bill</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(currentBill.month + '-01').toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        currentBill.status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : currentBill.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {currentBill.status.charAt(0).toUpperCase() + currentBill.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Rent</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          ₹{currentBill.rent?.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Maintenance</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          ₹{currentBill.maintenance?.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Parking</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          ₹{currentBill.parking?.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Total</p>
                        <p className="text-xl font-bold text-blue-900 mt-1">
                          ₹{currentBill.total?.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {currentBill.status !== 'paid' && (
                      <div className="flex space-x-4">
                        <button className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition">
                          Pay Now
                        </button>
                        <button className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition flex items-center">
                          <Download className="w-5 h-5 mr-2" />
                          Download
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Bills */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Payment History</h3>
                  {bills.length > 0 ? (
                    <div className="space-y-3">
                      {bills.slice(0, 5).map(bill => (
                        <div key={bill.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg ${
                              bill.status === 'paid' ? 'bg-green-100' : 'bg-yellow-100'
                            }`}>
                              {bill.status === 'paid' ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <Clock className="w-5 h-5 text-yellow-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {new Date(bill.month + '-01').toLocaleDateString('en-US', { 
                                  month: 'long', 
                                  year: 'numeric' 
                                })}
                              </p>
                              <p className="text-sm text-gray-500">{bill.status}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              ₹{bill.total?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No payment history available</p>
                  )}
                </div>

                {/* Tip Section */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 mt-8">
                  <div className="flex items-start space-x-4">
                    <TrendingUp className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900">💡 Pro Tip</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Set up auto-pay to never miss a payment and earn rewards!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            } />
            <Route path="/parking" element={<ParkingManagement />} />
            <Route path="/waste" element={<WasteManagement />} />
            <Route path="/complaints" element={<Complaints />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default TenantDashboard;
