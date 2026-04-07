import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { 
    Shield, AlertTriangle, CheckCircle, PlusCircle, 
    Search, Filter, MoreVertical, Trash2, Edit3, 
    User, Calendar, Clock, MessageSquare, X, Info,
    Users, ArrowLeftRight, Plus
} from 'lucide-react';

const DisciplineCellDashboard = () => {
  const location = useLocation();
  const activeTab = location.pathname.split('/').pop(); // 'dashboard', 'incidents', 'students'
  
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
      involvedStudents: [], // Array of { student: id, side: 'Side A' }
      hasSides: false,
      incidentType: 'Misconduct',
      severity: 'Low',
      description: '',
      actionTaken: 'Under Review',
      teacherComment: '',
      status: 'Open'
  });

  const [studentSearch, setStudentSearch] = useState('');

  const toggleStudent = (s) => {
      const exists = formData.involvedStudents.find(item => item.student === s._id);
      if (exists) {
          setFormData({
              ...formData,
              involvedStudents: formData.involvedStudents.filter(item => item.student !== s._id)
          });
      } else {
          setFormData({
              ...formData,
              involvedStudents: [...formData.involvedStudents, { student: s._id, side: 'Side A', details: s }]
          });
      }
  };

  const updateStudentSide = (studentId, side) => {
      setFormData({
          ...formData,
          involvedStudents: formData.involvedStudents.map(item => 
              item.student === studentId ? { ...item, side } : item
          )
      });
  };

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
      if (formData.involvedStudents.length === 0) return toast.error("Select at least one student");

      try {
          const payload = {
              student: formData.involvedStudents[0].student, // Primary for legacy support
              involvedStudents: formData.involvedStudents.map(i => ({ student: i.student, side: i.side })),
              hasSides: formData.hasSides,
              incidentType: formData.incidentType,
              severity: formData.severity,
              description: formData.description,
              actionTaken: formData.actionTaken,
              status: formData.status
          };

          if (modalType === 'add') {
              await axios.post('/cells/discipline/report', payload);
              toast.success("Incident reported successfully");
          } else {
              await axios.put(`/cells/discipline/${currentIncident._id}`, {
                  ...payload,
                  teacherComment: formData.teacherComment
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
              involvedStudents: incident.involvedStudents?.map(i => ({
                  student: i.student?._id,
                  side: i.side,
                  details: i.student
              })) || [{ student: incident.student?._id, side: 'Side A', details: incident.student }],
              hasSides: incident.hasSides || false,
              incidentType: incident.incidentType,
              severity: incident.severity,
              description: incident.description,
              actionTaken: incident.actionTaken,
              teacherComment: incident.teacherComment || '',
              status: incident.status
          });
          setStudentSearch('');
      } else {
          setFormData({
            involvedStudents: [],
            hasSides: false,
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
      const studentNames = [
          inc.student?.name,
          ...(inc.involvedStudents?.map(i => i.student?.name) || [])
      ].filter(Boolean).join(' ').toLowerCase();

      const matchesSearch = studentNames.includes(searchTerm.toLowerCase()) || 
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
            <p className="text-gray-500 font-bold ml-1 uppercase text-[10px] tracking-widest mt-2">
                {activeTab === 'students' ? 'Exhaustive Student Search & Profile Access' : 'Monitor Conduct & Manage Student Incidents'}
            </p>
          </div>
          {(activeTab === 'dashboard' || activeTab === 'incidents') && (
            <button 
                onClick={() => openModal('add')}
                className="px-6 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-100 flex items-center gap-2"
            >
                <PlusCircle size={20} /> Report Incident
            </button>
          )}
      </div>

      {activeTab === 'dashboard' && (
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
      )}

      {(activeTab === 'dashboard' || activeTab === 'incidents') && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <h2 className="text-xl font-black text-gray-800">
                {activeTab === 'dashboard' ? 'Recent Incidents' : 'Incident Registry'}
            </h2>
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
                        {(activeTab === 'dashboard' ? filteredIncidents.slice(0, 5) : filteredIncidents).map(inc => (
                            <tr key={inc._id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="py-6 px-8">
                                    <div className="space-y-4">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{inc.incidentType}</div>
                                        
                                        {inc.hasSides ? (
                                            <div className="flex items-center gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex -space-x-2">
                                                        {inc.involvedStudents?.filter(i => i.side === 'Side A').map(i => (
                                                            <div key={i.student?._id} className="w-8 h-8 rounded-lg bg-red-600 border-2 border-white text-white flex items-center justify-center text-[10px] font-black shadow-sm" title={i.student?.name}>
                                                                {i.student?.name?.charAt(0)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="text-[8px] font-black text-red-500 uppercase tracking-tighter">Side A</div>
                                                </div>
                                                
                                                <ArrowLeftRight size={14} className="text-gray-300 shrink-0" />
                                                
                                                <div className="space-y-1">
                                                    <div className="flex -space-x-2">
                                                        {inc.involvedStudents?.filter(i => i.side === 'Side B').map(i => (
                                                            <div key={i.student?._id} className="w-8 h-8 rounded-lg bg-blue-600 border-2 border-white text-white flex items-center justify-center text-[10px] font-black shadow-sm" title={i.student?.name}>
                                                                {i.student?.name?.charAt(0)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">Side B</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="flex -space-x-3">
                                                    {(inc.involvedStudents?.length > 0 ? inc.involvedStudents : [{ student: inc.student }]).map((i, idx) => (
                                                        <div key={i.student?._id || idx} className="w-10 h-10 rounded-xl bg-gray-900 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md" title={i.student?.name}>
                                                            {i.student?.name?.charAt(0)}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-800 text-xs">
                                                        {inc.involvedStudents?.length > 0 
                                                            ? `${inc.involvedStudents[0].student?.name}${inc.involvedStudents.length > 1 ? ` +${inc.involvedStudents.length - 1}` : ''}`
                                                            : inc.student?.name
                                                        }
                                                    </div>
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase">Participants</div>
                                                </div>
                                            </div>
                                        )}
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
      )}

      {activeTab === 'students' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <h2 className="text-xl font-black text-gray-800">Student Directory Lookup</h2>
                  <div className="relative w-full md:w-96">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        type="text" 
                        placeholder="Type student name or roll number..." 
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-indigo-50 font-bold"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                      />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {students.filter(s => 
                      !studentSearch || 
                      s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || 
                      s.rollNum?.toLowerCase().includes(studentSearch.toLowerCase())
                  ).map(s => (
                      <div key={s._id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-indigo-200 transition-all group">
                          <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center font-black text-xl text-indigo-600 shadow-sm">
                                  {s.name?.charAt(0)}
                              </div>
                              <div className="flex-1">
                                  <h3 className="font-black text-gray-800">{s.name}</h3>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.rollNum}</p>
                                  <div className="mt-2 flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[8px] font-black uppercase">
                                          {s.sClass?.grade}-{s.section || s.sClass?.section}
                                      </span>
                                  </div>
                              </div>
                              <button 
                                onClick={() => {
                                    setModalType('add');
                                    setFormData(prev => ({...prev, involvedStudents: [{ student: s._id, side: 'Side A', details: s }]}));
                                    setShowModal(true);
                                }}
                                className="p-3 bg-white text-gray-400 rounded-xl hover:bg-red-600 hover:text-white transition shadow-sm"
                                title="Report Incident"
                              >
                                  <AlertTriangle size={20} />
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Report/Edit Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
                  <div className={`p-8 ${modalType === 'add' ? 'bg-red-600' : 'bg-blue-600'} text-white flex justify-between items-center relative flex-shrink-0`}>
                      <div>
                          <h2 className="text-2xl font-black">{modalType === 'add' ? 'New Incident Report' : 'Update Case File'}</h2>
                          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">
                              {modalType === 'add' ? 'Formalize student misconduct documentation' : `Tracking Case: ${formData.involvedStudents[0]?.details?.name || 'Awaiting Selection'}${formData.involvedStudents.length > 1 ? ` +${formData.involvedStudents.length - 1} Others` : ''}`}
                          </p>
                      </div>
                      <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition">
                          <X size={24} />
                      </button>
                  </div>

                  <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                      <div className="space-y-4">
                          <div className="flex justify-between items-center px-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Involved Students *</label>
                              <button 
                                type="button"
                                onClick={() => setFormData(prev => ({...prev, hasSides: !prev.hasSides}))}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all ${formData.hasSides ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                              >
                                  <ArrowLeftRight size={14} />
                                  <span className="text-[10px] font-black uppercase">Two-Sided Incident</span>
                              </button>
                          </div>

                          <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                              <input 
                                type="text" placeholder="Search and add students..." 
                                className="w-full pl-12 pr-12 py-4 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-red-50 font-bold text-sm"
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                              />
                              {studentSearch && (
                                  <button type="button" onClick={() => setStudentSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                      <X size={18} />
                                  </button>
                              )}
                          </div>

                          {studentSearch.trim() && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-2xl border border-gray-100 custom-scrollbar">
                                  {students.filter(s => 
                                      (s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || 
                                       s.rollNum?.toLowerCase().includes(studentSearch.toLowerCase()))
                                  ).slice(0, 8).map(s => {
                                      const isSelected = formData.involvedStudents.find(i => i.student === s._id);
                                      return (
                                          <button 
                                            key={s._id} type="button"
                                            onClick={() => toggleStudent(s)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isSelected ? 'border-red-500 bg-red-50' : 'border-transparent bg-white hover:border-gray-200'}`}
                                          >
                                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-[10px]">{s.name?.charAt(0)}</div>
                                              <div className="text-left overflow-hidden">
                                                  <div className="text-[10px] font-black truncate">{s.name}</div>
                                                  <div className="text-[8px] font-bold text-gray-400 uppercase truncate">{s.rollNum}</div>
                                              </div>
                                              {isSelected ? <CheckCircle className="ml-auto text-red-600" size={14} /> : <Plus className="ml-auto text-gray-300" size={14} />}
                                          </button>
                                      );
                                  })}
                              </div>
                          )}

                          {formData.involvedStudents.length > 0 && (
                              <div className="space-y-3 p-4 bg-gray-50 rounded-[2rem] border border-gray-100">
                                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Selected Participants</h4>
                                  <div className="space-y-2">
                                      {formData.involvedStudents.map(item => (
                                          <div key={item.student} className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-gray-50">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-black text-[10px]">
                                                      {item.details?.name?.charAt(0)}
                                                  </div>
                                                  <div>
                                                      <div className="text-[10px] font-black">{item.details?.name}</div>
                                                      <div className="text-[8px] font-bold text-gray-400 uppercase">{item.details?.rollNum}</div>
                                                  </div>
                                              </div>
                                              
                                              <div className="flex items-center gap-2">
                                                  {formData.hasSides ? (
                                                      <div className="flex bg-gray-100 p-1 rounded-lg">
                                                          <button 
                                                            type="button"
                                                            onClick={() => updateStudentSide(item.student, 'Side A')}
                                                            className={`px-3 py-1 rounded-md text-[8px] font-black uppercase transition-all ${item.side === 'Side A' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}
                                                          >
                                                              Side A
                                                          </button>
                                                          <button 
                                                            type="button"
                                                            onClick={() => updateStudentSide(item.student, 'Side B')}
                                                            className={`px-3 py-1 rounded-md text-[8px] font-black uppercase transition-all ${item.side === 'Side B' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                                                          >
                                                              Side B
                                                          </button>
                                                      </div>
                                                  ) : (
                                                      <select 
                                                        className="bg-gray-100 border-none rounded-lg text-[8px] font-black uppercase px-2 py-1 outline-none"
                                                        value={item.side}
                                                        onChange={(e) => updateStudentSide(item.student, e.target.value)}
                                                      >
                                                          <option value="Side A">Participant</option>
                                                          <option value="Neutral">Neutral</option>
                                                          <option value="Witness">Witness</option>
                                                      </select>
                                                  )}
                                                  <button 
                                                    type="button"
                                                    onClick={() => toggleStudent(item.details)}
                                                    className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition"
                                                  >
                                                      <X size={14} />
                                                  </button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>

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
