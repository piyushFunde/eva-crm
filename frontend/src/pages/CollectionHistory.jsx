import { useEffect, useState } from 'react';
import { Search, Loader2, Calendar, Filter, ChevronRight, History as HistoryIcon, Clock, Activity, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import useAuthStore from '@/store/authStore';
import useHistoryStore from '@/store/historyStore';
import CollectionDetailsModal from '@/components/CollectionDetailsModal';
import { formatCurrency } from '@/utils/formatters';

export default function CollectionHistory() {
  const { isAdmin } = useAuthStore();
  const { history, isLoading, fetchHistory, hasMore, page } = useHistoryStore();
  
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    fetchHistory(isAdmin(), 0, false);
  }, [fetchHistory, isAdmin]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchHistory(isAdmin(), page + 1, true);
    }
  };

  const filteredHistory = history.filter(item => 
    item.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    item.customerPhone?.includes(search)
  );

  return (
    <div className="min-h-screen bg-[#0F1923] px-5 py-8 space-y-8 max-w-7xl mx-auto w-full pb-32">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <Clock size={12} className="text-[#4ECDC4]" />
             <span className="text-[10px] font-black text-[#4ECDC4] uppercase tracking-[0.3em]">Temporal Audit Log</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Collection Registry</h1>
          <p className="text-[13px] font-medium text-white/40 mt-1">
            {isAdmin() ? 'Global collection footprint' : 'Personal transaction summary'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative group flex-1 md:w-80">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#4ECDC4] transition-all duration-300">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter transactions by name..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3.5 pl-14 pr-6 text-[13px] font-bold text-white placeholder:text-white/20 outline-none focus:bg-white/[0.06] focus:border-[#4ECDC4]/50 focus:shadow-[0_0_20px_rgba(78,205,196,0.1)] transition-all duration-500"
            />
          </div>
          <button className="h-12 w-12 flex items-center justify-center bg-white/5 border border-white/5 rounded-xl text-[#4ECDC4] hover:bg-white/10 transition-all">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* ── History List ─────────────────────────────────── */}
      <div className="space-y-4">
        {filteredHistory.length === 0 && !isLoading ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card flex flex-col items-center justify-center py-24 text-center border-dashed border-white/10"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8 relative">
               <div className="absolute inset-0 bg-[#4ECDC4] blur-[30px] opacity-10 rounded-full" />
               <HistoryIcon size={32} className="text-white/20 relative z-10" />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">Registry Empty</h3>
            <p className="text-[11px] font-black text-white/20 mt-2 uppercase tracking-[0.2em] max-w-[240px]">
              No transactions detected within this search scope.
            </p>
            <button 
              onClick={() => window.location.href = '/my-list'}
              className="btn-primary mt-10 px-10"
            >
              Initiate Collection
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode='popLayout'>
              {filteredHistory.map((record, i) => (
                <motion.div 
                  key={record.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card glass-card-hover group border-white/5 cursor-pointer"
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-[17px] font-black text-white truncate tracking-tight group-hover:text-[#4ECDC4] transition-colors">{record.customerName}</h4>
                        <div className={`badge ${
                          (record.statusAfterCollection?.toLowerCase() === 'collected' || record.statusAfterCollection?.toLowerCase() === 'completed') ? 'badge-collected' :
                          record.statusAfterCollection?.toLowerCase() === 'partial' ? 'badge-partial' : 'badge-pending'
                        }`}>
                          {record.statusAfterCollection?.toUpperCase()}
                        </div>
                        {isAdmin() && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Revert this collection? This will restore the customer\'s pending balance.')) {
                                useHistoryStore.getState().deleteRecord(record.id).then(res => {
                                  if (res?.success) {
                                    toast.success('Collection reverted successfully');
                                  } else {
                                    toast.error('Failed to revert: ' + (res?.error || 'Unknown error'));
                                  }
                                });
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all ml-auto"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/30">
                            <Calendar size={11} className="text-[#4ECDC4]/50" />
                            {new Date(record.collectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                         </div>
                         {isAdmin() && (
                           <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#60A5FA]">
                              <Activity size={11} />
                              AGENT: {record.executiveName}
                           </div>
                         )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-2xl font-black text-[#22C55E] tracking-tighter">
                        {formatCurrency(record.amountCollected)}
                      </span>
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">
                        Channel: {record.paymentMode}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/5">
                    <div className="flex items-center gap-4">
                       <div className="text-[10px] font-black uppercase tracking-widest">
                          <span className="text-white/20">Remainder: </span>
                          <span className="text-[#4ECDC4]">{formatCurrency(record.remainingAmount)}</span>
                       </div>
                       <div className="text-[10px] font-black uppercase tracking-widest">
                          <span className="text-white/20">Ref ID: </span>
                          <span className="text-white/40">#{record.id?.toString().slice(-4)}</span>
                       </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#4ECDC4] group-hover:bg-[#4ECDC4]/10 transition-all">
                       <ChevronRight size={16} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {/* Pagination/Load More */}
        {isLoading && (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-10 h-10 text-[#4ECDC4] animate-spin opacity-40" />
          </div>
        )}
        
        {hasMore && !isLoading && filteredHistory.length > 0 && (
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={loadMore}
            className="w-full py-5 glass-card !bg-white/[0.02] text-[11px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white/60 transition-all border-dashed"
          >
            Load Archival Records
          </motion.button>
        )}
      </div>

      {/* Detail Modal Overlay */}
      {selectedRecord && (
        <CollectionDetailsModal 
          record={selectedRecord} 
          onClose={() => setSelectedRecord(null)} 
        />
      )}
    </div>
  );
}
