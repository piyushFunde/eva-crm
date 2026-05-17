import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, ChevronDown, Activity, User as UserIcon, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import useNotificationStore from '@/store/notificationStore';
import useNetworkStore from '@/offline/networkManager';
import NotificationCenter from './NotificationCenter';
import ChangePasswordModal from './ChangePasswordModal';

export default function TopBar({ title = 'EVA CRM' }) {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { isOnline } = useNetworkStore();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="sticky top-0 z-40 bg-[#0F1923]/90 backdrop-blur-xl border-b border-white/5 px-5 pt-safe transition-all duration-300">
      <div className="flex items-center justify-between h-16">
        {/* Identity & Status */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-tighter uppercase">{title}</h1>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#4ECDC4] shadow-[0_0_8px_#4ECDC4]' : 'bg-red-500 shadow-[0_0_8px_#EF4444]'}`} 
              />
            </div>
            <div className="flex items-center gap-1 opacity-60">
               <Activity size={10} className="text-[#4ECDC4]" />
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#4ECDC4]">
                 {isOnline ? 'Network: Secure' : 'Mode: Offline'}
               </span>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
          >
            <Bell size={18} className="text-white/60 group-hover:text-white" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-[#EF4444] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#0F1923] shadow-lg">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Account Profile */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 p-1 pl-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
            >
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest hidden sm:block">Profile</span>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4ECDC4] to-[#45B7AF] flex items-center justify-center text-[#0F1923] text-xs font-black shadow-[0_0_15px_rgba(78,205,196,0.2)]">
                {initials}
              </div>
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-12 z-50 w-56 bg-[#1a2d42] rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-2xl"
                  >
                    <div className="px-5 py-4 border-b border-white/5 bg-white/5">
                      <p className="text-xs font-black text-white tracking-tight uppercase">{user?.name}</p>
                      <p className="text-[9px] text-[#4ECDC4] font-black uppercase tracking-[0.2em] mt-1">{user?.role?.replace('ROLE_', '')}</p>
                    </div>
                      <div className="p-2 space-y-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </header>
  );
}
