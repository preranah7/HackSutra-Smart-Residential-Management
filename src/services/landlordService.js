// src/services/landlordService.js

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Subscribe to landlord's properties in real-time
export function subscribeToLandlordProperties(landlordId, callback) {
  const propertiesQuery = query(
    collection(db, 'properties'),
    where('landlordId', '==', landlordId)
  );

  return onSnapshot(
    propertiesQuery,
    (snapshot) => {
      const properties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      properties.sort((a, b) => a.flatNumber.localeCompare(b.flatNumber));
      callback(properties);
    },
    (error) => {
      console.error('Error in properties subscription:', error);
      callback([]);
    }
  );
}

// Get landlord's properties
export async function getLandlordProperties(landlordId) {
  try {
    const propertiesQuery = query(
      collection(db, 'properties'),
      where('landlordId', '==', landlordId)
    );
    const snapshot = await getDocs(propertiesQuery);
    const properties = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return properties.sort((a, b) => a.flatNumber.localeCompare(b.flatNumber));
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
}

// Add new property
export async function addProperty(propertyData) {
  try {
    const property = {
      ...propertyData,
      status: 'vacant',
      tenant: null,
      tenantEmail: null,
      tenantPhone: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'properties'), property);
    console.log('Property added successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding property:', error);
    throw new Error('Failed to add property');
  }
}

// Update property
export async function updateProperty(propertyId, propertyData) {
  try {
    const propertyRef = doc(db, 'properties', propertyId);
    // Get current property data to preserve tenant info if it exists
    const propertyDoc = await getDoc(propertyRef);
    const currentData = propertyDoc.data();

    // Prepare update data - preserve tenant info and status
    const updateData = {
      ...propertyData,
      updatedAt: serverTimestamp()
    };

    if (currentData.tenant) {
      updateData.tenant = currentData.tenant;
      updateData.tenantEmail = currentData.tenantEmail;
      updateData.tenantPhone = currentData.tenantPhone;
      updateData.leaseStartDate = currentData.leaseStartDate;
      updateData.leaseEndDate = currentData.leaseEndDate;
      updateData.status = currentData.status;
    }

    await updateDoc(propertyRef, updateData);
    console.log('Property updated successfully:', propertyId);
    return true;
  } catch (error) {
    console.error('Error updating property:', error);
    throw new Error('Failed to update property');
  }
}

// Delete property
export async function deleteProperty(propertyId) {
  try {
    await deleteDoc(doc(db, 'properties', propertyId));
    console.log('Property deleted successfully:', propertyId);
    return true;
  } catch (error) {
    console.error('Error deleting property:', error);
    throw new Error('Failed to delete property');
  }
}

// Assign tenant to property
export async function assignTenant(propertyId, tenantData) {
  try {
    console.log('=== ASSIGN TENANT DEBUG ===');
    console.log('1. Property ID:', propertyId);
    console.log('2. Tenant Data:', tenantData);

    const propertyRef = doc(db, 'properties', propertyId);
    
    // Update property with tenant information
    await updateDoc(propertyRef, {
      tenant: tenantData.tenantName,
      tenantEmail: tenantData.tenantEmail,
      tenantPhone: tenantData.tenantPhone,
      leaseStartDate: tenantData.leaseStartDate,
      leaseEndDate: tenantData.leaseEndDate,
      status: 'occupied', // Update status to occupied
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('3. ✅ Tenant assigned successfully to property:', propertyId);
    return true;
  } catch (error) {
    console.error('Error assigning tenant:', error);
    throw new Error('Failed to assign tenant to property');
  }
}

// Remove tenant from property
export async function removeTenant(propertyId) {
  try {
    const propertyRef = doc(db, 'properties', propertyId);
    
    // Remove tenant information and update status
    await updateDoc(propertyRef, {
      tenant: null,
      tenantEmail: null,
      tenantPhone: null,
      leaseStartDate: null,
      leaseEndDate: null,
      status: 'vacant', // Update status to vacant
      assignedAt: null,
      updatedAt: serverTimestamp()
    });

    console.log('Tenant removed successfully from property:', propertyId);
    return true;
  } catch (error) {
    console.error('Error removing tenant:', error);
    throw new Error('Failed to remove tenant from property');
  }
}

// Get tenant's property - using email
export async function getTenantProperty(tenantEmail) {
  try {
    const propertiesQuery = query(
      collection(db, 'properties'),
      where('tenantEmail', '==', tenantEmail)
    );
    const snapshot = await getDocs(propertiesQuery);
    
    if (snapshot.empty) {
      return null;
    }
    
    const propertyDoc = snapshot.docs[0];
    return {
      id: propertyDoc.id,
      ...propertyDoc.data()
    };
  } catch (error) {
    console.error('Error fetching tenant property:', error);
    return null;
  }
}

// Get landlord statistics
export async function getLandlordStats(landlordId) {
  try {
    const properties = await getLandlordProperties(landlordId);
    const totalProperties = properties.length;
    
    // Check multiple conditions for occupied status
    const occupiedProperties = properties.filter(p => 
      p.status === 'occupied' || p.tenant || p.tenantEmail
    ).length;
    const vacantProperties = totalProperties - occupiedProperties;
    const activeTenants = occupiedProperties;

    // Calculate revenue
    const totalRevenue = properties.reduce((sum, p) => {
      if (p.status === 'occupied' || p.tenant || p.tenantEmail) {
        return sum + (p.monthlyRent || 0);
      }
      return sum;
    }, 0);

    // Get bills for collection rate (implement this based on your bills collection)
    const collectionRate = 85; // Placeholder - implement actual calculation
    const pendingBills = 3; // Placeholder
    const pendingAmount = 45000; // Placeholder

    return {
      totalProperties,
      occupiedProperties,
      vacantProperties,
      activeTenants,
      totalRevenue,
      collectionRate,
      pendingBills,
      pendingAmount
    };
  } catch (error) {
    console.error('Error fetching landlord stats:', error);
    return {
      totalProperties: 0,
      occupiedProperties: 0,
      vacantProperties: 0,
      activeTenants: 0,
      totalRevenue: 0,
      collectionRate: 0,
      pendingBills: 0,
      pendingAmount: 0
    };
  }
}

// Get property by ID
export async function getPropertyById(propertyId) {
  try {
    const propertyRef = doc(db, 'properties', propertyId);
    const propertyDoc = await getDoc(propertyRef);
    
    if (propertyDoc.exists()) {
      return {
        id: propertyDoc.id,
        ...propertyDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching property:', error);
    return null;
  }
}

// Get all properties for a society (for admin)
export async function getAllProperties(societyId) {
  try {
    const propertiesQuery = query(
      collection(db, 'properties'),
      where('societyId', '==', societyId)
    );
    const snapshot = await getDocs(propertiesQuery);
    const properties = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return properties.sort((a, b) => a.flatNumber.localeCompare(b.flatNumber));
  } catch (error) {
    console.error('Error fetching all properties:', error);
    return [];
  }
}

// Update property status
export async function updatePropertyStatus(propertyId, status) {
  try {
    const propertyRef = doc(db, 'properties', propertyId);
    await updateDoc(propertyRef, {
      status: status,
      updatedAt: serverTimestamp()
    });
    console.log('Property status updated:', propertyId, status);
    return true;
  } catch (error) {
    console.error('Error updating property status:', error);
    throw new Error('Failed to update property status');
  }
}
