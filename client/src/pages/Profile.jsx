import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPhone, FaEnvelope, FaIdCard, FaCamera, FaLock, FaEdit, FaTimes, FaCheck, FaMapMarkerAlt, FaTint, FaDownload, FaSchool } from 'react-icons/fa';

const Profile = () => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};
  const isStudent = user.role === 'Student';
  const isTeacher = user.role === 'Teacher';

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    email: user.email || '',
    profileImage: user.profileImage || '',
    bloodGroup: 'Unknown',
    address: '',
    qualification: '',
    age: '',
    remark: '',
    transportMode: 'By Foot',
    bus: '',
    isDefaulter: false,
    password: ''
  });
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showIDCard, setShowIDCard] = useState(false);

  useEffect(() => {
      const fetchProfile = async () => {
          try {
              let res;
              if (isStudent) {
                  res = await api.get('/student/profile');
              } else if (isTeacher) {
                  res = await api.get('/teacher/profile');
              }
              
              if (res) {
                  let feeStatus = false;
                  if (isStudent) {
                      try {
                          const feeRes = await api.get('/fee/student');
                          feeStatus = feeRes.data.isDefaulter;
                      } catch (e) { console.error("Fee fetch failed"); }
                  }

                  setProfileData(res.data);
                  setFormData(prev => ({
                      ...prev,
                      name: res.data.name || prev.name,
                      email: res.data.email || prev.email,
                      bloodGroup: res.data.bloodGroup || 'Unknown',
                      address: res.data.address || '',
                      profileImage: res.data.profileImage || prev.profileImage,
                      qualification: res.data.qualification || '',
                      age: res.data.age || '',
                      remark: res.data.remark || '',
                      transportMode: res.data.transportMode || 'By Foot',
                      bus: res.data.bus?._id || res.data.bus || '',
                      isDefaulter: feeStatus
                  }));

                  if (isStudent) {
                      try {
                          const busesRes = await api.get('/management/bus/all');
                          setBuses(busesRes.data);
                      } catch (e) { console.error("Bus fetch failed"); }
                  }
              }
          } catch (err) {
              console.error("Failed to fetch profile", err);
          }
      };
      fetchProfile();
  }, [isStudent, isTeacher]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const authRes = await api.put('/auth/update-profile', {
          name: formData.name,
          phone: formData.phone,
          profileImage: formData.profileImage,
          password: formData.password
      });
      localStorage.setItem('user', JSON.stringify(authRes.data));

      if (isStudent && profileData) {
          await api.put(`/student/update/${profileData._id}`, {
              bloodGroup: formData.bloodGroup,
              address: formData.address,
              profileImage: formData.profileImage,
              remark: formData.remark,
              transportMode: formData.transportMode,
              bus: formData.bus
          });
      } else if (isTeacher && profileData) {
          await api.put(`/teacher/update/${profileData._id}`, {
              qualification: formData.qualification,
              age: formData.age,
              profileImage: formData.profileImage,
              remark: formData.remark,
              name: formData.name,
              email: formData.email,
              phone: formData.phone
          });
      }

      toast.success('Profile updated successfully!');
      setFormData(prev => ({ ...prev, password: '' }));
      setIsEditing(false);
      window.location.reload(); 
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintID = () => {
    const printContents = document.getElementById('printable-id-card').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Identity Card - ${user.name}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print { body { margin: 0; padding: 0; } #printable-id-card { width: 100%; } }
                </style>
            </head>
            <body class="bg-white">
                <div class="flex items-center justify-center min-h-screen">${printContents}</div>
                <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
        </html>
    `);
    printWindow.document.close();
  };

  const cancelEdit = () => {
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      profileImage: user.profileImage || '',
      bloodGroup: profileData?.bloodGroup || 'Unknown',
      address: profileData?.address || '',
      qualification: profileData?.qualification || '',
      age: profileData?.age || '',
      remark: profileData?.remark || '',
      password: ''
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 text-left">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Profile</h1>
          <p className="text-slate-500 mt-1 font-medium italic leading-relaxed">Identity and security settings.</p>
        </div>
        <div className="flex gap-4">
            {(isStudent || isTeacher) && (
                <button onClick={() => setShowIDCard(true)} className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 text-sm tracking-tight">
                    <FaIdCard /> Identity Card
                </button>
            )}
            {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition shadow-lg shadow-slate-100 text-sm tracking-tight">
                <FaEdit /> Edit Profile
            </button>
            ) : (
            <button onClick={cancelEdit} className="flex items-center gap-2 px-6 py-4 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-100 transition text-sm tracking-tight">
                <FaTimes /> Cancel
            </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-soft text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-100 transition-colors"></div>
            <div className="relative z-10">
                <div className="relative inline-block">
                <img src={formData.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="Profile" className="w-36 h-36 rounded-3xl object-cover border-none shadow-soft-xl" />
                {isEditing && (
                    <div className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 rounded-2xl text-white cursor-pointer shadow-lg border-2 border-white">
                    <FaCamera size={16} />
                    </div>
                )}
                </div>
                <h2 className="mt-6 text-2xl font-black text-slate-900 tracking-tight uppercase">{user.name}</h2>
                <div className="mt-2 inline-block px-4 py-1.5 bg-indigo-50 rounded-full">
                    <p className="text-indigo-600 text-xs font-black uppercase tracking-widest">{user.role}</p>
                </div>
                
                {isStudent && profileData && (
                    <div className="mt-10 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Roll No</p>
                            <p className="font-black text-slate-800 font-mono text-lg tracking-tighter">{profileData.rollNum}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Class</p>
                            <p className="font-black text-slate-800 text-lg tracking-tighter">{profileData.sClass?.grade}-{profileData.sClass?.section}</p>
                        </div>
                    </div>
                )}
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-soft space-y-8 border-none text-left">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Quick Contact</h4>
            <div className="flex items-center space-x-4 group">
               <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300"><FaEnvelope /></div>
               <span className="text-sm font-bold text-slate-600 truncate">{formData.email}</span>
            </div>
            <div className="flex items-center space-x-4 group">
               <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300"><FaPhone /></div>
               <span className="text-sm font-bold text-slate-600">{formData.phone}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <motion.div layout className="bg-white p-10 md:p-14 rounded-[3rem] shadow-soft border-none">
            <div className="flex items-center justify-between mb-12">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Details</h3>
                {isEditing && (
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full uppercase tracking-widest animate-pulse">Live Edit</span>
                )}
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={`w-full px-6 py-4 rounded-2xl outline-none transition-all font-black text-slate-800 ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-500'}`} readOnly={!isEditing} required />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Line</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={`w-full px-6 py-4 rounded-2xl outline-none transition-all font-black text-slate-800 ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-500'}`} readOnly={!isEditing} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={`w-full px-6 py-4 rounded-2xl outline-none transition-all font-black text-slate-800 ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-500'}`} readOnly={!isEditing} required />
                </div>
                <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Avatar Resource</label>
                    <input type="text" value={formData.profileImage} onChange={(e) => setFormData({...formData, profileImage: e.target.value})} className={`w-full px-6 py-4 rounded-2xl outline-none transition-all font-black text-slate-800 ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-500'}`} readOnly={!isEditing} placeholder="Image URL" />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Remark / Biography</label>
                <textarea value={formData.remark} onChange={(e) => setFormData({...formData, remark: e.target.value})} placeholder="Public description." className={`w-full px-6 py-4 rounded-2xl outline-none transition-all font-medium text-slate-600 ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-50'}`} readOnly={!isEditing} rows="3" />
              </div>

              {isStudent && (
                  <div className="pt-10 border-t border-slate-50 mt-10">
                      <h4 className="text-xl font-black text-slate-900 mb-6 tracking-tight flex items-center gap-2">
                          <div className="bg-indigo-50 p-2 rounded-xl text-indigo-500"><FaMapMarkerAlt size={16}/></div> Logistics & Transport
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transport Mode</label>
                              <select value={formData.transportMode} onChange={(e) => setFormData({...formData, transportMode: e.target.value})} className={`w-full px-6 py-4 rounded-2xl outline-none transition-all font-black text-slate-800 ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-50'}`} disabled={!isEditing}>
                                  <option value="Hostel">Hostel</option>
                                  <option value="Bicycle">Bicycle</option>
                                  <option value="Bike">Bike</option>
                                  <option value="Bus">Bus</option>
                                  <option value="By Foot">By Foot</option>
                              </select>
                          </div>
                          {formData.transportMode === 'Bus' && (
                              <div className="space-y-2 text-left">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Bus</label>
                                  <select value={formData.bus} onChange={(e) => setFormData({...formData, bus: e.target.value})} className={`w-full px-6 py-4 rounded-2xl outline-none transition-all font-black text-slate-800 ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-50'}`} disabled={!isEditing}>
                                      <option value="">Select Bus</option>
                                      {buses.map(b => <option key={b._id} value={b._id}>{b.busNumber} - {b.route}</option>)}
                                  </select>
                              </div>
                          )}
                      </div>
                  </div>
              )}


              <AnimatePresence>
                {isEditing && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="pt-10 border-t border-slate-50 mt-10">
                        <h4 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
                            <div className="bg-red-50 p-2 rounded-xl text-red-500"><FaLock size={16}/></div> Change Key
                        </h4>
                        <div className="space-y-2 text-left">
                            <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-black transition-all" placeholder="New Secret Key (Min 6 chars)" minLength={6} />
                        </div>
                    </div>
                    <div className="pt-12">
                        <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:bg-slate-200 flex items-center justify-center gap-2 transform active:scale-95">
                            {loading ? 'Committing...' : <><FaCheck /> Save Updates</>}
                        </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </div>
      </div>

      {showIDCard && profileData && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowIDCard(false)}>
              <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="p-8 border-b flex justify-between items-center">
                      <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Academy Identity</h3>
                      <button onClick={() => setShowIDCard(false)} className="bg-slate-100 p-2 rounded-xl text-slate-400 hover:text-slate-600"><FaTimes size={18}/></button>
                  </div>
                  
                  <div id="printable-id-card" className="p-8">
                      <div className={`w-full h-[480px] bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white flex flex-col items-center p-10`}>
                          <div className="absolute top-0 left-0 w-full h-24 bg-white/5 backdrop-blur-md flex items-center px-8 border-b border-white/5">
                              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl mr-3 shadow-lg"><FaSchool /></div>
                              <div className="text-left">
                                  <h4 className="font-black text-sm tracking-tighter uppercase leading-none">EduManage</h4>
                                  <p className="text-[8px] font-bold text-white/40 tracking-widest uppercase mt-1">Academic ID • 2026</p>
                              </div>
                          </div>

                          <div className="mt-20 relative">
                              <img src={formData.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="Profile" className="w-32 h-32 rounded-3xl object-cover border-4 border-white/10 shadow-2xl" />
                          </div>

                          <div className="mt-8 text-center">
                              <h3 className="text-2xl font-black tracking-tighter uppercase">{user.name}</h3>
                              <p className="font-black text-[10px] uppercase tracking-[0.2em] text-indigo-400 mt-1">{user.role}</p>
                          </div>

                          <div className="mt-10 grid grid-cols-2 gap-8 w-full border-t border-white/5 pt-8">
                              <div className="text-center">
                                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">ID Reference</p>
                                  <p className="font-black text-xs mt-1 uppercase tracking-tighter">#{profileData._id.toString().slice(-6)}</p>
                              </div>
                              <div className="text-center">
                                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Enrollment</p>
                                  <p className="font-black text-xs mt-1 uppercase tracking-tighter">{isStudent ? `Roll: ${profileData.rollNum}` : 'Staff'}</p>
                              </div>
                          </div>

                          <div className="absolute bottom-0 left-0 w-full p-6 bg-white/5 text-center">
                              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{formData.email}</p>
                          </div>
                      </div>
                  </div>

                  <div className="p-8 bg-slate-50 border-t flex gap-3">
                      <button onClick={handlePrintID} className="flex-1 py-5 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-[1.5rem] hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
                          <FaDownload /> Print / Save ID
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Profile;
