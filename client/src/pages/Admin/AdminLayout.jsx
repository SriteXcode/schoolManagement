import React, { useState } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { FaChalkboardTeacher, FaUserGraduate, FaSchool, FaSignOutAlt, FaBullhorn, FaIdCard, FaTachometerAlt, FaEnvelope, FaClipboardCheck, FaMoneyBillWave, FaShieldAlt, FaBook, FaBars, FaTimes, FaBus, FaImage, FaCogs, FaUsers } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const navLinks = [
    { to: "/admin/dashboard", icon: <FaTachometerAlt />, label: "Dashboard" },
    { to: "/admin/classes", icon: <FaSchool />, label: "Classes" },
    { to: "/admin/teachers", icon: <FaChalkboardTeacher />, label: "Teachers" },
    { to: "/admin/students", icon: <FaUserGraduate />, label: "Students" },
    { to: "/admin/attendance", icon: <FaClipboardCheck />, label: "Attendance" },
    { to: "/admin/syllabus-overview", icon: <FaBook />, label: "Academic Progress" },
    { to: "/admin/notices", icon: <FaBullhorn />, label: "Notices" },
    { to: "/admin/cells", icon: <FaShieldAlt />, label: "Cell Management" },
    { to: "/admin/inbox", icon: <FaEnvelope />, label: "Reports & Feedback" },
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
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'A';
    return (
      <div className={`${size} rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl font-black shadow-md text-white`}>
        {initial}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white md:bg-transparent">
        {/* Profile Section */}
        <div className="p-4 pb-2">
            <Link to="/admin/profile" className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition group" onClick={() => setIsSidebarOpen(false)}>
                {renderProfileImage("w-10 h-10")}
                <div className="overflow-hidden">
                    <h2 className="font-black text-slate-800 truncate text-fluid-base">{user.name || 'Admin'}</h2>
                    <p className="text-fluid-xs text-indigo-600 font-bold uppercase tracking-widest">{user.role}</p>
                </div>
            </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {navLinks.map((link, index) => {
            if (link.isHeader) {
              const hasActiveSub = link.subLinks?.some(sub => location.pathname + location.search === sub.to);
              return (
                <div key={`header-${index}`} className="space-y-1">
                  <div className="pt-4 pb-1 px-3 flex items-center gap-2">
                    {link.icon && <span className="text-slate-400 text-xs">{link.icon}</span>}
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{link.label}</p>
                  </div>
                </div>
              );
            }

            const isActive = location.pathname + location.search === link.to;

            return (
              <Link 
                key={link.to}
                to={link.to} 
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center space-x-3 py-2.5 px-4 rounded-lg transition-all font-bold text-fluid-sm ${
                  isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                <span className="text-xl">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Logout Section */}
        <div className="p-4 pt-2 space-y-2">
          <Link to="/" className="flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 font-bold text-fluid-xs transition" onClick={() => setIsSidebarOpen(false)}>
             Exit Dashboard
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-black shadow-sm text-fluid-sm">
            <FaSignOutAlt /> <span>Logout</span>
          </button>
        </div>
    </div>
  );

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
                <div className="bg-indigo-600 p-1.5 rounded-lg text-white text-sm">
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

export default AdminLayout;