import React, { useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaTimes, FaQuoteLeft, FaPlus, FaAward, FaInfoCircle, FaExchangeAlt, FaCamera } from 'react-icons/fa';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Loader from './Loader';
import ImageUpload from './ImageUpload';

const StudentDetailsModal = ({ student, onClose, onReviewAdded }) => {
    const [studentStats, setStudentStats] = useState({ percentage: 0, present: 0, total: 0 });
    const [studentMarks, setStudentMarks] = useState([]);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    
    // Admin Migration State
    const [allClasses, setAllClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [transferring, setTransferring] = useState(false);

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const isAdmin = user.role === 'Admin';

    useEffect(() => {
        const fetchDetails = async () => {
            if (!student) return;
            setLoading(true);
            try {
                // Fetch Stats
                const statsRes = await api.get(`/attendance/student/${student._id}`);
                const total = statsRes.data.length;
                const present = statsRes.data.filter(a => a.status === 'Present').length;
                const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
                setStudentStats({ percentage, present, total });

                // Fetch Marks
                const marksRes = await api.get(`/marks/student/${student._id}`);
                setStudentMarks(marksRes.data);

                // Fetch Classes for migration
                if (isAdmin) {
                    const classesRes = await api.get('/class/getall');
                    setAllClasses(classesRes.data);
                }
            } catch (error) {
                console.error("Failed to fetch student details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [student, isAdmin]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        setUploading(true);
        try {
            const res = await api.post('/auth/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await api.put(`/student/update/${student._id}`, { profileImage: res.data.url });
            toast.success("Profile photo updated & optimized!");
            // Refresh logic could be here, but for simplicity:
            window.location.reload();
        } catch (error) {
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleMoveClass = async () => {
        if (!selectedClass) return toast.error("Please select a target class");
        setTransferring(true);
        try {
            const res = await api.post('/class/reassign', { 
                studentId: student._id, 
                classId: selectedClass 
            });
            toast.success(`Student moved successfully!`);
            onClose(); 
            window.location.reload(); 
        } catch (error) {
            toast.error(error.response?.data?.message || "Transfer failed");
        } finally {
            setTransferring(false);
        }
    };

    const handleAddReview = async (e) => {
        e.preventDefault();
        if (!reviewForm.comment) return toast.error("Please write a comment");
        
        setSubmittingReview(true);
        try {
            const res = await api.post(`/student/review/${student._id}`, reviewForm);
            toast.success("Review added!");
            setReviewForm({ rating: 5, comment: '' });
            if (onReviewAdded) onReviewAdded(res.data.student);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add review");
        } finally {
            setSubmittingReview(false);
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

    if (!student) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <ImageUpload 
                                label="Photo"
                                preview={student.profileImage}
                                onUploadSuccess={async (url) => {
                                    try {
                                        await api.put(`/student/update/${student._id}`, { profileImage: url });
                                        toast.success("Profile photo updated!");
                                        window.location.reload();
                                    } catch (e) {
                                        toast.error("Failed to update profile");
                                    }
                                }}
                            />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{student.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <span className="font-bold text-indigo-600">{student.averageRating || 0}</span>
                                {renderStars(student.averageRating || 0)}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes size={24} /></button>
                </div>
                
                {uploading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-[60] flex items-center justify-center rounded-2xl"><Loader text="Optimizing Photo..." /></div>}
                
                <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                    {/* Basic Info & Address */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Basic Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Gender</p>
                                <p className="font-bold text-gray-800">{student.gender || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Guardian</p>
                                <p className="font-bold text-gray-800">{student.guardianName || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Contact No</p>
                                <p className="font-bold text-gray-800">{student.user?.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Email Address</p>
                                <p className="font-bold text-gray-800 text-xs md:text-sm">{student.user?.email || 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-gray-500">Address</p>
                                <p className="font-bold text-gray-800">{student.address || 'Not Provided'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Logistics & Transport */}
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase mb-2">Logistics & Transport</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Mode of Transport</p>
                                <p className="font-black text-indigo-700">{student.transportMode || 'By Foot'}</p>
                            </div>
                            {student.transportMode === 'Bus' && (
                                <div>
                                    <p className="text-gray-500">Assigned Bus</p>
                                    <p className="font-black text-indigo-700">{student.bus?.busNumber || 'Not Assigned'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Admin Migration Section */}
                    {isAdmin && (
                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                            <h4 className="text-xs font-bold text-emerald-600 uppercase mb-3 flex items-center gap-2">
                                <FaExchangeAlt /> Class Migration Hub
                            </h4>
                            <div className="flex gap-2">
                                <select 
                                    className="flex-1 p-3 bg-white border border-emerald-100 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                >
                                    <option value="">Select Target Class</option>
                                    {allClasses.map(cls => (
                                        <option key={cls._id} value={cls._id}>
                                            Class {cls.grade}-{cls.section} {cls._id === student.sClass?._id ? '(Current)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <button 
                                    onClick={handleMoveClass}
                                    disabled={transferring || !selectedClass || selectedClass === student.sClass?._id}
                                    className="px-4 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-700 disabled:bg-emerald-200 transition shadow-lg shadow-emerald-100 whitespace-nowrap"
                                >
                                    {transferring ? 'Moving...' : 'Transfer Student'}
                                </button>
                            </div>
                            <p className="text-[9px] font-bold text-emerald-600/60 mt-2 italic">* This will auto-update Roll No and School Email ID</p>
                        </div>
                    )}

                    {/* Attendance Stats */}
                    <div className={`p-4 rounded-xl text-white shadow-md flex justify-between items-center ${studentStats.percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`}>
                         <div>
                             <p className="text-xs font-bold opacity-80 uppercase">Attendance Rate</p>
                             <p className="text-3xl font-bold">{studentStats.percentage}%</p>
                         </div>
                         <div className="text-right">
                             <p className="text-sm font-medium">{studentStats.present} / {studentStats.total} Days Present</p>
                             <p className="text-xs opacity-75">{studentStats.percentage >= 75 ? 'On Track' : 'Short Attendance'}</p>
                         </div>
                    </div>

                    {/* Achievements */}
                    <div className="bg-white border rounded-xl overflow-hidden">
                        <h4 className="p-3 bg-yellow-50 text-yellow-800 font-bold text-sm border-b flex items-center gap-2">
                            <FaStar /> Achievements
                        </h4>
                        <div className="p-3 space-y-2">
                            {student.achievements && student.achievements.length > 0 ? (
                                student.achievements.map((ach, i) => (
                                    <div key={i} className="text-sm border-b pb-2 last:border-0">
                                        <p className="font-bold text-gray-800">{ach.title}</p>
                                        <p className="text-xs text-gray-500">{ach.description}</p>
                                        <p className="text-[10px] text-indigo-400 font-bold mt-1">{new Date(ach.date).toLocaleDateString()}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-2">No achievements recorded yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Results / Marks */}
                    <div className="bg-white border rounded-xl overflow-hidden">
                        <h4 className="p-3 bg-indigo-50 text-indigo-800 font-bold text-sm border-b flex items-center gap-2">
                            <FaAward /> Academic Results
                        </h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase">
                                    <tr>
                                        <th className="p-2">Exam</th>
                                        <th className="p-2">Subject</th>
                                        <th className="p-2 text-center">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {studentMarks.length > 0 ? (
                                        studentMarks.map((m, i) => (
                                            <tr key={i}>
                                                <td className="p-2 font-medium">{m.exam?.name}</td>
                                                <td className="p-2">{m.subject}</td>
                                                <td className="p-2 text-center font-bold text-indigo-600">{m.score}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="3" className="p-4 text-center text-gray-400">No marks available.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Add Review Form */}
                    <form onSubmit={handleAddReview} className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mt-4">
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

                    <h4 className="font-bold text-gray-700 flex items-center gap-2 mt-4"><FaStar className="text-yellow-400"/> Reviews History</h4>
                    {student.reviews && student.reviews.length > 0 ? (
                        [...student.reviews].reverse().map((review, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative">
                                <FaQuoteLeft className="absolute top-4 right-4 text-gray-200 text-xl" />
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                        {review.reviewer?.name ? review.reviewer.name.charAt(0) : 'U'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-gray-800">
                                            {review.reviewer?.name || 'Unknown User'}
                                            <span className="text-[10px] text-gray-500 font-normal ml-1">({review.reviewer?.role})</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500">{new Date(review.date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="mb-2">{renderStars(review.rating)}</div>
                                <p className="text-gray-600 text-sm">{review.comment}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-400 py-4">No reviews available for this student.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDetailsModal;
