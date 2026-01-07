// src/components/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Users, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBills: 0,
    totalComplaints: 0,
    resolvedComplaints: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const billsSnap = await getDocs(collection(db, 'bills'));
      const complaintsSnap = await getDocs(collection(db, 'complaints'));
      
      const resolved = complaintsSnap.docs.filter(
        doc => doc.data().status === 'resolved'
      ).length;

      setStats({
        totalUsers: usersSnap.size,
        totalBills: billsSnap.size,
        totalComplaints: complaintsSnap.size,
        resolvedComplaints: resolved
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Society Management Overview</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            title="Total Users"
            value={stats.totalUsers}
            color="blue"
          />
          <StatCard
            icon={FileText}
            title="Bills Generated"
            value={stats.totalBills}
            color="green"
          />
          <StatCard
            icon={AlertCircle}
            title="Total Complaints"
            value={stats.totalComplaints}
            color="orange"
          />
          <StatCard
            icon={CheckCircle}
            title="Resolved"
            value={stats.resolvedComplaints}
            color="purple"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className={`inline-flex p-3 rounded-lg ${colors[color]} mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-gray-600 text-sm">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}

export default AdminDashboard;