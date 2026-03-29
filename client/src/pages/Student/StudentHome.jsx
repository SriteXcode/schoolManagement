import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import { FaChalkboardTeacher, FaBook, FaStar, FaRegStar, FaQuoteLeft, FaBullhorn, FaTimes } from 'react-icons/fa';
import { AlertTriangle } from 'lucide-react';

const StudentHome = () => {
  const { student } = useOutletContext();
  const [notices, setNotices] = useState([]);
  const [classDetails, setClassDetails] = useState(null);
  const [syllabusList, setSyllabusList] = useState([]);
  const [feeRecord, setFeeRecord] = useState(null);
  const [loadingClass, setLoadingClass] = useState(true);
  const [loadingSyllabus, setLoadingSyllabus] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await api.get('/notice/getall');
        setNotices(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotices();
  }, []);

  useEffect(() => {
    const fetchFeeRecord = async () => {
        try {
            const res = await api.get('/fee/student');
            setFeeRecord(res.data);
        } catch (err) {
            console.error("Failed to fetch fee record", err);
        }
    };
    fetchFeeRecord();
  }, []);

  useEffect(() => {
    const fetchClassAndSyllabus = async () => {
        if (student?.sClass?._id) {
            try {
                const [classRes, syllabusRes] = await Promise.all([
                    api.get(`/class/details/${student.sClass._id}`),
                    api.get(`/syllabus/class/${student.sClass._id}`)
                ]);
                setClassDetails(classRes.data);
                setSyllabusList(syllabusRes.data);
            } catch (err) {
                console.error("Failed to fetch class/syllabus details", err);
            } finally {
                setLoadingClass(false);
                setLoadingSyllabus(false);
            }
        }
    };
    if (student) fetchClassAndSyllabus();
  }, [student]);

  const getSyllabusStats = (syllabus) => {
    const total = syllabus.chapters?.length || 0;
    const completed = syllabus.chapters?.filter(c => c.status === 'Completed').length || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const lastCompleted = [...(syllabus.chapters || [])]
        .filter(c => c.status === 'Completed')
        .sort((a, b) => b.chapterNo - a.chapterNo)[0];
        
    return { percentage, lastCompleted };
  };

  const renderStars = (rating) => {
    return (
        <div className="flex text-yellow-400 text-fluid-xs">
            {[...Array(5)].map((_, i) => (
                <span key={i}>{i < Math.round(rating) ? <FaStar /> : <FaRegStar className="text-slate-200"/>}</span>
            ))}
        </div>
    );
  };

  if (!student) return (
    <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-slate-400 font-black uppercase tracking-widest text-fluid-xs">Syncing profile...</div>
    </div>
  );

  return (
    <div className="space-y-12 pb-20">
        {/* Modal for Notice/Review Details */}
        {(selectedNotice || selectedReview) && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
                <div 
                    className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/20 animate-in zoom-in-95 duration-300"
                    onClick={e => e.stopPropagation()}
                >
                    <button 
                        onClick={() => { setSelectedNotice(null); setSelectedReview(null); }}
                        className="absolute top-8 right-8 p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors z-20"
                    >
                        <FaTimes />
                    </button>

                    {selectedNotice ? (
                        <div className="p-12 md:p-16 text-left">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="bg-orange-50 px-4 py-1.5 rounded-full text-orange-600 text-[10px] font-black uppercase tracking-widest">Notice Board</div>
                                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{new Date(selectedNotice.date).toLocaleDateString()}</div>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 leading-tight tracking-tight">{selectedNotice.title}</h2>
                            <div className="prose prose-slate max-w-none">
                                <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap">{selectedNotice.details}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 md:p-16 text-left">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="bg-indigo-50 px-4 py-1.5 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-widest">Performance Review</div>
                                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{new Date(selectedReview.date).toLocaleDateString()}</div>
                            </div>
                            
                            <div className="flex items-center gap-6 mb-12">
                                <div className="w-20 h-20 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-3xl font-black shadow-xl">
                                    {selectedReview.teacher?.name?.charAt(0) || 'F'}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900">{selectedReview.teacher?.name || 'Faculty Member'}</h4>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Department Head</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-10 rounded-[2.5rem] mb-10 relative">
                                <FaQuoteLeft className="absolute top-8 left-8 text-indigo-100 text-5xl -translate-x-1/2 -translate-y-1/2" />
                                <p className="text-slate-700 text-xl leading-relaxed italic relative z-10">"{selectedReview.comment}"</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Academic Rating</div>
                                {renderStars(selectedReview.rating)}
                            </div>
                        </div>
                    )}
                </div>
                <div className="absolute inset-0 -z-10" onClick={() => { setSelectedNotice(null); setSelectedReview(null); }}></div>
            </div>
        )}

        {/* Defaulter Notification */}
        {feeRecord?.isDefaulter && (
            <div className="bg-red-50 p-8 rounded-[2.5rem] shadow-lg shadow-red-100 flex items-center gap-6 animate-pulse">
                <div className="bg-red-500 p-4 rounded-2xl text-white">
                    <AlertTriangle size={32} />
                </div>
                <div>
                    <h3 className="text-fluid-xl font-black text-red-900 tracking-tight uppercase">Payment Required</h3>
                    <p className="text-red-700 font-bold mt-1 leading-relaxed text-fluid-sm">Please clear your outstanding dues at the Admission Cell to avoid restrictions.</p>
                </div>
            </div>
        )}

        {/* Welcome Banner */}
        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-white shadow-soft-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full -mr-40 -mt-40 blur-3xl group-hover:bg-teal-500/20 transition-colors duration-700"></div>
            <div className="relative z-10 text-left">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-teal-500/20 px-4 py-1.5 rounded-full text-teal-400 text-fluid-xs font-black uppercase tracking-widest">Student Portal</div>
                    <div className="h-px w-12 bg-slate-700"></div>
                    <div className="text-slate-500 text-fluid-xs font-black uppercase tracking-widest">Term 1 • 2026</div>
                </div>
                <h1 className="text-2xl font-black tracking-tighter leading-tight">Welcome, {student.name.split(' ')[0]}!</h1>
                
                <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-w-3xl">
                    <div className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:bg-white/10 transition-colors">
                        <span className="block text-fluid-xs uppercase text-slate-500 font-black tracking-widest mb-1">Grade Level</span>
                        <span className="font-black text-fluid-2xl text-teal-400">{student.sClass?.grade}-{student.sClass?.section}</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:bg-white/10 transition-colors">
                        <span className="block text-fluid-xs uppercase text-slate-500 font-black tracking-widest mb-1">Roll Number</span>
                        <span className="font-black text-fluid-2xl font-mono text-indigo-400">#{student.rollNum}</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:bg-white/10 transition-colors col-span-2 md:col-span-1">
                         <span className="block text-fluid-xs uppercase text-slate-500 font-black tracking-widest mb-1">Avg Performance</span>
                         <div className="flex items-center gap-3">
                             <span className="font-black text-fluid-2xl text-yellow-400">{student.averageRating || 0}</span>
                             <FaStar className="text-yellow-400 text-fluid-sm" />
                         </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-12">
                
                {/* Syllabus Tracking Section */}
                <div className="bg-white rounded-[2.5rem] shadow-soft p-10">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-fluid-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                                <FaBook />
                            </div>
                            Syllabus Tracking
                        </h2>
                        <div className="text-fluid-xs font-black uppercase text-slate-400 tracking-widest">Real-time Progress</div>
                    </div>
                    
                    {loadingSyllabus ? (
                        <div className="text-center py-12 text-slate-400 font-bold italic">Syncing curriculum...</div>
                    ) : (
                        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
                            {syllabusList.length > 0 ? syllabusList.map((syllabus, idx) => {
                                const { percentage, lastCompleted } = getSyllabusStats(syllabus);
                                return (
                                    <div key={idx}  className="min-w-[280px] max-w-[320px] flex-shrink-0 p-6 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-lg transition-all group snap-start">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="text-left">
                                                <h4 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight text-fluid-base">{syllabus.subject}</h4>
                                                <p className="text-fluid-xs text-slate-400 uppercase font-black tracking-widest mt-1.5">{syllabus.teacher?.name}</p>
                                            </div>
                                            <span className={`text-fluid-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${percentage === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                {percentage}%
                                            </span>
                                        </div>
                                        
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 mb-6 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex items-center gap-2 bg-white/50 p-3 rounded-2xl">
                                            <div className="text-fluid-xs font-black uppercase text-slate-400 tracking-widest shrink-0">Recent</div>
                                            {lastCompleted ? (
                                                <span className="text-xs text-slate-600 font-bold truncate">
                                                    Ch {lastCompleted.chapterNo}: {lastCompleted.chapterName}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">No updates</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="w-full text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                                    <p className="text-slate-400 font-bold">Waiting for faculty updates.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* My Faculty */}
                <div className="bg-white rounded-[2.5rem] shadow-soft p-10">
                    <h2 className="text-fluid-2xl font-black text-slate-900 mb-10 tracking-tight flex items-center gap-3">
                        <div className="bg-teal-50 p-2 rounded-xl text-teal-600">
                            <FaChalkboardTeacher />
                        </div>
                        My Faculty
                    </h2>
                    
                    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
                        {/* Class Teacher */}
                        <div className="min-w-[280px] p-6 rounded-3xl bg-teal-50 flex items-center gap-5 border-none group snap-start">
                            <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-white flex items-center justify-center text-teal-600 font-black shadow-sm text-xl">
                                {classDetails?.classTeacher?.name ? classDetails.classTeacher.name.charAt(0) : 'T'}
                            </div>
                            <div className="text-left">
                                <span className="text-fluid-xs font-black text-teal-600 uppercase tracking-widest block mb-1">Class Teacher</span>
                                <h4 className="font-black text-slate-900 truncate max-w-[150px] text-fluid-base">
                                    {classDetails?.classTeacher?.name || "Unassigned"}
                                </h4>
                                <p className="text-xs text-teal-700/60 truncate max-w-[150px]">{classDetails?.classTeacher?.email}</p>
                            </div>
                        </div>

                        {/* Subject Teachers */}
                        {classDetails?.subjects?.map((sub, idx) => (
                            <div key={idx} className="min-w-[280px] p-6 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-md transition-all flex items-center gap-5 group snap-start">
                                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-indigo-500 shadow-sm text-xl">
                                    <FaBook />
                                </div>
                                <div className="text-left">
                                    <span className="text-fluid-xs font-black text-slate-400 uppercase tracking-widest block mb-1">{sub.subName}</span>
                                    <h4 className="font-black text-slate-900 truncate max-w-[150px] text-fluid-base">
                                        {sub.teacher?.name || "TBA"}
                                    </h4>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Performance & Bulletins */}
            <div className="lg:col-span-1 space-y-4 text-left">
                {/* Performance & Recent Feedback Section */}
                <div className="bg-white rounded-[2.5rem] shadow-soft p-10 h-2/3 flex flex-col">
                    <h2 className="text-fluid-2xl font-black text-slate-900 mb-10 tracking-tight flex items-center gap-3">
                        <div className="bg-yellow-50 p-2 rounded-xl text-yellow-500">
                            <FaStar />
                        </div>
                        Performance
                    </h2>
                    
                    <div className="space-y-10 flex-1 flex flex-col">
                        {/* Summary Card */}
                        <div className="text-center p-10 bg-slate-900 rounded-[2rem] text-white shadow-lg relative overflow-hidden group">
                             <div className="relative z-10">
                                <div className="text-5xl font-black mb-3 tracking-tighter">{student.averageRating || 0}</div>
                                <div className="flex justify-center mb-4">{renderStars(student.averageRating || 0)}</div>
                                <p className="text-fluid-xs font-black uppercase tracking-widest text-slate-500">Global Rating</p>
                             </div>
                             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>

                        {/* Review Row - Scrollable */}
                        <div className="w-full overflow-hidden">
                            <h4 className="text-fluid-xs font-black uppercase text-slate-400 tracking-widest mb-6">Recent Feedback</h4>
                            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
                                {student.reviews && student.reviews.length > 0 ? (
                                    [...student.reviews].reverse().map((review, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => setSelectedReview(review)}
                                            className="min-w-[260px] flex-shrink-0 snap-start p-6 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-md transition-all relative border-l-4 border-indigo-500 group cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-fluid-xs font-black text-slate-400 uppercase tracking-widest">{new Date(review.date).toLocaleDateString()}</span>
                                                {renderStars(review.rating)}
                                            </div>
                                            <p className="text-fluid-sm text-slate-600 leading-relaxed font-medium mb-4 italic line-clamp-3">"{review.comment}"</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm">
                                                    {review.teacher?.name?.charAt(0) || 'T'}
                                                </div>
                                                <span className="text-fluid-xs font-black text-slate-500 uppercase tracking-widest">{review.teacher?.name || 'Faculty'}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full text-center py-10 bg-slate-50 rounded-3xl">
                                        <p className="text-slate-400 font-bold text-fluid-sm">No reviews yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bulletins Section - Horizontal Row */}
                <div className="bg-white rounded-[2.5rem] shadow-soft p-10 overflow-hidden">
                    <h2 className="text-fluid-2xl font-black text-slate-900 mb-8 flex items-center gap-3 tracking-tight">
                        <div className="bg-orange-50 p-2 rounded-xl text-orange-500">
                            <FaBullhorn />
                        </div>
                        Bulletins
                    </h2>
                    
                    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
                        {notices.length > 0 ? notices.slice(0, 5).map(notice => (
                            <div 
                                key={notice._id} 
                                onClick={() => setSelectedNotice(notice)}
                                className="min-w-[260px] flex-shrink-0 snap-start group cursor-pointer p-6 bg-slate-50 rounded-3xl hover:bg-white hover:shadow-md transition-all border-t-4 border-orange-500/20 hover:border-orange-500 transition-colors"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-fluid-xs font-black text-slate-400 uppercase tracking-widest">{new Date(notice.date).toLocaleDateString()}</span>
                                    <div className="w-2 h-2 rounded-full bg-orange-200 group-hover:bg-orange-500 transition-colors"></div>
                                </div>
                                <h4 className="font-black text-slate-800 text-fluid-base group-hover:text-orange-600 transition-colors leading-tight mb-3 line-clamp-1">{notice.title}</h4>
                                <p className="text-fluid-sm text-slate-600 line-clamp-2">{notice.details.slice(0, 30)}...</p>
                            </div>
                        )) : (
                            <div className="w-full text-center py-10 bg-slate-50 rounded-3xl">
                                <p className="text-slate-400 font-bold italic">All quiet for now.</p>
                            </div>
                        )}
                    </div>

                    {/* {notices.length > 0 && (
                        <button className="w-full py-4 mt-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-fluid-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-slate-100">
                            View Full Board
                        </button>
                    )} */}
                </div>
            </div>
        </div>
    </div>
  );
};

export default StudentHome;