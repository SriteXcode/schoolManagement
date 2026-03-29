import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
    FaSearch, FaChevronRight, FaGraduationCap, FaArrowLeft, 
    FaChartLine, FaExclamationTriangle, FaCheckCircle, FaTrashAlt, FaPlus, FaTimes
} from 'react-icons/fa';

const SyllabusOverview = () => {
  const [syllabusList, setSyllabusList] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Navigation State
  const [view, setView] = useState('classes'); // 'classes', 'subjects', 'details'
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
      classId: '',
      subject: '',
      teacherId: '',
      academicYear: '2023-2024'
  });
  const [availableSubjects, setAvailableSubjects] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [syllabusRes, classesRes] = await Promise.all([
          api.get('/syllabus/all'),
          api.get('/class/getall')
      ]);
      setSyllabusList(syllabusRes.data);
      setAllClasses(classesRes.data);
    } catch (err) {
      toast.error("Failed to load academic progress");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSyllabus = async (e) => {
    e.preventDefault();
    if (!formData.classId || !formData.subject || !formData.teacherId) {
        return toast.error("Please fill all fields");
    }

    try {
        const payload = {
            sClass: formData.classId,
            subject: formData.subject,
            teacherId: formData.teacherId,
            academicYear: formData.academicYear,
            description: `Official ${formData.subject} curriculum.`,
            // Default initial chapters
            chapters: [
                { chapterNo: 1, title: "Introduction & Basics", topics: [{ title: "Overview" }] },
                { chapterNo: 2, title: "Core Concepts", topics: [{ title: "Foundations" }] }
            ]
        };

        await api.post('/syllabus/create', payload);
        toast.success("Syllabus initialized!");
        setIsModalOpen(false);
        fetchInitialData();
    } catch (err) {
        toast.error(err.response?.data?.message || "Creation failed");
    }
  };

  const onClassSelectInModal = (classId) => {
      const cls = allClasses.find(c => c._id === classId);
      if (cls) {
          setAvailableSubjects(cls.subjects || []);
          setFormData({ ...formData, classId, subject: '', teacherId: '' });
      }
  };

  const handleDelete = async (id) => {
      if (!window.confirm("Are you sure you want to delete this syllabus?")) return;
      try {
          await api.delete(`/syllabus/delete/${id}`);
          toast.success("Syllabus removed");
          fetchInitialData();
          if (view === 'details') setView('subjects');
      } catch (err) {
          toast.error("Delete failed");
      }
  };

  // Grouping Logic for display
  const trackedClasses = Array.from(new Set(syllabusList.map(s => s.sClass?._id)))
    .map(id => {
        const syllabus = syllabusList.find(s => s.sClass?._id === id);
        return syllabus ? syllabus.sClass : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.grade.localeCompare(b.grade) || a.section.localeCompare(b.section));

  const getSubjectsForClass = (classId) => {
      return syllabusList.filter(s => s.sClass?._id === classId);
  };

  if (loading) return <div className="p-20 text-center font-black text-gray-300 animate-pulse">ORCHESTRATING ACADEMIC DATA...</div>;

  return (
    <div className="space-y-8 p-6">
      {/* Header & Stats Dashboard */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            {view !== 'classes' && (
                <button 
                    onClick={() => setView(view === 'details' ? 'subjects' : 'classes')}
                    className="p-3 hover:bg-white rounded-2xl shadow-sm transition text-indigo-600"
                >
                    <FaArrowLeft />
                </button>
            )}
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                {view === 'classes' && "Academic Mastery"}
                {view === 'subjects' && `Class ${selectedClass?.grade}-${selectedClass?.section}`}
                {view === 'details' && selectedSyllabus?.subject}
            </h1>
          </div>
          <p className="text-gray-500 font-bold ml-1">{view === 'classes' ? "Global curriculum tracking and progress analytics." : `Faculty: ${selectedSyllabus?.teacher?.name || 'Unassigned'}`}</p>
        </div>

        {view === 'classes' && (
            <div className="flex gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-80">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search class..." 
                        className="pl-12 pr-6 py-4 w-full rounded-2xl border-none bg-white shadow-sm focus:ring-4 focus:ring-indigo-50 font-bold text-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:scale-105 transition"
                >
                    <FaPlus />
                </button>
            </div>
        )}
      </div>

      {/* View 1: Class Command Grid */}
      {view === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
              {trackedClasses
                .filter(c => `${c.grade}-${c.section}`.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(c => {
                    const subs = getSubjectsForClass(c._id);
                    const avgProgress = subs.length > 0 
                        ? Math.round(subs.reduce((acc, s) => acc + s.totalProgress, 0) / subs.length)
                        : 0;

                    return (
                    <div 
                        key={c._id} 
                        onClick={() => { setSelectedClass(c); setView('subjects'); }}
                        className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-transparent hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 p-6 text-4xl opacity-5 transition-transform group-hover:scale-110 ${avgProgress > 80 ? 'text-green-600' : 'text-indigo-600'}`}>
                            <FaGraduationCap />
                        </div>
                        <div className="mb-6">
                            <h3 className="text-3xl font-black text-gray-800">Class {c.grade}-{c.section}</h3>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">{subs.length} Subjects Active</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Average Progress</span>
                                <span className={`text-xl font-black ${avgProgress > 80 ? 'text-green-600' : 'text-indigo-600'}`}>{avgProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${avgProgress > 80 ? 'bg-green-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${avgProgress}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-between">
                            <span className="px-4 py-2 bg-gray-50 text-gray-500 rounded-xl text-xs font-black group-hover:bg-indigo-600 group-hover:text-white transition">EXPLORE</span>
                            {avgProgress < 30 && <FaExclamationTriangle className="text-amber-400 animate-pulse" />}
                        </div>
                    </div>
                )})
              }
          </div>
      )}

      {/* View 2: Detailed Subject Matrix */}
      {view === 'subjects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {getSubjectsForClass(selectedClass._id).map(s => (
                  <div 
                    key={s._id}
                    className="bg-white rounded-[2rem] border border-gray-50 shadow-sm overflow-hidden hover:shadow-lg transition-all group"
                  >
                      <div className="p-8">
                          <div className="flex justify-between items-start mb-6">
                              <div>
                                  <h3 className="text-2xl font-black text-gray-800 group-hover:text-indigo-600 transition">{s.subject}</h3>
                                  <p className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-widest">{s.teacher?.name}</p>
                              </div>
                              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                  <FaChartLine />
                              </div>
                          </div>

                          <div className="mb-8">
                              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase mb-2">
                                  <span>Curriculum Status</span>
                                  <span>{s.totalProgress}%</span>
                              </div>
                              <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${s.totalProgress}%` }}
                                  ></div>
                              </div>
                          </div>

                          <div className="flex gap-3">
                              <button 
                                onClick={() => { setSelectedSyllabus(s); setView('details'); }}
                                className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition"
                              >
                                View Details
                              </button>
                              <button 
                                onClick={() => handleDelete(s._id)}
                                className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition"
                              >
                                <FaTrashAlt />
                              </button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* View 3: Granular Chapter Timeline */}
      {view === 'details' && selectedSyllabus && (
          <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-xl shadow-indigo-100/20 overflow-hidden border border-gray-100">
              <div className="p-12 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white text-center">
                  <h2 className="text-5xl font-black mb-4">{selectedSyllabus.totalProgress}%</h2>
                  <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-8">Overall Subject Mastery</p>
                  <div className="max-w-xs mx-auto w-full bg-indigo-900/30 h-2 rounded-full overflow-hidden backdrop-blur-sm">
                      <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${selectedSyllabus.totalProgress}%` }}></div>
                  </div>
              </div>

              <div className="p-12">
                  <div className="space-y-6">
                      {selectedSyllabus.chapters?.sort((a,b) => a.chapterNo - b.chapterNo).map((chapter) => (
                          <div key={chapter._id} className="flex items-center gap-8 p-6 rounded-3xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                              <div className="w-16 h-16 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 text-2xl font-black text-gray-300">
                                  {chapter.chapterNo}
                              </div>
                              <div className="flex-1">
                                  <h4 className="text-xl font-black text-gray-800">{chapter.title}</h4>
                                  <div className="flex items-center gap-4 mt-1 text-xs font-bold text-gray-400">
                                      <span className="flex items-center gap-2">
                                          {chapter.status === 'Completed' ? <FaCheckCircle className="text-green-500" /> : <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>}
                                          {chapter.status}
                                      </span>
                                      {chapter.completionDate && <span>• Done {new Date(chapter.completionDate).toLocaleDateString()}</span>}
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="text-xs font-black text-gray-300 uppercase tracking-widest mb-1">{chapter.topics?.length || 0} Topics</div>
                                  <div className="flex gap-1 justify-end">
                                      {chapter.topics?.map((t, i) => (
                                          <div key={i} className={`w-2 h-2 rounded-full ${t.status === 'Completed' ? 'bg-green-500' : 'bg-gray-100'}`}></div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Initialize Syllabus Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-300">
                  <div className="bg-indigo-600 p-8 text-white relative">
                      <button 
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-xl transition"
                      >
                          <FaTimes />
                      </button>
                      <h3 className="text-2xl font-black mb-1">Initialize Curriculum</h3>
                      <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest">Setup Subject Roadmap</p>
                  </div>

                  <form onSubmit={handleCreateSyllabus} className="p-8 space-y-6">
                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Select Class</label>
                          <select 
                            required
                            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-gray-700 transition"
                            value={formData.classId}
                            onChange={(e) => onClassSelectInModal(e.target.value)}
                          >
                              <option value="">-- Choose Class --</option>
                              {allClasses.map(c => <option key={c._id} value={c._id}>{c.grade} - {c.section}</option>)}
                          </select>
                      </div>

                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Select Subject & Teacher</label>
                          <select 
                            required
                            disabled={!formData.classId}
                            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-gray-700 transition disabled:opacity-50"
                            value={`${formData.subject}|${formData.teacherId}`}
                            onChange={(e) => {
                                const [sub, teacher] = e.target.value.split('|');
                                setFormData({ ...formData, subject: sub, teacherId: teacher });
                            }}
                          >
                              <option value="|">-- Select Subject --</option>
                              {availableSubjects.map((s, i) => (
                                  <option key={i} value={`${s.subName}|${s.teacher?._id || s.teacher}`}>
                                      {s.subName} ({s.teacher?.name || 'Assigned Staff'})
                                  </option>
                              ))}
                          </select>
                      </div>

                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Academic Year</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. 2023-2024"
                            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-gray-700 transition"
                            value={formData.academicYear}
                            onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                          />
                      </div>

                      <div className="pt-4 flex gap-4">
                          <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition"
                          >
                              Cancel
                          </button>
                          <button 
                            type="submit"
                            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition"
                          >
                              Initialize
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default SyllabusOverview;
