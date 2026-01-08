// src/services/landlordService.js
import {
  collection, query, where, getDocs, doc, getDoc, addDoc,
  updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Get all properties owned by landlord (with real-time support)
export async function getLandlordProperties(landlordId) {
  if (!landlordId) {
    console.error('getLandlordProperties: landlordId is undefined');
    return [];
  }

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
    return properties;
  } catch (error) {
    console.error('Error fetching landlord properties:', error);
    return [];
  }
}

// Add new property
export async function addProperty(landlordId, propertyData) {
  if (!landlordId) {
    throw new Error('Landlord ID is required');
  }

  try {
    const newProperty = {
      ...propertyData,
      landlordId,
      status: 'vacant',
      tenantId: null,
      tenant: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'properties'), newProperty);
    console.log('✓ Property added with ID:', docRef.id);
    return { id: docRef.id, ...newProperty };
  } catch (error) {
    console.error('Error adding property:', error);
    throw error;
  }
}

// Update property
export async function updateProperty(propertyId, updates) {
  try {
    const propertyRef = doc(db, 'properties', propertyId);
    await updateDoc(propertyRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating property:', error);
    throw error;
  }
}

// Delete property
export async function deleteProperty(propertyId) {
  try {
    await deleteDoc(doc(db, 'properties', propertyId));
    return true;
  } catch (error) {
    console.error('Error deleting property:', error);
    throw error;
  }
}

// Assign tenant to property
export async function assignTenantToProperty(propertyId, tenantId) {
  if (!propertyId || !tenantId) {
    throw new Error('Property ID and Tenant ID are required');
  }

  try {
    console.log('Assigning tenant:', tenantId, 'to property:', propertyId);

    // Get tenant details
    const tenantDoc = await getDoc(doc(db, 'users', tenantId));
    if (!tenantDoc.exists()) {
      throw new Error('Tenant not found');
    }

    const tenantData = tenantDoc.data();
    console.log('Tenant data:', tenantData);

    // Get property details
    const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
    if (!propertyDoc.exists()) {
      throw new Error('Property not found');
    }

    const propertyData = propertyDoc.data();
    console.log('Property data:', propertyData);

    // Update property first
    const propertyRef = doc(db, 'properties', propertyId);
    await updateDoc(propertyRef, {
      status: 'occupied',
      tenantId: tenantId,
      tenant: tenantData.name,
      tenantEmail: tenantData.email,
      occupiedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✓ Property updated');

    // Update tenant's flatNumber
    const tenantRef = doc(db, 'users', tenantId);
    await updateDoc(tenantRef, {
      flatNumber: propertyData.flatNumber,
      propertyId: propertyId,
      updatedAt: serverTimestamp()
    });
    console.log('✓ Tenant profile updated');

    return true;
  } catch (error) {
    console.error('Error in assignTenantToProperty:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // More specific error messages
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please update Firestore security rules.');
    } else if (error.code === 'not-found') {
      throw new Error('Property or tenant not found.');
    } else {
      throw new Error(error.message || 'Failed to assign tenant');
    }
  }
}

// Remove tenant from property
export async function removeTenantFromProperty(propertyId) {
  try {
    const propertyRef = doc(db, 'properties', propertyId);
    const propertyDoc = await getDoc(propertyRef);
    
    if (propertyDoc.exists() && propertyDoc.data().tenantId) {
      const tenantId = propertyDoc.data().tenantId;
      
      // Update tenant
      const tenantRef = doc(db, 'users', tenantId);
      await updateDoc(tenantRef, {
        flatNumber: null,
        propertyId: null,
        updatedAt: serverTimestamp()
      });
    }

    // Update property
    await updateDoc(propertyRef, {
      status: 'vacant',
      tenantId: null,
      tenant: null,
      tenantEmail: null,
      vacatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error removing tenant:', error);
    throw error;
  }
}

// Get revenue statistics for landlord
export async function getLandlordRevenue(landlordId) {
  if (!landlordId) {
    console.error('getLandlordRevenue: landlordId is undefined');
    return null;
  }

  try {
    const properties = await getLandlordProperties(landlordId);

    let totalMonthly = 0;
    let occupied = 0;

    properties.forEach(property => {
      if (property.status === 'occupied') {
        occupied++;
        totalMonthly += property.monthlyRent || 0;
        totalMonthly += property.maintenanceCharges || 0;
        totalMonthly += (property.parkingSlots || 0) * 500; // ₹500 per slot
      }
    });

    const occupancyRate = properties.length > 0
      ? Math.round((occupied / properties.length) * 100)
      : 0;

    return {
      totalMonthly,
      occupancyRate,
      totalProperties: properties.length,
      occupiedProperties: occupied,
      vacantProperties: properties.length - occupied
    };
  } catch (error) {
    console.error('Error calculating landlord revenue:', error);
    return {
      totalMonthly: 0,
      occupancyRate: 0,
      totalProperties: 0,
      occupiedProperties: 0,
      vacantProperties: 0
    };
  }
}

// Get tenants for a landlord
export async function getLandlordTenants(landlordId) {
  if (!landlordId) {
    console.error('getLandlordTenants: landlordId is undefined');
    return [];
  }

  try {
    const properties = await getLandlordProperties(landlordId);
    const tenants = [];

    for (const property of properties) {
      if (property.tenantId && property.status === 'occupied') {
        try {
          const tenantDoc = await getDoc(doc(db, 'users', property.tenantId));
          if (tenantDoc.exists()) {
            tenants.push({
              id: property.tenantId,
              ...tenantDoc.data(),
              propertyId: property.id,
              flatNumber: property.flatNumber,
              rent: property.monthlyRent
            });
          }
        } catch (err) {
          console.error('Error fetching tenant details:', err);
        }
      }
    }

    return tenants;
  } catch (error) {
    console.error('Error fetching landlord tenants:', error);
    return [];
  }
}

// Get payment history for a property
export async function getPropertyPaymentHistory(propertyId) {
  try {
    const paymentsQuery = query(
      collection(db, 'bills'),
      where('propertyId', '==', propertyId)
    );
    const snapshot = await getDocs(paymentsQuery);
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by date descending
    payments.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    return payments;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
}
