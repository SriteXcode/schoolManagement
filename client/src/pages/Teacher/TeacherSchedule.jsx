import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { FaCalendarAlt, FaClock, FaChalkboard, FaBookOpen } from 'react-icons/fa';

const TeacherSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phases, setPhases] = useState([]);
  const [selectedPhase, setSelectedPhase] = useState('');
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [teacherProfile, setTeacherProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, phaseRes] = await Promise.all([
          api.get('/teacher/profile'),
          api.get('/management/schedule/phase/all')
        ]);
        setTeacherProfile(profileRes.data);
        setPhases(phaseRes.data);
        if (phaseRes.data.length > 0) {
          setSelectedPhase(phaseRes.data[0]._id);
        }
      } catch (err) {
        toast.error("Failed to load initial data");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (teacherProfile?._id) {
      fetchSchedule();
    }
  }, [teacherProfile, selectedPhase]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/management/schedule/teacher/${teacherProfile._id}`);
      setSchedule(res.data);
    } catch (err) {
      toast.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentPhase = phases.find(p => p._id === selectedPhase);

  const getSlotDetails = (day, slotIndex) => {
    const daySchedule = schedule.find(s => s.day === day && s.phase?._id === selectedPhase);
    if (!daySchedule) return null;
    return daySchedule.slots.find(s => s.slotIndex === slotIndex);
  };

  if (loading && !phases.length) return <div className="p-20 text-center font-black animate-pulse text-emerald-600 uppercase tracking-widest">Loading Academic Timetable...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <FaCalendarAlt className="text-emerald-600" /> My Teaching Schedule
            </h1>
            <p className="text-slate-500 font-bold ml-1 uppercase text-[10px] tracking-widest mt-2">Personalized weekly period distribution</p>
          </div>
          
          <select 
            className="p-4 bg-white border border-slate-200 rounded-2xl font-black text-xs text-emerald-600 outline-none focus:ring-4 focus:ring-emerald-50 min-w-[200px] shadow-sm"
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
          >
            {phases.map(p => (
              <option key={p._id} value={p._id}>{p.name} Phase</option>
            ))}
          </select>
      </div>

      {currentPhase ? (
        <div className="bg-white rounded-[2.5rem] shadow-soft border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                        <tr>
                            <th className="py-6 px-8 border-r border-white/10 sticky left-0 bg-slate-900 z-10">Time Slots</th>
                            {days.map(day => (
                                <th key={day} className="py-6 px-8 text-center border-r border-white/10">{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentPhase.slots.map((phaseSlot, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="py-6 px-8 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50/50 z-10">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-800">{phaseSlot.label}</span>
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                                            <FaClock size={10} /> {phaseSlot.startTime} - {phaseSlot.endTime}
                                        </span>
                                    </div>
                                </td>
                                {days.map(day => {
                                    const slot = getSlotDetails(day, idx);
                                    return (
                                        <td key={day} className="py-6 px-8 border-r border-slate-100 text-center min-w-[180px]">
                                            {slot ? (
                                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm animate-in zoom-in duration-300">
                                                    <div className="text-xs font-black text-emerald-700 uppercase tracking-tight mb-1">{slot.subject}</div>
                                                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-600/70">
                                                        <FaChalkboard size={10} /> Class {slot.sClass?.grade}-{slot.sClass?.section}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-200 font-black text-xs uppercase tracking-widest">Free</span>
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <FaBookOpen size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold italic">No active schedule phase selected...</p>
        </div>
      )}
    </div>
  );
};

export default TeacherSchedule;
