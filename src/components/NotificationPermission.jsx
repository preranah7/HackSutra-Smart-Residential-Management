// src/components/NotificationPermission.jsx
import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function NotificationPermission({ userId, userRole }) {
  const [permission, setPermission] = useState(Notification.permission);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen for foreground messages
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        
        // Show notification
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-64x64.png',
          tag: payload.data?.type || 'default'
        });
      });

      return () => unsubscribe();
    }
  }, []);

  const requestPermission = async () => {
    if (!messaging) {
      alert('Notifications are not supported in this browser');
      return;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        // Get FCM token using VAPID key from environment variable
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });

        // Save token to Firestore
        await updateDoc(doc(db, 'users', userId), {
          fcmToken: token,
          notificationsEnabled: true,
          lastTokenUpdate: new Date()
        });

        console.log('FCM Token saved successfully');
        alert('Notifications enabled successfully!');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('Failed to enable notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disableNotifications = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        fcmToken: null,
        notificationsEnabled: false
      });
      setPermission('denied');
      alert('Notifications disabled successfully');
    } catch (error) {
      console.error('Error disabling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (permission === 'granted') {
    return (
      <button
        onClick={disableNotifications}
        disabled={loading}
        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
      >
        <Bell size={18} />
        <span>{loading ? 'Disabling...' : 'Notifications Enabled'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={requestPermission}
      disabled={loading}
      className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
    >
      <BellOff size={18} />
      <span>{loading ? 'Enabling...' : 'Enable Notifications'}</span>
    </button>
  );
}