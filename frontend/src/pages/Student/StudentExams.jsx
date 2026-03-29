import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOutletContext } from 'react-router-dom';
import { FaCalendarAlt, FaPoll, FaClipboardList, FaCheckCircle, FaExclamationCircle, FaIdCard, FaClock, FaTimes, FaPrint, FaEye } from 'react-icons/fa';

const StudentExams = () => {
  const { student } = useOutletContext();
  const [activeTab, setActiveTab] = useState('scheduled'); 
  const [exams, setExams] = useState([]);
  const [marksData, setMarksData] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [viewingAdmitCard, setViewingAdmitCard] = useState(null); // { name, subjects }
  const [viewingSyllabus, setViewingSyllabus] = useState(null); // { subject, syllabus }
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      if (!student || !student.sClass) return;
      setLoading(true);
      try {
        // 1. Get All Exams for the class
        const examRes = await api.get(`/exam/${student.sClass._id}`);
        const allExams = examRes.data;
        
        // Sort exams by date (newest first for results, but let's just keep them)
        const sortedExams = allExams.sort((a, b) => new Date(b.date) - new Date(a.date));
        setExams(sortedExams);

        // 2. Get Marks for each exam
        const marksMap = {};
        await Promise.all(sortedExams.map(async (exam) => {
            try {
                const marksRes = await api.get(`/marks/${exam._id}/${student._id}`);
                marksMap[exam._id] = marksRes.data;
            } catch (err) {
                marksMap[exam._id] = [];
            }
        }));
        
        setMarksData(marksMap);
      } catch (e) {
        console.error("Error fetching exam data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [student]);

  const now = new Date();
  const scheduledExams = exams.filter(exam => new Date(exam.date) >= now);

  const getDaysRemaining = (examDate) => {
    const diffTime = new Date(examDate) - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} Days Left`;
  };
  
  // Group scheduled exams by exam name (e.g. "Midterm 2026")
  const groupedExams = scheduledExams.reduce((acc, exam) => {
    if (!acc[exam.name]) acc[exam.name] = [];
    acc[exam.name].push(exam);
    return acc;
  }, {});

  const handlePrint = (divId, examName) => {
      const printContents = document.getElementById(divId).innerHTML;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
            <head>
                <title>Admit Card - ${examName}</title>
                <style>
                    body { margin: 0; padding: 20px; font-family: sans-serif; }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                ${printContents}
                <script>
                    window.onload = () => {
                        window.print();
                        window.close();
                    }
                </script>
            </body>
        </html>
      `);
      printWindow.document.close();
  };

  const calculateTotal = (marksArray) => {
      if (!marksArray) return 0;
      return marksArray.reduce((acc, curr) => acc + curr.score, 0);
  };

  const AdmitCardTemplate = ({ examName, subjects }) => (
    <div className="text-slate-900 h-full flex flex-col bg-white">
        <div className="text-center mb-10 pb-6 border-b-4 border-indigo-600">
            <h1 className="text-4xl font-black text-indigo-600 mb-1">EXAMINATION ADMIT CARD</h1>
            <p className="font-bold tracking-[0.2em] text-slate-400 uppercase text-sm">Academic Session 2023-2024</p>
        </div>

        <div className="flex gap-10 mb-10 items-start">
            <div className="w-40 h-48 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                {student.profileImage ? (
                    <img src={student.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-slate-300 font-black text-xs uppercase">Student Photo</span>
                )}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-y-6 gap-x-10">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Student Name</label>
                    <p className="text-lg font-black text-slate-900 truncate">{student.name.toUpperCase()}</p>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Roll Number</label>
                    <p className="text-lg font-black text-slate-900 font-mono">#{student.rollNum}</p>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Class & Section</label>
                    <p className="text-lg font-black text-slate-900">{student.sClass?.grade}-{student.sClass?.section}</p>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Examination</label>
                    <p className="text-lg font-black text-indigo-600">{examName.toUpperCase()}</p>
                </div>
            </div>
        </div>

        <div className="flex-1">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="text-left border-b-2 border-slate-900">
                        <th className="py-4 text-xs font-black uppercase tracking-widest">Date</th>
                        <th className="py-4 text-xs font-black uppercase tracking-widest">Subject</th>
                        <th className="py-4 text-xs font-black uppercase tracking-widest text-center">Time</th>
                        <th className="py-4 text-xs font-black uppercase tracking-widest text-right">Invigilator Signature</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {subjects.map((sub, sIdx) => (
                        <tr key={sIdx}>
                            <td className="py-5 font-bold text-sm">{new Date(sub.date).toLocaleDateString()}</td>
                            <td className="py-5 font-black text-indigo-600 uppercase text-sm">{sub.subject}</td>
                            <td className="py-5 font-bold text-slate-600 text-center text-sm">09:00 AM</td>
                            <td className="py-5 border-b border-slate-200"></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Syllabus Section on Admit Card */}
        <div className="mt-10 pt-6 border-t border-slate-100">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Exam Syllabus Reference</h5>
            <div className="grid grid-cols-2 gap-6">
                {subjects.map((sub, sIdx) => (
                    <div key={sIdx} className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">{sub.subject}</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight">{sub.syllabus || "Refer to class notes"}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="mt-10 flex justify-between items-end px-10">
            <div className="text-center">
                <div className="w-48 border-b-2 border-slate-900 mb-2"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Signature</p>
            </div>
            <div className="text-center">
                <div className="w-48 border-b-2 border-slate-900 mb-2"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Controller of Exams</p>
            </div>
        </div>

        <div className="mt-16 p-8 bg-slate-50 rounded-3xl border border-slate-100">
            <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3">Important Instructions</h5>
            <ul className="text-[10px] text-slate-500 font-bold space-y-1 list-disc pl-4 leading-relaxed">
                <li>Reporting time is strictly 30 minutes before the examination starts.</li>
                <li>Candidates must carry this original admit card and school ID for every session.</li>
                <li>Electronic gadgets, smartwatches, and programmable calculators are prohibited.</li>
                <li>Misconduct or use of unfair means will lead to immediate disqualification.</li>
            </ul>
        </div>
    </div>
  );

  const handleUnifiedPrint = (examData) => {
      const printWindow = window.open('', '_blank');
      const html = document.getElementById(`printable-admit-card`).innerHTML;
      
      printWindow.document.write(`
        <html>
            <head>
                <title>Admit Card - ${examData.name}</title>
                <style>
                    @page { size: A4; margin: 0; }
                    body { margin: 0; padding: 0; font-family: sans-serif; -webkit-print-color-adjust: exact; }
                    .a4-container { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; background: white; }
                </style>
                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            </head>
            <body>
                <div class="a4-container">
                    ${html}
                </div>
                <script>
                    window.onload = () => {
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    }
                </script>
            </body>
        </html>
      `);
      printWindow.document.close();
  };

  const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text);
      toast.success("Syllabus copied to clipboard!");
  };

  const SyllabusModal = ({ subject, syllabus, onClose }) => (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 bg-indigo-600 text-white">
                <div className="flex justify-between items-start mb-6">
                    <div className="bg-white/20 p-3 rounded-2xl">
                        <FaClipboardList size={24}/>
                    </div>
                    <button onClick={onClose} className="text-white/60 hover:text-white transition">
                        <FaTimes size={20}/>
                    </button>
                </div>
                <h3 className="text-2xl font-black tracking-tight">{subject}</h3>
                <p className="text-indigo-100 font-bold text-xs uppercase tracking-widest mt-1">Examination Syllabus</p>
            </div>
            <div className="p-8">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-6">
                    <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{syllabus || "No syllabus details available for this test."}</p>
                </div>
                <button 
                    onClick={() => { copyToClipboard(syllabus); onClose(); }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
                >
                    Copy to Clipboard
                </button>
            </div>
        </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-slate-400 font-black uppercase tracking-widest text-fluid-xs">Syncing Academic Records...</div>
    </div>
  );

  return (
    <div className="space-y-12 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
                <h1 className="text-fluid-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                    <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-600">
                        <FaClipboardList />
                    </div>
                    Academic Assessments
                </h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 ml-14">Exams, Results & Credentials</p>
            </div>
            
            <div className="flex bg-white p-1.5 rounded-2xl shadow-soft border border-slate-50">
                {['scheduled', 'admit-card', 'results'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {tab.replace('-', ' ')}
                    </button>
                ))}
            </div>
        </div>

        {/* Admit Card Preview Modal */}
        {viewingAdmitCard && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto" onClick={() => setViewingAdmitCard(null)}>
                <div className="relative flex flex-col items-center animate-in fade-in zoom-in duration-300 max-w-full" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between w-full gap-3 mb-4 px-2">
                        <div className="text-white/40 text-[10px] font-black uppercase tracking-widest self-center">A4 Preview • Digital Hall Ticket</div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleUnifiedPrint(viewingAdmitCard)}
                                className="bg-white px-4 py-2 rounded-full text-slate-900 hover:bg-indigo-50 hover:text-indigo-600 transition shadow-xl flex items-center gap-2 font-black uppercase tracking-widest text-[9px]"
                            >
                                <FaPrint /> Print
                            </button>
                            <button 
                                onClick={() => setViewingAdmitCard(null)}
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-2 rounded-full text-white transition border border-white/10"
                            >
                                <FaTimes size={12}/>
                            </button>
                        </div>
                    </div>
                    
                    {/* A4 Container with fixed aspect ratio and responsive scaling */}
                    <div className="bg-white shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative flex items-center justify-center rounded-lg" 
                         style={{ 
                            height: '80vh', 
                            aspectRatio: '210/297',
                            maxHeight: 'calc(95vw * 297/210)',
                            maxWidth: '95vw'
                         }}>
                        <div className="origin-center" style={{ 
                            transform: 'scale(calc(min(80vh, 95vw * 297/210) / 297mm))',
                            width: '210mm', 
                            height: '297mm',
                            flexShrink: 0
                        }}>
                             <div className="p-[15mm] h-full bg-white">
                                <AdmitCardTemplate examName={viewingAdmitCard.name} subjects={viewingAdmitCard.subjects} />
                             </div>
                        </div>
                    </div>
                </div>
                
                {/* Hidden container for print content extraction */}
                <div id="printable-admit-card" className="hidden">
                    <div style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
                        <AdmitCardTemplate examName={viewingAdmitCard.name} subjects={viewingAdmitCard.subjects} />
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'scheduled' ? (
            <div className="space-y-8">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                        <FaCalendarAlt />
                    </div>
                    Schedule Timeline
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scheduledExams.length > 0 ? (
                        scheduledExams.map(exam => {
                            const daysRemaining = getDaysRemaining(exam.date);
                            const isUrgent = daysRemaining === "Today" || daysRemaining === "Tomorrow" || parseInt(daysRemaining) <= 3;

                            return (
                                <div 
                                    key={exam._id} 
                                    onClick={() => setViewingSyllabus({ subject: exam.subject, syllabus: exam.syllabus })}
                                    className="bg-white p-6 rounded-[2rem] shadow-soft hover:shadow-xl transition-all group border border-transparent hover:border-blue-100 flex flex-col h-full relative overflow-hidden cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex- gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-lg w-fit border border-blue-100/50">Scheduled</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border w-fit flex items-center gap-1 ${isUrgent ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                {daysRemaining}
                                            </span>
                                        </div>
                                        <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                            <FaEye size={12}/>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 mt-1 group-hover:text-blue-600 transition-colors leading-tight mb-4">
                                        <span className="text-indigo-500 font-mono mr-2">{exam.time || '09:00 AM'}</span>
                                        {exam.name}
                                    </h3>
                                    
                                    <div className="mt-auto space-y-2.5 pt-4 border-t border-slate-50">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Subject</span>
                                            <span className="font-bold text-slate-700">{exam.subject}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Date</span>
                                            <span className="font-bold text-slate-700">{new Date(exam.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Max Marks</span>
                                            <span className="font-bold text-slate-700">{exam.maxMarks} pts</span>
                                        </div>
                                        <div className="pt-2">
                                            <button className="text-[9px] font-black uppercase text-indigo-600 flex items-center gap-1">
                                                <FaClipboardList /> View Syllabus
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-20 text-center bg-white rounded-[3rem] shadow-soft border-2 border-dashed border-slate-100">
                            <FaExclamationCircle className="mx-auto text-4xl text-slate-200 mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No upcoming assessments detected</p>
                        </div>
                    )}
                </div>
            </div>
        ) : activeTab === 'admit-card' ? (
            <div className="space-y-8">
                 <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                        <FaIdCard />
                    </div>
                    Admit Hall Tickets
                </h2>
                
                {Object.keys(groupedExams).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(groupedExams).map(([examName, subjects], idx) => (
                            <div key={idx} className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-50 flex flex-col justify-between group hover:shadow-xl transition-all">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xl font-black group-hover:bg-indigo-600 transition-colors shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 leading-tight">{examName}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subjects.length} Subjects Evaluated</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setViewingAdmitCard({ name: examName, subjects })}
                                        className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <FaEye /> View
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setViewingAdmitCard({ name: examName, subjects });
                                            setTimeout(() => handleUnifiedPrint({ name: examName, subjects }), 100);
                                        }}
                                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                                    >
                                        <FaPrint /> Print
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-white rounded-[3rem] shadow-soft border-2 border-dashed border-slate-100">
                        <FaExclamationCircle className="mx-auto text-4xl text-slate-200 mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Admit cards will be available near exam dates</p>
                    </div>
                )}
            </div>
        ) : (
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="bg-teal-50 p-2 rounded-xl text-teal-600">
                            <FaPoll />
                        </div>
                        Performance Transcript
                    </h2>

                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <div className="flex-1 md:w-48">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Category</label>
                            <select 
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                            >
                                <option value="All">All Types</option>
                                <option value="Main Exam">Main Exam</option>
                                <option value="Class Test">Class Test</option>
                            </select>
                        </div>
                        <div className="flex-1 md:w-48">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Subject</label>
                            <select 
                                value={filterSubject}
                                onChange={(e) => setFilterSubject(e.target.value)}
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                            >
                                <option value="All">All Subjects</option>
                                {[...new Set(exams.map(e => e.subject))].sort().map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {exams.filter(e => {
                        const categoryMatch = filterCategory === 'All' || e.type === filterCategory;
                        const subjectMatch = filterSubject === 'All' || e.subject === filterSubject;
                        return categoryMatch && subjectMatch;
                    }).length > 0 ? (
                        exams.filter(e => {
                            const categoryMatch = filterCategory === 'All' || e.type === filterCategory;
                            const subjectMatch = filterSubject === 'All' || e.subject === filterSubject;
                            return categoryMatch && subjectMatch;
                        }).map(exam => {
                            const examMarks = marksData[exam._id] || [];
                            const hasResults = examMarks.length > 0;
                            const score = calculateTotal(examMarks);
                            const percentage = hasResults ? (score / exam.maxMarks) * 100 : 0;
                            
                            return (
                                <div key={exam._id} className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-all space-y-4">
                                    {/* Row 1: Exam Type and Status */}
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${exam.type === 'Main Exam' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {exam.type}
                                        </span>
                                        {hasResults ? (
                                            <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${percentage >= 40 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {percentage >= 40 ? <FaCheckCircle /> : <FaExclamationCircle />}
                                                {percentage >= 40 ? 'Passed' : 'Failed'}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                                                <FaClock /> Evaluation
                                            </div>
                                        )}
                                    </div>

                                    {/* Row 2: Subject/Date and Score */}
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 leading-none">{exam.subject}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{exam.name} • {new Date(exam.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            {hasResults ? (
                                                <>
                                                    <p className="text-xl font-black text-slate-900 leading-none">{score} <span className="text-xs text-slate-400">/ {exam.maxMarks}</span></p>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1.5 ${percentage >= 75 ? 'text-teal-600' : 'text-slate-400'}`}>{percentage.toFixed(1)}%</p>
                                                </>
                                            ) : (
                                                <p className="text-xs font-black text-slate-200 uppercase tracking-widest">Awaiting result</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FaPoll className="text-slate-200 text-3xl" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Results Found</h3>
                            <p className="text-slate-400 font-bold text-xs mt-2">Adjust your filters to see more performance records</p>
                            <button 
                                onClick={() => { setFilterCategory('All'); setFilterSubject('All'); }}
                                className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {viewingSyllabus && (
            <SyllabusModal 
                subject={viewingSyllabus.subject} 
                syllabus={viewingSyllabus.syllabus} 
                onClose={() => setViewingSyllabus(null)} 
            />
        )}
    </div>
  );
};

export default StudentExams;