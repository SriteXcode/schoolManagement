import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { 
  FaArrowLeft, FaUserGraduate, FaStar, FaExclamationCircle, 
  FaCheckCircle, FaUser, FaTh, FaList, FaChalkboardTeacher, 
  FaBook, FaRegStar, FaTimes, FaPlus, FaEdit 
} from 'react-icons/fa';

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [classDetails, setClassDetails] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  
  // Subject Management State
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubjects, setEditingSubjects] = useState([]);
  const [updatingSubjects, setUpdatingSubjects] = useState(false);

  // Review Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const isAdmin = user.role === 'Admin';
  const canReview = user.role === 'Teacher' || user.role === 'Admin';

  const fetchData = async () => {
    try {
      const [studentRes, classRes, teacherRes, allClassesRes] = await Promise.all([
          api.get(`/student/class/${id}`),
          api.get(`/class/details/${id}`),
          api.get('/teacher/getall'),
          api.get('/class/getall')
      ]);
      setStudents(studentRes.data);
      setClassDetails(classRes.data);
      setTeachers(teacherRes.data);
      setAllClasses(allClassesRes.data);
      setEditingSubjects(classRes.data.subjects.map(s => ({ 
          subName: s.subName, 
          teacher: s.teacher?._id || '' 
      })));
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleUpdateSubjects = async (e) => {
    e.preventDefault();
    setUpdatingSubjects(true);
    try {
        await api.put('/class/update-subjects', { 
            classId: id, 
            subjects: editingSubjects 
        });
        toast.success("Subjects updated successfully!");
        setShowSubjectModal(false);
        fetchData();
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to update subjects");
    } finally {
        setUpdatingSubjects(false);
    }
  };

  const addSubjectField = () => {
    setEditingSubjects([...editingSubjects, { subName: '', teacher: '' }]);
  };

  const removeSubjectField = (index) => {
    setEditingSubjects(editingSubjects.filter((_, i) => i !== index));
  };

  const updateSubjectField = (index, field, value) => {
    const updated = [...editingSubjects];
    updated[index][field] = value;
    setEditingSubjects(updated);
  };

  const isTeacherAssigned = (teacherId) => {
    // Check if class teacher in any class
    const isClassTeacher = allClasses.some(c => c.classTeacher?._id === teacherId);
    // Check if subject teacher in any class
    const isSubjectTeacher = allClasses.some(c => c.subjects?.some(s => s.teacher?._id === teacherId));
    return isClassTeacher || isSubjectTeacher;
  };

  const handleCategoryChange = async (studentId, newCategory) => {
    try {
      await api.put(`/student/update/${studentId}`, { category: newCategory });
      setStudents(prev => prev.map(s => s._id === studentId ? { ...s, category: newCategory } : s));
      toast.success(`Marked as ${newCategory}`);
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment) return toast.error("Please write a comment");
    
    setSubmittingReview(true);
    try {
        const res = await api.post(`/student/review/${selectedStudent._id}`, reviewForm);
        // Update local state
        const updatedStudent = res.data.student;
        setStudents(prev => prev.map(s => s._id === updatedStudent._id ? updatedStudent : s));
        setSelectedStudent(updatedStudent); // Update modal data
        setReviewForm({ rating: 5, comment: '' });
        toast.success("Review added!");
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to add review");
    } finally {
        setSubmittingReview(false);
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Best': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Disciplined': return 'bg-green-100 text-green-700 border-green-300';
      case 'Defaulter': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const renderStars = (rating) => {
    return (
        <div className="flex text-yellow-400 text-sm">
            {[...Array(5)].map((_, i) => (
                <span key={i}>{i < Math.round(rating) ? <FaStar /> : <FaRegStar className="text-gray-300"/>}</span>
            ))}
        </div>
    );
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Class Details...</div>;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 font-bold hover:underline mb-2">
                <FaArrowLeft /> Back
            </button>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaUserGraduate className="text-indigo-600" /> Class {classDetails?.grade}-{classDetails?.section}
            </h1>
        </div>
        
        {/* View Toggle */}
        <div className="bg-white p-1 rounded-lg border flex shadow-sm">
            <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                title="List View"
            >
                <FaList />
            </button>
            <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                title="Grid View"
            >
                <FaTh />
            </button>
        </div>
      </div>

      {/* Teachers Section */}
      <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-indigo-500">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaChalkboardTeacher /> Assigned Teachers
            </h2>
            {isAdmin && (
                <button 
                    onClick={() => setShowSubjectModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                >
                    <FaEdit /> Manage Subjects
                </button>
            )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Class Teacher */}
            <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider block mb-1">Class Teacher</span>
                <div className="font-bold text-gray-800 text-lg">
                    {classDetails?.classTeacher?.name || <span className="text-gray-400 italic">Not Assigned</span>}
                </div>
                {classDetails?.classTeacher && <div className="text-sm text-gray-500">{classDetails.classTeacher.email}</div>}
            </div>

            {/* Subject Teachers */}
            {classDetails?.subjects?.map((sub, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Subject</span>
                        <FaBook className="text-indigo-200" />
                    </div>
                    <div className="font-bold text-indigo-700 text-lg">{sub.subName}</div>
                    <div className="text-sm font-medium text-gray-800 mt-1">
                        {sub.teacher?.name || <span className="text-red-400 text-xs">No Teacher</span>}
                    </div>
                </div>
            ))}
            {(!classDetails?.subjects || classDetails.subjects.length === 0) && (
                <div className="col-span-full text-center text-gray-400 italic py-2">No subjects assigned yet.</div>
            )}
        </div>
      </div>

      {/* Subject Management Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowSubjectModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-gray-800">Manage Subjects & Teachers</h3>
                    <button onClick={() => setShowSubjectModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes size={24} /></button>
                </div>
                
                <form onSubmit={handleUpdateSubjects} className="flex-1 overflow-y-auto p-6 flex flex-col">
                    <div className="space-y-4 mb-6">
                        {editingSubjects.map((sub, idx) => (
                            <div key={idx} className="flex flex-wrap md:flex-nowrap gap-4 items-end p-4 bg-gray-50 rounded-xl border border-gray-100 relative group">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Subject Name</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Mathematics"
                                        className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={sub.subName}
                                        onChange={(e) => updateSubjectField(idx, 'subName', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Subject Teacher</label>
                                    <select 
                                        className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={sub.teacher}
                                        onChange={(e) => updateSubjectField(idx, 'teacher', e.target.value)}
                                    >
                                        <option value="">Select Teacher</option>
                                        {teachers.map(t => {
                                            const assigned = isTeacherAssigned(t._id);
                                            return (
                                                <option key={t._id} value={t._id}>
                                                    {assigned ? '🟢 ' : ''}{t.name}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => removeSubjectField(idx)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                                    title="Remove Subject"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button 
                        type="button" 
                        onClick={addSubjectField}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-indigo-400 hover:text-indigo-600 transition flex items-center justify-center gap-2 mb-8"
                    >
                        <FaPlus /> Add New Subject
                    </button>

                    <div className="mt-auto pt-6 border-t flex justify-end gap-4">
                        <button 
                            type="button" 
                            onClick={() => setShowSubjectModal(false)}
                            className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={updatingSubjects}
                            className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition"
                        >
                            {updatingSubjects ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Students Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaUserGraduate /> Students ({students.length})
        </h2>
        
        {viewMode === 'list' ? (
             <div className="bg-white rounded-xl shadow-md overflow-hidden">
             <table className="min-w-full text-left">
               <thead className="bg-gray-50 border-b">
                 <tr>
                   <th className="p-4 font-bold text-gray-600">Roll No</th>
                   <th className="p-4 font-bold text-gray-600">Name</th>
                   <th className="p-4 font-bold text-gray-600">Status</th>
                   <th className="p-4 font-bold text-gray-600">Avg Rating</th>
                   <th className="p-4 font-bold text-gray-600 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {students.map((student) => (
                   <tr key={student._id} className="hover:bg-gray-50 transition">
                     <td className="p-4 font-mono text-gray-600">{student.rollNum}</td>
                     <td className="p-4 font-bold text-gray-800">
                        {student.name}
                        <div className="text-xs text-gray-400 font-normal">{student.user?.email}</div>
                     </td>
                     <td className="p-4">
                        <select 
                             className={`px-2 py-1 rounded-full text-xs font-bold border cursor-pointer ${getCategoryColor(student.category)}`}
                             value={student.category || 'Regular'}
                             onChange={(e) => handleCategoryChange(student._id, e.target.value)}
                        >
                             <option value="Regular">Regular</option>
                             <option value="Best">Best</option>
                             <option value="Disciplined">Disciplined</option>
                             <option value="Defaulter">Defaulter</option>
                        </select>
                     </td>
                     <td className="p-4">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-700">{student.averageRating || 0}</span>
                            {renderStars(student.averageRating || 0)}
                            <span className="text-xs text-gray-400">({student.reviews?.length || 0})</span>
                        </div>
                     </td>
                     <td className="p-4 text-right">
                        <button 
                            onClick={() => { setSelectedStudent(student); setShowReviewModal(true); }}
                            className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-bold rounded hover:bg-indigo-100 transition"
                        >
                            View Reviews
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map(student => (
                    <div key={student._id} className="bg-white rounded-xl shadow-md p-6 border hover:shadow-lg transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-gray-100 px-3 py-1 rounded text-xs font-mono font-bold text-gray-600">{student.rollNum}</div>
                             <select 
                                className={`px-2 py-1 rounded-full text-[10px] font-bold border cursor-pointer ${getCategoryColor(student.category)}`}
                                value={student.category || 'Regular'}
                                onChange={(e) => handleCategoryChange(student._id, e.target.value)}
                            >
                                <option value="Regular">Regular</option>
                                <option value="Best">Best</option>
                                <option value="Disciplined">Disciplined</option>
                                <option value="Defaulter">Defaulter</option>
                            </select>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">{student.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{student.user?.email}</p>
                        
                        <div className="flex items-center gap-2 mb-4 bg-yellow-50 p-2 rounded">
                             <div className="text-2xl font-bold text-yellow-500">{student.averageRating || 0}</div>
                             <div className="flex flex-col">
                                {renderStars(student.averageRating || 0)}
                                <span className="text-xs text-yellow-600 font-medium">{student.reviews?.length || 0} Reviews</span>
                             </div>
                        </div>

                        <button 
                            onClick={() => { setSelectedStudent(student); setShowReviewModal(true); }}
                            className="w-full py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                        >
                            <FaStar /> Reviews
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowReviewModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Reviews for {selectedStudent.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span>Average: {selectedStudent.averageRating || 0} / 5</span>
                            {renderStars(selectedStudent.averageRating || 0)}
                        </div>
                    </div>
                    <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes size={24} /></button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Add Review Form (For Teachers & Admins) */}
                    {canReview && (
                        <form onSubmit={handleAddReview} className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2"><FaPlus /> Add New Review</h4>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-bold text-gray-700">Rating *</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button 
                                            key={star} 
                                            type="button"
                                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                            className={`text-xl transition ${star <= reviewForm.rating ? 'text-yellow-400 scale-110' : 'text-gray-300 hover:text-yellow-200'}`}
                                        >
                                            <FaStar />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea 
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                rows="3"
                                placeholder="Write your review here..."
                                value={reviewForm.comment}
                                onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                required
                            ></textarea>
                            <div className="flex justify-end mt-3">
                                <button 
                                    type="submit" 
                                    disabled={submittingReview}
                                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition text-sm"
                                >
                                    {submittingReview ? 'Posting...' : 'Post Review'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Review List */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-700 border-b pb-2">Review History</h4>
                        {selectedStudent.reviews?.length > 0 ? (
                            [...selectedStudent.reviews].reverse().map((review, idx) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                {review.reviewer?.name ? review.reviewer.name.charAt(0) : 'U'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-gray-800">
                                                    {review.reviewer?.name || 'Unknown User'} 
                                                    <span className="text-[10px] text-gray-500 font-normal ml-1">({review.reviewer?.role})</span>
                                                </div>
                                                <div className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        {renderStars(review.rating)}
                                    </div>
                                    <p className="text-gray-600 text-sm mt-2">{review.comment}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">No reviews yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetails;