import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
    CreditCard, CheckCircle, Clock, AlertCircle, 
    ChevronDown, ChevronUp, Calendar, IndianRupee 
} from 'lucide-react';

const StudentFees = () => {
  const [feeData, setFeeData] = useState(null);
  const [schoolConfig, setSchoolConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [viewReceipt, setViewReceipt] = useState(null);

  useEffect(() => {
    fetchFee();
  }, []);

  const fetchFee = async () => {
    try {
      const res = await axios.get('/fee/student');
      setFeeData(res.data.fee);
      setSchoolConfig(res.data.schoolConfig);
      // Auto-expand current or first unpaid month
      const unpaid = res.data.fee.monthlyFees.find(m => m.status !== 'Paid');
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

  const printReceipt = () => {
      const printContent = document.getElementById('fee-receipt-content');
      const WinPrint = window.open('', '', 'width=900,height=650');
      WinPrint.document.write(`
        <html>
          <head>
            <title>Fee Receipt</title>
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
                  <div className="w-px h-10 bg-indigo-500/50 self-center"></div>
                  <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Yearly Balance</div>
                      <div className="text-2xl font-black">₹{feeData.totalYearlyDue}</div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Monthly Fee List */}
          <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-black text-gray-800 px-2">Payment Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            <div key={ci} className={`flex justify-between items-center py-2 px-3 rounded-xl border transition-all ${c.status === 'Paid' ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                                                <div className="flex items-center gap-2">
                                                    {c.status === 'Paid' && <CheckCircle className="text-green-500" size={14} />}
                                                    <div>
                                                        <div className={`text-xs font-bold ${c.status === 'Paid' ? 'text-green-800' : 'text-gray-700'}`}>{c.name}</div>
                                                        {c.description && <div className="text-[10px] text-gray-400">{c.description}</div>}
                                                    </div>
                                                </div>
                                                <div className={`text-sm font-black ${c.status === 'Paid' ? 'text-green-600' : 'text-gray-800'}`}>₹{c.amount}</div>
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
          </div>

          {/* Transaction History Sidebar */}
          <div className="lg:col-span-1 space-y-6">
              <h2 className="text-2xl font-black text-gray-800 px-2">Recent Payments</h2>
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 space-y-4">
                  {(feeData.transactions || []).length > 0 ? (
                      [...feeData.transactions].reverse().map((txn, tIdx) => (
                          <div key={tIdx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all group">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                      <CheckCircle size={18} />
                                  </div>
                                  <div>
                                      <div className="text-xs font-black text-gray-800">₹{txn.amount}</div>
                                      <div className="text-[9px] font-bold text-gray-400 uppercase">{txn.month} Payment</div>
                                  </div>
                              </div>
                              <button 
                                onClick={() => setViewReceipt(txn)}
                                className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-600 hover:text-white"
                              >
                                  <IndianRupee size={14} />
                              </button>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-10">
                          <Clock className="mx-auto text-gray-300 mb-2" size={32} />
                          <p className="text-[10px] font-bold text-gray-400 uppercase">No transactions found</p>
                      </div>
                  )}
              </div>
          </div>
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

      {/* Receipt Modal */}
      {viewReceipt && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in duration-300">
                  <div id="fee-receipt-content" className="p-10 space-y-8">
                      <div className="flex justify-between items-start border-b-2 border-gray-100 pb-6">
                          <div>
                              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{schoolConfig?.name || "Academic Institution"}</h2>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{schoolConfig?.address || "School Campus Address"}</p>
                          </div>
                          <div className="text-right">
                              <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Receipt #</div>
                              <div className="font-mono text-sm font-bold text-gray-300">{viewReceipt._id?.slice(-8).toUpperCase() || "NEW-TXN"}</div>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 text-[11px]">
                          <div className="space-y-4">
                              <div>
                                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Student</div>
                                  <div className="font-black text-gray-800 uppercase">{feeData.student?.name}</div>
                                  <div className="font-bold text-gray-500">Roll: {feeData.student?.rollNum}</div>
                              </div>
                              <div>
                                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Class</div>
                                  <div className="font-bold text-gray-800 uppercase">{feeData.student?.sClass?.grade}-{feeData.student?.sClass?.section}</div>
                              </div>
                          </div>
                          <div className="space-y-4 text-right">
                              <div>
                                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</div>
                                  <div className="font-bold text-gray-800">{new Date(viewReceipt.date).toLocaleDateString()}</div>
                              </div>
                              <div>
                                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Mode</div>
                                  <div className="font-bold text-gray-800 uppercase">{viewReceipt.paymentMethod}</div>
                              </div>
                          </div>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                          <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2">
                              <span>Description</span>
                              <span>Amount</span>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-700">Fee Payment for {viewReceipt.month}</span>
                              <span className="text-xs font-black text-gray-900">₹{viewReceipt.amount}</span>
                          </div>
                          {viewReceipt.remarks && (
                              <div className="text-[9px] text-gray-400 italic">Remarks: {viewReceipt.remarks}</div>
                          )}
                          <div className="pt-4 border-t-2 border-gray-900 flex justify-between items-center">
                              <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Total Paid</span>
                              <span className="text-xl font-black text-gray-900">₹{viewReceipt.amount}</span>
                          </div>
                      </div>

                      <div className="pt-6 text-center">
                          <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.3em]">This is a computer generated receipt</p>
                      </div>
                  </div>

                  <div className="p-8 bg-gray-50 border-t border-slate-100 flex gap-4">
                      <button 
                        onClick={printReceipt}
                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition flex items-center justify-center gap-2 shadow-xl shadow-slate-100"
                      >
                          <IndianRupee size={18} /> Download PDF
                      </button>
                      <button 
                        onClick={() => setViewReceipt(null)}
                        className="px-8 py-4 bg-white text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest border border-slate-100 hover:bg-slate-100 transition"
                      >
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StudentFees;
