import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';

const ManageSalaries = () => {
  const [teachers, setTeachers] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [salaryData, setSalaryData] = useState({
    month: 'March',
    year: 2026,
    baseSalary: 0,
    bonuses: [],
    deductions: [],
    paymentMethod: 'Bank Transfer',
    status: 'Pending'
  });

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, salariesRes] = await Promise.all([
        axios.get('/teacher/getall'),
        axios.get('/salary/all')
      ]);
      setTeachers(teachersRes.data);
      setSalaries(salariesRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (teacher) => {
    setSelectedTeacher(teacher);
    setSalaryData({
      ...salaryData,
      baseSalary: teacher.baseSalary || 30000 // default or fetch from profile if exists
    });
    setShowModal(true);
  };

  const handleSaveSalary = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/salary/record', {
        ...salaryData,
        teacherId: selectedTeacher._id
      });
      toast.success("Salary record saved");
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save salary");
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await axios.post(`/salary/pay/${id}`, { paymentMethod: 'Bank Transfer' });
      toast.success("Salary marked as paid");
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Staff Salary Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Teacher List */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Staff Members</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-500 text-sm uppercase">
                  <th className="pb-3 px-2">Name</th>
                  <th className="pb-3 px-2">Role</th>
                  <th className="pb-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(teacher => (
                  <tr key={teacher._id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-2 font-medium">{teacher.name}</td>
                    <td className="py-4 px-2 text-gray-600">Teacher</td>
                    <td className="py-4 px-2 text-right">
                      <button 
                        onClick={() => handleOpenModal(teacher)}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                      >
                        Add/Edit Salary
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Payment Status</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-500 text-sm uppercase">
                  <th className="pb-3 px-2">Staff</th>
                  <th className="pb-3 px-2">Month</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map(sal => (
                  <tr key={sal._id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-2 font-medium">{sal.teacher?.name}</td>
                    <td className="py-4 px-2 text-gray-600">{sal.month} {sal.year}</td>
                    <td className="py-4 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${sal.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {sal.status}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right">
                      {sal.status === 'Pending' && (
                        <button 
                          onClick={() => handleMarkAsPaid(sal._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Salary Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Set Salary for {selectedTeacher.name}</h3>
            <form onSubmit={handleSaveSalary} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Month</label>
                  <select 
                    value={salaryData.month}
                    onChange={(e) => setSalaryData({...salaryData, month: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year</label>
                  <input 
                    type="number" 
                    value={salaryData.year}
                    onChange={(e) => setSalaryData({...salaryData, year: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Base Salary</label>
                <input 
                  type="number" 
                  value={salaryData.baseSalary}
                  onChange={(e) => setSalaryData({...salaryData, baseSalary: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSalaries;
