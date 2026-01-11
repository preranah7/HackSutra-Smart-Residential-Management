// src/components/tenant/Complaints.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, Plus, X, CheckCircle, Clock, XCircle, MessageSquare } from 'lucide-react';
import {
  subscribeToUserComplaints,
  createComplaint,
  tenantUpdateComplaintStatus
} from '../../services/complaintService';
import { formatRelativeTime } from '../../utils/realtimeUtils';
import Alert from '../common/Alert';

const COMPLAINT_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Maintenance',
  'Cleaning',
  'Security',
  'Parking',
  'Noise',
  'Other'
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'emergency', label: 'Emergency' }
];

export default function Complaints() {
  const { currentUser, user, userProfile } = useAuth();
  const activeUser = currentUser || user;
  
  const [complaints, setComplaints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    priority: '',
    description: '',
    location: ''
  });

  useEffect(() => {
    if (!activeUser?.uid) {
      console.log('Waiting for user authentication...');
      return;
    }

    console.log('Subscribing to complaints for user:', activeUser.uid);
    const unsubscribe = subscribeToUserComplaints(activeUser.uid, (data) => {
      console.log('Complaints data received:', data.length);
      setComplaints(data);
    });

    return () => unsubscribe();
  }, [activeUser?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!activeUser?.uid) {
      setAlert({ type: 'error', message: 'Please login to submit complaints' });
      console.error('No active user found');
      return;
    }

    setSubmitting(true);

    try {
      const complaintData = {
        ...formData,
        userId: activeUser.uid,
        userName: userProfile?.name || activeUser.email,
        userEmail: activeUser.email,
        flatNumber: userProfile?.flatNumber || 'N/A',
        userPhone: userProfile?.phone || 'N/A'
      };

      console.log('Submitting complaint:', complaintData);
      await createComplaint(complaintData);

      setAlert({
        type: 'success',
        message: 'Complaint submitted successfully! We will address it soon.'
      });

      setShowModal(false);
      setFormData({
        title: '',
        category: '',
        priority: '',
        description: '',
        location: ''
      });
    } catch (error) {
      console.error('Error submitting complaint:', error);
      setAlert({
        type: 'error',
        message: error.message || 'Failed to submit complaint. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmResolution = async (complaintId, isFixed) => {
    if (!activeUser?.uid) {
      setAlert({ type: 'error', message: 'Please login to update complaint status' });
      return;
    }

    try {
      if (isFixed) {
        await tenantUpdateComplaintStatus(
          complaintId,
          'closed',
          'Issue resolved satisfactorily. Thank you!'
        );
        setAlert({
          type: 'success',
          message: 'Thank you for confirming! Complaint closed.'
        });
      } else {
        await tenantUpdateComplaintStatus(
          complaintId,
          'open',
          'Issue still persists. Needs further attention.'
        );
        setAlert({
          type: 'info',
          message: 'We\'ll look into this again. Thank you for the feedback.'
        });
      }
    } catch (error) {
      console.error('Error updating complaint status:', error);
      setAlert({
        type: 'error',
        message: 'Failed to update status. Please try again.'
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'in-progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'closed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'emergency':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-amber-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (!activeUser?.uid) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-xs sm:text-sm">Loading complaints...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden px-2 sm:px-0">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">My Complaints</h1>
          <p className="text-xs sm:text-sm text-gray-600">Track and manage your maintenance requests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-xs sm:text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New Complaint
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs font-medium mb-1">Total</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">{complaints.length}</p>
            </div>
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
          </div>
        </div>
        <div className="bg-red-50 rounded-lg shadow-sm border border-red-100 p-3 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 text-xs font-medium mb-1">Open</p>
              <p className="text-xl sm:text-2xl font-semibold text-red-900">
                {complaints.filter(c => c.status === 'open').length}
              </p>
            </div>
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-300" />
          </div>
        </div>
        <div className="bg-amber-50 rounded-lg shadow-sm border border-amber-100 p-3 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-700 text-xs font-medium mb-1">In Progress</p>
              <p className="text-xl sm:text-2xl font-semibold text-amber-900">
                {complaints.filter(c => c.status === 'in-progress').length}
              </p>
            </div>
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-amber-300" />
          </div>
        </div>
        <div className="bg-emerald-50 rounded-lg shadow-sm border border-emerald-100 p-3 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-700 text-xs font-medium mb-1">Resolved</p>
              <p className="text-xl sm:text-2xl font-semibold text-emerald-900">
                {complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length}
              </p>
            </div>
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-300" />
          </div>
        </div>
      </div>

      {/* Complaints List */}
      {complaints.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">No Complaints Yet</h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
            You haven't submitted any complaints. Click the button above to create one.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-xs sm:text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create First Complaint
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {complaints.map(complaint => (
            <div key={complaint.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex items-start gap-2 sm:gap-2.5 flex-1 min-w-0">
                  {getStatusIcon(complaint.status)}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5 break-words">
                      {complaint.title}
                    </h3>
                    <p className="text-xs text-gray-500">{complaint.category}</p>
                  </div>
                </div>
                <span className={`px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPriorityColor(complaint.priority)}`}>
                  {complaint.priority}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-700 mb-3 text-xs sm:text-sm leading-relaxed break-words">
                {complaint.description}
              </p>

              {/* Details */}
              <div className="space-y-1.5 mb-3 text-xs">
                {complaint.location && (
                  <div className="flex items-center gap-2 text-gray-600 flex-wrap">
                    <span className="font-medium">Location:</span>
                    <span className="break-words">{complaint.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600 flex-wrap">
                  <span className="font-medium">Submitted:</span>
                  <span>{formatRelativeTime(complaint.createdAt)}</span>
                </div>
                {complaint.estimatedTime && (
                  <div className="flex items-center gap-2 text-gray-600 flex-wrap">
                    <span className="font-medium">Estimated Time:</span>
                    <span>{complaint.estimatedTime}</span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className={`border rounded-lg p-2.5 mb-3 ${getStatusColor(complaint.status)}`}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(complaint.status)}
                  <span className="font-medium capitalize text-xs sm:text-sm">{complaint.status.replace('-', ' ')}</span>
                </div>
              </div>

              {/* Admin Response */}
              {complaint.adminResponse && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-3 rounded">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-blue-900 mb-0.5">Admin Response:</p>
                      <p className="text-xs text-blue-800 break-words">{complaint.adminResponse}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tenant Feedback Section */}
              {complaint.status === 'resolved' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="text-xs text-emerald-800 font-medium mb-2 flex items-center gap-2 flex-wrap">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Admin marked this as resolved. Is the issue fixed?</span>
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleConfirmResolution(complaint.id, true)}
                      className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Yes, Fixed!
                    </button>
                    <button
                      onClick={() => handleConfirmResolution(complaint.id, false)}
                      className="flex-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium text-xs flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Not Fixed
                    </button>
                  </div>
                </div>
              )}

              {/* Tenant Feedback Display */}
              {complaint.tenantFeedback && (
                <div className="bg-gray-50 border-l-4 border-gray-400 p-3 rounded">
                  <p className="text-xs font-medium text-gray-900 mb-0.5">Your Feedback:</p>
                  <p className="text-xs text-gray-700 break-words">{complaint.tenantFeedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Complaint Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-5">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Submit New Complaint</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    title: '',
                    category: '',
                    priority: '',
                    description: '',
                    location: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Complaint Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs sm:text-sm"
                  placeholder="Brief title of your complaint"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs sm:text-sm"
                  >
                    <option value="">Select category</option>
                    {COMPLAINT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Priority *
                  </label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs sm:text-sm"
                  >
                    {PRIORITY_LEVELS.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs sm:text-sm"
                  placeholder="e.g., Bedroom, Kitchen, Common Area"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs sm:text-sm"
                  placeholder="Describe the issue in detail..."
                />
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> Please provide as much detail as possible to help us resolve your issue quickly.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      title: '',
                      category: '',
                      priority: '',
                      description: '',
                      location: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-xs sm:text-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}