import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaCheck, FaTimes, FaEnvelope, FaUserClock, FaExclamationCircle } from 'react-icons/fa';

const AdminInbox = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requests'); // requests | messages | incidents
  const [filter, setFilter] = useState('All'); // All | Problem | Feedback | Bus
  const [statusFilter, setStatusFilter] = useState('All');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, msgsRes, incidentsRes] = await Promise.all([
        api.get('/admin/users/pending'),
        api.get('/admin/comms/all'),
        api.get('/cells/discipline/all')
      ]);
      setPendingUsers(usersRes.data);
      setMessages(msgsRes.data);
      setIncidents(incidentsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredMessages = messages.filter(msg => {
      const matchesCategory = filter === 'All' || 
          (filter === 'Report' && msg.type === 'Problem') ||
          (filter === 'Feedback' && msg.type === 'Feedback') ||
          (filter === 'Bus' && msg.type === 'BusRequest');
      
      const matchesStatus = statusFilter === 'All' || msg.status === statusFilter;
      return matchesCategory && matchesStatus;
  });

  const handleUserStatus = async (id, status) => {
    try {
      await api.put('/admin/users/status', { id, status });
      toast.success(`User ${status}`);
      fetchData();
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleMessageStatus = async (id, status) => {
    try {
      await api.put('/management/messages/' + id + '/read', { status });
      toast.success(`Marked as ${status}`);
      fetchData();
    } catch (error) {
      toast.error("Action failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Admin Control Center</h1>
          
          {activeTab === 'messages' && (
              <div className="flex gap-3">
                  <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                      {['All', 'Report', 'Feedback', 'Bus'].map(cat => (
                          <button 
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filter === cat ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                          >
                              {cat}
                          </button>
                      ))}
                  </div>
                  <select 
                    className="bg-white px-4 py-1.5 rounded-xl shadow-sm border border-slate-100 text-[9px] font-black uppercase outline-none"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                      <option value="All">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Approved">Approved</option>
                  </select>
              </div>
          )}
      </div>
      
      {/* Tabs */}
      <div className="flex border-b overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-4 font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'requests' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Access Requests ({pendingUsers.length})
        </button>
        <button 
          onClick={() => setActiveTab('messages')}
          className={`px-6 py-4 font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'messages' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Institutional Feed ({messages.filter(m => m.status === 'Pending').length})
        </button>
        <button 
          onClick={() => setActiveTab('incidents')}
          className={`px-6 py-4 font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'incidents' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Student Reports ({incidents.filter(i => i.status === 'Open').length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-[2rem] shadow-soft border border-slate-100 p-8 min-h-[500px]">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="font-black text-slate-300 uppercase text-[10px] tracking-widest">Establishing secure uplink...</p>
            </div>
        ) : (
          <>
            {/* REQUESTS TAB */}
            {activeTab === 'requests' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {pendingUsers.length === 0 && (
                    <div className="text-center py-20">
                        <FaEnvelope className="mx-auto text-slate-100 text-6xl mb-4" />
                        <p className="text-slate-400 font-bold italic">No pending access requests.</p>
                    </div>
                )}
                {pendingUsers.map(user => (
                  <div key={user._id} className="flex flex-col md:flex-row justify-between items-center p-8 border border-slate-100 rounded-[2rem] bg-slate-50/50 hover:bg-white transition-all group">
                    <div className="flex items-center gap-6 mb-6 md:mb-0">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-100 transition-transform group-hover:scale-105">
                         {user.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-lg">{user.name}</h3>
                        <p className="text-sm font-bold text-slate-400">{user.email}</p>
                        <div className="flex gap-2 mt-2">
                            <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-widest">{user.role}</span>
                            <span className="text-[9px] font-black text-slate-400 bg-white border border-slate-100 px-2.5 py-1 rounded-full uppercase tracking-widest">{user.phone || 'NO PHONE'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                       <button onClick={() => handleUserStatus(user._id, 'Approved')} className="flex-1 md:flex-none px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:opacity-90 transition-all flex items-center justify-center gap-2">
                          <FaCheck /> Grant Access
                       </button>
                       <button onClick={() => handleUserStatus(user._id, 'Rejected')} className="flex-1 md:flex-none px-8 py-3 bg-white text-rose-600 border border-rose-100 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2">
                          <FaTimes /> Reject
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MESSAGES TAB */}
            {activeTab === 'messages' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {filteredMessages.length === 0 && (
                     <div className="text-center py-20">
                         <FaEnvelope className="mx-auto text-slate-100 text-6xl mb-4" />
                         <p className="text-slate-400 font-bold italic">No matching communications found.</p>
                     </div>
                )}
                {filteredMessages.map(msg => (
                  <div key={msg._id} className={`p-8 border rounded-[2.5rem] transition-all ${msg.status === 'Pending' ? 'bg-white border-indigo-100 shadow-xl shadow-indigo-50/50' : 'bg-slate-50/50 opacity-60 border-slate-100'}`}>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="flex-1">
                             <div className="flex items-center gap-3 mb-4">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                    msg.type === 'Problem' ? 'bg-rose-50 text-rose-600' : 
                                    msg.type === 'Feedback' ? 'bg-indigo-50 text-indigo-600' : 
                                    msg.type === 'BusRequest' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {msg.type} Log
                                </span>
                                {msg.recipient && (
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Directed to: {msg.recipient.name} ({msg.recipient.role})</span>
                                )}
                             </div>
                             
                             <h4 className="font-black text-slate-800 text-xl tracking-tight mb-2">
                                 <div className="flex items-center gap-3">
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${msg.isAnonymous ? 'bg-amber-600 text-white' : 'bg-slate-900 text-white'}`}>
                                         {(msg.user?.name || msg.name)?.charAt(0)}
                                     </div>
                                     <div>
                                        <div className="text-lg flex items-center gap-2">
                                            {msg.displayName || msg.user?.name || msg.name}
                                            {msg.isAnonymous && <span className="text-[8px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">Anonymous Mode</span>}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{msg.user?.email || msg.email} • {msg.user?.role || 'External'}</div>
                                     </div>
                                 </div>
                             </h4>
                             <p className="text-slate-600 font-medium text-base leading-relaxed mt-4 p-6 bg-slate-50 rounded-[1.5rem] italic">"{msg.message}"</p>
                             <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                <FaExclamationCircle size={12} /> Received: {new Date(msg.createdAt).toLocaleString()}
                             </div>
                        </div>
                        
                        <div className="pt-2">
                            {(msg.status === 'Pending' || msg.status === 'Unread') ? (
                                <div className="flex gap-2">
                                    {msg.type === 'BusRequest' && (
                                        <button onClick={() => handleMessageStatus(msg._id, 'Approved')} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:opacity-90">
                                            Approve
                                        </button>
                                    )}
                                    <button onClick={() => handleMessageStatus(msg._id, 'Solved')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:opacity-90">
                                        Solve
                                    </button>
                                </div>
                            ) : (
                                <div className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                    msg.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                    <FaCheck size={10} /> {msg.status}
                                </div>
                            )}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* INCIDENTS TAB */}
            {activeTab === 'incidents' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {incidents.length === 0 && (
                    <div className="text-center py-20">
                        <FaExclamationCircle className="mx-auto text-slate-100 text-6xl mb-4" />
                        <p className="text-slate-400 font-bold italic">No discipline incidents reported.</p>
                    </div>
                )}
                {incidents.map(incident => (
                  <div key={incident._id} className={`p-8 border rounded-[2.5rem] transition-all ${incident.status === 'Open' ? 'bg-white border-rose-100 shadow-xl shadow-rose-50/50' : 'bg-slate-50/50 opacity-60 border-slate-100'}`}>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="flex-1">
                             <div className="flex items-center gap-3 mb-4">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                    incident.severity === 'Critical' ? 'bg-red-600 text-white' : 
                                    incident.severity === 'High' ? 'bg-red-100 text-red-600' : 'bg-orange-50 text-orange-600'
                                }`}>
                                    {incident.incidentType} • {incident.severity} SEVERITY
                                </span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reported by: {incident.reportedBy?.name}</span>
                             </div>
                             
                             <div className="flex items-center gap-4 mb-4">
                                 <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white text-xl font-black">
                                     {incident.student?.name?.charAt(0)}
                                 </div>
                                 <div>
                                     <h4 className="font-black text-slate-800 text-xl tracking-tight">{incident.student?.name}</h4>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll: {incident.student?.rollNum}</p>
                                 </div>
                             </div>

                             <p className="text-slate-600 font-medium text-base leading-relaxed p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                                {incident.description}
                             </p>

                             {incident.teacherComment && (
                                 <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                     <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Administrative Note</p>
                                     <p className="text-sm font-bold text-indigo-600 italic">"{incident.teacherComment}"</p>
                                 </div>
                             )}
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border text-center ${
                                incident.status === 'Open' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                                {incident.status} Case
                            </div>
                            <button 
                                onClick={() => navigate('/cell/discipline/dashboard')}
                                className="px-6 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                            >
                                Detailed Review
                            </button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminInbox;
