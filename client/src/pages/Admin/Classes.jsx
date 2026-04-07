import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaUserTie, FaChalkboard, FaEdit, FaTimes, FaTrash } from 'react-icons/fa';
import Loader from '../../components/Loader';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  
  // Track which class is being edited
  const [editingClassId, setEditingClassId] = useState(null);

  const fetchData = async () => {
    try {
      const [classRes, teacherRes] = await Promise.all([
        api.get('/class/getall'),
        api.get('/teacher/getall')
      ]);
      setClasses(classRes.data);
      setTeachers(teacherRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddClass = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/class/create', { grade, section, teacherId: selectedTeacher });
      toast.success('Class created successfully!');
      setGrade('');
      setSection('');
      setSelectedTeacher('');
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTeacher = async (classId, teacherId) => {
    try {
        await api.put('/class/assign-teacher', { classId, teacherId });
        toast.success('Teacher assigned!');
        setEditingClassId(null);
        fetchData();
    } catch (error) {
        toast.error(error.response?.data?.message || 'Assignment failed');
    }
  };

  const handleDeleteClass = async (id) => {
      if (!window.confirm("CRITICAL: Deleting a class will unassign all its students and remove all associated timetables. This cannot be undone. Proceed?")) return;
      
      setSubmitting(true);
      try {
          await api.delete(`/class/${id}`);
          toast.success("Class and related records cleaned up.");
          fetchData();
      } catch (error) {
          toast.error("Cleanup failed.");
      } finally {
          setSubmitting(false);
      }
  };

  if (loading) return <Loader fullScreen text="Accessing Class Registers..." />;

  return (
    <div className="space-y-6 relative pb-20">
      {submitting && <Loader fullScreen text="Processing Registry Update..." />}
      <div className="flex justify-between items-center px-4">
        <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Academic Units</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Institutional Class Management</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all hover:scale-105 flex items-center justify-center"
          title="Add New Class"
        >
          <FaChalkboard size={20} />
        </button>
      </div>
      
      {/* Create Class Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 uppercase">
                  New Unit
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white/60 hover:text-white transition p-2 bg-white/10 rounded-xl"
              >
                <FaTimes size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddClass} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade</label>
                    <input
                      type="text" placeholder="e.g. 10" required
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                      value={grade} onChange={(e) => setGrade(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
                    <input
                      type="text" placeholder="e.g. A" required
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                      value={section} onChange={(e) => setSection(e.target.value)}
                    />
                  </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class Teacher</label>
                <select 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                >
                  <option value="">No teacher assigned yet</option>
                  {teachers.map(t => {
                      const isAssigned = classes.some(cls => cls.classTeacher?._id === t._id);
                      return (
                          <option key={t._id} value={t._id}>
                              {isAssigned ? '🟢 ' : ''}{t.name}
                          </option>
                      );
                  })}
                </select>
              </div>
              
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-5 text-white bg-indigo-600 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
              >
                Register Unit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Classes List */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 px-2">
          {classes.map((cls) => (
              <div 
                key={cls._id} 
                className="p-8 bg-white rounded-[2.5rem] shadow-soft hover:shadow-2xl transition-all duration-500 border border-slate-50 flex flex-col justify-between relative cursor-pointer group hover:border-indigo-100 overflow-hidden"
                onClick={() => navigate(`/admin/class/${cls._id}`)}
              >
                  <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Actions */}
                  <div className="absolute top-6 right-6 flex gap-2 z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingClassId(editingClassId === cls._id ? null : cls._id); }}
                        className={`p-3 rounded-xl transition-all ${editingClassId === cls._id ? 'bg-indigo-600 text-white rotate-90' : 'bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md'}`}
                      >
                        {editingClassId === cls._id ? <FaTimes size={12}/> : <FaEdit size={12} />}
                      </button>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls._id); }}
                        className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-md rounded-xl transition-all"
                      >
                        <FaTrash size={12} />
                      </button>
                  </div>

                  <div className="relative z-10">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none mb-2">Class {cls.grade}-{cls.section}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ACTIVE UNIT
                    </p>
                    
                    <div 
                        className={`p-6 rounded-[1.5rem] border transition-all duration-500 ${editingClassId === cls._id ? 'bg-indigo-50 border-indigo-200 ring-4 ring-indigo-50' : 'bg-slate-50 border-slate-100'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <p className={`text-[8px] font-black uppercase mb-3 tracking-[0.2em] flex items-center gap-2 ${editingClassId === cls._id ? 'text-indigo-500' : 'text-slate-400'}`}>
                            <FaUserTie size={10} /> Faculty Head
                        </p>
                        
                        {editingClassId === cls._id ? (
                            <select 
                                className="w-full p-3 text-xs font-black bg-white border border-indigo-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-indigo-600"
                                onChange={(e) => handleAssignTeacher(cls._id, e.target.value)}
                                value={cls.classTeacher?._id || ''}
                            >
                                <option value="">Assign Faculty</option>
                                <option value="None">Leave Empty</option>
                                {teachers.map(t => {
                                    const isAssigned = classes.some(c => c.classTeacher?._id === t._id && c._id !== cls._id);
                                    return (
                                        <option key={t._id} value={t._id}>
                                            {isAssigned ? '🟢 ' : ''}{t.name}
                                        </option>
                                    );
                                })}
                            </select>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-indigo-600 text-xs">
                                    {cls.classTeacher?.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="font-black text-slate-700 uppercase text-xs tracking-tight">{cls.classTeacher?.name || 'Vacant Position'}</p>
                                    <p className="text-[9px] font-bold text-slate-400">{cls.classTeacher?.email || 'Awaiting assignment'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
              </div>
          ))}
          {classes.length === 0 && (
              <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                  <FaChalkboard size={48} className="mx-auto text-slate-100 mb-4" />
                  <p className="text-slate-400 font-bold italic">No active units registered in the system...</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default Classes;
