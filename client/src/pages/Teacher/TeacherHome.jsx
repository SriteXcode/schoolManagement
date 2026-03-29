import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FaBullhorn, FaUsers, FaChalkboardTeacher, FaSchool, FaClipboardCheck, FaBook } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const TeacherHome = () => {
  const [notices, setNotices] = useState([]);
  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await api.get('/notice/getall');
        setNotices(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotices();
  }, []);

  const getAudienceLabel = (notice) => {
    const baseClass = "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1.5";
    if (notice.targetAudience === 'All') {
        return <span className={`${baseClass} bg-emerald-50 text-emerald-600`}><FaSchool /> Public</span>;
    } else if (notice.targetAudience === 'Teacher') {
        return <span className={`${baseClass} bg-indigo-50 text-indigo-600`}><FaChalkboardTeacher /> Teachers</span>;
    } else if (notice.targetAudience === 'Class') {
        return <span className={`${baseClass} bg-orange-50 text-orange-600`}><FaUsers /> Class {notice.targetClass?.grade}</span>;
    }
    return null;
  };

  return (
    <div className="space-y-12">
        {/* Welcome Section */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-soft-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-emerald-500/20 transition-colors duration-700"></div>
            <div className="relative z-10">
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter">Hello, {user.name?.split(' ')[0]}!</h1>
                <p className="mt-4 text-slate-400 text-lg md:text-xl max-w-xl leading-relaxed">Ready to inspire? Your classes and tasks are organized and waiting for you.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Quick Actions */}
            <div className="lg:col-span-2 space-y-8">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Quick Actions</h2>
                    <div className="h-1 flex-1 mx-6 bg-slate-100 rounded-full hidden md:block"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ActionCard 
                        to="/teacher/attendance"
                        title="Attendance"
                        desc="Mark daily presence for your assigned classes."
                        icon={<FaClipboardCheck />}
                        color="text-emerald-600"
                        bgColor="bg-emerald-50"
                    />
                    
                    <ActionCard 
                        to="/teacher/homework"
                        title="Homework"
                        desc="Assign new tasks and track student submissions."
                        icon={<FaBook />}
                        color="text-indigo-600"
                        bgColor="bg-indigo-50"
                    />
                </div>
            </div>

            {/* Notice Board */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-[2.5rem] shadow-soft p-8 h-full">
                    <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 tracking-tight">
                        <div className="bg-orange-50 p-2 rounded-xl text-orange-500 text-lg">
                            <FaBullhorn />
                        </div>
                        Notices
                    </h2>
                    
                    <div className="space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                        {notices.map(notice => (
                            <div key={notice._id} className="p-5 bg-slate-50 rounded-3xl hover:bg-white hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    {getAudienceLabel(notice)}
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(notice.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <h3 className="font-black text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{notice.title}</h3>
                                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                    {notice.details}
                                </p>
                            </div>
                        ))}
                        {notices.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">📭</div>
                                <p className="text-slate-400 font-bold">No notices today.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

const ActionCard = ({ to, title, desc, icon, color, bgColor }) => (
    <Link to={to} className="p-8 bg-white rounded-[2rem] shadow-soft hover:shadow-soft-xl transition-all group flex flex-col h-full border border-transparent hover:border-slate-100">
        <div className={`w-14 h-14 rounded-2xl ${bgColor} ${color} flex items-center justify-center text-2xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
            {icon}
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed flex-1">{desc}</p>
        <div className="mt-6 flex items-center text-xs font-black uppercase tracking-widest text-indigo-600 group-hover:translate-x-2 transition-transform">
            Go to {title} <span className="ml-2">→</span>
        </div>
    </Link>
);

export default TeacherHome;
