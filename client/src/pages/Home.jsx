import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaUserGraduate, FaChalkboardTeacher, FaSchool, FaPaperPlane, 
    FaChevronLeft, FaChevronRight, FaClock, FaBook, FaBullhorn, 
    FaCalendarAlt, FaExternalLinkAlt, FaInfoCircle, FaTimes, 
    FaLayerGroup, FaEye, FaBullseye, FaQuoteLeft, FaFilePdf, 
    FaWifi, FaLaptopCode, FaMicroscope, FaMusic, FaBasketballBall, 
    FaCertificate, FaMobileAlt, FaGamepad, FaRocket
} from 'react-icons/fa';
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
  const [showProspectusPreview, setShowProspectusPreview] = useState(false);
  
  const [user, setUser] = useState(null);

  // Universal Timetable State
  const [allExams, setAllExams] = useState([]);
  const [selectedExamCode, setSelectedExamCode] = useState('');
  const [loadingUniversal, setLoadingUniversal] = useState(false);

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
          fetchUniversalExams();
      }
  }, [user, upcomingFilter]);

  const fetchUniversalExams = async () => {
      setLoadingUniversal(true);
      try {
          const res = await api.get('/exam/all');
          setAllExams(res.data);
          
          // Auto-select latest code
          const codes = [...new Set(res.data.map(e => e.examCode))].filter(Boolean);
          if (codes.length > 0 && !selectedExamCode) {
              setSelectedExamCode(codes[0]);
          }
      } catch (err) {
          console.error("Failed to fetch universal exams", err);
      } finally {
          setLoadingUniversal(false);
      }
  };

  const getUniversalTableData = () => {
    if (!selectedExamCode) return { dates: [], rows: [] };
    
    const filteredExams = allExams.filter(e => e.examCode === selectedExamCode);
    const uniqueDates = [...new Set(filteredExams.map(e => new Date(e.date).toISOString().split('T')[0]))].sort();
    
    const classMap = {}; 
    filteredExams.forEach(e => {
        const classId = e.sClass?._id;
        if (!classId) return;
        
        if (!classMap[classId]) {
            classMap[classId] = {
                name: `${e.sClass.grade}-${e.sClass.section}`,
                dates: {}
            };
        }
        classMap[classId].dates[new Date(e.date).toISOString().split('T')[0]] = e.subject;
    });

    return {
        dates: uniqueDates,
        rows: Object.values(classMap)
    };
  };

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

  const academicYear = "2026-2027";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-x-hidden pb-20">
      
      {/* Hero Section */}
      <div className="flex flex-col justify-center items-center text-center px-4 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-indigo-50/50 text-indigo-700 px-4 py-1 rounded-full text-sm font-black mb-6 border border-indigo-100"
        >
          ✨ NEXT-GEN ACADEMIC ECOSYSTEM
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-hero font-black text-slate-900 mb-6 tracking-tighter leading-tight"
        >
          Empowering Minds <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Shaping Futures</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-500 max-w-2xl mb-12 font-medium leading-relaxed"
        >
          Welcome to the digital heart of our institution. A seamless, high-performance platform designed for the scholars of tomorrow.
        </motion.p>

        {/* Carousel Section */}
        {carouselItems.length > 0 ? (
            <div className="w-full max-w-6xl h-[350px] md:h-[600px] relative rounded-[3.5rem] overflow-hidden shadow-2xl mb-24 group border-8 border-white">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0"
                    >
                        <img 
                            src={carouselItems[currentIndex].image} 
                            alt={carouselItems[currentIndex].title}
                            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[2000ms]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-10 md:p-20 text-left">
                            <motion.div 
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="space-y-4"
                            >
                                <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Featured Insight</span>
                                <h2 className="text-white text-4xl md:text-6xl font-black tracking-tight leading-none">
                                    {carouselItems[currentIndex].title}
                                </h2>
                                <p className="text-white/70 text-lg md:text-2xl font-bold max-w-3xl">
                                    {carouselItems[currentIndex].subtitle}
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                </AnimatePresence>
                
                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-6 pointer-events-none">
                    <button 
                        onClick={() => setCurrentIndex(prev => (prev - 1 + carouselItems.length) % carouselItems.length)}
                        className="pointer-events-auto p-5 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all opacity-0 group-hover:opacity-100 border border-white/10"
                    >
                        <FaChevronLeft size={20} />
                    </button>
                    <button 
                        onClick={() => setCurrentIndex(prev => (prev + 1) % carouselItems.length)}
                        className="pointer-events-auto p-5 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all opacity-0 group-hover:opacity-100 border border-white/10"
                    >
                        <FaChevronRight size={20} />
                    </button>
                </div>

                <div className="absolute bottom-10 right-10 flex gap-3">
                    {carouselItems.map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => setCurrentIndex(i)}
                            className={`h-1.5 rounded-full transition-all duration-500 ${currentIndex === i ? 'bg-indigo-500 w-12' : 'bg-white/20 w-4 hover:bg-white/40'}`}
                        />
                    ))}
                </div>
            </div>
        ) : (
            <div className="w-full max-w-6xl h-[300px] md:h-[500px] bg-indigo-50 rounded-[3rem] flex items-center justify-center mb-24 border-2 border-dashed border-indigo-200">
                <FaSchool className="text-indigo-200" size={64} />
            </div>
        )}

        {/* Vision, Goal & Principal's Word */}
        <div className="w-full max-w-7xl px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-32">
            <div className="bg-white p-10 rounded-[3rem] shadow-soft border border-slate-100 text-left space-y-6 group hover:border-indigo-200 transition-all">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <FaEye size={28} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Our Vision</h3>
                <p className="text-slate-500 font-bold leading-relaxed">
                    To cultivate a dynamic learning environment where innovation meets tradition, nurturing students to become global leaders who act with integrity and wisdom.
                </p>
            </div>
            <div className="bg-white p-10 rounded-[3rem] shadow-soft border border-slate-100 text-left space-y-6 group hover:border-purple-200 transition-all">
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <FaBullseye size={28} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Our Goal</h3>
                <p className="text-slate-500 font-bold leading-relaxed">
                    Providing 100% digital transparency, achieving 98% student placement in top universities, and fostering a culture of continuous skill-based excellence.
                </p>
            </div>
            <div className="lg:col-span-1 bg-slate-900 p-10 rounded-[3rem] text-left relative overflow-hidden group">
                <FaQuoteLeft className="absolute -top-4 -right-4 text-white/5 text-[120px]" />
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-indigo-500 overflow-hidden border-2 border-white/20">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80" alt="Principal" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h4 className="text-white font-black text-lg leading-none">Dr. Alaric Vance</h4>
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-1">Institutional Principal</p>
                        </div>
                    </div>
                    <p className="text-white/70 font-bold italic leading-relaxed">
                        "Education is not merely the accumulation of facts, but the training of the mind to think beyond the horizon. We are dedicated to this journey of discovery."
                    </p>
                    <button className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] border-b border-indigo-400/30 pb-1 hover:text-white hover:border-white transition-all">
                        Read Full Message →
                    </button>
                </div>
            </div>
        </div>

        {/* Prospectus Section */}
        <div className="w-full max-w-7xl px-4 mb-32">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[4rem] p-12 md:p-20 text-left relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                
                <div className="relative z-10 flex-1 space-y-8">
                    <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">Academic Brochure {academicYear}</span>
                    <h2 className="text-white text-4xl md:text-6xl font-black tracking-tight leading-none">
                        Download Our <br/> Official Prospectus
                    </h2>
                    <p className="text-indigo-100 text-lg md:text-xl font-bold max-w-xl opacity-80">
                        Get a detailed look into our curriculum, faculty profiles, and the vibrant campus life that awaits you.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4">
                        <button className="px-10 py-5 bg-white text-indigo-600 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-3">
                            <FaFilePdf size={18} /> Download PDF
                        </button>
                        <button 
                            onClick={() => setShowProspectusPreview(true)}
                            className="px-10 py-5 bg-indigo-500/30 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-500/50 transition-all border border-white/20 backdrop-blur-md flex items-center gap-3"
                        >
                            <FaEye size={18} /> Instant Preview
                        </button>
                    </div>
                </div>

                <div className="relative z-10 w-full md:w-1/3 aspect-[3/4] bg-white rounded-[2.5rem] shadow-2xl p-4 transform rotate-3 hover:rotate-0 transition-transform duration-700 group cursor-pointer overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1544640808-32ca72ac7f37?auto=format&fit=crop&q=80" alt="Brochure Cover" className="w-full h-full object-cover rounded-[2rem]" />
                    <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white p-4 rounded-full text-indigo-600 shadow-xl"><FaInfoCircle size={32}/></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Facilities Section */}
        <div className="w-full max-w-7xl px-4 mb-32 text-left">
            <div className="max-w-3xl mb-16 px-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Premier Infrastructure</h2>
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                    <span className="w-10 h-px bg-indigo-500" /> WORLD-CLASS FACILITIES FOR ALL SCHOLARS
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <FacilityCard icon={<FaWifi />} title="Giga-Fiber Campus" desc="Seamless high-speed internet across 100% of campus premises." />
                <FacilityCard icon={<FaLaptopCode />} title="Modern IT Labs" desc="Latest workstation nodes with high-end graphical processing units." />
                <FacilityCard icon={<FaMicroscope />} title="Advanced Science Hub" desc="Integrated physics, chemistry, and biology research wings." />
                <FacilityCard icon={<FaBook />} title="Digital Library" desc="Access to 50,000+ e-journals and physical academic volumes." />
                <FacilityCard icon={<FaMusic />} title="Arts & Performance" desc="Dedicated sound-proof studios for music, dance, and theater." />
                <FacilityCard icon={<FaBasketballBall />} title="Olympic Sports Wing" desc="All-weather synthetic tracks and multi-sport indoor arenas." />
                <FacilityCard icon={<FaSchool />} title="Smart Classrooms" desc="AI-integrated interactive panels and collaborative layouts." />
                <FacilityCard icon={<FaLayerGroup />} title="Hybrid Auditiorium" desc="1500+ seating capacity with 4K projection and live streaming." />
            </div>
        </div>

        {/* Extra Programs Section */}
        <div className="w-full max-w-7xl px-4 mb-32">
            <div className="bg-white rounded-[4rem] p-12 md:p-20 shadow-soft border border-slate-100 text-left">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
                    <div className="lg:w-1/3">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Extended Learning <br/> & Skill-Up</h2>
                        <p className="text-slate-500 font-bold mt-6 text-lg">Beyond the textbook. We offer specialized programs to build real-world competency.</p>
                        <div className="mt-10 p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 group hover:bg-indigo-600 transition-all">
                            <FaMobileAlt className="text-indigo-600 group-hover:text-white mb-4" size={32} />
                            <h4 className="text-indigo-900 group-hover:text-white font-black uppercase text-xs tracking-widest">Platform Update</h4>
                            <p className="text-indigo-600 group-hover:text-indigo-100 font-bold text-sm mt-2">Latest v2.4 APK & Web platform now live with 100% transparency logs.</p>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <ExtraProgramCard 
                            icon={<FaRocket />} title="Monthly Skill-Labs" 
                            type="ONLINE / OFFLINE" 
                            desc="Specialized Saturday sessions on Robotics, AI Ethics, and Creative Writing."
                        />
                        <ExtraProgramCard 
                            icon={<FaGamepad />} title="Monthly Brain-Quiz" 
                            type="GAMIFIED" 
                            desc="Compete in inter-class trivia and logic challenges for exclusive rewards."
                        />
                        <ExtraProgramCard 
                            icon={<FaMusic />} title="Extracurriculars" 
                            type="WEEKLY" 
                            desc="30+ clubs ranging from Astronomy to Zen Meditation and Urban Gardening."
                        />
                        <ExtraProgramCard 
                            icon={<FaCertificate />} title="Certifications" 
                            type="PROFESSIONAL" 
                            desc="Earn global credits with our partnered workshops from Industry Experts."
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Upcoming Schedule */}
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

        {/* Universal Table */}
        {user && (
            <div className="w-full max-w-7xl mb-24 px-4 text-left">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 max-w-6xl mx-auto">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Universal Exam Timetable</h2>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Cross-class examination schedule matrix</p>
                    </div>
                    
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 items-center">
                        <div className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cycle:</div>
                        <select 
                            className="bg-transparent border-none outline-none text-indigo-600 font-black text-xs pr-8 cursor-pointer"
                            value={selectedExamCode}
                            onChange={(e) => setSelectedExamCode(e.target.value)}
                        >
                            {[...new Set(allExams.map(e => e.examCode))].filter(Boolean).map(code => (
                                <option key={code} value={code}>{code}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loadingUniversal ? (
                    <div className="py-20 text-center text-slate-300 font-black animate-pulse uppercase tracking-[0.2em]">Building Matrix...</div>
                ) : (
                    <div className="bg-white rounded-[3rem] shadow-soft-xl border border-slate-100 overflow-hidden">
                        {(() => {
                            const { dates: tableDates, rows: tableRows } = getUniversalTableData();
                            if (tableDates.length === 0) return (
                                <div className="py-24 text-center">
                                    <FaBook size={48} className="text-slate-100 mx-auto mb-6" />
                                    <p className="text-slate-400 font-bold italic text-lg">No active exam cycle selected or found.</p>
                                </div>
                            );
                            
                            return (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-900 text-white">
                                                <th className="py-6 px-10 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/5 sticky left-0 bg-slate-900 z-10 text-left">Class \ Schedule</th>
                                                {tableDates.map(d => (
                                                    <th key={d} className="py-6 px-8 text-center border-r border-white/5 min-w-[160px]">
                                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{new Date(d).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                                        <div className="text-xs font-black text-indigo-400">{new Date(d).toLocaleDateString()}</div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {tableRows.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="py-6 px-10 font-black text-slate-800 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] uppercase font-black tracking-tight">{row.name}</span>
                                                    </td>
                                                    {tableDates.map(d => (
                                                        <td key={d} className="py-6 px-8 border-r border-slate-100 text-center">
                                                            {row.dates[d] ? (
                                                                <div className="flex flex-col items-center">
                                                                    <div className="text-xs font-black text-indigo-600 uppercase tracking-tight">{row.dates[d]}</div>
                                                                    <div className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-widest">Confirmed</div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-100 font-black">---</span>
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        )}

        {/* Explore Section */}
        <div className="w-full max-w-6xl mb-20 px-4 text-left">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-8 uppercase tracking-tighter">Explore Portal</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            <QuickLink to="/wall-of-fame" label="Wall of Fame" color="bg-orange-50 text-orange-600" />
            <QuickLink to="/achievements" label="Achievements" color="bg-emerald-50 text-emerald-600" />
            <QuickLink to="/gallery" label="Gallery" color="bg-indigo-50 text-indigo-600" />
            <QuickLink to="/calendar" label="Calendar" color="bg-blue-50 text-blue-600" />
            <QuickLink to="/notices" label="Notices" color="bg-purple-50 text-purple-600" />
          </div>
        </div>

        {/* Contact Section */}
        <div className="w-full max-w-5xl bg-white rounded-[3rem] shadow-soft-xl overflow-hidden flex flex-col md:flex-row mx-4 border border-slate-100">
            <div className="bg-slate-900 p-8 md:p-16 text-white text-left md:w-2/5 relative">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl -mb-16 -mr-16" />
                <h3 className="text-3xl font-black mb-6 tracking-tight uppercase">Get In Touch</h3>
                <p className="text-slate-400 mb-12 text-lg font-medium leading-relaxed">Our support team is available 24/7 for technical and academic assistance.</p>
                <div className="space-y-8 text-slate-300">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">📍</div>
                        <p className="font-bold text-sm">123 Education Lane, Digital City</p>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">📞</div>
                        <p className="font-bold text-sm">+1 234 567 890</p>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">✉️</div>
                        <p className="font-bold text-sm">info@edumanage.com</p>
                    </div>
                </div>
            </div>
            <div className="p-8 md:p-16 md:w-3/5 text-left">
                <form onSubmit={handleSend} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                            <input 
                                type="text" placeholder="John Doe" required 
                                className="p-5 bg-slate-50 border-none rounded-2xl w-full focus:ring-4 focus:ring-indigo-50 transition-all outline-none font-bold text-sm"
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <input 
                                type="email" placeholder="john@example.com" required 
                                className="p-5 bg-slate-50 border-none rounded-2xl w-full focus:ring-4 focus:ring-indigo-50 transition-all outline-none font-bold text-sm"
                                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Inquiry</label>
                        <textarea 
                            placeholder="How can we help you today?" rows="4" required 
                            className="p-5 bg-slate-50 border-none rounded-2xl w-full focus:ring-4 focus:ring-indigo-50 transition-all outline-none font-bold text-sm min-h-[150px]"
                            value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                        ></textarea>
                    </div>
                    <button className="w-full md:w-auto px-12 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100">
                        <FaPaperPlane /> Send Message
                    </button>
                </form>
            </div>
        </div>

      </div>

      {/* Prospectus Preview Modal */}
      <AnimatePresence>
          {showProspectusPreview && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6"
                onClick={() => setShowProspectusPreview(false)}
              >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-4xl h-[80vh] rounded-[3.5rem] shadow-2xl overflow-hidden relative"
                    onClick={e => e.stopPropagation()}
                  >
                      <button 
                        onClick={() => setShowProspectusPreview(false)}
                        className="absolute top-8 right-8 p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors z-20"
                      >
                          <FaTimes size={20} />
                      </button>
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
                          <FaFilePdf size={64} className="text-rose-500 mb-6" />
                          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Prospectus Preview</h3>
                          <p className="text-slate-400 font-bold mt-2">Loading secure PDF preview component...</p>
                          <div className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">
                              Page 1 of 42
                          </div>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

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
      
      <footer className="p-10 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] border-t border-slate-100 bg-white mt-20">
        © 2026 EduManage System • Empowering Excellence
      </footer>
    </div>
  );
};

const FacilityCard = ({ icon, title, desc }) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-soft hover:shadow-2xl transition-all duration-500 text-left group border border-slate-50 hover:border-indigo-100 relative overflow-hidden">
    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl group-hover:bg-indigo-100 transition-colors" />
    <div className="mb-6 p-4 bg-slate-50 w-fit rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 transform group-hover:rotate-6 text-slate-400 shadow-sm">{icon}</div>
    <h3 className="text-lg font-black text-slate-800 mb-3 tracking-tight uppercase leading-none">{title}</h3>
    <p className="text-slate-400 font-bold text-xs leading-relaxed group-hover:text-slate-500 transition-colors">{desc}</p>
  </div>
);

const ExtraProgramCard = ({ icon, title, type, desc }) => (
    <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all group">
        <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-white rounded-2xl text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:scale-110">
                {icon}
            </div>
            <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full uppercase tracking-widest">{type}</span>
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-3 tracking-tight uppercase">{title}</h3>
        <p className="text-slate-400 font-bold text-xs leading-relaxed group-hover:text-slate-500 transition-colors">{desc}</p>
    </div>
);

const QuickLink = ({ to, label, color }) => (
  <Link to={to} className={`${color} p-8 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest text-center hover:scale-[1.02] active:scale-95 transition-all shadow-sm flex items-center justify-center border border-white/50 hover:shadow-xl`}>
    {label}
  </Link>
);

export default Home;
