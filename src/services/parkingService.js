// src/services/parkingService.js
import {
  collection, addDoc, getDocs, query, where, updateDoc, doc, getDoc,
  onSnapshot, serverTimestamp, deleteDoc, Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Real-time parking slots subscription
export function subscribeToParkingSlots(callback) {
  return onSnapshot(
    collection(db, 'parkingSlots'),
    (snapshot) => {
      const slots = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      slots.sort((a, b) => a.slotNumber.localeCompare(b.slotNumber));
      callback(slots);
    },
    (error) => {
      console.error('Error in parking slots subscription:', error);
      callback(generateDemoParkingSlots());
    }
  );
}

// Real-time user bookings subscription
export function subscribeToUserBookings(userId, callback) {
  if (!userId) {
    console.error('subscribeToUserBookings: userId is required');
    return () => {};
  }

  const bookingsQuery = query(
    collection(db, 'parkingBookings'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    bookingsQuery,
    (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      callback(bookings);
    },
    (error) => {
      console.error('Error in bookings subscription:', error);
      callback([]);
    }
  );
}

// Initialize parking slots (run once for setup)
export async function initializeParkingSlots() {
  try {
    const slots = [];
    
    // Create 50 resident slots
    for (let i = 1; i <= 50; i++) {
      slots.push({
        slotNumber: `R-${i.toString().padStart(3, '0')}`,
        type: 'resident',
        level: i <= 25 ? 'Ground' : 'First',
        status: 'available',
        assignedTo: null,
        assignedName: null,
        flatNumber: null,
        createdAt: serverTimestamp()
      });
    }

    // Create 20 visitor slots
    for (let i = 1; i <= 20; i++) {
      slots.push({
        slotNumber: `V-${i.toString().padStart(2, '0')}`,
        type: 'visitor',
        level: 'Ground',
        status: 'available',
        assignedTo: null,
        createdAt: serverTimestamp()
      });
    }

    // Add to Firestore
    for (const slot of slots) {
      await addDoc(collection(db, 'parkingSlots'), slot);
    }

    console.log('Parking slots initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing parking slots:', error);
    throw error;
  }
}

// Get all parking slots
export async function getParkingSlots() {
  try {
    const slotsSnapshot = await getDocs(collection(db, 'parkingSlots'));
    const slots = slotsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return slots.sort((a, b) => a.slotNumber.localeCompare(b.slotNumber));
  } catch (error) {
    console.error('Error fetching parking slots:', error);
    return generateDemoParkingSlots();
  }
}

// Generate demo parking slots for testing
function generateDemoParkingSlots() {
  const slots = [];
  for (let i = 1; i <= 50; i++) {
    slots.push({
      id: `demo-r-${i}`,
      slotNumber: `R-${i.toString().padStart(3, '0')}`,
      type: 'resident',
      level: i <= 25 ? 'Ground' : 'First',
      status: i % 3 === 0 ? 'occupied' : 'available',
      assignedTo: i % 3 === 0 ? 'demo-user' : null
    });
  }

  for (let i = 1; i <= 20; i++) {
    slots.push({
      id: `demo-v-${i}`,
      slotNumber: `V-${i.toString().padStart(2, '0')}`,
      type: 'visitor',
      level: 'Ground',
      status: i % 4 === 0 ? 'occupied' : 'available'
    });
  }

  return slots;
}

// Assign permanent slot to resident
export async function assignParkingSlot(slotId, userId, userName, flatNumber) {
  try {
    const slotRef = doc(db, 'parkingSlots', slotId);
    await updateDoc(slotRef, {
      status: 'occupied',
      assignedTo: userId,
      assignedName: userName,
      flatNumber: flatNumber,
      assignedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error assigning parking slot:', error);
    throw error;
  }
}

// Book visitor parking with real-time validation
export async function bookVisitorParking(bookingData) {
  try {
    // Check if slot is available in real-time
    const slotsQuery = query(
      collection(db, 'parkingSlots'),
      where('type', '==', 'visitor'),
      where('status', '==', 'available')
    );
    const availableSlots = await getDocs(slotsQuery);

    if (availableSlots.empty) {
      throw new Error('No visitor parking slots available');
    }

    // Get first available slot
    const slot = availableSlots.docs[0];

    // Create booking
    const booking = await addDoc(collection(db, 'parkingBookings'), {
      ...bookingData,
      slotId: slot.id,
      slotNumber: slot.data().slotNumber,
      status: 'active',
      createdAt: serverTimestamp()
    });

    // Update slot status immediately
    await updateDoc(doc(db, 'parkingSlots', slot.id), {
      status: 'reserved',
      reservedBy: bookingData.userId,
      reservedUntil: `${bookingData.date} ${bookingData.endTime}`,
      updatedAt: serverTimestamp()
    });

    return { id: booking.id, slotNumber: slot.data().slotNumber };
  } catch (error) {
    console.error('Error booking visitor parking:', error);
    throw error;
  }
}

// Get user's parking bookings
export async function getUserParkingBookings(userId) {
  if (!userId) {
    console.error('getUserParkingBookings: userId is undefined or null');
    return [];
  }

  try {
    const bookingsQuery = query(
      collection(db, 'parkingBookings'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(bookingsQuery);
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return bookings;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
}

// Cancel parking booking
export async function cancelParkingBooking(bookingId) {
  try {
    const bookingRef = doc(db, 'parkingBookings', bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (bookingDoc.exists()) {
      const booking = bookingDoc.data();

      // Free up the slot
      if (booking.slotId) {
        const slotRef = doc(db, 'parkingSlots', booking.slotId);
        await updateDoc(slotRef, {
          status: 'available',
          reservedBy: null,
          reservedUntil: null,
          updatedAt: serverTimestamp()
        });
      }

      // Update booking status
      await updateDoc(bookingRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
    }

    return true;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
}

// Get parking statistics with real-time data
export async function getParkingStats() {
  try {
    const slots = await getParkingSlots();
    const stats = {
      totalSlots: slots.length,
      residentSlots: slots.filter(s => s.type === 'resident').length,
      visitorSlots: slots.filter(s => s.type === 'visitor').length,
      occupied: slots.filter(s => s.status === 'occupied').length,
      available: slots.filter(s => s.status === 'available').length,
      reserved: slots.filter(s => s.status === 'reserved').length
    };

    return stats;
  } catch (error) {
    console.error('Error fetching parking stats:', error);
    return {
      totalSlots: 70,
      residentSlots: 50,
      visitorSlots: 20,
      occupied: 35,
      available: 30,
      reserved: 5
    };
  }
}

// Auto-expire visitor bookings (call this periodically)
export async function autoExpireBookings() {
  try {
    const now = new Date();
    const bookingsQuery = query(
      collection(db, 'parkingBookings'),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(bookingsQuery);
    
    for (const bookingDoc of snapshot.docs) {
      const booking = bookingDoc.data();
      const endDateTime = new Date(`${booking.date} ${booking.endTime}`);
      
      if (endDateTime < now) {
        await cancelParkingBooking(bookingDoc.id);
      }
    }
  } catch (error) {
    console.error('Error auto-expiring bookings:', error);
  }
}
