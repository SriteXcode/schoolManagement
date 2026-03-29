import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOutletContext } from 'react-router-dom';
import { FaBook, FaCalendarAlt, FaCheckCircle, FaClock, FaFilter, FaTimes, FaRegCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const StudentHomework = () => {
  const { student } = useOutletContext();
  const [homework, setHomework] = useState([]);
  const [filteredHomework, setFilteredHomework] = useState([]);
  const [selectedHw, setSelectedHw] = useState(null);
  const [filters, setFilters] = useState({ subject: 'All', timeframe: 'All' });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomework = async () => {
      if (!student || !student.sClass) return;
      try {
        const res = await api.get(`/homework/${student.sClass._id}`);
        setHomework(res.data);
        
        // Extract unique subjects
        const subList = ['All', ...new Set(res.data.map(h => h.subject))];
        setSubjects(subList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomework();
  }, [student]);

  useEffect(() => {
    let filtered = [...homework];

    // Filter by Subject
    if (filters.subject !== 'All') {
      filtered = filtered.filter(h => h.subject === filters.subject);
    }

    // Filter by Week (Timeframe)
    if (filters.timeframe === 'This Week') {
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      filtered = filtered.filter(h => new Date(h.date) >= weekStart);
    }

    setFilteredHomework(filtered);
  }, [filters, homework]);

  const updateStatus = async (homeworkId, newStatus) => {
    try {
      await api.put('/homework/status', { homeworkId, status: newStatus });
      setHomework(prev => prev.map(hw => 
        hw._id === homeworkId ? { ...hw, myStatus: newStatus } : hw
      ));
      if (selectedHw && selectedHw._id === homeworkId) {
        setSelectedHw(prev => ({ ...prev, myStatus: newStatus }));
      }
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Completed': return <FaCheckCircle className="text-emerald-500" />;
      case 'In Progress': return <FaClock className="text-amber-500" />;
      default: return <FaRegCircle className="text-slate-300" />;
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'In Progress': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getDaysRemaining = (dueDate) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due Today";
    if (diffDays === 1) return "Due Tomorrow";
    return `${diffDays} Days Left`;
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-fluid-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
             <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-600">
                <FaBook />
             </div>
             Curriculum Tasks
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 ml-14">Academic Homework & Deadlines</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-[2rem] shadow-soft border border-slate-50">
           <div className="flex items-center gap-2 px-4 border-r border-slate-100">
              <FaFilter className="text-slate-400 text-xs" />
              <select 
                className="bg-transparent text-xs font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer"
                value={filters.subject}
                onChange={e => setFilters({...filters, subject: e.target.value})}
              >
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
           </div>
           <div className="px-4">
              <select 
                className="bg-transparent text-xs font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer"
                value={filters.timeframe}
                onChange={e => setFilters({...filters, timeframe: e.target.value})}
              >
                <option value="All">All Time</option>
                <option value="This Week">This Week</option>
              </select>
           </div>
        </div>
      </div>

      {/* Homework Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-white rounded-[2.5rem] animate-pulse shadow-soft"></div>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHomework.map(hw => {
                const daysRemaining = getDaysRemaining(hw.dueDate);
                const isUrgent = daysRemaining === "Due Today" || daysRemaining === "Due Tomorrow" || daysRemaining === "Overdue" || (parseInt(daysRemaining) <= 3 && hw.myStatus !== 'Completed');

                return (
                    <div 
                        key={hw._id} 
                        onClick={() => setSelectedHw(hw)}
                        className="bg-white p-6 rounded-[2rem] shadow-soft hover:shadow-xl transition-all group cursor-pointer border border-transparent hover:border-indigo-100 flex flex-col h-full relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg border ${getStatusBg(hw.myStatus)}`}>
                                {hw.myStatus || 'Not Started'}
                            </span>
                            <div className="text-slate-300 group-hover:text-indigo-500 transition-colors">
                                {getStatusIcon(hw.myStatus)}
                            </div>
                        </div>

                        <div className="flex-1">
                            <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">{hw.subject}</h4>
                            <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-3">{hw.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{hw.description}</p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                                {hw.myStatus !== 'Completed' && (
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 ${isUrgent ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {daysRemaining}
                                    </span>
                                )}
                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    <FaCalendarAlt className="text-indigo-300 text-[8px]" />
                                    <span>Due {new Date(hw.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                                <FaBook className="text-[10px]" />
                            </div>
                        </div>

                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-colors"></div>
                    </div>
                );
            })}
            {filteredHomework.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-[3rem] shadow-soft border-2 border-dashed border-slate-100">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaBook className="text-slate-300 text-2xl" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">No tasks found!</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Enjoy your free time or adjust filters.</p>
                </div>
            )}
        </div>
      )}

      {/* Details Popup */}
      {selectedHw && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md transition-all duration-300" onClick={() => setSelectedHw(null)}>
            <div 
                className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white/20 animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={() => setSelectedHw(null)}
                    className="absolute top-6 right-6 p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors z-20"
                >
                    <FaTimes size={14}/>
                </button>

                <div className="p-8 md:p-10 text-left overflow-y-auto scrollbar-hide flex-1">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-indigo-50 px-3 py-1 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-widest">{selectedHw.subject}</div>
                        <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <FaCalendarAlt className="text-indigo-300" />
                            Due {new Date(selectedHw.dueDate).toLocaleDateString()}
                        </div>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 leading-tight tracking-tight">{selectedHw.title}</h2>
                    
                    <div className="bg-slate-50 p-6 rounded-3xl mb-8 border border-slate-100/50">
                        <p className="text-slate-600 text-base leading-relaxed whitespace-pre-wrap">{selectedHw.description || "No specific instructions provided."}</p>
                    </div>

                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Your Progress</h4>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${getStatusBg(selectedHw.myStatus)}`}>
                                Current: {selectedHw.myStatus || 'Not Started'}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {['Not Started', 'In Progress', 'Completed'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => updateStatus(selectedHw._id, status)}
                                    className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border-2 ${
                                        selectedHw.myStatus === status 
                                        ? (status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' : 
                                           status === 'In Progress' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100' : 
                                           'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-100')
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default StudentHomework;
