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
    <div className="h-[calc(100vh-90px)] flex bg-slate-50 justify-around items-center overflow-hidden p-4 md:p-6">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex w-2/5 h-[85%] max-h-[720px] min-h-[450px] bg-slate-700/40 justify-center items-start relative overflow-hidden rounded-3xl shadow-2xl shadow-indigo-200">
        {/* Background Image with Overlay */}
        <img 
          src="https://plus.unsplash.com/premium_photo-1680807869780-e0876a6f3cd5?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y2xhc3Nyb29tfGVufDB8fDB8fHww" 
          alt="Academy Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>
        
        <div className="z-10 text-left p-8">
            <div className="bg-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl mb-4 shadow-lg font-black">
                <FaSchool />
            </div>
            <p className="text-5xl font-black text-white mb-4 tracking-tighter leading-tight">Empower Your <br/>Academy</p>
            <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-sm italic">"Simplifying the complexity of modern education management."</p>
        </div>

        {/* Floating Mock UI Widget */}
        <div className="absolute bottom-8 left-8 right-8 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl transform hover:translate-y-[-4px] transition-transform duration-300 pointer-events-none">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              ★
            </div>
            <div>
              <p className="text-xs font-bold text-white">Smart Academic Portal</p>
              <p className="text-[10px] text-slate-300">Live Status: Active & Secured</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex justify-center items-center p-6 md:p-0 w-full max-w-md lg:max-w-none lg:w-2/5 h-[95%] max-h-[720px] min-h-[450px]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full h-full bg-white p-10 md:p-6 rounded-3xl shadow-2xl shadow-indigo-200 border border-slate-50 relative overflow-y-auto scrollbar-hide flex flex-col justify-start"
        >
          <div className="text-center mb-10">
            <p className="text-3xl font-bold text-slate-900 tracking-tighter">Welcome back!</p>
            <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[10px]">Portal Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="mt-[-12px] space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm px-5 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-semibold text-slate-800"
                placeholder="name@school.com"
              />
            </div>
            <div className="mt-[-18px] space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secret Key</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm px-5 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-semibold text-slate-800"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-bold text-lg rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:bg-indigo-300 transform active:scale-95 text-fluid-base"
            >
              {loading ? 'Validating...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
             <p className="text-fluid-sm text-slate-500 font-bold">
                New here?{' '}
                <Link to="/register" className="text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline">Create Account</Link>
             </p>
             <Link to="/" className="text-fluid-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 block pt-4 transition-colors md:hidden">← Back to Main</Link>
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