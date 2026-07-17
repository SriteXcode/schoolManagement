import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPhone, FaEnvelope, FaIdCard, FaCamera, FaLock, FaEdit, FaTimes, FaCheck, FaMapMarkerAlt, FaTint, FaDownload, FaSchool, FaUpload, FaInfoCircle, FaUserGraduate } from 'react-icons/fa';
import Loader from '../components/Loader';
import ImageUpload from '../components/ImageUpload';

const Profile = () => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};
  const isStudent = user.role === 'Student';
  const isTeacher = user.role === 'Teacher';

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showIDCard, setShowIDCard] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    email: user.email || '',
    profileImage: user.profileImage || '',
    bloodGroup: user.bloodGroup || 'Unknown',
    address: user.address || '',
    qualification: '',
    age: '',
    remark: user.remark || '',
    password: ''
  });

  const [buses, setBuses] = useState([]);
  const [schoolConfig, setSchoolConfig] = useState(null);

  const handlePrintID = () => {
    const frontContent = document.getElementById('id-card-front').innerHTML;
    const backContent = document.getElementById('id-card-back').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Identity Card - ${user.name}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @page { size: A4; margin: 0; }
                    body { margin: 0; padding: 20mm; font-family: sans-serif; }
                    .id-card-print { 
                        width: 85.6mm; 
                        height: 54mm; 
                        border-radius: 10px; 
                        overflow: hidden; 
                        margin-bottom: 10mm;
                        border: 1px solid #e2e8f0;
                        position: relative;
                        background: #0f172a;
                        color: white;
                    }
                    .back-side-print {
                        background: white;
                        color: #1e293b;
                    }
                </style>
            </head>
            <body>
                <div class="flex flex-col items-center gap-10">
                    <div class="id-card-print">${frontContent}</div>
                    <div class="id-card-print back-side-print">${backContent}</div>
                </div>
                <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
        </html>
    `);
    printWindow.document.close();
  };

  const academicYear = "2026-2027";

  useEffect(() => {
      const fetchProfile = async () => {
          try {
              try {
                  const schoolRes = await api.get('/management/school/config');
                  setSchoolConfig(schoolRes.data);
              } catch (schoolErr) {
                  console.error("Failed to load school config:", schoolErr);
              }
              
              let res;
              if (isStudent) {
                  res = await api.get('/student/profile');
              } else if (isTeacher) {
                  res = await api.get('/teacher/profile');
              } else {
                  // For Admin, we don't have a specific "profile" schema beyond User
                  setLoading(false);
                  return;
              }
              
              setProfileData(res.data);
              setFormData({
                  name: user.name || '',
                  phone: user.phone || '',
                  email: user.email || '',
                  profileImage: user.profileImage || res.data.profileImage || '',
                  bloodGroup: res.data.bloodGroup || 'Unknown',
                  address: res.data.address || '',
                  qualification: res.data.qualification || '',
                  age: res.data.age || '',
                  remark: res.data.remark || '',
                  password: '',
                  transportMode: res.data.transportMode || 'By Foot',
                  bus: res.data.bus?._id || res.data.bus || ''
              });

              if (isStudent) {
                  const busRes = await api.get('/management/bus/all');
                  setBuses(busRes.data);
              }
          } catch (error) {
              toast.error('Failed to load profile');
          } finally {
              setLoading(false);
          }
      };
      fetchProfile();
  }, [isStudent, isTeacher]);

  const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const uploadData = new FormData();
      uploadData.append('image', file);

      setUploading(true);
      try {
          const res = await api.post('/auth/upload', uploadData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          setFormData(prev => ({ ...prev, profileImage: res.data.url }));
          toast.success("Photo optimized & staged! Save profile to finalize.");
      } catch (error) {
          toast.error("Upload failed");
      } finally {
          setUploading(false);
      }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let endpoint = isStudent ? `/student/update/${profileData._id}` : 
                     isTeacher ? `/teacher/update/${profileData._id}` : 
                     '/auth/update-profile';
      
      const res = await api.put(endpoint, formData);
      
      // Update local storage user data
      const updatedUser = { 
          ...user, 
          name: formData.name, 
          email: formData.email, 
          phone: formData.phone,
          profileImage: formData.profileImage,
          bloodGroup: formData.bloodGroup,
          address: formData.address,
          remark: formData.remark
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success('Profile updated successfully!');
      setFormData(prev => ({ ...prev, password: '' }));
      setIsEditing(false);
      window.location.reload(); 
      } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
      } finally {
      setSubmitting(false);
      }
      };

      const cancelEdit = () => {
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      profileImage: user.profileImage || '',
      bloodGroup: profileData?.bloodGroup || user.bloodGroup || 'Unknown',
      address: profileData?.address || user.address || '',
      qualification: profileData?.qualification || '',
      age: profileData?.age || '',
      remark: profileData?.remark || user.remark || '',
      password: '',
      transportMode: profileData?.transportMode || 'By Foot',
      bus: profileData?.bus?._id || profileData?.bus || ''
    });
    setIsEditing(false);
  };

  if (loading) return <Loader fullScreen text="Accessing Secure Profile..." />;

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      {(uploading || submitting) && <Loader fullScreen text={uploading ? "Optimizing Media Asset..." : "Synchronizing Global Profile..."} />}
      
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 px-2 text-left">
        <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Welcome {user.name?.slice(0,10)}...</h1>
            <div className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-2 ml-1 flex items-center gap-2">
                <div className="w-10 h-px bg-indigo-500" /> SECURE IDENTITY PREFERENCES
            </div>
        </div>
        {!isEditing ? (
            <div className="flex gap-4">
                <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-lg font-[800] hover:bg-indigo-50 transition shadow-md shadow-gray-300 border border-indigo-50 text-sm tracking-tight"
                >
                    <FaEdit /> Modify Profile
                </button>
                { (isStudent || isTeacher) && (
                    <button 
                        onClick={() => setShowIDCard(true)}
                        className="flex items-center gap-6 px-6 py-3 bg-indigo-600 text-white rounded-lg font-[700] hover:bg-indigo-700 transition shadow-md shadow-gray-300 text-sm tracking-tight"
                    >
                        <FaIdCard /> Identity Card
                    </button>
                )}
            </div>
        ) : (
            <div className="flex gap-4">
                <button 
                    onClick={cancelEdit}
                    className="px-6 py-3 bg-slate-100 text-slate-500 rounded-md font-bold hover:bg-slate-200 transition text-sm tracking-tight"
                >
                    Discard
                </button>
                <button 
                    onClick={handleUpdate}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-md font-bold hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 text-sm tracking-tight"
                >
                    <FaCheck /> Commit Changes
                </button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Avatar Section */}
          <div className="lg:col-span-1 space-y-10">
              <div className="bg-white p-4 rounded-2xl shadow-soft border border-slate-100 text-center relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-24 bg-indigo-600/5 group-hover:bg-indigo-600/10 transition-colors" />
                  
                  <div className="relative">
                      <div className="relative inline-block">
                          {isEditing ? (
                              <ImageUpload 
                                label="Profile Photo"
                                preview={formData.profileImage}
                                onUploadSuccess={(url) => setFormData(prev => ({ ...prev, profileImage: url }))}
                              />
                          ) : (
                              <img 
                                src={formData.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                                alt="Profile" 
                                className="w-40 h-40 rounded-xl object-fit border-4 border-white shadow-2xl transition-transform duration-900 group-hover:scale-105"
                              />
                          )}
                      </div>
                  </div>
                  <div className="mt-2 space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{user.name}</h3>
                      <div className="flex items-center justify-center gap-2">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{user.role}</span>
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Verified</span>
                      </div>
                  </div>

                  <div className="mt-0 border-t border-slate-50 grid grid-cols-2 gap-4">
                      <div className="text-left p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Blood Group</p>
                          <p className="font-bold text-[12px] text-slate-700 flex items-center gap-2 mt-1">
                              <FaTint className="text-rose-500" /> {formData.bloodGroup}
                          </p>
                      </div>
                      <div className="text-left p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Phone no.</p>
                          <p className="font-bold text-[12px] text-slate-700 flex items-center gap-2 mt-1">
                              <FaPhone className="text-indigo-500 rotate-90" /> ..{user.phone?.slice(-4)}
                          </p>
                      </div> 
                  </div>
              </div>

              {/* <div className="bg-slate-900 p-6 rounded-2xl text-white space-y-4 relative overflow-hidden group">
                  <div className="absolute border-12 border-red-800 right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                      <FaLock className="text-indigo-400" /> Security Status
                  </p>
                  <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                          <span>2FA Authentication</span>
                          <span className="text-indigo-400">Active</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                          <span>Last Login</span>
                          <span>Today, 09:41 AM</span>
                      </div>
                  </div>
              </div> */}
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2">
              <form onSubmit={handleUpdate} className="bg-white p-10 md:px-16 md:py-6 rounded-2xl shadow-soft border-t-4 border-slate-800 space-y-4">
                  <div className="space-y-2">
                      <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                          <div className="bg-indigo-50 p-2 rounded-xl text-indigo-500"><FaUserGraduate size={16}/></div> Public Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name:</label>
                              <input 
                                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                className={`w-full px-6 py-2 rounded-2xl outline-none transition-all font-semibold text-sm ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50'}`} 
                                disabled={!isEditing} 
                              />
                          </div>
                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email:</label>
                              <input 
                                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                className={`w-full px-6 py-2 rounded-2xl outline-none transition-all font-semibold text-sm ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50'}`} 
                                disabled={!isEditing} 
                              />
                          </div>
                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                              <input 
                                value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                                className={`w-full px-6 py-2 rounded-2xl outline-none transition-all font-semibold text-sm ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50'}`} 
                                disabled={!isEditing} 
                              />
                          </div>
                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blood Identification</label>
                              <select 
                                value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})} 
                                className={`w-full px-6 py-2 rounded-2xl outline-none transition-all font-semibold text-sm ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50'}`} 
                                disabled={!isEditing}
                              >
                                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                              </select>
                          </div>
                      </div>
                  </div>

                  <div className="pt-2 space-y-4">
                      <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                          <div className="bg-indigo-50 p-2 rounded-xl text-indigo-500"><FaMapMarkerAlt size={16}/></div> Localization & bio
                      </h4>
                      <div className="space-y-4">
                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
                              <input 
                                value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} 
                                className={`w-full px-6 py-2 rounded-2xl outline-none transition-all font-semibold text-sm ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50'}`} 
                                disabled={!isEditing} 
                              />
                          </div>
                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional / Personal Bio</label>
                              <textarea 
                                value={formData.remark} onChange={(e) => setFormData({...formData, remark: e.target.value})} 
                                className={`w-full px-6 py-2 rounded-2xl outline-none transition-all font-semibold text-sm min-h-[56px] max-h-[200px] ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50'}`} 
                                disabled={!isEditing} 
                              />
                          </div>
                      </div>
                  </div>

                  {isStudent && (
                      <div className="pt-2 border-t border-slate-50 mt-2">
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <div className="bg-indigo-50 p-2 rounded-xl text-indigo-500"><FaMapMarkerAlt size={16}/></div> Logistics & Transport
                            </h4>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">Official Records Only</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-2 text-left">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transport Mode</label>
                                  <select 
                                    value={formData.transportMode} 
                                    className="w-full px-6 py-2 rounded-2xl outline-none transition-all font-semibold text-slate-400 bg-slate-50 cursor-not-allowed" 
                                    disabled
                                  >
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
                                      <select 
                                        value={formData.bus} 
                                        className="w-full px-6 py-2 rounded-2xl outline-none transition-all font-semibold text-slate-400 bg-slate-50 cursor-not-allowed" 
                                        disabled
                                      >
                                          <option value="">Select Bus</option>
                                          {buses.map(b => <option key={b._id} value={b._id}>{b.busNumber} - {b.route}</option>)}
                                      </select>
                                  </div>
                              )}
                          </div>
                          <p className="mt-4 text-[9px] font-bold text-slate-400 italic">Note: To request a change in transport or logistics, please visit the Admission Cell.</p>
                      </div>
                  )}

                  {isEditing && (
                      <div className="pt-2 space-y-4">
                          <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                              <FaLock className="text-rose-500" /> Security Credential Update
                          </h4>
                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Change Account Password</label>
                              <input 
                                type="password" placeholder="Leave blank to keep current" 
                                value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-50 transition-all font-semibold text-sm" 
                              />
                          </div>
                      </div>
                  )}
              </form>
          </div>
      </div>

      {/* ID Card Modal */}
      {showIDCard && profileData && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowIDCard(false)}>
              <div className="bg-white rounded-2xl max-h-[95vh] shadow-2xl max-w-[480px] w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                  <div className="px-8 pt-4 border-b flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Academy Identity</h3>
                        <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">Click card to flip</p>
                      </div>
                      <button onClick={() => setShowIDCard(false)} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><FaTimes size={18}/></button>
                  </div>
                  
                  <div className="px-8 py-6 perspective-1000">
                      <div 
                        className={`relative w-full h-[260px] transition-all duration-700 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                        onClick={() => setIsFlipped(!isFlipped)}
                      >
                          {/* Front Side */}
                          <div id="id-card-front" className="absolute inset-0 w-full h-full bg-slate-900 rounded-2xl shadow-2xl backface-hidden text-white flex flex-col p-5 border border-white/10 overflow-hidden select-none">
                              {/* Header Bar */}
                              <div className="w-full flex items-center justify-between pb-2.5 border-b border-white/10 mb-4">
                                  <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                                          {schoolConfig?.logo ? (
                                              <img src={schoolConfig.logo} alt="Logo" className="w-8 h-8 object-contain rounded-md" />
                                          ) : (
                                              <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center font-black text-white text-lg shadow-lg"><FaSchool /></div>
                                          )}
                                      </div>
                                      <div className="flex flex-col items-start justify-center text-left">
                                          <h4 className="font-black text-[11px] tracking-tight uppercase leading-none">
                                              {schoolConfig?.name || "EduManage Pro"}
                                          </h4>
                                          <p className="text-[6px] font-bold text-white/40 tracking-widest uppercase mt-0.5 truncate max-w-[180px]">
                                              {schoolConfig?.address || "College Address"}
                                          </p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <h4 className="font-black text-[10px] tracking-tight uppercase leading-none">Session</h4>
                                      <p className="text-[6px] font-bold text-white/40 tracking-widest uppercase mt-0.5">
                                          {schoolConfig?.sessionStart && schoolConfig?.sessionEnd ? 
                                              `${new Date(schoolConfig.sessionStart).getFullYear()}-${new Date(schoolConfig.sessionEnd).getFullYear()}` : 
                                              academicYear
                                          }
                                      </p>
                                  </div>
                              </div>

                              {/* Main Content Area (Landscape Flex) */}
                              <div className="flex flex-1 gap-5 items-start w-full">
                                  {/* Left Column: Photo & Name */}
                                  <div className="w-24 flex-shrink-0 flex flex-col items-center">
                                      <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-white/20 shadow-md">
                                          <img src={formData.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="Profile" className="w-full h-full object-cover" />
                                      </div>
                                      <h3 className="text-xs font-black tracking-tight uppercase mt-2.5 text-center truncate w-full">{user.name}</h3>
                                      <span className="font-black text-[7px] uppercase tracking-[0.2em] text-indigo-400 mt-0.5">{user.role}</span>
                                  </div>

                                  {/* Right Column: Details Grid */}
                                  <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-left">
                                      <div>
                                          <p className="text-[6px] font-black text-white/50 uppercase tracking-widest leading-none">Enrollment</p>
                                          <p className="font-black text-[9px] mt-0.5 truncate text-white">{isStudent ? profileData.rollNum : 'EMP-...'+profileData._id.toString().slice(-4).toUpperCase()}</p>
                                      </div>
                                      <div>
                                          <p className="text-[6px] font-black text-white/50 uppercase tracking-widest leading-none">Class</p>
                                          <p className="font-black text-[9px] mt-0.5 text-white">{isStudent ? `${profileData.sClass?.grade}-${profileData.sClass?.section}` : 'Faculty'}</p>
                                      </div>
                                      <div>
                                          <p className="text-[6px] font-black text-white/50 uppercase tracking-widest leading-none">Parent/Guardian</p>
                                          <p className="font-black text-[9px] mt-0.5 truncate text-white">{profileData.guardianName || 'Not Provided'}</p>
                                      </div>
                                      <div>
                                          <p className="text-[6px] font-black text-white/50 uppercase tracking-widest leading-none">Phone</p>
                                          <p className="font-black text-[9px] mt-0.5 text-white">{user.phone}</p>
                                      </div>
                                      <div className="col-span-2">
                                          <p className="text-[6px] font-black text-white/50 uppercase tracking-widest leading-none">Address</p>
                                          <p className="font-black text-[8px] mt-0.5 line-clamp-1 italic text-white/80">{profileData.address || 'Campus Resident'}</p>
                                      </div>
                                      <div>
                                          <p className="text-[6px] font-black text-white/50 uppercase tracking-widest leading-none">Transport</p>
                                          <p className="font-black text-[8px] mt-0.5 flex items-center gap-1 text-white">
                                              <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                              {profileData.transportMode || 'By Foot'}
                                          </p>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-[6px] font-black text-white/50 uppercase tracking-widest leading-none">Blood Group</p>
                                          <p className="font-black text-[9px] mt-0.5 text-rose-400">{profileData.bloodGroup || 'Unknown'}</p>
                                      </div>
                                  </div>
                              </div>

                              {/* Footer Email */}
                              <div className="w-full mt-2 pt-1 border-t border-white/5 text-center">
                                  <p className="text-[7px] font-bold text-white/30 uppercase tracking-[0.2em]">{user.email}</p>
                              </div>
                          </div>

                          {/* Back Side */}
                          <div id="id-card-back" className="absolute inset-0 w-full h-full bg-white rounded-2xl shadow-2xl backface-hidden rotate-y-180 flex flex-col p-5 border border-slate-200 text-slate-800 overflow-hidden select-none">
                              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 w-full">
                                  <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md"><FaSchool size={10}/></div>
                                  <h4 className="font-black text-[10px] text-slate-800 uppercase tracking-widest">Student Guidelines</h4>
                              </div>
                              
                              <div className="flex-1 flex gap-4 w-full">
                                  {/* Left Column: Guidelines */}
                                  <ul className="flex-1 space-y-1.5 text-left">
                                      {[
                                          "Always carry this ID card while on campus or representing the school.",
                                          "The card is non-transferable and must be presented on demand.",
                                          "Report any loss of this card to the Office immediately.",
                                          "Abide by all school rules and maintain academic integrity."
                                      ].map((rule, i) => (
                                          <li key={i} className="flex gap-2 items-start">
                                              <span className="w-3.5 h-3.5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[7px] font-black flex-shrink-0 mt-0.5">{i+1}</span>
                                              <p className="text-[8px] font-bold text-slate-500 leading-normal">{rule}</p>
                                          </li>
                                      ))}
                                  </ul>

                                  {/* Right Column: Authority Signature & QR */}
                                  <div className="w-28 flex-shrink-0 flex flex-col justify-between border-l border-slate-100 pl-3">
                                      <div className="text-center">
                                          <div className="w-full h-8 text-[6px] bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 italic text-slate-400">signature</div>
                                          <p className="text-[6px] font-black text-slate-400 uppercase mt-1">Issuing Authority</p>
                                      </div>
                                      <div className="text-center">
                                          <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center mx-auto overflow-hidden border border-slate-100">
                                              <div className="text-[4px] font-black text-slate-300 uppercase rotate-45">QR CODE</div>
                                          </div>
                                          <p className="text-[5px] font-black text-slate-400 uppercase tracking-tighter mt-1">Scan for Verification</p>
                                      </div>
                                  </div>
                              </div>

                              <div className="w-full mt-2 pt-1 border-t border-slate-100 text-center">
                                   <p className="text-[7px] font-black text-indigo-600 uppercase tracking-widest">EduManage • Excellence in Education</p>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="px-8 py-4 bg-slate-50 border-t flex gap-3">
                      <button onClick={handlePrintID} className="flex-1 py-3 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-[1.5rem] hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
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
