import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaPlus, FaTrash } from 'react-icons/fa';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Event',
    instructions: ''
  });

  useEffect(() => {
    fetchEvents();
    checkAdmin();
  }, []);

  const checkAdmin = () => {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    if (user && user.role === 'Admin') {
      setIsAdmin(true);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events/getall');
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events');
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
    // Adjust for timezone offset to ensure correct date string
    const offset = clickedDate.getTimezoneOffset();
    const adjustedDate = new Date(clickedDate.getTime() - (offset*60*1000));
    
    setSelectedDate(adjustedDate);
    if (isAdmin) {
      setFormData(prev => ({ ...prev, date: adjustedDate.toISOString().split('T')[0] }));
      setShowModal(true);
    }
  };

  const handleDeleteEvent = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`/events/delete/${id}`);
      toast.success('Event deleted');
      fetchEvents();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events/create', {
        ...formData,
        date: selectedDate
      });
      toast.success('Event added successfully!');
      setShowModal(false);
      setFormData({ title: '', description: '', type: 'Event', instructions: '' });
      fetchEvents();
    } catch (error) {
      toast.error('Failed to add event');
    }
  };

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-100"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      const dayEvents = events.filter(e => new Date(e.date).toDateString() === dateString);

      days.push(
        <div 
          key={day} 
          onClick={() => handleDateClick(day)}
          className={`h-24 border border-gray-100 p-2 relative cursor-pointer hover:bg-indigo-50 transition overflow-hidden group ${
            new Date().toDateString() === dateString ? 'bg-indigo-50 font-bold' : 'bg-white'
          }`}
        >
          <span className="text-gray-700">{day}</span>
          <div className="mt-1 space-y-1">
            {dayEvents.map((event, idx) => (
              <div 
                key={idx} 
                className={`text-xs px-1 rounded truncate text-white flex justify-between items-center ${
                  event.type === 'Holiday' ? 'bg-gray-400' :
                  'bg-blue-500'
                }`}
                title={event.title}
              >
                <span>{event.title}</span>
                {isAdmin && (
                  <FaTrash 
                    className="ml-1 opacity-0 group-hover:opacity-100 hover:text-red-800 cursor-pointer"
                    onClick={(e) => handleDeleteEvent(event._id, e)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-extrabold text-slate-800 flex items-center gap-4">
                <FaCalendarAlt className="text-indigo-600" /> School Calendar
            </h1>
            {isAdmin && <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-semibold">Admin Mode: Click Date to Add Event</span>}
        </div>

        {/* Calendar Header */}
        <div className="bg-white rounded-t-2xl p-4 flex justify-between items-center shadow-sm">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full"><FaChevronLeft /></button>
          <h2 className="text-2xl font-bold text-indigo-900">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full"><FaChevronRight /></button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white shadow-xl rounded-b-2xl overflow-hidden mb-8">
          <div className="grid grid-cols-7 bg-indigo-600 text-white font-bold text-center py-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {renderCalendarDays()}
          </div>
        </div>

        {/* Upcoming Events List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Upcoming Events</h3>
            <div className="space-y-4">
                {events.filter(e => new Date(e.date) >= new Date()).slice(0, 5).map((e, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-indigo-500">
                        <div className="text-center w-16">
                            <div className="text-xs font-bold text-gray-500 uppercase">{new Date(e.date).toLocaleString('default', { month: 'short' })}</div>
                            <div className="text-xl font-bold text-indigo-700">{new Date(e.date).getDate()}</div>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">{e.title} <span className="text-xs font-normal text-gray-500">({e.type})</span></h4>
                            <p className="text-sm text-gray-600">{e.description}</p>
                            {e.instructions && (
                                <p className="text-sm text-pink-600 mt-1 italic">Note: {e.instructions}</p>
                            )}
                        </div>
                    </div>
                ))}
                {events.length === 0 && <p className="text-gray-500">No upcoming events.</p>}
            </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Add Event for {selectedDate?.toDateString()}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                    <input 
                        type="text" required
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                    <select 
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                        <option value="Event">Event</option>
                        <option value="Holiday">Holiday</option>
                        <option value="Exam">Exam</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Celebration">Celebration</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                    <textarea 
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
                        rows="3"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    ></textarea>
                </div>
                {formData.type === 'Celebration' && (
                    <div>
                        <label className="block text-sm font-semibold text-pink-600 mb-1">Instructions</label>
                        <textarea 
                            className="w-full p-2 border border-pink-200 rounded focus:ring-2 focus:ring-pink-500 bg-pink-50"
                            rows="2"
                            placeholder="Dress code, items to bring, etc."
                            value={formData.instructions}
                            onChange={e => setFormData({...formData, instructions: e.target.value})}
                        ></textarea>
                    </div>
                )}
                
                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700">Add Event</button>
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