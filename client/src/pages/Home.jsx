import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserGraduate, FaChalkboardTeacher, FaSchool, FaPaperPlane, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Home = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [carouselItems, setCarouselItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
      const fetchCarousel = async () => {
          try {
              const res = await api.get('/management/carousel/all');
              setCarouselItems(res.data);
          } catch (e) {}
      };
      fetchCarousel();
  }, []);

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

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-20 px-4"
        >
          <FeatureCard 
            icon={<FaSchool className="text-4xl text-indigo-600" />}
            title="Admin Control"
            desc="Manage classes, users, and notices effortlessly."
          />
          <FeatureCard 
            icon={<FaChalkboardTeacher className="text-4xl text-indigo-600" />}
            title="Teacher Portal"
            desc="Mark attendance, assign homework, and grade exams."
          />
          <FeatureCard 
            icon={<FaUserGraduate className="text-4xl text-indigo-600" />}
            title="Student Success"
            desc="Track progress, view results, and stay updated."
          />
        </motion.div>

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
