import React, { useEffect, useState } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { FaClipboardCheck, FaBookOpen, FaSignOutAlt, FaHome, FaListAlt, FaIdCard, FaExclamationTriangle, FaFileAlt, FaCreditCard, FaBars, FaTimes, FaSchool } from 'react-icons/fa';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const StudentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAssigned, setIsAssigned] = useState(true);
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/student/profile');
        setStudent(res.data);
        localStorage.setItem('studentId', res.data._id);
        if (res.data.sClass) {
             localStorage.setItem('classId', res.data.sClass._id);
        }
        setIsAssigned(true);
      } catch (err) {
        if (err.response && err.response.status === 404) {
            setIsAssigned(false);
        } else {
            console.error(err);
            toast.error("Failed to load profile");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const navLinks = [
    { to: "/student/dashboard", icon: <FaHome />, label: "Dashboard" },
    { to: "/student/attendance", icon: <FaClipboardCheck />, label: "Attendance" },
    { to: "/student/homework", icon: <FaBookOpen />, label: "Homework" },
    { to: "/student/exams", icon: <FaListAlt />, label: "Exams" },
    { to: "/student/syllabus", icon: <FaFileAlt />, label: "Syllabus" },
    { to: "/student/fees", icon: <FaCreditCard />, label: "My Fees" },
    { to: "/student/comms", icon: <FaExclamationTriangle />, label: "Raise Issue" },
    // { to: "/student/profile", icon: <FaIdCard />, label: "Profile" },
  ];

  const renderProfileImage = (size = "w-16 h-16") => {
    if (user.profileImage && user.profileImage !== "https://cdn-icons-png.flaticon.com/512/149/149071.png") {
      return (
        <img 
          src={user.profileImage} 
          alt="Profile" 
          className={`${size} rounded-2xl object-cover shadow-md`}
        />
      );
    }
    const initial = (student ? student.name : user.name || 'S').charAt(0).toUpperCase();
    return (
      <div className={`${size} rounded-2xl bg-teal-500 flex items-center justify-center text-2xl font-black shadow-md text-white`}>
        {initial}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white md:bg-transparent">
        {/* Profile Section */}
        <div className="p-4 pb-2 pt-2">
            <Link to="/student/profile" className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition group" onClick={() => setIsSidebarOpen(false)}>
                {renderProfileImage("rounded-lg w-10 h-10")}
                <div className="overflow-hidden text-left">
                    <h2 className="font-black text-slate-800 truncate text-fluid-base">{student ? student.name.split(" ")[0]: user.name.split(" ")[0]}</h2>
                    <p className="text-fluid-xs text-teal-600 font-bold uppercase tracking-widest">
                        {student?.sClass ? `Class : ${student.sClass.grade}-${student.sClass.section}` : user.role}
                    </p>
                </div>
            </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-hide custom-scrollbar text-left">
          {navLinks.map((link) => (
            <Link 
              key={link.to}
              to={link.to} 
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center space-x-3 py-2.5 px-4 rounded-lg transition-all font-bold text-fluid-sm ${
                location.pathname === link.to 
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-100' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-teal-600'
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              <span className="text-sm">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Logout Section */}
        <div className="p-4 pt-2 space-y-2">
          <Link to="/" className="flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 font-semibold text-md transition" onClick={() => setIsSidebarOpen(false)}>
             Exit Dashboard
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-bold shadow-sm text-md">
            <FaSignOutAlt /> <span>Logout</span>
          </button>
        </div>
    </div>
  );

  if (loading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-teal-600 font-black tracking-widest text-fluid-xs uppercase animate-pulse">Loading Academy...</p>
        </div>
      );
  }

  if (!isAssigned) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-12 rounded-[2.5rem] shadow-soft-xl max-w-md w-full relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-2 bg-yellow-400"></div>
                <FaExclamationTriangle className="text-7xl text-yellow-400 mx-auto mb-8" />
                <h1 className="text-fluid-3xl font-black text-slate-900 mb-4 tracking-tight">Class Not Assigned</h1>
                <p className="text-slate-500 mb-10 leading-relaxed text-fluid-base">
                    Welcome, <b className="text-slate-900">{user.name}</b>! Your account is active, but your class assignment is pending.
                    <br/><br/>
                    Please contact the <b>School Admin</b> to finalize your registration.
                </p>
                <button onClick={handleLogout} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition shadow-lg shadow-slate-200 text-fluid-base">
                    Logout & Check Later
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 sticky top-0 h-screen">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-white z-50 md:hidden shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100">
            <Link to="/" className="flex items-center space-x-2 text-slate-900 font-black text-fluid-lg tracking-tighter">
                <div className="bg-teal-600 p-1.5 rounded-lg text-white text-sm">
                    <FaSchool />
                </div>
                <span>EduManage</span>
            </Link>
            <button 
                onClick={toggleSidebar}
                className="p-3 bg-slate-50 text-slate-900 rounded-xl text-xl focus:outline-none"
            >
                <FaBars />
            </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-10 md:pt-6 lg:p-12 lg:pt-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                <Outlet context={{ student }} />
            </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;