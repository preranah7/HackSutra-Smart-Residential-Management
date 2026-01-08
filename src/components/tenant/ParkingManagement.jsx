// src/components/tenant/ParkingManagement.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Car, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  MapPin,
  Plus,
  Trash2
} from 'lucide-react';
import { 
  getParkingSlots, 
  bookVisitorParking, 
  getUserParkingBookings,
  cancelParkingBooking 
} from '../../services/parkingService';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';

function ParkingManagement() {
  const { userProfile } = useAuth();
  const [parkingSlots, setParkingSlots] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    visitorName: '',
    vehicleNumber: '',
    date: '',
    startTime: '',
    endTime: ''
  });
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    if (userProfile?.uid) {
      loadParkingData();
    }
  }, [userProfile]);

  async function loadParkingData() {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [slots, bookings] = await Promise.all([
        getParkingSlots(),
        getUserParkingBookings(userProfile.uid)
      ]);
      setParkingSlots(slots);
      setUserBookings(bookings);
    } catch (error) {
      console.error('Error loading parking data:', error);
      showAlert('error', 'Failed to load parking data');
    } finally {
      setLoading(false);
    }
  }

  function showAlert(type, message) {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  }

  async function handleBooking(e) {
    e.preventDefault();
    
    if (!bookingData.visitorName || !bookingData.vehicleNumber || !bookingData.date) {
      showAlert('error', 'Please fill all required fields');
      return;
    }

    try {
      await bookVisitorParking({
        ...bookingData,
        userId: userProfile.uid,
        userName: userProfile.name,
        flatNumber: userProfile.flatNumber
      });
      
      showAlert('success', 'Visitor parking booked successfully!');
      setShowBookingForm(false);
      setBookingData({
        visitorName: '',
        vehicleNumber: '',
        date: '',
        startTime: '',
        endTime: ''
      });
      loadParkingData();
    } catch (error) {
      showAlert('error', error.message || 'Failed to book parking');
    }
  }

  async function handleCancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await cancelParkingBooking(bookingId);
      showAlert('success', 'Booking cancelled successfully');
      loadParkingData();
    } catch (error) {
      showAlert('error', 'Failed to cancel booking');
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading parking information..." />;
  }

  const myPermanentSlot = parkingSlots.find(
    slot => slot.type === 'resident' && slot.assignedTo === userProfile.uid
  );

  const availableVisitorSlots = parkingSlots.filter(
    slot => slot.type === 'visitor' && slot.status === 'available'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Parking Management</h1>
        <p className="text-gray-600">Manage your parking slots and visitor bookings</p>
      </div>

      {alert.show && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert({ show: false, type: '', message: '' })} 
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Your Permanent Slot</p>
              <p className="text-2xl font-bold text-gray-900">
                {myPermanentSlot ? myPermanentSlot.slotNumber : 'Not Assigned'}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Available Visitor Slots</p>
              <p className="text-2xl font-bold text-gray-900">{availableVisitorSlots}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Your Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{userBookings.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* My Permanent Slot */}
      {myPermanentSlot && (
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your Permanent Parking Slot
              </h3>
              <div className="space-y-2">
                <div className="flex items-center text-gray-700">
                  <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Slot Number: <strong>{myPermanentSlot.slotNumber}</strong></span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Car className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Level: <strong>{myPermanentSlot.level || 'Ground'}</strong></span>
                </div>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Book Visitor Parking */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Visitor Parking</h3>
          <button
            onClick={() => setShowBookingForm(!showBookingForm)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Book Visitor Slot</span>
          </button>
        </div>

        {showBookingForm && (
          <form onSubmit={handleBooking} className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visitor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bookingData.visitorName}
                  onChange={(e) => setBookingData({...bookingData, visitorName: e.target.value})}
                  className="input-field"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bookingData.vehicleNumber}
                  onChange={(e) => setBookingData({...bookingData, vehicleNumber: e.target.value.toUpperCase()})}
                  className="input-field"
                  placeholder="MH12AB1234"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Slot
                </label>
                <select
                  value={bookingData.startTime}
                  onChange={(e) => {
                    const start = e.target.value;
                    const [hours] = start.split(':');
                    const endHours = (parseInt(hours) + 2).toString().padStart(2, '0');
                    setBookingData({
                      ...bookingData, 
                      startTime: start,
                      endTime: `${endHours}:00`
                    });
                  }}
                  className="input-field"
                >
                  <option value="">Select time slot</option>
                  <option value="08:00">8:00 AM - 10:00 AM</option>
                  <option value="10:00">10:00 AM - 12:00 PM</option>
                  <option value="12:00">12:00 PM - 2:00 PM</option>
                  <option value="14:00">2:00 PM - 4:00 PM</option>
                  <option value="16:00">4:00 PM - 6:00 PM</option>
                  <option value="18:00">6:00 PM - 8:00 PM</option>
                  <option value="20:00">8:00 PM - 10:00 PM</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowBookingForm(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
              >
                Confirm Booking
              </button>
            </div>
          </form>
        )}
      </div>

      {/* My Bookings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Visitor Bookings</h3>
        
        {userBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">No visitor parking bookings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${
                    booking.status === 'active' ? 'bg-green-100' : 
                    booking.status === 'completed' ? 'bg-gray-100' : 'bg-red-100'
                  }`}>
                    {booking.status === 'active' ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : booking.status === 'completed' ? (
                      <Clock className="w-6 h-6 text-gray-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{booking.visitorName}</p>
                    <p className="text-sm text-gray-600">{booking.vehicleNumber}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>{new Date(booking.date).toLocaleDateString()}</span>
                      <span>{booking.startTime} - {booking.endTime}</span>
                      {booking.slotNumber && <span>Slot: {booking.slotNumber}</span>}
                    </div>
                  </div>
                </div>
                
                {booking.status === 'active' && (
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    className="btn btn-secondary flex items-center space-x-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                )}
                
                {booking.status === 'completed' && (
                  <span className="badge badge-info">Completed</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parking Grid Visualization */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Parking Layout</h3>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {parkingSlots.slice(0, 50).map((slot) => (
            <div
              key={slot.id}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-all cursor-pointer ${
                slot.status === 'occupied' 
                  ? 'bg-red-100 text-red-700' 
                  : slot.status === 'reserved'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
              } ${slot.assignedTo === userProfile.uid ? 'ring-2 ring-blue-500' : ''}`}
              title={`${slot.slotNumber} - ${slot.status}`}
            >
              {slot.slotNumber}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 rounded mr-2"></div>
            <span className="text-gray-600">Reserved</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
            <span className="text-gray-600">Occupied</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParkingManagement;