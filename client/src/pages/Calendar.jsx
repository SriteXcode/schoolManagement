import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaPlus, FaTrash, FaEdit, FaTimes, FaExternalLinkAlt, FaInfoCircle, FaClock, FaBook, FaBullhorn, FaCalendarDay, FaCalendarWeek } from 'react-icons/fa';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Calendar = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  const [showDayModal, setShowDayModal] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  
  const [user, setUser] = useState(null);

  // Filter for Upcoming Section
  const [upcomingFilter, setUpcomingFilter] = useState('month'); // 'week' or 'month'

  // Form State
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Event',
    instructions: '',
    date: ''
  });

  useEffect(() => {
    const userString = localStorage.getItem('user');
    const userData = userString ? JSON.parse(userString) : null;
    setUser(userData);
    fetchData(userData);
  }, []);

  const fetchData = async (userData) => {
    try {
      const [eventsRes, examsRes, classesRes] = await Promise.all([
        api.get('/events/getall'),
        api.get('/exam/all'),
        api.get('/class/getall')
      ]);
      
      // Admin and Management can see events
      setEvents(eventsRes.data);
      setExams(examsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      console.error('Failed to fetch data');
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const offset = clickedDate.getTimezoneOffset();
    const adjustedDate = new Date(clickedDate.getTime() - (offset*60*1000));
    setSelectedDate(adjustedDate);
    setShowDayModal(true);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    const dateVal = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    setFormData({
        title: '',
        description: '',
        type: 'Event',
        instructions: '',
        date: dateVal
    });
    setShowAddEditModal(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setFormData({
        ...item,
        date: new Date(item.date).toISOString().split('T')[0]
    });
    setShowAddEditModal(true);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this event?`)) return;
    try {
      await api.delete(`/events/delete/${id}`);
      toast.success(`Event deleted`);
      fetchData(user);
    } catch (error) {
      toast.error(`Failed to delete event`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
          await api.put(`/events/update/${editingItem._id}`, formData);
          toast.success('Event updated successfully!');
      } else {
          await api.post('/events/create', formData);
          toast.success('Event added successfully!');
      }
      setShowAddEditModal(false);
      fetchData(user);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${editingItem ? 'update' : 'add'} event`);
    }
  };

  const handleMoreDetail = (exam) => {
    if (user?.role === 'Student') {
        const studentClassId = user.sClass?._id || user.sClass || localStorage.getItem('classId');
        const examClassId = exam.sClass?._id || exam.sClass;
        if (studentClassId && examClassId && studentClassId !== examClassId) {
            toast.error("This exam does not belong to your class.");
            return;
        }
    }
    navigate('/student/exams');
  };

  const navigateToGallery = (item) => {
      navigate(`/gallery?category=${item.title || item.subject}`);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 sm:h-24 md:h-32 bg-slate-50/50 border border-slate-100"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateString = date.toDateString();
      
      const dayEvents = events.filter(e => new Date(e.date).toDateString() === dateString);
      const dayExams = exams.filter(e => new Date(e.date).toDateString() === dateString);
      const allDayItems = [...dayEvents.map(e => ({...e, itemType: 'Event'})), ...dayExams.map(e => ({...e, itemType: 'Exam'}))];

      days.push(
        <div 
          key={day} 
          onClick={() => handleDateClick(day)}
          className={`h-20 sm:h-24 md:h-32 border border-slate-100 p-1 sm:p-2 relative cursor-pointer hover:bg-indigo-50/50 transition-all overflow-hidden group ${
            new Date().toDateString() === dateString ? 'bg-indigo-50/50' : 'bg-white'
          }`}
        >
          <span className={`text-xs sm:text-sm font-black ${new Date().toDateString() === dateString ? 'text-indigo-600' : 'text-slate-300'}`}>{day}</span>
          <div className="mt-0.5 sm:mt-1 space-y-0.5">
            {allDayItems.slice(0, 3).map((item, idx) => (
              <div 
                key={idx} 
                className={`text-[7px] sm:text-[9px] px-1 py-0.5 rounded sm:rounded-md truncate text-white font-bold shadow-sm ${
                  item.itemType === 'Exam' ? 'bg-rose-500' : 
                  item.type === 'Holiday' ? 'bg-slate-400' : 'bg-indigo-500'
                }`}
              >
                {item.title || item.subject}
              </div>
            ))}
            {allDayItems.length > 3 && (
                <div className="text-[7px] sm:text-[8px] font-black text-slate-400 text-center uppercase tracking-tighter">
                    + {allDayItems.length - 3} more
                </div>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  const getUpcomingItems = () => {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const filterDate = new Date();
      if (upcomingFilter === 'week') {
          filterDate.setDate(today.getDate() + 7);
      } else {
          filterDate.setMonth(today.getMonth() + 1);
      }

      const upcomingEvents = events.filter(e => {
          const d = new Date(e.date);
          return d >= today && d <= filterDate;
      }).map(e => ({...e, itemType: 'Event'}));

      const upcomingExams = exams.filter(e => {
          const d = new Date(e.date);
          return d >= today && d <= filterDate;
      }).map(e => ({...e, itemType: 'Exam'}));

      return [...upcomingEvents, ...upcomingExams].sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const upcomingItems = getUpcomingItems();

  const isEditable = user?.role === 'ManagementCell' || user?.role === 'Admin';

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
        {/* Responsive Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="text-left">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-3 sm:gap-4">
                    <div className="p-2.5 sm:p-3 bg-indigo-600 text-white rounded-2xl sm:rounded-[1.5rem] shadow-xl shadow-indigo-100">
                        <FaCalendarAlt size={24} className="sm:w-7 sm:h-7" />
                    </div>
                    Institutional Timeline
                </h1>
                <p className="text-slate-500 font-bold uppercase text-[10px] sm:text-xs tracking-[0.2em] mt-3 ml-1">Academic Calendar & Scheduling</p>
            </div>
            {isEditable && (
                <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 text-indigo-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-sm">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                    Institutional Control Mode
                </div>
            )}
        </div>

        {/* Main Calendar View */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-soft-xl overflow-hidden border border-slate-100">
            {/* Calendar Controls */}
            <div className="p-6 sm:p-8 md:p-10 flex justify-between items-center border-b border-slate-50">
                <button onClick={handlePrevMonth} className="p-3 sm:p-4 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-sm"><FaChevronLeft /></button>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={handleNextMonth} className="p-3 sm:p-4 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-sm"><FaChevronRight /></button>
            </div>

            {/* Weekdays Labels */}
            <div className="grid grid-cols-7 text-slate-400 font-black text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-center py-4 sm:py-6 bg-slate-50/50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 bg-white">
                {renderCalendarDays()}
            </div>
        </div>

        {/* Legend for Large Screens */}
        <div className="hidden sm:flex flex-wrap gap-8 justify-center bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-indigo-500 rounded-lg shadow-sm"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Events & Activities</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-rose-500 rounded-lg shadow-sm"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Exams & Tests</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-slate-400 rounded-lg shadow-sm"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Holidays</span>
            </div>
        </div>

        {/* Upcoming Section */}
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="text-left">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Upcoming Schedule</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Real-time agenda overview</p>
                </div>
                
                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                    <button 
                        onClick={() => setUpcomingFilter('week')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${upcomingFilter === 'week' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <FaCalendarWeek /> 7 Days
                    </button>
                    <button 
                        onClick={() => setUpcomingFilter('month')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${upcomingFilter === 'month' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <FaCalendarDay /> 30 Days
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingItems.length > 0 ? upcomingItems.map((item, idx) => (
                    <motion.div 
                        key={`${item.itemType}-${item._id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`group p-6 rounded-[2rem] border transition-all cursor-pointer hover:shadow-xl ${
                            item.itemType === 'Exam' ? 'bg-rose-50/30 border-rose-100 hover:bg-white' : 'bg-indigo-50/30 border-indigo-100 hover:bg-white'
                        }`}
                        onClick={() => {
                            setSelectedDate(new Date(item.date));
                            setShowDayModal(true);
                        }}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                                    item.itemType === 'Exam' ? 'bg-white text-rose-600' : 'bg-white text-indigo-600'
                                }`}>
                                    {item.itemType === 'Exam' ? <FaBook /> : <FaBullhorn />}
                                </div>
                                <div className="text-left">
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${item.itemType === 'Exam' ? 'text-rose-500' : 'text-indigo-500'}`}>{item.itemType}</span>
                                    <h4 className="font-black text-slate-800 text-fluid-base truncate max-w-[150px]">{item.title || item.subject}</h4>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-slate-900 leading-none">{new Date(item.date).getDate()}</div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.date).toLocaleString('default', { month: 'short' })}</div>
                            </div>
                        </div>
                        
                        <p className="text-xs font-bold text-slate-500 line-clamp-2 text-left mb-6 min-h-[2.5rem]">
                            {item.description || item.name || 'Official scheduled assessment/activity.'}
                        </p>

                        <div className="flex items-center justify-between pt-5 border-t border-slate-100/50">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                <FaClock className={item.itemType === 'Exam' ? 'text-rose-400' : 'text-indigo-400'} />
                                {item.time || 'Full Day'}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); navigateToGallery(item); }} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-teal-50 hover:text-teal-600 transition-colors shadow-sm"><FaExternalLinkAlt size={10} /></button>
                                {item.itemType === 'Exam' && (
                                    <button onClick={(e) => { e.stopPropagation(); handleMoreDetail(item); }} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm"><FaInfoCircle size={12} /></button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )) : (
                    <div className="col-span-full py-20 bg-white rounded-[2.5rem] border border-slate-100 border-dashed text-center">
                        <p className="text-slate-400 font-bold italic">No upcoming agenda found for this period.</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Day Details Popup Modal */}
      <AnimatePresence>
        {showDayModal && selectedDate && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
            onClick={() => setShowDayModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 sm:p-12">
                  <div className="flex justify-between items-start mb-8 sm:mb-10">
                      <div className="text-left pr-8">
                          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                          </h3>
                          <div className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Daily Schedule Log</div>
                      </div>
                      <button onClick={() => setShowDayModal(false)} className="p-3 bg-slate-100 text-slate-400 rounded-xl sm:rounded-2xl hover:bg-slate-200 transition-colors">
                          <FaTimes />
                      </button>
                  </div>

                  <div className="space-y-4 sm:space-y-6 max-h-[50vh] overflow-y-auto pr-2 sm:pr-4 custom-scrollbar">
                      {(() => {
                          const dateString = selectedDate.toDateString();
                          const dayEvents = events.filter(e => new Date(e.date).toDateString() === dateString);
                          const dayExams = exams.filter(e => new Date(e.date).toDateString() === dateString);
                          
                          if (dayEvents.length === 0 && dayExams.length === 0) {
                              return (
                                  <div className="py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                                      <p className="text-slate-400 font-bold italic">No institutional items scheduled for this date.</p>
                                  </div>
                              );
                          }

                          return (
                              <div className="space-y-4">
                                  {dayEvents.map(e => (
                                      <div key={e._id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 sm:p-6 bg-indigo-50/50 rounded-2xl sm:rounded-3xl border border-indigo-100/50 hover:bg-white hover:shadow-lg transition-all gap-4">
                                          <div className="flex items-center gap-4 sm:gap-6 text-left">
                                              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50 shrink-0">
                                                  <FaBullhorn size={18} />
                                              </div>
                                              <div>
                                                  <h4 className="font-black text-slate-900 text-sm sm:text-base">{e.title}</h4>
                                                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 mt-1 line-clamp-1">{e.description}</p>
                                                  <div className="flex items-center gap-3 mt-3">
                                                      <span className="text-[8px] sm:text-[9px] font-black uppercase text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-100">{e.type}</span>
                                                      <button onClick={() => navigateToGallery(e)} className="text-[8px] sm:text-[9px] font-black text-teal-600 flex items-center gap-1 hover:underline">
                                                          <FaExternalLinkAlt size={8} /> Gallery
                                                      </button>
                                                  </div>
                                              </div>
                                          </div>
                                          {isEditable && (
                                              <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-center">
                                                  <button onClick={() => handleEditItem(e)} className="p-2.5 bg-white text-indigo-600 rounded-xl shadow-sm hover:bg-indigo-600 hover:text-white transition-all"><FaEdit size={14}/></button>
                                                  <button onClick={() => handleDeleteItem(e._id)} className="p-2.5 bg-white text-rose-600 rounded-xl shadow-sm hover:bg-rose-600 hover:text-white transition-all"><FaTrash size={14}/></button>
                                              </div>
                                          )}
                                      </div>
                                  ))}
                                  {dayExams.map(e => (
                                      <div key={e._id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 sm:p-6 bg-rose-50/50 rounded-2xl sm:rounded-3xl border border-rose-100/50 hover:bg-white hover:shadow-lg transition-all gap-4">
                                          <div className="flex items-center gap-4 sm:gap-6 text-left">
                                              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-rose-600 shadow-sm border border-rose-50 shrink-0">
                                                  <FaBook size={18} />
                                              </div>
                                              <div>
                                                  <h4 className="font-black text-slate-900 text-sm sm:text-base">{e.subject} <span className="text-rose-500 text-xs font-bold">({e.name})</span></h4>
                                                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                                                      <FaClock className="text-rose-400" /> {e.time} ({e.shift})
                                                  </p>
                                                  <div className="flex items-center gap-4 mt-3">
                                                      <span className="text-[8px] sm:text-[9px] font-black uppercase text-rose-600 bg-white px-2 py-0.5 rounded border border-rose-100">{e.type}</span>
                                                      <button onClick={() => handleMoreDetail(e)} className="text-[8px] sm:text-[9px] font-black text-indigo-600 flex items-center gap-1 hover:underline">
                                                          <FaInfoCircle size={9} /> Details
                                                      </button>
                                                      <button onClick={() => navigateToGallery(e)} className="text-[8px] sm:text-[9px] font-black text-teal-600 flex items-center gap-1 hover:underline">
                                                          <FaExternalLinkAlt size={8} /> Gallery
                                                      </button>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          );
                      })()}
                  </div>

                  {isEditable && (
                      <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-4">
                          <button 
                            onClick={() => handleAddItem()}
                            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                          >
                              <FaPlus /> Add Institutional Event
                          </button>
                      </div>
                  )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddEditModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[60]"
            onClick={() => setShowAddEditModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20"
              onClick={e => e.stopPropagation()}
            >
              <div className={`p-6 sm:p-8 text-white flex justify-between items-center bg-indigo-600`}>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">{editingItem ? 'Edit' : 'Add New'} Event</h3>
                  <button onClick={() => setShowAddEditModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                      <FaTimes />
                  </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-4 sm:space-y-6 text-left max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Event Title</label>
                    <input 
                        type="text" required
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700 transition-all outline-none"
                        placeholder="Annual Day, Holi Celebration..."
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Category Type</label>
                    <select 
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700 transition-all outline-none"
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                        <option value="Event">Event</option>
                        <option value="Holiday">Holiday</option>
                        <option value="Exam">Exam Info</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Celebration">Celebration</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Description</label>
                    <textarea 
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700 transition-all outline-none"
                        rows="3"
                        placeholder="Briefly describe the event details..."
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    ></textarea>
                </div>
                {formData.type === 'Celebration' && (
                    <div>
                        <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 px-1">Special Instructions</label>
                        <textarea 
                            className="w-full p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700 transition-all outline-none"
                            rows="2"
                            placeholder="Dress code, items to bring..."
                            value={formData.instructions}
                            onChange={e => setFormData({...formData, instructions: e.target.value})}
                        ></textarea>
                    </div>
                )}
                
                <div className="flex gap-4 pt-4 sm:pt-6">
                    <button type="button" onClick={() => setShowAddEditModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">Cancel</button>
                    <button type="submit" className={`flex-[2] py-4 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700`}>
                        {editingItem ? 'Save Changes' : `Add Event`}
                    </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Calendar;