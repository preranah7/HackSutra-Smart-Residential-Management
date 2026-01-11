// src/components/landlord/BillGeneration.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Receipt, Sparkles, Send, Loader, AlertTriangle, CheckCircle, X, RefreshCw } from 'lucide-react';
import { getLandlordProperties } from '../../services/landlordService';
import { generateMonthlyBillForProperty } from '../../services/billingService';
import Alert from '../common/Alert';


export default function BillGeneration() {
  const { user, userProfile } = useAuth();
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [alert, setAlert] = useState(null);
  const [generatedBill, setGeneratedBill] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [billSentSuccess, setBillSentSuccess] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const [formData, setFormData] = useState({
    month: '',
    waterUsage: '',
    electricityUsage: '',
    additionalCharges: '',
    discount: '',
    additionalChargesDescription: '',
    discountReason: ''
  });

  useEffect(() => {
    loadProperties();
  }, [user]);

  async function loadProperties() {
    if (!user?.uid) return;

    try {
      const props = await getLandlordProperties(user.uid);
      setProperties(props);
    } catch (error) {
      console.error('Error loading properties:', error);
      setAlert({ type: 'error', message: 'Failed to load properties' });
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setAlert(null);
    try {
      const props = await getLandlordProperties(user.uid);
      setProperties(props);
      setAlert({ 
        type: 'success', 
        message: 'Properties refreshed successfully!' 
      });
    } catch (error) {
      console.error('Error refreshing properties:', error);
      setAlert({ type: 'error', message: 'Failed to refresh properties' });
    } finally {
      setRefreshing(false);
    }
  }

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setAlert(null);
    setShowDiagnostic(false);

    try {
      const property = properties.find(p => p.id === selectedProperty);
      if (!property) {
        throw new Error('Please select a property');
      }

      if (!property.tenant || property.status !== 'occupied') {
        throw new Error(
          'This property does not have a tenant assigned. ' +
          'Please go to Property Management and assign a tenant first, ' +
          'then click the Refresh button above to reload the properties.'
        );
      }

      const billData = {
        property,
        landlordId: user.uid,
        month: formData.month,
        waterUsage: parseFloat(formData.waterUsage) || 0,
        electricityUsage: parseFloat(formData.electricityUsage) || 0,
        additionalCharges: parseFloat(formData.additionalCharges) || 0,
        discount: parseFloat(formData.discount) || 0,
        additionalChargesDescription: formData.additionalChargesDescription,
        discountReason: formData.discountReason
      };

      const result = await generateMonthlyBillForProperty(billData);
      setGeneratedBill(result);
      setShowPreview(true);
      setAlert({
        type: 'success',
        message: 'Bill generated successfully!'
      });
    } catch (error) {
      console.error('Bill generation error:', error);
      
      if (error.message.includes('Permission denied') || error.message.includes('permission-denied')) {
        setShowDiagnostic(true);
      }
      
      setAlert({
        type: 'error',
        message: error.message || 'Failed to generate bill'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSendBill = () => {
    setBillSentSuccess(true);
    setAlert({
      type: 'success',
      message: 'Bill sent successfully to tenant!'
    });

    setTimeout(() => {
      setBillSentSuccess(false);
      setShowPreview(false);
      setGeneratedBill(null);
      setSelectedProperty('');
      setFormData({
        month: '',
        waterUsage: '',
        electricityUsage: '',
        additionalCharges: '',
        discount: '',
        additionalChargesDescription: '',
        discountReason: ''
      });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const selectedPropertyData = properties.find(p => p.id === selectedProperty);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-indigo-50 rounded-lg flex-shrink-0">
              <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">Bill Generation</h1>
              <p className="text-xs sm:text-sm text-gray-600">Generate accurate bills using AI</p>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50 w-full sm:w-auto"
            title="Refresh properties list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* AI Feature Card */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-5">
          <div className="flex items-start gap-2 sm:gap-3">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">AI-Powered Calculations</h3>
              <p className="text-xs text-gray-700">
                Gemini AI automatically calculates complex charges including late fees, discounts,
                and generates detailed bill breakdowns based on payment history.
              </p>
            </div>
          </div>
        </div>


        {/* No Properties Message */}
        {properties.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Receipt className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">No Properties Available</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              You need to add properties and assign tenants before generating bills.
            </p>
          </div>
        ) : (
          <form onSubmit={handleGenerateBill} className="space-y-4 sm:space-y-5">
            {/* Property Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Select Property *
              </label>
              <select
                required
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                <option value="">Choose a property...</option>
                {properties.map(prop => (
                  <option key={prop.id} value={prop.id}>
                    {prop.flatNumber} - {prop.tenant || 'No Tenant'} 
                    {prop.status === 'occupied' ? ' ✓' : ' (Vacant)'} - ₹{prop.monthlyRent}/month
                  </option>
                ))}
              </select>
            </div>

            {/* Property Details */}
            {selectedPropertyData && (
              <div className={`rounded-lg p-3 sm:p-4 space-y-2 ${
                selectedPropertyData.status === 'occupied' 
                  ? 'bg-emerald-50 border border-emerald-200' 
                  : 'bg-amber-50 border border-amber-300'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm">Property Details</h3>
                  {selectedPropertyData.status !== 'occupied' && (
                    <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full w-fit">
                      NO TENANT
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">Tenant:</span>
                    <span className="ml-2 font-medium text-gray-900 break-words">
                      {selectedPropertyData.tenant || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedPropertyData.status || 'vacant'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Monthly Rent:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      ₹{selectedPropertyData.monthlyRent}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Maintenance:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      ₹{selectedPropertyData.maintenanceCharges || 0}
                    </span>
                  </div>
                </div>
                {selectedPropertyData.status !== 'occupied' && (
                  <div className="mt-2 p-2.5 bg-amber-100 rounded-lg">
                    <p className="text-xs text-amber-800 font-medium">
                      ⚠️ Assign a tenant in Property Management first, then click Refresh above.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Billing Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Billing Month *
              </label>
              <input
                type="month"
                required
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Usage Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Water Usage (units)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.waterUsage}
                  onChange={(e) => setFormData({ ...formData, waterUsage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Electricity Usage (units)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.electricityUsage}
                  onChange={(e) => setFormData({ ...formData, electricityUsage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Additional Charges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Additional Charges (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.additionalCharges}
                  onChange={(e) => setFormData({ ...formData, additionalCharges: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="0"
                />
                <input
                  type="text"
                  value={formData.additionalChargesDescription}
                  onChange={(e) => setFormData({ ...formData, additionalChargesDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm mt-2"
                  placeholder="Reason for additional charges"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="0"
                />
                <input
                  type="text"
                  value={formData.discountReason}
                  onChange={(e) => setFormData({ ...formData, discountReason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm mt-2"
                  placeholder="Reason for discount"
                />
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={generating || !selectedProperty}
              className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Generating with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Bill with AI</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Bill Preview Modal */}
      {showPreview && generatedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto my-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-5 flex justify-between items-center z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Generated Bill</h2>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setGeneratedBill(null);
                }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {/* Bill Details */}
              <div className="bg-indigo-50 rounded-lg p-4 sm:p-5 mb-4 sm:mb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600 text-xs">Tenant</p>
                    <p className="font-semibold text-gray-900 break-words">{generatedBill.tenantName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Property</p>
                    <p className="font-semibold text-gray-900 break-words">{generatedBill.flatNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Month</p>
                    <p className="font-semibold text-gray-900">{generatedBill.month}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Due Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(generatedBill.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="border-t border-indigo-200 pt-4">
                  <p className="text-gray-600 text-xs mb-1">Total Amount</p>
                  <p className="text-2xl sm:text-3xl font-bold text-indigo-600 break-words">₹{generatedBill.total}</p>
                </div>
              </div>

              {/* AI Breakdown */}
              {generatedBill.breakdown && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <h3 className="font-semibold text-purple-900 text-sm">AI-Generated Breakdown:</h3>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-700 whitespace-pre-line break-words">
                    {generatedBill.breakdown}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {!billSentSuccess ? (
                  <>
                    <button
                      onClick={() => {
                        setShowPreview(false);
                        setGeneratedBill(null);
                      }}
                      className="flex-1 px-4 sm:px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleSendBill}
                      className="flex-1 px-4 sm:px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send to Tenant</span>
                    </button>
                  </>
                ) : (
                  <div className="flex-1 px-4 sm:px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Bill Sent Successfully!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}