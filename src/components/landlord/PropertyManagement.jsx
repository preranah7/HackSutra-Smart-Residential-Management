// src/components/landlord/PropertyManagement.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Building, Plus, Edit, Trash2, User, X, DollarSign, Home } from 'lucide-react';
import {
  subscribeToLandlordProperties,
  addProperty,
  updateProperty,
  deleteProperty,
  assignTenant,
  removeTenant
} from '../../services/landlordService';
import { formatCurrency } from '../../utils/realtimeUtils';
import Alert from '../common/Alert';

export default function PropertyManagement() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [propertyForm, setPropertyForm] = useState({
    flatNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    propertyType: 'apartment',
    bhk: '1',
    area: '',
    monthlyRent: '',
    securityDeposit: '',
    maintenanceCharges: '',
    parkingSlots: '0',
    waterCharges: '5',
    electricityCharges: '8',
    amenities: []
  });

  const [tenantForm, setTenantForm] = useState({
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    leaseStartDate: '',
    leaseEndDate: ''
  });

  const amenitiesList = [
    'Parking', 'Gym', 'Swimming Pool', 'Security', 'Elevator', 
    'Power Backup', 'Water Supply', 'Garden', 'Play Area', 'Club House'
  ];

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToLandlordProperties(user.uid, (data) => {
      setProperties(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handlePropertySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const propertyData = {
        flatNumber: propertyForm.flatNumber,
        address: propertyForm.address,
        city: propertyForm.city,
        state: propertyForm.state,
        pincode: propertyForm.pincode,
        propertyType: propertyForm.propertyType,
        bhk: propertyForm.bhk,
        area: parseFloat(propertyForm.area),
        monthlyRent: parseFloat(propertyForm.monthlyRent),
        securityDeposit: parseFloat(propertyForm.securityDeposit),
        maintenanceCharges: parseFloat(propertyForm.maintenanceCharges) || 0,
        parkingSlots: parseInt(propertyForm.parkingSlots) || 0,
        waterCharges: parseFloat(propertyForm.waterCharges) || 5,
        electricityCharges: parseFloat(propertyForm.electricityCharges) || 8,
        amenities: propertyForm.amenities,
        landlordId: user.uid
      };

      if (editingProperty) {
        await updateProperty(editingProperty.id, propertyData);
        setAlert({ type: 'success', message: 'Property updated successfully!' });
      } else {
        await addProperty(propertyData);
        setAlert({ type: 'success', message: 'Property added successfully!' });
      }

      resetPropertyForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving property:', error);
      setAlert({ 
        type: 'error', 
        message: error.message || 'Failed to save property. Please try again.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTenantSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await assignTenant(selectedProperty.id, tenantForm);
      setAlert({ type: 'success', message: 'Tenant assigned successfully!' });
      resetTenantForm();
      setShowTenantModal(false);
      setSelectedProperty(null);
    } catch (error) {
      console.error('Error assigning tenant:', error);
      setAlert({ type: 'error', message: error.message || 'Failed to assign tenant' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveTenant = async (propertyId) => {
    if (!confirm('Are you sure you want to remove this tenant?')) return;

    try {
      await removeTenant(propertyId);
      setAlert({ type: 'success', message: 'Tenant removed successfully!' });
    } catch (error) {
      console.error('Error removing tenant:', error);
      setAlert({ type: 'error', message: 'Failed to remove tenant' });
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) return;

    try {
      await deleteProperty(propertyId);
      setAlert({ type: 'success', message: 'Property deleted successfully!' });
    } catch (error) {
      console.error('Error deleting property:', error);
      setAlert({ type: 'error', message: 'Failed to delete property' });
    }
  };

  const openEditModal = (property) => {
    setEditingProperty(property);
    setPropertyForm({
      flatNumber: property.flatNumber,
      address: property.address,
      city: property.city,
      state: property.state,
      pincode: property.pincode,
      propertyType: property.propertyType,
      bhk: property.bhk,
      area: property.area,
      monthlyRent: property.monthlyRent,
      securityDeposit: property.securityDeposit,
      maintenanceCharges: property.maintenanceCharges || '',
      parkingSlots: property.parkingSlots || '0',
      waterCharges: property.waterCharges || '5',
      electricityCharges: property.electricityCharges || '8',
      amenities: property.amenities || []
    });
    setShowModal(true);
  };

  const openTenantModal = (property) => {
    setSelectedProperty(property);
    setShowTenantModal(true);
  };

  const resetPropertyForm = () => {
    setPropertyForm({
      flatNumber: '', address: '', city: '', state: '', pincode: '',
      propertyType: 'apartment', bhk: '1', area: '', monthlyRent: '',
      securityDeposit: '', maintenanceCharges: '', parkingSlots: '0',
      waterCharges: '5', electricityCharges: '8', amenities: []
    });
    setEditingProperty(null);
  };

  const resetTenantForm = () => {
    setTenantForm({
      tenantName: '', tenantEmail: '', tenantPhone: '',
      leaseStartDate: '', leaseEndDate: ''
    });
  };

  const toggleAmenity = (amenity) => {
    setPropertyForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">Property Management</h1>
          <p className="text-sm text-gray-600">Manage your properties and tenants</p>
        </div>
        <button
          onClick={() => {
            resetPropertyForm();
            setShowModal(true);
          }}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs font-medium mb-1">Total Properties</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">{properties.length}</p>
            </div>
            <Building className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
          </div>
        </div>
        <div className="bg-emerald-50 rounded-lg shadow-sm border border-emerald-100 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-700 text-xs font-medium mb-1">Occupied</p>
              <p className="text-xl sm:text-2xl font-semibold text-emerald-900">
                {properties.filter(p => p.status === 'occupied' || p.tenant).length}
              </p>
            </div>
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500 flex-shrink-0" />
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-100 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-xs font-medium mb-1">Vacant</p>
              <p className="text-xl sm:text-2xl font-semibold text-orange-900">
                {properties.filter(p => p.status !== 'occupied' && !p.tenant).length}
              </p>
            </div>
            <Home className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Properties List */}
      {properties.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
          <Building className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">No Properties Yet</h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
            Add your first property to start managing your real estate portfolio
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Property</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {properties.map(property => {
            const isOccupied = property.status === 'occupied' || property.tenant;
            
            return (
              <div key={property.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Property Header */}
                <div className={`p-3 sm:p-4 ${isOccupied ? 'border-b border-emerald-100' : 'bg-gray-50 border-b border-gray-100'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{property.flatNumber}</h3>
                      <p className="text-xs text-gray-600 truncate">{property.bhk} BHK {property.propertyType}</p>
                    </div>
                    <span className={`px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      isOccupied
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-orange-50 text-gray-700'
                    }`}>
                      {isOccupied ? 'Occupied' : 'Vacant'}
                    </span>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-4 sm:p-5">
                  <div className="space-y-2 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Building className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{property.address}, {property.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Home className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{property.area} sq.ft</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="font-semibold text-emerald-600 text-xs sm:text-sm">
                        {formatCurrency(property.monthlyRent)}/month
                      </span>
                    </div>
                  </div>

                  {/* Tenant Info */}
                  {isOccupied ? (
                    <div className="rounded-lg p-2 sm:p-3 mb-3 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                        <span className="font-medium text-emerald-900 text-xs">Current Tenant</span>
                      </div>
                      <p className="text-xs text-emerald-800 font-medium truncate">{property.tenant}</p>
                      <p className="text-xs text-emerald-700 truncate">{property.tenantEmail}</p>
                      {property.tenantPhone && (
                        <p className="text-xs text-emerald-700">{property.tenantPhone}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3 mb-3 border border-gray-200">
                      <p className="text-xs text-gray-600 text-center">No tenant assigned</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => openEditModal(property)}
                      className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    {isOccupied ? (
                      <button
                        onClick={() => handleRemoveTenant(property.id)}
                        className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-xs font-medium"
                      >
                        Remove Tenant
                      </button>
                    ) : (
                      <button
                        onClick={() => openTenantModal(property)}
                        className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Assign</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteProperty(property.id)}
                      className="px-3 py-2 bg-gray-400 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Property Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingProperty ? 'Edit Property' : 'Add New Property'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetPropertyForm();
                }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePropertySubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Flat/House Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={propertyForm.flatNumber}
                    onChange={(e) => setPropertyForm({...propertyForm, flatNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    placeholder="e.g., A-101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Property Type *
                  </label>
                  <select
                    required
                    value={propertyForm.propertyType}
                    onChange={(e) => setPropertyForm({...propertyForm, propertyType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  >
                    <option value="apartment">Apartment</option>
                    <option value="house">Independent House</option>
                    <option value="villa">Villa</option>
                    <option value="studio">Studio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    BHK *
                  </label>
                  <select
                    required
                    value={propertyForm.bhk}
                    onChange={(e) => setPropertyForm({...propertyForm, bhk: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  >
                    <option value="1">1 BHK</option>
                    <option value="2">2 BHK</option>
                    <option value="3">3 BHK</option>
                    <option value="4">4 BHK</option>
                    <option value="5">5+ BHK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Area (sq.ft) *
                  </label>
                  <input
                    type="number"
                    required
                    value={propertyForm.area}
                    onChange={(e) => setPropertyForm({...propertyForm, area: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    placeholder="1000"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address *
                </label>
                <input
                  type="text"
                  required
                  value={propertyForm.address}
                  onChange={(e) => setPropertyForm({...propertyForm, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                  <input
                    type="text"
                    required
                    value={propertyForm.city}
                    onChange={(e) => setPropertyForm({...propertyForm, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
                  <input
                    type="text"
                    required
                    value={propertyForm.state}
                    onChange={(e) => setPropertyForm({...propertyForm, state: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={propertyForm.pincode}
                    onChange={(e) => setPropertyForm({...propertyForm, pincode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Monthly Rent (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={propertyForm.monthlyRent}
                    onChange={(e) => setPropertyForm({...propertyForm, monthlyRent: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Security Deposit (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={propertyForm.securityDeposit}
                    onChange={(e) => setPropertyForm({...propertyForm, securityDeposit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Maintenance Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={propertyForm.maintenanceCharges}
                    onChange={(e) => setPropertyForm({...propertyForm, maintenanceCharges: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Parking Slots
                  </label>
                  <input
                    type="number"
                    value={propertyForm.parkingSlots}
                    onChange={(e) => setPropertyForm({...propertyForm, parkingSlots: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {amenitiesList.map(amenity => (
                    <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={propertyForm.amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetPropertyForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProperty ? 'Update Property' : 'Add Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Tenant Modal */}
      {showTenantModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-4 sm:p-6 my-4">
            <div className="flex justify-between items-center mb-4 sm:mb-5">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Assign Tenant</h2>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Property: {selectedProperty.flatNumber}</p>
              </div>
              <button
                onClick={() => {
                  setShowTenantModal(false);
                  resetTenantForm();
                  setSelectedProperty(null);
                }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTenantSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tenant Name *
                </label>
                <input
                  type="text"
                  required
                  value={tenantForm.tenantName}
                  onChange={(e) => setTenantForm({...tenantForm, tenantName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tenant Email *
                </label>
                <input
                  type="email"
                  required
                  value={tenantForm.tenantEmail}
                  onChange={(e) => setTenantForm({...tenantForm, tenantEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tenant Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={tenantForm.tenantPhone}
                  onChange={(e) => setTenantForm({...tenantForm, tenantPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Lease Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={tenantForm.leaseStartDate}
                    onChange={(e) => setTenantForm({...tenantForm, leaseStartDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Lease End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={tenantForm.leaseEndDate}
                    onChange={(e) => setTenantForm({...tenantForm, leaseEndDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> The tenant will be assigned to this property and status will be updated to "Occupied".
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTenantModal(false);
                    resetTenantForm();
                    setSelectedProperty(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Assign Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}