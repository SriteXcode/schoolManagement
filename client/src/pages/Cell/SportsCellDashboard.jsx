import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
    Trophy, Users, PlusCircle, Search, Filter, 
    Trash2, Edit3, User, Calendar, Award, 
    Medal, Flag, X, Plus, ChevronRight
} from 'lucide-react';

const SportsCellDashboard = () => {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [currentRecord, setCurrentRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Form State
  const [formData, setFormData] = useState({
      studentId: '',
      sport: '',
      sportsType: 'Outdoor',
      role: 'Player',
      team: '',
      achievements: [] // { title, date, description }
  });

  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recRes, stdRes] = await Promise.all([
          axios.get('/cells/sports/all'),
          axios.get('/student/getall')
      ]);
      setRecords(recRes.data);
      setStudents(stdRes.data);
    } catch (error) {
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          if (modalType === 'add') {
              await axios.post('/cells/sports/record', {
                  student: formData.studentId,
                  sport: formData.sport,
                  sportsType: formData.sportsType,
                  role: formData.role,
                  team: formData.team,
                  achievements: formData.achievements
              });
              toast.success("Sports record added");
          } else {
              await axios.put(`/cells/sports/${currentRecord._id}`, {
                  sport: formData.sport,
                  sportsType: formData.sportsType,
                  role: formData.role,
                  team: formData.team,
                  achievements: formData.achievements
              });
              toast.success("Sports record updated");
          }
          setShowModal(false);
          fetchData();
      } catch (error) {
          toast.error(error.response?.data?.message || "Operation failed");
      }
  };

  const handleDelete = async (id) => {
      if (!window.confirm("Delete this sports record?")) return;
      try {
          await axios.delete(`/cells/sports/${id}`);
          toast.success("Record deleted");
          fetchData();
      } catch (error) {
          toast.error("Deletion failed");
      }
  };

  const openModal = (type, record = null) => {
      setModalType(type);
      if (type === 'edit' && record) {
          setCurrentRecord(record);
          setFormData({
              studentId: record.student?._id,
              sport: record.sport,
              sportsType: record.sportsType || 'Outdoor',
              role: record.role || 'Player',
              team: record.team || '',
              achievements: record.achievements || []
          });
      } else {
          setFormData({
            studentId: '',
            sport: '',
            sportsType: 'Outdoor',
            role: 'Player',
            team: '',
            achievements: []
          });
          setStudentSearch('');
      }
      setShowModal(true);
  };

  const addAchievement = () => {
      setFormData({
          ...formData,
          achievements: [...formData.achievements, { title: '', date: '', description: '' }]
      });
  };

  const removeAchievement = (index) => {
      setFormData({
          ...formData,
          achievements: formData.achievements.filter((_, i) => i !== index)
      });
  };

  const updateAchievement = (index, field, value) => {
      const updated = [...formData.achievements];
      updated[index][field] = value;
      setFormData({ ...formData, achievements: updated });
  };

  const filteredRecords = records.filter(rec => {
      const matchesSearch = rec.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rec.sport?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'All' || rec.sportsType === filterType;
      return matchesSearch && matchesType;
  });

  const stats = {
      totalAthletes: [...new Set(records.map(r => r.student?._id))].length,
      activeTeams: [...new Set(records.map(r => r.team).filter(t => t))].length,
      totalAchievements: records.reduce((acc, r) => acc + (r.achievements?.length || 0), 0),
      outdoor: records.filter(r => r.sportsType === 'Outdoor').length
  };

  if (loading) return <div className="p-20 text-center font-black text-gray-300 animate-pulse">SYNCING SPORTS DATABASE...</div>;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <Trophy className="text-amber-500" size={36} /> Sports Cell
            </h1>
            <p className="text-gray-500 font-bold ml-1 uppercase text-[10px] tracking-widest mt-2">Manage Athletic Excellence & Team Records</p>
          </div>
          <button 
            onClick={() => openModal('add')}
            className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 flex items-center gap-2"
          >
            <PlusCircle size={20} /> Add Sports Record
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total Athletes</div>
          <div className="text-4xl font-black text-emerald-600">{stats.totalAthletes}</div>
          <Users className="absolute -right-4 -bottom-4 text-emerald-50 group-hover:text-emerald-100 transition-colors" size={100} />
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Active Teams</div>
          <div className="text-4xl font-black text-blue-600">{stats.activeTeams}</div>
          <Flag className="absolute -right-4 -bottom-4 text-blue-50 group-hover:text-blue-100 transition-colors" size={100} />
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total Awards</div>
          <div className="text-4xl font-black text-amber-500">{stats.totalAchievements}</div>
          <Medal className="absolute -right-4 -bottom-4 text-amber-50 group-hover:text-amber-100 transition-colors" size={100} />
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Outdoor Records</div>
          <div className="text-4xl font-black text-purple-600">{stats.outdoor}</div>
          <Trophy className="absolute -right-4 -bottom-4 text-purple-50 group-hover:text-purple-100 transition-colors" size={100} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <h2 className="text-xl font-black text-gray-800">Athlete Registry</h2>
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" placeholder="Search athletes or sports..." 
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-emerald-50 font-bold text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <select 
                className="p-3 bg-gray-50 border-none rounded-xl font-bold text-xs text-gray-600 focus:ring-4 focus:ring-emerald-50"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                  <option value="All">All Types</option>
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                  <option value="Other">Other</option>
              </select>
          </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="py-6 px-8">Student Athlete</th>
                        <th className="py-6 px-8">Sport & Type</th>
                        <th className="py-6 px-8">Team / Role</th>
                        <th className="py-6 px-8">Achievements</th>
                        <th className="py-6 px-8 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredRecords.map(rec => (
                        <tr key={rec._id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="py-6 px-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <div className="font-black text-gray-800">{rec.student?.name}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase">{rec.student?.rollNum}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="py-6 px-8">
                                <div className="font-black text-gray-700">{rec.sport}</div>
                                <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${
                                    rec.sportsType === 'Outdoor' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                    {rec.sportsType}
                                </span>
                            </td>
                            <td className="py-6 px-8">
                                <div className="text-xs font-bold text-gray-600">{rec.team || 'No Team'}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{rec.role}</div>
                            </td>
                            <td className="py-6 px-8">
                                <div className="flex flex-wrap gap-1.5">
                                    {(rec.achievements || []).map((ach, idx) => (
                                        <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                                            <Award size={10} />
                                            <span className="text-[9px] font-black">{ach.title}</span>
                                        </div>
                                    ))}
                                    {(!rec.achievements || rec.achievements.length === 0) && (
                                        <span className="text-[10px] text-gray-400 italic">No achievements recorded</span>
                                    )}
                                </div>
                            </td>
                            <td className="py-6 px-8 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => openModal('edit', rec)}
                                        className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition"
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(rec._id)}
                                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {filteredRecords.length === 0 && (
            <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                    <Trophy size={32} />
                </div>
                <p className="text-gray-400 font-bold italic">No sports records found...</p>
            </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
                  <div className={`p-8 ${modalType === 'add' ? 'bg-emerald-600' : 'bg-blue-600'} text-white flex justify-between items-center relative flex-shrink-0`}>
                      <div>
                          <h2 className="text-2xl font-black">{modalType === 'add' ? 'New Sports Record' : 'Edit Performance Profile'}</h2>
                          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">
                              {modalType === 'add' ? 'Document student athletic participation' : `Athlete: ${currentRecord?.student?.name}`}
                          </p>
                      </div>
                      <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition">
                          <X size={24} />
                      </button>
                  </div>

                  <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                      {modalType === 'add' ? (
                          <div className="space-y-4">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assign Student *</label>
                              <div className="relative">
                                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                  <input 
                                    type="text" placeholder="Search athlete by name or roll number..." 
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-emerald-50 font-bold text-sm"
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                  />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-2xl border border-gray-100 custom-scrollbar">
                                  {students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.rollNum?.includes(studentSearch))
                                    .slice(0, 10).map(s => (
                                      <button 
                                        key={s._id} type="button"
                                        onClick={() => {
                                            setFormData({...formData, studentId: s._id});
                                            setStudentSearch(s.name);
                                        }}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${formData.studentId === s._id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-transparent bg-white hover:border-gray-200'}`}
                                      >
                                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-[10px]">{s.name.charAt(0)}</div>
                                          <div className="text-left">
                                              <div className="text-[10px] font-black">{s.name}</div>
                                              <div className="text-[8px] font-bold text-gray-400 uppercase">{s.rollNum} | {s.sClass?.grade}-{s.sClass?.section}</div>
                                          </div>
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ) : null}

                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Discipline/Sport *</label>
                              <input 
                                type="text" required
                                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-50 font-black text-gray-700 text-sm"
                                placeholder="e.g. Cricket, Basketball"
                                value={formData.sport}
                                onChange={(e) => setFormData({...formData, sport: e.target.value})}
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sports Category</label>
                              <select 
                                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-50 font-bold text-gray-700 text-sm appearance-none shadow-sm cursor-pointer"
                                value={formData.sportsType}
                                onChange={(e) => setFormData({...formData, sportsType: e.target.value})}
                              >
                                  {["Indoor", "Outdoor", "Other"].map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                  ))}
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Team Name</label>
                              <input 
                                type="text" 
                                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-50 font-black text-gray-700 text-sm"
                                placeholder="e.g. Senior Boys A"
                                value={formData.team}
                                onChange={(e) => setFormData({...formData, team: e.target.value})}
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Athlete Role</label>
                              <input 
                                type="text" 
                                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-50 font-black text-gray-700 text-sm"
                                placeholder="e.g. Captain, Goal Keeper"
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                              />
                          </div>
                      </div>

                      <div className="space-y-4 pt-4">
                          <div className="flex justify-between items-center px-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Achievements & Accolades</label>
                              <button 
                                type="button" 
                                onClick={addAchievement}
                                className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase hover:underline"
                              >
                                  <Plus size={14} /> Add Achievement
                              </button>
                          </div>
                          
                          <div className="space-y-3">
                              {formData.achievements.map((ach, idx) => (
                                  <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 relative group/ach">
                                      <button 
                                        type="button" 
                                        onClick={() => removeAchievement(idx)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/ach:opacity-100 transition-opacity"
                                      >
                                          <X size={14} />
                                      </button>
                                      <div className="grid grid-cols-2 gap-4">
                                          <input 
                                            type="text" placeholder="Title (e.g. Best Bowler)"
                                            className="p-2.5 bg-white rounded-xl text-xs font-black outline-none border border-transparent focus:border-emerald-200"
                                            value={ach.title}
                                            onChange={(e) => updateAchievement(idx, 'title', e.target.value)}
                                          />
                                          <input 
                                            type="date"
                                            className="p-2.5 bg-white rounded-xl text-xs font-black outline-none border border-transparent focus:border-emerald-200"
                                            value={ach.date ? ach.date.split('T')[0] : ''}
                                            onChange={(e) => updateAchievement(idx, 'date', e.target.value)}
                                          />
                                      </div>
                                      <textarea 
                                        placeholder="Achievement details..."
                                        className="w-full p-2.5 bg-white rounded-xl text-[10px] font-bold outline-none border border-transparent focus:border-emerald-200 min-h-[60px]"
                                        value={ach.description}
                                        onChange={(e) => updateAchievement(idx, 'description', e.target.value)}
                                      />
                                  </div>
                              ))}
                              {formData.achievements.length === 0 && (
                                  <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-[2rem] text-gray-400 font-bold italic text-xs">
                                      No achievements added yet...
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="pt-6 border-t border-gray-100 flex justify-end gap-4 pb-4">
                          <button 
                            type="button" 
                            onClick={() => setShowModal(false)}
                            className="px-8 py-4 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition"
                          >
                              Cancel
                          </button>
                          <button 
                            type="submit"
                            className={`px-10 py-4 ${modalType === 'add' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-blue-600 shadow-blue-100'} text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition hover:opacity-90`}
                          >
                              {modalType === 'add' ? 'Record Achievement' : 'Save Profile'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default SportsCellDashboard;
