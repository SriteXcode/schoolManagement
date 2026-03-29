import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { FaBullhorn } from 'react-icons/fa';

const PublicNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-orange-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-orange-900 mb-8 text-center flex items-center justify-center gap-4">
          <FaBullhorn /> Notice Board
        </h1>
        
        {loading ? (
          <p className="text-center text-orange-600">Loading notices...</p>
        ) : notices.length === 0 ? (
          <p className="text-center text-gray-500">No notices at the moment.</p>
        ) : (
          <div className="grid gap-6">
            {notices.map((notice) => (
              <div key={notice._id} className="bg-white p-6 rounded-2xl shadow-md border-l-8 border-orange-500">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-gray-800">{notice.title}</h3>
                  <span className="text-sm text-gray-400 font-semibold">
                    {new Date(notice.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{notice.details}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicNotices;
