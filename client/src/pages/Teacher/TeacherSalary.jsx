import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
    FaMoneyBillWave, FaFileInvoiceDollar, FaPrint, FaTimes, FaCalendarAlt, FaUniversity
} from 'react-icons/fa';
import { DollarSign, FileText } from 'lucide-react';

const TeacherSalary = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewReceipt, setViewReceipt] = useState(null);
  const [schoolConfig, setSchoolConfig] = useState(null);
  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salaryRes, schoolRes] = await Promise.all([
        api.get(`/management/salary/history/${user._id}`),
        api.get('/management/school/config')
      ]);
      setSalaries(salaryRes.data);
      setSchoolConfig(schoolRes.data);
    } catch (err) {
      toast.error("Failed to load financial records");
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
      const printContent = document.getElementById('salary-receipt-content');
      const WinPrint = window.open('', '', 'width=900,height=650');
      WinPrint.document.write(`
        <html>
          <head>
            <title>Pay Slip</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
                @media print {
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
          </head>
          <body class="p-10">
            ${printContent.innerHTML}
            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      WinPrint.document.close();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-emerald-600 font-black animate-pulse uppercase tracking-[0.2em]">
        Accessing Secure Payroll Archives...
    </div>
  );

  return (
    <div className="space-y-10 max-w-6xl mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <FaMoneyBillWave className="text-emerald-600" /> Payroll & Earnings
                </h1>
                <p className="text-slate-500 font-bold ml-1 uppercase text-[10px] tracking-widest mt-2">Manage your digital pay slips and tax records</p>
            </div>
            
            <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 flex items-center gap-4">
                <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Lifetime Earnings</p>
                    <p className="text-xl font-black text-emerald-700">₹{salaries.reduce((acc, s) => acc + (s.status === 'Paid' ? s.totalAmount : 0), 0)}</p>
                </div>
                <div className="w-px h-8 bg-emerald-200"></div>
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                    <FaUniversity />
                </div>
            </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-soft border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <FaFileInvoiceDollar className="text-emerald-500" /> Payment History
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="py-6 px-8">Period</th>
                            <th className="py-6 px-8">Base Salary</th>
                            <th className="py-6 px-8">Incentives</th>
                            <th className="py-6 px-8">Deductions</th>
                            <th className="py-6 px-8">Net Payable</th>
                            <th className="py-6 px-8">Status</th>
                            <th className="py-6 px-8 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {salaries.map(record => {
                            const incentives = (record.bonus || 0) + (record.increment || 0) + (record.hike || 0);
                            const deductions = (record.deductions || []).reduce((acc, d) => acc + d.amount, 0);
                            
                            return (
                                <tr key={record._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-6 px-8">
                                        <div className="font-black text-slate-800">{record.month} {record.year}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            {record.paymentDate ? `Paid on ${new Date(record.paymentDate).toLocaleDateString()}` : 'Awaiting disbursement'}
                                        </div>
                                    </td>
                                    <td className="py-6 px-8 font-bold text-slate-600">₹{record.baseSalary}</td>
                                    <td className="py-6 px-8 text-emerald-600 font-bold">
                                        {incentives > 0 ? `+₹${incentives}` : '—'}
                                    </td>
                                    <td className="py-6 px-8 text-rose-500 font-bold">
                                        {deductions > 0 ? `-₹${deductions}` : '—'}
                                    </td>
                                    <td className="py-6 px-8 font-black text-slate-900 text-lg">₹{record.totalAmount}</td>
                                    <td className="py-6 px-8">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                            record.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="py-6 px-8 text-right">
                                        {record.status === 'Paid' && (
                                            <button 
                                                onClick={() => setViewReceipt(record)}
                                                className="p-3 bg-white text-emerald-600 rounded-xl shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-600 hover:text-white"
                                                title="View Pay Slip"
                                            >
                                                <FileText size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {salaries.length === 0 && (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                            <FaCalendarAlt size={32} />
                        </div>
                        <p className="text-slate-400 font-bold italic uppercase text-xs tracking-widest">No payroll records found for your account</p>
                    </div>
                )}
            </div>
        </div>

        {/* Receipt Modal */}
        {viewReceipt && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in duration-300">
                    <div id="salary-receipt-content" className="p-12 space-y-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-4 shadow-xl">
                                    <DollarSign size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{schoolConfig?.name || "EduManage School"}</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{schoolConfig?.address || "Main Campus, Digital City"}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Record #</div>
                                <div className="font-mono text-sm font-bold text-slate-300">{viewReceipt._id.slice(-8).toUpperCase()}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 border-y border-slate-50 py-8">
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee</div>
                                <div className="font-black text-slate-800 uppercase">{user.name}</div>
                                <div className="text-xs font-bold text-slate-500 uppercase">{user.role}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pay Period</div>
                                <div className="font-black text-slate-800">{viewReceipt.month} {viewReceipt.year}</div>
                                <div className="text-xs font-bold text-slate-500">Released: {new Date(viewReceipt.paymentDate).toLocaleDateString()}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between text-sm font-bold text-slate-600">
                                <span>Fixed Base Pay</span>
                                <span>₹{viewReceipt.baseSalary}</span>
                            </div>
                            {viewReceipt.bonus > 0 && (
                                <div className="flex justify-between text-sm font-bold text-emerald-600">
                                    <span>Performance Bonus</span>
                                    <span>+ ₹{viewReceipt.bonus}</span>
                                </div>
                            )}
                            {viewReceipt.increment > 0 && (
                                <div className="flex justify-between text-sm font-bold text-indigo-600">
                                    <span>Session Increment</span>
                                    <span>+ ₹{viewReceipt.increment}</span>
                                </div>
                            )}
                            {viewReceipt.hike > 0 && (
                                <div className="flex justify-between text-sm font-bold text-blue-600">
                                    <span>Annual Hike</span>
                                    <span>+ ₹{viewReceipt.hike}</span>
                                </div>
                            )}
                            {viewReceipt.deductions?.map((d, i) => (
                                <div key={i} className="flex justify-between text-sm font-bold text-rose-600">
                                    <span>{d.name || 'Deduction'}</span>
                                    <span>- ₹{d.amount}</span>
                                </div>
                            ))}
                            <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center">
                                <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Net Disbursement</span>
                                <span className="text-2xl font-black text-slate-900">₹{viewReceipt.totalAmount}</span>
                            </div>
                        </div>

                        <div className="pt-10 flex flex-col items-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center mb-4">
                                <div className="text-[8px] font-black text-slate-200 uppercase rotate-[-45deg]">Confidential</div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-300 text-center uppercase tracking-[0.2em]">Authentic Digital Statement<br/>Verified by Institution Admin</p>
                        </div>
                    </div>
                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                        <button 
                            onClick={printReceipt} 
                            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition flex items-center justify-center gap-2 shadow-xl shadow-slate-100"
                        >
                            <FaPrint /> Download PDF
                        </button>
                        <button 
                            onClick={() => setViewReceipt(null)} 
                            className="px-8 py-4 bg-white text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest border border-slate-100 hover:bg-slate-100 transition"
                        >Close</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default TeacherSalary;
