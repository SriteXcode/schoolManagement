import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaUserPlus, FaCopy, FaStar, FaRegStar, FaTimes, FaQuoteLeft, FaPlus, FaInfoCircle } from 'react-icons/fa';
import StudentDetailsModal from '../../components/StudentDetailsModal';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  
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
  });

  const fetchData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        api.get('/student/getall'),
        api.get('/class/getall')
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
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
      });
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Manage Students</h1>
      
      {/* Success Modal for Credentials */}
      {generatedCreds && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center">
                <h3 className="text-2xl font-bold text-green-600 mb-2">Registration Success!</h3>
                <p className="text-gray-600 mb-4">Please share these login details with the student:</p>
                
                <div className="bg-gray-100 p-4 rounded text-left space-y-2 mb-6 border border-gray-200">
                    <div>
                        <span className="text-xs font-bold text-gray-500 uppercase">Username / Email</span>
                        <p className="font-mono text-lg font-bold text-indigo-700">{generatedCreds.username}</p>
                    </div>
                    <div>
                         <span className="text-xs font-bold text-gray-500 uppercase">Password</span>
                         <p className="font-mono text-lg font-bold text-indigo-700">{generatedCreds.password}</p>
                    </div>
                </div>

                <button 
                    onClick={() => setGeneratedCreds(null)}
                    className="w-full py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700"
                >
                    Done
                </button>
            </div>
        </div>
      )}

      {/* Add Student Form */}
      <div className="p-6 bg-white rounded-lg shadow-md border-t-4 border-teal-500">
        <h2 className="mb-4 text-xl font-semibold text-gray-700 flex items-center gap-2">
            <FaUserPlus className="text-teal-500" /> Register New Student
        </h2>
        <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required className="w-full p-2 border rounded mt-1" />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">Class *</label>
            <select name="classId" value={formData.classId} onChange={handleChange} required className="w-full p-2 border rounded mt-1">
                <option value="" disabled>Select Class</option>
                {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>Class {cls.grade}-{cls.section}</option>
                ))}
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
            <input type="text" name="phone" placeholder="9876543210" value={formData.phone} onChange={handleChange} required className="w-full p-2 border rounded mt-1" />
          </div>

          <div className="col-span-1">
             <label className="block text-sm font-medium text-gray-700">Gender</label>
             <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border rounded mt-1">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
             </select>
          </div>

          <div className="col-span-1">
             <label className="block text-sm font-medium text-gray-700">Guardian Name</label>
             <input type="text" name="guardianName" placeholder="Parent Name" value={formData.guardianName} onChange={handleChange} className="w-full p-2 border rounded mt-1" />
          </div>

          <div className="col-span-1">
             <label className="block text-sm font-medium text-gray-700">Address</label>
             <input type="text" name="address" placeholder="City, State" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded mt-1" />
          </div>
          
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end mt-2">
            <button 
                type="submit" 
                disabled={loading}
                className="px-8 py-2 text-white bg-teal-600 rounded hover:bg-teal-700 disabled:bg-gray-400 font-bold transition-all"
            >
                {loading ? 'Registering...' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="p-6 text-xl font-semibold text-gray-700 border-b">Student Directory</h2>
        <div className="overflow-x-auto">
            <table className="min-w-full text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                        <th className="p-4">Roll No</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Class</th>
                        <th className="p-4">Username (Email)</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {students.map((student) => (
                        <tr key={student._id} className="hover:bg-gray-50">
                            <td className="p-4 font-mono font-bold text-indigo-600">{student.rollNum}</td>
                            <td 
                                className="p-4 font-medium text-indigo-600 cursor-pointer hover:underline"
                                onClick={() => { setSelectedStudent(student); setShowDetailsModal(true); }}
                            >
                                {student.name}
                            </td>
                            <td className="p-4"><span className="bg-teal-100 text-teal-800 px-2 py-1 rounded text-xs font-bold">{student.sClass?.grade}-{student.sClass?.section}</span></td>
                            <td className="p-4 text-gray-500">{student.user?.email}</td>
                            <td className="p-4 text-gray-500">{student.user?.phone}</td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => { setSelectedStudent(student); setShowDetailsModal(true); }}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition shadow-sm border border-indigo-100"
                                    title="View Details"
                                >
                                    <FaInfoCircle size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                     {students.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-gray-400">No students found.</td></tr>}
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
