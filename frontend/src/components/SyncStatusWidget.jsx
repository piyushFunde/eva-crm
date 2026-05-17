import { Wifi, WifiOff, RefreshCcw } from 'lucide-react';
import useNetworkStore from '@/offline/networkManager';
import { motion, AnimatePresence } from 'framer-motion';

export default function SyncStatusWidget() {
  const { isOnline, isSyncing, pendingCount } = useNetworkStore();

  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
      >
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-full shadow-2xl border backdrop-blur-xl transition-all ${
          !isOnline ? 'bg-[#EF4444]/90 border-white/10 text-white' : 
          isSyncing ? 'bg-[#3B5BDB]/90 border-white/10 text-white' : 
          'bg-[#4ECDC4]/90 border-white/10 text-[#0F1923]'
        }`}>
          {!isOnline ? (
            <WifiOff className="w-4 h-4" />
          ) : isSyncing ? (
            <RefreshCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Wifi className="w-4 h-4" />
          )}
          
          <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
            {!isOnline ? 'Offline' : isSyncing ? 'Syncing...' : 'Synced'}
            {pendingCount > 0 && ` • ${pendingCount} Waiting`}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
