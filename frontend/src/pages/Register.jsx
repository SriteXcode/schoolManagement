import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin'); 
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, phone, password, role });
      toast.success(role === 'Teacher' ? 'Request sent! Wait for Admin approval.' : 'Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex w-2/5 bg-slate-900 justify-center items-center relative overflow-hidden m-6 rounded-[3rem] shadow-2xl shadow-indigo-200">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="z-10 text-left p-16">
            <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white text-2xl mb-10 shadow-lg font-black">
                <FaSchool />
            </div>
            <h1 className="text-6xl font-black text-white mb-8 tracking-tighter leading-tight">Start Your <br/>Journey</h1>
            <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-sm italic">"Join the next generation of academic excellence today."</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex justify-center items-center p-6 md:p-12 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white p-10 md:p-12 rounded-[2.5rem] shadow-soft-xl border border-slate-50 my-8"
        >
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Create Account</h2>
            <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[10px]">Academic Enrollment</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-800"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-800"
                placeholder="1234567890"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-800"
                placeholder="name@school.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-800"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            
             <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Registration Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-black text-slate-800 appearance-none cursor-pointer"
              >
                <option value="Admin">Master Admin</option>
                <option value="Teacher">Academic Teacher</option>
              </select>
              <div className="bg-indigo-50 p-4 rounded-2xl mt-4 border border-indigo-100/50">
                  <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
                      <b>NOTE:</b> Students cannot self-register. Please obtain credentials from your school office.
                  </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:bg-indigo-300 transform active:scale-95"
            >
              {loading ? 'Initializing...' : 'Complete Registration'}
            </button>
          </form>

          <div className="mt-10 text-center">
             <p className="text-sm text-slate-500 font-bold">
                Already registered?{' '}
                <Link to="/login" className="text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline">Sign In</Link>
             </p>
             <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 block pt-4 transition-colors">← Back to Main</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const FaSchool = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M0 224v272c0 8.84 7.16 16 16 16h80V192H32c-17.67 0-32 14.33-32 32zm360-48h-80v48h80v-48zm0 96h-80v48h80v-48zm0 96h-80v48h80v-48zm280-240h-80v48h80v-48zm0 96h-80v48h80v-48zm0 96h-80v48h80v-48zM512 0c-17.67 0-32 14.33-32 32v160H160V32c0-17.67-14.33-32-32-32C110.33 0 96 14.33 96 32v448h80V336h288v144h80V32c0-17.67-14.33-32-32-32zM288 192v288h144V192H288z"></path></svg>
);

export default Register;