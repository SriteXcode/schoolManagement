import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaUserTie, FaChalkboardTeacher, FaTimes, FaBook, FaLink } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Assignment Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [assignments, setAssignments] = useState({ classTeacherOf: [], subjectTeacherOf: [] });
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    qualification: '',
    age: '',
    gender: 'Male',
  });

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/teacher/getall');
      setTeachers(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchAssignments = async (teacher) => {
    setSelectedTeacher(teacher);
    setShowModal(true);
    setLoadingAssignments(true);
    try {
        const res = await api.get(`/teacher/assignments/${teacher._id}`);
        setAssignments(res.data);
    } catch (error) {
        toast.error("Failed to fetch assignments");
    } finally {
        setLoadingAssignments(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/teacher/register', formData);
      toast.success('Teacher registered successfully!');
      setFormData({
        name: '',
        email: '',
        password: '',
        qualification: '',
        age: '',
        gender: 'Male',
      });
      fetchTeachers();
    } catch (error) {
        console.log(error);
      toast.error(error.response?.data?.message || 'Failed to register teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Manage Teachers</h1>
      
      {/* Add Teacher Form */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="mb-4 text-xl font-semibold text-gray-700">Register New Teacher</h2>
        <form onSubmit={handleAddTeacher} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required className="p-2 border rounded" />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="p-2 border rounded" />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="p-2 border rounded" />
          <input type="text" name="qualification" placeholder="Qualification" value={formData.qualification} onChange={handleChange} className="p-2 border rounded" />
          <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} className="p-2 border rounded" />
          <select name="gender" value={formData.gender} onChange={handleChange} className="p-2 border rounded">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          
          <button 
            type="submit" 
            disabled={loading}
            className="col-span-1 md:col-span-2 px-6 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Registering...' : 'Register Teacher'}
          </button>
        </form>
      </div>

      {/* Teachers List */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="mb-4 text-xl font-semibold text-gray-700">Teacher List</h2>
        <div className="overflow-x-auto">
            <table className="min-w-full text-left">
                <thead>
                    <tr className="bg-gray-100 border-b">
                        <th className="p-3">Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Qualification</th>
                        <th className="p-3">Gender</th>
                    </tr>
                </thead>
                <tbody>
                    {teachers.map((teacher) => (
                        <tr key={teacher._id} className="border-b hover:bg-gray-50">
                            <td 
                                className="p-3 font-bold text-blue-600 cursor-pointer hover:underline"
                                onClick={() => fetchAssignments(teacher)}
                            >
                                {teacher.name}
                            </td>
                            <td className="p-3">{teacher.user?.email}</td>
                            <td className="p-3">{teacher.qualification}</td>
                            <td className="p-3">{teacher.gender}</td>
                        </tr>
                    ))}
                    {teachers.length === 0 && <tr><td colSpan="5" className="p-4 text-center">No teachers found.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>

      {/* Assignment Popup Modal */}
      {showModal && selectedTeacher && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                      <div>
                          <h3 className="text-xl font-bold text-gray-800">{selectedTeacher.name}'s Assignments</h3>
                          <p className="text-sm text-gray-500">{selectedTeacher.user?.email}</p>
                      </div>
                      <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes size={20} /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {loadingAssignments ? (
                          <div className="text-center py-10 text-gray-400 italic">Loading assignments...</div>
                      ) : (
                          <>
                            {/* Class Teacher Assignments */}
                            <div>
                                <h4 className="flex items-center gap-2 text-indigo-600 font-bold mb-3 border-b pb-1">
                                    <FaUserTie /> Class Teacher Of
                                </h4>
                                {assignments.classTeacherOf.length > 0 ? (
                                    <div className="space-y-2">
                                        {assignments.classTeacherOf.map((c, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                                <span className="font-bold text-gray-700">Class {c.grade}-{c.section}</span>
                                                <button 
                                                    onClick={() => navigate(`/admin/class/${c.classId}`)}
                                                    className="p-2 text-indigo-600 hover:bg-white rounded-full transition shadow-sm"
                                                    title="View Class"
                                                >
                                                    <FaLink size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Not a class teacher for any class.</p>
                                )}
                            </div>

                            {/* Subject Teacher Assignments */}
                            <div>
                                <h4 className="flex items-center gap-2 text-emerald-600 font-bold mb-3 border-b pb-1">
                                    <FaChalkboardTeacher /> Subject Teacher Of
                                </h4>
                                {assignments.subjectTeacherOf.length > 0 ? (
                                    <div className="space-y-2">
                                        {assignments.subjectTeacherOf.map((s, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                                <div>
                                                    <span className="font-bold text-gray-800 block">{s.subjectName}</span>
                                                    <span className="text-xs text-emerald-600 font-medium uppercase">Class {s.grade}-{s.section}</span>
                                                </div>
                                                <button 
                                                    onClick={() => navigate(`/admin/class/${s.classId}`)}
                                                    className="p-2 text-emerald-600 hover:bg-white rounded-full transition shadow-sm"
                                                    title="View Class"
                                                >
                                                    <FaLink size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Not a subject teacher for any class.</p>
                                )}
                            </div>
                          </>
                      )}
                  </div>

                  <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
                      <button 
                        onClick={() => setShowModal(false)}
                        className="w-full py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-black transition"
                      >
                        Close
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Teachers;
