import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaUserPlus, FaCopy, FaStar, FaRegStar, FaTimes, FaQuoteLeft, FaPlus, FaInfoCircle, FaExchangeAlt, FaUserSlash, FaSearch, FaTrash, FaUserGraduate } from 'react-icons/fa';
import StudentDetailsModal from '../../components/StudentDetailsModal';
import Loader from '../../components/Loader';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Generated Creds Modal
  const [generatedCreds, setGeneratedCreds] = useState(null);
  
  // Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Enrollment State
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollmentMode, setEnrollmentMode] = useState('transfer'); // 'transfer' or 'unassign'
  const [sourceClass, setSourceClass] = useState('');
  const [targetClass, setTargetClass] = useState('');
  const [enrollmentSearchTerm, setEnrollmentSearchTerm] = useState('');
  const [previewStudents, setPreviewStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    classId: '',
    gender: 'Male',
    guardianName: '',
    address: '',
    transportMode: 'By Foot',
    bus: '',
    busStop: '',
    isNewStopRequest: false,
    bikeNumber: '',
    drivingLicense: '',
    roomNumber: '',
    hostelName: ''
  });

  const [buses, setBuses] = useState([]);
  const [selectedBusStops, setSelectedBusStops] = useState([]);

  const fetchData = async () => {
    try {
      const [studentsRes, classesRes, busesRes] = await Promise.all([
        api.get('/student/getall'),
        api.get('/class/getall'),
        api.get('/management/bus/all')
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
      setBuses(busesRes.data);
      if (classesRes.data.length > 0 && !formData.classId) {
          setFormData(prev => ({ ...prev, classId: classesRes.data[0]._id }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransfer = async () => {
    if (!sourceClass || !targetClass) return toast.error("Please select both source and target classes");
    if (sourceClass === targetClass) return toast.error("Source and target classes must be different");

    setSubmitting(true);
    try {
      const res = await api.post('/student/transfer-class', { sourceClassId: sourceClass, targetClassId: targetClass });
      toast.success(res.data.message);
      setShowEnrollmentModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassignAll = async () => {
    if (!sourceClass) return toast.error("Please select a class to unassign students from");
    
    if (!window.confirm("Are you sure you want to unassign ALL students from this class?")) return;

    setSubmitting(true);
    try {
      const res = await api.post('/student/unassign-class', { classId: sourceClass });
      toast.success(res.data.message);
      setShowEnrollmentModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unassignment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id) => {
      if (!window.confirm("CRITICAL: Deleting a student will PERMANENTLY remove their profile, access, fee records, attendance, and marks. This cannot be undone. Proceed?")) return;
      
      setSubmitting(true);
      try {
          await api.delete(`/student/${id}`);
          toast.success("Student and all academic records removed.");
          fetchData();
      } catch (error) {
          toast.error("Cleanup failed.");
      } finally {
          setSubmitting(false);
      }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'bus') {
        const bus = buses.find(b => b._id === value);
        setSelectedBusStops(bus?.stops || []);
        setFormData({ ...formData, [name]: value, busStop: '' });
    } else {
        setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!formData.classId) return toast.error("Please create a class first!");
    
    setSubmitting(true);
    try {
      const res = await api.post('/student/register', formData);
      toast.success(res.data.message || 'Student registered!');
      
      // Show credentials
      setGeneratedCreds(res.data.credentials);
      
      setFormData({
        name: '',
        phone: '',
        classId: classes[0]?._id || '',
        gender: 'Male',
        guardianName: '',
        address: '',
        transportMode: 'By Foot',
        bus: '',
        busStop: '',
        isNewStopRequest: false,
        bikeNumber: '',
        drivingLicense: '',
        roomNumber: '',
        hostelName: ''
      });
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewAdded = (updatedStudent) => {
      setStudents(prev => prev.map(s => s._id === updatedStudent._id ? updatedStudent : s));
      setSelectedStudent(updatedStudent);
  };

  if (loading) return <Loader fullScreen text="Accessing Student Directory..." />;

  return (
    <div className="space-y-10 relative pb-20">
      {submitting && <Loader fullScreen text="Synchronizing Academic Registry..." />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Student Body</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Enrollment & Academic Lifecycle Management</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={() => setShowEnrollmentModal(true)}
            className="flex-1 md:flex-none px-8 py-4 bg-white text-indigo-600 rounded-2xl border border-indigo-100 hover:bg-indigo-50 shadow-sm transition-all flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest"
          >
            <FaExchangeAlt /> Enrollment
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-none px-8 py-4 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 shadow-xl shadow-teal-100 transition-all hover:scale-105 flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest"
          >
            <FaUserPlus /> Admission
          </button>
        </div>
      </div>
      
      {/* Enrollment Management Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase">Management</h2>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">Transfers & Registry Cleanup</p>
              </div>
              <button onClick={() => setShowEnrollmentModal(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition">
                <FaTimes size={18} />
              </button>
            </div>

            <div className="p-10">
              <div className="flex p-1.5 bg-slate-50 rounded-[1.5rem] mb-10 border border-slate-100">
                <button 
                  onClick={() => setEnrollmentMode('transfer')}
                  className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${enrollmentMode === 'transfer' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-50 border border-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <FaExchangeAlt /> Transfer Unit
                </button>
                <button 
                  onClick={() => setEnrollmentMode('unassign')}
                  className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${enrollmentMode === 'unassign' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-50 border border-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <FaUserSlash /> Mass Unassign
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Source Class</label>
                    <select 
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                        value={sourceClass} onChange={(e) => setSourceClass(e.target.value)}
                    >
                        <option value="">Select Origin</option>
                        {classes.map(cls => <option key={cls._id} value={cls._id}>{cls.grade}-{cls.section}</option>)}
                    </select>
                  </div>

                  {sourceClass && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" placeholder="Search origins..."
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-xs outline-none"
                          value={enrollmentSearchTerm} onChange={(e) => setEnrollmentSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto custom-scrollbar border border-slate-100 rounded-[2rem] bg-slate-50/50 p-2">
                        {students.filter(s => (s.sClass?._id === sourceClass || s.sClass === sourceClass) && (
                          s.name.toLowerCase().includes(enrollmentSearchTerm.toLowerCase()) || 
                          s.rollNum.toLowerCase().includes(enrollmentSearchTerm.toLowerCase())
                        )).map(student => (
                          <div key={student._id} className="p-4 bg-white rounded-2xl mb-2 shadow-sm border border-slate-50 flex justify-between items-center group">
                            <div>
                              <div className="text-[10px] font-black text-slate-800 uppercase">{student.name}</div>
                              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">#{student.rollNum}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {enrollmentMode === 'transfer' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destination Class</label>
                        <select 
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                            value={targetClass} onChange={(e) => setTargetClass(e.target.value)}
                        >
                            <option value="">Select Target</option>
                            {classes.map(cls => <option key={cls._id} value={cls._id}>{cls.grade}-{cls.section}</option>)}
                        </select>
                      </div>
                      <div className="pt-4 h-full flex flex-col justify-end">
                        <button 
                          onClick={handleTransfer}
                          disabled={submitting || !sourceClass || !targetClass}
                          className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:bg-slate-200"
                        >
                          <FaExchangeAlt /> Execute Transfer
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col justify-end h-full">
                      <div className="p-8 bg-rose-50 rounded-[2rem] border border-rose-100 mb-8">
                        <h4 className="text-rose-600 font-black text-xs uppercase tracking-[0.2em] mb-3">Institutional Policy</h4>
                        <p className="text-rose-400 text-[10px] font-bold leading-relaxed uppercase tracking-tighter">This operation clears all student class relationships for the selected origin. Academic history will be retained but students will appear as "Unassigned".</p>
                      </div>
                      <button 
                        onClick={handleUnassignAll}
                        disabled={submitting || !sourceClass}
                        className="w-full py-5 bg-rose-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center gap-3 disabled:bg-slate-200"
                      >
                        <FaUserSlash /> Execute Purge
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal for Credentials */}
      {generatedCreds && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-soft">
                  <FaUserPlus size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none mb-2">Admission Success</h3>
                <p className="text-slate-400 font-bold text-xs mb-8">Synchronize these credentials with the student</p>
                
                <div className="bg-slate-50 p-6 rounded-[2rem] text-left space-y-4 mb-8 border border-slate-100">
                    <div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Authentication ID</span>
                        <p className="font-mono text-base font-black text-indigo-600 break-all">{generatedCreds.username}</p>
                    </div>
                    <div>
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Initial Key</span>
                         <p className="font-mono text-base font-black text-indigo-600">{generatedCreds.password}</p>
                    </div>
                </div>

                <button 
                    onClick={() => setGeneratedCreds(null)}
                    className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all"
                >
                    Dismiss Notification
                </button>
            </div>
        </div>
      )}

      {/* Register Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 bg-teal-600 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 uppercase">
                  Admission Onboarding
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white/60 hover:text-white transition p-3 bg-white/10 rounded-2xl"
              >
                <FaTimes size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddStudent} className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Full Name *</label>
                  <input type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-50 transition-all outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Unit *</label>
                  <select name="classId" value={formData.classId} onChange={handleChange} required className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-50 transition-all outline-none uppercase tracking-widest">
                      <option value="" disabled>Select Unit</option>
                      {classes.map(cls => (
                          <option key={cls._id} value={cls._id}>{cls.grade}-{cls.section}</option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number *</label>
                  <input type="text" name="phone" placeholder="9876543210" value={formData.phone} onChange={handleChange} required className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-50 transition-all outline-none" />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender Identification</label>
                   <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-50 transition-all outline-none uppercase tracking-widest">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                   </select>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parent/Guardian</label>
                   <input type="text" name="guardianName" placeholder="Legal Guardian" value={formData.guardianName} onChange={handleChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-50 transition-all outline-none" />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
                   <input type="text" name="address" placeholder="City, State" value={formData.address} onChange={handleChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-50 transition-all outline-none" />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logistics Mode</label>
                   <select name="transportMode" value={formData.transportMode} onChange={handleChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-50 transition-all outline-none uppercase tracking-widest">
                      <option value="Hostel">Hostel</option>
                      <option value="Bicycle">Bicycle</option>
                      <option value="Bike">Bike</option>
                      <option value="Bus">Institutional Bus</option>
                      <option value="By Foot">By Foot</option>
                   </select>
                </div>

                {formData.transportMode === 'Bus' && (
                  <>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Fleet</label>
                        <select name="bus" value={formData.bus} onChange={handleChange} required className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-50 transition-all outline-none uppercase tracking-widest">
                            <option value="">Select Bus</option>
                            {buses.map(bus => (
                                <option key={bus._id} value={bus._id}>{bus.busNumber} - {bus.route}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Boarding Point</label>
                        <select 
                            name="busStop" 
                            value={formData.isNewStopRequest ? 'REQUEST_NEW' : formData.busStop} 
                            onChange={(e) => {
                                if (e.target.value === 'REQUEST_NEW') {
                                    setFormData({ ...formData, isNewStopRequest: true, busStop: '' });
                                } else {
                                    setFormData({ ...formData, isNewStopRequest: false, busStop: e.target.value });
                                }
                            }} 
                            required 
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-teal-50 transition-all outline-none uppercase tracking-widest"
                        >
                            <option value="">Select Stop</option>
                            {selectedBusStops.map((stop, i) => (
                                <option key={i} value={stop.stopName}>{stop.stopName} (₹{stop.fee})</option>
                            ))}
                            <option value="REQUEST_NEW" className="text-indigo-600 font-black">REQUEST NEW HUB</option>
                        </select>
                    </div>
                  </>
                )}
              </div>
              
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-5 text-white bg-teal-600 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-teal-100 hover:bg-teal-700 transition-all active:scale-95"
              >
                Finalize Admission
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Student List */}
      <div className="bg-white rounded-[3rem] shadow-soft border border-slate-50 overflow-hidden px-2">
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                    <FaUserGraduate className="text-teal-600"/> Verified Registry
                </h2>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Cross-check academic identities</p>
            </div>
            <div className="relative max-w-sm w-full">
                <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" placeholder="Search name or roll number..."
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[1.5rem] font-bold text-sm focus:ring-4 focus:ring-teal-50 transition-all outline-none shadow-inner"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                        <th className="py-6 px-10">Identity</th>
                        <th className="py-6 px-10">Class Unit</th>
                        <th className="py-6 px-10">Authentication</th>
                        <th className="py-6 px-10 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {students.filter(s => 
                        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.rollNum.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((student) => (
                        <tr 
                            key={student._id} 
                            className="hover:bg-indigo-50/30 transition-all group cursor-pointer"
                            onClick={() => { setSelectedStudent(student); setShowDetailsModal(true); }}
                        >
                            <td className="py-6 px-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-soft flex items-center justify-center font-black text-indigo-600 text-lg border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        {student.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-800 uppercase text-sm tracking-tight group-hover:text-indigo-600 transition-colors">{student.name}</div>
                                        <div className="text-[10px] font-black text-slate-400 font-mono tracking-widest uppercase">#{student.rollNum}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="py-6 px-10">
                                <div className="flex justify-center">
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${student.sClass ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                        {student.sClass ? `Unit ${student.sClass.grade}-${student.sClass.section}` : 'Unassigned'}
                                    </span>
                                </div>
                            </td>
                            <td className="py-6 px-10">
                                <div className="text-xs font-black text-slate-500 lowercase">{student.user?.email}</div>
                                <div className="text-[9px] font-black text-slate-300 uppercase mt-1 tracking-tighter">Phone: {student.user?.phone}</div>
                            </td>
                            <td className="py-6 px-10" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-3">
                                    <button 
                                        onClick={() => { setSelectedStudent(student); setShowDetailsModal(true); }}
                                        className="p-3.5 bg-white text-indigo-600 rounded-2xl shadow-soft border border-slate-100 hover:bg-indigo-600 hover:text-white transition-all"
                                    >
                                        <FaInfoCircle size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteStudent(student._id)}
                                        className="p-3.5 bg-white text-rose-400 rounded-2xl shadow-soft border border-slate-100 hover:bg-rose-600 hover:text-white transition-all"
                                    >
                                        <FaTrash size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {students.length === 0 && (
                <div className="py-32 text-center space-y-4">
                    <FaUserGraduate size={48} className="mx-auto text-slate-100" />
                    <p className="text-slate-400 font-bold italic uppercase text-xs tracking-widest">No active students registered in the directory</p>
                </div>
            )}
        </div>
      </div>

      {/* Student Details Modal */}
      {showDetailsModal && selectedStudent && (
          <StudentDetailsModal 
            student={selectedStudent} 
            onClose={() => setShowDetailsModal(false)} 
            onReviewAdded={handleReviewAdded}
          />
      )}
    </div>
  );
};

export default Students;
