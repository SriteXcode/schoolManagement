import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaUserTie, FaChalkboard, FaEdit, FaTimes } from 'react-icons/fa';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [loading, setLoading] = useState(false);
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
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddClass = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      setLoading(false);
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

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Manage Classes</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
          title="Add New Class"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      {/* Create Class Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                  <FaChalkboard /> Add New Class
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white hover:text-indigo-200 transition"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddClass} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Grade</label>
                <input
                  type="text"
                  placeholder="e.g. 10"
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Section</label>
                <input
                  type="text"
                  placeholder="e.g. A"
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Class Teacher (Optional)</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                >
                  <option value="">Select Class Teacher</option>
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
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-bold shadow-lg shadow-indigo-200 transition"
                >
                  {loading ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classes List */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
              <div 
                key={cls._id} 
                onClick={() => navigate(`/admin/class/${cls._id}`)}
                className="p-6 bg-white rounded-xl shadow-md border border-gray-100 flex flex-col justify-between hover:shadow-lg transition relative cursor-pointer group"
              >
                  
                  {/* Edit Toggle Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingClassId(editingClassId === cls._id ? null : cls._id); }}
                    className={`absolute top-4 right-4 p-2 rounded-full transition z-10 ${editingClassId === cls._id ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50'}`}
                  >
                    {editingClassId === cls._id ? <FaTimes size={14}/> : <FaEdit size={14} />}
                  </button>

                  <div>
                    <div className="flex justify-between items-start pr-8">
                        <h3 className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition">Class {cls.grade}-{cls.section}</h3>
                    </div>
                    
                    <div 
                        className={`mt-4 p-4 rounded-lg border transition ${editingClassId === cls._id ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'}`}
                        onClick={e => e.stopPropagation()} // Prevent click from triggering nav when editing
                    >
                        <p className={`text-xs font-bold uppercase mb-1 flex items-center gap-1 ${editingClassId === cls._id ? 'text-indigo-500' : 'text-gray-400'}`}>
                            <FaUserTie size={10} /> Class Teacher
                        </p>
                        
                        {editingClassId === cls._id ? (
                            <select 
                                className="w-full mt-2 p-2 text-sm border border-indigo-300 rounded bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                onChange={(e) => handleAssignTeacher(cls._id, e.target.value)}
                                value={cls.classTeacher?._id || ''}
                            >
                                <option value="">Select Teacher</option>
                                <option value="None">Unassign Teacher</option>
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
                            cls.classTeacher ? (
                                <p className="font-bold text-slate-700 text-lg">{cls.classTeacher.name}</p>
                            ) : (
                                <p className="text-gray-400 italic text-sm">No teacher assigned</p>
                            )
                        )}
                    </div>
                  </div>

                  {editingClassId === cls._id && (
                      <p className="mt-4 text-[10px] text-indigo-400 font-medium text-center italic">
                          Selecting a teacher will save the change immediately.
                      </p>
                  )}
              </div>
          ))}
          {classes.length === 0 && <p className="text-gray-500 col-span-3 text-center py-10">No classes found. Add your first class above!</p>}
      </div>
    </div>
  );
};

export default Classes;
