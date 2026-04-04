import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaUserPlus, FaCopy, FaStar, FaRegStar, FaTimes, FaQuoteLeft, FaPlus, FaInfoCircle, FaExchangeAlt, FaUserSlash, FaSearch } from 'react-icons/fa';
import StudentDetailsModal from '../../components/StudentDetailsModal';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
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
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (sourceClass && enrollmentMode === 'unassign') {
      const classStudents = students.filter(s => s.sClass?._id === sourceClass || s.sClass === sourceClass);
      setPreviewStudents(classStudents);
    } else {
      setPreviewStudents([]);
    }
  }, [sourceClass, enrollmentMode, students]);

  const handleTransfer = async () => {
    if (!sourceClass || !targetClass) return toast.error("Please select both source and target classes");
    if (sourceClass === targetClass) return toast.error("Source and target classes must be different");

    setLoading(true);
    try {
      const res = await api.post('/student/transfer-class', { sourceClassId: sourceClass, targetClassId: targetClass });
      toast.success(res.data.message);
      setShowEnrollmentModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignAll = async () => {
    if (!sourceClass) return toast.error("Please select a class to unassign students from");
    
    if (!window.confirm("Are you sure you want to unassign ALL students from this class?")) return;

    setLoading(true);
    try {
      const res = await api.post('/student/unassign-class', { classId: sourceClass });
      toast.success(res.data.message);
      setShowEnrollmentModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unassignment failed");
    } finally {
      setLoading(false);
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
    
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleReviewAdded = (updatedStudent) => {
      setStudents(prev => prev.map(s => s._id === updatedStudent._id ? updatedStudent : s));
      setSelectedStudent(updatedStudent);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Manage Students</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowEnrollmentModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 shadow-lg transition-all flex items-center gap-2 font-bold"
            title="Enrollment Management"
          >
            <FaExchangeAlt /> Enrollment
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-teal-600 text-white p-3 rounded-full hover:bg-teal-700 shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
            title="Register New Student"
          >
            <FaPlus size={24} />
          </button>
        </div>
      </div>
      
      {/* Enrollment Management Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Enrollment Management</h2>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">Class Transfers & Assignments</p>
              </div>
              <button onClick={() => setShowEnrollmentModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition">
                <FaTimes size={24} />
              </button>
            </div>

            <div className="p-8">
              {/* Mode Toggle */}
              <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
                <button 
                  onClick={() => setEnrollmentMode('transfer')}
                  className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${enrollmentMode === 'transfer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                >
                  <FaExchangeAlt /> Transfer Class
                </button>
                <button 
                  onClick={() => setEnrollmentMode('unassign')}
                  className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${enrollmentMode === 'unassign' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                >
                  <FaUserSlash /> Unassign Students
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Source Selection */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Source Class</label>
                  <select 
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                    value={sourceClass}
                    onChange={(e) => setSourceClass(e.target.value)}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>Class {cls.grade}-{cls.section}</option>
                    ))}
                  </select>

                  {sourceClass && (
                    <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text"
                          placeholder="Search in this class..."
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-none text-xs font-bold"
                          value={enrollmentSearchTerm}
                          onChange={(e) => setEnrollmentSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto custom-scrollbar border border-gray-100 rounded-2xl bg-gray-50/50 p-2">
                        {students.filter(s => (s.sClass?._id === sourceClass || s.sClass === sourceClass) && (
                          s.name.toLowerCase().includes(enrollmentSearchTerm.toLowerCase()) || 
                          s.rollNum.toLowerCase().includes(enrollmentSearchTerm.toLowerCase())
                        )).map(student => (
                          <div key={student._id} className="p-3 bg-white rounded-xl mb-2 shadow-sm border border-gray-50 flex justify-between items-center">
                            <div>
                              <div className="text-xs font-black text-gray-800">{student.name}</div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{student.rollNum}</div>
                            </div>
                          </div>
                        ))}
                        {students.filter(s => (s.sClass?._id === sourceClass || s.sClass === sourceClass)).length === 0 && (
                          <div className="text-center py-10 text-gray-400 italic text-xs font-bold">No students in this class</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Target / Action */}
                <div className="space-y-4">
                  {enrollmentMode === 'transfer' ? (
                    <>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Target Class</label>
                      <select 
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                        value={targetClass}
                        onChange={(e) => setTargetClass(e.target.value)}
                      >
                        <option value="">Select Class</option>
                        {classes.map(cls => (
                          <option key={cls._id} value={cls._id}>Class {cls.grade}-{cls.section}</option>
                        ))}
                      </select>
                      <div className="pt-8">
                        <button 
                          onClick={handleTransfer}
                          disabled={loading || !sourceClass || !targetClass}
                          className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 hover:opacity-90 disabled:bg-gray-300 transition-all flex items-center justify-center gap-3"
                        >
                          <FaExchangeAlt /> {loading ? 'Transferring...' : 'Execute Mass Transfer'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col justify-end h-full pt-8">
                      <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 mb-6">
                        <h4 className="text-rose-600 font-black text-sm uppercase tracking-tight mb-2">Danger Zone</h4>
                        <p className="text-rose-400 text-xs font-bold leading-relaxed">This action will remove all students from the selected class. They will be marked as unassigned.</p>
                      </div>
                      <button 
                        onClick={handleUnassignAll}
                        disabled={loading || !sourceClass}
                        className="w-full py-5 bg-rose-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-100 hover:opacity-90 disabled:bg-gray-300 transition-all flex items-center justify-center gap-3"
                      >
                        <FaUserSlash /> {loading ? 'Processing...' : 'Unassign All Students'}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Registration Success!</h3>
                <p className="text-gray-500 mb-6">Please share these login details with the student:</p>
                
                <div className="bg-gray-50 p-4 rounded-xl text-left space-y-3 mb-6 border border-gray-100">
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Username / Email</span>
                        <p className="font-mono text-lg font-bold text-indigo-700 break-all">{generatedCreds.username}</p>
                    </div>
                    <div>
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</span>
                         <p className="font-mono text-lg font-bold text-indigo-700">{generatedCreds.password}</p>
                    </div>
                </div>

                <button 
                    onClick={() => setGeneratedCreds(null)}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition"
                >
                    Done
                </button>
            </div>
        </div>
      )}

      {/* Register Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-teal-600 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                  <FaUserPlus /> Register New Student
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white hover:text-teal-200 transition"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
                  <input type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition" />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Class *</label>
                  <select name="classId" value={formData.classId} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition">
                      <option value="" disabled>Select Class</option>
                      {classes.map(cls => (
                          <option key={cls._id} value={cls._id}>Class {cls.grade}-{cls.section}</option>
                      ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number *</label>
                  <input type="text" name="phone" placeholder="9876543210" value={formData.phone} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition" />
                </div>

                <div className="col-span-1">
                   <label className="block text-sm font-bold text-gray-700 mb-1">Gender</label>
                   <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                   </select>
                </div>

                <div className="col-span-1">
                   <label className="block text-sm font-bold text-gray-700 mb-1">Guardian Name</label>
                   <input type="text" name="guardianName" placeholder="Parent Name" value={formData.guardianName} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition" />
                </div>

                <div className="col-span-1">
                   <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                   <input type="text" name="address" placeholder="City, State" value={formData.address} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition" />
                </div>

                <div className="col-span-1">
                   <label className="block text-sm font-bold text-gray-700 mb-1">Transport Mode</label>
                   <select name="transportMode" value={formData.transportMode} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition">
                      <option value="Hostel">Hostel</option>
                      <option value="Bicycle">Bicycle</option>
                      <option value="Bike">Bike</option>
                      <option value="Bus">Bus</option>
                      <option value="By Foot">By Foot</option>
                   </select>
                </div>

                {formData.transportMode === 'Bike' && (
                  <>
                    <div className="col-span-1">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Bike Number *</label>
                      <input type="text" name="bikeNumber" placeholder="MH-12-XX-0000" value={formData.bikeNumber} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition" />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Driving License No. *</label>
                      <input type="text" name="drivingLicense" placeholder="DL-00000000" value={formData.drivingLicense} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition" />
                    </div>
                  </>
                )}

                {formData.transportMode === 'Hostel' && (
                  <>
                    <div className="col-span-1">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Hostel Name *</label>
                      <input type="text" name="hostelName" placeholder="Boys Hostel A" value={formData.hostelName} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition" />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Room Number *</label>
                      <input type="text" name="roomNumber" placeholder="R-101" value={formData.roomNumber} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition" />
                    </div>
                  </>
                )}

                {formData.transportMode === 'Bus' && (
                  <>
                    <div className="col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Assigned Bus</label>
                        <select name="bus" value={formData.bus} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition">
                            <option value="">Select Bus</option>
                            {buses.map(bus => (
                                <option key={bus._id} value={bus._id}>{bus.busNumber} - {bus.route}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Bus Stop</label>
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
                            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition"
                        >
                            <option value="">Select Stop</option>
                            {selectedBusStops.map((stop, i) => (
                                <option key={i} value={stop.stopName}>{stop.stopName} (₹{stop.fee})</option>
                            ))}
                            <option value="REQUEST_NEW" className="text-indigo-600 font-bold">OTHER (REQUEST NEW STOP)</option>
                        </select>
                    </div>

                    {formData.isNewStopRequest && (
                        <div className="col-span-full animate-in slide-in-from-top-2">
                             <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                    <FaPlus size={14} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Requested Stop Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter full address or landmark..." 
                                        value={formData.busStop} 
                                        onChange={(e) => setFormData({ ...formData, busStop: e.target.value })} 
                                        required 
                                        className="w-full p-3 border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                                    />
                                    <p className="mt-2 text-[10px] font-bold text-indigo-400 flex items-center gap-1 uppercase tracking-wider">
                                        <FaInfoCircle /> Management will review and assign fee before deployment
                                    </p>
                                </div>
                             </div>
                        </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 px-6 py-3 text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 font-bold shadow-lg shadow-teal-200 transition"
                >
                  {loading ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                <FaUserPlus className="text-teal-600"/> Student Directory
            </h2>
            <div className="relative max-w-sm w-full">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text"
                    placeholder="Search name or roll number..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-none text-xs font-bold focus:ring-2 focus:ring-teal-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                        <th className="p-4">Roll No</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Class</th>
                        <th className="p-4">Username (Email)</th>
                        <th className="p-4">Phone</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {students.filter(s => 
                        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.rollNum.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((student) => (
                        <tr 
                            key={student._id} 
                            onClick={() => { setSelectedStudent(student); setShowDetailsModal(true); }}
                            className="hover:bg-indigo-50/50 cursor-pointer transition group"
                        >
                            <td className="p-4 font-mono font-bold text-indigo-600 group-hover:text-indigo-700 transition">{student.rollNum}</td>
                            <td className="p-4 font-bold text-gray-800 group-hover:text-indigo-700 transition">
                                {student.name}
                            </td>
                            <td className="p-4"><span className="bg-teal-100 text-teal-800 px-2 py-1 rounded text-xs font-bold">{student.sClass?.grade}-{student.sClass?.section}</span></td>
                            <td className="p-4 text-gray-500">{student.user?.email}</td>
                            <td className="p-4 text-gray-500">{student.user?.phone}</td>
                        </tr>
                    ))}
                     {students.filter(s => 
                        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.rollNum.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length === 0 && <tr><td colSpan="5" className="p-6 text-center text-gray-400">No students found.</td></tr>}
                </tbody>
            </table>
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
