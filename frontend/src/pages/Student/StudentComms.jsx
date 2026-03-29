import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaPaperPlane, FaUserSecret, FaChalkboardTeacher, FaExclamationCircle } from 'react-icons/fa';

const StudentComms = () => {
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    type: 'Problem',
    recipientId: '', // Empty = Admin
    message: '',
    isAnonymous: false
  });
  const [loading, setLoading] = useState(false);
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await api.get('/teacher/getall');
        setTeachers(res.data);
      } catch (e) { console.error(e); }
    };
    fetchTeachers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/comms/send-auth', {
        ...formData,
        name: user.name,
        email: user.email
      });
      toast.success('Message sent successfully!');
      setFormData({ type: 'Problem', recipientId: '', message: '', isAnonymous: false });
    } catch (e) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Raise an Issue or Feedback</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-indigo-600">
            <h2 className="text-xl font-bold mb-4 text-gray-700">Compose Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
                    <select 
                        className="w-full p-2 border rounded"
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                        <option value="Problem">Report a Problem</option>
                        <option value="Feedback">Give Feedback</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                    <select 
                        className="w-full p-2 border rounded"
                        value={formData.recipientId}
                        onChange={e => setFormData({...formData, recipientId: e.target.value})}
                    >
                        <option value="">School Admin (General Issue)</option>
                        {teachers.map(t => (
                            <option key={t._id} value={t.user?._id}>{t.name} (Teacher)</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea 
                        required
                        rows="4"
                        className="w-full p-2 border rounded"
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        placeholder="Describe your issue or feedback..."
                    ></textarea>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                    <input 
                        type="checkbox" 
                        id="anon"
                        checked={formData.isAnonymous}
                        onChange={e => setFormData({...formData, isAnonymous: e.target.checked})}
                        className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <label htmlFor="anon" className="text-sm text-gray-700 cursor-pointer flex items-center gap-2">
                        <FaUserSecret /> Send Anonymously (Hide my name in dashboard)
                    </label>
                </div>

                <button 
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 flex justify-center items-center gap-2"
                >
                    {loading ? 'Sending...' : <><FaPaperPlane /> Send Message</>}
                </button>
            </form>
        </div>

        {/* Info */}
        <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg text-blue-800 border border-blue-100">
                <div className="flex items-center gap-3 mb-2">
                    <FaChalkboardTeacher className="text-2xl" />
                    <h3 className="font-bold text-lg">Feedback for Teachers</h3>
                </div>
                <p className="opacity-90 text-sm">
                    Positive feedback helps teachers improve! If you appreciate a teacher's method, let them know. 
                    If you have concerns about a subject, you can share them constructively.
                </p>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg text-orange-800 border border-orange-100">
                <div className="flex items-center gap-3 mb-2">
                    <FaExclamationCircle className="text-2xl" />
                    <h3 className="font-bold text-lg">Reporting Problems</h3>
                </div>
                <p className="opacity-90 text-sm">
                    Facing bullying, infrastructure issues, or academic trouble? Report it directly to the Admin. 
                    Your safety and comfort are our priority.
                </p>
            </div>
            
             <div className="bg-gray-100 p-4 rounded text-xs text-gray-500 text-center">
                Note: Even anonymous messages are stored in the database for safety and accountability purposes.
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudentComms;
