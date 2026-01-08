// src/components/landlord/PropertyManagement.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building, Plus, Edit, Trash2, Users, CheckCircle, XCircle 
} from 'lucide-react';
import {
  getLandlordProperties,
  addProperty,
  updateProperty,
  deleteProperty,
  assignTenantToProperty
} from '../../services/landlordService';
import { getAllTenants } from '../../services/userService';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';

function PropertyManagement() {
  const { userProfile } = useAuth();
  const [properties, setProperties] = useState([]);
  const [availableTenants, setAvailableTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTenantAssign, setShowTenantAssign] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [formData, setFormData] = useState({
    flatNumber: '',
    building: 'Sunshine Apartments',
    monthlyRent: '',
    maintenanceCharges: '',
    parkingSlots: 1,
    waterCharges: 5, // per unit
    electricityCharges: 8, // per unit
    deposit: '',
    amenities: []
  });

  useEffect(() => {
    if (userProfile?.uid) {
      loadProperties();
      loadAvailableTenants();
    }
  }, [userProfile]);

  async function loadProperties() {
    try {
      setLoading(true);
      const data = await getLandlordProperties(userProfile.uid);
      setProperties(data);
    } catch (error) {
      console.error('Error loading properties:', error);
      showAlert('error', 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableTenants() {
    try {
      const tenants = await getAllTenants();
      setAvailableTenants(tenants);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  }

  function showAlert(type, message) {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.flatNumber || !formData.monthlyRent) {
      showAlert('error', 'Please fill all required fields');
      return;
    }

    try {
      await addProperty(userProfile.uid, {
        ...formData,
        monthlyRent: parseFloat(formData.monthlyRent),
        maintenanceCharges: parseFloat(formData.maintenanceCharges),
        deposit: parseFloat(formData.deposit),
        parkingSlots: parseInt(formData.parkingSlots),
        waterCharges: parseFloat(formData.waterCharges),
        electricityCharges: parseFloat(formData.electricityCharges)
      });

      showAlert('success', 'Property added successfully! 🎉');
      setShowForm(false);
      setFormData({
        flatNumber: '',
        building: 'Sunshine Apartments',
        monthlyRent: '',
        maintenanceCharges: '',
        parkingSlots: 1,
        waterCharges: 5,
        electricityCharges: 8,
        deposit: '',
        amenities: []
      });
      loadProperties();
    } catch (error) {
      showAlert('error', error.message || 'Failed to add property');
    }
  }

  async function handleAssignTenant(propertyId, tenantId) {
    try {
      await assignTenantToProperty(propertyId, tenantId);
      showAlert('success', 'Tenant assigned successfully!');
      setShowTenantAssign(null);
      loadProperties();
    } catch (error) {
      showAlert('error', 'Failed to assign tenant');
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {alert.show && <Alert type={alert.type} message={alert.message} />}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Property Management</h2>
          <p className="text-gray-600 mt-2">Add and manage your rental properties</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Property</span>
        </button>
      </div>

      {/* Add Property Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">New Property Details</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Flat Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flat Number *
                </label>
                <input
                  type="text"
                  value={formData.flatNumber}
                  onChange={(e) => setFormData({...formData, flatNumber: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 301, A-402"
                  required
                />
              </div>

              {/* Building Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Building/Society Name
                </label>
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => setFormData({...formData, building: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sunshine Apartments"
                />
              </div>

              {/* Monthly Rent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rent (₹) *
                </label>
                <input
                  type="number"
                  value={formData.monthlyRent}
                  onChange={(e) => setFormData({...formData, monthlyRent: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="15000"
                  required
                />
              </div>

              {/* Maintenance Charges */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Maintenance (₹) *
                </label>
                <input
                  type="number"
                  value={formData.maintenanceCharges}
                  onChange={(e) => setFormData({...formData, maintenanceCharges: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2000"
                  required
                />
              </div>

              {/* Parking Slots */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parking Slots (₹500 per slot)
                </label>
                <input
                  type="number"
                  value={formData.parkingSlots}
                  onChange={(e) => setFormData({...formData, parkingSlots: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="3"
                />
              </div>

              {/* Security Deposit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Deposit (₹) *
                </label>
                <input
                  type="number"
                  value={formData.deposit}
                  onChange={(e) => setFormData({...formData, deposit: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="30000"
                  required
                />
              </div>

              {/* Water Charges */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Water Charges (₹ per unit)
                </label>
                <input
                  type="number"
                  value={formData.waterCharges}
                  onChange={(e) => setFormData({...formData, waterCharges: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.1"
                />
              </div>

              {/* Electricity Charges */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Electricity Charges (₹ per unit)
                </label>
                <input
                  type="number"
                  value={formData.electricityCharges}
                  onChange={(e) => setFormData({...formData, electricityCharges: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.1"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Add Property
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Properties List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map(property => (
          <div key={property.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Flat {property.flatNumber}</h3>
                <p className="text-sm text-gray-500">{property.building}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                property.status === 'occupied' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {property.status || 'vacant'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monthly Rent:</span>
                <span className="font-medium text-gray-900">₹{property.monthlyRent?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Maintenance:</span>
                <span className="font-medium text-gray-900">₹{property.maintenanceCharges?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Parking Slots:</span>
                <span className="font-medium text-gray-900">{property.parkingSlots || 0}</span>
              </div>
              {property.tenant && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tenant:</span>
                  <span className="font-medium text-gray-900">{property.tenant}</span>
                </div>
              )}
            </div>

            {property.status !== 'occupied' && (
              <button
                onClick={() => setShowTenantAssign(property.id)}
                className="w-full bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition flex items-center justify-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Assign Tenant</span>
              </button>
            )}

            {/* Tenant Assignment Dropdown */}
            {showTenantAssign === property.id && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Select Tenant:</p>
                <select
                  onChange={(e) => handleAssignTenant(property.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Choose a tenant...</option>
                  {availableTenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} - {tenant.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-16">
          <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No properties yet</p>
          <p className="text-gray-400 text-sm mt-2">Click "Add Property" to get started</p>
        </div>
      )}
    </div>
  );
}

export default PropertyManagement;
