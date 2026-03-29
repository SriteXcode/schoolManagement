import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FaUserGraduate, FaChalkboardTeacher, FaSchool } from 'react-icons/fa';

const AdminHome = () => {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [s, t, c] = await Promise.all([
            api.get('/student/getall'),
            api.get('/teacher/getall'),
            api.get('/class/getall')
        ]);
        setStats({
            students: s.data.length,
            teachers: t.data.length,
            classes: c.data.length
        });
      } catch (e) { console.error(e); }
    };
    fetchStats();
  }, []);

  const data = [
    { name: 'Students', count: stats.students },
    { name: 'Teachers', count: stats.teachers },
    { name: 'Classes', count: stats.classes },
  ];

  const pieData = [
    { name: 'Male', value: 400 },
    { name: 'Female', value: 300 },
  ];
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-fluid-3xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
                <p className="text-slate-500 mt-1 font-medium text-fluid-base">Real-time school metrics and distribution</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100/50 text-fluid-xs font-bold text-slate-400 uppercase tracking-widest">
                Updated: March 2026
            </div>
        </div>
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard 
                title="Total Students" 
                count={stats.students} 
                icon={<FaUserGraduate />} 
                color="text-blue-600" 
                bgColor="bg-blue-50"
            />
            <StatCard 
                title="Total Teachers" 
                count={stats.teachers} 
                icon={<FaChalkboardTeacher />} 
                color="text-emerald-600" 
                bgColor="bg-emerald-50"
            />
            <StatCard 
                title="Total Classes" 
                count={stats.classes} 
                icon={<FaSchool />} 
                color="text-indigo-600" 
                bgColor="bg-indigo-50"
            />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <div className="bg-white p-8 rounded-[2rem] shadow-soft h-[450px] flex flex-col">
                <h3 className="text-xl font-black text-slate-800 mb-8 tracking-tight">Resource Distribution</h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: '#f8fafc' }}
                            />
                            <Bar dataKey="count" fill="#6366f1" radius={[12, 12, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Mock Pie Chart (Gender Ratio Placeholder) */}
            <div className="bg-white p-8 rounded-[2rem] shadow-soft h-[450px] flex flex-col">
                 <h3 className="text-xl font-black text-slate-800 mb-8 tracking-tight">Student Demographics</h3>
                 <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                fill="#8884d8"
                                paddingAngle={8}
                                dataKey="value"
                                stroke="none"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                 </div>
            </div>
        </div>
    </div>
  );
};

const StatCard = ({ title, count, icon, color, bgColor }) => (
    <div className="bg-white p-8 rounded-[2rem] shadow-soft hover:shadow-soft-xl transition-all duration-300 flex items-center justify-between group">
        <div>
            <h3 className="text-slate-400 text-fluid-xs font-black uppercase tracking-widest">{title}</h3>
            <p className="text-fluid-4xl font-black text-slate-900 mt-2 tracking-tighter">{count}</p>
        </div>
        <div className={`p-5 rounded-3xl ${color} ${bgColor} transition-transform group-hover:scale-110 duration-300`}>
            <div className="text-2xl">{icon}</div>
        </div>
    </div>
);

export default AdminHome;