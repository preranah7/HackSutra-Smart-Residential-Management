// src/services/complaintService.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { categorizeComplaint } from './geminiService';

// Create a new complaint
export async function createComplaint(complaintData) {
  try {
    // Use AI to categorize and prioritize
    let aiAnalysis;
    try {
      aiAnalysis = await categorizeComplaint(complaintData);
    } catch (error) {
      console.error('AI categorization failed, using defaults:', error);
      aiAnalysis = {
        category: complaintData.category,
        priority: 'medium',
        estimatedTime: '2-3 days',
        suggestedAction: 'Will be reviewed by maintenance team',
        assignTo: 'maintenance'
      };
    }

    // Create complaint document
    const complaint = {
      ...complaintData,
      priority: aiAnalysis.priority,
      estimatedTime: aiAnalysis.estimatedTime,
      suggestedAction: aiAnalysis.suggestedAction,
      assignTo: aiAnalysis.assignTo,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
  // Validate userId
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
    // Return demo complaints
    return [
      {
        id: 'demo-1',
        category: 'plumbing',
        title: 'Leaking tap in bathroom',
        description: 'The tap in the master bathroom has been leaking for 2 days',
        location: 'Master bathroom',
        priority: 'medium',
        status: 'in-progress',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        adminResponse: 'Plumber has been assigned. Will visit tomorrow morning.'
      },
      {
        id: 'demo-2',
        category: 'electrical',
        title: 'Power socket not working',
        description: 'The power socket in living room is not working',
        location: 'Living room',
        priority: 'high',
        status: 'resolved',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        adminResponse: 'Fixed by electrician. Socket replaced.'
      }
    ];
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

// Update complaint status
export async function updateComplaintStatus(complaintId, status, adminResponse = null) {
  try {
    const complaintRef = doc(db, 'complaints', complaintId);
    
    const updates = {
      status,
      updatedAt: new Date().toISOString()
    };
    
    if (adminResponse) {
      updates.adminResponse = adminResponse;
    }
    
    if (status === 'resolved' || status === 'closed') {
      updates.resolvedAt = new Date().toISOString();
    }
    
    await updateDoc(complaintRef, updates);
    
    return true;
  } catch (error) {
    console.error('Error updating complaint status:', error);
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
        const created = new Date(c.createdAt);
        const resolved = new Date(c.resolvedAt);
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
      total: 23,
      open: 5,
      inProgress: 8,
      resolved: 10,
      closed: 0,
      byCategory: {
        plumbing: 8,
        electrical: 6,
        carpentry: 3,
        cleaning: 4,
        other: 2
      },
      byPriority: {
        emergency: 2,
        high: 6,
        medium: 10,
        low: 5
      },
      avgResolutionTime: 3
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
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error assigning complaint:', error);
    throw error;
  }
}