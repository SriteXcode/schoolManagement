import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaCheck, FaUserSecret, FaCommentDots } from 'react-icons/fa';

const TeacherInbox = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/comms/my-inbox');
      setMessages(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleResolve = async (id) => {
    try {
      await api.put('/admin/comms/status', { id, status: 'Resolved' });
      toast.success("Marked as read/resolved");
      fetchMessages();
    } catch (e) { toast.error("Failed to update status"); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">My Inbox</h1>
      <p className="text-gray-500">Feedback and issues raised by students.</p>

      <div className="bg-white rounded-lg shadow-md p-6 min-h-[400px]">
        {loading ? <p className="text-center py-10">Loading...</p> : (
            <div className="space-y-4">
                {messages.length === 0 && <p className="text-center py-10 text-gray-400">No messages received yet.</p>}
                
                {messages.map(msg => (
                    <div key={msg._id} className={`p-4 border rounded-lg ${msg.status === 'Pending' ? 'bg-white border-l-4 border-l-indigo-500 shadow-sm' : 'bg-gray-50 opacity-70'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                                        msg.type === 'Problem' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                    }`}>
                                        {msg.type}
                                    </span>
                                    {msg.isAnonymous ? (
                                        <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                            <FaUserSecret /> Anonymous Student
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                            {msg.name} (Student)
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-800 text-sm md:text-base">{msg.message}</p>
                                <p className="text-xs text-gray-400 mt-2">{new Date(msg.createdAt).toLocaleString()}</p>
                            </div>
                            
                            {msg.status === 'Pending' && (
                                <button onClick={() => handleResolve(msg._id)} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-50 transition">
                                    Mark Read
                                </button>
                            )}
                             {msg.status === 'Resolved' && <span className="text-green-600 font-bold text-sm flex items-center gap-1"><FaCheck /> Read</span>}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default TeacherInbox;
