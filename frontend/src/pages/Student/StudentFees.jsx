import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
    CreditCard, CheckCircle, Clock, AlertCircle, 
    ChevronDown, ChevronUp, Calendar, IndianRupee 
} from 'lucide-react';

const StudentFees = () => {
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState(null);

  useEffect(() => {
    fetchFee();
  }, []);

  const fetchFee = async () => {
    try {
      const res = await axios.get('/fee/student');
      setFeeData(res.data);
      // Auto-expand current or first unpaid month
      const unpaid = res.data.monthlyFees.find(m => m.status !== 'Paid');
      if (unpaid) setExpandedMonth(unpaid.month);
    } catch (error) {
      toast.error("Failed to fetch fee status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
        case 'Paid': return 'bg-green-100 text-green-700 border-green-200';
        case 'Partial': return 'bg-amber-100 text-amber-700 border-amber-200';
        default: return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-indigo-600 font-bold animate-pulse">
        SECURELY FETCHING FINANCIAL RECORDS...
    </div>
  );

  if (!feeData) return (
    <div className="p-12 text-center bg-white rounded-3xl shadow-sm border border-dashed border-gray-200 m-8">
        <AlertCircle className="mx-auto mb-4 text-gray-300" size={48} />
        <h2 className="text-xl font-bold text-gray-800">No Fee structure found</h2>
        <p className="text-gray-500 mt-2">Please contact the Admission Cell to initialize your monthly fee records.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10">
      {/* Financial Summary Header */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-indigo-600 p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                  <h1 className="text-3xl font-black flex items-center gap-3">
                      <CreditCard size={32} /> Academic Ledger
                  </h1>
                  <p className="text-indigo-100 font-medium mt-1 uppercase tracking-widest text-[10px]">Session {feeData.academicYear}</p>
              </div>
              <div className="flex gap-8 text-center">
                  <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Total Paid</div>
                      <div className="text-2xl font-black">₹{feeData.totalPaid}</div>
                  </div>
                  <div className="w-px h-10 bg-indigo-500/50 self-center"></div>
                  <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Total Due</div>
                      <div className="text-2xl font-black">₹{feeData.totalDue}</div>
                  </div>
              </div>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                      <Calendar size={20} />
                  </div>
                  <div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Monthly Fee</div>
                      <div className="text-lg font-bold text-gray-800">₹{feeData.baseMonthlyFee}</div>
                  </div>
              </div>
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-center">
                  <p className="text-xs font-bold text-indigo-600 flex items-center gap-2">
                      <AlertCircle size={14} /> Please visit Admission Cell for offline payments.
                  </p>
              </div>
          </div>
      </div>

      {/* Monthly Fee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feeData.monthlyFees.map((m, idx) => {
              const monthTotal = m.charges.reduce((acc, c) => acc + c.amount, 0);
              const isExpanded = expandedMonth === m.month;

              return (
                <div 
                    key={idx} 
                    className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden flex flex-col h-fit ${isExpanded ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-lg' : 'border-gray-100 hover:border-gray-200 shadow-sm'}`}
                >
                    {/* Month Header Card */}
                    <div 
                        onClick={() => setExpandedMonth(isExpanded ? null : m.month)}
                        className={`p-6 cursor-pointer select-none transition-colors ${isExpanded ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-black text-gray-800">{m.month}</h3>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Due: {new Date(m.dueDate).toLocaleDateString()}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(m.status)}`}>
                                {m.status}
                            </span>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Amount</div>
                                <div className="text-2xl font-black text-gray-800">₹{monthTotal}</div>
                            </div>
                            {isExpanded ? <ChevronUp className="text-indigo-400" /> : <ChevronDown className="text-gray-300" />}
                        </div>
                    </div>

                    {/* Expandable Details */}
                    {isExpanded && (
                        <div className="p-6 pt-0 space-y-4 border-t border-indigo-50/50 animate-in slide-in-from-top-2 duration-300">
                            {/* Charges List */}
                            <div className="space-y-2 mt-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Fee Breakdown</h4>
                                {m.charges.map((c, ci) => (
                                    <div key={ci} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <div className="text-xs font-bold text-gray-700">{c.name}</div>
                                            {c.description && <div className="text-[10px] text-gray-400">{c.description}</div>}
                                        </div>
                                        <div className="text-sm font-black text-gray-800">₹{c.amount}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Payment Progress */}
                            <div className="pt-4 border-t border-dashed border-gray-200">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                                    <span className="text-gray-400">Paid: ₹{m.paidAmount}</span>
                                    <span className="text-indigo-600">Remaining: ₹{monthTotal - m.paidAmount}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${m.status === 'Paid' ? 'bg-green-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${(m.paidAmount / monthTotal) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {m.lastPaymentDate && (
                                <div className="text-[10px] text-center font-bold text-gray-400 mt-2 italic">
                                    Last payment on {new Date(m.lastPaymentDate).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    )}
                </div>
              )
          })}
      </div>

      {/* Information Footer */}
      <div className="bg-gray-100 p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                  <AlertCircle />
              </div>
              <p className="text-sm font-bold text-gray-600 max-w-md">
                  Late fees may apply if payments are made after the 10th of each month. 
                  Digital payment integration is coming soon.
              </p>
          </div>
          <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition group">
              <span className="flex items-center gap-2 italic">
                <IndianRupee size={16} /> Pay All Dues
              </span>
          </button>
      </div>
    </div>
  );
};

export default StudentFees;
