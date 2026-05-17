import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Shield, BarChart3, History } from 'lucide-react';
import useAuthStore from '@/store/authStore';

export default function BottomNav() {
  const { isAdmin } = useAuthStore();

  const tabs = [
    { path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { path: '/my-list',   label: 'My List',   Icon: ClipboardList },
    { path: '/collection-history', label: 'History', Icon: History },
  ];

  if (isAdmin()) {
    tabs.push({ path: '/analytics', label: 'Analytics', Icon: BarChart3 });
    tabs.push({ path: '/admin', label: 'Admin', Icon: Shield });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F1923]/95 backdrop-blur-xl border-t border-white/5 shadow-2xl pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto h-[68px] px-4">
        {tabs.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full relative transition-all duration-300 ${
                isActive ? 'text-[#4ECDC4]' : 'text-white/30'
              }`
            }
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className={`relative flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : ''}`}>
                  <Icon 
                    size={20} 
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? 'drop-shadow-[0_0_8px_rgba(78,205,196,0.5)]' : ''} 
                  />
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-1 h-1 bg-[#4ECDC4] rounded-full animate-pulse" />
                  )}
                </div>
                <span className={`text-[9px] uppercase tracking-widest font-black ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
