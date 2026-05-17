import { useEffect, useState } from 'react';
import { RefreshCcw, Trash2, CheckCircle2, WifiOff, AlertTriangle, ChevronLeft, Database, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getPendingCollections, deleteCollection } from '@/offline/db';
import { flushSyncQueue } from '@/offline/syncEngine';
import useNetworkStore from '@/offline/networkManager';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';

export default function SyncQueue() {
  const [pending, setPending] = useState([]);
  const { isOnline, isSyncing } = useNetworkStore();
  const navigate = useNavigate();

  const loadQueue = async () => {
    const data = await getPendingCollections();
    setPending(data);
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) {
      toast.error('You are still offline. Connect to sync.');
      return;
    }
    await flushSyncQueue();
    await loadQueue();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this pending collection from local storage?')) {
      await deleteCollection(id);
      await loadQueue();
      toast.success('Purged from Queue');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1923] px-5 py-8 space-y-8 max-w-lg mx-auto w-full pb-32">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-white transition-all">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Vault Queue</h1>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Pending Synchronization</p>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className={`glass-card !p-6 border-white/5 relative overflow-hidden ${isOnline ? 'shadow-[0_10px_30px_rgba(34,197,94,0.1)]' : 'shadow-[0_10px_30px_rgba(239,68,68,0.1)]'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isOnline ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
              {isOnline ? <CheckCircle2 size={24} /> : <WifiOff size={24} />}
            </div>
            <div>
              <p className="text-[15px] font-black text-white tracking-tight">{isOnline ? 'System Online' : 'Network Interrupted'}</p>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{pending.length} Outbound Records</p>
            </div>
          </div>
          {isOnline && pending.length > 0 && (
            <button 
              onClick={handleManualSync} 
              disabled={isSyncing}
              className="px-4 py-2 bg-[#4ECDC4] text-[#0F1923] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#4ECDC4]/20"
            >
              {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
              Push
            </button>
          )}
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        <AnimatePresence mode='popLayout'>
          {pending.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center glass-card border-dashed border-white/10"
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8">
                 <Database size={32} className="text-white/10" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">Queue Synchronized</h3>
              <p className="text-[11px] font-black text-white/20 mt-2 uppercase tracking-[0.2em]">All data has been safely vaulted.</p>
            </motion.div>
          ) : (
            pending.map((item, i) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card glass-card-hover !p-6 border-white/5 group border-l-4 border-l-[#F59E0B]"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-[17px] font-black text-white tracking-tight uppercase">{item.customerName}</h4>
                    <p className="text-2xl font-black text-[#F59E0B] tracking-tighter mt-1">{formatCurrency(item.amountCollected)}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[9px] font-black px-2.5 py-1 bg-white/5 rounded-lg text-white/40 uppercase tracking-widest border border-white/5">
                        {item.paymentMode}
                      </span>
                      <span className="text-[9px] font-black px-2.5 py-1 bg-[#F59E0B]/10 text-[#F59E0B] rounded-lg uppercase tracking-widest border border-[#F59E0B]/20">
                        Waiting Sync
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                {item.notes && (
                  <div className="mt-5 p-4 bg-[#0F1923]/40 rounded-xl text-[11px] font-medium text-white/40 italic leading-relaxed border border-white/5">
                    "{item.notes}"
                  </div>
                )}
                <div className="mt-5 flex items-center gap-2 text-[9px] font-black text-white/10 uppercase tracking-widest">
                  <AlertTriangle size={12} className="text-[#F59E0B]/50" />
                  Recorded on {new Date(item.createdAt).toLocaleString()}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
