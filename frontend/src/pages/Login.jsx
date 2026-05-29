import { useNavigate } from 'react-router-dom';
import { User, Lock, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import ChangePasswordModal from '@/components/ChangePasswordModal';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login, quickLogin, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState('admin'); // 'admin' or 'executive'
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });

  const handleModeSwitch = (mode) => {
    setLoginMode(mode);
    if (mode === 'executive') {
      setValue('password', 'no-password-needed');
    } else {
      setValue('password', '');
    }
  };

  const onSubmit = async (data) => {
    let result;
    if (loginMode === 'executive') {
      result = await quickLogin(data.username);
    } else {
      result = await login(data.username, data.password);
    }
    
    if (result.success) {
      const userData = result.user || JSON.parse(localStorage.getItem('user'));
      const isAdmin = userData?.role === 'ROLE_ADMIN' || userData?.role === 'ADMIN';
      navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1923] flex flex-col relative overflow-hidden font-premium">
      {/* ── Background Elements ─────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-[40vh] bg-[#0F1923] overflow-hidden">
        {/* Animated Glows */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-[#4ECDC4] rounded-full blur-[100px]"
        />
        
        {/* Branding Container */}
        <div className="relative h-full flex flex-col items-center justify-center px-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-[#4ECDC4] rounded-2xl flex items-center justify-center text-[#0F1923] text-3xl font-black shadow-[0_10px_30px_rgba(78,205,196,0.4)]"
          >
            E
          </motion.div>
          <motion.h1 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-black text-white mt-5 tracking-tight"
          >
            EVA <span className="text-[#4ECDC4]">Collections</span>
          </motion.h1>
        </div>
      </div>

      {/* ── Login Panel ───────────────────── */}
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120, delay: 0.3 }}
        className="flex-1 bg-white rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.3)] relative z-10 px-8 pt-10 flex flex-col"
      >
        <div className="max-w-md mx-auto w-full">
          {/* Login Mode Toggle */}
          <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
            <button
              onClick={() => handleModeSwitch('admin')}
              className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${loginMode === 'admin' ? 'bg-white text-[#0F1923] shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Administrator
            </button>
            <button
              onClick={() => handleModeSwitch('executive')}
              className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${loginMode === 'executive' ? 'bg-[#4ECDC4] text-[#0F1923] shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Executive Access
            </button>
          </div>

          <header className="mb-8">
            <h2 className="text-3xl font-black text-[#0F1923] leading-tight tracking-tighter">
              {loginMode === 'admin' ? <>System<br/><span className="text-gray-400 text-2xl">Administrator</span></> : <>Welcome Back,<br/><span className="text-[#4ECDC4]">Field Staff</span></>}
            </h2>
            <p className="text-sm font-bold text-gray-400 mt-2">
              {loginMode === 'admin' ? 'Authorized personnel access only' : 'Enter your username for quick terminal access'}
            </p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-red-50 border border-red-100 text-red-500 text-xs font-bold rounded-2xl flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Username</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#4ECDC4] transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder=""
                  autoComplete="off"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-[#0F1923] outline-none focus:border-[#4ECDC4] focus:bg-white transition-all shadow-sm"
                  {...register('username')}
                />
              </div>
              {errors.username && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.username.message}</p>}
            </div>

            {/* Password Input (Only for Admin) */}
            <AnimatePresence>
              {loginMode === 'admin' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#4ECDC4] transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder=""
                      autoComplete="new-password"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-14 pr-12 text-sm font-bold text-[#0F1923] outline-none focus:border-[#4ECDC4] focus:bg-white transition-all shadow-sm"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4ECDC4] transition-colors"
                    >
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.password.message}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full ${loginMode === 'admin' ? 'bg-[#0F1923]' : 'bg-[#4ECDC4] text-[#0F1923]'} rounded-2xl py-4 font-black text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-2xl relative overflow-hidden group`}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {loginMode === 'admin' ? 'Secure Login' : 'Enter Terminal'}
                  <div className={`w-8 h-8 rounded-lg ${loginMode === 'admin' ? 'bg-white/10 text-white' : 'bg-black/10 text-[#0F1923]'} flex items-center justify-center group-hover:translate-x-1 transition-transform`}>
                    <ArrowRight size={18} />
                  </div>
                </>
              )}
            </button>
          </form>

          {/* Admin Specific Actions */}
          {loginMode === 'admin' && (
            <div className="mt-6 flex flex-col items-center gap-4">
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="text-[11px] font-black text-gray-400 hover:text-[#4ECDC4] uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <Lock size={12} />
                Administrator: Change Password
              </button>
            </div>
          )}

          {/* Bottom Branding */}
          <div className="mt-12 text-center">
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">
              Licensed by <span className="text-gray-400">EVA GROUPS GLOBAL</span>
            </p>
          </div>
        </div>
      </motion.div>

      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
        isAdmin={true}
      />
    </div>
  );
}
