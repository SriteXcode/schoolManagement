import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaUserTie, FaChalkboardTeacher, FaTimes, FaBook, FaLink, FaTrash, FaUserShield } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/Loader';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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
    } finally {
      setLoading(false);
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

  const handleDeleteTeacher = async (id) => {
      if (!window.confirm("CRITICAL: Deleting a teacher will remove their system access and unassign them from all classes/subjects. This action is permanent. Proceed?")) return;
      
      setSubmitting(true);
      try {
          await api.delete(`/teacher/${id}`);
          toast.success("Faculty member and records removed.");
          fetchTeachers();
      } catch (error) {
          toast.error("Cleanup failed.");
      } finally {
          setSubmitting(false);
      }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setSubmitting(true);
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
      setShowAddModal(false);
      fetchTeachers();
    } catch (error) {
        console.log(error);
      toast.error(error.response?.data?.message || 'Failed to register teacher');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader fullScreen text="Accessing Faculty Archives..." />;

  return (
    <div className="space-y-10 relative pb-20">
      {submitting && <Loader fullScreen text="Synchronizing Personnel Data..." />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Faculty Directory</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Institutional Personnel Management</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all hover:scale-105 flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest"
        >
          <FaChalkboardTeacher size={18} /> Register Faculty
        </button>
      </div>
      
      {/* Register Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 uppercase">
                  Faculty Onboarding
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white/60 hover:text-white transition p-3 bg-white/10 rounded-2xl"
              >
                <FaTimes size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddTeacher} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Full Name</label>
                  <input type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                  <input type="email" name="email" placeholder="john@school.com" value={formData.email} onChange={handleChange} required className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Password</label>
                  <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Highest Qualification</label>
                  <input type="text" name="qualification" placeholder="M.Sc. Physics" value={formData.qualification} onChange={handleChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Age</label>
                  <input type="number" name="age" placeholder="30" value={formData.age} onChange={handleChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender Identification</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-5 text-white bg-blue-600 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
              >
                Finalize Registration
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Teachers List */}
      <div className="bg-white rounded-[3rem] shadow-soft border border-slate-50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                <FaUserShield className="text-blue-600"/> Verified Faculty Members
            </h2>
            <div className="px-4 py-1 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {teachers.length} Active Records
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/50">
                        <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel</th>
                        <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital ID</th>
                        <th className="py-6 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {teachers.map((teacher) => (
                        <tr key={teacher._id} className="hover:bg-slate-50/50 transition-all group">
                            <td className="py-6 px-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        {teacher.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 uppercase text-sm tracking-tight">{teacher.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{teacher.qualification || 'General Faculty'}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="py-6 px-10">
                                <div className="space-y-1">
                                    <div className="text-xs font-black text-slate-600 lowercase">{teacher.user?.email}</div>
                                    <div className="flex gap-2">
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[8px] font-black uppercase">{teacher.gender}</span>
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase tracking-tighter">Verified</span>
                                    </div>
                                </div>
                            </td>
                            <td className="py-6 px-10">
                                <div className="flex items-center justify-center gap-3">
                                    <button 
                                        onClick={() => fetchAssignments(teacher)}
                                        className="p-3 bg-white text-blue-600 rounded-xl shadow-sm border border-slate-100 hover:bg-blue-600 hover:text-white transition-all"
                                        title="View Assignments"
                                    >
                                        <FaLink size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteTeacher(teacher._id)}
                                        className="p-3 bg-white text-rose-400 rounded-xl shadow-sm border border-slate-100 hover:bg-rose-600 hover:text-white transition-all"
                                        title="Delete Teacher"
                                    >
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {teachers.length === 0 && (
                <div className="py-32 text-center space-y-4">
                    <FaChalkboardTeacher size={48} className="mx-auto text-slate-100" />
                    <p className="text-slate-400 font-bold italic uppercase text-xs tracking-widest">No faculty members found in the current directory</p>
                </div>
            )}
        </div>
      </div>

      {/* Assignment Popup Modal */}
      {showModal && selectedTeacher && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4" onClick={() => setShowModal(false)}>
              <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-600 rounded-2xl text-white flex items-center justify-center font-black text-lg shadow-xl">
                              {selectedTeacher.name?.charAt(0)}
                          </div>
                          <div>
                              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedTeacher.name}</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Class & Subject Matrix</p>
                          </div>
                      </div>
                      <button onClick={() => setShowModal(false)} className="bg-white p-3 rounded-2xl text-slate-400 hover:text-slate-600 shadow-sm transition-colors"><FaTimes size={18} /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                      {loadingAssignments ? (
                          <div className="py-20 text-center flex flex-col items-center gap-4">
                              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Interrogating Database...</p>
                          </div>
                      ) : (
                          <>
                            {/* Class Teacher Assignments */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <h4 className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                                        <FaUserTie /> Class Teacher Responsibility
                                    </h4>
                                    <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase">{assignments.classTeacherOf.length} UNITS</span>
                                </div>
                                {assignments.classTeacherOf.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {assignments.classTeacherOf.map((c, i) => (
                                            <div key={i} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-slate-100 shadow-soft hover:border-indigo-200 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px]">
                                                        {c.grade}
                                                    </div>
                                                    <span className="font-black text-slate-700 uppercase text-xs">Class {c.grade}-{c.section}</span>
                                                </div>
                                                <button 
                                                    onClick={() => navigate(`/admin/class/${c.classId}`)}
                                                    className="p-2.5 text-slate-300 group-hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                >
                                                    <FaLink size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase italic">No primary class ownership</p>
                                    </div>
                                )}
                            </div>

                            {/* Subject Teacher Assignments */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <h4 className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                        <FaChalkboardTeacher /> Subject Specializations
                                    </h4>
                                    <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase">{assignments.subjectTeacherOf.length} PAPERS</span>
                                </div>
                                {assignments.subjectTeacherOf.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {assignments.subjectTeacherOf.map((s, i) => (
                                            <div key={i} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-slate-100 shadow-soft hover:border-emerald-200 transition-all group">
                                                <div>
                                                    <span className="font-black text-slate-800 uppercase text-xs block">{s.subjectName}</span>
                                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Unit {s.grade}-{s.section}</span>
                                                </div>
                                                <button 
                                                    onClick={() => navigate(`/admin/class/${s.classId}`)}
                                                    className="p-2.5 text-slate-300 group-hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                >
                                                    <FaLink size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase italic">No subject assignments found</p>
                                    </div>
                                )}
                            </div>
                          </>
                      )}
                  </div>

                  <div className="p-8 bg-slate-50 border-t rounded-b-[3rem]">
                      <button 
                        onClick={() => setShowModal(false)}
                        className="w-full py-4 bg-slate-900 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all"
                      >
                        Dismiss Matrix
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Teachers;
