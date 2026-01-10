// src/utils/realtimeUtils.js

// Format Firestore timestamp to readable date
export function formatFirestoreDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  // Handle Firestore Timestamp object
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-IN');
  }
  
  // Handle ISO string or Date object
  return new Date(timestamp).toLocaleDateString('en-IN');
}

// Format Firestore timestamp to relative time (e.g., "2 hours ago")
export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Just now';
  
  const date = timestamp.seconds 
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);
  
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffSecs < 10) return 'Just now';
  if (diffSecs < 60) return `${diffSecs} seconds ago`;
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
}

// Debounce function for real-time search/filter
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Check if data has changed (for optimistic updates)
export function hasDataChanged(oldData, newData, fieldsToCheck) {
  if (!oldData || !newData) return true;
  
  if (fieldsToCheck) {
    return fieldsToCheck.some(field => oldData[field] !== newData[field]);
  }
  
  return JSON.stringify(oldData) !== JSON.stringify(newData);
}

// Merge real-time updates with local state (optimistic UI)
export function mergeRealtimeData(localData, realtimeData, idField = 'id') {
  const realtimeMap = new Map(realtimeData.map(item => [item[idField], item]));
  
  // Update existing items and add new ones
  return localData.map(item => realtimeMap.get(item[idField]) || item)
    .concat(realtimeData.filter(item => 
      !localData.some(local => local[idField] === item[idField])
    ));
}

// Calculate percentage safely
export function safePercentage(numerator, denominator, decimals = 0) {
  if (!denominator || denominator === 0) return 0;
  const percentage = (numerator / denominator) * 100;
  return decimals > 0 ? parseFloat(percentage.toFixed(decimals)) : Math.round(percentage);
}

// Format currency (Indian Rupees)
export function formatCurrency(amount, showDecimals = false) {
  if (!amount && amount !== 0) return '₹0';
  
  const formatted = amount.toLocaleString('en-IN', {
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0
  });
  
  return `₹${formatted}`;
}

// Convert amount to lakhs/crores
export function formatLargeAmount(amount) {
  if (!amount) return '₹0';
  
  if (amount >= 10000000) {
    // Crores
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  } else if (amount >= 100000) {
    // Lakhs
    return `₹${(amount / 100000).toFixed(2)}L`;
  } else if (amount >= 1000) {
    // Thousands
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  
  return formatCurrency(amount);
}

// Group data by field (for real-time aggregations)
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
}

// Sort array with null safety
export function safeSort(array, sortBy, order = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    if (typeof aVal === 'string') {
      return order === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    return order === 'asc' ? aVal - bVal : bVal - aVal;
  });
}

// Real-time connection status handler
export function createConnectionMonitor(onOnline, onOffline) {
  const handleOnline = () => {
    console.log('🟢 Connection restored');
    onOnline?.();
  };
  
  const handleOffline = () => {
    console.log('🔴 Connection lost');
    onOffline?.();
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Batch updates for performance
export function batchUpdates(updates, batchSize = 500) {
  const batches = [];
  for (let i = 0; i < updates.length; i += batchSize) {
    batches.push(updates.slice(i, i + batchSize));
  }
  return batches;
}

// Check if user is online
export function isOnline() {
  return navigator.onLine;
}

// Generate unique ID for optimistic updates
export function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Retry failed operations
export async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

// Validate Firestore data before saving
export function validateFirestoreData(data) {
  const errors = [];
  
  // Check for undefined values (Firestore doesn't allow undefined)
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) {
      errors.push(`Field "${key}" cannot be undefined`);
    }
  });
  
  // Check for invalid characters in field names
  Object.keys(data).forEach(key => {
    if (key.includes('.') || key.includes('[') || key.includes(']')) {
      errors.push(`Field name "${key}" contains invalid characters`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Clean data for Firestore (remove undefined values)
export function cleanFirestoreData(data) {
  const cleaned = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  });
  
  return cleaned;
}

// Calculate real-time statistics
export function calculateStats(data, groupKey, valueKey) {
  const grouped = groupBy(data, groupKey);
  
  return Object.entries(grouped).map(([key, items]) => ({
    label: key,
    count: items.length,
    total: items.reduce((sum, item) => sum + (item[valueKey] || 0), 0),
    average: items.reduce((sum, item) => sum + (item[valueKey] || 0), 0) / items.length
  }));
}

// Detect changes in real-time data
export function detectChanges(oldData, newData, idField = 'id') {
  const changes = {
    added: [],
    updated: [],
    removed: []
  };
  
  const oldMap = new Map(oldData.map(item => [item[idField], item]));
  const newMap = new Map(newData.map(item => [item[idField], item]));
  
  // Find added and updated
  newData.forEach(newItem => {
    const oldItem = oldMap.get(newItem[idField]);
    if (!oldItem) {
      changes.added.push(newItem);
    } else if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
      changes.updated.push(newItem);
    }
  });
  
  // Find removed
  oldData.forEach(oldItem => {
    if (!newMap.has(oldItem[idField])) {
      changes.removed.push(oldItem);
    }
  });
  
  return changes;
}

// Toast notification helper for real-time updates
export function showRealtimeNotification(type, message) {
  // This can be replaced with your preferred toast library
  const event = new CustomEvent('realtime-notification', {
    detail: { type, message }
  });
  window.dispatchEvent(event);
}

// Export all utilities
export default {
  formatFirestoreDate,
  formatRelativeTime,
  debounce,
  hasDataChanged,
  mergeRealtimeData,
  safePercentage,
  formatCurrency,
  formatLargeAmount,
  groupBy,
  safeSort,
  createConnectionMonitor,
  batchUpdates,
  isOnline,
  generateTempId,
  retryOperation,
  validateFirestoreData,
  cleanFirestoreData,
  calculateStats,
  detectChanges,
  showRealtimeNotification
};