import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Trophy, Users, PlusCircle } from 'lucide-react';

const SportsCellDashboard = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await axios.get('/cells/sports/all');
      setRecords(res.data);
    } catch (error) {
      console.error("Sports record fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Sports Cell Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <div className="text-gray-500 text-sm">Active Teams</div>
          <div className="text-2xl font-bold">8</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-amber-500">
          <div className="text-gray-500 text-sm">Upcoming Events</div>
          <div className="text-2xl font-bold">3</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <div className="text-gray-500 text-sm">Trophies & Awards</div>
          <div className="text-2xl font-bold">42</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Student Sports Records</h2>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <PlusCircle size={18} />
            <span>Add Record</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-500 text-sm uppercase">
                <th className="pb-3 px-2">Student</th>
                <th className="pb-3 px-2">Sport</th>
                <th className="pb-3 px-2">Role</th>
                <th className="pb-3 px-2">Achievements</th>
              </tr>
            </thead>
            <tbody>
               {records.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500 italic">No sports records found.</td></tr>
              ) : (
                records.map(rec => (
                  <tr key={rec._id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-2 font-medium">{rec.student?.name}</td>
                    <td className="py-4 px-2">{rec.sport}</td>
                    <td className="py-4 px-2">{rec.role}</td>
                    <td className="py-4 px-2 text-sm text-gray-600">
                        {rec.achievements?.length || 0} Records
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SportsCellDashboard;
