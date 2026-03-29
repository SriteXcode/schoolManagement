import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import { FileText, PlusCircle, CheckCircle } from 'lucide-react';

const ExamCellDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await axios.get('/exam/all'); // Need to ensure /all exists or fetch by class
      setExams(res.data);
    } catch (error) {
      console.error("Exam fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Exam Cell Control Panel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
          <div className="text-gray-500 text-sm">Active Exams</div>
          <div className="text-2xl font-bold">12</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <div className="text-gray-500 text-sm">Results Declared</div>
          <div className="text-2xl font-bold">45</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <div className="text-gray-500 text-sm">Pending Verifications</div>
          <div className="text-2xl font-bold">8</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Exams</h2>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <PlusCircle size={18} />
            <span>Create New Exam</span>
          </button>
        </div>
        {/* Table list of exams would go here */}
        <p className="text-gray-500 italic text-center py-8">Manage all school examinations and result generation here.</p>
      </div>
    </div>
  );
};

export default ExamCellDashboard;
