import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { 
    FaBook, FaChalkboardTeacher, FaChevronDown, FaChevronUp, 
    FaCheckCircle, FaRegCircle, FaExternalLinkAlt, FaSpinner,
    FaCalendarAlt, FaInfoCircle, FaPlayCircle, FaFilePdf
} from 'react-icons/fa';

const SyllabusTracking = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [syllabusList, setSyllabusList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [expandedSyllabus, setExpandedSyllabus] = useState(null);

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const isStudent = user.role === 'Student';
  const isTeacher = user.role === 'Teacher' || user.role.endsWith('Cell');

  useEffect(() => {
    if (isStudent) {
        const classId = localStorage.getItem('classId');
        if (classId) {
            setSelectedClass(classId);
            fetchSyllabus(classId);
        }
    } else {
        fetchInitialData();
    }
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [classesRes, profileRes] = await Promise.all([
          api.get('/class/getall'),
          api.get('/teacher/profile')
      ]);
      
      const allClasses = classesRes.data;
      const profile = profileRes.data;
      setTeacherProfile(profile);

      if (isTeacher) {
          // Tighten Filter: Only show classes where this teacher teaches a SUBJECT
          const myClasses = allClasses.filter(c => {
              const isSubjectTeacher = c.subjects?.some(s => 
                  (s.teacher?._id || s.teacher) === profile._id
              );
              return isSubjectTeacher;
          });
          setClasses(myClasses);
      } else {
          setClasses(allClasses);
      }
    } catch (err) { 
      toast.error("Failed to load environment data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSyllabus = async (classId) => {
      if (!classId) return;
      setLoading(true);
      try {
          const res = await api.get(`/syllabus/class/${classId}`);
          setSyllabusList(res.data);
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  const handleTopicToggle = async (syllabusId, chapterNo, topicIndex, currentStatus) => {
    if (!isTeacher) return;
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    
    try {
      await api.put(`/syllabus/update-topic/${syllabusId}/${chapterNo}`, {
        topicIndex,
        status: newStatus
      });
      fetchSyllabus(selectedClass);
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const handleChapterStatusUpdate = async (syllabusId, chapterNo, currentStatus) => {
    if (!isTeacher) return;
    const statusOrder = ['Not Started', 'In Progress', 'Completed'];
    const nextStatus = statusOrder[(statusOrder.indexOf(currentStatus) + 1) % statusOrder.length];

    try {
        await api.put(`/syllabus/update-chapter/${syllabusId}`, {
            chapterNo,
            status: nextStatus
        });
        toast.success(`Chapter marked as ${nextStatus}`);
        fetchSyllabus(selectedClass);
    } catch (err) {
        toast.error("Update failed");
    }
  }

  const getStatusStyle = (status) => {
    switch(status) {
        case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
        case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
        default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-4xl font-black text-gray-900 flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                <FaBook />
            </div>
            {isStudent ? "Learning Roadmap" : "Syllabus Mastery"}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Track your academic journey and curriculum progress.</p>
        </div>

        {!isStudent && (
          <div className="w-full md:w-72">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Active Class</label>
            <select 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700"
                value={selectedClass}
                onChange={(e) => { setSelectedClass(e.target.value); fetchSyllabus(e.target.value); }}
            >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.grade} - {c.section}</option>)}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FaSpinner className="animate-spin text-4xl mb-4 text-indigo-600" />
            <p className="font-bold">Syncing curriculum data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
            {syllabusList
              .filter(s => {
                  if (!isTeacher) return true;
                  const sTeacherId = s.teacher?._id || s.teacher;
                  return sTeacherId === teacherProfile?._id;
              })
              .map((syllabus) => {
                const isMySubject = !isStudent && teacherProfile && 
                    (syllabus.teacher?._id === teacherProfile._id || syllabus.teacher === teacherProfile._id);

                return (
                <div key={syllabus._id} className={`bg-white rounded-3xl overflow-hidden border transition-all duration-300 ${isMySubject ? 'border-indigo-200 ring-4 ring-indigo-50' : 'border-gray-100 shadow-sm'}`}>
                    {/* Syllabus Header */}
                    <div 
                        className={`p-8 bg-gradient-to-r from-white to-gray-50/50 cursor-pointer hover:bg-gray-50/80 transition-all ${expandedSyllabus === syllabus._id ? 'border-b border-gray-50' : ''}`}
                        onClick={() => setExpandedSyllabus(expandedSyllabus === syllabus._id ? null : syllabus._id)}
                    >
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-black text-gray-800">{syllabus.subject}</h2>
                                    {isMySubject && <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-full">Primary Faculty</span>}
                                    <div className="text-gray-400">
                                        {expandedSyllabus === syllabus._id ? <FaChevronUp /> : <FaChevronDown />}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm font-bold text-gray-500">
                                    <span className="flex items-center gap-2"><FaChalkboardTeacher className="text-indigo-500"/> {syllabus.teacher?.name}</span>
                                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                    <span>{syllabus.academicYear}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-black text-indigo-600">{syllabus.totalProgress}%</div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Syllabus Covered</div>
                            </div>
                        </div>
                        {/* Global Progress Bar */}
                        <div className="mt-6 w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div 
                                className="bg-indigo-600 h-full rounded-full transition-all duration-1000 shadow-sm"
                                style={{ width: `${syllabus.totalProgress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Chapters List (Detailed View) */}
                    {expandedSyllabus === syllabus._id && (
                    <div className="p-4 md:p-8 space-y-4 bg-gray-50/20 border-t border-gray-50">
                        {syllabus.chapters?.sort((a,b) => a.chapterNo - b.chapterNo).map((chapter) => (
                            <div key={chapter._id} className="group">
                                <div className={`flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl border transition-all ${expandedChapter === chapter._id ? 'bg-indigo-50/30 border-indigo-100 shadow-sm' : 'hover:bg-gray-50 border-gray-50'}`}>
                                    <div className="flex items-center gap-6 flex-1 cursor-pointer" onClick={() => setExpandedChapter(expandedChapter === chapter._id ? null : chapter._id)}>
                                        <div className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 font-black group-hover:text-indigo-600 transition">
                                            {chapter.chapterNo}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-800 group-hover:text-indigo-600 transition">{chapter.title}</h3>
                                            <div className="flex items-center gap-3 text-xs font-bold text-gray-400 mt-1">
                                                <span className="flex items-center gap-1"><FaCalendarAlt /> Target: {chapter.plannedDate ? new Date(chapter.plannedDate).toLocaleDateString() : 'TBD'}</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span>{chapter.topics?.length || 0} Topics</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto">
                                        <button 
                                            disabled={!isMySubject}
                                            onClick={() => handleChapterStatusUpdate(syllabus._id, chapter.chapterNo, chapter.status)}
                                            className={`flex-1 md:flex-none px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusStyle(chapter.status)} ${isMySubject ? 'hover:scale-105 active:scale-95' : 'opacity-80'}`}
                                        >
                                            {chapter.status}
                                        </button>
                                        <button 
                                            onClick={() => setExpandedChapter(expandedChapter === chapter._id ? null : chapter._id)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 transition"
                                        >
                                            {expandedChapter === chapter._id ? <FaChevronUp /> : <FaChevronDown />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Topics & Resources */}
                                {expandedChapter === chapter._id && (
                                    <div className="mt-4 ml-6 md:ml-20 p-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 space-y-6">
                                        {/* Topics */}
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Detailed Topics</h4>
                                            {chapter.topics?.map((topic, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            disabled={!isMySubject}
                                                            onClick={() => handleTopicToggle(syllabus._id, chapter.chapterNo, idx, topic.status)}
                                                            className={`text-xl transition ${topic.status === 'Completed' ? 'text-green-500' : 'text-gray-200 hover:text-indigo-400'}`}
                                                        >
                                                            {topic.status === 'Completed' ? <FaCheckCircle /> : <FaRegCircle />}
                                                        </button>
                                                        <span className={`text-sm font-bold ${topic.status === 'Completed' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                            {topic.title}
                                                        </span>
                                                    </div>
                                                    {topic.completionDate && (
                                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                                                            Done {new Date(topic.completionDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Resources */}
                                        {chapter.resources?.length > 0 && (
                                            <div className="pt-6 border-t border-gray-200">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Learning Resources</h4>
                                                <div className="flex flex-wrap gap-3">
                                                    {chapter.resources.map((res, rid) => (
                                                        <a 
                                                            key={rid} 
                                                            href={res.url} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition group"
                                                        >
                                                            {res.type === 'Video' ? <FaPlayCircle /> : res.type === 'PDF' ? <FaFilePdf /> : <FaExternalLinkAlt />}
                                                            {res.title}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    )}
                </div>
            )})}

            {selectedClass && syllabusList.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaInfoCircle className="text-gray-300 text-3xl" />
                    </div>
                    <h3 className="text-xl font-black text-gray-800">No Syllabus records found</h3>
                    <p className="text-gray-500 mt-2">If you are the subject teacher, please contact the administration to initialize your curriculum.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default SyllabusTracking;
