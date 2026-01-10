// src/utils/colors.js

export const colors = {
  primary: {
    main: '#4F46E5', // Indigo-600
    light: '#818CF8', // Indigo-400
    dark: '#3730A3', // Indigo-700
    bg: '#EEF2FF', // Indigo-50
  },
  
  success: {
    main: '#10B981', // Emerald-500
    light: '#34D399', // Emerald-400
    bg: '#D1FAE5', // Emerald-100
  },
  
  warning: {
    main: '#F59E0B', // Amber-500
    light: '#FBBF24', // Amber-400
    bg: '#FEF3C7', // Amber-100
  },
  
  danger: {
    main: '#EF4444', // Red-500
    light: '#F87171', // Red-400
    bg: '#FEE2E2', // Red-100
  },
  
  info: {
    main: '#3B82F6', // Blue-500
    light: '#60A5FA', // Blue-400
    bg: '#DBEAFE', // Blue-100
  },
  

  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  

  status: {
    available: '#10B981', // Emerald-500
    reserved: '#F59E0B', // Amber-500
    occupied: '#EF4444', // Red-500
    open: '#EF4444', // Red-500
    inProgress: '#F59E0B', // Amber-500
    resolved: '#10B981', // Emerald-500
    closed: '#6B7280', // Gray-500
  }
};


export const getStatusColor = (status) => {
  const statusMap = {
    'available': colors.status.available,
    'reserved': colors.status.reserved,
    'occupied': colors.status.occupied,
    'open': colors.status.open,
    'in-progress': colors.status.inProgress,
    'resolved': colors.status.resolved,
    'closed': colors.status.closed,
    'pending': colors.warning.main,
    'paid': colors.success.main,
    'overdue': colors.danger.main,
    'active': colors.success.main,
    'cancelled': colors.neutral[500],
  };
  
  return statusMap[status] || colors.neutral[500];
};


export const getStatusBgColor = (status) => {
  const statusMap = {
    'available': colors.success.bg,
    'reserved': colors.warning.bg,
    'occupied': colors.danger.bg,
    'open': colors.danger.bg,
    'in-progress': colors.warning.bg,
    'resolved': colors.success.bg,
    'closed': colors.neutral[100],
    'pending': colors.warning.bg,
    'paid': colors.success.bg,
    'overdue': colors.danger.bg,
    'active': colors.success.bg,
    'cancelled': colors.neutral[100],
  };
  
  return statusMap[status] || colors.neutral[100];
};