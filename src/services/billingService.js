// src/services/billingService.js

import {
  collection, addDoc, query, where, getDocs, doc, getDoc, onSnapshot,
  updateDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { generateBillWithAI } from './geminiService';

// Real-time bill subscription for tenant - using email
export function subscribeToBills(userEmail, callback) {
  if (!userEmail) {
    console.error('subscribeToBills: userEmail is required');
    return () => {};
  }

  const billsQuery = query(
    collection(db, 'bills'),
    where('tenantEmail', '==', userEmail)
  );

  return onSnapshot(billsQuery,
    (snapshot) => {
      const bills = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      bills.sort((a, b) => b.month.localeCompare(a.month));
      callback(bills);
    },
    (error) => {
      console.error('Error in bills subscription:', error);
      callback([]);
    }
  );
}

// Generate monthly bill with AI for a property
export async function generateMonthlyBillForProperty(billData) {
  try {
    const { property, month, waterUsage, electricityUsage, additionalCharges, discount, landlordId } = billData;

    console.log('=== BILL GENERATION DEBUG ===');
    console.log('1. Landlord ID:', landlordId);
    console.log('2. Property ID:', property.id);
    console.log('3. Property Landlord ID:', property.landlordId);
    console.log('4. Tenant Name:', property.tenant);
    console.log('5. Tenant Email:', property.tenantEmail);
    console.log('6. Property Status:', property.status);
    console.log('7. Month:', month);

    // Validate inputs
    if (!property || !property.id) {
      throw new Error('Invalid property data');
    }

    // Check for tenant
    if (!property.tenant || property.status !== 'occupied') {
      throw new Error('Property must have an assigned tenant. Please assign a tenant to this property first.');
    }

    if (!property.tenantEmail) {
      throw new Error('Tenant email is missing. Please ensure the tenant has an email address.');
    }

    if (!landlordId) {
      throw new Error('Landlord ID is required');
    }

    // Verify landlord owns property
    if (property.landlordId !== landlordId) {
      throw new Error(`Property landlordId (${property.landlordId}) does not match current user (${landlordId})`);
    }

    // Check if bill already exists
    console.log('8. Checking for existing bills...');
    const existingBills = query(
      collection(db, 'bills'),
      where('propertyId', '==', property.id),
      where('month', '==', month)
    );
    const billSnapshot = await getDocs(existingBills);
    if (!billSnapshot.empty) {
      throw new Error('Bill already exists for this property and month');
    }

    console.log('9. No existing bill found');

    // Calculate charges
    const parkingCharges = (property.parkingSlots || 0) * 500;
    const waterCharges = (waterUsage || 0) * (property.waterCharges || 5);
    const electricityCharges = (electricityUsage || 0) * (property.electricityCharges || 8);

    // Get previous month's bill
    const previousMonth = new Date(month + '-01');
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const prevMonthStr = previousMonth.toISOString().slice(0, 7);

    const prevBillQuery = query(
      collection(db, 'bills'),
      where('propertyId', '==', property.id),
      where('month', '==', prevMonthStr)
    );
    const prevBillSnapshot = await getDocs(prevBillQuery);
    let lastMonthStatus = 'paid';
    if (!prevBillSnapshot.empty) {
      const prevBill = prevBillSnapshot.docs[0].data();
      lastMonthStatus = prevBill.status;
    }

    console.log('10. Previous month status:', lastMonthStatus);

    // Use AI to generate bill
    console.log('11. Calling Gemini AI...');
    const aiBillData = await generateBillWithAI({
      monthlyRent: property.monthlyRent,
      maintenanceCharges: property.maintenanceCharges,
      parkingSlots: property.parkingSlots || 0,
      waterUsage: waterUsage || 0,
      electricityUsage: electricityUsage || 0,
      waterRate: property.waterCharges || 5,
      electricityRate: property.electricityCharges || 8,
      additionalCharges: additionalCharges || 0,
      discount: discount || 0,
      month: month,
      previousBalance: 0,
      lastMonthStatus: lastMonthStatus
    });

    console.log('12. AI bill data:', aiBillData);

    // Ensure we have a valid total
    if (!aiBillData.total || aiBillData.total <= 0) {
      throw new Error('Invalid bill total calculated by AI');
    }

    // Create bill document using tenant email for querying
    const billDoc = {
      propertyId: property.id,
      landlordId: landlordId,
      tenantEmail: property.tenantEmail, 
      tenantName: property.tenant,
      tenantPhone: property.tenantPhone || '',
      flatNumber: property.flatNumber,
      month: month,
      total: aiBillData.total,
      ...aiBillData,
      waterUsage: waterUsage || 0,
      electricityUsage: electricityUsage || 0,
      additionalCharges: additionalCharges || 0,
      additionalChargesDescription: billData.additionalChargesDescription || '',
      discountReason: billData.discountReason || '',
      status: 'pending',
      generatedAt: serverTimestamp(),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      generatedBy: 'ai',
      createdAt: serverTimestamp()
    };

    console.log('13. Bill document to create:', {
      ...billDoc,
      generatedAt: 'serverTimestamp()',
      createdAt: 'serverTimestamp()'
    });

    console.log('14. Attempting to write to Firestore...');
    const docRef = await addDoc(collection(db, 'bills'), billDoc);
    console.log('15. ✅ Bill created successfully with ID:', docRef.id);

    return {
      id: docRef.id,
      ...billDoc,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('=== BILL GENERATION ERROR ===');
    console.error('Error object:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    if (error.code === 'permission-denied') {
      console.error('PERMISSION DENIED - Check these things:');
      console.error('1. Is the user logged in?');
      console.error('2. Does the user document exist in /users/{uid}?');
      console.error('3. Does the user document have role = "landlord"?');
      console.error('4. Does landlordId match request.auth.uid?');
      console.error('5. Are Firestore rules deployed correctly?');
      throw new Error('Permission denied. Please verify: (1) You are logged in as a landlord, (2) Your user profile exists with role="landlord", (3) Firestore rules are deployed correctly.');
    } else if (error.message.includes('already exists')) {
      throw new Error('A bill for this property and month already exists.');
    } else {
      throw error;
    }
  }
}

// Get tenant bills (fallback for non-subscription) - using email
export async function getTenantBills(userEmail) {
  if (!userEmail) {
    console.error('getTenantBills: userEmail is undefined or null');
    return [];
  }

  try {
    const q = query(
      collection(db, 'bills'),
      where('tenantEmail', '==', userEmail)
    );
    const snapshot = await getDocs(q);
    const bills = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    bills.sort((a, b) => b.month.localeCompare(a.month));
    return bills;
  } catch (error) {
    console.error('Error fetching bills:', error);
    return [];
  }
}

// Pay bill
export async function payBill(billId, paymentMethod, transactionId) {
  try {
    const billRef = doc(db, 'bills', billId);
    await updateDoc(billRef, {
      status: 'paid',
      paymentMethod: paymentMethod,
      transactionId: transactionId,
      paidAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error paying bill:', error);
    throw error;
  }
}

// Download bill (generate PDF link or data)
export async function downloadBill(billId) {
  try {
    const billDoc = await getDoc(doc(db, 'bills', billId));
    if (!billDoc.exists()) {
      throw new Error('Bill not found');
    }
    return {
      id: billId,
      ...billDoc.data()
    };
  } catch (error) {
    console.error('Error downloading bill:', error);
    throw error;
  }
}

// Get billing statistics for landlord
export async function getLandlordBillingStats(landlordId) {
  try {
    const q = query(
      collection(db, 'bills'),
      where('landlordId', '==', landlordId)
    );
    const snapshot = await getDocs(q);

    let totalRevenue = 0;
    let collected = 0;
    let pending = 0;
    let overdue = 0;
    const now = new Date();

    snapshot.docs.forEach(doc => {
      const bill = doc.data();
      const total = bill.total || 0;
      totalRevenue += total;

      if (bill.status === 'paid') {
        collected += total;
      } else {
        const dueDate = new Date(bill.dueDate);
        if (dueDate < now) {
          overdue += total;
        } else {
          pending += total;
        }
      }
    });

    return {
      totalRevenue,
      collected,
      pending,
      overdue,
      collectionRate: totalRevenue > 0 ? Math.round((collected / totalRevenue) * 100) : 0
    };
  } catch (error) {
    console.error('Error fetching billing stats:', error);
    return {
      totalRevenue: 0,
      collected: 0,
      pending: 0,
      overdue: 0,
      collectionRate: 0
    };
  }
}

// Mark bill as overdue (scheduled job would call this)
export async function markOverdueBills() {
  try {
    const now = new Date().toISOString();
    const overdueQuery = query(
      collection(db, 'bills'),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(overdueQuery);

    for (const billDoc of snapshot.docs) {
      const bill = billDoc.data();
      if (bill.dueDate && bill.dueDate < now) {
        await updateDoc(doc(db, 'bills', billDoc.id), {
          status: 'overdue',
          updatedAt: serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Error marking overdue bills:', error);
  }
}