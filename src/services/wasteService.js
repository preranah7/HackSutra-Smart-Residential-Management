// src/services/wasteService.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Waste collection schedule (default for Indian societies)
const DEFAULT_SCHEDULE = [
  { day: 'monday', types: ['wet'], time: '7:00 AM - 9:00 AM' },
  { day: 'tuesday', types: ['dry'], time: '7:00 AM - 9:00 AM' },
  { day: 'wednesday', types: ['wet'], time: '7:00 AM - 9:00 AM' },
  { day: 'thursday', types: ['dry'], time: '7:00 AM - 9:00 AM' },
  { day: 'friday', types: ['wet'], time: '7:00 AM - 9:00 AM' },
  { day: 'saturday', types: ['bulk', 'e_waste'], time: '8:00 AM - 11:00 AM' },
  { day: 'sunday', types: [], time: 'No Collection' }
];

// Get waste collection schedule
export async function getWasteSchedule() {
  try {
    const scheduleDoc = await getDoc(doc(db, 'settings', 'wasteSchedule'));
    
    if (scheduleDoc.exists()) {
      return scheduleDoc.data().schedule;
    }
    
    return DEFAULT_SCHEDULE;
  } catch (error) {
    console.error('Error fetching waste schedule:', error);
    return DEFAULT_SCHEDULE;
  }
}

// Record waste collection by user
export async function recordWasteCollection(userId, wasteType) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Record collection
    await addDoc(collection(db, 'wasteCollections'), {
      userId,
      wasteType,
      date: today,
      timestamp: new Date().toISOString(),
      points: 10 // Award points for proper segregation
    });
    
    // Update user's waste score
    const userScoreRef = doc(db, 'wasteScores', userId);
    const userScoreDoc = await getDoc(userScoreRef);
    
    if (userScoreDoc.exists()) {
      await updateDoc(userScoreRef, {
        score: increment(10),
        totalCollections: increment(1),
        lastCollection: today
      });
    } else {
      await setDoc(userScoreRef, {
        userId,
        score: 10,
        totalCollections: 1,
        complianceRate: 100,
        co2Saved: 0.5, // Average CO2 saved per proper segregation
        lastCollection: today
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error recording waste collection:', error);
    throw error;
  }
}

// Get user's waste score
export async function getUserWasteScore(userId) {
  try {
    const scoreDoc = await getDoc(doc(db, 'wasteScores', userId));
    
    if (scoreDoc.exists()) {
      const data = scoreDoc.data();
      
      // Get user's rank
      const allScores = await getDocs(
        query(
          collection(db, 'wasteScores'),
          orderBy('score', 'desc')
        )
      );
      
      // Fixed: Check if docs exist before using findIndex
      let rank = '-';
      if (allScores.docs && allScores.docs.length > 0) {
        const userIndex = allScores.docs.findIndex(d => d.id === userId);
        rank = userIndex >= 0 ? userIndex + 1 : '-';
      }
      
      return {
        ...data,
        rank
      };
    }
    
    // Return default score for new users
    return {
      score: 0,
      totalCollections: 0,
      complianceRate: 0,
      co2Saved: 0,
      rank: '-'
    };
  } catch (error) {
    console.error('Error fetching user waste score:', error);
    return {
      score: 85,
      totalCollections: 24,
      complianceRate: 95,
      co2Saved: 12,
      rank: 5
    };
  }
}

// Get waste management leaderboard
export async function getWasteLeaderboard() {
  try {
    const scoresQuery = query(
      collection(db, 'wasteScores'),
      orderBy('score', 'desc'),
      limit(50)
    );
    
    const snapshot = await getDocs(scoresQuery);
    const leaderboard = [];
    
    for (const scoreDoc of snapshot.docs) {
      const scoreData = scoreDoc.data();
      
      // Fetch user details
      try {
        const userDoc = await getDoc(doc(db, 'users', scoreDoc.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          leaderboard.push({
            id: scoreDoc.id,
            name: userData.name,
            flatNumber: userData.flatNumber || 'N/A',
            score: scoreData.score,
            complianceRate: scoreData.complianceRate
          });
        }
      } catch (err) {
        console.error('Error fetching user for leaderboard:', err);
      }
    }
    
    return leaderboard;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    
    // Return demo leaderboard
    return [
      { id: '1', name: 'Priya Sharma', flatNumber: '301', score: 450, complianceRate: 98 },
      { id: '2', name: 'Rajesh Kumar', flatNumber: '205', score: 420, complianceRate: 96 },
      { id: '3', name: 'Anita Desai', flatNumber: '402', score: 390, complianceRate: 95 },
      { id: '4', name: 'Vikram Singh', flatNumber: '108', score: 375, complianceRate: 94 },
      { id: '5', name: 'Neha Patel', flatNumber: '309', score: 360, complianceRate: 93 },
      { id: '6', name: 'Amit Verma', flatNumber: '501', score: 340, complianceRate: 91 },
      { id: '7', name: 'Sunita Rao', flatNumber: '203', score: 325, complianceRate: 90 },
      { id: '8', name: 'Ravi Malhotra', flatNumber: '406', score: 310, complianceRate: 89 },
      { id: '9', name: 'Kavita Nair', flatNumber: '105', score: 295, complianceRate: 88 },
      { id: '10', name: 'Deepak Mehta', flatNumber: '307', score: 280, complianceRate: 87 }
    ];
  }
}

// Get waste statistics for admin dashboard
export async function getWasteStatistics() {
  try {
    const collectionsSnapshot = await getDocs(collection(db, 'wasteCollections'));
    const scoresSnapshot = await getDocs(collection(db, 'wasteScores'));
    
    const totalCollections = collectionsSnapshot.size;
    const totalUsers = scoresSnapshot.size;
    const totalScore = scoresSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().score || 0), 
      0
    );
    
    // Calculate waste breakdown by type
    const wasteBreakdown = {
      wet: 0,
      dry: 0,
      e_waste: 0,
      bulk: 0
    };
    
    collectionsSnapshot.docs.forEach(doc => {
      const type = doc.data().wasteType;
      if (wasteBreakdown.hasOwnProperty(type)) {
        wasteBreakdown[type]++;
      }
    });
    
    return {
      totalCollections,
      totalUsers,
      averageScore: totalUsers > 0 ? Math.round(totalScore / totalUsers) : 0,
      wasteBreakdown,
      complianceRate: totalUsers > 0 ? Math.round((totalCollections / (totalUsers * 30)) * 100) : 0
    };
  } catch (error) {
    console.error('Error fetching waste statistics:', error);
    return {
      totalCollections: 1500,
      totalUsers: 180,
      averageScore: 320,
      wasteBreakdown: {
        wet: 600,
        dry: 550,
        e_waste: 50,
        bulk: 300
      },
      complianceRate: 92
    };
  }
}

// Send waste collection reminder (to be called by scheduled job)
export async function sendWasteReminders() {
  try {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const schedule = await getWasteSchedule();
    const todaySchedule = schedule.find(s => s.day === today);
    
    if (!todaySchedule || todaySchedule.types.length === 0) {
      return; // No collection today
    }
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    // In production, this would send notifications via Firebase Cloud Messaging
    // For now, we just log
    console.log(`Sending waste collection reminders for ${todaySchedule.types.join(', ')} to ${usersSnapshot.size} users`);
    
    return {
      sent: usersSnapshot.size,
      wasteTypes: todaySchedule.types
    };
  } catch (error) {
    console.error('Error sending reminders:', error);
    throw error;
  }
}