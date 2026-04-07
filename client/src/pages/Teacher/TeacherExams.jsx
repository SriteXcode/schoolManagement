import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
    FaCalendarAlt, FaSearch, FaClipboardList, FaClock, 
    FaUserGraduate, FaLayerGroup, FaBookOpen, FaFilter 
} from 'react-icons/fa';

const TeacherExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamCode, setSelectedExamCode] = useState('');
  const [viewingSyllabus, setViewingSyllabus] = useState(null); // { subject, syllabus }

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exam/all');
      setExams(res.data);
    } catch (err) {
      toast.error("Failed to load examinations");
    } finally {
      setLoading(false);
    }
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

  const SyllabusRenderer = ({ syllabus, compact = false }) => {
      const parsed = parseSyllabus(syllabus);
      if (parsed.length === 0) return <p className="text-slate-400 italic text-[10px]">No details available.</p>;

      if (compact) {
          return (
              <div className="flex flex-wrap gap-1">
                  {parsed.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black uppercase">
                          {item.topic}
                      </span>
                  ))}
                  {parsed.length > 3 && <span className="text-[8px] font-bold text-slate-300">+{parsed.length - 3} more</span>}
              </div>
          );
      }

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
                                  <div key={sIdx} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                      <span className="text-indigo-300">•</span>
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

  const SyllabusModal = ({ data, onClose }) => (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 bg-indigo-600 text-white">
                <div className="flex justify-between items-start mb-6">
                    <div className="bg-white/20 p-3 rounded-2xl">
                        <FaClipboardList size={24}/>
                    </div>
                    <button onClick={onClose} className="text-white/60 hover:text-white transition">
                        <FaTimes size={20}/>
                    </button>
                </div>
                <h3 className="text-2xl font-black tracking-tight uppercase">{data.subject}</h3>
                <p className="text-indigo-100 font-bold text-xs uppercase tracking-widest mt-1">Detailed Examination Scope</p>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <SyllabusRenderer syllabus={data.syllabus} />
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100">
                    Close Preview
                </button>
            </div>
        </div>
    </div>
  );

  const examCodes = [...new Set(exams.map(e => e.examCode))].filter(Boolean);

  const filteredExams = exams.filter(exam => {
      const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCode = !selectedExamCode || exam.examCode === selectedExamCode;
      return matchesSearch && matchesCode;
  });

  // Group by Exam Code if filtered by code, otherwise group by name
  const groupedExams = filteredExams.reduce((acc, exam) => {
      const key = selectedExamCode ? exam.examCode : (exam.examCode || exam.name);
      if (!acc[key]) acc[key] = [];
      acc[key].push(exam);
      return acc;
  }, {});

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-indigo-600 uppercase tracking-widest">Synchronizing Examination Database...</div>;

  return (
    <div className="space-y-10 max-w-7xl mx-auto py-6">
        {/* Header content ... same as before */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <FaClipboardList className="text-indigo-600" /> Exam Timetable
                </h1>
                <p className="text-slate-500 font-bold ml-1 uppercase text-[10px] tracking-widest mt-2">Search and view global academic assessment schedules</p>
            </div>

            <div className="flex flex-wrap gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search subject or name..." 
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm shadow-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative flex-1 md:w-64">
                    <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                    <select 
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl font-black text-xs text-indigo-600 shadow-sm focus:ring-4 focus:ring-indigo-50 transition-all outline-none uppercase tracking-widest appearance-none"
                        value={selectedExamCode}
                        onChange={(e) => setSelectedExamCode(e.target.value)}
                    >
                        <option value="">All Exam Cycles</option>
                        {examCodes.map(code => (
                            <option key={code} value={code}>{code}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        <div className="space-y-12">
            {Object.keys(groupedExams).length > 0 ? Object.entries(groupedExams).map(([code, list]) => (
                <div key={code} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-4 px-2">
                        <div className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100">
                            {code}
                        </div>
                        <div className="h-px flex-1 bg-slate-100"></div>
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                            {list.length} PAPERS SCHEDULED
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {list.sort((a, b) => new Date(a.date) - new Date(b.date)).map(exam => (
                            <div key={exam._id} className="bg-white p-8 rounded-[2rem] shadow-soft border border-slate-50 hover:border-indigo-200 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100/50 transition-colors"></div>
                                
                                <div className="relative z-10 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h3 className="font-black text-slate-800 text-lg uppercase leading-tight">{exam.subject}</h3>
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{exam.name}</p>
                                        </div>
                                        <button 
                                            onClick={() => setViewingSyllabus(exam)}
                                            className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors"
                                        >
                                            <FaBookOpen size={20} />
                                        </button>
                                    </div>

                                    {/* Syllabus Preview */}
                                    <div className="space-y-2">
                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Syllabus Scope</div>
                                        <SyllabusRenderer syllabus={exam.syllabus} compact={true} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                <FaCalendarAlt size={8} /> Date
                                            </div>
                                            <div className="text-xs font-black text-slate-700">{new Date(exam.date).toLocaleDateString()}</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                <FaClock size={8} /> Shift
                                            </div>
                                            <div className="text-xs font-black text-slate-700">{exam.shift}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black uppercase">
                                                {exam.sClass?.grade}
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-800 uppercase">Class {exam.sClass?.grade}-{exam.sClass?.section}</div>
                                                <div className="text-[8px] font-bold text-slate-400 uppercase">Target Audience</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-slate-800 uppercase">{exam.time || '09:00 AM'}</div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase">Reporting</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )) : (
                <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaSearch size={32} className="text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">No Examinations Found</h3>
                    <p className="text-slate-400 font-bold mt-2 italic">Try adjusting your search filters or selecting a different exam cycle.</p>
                </div>
            )}
        </div>

        {viewingSyllabus && (
            <SyllabusModal data={viewingSyllabus} onClose={() => setViewingSyllabus(null)} />
        )}
    </div>
  );
};

import { FaTimes } from 'react-icons/fa';

export default TeacherExams;
