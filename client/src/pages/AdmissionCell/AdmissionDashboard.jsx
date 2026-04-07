import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  User
} from 'lucide-react';

const AdmissionDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFeesCollected: 0,
    pendingFees: 0,
    recentAdmissions: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [studentsRes, feesRes] = await Promise.all([
        axios.get('/student/getall'),
        axios.get('/fee/all')
      ]);

      // Calculate totals from session start to now using the updated schema fields
      const totalFees = feesRes.data.reduce((acc, curr) => acc + (Number(curr.totalPaid) || 0), 0);
      const pendingFees = feesRes.data.reduce((acc, curr) => acc + (Number(curr.totalDue) || 0), 0);

      setStats({
        totalStudents: studentsRes.data.length,
        totalFeesCollected: totalFees,
        pendingFees: pendingFees,
        recentAdmissions: studentsRes.data.slice(-5).reverse()
      });
    } catch (error) {
      console.error("Dashboard error", error);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">Admission Cell Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center space-x-4 border border-gray-100">
          <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
            <Users size={24} />
          </div>
          <div>
            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total Students</div>
            <div className="text-2xl font-black text-gray-900">{stats.totalStudents}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center space-x-4 border border-gray-100">
          <div className="bg-green-100 p-3 rounded-xl text-green-600">
            <CreditCard size={24} />
          </div>
          <div>
            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">Fees Collected</div>
            <div className="text-2xl font-black text-green-600">₹{stats.totalFeesCollected}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center space-x-4 border border-gray-100">
          <div className="bg-red-100 p-3 rounded-xl text-red-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">Current Dues</div>
            <div className="text-2xl font-black text-red-600">₹{stats.pendingFees}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center space-x-4 border border-gray-100">
          <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">Active Session</div>
            <div className="text-2xl font-black text-gray-900">2025-26</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Recent Admissions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                  <th className="pb-4">Student Name</th>
                  <th className="pb-4">Roll Number</th>
                  <th className="pb-4">Class</th>
                  <th className="pb-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentAdmissions.map((student, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 font-bold text-gray-700">{student.name}</td>
                    <td className="py-4 text-gray-500 font-medium">{student.rollNum}</td>
                    <td className="py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black">
                            {student.sClass?.grade}-{student.sClass?.section}
                        </span>
                    </td>
                    <td className="py-4 text-right text-gray-400 text-xs font-bold">
                        {new Date().toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.recentAdmissions.length === 0 && (
                <div className="py-10 text-center text-gray-400 font-bold italic">No recent admissions found.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Quick Actions</h2>
            <div className="space-y-4">
                <button 
                    onClick={() => navigate('/admission/register')}
                    className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-xs flex items-center justify-center gap-2"
                >
                    <Users size={18} /> Register New Student
                </button>
                <button 
                    onClick={() => navigate('/admission/fees')}
                    className="w-full bg-green-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100 text-xs flex items-center justify-center gap-2"
                >
                    <CreditCard size={18} /> Manage Fees
                </button>
                <button 
                    onClick={() => navigate('/admission/profile')}
                    className="w-full bg-white border border-gray-200 text-gray-700 p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-50 transition-all text-xs flex items-center justify-center gap-2"
                >
                    <User size={18} /> View Profile
                </button>
            </div>

            <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Session Note</h4>
                <p className="text-xs text-indigo-700 font-bold leading-relaxed">
                    Financial records are calculated from April 2025 up to {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionDashboard;
