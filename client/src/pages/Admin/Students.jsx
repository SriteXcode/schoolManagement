import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaUserPlus, FaCopy, FaStar, FaRegStar, FaTimes, FaQuoteLeft, FaPlus, FaInfoCircle } from 'react-icons/fa';
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

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    classId: '',
    gender: 'Male',
    guardianName: '',
    address: '',
    transportMode: 'By Foot',
    bus: '',
  });

  const [buses, setBuses] = useState([]);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!formData.classId) return toast.error("Please create a class first!");
    
    setLoading(true);
    try {
      const res = await api.post('/student/register', formData);
      toast.success('Student registered!');
      
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
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-teal-600 text-white p-3 rounded-full hover:bg-teal-700 shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
          title="Register New Student"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
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

                {formData.transportMode === 'Bus' && (
                    <div className="col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Assigned Bus</label>
                        <select name="bus" value={formData.bus} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition">
                            <option value="">Select Bus</option>
                            {buses.map(bus => (
                                <option key={bus._id} value={bus._id}>{bus.busNumber} - {bus.route}</option>
                            ))}
                        </select>
                    </div>
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
        <h2 className="p-6 text-xl font-bold text-gray-700 border-b flex items-center gap-2">
          <FaUserPlus className="text-teal-600"/> Student Directory
        </h2>
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
                    {students.map((student) => (
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
                     {students.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-gray-400">No students found.</td></tr>}
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
