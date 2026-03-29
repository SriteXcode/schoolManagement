import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Shield, AlertTriangle, CheckCircle, PlusCircle } from 'lucide-react';

const DisciplineCellDashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await axios.get('/cells/discipline/all');
      setIncidents(res.data);
    } catch (error) {
      console.error("Incident fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Discipline Cell Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
          <div className="text-gray-500 text-sm">Critical Incidents</div>
          <div className="text-2xl font-bold">2</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
          <div className="text-gray-500 text-sm">Open Cases</div>
          <div className="text-2xl font-bold">5</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <div className="text-gray-500 text-sm">Resolved Cases</div>
          <div className="text-2xl font-bold">28</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <div className="text-gray-500 text-sm">Good Conduct Tags</div>
          <div className="text-2xl font-bold">120</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Recent Incidents</h2>
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <PlusCircle size={18} />
            <span>Report Incident</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-500 text-sm uppercase">
                <th className="pb-3 px-2">Student</th>
                <th className="pb-3 px-2">Incident Type</th>
                <th className="pb-3 px-2">Severity</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500 italic">No incidents reported yet.</td></tr>
              ) : (
                incidents.map(inc => (
                  <tr key={inc._id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-2 font-medium">{inc.student?.name}</td>
                    <td className="py-4 px-2">{inc.incidentType}</td>
                    <td className="py-4 px-2">
                       <span className={`px-2 py-1 rounded text-xs ${inc.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
                        {inc.severity}
                       </span>
                    </td>
                    <td className="py-4 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${inc.status === 'Open' ? 'bg-orange-100 text-orange-700' : 'bg-green-100'}`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right text-gray-500">{new Date(inc.date).toLocaleDateString()}</td>
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

export default DisciplineCellDashboard;
