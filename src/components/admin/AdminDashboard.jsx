// src/components/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, AlertCircle, Car, Building,
  LogOut, Shield , Receipt
} from 'lucide-react';
import { subscribeToAllComplaints, updateComplaintStatus } from '../../services/complaintService';
import { subscribeToParkingSlots, getParkingStats } from '../../services/parkingService';
import { formatRelativeTime, formatCurrency } from '../../utils/realtimeUtils';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import { collection, onSnapshot, query, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Real-time data states
  const [complaints, setComplaints] = useState([]);
  const [bills, setBills] = useState([]);
  const [properties, setProperties] = useState([]);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [parkingStats, setParkingStats] = useState(null);
  const [wasteRequests, setWasteRequests] = useState([]);
  const [users, setUsers] = useState([]);

  const [alert, setAlert] = useState(null);

  // Subscribe to real-time data
  useEffect(() => {
    const unsubscribers = [];

    // Subscribe to complaints
    const unsubComplaints = subscribeToAllComplaints((data) => {
      setComplaints(data);
    });
    unsubscribers.push(unsubComplaints);

    // Subscribe to bills
    const billsQuery = query(collection(db, 'bills'));
    const unsubBills = onSnapshot(billsQuery, (snapshot) => {
      const billsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBills(billsData);
    });
    unsubscribers.push(unsubBills);

    // Subscribe to properties
    const propsQuery = query(collection(db, 'properties'));
    const unsubProps = onSnapshot(propsQuery, (snapshot) => {
      const propsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProperties(propsData);
    });
    unsubscribers.push(unsubProps);

    // Subscribe to parking slots
    const unsubParking = subscribeToParkingSlots((data) => {
      setParkingSlots(data);
      getParkingStats().then(setParkingStats);
    });
    unsubscribers.push(unsubParking);

    // Subscribe to waste requests
    const wasteQuery = query(collection(db, 'wasteRequests'));
    const unsubWaste = onSnapshot(wasteQuery, (snapshot) => {
      const wasteData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWasteRequests(wasteData);
    });
    unsubscribers.push(unsubWaste);

    // Subscribe to users
    const usersQuery = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    });
    unsubscribers.push(unsubUsers);

    setLoading(false);

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  // Calculate statistics
  const stats = {
    totalUsers: users.length,
    totalTenants: users.filter(u => u.role === 'tenant').length,
    totalLandlords: users.filter(u => u.role === 'landlord').length,
    totalProperties: properties.length,
    occupiedProperties: properties.filter(p => p.tenantId).length,
    totalComplaints: complaints.length,
    openComplaints: complaints.filter(c => c.status === 'open').length,
    inProgressComplaints: complaints.filter(c => c.status === 'in-progress').length,
    resolvedComplaints: complaints.filter(c => c.status === 'resolved').length,
    totalBills: bills.length,
    pendingBills: bills.filter(b => b.status === 'pending').length,
    paidBills: bills.filter(b => b.status === 'paid').length,
    totalRevenue: bills.reduce((sum, b) => sum + (b.total || 0), 0),
    collectedRevenue: bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.total || 0), 0),
    pendingWasteRequests: wasteRequests.filter(w => w.status === 'pending').length,
    totalWasteRequests: wasteRequests.length,
  };

  const handleComplaintStatusChange = async (complaintId, newStatus, response = null) => {
    try {
      await updateComplaintStatus(complaintId, newStatus, response);
      setAlert({ type: 'success', message: 'Complaint status updated successfully' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to update complaint status' });
    }
  };

  const handleWasteStatusUpdate = async (requestId, newStatus) => {
    try {
      const requestRef = doc(db, 'wasteRequests', requestId);
      await updateDoc(requestRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setAlert({ type: 'success', message: 'Waste request status updated successfully' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to update waste request status' });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setAlert({ type: 'error', message: 'Failed to logout' });
    }
  };

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'users', icon: Users, label: 'User Management' },
    { id: 'properties', icon: Building, label: 'Properties' },
    { id: 'bills', icon: FileText, label: 'Bill Tracking' },
    { id: 'complaints', icon: AlertCircle, label: 'Complaints' },
    { id: 'parking', icon: Car, label: 'Parking Management' },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {alert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      <div className="w-72 bg-white shadow-sm min-h-screen flex flex-col">
        <div className="p-6 flex-1">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-base">Admin Portal</h2>
              <p className="text-xs text-gray-500">Welcome back!</p>
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
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${isActive
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
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={Users}
                title="Total Users"
                value={stats.totalUsers}
                subtitle={`${stats.totalTenants} Tenants, ${stats.totalLandlords} Landlords`}
                iconColor="text-blue-600"
                iconBg="bg-blue-50"
              />
              <StatCard
                icon={Building}
                title="Properties"
                value={stats.totalProperties}
                subtitle={`${stats.occupiedProperties} Occupied`}
                iconColor="text-green-600"
                iconBg="bg-green-50"
              />
              <StatCard
                icon={AlertCircle}
                title="Complaints"
                value={stats.totalComplaints}
                subtitle={`${stats.openComplaints} Open, ${stats.inProgressComplaints} In Progress`}
                iconColor="text-orange-600"
                iconBg="bg-orange-50"
              />
              <StatCard
                icon={Receipt}
                title="Revenue"
                value={formatCurrency(stats.totalRevenue)}
                subtitle={`${formatCurrency(stats.collectedRevenue)} Collected`}
                iconColor="text-purple-600"
                iconBg="bg-purple-50"
              />

            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Complaints */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Complaints</h3>
                <div className="space-y-3">
                  {complaints.slice(0, 5).map(complaint => (
                    <div key={complaint.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{complaint.title}</p>
                        <p className="text-sm text-gray-600">{complaint.category}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${complaint.status === 'open' ? 'bg-red-100 text-red-700' :
                          complaint.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                        }`}>
                        {complaint.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parking Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Parking Overview</h3>
                {parkingStats && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Total Slots</span>
                      <span className="font-bold text-gray-900">{parkingStats.totalSlots}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-green-700">Available</span>
                      <span className="font-bold text-green-900">{parkingStats.available}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-red-700">Occupied</span>
                      <span className="font-bold text-red-900">{parkingStats.occupied}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-yellow-700">Reserved</span>
                      <span className="font-bold text-yellow-900">{parkingStats.reserved}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'users' && (
          <UserManagementSection users={users} />
        )}

        {activeSection === 'properties' && (
          <PropertiesSection properties={properties} />
        )}

        {activeSection === 'bills' && (
          <BillTrackingSection bills={bills} />
        )}

        {activeSection === 'complaints' && (
          <ComplaintsSection
            complaints={complaints}
            onStatusChange={handleComplaintStatusChange}
          />
        )}

        {activeSection === 'parking' && (
          <ParkingSection parkingSlots={parkingSlots} parkingStats={parkingStats} />
        )}

        {activeSection === 'waste' && (
          <WasteSection
            wasteRequests={wasteRequests}
            onStatusUpdate={handleWasteStatusUpdate}
          />
        )}
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


// User Management Section 
function UserManagementSection({ users }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{user.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'landlord' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                    }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatRelativeTime(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Properties Section 
function PropertiesSection({ properties }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Properties Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map(property => (
          <div key={property.id} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{property.flatNumber}</h3>
                <p className="text-sm text-gray-600">{property.address}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${property.tenantId ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                {property.tenantId ? 'Occupied' : 'Vacant'}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Rent:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(property.monthlyRent)}</span>
              </div>
              {property.tenant && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tenant:</span>
                  <span className="font-semibold text-gray-900">{property.tenant}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bill Tracking Section 
function BillTrackingSection({ bills }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Bill Tracking</h1>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bills.map(bill => (
              <tr key={bill.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {bill.tenantName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {bill.flatNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {bill.month}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                  {formatCurrency(bill.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${bill.status === 'paid' ? 'bg-green-100 text-green-700' :
                      bill.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                    {bill.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Complaints Section 
function ComplaintsSection({ complaints, onStatusChange }) {
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');

  const handleStatusUpdate = (complaintId, newStatus) => {
    onStatusChange(complaintId, newStatus, adminResponse || null);
    setSelectedComplaint(null);
    setAdminResponse('');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Complaints Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {complaints.map(complaint => (
          <div key={complaint.id} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">{complaint.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ml-4 ${complaint.priority === 'emergency' ? 'bg-red-100 text-red-700' :
                  complaint.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    complaint.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                }`}>
                {complaint.priority}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium text-gray-900">{complaint.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted:</span>
                <span className="font-medium text-gray-900">{formatRelativeTime(complaint.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User:</span>
                <span className="font-medium text-gray-900">{complaint.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${complaint.status === 'open' ? 'text-red-600' :
                    complaint.status === 'in-progress' ? 'text-yellow-600' :
                      'text-green-600'
                  }`}>
                  {complaint.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {complaint.status === 'open' && (
                <button
                  onClick={() => handleStatusUpdate(complaint.id, 'in-progress')}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                >
                  Start Working
                </button>
              )}
              {complaint.status === 'in-progress' && (
                <button
                  onClick={() => handleStatusUpdate(complaint.id, 'resolved')}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Parking Section 
function ParkingSection({ parkingSlots, parkingStats }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Parking Management</h1>

      {parkingStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total Slots</h3>
            <p className="text-3xl font-bold text-gray-900">{parkingStats.totalSlots}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-lg p-6">
            <h3 className="text-green-700 text-sm font-medium mb-2">Available</h3>
            <p className="text-3xl font-bold text-green-900">{parkingStats.available}</p>
          </div>
          <div className="bg-red-50 rounded-xl shadow-lg p-6">
            <h3 className="text-red-700 text-sm font-medium mb-2">Occupied</h3>
            <p className="text-3xl font-bold text-red-900">{parkingStats.occupied}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-lg p-6">
            <h3 className="text-yellow-700 text-sm font-medium mb-2">Reserved</h3>
            <p className="text-3xl font-bold text-yellow-900">{parkingStats.reserved}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Parking Layout</h2>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {parkingSlots.map(slot => (
            <div
              key={slot.id}
              className={`p-3 rounded-lg text-center text-xs font-medium ${slot.status === 'available' ? 'bg-green-100 text-green-700' :
                  slot.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                }`}
            >
              {slot.slotNumber}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
