// src/components/tenant/TenantDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getTenantBills } from '../../services/billingService';
import { 
  Receipt, 
  Download, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

function TenantDashboard() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadBills();
  }, []);

  async function loadBills() {
    try {
      setLoading(true);
      // For MVP, show sample data if no bills
      const billsData = await getTenantBills(userProfile.uid);
      setBills(billsData);
    } catch (error) {
      console.error('Error loading bills:', error);
      // Show sample bill for demo
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

  const currentBill = bills[0];
  const previousBills = bills.slice(1, 4);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/50" onClick={() => setSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl p-6 animate-slide-up">
          <button 
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <SidebarContent userProfile={userProfile} onLogout={handleLogout} />
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto px-4">
            <SidebarContent userProfile={userProfile} onLogout={handleLogout} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-4"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {userProfile.name.split(' ')[0]}! 👋
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Here's what's happening with your flat today
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-3">
              <div className="bg-primary-50 px-4 py-2 rounded-lg">
                <p className="text-xs text-primary-600 font-medium">Flat Number</p>
                <p className="text-lg font-bold text-primary-700">{userProfile.flatNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          {/* Current Bill Card - Featured */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Month</h2>
            {currentBill ? (
              <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Receipt className="w-5 h-5" />
                        <span className="text-sm font-medium text-blue-100">
                          Bill for {new Date(currentBill.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-5xl font-bold mb-1">
                        ₹{currentBill.total.toLocaleString()}
                      </div>
                      <p className="text-blue-100 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Due by {new Date(currentBill.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      currentBill.status === 'paid' 
                        ? 'bg-green-400/20 text-green-50'
                        : currentBill.status === 'overdue'
                        ? 'bg-red-400/20 text-red-50'
                        : 'bg-yellow-400/20 text-yellow-50'
                    }`}>
                      {currentBill.status === 'paid' ? 'Paid' : 
                       currentBill.status === 'overdue' ? 'Overdue' : 'Pending'}
                    </span>
                  </div>

                  {/* Bill Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-blue-100 text-sm mb-1">Rent</p>
                      <p className="text-2xl font-bold">₹{currentBill.rent.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-blue-100 text-sm mb-1">Maintenance</p>
                      <p className="text-2xl font-bold">₹{currentBill.maintenance.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-blue-100 text-sm mb-1">Parking</p>
                      <p className="text-2xl font-bold">₹{currentBill.parking.toLocaleString()}</p>
                    </div>
                    {currentBill.water > 0 && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <p className="text-blue-100 text-sm mb-1">Water</p>
                        <p className="text-2xl font-bold">₹{currentBill.water.toLocaleString()}</p>
                      </div>
                    )}
                    {currentBill.electricity > 0 && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <p className="text-blue-100 text-sm mb-1">Electricity</p>
                        <p className="text-2xl font-bold">₹{currentBill.electricity.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button className="btn flex-1 bg-white text-primary-600 hover:bg-blue-50 font-semibold py-3">
                      Pay Now
                    </button>
                    <button className="btn flex-1 bg-white/10 border-2 border-white hover:bg-white/20 backdrop-blur-sm font-semibold py-3 flex items-center justify-center">
                      <Download className="w-5 h-5 mr-2" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-card p-12 text-center">
                <Receipt className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bills Yet</h3>
                <p className="text-gray-600">Your bills will appear here once generated</p>
              </div>
            )}
          </div>

          {/* Previous Bills & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Previous Bills */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View All
                </button>
              </div>
              
              {previousBills.length > 0 ? (
                <div className="space-y-3">
                  {previousBills.map((bill) => (
                    <div key={bill.id} className="card hover:shadow-hover cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            bill.status === 'paid' ? 'bg-green-100' : 'bg-yellow-100'
                          }`}>
                            {bill.status === 'paid' ? (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : (
                              <Clock className="w-6 h-6 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {new Date(bill.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-sm text-gray-600">
                              ₹{bill.total.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className={`badge ${
                          bill.status === 'paid' ? 'badge-success' : 'badge-warning'
                        }`}>
                          {bill.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card text-center py-12">
                  <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600">No payment history available</p>
                </div>
              )}
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              
              <button className="card w-full text-left hover:shadow-hover group">
                <div className="flex items-center space-x-4">
                  <div className="bg-orange-100 p-3 rounded-xl group-hover:bg-orange-200 transition-colors">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Raise Complaint</p>
                    <p className="text-sm text-gray-600">Report an issue</p>
                  </div>
                </div>
              </button>

              <div className="card">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Next Payment</p>
                    <p className="text-sm text-gray-600">
                      {currentBill ? new Date(currentBill.dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 w-3/4"></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">6 days remaining</p>
              </div>

              <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  💡 Pro Tip
                </p>
                <p className="text-sm text-gray-700">
                  Set up auto-pay to never miss a payment and earn rewards!
                </p>
                <button className="mt-3 text-sm text-primary-600 font-medium hover:text-primary-700">
                  Learn More →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ userProfile, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <div className="bg-primary-100 p-2 rounded-xl">
            <Receipt className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">SocietyHub</h1>
            <p className="text-xs text-gray-600">Tenant Portal</p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <nav className="space-y-2">
          <button className="w-full text-left px-4 py-3 bg-primary-50 text-primary-600 rounded-lg font-medium">
            Dashboard
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
            Bills & Payments
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
            Complaints
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
            Parking
          </button>
        </nav>
      </div>

      <div className="mt-auto border-t border-gray-200 pt-4">
        <div className="flex items-center space-x-3 px-4 py-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold">
            {userProfile.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userProfile.name}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {userProfile.email}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default TenantDashboard;