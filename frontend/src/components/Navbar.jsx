import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSchool, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const location = useLocation();

  // Hide Navbar on specific routes if needed (e.g., dashboard layouts that have their own sidebar)
  if (location.pathname.startsWith('/admin') || 
      location.pathname.startsWith('/teacher') || 
      location.pathname.startsWith('/admission') || 
      location.pathname.startsWith('/cell') || 
      location.pathname.startsWith('/student')) {
    return null;
  }

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === 'Admin') return '/admin/dashboard';
    if (user.role === 'Teacher' || user.role.endsWith('Cell')) return '/teacher/dashboard';
    if (user.role === 'Student') return '/student/dashboard';
    return '/';
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <>
      <nav className="bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-100/50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 text-slate-900 font-black text-fluid-xl z-50 tracking-tighter">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
                <FaSchool />
            </div>
            <span>EduManage</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8 text-slate-500 font-bold items-center text-fluid-sm">
            <Link to="/wall-of-fame" className="hover:text-indigo-600 transition">Wall of Fame</Link>
            <Link to="/achievements" className="hover:text-indigo-600 transition">Achievements</Link>
            <Link to="/gallery" className="hover:text-indigo-600 transition">Gallery</Link>
            <Link to="/calendar" className="hover:text-indigo-600 transition">Calendar</Link>
            <Link to="/notices" className="hover:text-indigo-600 transition">Notices</Link>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex space-x-6 items-center text-fluid-sm">
                {!user ? (
                <>
                    <Link to="/register" className="text-slate-600 font-bold hover:text-indigo-600 transition">Register</Link>
                    <Link 
                    to="/login" 
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 text-fluid-base"
                    >
                    Login
                    </Link>
                </>
                ) : (
                <Link 
                    to={getDashboardLink()} 
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 text-fluid-base"
                >
                    Dashboard
                </Link>
                )}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-slate-900 text-2xl z-50 focus:outline-none bg-slate-100 p-2 rounded-xl" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-white z-40 flex flex-col items-center justify-center p-8 md:hidden"
          >
             <div className="w-full space-y-4 flex flex-col items-center">
                <MobileNavItem to="/wall-of-fame" onClick={toggleMobileMenu} label="Wall of Fame" />
                <MobileNavItem to="/achievements" onClick={toggleMobileMenu} label="Achievements" />
                <MobileNavItem to="/gallery" onClick={toggleMobileMenu} label="Gallery" />
                <MobileNavItem to="/calendar" onClick={toggleMobileMenu} label="Calendar" />
                <MobileNavItem to="/notices" onClick={toggleMobileMenu} label="Notices" />
                
                <div className="w-full h-px bg-slate-100 my-4"></div>
                
                {!user ? (
                <>
                    <Link to="/register" onClick={toggleMobileMenu} className="text-slate-500 font-bold text-lg">Register</Link>
                    <Link to="/login" onClick={toggleMobileMenu} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] text-center font-black text-xl shadow-xl shadow-indigo-100">
                        Login
                    </Link>
                </>
                ) : (
                <Link to={getDashboardLink()} onClick={toggleMobileMenu} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] text-center font-black text-xl shadow-xl shadow-indigo-100">
                    Go to Dashboard
                </Link>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const MobileNavItem = ({ to, onClick, label }) => (
    <Link 
        to={to} 
        onClick={onClick}
        className="text-2xl font-black text-slate-800 hover:text-indigo-600 transition py-2"
    >
        {label}
    </Link>
);

export default Navbar;
