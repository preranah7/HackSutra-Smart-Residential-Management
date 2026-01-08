// src/services/userService.js
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

// Get all users with tenant role
export async function getAllTenants() {
  try {
    const tenantsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'tenant')
    );
    
    const snapshot = await getDocs(tenantsQuery);
    const tenants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return tenants;
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }
}

// Get user by ID
export async function getUserById(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return {
        id: userId,
        ...userDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Get all landlords
export async function getAllLandlords() {
  try {
    const landlordsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'landlord')
    );
    
    const snapshot = await getDocs(landlordsQuery);
    const landlords = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return landlords;
  } catch (error) {
    console.error('Error fetching landlords:', error);
    return [];
  }
}
