import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaBook, FaChalkboardTeacher } from 'react-icons/fa';

const Homework = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [homeworkList, setHomeworkList] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [recognizedSubject, setRecognizedSubject] = useState(null);
  const [editingHomework, setEditingHomework] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    description: '',
    dueDate: ''
  });

  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/class/getall');
        setClasses(res.data);
      } catch (err) {
        console.error("Failed to fetch classes");
      }
    };
    if (user.email) fetchClasses();
  }, [user.email]);

  const fetchHomework = async (classId) => {
    try {
      const res = await api.get(`/homework/${classId}`);
      setHomeworkList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassChange = async (e) => {
    const id = e.target.value;
    setSelectedClass(id);
    setRecognizedSubject(null);
    setEditingHomework(null);
    if (id) {
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
        }
    } else {
        setAvailableSubjects([]);
        setFormData(prev => ({ ...prev, subject: '' }));
    }
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
    }
  };

  const isMyClass = (cls) => {
      return cls.classTeacher?.email?.toLowerCase() === user.email?.toLowerCase();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaBook className="text-indigo-600"/> Homework Management
      </h1>

      {/* Role Label */}
      {selectedClass && recognizedSubject && (
          <div className="p-4 rounded-lg flex items-center gap-4 shadow-sm bg-indigo-50 text-indigo-800 border border-indigo-100">
              <div className="font-bold flex items-center gap-2">
                  <FaChalkboardTeacher />
                  Your Subjects for this class: <span className="underline">{recognizedSubject}</span>
              </div>
          </div>
      )}

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
                    className="text-xs font-bold text-red-500 hover:underline"
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

            <button className={`w-full py-3 ${editingHomework ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg font-bold transition shadow-lg flex items-center justify-center gap-2`}>
                <FaBook /> {editingHomework ? 'Update Homework' : 'Assign Homework'}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="p-6 bg-white rounded-lg shadow-md border-t-4 border-emerald-500">
          <h2 className="text-xl font-bold mb-4 text-gray-700 text-center">Recent Homework</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
            {homeworkList.map(hw => (
              <div key={hw._id} className="p-4 border border-gray-100 bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                      <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full mb-2 uppercase tracking-wider">{hw.subject}</span>
                      <h3 className="font-bold text-gray-800 text-lg">{hw.title}</h3>
                  </div>
                  <div className="text-right flex flex-col items-end">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Due Date</p>
                      <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded border border-indigo-100 mb-2">{new Date(hw.dueDate).toLocaleDateString()}</span>
                      <button 
                        onClick={() => handleEditClick(hw)}
                        className="text-[10px] font-black uppercase text-indigo-600 hover:underline"
                      >
                          Edit Details
                      </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3 line-clamp-3 italic">"{hw.description}"</p>
                <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400">Assigned: {new Date(hw.date).toLocaleDateString()}</span>
                </div>
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
    </div>
  );
};

export default Homework;
