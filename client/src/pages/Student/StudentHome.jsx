import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import { FaChalkboardTeacher, FaBook, FaStar, FaRegStar, FaQuoteLeft, FaBullhorn, FaTimes, FaCalendarCheck, FaPencilRuler, FaCalendarAlt, FaBus, FaMapMarkerAlt, FaUserTie } from 'react-icons/fa';
import { AlertTriangle, Trophy, Calendar, Clock, Edit2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ExamCountdown = ({ examDate, examTime }) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        const getExamStartDateTime = (dateStr, timeStr) => {
            const baseDate = new Date(dateStr);
            let timePart = (timeStr || "09:00 AM").split("-")[0].trim();

            const match = timePart.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (match) {
                let [_, hours, minutes, ampm] = match;
                hours = parseInt(hours);
                minutes = parseInt(minutes);
                if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
                if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
                baseDate.setHours(hours, minutes, 0, 0);
            } else {
                baseDate.setHours(9, 0, 0, 0);
            }
            return baseDate;
        };

        const targetDate = getExamStartDateTime(examDate, examTime);

        const calculateTimeLeft = () => {
            const diff = targetDate.getTime() - Date.now();
            if (diff <= -3 * 60 * 60 * 1000) {
                // Ended more than 3 hours ago
                setTimeLeft({ total: diff, days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }
            if (diff <= 0) {
                // In progress or just ended (within 3 hours)
                setTimeLeft({ total: diff, days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }
            const seconds = Math.floor((diff / 1000) % 60);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            setTimeLeft({ total: diff, days, hours, minutes, seconds });
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [examDate, examTime]);

    if (!timeLeft) {
        return <span className="ml-2 text-[9px] font-black text-slate-400 animate-pulse uppercase tracking-wider">Syncing...</span>;
    }

    const { total, days, hours, minutes, seconds } = timeLeft;

    if (total <= 0) {
        const durationMs = 3 * 60 * 60 * 1000; // 3 hours duration
        if (Math.abs(total) < durationMs) {
            return (
                <span className="ml-2 text-[9px] font-black text-white bg-teal-600 px-2 py-0.5 rounded-lg uppercase tracking-widest animate-pulse shadow-sm shadow-teal-100">
                    Live Now
                </span>
            );
        }
        return (
            <span className="ml-2 text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg uppercase tracking-widest">
                Ended
            </span>
        );
    }

    if (days > 0) {
        return (
            <span className="ml-2 text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-widest border border-indigo-100/50">
                {days}d {hours}h left
            </span>
        );
    }

    return (
        <span className="ml-2 text-[9px] font-black text-white bg-red-600 px-2 py-0.5 rounded-lg uppercase tracking-widest animate-pulse shadow-sm shadow-red-200">
            {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
    );
};

const parseSyllabus = (syllabusStr) => {
    if (!syllabusStr) return [];
    const sections = syllabusStr.split(/[;\n]/).filter(s => s.trim());
    return sections.map(section => {
        if (section.includes('-')) {
            const [topic, sub] = section.split('-');
            const subtopics = sub.split(/[,\~]/).filter(s => s.trim()).map(s => s.trim());
            return { topic: topic.trim(), subtopics };
        }
        return { topic: section.trim(), subtopics: [] };
    });
};

const SyllabusRenderer = ({ syllabus }) => {
    const parsed = parseSyllabus(syllabus);
    if (parsed.length === 0) return <p className="text-slate-400 italic text-[10px]">No details available.</p>;

    return (
        <div className="space-y-4">
            {parsed.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                        {item.topic}
                    </h4>
                    {item.subtopics.length > 0 && (
                        <div className="ml-4 flex flex-wrap gap-x-4 gap-y-1">
                            {item.subtopics.map((sub, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                                    <span>•</span>
                                    {sub}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const StudentHome = () => {
    const { student, setStudent } = useOutletContext();
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : {};
    const hasTransportAccess = user.role === 'Admin' || user.role === 'ManagementCell' || user.schoolCell === 'ManagementCell';

    const [notices, setNotices] = useState([]);
    const [classDetails, setClassDetails] = useState(null);
    const [syllabusList, setSyllabusList] = useState([]);
    const [feeRecord, setFeeRecord] = useState(null);
    const [selectedNotice, setSelectedNotice] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [selectedExam, setSelectedExam] = useState(null);
    const [selectedHw, setSelectedHw] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [hwFilter, setHwFilter] = useState('Pending');
    const [eventFilter, setEventFilter] = useState('month');
    const [eventTypeFilter, setEventTypeFilter] = useState('All');
    const [loadingSyllabus, setLoadingSyllabus] = useState(true);
    const [loadingClass, setLoadingClass] = useState(true);

    // New Data Feeds
    const [upcomingExams, setUpcomingExams] = useState([]);
    const [pendingHomework, setPendingHomework] = useState([]);
    const [events, setEvents] = useState([]);
    const [busNickname, setBusNickname] = useState('');
    const [isEditingNickname, setIsEditingNickname] = useState(false);

    useEffect(() => {
        if (student?.busNickname) setBusNickname(student.busNickname);
    }, [student]);

    const handleUpdateNickname = async () => {
        try {
            await api.put('/management/bus/nickname', { studentId: student._id, nickname: busNickname });
            toast.success("Bus nickname updated!");
            setStudent(prev => ({ ...prev, busNickname }));
            setIsEditingNickname(false);
        } catch (err) {
            console.error("Nickname update error:", err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to update nickname";
            toast.error(errMsg);
        }
    };

    const updateHomeworkStatus = async (homeworkId, newStatus) => {
        try {
            await api.put('/homework/status', { homeworkId, status: newStatus });
            setPendingHomework(prev => prev.map(hw =>
                hw._id === homeworkId ? { ...hw, myStatus: newStatus } : hw
            ));
            if (selectedHw && selectedHw._id === homeworkId) {
                setSelectedHw(prev => ({ ...prev, myStatus: newStatus }));
            }
            toast.success(`Status updated to ${newStatus}`);
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const noticeRes = await api.get('/notice/getall');
                setNotices(noticeRes.data);

                const eventRes = await api.get('/events/getall');
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setEvents(eventRes.data.filter(e => new Date(e.date) >= today));
            } catch (err) {
                console.error("Failed to fetch general feeds", err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchAcademicFeeds = async () => {
            if (!student?.sClass?._id) return;
            try {
                const [examRes, homeworkRes] = await Promise.all([
                    api.get(`/exam/${student.sClass._id}`),
                    api.get(`/homework/${student.sClass._id}`)
                ]);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setUpcomingExams(examRes.data.filter(e => new Date(e.date) >= today));
                setPendingHomework(homeworkRes.data.slice(0, 5));
            } catch (err) {
                console.error("Failed to fetch academic feeds", err);
            }
        };
        fetchAcademicFeeds();
    }, [student]);

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
            <div className="flex text-yellow-400 text-fluid-md">
                {[...Array(5)].map((_, i) => (
                    <span key={i}>{i < Math.round(rating) ? <FaStar /> : <FaRegStar className="text-slate-200" />}</span>
                ))}
            </div>
        );
    };



    const filteredHomework = pendingHomework.filter(hw => {
        const status = hw.myStatus || 'Not Started';
        if (hwFilter === 'Pending') {
            return status === 'Not Started' || status === 'In Progress';
        }
        if (hwFilter === 'Completed') {
            return status === 'Completed';
        }
        return true; // 'All'
    });

    const filteredEvents = [
        ...events.map(e => ({ ...e, itemType: 'Event' })),
        ...upcomingExams.map(e => ({
            ...e,
            itemType: 'Exam',
            title: e.subject,
            type: 'Exam',
            description: `${e.name} • ${e.time || '09:00 AM'} (${e.shift || 'Morning'})`
        }))
    ].filter(item => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(item.date);

        const filterDate = new Date();
        if (eventFilter === 'week') {
            filterDate.setDate(today.getDate() + 7);
        } else {
            filterDate.setMonth(today.getMonth() + 1);
        }
        filterDate.setHours(23, 59, 59, 999);

        // Filter by date range
        const matchesDate = eventDate >= today && eventDate <= filterDate;
        if (!matchesDate) return false;

        // Filter by event type
        if (eventTypeFilter && eventTypeFilter !== 'All') {
            return item.type === eventTypeFilter;
        }

        return true;
    }).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 15);

    if (!student) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-pulse text-slate-400 font-black uppercase tracking-widest text-fluid-xs">Syncing profile...</div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Modal for Notice/Review Details */}
            {(selectedNotice || selectedReview) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 h-full bg-slate-900/60 backdrop-blur-md transition-all duration-300">
                    <div
                        className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden relative border border-white/20 animate-in zoom-in-95 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => { setSelectedNotice(null); setSelectedReview(null); }}
                            className="absolute top-8 right-8 p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors z-20"
                        >
                            <FaTimes />
                        </button>

                        {selectedNotice ? (
                            <div className="p-6 md:p-8 text-left">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-orange-50 px-4 py-1.5 rounded-full text-orange-600 text-[10px] font-black uppercase tracking-widest">Notice Board</div>
                                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{new Date(selectedNotice.date).toLocaleDateString()}</div>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight tracking-tight">{selectedNotice.title}</h2>
                                <div className="prose prose-slate max-w-none min-h-10 max-h-40 overflow-y-auto overflow-hidden scrollbar-hide custom-scrollbar">
                                    <p className="text-slate-600 text-fluid-md leading-relaxed whitespace-pre-wrap italic">"{selectedNotice.details}"</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 md:p-8 text-left">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-indigo-50 px-4 py-1.5 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-widest">Performance Review</div>
                                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{new Date(selectedReview.date).toLocaleDateString()}</div>
                                </div>

                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-3xl font-black shadow-xl">
                                        {selectedReview.reviewer?.name?.charAt(0) || 'F'}
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-slate-900">{selectedReview.reviewer?.name || 'Faculty Member'}</h4>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">{selectedReview.reviewer?.role || 'Faculty'}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-10 rounded-xl mb-6 h-4 overflow-y-auto ocerflow-hidden scrollbar-hide custom-scrollbar relative">
                                    <FaQuoteLeft className="fixed top-118 left-14 md:top-76 md:left-88 z-20 text-indigo-100 text-4xl -translate-x-1/2 -translate-y-1/2" />
                                    <p className=" absolute -top-8 text-slate-700 text-xl leading-relaxed italic relative z-10">"{selectedReview.comment}"</p>
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

            {/* Modal for Exam Details */}
            {selectedExam && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 h-full  bg-slate-900/60 backdrop-blur-md transition-all duration-300" onClick={() => setSelectedExam(null)}>
                    <div
                        className="bg-white w-full max-w-xl rounded-lg shadow-2xl overflow-hidden relative border border-white/20 animate-in zoom-in-95 duration-300 min-h-[35vh] max-h-[85vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedExam(null)}
                            className="absolute top-8 right-8 p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors z-20"
                        >
                            <FaTimes />
                        </button>

                        <div className="p-6 md:p-8 text-left overflow-y-auto scrollbar-hide custom-scrollbar flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-50 px-3 py-1.5 rounded-full text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <FaCalendarCheck /> Exam Details
                                </div>
                                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{selectedExam.examCode}</div>
                            </div>

                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase">{selectedExam.subject}</h2>
                                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1.5">{selectedExam.name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="px-5 py-2 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300">
                                    <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.4">Scheduled Date</span>
                                    <span className="font-black text-slate-800 text-xs">{new Date(selectedExam.date).toLocaleDateString()}</span>
                                </div>
                                <div className="px-5 py-2 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300">
                                    <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Marks</span>
                                    <span className="font-black text-slate-800 text-xs">{selectedExam.maxMarks} Points</span>
                                </div>
                                <div className="px-5 py-2 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300">
                                    <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Reporting Time</span>
                                    <span className="font-black text-slate-800 text-xs">{selectedExam.time || '09:00 AM'}</span>
                                </div>
                                <div className="px-5 py-2 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300">
                                    <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Shift</span>
                                    <span className="font-black text-slate-800 text-xs">{selectedExam.shift}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Syllabus Scope</h4>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100/50">
                                    <SyllabusRenderer syllabus={selectedExam.syllabus} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Homework Details */}
            {selectedHw && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 h-full bg-slate-900/60 backdrop-blur-md transition-all duration-300" onClick={() => setSelectedHw(null)}>
                    <div
                        className="bg-white w-full max-w-xl rounded-lg shadow-2xl overflow-hidden relative border border-white/20 animate-in zoom-in-95 duration-300 min-h-[35vh] max-h-[85vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedHw(null)}
                            className="absolute top-8 right-8 p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors z-20"
                        >
                            <FaTimes />
                        </button>

                        <div className="p-6 md:p-8 text-left overflow-y-auto p scrollbar-hide custom-scrollbar flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-50 px-3 py-1.5 rounded-full text-amber-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <FaPencilRuler /> Home Learning
                                </div>
                                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Due: {new Date(selectedHw.dueDate).toLocaleDateString()}</div>
                            </div>

                            <div>
                                <h2 className="!text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase">{selectedHw.subject}</h2>
                                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-1.5">Assigned Homework Task</p>
                            </div>

                            <div className="bg-slate-50 px-6 rounded-lg border border-slate-100/50 space-y-3">
                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Task Description</span>
                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">"{selectedHw.description || 'No description provided.'}"</p>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black text-sm">
                                        {selectedHw.teacher?.name?.charAt(0) || 'T'}
                                    </div>
                                    <div>
                                        <h5 className="font-black text-slate-800 text-sm leading-none">{selectedHw.teacher?.name || 'Faculty Member'}</h5>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Assigned By</span>
                                    </div>
                                </div>

                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 mt-5 rounded-lg border ${selectedHw.myStatus === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    selectedHw.myStatus === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                        'bg-slate-50 text-slate-600 border-slate-100'
                                    }`}>
                                    Status: {selectedHw.myStatus || 'Not Started'}
                                </span>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Your Progress</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Not Started', 'In Progress', 'Completed'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => updateHomeworkStatus(selectedHw._id, status)}
                                            className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border-2 ${selectedHw.myStatus === status
                                                ? (status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' :
                                                    status === 'In Progress' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100' :
                                                        'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-100')
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Event Details */}
            {selectedEvent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 h-full bg-slate-900/60 backdrop-blur-md transition-all duration-300" onClick={() => setSelectedEvent(null)}>
                    <div
                        className="bg-white w-full max-w-xl rounded-lg shadow-2xl overflow-hidden relative border border-white/20 animate-in zoom-in-95 duration-300 min-h-[35vh] max-h-[85vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="absolute top-8 right-8 p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors z-20"
                        >
                            <FaTimes />
                        </button>

                        <div className="p-6 md:p-8 text-left overflow-y-auto scrollbar-hide custom-scrollbar flex-1 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                                    selectedEvent.type === 'Holiday' ? 'bg-amber-50 text-amber-600' :
                                    selectedEvent.type === 'Meeting' ? 'bg-purple-50 text-purple-600' :
                                    selectedEvent.type === 'Celebration' ? 'bg-pink-50 text-pink-600' :
                                    'bg-blue-50 text-blue-600'
                                }`}>
                                    <FaCalendarAlt /> {selectedEvent.type}
                                </div>
                                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                    {new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            </div>

                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase">{selectedEvent.title}</h2>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/50 min-h-20 max-h-50 overflow-y-auto scrollbar-hide custom-scrollbar">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Description / Details</span>
                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap italic">
                                    "{selectedEvent.description || 'No description provided.'}"
                                </p>
                            </div>

                            {selectedEvent.instructions && (
                                <div className="bg-blue-50/50 p-2 rounded-2xl border border-blue-100/50">
                                    <span className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Special Instructions</span>
                                    <p className="text-slate-700 text-sm leading-relaxed">
                                        {selectedEvent.instructions}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Route Details */}
            {showRouteModal && student.bus && (
                <div className="fixed inset-0 z-[100] h-full flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300" onClick={() => setShowRouteModal(false)}>
                    <div
                        className="bg-white w-full max-w-lg rounded-lg shadow-2xl overflow-hidden scrollbar-hide custom-scrollbar relative border border-white/20 animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowRouteModal(false)}
                            className="absolute top-6 right-6 p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors z-20"
                        >
                            <FaTimes />
                        </button>

                        <div className="p-6 md:p-8 text-left overflow-y-auto scrollbar-hide custom-scrollbar flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-50 px-3 py-1.5 rounded-md border-x-2 text-amber-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <FaMapMarkerAlt /> Route Timeline
                                </div>
                                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Route {student.bus.route}</div>
                            </div>

                            <div>
                                <h2 className="!text-xl font-black text-slate-900 tracking-tight leading-tight uppercase">Bus Route Stops</h2>
                                <p className="text-fluid-xs font-bold text-amber-600 uppercase tracking-widest mt-1.5">Vehicle: #{student.bus.busNumber}</p>
                            </div>

                            <div className="relative pl-12 space-y-8 h-64 overflow-y-auto overflow-x-hidden scrollbar-hide custom-scrollbar">
                                {/* Connector Line */}
                                <div className="fixed left-[55px] top-96 bottom-61 w-0.5 bg-slate-400"></div>

                                {student.bus.stops && student.bus.stops.length > 0 ? (
                                    student.bus.stops.map((stop, index) => {
                                        const isMyStop = student.busStop && student.busStop.toLowerCase() === stop.stopName.toLowerCase();
                                        return (
                                            <div key={index} className="relative flex items-start justify-between group">
                                                {/* Stop Indicator Bullet */}
                                                <div className={`absolute left-[-48px] w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all ${isMyStop
                                                        ? 'bg-amber-500 border-amber-100 scale-125 shadow-lg shadow-amber-200 animate-pulse'
                                                        : 'bg-white border-slate-200 group-hover:border-amber-300'
                                                    }`}>
                                                    <div className={`w-2 h-2 rounded-full ${isMyStop ? 'bg-white' : 'bg-slate-300 group-hover:bg-amber-400'}`}></div>
                                                </div>

                                                <div className="flex-1 pl-4">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className={`font-black text-sm uppercase tracking-wide ${isMyStop ? 'text-amber-600' : 'text-slate-800'}`}>
                                                            {stop.stopName}
                                                        </h4>
                                                        {isMyStop && (
                                                            <span className="text-[8px] font-black text-white bg-amber-500 px-2 py-0.5 rounded uppercase tracking-wider animate-bounce">
                                                                Your Stop
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Stop #{index + 1}</p>
                                                </div>

                                                <div className="text-right">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider ${isMyStop ? 'text-amber-600 bg-amber-50 px-3 py-1 rounded-xl' : 'text-slate-500'}`}>
                                                        ₹{stop.fee} / mon
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-slate-400 italic text-sm">No stops configured for this route.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Defaulter Notification */}
            {feeRecord?.isDefaulter && (
                <div className="bg-red-50 p-8 rounded-xl shadow-lg shadow-red-100 flex items-center gap-6 animate-pulse">
                    <div className="bg-red-500 p-4 rounded-xl text-white">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h3 className="text-fluid-xl font-black text-red-900 tracking-tight uppercase">Payment Required</h3>
                        <p className="text-red-700 font-bold mt-1 leading-relaxed text-fluid-sm">Please clear your outstanding dues at the Admission Cell to avoid restrictions.</p>
                    </div>
                </div>
            )}

            {/* Welcome Banner */}
            <div className="bg-slate-900 rounded-[28px_8px] p-6 md:p-[26px_36px] text-white border-t-2 shadow-soft-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full -mr-40 -mt-40 blur-3xl group-hover:bg-teal-500/20 transition-colors duration-700"></div>
                <div className="relative z-10 text-left">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-teal-500/20 px-4 py-1.5 rounded-full text-teal-400 text-[12px] md:text-sm font-bold uppercase tracking-widest">Student Portal</div>
                        <div className="h-px w-12 bg-slate-300"></div>
                        <div className="text-slate-100 text-[8px] md:text-sm font-bold uppercase tracking-widest">Term 1 • 2026</div>
                    </div>
                    <h1 className="font-black text-fluid-2xl tracking-tighter leading-tight">Welcome, {student.name.split(' ')[0]}!</h1>

                    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 max-w-3xl">
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors">
                            <span className="block text-fluid-xs uppercase text-slate-500 font-black tracking-widest mb-1">Grade Level</span>
                            <span className="font-black text-fluid-2xl text-teal-400">{student.sClass?.grade}-{student.sClass?.section}</span>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors">
                            <span className="block text-fluid-xs uppercase text-slate-500 font-black tracking-widest mb-1">Roll Number</span>
                            <span className="font-black text-fluid-2xl font-mono text-indigo-400">#{student.rollNum}</span>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors col-span-2 md:col-span-1">
                            <span className="block text-fluid-xs uppercase text-slate-500 font-black tracking-widest mb-1">Avg Performance</span>
                            <div className="flex items-center gap-3">
                                <span className="font-black text-fluid-2xl text-yellow-400">{student.averageRating || 0}</span>
                                <FaStar className="text-yellow-400 text-fluid-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Upcoming Assessments */}
                    <div className="bg-white rounded-xl border-t-2 shadow-soft px-8 pt-4 pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-fluid-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <div className="bg-red-50 p-2 rounded-xl text-red-600">
                                    <FaCalendarCheck />
                                </div>
                                Upcoming Assessments
                            </h2>
                            <div className="text-xs font-bold uppercase text-slate-400 tracking-widest">Next 7 Days</div>
                        </div>

                        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
                            {upcomingExams.length > 0 ? upcomingExams.slice(0, 5).map((exam, idx) => {
                                const examDateObj = new Date(exam.date);
                                examDateObj.setHours(0, 0, 0, 0);
                                const todayObj = new Date();
                                todayObj.setHours(0, 0, 0, 0);
                                const diffTime = examDateObj.getTime() - todayObj.getTime();
                                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                return (
                                    <div key={idx} onClick={() => setSelectedExam(exam)} className="min-w-[280px] max-w-[320px] flex-shrink-0 p-4 rounded-3xl bg-red-50/50 hover:bg-white hover:shadow-lg transition-all group snap-start border border-red-100/50 cursor-pointer">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="text-left">
                                                <h4 className="font-black text-slate-900 leading-tight text-fluid-base">{exam.subject}</h4>
                                                <p className="text-xs text-red-600 uppercase font-black tracking-widest mt-1.5">{exam.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max</div>
                                                <div className="text-lg font-black text-slate-900">{exam.maxMarks}</div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                <Calendar size={14} className="text-red-400" />
                                                {new Date(exam.date).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                                <span className="ml-1 text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded uppercase tracking-wider">
                                                    {
                                                        daysLeft === 1
                                                            ? "Tomorrow"
                                                            : daysLeft === 0
                                                                ? "Today"
                                                                : daysLeft > 1
                                                                    ? `${daysLeft} days left`
                                                                    : ""
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                <Clock size={14} className="text-red-400" />
                                                {exam.time} ({exam.shift})
                                                <ExamCountdown examDate={exam.date} examTime={exam.time} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="w-full text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                                    <p className="text-slate-400 font-bold">No exams scheduled currently.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Home Learning (Homework) */}
                    <div className="bg-white rounded-xl border-t-2 shadow-soft px-10 pt-4 pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-fluid-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <div className="bg-amber-50 p-2 rounded-xl text-amber-600">
                                    <FaPencilRuler />
                                </div>
                                Home Learning
                            </h2>
                            <select
                                value={hwFilter}
                                onChange={(e) => setHwFilter(e.target.value)}
                                className="px-3 py-1.5 bg-amber-50 text-amber-600 border-none rounded-xl text-xs font-bold uppercase tracking-wider outline-none cursor-pointer"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Completed">Completed</option>
                                <option value="All">All Tasks</option>
                            </select>
                        </div>

                        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2">
                            {filteredHomework.length > 0 ? filteredHomework.map((hw, idx) => (
                                <div key={idx} onClick={() => setSelectedHw(hw)} className="min-w-[280px] max-w-[320px] h-52 flex-shrink-0 px-6 pt-4 pb-0 rounded-lg bg-amber-50/50 hover:bg-white hover:shadow-lg transition-all group snap-start border border-amber-100/50 cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-left">
                                            <h4 className="font-black text-slate-900 leading-tight text-fluid-base">{hw.subject}</h4>
                                            <p className="text-[10px] text-amber-600 uppercase font-black tracking-widest mt-1">Due: {new Date(hw.dueDate).toLocaleDateString()}</p>
                                        </div>
                                        <p className="text-[10px] text-amber-600 uppercase font-black tracking-widest mt-1">{hw.myStatus}</p>

                                    </div>
                                    <div className='overflow-y-auto max-h-26 min-h-12 scrollbar-hide custom-scrollbar '>
                                        <p className="text-[12px] bg-amber-50/50 font-bold text-slate-900 line-clamp-3 capitalize sticky top-0 group-hover:bg-white">{hw.title}</p>
                                        <p className="text-[10px] font-semibold text-slate-600 line-clamp-3 mb-4 italic">"{hw.description}"</p>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2 border-t border-amber-100/50">
                                        <div className="w-6 h-6 rounded-sm bg-white flex items-center justify-center text-[10px] font-black text-amber-600 shadow-sm">
                                            {hw.teacher?.name?.charAt(0) || 'T'}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{hw.teacher?.name}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="w-full text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                                    <p className="text-slate-400 font-bold">
                                        {hwFilter === 'Pending' ? 'Excellent! No pending assignments.' :
                                            hwFilter === 'Completed' ? 'No completed assignments yet.' :
                                                'No assignments scheduled currently.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Syllabus Tracking Section */}
                    <div className="bg-white rounded-xl border-t-2 shadow-soft px-10 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-fluid-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                                    <FaBook />
                                </div>
                                Syllabus Tracking
                            </h2>
                            <div className="text-xs font-bold uppercase text-slate-400 tracking-widest">Real-time Progress</div>
                        </div>

                        {loadingSyllabus ? (
                            <div className="text-center py-12 text-slate-400 font-bold italic">Syncing curriculum...</div>
                        ) : (
                            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
                                {syllabusList.length > 0 ? syllabusList.map((syllabus, idx) => {
                                    const { percentage, lastCompleted } = getSyllabusStats(syllabus);
                                    return (
                                        <div key={idx} className="min-w-[280px] max-w-[320px] flex-shrink-0 px-6 py-4 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-lg transition-all group snap-start">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="text-left">
                                                    <h4 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight text-fluid-base">{syllabus.subject}</h4>
                                                    <p className="text-xs max-w-52 text-slate-700 uppercase font-bold tracking-widest mt-1.5">{syllabus.teacher?.name}</p>
                                                </div>
                                                <div
                                                    className="w-12 h-12 text-xs font-black rounded-full flex items-center justify-center"
                                                    style={{
                                                        background: `conic-gradient(${percentage === 100 ? "#10b981" : "#f1dc63"
                                                            } ${percentage * 3.6}deg, #e5e7eb 0deg)`,
                                                    }}
                                                >
                                                    <div className="w-9 h-9 rounded-full bg-transparent flex items-center justify-center text-xs font-black">
                                                        {percentage}%
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 bg-white/50 rounded-2xl">
                                                <div className="text-xs font-black uppercase text-slate-400 tracking-widest shrink-0">Recent</div>
                                                {lastCompleted ? (
                                                    <span className="text-xs text-slate-600 font-bold truncate">
                                                        Ch {lastCompleted.chapterNo}: {lastCompleted.title}
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

                    {/* Bus Details Section */}
                    {student.bus && (
                        <div className="bg-white rounded-xl border-t-2 shadow-soft px-10 py-4 overflow-hidden relative group">
                            <div className="absolute -right-10 -bottom-10 text-amber-50 group-hover:text-amber-100 transition-colors pointer-events-none">
                                <FaBus size={200} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-fluid-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 text-left">
                                        <div className="bg-amber-50 p-2 rounded-xl text-amber-600">
                                            <FaBus />
                                        </div>
                                        Transport Details
                                    </h2>
                                    {hasTransportAccess && (
                                        <div className="flex items-center gap-2">
                                            {isEditingNickname ? (
                                                <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                                                    <input
                                                        type="text"
                                                        value={busNickname}
                                                        onChange={(e) => setBusNickname(e.target.value)}
                                                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:outline-none focus:ring-2 focus:ring-amber-500 w-40"
                                                        placeholder="Enter nickname..."
                                                    />
                                                    <button onClick={handleUpdateNickname} className="p-2 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition shadow-lg shadow-amber-100"><Save size={16} /></button>
                                                    <button onClick={() => setIsEditingNickname(false)} className="p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition"><FaTimes size={16} /></button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setIsEditingNickname(true)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition"
                                                >
                                                    <Edit2 size={12} /> {busNickname || "Set Nickname"}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-5 px-6 py-2 bg-slate-50 rounded-lg border border-transparent hover:border-amber-100 hover:bg-white transition-all">
                                            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-amber-600 shadow-sm text-xl font-black">
                                                <FaBus />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Vehicle ID</span>
                                                <h4 className="font-black text-amber-600 text-fluid-lg uppercase">#{student.bus.busNumber}</h4>
                                            </div>
                                        </div>

                                        <div onClick={() => setShowRouteModal(true)} className="flex items-center gap-5 px-6 py-2 bg-slate-50 rounded-lg border border-transparent hover:border-amber-100 hover:bg-white transition-all cursor-pointer">
                                            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-amber-600 shadow-sm text-xl font-black">
                                                <FaMapMarkerAlt />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Assigned Route</span>
                                                <h4 className="font-black text-slate-900 text-fluid-lg uppercase">{student.bus.route}</h4>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-start gap-5 px-6 py-4 bg-slate-50 rounded-lg border border-transparent hover:border-amber-100 hover:bg-white transition-all h-full">
                                            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-amber-600 shadow-sm text-xl font-black">
                                                <FaUserTie />
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Route Operator</span>
                                                <h4 className="font-black text-slate-900 text-fluid-lg">{student.bus.driver?.name || "Assigning Operator..."}</h4>
                                                <p className="text-[14px] font-bold text-slate-400 mt-1">EMERGENCY:</p>
                                                {student.bus.driver?.phone && (
                                                    <p className="text-[12px] font-bold text-slate-400 mt-1">{student.bus.driver.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* My Faculty */}
                    <div className="bg-white rounded-xl border-t-2 shadow-soft px-10 py-4">
                        <h2 className="text-fluid-2xl font-black text-slate-900 tracking-tight mb-3 flex items-center gap-3">
                            <div className="bg-teal-50 p-2 rounded-xl text-teal-600">
                                <FaChalkboardTeacher />
                            </div>
                            My Faculty
                        </h2>

                        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
                            {/* Class Teacher */}
                            <div className="min-w-[320px] px-4 py-4 rounded-lg bg-teal-50 flex items-start gap-3 border-none group snap-start">
                                <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-white flex items-center justify-center text-teal-600 font-black shadow-sm text-xl">
                                    {classDetails?.classTeacher?.name ? classDetails.classTeacher.name.charAt(0) : 'T'}
                                </div>
                                <div className="text-left w-74">
                                    <span className="text-fluid-xs font-black text-teal-600 uppercase tracking-widest block mb-1">Class Teacher</span>
                                    <h4 className="font-black text-slate-900 truncate max-w-[240px] text-fluid-base">
                                        {classDetails?.classTeacher?.name || "Unassigned"}
                                    </h4>
                                    <p className="text-[10px] text-teal-700/60 truncate max-w-[240px]">{classDetails?.classTeacher?.email}</p>
                                </div>
                            </div>

                            {/* Subject Teachers */}
                            {classDetails?.subjects?.map((sub, idx) => (
                                <div key={idx} className="min-w-[320px] p-6 rounded-lg bg-slate-50 hover:bg-white hover:shadow-md transition-all flex items-center gap-5 group snap-start">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-indigo-500 shadow-sm text-xl">
                                        <FaBook />
                                    </div>
                                    <div className="text-left w-74">
                                        <span className="text-fluid-xs font-black text-slate-400 uppercase tracking-widest block mb-1">{sub.subName}</span>
                                        <h4 className="font-black text-slate-900 truncate max-w-[240px] text-fluid-base">
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
                    <div className="bg-white rounded-lg border-t-2 border-yellow-500 shadow-soft px-8 py-6 h-1.4/3 flex flex-col">
                        <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight flex items-center gap-3">
                            <div className="bg-yellow-50 p-2 rounded-xl text-yellow-500">
                                <FaStar />
                            </div>
                            Performance
                        </h3>

                        <div className="space-y-4 flex-1 flex flex-col">
                            {/* Summary Card */}
                            <div className="text-center px-8 py-6 bg-slate-900 rounded-[2rem] text-white shadow-lg relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="text-4xl font-black mb-1 tracking-tighter">{student.averageRating || 0}</div>
                                    <div className="flex justify-center mb-2">{renderStars(student.averageRating || 0)}</div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Global Rating</p>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>

                            {/* Review Row - Scrollable */}
                            <div className="w-full overflow-hidden">
                                <h3 className="text-md font-black uppercase text-slate-400 tracking-widest mb-2">Recent Feedback</h3>
                                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
                                    {student.reviews && student.reviews.length > 0 ? (
                                        [...student.reviews].reverse().map((review, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setSelectedReview(review)}
                                                className="min-w-[175px] flex-shrink-0 snap-start px-3 py-2 rounded-lg bg-slate-50 hover:bg-white hover:shadow-md transition-all relative border-l-3 border-indigo-500 group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4 justify-start mb-2">
                                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{new Date(review.date).toLocaleDateString()}</span>
                                                    {renderStars(review.rating)}
                                                </div>
                                                <p className="max-h-16 min-h-6 max-w-[170px] text-sm overflow-y-auto scrollbar-hide custom-scrollbar text-slate-600 leading-relaxed font-medium mb-2 italic line-clamp-3">"{review.comment}"</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm">
                                                        {review.reviewer?.name?.charAt(0) || 'T'}
                                                    </div>
                                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{review.reviewer?.name.slice(0, 18) || 'Faculty'}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="w-full text-center py-10 bg-slate-50 rounded-3xl">
                                            <p className="text-slate-400 font-bold text-sm">No reviews yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bulletins Section */}
                    <div className="bg-white rounded-lg border-t-2 border-green-500 shadow-soft px-8 py-4 overflow-hidden">
                        <h2 className="text-fluid-2xl font-black text-slate-900 mb-4 flex items-center gap-3 tracking-tight">
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
                                    className="w-[200px] flex-shrink-0 snap-start group cursor-pointer p-6 bg-slate-50 rounded-3xl hover:bg-white hover:shadow-md transition-all border-t-4 border-orange-500/20 hover:border-orange-500 transition-colors"
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-fluid-xs font-black text-slate-400 uppercase tracking-widest">{new Date(notice.date).toLocaleDateString()}</span>
                                        <div className="w-2 h-2 rounded-full bg-orange-200 group-hover:bg-orange-500 transition-colors"></div>
                                    </div>
                                    <h4 className="font-black text-slate-800 text-fluid-md group-hover:text-orange-600 transition-colors leading-tight mb-3 line-clamp-1">{notice.title}</h4>
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

                    {/* Events & Activities Section */}
                    <div className="bg-white rounded-lg border-t-2 border-green-500 shadow-soft px-7 py-6 overflow-hidden flex flex-col">
                        <div className="flex flex-col gap-3 mb-2">
                            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                                <div className="bg-blue-50 p-2 rounded-xl text-blue-500">
                                    <FaCalendarAlt />
                                </div>
                                Events & Activities
                            </h4>
                            <div className="flex items-center gap-2">
                                <select
                                    value={eventTypeFilter}
                                    onChange={(e) => setEventTypeFilter(e.target.value)}
                                    className="flex-1 px-1 py-1.5 bg-blue-50 text-blue-600 border-none rounded-md text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer"
                                >
                                    <option value="All">All Types</option>
                                    <option value="Event">Event</option>
                                    <option value="Holiday">Holiday</option>
                                    <option value="Exam">Exam Info</option>
                                    <option value="Meeting">Meeting</option>
                                    <option value="Celebration">Celebration</option>
                                </select>
                                <select
                                    value={eventFilter}
                                    onChange={(e) => setEventFilter(e.target.value)}
                                    className="flex-1 px-1 py-1.5 bg-blue-50 text-blue-600 border-none rounded-md text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer"
                                >
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[475px] overflow-y-auto pr-1 scrollbar-hide custom-scrollbar pb-2">
                            {filteredEvents.length > 0 ? filteredEvents.map((event, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        if (event.itemType === 'Exam') {
                                            setSelectedExam(event);
                                        } else {
                                            setSelectedEvent(event);
                                        }
                                    }}
                                    className={`w-full p-4 rounded-2xl border transition-all hover:shadow-md cursor-pointer ${event.type === 'Exam'
                                            ? 'bg-red-50/50 border-red-100/50 hover:bg-red-50'
                                            : 'bg-blue-50/50 border-blue-100/50 hover:bg-blue-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <span className={`text-fluid-xs font-black uppercase tracking-widest ${event.type === 'Exam' ? 'text-red-600' : 'text-blue-600'
                                            }`}>{new Date(event.date).toLocaleDateString()}</span>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${event.type === 'Exam'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-blue-100 text-blue-700'
                                            }`}>{event.type === 'Exam' ? 'Exam Info' : event.type}</span>
                                    </div>
                                    <h4 className="font-black text-slate-800 text-fluid-base leading-tight mb-1">{event.title}</h4>
                                    <p className="text-xs font-bold text-gray-500 line-clamp-2 italic">"{event.description}"</p>
                                </div>
                            )) : (
                                <div className="w-full text-center py-10 bg-slate-50 rounded-3xl">
                                    <p className="text-slate-400 font-bold italic">No events on the horizon.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StudentHome;