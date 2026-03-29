import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success('Welcome back!');
      
      navigate('/');
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
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
            <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white text-2xl mb-10 shadow-lg">
                <FaSchool />
            </div>
            <h1 className="text-fluid-4xl font-black text-white mb-8 tracking-tighter leading-tight">Empower Your <br/>Academy</h1>
            <p className="text-fluid-base text-slate-400 font-medium leading-relaxed max-w-sm italic">"Simplifying the complexity of modern education management."</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex justify-center items-center p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white p-10 md:p-12 rounded-[2.5rem] shadow-soft-xl border border-slate-50 relative"
        >
          <div className="text-center mb-12">
            <h2 className="text-fluid-3xl font-black text-slate-900 tracking-tighter">Welcome back!</h2>
            <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-fluid-xs">Portal Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2">
              <label className="text-fluid-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-800"
                placeholder="name@school.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-fluid-xs font-black text-slate-500 uppercase tracking-widest ml-1">Secret Key</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-800"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:bg-indigo-300 transform active:scale-95 text-fluid-base"
            >
              {loading ? 'Validating...' : 'Authorize Login'}
            </button>
          </form>

          <div className="mt-12 text-center space-y-4">
             <p className="text-fluid-sm text-slate-500 font-bold">
                New here?{' '}
                <Link to="/register" className="text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline">Create Account</Link>
             </p>
             <Link to="/" className="text-fluid-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 block pt-4 transition-colors">← Back to Main</Link>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-50 text-center text-fluid-xs text-slate-300 font-black tracking-widest uppercase">
            <p>Master Admin: admin@school.com</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const FaSchool = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M0 224v272c0 8.84 7.16 16 16 16h80V192H32c-17.67 0-32 14.33-32 32zm360-48h-80v48h80v-48zm0 96h-80v48h80v-48zm0 96h-80v48h80v-48zm280-240h-80v48h80v-48zm0 96h-80v48h80v-48zm0 96h-80v48h80v-48zM512 0c-17.67 0-32 14.33-32 32v160H160V32c0-17.67-14.33-32-32-32C110.33 0 96 14.33 96 32v448h80V336h288v144h80V32c0-17.67-14.33-32-32-32zM288 192v288h144V192H288z"></path></svg>
);

export default Login;