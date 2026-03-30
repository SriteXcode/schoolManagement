import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Trophy, FileText, UserCheck, ExternalLink, X, Plus, Search } from 'lucide-react';

const CellManagement = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const cells = [
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
      toast.success("Assignment updated");
      fetchTeachers();
    } catch (error) {
      toast.error("Failed to update assignment");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black text-gray-300 animate-pulse uppercase tracking-[0.5em]">ORCHESTRATING CELL ARCHITECTURE...</div>;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Cell Management</h1>
              <p className="text-gray-500 font-bold ml-1 uppercase text-[10px] tracking-widest mt-2">Manage specialized administrative units and personnel</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
                type="text" 
                placeholder="Search staff..." 
                className="w-full pl-12 pr-6 py-4 rounded-2xl border-none bg-white shadow-sm focus:ring-4 focus:ring-indigo-50 font-bold text-gray-700 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
      </div>

      {/* Cell Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cells.map(cell => {
              const assignedTeachers = teachers.filter(t => t.schoolCell === cell.id);
              const availableTeachers = teachers.filter(t => 
                t.schoolCell !== cell.id && 
                t.name.toLowerCase().includes(searchTerm.toLowerCase())
              );

              return (
                  <div key={cell.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col group hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500">
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-6">
                          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition duration-500 shadow-lg shadow-indigo-50">
                              <cell.icon size={28} />
                          </div>
                          <button 
                            onClick={() => navigate(cell.path)}
                            className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-900 hover:text-white transition"
                            title="Open Dashboard"
                          >
                              <ExternalLink size={16} />
                          </button>
                      </div>

                      <h3 className="font-black text-2xl text-gray-800 mb-1">{cell.label}</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">
                          {assignedTeachers.length} Active Operatives
                      </p>

                      {/* Members List (Editable) */}
                      <div className="space-y-4 mb-8">
                          <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50 pb-2 flex justify-between">
                              Assigned Members
                              <span>{assignedTeachers.length}</span>
                          </h4>
                          <div className="flex flex-wrap gap-2 min-h-[60px] max-h-40 overflow-y-auto content-start custom-scrollbar p-1">
                              {assignedTeachers.length > 0 ? assignedTeachers.map(t => (
                                  <div key={t._id} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase border border-indigo-100 animate-in fade-in zoom-in">
                                      {t.name}
                                      <button 
                                        onClick={() => handleAssignCell(t._id, 'None')}
                                        disabled={updating}
                                        className="text-indigo-300 hover:text-red-500 transition-colors"
                                        title="Unassign"
                                      >
                                          <X size={12} />
                                      </button>
                                  </div>
                              )) : (
                                  <span className="text-[10px] font-bold text-gray-300 italic py-4 w-full text-center">No members assigned.</span>
                              )}
                          </div>
                      </div>

                      {/* Assignment Dropdown/List */}
                      <div className="mt-auto pt-6 border-t border-gray-50">
                          <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 block">Assign Staff to {cell.label}</label>
                          <div className="relative group/assign">
                            <select 
                                onChange={(e) => handleAssignCell(e.target.value, cell.id)}
                                disabled={updating}
                                value=""
                                className="w-full p-4 bg-gray-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-50 text-gray-600 cursor-pointer appearance-none transition pr-10"
                            >
                                <option value="" disabled>Pick Operative to add...</option>
                                {availableTeachers.map(t => (
                                    <option key={t._id} value={t._id}>
                                        {t.name} {t.schoolCell !== 'None' ? `(${t.schoolCell})` : ''}
                                    </option>
                                ))}
                            </select>
                            <Plus className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 group-hover/assign:text-indigo-600 transition" size={16} />
                          </div>
                          
                          {/* Multiple Choice Hint */}
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mt-4 text-center">
                              Selecting an operative will immediately assign them to this cell.
                          </p>
                      </div>
                  </div>
              );
          })}
      </div>
    </div>
  );
};

export default CellManagement;
