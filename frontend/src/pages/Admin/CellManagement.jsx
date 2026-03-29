import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Trophy, FileText, UserCheck, ExternalLink } from 'lucide-react';

const CellManagement = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const cells = [
    { id: "None", label: "None (Regular Teacher)", icon: Users, color: "gray", path: null },
    { id: "AdmissionCell", label: "Admission Cell", icon: UserCheck, color: "blue", path: "/admission/dashboard" },
    { id: "ExamCell", label: "Exam Cell", icon: FileText, color: "purple", path: "/cell/exam/dashboard" },
    { id: "DisciplineCell", label: "Discipline Cell", icon: Shield, color: "red", path: "/cell/discipline/dashboard" },
    { id: "SportsCell", label: "Sports Cell", icon: Trophy, color: "green", path: "/cell/sports/dashboard" },
    { id: "ManagementCell", label: "Management Cell", icon: FileText, color: "orange", path: "/cell/management/dashboard" },
  ];

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await axios.get('/teacher/getall');
      setTeachers(res.data);
    } catch (error) {
      toast.error("Failed to fetch teachers");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCell = async (teacherId, cellId) => {
    setUpdating(true);
    try {
      await axios.post('/cells/assign', { teacherId, cell: cellId });
      toast.success("Teacher reassigned successfully");
      fetchTeachers();
    } catch (error) {
      toast.error("Failed to assign cell");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-gray-400">LOADING CELL ARCHITECTURE...</div>;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Cell Management</h1>
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cells.filter(c => c.id !== "None").map(cell => (
              <div key={cell.id} className="bg-white p-8 rounded-[2rem] shadow-md border border-gray-100 flex flex-col items-center text-center group hover:shadow-2xl hover:shadow-indigo-100 transition duration-500">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition duration-500 shadow-lg shadow-indigo-50">
                      <cell.icon size={28} />
                  </div>
                  <h3 className="font-black text-xl text-gray-800 mb-1">{cell.label}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
                      {teachers.filter(t => t.schoolCell === cell.id).length} Active Members
                  </p>
                  <button 
                    onClick={() => navigate(cell.path)}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition flex items-center justify-center gap-2 shadow-xl shadow-gray-200"
                  >
                      <ExternalLink size={14} /> View Dashboard
                  </button>
              </div>
          ))}
      </div>

              <p className="text-gray-500 font-bold ml-1 uppercase text-xs tracking-widest">Assign staff roles and access cell dashboards</p>

      <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
              <th className="py-6 px-8">Teacher Name</th>
              <th className="py-6 px-8 text-center">Current Assignment</th>
              <th className="py-6 px-8 text-right">Reassign to Cell</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {teachers.map(teacher => (
              <tr key={teacher._id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="py-6 px-8">
                  <div className="font-bold text-gray-900">{teacher.name}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{teacher.email}</div>
                </td>
                <td className="py-6 px-8 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    teacher.schoolCell === 'None' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                  }`}>
                    {teacher.schoolCell === 'None' ? 'General Staff' : teacher.schoolCell}
                  </span>
                </td>
                <td className="py-6 px-8 text-right">
                  <select 
                    value={teacher.schoolCell}
                    onChange={(e) => handleAssignCell(teacher._id, e.target.value)}
                    disabled={updating}
                    className="rounded-xl border-gray-200 text-xs font-black p-2 focus:ring-4 focus:ring-indigo-50 outline-none bg-gray-50 cursor-pointer hover:border-indigo-300 transition"
                  >
                    {cells.map(cell => (
                      <option key={cell.id} value={cell.id}>{cell.label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      
    </div>
  );
};

export default CellManagement;
