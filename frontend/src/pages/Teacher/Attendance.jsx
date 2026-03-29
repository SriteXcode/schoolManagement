import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaUserCheck, FaUserTimes, FaLock, FaInfoCircle, FaStar, FaRegStar, FaTimes, FaQuoteLeft, FaPlus, FaCalendarAlt, FaAward, FaEdit, FaCheckCircle } from 'react-icons/fa';
import AttendanceCalendar from '../../components/AttendanceCalendar';
import StudentDetailsModal from '../../components/StudentDetailsModal';

const Attendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [classStats, setClassStats] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Permission & Class Info
  const [classInfo, setClassInfo] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const user = JSON.parse(localStorage.getItem('user')) || {};

  // Details Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCalModal, setShowCalModal] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/class/getall');
        const classesList = res.data;
        setClasses(classesList);

        const myClass = classesList.find(c => 
            c.classTeacher?.email && user.email && 
            c.classTeacher.email.toLowerCase() === user.email.toLowerCase()
        );
        
        if (myClass) {
          setSelectedClass(myClass._id);
        }
      } catch (err) {
        toast.error("Failed to fetch classes");
      }
    };
    fetchClasses();
  }, [user.email]);

  useEffect(() => {
    if (selectedClass) {
      handleFetchStudents();
    }
  }, [selectedClass, date]);

  const handleFetchStudents = async () => {
    if (!selectedClass) return; 
    setLoading(true);
    setStudents([]); 
    setIsEditing(false); // Reset editing mode when class or date changes
    
    try {
      const classRes = await api.get(`/class/details/${selectedClass}`);
      setClassInfo(classRes.data);
      
      const ct = classRes.data.classTeacher;
      const canMark = user.role === 'Admin' || (
          (user.email && ct?.email && user.email.toLowerCase() === ct.email.toLowerCase()) ||
          (user._id && ct?.user && user._id === ct.user)
      );
      setCanEdit(canMark);

      const studentRes = await api.get(`/student/class/${selectedClass}`);
      setStudents(studentRes.data);

      const attendRes = await api.get(`/attendance/${selectedClass}/${date}`);
      const existingData = {};
      attendRes.data.forEach(record => {
        existingData[record.student._id] = record.status;
      });
      
      const initialData = { ...existingData };
      studentRes.data.forEach(s => {
        if (!initialData[s._id]) initialData[s._id] = 'Present'; 
      });
      setAttendanceData(initialData);

      const statsRes = await api.get(`/attendance/stats/${selectedClass}`);
      const statsMap = {};
      statsRes.data.forEach(s => {
          statsMap[s._id] = (s.total > 0 ? ((s.present / s.total) * 100).toFixed(1) : 0);
      });
      setClassStats(statsMap);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (studentId) => {
    if (!canEdit || !isEditing) return;
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const handleSave = async () => {
    if (!canEdit || !isEditing) return;
    try {
      const formattedData = Object.keys(attendanceData).map(id => ({
        student: id,
        status: attendanceData[id]
      }));

      await api.post('/attendance/mark', {
        date,
        sClass: selectedClass,
        attendanceData: formattedData
      });
      toast.success("Attendance saved successfully!");
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save attendance");
    }
  };

  const handleReviewAdded = (updatedStudent) => {
      setStudents(prev => prev.map(s => s._id === updatedStudent._id ? updatedStudent : s));
      setSelectedStudent(updatedStudent);
  };

  const isMyClass = (cls) => {
      return cls.classTeacher?.email && user.email && 
             cls.classTeacher.email.toLowerCase() === user.email.toLowerCase();
  };

  const markAllPresent = () => {
    if (!canEdit || !isEditing) return;
    const allPresent = {};
    students.forEach(s => allPresent[s._id] = 'Present');
    setAttendanceData(allPresent);
    toast.success("All students marked as Present");
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaUserCheck className="text-indigo-600"/> Attendance
      </h1>

      <div className="p-4 md:p-6 bg-white rounded-xl shadow-md flex flex-col md:flex-row items-stretch md:items-end gap-4 md:gap-6 border-l-4 border-indigo-500">
        <div className="flex-1">
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Select Class</label>
          <select 
            className="w-full p-3 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 font-bold text-gray-700"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="" className="font-normal text-slate-400 italic">-- Choose Target Class --</option>
            {classes.map(c => (
                <option key={c._id} value={c._id} className={isMyClass(c) ? "font-bold text-indigo-600" : "font-normal"}>
                    Grade {c.grade} - {c.section} {isMyClass(c) ? " (My Class)" : ""}
                </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Academic Date</label>
          <div className="relative">
              <FaCalendarAlt className="absolute left-4 top-4 text-gray-400" />
              <input 
                type="date" 
                className="w-full pl-11 p-3 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 font-black text-slate-900"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
          </div>
        </div>
        {loading && <div className="text-indigo-600 font-bold animate-pulse py-2 text-center md:text-left text-sm">Syncing records...</div>}
      </div>

      {classInfo && (
        <div className={`p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm ${canEdit ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' : 'bg-amber-50 text-amber-800 border border-amber-100'}`}>
            <div className="flex items-center gap-3 font-bold text-sm text-center sm:text-left">
                <div className={`p-2 rounded-lg ${canEdit ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'}`}>
                    {canEdit ? (isEditing ? <FaEdit className="animate-pulse" /> : <FaUserCheck />) : <FaLock />}
                </div>
                <span>
                    {canEdit 
                        ? (isEditing ? "Editing Session Active" : `Authorized: Class Teacher of ${classInfo.grade}-${classInfo.section}`) 
                        : `View Only: Managed by ${classInfo.classTeacher?.name || 'Class Teacher'}`}
                </span>
            </div>
            {canEdit && !isEditing && (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                    <FaEdit /> Enable Editing
                </button>
            )}
        </div>
      )}

      {students.length > 0 && (
        <div className="space-y-4">
          {/* Action Header for Mobile */}
          {canEdit && isEditing && (
              <button 
                onClick={markAllPresent}
                className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl font-black uppercase tracking-widest text-[10px] border border-emerald-100 hover:bg-emerald-100 transition flex items-center justify-center gap-2"
              >
                  <FaCheckCircle /> Mark All Present
              </button>
          )}

          {/* Table View - Hidden on Mobile */}
          <div className="hidden md:block bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-50">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50/50 border-b border-gray-50">
                <tr>
                  <th className="p-5 font-black text-[10px] text-slate-400 uppercase tracking-widest">Roll No</th>
                  <th className="p-5 font-black text-[10px] text-slate-400 uppercase tracking-widest">Student Identity</th>
                  <th className="p-5 font-black text-[10px] text-slate-400 uppercase tracking-widest text-center">Consistency %</th>
                  <th className="p-5 font-black text-[10px] text-slate-400 uppercase tracking-widest text-center">Status Toggle</th>
                  <th className="p-5 font-black text-[10px] text-slate-400 uppercase tracking-widest text-right">Records</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map(student => (
                  <tr key={student._id} className="hover:bg-slate-50/50 transition">
                    <td className="p-5 font-mono text-slate-400 text-sm">#{student.rollNum}</td>
                    <td 
                      className={`p-5 font-black text-indigo-600 cursor-pointer hover:text-indigo-800`}
                      onClick={() => (setSelectedStudent(student) || setShowDetailsModal(true))}
                    >
                      {student.name}
                    </td>
                    <td className="p-5 text-center">
                        <span 
                          onClick={() => { setSelectedStudent(student); setShowCalModal(true); }}
                          className={`font-black px-3 py-1 rounded-full text-[10px] cursor-pointer hover:scale-110 transition-transform inline-block ${classStats[student._id] >= 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}
                        >
                            {classStats[student._id] || 0}%
                        </span>
                    </td>
                    <td className="p-5 text-center">
                      <button
                        onClick={() => toggleStatus(student._id)}
                        disabled={!canEdit || !isEditing}
                        className={`px-8 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-sm transition-all duration-200 w-36 ${
                          attendanceData[student._id] === 'Present' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        } ${(canEdit && isEditing) ? 'hover:shadow-md active:scale-95 cursor-pointer' : 'cursor-default opacity-60'}`}
                      >
                        {attendanceData[student._id]}
                      </button>
                    </td>
                    <td className="p-5 text-right">
                        <button 
                            onClick={() => { setSelectedStudent(student); setShowDetailsModal(true); }}
                            className="text-slate-300 hover:text-indigo-600 transition"
                        >
                            <FaInfoCircle size={20} />
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card View - Visible only on Mobile */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {students.map(student => (
              <div key={student._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs">
                        {student.rollNum}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800">{student.name}</h3>
                      <button 
                        onClick={() => { setSelectedStudent(student); setShowCalModal(true); }}
                        className={`text-[9px] font-black uppercase mt-1 px-2 py-0.5 rounded-md ${classStats[student._id] >= 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}
                      >
                        {classStats[student._id] || 0}% Attendance
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedStudent(student); setShowDetailsModal(true); }}
                    className="p-2 text-slate-300 hover:text-indigo-600"
                  >
                    <FaInfoCircle size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => toggleStatus(student._id)}
                        disabled={!canEdit || !isEditing}
                        className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm transition-all ${
                        attendanceData[student._id] === 'Present' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        } ${(!canEdit || !isEditing) && 'opacity-60'}`}
                    >
                        {attendanceData[student._id] === 'Present' ? <><FaUserCheck className="inline mr-2"/> Present</> : <><FaUserTimes className="inline mr-2"/> Absent</>}
                    </button>
                    {isEditing && (
                        <button 
                            onClick={() => toggleStatus(student._id)}
                            className="p-3 bg-slate-100 text-slate-400 rounded-xl"
                        >
                            <FaEdit size={14}/>
                        </button>
                    )}
                </div>
              </div>
            ))}
          </div>
          
          {canEdit && isEditing && (
            <div className="fixed md:sticky bottom-0 left-0 right-0 p-4 md:p-6 bg-white/80 backdrop-blur-md md:bg-gray-50 border-t z-50 flex gap-3 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)] md:shadow-none">
                <button 
                    onClick={handleSave}
                    className="flex-1 px-8 py-3 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                >
                    <FaUserCheck /> Save Attendance
                </button>
                <button 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 bg-white border border-gray-200 text-slate-400 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-gray-50 transition"
                >
                    Cancel
                </button>
            </div>
          )}
        </div>
      )}

      {showDetailsModal && selectedStudent && (
          <StudentDetailsModal 
            student={selectedStudent} 
            onClose={() => setShowDetailsModal(false)} 
            onReviewAdded={handleReviewAdded}
          />
      )}

      {/* Attendance Calendar Modal */}
      {showCalModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onClick={() => setShowCalModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[95vw] md:w-[85vw] lg:w-[75vw] h-auto max-h-[95vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-3 md:p-4 border-b flex justify-between items-center bg-indigo-50 rounded-t-2xl shrink-0">
                    <div>
                        <h3 className="text-lg md:text-xl font-bold text-indigo-900">{selectedStudent.name} - Attendance</h3>
                        <p className="text-xs md:text-sm text-indigo-600">Roll No: {selectedStudent.rollNum}</p>
                    </div>
                    <button onClick={() => setShowCalModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><FaTimes size={20} /></button>
                </div>
                <div className="p-2 md:p-4 overflow-y-auto flex-1 custom-scrollbar">
                    <AttendanceCalendar studentId={selectedStudent._id} />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
