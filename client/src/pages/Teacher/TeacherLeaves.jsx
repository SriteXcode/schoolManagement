import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { FaPaperPlane, FaHistory, FaCheckCircle, FaTimesCircle, FaClock, FaCalendarPlus, FaInfoCircle } from 'react-icons/fa';

const TeacherLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'Sick Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get('/management/leave/my-leaves');
      setLeaves(res.data);
    } catch (err) {
      toast.error("Failed to load leave history");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/management/leave/request', formData);
      toast.success("Leave request submitted successfully");
      setShowRequestModal(false);
      setFormData({ leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <FaCheckCircle />;
      case 'Rejected': return <FaTimesCircle />;
      default: return <FaClock />;
    }
  };

  if (loading && leaves.length === 0) return <div className="p-20 text-center font-black animate-pulse text-emerald-600 uppercase tracking-widest">Accessing Leave Registry...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <FaCalendarPlus className="text-emerald-600" /> Attendance & Leave
            </h1>
            <p className="text-slate-500 font-bold ml-1 uppercase text-[10px] tracking-widest mt-2">Submit absence requests and track approval status</p>
          </div>
          
          <button 
            onClick={() => setShowRequestModal(true)}
            className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 flex items-center gap-2"
          >
            <FaPaperPlane /> Request Leave
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-100 flex items-center gap-6">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 text-2xl shadow-sm">
                  <FaClock />
              </div>
              <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
                  <p className="text-3xl font-black text-slate-800">{leaves.filter(l => l.status === 'Pending').length}</p>
              </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-100 flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 text-2xl shadow-sm">
                  <FaCheckCircle />
              </div>
              <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved</p>
                  <p className="text-3xl font-black text-slate-800">{leaves.filter(l => l.status === 'Approved').length}</p>
              </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-100 flex items-center gap-6">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 text-2xl shadow-sm">
                  <FaTimesCircle />
              </div>
              <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Applied</p>
                  <p className="text-3xl font-black text-slate-800">{leaves.length}</p>
              </div>
          </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-soft border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center gap-2">
              <FaHistory className="text-emerald-500" />
              <h2 className="text-xl font-black text-slate-800">Leave History</h2>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="py-6 px-8">Leave Type</th>
                          <th className="py-6 px-8">Duration</th>
                          <th className="py-6 px-8">Reason</th>
                          <th className="py-6 px-8">Status</th>
                          <th className="py-6 px-8">Admin Comment</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {leaves.map(l => (
                          <tr key={l._id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="py-6 px-8">
                                  <div className="font-black text-slate-800">{l.leaveType}</div>
                                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Applied on {new Date(l.appliedDate).toLocaleDateString()}</div>
                              </td>
                              <td className="py-6 px-8 font-bold text-slate-600">
                                  {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                              </td>
                              <td className="py-6 px-8 text-xs font-medium text-slate-500 max-w-xs truncate">{l.reason}</td>
                              <td className="py-6 px-8">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-fit ${getStatusStyle(l.status)}`}>
                                      {getStatusIcon(l.status)} {l.status}
                                  </span>
                              </td>
                              <td className="py-6 px-8 italic text-xs text-slate-400">
                                  {l.adminComment || "No comments yet..."}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              {leaves.length === 0 && (
                  <div className="py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                          <FaHistory size={32} />
                      </div>
                      <p className="text-slate-400 font-bold italic">No leave history found for your account...</p>
                  </div>
              )}
          </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in duration-300">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                      <div>
                          <h2 className="text-xl font-black uppercase tracking-tight">New Leave Request</h2>
                          <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-1">Submit your absence for review</p>
                      </div>
                      <button onClick={() => setShowRequestModal(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition"><FaTimesCircle /></button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-8 space-y-6">
                      <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type of Absence *</label>
                          <select 
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-4 focus:ring-emerald-50 transition-all outline-none"
                            value={formData.leaveType}
                            onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
                            required
                          >
                              <option value="Sick Leave">Sick Leave</option>
                              <option value="Casual Leave">Casual Leave</option>
                              <option value="Duty Leave">Duty Leave</option>
                              <option value="Emergency Leave">Emergency Leave</option>
                              <option value="Other">Other</option>
                          </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-4">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date *</label>
                              <input 
                                type="date" 
                                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-4 focus:ring-emerald-50 transition-all outline-none"
                                value={formData.startDate}
                                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                required
                              />
                          </div>
                          <div className="space-y-4">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date *</label>
                              <input 
                                type="date" 
                                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-4 focus:ring-emerald-50 transition-all outline-none"
                                value={formData.endDate}
                                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                required
                              />
                          </div>
                      </div>

                      <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Leave *</label>
                          <textarea 
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-4 focus:ring-emerald-50 transition-all outline-none min-h-[120px]"
                            placeholder="Please provide a brief explanation for your absence..."
                            value={formData.reason}
                            onChange={(e) => setFormData({...formData, reason: e.target.value})}
                            required
                          ></textarea>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <FaInfoCircle className="text-blue-500 mt-1" />
                          <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase">Requests should be submitted at least 48 hours in advance for planned leave. Medical certificates may be required for sick leave exceeding 2 days.</p>
                      </div>

                      <div className="flex gap-4 pt-2">
                          <button 
                            type="button" 
                            onClick={() => setShowRequestModal(false)}
                            className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition"
                          >
                              Cancel
                          </button>
                          <button 
                            type="submit"
                            className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"
                          >
                              Submit Request
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default TeacherLeaves;
