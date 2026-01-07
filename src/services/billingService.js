// src/services/billingService.js
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { generateBillWithAI } from './geminiService';

export async function generateMonthlyBill(rentalId, month) {
  try {
    // Get rental details
    const rentalDoc = await getDoc(doc(db, 'rentals', rentalId));
    
    if (!rentalDoc.exists()) {
      throw new Error('Rental not found');
    }
    
    const rental = rentalDoc.data();
    
    // Check if bill already exists
    const existingBills = query(
      collection(db, 'bills'),
      where('rentalId', '==', rentalId),
      where('month', '==', month)
    );
    const billSnapshot = await getDocs(existingBills);
    
    if (!billSnapshot.empty) {
      throw new Error('Bill already exists for this month');
    }
    
    // Use AI to generate bill
    const billData = await generateBillWithAI({
      monthlyRent: rental.monthlyRent,
      maintenanceCharges: rental.maintenanceCharges,
      parkingSlots: rental.parkingSlots?.length || 0,
      waterUsage: rental.waterUsage || 0,
      electricityUsage: rental.electricityUsage || 0,
      month: month,
      previousBalance: rental.previousBalance || 0,
      lastMonthStatus: rental.lastMonthStatus || 'paid'
    });
    
    // Save to Firestore
    const billRef = await addDoc(collection(db, 'bills'), {
      rentalId: rentalId,
      tenantId: rental.tenantId,
      landlordId: rental.landlordId,
      month: month,
      ...billData,
      status: 'pending',
      generatedAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    return { id: billRef.id, ...billData };
  } catch (error) {
    console.error('Error generating bill:', error);
    throw error;
  }
}

export async function getTenantBills(tenantId) {
  try {
    const q = query(
      collection(db, 'bills'),
      where('tenantId', '==', tenantId)
    );
    
    const snapshot = await getDocs(q);
    const bills = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort by month descending
    bills.sort((a, b) => b.month.localeCompare(a.month));
    
    return bills;
  } catch (error) {
    console.error('Error fetching bills:', error);
    throw error;
  }
}