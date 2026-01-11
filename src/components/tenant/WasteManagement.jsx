// src/components/tenant/WasteManagement.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Trash2, 
  Calendar, 
  CheckCircle, 
  TrendingUp,
  Award,
  Leaf,
  Recycle,
  Info
} from 'lucide-react';
import { 
  getWasteSchedule, 
  recordWasteCollection,
  getUserWasteScore,
  getWasteLeaderboard
} from '../../services/wasteService';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';

function WasteManagement() {
  const { userProfile } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [userScore, setUserScore] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [todayCollection, setTodayCollection] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.uid) {
      loadWasteData();
    }
  }, [userProfile]);

  async function loadWasteData() {
    try {
      setLoading(true);
      const [scheduleData, scoreData, leaderboardData] = await Promise.all([
        getWasteSchedule(),
        getUserWasteScore(userProfile.uid),
        getWasteLeaderboard()
      ]);
      
      setSchedule(scheduleData);
      setUserScore(scoreData);
      setLeaderboard(leaderboardData);
      
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const todaySchedule = scheduleData.find(s => s.day === today);
      setTodayCollection(todaySchedule);
    } catch (error) {
      console.error('Error loading waste data:', error);
      setSchedule([
        { day: 'monday', types: ['wet'], time: '7:00 AM - 9:00 AM' },
        { day: 'tuesday', types: ['dry'], time: '7:00 AM - 9:00 AM' },
        { day: 'wednesday', types: ['wet'], time: '7:00 AM - 9:00 AM' },
        { day: 'thursday', types: ['dry'], time: '7:00 AM - 9:00 AM' },
        { day: 'friday', types: ['wet'], time: '7:00 AM - 9:00 AM' },
        { day: 'saturday', types: ['bulk', 'e_waste'], time: '8:00 AM - 11:00 AM' },
        { day: 'sunday', types: [], time: 'No Collection' }
      ]);
      setUserScore({ score: 0, rank: '-', complianceRate: 0, co2Saved: 0 });
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }

  function showAlert(type, message) {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  }

  async function handleConfirmCollection(wasteType) {
    try {
      await recordWasteCollection(userProfile.uid, wasteType);
      showAlert('success', 'Waste collection recorded! +10 points 🌟');
      loadWasteData();
    } catch (error) {
      showAlert('error', 'Failed to record collection');
    }
  }

  const wasteTypes = [
    { 
      type: 'wet', 
      label: 'Wet Waste', 
      icon: '🍎',
      description: 'Food scraps, vegetable peels, expired food',
      tips: 'Keep in closed container, dispose daily'
    },
    { 
      type: 'dry', 
      label: 'Dry Waste', 
      icon: '📄',
      description: 'Paper, plastic, metal, glass',
      tips: 'Clean and dry before disposal'
    },
    { 
      type: 'e_waste', 
      label: 'E-Waste', 
      icon: '📱',
      description: 'Old electronics, batteries, bulbs',
      tips: 'Collect and dispose monthly'
    },
    { 
      type: 'bulk', 
      label: 'Bulk Waste', 
      icon: '🪑',
      description: 'Furniture, large items',
      tips: 'Schedule pickup in advance'
    }
  ];

  if (loading) {
    return <LoadingSpinner text="Loading waste management..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">Waste Management</h1>
        <p className="text-xs sm:text-sm text-gray-600">Smart waste segregation for a cleaner society</p>
      </div>

      {alert.show && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert({ show: false, type: '', message: '' })} 
        />
      )}

      {/* Today's Collection Banner */}
      {todayCollection && todayCollection.types && todayCollection.types.length > 0 && (
        <div className="bg-green-500 rounded-lg shadow-sm border border-green-600 p-4 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium text-emerald-100">Today's Collection</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-semibold mb-1">
                {todayCollection.types.map(t => 
                  wasteTypes.find(wt => wt.type === t)?.icon
                ).join(' ')} {todayCollection.types.map(t => 
                  wasteTypes.find(wt => wt.type === t)?.label
                ).join(' & ')}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100">Collection Time: {todayCollection.time}</p>
            </div>
            <div className="bg-emerald-700 p-2.5 sm:p-3 rounded-lg self-center">
              <Trash2 className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
          </div>
          <button
            onClick={() => handleConfirmCollection(todayCollection.types[0])}
            className="mt-4 bg-white text-emerald-700 px-4 sm:px-5 py-2 rounded-lg font-medium text-xs sm:text-sm hover:bg-emerald-50 transition-colors w-full sm:w-auto"
          >
            ✓ I've Put Out My Waste
          </button>
        </div>
      )}

      {/* User Score Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">Your Eco Score</p>
              <p className="text-2xl sm:text-3xl font-semibold text-purple-600">
                {userScore?.score || 0}
              </p>
            </div>
            <div className="bg-purple-50 p-2 sm:p-2.5 rounded-lg">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center text-xs text-purple-600">
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            <span>Rank #{userScore?.rank || '-'} in society</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Compliance Rate</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {userScore?.complianceRate || 95}%
              </p>
            </div>
            <div className="bg-emerald-50 p-2 sm:p-2.5 rounded-lg">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">CO₂ Saved</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {userScore?.co2Saved || 12}kg
              </p>
            </div>
            <div className="bg-blue-50 p-2 sm:p-2.5 rounded-lg">
              <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Weekly Collection Schedule</h3>
        <div className="space-y-2">
          {schedule.map((day, index) => {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const isToday = day.day === today;
            return (
              <div 
                key={index}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg transition-all gap-2 sm:gap-0 ${
                  isToday 
                    ? 'bg-emerald-50 border border-emerald-200' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isToday ? 'bg-emerald-100' : 'bg-white border border-gray-200'
                  }`}>
                    <Calendar className={`w-4 h-4 sm:w-5 sm:h-5 ${isToday ? 'text-emerald-600' : 'text-gray-600'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium text-xs sm:text-sm ${isToday ? 'text-emerald-700' : 'text-gray-900'}`}>
                      {day.day.charAt(0).toUpperCase() + day.day.slice(1)}
                      {isToday && <span className="ml-2 text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">Today</span>}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {day.types && day.types.length > 0 ? day.types.map(t => wasteTypes.find(wt => wt.type === t)?.label).join(', ') : 'No Collection'}
                    </p>
                  </div>
                </div>
                <div className="sm:text-right ml-11 sm:ml-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{day.time}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    {day.types && day.types.map(t => (
                      <span key={t} className="text-base sm:text-lg">
                        {wasteTypes.find(wt => wt.type === t)?.icon}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Waste Segregation Guide */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 flex items-center">
          <Info className="w-4 h-4 mr-2 text-blue-600" />
          Waste Segregation Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {wasteTypes.map((waste) => (
            <div key={waste.type} className="p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-start space-x-3">
                <div className="text-xl sm:text-2xl flex-shrink-0">{waste.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-xs sm:text-sm mb-1">{waste.label}</h4>
                  <p className="text-xs text-gray-600 mb-1.5 break-words">{waste.description}</p>
                  <p className="text-xs text-gray-500 italic break-words">💡 {waste.tips}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="w-4 h-4 mr-2 text-amber-600" />
          Eco Warriors Leaderboard
        </h3>
        {leaderboard.length > 0 ? (
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((user, index) => (
              <div 
                key={user.id}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg ${
                  user.id === userProfile.uid 
                    ? 'bg-purple-50 border border-purple-200' 
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-semibold text-xs text-white flex-shrink-0 ${
                    index === 0 ? 'bg-amber-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-600' :
                    'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                      {user.name}
                      {user.id === userProfile.uid && 
                        <span className="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">You</span>
                      }
                    </p>
                    <p className="text-xs text-gray-600">Flat {user.flatNumber}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base sm:text-lg font-semibold text-gray-900">{user.score}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Award className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 text-xs sm:text-sm">No leaderboard data yet</p>
          </div>
        )}
      </div>

      {/* Environmental Impact */}
      <div className="bg-white rounded-lg shadow-sm border border-emerald-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="bg-emerald-50 p-2 sm:p-2.5 rounded-lg self-start">
            <Recycle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
          </div>
          <div className="flex-1 w-full">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">
              Our Society's Impact This Month
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div>
                <p className="text-lg sm:text-xl font-semibold text-emerald-700">2.4T</p>
                <p className="text-xs text-gray-600">Waste Segregated</p>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-semibold text-blue-700">450kg</p>
                <p className="text-xs text-gray-600">Recycled</p>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-semibold text-purple-700">1.2T</p>
                <p className="text-xs text-gray-600">CO₂ Reduced</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WasteManagement;