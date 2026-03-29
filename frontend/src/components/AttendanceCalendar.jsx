import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import api from '../api/axios';

const AttendanceCalendar = ({ studentId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendance, setAttendance] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [attRes, eventRes] = await Promise.all([
          studentId ? api.get(`/attendance/student/${studentId}`) : Promise.resolve({ data: [] }),
          api.get('/events/getall')
        ]);
        setAttendance(attRes.data);
        setEvents(eventRes.data);
      } catch (error) {
        console.error("Error fetching calendar data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderDays = () => {
    const days = [];
    // Empty slots for previous month days
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div 
          key={`empty-${i}`} 
          className="h-10 md:h-14 bg-gray-50 border border-gray-100"
        ></div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateStr = dateObj.toDateString();
      
      // Check Attendance
      const attRecord = attendance.find(a => new Date(a.date).toDateString() === dateStr);
      
      // Check Events/Holidays
      const dayEvents = events.filter(e => new Date(e.date).toDateString() === dateStr);
      const isHoliday = dayEvents.some(e => e.type === 'Holiday');
      const hasEvent = dayEvents.some(e => e.type === 'Event' || e.type === 'Celebration' || e.type === 'Exam');

      let bgColor = 'bg-white';
      let textColor = 'text-gray-700';
      let statusText = '';

      if (isHoliday) {
          bgColor = 'bg-gray-400';
          textColor = 'text-white';
          statusText = 'Holiday';
      } else if (hasEvent) {
          bgColor = 'bg-blue-500';
          textColor = 'text-white';
          statusText = 'Event';
      } else if (attRecord) {
          if (attRecord.status === 'Present') {
              bgColor = 'bg-green-500';
              textColor = 'text-white';
              statusText = 'Present';
          } else {
              bgColor = 'bg-red-500';
              textColor = 'text-white';
              statusText = 'Absent';
          }
      }

      const isToday = new Date().toDateString() === dateStr;

      days.push(
        <div 
          key={day} 
          className={`h-10 md:h-16 border border-gray-100 p-0.5 md:p-1 relative flex flex-col items-center justify-center transition ${bgColor} ${isToday ? 'ring-2 ring-indigo-600 ring-inset' : ''}`}
        >
          <span className={`text-xs md:text-sm font-bold ${textColor}`}>{day}</span>
          {statusText && (
              <span className={`text-[6px] md:text-[8px] uppercase font-bold opacity-90 leading-tight ${textColor} text-center`}>
                  {statusText}
              </span>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="bg-white rounded-xl shadow-inner overflow-hidden border">
      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-200 rounded-full transition"><FaChevronLeft /></button>
        <h3 className="font-bold text-gray-800">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-200 rounded-full transition"><FaChevronRight /></button>
      </div>
      
      <div className="grid grid-cols-7 bg-indigo-600 text-white text-[10px] md:text-xs font-bold text-center py-2">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => <div key={d}>{d}</div>)}
      </div>
      
      <div className="grid grid-cols-7">
        {renderDays()}
      </div>

      <div className="p-3 bg-gray-50 border-t flex flex-wrap gap-4 text-[10px] font-bold justify-center">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Present</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Absent</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-400 rounded-sm"></div> Holiday</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Event</div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
