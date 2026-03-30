import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
    Shield, AlertTriangle, CheckCircle, PlusCircle, 
    Search, Filter, MoreVertical, Trash2, Edit3, 
    User, Calendar, Clock, MessageSquare, X, Info
} from 'lucide-react';

const DisciplineCellDashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [currentIncident, setCurrentIncident] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Form State
  const [formData, setFormData] = useState({
      studentId: '',
      incidentType: 'Misconduct',
      severity: 'Low',
      description: '',
      actionTaken: 'Under Review',
      teacherComment: '',
      status: 'Open'
  });

  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [incRes, stdRes] = await Promise.all([
          axios.get('/cells/discipline/all'),
          axios.get('/student/getall')
      ]);
      setIncidents(incRes.data);
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
              await axios.post('/cells/discipline/report', {
                  student: formData.studentId,
                  incidentType: formData.incidentType,
                  severity: formData.severity,
                  description: formData.description,
                  actionTaken: formData.actionTaken,
                  status: formData.status
              });
              toast.success("Incident reported successfully");
          } else {
              await axios.put(`/cells/discipline/${currentIncident._id}`, {
                  incidentType: formData.incidentType,
                  severity: formData.severity,
                  description: formData.description,
                  actionTaken: formData.actionTaken,
                  teacherComment: formData.teacherComment,
                  status: formData.status
              });
              toast.success("Incident updated successfully");
          }
          setShowModal(false);
          fetchData();
      } catch (error) {
          toast.error(error.response?.data?.message || "Operation failed");
      }
  };

  const handleDelete = async (id) => {
      if (!window.confirm("Are you sure you want to delete this record?")) return;
      try {
          await axios.delete(`/cells/discipline/${id}`);
          toast.success("Record deleted");
          fetchData();
      } catch (error) {
          toast.error("Deletion failed");
      }
  };

  const openModal = (type, incident = null) => {
      setModalType(type);
      if (type === 'edit' && incident) {
          setCurrentIncident(incident);
          setFormData({
              studentId: incident.student?._id,
              incidentType: incident.incidentType,
              severity: incident.severity,
              description: incident.description,
              actionTaken: incident.actionTaken,
              teacherComment: incident.teacherComment || '',
              status: incident.status
          });
      } else {
          setFormData({
            studentId: '',
            incidentType: 'Misconduct',
            severity: 'Low',
            description: '',
            actionTaken: 'Under Review',
            teacherComment: '',
            status: 'Open'
          });
          setStudentSearch('');
      }
      setShowModal(true);
  };

  const filteredIncidents = incidents.filter(inc => {
      const matchesSearch = inc.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inc.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = filterSeverity === 'All' || inc.severity === filterSeverity;
      const matchesStatus = filterStatus === 'All' || inc.status === filterStatus;
      return matchesSearch && matchesSeverity && matchesStatus;
  });

  const stats = {
      critical: incidents.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length,
      open: incidents.filter(i => i.status === 'Open').length,
      resolved: incidents.filter(i => i.status === 'Resolved').length,
      total: incidents.length
  };

  if (loading) return <div className="p-20 text-center font-black text-gray-300 animate-pulse">LOADING DISCIPLINE RECORDS...</div>;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <Shield className="text-red-600" size={36} /> Discipline Cell
            </h1>
            <p className="text-gray-500 font-bold ml-1 uppercase text-[10px] tracking-widest mt-2">Monitor Conduct & Manage Student Incidents</p>
          </div>
          <button 
            onClick={() => openModal('add')}
            className="px-6 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-100 flex items-center gap-2"
          >
            <PlusCircle size={20} /> Report Incident
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Critical Cases</div>
          <div className="text-4xl font-black text-red-600">{stats.critical}</div>
          <AlertTriangle className="absolute -right-4 -bottom-4 text-red-50 group-hover:text-red-100 transition-colors" size={100} />
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Open Issues</div>
          <div className="text-4xl font-black text-orange-600">{stats.open}</div>
          <Clock className="absolute -right-4 -bottom-4 text-orange-50 group-hover:text-orange-100 transition-colors" size={100} />
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Resolved</div>
          <div className="text-4xl font-black text-emerald-600">{stats.resolved}</div>
          <CheckCircle className="absolute -right-4 -bottom-4 text-emerald-50 group-hover:text-emerald-100 transition-colors" size={100} />
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total History</div>
          <div className="text-4xl font-black text-blue-600">{stats.total}</div>
          <Shield className="absolute -right-4 -bottom-4 text-blue-50 group-hover:text-blue-100 transition-colors" size={100} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <h2 className="text-xl font-black text-gray-800">Incident Registry</h2>
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" placeholder="Search incidents..." 
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-red-50 font-bold text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <select 
                className="p-3 bg-gray-50 border-none rounded-xl font-bold text-xs text-gray-600 focus:ring-4 focus:ring-red-50"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
              >
                  <option value="All">All Severity</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
              </select>
              <select 
                className="p-3 bg-gray-50 border-none rounded-xl font-bold text-xs text-gray-600 focus:ring-4 focus:ring-red-50"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                  <option value="All">All Status</option>
                  <option value="Open">Open</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Dismissed">Dismissed</option>
              </select>
          </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="py-6 px-8">Student / Case</th>
                        <th className="py-6 px-8">Severity</th>
                        <th className="py-6 px-8">Incident Details</th>
                        <th className="py-6 px-8">Status & Action</th>
                        <th className="py-6 px-8">Reported By</th>
                        <th className="py-6 px-8 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredIncidents.map(inc => (
                        <tr key={inc._id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="py-6 px-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <div className="font-black text-gray-800">{inc.student?.name}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase">{inc.incidentType}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="py-6 px-8">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                    inc.severity === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' :
                                    inc.severity === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                    inc.severity === 'Medium' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    'bg-gray-50 text-gray-600 border-gray-100'
                                }`}>
                                    {inc.severity}
                                </span>
                            </td>
                            <td className="py-6 px-8 max-w-xs">
                                <p className="text-xs font-bold text-gray-600 line-clamp-2">{inc.description}</p>
                                <div className="flex items-center gap-1.5 mt-2 text-gray-400">
                                    <Calendar size={12} />
                                    <span className="text-[10px] font-bold">{new Date(inc.date).toLocaleDateString()}</span>
                                </div>
                            </td>
                            <td className="py-6 px-8">
                                <div className="space-y-1.5">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                                        inc.status === 'Open' ? 'bg-orange-100 text-orange-700' :
                                        inc.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                        {inc.status}
                                    </span>
                                    <div className="text-[10px] font-bold text-gray-500 italic">"{inc.actionTaken}"</div>
                                </div>
                            </td>
                            <td className="py-6 px-8">
                                <div className="text-xs font-bold text-gray-700">{inc.reportedBy?.name}</div>
                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{inc.reportedBy?.role}</div>
                            </td>
                            <td className="py-6 px-8 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => openModal('edit', inc)}
                                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(inc._id)}
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
        {filteredIncidents.length === 0 && (
            <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                    <Shield size={32} />
                </div>
                <p className="text-gray-400 font-bold italic">No incident reports matching your criteria...</p>
            </div>
        )}
      </div>

      {/* Report/Edit Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
                  <div className={`p-8 ${modalType === 'add' ? 'bg-red-600' : 'bg-blue-600'} text-white flex justify-between items-center relative flex-shrink-0`}>
                      <div>
                          <h2 className="text-2xl font-black">{modalType === 'add' ? 'New Incident Report' : 'Update Case File'}</h2>
                          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">
                              {modalType === 'add' ? 'Formalize student misconduct documentation' : `Tracking Case: ${currentIncident?.student?.name}`}
                          </p>
                      </div>
                      <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition">
                          <X size={24} />
                      </button>
                  </div>

                  <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                      {modalType === 'add' ? (
                          <div className="space-y-4">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Student *</label>
                              <div className="relative">
                                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                  <input 
                                    type="text" placeholder="Search by name or roll number..." 
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-red-50 font-bold text-sm"
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
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${formData.studentId === s._id ? 'border-red-500 bg-red-50 text-red-700' : 'border-transparent bg-white hover:border-gray-200'}`}
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
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Incident Category</label>
                              <select 
                                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-red-50 font-bold text-gray-700 text-sm appearance-none shadow-sm cursor-pointer"
                                value={formData.incidentType}
                                onChange={(e) => setFormData({...formData, incidentType: e.target.value})}
                              >
                                  {["Misconduct", "Bullying", "Truancy", "Academic Dishonesty", "Other"].map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                  ))}
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Severity Matrix</label>
                              <select 
                                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-red-50 font-bold text-gray-700 text-sm appearance-none shadow-sm cursor-pointer"
                                value={formData.severity}
                                onChange={(e) => setFormData({...formData, severity: e.target.value})}
                              >
                                  {["Low", "Medium", "High", "Critical"].map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                  ))}
                              </select>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Detailed Description *</label>
                          <textarea 
                            required
                            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-red-50 font-bold text-gray-700 text-sm min-h-[120px]"
                            placeholder="Provide a factual account of the incident..."
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Primary Action Taken</label>
                              <input 
                                type="text" 
                                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-red-50 font-bold text-gray-700 text-sm"
                                placeholder="e.g. Warning Issued, Suspension"
                                value={formData.actionTaken}
                                onChange={(e) => setFormData({...formData, actionTaken: e.target.value})}
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Case Status</label>
                              <select 
                                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-red-50 font-bold text-gray-700 text-sm appearance-none shadow-sm cursor-pointer"
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                              >
                                  {["Open", "Resolved", "Dismissed"].map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                  ))}
                              </select>
                          </div>
                      </div>

                      {modalType === 'edit' && (
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cell Internal Comments</label>
                              <textarea 
                                className="w-full p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 font-bold text-gray-700 text-xs min-h-[80px]"
                                placeholder="Internal notes for cell members..."
                                value={formData.teacherComment}
                                onChange={(e) => setFormData({...formData, teacherComment: e.target.value})}
                              />
                          </div>
                      )}

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
                            className={`px-10 py-4 ${modalType === 'add' ? 'bg-red-600 shadow-red-100' : 'bg-blue-600 shadow-blue-100'} text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition hover:opacity-90`}
                          >
                              {modalType === 'add' ? 'Finalize Report' : 'Save Updates'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default DisciplineCellDashboard;
