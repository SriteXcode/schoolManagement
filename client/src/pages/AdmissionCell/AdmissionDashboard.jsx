import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';

const AdmissionDashboard = () => {
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

      const totalFees = feesRes.data.reduce((acc, curr) => acc + curr.paidAmount, 0);
      const pendingFees = feesRes.data.reduce((acc, curr) => acc + curr.dueAmount, 0);

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
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Admission Cell Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
            <Users size={24} />
          </div>
          <div>
            <div className="text-gray-500 text-sm">Total Students</div>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-xl text-green-600">
            <CreditCard size={24} />
          </div>
          <div>
            <div className="text-gray-500 text-sm">Fees Collected</div>
            <div className="text-2xl font-bold">₹{stats.totalFeesCollected}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="bg-red-100 p-3 rounded-xl text-red-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="text-gray-500 text-sm">Pending Dues</div>
            <div className="text-2xl font-bold">₹{stats.pendingFees}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-gray-500 text-sm">Active Sessions</div>
            <div className="text-2xl font-bold">2025-26</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6">Recent Admissions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b">
                  <th className="pb-4">Student Name</th>
                  <th className="pb-4">Roll Number</th>
                  <th className="pb-4">Class</th>
                  <th className="pb-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.recentAdmissions.map((student) => (
                  <tr key={student._id}>
                    <td className="py-4 font-medium">{student.name}</td>
                    <td className="py-4 text-gray-600">{student.rollNum}</td>
                    <td className="py-4 text-gray-600">{student.sClass?.grade}-{student.sClass?.section}</td>
                    <td className="py-4 text-gray-600 text-right">{new Date(student.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
            <div className="space-y-4">
                <button className="w-full bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors">
                    Register New Student
                </button>
                <button className="w-full bg-white border border-gray-200 text-gray-700 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    Generate Fee Reports
                </button>
                <button className="w-full bg-white border border-gray-200 text-gray-700 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    Bulk Fee Update
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionDashboard;
