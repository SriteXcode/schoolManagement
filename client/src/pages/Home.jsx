import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserGraduate, FaChalkboardTeacher, FaSchool, FaPaperPlane, FaChevronLeft, FaChevronRight, FaClock, FaBook, FaBullhorn, FaCalendarAlt, FaExternalLinkAlt, FaInfoCircle, FaTimes } from 'react-icons/fa';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Home = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [carouselItems, setCarouselItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [upcomingItems, setUpcomingItems] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [upcomingFilter, setUpcomingFilter] = useState('month'); // 'week' or 'month'
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
        setUser(JSON.parse(userString));
    }

    const fetchInitialData = async () => {
        try {
            const carouselRes = await api.get('/management/carousel/all');
            setCarouselItems(carouselRes.data);
        } catch (e) {}
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
      if (user) {
          fetchUpcoming();
      }
  }, [user, upcomingFilter]);

  const fetchUpcoming = async () => {
      setLoadingUpcoming(true);
      try {
          const eventsRes = await api.get('/events/getall');
          let examsRes = { data: [] };
          
          if (user.role === 'Student') {
              let classId = user.sClass?._id || user.sClass || localStorage.getItem('classId');
              
              if (!classId) {
                  try {
                    const profile = await api.get('/student/profile');
                    if (profile.data?.sClass?._id) {
                        classId = profile.data.sClass._id;
                        localStorage.setItem('classId', classId);
                        localStorage.setItem('studentId', profile.data._id);
                    }
                  } catch (e) {
                      console.error("Profile fetch failed", e);
                  }
              }
              
              if (classId) {
                  examsRes = await api.get(`/exam/${classId}`);
              }
          } else {
              examsRes = await api.get('/exam/all');
          }

          // In this turn, Admin can edit calendar, so I assume they should see events too.
          const allEvents = (eventsRes.data || []).map(e => ({ ...e, itemType: 'Event' }));
          const allExams = (examsRes.data || []).map(e => ({ ...e, itemType: 'Exam' }));
          
          const today = new Date();
          today.setHours(0,0,0,0);
          const filterDate = new Date();
          if (upcomingFilter === 'week') filterDate.setDate(today.getDate() + 7);
          else filterDate.setMonth(today.getMonth() + 1);

          const combined = [...allEvents, ...allExams]
            .filter(item => {
                const d = new Date(item.date);
                return d >= today && d <= filterDate;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

          setUpcomingItems(combined); 
      } catch (err) {
          console.error("Failed to fetch upcoming items", err);
      } finally {
          setLoadingUpcoming(false);
      }
  };

  useEffect(() => {
      if (carouselItems.length > 0) {
          const timer = setInterval(() => {
              setCurrentIndex(prev => (prev + 1) % carouselItems.length);
          }, 5000);
          return () => clearInterval(timer);
      }
  }, [carouselItems]);

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/comms/send', { ...formData, type: 'Contact' });
      toast.success('Message sent! We will contact you soon.');
      setFormData({ name: '', email: '', message: '' });
    } catch (e) {
      toast.error('Failed to send message');
    }
  };

  const handleMoreDetail = (item) => {
    if (item.itemType === 'Exam') {
        if (user?.role === 'Student') {
            const studentClassId = user.sClass?._id || user.sClass || localStorage.getItem('classId');
            const examClassId = item.sClass?._id || item.sClass;
            if (studentClassId && examClassId && studentClassId !== examClassId) {
                toast.error("This exam does not belong to your class.");
                return;
            }
        }
        navigate('/student/exams');
    } else {
        setSelectedItem(item);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-x-hidden">
      
      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center items-center text-center px-4 pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-indigo-50/50 text-indigo-700 px-4 py-1 rounded-full text-sm font-bold mb-6"
        >
          ✨ Modern School Management
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-hero font-black text-slate-900 mb-6 tracking-tight leading-tight"
        >
          Manage Your School <br className="hidden md:block" />
          <span className="text-indigo-600">With Ease</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-fluid-lg text-slate-500 max-w-2xl mb-12 leading-relaxed"
        >
          A seamless, borderless platform for Students, Teachers, and Admin to achieve academic excellence.
        </motion.p>

        {/* Carousel Section */}
        {carouselItems.length > 0 && (
            <div className="w-full max-w-6xl h-[300px] md:h-[500px] relative rounded-[3rem] overflow-hidden shadow-2xl mb-20 group">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                    >
                        <img 
                            src={carouselItems[currentIndex].image} 
                            alt={carouselItems[currentIndex].title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-16 text-left">
                            <motion.h2 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-white text-3xl md:text-5xl font-black mb-2"
                            >
                                {carouselItems[currentIndex].title}
                            </motion.h2>
                            <motion.p 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-white/80 text-lg md:text-xl font-bold"
                            >
                                {carouselItems[currentIndex].subtitle}
                            </motion.p>
                        </div>
                    </motion.div>
                </AnimatePresence>
                
                <button 
                    onClick={() => setCurrentIndex(prev => (prev - 1 + carouselItems.length) % carouselItems.length)}
                    className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                >
                    <FaChevronLeft />
                </button>
                <button 
                    onClick={() => setCurrentIndex(prev => (prev + 1) % carouselItems.length)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                >
                    <FaChevronRight />
                </button>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                    {carouselItems.map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => setCurrentIndex(i)}
                            className={`w-3 h-3 rounded-full transition-all ${currentIndex === i ? 'bg-indigo-500 w-8' : 'bg-white/30 hover:bg-white/50'}`}
                        />
                    ))}
                </div>
            </div>
        )}

        {/* Upcoming Section (Horizontal Scroll) */}
        {user && (
            <div className="w-full max-w-7xl mb-24 px-4 text-left">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 max-w-6xl mx-auto">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Your Upcoming Schedule</h2>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Don't miss out on important dates</p>
                    </div>
                    
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                        <button 
                            onClick={() => setUpcomingFilter('week')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${upcomingFilter === 'week' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Next 7 Days
                        </button>
                        <button 
                            onClick={() => setUpcomingFilter('month')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${upcomingFilter === 'month' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            This Month
                        </button>
                    </div>
                </div>

                {loadingUpcoming ? (
                    <div className="py-20 text-center text-slate-300 font-black animate-pulse uppercase tracking-[0.2em]">Syncing Calendar...</div>
                ) : (
                    <div className="flex gap-8 overflow-x-auto pb-12 pt-4 px-4 snap-x snap-mandatory scrollbar-hide custom-scrollbar">
                        {upcomingItems.length > 0 ? upcomingItems.map((item, idx) => (
                            <motion.div 
                                key={`${item.itemType}-${item._id}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`min-w-[320px] md:min-w-[380px] group p-8 rounded-[2.5rem] border transition-all cursor-pointer hover:shadow-2xl hover:bg-white snap-center ${
                                    item.itemType === 'Exam' ? 'bg-rose-50/30 border-rose-100' : 'bg-indigo-50/30 border-indigo-100'
                                }`}
                                onClick={() => navigate('/calendar')}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                                            item.itemType === 'Exam' ? 'bg-white text-rose-600' : 'bg-white text-indigo-600'
                                        }`}>
                                            {item.itemType === 'Exam' ? <FaBook size={20} /> : <FaBullhorn size={20} />}
                                        </div>
                                        <div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${item.itemType === 'Exam' ? 'text-rose-500' : 'text-indigo-500'}`}>{item.itemType}</span>
                                            <h4 className="font-black text-slate-800 text-xl truncate max-w-[180px] mt-0.5">{item.title || item.subject}</h4>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-slate-900 leading-none">{new Date(item.date).getDate()}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(item.date).toLocaleString('default', { month: 'short' })}</div>
                                    </div>
                                </div>
                                
                                <p className="text-sm font-bold text-slate-500 line-clamp-2 mb-8 leading-relaxed">
                                    {item.description || item.name || 'Important assessment scheduled.'}
                                </p>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-200/50">
                                    <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <FaClock className={item.itemType === 'Exam' ? 'text-rose-400' : 'text-indigo-400'} size={12} />
                                        {item.time || 'Full Day'}
                                    </div>
                                    <div className="flex gap-3">
                                        <Link 
                                            to={`/gallery?category=${item.title || item.subject}`} 
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-10 h-10 rounded-xl bg-white text-slate-400 flex items-center justify-center hover:bg-teal-50 hover:text-teal-600 transition-all shadow-sm"
                                        >
                                            <FaExternalLinkAlt size={12} />
                                        </Link>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleMoreDetail(item); }}
                                            className="w-10 h-10 rounded-xl bg-white text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"
                                        >
                                            <FaInfoCircle size={14} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="w-full py-24 bg-white rounded-[3rem] border border-slate-100 border-dashed text-center">
                                <FaCalendarAlt size={48} className="text-slate-100 mx-auto mb-6" />
                                <p className="text-slate-400 font-bold italic text-lg">Your schedule is clear for this period.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* Explore Section */}
        <div className="w-full max-w-6xl mb-20 px-4">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-8">Explore</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            <QuickLink to="/wall-of-fame" label="Wall of Fame" color="bg-orange-50 text-orange-600" />
            <QuickLink to="/achievements" label="Achievements" color="bg-emerald-50 text-emerald-600" />
            <QuickLink to="/gallery" label="Gallery" color="bg-indigo-50 text-indigo-600" />
            <QuickLink to="/calendar" label="Calendar" color="bg-blue-50 text-blue-600" />
            <QuickLink to="/notices" label="Notices" color="bg-purple-50 text-purple-600" />
          </div>
        </div>

        {/* Contact Section */}
        <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-soft-xl overflow-hidden flex flex-col md:flex-row mx-4">
            <div className="bg-slate-900 p-8 md:p-12 text-white text-left md:w-2/5">
                <h3 className="text-3xl font-black mb-6 tracking-tight">Contact Us</h3>
                <p className="text-slate-400 mb-10 text-lg">Have questions? We are here to help you get started.</p>
                <div className="space-y-6 text-slate-300">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-800 p-3 rounded-2xl">📍</div>
                        <p>123 Education Lane, City</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-800 p-3 rounded-2xl">📞</div>
                        <p>+1 234 567 890</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-800 p-3 rounded-2xl">✉️</div>
                        <p>info@edumanage.com</p>
                    </div>
                </div>
            </div>
            <div className="p-8 md:p-12 md:w-3/5 text-left">
                <form onSubmit={handleSend} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Name</label>
                            <input 
                                type="text" placeholder="Your full name" required 
                                className="p-4 bg-slate-50 border-none rounded-2xl w-full focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Email</label>
                            <input 
                                type="email" placeholder="email@example.com" required 
                                className="p-4 bg-slate-50 border-none rounded-2xl w-full focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 ml-1">Message</label>
                        <textarea 
                            placeholder="Tell us more..." rows="4" required 
                            className="p-4 bg-slate-50 border-none rounded-2xl w-full focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                            value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                        ></textarea>
                    </div>
                    <button className="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                        <FaPaperPlane /> Send Message
                    </button>
                </form>
            </div>
        </div>

      </div>

      {/* Event Details Modal */}
      <AnimatePresence>
          {selectedItem && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6"
                onClick={() => setSelectedItem(null)}
              >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/20"
                    onClick={e => e.stopPropagation()}
                  >
                      <button 
                        onClick={() => setSelectedItem(null)}
                        className="absolute top-8 right-8 p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors z-20"
                      >
                          <FaTimes />
                      </button>

                      <div className="p-12 md:p-16 text-left">
                          <div className="flex items-center gap-4 mb-8">
                              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedItem.itemType === 'Exam' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                  {selectedItem.itemType} Log
                              </div>
                              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{new Date(selectedItem.date).toLocaleDateString()}</div>
                          </div>
                          
                          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 leading-tight tracking-tight">{selectedItem.title || selectedItem.subject}</h2>
                          
                          <div className="prose prose-slate max-w-none mb-10">
                              <p className="text-slate-600 text-lg leading-relaxed">{selectedItem.description || selectedItem.name}</p>
                              {selectedItem.instructions && (
                                  <div className="mt-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 italic text-slate-500">
                                      " {selectedItem.instructions} "
                                  </div>
                              )}
                          </div>

                          <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                               <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                                       <FaClock size={14} />
                                   </div>
                                   <div>
                                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Slot</div>
                                       <div className="text-slate-900 font-black">{selectedItem.time || 'Full Day Access'}</div>
                                   </div>
                               </div>
                               <button 
                                onClick={() => navigate('/calendar')}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 text-xs uppercase tracking-widest"
                               >
                                   Open Calendar
                               </button>
                          </div>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
      
      <footer className="p-10 text-center text-slate-400 text-sm border-t border-slate-100 bg-white mt-20">
        © 2026 EduManage System. All rights reserved.
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-white p-8 rounded-[2rem] shadow-soft hover:shadow-soft-xl transition-all duration-300 text-left group">
    <div className="mb-6 p-4 bg-indigo-50 w-fit rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">{icon}</div>
    <h3 className="text-xl font-black text-slate-800 mb-3 tracking-tight">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const QuickLink = ({ to, label, color }) => (
  <Link to={to} className={`${color} p-8 rounded-3xl font-black text-center hover:scale-[1.02] active:scale-95 transition-all shadow-sm flex items-center justify-center`}>
    {label}
  </Link>
);

export default Home;