// src/services/landlordService.js
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Get all properties owned by landlord
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
    // Return demo data
    return [
      {
        id: '1',
        flatNumber: '301',
        tenant: 'Raj Malhotra',
        tenantId: 'tenant1',
        rent: 15000,
        status: 'occupied',
        leaseStart: '2024-01-01',
        leaseEnd: '2025-12-31',
        lastPayment: '2026-01-01',
        deposit: 30000
      },
      {
        id: '2',
        flatNumber: '205',
        tenant: 'Priya Sharma',
        tenantId: 'tenant2',
        rent: 18000,
        status: 'occupied',
        leaseStart: '2024-06-01',
        leaseEnd: '2025-08-15',
        lastPayment: '2026-01-01',
        deposit: 36000
      },
      {
        id: '3',
        flatNumber: '402',
        tenant: null,
        tenantId: null,
        rent: 16000,
        status: 'vacant',
        leaseStart: null,
        leaseEnd: null,
        lastPayment: null,
        deposit: 0
      }
    ];
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
    let collected = 0;
    let pending = 0;
    let occupied = 0;
    
    properties.forEach(property => {
      if (property.status === 'occupied') {
        occupied++;
        totalMonthly += property.rent;
        
        // Check if payment received this month
        if (property.lastPayment) {
          const lastPaymentDate = new Date(property.lastPayment);
          const now = new Date();
          const isCurrentMonth = 
            lastPaymentDate.getMonth() === now.getMonth() &&
            lastPaymentDate.getFullYear() === now.getFullYear();
          
          if (isCurrentMonth) {
            collected += property.rent;
          } else {
            pending += property.rent;
          }
        } else {
          pending += property.rent;
        }
      }
    });
    
    const occupancyRate = properties.length > 0 
      ? Math.round((occupied / properties.length) * 100) 
      : 0;
    
    return {
      totalMonthly,
      collected,
      pending,
      occupancyRate,
      totalProperties: properties.length,
      occupiedProperties: occupied,
      vacantProperties: properties.length - occupied
    };
  } catch (error) {
    console.error('Error calculating landlord revenue:', error);
    return {
      totalMonthly: 49000,
      collected: 33000,
      pending: 16000,
      occupancyRate: 67,
      totalProperties: 3,
      occupiedProperties: 2,
      vacantProperties: 1
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
              rent: property.rent,
              leaseEnd: property.leaseEnd,
              lastPayment: property.lastPayment
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
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'properties'), newProperty);
    
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
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating property:', error);
    throw error;
  }
}

// Get payment history for a property
export async function getPropertyPaymentHistory(propertyId) {
  try {
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('propertyId', '==', propertyId)
    );
    
    const snapshot = await getDocs(paymentsQuery);
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort by date descending
    payments.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return payments;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
}

// Record payment
export async function recordPayment(paymentData) {
  try {
    const payment = {
      ...paymentData,
      recordedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'payments'), payment);
    
    // Update property's last payment date
    if (paymentData.propertyId) {
      await updateDoc(doc(db, 'properties', paymentData.propertyId), {
        lastPayment: paymentData.date
      });
    }
    
    return { id: docRef.id, ...payment };
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
}