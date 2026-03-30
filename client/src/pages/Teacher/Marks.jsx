import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaChalkboardTeacher, FaUserGraduate, FaBook, FaMarker, FaCalendarAlt, FaPlus, FaCheckCircle, FaExclamationCircle, FaSearch, FaChevronDown, FaChevronRight, FaEye, FaTimes, FaClipboardList } from 'react-icons/fa';

const Marks = () => {
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [activeTab, setActiveTab] = useState('main'); // 'main' or 'classTest'
  
  // Selection States
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [subject, setSubject] = useState(''); // Used for entering marks
  const [expandedSubjects, setExpandedSubjects] = useState({}); // { subjectName: boolean }
  
  // Teacher Context
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  // Data States
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({}); // { studentId: score }
  
  // Create Exam Form State
  const [newExamName, setNewExamName] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newExamTime, setNewExamTime] = useState('09:00 AM');
  const [newExamSubject, setNewExamSubject] = useState('');
  const [newExamMaxMarks, setNewExamMaxMarks] = useState('');
  const [newExamSyllabus, setNewExamSyllabus] = useState('');
  const [availableSyllabusItems, setAvailableSyllabusItems] = useState([]); // [{ chapterNo, title, topics: [] }]
  const [selectedSyllabusItems, setSelectedSyllabusItems] = useState([]); // List of selected chapter/topic strings
  const [showSyllabusPicker, setShowSyllabusPicker] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/class/getall');
        setClasses(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    if (user.email) fetchClasses();
  }, [user.email]);

  // Handle Class Change -> Fetch Exams & Teacher Context
  useEffect(() => {
    if (selectedClass) {
      const fetchClassData = async () => {
        try {
          // 1. Fetch Exams
          const examRes = await api.get(`/exam/${selectedClass}`);
          setExams(examRes.data);

          // 2. Fetch Class Details for Teacher Context (Subjects/Role)
          const classRes = await api.get(`/class/details/${selectedClass}`);
          const cls = classRes.data;
          
          // Check if Class Teacher
          const isCT = cls.classTeacher?.email?.toLowerCase() === user.email?.toLowerCase();
          setIsClassTeacher(isCT);

          // Find Subjects taught by this teacher
          const mySubs = cls.subjects?.filter(sub => sub.teacher?.email?.toLowerCase() === user.email?.toLowerCase()).map(s => s.subName) || [];
          setTeacherSubjects(mySubs);

          // Reset selected exam when class changes
          setSelectedExam('');
          setStudents([]);

          // Auto-select subject if only one
          if (mySubs.length === 1) {
             setNewExamSubject(mySubs[0]);
             setSubject(mySubs[0]);
          } else if (mySubs.length > 0) {
             setNewExamSubject(mySubs[0]);
             setSubject(mySubs[0]);
          }

        } catch (e) { console.error(e); }
      };
      fetchClassData();
    } else {
        setExams([]);
        setTeacherSubjects([]);
        setIsClassTeacher(false);
        setSelectedExam('');
        setStudents([]);
    }
  }, [selectedClass, user.email]);

  useEffect(() => {
    const fetchSyllabusItems = async () => {
        if (!selectedClass || !newExamSubject) return;
        try {
            const res = await api.get(`/syllabus/class/${selectedClass}`);
            // Find the syllabus for THIS subject
            const subjectSyllabus = res.data.find(s => s.subject === newExamSubject);
            if (subjectSyllabus) {
                setAvailableSyllabusItems(subjectSyllabus.chapters || []);
            } else {
                setAvailableSyllabusItems([]);
            }
        } catch (error) {
            console.error("Error fetching syllabus items:", error);
            setAvailableSyllabusItems([]);
        }
    };
    fetchSyllabusItems();
  }, [selectedClass, newExamSubject]);

  const toggleSyllabusItem = (item, children = [], parent = null) => {
      setSelectedSyllabusItems(prev => {
          const isSelected = prev.includes(item);
          let newSelection;
          
          if (isSelected) {
              const itemsToRemove = [item, ...children];
              newSelection = prev.filter(i => !itemsToRemove.includes(i));
          } else {
              const itemsToAdd = [item, ...children];
              if (parent && !prev.includes(parent)) {
                  itemsToAdd.push(parent);
              }
              newSelection = [...new Set([...prev, ...itemsToAdd])];
          }
          
          const sortedDisplay = [];
          const sortedInternal = [];
          
          availableSyllabusItems.forEach(ch => {
              const chText = `Chapter ${ch.chapterNo}: ${ch.title}`;
              const chTopicItems = ch.topics?.map(t => ({
                  internal: `C${ch.chapterNo}-T: ${t.title}`,
                  display: `  • ${t.title}`
              })) || [];
              
              const isChInSelection = newSelection.includes(chText);
              const selectedTopicInternals = chTopicItems.filter(t => newSelection.includes(t.internal));
              
              // A chapter is included if it's explicitly in selection OR if any of its topics are selected
              if (isChInSelection || selectedTopicInternals.length > 0) {
                  sortedDisplay.push(chText);
                  sortedInternal.push(chText);
                  
                  chTopicItems.forEach(t => {
                      if (newSelection.includes(t.internal)) {
                          sortedDisplay.push(t.display);
                          sortedInternal.push(t.internal);
                      }
                  });
              }
          });

          setNewExamSyllabus(sortedDisplay.join("\n"));
          return sortedInternal;
      });
  };

  const isItemSelected = (item) => selectedSyllabusItems.includes(item);

  // Handle Create Exam
  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!selectedClass) return toast.error("Select a class first");
    if (!newExamSubject || !newExamMaxMarks || !newExamSyllabus) return toast.error("Subject, Max Marks, and Syllabus are required");
    
    setCreateLoading(true);
    try {
      await api.post('/exam/create', {
        name: newExamName,
        date: newExamDate,
        time: newExamTime,
        sClass: selectedClass,
        subject: newExamSubject,
        maxMarks: newExamMaxMarks,
        syllabus: newExamSyllabus,
        type: "Class Test"
      });
      toast.success("Class Test Scheduled!");
      setNewExamName('');
      setNewExamDate('');
      setNewExamTime('09:00 AM');
      setNewExamMaxMarks('');
      setNewExamSyllabus('');
      setSelectedSyllabusItems([]);
      // Refresh exams list
      const res = await api.get(`/exam/${selectedClass}`);
      setExams(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to schedule class test");
    } finally {
      setCreateLoading(false);
    }
  };

  // Fetch Students & Existing Marks
  const handleFetchData = async () => {
    if (!selectedClass || !selectedExam || !subject) return toast.error("Please select all fields");
    
    // Find selected exam object to check date
    const currentExam = exams.find(e => e._id === selectedExam);
    if (currentExam && new Date(currentExam.date) > new Date()) {
        return toast.error("Marks can only be entered after the examination date.");
    }

    try {
      // 1. Get Students for this class
      const studentRes = await api.get(`/student/class/${selectedClass}`);
      setStudents(studentRes.data);

      // 2. Get Existing Marks for this Exam
      const marksRes = await api.get(`/marks/exam/${selectedExam}`);
      
      // Map existing scores for this subject
      const existingScores = {};
      marksRes.data.forEach(m => {
        if (m.subject.toLowerCase() === subject.toLowerCase()) {
            existingScores[m.student] = m.score;
        }
      });
      setMarksMap(existingScores);
      toast.success("Student Data Loaded");

    } catch (e) {
      toast.error(e.response?.data?.message || "Error fetching data");
    }
  };

  const handleScoreChange = (studentId, score) => {
    // Find selected exam object to check maxMarks
    const currentExam = exams.find(e => e._id === selectedExam);
    if (currentExam && parseInt(score) > currentExam.maxMarks) {
        toast.error(`Marks cannot exceed the maximum (${currentExam.maxMarks})`);
        // We still allow them to type it but it won't be saved if they don't fix it
    }
    setMarksMap(prev => ({ ...prev, [studentId]: score }));
  };

  const handleSaveMarks = async () => {
    try {
      // Find selected exam object to check date and maxMarks
      const currentExam = exams.find(e => e._id === selectedExam);
      if (!currentExam) return toast.error("Exam details not found");
      
      if (new Date(currentExam.date) > new Date()) {
          return toast.error("Marks can only be entered after the examination date.");
      }

      // Final validation before sending to server
      const invalidScores = Object.values(marksMap).some(score => parseInt(score) > currentExam.maxMarks);
      if (invalidScores) {
          return toast.error(`Some scores exceed the maximum marks allowed (${currentExam.maxMarks}). Please fix them before saving.`);
      }

      const marksData = Object.keys(marksMap).map(studentId => ({
        student: studentId,
        subject: subject,
        score: marksMap[studentId]
      }));

      await api.post('/marks/add', {
        examId: selectedExam,
        marksData
      });
      toast.success("Marks Saved Successfully!");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to save marks");
    }
  };

  const isMyClass = (cls) => {
      return cls.classTeacher?.email?.toLowerCase() === user.email?.toLowerCase();
  };

  const filteredExams = exams.filter(e => {
      if (activeTab === 'main') return e.type === 'Main Exam';
      return e.type === 'Class Test';
  });

  // Group exams by subject
  const examsBySubject = filteredExams.reduce((acc, exam) => {
      if (!acc[exam.subject]) acc[exam.subject] = [];
      acc[exam.subject].push(exam);
      return acc;
  }, {});

  const toggleSubject = (sub) => {
      setExpandedSubjects(prev => ({ ...prev, [sub]: !prev[sub] }));
  };

  const now = new Date();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaMarker className="text-indigo-600"/> Examinations & Marks
      </h1>

      {/* Class Selector & Role Indicator */}
      <div className="p-6 bg-white rounded-xl shadow-md border-l-4 border-indigo-600 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 max-w-sm">
            <label className="block text-sm font-bold text-gray-700 mb-2">Select Class</label>
            <select 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 font-medium"
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
            >
                <option value="">Choose Class</option>
                {classes.map(c => (
                    <option key={c._id} value={c._id}>
                        {isMyClass(c) ? '🟢 ' : ''}{c.grade} - {c.section} {isMyClass(c) ? '(Your Class)' : ''}
                    </option>
                ))}
            </select>
        </div>
        
        {selectedClass && (
            <div className={`px-4 py-3 rounded-lg flex items-center gap-4 ${isClassTeacher ? 'bg-indigo-50 text-indigo-800' : 'bg-gray-50 text-gray-700'}`}>
                <div className="font-bold flex items-center gap-2">
                    <FaChalkboardTeacher />
                    {isClassTeacher ? "Class Teacher" : "Subject Teacher"}
                </div>
                {teacherSubjects.length > 0 && (
                    <div className="text-xs bg-white px-3 py-1 rounded-full border border-indigo-100 font-bold">
                        {teacherSubjects.join(", ")}
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex bg-gray-200 p-1 rounded-xl w-fit">
          <button 
            onClick={() => { setActiveTab('main'); setSelectedExam(''); setStudents([]); }}
            className={`px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 ${activeTab === 'main' ? 'bg-white text-indigo-700 shadow-md' : 'text-gray-600 hover:text-indigo-600'}`}
          >
              <FaCalendarAlt /> Admission Cell Schedule
          </button>
          <button 
            onClick={() => { setActiveTab('classTest'); setSelectedExam(''); setStudents([]); }}
            className={`px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 ${activeTab === 'classTest' ? 'bg-white text-emerald-700 shadow-md' : 'text-gray-600 hover:text-emerald-600'}`}
          >
              <FaPlus /> Teacher Class Tests
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Grouped Schedule & Forms */}
          <div className="lg:col-span-1 space-y-6">
              {activeTab === 'classTest' && (
                  <div className="p-6 bg-white rounded-xl shadow-md border-t-4 border-emerald-500">
                      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <FaPlus className="text-emerald-500" /> Schedule Class Test
                      </h2>
                      <form onSubmit={handleCreateExam} className="space-y-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Test Name</label>
                              <input 
                                type="text" placeholder="e.g. Unit Test 1" 
                                className="w-full p-2 border rounded mt-1 bg-gray-50"
                                value={newExamName} onChange={e => setNewExamName(e.target.value)}
                                required
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase">Subject</label>
                                  <select 
                                    className="w-full p-2 border rounded mt-1 bg-gray-50"
                                    value={newExamSubject} onChange={e => setNewExamSubject(e.target.value)}
                                    required
                                  >
                                    <option value="">Select</option>
                                    {teacherSubjects.map((sub, i) => <option key={i} value={sub}>{sub}</option>)}
                                    {isClassTeacher && <option value="General">General</option>}
                                  </select>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase">Max Marks</label>
                                  <input 
                                    type="number" placeholder="0" 
                                    className="w-full p-2 border rounded mt-1 bg-gray-50"
                                    value={newExamMaxMarks} onChange={e => setNewExamMaxMarks(e.target.value)}
                                    required
                                  />
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                                  <input 
                                    type="date" 
                                    className="w-full p-2 border rounded mt-1 bg-gray-50"
                                    value={newExamDate} onChange={e => setNewExamDate(e.target.value)}
                                    required
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase">Time</label>
                                  <input 
                                    type="text" placeholder="09:00 AM" 
                                    className="w-full p-2 border rounded mt-1 bg-gray-50 text-xs"
                                    value={newExamTime} onChange={e => setNewExamTime(e.target.value)}
                                    required
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase flex justify-between items-center mb-1">
                                  Test Syllabus
                                  {selectedSyllabusItems.length > 0 && (
                                      <button 
                                        type="button" 
                                        onClick={(e) => { e.stopPropagation(); setSelectedSyllabusItems([]); setNewExamSyllabus(''); }}
                                        className="text-[10px] text-rose-500 font-black hover:underline"
                                      >
                                          Clear All
                                      </button>
                                  )}
                              </label>
                              <div 
                                onClick={() => setShowSyllabusPicker(true)}
                                className="w-full p-2.5 border rounded mt-1 bg-white min-h-[48px] cursor-pointer hover:border-emerald-400 transition-all flex flex-wrap gap-2 shadow-sm relative overflow-hidden group"
                              >
                                  <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-white flex items-center justify-center text-slate-300 group-hover:text-emerald-500">
                                      <FaEye size={10} />
                                  </div>

                                  {selectedSyllabusItems.length > 0 ? (
                                      availableSyllabusItems.filter(ch => selectedSyllabusItems.includes(`Chapter ${ch.chapterNo}: ${ch.title}`)).map((chapter, idx) => {
                                          const chapterText = `Chapter ${chapter.chapterNo}: ${chapter.title}`;
                                          const selectedTopics = chapter.topics?.filter(t => selectedSyllabusItems.includes(`C${chapter.chapterNo}-T: ${t.title}`)) || [];
                                          
                                          return (
                                            <div key={idx} className="flex flex-col gap-1 w-full border-b border-slate-50 pb-2 mb-1 last:border-0 last:pb-0 last:mb-0">
                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">{chapterText}</span>
                                                <div className="flex flex-wrap gap-1.5 pl-2">
                                                    {selectedTopics.map((topic, tidx) => (
                                                        <span key={tidx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-bold">
                                                            {topic.title}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                          );
                                      })
                                  ) : (
                                      <span className="text-slate-300 text-[11px] font-bold italic py-1">Click to select topics from hierarchy...</span>
                                  )}
                              </div>
                          </div>

                          {/* Syllabus Picker Modal */}
                          {showSyllabusPicker && (
                              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSyllabusPicker(false)}>
                                  <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                                      <div className="p-8 bg-emerald-600 text-white flex justify-between items-start">
                                          <div>
                                              <h3 className="text-2xl font-black">Hierarchical Syllabus</h3>
                                              <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mt-1">{newExamSubject} Curriculum</p>
                                          </div>
                                          <button onClick={() => setShowSyllabusPicker(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition">
                                              <FaTimes size={16}/>
                                          </button>
                                      </div>
                                      <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                          {availableSyllabusItems.length > 0 ? (
                                              <div className="space-y-8">
                                                  {availableSyllabusItems.map(chapter => {
                                                      const chapterText = `Chapter ${chapter.chapterNo}: ${chapter.title}`;
                                                      const chTopicItems = chapter.topics?.map(t => ({
                                                          internal: `C${chapter.chapterNo}-T: ${t.title}`,
                                                          display: `  • ${t.title}`
                                                      })) || [];
                                                      const topicInternals = chTopicItems.map(t => t.internal);
                                                      const allSelected = isItemSelected(chapterText) && topicInternals.every(t => isItemSelected(t));
                                                      
                                                      return (
                                                        <div key={chapter._id} className="space-y-4">
                                                            <div 
                                                                onClick={() => toggleSyllabusItem(chapterText, topicInternals)}
                                                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${isItemSelected(chapterText) ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-100 hover:border-emerald-200 shadow-sm shadow-slate-100'}`}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${isItemSelected(chapterText) ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                                        {chapter.chapterNo}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-black text-slate-800 text-sm">{chapter.title}</span>
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{chapter.topics?.length || 0} Subtopics</p>
                                                                    </div>
                                                                </div>
                                                                {allSelected ? <FaCheckCircle className="text-emerald-500" size={20}/> : isItemSelected(chapterText) ? <div className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div></div> : <div className="w-5 h-5 rounded-full border-2 border-slate-200"></div>}
                                                            </div>
                                                            
                                                            <div className="grid grid-cols-1 gap-2 pl-14 pr-2">
                                                                {chTopicItems.map((topicItem, tidx) => {
                                                                    return (
                                                                        <div 
                                                                          key={tidx}
                                                                          onClick={() => toggleSyllabusItem(topicItem.internal, [], chapterText)}
                                                                          className={`p-3 rounded-xl border-2 text-[11px] font-bold transition-all cursor-pointer flex justify-between items-center ${isItemSelected(topicItem.internal) ? 'border-indigo-400 bg-indigo-50/50 text-indigo-700' : 'border-slate-50 text-slate-400 hover:bg-slate-50/50 hover:border-slate-100'}`}
                                                                        >
                                                                            {topicItem.display.replace('  • ', '')}
                                                                            {isItemSelected(topicItem.internal) ? <FaCheckCircle size={12} className="text-indigo-600"/> : <div className="w-3.5 h-3.5 rounded-full border border-slate-200"></div>}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                      );
                                                  })}
                                              </div>
                                          ) : (
                                              <div className="text-center py-16 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                                  <FaClipboardList className="mx-auto text-slate-200 text-4xl mb-4" />
                                                  <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No curriculum data found</p>
                                              </div>
                                          )}
                                      </div>
                                      <div className="p-8 bg-slate-50 border-t border-slate-100">
                                          <button 
                                            onClick={() => setShowSyllabusPicker(false)}
                                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-700"
                                          >
                                              Apply Selection ({selectedSyllabusItems.length})
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          )}

                          <button 
                            disabled={createLoading || !selectedClass}
                            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition disabled:bg-gray-300 shadow-lg"
                          >
                            {createLoading ? 'Scheduling...' : 'Schedule Test'}
                          </button>
                      </form>
                  </div>
              )}

              <div className="p-6 bg-white rounded-xl shadow-md border-t-4 border-indigo-400">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <FaCalendarAlt className="text-indigo-400" /> {activeTab === 'main' ? 'Exam Schedule' : 'Test Schedule'}
                  </h2>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {Object.keys(examsBySubject).length > 0 ? (
                          Object.keys(examsBySubject).sort().map(sub => (
                              <div key={sub} className="border rounded-lg overflow-hidden">
                                  <button 
                                    onClick={() => toggleSubject(sub)}
                                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition font-bold text-gray-700 text-sm"
                                  >
                                      <div className="flex items-center gap-2">
                                          <FaBook className="text-indigo-500 text-xs" />
                                          {sub}
                                          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-1">
                                              {examsBySubject[sub].length}
                                          </span>
                                      </div>
                                      {expandedSubjects[sub] ? <FaChevronDown /> : <FaChevronRight />}
                                  </button>
                                  
                                  {expandedSubjects[sub] && (
                                      <div className="divide-y bg-white">
                                          {examsBySubject[sub].sort((a,b) => new Date(b.date) - new Date(a.date)).map(e => {
                                              const isPast = new Date(e.date) < now;
                                              return (
                                                  <div 
                                                    key={e._id} 
                                                    className={`p-3 hover:bg-indigo-50 transition cursor-pointer flex justify-between items-center ${selectedExam === e._id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                                                    onClick={() => { setSelectedExam(e._id); setSubject(e.subject); }}
                                                  >
                                                      <div className="flex-1">
                                                          <h4 className="text-sm font-bold text-gray-800">{e.name}</h4>
                                                          <div className="flex items-center gap-2 mt-1">
                                                              <span className="text-[10px] text-gray-400 font-mono">{new Date(e.date).toLocaleDateString()}</span>
                                                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isPast ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                                                                  {isPast ? 'Past' : 'Upcoming'}
                                                              </span>
                                                          </div>
                                                      </div>
                                                      <div className="text-right">
                                                          <p className="text-[10px] text-gray-400 uppercase font-bold">Max</p>
                                                          <p className="text-sm font-black text-gray-700">{e.maxMarks}</p>
                                                      </div>
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  )}
                              </div>
                          ))
                      ) : (
                          <div className="text-center py-10 text-gray-400 italic text-sm">
                              No {activeTab === 'main' ? 'exams' : 'tests'} scheduled yet.
                          </div>
                      )}
                  </div>
              </div>
          </div>

          {/* Right Column: Mark Entry */}
          <div className="lg:col-span-2 space-y-6">
              <div className="p-6 bg-white rounded-xl shadow-md border-t-4 border-green-500">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                          <FaUserGraduate className="text-green-500" /> Enter Student Marks
                      </h2>
                      {selectedExam && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 text-sm font-bold">
                              <FaCheckCircle /> Ready to enter marks
                          </div>
                      )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Subject First</label>
                          <select 
                            className="w-full p-3 border rounded-lg bg-gray-50 font-medium"
                            value={subject} 
                            onChange={e => { setSubject(e.target.value); setSelectedExam(''); }}
                          >
                            <option value="">-- Choose Subject --</option>
                            {Object.keys(examsBySubject).sort().map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                            {teacherSubjects.length > 0 && teacherSubjects.map(s => !examsBySubject[s] && <option key={s} value={s}>{s} (No Exams)</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select {activeTab === 'main' ? 'Exam' : 'Test'}</label>
                          <select 
                            className="w-full p-3 border rounded-lg bg-gray-50 font-medium disabled:opacity-50"
                            value={selectedExam}
                            onChange={e => setSelectedExam(e.target.value)}
                            disabled={!subject}
                          >
                            <option value="">-- Select {activeTab === 'main' ? 'Exam' : 'Test'} --</option>
                            {subject && examsBySubject[subject] && examsBySubject[subject].sort((a,b) => new Date(b.date) - new Date(a.date)).map(e => (
                                <option key={e._id} value={e._id}>{e.name} ({new Date(e.date).toLocaleDateString()})</option>
                            ))}
                          </select>
                      </div>
                  </div>

                  <button 
                    onClick={handleFetchData}
                    disabled={!selectedExam || !subject}
                    className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-lg disabled:bg-gray-300 flex items-center justify-center gap-2"
                  >
                     <FaUserGraduate /> Load Student List
                  </button>

                  {students.length > 0 && (
                      <div className="mt-8">
                          <div className="overflow-x-auto rounded-lg border border-gray-100">
                              <table className="min-w-full text-left">
                                  <thead className="bg-gray-50 border-b">
                                      <tr>
                                          <th className="p-4 text-xs font-bold text-gray-500 uppercase">Roll No</th>
                                          <th className="p-4 text-xs font-bold text-gray-500 uppercase">Student Name</th>
                                          <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Score</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                      {students.map(student => (
                                          <tr key={student._id} className="hover:bg-indigo-50/30 transition">
                                              <td className="p-4 font-mono text-gray-500 text-sm">{student.rollNum}</td>
                                              <td className="p-4 font-bold text-gray-700">{student.name}</td>
                                              <td className="p-4 text-center">
                                                  <input 
                                                    type="number" 
                                                    className="p-2 border rounded-lg w-24 text-center font-bold focus:ring-2 focus:ring-green-500 outline-none"
                                                    value={marksMap[student._id] || ''}
                                                    onChange={e => handleScoreChange(student._id, e.target.value)}
                                                    placeholder="0"
                                                  />
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                          
                          <div className="mt-6 p-6 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col md:flex-row justify-between items-center gap-4">
                             <div>
                                <p className="text-sm text-indigo-900">Saving marks for: <span className="font-bold underline">{subject}</span></p>
                                <p className="text-[10px] text-indigo-500 uppercase font-bold mt-1">Carefully verify scores before saving</p>
                             </div>
                             <button 
                                onClick={handleSaveMarks}
                                className="px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
                             >
                                <FaCheckCircle /> Save All Results
                             </button>
                          </div>
                      </div>
                  )}

                  {!selectedExam && (
                      <div className="mt-8 text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                          <FaMarker className="mx-auto text-4xl text-gray-200 mb-2" />
                          <p className="text-gray-400 font-medium">Select a subject and {activeTab === 'main' ? 'exam' : 'test'} to start entering marks.</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Marks;