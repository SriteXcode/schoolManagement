import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const Notices = () => {
    const [notices, setNotices] = useState([]);
    const [title, setTitle] = useState('');
    const [details, setDetails] = useState('');
    const [date, setDate] = useState('');
    const [targetAudience, setTargetAudience] = useState('All');
    const [targetClass, setTargetClass] = useState('');
    const [classes, setClasses] = useState([]);

    const fetchData = async () => {
        try {
            const [noticesRes, classesRes] = await Promise.all([
                api.get('/notice/getall'),
                api.get('/class/getall')
            ]);
            setNotices(noticesRes.data);
            setClasses(classesRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddNotice = async (e) => {
        e.preventDefault();
        try {
            await api.post('/notice/create', { 
                title, 
                details, 
                date,
                targetAudience,
                targetClass: targetAudience === 'Class' ? targetClass : null
            });
            toast.success('Notice posted!');
            setTitle('');
            setDetails('');
            setDate('');
            setTargetAudience('All');
            setTargetClass('');
            fetchData();
        } catch (error) {
            toast.error('Failed to post notice');
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Notices Board</h1>
            
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="mb-4 text-xl font-semibold text-gray-700">Post New Notice</h2>
                <form onSubmit={handleAddNotice} className="space-y-4">
                    <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 border rounded"/>
                    <textarea placeholder="Details" value={details} onChange={e => setDetails(e.target.value)} required className="w-full p-2 border rounded" rows="3"></textarea>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded"/>
                        
                        <div className="flex gap-4 items-center flex-wrap">
                            <span className="font-semibold text-gray-700">Target:</span>
                            {['All', 'Student', 'Teacher', 'Class'].map(opt => (
                                <label key={opt} className="flex items-center gap-1 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="audience" 
                                        value={opt} 
                                        checked={targetAudience === opt}
                                        onChange={e => setTargetAudience(e.target.value)}
                                    />
                                    {opt}
                                </label>
                            ))}
                        </div>
                    </div>

                    {targetAudience === 'Class' && (
                        <select 
                            className="w-full p-2 border rounded bg-gray-50"
                            value={targetClass}
                            onChange={e => setTargetClass(e.target.value)}
                            required
                        >
                            <option value="">Select Target Class</option>
                            {classes.map(c => (
                                <option key={c._id} value={c._id}>Class {c.grade}-{c.section}</option>
                            ))}
                        </select>
                    )}

                    <button type="submit" className="px-6 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">Post Notice</button>
                </form>
            </div>

            <div className="space-y-4">
                {notices.map(notice => (
                    <div key={notice._id} className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded shadow-sm relative">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">{notice.title}</h3>
                            <div className="flex flex-col items-end">
                                <span className="text-sm text-gray-500">{new Date(notice.date).toLocaleDateString()}</span>
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded mt-1">
                                    {notice.targetAudience === 'Class' && notice.targetClass ? 
                                        `Class ${notice.targetClass.grade}-${notice.targetClass.section}` : 
                                        notice.targetAudience
                                    }
                                </span>
                            </div>
                        </div>
                        <p className="mt-2 text-gray-700">{notice.details}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Notices;
