// src/services/complaintService.js

import {
  collection, addDoc, getDocs, query, where, orderBy, doc,
  updateDoc, getDoc, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Real-time complaints subscription for user
export function subscribeToUserComplaints(userId, callback) {
  if (!userId) {
    console.error('subscribeToUserComplaints: userId is required');
    return () => {};
  }

  const q = query(
    collection(db, 'complaints'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const complaints = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(complaints);
    },
    (error) => {
      console.error('Error in complaints subscription:', error);
      callback([]);
    }
  );
}

// Real-time all complaints subscription (for admin/landlord)
export function subscribeToAllComplaints(callback) {
  const q = query(
    collection(db, 'complaints'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const complaints = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(complaints);
    },
    (error) => {
      console.error('Error in all complaints subscription:', error);
      callback([]);
    }
  );
}


export async function createComplaint(complaintData) {
  try {
    // Determine estimated time based on priority
    const estimatedTimeMap = {
      'emergency': '2-4 hours',
      'high': '1 day',
      'medium': '2-3 days',
      'low': '1 week'
    };

    // Determine assignTo based on category
    const assignToMap = {
      'Plumbing': 'plumber',
      'Electrical': 'electrician',
      'Maintenance': 'maintenance',
      'Cleaning': 'cleaning staff',
      'Security': 'security',
      'Parking': 'maintenance',
      'Noise': 'security',
      'Other': 'maintenance'
    };

    // Create complaint document with default values
    const complaint = {
      ...complaintData,
      priority: complaintData.priority || 'medium',
      estimatedTime: estimatedTimeMap[complaintData.priority] || '2-3 days',
      suggestedAction: 'Will be reviewed by maintenance team',
      assignTo: assignToMap[complaintData.category] || 'maintenance',
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'complaints'), complaint);
    return { id: docRef.id, ...complaint };
  } catch (error) {
    console.error('Error creating complaint:', error);
    throw new Error('Failed to create complaint');
  }
}

// Get complaints for a specific user
export async function getUserComplaints(userId) {
  if (!userId) {
    console.error('getUserComplaints: userId is undefined or null');
    return [];
  }

  try {
    const q = query(
      collection(db, 'complaints'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const complaints = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return complaints;
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    // If index error, fetch without ordering
    if (error.code === 'failed-precondition' || error.message.includes('index')) {
      console.log('Fetching complaints without ordering (index not ready)...');
      try {
        const simpleQuery = query(
          collection(db, 'complaints'),
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(simpleQuery);
        const complaints = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort manually
        complaints.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        return complaints;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return [];
      }
    }
    return [];
  }
}

// Get all complaints (for admin)
export async function getAllComplaints() {
  try {
    const q = query(
      collection(db, 'complaints'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const complaints = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return complaints;
  } catch (error) {
    console.error('Error fetching all complaints:', error);
    return [];
  }
}

// Update complaint status with notification (Admin/Landlord)
export async function updateComplaintStatus(complaintId, status, adminResponse = null) {
  try {
    const complaintRef = doc(db, 'complaints', complaintId);
    const updates = {
      status,
      updatedAt: serverTimestamp()
    };

    if (adminResponse) {
      updates.adminResponse = adminResponse;
      updates.adminResponseAt = serverTimestamp();
    }

    if (status === 'resolved' || status === 'closed') {
      updates.resolvedAt = serverTimestamp();
    }

    await updateDoc(complaintRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating complaint status:', error);
    throw error;
  }
}

// Allow tenant to update complaint status (mark as resolved/reopen)
export async function tenantUpdateComplaintStatus(complaintId, newStatus, tenantFeedback = null) {
  try {
    const complaintRef = doc(db, 'complaints', complaintId);
    const updates = {
      status: newStatus,
      updatedAt: serverTimestamp()
    };

    if (tenantFeedback) {
      updates.tenantFeedback = tenantFeedback;
      updates.tenantFeedbackAt = serverTimestamp();
    }

    if (newStatus === 'closed') {
      updates.closedAt = serverTimestamp();
      updates.closedBy = 'tenant';
    }

    await updateDoc(complaintRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating complaint status by tenant:', error);
    throw error;
  }
}

// Get complaint statistics
export async function getComplaintStatistics() {
  try {
    const snapshot = await getDocs(collection(db, 'complaints'));
    const complaints = snapshot.docs.map(doc => doc.data());

    const stats = {
      total: complaints.length,
      open: complaints.filter(c => c.status === 'open').length,
      inProgress: complaints.filter(c => c.status === 'in-progress').length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
      closed: complaints.filter(c => c.status === 'closed').length,
      byCategory: {},
      byPriority: {
        emergency: complaints.filter(c => c.priority === 'emergency').length,
        high: complaints.filter(c => c.priority === 'high').length,
        medium: complaints.filter(c => c.priority === 'medium').length,
        low: complaints.filter(c => c.priority === 'low').length
      }
    };

    // Calculate by category
    complaints.forEach(c => {
      stats.byCategory[c.category] = (stats.byCategory[c.category] || 0) + 1;
    });

    // Calculate average resolution time
    const resolvedComplaints = complaints.filter(c => c.resolvedAt);
    if (resolvedComplaints.length > 0) {
      const totalTime = resolvedComplaints.reduce((sum, c) => {
        const created = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
        const resolved = c.resolvedAt?.toDate ? c.resolvedAt.toDate() : new Date(c.resolvedAt);
        return sum + (resolved - created);
      }, 0);
      stats.avgResolutionTime = Math.round(totalTime / resolvedComplaints.length / (1000 * 60 * 60 * 24)); // in days
    } else {
      stats.avgResolutionTime = 0;
    }

    return stats;
  } catch (error) {
    console.error('Error fetching complaint statistics:', error);
    return {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      byCategory: {},
      byPriority: {
        emergency: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      avgResolutionTime: 0
    };
  }
}

// Assign complaint to worker
export async function assignComplaint(complaintId, workerId, workerName) {
  try {
    const complaintRef = doc(db, 'complaints', complaintId);
    await updateDoc(complaintRef, {
      status: 'in-progress',
      assignedTo: workerId,
      assignedWorker: workerName,
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error assigning complaint:', error);
    throw error;
  }
}

// Add comment to complaint
export async function addComplaintComment(complaintId, comment, userId, userName) {
  try {
    const complaintRef = doc(db, 'complaints', complaintId);
    const complaintDoc = await getDoc(complaintRef);

    if (!complaintDoc.exists()) {
      throw new Error('Complaint not found');
    }

    const currentComments = complaintDoc.data().comments || [];
    const newComment = {
      text: comment,
      userId,
      userName,
      timestamp: new Date().toISOString()
    };

    await updateDoc(complaintRef, {
      comments: [...currentComments, newComment],
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}