// src/components/tenant/TenantDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getTenantBills } from '../../services/billingService';
import { Receipt, FileText, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

function TenantDashboard() {
  const { userProfile } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBills();
  }, []);

  async function loadBills() {
    try {
      setLoading(true);
      const billsData = await getTenantBills(userProfile.uid);
      setBills(billsData);
    } catch (error) {
      setError('Failed to load bills');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const currentBill = bills[0]; // Most recent bill

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {userProfile.name}!
          </h1>
          <p className="text-gray-600">Flat {userProfile.flatNumber}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Current Bill Card */}
          <div className="bg-white rounded-lg shadow p-6 col-span-full lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Receipt className="w-6 h-6 text-primary-600 mr-2" />
                <h2 className="text-xl font-semibold">Current Month Bill</h2>
              </div>
              {currentBill && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentBill.status === 'paid' 
                    ? 'bg-green-100 text-green-800'
                    : currentBill.status === 'overdue'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentBill.status.toUpperCase()}
                </span>
              )}
            </div>

            {currentBill ? (
              <div>
                <div className="mb-4">
                  <div className="text-4xl font-bold text-gray-900">
                    ₹{currentBill.total.toLocaleString()}
                  </div>
                  <p className="text-gray-600">
                    Due by {new Date(currentBill.dueDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Rent</span>
                    <span className="font-medium">₹{currentBill.rent}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Maintenance</span>
                    <span className="font-medium">₹{currentBill.maintenance}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Parking</span>
                    <span className="font-medium">₹{currentBill.parking}</span>
                  </div>
                  {currentBill.water > 0 && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Water</span>
                      <span className="font-medium">₹{currentBill.water}</span>
                    </div>
                  )}
                  {currentBill.electricity > 0 && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Electricity</span>
                      <span className="font-medium">₹{currentBill.electricity}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700">
                    Pay Now
                  </button>
                  <button className="flex-1 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50">
                    Download PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No bills generated yet</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 flex items-center">
                <AlertCircle className="w-5 h-5 mr-3 text-primary-600" />
                <span>Raise Complaint</span>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                View Past Bills
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                Book Visitor Parking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TenantDashboard;s