import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { FaBullhorn, FaCalendarAlt } from 'react-icons/fa';

const PublicNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('week'); // 'week', 'month', 'year', 'all'

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const { data } = await api.get('/notice/getall');
        setNotices(data);
      } catch (error) {
        console.error('Error fetching notices:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  const filteredNotices = notices.filter(notice => {
    const noticeDate = new Date(notice.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (filterType === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      oneWeekAgo.setHours(0, 0, 0, 0);
      return noticeDate >= oneWeekAgo && noticeDate <= today;
    }
    if (filterType === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      oneMonthAgo.setHours(0, 0, 0, 0);
      return noticeDate >= oneMonthAgo && noticeDate <= today;
    }
    if (filterType === 'year') {
      const thisYearStart = new Date(new Date().getFullYear(), 0, 1);
      return noticeDate >= thisYearStart && noticeDate <= today;
    }
    return true; // 'all'
  });

  return (
    <div className="min-h-screen bg-orange-50/50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header and Filter Control */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-[12px_16px_12px_26px] rounded-xl shadow-sm border border-orange-100/50">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
            <FaBullhorn className="text-orange-500" /> Notice Board
          </h1>
          
          <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 w-full md:w-auto">
            <FaCalendarAlt className="text-slate-400" size={14} />
            <div className="flex flex-col text-left">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Time Horizon</span>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="font-bold text-xs text-slate-700 bg-transparent outline-none border-none cursor-pointer p-0"
              >
                <option value="week">Last 7 Days (1 Week)</option>
                <option value="month">Last 30 Days (1 Month)</option>
                <option value="year">This Year ({new Date().getFullYear()})</option>
                <option value="all">All Bulletins</option>
              </select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="p-20 text-center font-black text-orange-400 animate-pulse uppercase tracking-[0.2em] bg-white rounded-[2rem] border border-orange-100/20 shadow-sm">
            Accessing Bulletins...
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="bg-white p-16 rounded-[2rem] shadow-sm border border-slate-100 text-center space-y-4">
              <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto">
                  <FaBullhorn size={28} />
              </div>
              <div>
                  <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest">No Bulletins Found</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase mt-1">There are no notices posted in the selected time range.</p>
              </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredNotices.map((notice) => (
              <div key={notice._id} className="bg-white p-[24px_16px_24px_26px] rounded-xl shadow-sm hover:shadow-md transition duration-300 border-l-8 border-orange-500 flex flex-col gap-4 border border-slate-100/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100">
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-tight tracking-tight">{notice.title}</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shrink-0">
                    {new Date(notice.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">{notice.details}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicNotices;
