import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
    Users, DollarSign, Bus, Settings, Image, 
    Mail, Plus, Save, Trash2, Edit, CheckCircle, 
    X, Search, Calendar, Award, Layout, ChevronRight,
    TrendingUp, Shield, MapPin, Phone, Info, Star
} from 'lucide-react';

const ManagementCellDashboard = () => {
  const [activeTab, setActiveTab] = useState('staff');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [staffList, setStaffList] = useState({ teachers: [], otherStaff: [] });
  const [buses, setBuses] = useState([]);
  const [schoolConfig, setSchoolConfig] = useState({});
  const [messages, setMessages] = useState([]);
  const [salaries, setSalaries] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [staffRes, busRes, configRes, msgRes, salaryRes] = await Promise.all([
          axios.get('/management/staff/all'),
          axios.get('/management/bus/all'),
          axios.get('/management/school/config'),
          axios.get('/management/messages'),
          axios.get('/management/salary/all')
      ]);
      setStaffList(staffRes.data);
      setBuses(busRes.data);
      setSchoolConfig(configRes.data);
      setMessages(msgRes.data);
      setSalaries(salaryRes.data);
    } catch (error) {
      toast.error("Error fetching management data");
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
      { id: 'staff', label: 'Staff Hub', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
      { id: 'salary', label: 'Payroll & HR', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { id: 'transport', label: 'Fleet Manager', icon: Bus, color: 'text-amber-600', bg: 'bg-amber-50' },
      { id: 'media', label: 'CMS & Media', icon: Image, color: 'text-purple-600', bg: 'bg-purple-50' },
      { id: 'config', label: 'Configurations', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-50' },
      { id: 'inbox', label: 'Inbox', icon: Mail, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  if (loading) return <div className="p-20 text-center font-black text-gray-300 animate-pulse">ESTABLISHING SECURE MANAGEMENT PROTOCOLS...</div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-72 bg-white border-r border-gray-100 p-6 space-y-8">
          <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Management</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Admin Central Control</p>
          </div>

          <nav className="space-y-2">
              {menuItems.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === item.id ? `${item.bg} ${item.color} shadow-sm shadow-gray-100` : 'text-gray-400 hover:bg-gray-50'}`}
                  >
                      <item.icon size={20} className={activeTab === item.id ? item.color : 'text-gray-300'} />
                      <span className="font-black text-sm">{item.label}</span>
                      {activeTab === item.id && <ChevronRight size={16} className="ml-auto" />}
                  </button>
              ))}
          </nav>

          <div className="pt-10 border-t border-gray-50">
              <div className="p-4 bg-gray-900 rounded-[2rem] text-white">
                  <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center">
                          <Shield size={16} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Active Session</span>
                  </div>
                  <div className="text-xs font-bold text-white/60">
                      {schoolConfig?.sessionStart ? new Date(schoolConfig.sessionStart).toLocaleDateString() : 'N/A'} 
                      <span className="mx-2">→</span> 
                      {schoolConfig?.sessionEnd ? new Date(schoolConfig.sessionEnd).toLocaleDateString() : 'N/A'}
                  </div>
              </div>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-10 overflow-y-auto max-h-screen custom-scrollbar">
          {activeTab === 'staff' && <StaffHub staffList={staffList} refresh={fetchDashboardData} />}
          {activeTab === 'salary' && <PayrollManager staffList={staffList} salaries={salaries} refresh={fetchDashboardData} />}
          {activeTab === 'transport' && <FleetManager buses={buses} otherStaff={staffList.otherStaff} refresh={fetchDashboardData} />}
          {activeTab === 'media' && <CMSMedia refresh={fetchDashboardData} />}
          {activeTab === 'config' && <ConfigPanel config={schoolConfig} refresh={fetchDashboardData} />}
          {activeTab === 'inbox' && <InboxManager messages={messages} refresh={fetchDashboardData} />}
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
                    <Plus size={18} /> Add New Personnel
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
                            <h2 className="text-2xl font-black tracking-tight">Onboard New Personnel</h2>
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

const PayrollManager = ({ staffList, refresh }) => {
    const [selectedStaff, setSelectedStaff] = useState(null);
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

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <DollarSign className="text-emerald-600" size={32} /> Payroll & HR
            </h2>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <h3 className="text-lg font-black mb-6">Process Staff Payments</h3>
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
                                    <td className="py-4 text-xs font-bold text-gray-500">March 2026</td>
                                    <td className="py-4 text-right">
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

const FleetManager = ({ buses, otherStaff, refresh }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({ busNumber: '', route: '', capacity: 40, driver: '', status: 'Active' });

    const drivers = otherStaff.filter(s => s.role === 'BusDriver');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/management/bus/add', formData);
            toast.success("Bus added to fleet");
            setShowAdd(false);
            refresh();
        } catch (error) {
            toast.error("Failed to add bus");
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
                {buses.map(bus => (
                    <div key={bus._id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative group overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 text-gray-50 group-hover:text-amber-50 transition-colors" size={120}>
                            <Bus size={120} />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase">{bus.status}</div>
                                <span className="font-black text-gray-300 text-xl">#{bus.busNumber}</span>
                            </div>
                            <div>
                                <h4 className="font-black text-gray-800 text-lg uppercase">{bus.route}</h4>
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-1">
                                    <MapPin size={12} /> {bus.route.split('-').length > 1 ? bus.route : 'Active Route Hub'}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-[10px] text-gray-400">{bus.driver?.name?.charAt(0) || '?'}</div>
                                <div>
                                    <div className="text-[10px] font-black text-gray-800">{bus.driver?.name || 'No Driver Assigned'}</div>
                                    <div className="text-[8px] font-bold text-gray-400 uppercase">Lead Operator</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showAdd && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
                        <div className="p-8 bg-amber-600 text-white flex justify-between items-center">
                            <h2 className="text-2xl font-black">Register Bus</h2>
                            <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-white/20 rounded-xl transition"><X size={24} /></button>
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
    const [formData, setFormData] = useState({ title: '', category: 'Event', image: '', type: 'Achievement', description: '' });

    const handleAdd = async (endpoint) => {
        try {
            await axios.post(`/management/${endpoint}/add`, formData);
            toast.success("Content uploaded!");
            refresh();
        } catch (error) {
            toast.error("Upload failed");
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
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <input type="text" placeholder="Gallery Title" className="p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                            <select className="p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                                <option>Event</option>
                                <option>Celebration</option>
                                <option>Activity</option>
                            </select>
                        </div>
                        <input type="text" placeholder="Image URL (Comma separated for multiple)" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" onChange={(e) => setFormData({...formData, images: e.target.value.split(',')})} />
                        <button onClick={() => handleAdd('gallery')} className="px-10 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-100 transition hover:opacity-90">Publish to Gallery</button>
                    </div>
                )}

                {activeSub === 'achievement' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <input type="text" placeholder="Achievement Title" className="p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                            <select className="p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                                <option value="Achievement">General Achievement</option>
                                <option value="WallOfFame">Wall of Fame</option>
                            </select>
                        </div>
                        <textarea placeholder="Description of the accolade..." className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm min-h-[100px]" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                        <input type="text" placeholder="Image URL" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} />
                        <button onClick={() => handleAdd('achievement')} className="px-10 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-100 transition hover:opacity-90">Record Achievement</button>
                    </div>
                )}

                {activeSub === 'carousel' && (
                    <div className="space-y-6">
                        <input type="text" placeholder="Slide Title" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                        <input type="text" placeholder="Subtitle / Caption" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} />
                        <input type="text" placeholder="Slide Image URL" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} />
                        <button onClick={() => handleAdd('carousel')} className="px-10 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-100 transition hover:opacity-90">Add Slide</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ConfigPanel = ({ config, refresh }) => {
    const [formData, setFormData] = useState({ 
        name: config?.name || '', 
        establishedYear: config?.establishedYear || 2000,
        sessionStart: config?.sessionStart ? config.sessionStart.split('T')[0] : '',
        sessionEnd: config?.sessionEnd ? config.sessionEnd.split('T')[0] : ''
    });

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
                            <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm border-none focus:ring-4 focus:ring-slate-100" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Established Year</label>
                            <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm border-none focus:ring-4 focus:ring-slate-100" value={formData.establishedYear} onChange={(e) => setFormData({...formData, establishedYear: e.target.value})} />
                        </div>
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
    const handleRead = async (id) => {
        try {
            await axios.put(`/management/messages/${id}/read`);
            refresh();
        } catch (error) {
            console.error("Failed to mark message as read", error);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <Mail className="text-rose-600" size={32} /> Communications Inbox
            </h2>

            <div className="space-y-4">
                {messages.map(msg => (
                    <div key={msg._id} onClick={() => handleRead(msg._id)} className={`p-8 bg-white rounded-[2rem] border transition-all cursor-pointer ${msg.status === 'Unread' ? 'border-rose-200 shadow-lg shadow-rose-50' : 'border-gray-100 opacity-70 hover:opacity-100'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${msg.status === 'Unread' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    {msg.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-black text-gray-800">{msg.name}</div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{msg.email}</div>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400">{new Date(msg.date).toLocaleString()}</span>
                        </div>
                        <div className="pl-16 space-y-2">
                            <div className="text-sm font-black text-gray-700">{msg.subject || 'No Subject'}</div>
                            <p className="text-xs font-bold text-gray-500 leading-relaxed italic">"{msg.message}"</p>
                        </div>
                    </div>
                ))}
                {messages.length === 0 && <div className="p-20 text-center text-gray-400 font-bold italic">No messages in the communications archive...</div>}
            </div>
        </div>
    );
};

export default ManagementCellDashboard;
