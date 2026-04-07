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
    bloodGroup: 'Unknown',
    address: '',
    qualification: '',
    age: '',
    remark: '',
    password: ''
  });

  const [buses, setBuses] = useState([]);

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
          profileImage: formData.profileImage
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
      bloodGroup: profileData?.bloodGroup || 'Unknown',
      address: profileData?.address || '',
      qualification: profileData?.qualification || '',
      age: profileData?.age || '',
      remark: profileData?.remark || '',
      password: '',
      transportMode: profileData?.transportMode || 'By Foot',
      bus: profileData?.bus?._id || profileData?.bus || ''
    });
    setIsEditing(false);
  };

  if (loading) return <Loader fullScreen text="Accessing Secure Profile..." />;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 relative">
      {(uploading || submitting) && <Loader fullScreen text={uploading ? "Optimizing Media Asset..." : "Synchronizing Global Profile..."} />}
      
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 text-left">
        <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Account Hub</h1>
            <div className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-2 ml-1 flex items-center gap-2">
                <div className="w-10 h-px bg-indigo-500" /> SECURE IDENTITY PREFERENCES
            </div>
        </div>
        {!isEditing ? (
            <div className="flex gap-4">
                <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black hover:bg-indigo-50 transition shadow-xl shadow-indigo-100 border border-indigo-50 text-sm tracking-tight"
                >
                    <FaEdit /> Modify Profile
                </button>
                { (isStudent || isTeacher) && (
                    <button 
                        onClick={() => setShowIDCard(true)}
                        className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 text-sm tracking-tight"
                    >
                        <FaIdCard /> Identity Card
                    </button>
                )}
            </div>
        ) : (
            <div className="flex gap-4">
                <button 
                    onClick={cancelEdit}
                    className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition text-sm tracking-tight"
                >
                    Discard
                </button>
                <button 
                    onClick={handleUpdate}
                    className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 text-sm tracking-tight"
                >
                    <FaCheck /> Commit Changes
                </button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Avatar Section */}
          <div className="lg:col-span-1 space-y-10">
              <div className="bg-white p-10 rounded-[3rem] shadow-soft border border-slate-100 text-center relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-32 bg-indigo-600/5 group-hover:bg-indigo-600/10 transition-colors" />
                  
                  <div className="relative mt-10">
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
                                className="w-40 h-40 rounded-[3rem] object-cover border-8 border-white shadow-2xl transition-transform duration-500 group-hover:scale-105"
                              />
                          )}
                      </div>
                  </div>

                  <div className="mt-8 space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{user.name}</h3>
                      <div className="flex items-center justify-center gap-2">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{user.role}</span>
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Verified</span>
                      </div>
                  </div>

                  <div className="mt-10 pt-10 border-t border-slate-50 grid grid-cols-2 gap-4">
                      <div className="text-left p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Blood Group</p>
                          <p className="font-black text-slate-700 flex items-center gap-2 mt-1">
                              <FaTint className="text-rose-500" /> {formData.bloodGroup}
                          </p>
                      </div>
                      <div className="text-left p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Phone Ext.</p>
                          <p className="font-black text-slate-700 flex items-center gap-2 mt-1">
                              <FaPhone className="text-indigo-500" /> {user.phone?.slice(-4)}
                          </p>
                      </div>
                  </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                  <h4 className="font-black uppercase text-xs tracking-[0.2em] flex items-center gap-3">
                      <FaLock className="text-indigo-400" /> Security Status
                  </h4>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                          <span>2FA Authentication</span>
                          <span className="text-indigo-400">Active</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                          <span>Last Login</span>
                          <span>Today, 09:41 AM</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2">
              <form onSubmit={handleUpdate} className="bg-white p-10 md:p-16 rounded-[3.5rem] shadow-soft border border-slate-100 space-y-12">
                  <div className="space-y-10">
                      <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                          <div className="bg-indigo-50 p-2 rounded-xl text-indigo-500"><FaUserGraduate size={16}/></div> Public Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                              <input 
                                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                className={`w-full px-6 py-4 rounded-2xl outline-none transition-all font-bold text-sm ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50'}`} 
                                disabled={!isEditing} 
                              />
                          </div>
                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Email</label>
                              <input 
                                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                className={`w-full px-6 py-4 rounded-2xl outline-none transition-all font-bold text-sm ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50'}`} 
                                disabled={!isEditing} 
                              />
                          </div>
                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                              <input 
                                value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                                className={`w-full px-6 py-4 rounded-2xl outline-none transition-all font-bold text-sm ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50'}`} 
                                disabled={!isEditing} 
                              />
                          </div>
                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blood Identification</label>
                              <select 
                                value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})} 
                                className={`w-full px-6 py-4 rounded-2xl outline-none transition-all font-black text-sm ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50'}`} 
                                disabled={!isEditing}
                              >
                                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                              </select>
                          </div>
                      </div>
                  </div>

                  <div className="pt-10 border-t border-slate-50 space-y-10">
                      <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                          <div className="bg-indigo-50 p-2 rounded-xl text-indigo-500"><FaMapMarkerAlt size={16}/></div> Localization & bio
                      </h4>
                      <div className="space-y-8">
                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
                              <input 
                                value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} 
                                className={`w-full px-6 py-4 rounded-2xl outline-none transition-all font-bold text-sm ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50'}`} 
                                disabled={!isEditing} 
                              />
                          </div>
                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional / Personal Bio</label>
                              <textarea 
                                value={formData.remark} onChange={(e) => setFormData({...formData, remark: e.target.value})} 
                                className={`w-full px-6 py-4 rounded-2xl outline-none transition-all font-bold text-sm min-h-[120px] ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50'}`} 
                                disabled={!isEditing} 
                              />
                          </div>
                      </div>
                  </div>

                  {isStudent && (
                      <div className="pt-10 border-t border-slate-50 mt-10">
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
                                    className="w-full px-6 py-4 rounded-2xl outline-none transition-all font-black text-slate-400 bg-slate-50 cursor-not-allowed" 
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
                                        className="w-full px-6 py-4 rounded-2xl outline-none transition-all font-black text-slate-400 bg-slate-50 cursor-not-allowed" 
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
                      <div className="pt-10 border-t border-slate-50 space-y-6">
                          <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                              <FaLock className="text-rose-500" /> Security Credential Update
                          </h4>
                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Change Account Password</label>
                              <input 
                                type="password" placeholder="Leave blank to keep current" 
                                value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-50 transition-all font-bold text-sm" 
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
              <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                  <div className="p-8 border-b flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Academy Identity</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Click card to flip</p>
                      </div>
                      <button onClick={() => setShowIDCard(false)} className="bg-slate-100 p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"><FaTimes size={18}/></button>
                  </div>
                  
                  <div className="p-8 perspective-1000">
                      <div 
                        className={`relative w-full h-[480px] transition-all duration-700 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                        onClick={() => setIsFlipped(!isFlipped)}
                      >
                          {/* Front Side */}
                          <div id="id-card-front" className="absolute inset-0 w-full h-full bg-slate-900 rounded-[2.5rem] shadow-2xl backface-hidden text-white flex flex-col items-center p-8 overflow-hidden">
                              <div className="absolute top-0 left-0 w-full h-20 bg-white/5 backdrop-blur-md flex items-center px-8 border-b border-white/5">
                                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-lg mr-3 shadow-lg"><FaSchool /></div>
                                  <div className="text-left">
                                      <h4 className="font-black text-xs tracking-tighter uppercase leading-none">EduManage Pro</h4>
                                      <p className="text-[7px] font-bold text-white/40 tracking-widest uppercase mt-1">Academic ID • {academicYear}</p>
                                  </div>
                              </div>

                              <div className="mt-16 relative">
                                  <div className="absolute inset-0 bg-indigo-500 rounded-[2rem] blur-2xl opacity-20"></div>
                                  <img src={formData.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="Profile" className="w-28 h-28 rounded-[2rem] object-cover border-4 border-white/10 shadow-2xl relative z-10" />
                              </div>

                              <div className="mt-6 text-center">
                                  <h3 className="text-xl font-black tracking-tighter uppercase">{user.name}</h3>
                                  <p className="font-black text-[9px] uppercase tracking-[0.2em] text-indigo-400 mt-1">{user.role}</p>
                              </div>

                              <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 w-full border-t border-white/5 pt-6 text-left">
                                  <div>
                                      <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">Enrollment</p>
                                      <p className="font-black text-[10px] mt-0.5 truncate">{isStudent ? profileData.rollNum : 'EMP-'+profileData._id.toString().slice(-4).toUpperCase()}</p>
                                  </div>
                                  <div>
                                      <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">Class</p>
                                      <p className="font-black text-[10px] mt-0.5">{isStudent ? `${profileData.sClass?.grade}-${profileData.sClass?.section}` : 'Faculty'}</p>
                                  </div>
                                  <div>
                                      <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">Parent/Guardian</p>
                                      <p className="font-black text-[10px] mt-0.5 truncate">{profileData.guardianName || 'Not Provided'}</p>
                                  </div>
                                  <div>
                                      <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">Phone</p>
                                      <p className="font-black text-[10px] mt-0.5">{user.phone}</p>
                                  </div>
                                  <div className="col-span-2">
                                      <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">Address</p>
                                      <p className="font-black text-[9px] mt-0.5 line-clamp-1 italic">{profileData.address || 'Campus Resident'}</p>
                                  </div>
                                  <div>
                                      <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">Transport</p>
                                      <p className="font-black text-[9px] mt-0.5 flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                          {profileData.transportMode || 'By Foot'}
                                      </p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">Blood Group</p>
                                      <p className="font-black text-[10px] mt-0.5 text-rose-400">{profileData.bloodGroup || 'O+'}</p>
                                  </div>
                              </div>

                              <div className="absolute bottom-0 left-0 w-full p-4 bg-white/5 text-center border-t border-white/5">
                                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">{user.email}</p>
                              </div>
                          </div>

                          {/* Back Side */}
                          <div id="id-card-back" className="absolute inset-0 w-full h-full bg-white rounded-[2.5rem] shadow-2xl backface-hidden rotate-y-180 flex flex-col p-10 border-2 border-slate-100 text-slate-800">
                              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><FaSchool size={12}/></div>
                                  <h4 className="font-black text-xs text-slate-800 uppercase tracking-widest">Student Guidelines</h4>
                              </div>
                              
                              <ul className="space-y-4 flex-1">
                                  {[
                                      "Always carry this ID card while on campus or representing the school.",
                                      "The card is non-transferable and must be presented on demand by school authorities.",
                                      "Report any loss of this card to the Admission Office immediately.",
                                      "Abide by all school rules and maintain academic integrity at all times.",
                                      "Keep this card safe from heat, moisture, and sharp objects."
                                  ].map((rule, i) => (
                                      <li key={i} className="flex gap-3 items-start">
                                          <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[8px] font-black flex-shrink-0 mt-0.5">{i+1}</span>
                                          <p className="text-[10px] font-bold text-slate-500 leading-relaxed">{rule}</p>
                                      </li>
                                  ))}
                              </ul>

                              <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
                                  <div className="flex justify-between items-end">
                                      <div className="text-center">
                                          <div className="w-24 h-10 bg-slate-50 rounded-lg mb-2 border border-slate-100"></div>
                                          <p className="text-[7px] font-black text-slate-400 uppercase">Issuing Authority</p>
                                      </div>
                                      <div className="text-right">
                                          <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mb-2 mx-auto overflow-hidden border border-slate-100">
                                              <div className="text-[6px] font-black text-slate-300 uppercase rotate-45">QR CODE</div>
                                          </div>
                                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Scan for Verification</p>
                                      </div>
                                  </div>
                              </div>

                              <div className="absolute bottom-6 left-0 w-full text-center">
                                  <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">EduManage • Excellence in Education</p>
                              </div>
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
