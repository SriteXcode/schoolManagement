import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaBook, FaChalkboardTeacher, FaTasks, FaClipboardList, FaCheckCircle, FaClock, FaRegCircle } from 'react-icons/fa';
import Loader from '../../components/Loader';
import { useSearchParams } from 'react-router-dom';

const Homework = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'assign';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [homeworkList, setHomeworkList] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [recognizedSubject, setRecognizedSubject] = useState(null);
  const [editingHomework, setEditingHomework] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Submissions Tab States
  const [selectedSubHw, setSelectedSubHw] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    description: '',
    dueDate: ''
  });

  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/class/getall');
        setClasses(res.data);
      } catch (err) {
        console.error("Failed to fetch classes");
      } finally {
        setLoading(false);
      }
    };
    if (user.email) fetchClasses();
    else setLoading(false);
  }, [user.email]);

  const fetchHomework = async (classId) => {
    try {
      const res = await api.get(`/homework/${classId}`);
      setHomeworkList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setSelectedSubHw(null);
    setSubmissions([]);
  };

  const handleClassChange = async (e) => {
    const id = e.target.value;
    setSelectedClass(id);
    setRecognizedSubject(null);
    setEditingHomework(null);
    setSelectedSubHw(null);
    setSubmissions([]);
    if (id) {
        setSubmitting(true);
        fetchHomework(id);
        
        try {
            const classRes = await api.get(`/class/details/${id}`);
            const subjects = classRes.data.subjects || [];
            
            // Only show subjects assigned to THIS teacher in the dropdown
            const mySubjects = subjects.filter(sub => 
                sub.teacher?.email?.toLowerCase() === user.email?.toLowerCase()
            );
            
            setAvailableSubjects(mySubjects);
            
            if (mySubjects.length > 0) {
                // Auto-select the first subject assigned to them in this class
                setFormData(prev => ({ ...prev, subject: mySubjects[0].subName }));
                setRecognizedSubject(mySubjects.map(s => s.subName).join(', '));
                toast.success(`Recognized subjects: ${mySubjects.map(s => s.subName).join(', ')}`);
            } else {
                setFormData(prev => ({ ...prev, subject: '' }));
            }
        } catch (error) {
            console.error("Failed to fetch class details");
        } finally {
            setSubmitting(false);
        }
    } else {
        setAvailableSubjects([]);
        setFormData(prev => ({ ...prev, subject: '' }));
    }
  };

  const handleHwSelectForSubmissions = async (hw) => {
    setSelectedSubHw(hw);
    setLoadingSubmissions(true);
    try {
      const res = await api.get(`/homework/submissions/${hw._id}`);
      setSubmissions(res.data.submissions);
    } catch (err) {
      toast.error("Failed to load student submissions");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const isDueToday = (dueDateString) => {
    if (!dueDateString) return false;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const due = new Date(dueDateString);
    const dueStr = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`;
    return todayStr === dueStr;
  };

  const handleEditClick = (hw) => {
      setEditingHomework(hw);
      setFormData({
          subject: hw.subject,
          title: hw.title,
          description: hw.description,
          dueDate: new Date(hw.dueDate).toISOString().split('T')[0]
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) return toast.error("Select a class");
    setSubmitting(true);
    try {
      if (editingHomework) {
          await api.put(`/homework/${editingHomework._id}`, formData);
          toast.success("Homework updated!");
          setEditingHomework(null);
      } else {
          await api.post('/homework/create', { ...formData, sClass: selectedClass });
          toast.success("Homework assigned!");
      }
      setFormData(prev => ({ ...prev, title: '', description: '', dueDate: '' }));
      fetchHomework(selectedClass);
    } catch (err) {
      toast.error(editingHomework ? "Failed to update homework" : "Failed to assign homework");
    } finally {
      setSubmitting(false);
    }
  };

  const isMyClass = (cls) => {
      return cls.classTeacher?.email?.toLowerCase() === user.email?.toLowerCase();
  };

  if (loading) return <Loader fullScreen text="Accessing Homework Portals..." />;

  return (
    <div className="space-y-6 relative text-left">
      {submitting && <Loader fullScreen text="Synchronizing Academic Tasks..." />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FaBook className="text-indigo-600"/> Homework Management
        </h1>

        {/* Tab Selection buttons */}
        <div className="flex bg-white p-1 rounded-2xl shadow-soft border border-slate-100 w-full md:w-auto">
          <button
            onClick={() => handleTabChange('assign')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 py-2 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 cursor-pointer ${
              activeTab === 'assign' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FaTasks /> Assign Homework
          </button>
          <button
            onClick={() => handleTabChange('submissions')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 py-2 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 cursor-pointer ${
              activeTab === 'submissions' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FaClipboardList /> Submissions
          </button>
        </div>
      </div>

      {/* Role Label */}
      {selectedClass && recognizedSubject && activeTab === 'assign' && (
          <div className="p-4 rounded-lg flex items-center gap-4 shadow-sm bg-indigo-50 text-indigo-800 border border-indigo-100">
              <div className="font-bold flex items-center gap-2">
                  <FaChalkboardTeacher />
                  Your Subjects for this class: <span className="underline">{recognizedSubject}</span>
              </div>
          </div>
      )}

      {/* Tab Contents */}
      {activeTab === 'assign' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className={`p-6 bg-white rounded-lg shadow-md border-t-4 ${editingHomework ? 'border-amber-500' : 'border-indigo-500'}`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-700">{editingHomework ? 'Edit Homework' : 'Assign New Homework'}</h2>
                {editingHomework && (
                    <button 
                      onClick={() => {
                          setEditingHomework(null);
                          setFormData(prev => ({ ...prev, title: '', description: '', dueDate: '' }));
                      }}
                      className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                    >
                        Cancel Edit
                    </button>
                )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingHomework && (
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Select Class</label>
                      <select 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 font-medium"
                      value={selectedClass}
                      onChange={handleClassChange}
                      required
                      >
                      <option value="">Choose Class</option>
                      {classes.map(c => (
                          <option key={c._id} value={c._id}>
                              {isMyClass(c) ? '🟢 ' : ''}{c.grade} - {c.section} {isMyClass(c) ? '(Your Class)' : ''}
                          </option>
                      ))}
                      </select>
                  </div>
              )}

              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Select Subject</label>
                  <select 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 font-medium"
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    required
                  >
                    <option value="">-- Choose Subject --</option>
                    {availableSubjects.map((sub, idx) => (
                        <option key={idx} value={sub.subName}>{sub.subName}</option>
                    ))}
                     {availableSubjects.length === 0 && selectedClass && <option value="General">General/Other</option>}
                  </select>
              </div>

              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Homework Title</label>
                  <input 
                    type="text" placeholder="e.g. Chapter 1 Exercise" 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required
                  />
              </div>

              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Instructions</label>
                  <textarea 
                    placeholder="Details about the homework..." 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50" 
                    rows="3"
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  ></textarea>
              </div>

              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Due Date</label>
                  <input 
                    type="date" 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                    value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})}
                  />
              </div>

              <button className={`w-full py-3 ${editingHomework ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer`}>
                  <FaBook /> {editingHomework ? 'Update Homework' : 'Assign Homework'}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="p-6 bg-white rounded-lg shadow-md border-t-4 border-emerald-500 flex flex-col h-full overflow-hidden">
            <h2 className="text-xl font-bold mb-4 text-gray-700 text-center">Recent Homework</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide pr-2">
              {homeworkList.map(hw => (
                <div key={hw._id} className="p-5 border border-gray-100 bg-gray-50 rounded-2xl shadow-sm hover:shadow-lg hover:bg-white transition-all group flex flex-col relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm bg-indigo-50 text-indigo-600">
                        <FaBook size={20} />
                      </div>
                      <div className="text-left">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">{hw.subject}</span>
                        <h4 className="font-black text-slate-800 text-base truncate max-w-[180px]">{hw.title}</h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900 leading-none">{new Date(hw.dueDate).getDate()}</div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                        {new Date(hw.dueDate).toLocaleString('default', { month: 'short' })}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed italic text-left">
                    "{hw.description}"
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 mt-auto">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      Assigned: {new Date(hw.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <button 
                      onClick={() => handleEditClick(hw)}
                      className="text-[10px] font-black uppercase text-indigo-600 hover:underline cursor-pointer"
                    >
                      Edit Details
                    </button>
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-indigo-500/10 transition-colors"></div>
                </div>
              ))}
              {selectedClass && homeworkList.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                      <FaBook size={40} className="mx-auto mb-2 opacity-20" />
                      <p>No homework found for this class.</p>
                  </div>
              )}
              {!selectedClass && (
                  <div className="text-center py-12 text-gray-400">
                      <FaChalkboardTeacher size={40} className="mx-auto mb-2 opacity-20" />
                      <p>Select a class to view history.</p>
                  </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Homeworks list (Left) */}
          <div className="p-6 bg-white rounded-lg shadow-md border-t-4 border-indigo-500 flex flex-col h-full overflow-hidden">
            <h2 className="text-xl font-bold mb-4 text-gray-700">Today's Due Homeworks</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-1">Select Class</label>
              <select 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 font-medium"
                value={selectedClass}
                onChange={handleClassChange}
                required
              >
                <option value="">Choose Class</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>
                    {isMyClass(c) ? '🟢 ' : ''}{c.grade} - {c.section} {isMyClass(c) ? '(Your Class)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 max-h-[500px]">
              {selectedClass ? (
                (() => {
                  const todayDue = homeworkList.filter(hw => isDueToday(hw.dueDate));
                  if (todayDue.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-400">
                        <FaBook size={40} className="mx-auto mb-2 opacity-20" />
                        <p>No homework due today for this class.</p>
                      </div>
                    );
                  }
                  return todayDue.map(hw => (
                    <div 
                      key={hw._id} 
                      onClick={() => handleHwSelectForSubmissions(hw)}
                      className={`p-5 border rounded-2xl shadow-sm cursor-pointer transition-all flex flex-col relative overflow-hidden group ${
                        selectedSubHw?._id === hw._id 
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-md' 
                          : 'border-gray-100 bg-gray-50 hover:bg-white hover:shadow-lg'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                            selectedSubHw?._id === hw._id ? 'bg-white text-indigo-600' : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            <FaBook size={16} />
                          </div>
                          <div className="text-left">
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">{hw.subject}</span>
                            <h4 className="font-black text-slate-800 text-base truncate max-w-[150px]">{hw.title}</h4>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-slate-900 leading-none">{new Date(hw.dueDate).getDate()}</div>
                          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                            {new Date(hw.dueDate).toLocaleString('default', { month: 'short' })}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic text-left">
                        "{hw.description}"
                      </p>

                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-indigo-500/10 transition-colors"></div>
                    </div>
                  ));
                })()
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <FaChalkboardTeacher size={40} className="mx-auto mb-2 opacity-20" />
                  <p>Select a class to view homeworks due today.</p>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Submissions (Right) */}
          <div className="p-6 bg-white rounded-lg shadow-md border-t-4 border-emerald-500 flex flex-col h-full overflow-hidden">
            <h2 className="text-xl font-bold mb-4 text-gray-700">Submission Details</h2>

            {selectedSubHw ? (
              loadingSubmissions ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                  <p className="text-sm font-bold uppercase tracking-wider">Loading student statuses...</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="mb-4 text-left border-b border-slate-50 pb-3">
                    <h3 className="font-black text-slate-800 text-lg">{selectedSubHw.title}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-1">Class: {classes.find(c => c._id === selectedClass)?.grade} - {classes.find(c => c._id === selectedClass)?.section}</p>
                  </div>

                  {/* Submissions Stats Widget */}
                  {(() => {
                    const stats = submissions.reduce((acc, curr) => {
                      acc[curr.status] = (acc[curr.status] || 0) + 1;
                      return acc;
                    }, { 'Completed': 0, 'In Progress': 0, 'Not Started': 0 });

                    return (
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">
                          <div className="text-xl font-black text-emerald-600">{stats['Completed']}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Completed</div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-center">
                          <div className="text-xl font-black text-amber-600">{stats['In Progress']}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">In Progress</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                          <div className="text-xl font-black text-slate-600">{stats['Not Started']}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Not Started</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Students list */}
                  <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 max-h-[380px]">
                    {submissions.length > 0 ? (
                      submissions.map(sub => (
                        <div key={sub._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all">
                          <div className="text-left">
                            <div className="font-bold text-slate-800 text-sm">{sub.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Roll: {sub.rollNum}</div>
                          </div>
                          <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
                            sub.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                            sub.status === 'In Progress' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                            'bg-slate-100 border-slate-200 text-slate-500'
                          }`}>
                            {sub.status === 'Completed' && <FaCheckCircle size={10} />}
                            {sub.status === 'In Progress' && <FaClock size={10} />}
                            {sub.status === 'Not Started' && <FaRegCircle size={10} />}
                            {sub.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-10 text-slate-400 font-bold italic">No students registered in this class.</p>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400 text-center">
                <FaBook size={40} className="mx-auto mb-2 opacity-20" />
                <p>Select a homework card from the left side<br />to view detailed student submissions.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Homework;
