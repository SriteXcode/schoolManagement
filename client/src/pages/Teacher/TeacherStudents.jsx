import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaUserGraduate, FaSearch, FaFilter, FaStar, FaAward, FaEllipsisV, FaPlus, FaCheckCircle, FaTrashAlt, FaTimes, FaSchool } from 'react-icons/fa';
import StudentDetailsModal from '../../components/StudentDetailsModal';

const TeacherStudents = () => {
    const [students, setStudents] = useState([]);
    const [assignedClasses, setAssignedClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    
    // Selection for Modals
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAchievementModal, setShowAchievementModal] = useState(false);
    
    // Achievement Form
    const [achievementForm, setAchievementForm] = useState({ title: '', description: '', date: new Date().toISOString().split('T')[0] });
    const [submittingAchievement, setSubmittingAchievement] = useState(false);

    const user = JSON.parse(localStorage.getItem('user')) || {};

    useEffect(() => {
        const fetchClasses = async () => {
            setLoading(true);
            try {
                const res = await api.get('/class/getall');
                setAssignedClasses(res.data);
                
                if (res.data.length > 0) {
                    // Prefer the class where they are Class Teacher if it exists
                    const ctClass = res.data.find(c => 
                        c.classTeacher?.email && user.email && 
                        c.classTeacher.email.toLowerCase() === user.email.toLowerCase()
                    );
                    setSelectedClassId(ctClass ? ctClass._id : res.data[0]._id);
                }
            } catch (error) {
                toast.error("Failed to load classes");
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, [user.email]);

    useEffect(() => {
        const fetchStudents = async () => {
            if (!selectedClassId) return;
            try {
                const studentRes = await api.get(`/student/class/${selectedClassId}`);
                setStudents(studentRes.data);
            } catch (error) {
                toast.error("Failed to load students");
            }
        };
        fetchStudents();
    }, [selectedClassId]);

    const handleUpdateStatus = async (studentId, category) => {
        try {
            await api.put(`/student/update/${studentId}`, { category });
            setStudents(prev => prev.map(s => s._id === studentId ? { ...s, category } : s));
            toast.success(`Status updated to ${category}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleAddAchievement = async (e) => {
        e.preventDefault();
        if (!achievementForm.title) return toast.error("Title is required");
        
        setSubmittingAchievement(true);
        try {
            const student = students.find(s => s._id === selectedStudent._id);
            const updatedAchievements = [...(student.achievements || []), achievementForm];
            
            const res = await api.put(`/student/update/${selectedStudent._id}`, { achievements: updatedAchievements });
            
            setStudents(prev => prev.map(s => s._id === selectedStudent._id ? res.data.student : s));
            toast.success("Achievement Added!");
            setShowAchievementModal(false);
            setAchievementForm({ title: '', description: '', date: new Date().toISOString().split('T')[0] });
        } catch (error) {
            toast.error("Failed to add achievement");
        } finally {
            setSubmittingAchievement(false);
        }
    };

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNum.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterCategory === 'All' || s.category === filterCategory;
        return matchesSearch && matchesFilter;
    });

    const currentClass = assignedClasses.find(c => c._id === selectedClassId);
    const isClassTeacher = currentClass?.classTeacher?.email?.toLowerCase() === user.email?.toLowerCase();

    if (loading && assignedClasses.length === 0) return <div className="text-center py-20 text-indigo-600 font-bold animate-pulse text-2xl">Loading Assigned Classes...</div>;

    if (assignedClasses.length === 0) return (
        <div className="text-center py-20 bg-white rounded-xl shadow-md border-2 border-dashed border-gray-200">
            <FaUserGraduate className="mx-auto text-6xl text-gray-200 mb-4" />
            <h2 className="text-2xl font-bold text-gray-400">No Assigned Classes Found</h2>
            <p className="text-gray-500 mt-2">Please contact the administrator to assign you to a class.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaUserGraduate className="text-indigo-600" /> Students Management
                    </h1>
                    <div className="mt-2 flex items-center gap-2">
                        <FaSchool className="text-gray-400" />
                        <select 
                            className="bg-transparent border-none text-indigo-700 font-bold outline-none cursor-pointer text-lg hover:underline"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                        >
                            {assignedClasses.map(c => (
                                <option key={c._id} value={c._id}>
                                    Class {c.grade} - {c.section} {c.classTeacher?.email?.toLowerCase() === user.email?.toLowerCase() ? '(Class Teacher)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search by name or roll..."
                            className="pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64 bg-white shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm font-medium"
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                    >
                        <option value="All">All Categories</option>
                        <option value="Regular">Regular</option>
                        <option value="Defaulter">Defaulter</option>
                        <option value="Disciplined">Disciplined</option>
                        <option value="Best">Best</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStudents.map(student => (
                    <div key={student._id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group">
                        {/* Header Image/Initial */}
                        <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-end px-4 relative">
                            <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm border border-white/20 
                                    ${student.category === 'Best' ? 'bg-yellow-500' : 
                                      student.category === 'Defaulter' ? 'bg-red-500' : 
                                      student.category === 'Disciplined' ? 'bg-green-500' : 'bg-indigo-400'}`}>
                                    {student.category}
                                </span>
                                {student.isDefaulter && (
                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-red-600 text-white shadow-sm border border-white/40 animate-pulse">
                                        DEFAULTER (FEES)
                                    </span>
                                )}
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center text-2xl font-bold text-indigo-600 mb-[-1.5rem] z-10 border-4 border-white">
                                {student.name.charAt(0)}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 pt-8 flex-1 flex flex-col">
                            <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{student.name}</h3>
                            <p className="text-xs font-mono text-gray-400 font-bold uppercase tracking-widest">{student.rollNum}</p>
                            
                            <div className="mt-4 flex items-center justify-between text-xs font-bold text-gray-500 bg-gray-50 p-2 rounded-lg">
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-400">Rating</p>
                                    <p className="text-indigo-600">{student.averageRating || 0}</p>
                                </div>
                                <div className="w-[1px] h-4 bg-gray-200"></div>
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-400">Reviews</p>
                                    <p className="text-gray-700">{student.reviews?.length || 0}</p>
                                </div>
                                <div className="w-[1px] h-4 bg-gray-200"></div>
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-400">Gender</p>
                                    <p className="text-gray-700">{student.gender || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => { setSelectedStudent(student); setShowDetailsModal(true); }}
                                    className="col-span-2 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
                                >
                                    <FaStar className="text-xs" /> View & Review
                                </button>
                                
                                {isClassTeacher && (
                                    <button 
                                        onClick={() => { setSelectedStudent(student); setShowAchievementModal(true); }}
                                        className="py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl font-bold text-xs hover:bg-yellow-100 transition flex items-center justify-center gap-1.5"
                                    >
                                        <FaAward /> Achievement
                                    </button>
                                )}
                                
                                <select 
                                    className={`py-2 px-1 border rounded-xl font-bold text-[10px] outline-none transition cursor-pointer
                                        ${!isClassTeacher ? 'col-span-2' : ''}
                                        ${student.category === 'Defaulter' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-white'}`}
                                    value={student.category}
                                    onChange={(e) => handleUpdateStatus(student._id, e.target.value)}
                                >
                                    <option value="Regular">Regular</option>
                                    <option value="Defaulter">Defaulter</option>
                                    <option value="Disciplined">Disciplined</option>
                                    <option value="Best">Best</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredStudents.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl shadow-md">
                    <FaUserGraduate className="mx-auto text-4xl text-gray-200 mb-2" />
                    <p className="text-gray-500 font-medium">No students match your search criteria.</p>
                </div>
            )}

            {/* Achievement Modal */}
            {showAchievementModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onClick={() => setShowAchievementModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Add Achievement</h3>
                            <button onClick={() => setShowAchievementModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes size={20}/></button>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">Adding achievement for <span className="font-bold text-indigo-600">{selectedStudent.name}</span></p>
                        
                        <form onSubmit={handleAddAchievement} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Title *</label>
                                <input 
                                    type="text" placeholder="e.g. 1st Rank in Science Quiz" 
                                    className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={achievementForm.title}
                                    onChange={e => setAchievementForm({...achievementForm, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
                                <textarea 
                                    placeholder="Brief details about the achievement..." 
                                    className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    rows="3"
                                    value={achievementForm.description}
                                    onChange={e => setAchievementForm({...achievementForm, description: e.target.value})}
                                ></textarea>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Date</label>
                                <input 
                                    type="date" 
                                    className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={achievementForm.date}
                                    onChange={e => setAchievementForm({...achievementForm, date: e.target.value})}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={submittingAchievement}
                                className="w-full py-3 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition shadow-lg flex items-center justify-center gap-2"
                            >
                                {submittingAchievement ? 'Submitting...' : <><FaAward /> Record Achievement</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Student Details Modal */}
            {showDetailsModal && selectedStudent && (
                <StudentDetailsModal 
                    student={selectedStudent} 
                    onClose={() => setShowDetailsModal(false)}
                    onReviewAdded={(updatedStudent) => {
                        setStudents(prev => prev.map(s => s._id === updatedStudent._id ? updatedStudent : s));
                        setSelectedStudent(updatedStudent);
                    }}
                />
            )}
        </div>
    );
};

export default TeacherStudents;