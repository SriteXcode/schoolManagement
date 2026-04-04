import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FaBullhorn, FaUsers, FaChalkboardTeacher, FaSchool, FaClipboardCheck, FaBook, FaMoneyBillWave } from 'react-icons/fa';
import { DollarSign, FileText, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const TeacherHome = () => {
  const [notices, setNotices] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [viewReceipt, setViewReceipt] = useState(null);
  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [noticeRes, salaryRes] = await Promise.all([
          api.get('/notice/getall'),
          api.get(`/management/salary/history/${user._id}`)
        ]);
        setNotices(noticeRes.data);
        setSalaries(salaryRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [user._id]);

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
            {/* Quick Actions & Salary History */}
            <div className="lg:col-span-2 space-y-12">
                <div className="space-y-8">
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

                {/* Financial Records Section */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial Records</h2>
                        <div className="h-1 flex-1 mx-6 bg-slate-100 rounded-full hidden md:block"></div>
                    </div>
                    
                    <div className="bg-white rounded-[2.5rem] shadow-soft p-8 overflow-hidden">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <FaMoneyBillWave className="text-emerald-500" /> Recent Pay Slips
                        </h3>
                        <div className="space-y-4">
                            {salaries.map(record => (
                                <div key={record._id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-transparent hover:border-indigo-100 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 font-black shadow-sm text-xs">
                                            {record.month.slice(0, 3)}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-800 text-sm">{record.month} {record.year}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.status} • {new Date(record.paymentDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="font-black text-emerald-600 text-sm">₹{record.totalAmount}</div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Net Payable</div>
                                        </div>
                                        <button 
                                            onClick={() => setViewReceipt(record)}
                                            className="p-3 bg-white text-indigo-600 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-600 hover:text-white"
                                        >
                                            <FileText size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {salaries.length === 0 && (
                                <div className="text-center py-10 text-slate-300 font-bold italic">No payroll records generated yet</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Notice Board ... */}

            {/* Receipt Modal */}
            {viewReceipt && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in duration-300">
                        <div className="p-12 space-y-10" id="salary-receipt">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-4 shadow-xl">
                                        <DollarSign size={24} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pay Slip</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Earnings Statement</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Record #</div>
                                    <div className="font-mono text-sm font-bold text-slate-300">{viewReceipt._id.slice(-8).toUpperCase()}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 border-y border-slate-50 py-8">
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee</div>
                                    <div className="font-black text-slate-800">{user.name}</div>
                                    <div className="text-xs font-bold text-slate-500">{user.role}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pay Period</div>
                                    <div className="font-black text-slate-800">{viewReceipt.month} {viewReceipt.year}</div>
                                    <div className="text-xs font-bold text-slate-500">Released: {new Date(viewReceipt.paymentDate).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm font-bold text-slate-600">
                                    <span>Fixed Pay</span>
                                    <span>₹{viewReceipt.baseSalary}</span>
                                </div>
                                {viewReceipt.bonus > 0 && (
                                    <div className="flex justify-between text-sm font-bold text-emerald-600">
                                        <span>Performance Bonus</span>
                                        <span>+ ₹{viewReceipt.bonus}</span>
                                    </div>
                                )}
                                {viewReceipt.increment > 0 && (
                                    <div className="flex justify-between text-sm font-bold text-indigo-600">
                                        <span>Annual Increment</span>
                                        <span>+ ₹{viewReceipt.increment}</span>
                                    </div>
                                )}
                                {viewReceipt.deductions?.map((d, i) => (
                                    <div key={i} className="flex justify-between text-sm font-bold text-rose-600">
                                        <span>{d.name || 'Deduction'}</span>
                                        <span>- ₹{d.amount}</span>
                                    </div>
                                ))}
                                <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center">
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Net Disbursement</span>
                                    <span className="text-2xl font-black text-slate-900">₹{viewReceipt.totalAmount}</span>
                                </div>
                            </div>

                            <div className="pt-10 flex flex-col items-center">
                                <div className="w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center mb-4">
                                    <div className="text-[8px] font-black text-slate-200 uppercase rotate-[-45deg]">Confidential</div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-300 text-center uppercase tracking-[0.2em]">Authentic Digital Statement<br/>Verified by Admin Cell</p>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                            <button 
                                onClick={() => window.print()} 
                                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition flex items-center justify-center gap-2 shadow-xl shadow-slate-100"
                            >
                                <FileText size={18} /> Download PDF
                            </button>
                            <button 
                                onClick={() => setViewReceipt(null)} 
                                className="px-8 py-4 bg-white text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest border border-slate-100 hover:bg-slate-100 transition"
                            >Close</button>
                        </div>
                    </div>
                </div>
            )}

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
