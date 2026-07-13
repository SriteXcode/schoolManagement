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
  School,
  DollarSign,
  Bus,
  Settings,
  Image,
  Mail,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CellLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.role === 'Admin') return; // Admins don't have teacher/staff profiles

      try {
        const res = await api.get('teacher/profile');
        setProfile(res.data);
      } catch (err) {
        if (err.response?.status !== 404) {
            console.error("Cell Sidebar: Error fetching profile", err);
        }
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
    
    // Determine which cell we are in based on URL or user profile
    let cell = profile?.schoolCell || user?.role;

    // If Admin, prioritize URL context
    if (user?.role === 'Admin') {
        if (location.pathname.includes('/cell/management')) cell = 'ManagementCell';
        else if (location.pathname.includes('/cell/exam')) cell = 'ExamCell';
        else if (location.pathname.includes('/cell/discipline')) cell = 'DisciplineCell';
        else if (location.pathname.includes('/cell/sports')) cell = 'SportsCell';
        else if (location.pathname.includes('/admission')) cell = 'AdmissionCell';
    }

    if (!cell || cell === "Teacher" || cell === "None") return { title: "Portal", menu: [] };

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
            { label: "Academics", icon: Clock, isHeader: true, subLinks: [
              { path: '/cell/management/dashboard?tab=phases', label: 'Schedule Phases' },
              { path: '/cell/management/dashboard?tab=timetable', label: 'Timetable Editor' },
            ]},
            { label: "Staff Hub", icon: Users, isHeader: true, subLinks: [
              { path: '/cell/management/dashboard?tab=staff', label: 'Personal' },
              { path: '/cell/management/dashboard?tab=salary', label: 'Payroll & HR' },
              { path: '/cell/management/dashboard?tab=transport', label: 'Fleet Manager' },
              { path: '/cell/management/dashboard?tab=media', label: 'CMS & Media' },
              { path: '/cell/management/dashboard?tab=config', label: 'Configurations' },
            ]},
            { label: "Reports & Feedback", icon: Mail, isHeader: true, subLinks: [
                { path: '/cell/management/dashboard?tab=inbox', label: 'Inbox' },
            ]},
          ]
        };
      default:
        return { title: "Portal", menu: [] };
    }
  };

  const config = getCellConfig();
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'Admin';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white md:bg-transparent">
        <div className="p-4 pb-2 flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl text-white">
                <School size={20} />
            </div>
            <div className="text-left">
                <h2 className="text-lg font-black text-slate-900 leading-none tracking-tighter uppercase">{config.title.split(' ')[0]}</h2>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Cell Portal</span>
            </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 text-left overflow-y-auto custom-scrollbar">
          {isAdmin ? (
            <Link 
              to="/admin/cells" 
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center space-x-3 py-2.5 px-4 rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all font-black mb-4 shadow-sm group text-fluid-xs"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="uppercase tracking-widest text-[9px]">Back to Admin</span>
            </Link>
          ) : (
            <Link 
              to="/teacher/dashboard" 
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center space-x-3 py-2.5 px-4 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all font-black mb-4 shadow-sm group text-fluid-xs"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="uppercase tracking-widest text-[9px]">Teacher Panel</span>
            </Link>
          )}

          {config.menu.map((item, index) => {
            if (item.isHeader) {
              return (
                <div key={`header-${index}`} className="space-y-1">
                  <div className="pt-3 pb-1 px-3 flex items-center gap-2">
                    {item.icon && <item.icon size={12} className="text-slate-400" />}
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</p>
                  </div>
                  {item.subLinks && (
                    <div className="ml-2 space-y-1 border-l border-slate-100 pl-2">
                      {item.subLinks.map((sub, subIdx) => {
                        const isSubActive = location.pathname + location.search === sub.path;
                        return (
                          <Link
                            key={subIdx}
                            to={sub.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center space-x-3 py-2 px-3 rounded-lg transition-all font-bold text-fluid-xs ${
                              isSubActive 
                              ? 'bg-slate-900 text-white shadow-lg shadow-slate-100' 
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <span className="uppercase tracking-widest text-[9px]">{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = location.pathname + location.search === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center space-x-3 py-2.5 px-4 rounded-lg transition-all font-bold text-fluid-sm ${
                  isActive 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 pt-2 space-y-2">
          <Link to="/cell/profile" className="flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 font-bold text-fluid-xs transition" onClick={() => setIsSidebarOpen(false)}>
             <UserCircle size={18} className="mr-2" /> Profile
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-black shadow-sm text-fluid-sm">
            <LogOut size={18} /> <span>Logout</span>
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
