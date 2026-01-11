// src/components/landlord/LandlordDashboard.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Home, Building, Receipt, TrendingUp, Users, LogOut,
  Car, Trash2, AlertCircle, Building2, Menu, X
} from 'lucide-react';
import { getLandlordProperties, getLandlordStats } from '../../services/landlordService';
import { formatCurrency } from '../../utils/realtimeUtils';
import PropertyManagement from './PropertyManagement';
import BillGeneration from './BillGeneration';
import ParkingManagement from '../tenant/ParkingManagement';
import WasteManagement from '../tenant/WasteManagement';
import Complaints from '../tenant/Complaints';

export default function LandlordDashboard() {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    loadDashboardData();

    return () => clearTimeout(loadingTimeout);
  }, [user?.uid]);

  async function loadDashboardData() {
    if (!user?.uid) return;

    try {
      const [statsData, propertiesData] = await Promise.all([
        getLandlordStats(user.uid),
        getLandlordProperties(user.uid)
      ]);

      setStats(statsData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

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
    { id: 'properties', icon: Building, label: 'Properties' },
    { id: 'billing', icon: Receipt, label: 'Bill Generation' },
    { id: 'parking', icon: Car, label: 'Parking' },
    { id: 'waste', icon: Trash2, label: 'Waste Management' },
    { id: 'complaints', icon: AlertCircle, label: 'Complaints' },
  ];

  const handleMenuClick = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex relative overflow-x-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static w-72 bg-white shadow-sm min-h-screen flex flex-col z-40 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-200">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-900 text-base truncate">Landlord Portal</h2>
              <p className="text-xs text-gray-500 truncate">
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
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          {activeSection === 'overview' && (
            <div className="max-w-full">
              {/* Heading */}
              <div className="mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">
                  Overview
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {userProfile?.name || 'Landlord'}!
                </p>
              </div>

              {/* Stats Grid */}
              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <StatCard
                    icon={Building}
                    title="Total Properties"
                    value={stats.totalProperties}
                    subtitle={`${stats.occupiedProperties} occupied`}
                    iconColor="text-blue-600"
                    iconBg="bg-blue-50"
                  />
                  <StatCard
                    icon={Users}
                    title="Active Tenants"
                    value={stats.activeTenants}
                    subtitle={`${stats.vacantProperties} vacant`}
                    iconColor="text-emerald-600"
                    iconBg="bg-emerald-50"
                  />
                  <StatCard
                    icon={Receipt}
                    title="Monthly Revenue"
                    value={formatCurrency(stats.totalRevenue)}
                    subtitle={`${stats.collectionRate}% collected`}
                    iconColor="text-purple-600"
                    iconBg="bg-purple-50"
                  />
                  <StatCard
                    icon={TrendingUp}
                    title="Pending Bills"
                    value={stats.pendingBills}
                    subtitle={formatCurrency(stats.pendingAmount)}
                    iconColor="text-orange-600"
                    iconBg="bg-orange-50"
                  />
                </div>
              )}

              {/* Properties Overview */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Your Properties</h2>
                {properties.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Building className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600 mb-4 text-sm">No properties added yet</p>
                    <button
                      onClick={() => handleMenuClick('properties')}
                      className="px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      Add Your First Property
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {properties.map(property => {
                      const isOccupied = property.status === 'occupied' || 
                                        property.tenantId || 
                                        property.tenant;
                      
                      return (
                        <div key={property.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3 gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{property.flatNumber}</h3>
                              <p className="text-xs text-gray-500 truncate">{property.address}</p>
                            </div>
                            <span className={`px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              isOccupied
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {isOccupied ? 'Occupied' : 'Vacant'}
                            </span>
                          </div>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-gray-600 text-xs sm:text-sm">Rent:</span>
                              <span className="font-medium text-gray-900 text-xs sm:text-sm">
                                {formatCurrency(property.monthlyRent)}
                              </span>
                            </div>
                            {property.tenant && (
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-gray-600 text-xs sm:text-sm">Tenant:</span>
                                <span className="font-medium text-gray-900 truncate text-xs sm:text-sm">{property.tenant}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'properties' && <PropertyManagement />}
          {activeSection === 'billing' && <BillGeneration />}
          {activeSection === 'parking' && <ParkingManagement />}
          {activeSection === 'waste' && <WasteManagement />}
          {activeSection === 'complaints' && <Complaints />}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, title, value, subtitle, iconColor, iconBg }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`p-2 sm:p-2.5 rounded-lg ${iconBg}`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
        </div>
      </div>
      <h3 className="text-gray-600 text-xs font-medium mb-1">{title}</h3>
      <p className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 break-words">{value}</p>
      <p className="text-xs text-gray-500 break-words">{subtitle}</p>
    </div>
  );
}