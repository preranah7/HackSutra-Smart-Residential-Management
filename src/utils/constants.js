// src/utils/constants.js

// User Roles
export const ROLES = {
  TENANT: 'tenant',
  LANDLORD: 'landlord',
  ADMIN: 'admin'
};

// Complaint Categories
export const COMPLAINT_CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing', icon: '🚰' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'carpentry', label: 'Carpentry', icon: '🔨' },
  { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { value: 'lift', label: 'Lift/Elevator', icon: '🛗' },
  { value: 'painting', label: 'Painting', icon: '🎨' },
  { value: 'security', label: 'Security', icon: '🔒' },
  { value: 'other', label: 'Other', icon: '📝' }
];

// Complaint Priority
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  EMERGENCY: 'emergency'
};

// Priority Colors (for UI)
export const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  emergency: 'bg-red-100 text-red-800'
};

// Complaint Status
export const COMPLAINT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

// Status Colors
export const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
};

// Bill Status
export const BILL_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  PARTIALLY_PAID: 'partially_paid'
};

// Parking Types
export const PARKING_TYPES = {
  RESIDENT: 'resident',
  VISITOR: 'visitor',
  EV_CHARGING: 'ev_charging'
};

// Waste Types
export const WASTE_TYPES = [
  { value: 'wet', label: 'Wet Waste', color: 'green', icon: '🍎' },
  { value: 'dry', label: 'Dry Waste', color: 'blue', icon: '📄' },
  { value: 'e_waste', label: 'E-Waste', color: 'red', icon: '📱' },
  { value: 'bulk', label: 'Bulk Waste', color: 'orange', icon: '🪑' }
];

// Waste Collection Schedule (default)
export const WASTE_SCHEDULE = {
  monday: ['wet'],
  tuesday: ['dry'],
  wednesday: ['wet'],
  thursday: ['dry'],
  friday: ['wet'],
  saturday: ['bulk', 'e_waste'],
  sunday: []
};

// Society Default Data
export const DEFAULT_SOCIETY = {
  id: 'sunshine_apartments',
  name: 'Sunshine Apartments',
  address: 'Baner, Pune, Maharashtra 411045',
  totalFlats: 200
};