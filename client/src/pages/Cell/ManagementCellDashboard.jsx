import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
    Users, DollarSign, Bus, Settings, Image, 
    Mail, Plus, Save, Trash2, Edit, CheckCircle, 
    X, Search, Calendar, Award, Layout, ChevronRight,
    TrendingUp, Shield, MapPin, Phone, Info, Star, FileText, Clock, RotateCcw
} from 'lucide-react';
import Loader from '../../components/Loader';
import ImageUpload from '../../components/ImageUpload';

const ManagementCellDashboard = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'staff';
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data State
  const [staffList, setStaffList] = useState({ teachers: [], otherStaff: [] });
  const [buses, setBuses] = useState([]);
  const [schoolConfig, setSchoolConfig] = useState({});
  const [messages, setMessages] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [phases, setPhases] = useState([]);
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [staffRes, busRes, configRes, msgRes, salaryRes, studentRes, classRes, phaseRes, leaveRes] = await Promise.all([
          axios.get('/management/staff/all'),
          axios.get('/management/bus/all'),
          axios.get('/management/school/config'),
          axios.get('/management/messages'),
          axios.get('/management/salary/all'),
          axios.get('/student/getall'),
          axios.get('/class/getall'),
          axios.get('/management/schedule/phase/all'),
          axios.get('/management/leave/all')
      ]);
      setStaffList(staffRes.data);
      setBuses(busRes.data);
      setSchoolConfig(configRes.data);
      setMessages(msgRes.data);
      setSalaries(salaryRes.data);
      setStudents(studentRes.data);
      setClasses(classRes.data);
      setPhases(phaseRes.data);
      setLeaves(leaveRes.data);
    } catch (error) {
      toast.error("Error fetching management data");
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
      { id: 'staff', label: 'Personal', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
      { id: 'salary', label: 'Payroll & HR', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { id: 'leave', label: 'Leave Requests', icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50' },
      { id: 'phases', label: 'Schedule Phases', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { id: 'timetable', label: 'Timetable Editor', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { id: 'transport', label: 'Fleet Manager', icon: Bus, color: 'text-amber-600', bg: 'bg-amber-50' },
      { id: 'media', label: 'CMS & Media', icon: Image, color: 'text-purple-600', bg: 'bg-purple-50' },
      { id: 'config', label: 'Configurations', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-50' },
      { id: 'inbox', label: 'Inbox', icon: Mail, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  if (loading) return <Loader fullScreen text="Establishing Secure Management Protocols..." />;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {submitting && <Loader fullScreen text="Processing Administrative Change..." />}
      
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-indigo-100/50" />
          <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
                  {menuItems.find(m => m.id === activeTab)?.label || 'Management'}
              </h1>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3 flex items-center gap-2">
                  <Shield size={14} className="text-indigo-500" /> Administrative Command Center
              </p>
          </div>
      </div>

      {/* Content Switcher */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === 'staff' && <StaffHub staffList={staffList} refresh={fetchDashboardData} />}
          {activeTab === 'salary' && <PayrollManager staffList={staffList} salaries={salaries} refresh={fetchDashboardData} />}
          {activeTab === 'leave' && <LeaveApprover leaves={leaves} refresh={fetchDashboardData} />}
          {(activeTab === 'phases' || activeTab === 'timetable') && <ScheduleManager classes={classes} phases={phases} teachers={staffList.teachers} refresh={fetchDashboardData} activeView={activeTab} setSubmitting={setSubmitting} />}
          {activeTab === 'transport' && <FleetManager buses={buses} otherStaff={staffList.otherStaff} students={students} refresh={fetchDashboardData} />}
          {activeTab === 'media' && <CMSMedia refresh={fetchDashboardData} />}
          {activeTab === 'config' && <ConfigPanel config={schoolConfig} refresh={fetchDashboardData} />}
          {activeTab === 'inbox' && <InboxManager messages={messages} refresh={fetchDashboardData} />}
      </div>
    </div>
  );
};

const LeaveApprover = ({ leaves, refresh }) => {
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [adminComment, setAdminComment] = useState('');

    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.patch(`/management/leave/status/${id}`, { status, adminComment });
            toast.success(`Leave request ${status}`);
            setSelectedLeave(null);
            setAdminComment('');
            refresh();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <FileText className="text-rose-600" size={32} /> Leave Registry
            </h2>

            <div className="grid grid-cols-1 gap-4">
                {leaves.map(l => (
                    <div key={l._id} className={`p-8 bg-white rounded-[2rem] border transition-all ${l.status === 'Pending' ? 'border-rose-200 shadow-lg shadow-rose-50' : 'border-gray-100 opacity-70 hover:opacity-100'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${l.status === 'Pending' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    {l.teacher?.name?.charAt(0) || 'T'}
                                </div>
                                <div>
                                    <div className="font-black text-lg text-gray-800">{l.teacher?.name || 'Unknown Teacher'}</div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{l.leaveType} | Applied on {new Date(l.appliedDate).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                l.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                l.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                                {l.status}
                            </div>
                        </div>

                        <div className="pl-18 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Duration</div>
                                        <div className="text-xs font-black text-gray-700">
                                            {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Reason for Absence</div>
                                        <div className="text-xs font-bold text-gray-500 italic leading-relaxed">"{l.reason}"</div>
                                    </div>
                                </div>

                                {l.status === 'Pending' ? (
                                    <div className="space-y-4">
                                        <textarea 
                                            placeholder="Add administrative comment..."
                                            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-xs focus:ring-4 focus:ring-indigo-50 min-h-[100px]"
                                            value={adminComment}
                                            onChange={(e) => setAdminComment(e.target.value)}
                                        />
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => handleStatusUpdate(l._id, 'Approved')}
                                                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:opacity-90 transition"
                                            >Approve Request</button>
                                            <button 
                                                onClick={() => handleStatusUpdate(l._id, 'Rejected')}
                                                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-100 hover:opacity-90 transition"
                                            >Reject Request</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                                        <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Admin Resolution</div>
                                        <div className="text-xs font-bold text-indigo-700">{l.adminComment || "No comments provided."}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {leaves.length === 0 && <div className="p-20 text-center text-gray-300 font-black italic uppercase tracking-widest">No leave records found in the archive...</div>}
            </div>
        </div>
    );
};

// --- Sub-Components ---

const StaffHub = ({ staffList, refresh }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '', role: 'Teacher',
        idNum: '', department: '', salary: '', address: '', dateOfJoining: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/management/staff/add', formData);
            toast.success("Staff member added!");
            setShowAdd(false);
            refresh();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add staff");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Staff Hub</h2>
                <button 
                    onClick={() => setShowAdd(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-100"
                >
                    <Plus size={18} /> Add New Personal
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                        <Star className="text-amber-500" size={20} /> Faculty Members ({staffList.teachers.length})
                    </h3>
                    <div className="space-y-4">
                        {staffList.teachers.map(t => (
                            <div key={t._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center font-black text-blue-600 text-xs">{t.name.charAt(0)}</div>
                                <div>
                                    <div className="font-black text-sm text-gray-800">{t.name}</div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.subject} Specialist</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                        <Users className="text-emerald-500" size={20} /> Support & Services ({staffList.otherStaff.length})
                    </h3>
                    <div className="space-y-4">
                        {staffList.otherStaff.map(s => (
                            <div key={s._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center font-black text-emerald-600 text-xs">{s.name.charAt(0)}</div>
                                <div>
                                    <div className="font-black text-sm text-gray-800">{s.name}</div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.role} | {s.department || 'General'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showAdd && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
                            <h2 className="text-2xl font-black tracking-tight">Onboard New Personal</h2>
                            <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-white/20 rounded-xl transition"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name *</label>
                                    <input type="text" required className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Designation / Role *</label>
                                    <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                                        <option value="Teacher">Teacher</option>
                                        <option value="BusDriver">Bus Driver</option>
                                        <option value="LabAssistant">Lab Assistant</option>
                                        <option value="CleaningStaff">Cleaning Staff</option>
                                        <option value="AdmissionCell">Admission Officer</option>
                                        <option value="ManagementCell">Management Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address *</label>
                                    <input type="email" required className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Phone *</label>
                                    <input type="text" required className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Staff ID / Payroll ID</label>
                                    <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm" value={formData.idNum} onChange={(e) => setFormData({...formData, idNum: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Base Salary *</label>
                                    <input type="number" required className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm" value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Password *</label>
                                <input type="password" required className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                            </div>
                            <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
                                <button type="button" onClick={() => setShowAdd(false)} className="px-8 py-4 text-gray-400 font-black uppercase text-xs tracking-widest hover:bg-gray-50 rounded-2xl transition">Abort</button>
                                <button type="submit" className="px-10 py-4 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-blue-100 hover:opacity-90">Confirm Onboarding</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const PayrollManager = ({ staffList, salaries, refresh }) => {
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [viewHistory, setViewHistory] = useState(null); // Staff object for history
    const [viewReceipt, setViewReceipt] = useState(null); // Salary record for receipt
    const [formData, setFormData] = useState({
        month: 'April', year: 2026, bonus: 0, increment: 0, hike: 0, status: 'Paid', paymentMethod: 'Bank Transfer'
    });

    const allStaff = [
        ...staffList.teachers.map(t => ({ ...t, model: 'Teacher' })),
        ...staffList.otherStaff.map(s => ({ ...s, model: 'Staff' }))
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/management/salary/save', {
                staffId: selectedStaff._id,
                staffModel: selectedStaff.model,
                baseSalary: selectedStaff.salary || 30000,
                ...formData
            });
            toast.success(`Payroll processed for ${selectedStaff.name}`);
            setSelectedStaff(null);
            refresh();
        } catch (error) {
            toast.error("Payroll processing failed");
        }
    };

    const getLastPaid = (staffId) => {
        const staffSalaries = salaries.filter(s => (s.staff?._id || s.staff) === staffId && s.status === 'Paid');
        if (staffSalaries.length === 0) return 'Never';
        const last = staffSalaries[0]; // Already sorted by date in backend
        return `${last.month} ${last.year}`;
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <DollarSign className="text-emerald-600" size={32} /> Payroll & HR
            </h2>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black">Process Staff Payments</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                <th className="pb-4">Name</th>
                                <th className="pb-4">Base Salary</th>
                                <th className="pb-4">Last Paid</th>
                                <th className="pb-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {allStaff.map(staff => (
                                <tr key={staff._id}>
                                    <td className="py-4">
                                        <div className="font-black text-sm text-gray-800">{staff.name}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{staff.role}</div>
                                    </td>
                                    <td className="py-4 font-black text-emerald-600">₹{staff.salary || '30,000'}</td>
                                    <td className="py-4 text-xs font-bold text-gray-500">{getLastPaid(staff._id)}</td>
                                    <td className="py-4 text-right space-x-2">
                                        <button 
                                            onClick={() => setViewHistory(staff)}
                                            className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase hover:bg-slate-900 hover:text-white transition"
                                        >History</button>
                                        <button 
                                            onClick={() => setSelectedStaff(staff)}
                                            className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition"
                                        >Pay Now</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Salary History Modal */}
            {viewHistory && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black">Payment History</h2>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">{viewHistory.name} ({viewHistory.role})</p>
                            </div>
                            <button onClick={() => setViewHistory(null)} className="p-2 hover:bg-white/20 rounded-xl"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                            {salaries.filter(s => (s.staff?._id || s.staff) === viewHistory._id).map(record => (
                                <div key={record._id} className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-emerald-600 font-black shadow-sm text-xs">
                                            {record.month.slice(0, 3)}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-800 text-sm">{record.month} {record.year}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{record.status} via {record.paymentMethod}</div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-6">
                                        <div>
                                            <div className="font-black text-emerald-600 text-sm">₹{record.totalAmount}</div>
                                            <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Total Paid</div>
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
                            {salaries.filter(s => (s.staff?._id || s.staff) === viewHistory._id).length === 0 && (
                                <div className="text-center py-20 text-gray-300 italic font-bold">No payment records found for this staff member</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {viewReceipt && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in duration-300">
                        <div className="p-12 space-y-10" id="salary-receipt">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-4">
                                        <DollarSign size={24} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Salary Receipt</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Academic Payroll System</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Receipt #</div>
                                    <div className="font-mono text-sm font-bold text-gray-400">{viewReceipt._id.slice(-8).toUpperCase()}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 border-y border-gray-100 py-8">
                                <div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payee</div>
                                    <div className="font-black text-slate-800">{viewReceipt.staff?.name || viewHistory?.name}</div>
                                    <div className="text-xs font-bold text-gray-500">{viewReceipt.staff?.role || viewHistory?.role}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Period</div>
                                    <div className="font-black text-slate-800">{viewReceipt.month} {viewReceipt.year}</div>
                                    <div className="text-xs font-bold text-gray-500">Paid on {new Date(viewReceipt.paymentDate).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm font-bold text-gray-600">
                                    <span>Base Component</span>
                                    <span>₹{viewReceipt.baseSalary}</span>
                                </div>
                                {viewReceipt.bonus > 0 && (
                                    <div className="flex justify-between text-sm font-bold text-emerald-600">
                                        <span>Bonus / Incentives</span>
                                        <span>+ ₹{viewReceipt.bonus}</span>
                                    </div>
                                )}
                                {viewReceipt.increment > 0 && (
                                    <div className="flex justify-between text-sm font-bold text-indigo-600">
                                        <span>Salary Increment</span>
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
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Total Amount</span>
                                    <span className="text-2xl font-black text-slate-900">₹{viewReceipt.totalAmount}</span>
                                </div>
                            </div>

                            <div className="pt-10 flex flex-col items-center">
                                <div className="w-24 h-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center mb-4">
                                    <div className="text-[8px] font-black text-gray-300 uppercase rotate-[-45deg]">Official Seal</div>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-[0.2em]">Computer Generated Receipt<br/>No Signature Required</p>
                            </div>
                        </div>
                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                            <button 
                                onClick={() => window.print()} 
                                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition flex items-center justify-center gap-2 shadow-xl shadow-slate-100"
                            >
                                <Plus size={18} /> Print Receipt
                            </button>
                            <button 
                                onClick={() => setViewReceipt(null)} 
                                className="px-8 py-4 bg-white text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest border border-gray-100 hover:bg-gray-100 transition"
                            >Close</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedStaff && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                        <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black">Process Salary</h2>
                                <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mt-1">{selectedStaff.name} ({selectedStaff.role})</p>
                            </div>
                            <button onClick={() => setSelectedStaff(null)} className="p-2 hover:bg-white/20 rounded-xl"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Billing Month</label>
                                    <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.month} onChange={(e) => setFormData({...formData, month: e.target.value})}>
                                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => <option key={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bonus / Incentive</label>
                                    <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.bonus} onChange={(e) => setFormData({...formData, bonus: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Increment / Hike</label>
                                    <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.increment} onChange={(e) => setFormData({...formData, increment: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Method</label>
                                    <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}>
                                        <option>Bank Transfer</option>
                                        <option>Cash</option>
                                        <option>Cheque</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center">
                                <span className="font-black text-emerald-800">TOTAL PAYABLE:</span>
                                <span className="text-2xl font-black text-emerald-600">₹{Number(selectedStaff.salary || 30000) + Number(formData.bonus) + Number(formData.increment)}</span>
                            </div>
                            <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 hover:opacity-90">Authorize Payment</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const FleetManager = ({ buses, otherStaff, students, refresh }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [editingBus, setEditingBus] = useState(null);
    const [assigningTo, setAssigningTo] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedStopForBulk, setSelectedStopForBulk] = useState('');
    const [batchJoiningDate, setBatchJoiningDate] = useState(new Date().toISOString().split('T')[0]);
    const [showNewStopInput, setShowNewStopInput] = useState(false);
    const [newStop, setNewStop] = useState({ stopName: '', fee: 0 });

    const [formData, setFormData] = useState({ 
        busNumber: '', 
        route: '', 
        capacity: 40, 
        driver: '', 
        status: 'Active',
        stops: [{ stopName: '', fee: 0 }] 
    });

    const drivers = otherStaff.filter(s => s.role === 'BusDriver');
    
    // Students not assigned to any bus
    const unassignedStudents = students.filter(s => !s.bus);

    const filteredUnassigned = unassignedStudents.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.rollNum && s.rollNum.toString().includes(searchTerm))
    );

    const handleAddStop = () => {
        setFormData({
            ...formData,
            stops: [...formData.stops, { stopName: '', fee: 0 }]
        });
    };

    const handleRemoveStop = (index) => {
        const newStops = formData.stops.filter((_, i) => i !== index);
        setFormData({ ...formData, stops: newStops });
    };

    const handleStopChange = (index, field, value) => {
        const newStops = [...formData.stops];
        newStops[index][field] = value;
        setFormData({ ...formData, stops: newStops });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBus) {
                await axios.put(`/management/bus/${editingBus._id}`, formData);
                toast.success("Bus details updated");
            } else {
                await axios.post('/management/bus/add', formData);
                toast.success("Bus added to fleet");
            }
            setShowAdd(false);
            setEditingBus(null);
            setFormData({ 
                busNumber: '', 
                route: '', 
                capacity: 40, 
                driver: '', 
                status: 'Active',
                stops: [{ stopName: '', fee: 0 }] 
            });
            refresh();
        } catch (error) {
            toast.error(editingBus ? "Update failed" : "Failed to add bus");
        }
    };

    const handleEditBus = (bus) => {
        setEditingBus(bus);
        setFormData({
            busNumber: bus.busNumber,
            route: bus.route,
            capacity: bus.capacity,
            driver: bus.driver?._id || bus.driver || '',
            status: bus.status,
            stops: bus.stops && bus.stops.length > 0 ? bus.stops : [{ stopName: '', fee: 0 }]
        });
        setShowAdd(true);
    };

    const handleAssign = async (studentId, busId, busStop, busJoiningDate) => {
        if (!busStop) return toast.error("Please select a stop");
        try {
            await axios.post('/management/bus/assign-student', { 
                studentId, 
                busId, 
                busStop,
                busJoiningDate: busJoiningDate || new Date()
            });
            toast.success("Student assigned!");
            refresh();
        } catch (error) {
            toast.error(error.response?.data?.message || "Assignment failed");
        }
    };

    const handleBulkAssign = async () => {
        if (selectedStudents.length === 0) return toast.error("No students selected");
        if (!selectedStopForBulk) return toast.error("Please select a stop for bulk assignment");

        try {
            await Promise.all(selectedStudents.map(id => 
                axios.post('/management/bus/assign-student', { 
                    studentId: id, 
                    busId: assigningTo._id, 
                    busStop: selectedStopForBulk,
                    busJoiningDate: batchJoiningDate
                })
            ));
            toast.success(`${selectedStudents.length} students assigned to ${selectedStopForBulk}`);
            setSelectedStudents([]);
            refresh();
        } catch (error) {
            toast.error("Bulk assignment failed");
        }
    };

    const handleAddNewStopToBus = async () => {
        if (!newStop.stopName || !newStop.fee) return toast.error("Stop details incomplete");
        try {
            const updatedStops = [...(assigningTo.stops || []), newStop];
            await axios.put(`/management/bus/${assigningTo._id}`, { stops: updatedStops });
            toast.success("New stop created");
            setAssigningTo({ ...assigningTo, stops: updatedStops });
            setShowNewStopInput(false);
            setNewStop({ stopName: '', fee: 0 });
            refresh();
        } catch (error) {
            toast.error("Failed to add stop");
        }
    };

    const toggleStudentSelection = (id) => {
        setSelectedStudents(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleUnassign = async (studentId) => {
        try {
            await axios.post('/management/bus/assign-student', { studentId, busId: null });
            toast.success("Student removed from bus");
            refresh();
        } catch (error) {
            toast.error("Unassignment failed");
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <Bus className="text-amber-600" size={32} /> Fleet Manager
                </h2>
                <button 
                    onClick={() => setShowAdd(true)}
                    className="px-6 py-3 bg-amber-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-700 transition flex items-center gap-2 shadow-lg shadow-amber-100"
                >
                    <Plus size={18} /> Register Vehicle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {buses.map(bus => {
                    const assignedCount = students.filter(s => s.bus?._id === bus._id || s.bus === bus._id).length;
                    return (
                        <div key={bus._id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative group overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 text-gray-50 group-hover:text-amber-50 transition-colors">
                                <Bus size={120} />
                            </div>
                            <div className="relative z-10 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase">{bus.status}</div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditBus(bus)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition">
                                            <Edit size={16} />
                                        </button>
                                        <span className="font-black text-gray-300 text-xl">#{bus.busNumber}</span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-800 text-lg uppercase">{bus.route}</h4>
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-1">
                                        <MapPin size={12} /> {bus.route.split('-').length > 1 ? bus.route : 'Active Route Hub'}
                                    </div>
                                    {bus.stops && bus.stops.length > 0 && (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-2xl space-y-2 border border-gray-100">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
                                                <span>Stops</span>
                                                <span>Fee</span>
                                            </div>
                                            {bus.stops.map((stop, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-[11px] font-bold text-gray-600">
                                                    <span>{stop.stopName}</span>
                                                    <span className="text-amber-600">₹{stop.fee}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-[10px] text-gray-400">{bus.driver?.name?.charAt(0) || '?'}</div>
                                        <div>
                                            <div className="text-[10px] font-black text-gray-800 flex items-center gap-1">
                                                {bus.driver?.name || 'No Driver'}
                                                {bus.driver && <CheckCircle size={10} className="text-blue-500" />}
                                            </div>
                                            <div className="text-[8px] font-bold text-gray-400 uppercase">Operator</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-gray-800">{assignedCount} / {bus.capacity}</div>
                                        <div className="text-[8px] font-bold text-gray-400 uppercase">Students</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setAssigningTo(bus)}
                                    className="w-full py-3 bg-gray-50 hover:bg-amber-50 text-gray-400 hover:text-amber-600 rounded-xl font-black text-[10px] uppercase transition flex items-center justify-center gap-2"
                                >
                                    <Users size={14} /> Manage Assignment
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Assignment Modal */}
            {assigningTo && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black">Fleet Assignment</h2>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Bus #{assigningTo.busNumber} | {assigningTo.route}</p>
                            </div>
                            <button onClick={() => setAssigningTo(null)} className="p-2 hover:bg-white/20 rounded-xl transition"><X size={24} /></button>
                        </div>
                        
                        {/* Assignment Header Tools */}
                        <div className="p-6 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search student by name or roll number..." 
                                    className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl text-xs font-bold border-none shadow-sm focus:ring-2 focus:ring-slate-200"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex gap-3 items-center">
                                {selectedStudents.length > 0 && (
                                    <div className="flex gap-2 items-center animate-in slide-in-from-right-4">
                                        <input 
                                            type="date" 
                                            className="p-3 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest border-none shadow-sm"
                                            value={batchJoiningDate}
                                            onChange={(e) => setBatchJoiningDate(e.target.value)}
                                        />
                                        <select 
                                            className="p-3 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest border-none shadow-sm"
                                            value={selectedStopForBulk}
                                            onChange={(e) => setSelectedStopForBulk(e.target.value)}
                                        >
                                            <option value="">Choose Stop</option>
                                            {assigningTo.stops?.map((s, i) => (
                                                <option key={i} value={s.stopName}>{s.stopName}</option>
                                            ))}
                                        </select>
                                        <button 
                                            onClick={handleBulkAssign}
                                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"
                                        >Assign {selectedStudents.length} Selected</button>
                                    </div>
                                )}
                                
                                <button 
                                    onClick={() => setShowNewStopInput(!showNewStopInput)}
                                    className="p-3 bg-white text-blue-600 rounded-xl shadow-sm hover:bg-blue-50 transition flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                >
                                    <Plus size={16} /> {showNewStopInput ? 'Cancel Stop' : 'Create New Stop'}
                                </button>
                            </div>
                        </div>

                        {showNewStopInput && (
                            <div className="p-6 bg-blue-50 flex gap-4 animate-in slide-in-from-top-4">
                                <input 
                                    type="text" 
                                    placeholder="New Stop Name" 
                                    className="flex-1 p-3 bg-white rounded-xl text-xs font-bold border-none" 
                                    value={newStop.stopName}
                                    onChange={(e) => setNewStop({...newStop, stopName: e.target.value})}
                                />
                                <input 
                                    type="number" 
                                    placeholder="Fee" 
                                    className="w-32 p-3 bg-white rounded-xl text-xs font-bold border-none" 
                                    value={newStop.fee}
                                    onChange={(e) => setNewStop({...newStop, fee: Number(e.target.value)})}
                                />
                                <button 
                                    onClick={handleAddNewStopToBus}
                                    className="px-6 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                >Confirm Stop</button>
                            </div>
                        )}
                        
                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            {/* Currently Assigned */}
                            <div className="w-full md:w-1/2 p-8 border-r border-gray-100 overflow-y-auto custom-scrollbar">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                    <CheckCircle size={16} className="text-emerald-500" /> Assigned Students
                                </h3>
                                <div className="space-y-3">
                                    {students.filter(s => s.bus?._id === assigningTo._id || s.bus === assigningTo._id).map(student => (
                                        <div key={student._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-[10px]">{student.name.charAt(0)}</div>
                                                <div>
                                                    <div className="text-xs font-black text-gray-800">{student.name}</div>
                                                    <div className="text-[8px] font-bold text-gray-400 uppercase">Stop: {student.busStop || 'Not set'}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleUnassign(student._id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                    {students.filter(s => s.bus?._id === assigningTo._id || s.bus === assigningTo._id).length === 0 && (
                                        <div className="text-center py-10 text-gray-300 italic text-xs font-bold">No students assigned yet</div>
                                    )}
                                </div>
                            </div>

                            {/* Unassigned Pool */}
                            <div className="w-full md:w-1/2 p-8 bg-gray-50/50 overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <Users size={16} className="text-blue-500" /> Available ({filteredUnassigned.length})
                                    </h3>
                                    {filteredUnassigned.length > 0 && (
                                        <button 
                                            onClick={() => setSelectedStudents(selectedStudents.length === filteredUnassigned.length ? [] : filteredUnassigned.map(s => s._id))}
                                            className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline"
                                        >
                                            {selectedStudents.length === filteredUnassigned.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {filteredUnassigned.map(student => (
                                        <div key={student._id} className={`p-4 bg-white rounded-2xl shadow-sm border transition-all ${selectedStudents.includes(student._id) ? 'border-blue-400 bg-blue-50/30' : 'border-gray-100'} space-y-3`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                                                        checked={selectedStudents.includes(student._id)}
                                                        onChange={() => toggleStudentSelection(student._id)}
                                                    />
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black text-[10px]">{student.name.charAt(0)}</div>
                                                    <div>
                                                        <div className="text-xs font-black text-gray-800">{student.name}</div>
                                                        <div className="text-[8px] font-bold text-gray-400 uppercase">{student.sClass?.name || 'No Class'} • Roll: {student.rollNum || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            {!selectedStudents.includes(student._id) && (
                                                <div className="flex flex-col gap-3 animate-in fade-in">
                                                    <div className="flex gap-2 items-center">
                                                        <input 
                                                            type="date" 
                                                            id={`date-${student._id}`}
                                                            className="flex-1 p-2 bg-gray-50 rounded-xl text-[10px] font-bold border-none"
                                                            defaultValue={new Date().toISOString().split('T')[0]}
                                                        />
                                                        <select 
                                                            id={`stop-${student._id}`}
                                                            className="flex-1 p-2 bg-gray-50 rounded-xl text-[10px] font-bold border-none"
                                                        >
                                                            <option value="">Select Stop</option>
                                                            {assigningTo.stops?.map((s, i) => (
                                                                <option key={i} value={s.stopName}>{s.stopName} (₹{s.fee})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            const stop = document.getElementById(`stop-${student._id}`).value;
                                                            const joiningDate = document.getElementById(`date-${student._id}`).value;
                                                            handleAssign(student._id, assigningTo._id, stop, joiningDate);
                                                        }}
                                                        className="w-full py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:opacity-90 transition"
                                                    >Assign Individual</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {filteredUnassigned.length === 0 && (
                                        <div className="text-center py-10 text-gray-300 italic text-xs font-bold">No students matching search criteria</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showAdd && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                        <div className="p-8 bg-amber-600 text-white flex justify-between items-center">
                            <h2 className="text-2xl font-black">{editingBus ? 'Update Vehicle' : 'Register Bus'}</h2>
                            <button onClick={() => { setShowAdd(false); setEditingBus(null); }} className="p-2 hover:bg-white/20 rounded-xl transition"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bus Number *</label>
                                    <input type="text" required placeholder="MH-12-AB-1234" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.busNumber} onChange={(e) => setFormData({...formData, busNumber: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacity</label>
                                    <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Route Details *</label>
                                <input type="text" required placeholder="Downtown - School Suburb" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.route} onChange={(e) => setFormData({...formData, route: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assign Driver</label>
                                <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.driver} onChange={(e) => setFormData({...formData, driver: e.target.value})}>
                                    <option value="">Select Driver</option>
                                    {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Route Stops & Fees</label>
                                    <button type="button" onClick={handleAddStop} className="text-amber-600 hover:text-amber-700 font-black text-[10px] uppercase flex items-center gap-1">
                                        <Plus size={14} /> Add Stop
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {formData.stops.map((stop, index) => (
                                        <div key={index} className="flex gap-3 items-center animate-in slide-in-from-left-2 duration-300">
                                            <input 
                                                type="text" 
                                                placeholder="Stop Name" 
                                                required 
                                                className="flex-1 p-4 bg-gray-50 rounded-2xl font-bold text-sm" 
                                                value={stop.stopName} 
                                                onChange={(e) => handleStopChange(index, 'stopName', e.target.value)} 
                                            />
                                            <input 
                                                type="number" 
                                                placeholder="Fee" 
                                                required 
                                                className="w-24 p-4 bg-gray-50 rounded-2xl font-bold text-sm" 
                                                value={stop.fee} 
                                                onChange={(e) => handleStopChange(index, 'fee', Number(e.target.value))} 
                                            />
                                            {formData.stops.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveStop(index)} className="p-3 text-rose-400 hover:bg-rose-50 rounded-xl transition">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="w-full py-5 bg-amber-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-100 hover:opacity-90">Deploy Vehicle</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const CMSMedia = ({ refresh }) => {
    const [activeSub, setActiveSub] = useState('gallery');
    const [formData, setFormData] = useState({ title: '', category: 'Event', image: '', type: 'Achievement', description: '', images: [] });

    const handleAdd = async (endpoint) => {
        try {
            await axios.post(`/management/${endpoint}/add`, formData);
            toast.success("Content published to academic hub!");
            setFormData({ title: '', category: 'Event', image: '', type: 'Achievement', description: '', images: [] });
            refresh();
        } catch (error) {
            toast.error("Deployment failed");
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <Image className="text-purple-600" size={32} /> Content Manager
            </h2>

            <div className="flex gap-4">
                {['gallery', 'achievement', 'carousel'].map(t => (
                    <button key={t} onClick={() => setActiveSub(t)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSub === t ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'bg-white text-gray-400 border border-gray-100'}`}>
                        {t}
                    </button>
                ))}
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
                {activeSub === 'gallery' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gallery Title</label>
                                <input type="text" placeholder="e.g. Annual Sports Day 2026" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Classification</label>
                                <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                                    <option>Event</option>
                                    <option>Celebration</option>
                                    <option>Activity</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Photography (Multiple Support)</label>
                            <ImageUpload 
                                multiple={true}
                                label="Upload Gallery Assets"
                                onUploadSuccess={(urls) => setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }))}
                            />
                            {formData.images.length > 0 && (
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-4 mt-4">
                                    {formData.images.map((url, i) => (
                                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100 shadow-sm">
                                            <img src={url} className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                                                className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button onClick={() => handleAdd('gallery')} className="px-10 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-100 transition hover:bg-purple-700">Publish to Public Gallery</button>
                    </div>
                )}

                {activeSub === 'achievement' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Achievement Header</label>
                                <input type="text" placeholder="e.g. Gold Medal in Olympiad" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Archive Location</label>
                                <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                                    <option value="Achievement">General Achievement</option>
                                    <option value="WallOfFame">Wall of Fame</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Detailed Description</label>
                            <textarea placeholder="Summarize the achievement..." className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm min-h-[100px]" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Accolade Photo</label>
                            <ImageUpload 
                                preview={formData.image}
                                label="Upload Award Media"
                                onUploadSuccess={(url) => setFormData(prev => ({ ...prev, image: url }))}
                            />
                        </div>
                        <button onClick={() => handleAdd('achievement')} className="px-10 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-100 transition hover:bg-purple-700">Record to Institution Archive</button>
                    </div>
                )}

                {activeSub === 'carousel' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Slide Title</label>
                                <input type="text" placeholder="Featured Event Title" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subtitle / Context</label>
                                <input type="text" placeholder="Short descriptive caption" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Slide Visual (High Res Recommended)</label>
                            <ImageUpload 
                                preview={formData.image}
                                label="Upload Carousel Slide"
                                onUploadSuccess={(url) => setFormData(prev => ({ ...prev, image: url }))}
                            />
                        </div>
                        <button onClick={() => handleAdd('carousel')} className="px-10 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-100 transition hover:bg-purple-700">Deploy to Homepage</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ConfigPanel = ({ config, refresh }) => {
    const [formData, setFormData] = useState({ 
        name: '', 
        establishedYear: 2000,
        sessionStart: '',
        sessionEnd: '',
        email: '',
        phone: '',
        address: '',
        logo: ''
    });

    useEffect(() => {
        if (config) {
            setFormData({
                name: config.name || '',
                establishedYear: config.establishedYear || 2000,
                sessionStart: config.sessionStart ? config.sessionStart.split('T')[0] : '',
                sessionEnd: config.sessionEnd ? config.sessionEnd.split('T')[0] : '',
                email: config.email || '',
                phone: config.phone || '',
                address: config.address || '',
                logo: config.logo || ''
            });
        }
    }, [config]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put('/management/school/config', formData);
            toast.success("Academic configuration updated");
            refresh();
        } catch (error) {
            toast.error("Update failed");
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <Settings className="text-slate-600" size={32} /> Configurations
            </h2>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
                <form onSubmit={handleUpdate} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Institutional Name</label>
                            <input type="text" required className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm border-none focus:ring-4 focus:ring-slate-100" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Established Year</label>
                            <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm border-none focus:ring-4 focus:ring-slate-100" value={formData.establishedYear} onChange={(e) => setFormData({...formData, establishedYear: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Institution Logo</label>
                        <ImageUpload 
                            label="Upload School Branding"
                            preview={formData.logo}
                            onUploadSuccess={(url) => setFormData(prev => ({ ...prev, logo: url }))}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Email</label>
                            <input type="email" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm border-none focus:ring-4 focus:ring-slate-100" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Phone</label>
                            <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm border-none focus:ring-4 focus:ring-slate-100" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mailing Address</label>
                        <textarea className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm border-none focus:ring-4 focus:ring-slate-100 min-h-[100px]" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                    </div>

                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                            <Calendar size={16} /> Academic Session Period
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Session Start Date</label>
                                <input type="date" className="w-full p-4 bg-white rounded-2xl font-bold text-sm border border-slate-100" value={formData.sessionStart} onChange={(e) => setFormData({...formData, sessionStart: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Session End Date</label>
                                <input type="date" className="w-full p-4 bg-white rounded-2xl font-bold text-sm border border-slate-100" value={formData.sessionEnd} onChange={(e) => setFormData({...formData, sessionEnd: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-100 hover:opacity-90 transition flex items-center gap-3">
                        <Save size={18} /> Synchronize Configuration
                    </button>
                </form>
            </div>
        </div>
    );
};

const InboxManager = ({ messages, refresh }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [filter, setFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    
    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.put(`/management/messages/${id}/read`, { status });
            toast.success(`Message marked as ${status}`);
            refresh();
        } catch (error) {
            console.error("Failed to update message status", error);
            toast.error("Failed to update status");
        }
    };

    const filteredMessages = messages.filter(msg => {
        const matchesCategory = filter === 'All' || 
            (filter === 'Bus' && (msg.type === 'BusRequest' || msg.subject?.includes('BUS'))) ||
            (filter === 'Contact' && (msg.type === 'Contact' || msg.source === 'ContactForm'));
        
        const matchesStatus = statusFilter === 'All' || msg.status === statusFilter;
        
        return matchesCategory && matchesStatus;
    });

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Mail className="text-rose-600" size={32} /> Communications Inbox
                    </h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2 ml-11">
                        {user.role === 'ManagementCell' ? 'Website Inquiries & Transport Requests' : 'All System Communications'}
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                        {['All', 'Bus', 'Contact'].map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === cat ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-400'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <select 
                        className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 text-[9px] font-black uppercase tracking-widest outline-none"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Unread">Unread</option>
                        <option value="Approved">Approved</option>
                        <option value="Read">Read</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {filteredMessages.map(msg => (
                    <div key={msg._id} className={`p-8 bg-white rounded-[2rem] border transition-all ${msg.status === 'Unread' || msg.status === 'Pending' ? 'border-rose-200 shadow-lg shadow-rose-50' : 'border-gray-100 opacity-70 hover:opacity-100'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${msg.status === 'Unread' || msg.status === 'Pending' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    {msg.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-black text-gray-800">{msg.name}</div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{msg.email}</div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <span className="text-[10px] font-bold text-gray-400">{new Date(msg.date).toLocaleString()}</span>
                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    msg.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                                    msg.status === 'Solved' || msg.status === 'Resolved' ? 'bg-blue-100 text-blue-600' :
                                    msg.status === 'Read' ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-600'
                                }`}>
                                    {msg.status}
                                </div>
                            </div>
                        </div>
                        <div className="pl-16 space-y-4">
                            <div>
                                <div className="text-sm font-black text-gray-700">{msg.subject || 'No Subject'}</div>
                                <p className="text-xs font-bold text-gray-500 leading-relaxed italic mt-1">"{msg.message}"</p>
                            </div>

                            {(msg.status === 'Unread' || msg.status === 'Pending') && (
                                <div className="flex gap-3">
                                    {msg.subject?.includes("BUS") ? (
                                        <button 
                                            onClick={() => handleStatusUpdate(msg._id, 'Approved')}
                                            className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:opacity-90"
                                        >
                                            Approve Request
                                        </button>
                                    ) : user.role === 'Admin' && (msg.type === 'Problem' || msg.type === 'Feedback') ? (
                                        <button 
                                            onClick={() => handleStatusUpdate(msg._id, 'Solved')}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:opacity-90"
                                        >
                                            Mark as Solved
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleStatusUpdate(msg._id, 'Read')}
                                            className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90"
                                        >
                                            Mark as Read
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {messages.length === 0 && <div className="p-20 text-center text-gray-400 font-bold italic">No messages in the communications archive...</div>}
            </div>
        </div>
    );
};

const ScheduleManager = ({ classes, phases, teachers, refresh, activeView, setSubmitting }) => {
    const [showAddPhase, setShowAddPhase] = useState(false);
    const [editingPhaseId, setEditingPhaseId] = useState(null);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedPhase, setSelectedPhase] = useState('');
    const [timetableData, setTimetableData] = useState([]);
    const [editingSlot, setEditingSlot] = useState(null); // { day, slotIndex }

    const [phaseForm, setPhasePhaseForm] = useState({
        name: '', startDate: '', endDate: '',
        reportingTime: '08:00', leavingTime: '14:00',
        slots: [{ label: 'Period 1', startTime: '08:00', endTime: '08:45', type: 'Period' }]
    });

    const [slotEditForm, setSlotEditForm] = useState({ subject: '', teacher: '' });

    useEffect(() => {
        if (selectedClass && selectedPhase) {
            fetchTimetable();
        }
    }, [selectedClass, selectedPhase]);

    const fetchTimetable = async () => {
        try {
            const res = await axios.get(`/management/schedule/timetable/${selectedClass}/${selectedPhase}`);
            setTimetableData(res.data);
        } catch (error) {
            toast.error("Failed to load timetable");
        }
    };

    const handleAddSlot = () => {
        setPhasePhaseForm({
            ...phaseForm,
            slots: [...phaseForm.slots, { label: `Period ${phaseForm.slots.length + 1}`, startTime: '', endTime: '', type: 'Period' }]
        });
    };

    const validateSlots = () => {
        const { reportingTime, leavingTime, slots } = phaseForm;
        
        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            
            // Check boundaries
            if (slot.startTime < reportingTime) {
                toast.error(`${slot.label} starts before reporting time (${reportingTime})`);
                return false;
            }
            if (slot.endTime > leavingTime) {
                toast.error(`${slot.label} ends after school leaving time (${leavingTime})`);
                return false;
            }
            if (slot.startTime >= slot.endTime) {
                toast.error(`${slot.label} start time must be before end time`);
                return false;
            }

            // Check overlap with other slots
            for (let j = i + 1; j < slots.length; j++) {
                const other = slots[j];
                if (
                    (slot.startTime < other.endTime && slot.endTime > other.startTime)
                ) {
                    toast.error(`Overlap detected between ${slot.label} and ${other.label}`);
                    return false;
                }
            }
        }
        return true;
    };

    const handlePhaseSubmit = async (e) => {
        e.preventDefault();
        if (!validateSlots()) return;

        setSubmitting(true);
        try {
            if (editingPhaseId) {
                await axios.post(`/management/schedule/phase/update/${editingPhaseId}`, phaseForm);
                toast.success("Schedule phase updated");
            } else {
                await axios.post('/management/schedule/phase/add', phaseForm);
                toast.success("Schedule phase created");
            }
            setShowAddPhase(false);
            setEditingPhaseId(null);
            refresh();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save phase");
        } finally {
            setSubmitting(false);
        }
    };

    const openEditPhase = (phase) => {
        setPhasePhaseForm({
            name: phase.name,
            startDate: phase.startDate.split('T')[0],
            endDate: phase.endDate.split('T')[0],
            reportingTime: phase.reportingTime || '08:00',
            leavingTime: phase.leavingTime || '14:00',
            slots: phase.slots.map(s => ({...s}))
        });
        setEditingPhaseId(phase._id);
        setShowAddPhase(true);
    };

    const handleDeletePhase = async (id) => {
        if (!window.confirm("CRITICAL: Deleting a phase will PERMANENTLY remove ALL class timetables associated with it. Proceed?")) return;
        setSubmitting(true);
        try {
            await axios.delete(`/management/schedule/phase/${id}`);
            toast.success("Phase and linked schedules removed");
            refresh();
        } catch (error) {
            toast.error("Cleanup failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetTimetable = async () => {
        if (!selectedClass || !selectedPhase) return;
        if (!window.confirm("Are you sure you want to reset the entire timetable for this class in this phase?")) return;
        
        setSubmitting(true);
        try {
            await axios.delete(`/management/schedule/timetable/${selectedClass}/${selectedPhase}`);
            toast.success("Timetable reset successful");
            fetchTimetable();
        } catch (error) {
            toast.error("Reset failed");
        } finally {
            setSubmitting(false);
        }
    };

    const openSlotEditor = (day, slotIndex) => {
        const existing = timetableData.find(d => d.day === day)?.slots.find(s => s.slotIndex === slotIndex);
        setSlotEditForm({
            subject: existing?.subject || '',
            teacher: existing?.teacher?._id || existing?.teacher || ''
        });
        setEditingSlot({ day, slotIndex });
    };

    const getTeacherStats = (teacherId, day) => {
        if (!teacherId || !day) return { total: 0, isBusy: false };
        const daySlots = timetableData.find(d => d.day === day)?.slots || [];
        const countInThisClass = daySlots.filter(s => (s.teacher?._id || s.teacher) === teacherId).length;
        return { total: countInThisClass };
    };

    const handleSlotUpdate = async (e) => {
        e.preventDefault();
        const currentDayData = timetableData.find(d => d.day === editingSlot.day) || { day: editingSlot.day, slots: [] };
        
        let newSlots = [...currentDayData.slots];
        const existingIdx = newSlots.findIndex(s => s.slotIndex === editingSlot.slotIndex);
        
        if (existingIdx > -1) {
            newSlots[existingIdx] = { ...newSlots[existingIdx], ...slotEditForm };
        } else {
            newSlots.push({ slotIndex: editingSlot.slotIndex, ...slotEditForm });
        }

        setSubmitting(true);
        try {
            await axios.post('/management/schedule/timetable/update', {
                classId: selectedClass,
                phaseId: selectedPhase,
                day: editingSlot.day,
                slots: newSlots
            });
            toast.success("Slot updated");
            setEditingSlot(null);
            fetchTimetable();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update slot");
        } finally {
            setSubmitting(false);
        }
    };

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentPhase = phases.find(p => p._id === selectedPhase);

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <Clock className="text-indigo-600" size={32} /> {activeView === 'phases' ? 'Schedule Phases' : 'Timetable Editor'}
                </h2>
            </div>

            {activeView === 'phases' && (
                <div className="space-y-8">
                    <div className="flex justify-end">
                        <button onClick={() => setShowAddPhase(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-100 hover:opacity-90">
                            <Plus size={18} /> New Schedule Phase
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {phases.map(phase => (
                            <div key={phase._id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4 relative group">
                                <div className="absolute top-6 right-6 flex gap-2">
                                    <button 
                                        onClick={() => openEditPhase(phase)}
                                        className="p-2.5 bg-slate-50 text-slate-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeletePhase(phase._id)}
                                        className="p-2.5 bg-slate-50 text-slate-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 hover:text-white"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-black text-gray-800 uppercase">{phase.name}</h3>
                                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">Active</div>
                                </div>
                                <div className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                    <Calendar size={14} /> {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Reporting</div>
                                        <div className="text-xs font-black text-slate-700">{phase.reportingTime || '08:00'}</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Leaving</div>
                                        <div className="text-xs font-black text-slate-700">{phase.leavingTime || '14:00'}</div>
                                    </div>
                                </div>
                                <div className="pt-4 space-y-2">
                                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Time Configuration</div>
                                    <div className="space-y-1">
                                        {phase.slots.map((slot, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                                <span className="text-[10px] font-black text-gray-600">{slot.label}</span>
                                                <span className="text-[10px] font-bold text-indigo-600">{slot.startTime} - {slot.endTime}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeView === 'timetable' && (
                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Target Class</label>
                            <select 
                                className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <option value="">Choose Class...</option>
                                {classes.map(c => <option key={c._id} value={c._id}>{c.grade}-{c.section}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 space-y-2 relative">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Academic Phase</label>
                            <select 
                                className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                                value={selectedPhase}
                                onChange={(e) => setSelectedPhase(e.target.value)}
                            >
                                <option value="">Choose Phase...</option>
                                {phases.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                            {selectedClass && selectedPhase && (
                                <button 
                                    onClick={handleResetTimetable}
                                    className="absolute -top-1 right-0 text-rose-400 hover:text-rose-600 font-black text-[8px] uppercase tracking-widest flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100 transition-all"
                                >
                                    <RotateCcw size={10} /> Reset Matrix
                                </button>
                            )}
                        </div>
                    </div>

                    {selectedClass && currentPhase ? (
                        <div className="bg-white rounded-[3rem] shadow-soft-xl border border-gray-100 overflow-hidden animate-in fade-in duration-700">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-900 text-white">
                                            <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/5 sticky left-0 bg-slate-900 z-10">Time Slots</th>
                                            {days.map(day => (
                                                <th key={day} className="py-6 px-8 text-center border-r border-white/5 min-w-[180px]">{day}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {currentPhase.slots.map((phaseSlot, idx) => (
                                            <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                                                <td className="py-6 px-8 border-r border-gray-100 sticky left-0 bg-white group-hover:bg-indigo-50/30 z-10">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">{phaseSlot.label}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                                                            <Clock size={10} /> {phaseSlot.startTime} - {phaseSlot.endTime}
                                                        </span>
                                                        {phaseSlot.type === 'Lunch' && (
                                                            <span className="mt-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-black uppercase w-fit">Break</span>
                                                        )}
                                                    </div>
                                                </td>
                                                {days.map(day => {
                                                    const slot = timetableData.find(d => d.day === day)?.slots.find(s => s.slotIndex === idx);
                                                    return (
                                                        <td key={day} className="py-4 px-4 border-r border-gray-100">
                                                            {phaseSlot.type === 'Period' ? (
                                                                <button 
                                                                    onClick={() => openSlotEditor(day, idx)}
                                                                    className={`w-full p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 min-h-[100px] ${slot ? 'bg-white border-indigo-200 shadow-sm' : 'bg-gray-50 border-gray-200 hover:border-indigo-300 hover:bg-white'}`}
                                                                >
                                                                    {slot ? (
                                                                        <>
                                                                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-tight">{slot.subject}</div>
                                                                            <div className="text-[8px] font-bold text-gray-400 uppercase flex items-center gap-1 text-center">
                                                                                <Users size={10} /> {slot.teacher?.name || 'Assigned'}
                                                                            </div>
                                                                            <div className="mt-2 p-1.5 bg-indigo-50 text-indigo-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                                                <Edit size={12} />
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Plus size={16} className="text-gray-300" />
                                                                            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Empty Slot</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center opacity-20 grayscale grayscale-100 pointer-events-none">
                                                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] rotate-[-15deg]">{phaseSlot.type}</div>
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-gray-200 space-y-4">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                                <Calendar size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Timetable Blueprint</h3>
                                <p className="text-gray-400 font-bold mt-2 italic">Select a class and academic phase to begin orchestration.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Phase Creation Modal */}
            {showAddPhase && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
                            <h2 className="text-2xl font-black">{editingPhaseId ? 'Edit Schedule Phase' : 'Configure Schedule Phase'}</h2>
                            <button onClick={() => { setShowAddPhase(false); setEditingPhaseId(null); }} className="p-2 hover:bg-white/20 rounded-xl transition"><X size={24} /></button>
                        </div>
                        <form onSubmit={handlePhaseSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <div className="space-y-6">
                                <input type="text" placeholder="Phase Name (e.g. Summer 2026)" required className="w-full p-5 bg-gray-50 rounded-2xl font-black text-lg border-none outline-none focus:ring-4 focus:ring-indigo-50" value={phaseForm.name} onChange={(e) => setPhasePhaseForm({...phaseForm, name: e.target.value})} />
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Effective From</label>
                                        <input type="date" required className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={phaseForm.startDate} onChange={(e) => setPhasePhaseForm({...phaseForm, startDate: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Effective Until</label>
                                        <input type="date" required className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={phaseForm.endDate} onChange={(e) => setPhasePhaseForm({...phaseForm, endDate: e.target.value})} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">School Reporting Time</label>
                                        <input type="time" required className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={phaseForm.reportingTime} onChange={(e) => setPhasePhaseForm({...phaseForm, reportingTime: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">School Leaving Time</label>
                                        <input type="time" required className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={phaseForm.leavingTime} onChange={(e) => setPhasePhaseForm({...phaseForm, leavingTime: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">Daily Slots Configuration</h3>
                                    <button type="button" onClick={handleAddSlot} className="text-indigo-600 font-black text-[10px] uppercase flex items-center gap-1"><Plus size={14} /> Add Slot</button>
                                </div>
                                <div className="space-y-3">
                                    {phaseForm.slots.map((slot, idx) => (
                                        <div key={idx} className="flex gap-3 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[8px] font-black text-gray-400 uppercase ml-1">Label</label>
                                                <input type="text" placeholder="Label" className="w-full bg-white p-2 rounded-lg text-xs font-bold" value={slot.label} onChange={(e) => {
                                                    const newSlots = [...phaseForm.slots];
                                                    newSlots[idx].label = e.target.value;
                                                    setPhasePhaseForm({...phaseForm, slots: newSlots});
                                                }} />
                                            </div>
                                            <div className="w-32 space-y-1">
                                                <label className="text-[8px] font-black text-gray-400 uppercase ml-1">Start</label>
                                                <input type="time" className="w-full bg-white p-2 rounded-lg text-xs font-bold" value={slot.startTime} onChange={(e) => {
                                                    const newSlots = [...phaseForm.slots];
                                                    newSlots[idx].startTime = e.target.value;
                                                    setPhasePhaseForm({...phaseForm, slots: newSlots});
                                                }} />
                                            </div>
                                            <div className="w-32 space-y-1">
                                                <label className="text-[8px] font-black text-gray-400 uppercase ml-1">End</label>
                                                <input type="time" className="w-full bg-white p-2 rounded-lg text-xs font-bold" value={slot.endTime} onChange={(e) => {
                                                    const newSlots = [...phaseForm.slots];
                                                    newSlots[idx].endTime = e.target.value;
                                                    setPhasePhaseForm({...phaseForm, slots: newSlots});
                                                }} />
                                            </div>
                                            <div className="w-32 space-y-1">
                                                <label className="text-[8px] font-black text-gray-400 uppercase ml-1">Type</label>
                                                <select className="w-full bg-white p-2 rounded-lg text-xs font-bold" value={slot.type} onChange={(e) => {
                                                    const newSlots = [...phaseForm.slots];
                                                    newSlots[idx].type = e.target.value;
                                                    setPhasePhaseForm({...phaseForm, slots: newSlots});
                                                }}>
                                                    <option value="Period">Period</option>
                                                    <option value="Lunch">Lunch</option>
                                                    <option value="Prayer">Prayer</option>
                                                </select>
                                            </div>
                                            <button type="button" onClick={() => {
                                                const newSlots = phaseForm.slots.filter((_, i) => i !== idx);
                                                setPhasePhaseForm({...phaseForm, slots: newSlots});
                                            }} className="mt-5 p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100">{editingPhaseId ? 'Update Schedule Phase' : 'Initialize Schedule Phase'}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Slot Editor Modal */}
            {editingSlot && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter">{editingSlot.day}</h3>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">{currentPhase.slots[editingSlot.slotIndex].label} ({currentPhase.slots[editingSlot.slotIndex].startTime})</p>
                            </div>
                            <button onClick={() => setEditingSlot(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSlotUpdate} className="p-10 space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Academic Subject</label>
                                <input type="text" required placeholder="e.g. Mathematics" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none" value={slotEditForm.subject} onChange={(e) => setSlotEditForm({...slotEditForm, subject: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assign Faculty</label>
                                <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none" value={slotEditForm.teacher} onChange={(e) => setSlotEditForm({...slotEditForm, teacher: e.target.value})}>
                                    <option value="">Select Instructor</option>
                                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                            </div>

                            {slotEditForm.teacher && (
                                <div className="p-6 bg-indigo-50 rounded-[1.5rem] border border-indigo-100 animate-in slide-in-from-top-4 duration-500">
                                    <div className="flex justify-between items-center border-b border-indigo-100/50 pb-2 mb-3">
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Availability Audit</span>
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getTeacherStats(slotEditForm.teacher, editingSlot.day).total >= 4 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {getTeacherStats(slotEditForm.teacher, editingSlot.day).total} Daily Periods
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-indigo-600/70 leading-relaxed italic">
                                        {getTeacherStats(slotEditForm.teacher, editingSlot.day).total >= 4 
                                            ? "⚠️ ATTENTION: Instructor has reached high-load status for this day. Evaluate break distribution."
                                            : "✨ SYSTEM: Faculty availability confirmed for this time slot. Load is within optimal range."}
                                    </p>
                                </div>
                            )}

                            <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Commit Assignment</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagementCellDashboard;
