import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { 
    FileText, PlusCircle, CheckCircle, X, Calendar, 
    Layers, Users, Clock, BookOpen, Trash2, Bell, ShieldCheck, ChevronDown, Check, Printer, Edit, Edit3, Save
} from 'lucide-react';
import Loader from '../../components/Loader';


const ExamCellDashboard = () => {
  const location = useLocation();
  const activeTab = location.pathname.split('/').pop(); // 'dashboard', 'exams', 'marks'

  const [exams, setExams] = useState([]);
  const [classes, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [examCode, setExamCode] = useState(''); // New state for grouping
  
  // Edit State
  const [editingExam, setEditingExam] = useState(null);
  const [editFormData, setEditFormData] = useState({
      subject: '',
      date: '',
      time: '',
      shift: 'Morning',
      maxMarks: 100,
      syllabus: ''
  });

  // Syllabus state
  const [classSyllabi, setClassSyllabi] = useState({}); // { classId: [syllabus1, syllabus2] }
  
  // View State for Schedule
  const [scheduleView, setScheduleView] = useState('list'); // 'list' or 'table'
  const [selectedExamCode, setSelectedExamCode] = useState('');

  const handlePrintAdmitCards = async () => {
    if (!selectedExamCode) return toast.error("Please select an exam cycle first.");
    
    setSubmitting(true);
    try {
        const filteredExams = exams.filter(e => e.examCode === selectedExamCode);
        const classIds = [...new Set(filteredExams.map(e => e.sClass?._id))].filter(Boolean);
        
        if (classIds.length === 0) {
            toast.error("No valid classes found for this exam cycle.");
            return;
        }

        // Fetch all students for these classes
        const studentPromises = classIds.map(id => axios.get(`/student/class/${id}`));
        const studentResponses = await Promise.all(studentPromises);
        const allStudents = studentResponses.flatMap(res => res.data);

        if (allStudents.length === 0) {
            toast.error("No students found in the selected classes.");
            return;
        }

        // Syllabus Parser
        const parseSyllabus = (str) => {
            if (!str) return [];
            return str.split(/[;\n]/).filter(s => s.trim()).map(section => {
                if (section.includes('-')) {
                    const [topic, sub] = section.split('-');
                    const subtopics = sub.split(/[,\~]/).filter(s => s.trim()).map(s => s.trim());
                    return { topic: topic.trim(), subtopics };
                }
                return { topic: section.trim(), subtopics: [] };
            });
        };

        // Generate Print Content
        const printWindow = window.open('', '_blank');
        
        // Build the HTML
        let htmlContent = `
            <html>
                <head>
                    <title>Merged Admit Cards - ${selectedExamCode}</title>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                    <style>
                        @page { size: A4; margin: 0; }
                        body { margin: 0; padding: 0; font-family: sans-serif; -webkit-print-color-adjust: exact; }
                        .page { 
                            width: 210mm; 
                            height: 297mm; 
                            padding: 20mm; 
                            box-sizing: border-box; 
                            background: white; 
                            page-break-after: always; 
                            position: relative;
                        }
                        .back-side {
                            background-color: #f8fafc; /* Light gray background for back side */
                        }
                    </style>
                </head>
                <body>
        `;

        allStudents.forEach(student => {
            // Filter exams for this student's class
            const studentExams = filteredExams.filter(e => e.sClass?._id === (student.sClass?._id || student.sClass));
            
            if (studentExams.length === 0) return;

            // Front Side
            htmlContent += `
                <div class="page">
                    <div class="text-center mb-8 pb-6 border-b-4 border-purple-600">
                        <h1 class="text-4xl font-black text-purple-600 mb-1 uppercase tracking-tighter">Admit Card</h1>
                        <p class="font-bold tracking-[0.2em] text-gray-400 uppercase text-[10px]">Academic Session 2023-2024</p>
                    </div>

                    <div class="flex gap-10 mb-10 items-start">
                        <div class="w-32 h-40 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                            ${student.profileImage ? 
                                `<img src="${student.profileImage}" alt="Profile" class="w-full h-full object-cover" />` : 
                                `<span class="text-gray-300 font-black text-[10px] uppercase text-center p-4">Student Photo</span>`
                            }
                        </div>
                        <div class="flex-1 grid grid-cols-2 gap-y-6 gap-x-10">
                            <div>
                                <label class="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Student Name</label>
                                <p class="text-base font-black text-gray-900 truncate">${student.name.toUpperCase()}</p>
                            </div>
                            <div>
                                <label class="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Roll Number</label>
                                <p class="text-base font-black text-gray-900 font-mono">#${student.rollNum}</p>
                            </div>
                            <div>
                                <label class="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Class & Section</label>
                                <p class="text-base font-black text-gray-900">${student.sClass?.grade || 'N/A'}-${student.sClass?.section || 'N/A'}</p>
                            </div>
                            <div>
                                <label class="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Examination</label>
                                <p class="text-base font-black text-purple-600">${selectedExamCode}</p>
                            </div>
                        </div>
                    </div>

                    <div class="flex-1">
                        <table class="w-full border-collapse">
                            <thead>
                                <tr class="text-left border-b-2 border-gray-900">
                                    <th class="py-4 text-[10px] font-black uppercase tracking-widest">Date</th>
                                    <th class="py-4 text-[10px] font-black uppercase tracking-widest">Subject</th>
                                    <th class="py-4 text-[10px] font-black uppercase tracking-widest text-center">Time</th>
                                    <th class="py-4 text-[10px] font-black uppercase tracking-widest text-right">Invigilator</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                ${studentExams.map(ex => `
                                    <tr>
                                        <td class="py-4 font-bold text-xs">${new Date(ex.date).toLocaleDateString()}</td>
                                        <td class="py-4 font-black text-purple-600 uppercase text-xs">${ex.subject}</td>
                                        <td class="py-4 font-bold text-gray-600 text-center text-xs">${ex.time || '09:00 AM'}</td>
                                        <td class="py-4 border-b border-gray-200"></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="mt-10 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                        <h5 class="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-3">Important Instructions</h5>
                        <ul class="text-[9px] text-gray-500 font-bold space-y-1 list-disc pl-4 leading-relaxed">
                            <li>Candidates must carry this original admit card and school ID for every session.</li>
                            <li>Electronic gadgets, smartwatches, and programmable calculators are prohibited.</li>
                            <li>Misconduct or use of unfair means will lead to immediate disqualification.</li>
                        </ul>
                    </div>

                    <div class="absolute bottom-20 left-20 right-20 flex justify-between items-end">
                        <div class="text-center">
                            <div class="w-40 border-b-2 border-gray-900 mb-2"></div>
                            <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Student Signature</p>
                        </div>
                        <div class="text-center">
                            <div class="w-40 border-b-2 border-gray-900 mb-2"></div>
                            <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Controller of Exams</p>
                        </div>
                    </div>
                </div>

                <!-- Back Side: Syllabus -->
                <div class="page back-side">
                    <div class="text-center mb-10 pb-6 border-b-4 border-gray-300">
                        <h1 class="text-3xl font-black text-gray-400 mb-1">EXAMINATION SYLLABUS</h1>
                        <p class="font-bold tracking-[0.2em] text-gray-400 uppercase text-xs">${selectedExamCode} - Back Side Reference</p>
                    </div>

                    <div class="space-y-6">
                        ${studentExams.map(ex => {
                            const parsed = parseSyllabus(ex.syllabus);
                            return `
                                <div class="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
                                    <h3 class="text-lg font-black text-purple-600 uppercase mb-4 border-b pb-2">${ex.subject}</h3>
                                    <div class="space-y-4">
                                        ${parsed.length > 0 ? parsed.map(item => `
                                            <div class="space-y-1.5">
                                                <div class="text-sm font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                                                    <span class="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                                    ${item.topic}
                                                </div>
                                                ${item.subtopics.length > 0 ? `
                                                    <div class="ml-4 flex flex-wrap gap-x-4 gap-y-1">
                                                        ${item.subtopics.map(sub => `
                                                            <div class="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                                                                <span class="text-purple-300">•</span>
                                                                ${sub}
                                                            </div>
                                                        `).join('')}
                                                    </div>
                                                ` : ''}
                                            </div>
                                        `).join('') : '<p class="text-gray-400 italic">Refer to class curriculum.</p>'}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="absolute bottom-10 left-0 right-0 text-center">
                        <p class="text-[8px] font-black text-gray-300 uppercase tracking-[0.5em]">This document is for academic reference only</p>
                    </div>
                </div>
            `;
        });

        htmlContent += `
                <script>
                    window.onload = () => {
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 1000);
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();

    } catch (error) {
        console.error("Print error", error);
        toast.error("Failed to generate admit cards.");
    } finally {
        setSubmitting(false);
    }
  };

  const handleEditExam = (exam) => {
      setEditingExam(exam);
      setEditFormData({
          subject: exam.subject,
          date: exam.date.split('T')[0],
          time: exam.time,
          shift: exam.shift,
          maxMarks: exam.maxMarks,
          syllabus: exam.syllabus
      });
  };

  const handleUpdateExam = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      try {
          await axios.put(`/exam/update/${editingExam._id}`, editFormData);
          toast.success("Exam details updated");
          setEditingExam(null);
          fetchExams();
      } catch (error) {
          toast.error("Update failed");
      } finally {
          setSubmitting(false);
      }
  };

  const handleDeleteExam = async (id) => {
      if (!window.confirm("Are you sure you want to delete this exam paper?")) return;
      setSubmitting(true);
      try {
          await axios.delete(`/exam/delete/${id}`);
          toast.success("Exam deleted successfully");
          fetchExams();
      } catch (error) {
          toast.error("Deletion failed");
      } finally {
          setSubmitting(false);
      }
  };

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
      
      // Auto-select the latest exam code for table view
      const codes = [...new Set(res.data.map(e => e.examCode))].filter(Boolean);
      if (codes.length > 0 && !selectedExamCode) {
          setSelectedExamCode(codes[codes.length - 1]);
      }
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

  const getTableData = () => {
      if (!selectedExamCode) return { dates: [], rows: [] };
      
      const filteredExams = exams.filter(e => e.examCode === selectedExamCode);
      const uniqueDates = [...new Set(filteredExams.map(e => new Date(e.date).toISOString().split('T')[0]))].sort();
      
      const classMap = {}; // { classId: { className, dates: { [date]: subject } } }
      
      filteredExams.forEach(e => {
          const classId = e.sClass?._id;
          if (!classId) return;
          
          if (!classMap[classId]) {
              classMap[classId] = {
                  name: `${e.sClass.grade}-${e.sClass.section}`,
                  dates: {}
              };
          }
          classMap[classId].dates[new Date(e.date).toISOString().split('T')[0]] = e.subject;
      });

      return {
          dates: uniqueDates,
          rows: Object.values(classMap)
      };
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
              // Fetch syllabus for ALL selected classes
              value.forEach(id => fetchSyllabusForClass(id));
              
              // Reset common subject and syllabus if class list changes
              updated[r][c].subject = '';
              updated[r][c].syllabus = '';
              updated[r][c].selectedSyllabusItems = [];
              
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
          for (let j = i + 1; j < examsToCreate.length; j++) {
              const e2 = examsToCreate[j];
              if (e1.sClass === e2.sClass && e1.date === e2.date && e1.shift === e2.shift) {
                  const cls = allClasses.find(c => c._id === e1.sClass);
                  return `Conflict: Class ${cls.grade}-${cls.section} has multiple exams scheduled for ${e1.date} in the ${e1.shift} shift.`;
              }
          }
          const existingConflict = exams.find(ex => 
              ex.sClass?._id === e1.sClass && 
              new Date(ex.date).toISOString().split('T')[0] === e1.date && 
              ex.shift === e1.shift
          );
          if (existingConflict) {
              const cls = allClasses.find(c => c._id === e1.sClass);
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
          if (!examCode) return toast.error("Please provide an Exam Code for this session.");
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
                              const cls = allClasses.find(cl => cl._id === clsId);
                              toast.error(`Please select a subject for ${cls.grade}-${cls.section} at D${r+1} Slot ${c+1}`);
                              throw new Error("Missing subject");
                          }
                          examsToCreate.push({
                              name: subType,
                              examCode: examCode,
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
          if (!compData.date || !compData.topic || selectedClasses.length === 0) {
              return toast.error("Please fill all required fields for competitive exam");
          }
          const cCode = `COMP_${compData.topic.toUpperCase().replace(/\s+/g, '_')}_${new Date().getFullYear()}`;
          selectedClasses.forEach(clsId => {
              examsToCreate.push({
                  name: `Competitive: ${compData.topic}`,
                  examCode: cCode,
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

      setSubmitting(true);
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
      } finally {
          setSubmitting(false);
      }
  };

  if (loading) return <Loader fullScreen text="Accessing Exam Schedules..." />;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {submitting && <Loader fullScreen text="Processing Examination Records..." />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <FileText className="text-purple-600" size={36} /> Exam Cell
            </h1>
            <p className="text-gray-500 font-bold ml-1 uppercase text-[10px] tracking-widest mt-2">Manage Academic & Competitive Assessments</p>
          </div>
          {(activeTab === 'dashboard' || activeTab === 'exams') && (
            <button 
                onClick={() => {
                    setShowCreateModal(true);
                    handleMatrixResize(1, 1);
                }}
                className="px-6 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-purple-700 transition shadow-lg shadow-purple-100 flex items-center gap-2"
            >
                <PlusCircle size={20} /> Generate Exams
            </button>
          )}
      </div>
      
      {activeTab === 'dashboard' && (
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
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Academic Phases</div>
            <div className="text-4xl font-black text-green-600">{[...new Set(exams.map(e => e.examCode))].length}</div>
            </div>
        </div>
      )}

      {(activeTab === 'dashboard' || activeTab === 'exams') && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-xl font-black text-gray-800">
                    {activeTab === 'dashboard' ? 'Overview' : 'Exam Schedule Management'}
                </h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Repository of all scheduled assessments</p>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-xl items-center self-stretch md:self-auto">
                <button 
                    onClick={() => setScheduleView('list')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${scheduleView === 'list' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Master List
                </button>
                <button 
                    onClick={() => setScheduleView('table')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${scheduleView === 'table' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Schedule Matrix
                </button>
            </div>
            </div>

            {scheduleView === 'table' ? (
                <div className="p-8 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-600 text-white rounded-lg"><Layers size={18}/></div>
                            <h3 className="font-black text-gray-700 uppercase tracking-wider text-xs">Select Exam Cycle</h3>
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                            <select 
                                className="p-3 bg-white border border-gray-200 rounded-xl font-black text-xs text-purple-600 outline-none focus:ring-4 focus:ring-purple-50 min-w-[250px]"
                                value={selectedExamCode}
                                onChange={(e) => setSelectedExamCode(e.target.value)}
                            >
                                <option value="">Choose Cycle</option>
                                {[...new Set(exams.map(e => e.examCode))].filter(Boolean).map(code => (
                                    <option key={code} value={code}>{code}</option>
                                ))}
                            </select>
                            <button 
                                onClick={handlePrintAdmitCards}
                                disabled={!selectedExamCode}
                                className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-purple-600 transition-all shadow-xl shadow-gray-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Printer size={16} /> Print Admit Cards
                            </button>
                        </div>
                    </div>

                    {(() => {
                        const { dates: tableDates, rows: tableRows } = getTableData();
                        if (tableDates.length === 0) return <div className="py-20 text-center font-bold text-gray-400 italic bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">Please select or generate an exam cycle to view the matrix.</div>;
                        
                        return (
                            <div className="overflow-x-auto rounded-3xl border border-gray-100">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead className="bg-gray-900 text-white">
                                        <tr>
                                            <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/10 sticky left-0 bg-gray-900 z-10">Class \ Date</th>
                                            {tableDates.map(d => (
                                                <th key={d} className="py-6 px-8 text-center border-r border-white/10">
                                                    <div className="text-[10px] font-black uppercase tracking-widest">{new Date(d).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                                    <div className="text-xs font-black text-purple-400">{new Date(d).toLocaleDateString()}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {tableRows.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-purple-50/30 transition-colors group">
                                                <td className="py-6 px-8 font-black text-gray-800 border-r border-gray-100 sticky left-0 bg-white group-hover:bg-purple-50/30 z-10">
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] uppercase">{row.name}</span>
                                                </td>
                                                {tableDates.map(d => (
                                                    <td key={d} className="py-6 px-8 border-r border-gray-100 text-center">
                                                        {row.dates[d] ? (
                                                            <div className="flex flex-col items-center">
                                                                <div className="text-xs font-black text-indigo-600 uppercase tracking-tight">{row.dates[d]}</div>
                                                                <div className="text-[8px] font-bold text-gray-400 uppercase mt-1">CONFIRMED</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-200 font-black">--</span>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })()}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="py-6 px-8">Exam Name / Code</th>
                                <th className="py-6 px-8">Class</th>
                                <th className="py-6 px-8">Subject</th>
                                <th className="py-6 px-8">Schedule</th>
                                <th className="py-6 px-8 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(activeTab === 'dashboard' ? exams.slice(0, 10) : exams).map(exam => (
                                <tr key={exam._id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="py-6 px-8">
                                        <div className="font-black text-gray-800">{exam.name}</div>
                                        <div className="text-[10px] font-black text-purple-600 uppercase tracking-tighter">{exam.examCode || 'NO_CODE'}</div>
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
                                    <td className="py-6 px-8 text-center">
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleEditExam(exam)}
                                                className="p-2.5 bg-white text-blue-600 rounded-xl shadow-sm border border-slate-100 hover:bg-blue-600 hover:text-white transition-all"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteExam(exam._id)}
                                                className="p-2.5 bg-white text-rose-400 rounded-xl shadow-sm border border-slate-100 hover:bg-rose-600 hover:text-white transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {exams.length === 0 && <p className="text-gray-400 font-bold text-center py-20 italic">No exams recorded in the database...</p>}
                </div>
            )}
        </div>
      )}

      {/* Edit Exam Modal */}
      {editingExam && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                  <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
                      <div>
                          <h2 className="text-2xl font-black uppercase tracking-tight">Edit Assessment</h2>
                          <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">Refine schedule for {editingExam.sClass?.grade}-{editingExam.sClass?.section}</p>
                      </div>
                      <button onClick={() => setEditingExam(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleUpdateExam} className="p-10 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                              <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" value={editFormData.subject} onChange={e => setEditFormData({...editFormData, subject: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Exam Date</label>
                              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" value={editFormData.date} onChange={e => setEditFormData({...editFormData, date: e.target.value})} />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Max Marks</label>
                              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" value={editFormData.maxMarks} onChange={e => setEditFormData({...editFormData, maxMarks: parseInt(e.target.value) || 0})} />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shift</label>
                              <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" value={editFormData.shift} onChange={e => setEditFormData({...editFormData, shift: e.target.value})}>
                                  <option>Morning</option>
                                  <option>Noon</option>
                                  <option>Evening</option>
                              </select>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reporting Time</label>
                          <input type="text" placeholder="09:00 AM" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" value={editFormData.time} onChange={e => setEditFormData({...editFormData, time: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Syllabus Scope</label>
                          <textarea className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm min-h-[120px]" value={editFormData.syllabus} onChange={e => setEditFormData({...editFormData, syllabus: e.target.value})} />
                      </div>
                      <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                          <Save size={18} /> Update Assessment
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default ExamCellDashboard;

