// src/components/tenant/TenantDashboard.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Home, Receipt, AlertCircle, Car, Trash2, LogOut, Building2, CheckCircle
} from 'lucide-react';
import { subscribeToBills } from '../../services/billingService';
import { subscribeToUserComplaints } from '../../services/complaintService';
import { getTenantProperty } from '../../services/landlordService';
import { formatCurrency, formatRelativeTime } from '../../utils/realtimeUtils';
import Complaints from './Complaints';
import ParkingManagement from './ParkingManagement';
import WasteManagement from './WasteManagement';

export default function TenantDashboard() {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [property, setProperty] = useState(null);

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const unsubscribers = [];
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    try {
      const unsubBills = subscribeToBills(user.email, (data) => {
        setBills(data);
        setLoading(false);
      });
      unsubscribers.push(unsubBills);
    } catch (error) {
      console.error('Error subscribing to bills:', error);
      setLoading(false);
    }

    try {
      const unsubComplaints = subscribeToUserComplaints(user.uid, (data) => {
        setComplaints(data);
        setLoading(false);
      });
      unsubscribers.push(unsubComplaints);
    } catch (error) {
      console.error('Error subscribing to complaints:', error);
      setLoading(false);
    }

    getTenantProperty(user.email)
      .then(prop => {
        setProperty(prop);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading property:', error);
        setLoading(false);
      });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user?.email, user?.uid]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    { id: 'overview', icon: Home, label: 'Overview' },
    { id: 'bills', icon: Receipt, label: 'My Bills' },
    { id: 'complaints', icon: AlertCircle, label: 'Complaints' },
    { id: 'parking', icon: Car, label: 'Parking' },
    { id: 'waste', icon: Trash2, label: 'Waste Management' },
  ];

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-72 bg-white shadow-sm min-h-screen flex flex-col">
          <div className="p-6 flex-1">
            {/* Professional Logo */}
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-base">Tenant Portal</h2>
                <p className="text-xs text-gray-500 truncate max-w-[180px]">
                  {userProfile?.name || user?.email}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Logout */}
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeSection === 'overview' && (
            <div>
              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                  Overview
                </h1>
                <p className="text-sm text-gray-600">Welcome back, {userProfile?.name || 'Tenant'}!</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  icon={Receipt}
                  title="Total Bills"
                  value={bills.length}
                  subtitle={`${bills.filter(b => b.status === 'pending').length} pending`}
                  iconColor="text-blue-600"
                  iconBg="bg-blue-50"
                />
                <StatCard
                  icon={AlertCircle}
                  title="Complaints"
                  value={complaints.length}
                  subtitle={`${complaints.filter(c => c.status === 'open').length} open`}
                  iconColor="text-orange-600"
                  iconBg="bg-orange-50"
                />
                <StatCard
                  icon={Home}
                  title="Property"
                  value={property?.flatNumber || 'N/A'}
                  subtitle={property?.address || 'No property assigned'}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50"
                />
                <StatCard
                  icon={Receipt}
                  title="Total Paid"
                  value={formatCurrency(bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.total || 0), 0))}
                  subtitle={`${bills.filter(b => b.status === 'paid').length} bills paid`}
                  iconColor="text-purple-600"
                  iconBg="bg-purple-50"
                />
              </div>

              {/* Recent Bills */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Bills</h2>
                  <button 
                    onClick={() => setActiveSection('bills')}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {bills.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No bills yet</p>
                    </div>
                  ) : (
                    bills.slice(0, 3).map(bill => (
                      <div key={bill.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{bill.month}</p>
                            <p className="text-sm text-gray-500">{formatRelativeTime(bill.generatedAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(bill.total)}</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            bill.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            bill.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {bill.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Complaints */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Complaints</h2>
                  <button 
                    onClick={() => setActiveSection('complaints')}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {complaints.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No complaints yet</p>
                    </div>
                  ) : (
                    complaints.slice(0, 3).map(complaint => (
                      <div key={complaint.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{complaint.title}</p>
                            <p className="text-sm text-gray-500">{complaint.category}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          complaint.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                          complaint.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {complaint.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'bills' && (
            <div>
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">My Bills</h1>
                <p className="text-sm text-gray-600">View and manage your billing history</p>
              </div>

              {bills.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-sm">No bills yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bills.map(bill => (
                    <div key={bill.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">{bill.month}</h3>
                          <p className="text-xs text-gray-500">{formatRelativeTime(bill.generatedAt)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          bill.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          bill.status === 'overdue' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {bill.status}
                        </span>
                      </div>
                      
                      <div className="border-t border-gray-100 pt-4 space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rent:</span>
                          <span className="text-gray-900">{formatCurrency(bill.rent || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Maintenance:</span>
                          <span className="text-gray-900">{formatCurrency(bill.maintenance || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Water Charges:</span>
                          <span className="text-gray-900">{formatCurrency(bill.waterCharges || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Electricity Charges:</span>
                          <span className="text-gray-900">{formatCurrency(bill.electricityCharges || 0)}</span>
                        </div>
                        <div className="border-t border-gray-100 pt-2 flex justify-between">
                          <span className="font-semibold text-gray-900">Total Amount:</span>
                          <span className="font-semibold text-emerald-600">{formatCurrency(bill.total)}</span>
                        </div>
                        {bill.dueDate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Due Date:</span>
                            <span className={`font-medium ${
                              new Date(bill.dueDate) < new Date() && bill.status === 'pending' 
                                ? 'text-red-600' 
                                : 'text-gray-700'
                            }`}>
                              {new Date(bill.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {bill.status === 'pending' && (
                        <button
                          onClick={() => handlePayNow(bill)}
                          className="w-full px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Pay Now - {formatCurrency(bill.total)}
                        </button>
                      )}

                      {bill.status === 'paid' && bill.paidAt && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-emerald-900">Paid on {new Date(bill.paidAt).toLocaleDateString()}</p>
                            {bill.paymentMethod && (
                              <p className="text-emerald-700">via {bill.paymentMethod}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'complaints' && <Complaints />}
          {activeSection === 'parking' && <ParkingManagement />}
          {activeSection === 'waste' && <WasteManagement />}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, title, value, subtitle, iconColor, iconBg }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <h3 className="text-gray-600 text-xs font-medium mb-1">{title}</h3>
      <p className="text-2xl font-semibold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function handlePayNow(bill) {
  console.log('Pay now clicked for bill:', bill.id);
  // Payment logic here
}
