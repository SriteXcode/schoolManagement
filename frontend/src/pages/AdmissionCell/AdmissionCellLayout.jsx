import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserPlus, 
  CreditCard, 
  LogOut, 
  UserCircle,
  ArrowLeft,
  Menu,
  X,
  School
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdmissionCellLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const menuItems = [
    { path: '/admission/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admission/register', icon: UserPlus, label: 'New Admission' },
    { path: '/admission/fees', icon: CreditCard, label: 'Fee Management' },
    { path: '/admission/profile', icon: UserCircle, label: 'Profile' },
  ];

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'Admin';

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white md:bg-transparent">
        <div className="p-10 pb-6 flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
                <School size={24} />
            </div>
            <div className="text-left">
                <h2 className="text-xl font-black text-slate-900 leading-none tracking-tighter uppercase">Admission</h2>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Cell Portal</span>
            </div>
        </div>

        <nav className="flex-1 px-8 py-4 space-y-2 text-left">
          {isAdmin ? (
            <Link 
              to="/admin/cells" 
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center space-x-3 p-4 rounded-2xl text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all font-black mb-8 shadow-sm group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] uppercase tracking-widest">Back to Admin Panel</span>
            </Link>
          ) : (
            <Link 
              to="/teacher/dashboard" 
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center space-x-3 p-4 rounded-2xl text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all font-black mb-8 shadow-sm group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] uppercase tracking-widest">Teacher Panel</span>
            </Link>
          )}

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center space-x-3 p-4 rounded-2xl transition-all font-bold ${
                  isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-10 pt-4 space-y-3">
          <Link to="/" className="flex items-center justify-center p-4 text-slate-400 hover:text-slate-600 font-bold text-sm transition" onClick={() => setIsSidebarOpen(false)}>
             Exit Dashboard
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition font-black shadow-sm">
            <LogOut size={20} /> <span>Logout</span>
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
        <header className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-sm border-b border-slate-100">
            <Link to="/" className="flex items-center space-x-2 text-slate-900 font-black text-xl tracking-tighter">
                <div className="bg-indigo-600 p-1.5 rounded-lg text-white text-sm">
                    <School size={18} />
                </div>
                <span>Admission Cell</span>
            </Link>
            <button 
                onClick={toggleSidebar}
                className="p-3 bg-slate-50 text-slate-900 rounded-xl focus:outline-none"
            >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
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

export default AdmissionCellLayout;
