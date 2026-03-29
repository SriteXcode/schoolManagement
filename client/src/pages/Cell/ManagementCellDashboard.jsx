import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import { LayoutDashboard, Users, CreditCard, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const ManagementCellDashboard = () => {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    totalFees: 0,
    totalSalaries: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [teachers, students, fees, salaries] = await Promise.all([
        axios.get('/teacher/getall'),
        axios.get('/student/getall'),
        axios.get('/fee/all'),
        axios.get('/salary/all')
      ]);

      const totalFees = fees.data.reduce((acc, curr) => acc + curr.paidAmount, 0);
      const totalSalaries = salaries.data.filter(s => s.status === 'Paid').reduce((acc, curr) => acc + curr.totalAmount, 0);

      setStats({
        totalTeachers: teachers.data.length,
        totalStudents: students.data.length,
        totalFees,
        totalSalaries
      });
    } catch (error) {
      console.error("Management stats error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Management Cell Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500">
          <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">Total Staff</div>
          <div className="text-3xl font-black text-gray-900 mt-1">{stats.totalTeachers}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-indigo-500">
          <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">Total Students</div>
          <div className="text-3xl font-black text-gray-900 mt-1">{stats.totalStudents}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
          <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">Revenue (Fees)</div>
          <div className="text-3xl font-black text-green-600 mt-1">₹{stats.totalFees}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-red-500">
          <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">Expenses (Salaries)</div>
          <div className="text-3xl font-black text-red-600 mt-1">₹{stats.totalSalaries}</div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-6">Management Operations</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link to="/admin/salaries" className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 group text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                  <CreditCard size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Payroll Management</h3>
              <p className="text-gray-500 text-sm mt-2">Manage staff salaries, bonuses and payment status.</p>
          </Link>

          <Link to="/admin/notices" className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 group text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                  <FileText size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Circulars & Notices</h3>
              <p className="text-gray-500 text-sm mt-2">Issue official notices to students, parents and staff.</p>
          </Link>

          <Link to="/admission/fees" className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 group text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                  <Users size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Fee Oversight</h3>
              <p className="text-gray-500 text-sm mt-2">Review fee collection and pending dues across school.</p>
          </Link>
      </div>
    </div>
  );
};

export default ManagementCellDashboard;
