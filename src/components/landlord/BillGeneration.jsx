// src/components/landlord/BillGeneration.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Receipt, Sparkles, Send, Loader, AlertTriangle } from 'lucide-react';
import { getLandlordProperties } from '../../services/landlordService';
import { generateMonthlyBillForProperty } from '../../services/billingService';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';

// Permission Diagnostic Component
function PermissionDiagnostic({ userProfile, currentUser }) {
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);
  const [checking, setChecking] = useState(false);

  async function runDiagnostic() {
    setChecking(true);
    const results = {
      timestamp: new Date().toISOString(),
      checks: []
    };

    try {
      // Check 1: Authentication
      results.checks.push({
        name: '1. User Authentication',
        status: currentUser ? '✅ PASS' : '❌ FAIL',
        details: currentUser ? `Logged in as: ${currentUser.email}` : 'Not logged in',
        data: {
          uid: currentUser?.uid,
          email: currentUser?.email
        }
      });

      // Check 2: User Profile from Context
      results.checks.push({
        name: '2. User Profile (from Context)',
        status: userProfile ? '✅ PASS' : '❌ FAIL',
        details: userProfile ? `Profile loaded` : 'Profile not loaded',
        data: userProfile
      });

      // Check 3: User Document in Firestore
      if (currentUser?.uid) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          const exists = userDocSnap.exists();
          const userData = exists ? userDocSnap.data() : null;
          
          results.checks.push({
            name: '3. User Document in Firestore',
            status: exists ? '✅ PASS' : '❌ FAIL',
            details: exists ? 'Document exists' : 'Document NOT found in /users collection',
            data: userData
          });

          // Check 4: Role Check
          if (exists && userData) {
            const isLandlord = userData.role === 'landlord';
            results.checks.push({
              name: '4. Landlord Role',
              status: isLandlord ? '✅ PASS' : '❌ FAIL',
              details: `Role: "${userData.role}" (expected: "landlord")`,
              data: {
                currentRole: userData.role,
                expectedRole: 'landlord',
                match: isLandlord,
                hasExtraSpaces: userData.role !== userData.role.trim()
              }
            });
          } else {
            results.checks.push({
              name: '4. Landlord Role',
              status: '❌ FAIL',
              details: 'Cannot check role - user document does not exist',
              data: null
            });
          }

          // Check 5: UID Consistency
          const uidMatch = currentUser.uid === userProfile?.uid;
          results.checks.push({
            name: '5. UID Consistency',
            status: uidMatch ? '✅ PASS' : '⚠️ WARNING',
            details: uidMatch ? 'Auth UID matches profile UID' : 'UID mismatch detected',
            data: {
              authUID: currentUser.uid,
              profileUID: userProfile?.uid,
              match: uidMatch
            }
          });

        } catch (error) {
          results.checks.push({
            name: '3. User Document in Firestore',
            status: '❌ FAIL',
            details: `Error reading document: ${error.message}`,
            data: { error: error.message, code: error.code }
          });
        }
      }

      // Check 6: Firestore Rules Test
      results.checks.push({
        name: '6. Firestore Rules',
        status: '⚠️ MANUAL CHECK',
        details: 'Please verify rules are deployed in Firebase Console',
        data: {
          console: 'https://console.firebase.google.com',
          path: 'Firestore Database → Rules',
          instruction: 'Make sure you clicked "Publish" after updating rules'
        }
      });

    } catch (error) {
      results.checks.push({
        name: 'Diagnostic Error',
        status: '❌ ERROR',
        details: error.message,
        data: error
      });
    }

    setDiagnosticInfo(results);
    setChecking(false);

    // Log to console
    console.log('=== FIRESTORE PERMISSION DIAGNOSTIC ===');
    console.log(JSON.stringify(results, null, 2));
  }

  const allPassed = diagnosticInfo?.checks.filter(c => !c.name.includes('MANUAL')).every(c => c.status.includes('✅'));
  const hasFails = diagnosticInfo?.checks.some(c => c.status.includes('❌'));

  return (
    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-yellow-900">🔍 Permission Diagnostic Tool</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Run this to identify the permission issue before generating bills
          </p>
        </div>
        <button
          onClick={runDiagnostic}
          disabled={checking}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 transition"
        >
          {checking ? 'Checking...' : 'Run Diagnostic'}
        </button>
      </div>

      {diagnosticInfo && (
        <div className="mt-4 space-y-3">
          {diagnosticInfo.checks.map((check, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border-2 ${
                check.status.includes('✅') ? 'bg-green-50 border-green-300' :
                check.status.includes('❌') ? 'bg-red-50 border-red-300' :
                'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {check.status} {check.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{check.details}</p>
                  {check.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                        Show details
                      </summary>
                      <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-40">
                        {JSON.stringify(check.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className={`mt-4 p-4 rounded-lg border-2 ${
            allPassed ? 'bg-green-100 border-green-400' :
            hasFails ? 'bg-red-100 border-red-400' :
            'bg-yellow-100 border-yellow-400'
          }`}>
            <p className="font-bold text-sm mb-2">
              {allPassed ? '✅ All checks passed! You can try generating bills now.' :
               hasFails ? '❌ Issues found - see fixes below' :
               '⚠️ Some checks need attention'}
            </p>
            {hasFails && (
              <div className="text-xs space-y-2 mt-3">
                <p className="font-medium text-red-900">🔧 How to fix:</p>
                <ul className="list-disc list-inside ml-2 space-y-1 text-red-800">
                  <li><strong>User document missing:</strong> Go to Firestore Console → users collection → Create document with ID = your UID</li>
                  <li><strong>Wrong role:</strong> In Firestore, edit your user document and set "role" field to exactly "landlord" (lowercase, no spaces)</li>
                  <li><strong>Rules not deployed:</strong> Go to Firebase Console → Firestore → Rules → Click "Publish" button</li>
                </ul>
                <div className="mt-3 p-3 bg-white rounded border border-red-300">
                  <p className="font-medium text-red-900 text-xs mb-1">Quick Fix - Create User Document:</p>
                  <p className="text-xs text-red-800 mb-2">If your user document is missing, create it manually:</p>
                  <code className="text-xs bg-red-50 p-2 rounded block">
                    Collection: users<br/>
                    Document ID: {currentUser?.uid || 'your-uid'}<br/>
                    Fields:<br/>
                    - uid: "{currentUser?.uid || 'your-uid'}"<br/>
                    - email: "{currentUser?.email || 'your-email'}"<br/>
                    - role: "landlord"<br/>
                    - name: "Your Name"
                  </code>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BillGeneration() {
  const { userProfile, currentUser } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [billData, setBillData] = useState({
    propertyId: '',
    month: new Date().toISOString().slice(0, 7),
    waterUsage: '',
    electricityUsage: '',
    additionalCharges: '',
    additionalChargesDescription: '',
    discount: '',
    discountReason: ''
  });
  const [generatedBill, setGeneratedBill] = useState(null);

  useEffect(() => {
    if (userProfile?.uid) {
      loadProperties();
      checkUserProfile();
    }
  }, [userProfile]);

  // User profile check with detailed logging
  async function checkUserProfile() {
    if (userProfile?.uid) {
      try {
        const userDocRef = doc(db, 'users', userProfile.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        console.log('=== USER PROFILE CHECK ===');
        console.log('User ID:', userProfile.uid);
        console.log('User Doc Exists:', userDocSnap.exists());
        console.log('User Data:', userDocSnap.data());
        console.log('User Role:', userDocSnap.data()?.role);
        console.log('Expected Role: landlord');
        console.log('Match:', userDocSnap.data()?.role === 'landlord');
        
        if (!userDocSnap.exists()) {
          console.error('❌ USER DOCUMENT DOES NOT EXIST!');
          console.error('You need to create a document at: /users/' + userProfile.uid);
        } else if (userDocSnap.data()?.role !== 'landlord') {
          console.error('❌ USER ROLE IS NOT "landlord"!');
          console.error('Current role:', userDocSnap.data()?.role);
          console.error('Please update the role field to exactly "landlord"');
        } else {
          console.log('✅ User profile is correctly configured');
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
      }
    }
  }

  async function loadProperties() {
    try {
      setLoading(true);
      const data = await getLandlordProperties(userProfile.uid);
      // Only show occupied properties
      const occupiedProperties = data.filter(p => p.status === 'occupied');
      setProperties(occupiedProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
      showAlert('error', 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }

  function showAlert(type, message) {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  }

  async function handleGenerateBill(e) {
    e.preventDefault();

    // Validation
    if (!billData.propertyId || !billData.month) {
      showAlert('error', 'Please select property and month');
      return;
    }

    if (!userProfile?.uid) {
      showAlert('error', 'User not authenticated. Please log in again.');
      return;
    }

    if (userProfile.role !== 'landlord') {
      showAlert('error', 'Only landlords can generate bills. Your current role: ' + (userProfile.role || 'undefined'));
      return;
    }

    try {
      setGenerating(true);
      showAlert('info', '🤖 AI is generating your bill...');

      const selectedProperty = properties.find(p => p.id === billData.propertyId);
      
      if (!selectedProperty) {
        throw new Error('Property not found');
      }

      if (!selectedProperty.tenantId) {
        throw new Error('This property does not have an assigned tenant');
      }

      // Verify landlord owns this property
      if (selectedProperty.landlordId !== userProfile.uid) {
        throw new Error('You do not own this property');
      }
      
      const bill = await generateMonthlyBillForProperty({
        ...billData,
        property: selectedProperty,
        landlordId: userProfile.uid,
        waterUsage: parseFloat(billData.waterUsage) || 0,
        electricityUsage: parseFloat(billData.electricityUsage) || 0,
        additionalCharges: parseFloat(billData.additionalCharges) || 0,
        discount: parseFloat(billData.discount) || 0
      });

      setGeneratedBill(bill);
      showAlert('success', '✅ Bill generated successfully with AI!');
      
      // Reset form
      setBillData({
        propertyId: '',
        month: new Date().toISOString().slice(0, 7),
        waterUsage: '',
        electricityUsage: '',
        additionalCharges: '',
        additionalChargesDescription: '',
        discount: '',
        discountReason: ''
      });
    } catch (error) {
      console.error('Error generating bill:', error);
      showAlert('error', error.message || 'Failed to generate bill');
    } finally {
      setGenerating(false);
    }
  }

  function handleNewBill() {
    setGeneratedBill(null);
    setBillData({
      propertyId: '',
      month: new Date().toISOString().slice(0, 7),
      waterUsage: '',
      electricityUsage: '',
      additionalCharges: '',
      additionalChargesDescription: '',
      discount: '',
      discountReason: ''
    });
  }

  const selectedProperty = properties.find(p => p.id === billData.propertyId);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {alert.show && <Alert type={alert.type} message={alert.message} />}

      {/* Diagnostic Tool */}
      <PermissionDiagnostic userProfile={userProfile} currentUser={currentUser} />

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <Receipt className="w-8 h-8 mr-3 text-blue-600" />
          AI-Powered Bill Generation
        </h2>
        <p className="text-gray-600 mt-2">
          Generate accurate bills using Google Gemini AI
        </p>
      </div>

      {/* AI Info Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-6 h-6 text-purple-600 mt-1" />
          <div>
            <p className="font-medium text-purple-900">AI-Powered Calculations</p>
            <p className="text-sm text-purple-700 mt-1">
              Gemini AI automatically calculates complex charges including late fees, 
              discounts, and generates detailed bill breakdowns based on payment history.
            </p>
          </div>
        </div>
      </div>

      {properties.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <p className="font-medium text-yellow-900">No Properties Available</p>
              <p className="text-sm text-yellow-700 mt-1">
                You need to add properties and assign tenants before generating bills.
              </p>
              <button
                onClick={() => window.location.href = '/landlord/properties'}
                className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700"
              >
                Go to Properties
              </button>
            </div>
          </div>
        </div>
      )}

      {!generatedBill ? (
        /* Bill Generation Form */
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <form onSubmit={handleGenerateBill} className="space-y-6">
            {/* Property Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Property *
              </label>
              <select
                value={billData.propertyId}
                onChange={(e) => setBillData({...billData, propertyId: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={properties.length === 0}
              >
                <option value="">Choose a property...</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    Flat {property.flatNumber} - {property.tenant} - ₹{property.monthlyRent?.toLocaleString()}/month
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Billing Month *
              </label>
              <input
                type="month"
                value={billData.month}
                onChange={(e) => setBillData({...billData, month: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Utility Usage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Water Usage (units)
                </label>
                <input
                  type="number"
                  value={billData.waterUsage}
                  onChange={(e) => setBillData({...billData, waterUsage: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100"
                  min="0"
                  step="0.01"
                />
                {selectedProperty && (
                  <p className="text-xs text-gray-500 mt-1">
                    Rate: ₹{selectedProperty.waterCharges || 5}/unit
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Electricity Usage (units)
                </label>
                <input
                  type="number"
                  value={billData.electricityUsage}
                  onChange={(e) => setBillData({...billData, electricityUsage: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="150"
                  min="0"
                  step="0.01"
                />
                {selectedProperty && (
                  <p className="text-xs text-gray-500 mt-1">
                    Rate: ₹{selectedProperty.electricityCharges || 8}/unit
                  </p>
                )}
              </div>
            </div>

            {/* Additional Charges */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Charges (₹)
              </label>
              <input
                type="number"
                value={billData.additionalCharges}
                onChange={(e) => setBillData({...billData, additionalCharges: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
                step="0.01"
              />
              <input
                type="text"
                value={billData.additionalChargesDescription}
                onChange={(e) => setBillData({...billData, additionalChargesDescription: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                placeholder="Description (e.g., Repairs, Cleaning)"
              />
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount (₹)
              </label>
              <input
                type="number"
                value={billData.discount}
                onChange={(e) => setBillData({...billData, discount: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
                step="0.01"
              />
              <input
                type="text"
                value={billData.discountReason}
                onChange={(e) => setBillData({...billData, discountReason: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                placeholder="Reason (e.g., Early payment, Loyalty discount)"
              />
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={generating || properties.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
        </div>
      ) : (
        /* Generated Bill Preview */
        <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-green-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Generated Bill</h3>
            <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Generated by AI</span>
            </span>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Property:</span>
              <span className="font-medium">Flat {generatedBill.flatNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tenant:</span>
              <span className="font-medium">{generatedBill.tenantName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Billing Period:</span>
              <span className="font-medium">
                {new Date(generatedBill.month + '-01').toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Due Date:</span>
              <span className="font-medium text-red-600">
                {new Date(generatedBill.dueDate).toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>

          <div className="border-t border-b border-gray-200 py-4 my-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Rent</span>
              <span className="font-medium">₹{generatedBill.rent?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Maintenance</span>
              <span className="font-medium">₹{generatedBill.maintenance?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Parking</span>
              <span className="font-medium">₹{generatedBill.parking?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Water ({generatedBill.waterUsage} units)</span>
              <span className="font-medium">₹{generatedBill.water?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Electricity ({generatedBill.electricityUsage} units)</span>
              <span className="font-medium">₹{generatedBill.electricity?.toLocaleString()}</span>
            </div>
            {generatedBill.additionalCharges > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-700">Additional Charges</span>
                <span className="font-medium">₹{generatedBill.additionalCharges?.toLocaleString()}</span>
              </div>
            )}
            {generatedBill.lateFee > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Late Fee (2%)</span>
                <span className="font-medium">₹{generatedBill.lateFee?.toLocaleString()}</span>
              </div>
            )}
            {generatedBill.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span className="font-medium">-₹{generatedBill.discount?.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-xl font-bold mb-6">
            <span>Total Amount</span>
            <span className="text-blue-600">₹{generatedBill.total?.toLocaleString()}</span>
          </div>

          {generatedBill.breakdown && (
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <p className="text-sm text-gray-700 font-medium mb-2">AI-Generated Breakdown:</p>
              <p className="text-sm text-gray-600">{generatedBill.breakdown}</p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={handleNewBill}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Generate Another Bill
            </button>
            <button
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>Send to Tenant</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillGeneration;