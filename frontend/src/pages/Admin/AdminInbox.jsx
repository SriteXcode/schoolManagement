import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaCheck, FaTimes, FaEnvelope, FaUserClock, FaExclamationCircle } from 'react-icons/fa';

const AdminInbox = () => {
  const [activeTab, setActiveTab] = useState('requests'); // requests | messages
  const [pendingUsers, setPendingUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, msgsRes] = await Promise.all([
        api.get('/admin/users/pending'),
        api.get('/admin/comms/all')
      ]);
      setPendingUsers(usersRes.data);
      setMessages(msgsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUserStatus = async (id, status) => {
    try {
      await api.put('/admin/users/status', { id, status });
      toast.success(`User ${status}`);
      fetchData();
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleMessageStatus = async (id, status) => {
    try {
      await api.put('/admin/comms/status', { id, status });
      toast.success("Marked as resolved");
      fetchData();
    } catch (error) {
      toast.error("Action failed");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Admin Inbox</h1>
      
      {/* Tabs */}
      <div className="flex border-b">
        <button 
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-3 font-bold ${activeTab === 'requests' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Teacher Requests ({pendingUsers.length})
        </button>
        <button 
          onClick={() => setActiveTab('messages')}
          className={`px-6 py-3 font-bold ${activeTab === 'messages' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Messages & Feedback ({messages.filter(m => m.status === 'Pending').length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-md p-6 min-h-[400px]">
        {loading ? <p className="text-center py-10 text-gray-500">Loading...</p> : (
          <>
            {/* REQUESTS TAB */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                {pendingUsers.length === 0 && <p className="text-gray-500 text-center py-10">No pending requests.</p>}
                {pendingUsers.map(user => (
                  <div key={user._id} className="flex flex-col md:flex-row justify-between items-center p-4 border rounded-lg bg-indigo-50 border-indigo-100">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                      <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 text-xl font-bold">
                         {user.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-indigo-500 font-bold uppercase mt-1">{user.role} Application</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleUserStatus(user._id, 'Approved')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2">
                          <FaCheck /> Approve
                       </button>
                       <button onClick={() => handleUserStatus(user._id, 'Rejected')} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2">
                          <FaTimes /> Reject
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MESSAGES TAB */}
            {activeTab === 'messages' && (
              <div className="space-y-4">
                {messages.length === 0 && <p className="text-gray-500 text-center py-10">No messages found.</p>}
                {messages.map(msg => (
                  <div key={msg._id} className={`p-4 border rounded-lg ${msg.status === 'Pending' ? 'bg-white border-l-4 border-l-orange-500 shadow-sm' : 'bg-gray-50 opacity-75'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                             <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                                 msg.type === 'Problem' ? 'bg-red-100 text-red-600' : 
                                 msg.type === 'Feedback' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                             }`}>
                                 {msg.type}
                             </span>
                             <h4 className="font-bold text-gray-800 mt-2">
                                 {msg.isAnonymous ? (
                                     <span className="flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-0.5 rounded italic">
                                         <FaUserClock /> Anonymous Student
                                     </span>
                                 ) : (
                                     <>{msg.name} <span className="text-xs font-normal text-gray-500">&lt;{msg.email}&gt;</span></>
                                 )}
                             </h4>
                             <p className="text-gray-700 mt-1">{msg.message}</p>
                             <p className="text-xs text-gray-400 mt-2">{new Date(msg.createdAt).toLocaleString()}</p>
                        </div>
                        {msg.status === 'Pending' && (
                             <button onClick={() => handleMessageStatus(msg._id, 'Resolved')} className="text-green-600 hover:text-green-800 text-sm font-bold border border-green-200 px-3 py-1 rounded bg-green-50">
                                 Mark Resolved
                             </button>
                        )}
                        {msg.status === 'Resolved' && <span className="text-green-600 font-bold text-sm flex items-center gap-1"><FaCheck /> Resolved</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminInbox;
