import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { FaClipboardCheck, FaBook, FaSignOutAlt, FaHome, FaMarker, FaCommentDots, FaIdCard, FaListAlt, FaSchool, FaUserGraduate, FaShieldAlt, FaBars, FaTimes } from 'react-icons/fa';
import api from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};
  const [myClass, setMyClass] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const [classRes, profileRes] = await Promise.all([
          api.get('/class/getall'),
          api.get('/teacher/profile')
        ]);
        
        const assigned = classRes.data.find(c => 
          c.classTeacher?.email && user.email && 
          c.classTeacher.email.toLowerCase() === user.email.toLowerCase()
        );
        if (assigned) setMyClass(assigned);
        setTeacherProfile(profileRes.data);
      } catch (err) {
        console.error("Sidebar: Error fetching teacher data", err);
      }
    };
    fetchTeacherData();
  }, [user.email]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const cellLink = (() => {
    if (!teacherProfile || teacherProfile.schoolCell === "None") return null;
    const cell = teacherProfile.schoolCell;
    if (cell === 'AdmissionCell') return '/admission/dashboard';
    if (cell === 'ExamCell') return '/cell/exam/dashboard';
    if (cell === 'DisciplineCell') return '/cell/discipline/dashboard';
    if (cell === 'SportsCell') return '/cell/sports/dashboard';
    if (cell === 'ManagementCell') return '/cell/management/dashboard';
    return null;
  })();

  const cellLabel = teacherProfile?.schoolCell?.replace('Cell', ' Cell') || 'Cell Dashboard';

  const navLinks = [
    { to: "/teacher/dashboard", icon: <FaHome />, label: "Dashboard" },
    ...(cellLink ? [{ to: cellLink, icon: <FaShieldAlt />, label: cellLabel }] : []),
    { to: "/teacher/schedule", icon: <FaCalendarAlt />, label: "Schedule" },
    { to: "/teacher/attendance", icon: <FaClipboardCheck />, label: "Mark Attendance" },
    { to: "/teacher/leave", icon: <FaPaperPlane />, label: "Leave Requests" },
    { to: "/teacher/homework", icon: <FaBook />, label: "Homework" },
    { to: "/teacher/syllabus", icon: <FaListAlt />, label: "Syllabus" },
    { to: "/teacher/marks", icon: <FaMarker />, label: "Enter Marks" },
    { to: "/teacher/exams", icon: <FaClipboardList />, label: "Exams" },
    { to: "/teacher/students", icon: <FaUserGraduate />, label: "My Students" },
    { to: "/teacher/salary", icon: <FaMoneyBillWave />, label: "Payroll" },
    { to: "/teacher/inbox", icon: <FaCommentDots />, label: "Inbox" },
    // { to: "/teacher/profile", icon: <FaIdCard />, label: "Profile" },
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
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'T';
    return (
      <div className={`${size} rounded-2xl bg-emerald-600 flex items-center justify-center text-2xl font-black shadow-md text-white`}>
        {initial}
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white md:bg-transparent">
        {/* Profile Section */}
        <div className="p-8 pb-4">
            <Link to="/teacher/profile" className="flex items-center space-x-4 p-4 bg-slate-50 rounded-3xl hover:bg-slate-100 transition group" onClick={() => setIsSidebarOpen(false)}>
                {renderProfileImage("w-12 h-12")}
                <div className="overflow-hidden text-left">
                    <h2 className="font-black text-slate-800 truncate text-fluid-base">{user.name || 'Teacher'}</h2>
                    <p className="text-fluid-xs text-emerald-600 font-bold uppercase tracking-widest">{user.role}</p>
                </div>
            </Link>
        </div>

        {/* Class Section */}
        {myClass && (
          <div className="mx-8 mb-4 p-4 bg-indigo-50 rounded-2xl border-none flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl text-indigo-600">
                  <FaSchool />
              </div>
              <div className="text-left">
                  <p className="text-fluid-xs text-indigo-400 font-black uppercase tracking-widest">Your Class</p>
                  <p className="text-indigo-900 font-black text-fluid-base">{myClass.grade} - {myClass.section}</p>
              </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 px-6 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navLinks.map((link) => (
            <Link 
              key={link.to}
              to={link.to} 
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center space-x-3 p-4 rounded-2xl transition-all font-bold text-fluid-sm ${
                location.pathname === link.to 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600'
              }`}
            >
              <span className="text-xl">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Logout Section */}
        <div className="p-8 pt-4 space-y-3">
          <Link to="/" className="flex items-center justify-center p-4 text-slate-400 hover:text-slate-600 font-bold text-fluid-xs transition" onClick={() => setIsSidebarOpen(false)}>
             Exit Dashboard
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition font-black shadow-sm text-fluid-sm">
            <FaSignOutAlt /> <span>Logout</span>
          </button>
        </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 sticky top-0 h-screen">
        <SidebarContent />
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
              className="fixed inset-y-0 left-0 w-80 bg-white z-50 md:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100">
            <Link to="/" className="flex items-center space-x-2 text-slate-900 font-black text-fluid-lg tracking-tighter">
                <div className="bg-emerald-600 p-1.5 rounded-lg text-white text-sm">
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
        <main className="flex-1 p-4 md:p-10 lg:p-12 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                <Outlet />
            </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
