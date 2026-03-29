import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useOutletContext } from 'react-router-dom';
import AttendanceCalendar from '../../components/AttendanceCalendar';

const StudentAttendance = () => {
  const { student } = useOutletContext();
  const [attendance, setAttendance] = useState([]);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!student) return;
      try {
        const res = await api.get(`/attendance/student/${student._id}`);
        setAttendance(res.data);
        
        // Calculate Percentage
        const total = res.data.length;
        const present = res.data.filter(a => a.status === 'Present').length;
        if (total > 0) {
            setPercentage(((present / total) * 100).toFixed(1));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAttendance();
  }, [student]);

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold text-gray-800">My Attendance</h1>

       <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
           <div className={`col-span-2 p-6 rounded-lg text-white shadow-lg ${percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`}>
               <h3 className="text-xl font-bold">Attendance Rate</h3>
               <p className="text-4xl font-bold mt-2">{percentage}%</p>
               <p className="text-sm mt-1 opacity-80">{percentage >= 75 ? 'Good Job!' : 'Needs Improvement'}</p>
           </div>
           <div className="p-6 bg-white rounded-lg shadow-lg">
               <h3 className="text-xl font-bold text-gray-700">Total Days</h3>
               <p className="text-4xl font-bold text-gray-800 mt-2">{attendance.length}</p>
           </div>
           <div className="p-6 bg-white rounded-lg shadow-lg">
               <h3 className="text-xl font-bold text-gray-700">Days Present</h3>
               <p className="text-4xl font-bold text-blue-600 mt-2">
                   {attendance.filter(a => a.status === 'Present').length}
               </p>
           </div>
       </div>

       <div className="bg-white p-6 rounded-lg shadow-md mt-6">
           <h3 className="text-xl font-bold mb-4">Attendance Calendar</h3>
           <AttendanceCalendar studentId={student?._id} />
       </div>
    </div>
  );
};

export default StudentAttendance;
