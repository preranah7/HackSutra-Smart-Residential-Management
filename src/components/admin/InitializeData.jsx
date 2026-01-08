// src/components/admin/InitializeData.jsx
import { useState } from 'react';
import { db } from '../../firebase/config';
import { doc, setDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

function InitializeData() {
  const [status, setStatus] = useState({
    wasteSchedule: 'pending',
    parkingSlots: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  const addMessage = (message, type = 'info') => {
    setMessages(prev => [...prev, { text: message, type, time: new Date().toLocaleTimeString() }]);
  };

  async function initializeWasteSchedule() {
    try {
      addMessage('Initializing waste schedule...', 'info');
      
      await setDoc(doc(db, 'settings', 'wasteSchedule'), {
        schedule: [
          { day: 'monday', types: ['wet'], time: '7:00 AM - 9:00 AM' },
          { day: 'tuesday', types: ['dry'], time: '7:00 AM - 9:00 AM' },
          { day: 'wednesday', types: ['wet'], time: '7:00 AM - 9:00 AM' },
          { day: 'thursday', types: ['dry'], time: '7:00 AM - 9:00 AM' },
          { day: 'friday', types: ['wet'], time: '7:00 AM - 9:00 AM' },
          { day: 'saturday', types: ['bulk', 'e_waste'], time: '8:00 AM - 11:00 AM' },
          { day: 'sunday', types: [], time: 'No Collection' }
        ],
        updatedAt: new Date().toISOString()
      });

      setStatus(prev => ({ ...prev, wasteSchedule: 'success' }));
      addMessage('✓ Waste schedule initialized successfully!', 'success');
      return true;
    } catch (error) {
      console.error('Error initializing waste schedule:', error);
      setStatus(prev => ({ ...prev, wasteSchedule: 'error' }));
      addMessage(`✗ Error initializing waste schedule: ${error.message}`, 'error');
      return false;
    }
  }

  async function initializeParkingSlots() {
    try {
      addMessage('Checking existing parking slots...', 'info');
      
      // Check if slots already exist
      const existingSlots = await getDocs(collection(db, 'parkingSlots'));
      if (!existingSlots.empty) {
        addMessage(`Found ${existingSlots.size} existing parking slots. Skipping initialization.`, 'warning');
        setStatus(prev => ({ ...prev, parkingSlots: 'success' }));
        return true;
      }

      addMessage('Creating parking slots...', 'info');
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
          createdAt: new Date().toISOString()
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
          createdAt: new Date().toISOString()
        });
      }

      // Add to Firestore in batches
      let count = 0;
      for (const slot of slots) {
        await addDoc(collection(db, 'parkingSlots'), slot);
        count++;
        if (count % 10 === 0) {
          addMessage(`Created ${count}/${slots.length} parking slots...`, 'info');
        }
      }

      setStatus(prev => ({ ...prev, parkingSlots: 'success' }));
      addMessage(`✓ Successfully created ${slots.length} parking slots!`, 'success');
      return true;
    } catch (error) {
      console.error('Error initializing parking slots:', error);
      setStatus(prev => ({ ...prev, parkingSlots: 'error' }));
      addMessage(`✗ Error initializing parking slots: ${error.message}`, 'error');
      return false;
    }
  }

  async function initializeAll() {
    setLoading(true);
    setMessages([]);
    setStatus({ wasteSchedule: 'pending', parkingSlots: 'pending' });

    addMessage('Starting initialization process...', 'info');

    await initializeWasteSchedule();
    await initializeParkingSlots();

    setLoading(false);
    addMessage('Initialization process completed!', 'success');
  }

  const getStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'error') return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (status === 'pending') return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
    return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Initialize Database</h2>
        <p className="text-gray-600 mb-6">
          Run this once to set up initial data for your society management system.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">Important</p>
              <p className="text-sm text-yellow-700 mt-1">
                This will create waste schedule and parking slots in your Firestore database. 
                Run this only once after setting up your Firebase project.
              </p>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">Waste Schedule</span>
              {getStatusIcon(status.wasteSchedule)}
            </div>
            <p className="text-sm text-gray-500">
              Weekly waste collection schedule for the society
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">Parking Slots</span>
              {getStatusIcon(status.parkingSlots)}
            </div>
            <p className="text-sm text-gray-500">
              50 resident + 20 visitor parking slots
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={initializeAll}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Initializing...</span>
            </>
          ) : (
            <span>Initialize Database</span>
          )}
        </button>

        {/* Messages Log */}
        {messages.length > 0 && (
          <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-3">Activity Log</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`text-sm p-2 rounded ${
                    msg.type === 'success' ? 'bg-green-50 text-green-800' :
                    msg.type === 'error' ? 'bg-red-50 text-red-800' :
                    msg.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                    'bg-blue-50 text-blue-800'
                  }`}
                >
                  <span className="text-xs text-gray-500">{msg.time}</span> - {msg.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InitializeData;
