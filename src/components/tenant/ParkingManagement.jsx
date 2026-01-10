// src/components/tenant/ParkingManagement.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Car, Clock, Calendar, User, Phone, X } from 'lucide-react';
import {
  subscribeToParkingSlots,
  subscribeToUserBookings,
  bookVisitorParking,
  cancelParkingBooking
} from '../../services/parkingService';
import { formatRelativeTime } from '../../utils/realtimeUtils';
import Alert from '../common/Alert';

export default function ParkingManagement() {
  const { currentUser, user, userProfile } = useAuth();
  const activeUser = currentUser || user;
  
  const [activeTab, setActiveTab] = useState('book');
  const [alert, setAlert] = useState(null);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    visitorName: '',
    visitorPhone: '',
    vehicleNumber: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: ''
  });

  useEffect(() => {
    const unsubSlots = subscribeToParkingSlots((slots) => {
      setParkingSlots(slots);
    });

    let unsubBookings = () => {};
    if (activeUser?.uid) {
      unsubBookings = subscribeToUserBookings(activeUser.uid, (bookings) => {
        setMyBookings(bookings);
      });
    }

    return () => {
      unsubSlots();
      unsubBookings();
    };
  }, [activeUser?.uid]);

  const availableVisitorSlots = parkingSlots.filter(
    slot => slot.type === 'visitor' && slot.status === 'available'
  );

  const handleSlotSelect = (slot) => {
    if (!activeUser?.uid) {
      setAlert({
        type: 'error',
        message: 'Please login to book parking slots'
      });
      return;
    }

    if (slot.status === 'available') {
      setSelectedSlot(slot);
      setShowBookingModal(true);
    } else {
      setAlert({
        type: 'error',
        message: 'This slot is not available. Please select a green slot.'
      });
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!activeUser?.uid) {
      setAlert({ type: 'error', message: 'Please login to book parking' });
      return;
    }

    if (!selectedSlot) {
      setAlert({ type: 'error', message: 'Please select an available slot' });
      return;
    }

    try {
      const bookingData = {
        userId: activeUser.uid,
        userName: userProfile?.name || activeUser.email,
        flatNumber: userProfile?.flatNumber || 'N/A',
        slotId: selectedSlot.id,
        slotNumber: selectedSlot.slotNumber,
        visitorName: bookingForm.visitorName,
        visitorPhone: bookingForm.visitorPhone,
        vehicleNumber: bookingForm.vehicleNumber,
        date: bookingForm.date,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        purpose: bookingForm.purpose || ''
      };

      console.log('Submitting booking:', bookingData);
      await bookVisitorParking(bookingData);
      
      setAlert({
        type: 'success',
        message: `Parking slot ${selectedSlot.slotNumber} booked successfully!`
      });
      
      setShowBookingModal(false);
      setSelectedSlot(null);
      setBookingForm({
        visitorName: '',
        visitorPhone: '',
        vehicleNumber: '',
        date: '',
        startTime: '',
        endTime: '',
        purpose: ''
      });
    } catch (error) {
      console.error('Booking error:', error);
      setAlert({
        type: 'error',
        message: error.message || 'Failed to book parking slot'
      });
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await cancelParkingBooking(bookingId);
      setAlert({ type: 'success', message: 'Booking cancelled successfully' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to cancel booking' });
    }
  };

  if (!activeUser?.uid) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading parking information...</p>
          </div>
        </div>
      </div>
    );
  }

  const residentSlots = parkingSlots.filter(s => s.type === 'resident');
  const visitorSlots = parkingSlots.filter(s => s.type === 'visitor');

  return (
    <div className="space-y-6">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Parking Management</h1>
        <p className="text-sm text-gray-600">Manage visitor parking and view availability</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('book')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'book'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Book Visitor Parking
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'bookings'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          My Bookings ({myBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('layout')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'layout'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          View Full Layout
        </button>
      </div>

      {/* Book Visitor Parking Tab */}
      {activeTab === 'book' && (
        <div>
          {/* Legend */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Slot Status Legend</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                <span className="text-gray-700">Available - Click to book</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-gray-700">Occupied - Cannot book</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-500 rounded"></div>
                <span className="text-gray-700">Reserved - Cannot book</span>
              </div>
            </div>
          </div>

          {/* Visitor Parking Slots */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Available Visitor Parking Slots (Click to Book)
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {visitorSlots.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => handleSlotSelect(slot)}
                  disabled={slot.status !== 'available'}
                  className={`p-3 rounded-lg font-semibold text-xs transition-all ${
                    slot.status === 'available'
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-300 hover:scale-105 cursor-pointer shadow-sm'
                      : slot.status === 'reserved'
                      ? 'bg-amber-200 text-amber-700 cursor-not-allowed opacity-60'
                      : 'bg-red-500 text-white cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="text-center">
                    <Car className="w-4 h-4 mx-auto mb-1" />
                    <div>{slot.slotNumber}</div>
                  </div>
                </button>
              ))}
            </div>
            {availableVisitorSlots.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                No visitor parking slots available at the moment.
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Bookings Tab */}
      {activeTab === 'bookings' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Parking Bookings</h2>
          {myBookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Car className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-sm">No bookings yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myBookings.map(booking => (
                <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        Slot {booking.slotNumber}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(booking.createdAt)}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{booking.visitorName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{booking.visitorPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Car className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{booking.vehicleNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{booking.startTime} - {booking.endTime}</span>
                    </div>
                  </div>

                  {booking.status === 'active' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full Layout Tab */}
      {activeTab === 'layout' && (
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Complete Parking Layout</h2>
            
            {/* Resident Slots - Ground Floor */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Resident Parking (Ground Floor)</h3>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {residentSlots.filter(s => s.level === 'Ground').map(slot => (
                  <div
                    key={slot.id}
                    className={`p-2.5 rounded-lg text-center text-xs font-medium ${
                      slot.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                      slot.status === 'reserved' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}
                  >
                    {slot.slotNumber}
                  </div>
                ))}
              </div>
            </div>

            {/* First Floor */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Resident Parking (First Floor)</h3>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {residentSlots.filter(s => s.level === 'First').map(slot => (
                  <div
                    key={slot.id}
                    className={`p-2.5 rounded-lg text-center text-xs font-medium ${
                      slot.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                      slot.status === 'reserved' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}
                  >
                    {slot.slotNumber}
                  </div>
                ))}
              </div>
            </div>

            {/* Visitor Slots */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Visitor Parking</h3>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {visitorSlots.map(slot => (
                  <div
                    key={slot.id}
                    className={`p-2.5 rounded-lg text-center text-xs font-medium ${
                      slot.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                      slot.status === 'reserved' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}
                  >
                    {slot.slotNumber}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-semibold text-gray-900">
                Book Slot {selectedSlot.slotNumber}
              </h3>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedSlot(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Visitor Name *
                </label>
                <input
                  type="text"
                  required
                  value={bookingForm.visitorName}
                  onChange={(e) => setBookingForm({...bookingForm, visitorName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="Enter visitor's name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Visitor Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={bookingForm.visitorPhone}
                  onChange={(e) => setBookingForm({...bookingForm, visitorPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  required
                  value={bookingForm.vehicleNumber}
                  onChange={(e) => setBookingForm({...bookingForm, vehicleNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="MH 12 AB 1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({...bookingForm, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({...bookingForm, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Purpose (Optional)
                </label>
                <textarea
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({...bookingForm, purpose: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="Reason for visit..."
                  rows="2"
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Confirm Booking
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}