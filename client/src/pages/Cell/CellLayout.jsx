import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { 
  LayoutDashboard, 
  LogOut, 
  UserCircle,
  FileText,
  Shield,
  Trophy,
  Users,
  ArrowLeft,
  Menu,
  X,
  School
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CellLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/teacher/profile');
        setProfile(res.data);
      } catch (err) {
        console.error("Cell Sidebar: Error fetching profile");
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const getCellConfig = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const cell = profile?.schoolCell || user?.role;

    if (!cell || cell === "Teacher" || cell === "None") return { title: "Cell Management", menu: [] };

    switch(cell) {
      case 'ExamCell':
        return {
          title: "Exam Cell",
          menu: [
            { path: '/cell/exam/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/cell/exam/exams', icon: FileText, label: 'Manage Exams' },
            { path: '/cell/exam/marks', icon: FileText, label: 'Mark Entry' },
          ]
        };
      case 'DisciplineCell':
        return {
          title: "Discipline Cell",
          menu: [
            { path: '/cell/discipline/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/cell/discipline/incidents', icon: Shield, label: 'Incidents' },
            { path: '/cell/discipline/students', icon: Users, label: 'Student Lookup' },
          ]
        };
      case 'SportsCell':
        return {
          title: "Sports Cell",
          menu: [
            { path: '/cell/sports/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/cell/sports/records', icon: Trophy, label: 'Sports Records' },
            { path: '/cell/sports/events', icon: Trophy, label: 'Sports Events' },
          ]
        };
      case 'ManagementCell':
        return {
          title: "Management Cell",
          menu: [
            { path: '/cell/management/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/admin/salaries', icon: FileText, label: 'Salaries' },
            { path: '/admin/notices', icon: FileText, label: 'School Notices' },
          ]
        };
      default:
        return { title: "Cell Management", menu: [] };
    }
  };

  const config = getCellConfig();
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'Admin';

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white md:bg-transparent">
        <div className="p-10 pb-6 flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl text-white">
                <School size={24} />
            </div>
            <div className="text-left">
                <h2 className="text-xl font-black text-slate-900 leading-none tracking-tighter uppercase">{config.title.split(' ')[0]}</h2>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cell Portal</span>
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

          {config.menu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center space-x-3 p-4 rounded-2xl transition-all font-bold ${
                  isActive 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-10 pt-4 space-y-3">
          <Link to="/cell/profile" className="flex items-center justify-center p-4 text-slate-400 hover:text-slate-600 font-bold text-sm transition" onClick={() => setIsSidebarOpen(false)}>
             <UserCircle size={20} className="mr-2" /> Profile
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
                <div className="bg-slate-900 p-1.5 rounded-lg text-white text-sm">
                    <School size={18} />
                </div>
                <span>{config.title}</span>
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

export default CellLayout;
