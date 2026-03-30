import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
    FileText, PlusCircle, CheckCircle, X, Calendar, 
    Layers, Users, Clock, BookOpen, Trash2, Bell, ShieldCheck, ChevronDown, Check
} from 'lucide-react';

const ExamCellDashboard = () => {
  const [exams, setExams] = useState([]);
  const [classes, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Syllabus state
  const [classSyllabi, setClassSyllabi] = useState({}); // { classId: [syllabus1, syllabus2] }
  
  // Form State
  const [examType, setExamType] = useState('Academics'); 
  const [subType, setSubType] = useState('Mid Term'); 
  
  // Matrix State
  const [rows, setRows] = useState(1); 
  const [cols, setCols] = useState(1); 
  const [dates, setDates] = useState(['']); 
  const [matrix, setMatrix] = useState([[{ 
      subject: '', 
      classIds: [], // Stores multiple selected class IDs
      syllabus: '', 
      selectedSyllabusItems: [], // Stores selected chapter/topic text
      isIndividual: false,
      individualConfigs: {}, // { [classId]: { subject, syllabus, selectedSyllabusItems } }
      time: '09:00 AM - 12:00 PM', 
      shift: 'Morning', 
      maxMarks: 100 
  }]]);

  // UI for syllabus/class selection
  const [syllabusPicker, setSyllabusPicker] = useState(null); // { r, c, classId? }
  const [classPicker, setClassPicker] = useState(null); // { r, c }

  const [selectedClasses, setSelectedClasses] = useState([]);
  const [compData, setCompData] = useState({
      date: '',
      topic: '',
      description: '',
      maxMarks: 100,
      syllabus: ''
  });

  const [sendNotification, setSendNotification] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchClasses();
    checkNotificationPermission();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await axios.get('/exam/all');
      setExams(res.data);
    } catch (error) {
      console.error("Exam fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
      try {
          const res = await axios.get('/class/getall');
          setAllClasses(res.data);
      } catch (error) {
          console.error("Class fetch error", error);
      }
  };

  const fetchSyllabusForClass = async (classId) => {
      if (!classId || classSyllabi[classId]) return;
      try {
          const res = await axios.get(`/syllabus/class/${classId}`);
          setClassSyllabi(prev => ({ ...prev, [classId]: res.data }));
      } catch (error) {
          console.error("Syllabus fetch error", error);
      }
  };

  const checkNotificationPermission = () => {
      if ("Notification" in window) {
          setPermissionGranted(Notification.permission === "granted");
      }
  };

  const requestPermission = async () => {
      if (!("Notification" in window)) {
          toast.error("Browser does not support notifications");
          return;
      }
      const permission = await Notification.requestPermission();
      setPermissionGranted(permission === "granted");
      if (permission === "granted") toast.success("Permission granted!");
  };

  const handleMatrixResize = (newRows, newCols) => {
      const updatedDates = [...dates];
      while (updatedDates.length < newRows) updatedDates.push('');
      if (updatedDates.length > newRows) updatedDates.length = newRows;
      setDates(updatedDates);

      const newMatrix = Array.from({ length: newRows }, (_, r) => {
          return Array.from({ length: newCols }, (_, c) => {
              return matrix[r]?.[c] || { 
                  subject: '', 
                  classIds: [], 
                  syllabus: '', 
                  selectedSyllabusItems: [],
                  time: '09:00 AM - 12:00 PM', 
                  shift: 'Morning', 
                  maxMarks: 100 
              };
          });
      });
      setMatrix(newMatrix);
      setRows(newRows);
      setCols(newCols);
  };

  const updateMatrixSlot = (r, c, field, value, classId = null) => {
      const updated = [...matrix];
      
      if (classId) {
          // Individual update
          const currentConfigs = updated[r][c].individualConfigs || {};
          const classConfig = currentConfigs[classId] || { subject: '', syllabus: '', selectedSyllabusItems: [] };
          currentConfigs[classId] = { ...classConfig, [field]: value };
          updated[r][c].individualConfigs = currentConfigs;
          
          if (field === 'subject' && value) {
              fetchSyllabusForClass(classId);
              // Reset syllabus for this class if subject changes
              currentConfigs[classId].syllabus = '';
              currentConfigs[classId].selectedSyllabusItems = [];
          }
      } else {
          // Slot-level update
          updated[r][c] = { ...updated[r][c], [field]: value };
          
          if (field === 'classIds' && Array.isArray(value) && value.length > 0) {
              // Fetch syllabus for ALL selected classes to ensure subjects are available for each
              value.forEach(id => fetchSyllabusForClass(id));
              
              // Reset common subject and syllabus if class list changes
              updated[r][c].subject = '';
              updated[r][c].syllabus = '';
              updated[r][c].selectedSyllabusItems = [];
              
              // Also ensure individualConfigs has entries for all new classIds
              const currentConfigs = updated[r][c].individualConfigs || {};
              value.forEach(id => {
                  if (!currentConfigs[id]) {
                      currentConfigs[id] = { subject: '', syllabus: '', selectedSyllabusItems: [] };
                  }
              });
              updated[r][c].individualConfigs = currentConfigs;
          }
      }
      
      setMatrix(updated);
  };

  const toggleSyllabusItem = (r, c, item, children = [], parent = null, classId = null) => {
      const updated = [...matrix];
      const slot = updated[r][c];
      
      let items = classId 
          ? (slot.individualConfigs[classId]?.selectedSyllabusItems || [])
          : (slot.selectedSyllabusItems || []);
          
      const isSelected = items.includes(item);
      
      if (isSelected) {
          const itemsToRemove = [item, ...children];
          items = items.filter(i => !itemsToRemove.includes(i));
      } else {
          const itemsToAdd = [item, ...children];
          if (parent && !items.includes(parent)) {
              itemsToAdd.push(parent);
          }
          items = [...new Set([...items, ...itemsToAdd])];
      }
      
      // Target for syllabus data
      const targetClassId = classId || slot.classIds[0];
      const targetSubject = classId ? slot.individualConfigs[classId]?.subject : slot.subject;
      const sData = (classSyllabi[targetClassId] || []).find(s => s.subject === targetSubject);
      
      let syllabusString = items.join(', ');
      let finalInternal = items;

      if (sData) {
          const sortedDisplay = [];
          const sortedInternal = [];
          
          sData.chapters?.forEach(ch => {
              const chText = `Chapter ${ch.chapterNo}: ${ch.title}`;
              const chTopicItems = ch.topics?.map(t => ({
                  internal: `C${ch.chapterNo}-T: ${t.title}`,
                  display: `  • ${t.title}`
              })) || [];
              
              const isChInSelection = items.includes(chText);
              const selectedTopicInternals = chTopicItems.filter(t => items.includes(t.internal));
              
              if (isChInSelection || selectedTopicInternals.length > 0) {
                  sortedDisplay.push(chText);
                  sortedInternal.push(chText);
                  
                  chTopicItems.forEach(t => {
                      if (items.includes(t.internal)) {
                          sortedDisplay.push(t.display);
                          sortedInternal.push(t.internal);
                      }
                  });
              }
          });
          syllabusString = sortedDisplay.join(', ');
          finalInternal = sortedInternal;
      }

      if (classId) {
          updated[r][c].individualConfigs[classId].selectedSyllabusItems = finalInternal;
          updated[r][c].individualConfigs[classId].syllabus = syllabusString;
      } else {
          updated[r][c].selectedSyllabusItems = finalInternal;
          updated[r][c].syllabus = syllabusString;
      }
      
      setMatrix(updated);
  };

  const updateDate = (r, val) => {
      const updated = [...dates];
      updated[r] = val;
      setDates(updated);
  };

  const checkForConflicts = (examsToCreate) => {
      for (let i = 0; i < examsToCreate.length; i++) {
          const e1 = examsToCreate[i];
          
          // Internal conflicts in the new batch
          for (let j = i + 1; j < examsToCreate.length; j++) {
              const e2 = examsToCreate[j];
              if (e1.sClass === e2.sClass && e1.date === e2.date && e1.shift === e2.shift) {
                  const cls = classes.find(c => c._id === e1.sClass);
                  return `Conflict: Class ${cls.grade}-${cls.section} has multiple exams scheduled for ${e1.date} in the ${e1.shift} shift.`;
              }
          }

          // Conflicts with existing exams
          const existingConflict = exams.find(ex => 
              ex.sClass?._id === e1.sClass && 
              new Date(ex.date).toISOString().split('T')[0] === e1.date && 
              ex.shift === e1.shift
          );
          if (existingConflict) {
              const cls = classes.find(c => c._id === e1.sClass);
              return `Conflict: Class ${cls.grade}-${cls.section} already has an exam (${existingConflict.subject}) on ${e1.date} during ${e1.shift} shift.`;
          }
      }
      return null;
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      
      let examsToCreate = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (examType === 'Academics') {
          for (let r = 0; r < matrix.length; r++) {
              const date = dates[r];
              if (!date) continue;

              const examDate = new Date(date);
              if (examDate < today) {
                  return toast.error(`Error on Day ${r+1}: Exam date cannot be in the past.`);
              }

              for (let c = 0; c < matrix[r].length; c++) {
                  const slot = matrix[r][c];
                  if (slot.classIds && slot.classIds.length > 0) {
                      
                      slot.classIds.forEach(clsId => {
                          let finalSubject = slot.subject;
                          let finalSyllabus = slot.syllabus;

                          if (slot.isIndividual && slot.individualConfigs[clsId]) {
                              finalSubject = slot.individualConfigs[clsId].subject;
                              finalSyllabus = slot.individualConfigs[clsId].syllabus;
                          }

                          if (!finalSubject) {
                              const cls = classes.find(cl => cl._id === clsId);
                              toast.error(`Please select a subject for ${cls.grade}-${cls.section} at D${r+1} Slot ${c+1}`);
                              throw new Error("Missing subject");
                          }

                          examsToCreate.push({
                              name: subType,
                              sClass: clsId,
                              subject: finalSubject,
                              date: date,
                              time: slot.time,
                              shift: slot.shift,
                              maxMarks: slot.maxMarks,
                              syllabus: finalSyllabus || `${subType} examination`,
                              type: 'Main Exam'
                          });
                      });
                  }
              }
          }
      } else {
          // Competative
          if (!compData.date || !compData.topic || selectedClasses.length === 0) {
              return toast.error("Please fill all required fields for competitive exam");
          }
          selectedClasses.forEach(clsId => {
              examsToCreate.push({
                  name: `Competitive: ${compData.topic}`,
                  sClass: clsId,
                  subject: compData.topic,
                  date: compData.date,
                  time: "10:00 AM - 01:00 PM",
                  shift: "Special",
                  maxMarks: compData.maxMarks,
                  syllabus: compData.syllabus || compData.description,
                  type: 'Class Test'
              });
          });
      }

      if (examsToCreate.length === 0) return toast.error("No valid exam data to submit. Make sure dates and classes are selected.");

      const conflictMsg = checkForConflicts(examsToCreate);
      if (conflictMsg) return toast.error(conflictMsg);

      try {
          await axios.post('/exam/bulk-create', { 
              exams: examsToCreate, 
              sendNotification: sendNotification && permissionGranted 
          });
          toast.success(`Successfully generated ${examsToCreate.length} exams!`);
          setShowCreateModal(false);
          fetchExams();
      } catch (error) {
          toast.error(error.response?.data?.message || "Generation failed");
      }
  };

  if (loading) return <div className="p-20 text-center font-black text-gray-300 animate-pulse">SYNCHRONIZING EXAM ARCHIVES...</div>;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & Stats (unchanged) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Exam Cell</h1>
            <p className="text-gray-500 font-bold ml-1 uppercase text-[10px] tracking-widest mt-2">Manage Academic & Competitive Assessments</p>
          </div>
          <button 
            onClick={() => {
                setShowCreateModal(true);
                handleMatrixResize(1, 1);
            }}
            className="px-6 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-purple-700 transition shadow-lg shadow-purple-100 flex items-center gap-2"
          >
            <PlusCircle size={20} /> Generate Exams
          </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total Papers</div>
          <div className="text-4xl font-black text-purple-600">{exams.length}</div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Upcoming Tests</div>
          <div className="text-4xl font-black text-blue-600">{exams.filter(e => new Date(e.date) > new Date()).length}</div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Recent Results</div>
          <div className="text-4xl font-black text-green-600">--</div>
        </div>
      </div>

      {/* Master Schedule Table (unchanged) */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-black text-gray-800">Master Schedule</h2>
          <div className="flex gap-2">
              <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase">Official</span>
          </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="py-6 px-8">Exam Name</th>
                        <th className="py-6 px-8">Class</th>
                        <th className="py-6 px-8">Subject</th>
                        <th className="py-6 px-8">Schedule</th>
                        <th className="py-6 px-8">Details</th>
                        <th className="py-6 px-8">Scheduled By</th>
                        <th className="py-6 px-8 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {exams.map(exam => (
                        <tr key={exam._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-6 px-8">
                                <div className="font-black text-gray-800">{exam.name}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase">{exam.type}</div>
                            </td>
                            <td className="py-6 px-8">
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-black uppercase">
                                    {exam.sClass?.grade}-{exam.sClass?.section}
                                </span>
                            </td>
                            <td className="py-6 px-8 font-bold text-gray-700">{exam.subject}</td>
                            <td className="py-6 px-8">
                                <div className="font-bold text-gray-800">{new Date(exam.date).toLocaleDateString()}</div>
                                <div className="text-[10px] text-purple-600 font-black uppercase">{exam.shift} ({exam.time})</div>
                            </td>
                            <td className="py-6 px-8">
                                <div className="text-xs font-bold text-gray-600">Max Marks: <span className="text-indigo-600">{exam.maxMarks}</span></div>
                            </td>
                            <td className="py-6 px-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-[10px] font-black">
                                        {exam.creator?.name?.charAt(0) || '?'}
                                    </div>
                                    <span className="text-xs font-bold text-gray-600">{exam.creator?.name || 'Unknown'}</span>
                                </div>
                            </td>
                            <td className="py-6 px-8 text-center">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                    new Date(exam.date) < new Date() ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                    {new Date(exam.date) < new Date() ? 'Completed' : 'Scheduled'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {exams.length === 0 && <p className="text-gray-400 font-bold text-center py-20 italic">No exams recorded in the database...</p>}
      </div>

      {/* Creation Modal */}
      {showCreateModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
                  <div className="p-8 bg-purple-600 text-white flex justify-between items-center relative flex-shrink-0">
                      <div>
                          <h2 className="text-2xl font-black">Generate Assessment Matrix</h2>
                          <p className="text-purple-100 text-[10px] font-bold uppercase tracking-widest mt-1">Configure Dates & Subject Allocations</p>
                      </div>
                      <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition">
                          <X size={24} />
                      </button>
                  </div>

                  <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assessment Category</label>
                              <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                                  {['Academics', 'Competative'].map(t => (
                                      <button 
                                        key={t} type="button"
                                        onClick={() => setExamType(t)}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition ${examType === t ? 'bg-white text-purple-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                      >
                                          {t}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          {examType === 'Academics' && (
                              <>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Academic Cycle</label>
                                    <select 
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-purple-50 font-bold text-gray-700 text-sm appearance-none shadow-sm cursor-pointer"
                                        value={subType}
                                        onChange={(e) => setSubType(e.target.value)}
                                    >
                                        <option>Mid Term</option>
                                        <option>Half Yearly</option>
                                        <option>Annual</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Matrix Dimensions (Days x Slots)</label>
                                    <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                                        <div className="flex-1 flex items-center justify-center gap-2">
                                            <span className="text-[8px] font-black text-gray-400">DAYS</span>
                                            <input type="number" min="1" max="20" value={rows} onChange={(e) => handleMatrixResize(parseInt(e.target.value) || 1, cols)} className="w-10 bg-transparent font-black text-purple-600 text-center outline-none" />
                                        </div>
                                        <div className="h-6 w-px bg-gray-200"></div>
                                        <div className="flex-1 flex items-center justify-center gap-2">
                                            <span className="text-[8px] font-black text-gray-400">SLOTS/DAY</span>
                                            <input type="number" min="1" max="10" value={cols} onChange={(e) => handleMatrixResize(rows, parseInt(e.target.value) || 1)} className="w-10 bg-transparent font-black text-purple-600 text-center outline-none" />
                                        </div>
                                    </div>
                                </div>
                              </>
                          )}
                      </div>

                      {examType === 'Academics' && (
                          <div className="space-y-8">
                              {Array.from({ length: rows }).map((_, r) => (
                                  <div key={r} className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
                                          <div className="flex items-center gap-4">
                                              <span className="w-10 h-10 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-black shadow-lg">D{r + 1}</span>
                                              <div className="space-y-1">
                                                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Examination Date</label>
                                                  <input 
                                                    type="date" 
                                                    value={dates[r]} 
                                                    onChange={(e) => updateDate(r, e.target.value)}
                                                    className="p-2.5 bg-white rounded-xl text-xs font-black outline-none border border-gray-100 focus:ring-4 focus:ring-purple-100" 
                                                  />
                                              </div>
                                          </div>
                                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{cols} Active Exam Slots</p>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                          {Array.from({ length: cols }).map((_, c) => {
                                              const currentSlot = matrix[r][c];
                                              
                                              // Aggregate subjects from all selected classes in this slot
                                              const availableSyllabi = (currentSlot.classIds || []).reduce((acc, cid) => {
                                                  const syllabi = classSyllabi[cid] || [];
                                                  syllabi.forEach(s => {
                                                      if (!acc.find(item => item.subject === s.subject)) {
                                                          acc.push(s);
                                                      }
                                                  });
                                                  return acc;
                                              }, []);
                                              
                                              return (
                                              <div key={c} className="p-6 bg-white rounded-3xl shadow-sm border border-gray-50 space-y-4 hover:shadow-md transition-shadow relative group">
                                                  <div className="flex justify-between items-center mb-2">
                                                      <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black">SLOT {c + 1}</span>
                                                      <div className="flex items-center gap-2">
                                                          {currentSlot.classIds?.length > 1 && (
                                                              <button 
                                                                type="button"
                                                                onClick={() => updateMatrixSlot(r, c, 'isIndividual', !currentSlot.isIndividual)}
                                                                className={`px-2 py-1 rounded text-[8px] font-black uppercase transition-colors ${currentSlot.isIndividual ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                                                              >
                                                                  Individual
                                                              </button>
                                                          )}
                                                          <Clock size={14} className="text-gray-200 group-hover:text-purple-300 transition-colors" />
                                                      </div>
                                                  </div>
                                                  
                                                  <div className="space-y-3">
                                                      <div>
                                                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1 flex justify-between items-center">
                                                              Classes *
                                                              <button 
                                                                type="button" 
                                                                onClick={() => setClassPicker({ r, c })}
                                                                className="text-purple-600 hover:underline"
                                                              >Select Group</button>
                                                          </label>
                                                          <div className="min-h-[40px] p-3 bg-gray-50 rounded-xl text-[9px] font-bold text-gray-500 line-clamp-2">
                                                              {currentSlot.classIds && currentSlot.classIds.length > 0 ? (
                                                                  classes.filter(cls => currentSlot.classIds.includes(cls._id))
                                                                         .map(cls => `${cls.grade}-${cls.section}`)
                                                                         .join(', ')
                                                              ) : 'No classes selected...'}
                                                          </div>
                                                      </div>

                                                      {currentSlot.isIndividual && currentSlot.classIds?.length > 1 ? (
                                                          <div className="space-y-4 pt-2 border-t border-gray-100 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                                              {currentSlot.classIds.map(clsId => {
                                                                  const cls = classes.find(cl => cl._id === clsId);
                                                                  const config = currentSlot.individualConfigs[clsId] || {};
                                                                  const availSyllabi = classSyllabi[clsId] || [];
                                                                  return (
                                                                      <div key={clsId} className="p-3 bg-gray-50/50 rounded-2xl space-y-2 border border-gray-100">
                                                                          <div className="text-[9px] font-black text-purple-600 uppercase">{cls?.grade}-{cls?.section}</div>
                                                                          <select 
                                                                            value={config.subject || ''} 
                                                                            onChange={(e) => updateMatrixSlot(r, c, 'subject', e.target.value, clsId)}
                                                                            className="w-full p-2 bg-white rounded-lg text-[10px] font-black outline-none border border-gray-100"
                                                                          >
                                                                              <option value="">Subject</option>
                                                                              {availSyllabi.map(s => <option key={s._id} value={s.subject}>{s.subject}</option>)}
                                                                          </select>
                                                                          <div className="flex justify-between items-center px-1">
                                                                              <span className="text-[8px] font-bold text-gray-400 line-clamp-1 flex-1 pr-2">{config.syllabus || 'No syllabus...'}</span>
                                                                              {config.subject && (
                                                                                  <button 
                                                                                    type="button" 
                                                                                    onClick={() => setSyllabusPicker({ r, c, classId: clsId })}
                                                                                    className="text-purple-600 text-[8px] font-black uppercase whitespace-nowrap"
                                                                                  >Edit</button>
                                                                              )}
                                                                          </div>
                                                                      </div>
                                                                  );
                                                              })}
                                                          </div>
                                                      ) : (
                                                          <>
                                                            <div>
                                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject *</label>
                                                                <select 
                                                                  value={currentSlot.subject} 
                                                                  onChange={(e) => updateMatrixSlot(r, c, 'subject', e.target.value)} 
                                                                  disabled={!currentSlot.classIds?.length}
                                                                  required={!currentSlot.isIndividual}
                                                                  className="w-full p-3 bg-gray-50 rounded-xl text-[10px] font-black outline-none border border-transparent focus:border-purple-200 focus:bg-white transition-all appearance-none disabled:opacity-50"
                                                                >
                                                                    <option value="">Select Subject</option>
                                                                    {availableSyllabi.map(s => <option key={s._id} value={s.subject}>{s.subject}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1 flex justify-between items-center">
                                                                    Syllabus Selection
                                                                    {currentSlot.subject && (
                                                                        <button 
                                                                          type="button" 
                                                                          onClick={() => setSyllabusPicker({ r, c })}
                                                                          className="text-purple-600 hover:underline"
                                                                        >Pick Topics</button>
                                                                    )}
                                                                </label>
                                                                <div className="min-h-[40px] p-3 bg-gray-50 rounded-xl text-[9px] font-bold text-gray-500 line-clamp-2">
                                                                    {currentSlot.syllabus || 'No topics selected...'}
                                                                </div>
                                                            </div>
                                                          </>
                                                      )}

                                                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                                                          <div>
                                                              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Max Marks</label>
                                                              <input 
                                                                type="number" 
                                                                value={currentSlot.maxMarks} 
                                                                onChange={(e) => updateMatrixSlot(r, c, 'maxMarks', parseInt(e.target.value) || 0)}
                                                                className="w-full p-3 bg-gray-50 rounded-xl text-[10px] font-black outline-none" 
                                                              />
                                                          </div>
                                                          <div>
                                                              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Shift</label>
                                                              <select 
                                                                value={currentSlot.shift} 
                                                                onChange={(e) => updateMatrixSlot(r, c, 'shift', e.target.value)}
                                                                className="w-full p-3 bg-gray-50 rounded-xl text-[10px] font-black outline-none"
                                                              >
                                                                  <option>Morning</option>
                                                                  <option>Noon</option>
                                                                  <option>Evening</option>
                                                              </select>
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>
                                          )})}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}

                      {/* Competitive View (unchanged) */}
                      {examType === 'Competative' && (
                          <div className="space-y-8">
                              <div className="space-y-4">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Pupil Groups (Classes)</label>
                                  <div className="flex flex-wrap gap-2 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                                      {classes.map(c => (
                                          <button 
                                            key={c._id} type="button"
                                            onClick={() => {
                                                if (selectedClasses.includes(c._id)) setSelectedClasses(selectedClasses.filter(id => id !== c._id));
                                                else setSelectedClasses([...selectedClasses, c._id]);
                                            }}
                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                                selectedClasses.includes(c._id) ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-100' : 'bg-white text-gray-400 border-gray-100 hover:border-purple-200'
                                            }`}
                                          >
                                              {c.grade}-{c.section}
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                                  <div className="space-y-6">
                                      <div className="space-y-2">
                                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assessment Title/Topic</label>
                                          <input 
                                            type="text" required placeholder="e.g. Science Talent Search"
                                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-50 font-black text-gray-700 text-sm"
                                            value={compData.topic}
                                            onChange={(e) => setCompData({...compData, topic: e.target.value})}
                                          />
                                      </div>
                                      <div className="space-y-2">
                                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Schedule Date</label>
                                          <input 
                                            type="date" required
                                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-50 font-black text-gray-700 text-sm"
                                            value={compData.date}
                                            onChange={(e) => setCompData({...compData, date: e.target.value})}
                                          />
                                      </div>
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assessment Objective & Syllabus</label>
                                      <textarea 
                                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-50 font-bold text-gray-700 text-sm min-h-[180px]"
                                        placeholder="Outline the scope of this assessment..."
                                        value={compData.description}
                                        onChange={(e) => setCompData({...compData, description: e.target.value})}
                                      />
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* Broadcast Intelligence (unchanged) */}
                      <div className="p-8 bg-gray-900 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
                          <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${permissionGranted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {permissionGranted ? <Bell size={24} /> : <ShieldCheck size={24} />}
                              </div>
                              <div>
                                  <h4 className="font-black text-lg">Broadcast Intelligence</h4>
                                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Send automated alerts to faculty and pupils</p>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                              {!permissionGranted ? (
                                  <button 
                                    type="button"
                                    onClick={requestPermission}
                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition"
                                  >
                                      Grant Permission
                                  </button>
                              ) : (
                                  <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                                      <span className="text-[10px] font-black uppercase tracking-widest">Enable Notification</span>
                                      <input 
                                        type="checkbox" 
                                        checked={sendNotification} 
                                        onChange={(e) => setSendNotification(e.target.checked)} 
                                        className="w-5 h-5 accent-purple-500 rounded-md cursor-pointer"
                                      />
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="pt-8 border-t border-gray-100 flex justify-end gap-4 pb-10">
                          <button 
                            type="button" 
                            onClick={() => setShowCreateModal(false)}
                            className="px-10 py-4 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition"
                          >
                              Abort Operation
                          </button>
                          <button 
                            type="submit"
                            className="px-12 py-4 bg-purple-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-purple-100 hover:bg-purple-700 transition"
                          >
                              Execute Generation
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Class Picker Modal */}
      {classPicker && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="p-6 bg-purple-600 text-white flex justify-between items-center">
                      <h3 className="text-xl font-black">Assign Classes to Slot</h3>
                      <button onClick={() => setClassPicker(null)} className="p-2 hover:bg-white/20 rounded-xl"><X size={24}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                      {(() => {
                          const slot = matrix[classPicker.r][classPicker.c];
                          const selected = slot.classIds || [];
                          
                          // Group by grade
                          const grades = [...new Set(classes.map(c => c.grade))];

                          return grades.map(grade => {
                              const sections = classes.filter(c => c.grade === grade);
                              const allGradeSelected = sections.every(s => selected.includes(s._id));

                              return (
                                  <div key={grade} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                                      <div className="flex justify-between items-center">
                                          <h4 className="font-black text-gray-800 uppercase tracking-widest text-[10px]">{grade}</h4>
                                          <button 
                                            type="button"
                                            onClick={() => {
                                                const ids = sections.map(s => s._id);
                                                let newIds;
                                                if (allGradeSelected) newIds = selected.filter(id => !ids.includes(id));
                                                else newIds = [...new Set([...selected, ...ids])];
                                                updateMatrixSlot(classPicker.r, classPicker.c, 'classIds', newIds);
                                            }}
                                            className="text-[8px] font-black uppercase tracking-tighter text-purple-600 hover:underline"
                                          >
                                              {allGradeSelected ? 'Deselect All' : 'Select All Sections'}
                                          </button>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                          {sections.map(s => (
                                              <button 
                                                key={s._id} type="button"
                                                onClick={() => {
                                                    let newIds;
                                                    if (selected.includes(s._id)) newIds = selected.filter(id => id !== s._id);
                                                    else newIds = [...selected, s._id];
                                                    updateMatrixSlot(classPicker.r, classPicker.c, 'classIds', newIds);
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${
                                                    selected.includes(s._id) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-400 border-gray-200 hover:border-purple-200'
                                                }`}
                                              >
                                                  {s.section}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                              );
                          });
                      })()}
                  </div>
                  <div className="p-6 border-t border-gray-100 flex justify-end">
                      <button 
                        onClick={() => setClassPicker(null)}
                        className="px-8 py-3 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-purple-600 transition"
                      >
                          Done
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Syllabus Picker Modal */}
      {syllabusPicker && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="p-6 bg-purple-600 text-white flex justify-between items-center">
                      <h3 className="text-xl font-black">
                          Choose Syllabus for {syllabusPicker.classId 
                              ? `${classes.find(c => c._id === syllabusPicker.classId)?.grade}-${classes.find(c => c._id === syllabusPicker.classId)?.section}: ${matrix[syllabusPicker.r][syllabusPicker.c].individualConfigs[syllabusPicker.classId]?.subject}`
                              : matrix[syllabusPicker.r][syllabusPicker.c].subject}
                      </h3>
                      <button onClick={() => setSyllabusPicker(null)} className="p-2 hover:bg-white/20 rounded-xl"><X size={24}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                      {(() => {
                          const slot = matrix[syllabusPicker.r][syllabusPicker.c];
                          const targetClassId = syllabusPicker.classId || slot.classIds?.[0];
                          const targetSubject = syllabusPicker.classId ? slot.individualConfigs[syllabusPicker.classId]?.subject : slot.subject;
                          
                          const sData = (classSyllabi[targetClassId] || []).find(s => s.subject === targetSubject);
                          
                          if (!sData) return <div className="text-center py-10 font-bold text-gray-400">No detailed syllabus found for this subject.</div>;

                          const selectedItems = syllabusPicker.classId 
                              ? (slot.individualConfigs[syllabusPicker.classId]?.selectedSyllabusItems || [])
                              : (slot.selectedSyllabusItems || []);

                          return sData.chapters?.map(ch => {
                              const chText = `Chapter ${ch.chapterNo}: ${ch.title}`;
                              const chTopicItems = ch.topics?.map(t => ({
                                  internal: `C${ch.chapterNo}-T: ${t.title}`,
                                  display: `  • ${t.title}`
                              })) || [];
                              const topicInternals = chTopicItems.map(t => t.internal);
                              const isChSelected = selectedItems.includes(chText);

                              return (
                                  <div key={ch._id} className="space-y-2">
                                      <div 
                                        onClick={() => toggleSyllabusItem(syllabusPicker.r, syllabusPicker.c, chText, topicInternals, null, syllabusPicker.classId)}
                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${isChSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-purple-200'}`}
                                      >
                                          <div className="flex items-center gap-4">
                                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isChSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                  {ch.chapterNo}
                                              </div>
                                              <span className="font-black text-gray-800 text-sm">{ch.title}</span>
                                          </div>
                                          {isChSelected ? <CheckCircle className="text-purple-600" size={20}/> : <div className="w-5 h-5 rounded-full border-2 border-gray-200"></div>}
                                      </div>
                                      
                                      <div className="pl-12 grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {chTopicItems.map((topicItem, tidx) => {
                                              const isTopicSelected = selectedItems.includes(topicItem.internal);
                                              return (
                                                  <div 
                                                    key={tidx}
                                                    onClick={() => toggleSyllabusItem(syllabusPicker.r, syllabusPicker.c, topicItem.internal, [], chText, syllabusPicker.classId)}
                                                    className={`px-4 py-2 rounded-xl border text-[10px] font-bold cursor-pointer transition-all flex justify-between items-center ${isTopicSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-500 border-transparent hover:border-indigo-200'}`}
                                                  >
                                                      {topicItem.display.replace('  • ', '')}
                                                      {isTopicSelected && <Check size={12}/>}
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  </div>
                              );
                          });
                      })()}
                  </div>
                  <div className="p-6 border-t border-gray-100 flex justify-end">
                      <button 
                        onClick={() => setSyllabusPicker(null)}
                        className="px-8 py-3 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-purple-600 transition"
                      >
                          Done
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ExamCellDashboard;
