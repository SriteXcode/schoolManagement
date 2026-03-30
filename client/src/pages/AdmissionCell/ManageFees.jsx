import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
    Search, CreditCard, PlusCircle, ChevronRight, 
    ArrowLeft, Calendar, User, IndianRupee, X, Download, AlertTriangle, Filter, CheckSquare, Square, Trash2, ShieldAlert
} from 'lucide-react';

const ManageFees = () => {
  const [fees, setFees] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Filtering state
  const [minDue, setMinDue] = useState('');
  const [pendingMonth, setPendingMonth] = useState('');
  
  // View State
  const [selectedFee, setSelectedFee] = useState(null); // The full fee record of a student
  const [view, setView] = useState('list'); // 'list' or 'detail'
  
  // Modal State
  const [activeModal, setActiveModal] = useState(null); // 'payment', 'charge', 'bulk', 'confirm-bulk'
  const [bulkAction, setBulkAction] = useState(null); // 'mark-defaulter', 'mark-regular'
  const [targetMonth, setTargetMonth] = useState('');
  const [formData, setFormData] = useState({
      amount: '',
      paymentMethod: 'Cash',
      remarks: '',
      chargeName: '',
      chargeDescription: ''
  });

  const [bulkData, setBulkData] = useState({
      type: 'all', // all, class, students
      targetIds: [],
      month: 'April',
      name: '',
      amount: '',
      description: ''
  });

  const months = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];

  useEffect(() => {
    fetchFees();
    fetchClasses();
  }, [minDue, pendingMonth]);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (minDue) params.append('minDue', minDue);
      if (pendingMonth) params.append('pendingMonth', pendingMonth);

      const res = await api.get(`/fee/all?${params.toString()}`);
      setFees(res.data);
      if (selectedFee) {
          const updated = res.data.find(f => f._id === selectedFee._id);
          if (updated) setSelectedFee(updated);
      }
    } catch (error) {
      toast.error("Failed to fetch fee records");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
      try {
          const res = await api.get('/class/getall');
          setClasses(res.data);
      } catch (error) {
          console.error("Failed to fetch classes");
      }
  };

  const handleBulkDefaulter = async () => {
      if (selectedIds.length === 0) return;
      const isDefaulter = bulkAction === 'mark-defaulter';
      setLoading(true);
      try {
          await api.post('/fee/bulk-defaulter', {
              studentIds: selectedIds,
              isDefaulter: isDefaulter,
              defaulterNote: isDefaulter ? "Bulk marked by Admission Cell" : ""
          });
          toast.success(`Successfully updated ${selectedIds.length} students`);
          setSelectedIds([]);
          fetchFees();
          closeModal();
      } catch (error) {
          toast.error("Bulk update failed");
      } finally {
          setLoading(false);
      }
  };

  const toggleSelectAll = () => {
      if (selectedIds.length === filteredFees.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(filteredFees.map(f => f.student._id));
      }
  };

  const toggleSelect = (id) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(i => i !== id));
      } else {
          setSelectedIds([...selectedIds, id]);
      }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/fee/update/${selectedFee.student._id}`, {
          month: targetMonth,
          amount: formData.amount,
          paymentMethod: formData.paymentMethod,
          remarks: formData.remarks
      });
      toast.success(`Payment recorded for ${targetMonth}`);
      closeModal();
      fetchFees();
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment failed");
    }
  };

  const handleAddCharge = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/fee/apply-charges/${selectedFee.student._id}`, {
          month: targetMonth,
          name: formData.chargeName,
          amount: formData.amount,
          description: formData.chargeDescription
      });
      toast.success(`Extra charge applied to ${targetMonth}`);
      closeModal();
      fetchFees();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to apply charge");
    }
  };

  const handleBulkApply = async (e) => {
      e.preventDefault();
      try {
          await api.post('/fee/bulk-apply', bulkData);
          toast.success("Bulk charges applied successfully");
          closeModal();
          fetchFees();
      } catch (error) {
          toast.error(error.response?.data?.message || "Bulk apply failed");
      }
  };

  const handleToggleDefaulter = async (studentId, currentStatus) => {
    try {
        await api.patch(`/fee/defaulter/${studentId}`, {
            isDefaulter: !currentStatus,
            defaulterNote: !currentStatus ? "Marked by Admission Cell" : ""
        });
        toast.success(`Student ${!currentStatus ? 'marked as Defaulter' : 'removed from Defaulters'}`);
        fetchFees();
    } catch (error) {
        toast.error("Failed to update status");
    }
  };

  const downloadCSV = () => {
    const headers = ["Student Name", "Roll Number", "Class", "Total Paid", "Total Due", "Status", "Is Defaulter"];
    const rows = filteredFees.map(f => [
        f.student?.name,
        f.student?.rollNum,
        `${f.student?.sClass?.grade}-${f.student?.sClass?.section}`,
        f.totalPaid,
        f.totalDue,
        f.totalDue <= 0 ? "Cleared" : "Pending",
        f.isDefaulter ? "YES" : "NO"
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_fees_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closeModal = () => {
      setActiveModal(null);
      setFormData({ amount: '', paymentMethod: 'Cash', remarks: '', chargeName: '', chargeDescription: '' });
      setBulkData({ type: 'all', targetIds: [], month: 'April', name: '', amount: '', description: '' });
  };

  const filteredFees = fees.filter(f => 
    f.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.student?.rollNum.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && view === 'list' && !minDue && !pendingMonth && selectedIds.length === 0) return <div className="p-20 text-center font-black text-gray-300 animate-pulse">SYNCHRONIZING FINANCIAL LEDGERS...</div>;

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-8 max-w-7xl mx-auto pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
            {view === 'detail' && (
                <button onClick={() => setView('list')} className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm hover:bg-gray-50 transition text-indigo-600 border border-gray-100">
                    <ArrowLeft size={18} />
                </button>
            )}
            <div>
                <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">
                    {view === 'list' ? "Fee Management" : "Student Ledger"}
                </h1>
                <p className="text-xs md:text-sm text-gray-500 font-bold ml-0.5 md:ml-1">
                    {view === 'list' ? "Search and manage student monthly fees." : `${selectedFee?.student?.name} (${selectedFee?.student?.rollNum})`}
                </p>
            </div>
        </div>

        {view === 'list' && (
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <button 
                    onClick={downloadCSV}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 bg-green-600 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 transition shadow-lg shadow-green-100 text-[10px] md:text-xs"
                >
                    <Download size={16} className="md:w-5 md:h-5" /> <span className="hidden sm:inline">Export</span>
                </button>
                <button 
                    onClick={() => setActiveModal('bulk')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 text-[10px] md:text-xs"
                >
                    <PlusCircle size={16} className="md:w-5 md:h-5" /> Bulk Charge
                </button>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search Name or Roll..." 
                        className="pl-11 pr-4 py-3 md:py-4 w-full rounded-xl md:rounded-2xl border-none bg-white shadow-sm focus:ring-4 focus:ring-indigo-50 font-bold text-gray-700 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && view === 'list' && (
          <div className="bg-gray-900 text-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 animate-in slide-in-from-top-4 duration-300 shadow-2xl sticky top-4 z-40">
              <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg md:text-xl text-indigo-400">
                      {selectedIds.length}
                  </div>
                  <div>
                      <h4 className="font-black text-sm md:text-lg tracking-tight">Items Selected</h4>
                      <p className="text-white/50 text-[8px] md:text-xs font-bold uppercase tracking-widest">Apply status updates</p>
                  </div>
                  <button 
                    onClick={() => setSelectedIds([])}
                    className="ml-auto md:hidden p-2 bg-white/10 rounded-lg"
                  >
                    <X size={16} />
                  </button>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => { setBulkAction('mark-defaulter'); setActiveModal('confirm-bulk'); }}
                    className="flex-1 md:flex-none px-3 md:px-6 py-3 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[8px] md:text-[10px] hover:bg-red-700 transition flex items-center justify-center gap-2"
                  >
                      <ShieldAlert size={14} className="hidden sm:inline" /> Mark Defaulters
                  </button>
                  <button 
                    onClick={() => { setBulkAction('mark-regular'); setActiveModal('confirm-bulk'); }}
                    className="flex-1 md:flex-none px-3 md:px-6 py-3 bg-green-600 text-white rounded-xl font-black uppercase tracking-widest text-[8px] md:text-[10px] hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                      <User size={14} className="hidden sm:inline" /> Mark Regular
                  </button>
                  <button 
                    onClick={() => setSelectedIds([])}
                    className="hidden md:block px-6 py-3 bg-white/10 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-white/20 transition"
                  >
                      Cancel
                  </button>
              </div>
          </div>
      )}

      {/* Advanced Filters */}
      {view === 'list' && (
        <div className="bg-indigo-50/50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-indigo-100 flex flex-col md:flex-row gap-4 md:gap-6 items-stretch md:items-end">
            <div className="flex-1 space-y-1.5 md:space-y-2">
                <label className="text-[8px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Filter size={10} /> Minimum Due Amount
                </label>
                <input 
                    type="number" 
                    placeholder="e.g. 5000"
                    className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border-none bg-white shadow-sm focus:ring-4 focus:ring-indigo-500/10 font-bold text-gray-700 text-sm md:text-base"
                    value={minDue}
                    onChange={(e) => setMinDue(e.target.value)}
                />
            </div>
            <div className="flex-1 space-y-1.5 md:space-y-2">
                <label className="text-[8px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Calendar size={10} /> Pending for Month
                </label>
                <select 
                    className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border-none bg-white shadow-sm focus:ring-4 focus:ring-indigo-500/10 font-bold text-gray-700 text-sm md:text-base appearance-none cursor-pointer"
                    value={pendingMonth}
                    onChange={(e) => setPendingMonth(e.target.value)}
                >
                    <option value="">Any Month</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <button 
                onClick={() => { setMinDue(''); setPendingMonth(''); setSearchTerm(''); }}
                className="px-6 md:px-8 py-3 md:py-4 bg-white text-indigo-600 rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition shadow-sm border border-indigo-100 text-xs md:text-sm"
            >
                Clear
            </button>
        </div>
      )}

      {/* Main Content */}
      {view === 'list' ? (
        <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[800px] md:min-w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="py-4 md:py-6 px-4 md:px-8 w-12">
                                <button onClick={toggleSelectAll} className="text-indigo-600 flex items-center justify-center">
                                    {selectedIds.length === filteredFees.length && filteredFees.length > 0 ? <CheckSquare size={18}/> : <Square size={18}/>}
                                </button>
                            </th>
                            <th className="py-4 md:py-6 px-4 md:px-8">Student Detail</th>
                            <th className="py-4 md:py-6 px-4 md:px-8 text-center">Class</th>
                            <th className="py-4 md:py-6 px-4 md:px-8 text-right">Total Paid</th>
                            <th className="py-4 md:py-6 px-4 md:px-8 text-right">Total Due</th>
                            <th className="py-4 md:py-6 px-4 md:px-8 text-center">Status</th>
                            <th className="py-4 md:py-6 px-4 md:px-8 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredFees.map(fee => (
                            <tr key={fee._id} className={`hover:bg-gray-50/50 transition-colors group ${selectedIds.includes(fee.student._id) ? 'bg-indigo-50/30' : ''}`}>
                                <td className="py-4 md:py-6 px-4 md:px-8">
                                    <button onClick={() => toggleSelect(fee.student._id)} className="text-indigo-600 flex items-center justify-center">
                                        {selectedIds.includes(fee.student._id) ? <CheckSquare size={18}/> : <Square size={18}/>}
                                    </button>
                                </td>
                                <td className="py-4 md:py-6 px-4 md:px-8">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="relative">
                                            <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-50 text-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition text-xs md:text-base">
                                                {fee.student?.name?.charAt(0)}
                                            </div>
                                            {fee.isDefaulter && (
                                                <div className="absolute -top-1 -right-1 bg-red-600 text-white p-0.5 rounded-full border-2 border-white">
                                                    <AlertTriangle size={6} className="md:w-2 md:h-2" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className={`font-black text-xs md:text-sm ${fee.isDefaulter ? 'text-red-600' : 'text-gray-800'}`}>
                                                    {fee.student?.name}
                                                    {fee.isDefaulter && <span className="ml-1 text-red-600 inline-block animate-bounce">★</span>}
                                                </div>
                                            </div>
                                            <div className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{fee.student?.rollNum}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 md:py-6 px-4 md:px-8 text-center">
                                    <span className="px-2 md:px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] md:text-xs font-black">
                                        {fee.student?.sClass?.grade}-{fee.student?.sClass?.section}
                                    </span>
                                </td>
                                <td className="py-4 md:py-6 px-4 md:px-8 text-right font-black text-green-600 text-xs md:text-sm">₹{fee.totalPaid}</td>
                                <td className={`py-4 md:py-6 px-4 md:px-8 text-right font-black text-xs md:text-sm ${fee.totalDue <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {fee.totalDue < 0 ? `₹${Math.abs(fee.totalDue)} (Credit)` : `₹${fee.totalDue}`}
                                </td>
                                <td className="py-4 md:py-6 px-4 md:px-8 text-center">
                                    <span className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${
                                        fee.totalDue <= 0 ? 'bg-green-100 text-green-700 border-green-200' :
                                        fee.totalPaid > 0 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                        'bg-red-100 text-red-700 border-red-200'
                                    }`}>
                                        {fee.totalDue <= 0 ? 'CLEARED' : fee.totalPaid > 0 ? 'PARTIAL' : 'PENDING'}
                                    </span>
                                </td>
                                <td className="py-4 md:py-6 px-4 md:px-8 text-right">
                                    <div className="flex items-center justify-end gap-1.5 md:gap-2">
                                        <button 
                                            onClick={() => handleToggleDefaulter(fee.student?._id, fee.isDefaulter)}
                                            className={`p-2 md:p-3 rounded-lg md:rounded-xl transition shadow-sm ${fee.isDefaulter ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600'}`}
                                            title={fee.isDefaulter ? "Clear Defaulter Status" : "Mark as Defaulter"}
                                        >
                                            <AlertTriangle size={14} className="md:w-[18px] md:h-[18px]" />
                                        </button>
                                        <button 
                                            onClick={() => { setSelectedFee(fee); setView('detail'); }}
                                            className="p-2 md:p-3 bg-gray-900 text-white rounded-lg md:rounded-xl hover:bg-indigo-600 transition shadow-sm"
                                        >
                                            <ChevronRight size={14} className="md:w-[18px] md:h-[18px]" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filteredFees.length === 0 && (
                <div className="p-10 md:p-20 text-center text-gray-400 font-bold italic text-sm md:text-base">No financial records matching your filters...</div>
            )}
        </div>
      ) : (
        /* Detail View: Monthly Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {selectedFee.monthlyFees.map((m, idx) => {
                const monthTotal = m.charges.reduce((acc, c) => acc + c.amount, 0);
                const isPaid = m.status === 'Paid';

                return (
                    <div key={idx} className={`bg-white rounded-2xl md:rounded-[2rem] border overflow-hidden flex flex-col transition-all ${isPaid ? 'border-green-100 shadow-sm' : 'border-gray-100 shadow-md shadow-gray-100'}`}>
                        <div className="p-5 md:p-6 flex-1">
                            <div className="flex justify-between items-start mb-3 md:mb-4">
                                <h3 className="text-lg md:text-xl font-black text-gray-800">{m.month}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest border ${
                                    m.status === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' :
                                    m.status === 'Partial' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                    'bg-red-100 text-red-700 border-red-200'
                                }`}>
                                    {m.status}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4 md:mb-6">
                                {m.charges.map((c, ci) => (
                                    <div key={ci} className="flex justify-between text-[10px] md:text-[11px] font-bold text-gray-500">
                                        <span className="line-clamp-1 flex-1">{c.name}</span>
                                        <span className="ml-2">₹{c.amount}</span>
                                    </div>
                                ))}
                                <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between text-xs md:text-sm font-black text-gray-800">
                                    <span>Total</span>
                                    <span>₹{monthTotal}</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase mt-auto">
                                <span className="text-indigo-600">Paid: ₹{m.paidAmount}</span>
                                <span className={`${monthTotal - m.paidAmount <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {monthTotal - m.paidAmount < 0 ? `Credit: ₹${Math.abs(monthTotal - m.paidAmount)}` : `Due: ₹${monthTotal - m.paidAmount}`}
                                </span>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-3 md:p-4 grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => { 
                                setTargetMonth(m.month); 
                                setActiveModal('payment'); 
                                setFormData({ ...formData, amount: monthTotal - m.paidAmount });
                            }}
                            disabled={isPaid}
                            className={`flex items-center justify-center gap-2 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition ${isPaid ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                        >
                            <CreditCard size={12} className="md:w-3.5 md:h-3.5" /> Pay
                        </button>
                        <button 
                            onClick={() => { setTargetMonth(m.month); setActiveModal('charge'); }}
                            className="flex items-center justify-center gap-2 py-2 md:py-2.5 bg-gray-900 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition"
                        >
                            <PlusCircle size={12} className="md:w-3.5 md:h-3.5" /> Charge
                        </button>
                        </div>
                    </div>
                );
            })}
        </div>
      )}

      {/* Bulk Confirmation Modal */}
      {activeModal === 'confirm-bulk' && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200">
                  <div className={`p-6 md:p-8 text-white ${bulkAction === 'mark-defaulter' ? 'bg-red-600' : 'bg-green-600'}`}>
                      <AlertTriangle className="mb-3 md:mb-4 w-10 h-10 md:w-12 md:h-12" />
                      <h3 className="text-xl md:text-2xl font-black">Confirm Bulk Action</h3>
                      <p className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">
                          Updating {selectedIds.length} student records
                      </p>
                  </div>
                  <div className="p-6 md:p-8 space-y-4 md:space-y-6">
                      <p className="text-gray-600 font-bold leading-relaxed text-sm md:text-base">
                          Are you sure you want to mark these {selectedIds.length} students as <span className="font-black underline">{bulkAction === 'mark-defaulter' ? 'DEFAULTERS' : 'REGULAR'}</span>? 
                          This will reflect on their ID cards and they will receive a notification.
                      </p>
                      <div className="flex gap-2 md:gap-3">
                          <button onClick={closeModal} className="flex-1 py-3 md:py-4 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 rounded-xl md:rounded-2xl transition text-xs md:text-sm">Cancel</button>
                          <button 
                              onClick={handleBulkDefaulter}
                              className={`flex-[2] py-3 md:py-4 text-white font-black uppercase tracking-widest rounded-xl md:rounded-2xl shadow-lg transition text-xs md:text-sm ${bulkAction === 'mark-defaulter' ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-green-600 hover:bg-green-700 shadow-green-100'}`}
                          >
                              Confirm & Notify
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Payment Modal */}
      {activeModal === 'payment' && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="bg-green-600 p-6 md:p-8 text-white relative flex-shrink-0">
                    <button onClick={closeModal} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition">
                        <X size={20} />
                    </button>
                    <h3 className="text-xl md:text-2xl font-black">Record Payment</h3>
                    <p className="text-green-100 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Collecting for {targetMonth}</p>
                </div>
                <form onSubmit={handlePayment} className="p-6 md:p-8 space-y-4 md:space-y-5 overflow-y-auto custom-scrollbar">
                    <div>
                        <div className="flex justify-between items-end mb-2 px-1">
                            <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Amount (₹)</label>
                            {(() => {
                                const m = selectedFee.monthlyFees.find(mf => mf.month === targetMonth);
                                const currentDue = m.charges.reduce((acc, c) => acc + c.amount, 0) - m.paidAmount;
                                const remaining = currentDue - (Number(formData.amount) || 0);
                                return (
                                    <div className="text-right">
                                        <div className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase">Remaining Due</div>
                                        <div className={`text-[10px] md:text-xs font-black ${remaining <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            ₹{remaining.toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                        <input 
                            type="number" required
                            className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-xl md:rounded-2xl focus:ring-4 focus:ring-green-50 font-black text-gray-700 text-sm md:text-base"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Payment Mode</label>
                        <select 
                            className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-xl md:rounded-2xl focus:ring-4 focus:ring-green-50 font-black text-gray-700 text-sm md:text-base appearance-none cursor-pointer"
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                        >
                            <option>Cash</option>
                            <option>UPI</option>
                            <option>Card</option>
                            <option>Online</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Internal Remarks</label>
                        <input 
                            type="text"
                            className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-xl md:rounded-2xl focus:ring-4 focus:ring-green-50 font-bold text-gray-700 text-sm md:text-base"
                            placeholder="Txn ID or Receipt No..."
                            value={formData.remarks}
                            onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                        />
                    </div>
                    <div className="pt-4 flex gap-2 md:gap-3 flex-shrink-0">
                        <button type="button" onClick={closeModal} className="flex-1 py-3 md:py-4 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 rounded-xl md:rounded-2xl transition text-xs md:text-sm">Cancel</button>
                        <button type="submit" className="flex-[2] py-3 md:py-4 bg-green-600 text-white font-black uppercase tracking-widest hover:bg-green-700 rounded-xl md:rounded-2xl shadow-lg shadow-green-100 transition text-xs md:text-sm">Complete</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Extra Charge Modal */}
      {activeModal === 'charge' && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="bg-gray-900 p-6 md:p-8 text-white relative flex-shrink-0">
                    <button onClick={closeModal} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition">
                        <X size={20} />
                    </button>
                    <h3 className="text-xl md:text-2xl font-black">Apply New Charge</h3>
                    <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Adding to {targetMonth} invoice</p>
                </div>
                <form onSubmit={handleAddCharge} className="p-6 md:p-8 space-y-4 md:space-y-5 overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Charge Type/Name</label>
                        <input 
                            type="text" required
                            className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-xl md:rounded-2xl focus:ring-4 focus:ring-indigo-50 font-black text-gray-700 text-sm md:text-base"
                            placeholder="e.g. Exam Fee, Library Fine"
                            value={formData.chargeName}
                            onChange={(e) => setFormData({...formData, chargeName: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Amount (₹)</label>
                        <input 
                            type="number" required
                            className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-xl md:rounded-2xl focus:ring-4 focus:ring-indigo-50 font-black text-gray-700 text-sm md:text-base"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Description</label>
                        <input 
                            type="text"
                            className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-xl md:rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-gray-700 text-sm md:text-base"
                            placeholder="Brief details..."
                            value={formData.chargeDescription}
                            onChange={(e) => setFormData({...formData, chargeDescription: e.target.value})}
                        />
                    </div>
                    <div className="pt-4 flex gap-2 md:gap-3 flex-shrink-0">
                        <button type="button" onClick={closeModal} className="flex-1 py-3 md:py-4 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 rounded-xl md:rounded-2xl transition text-xs md:text-sm">Cancel</button>
                        <button type="submit" className="flex-[2] py-3 md:py-4 bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-700 rounded-xl md:rounded-2xl shadow-lg shadow-indigo-100 transition text-xs md:text-sm">Apply Charge</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Bulk Apply Modal */}
      {activeModal === 'bulk' && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="bg-indigo-600 p-6 md:p-8 text-white relative flex-shrink-0">
                    <button onClick={closeModal} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition">
                        <X size={20} />
                    </button>
                    <h3 className="text-xl md:text-2xl font-black">Bulk Charge Operation</h3>
                    <p className="text-indigo-100 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Apply to multiple students</p>
                </div>
                <form onSubmit={handleBulkApply} className="p-6 md:p-8 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Target Group</label>
                                <select 
                                    className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-xl md:rounded-2xl focus:ring-4 focus:ring-indigo-50 font-black text-gray-700 text-sm md:text-base appearance-none cursor-pointer"
                                    value={bulkData.type}
                                    onChange={(e) => setBulkData({...bulkData, type: e.target.value, targetIds: []})}
                                >
                                    <option value="all">Everyone</option>
                                    <option value="class">Specific Grade</option>
                                    <option value="section">Specific Section</option>
                                    <option value="students">Specific Students</option>
                                </select>
                            </div>

                            {bulkData.type !== 'all' && (
                                <div className="animate-in slide-in-from-top-2">
                                    <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                                        Select {bulkData.type === 'class' ? 'Grades' : bulkData.type === 'section' ? 'Sections' : 'Students'}
                                    </label>
                                    <select 
                                        multiple
                                        className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-xl md:rounded-2xl focus:ring-4 focus:ring-indigo-50 font-black text-gray-700 min-h-[100px] md:min-h-[120px] text-xs md:text-sm"
                                        value={bulkData.targetIds}
                                        onChange={(e) => setBulkData({...bulkData, targetIds: Array.from(e.target.selectedOptions, option => option.value)})}
                                    >
                                        {bulkData.type === 'class' && Array.from(new Set(classes.map(c => c.grade))).map(grade => (
                                            <option key={grade} value={grade}>Grade {grade}</option>
                                        ))}
                                        {bulkData.type === 'section' && classes.map(c => (
                                            <option key={c._id} value={c._id}>{c.grade}-{c.section}</option>
                                        ))}
                                        {bulkData.type === 'students' && fees.map(f => (
                                            <option key={f.student?._id} value={f.student?._id}>{f.student?.name} ({f.student?.rollNum})</option>
                                        ))}
                                    </select>
                                    <p className="text-[7px] md:text-[8px] text-gray-400 mt-1.5 ml-1 font-bold uppercase">Hold Ctrl/Cmd to multi-select</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Target Month</label>
                                <select 
                                    className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-xl md:rounded-2xl focus:ring-4 focus:ring-indigo-50 font-black text-gray-700 text-sm md:text-base appearance-none cursor-pointer"
                                    value={bulkData.month}
                                    onChange={(e) => setBulkData({...bulkData, month: e.target.value})}
                                >
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Charge Name</label>
                                <input 
                                    type="text" required
                                    className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-xl md:rounded-2xl focus:ring-4 focus:ring-indigo-50 font-black text-gray-700 text-sm md:text-base"
                                    placeholder="e.g. Annual Sports Fee"
                                    value={bulkData.name}
                                    onChange={(e) => setBulkData({...bulkData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Amount (₹)</label>
                                <input 
                                    type="number" required
                                    className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-xl md:rounded-2xl focus:ring-4 focus:ring-indigo-50 font-black text-gray-700 text-sm md:text-base"
                                    placeholder="0.00"
                                    value={bulkData.amount}
                                    onChange={(e) => setBulkData({...bulkData, amount: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Description</label>
                                <textarea 
                                    className="w-full p-3 md:p-4 bg-gray-50 border-none rounded-xl md:rounded-2xl focus:ring-4 focus:ring-indigo-50 font-bold text-gray-700 min-h-[80px] md:min-h-[100px] text-sm md:text-base"
                                    placeholder="Optional details..."
                                    value={bulkData.description}
                                    onChange={(e) => setBulkData({...bulkData, description: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex gap-2 md:gap-3 flex-shrink-0">
                        <button type="button" onClick={closeModal} className="flex-1 py-3 md:py-4 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 rounded-xl md:rounded-2xl transition text-xs md:text-sm">Cancel</button>
                        <button type="submit" className="flex-[2] py-3 md:py-4 bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-700 rounded-xl md:rounded-2xl shadow-lg shadow-indigo-100 transition text-xs md:text-sm">Execute Bulk Charge</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default ManageFees;
