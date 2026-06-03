import { X, Calendar, User, IndianRupee, CreditCard, Download, ExternalLink, Hash, FileText, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency, formatTime } from '@/utils/formatters';
import useAuthStore from '@/store/authStore';
import useHistoryStore from '@/store/historyStore';
import { toast } from 'sonner';

export default function CollectionDetailsModal({ record, onClose }) {
  if (!record) return null;

  const getReceiptUrl = (path) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    const baseServerUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
    return `${baseServerUrl}/uploads/receipts/${path}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#0F1923]/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-lg bg-[#1a2d42] rounded-t-[32px] border-t border-white/10 shadow-[0_-15px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 bg-white/10 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#4ECDC4]/10 rounded-xl flex items-center justify-center text-[#4ECDC4]">
               <FileText size={20} />
             </div>
             <div>
               <h2 className="text-lg font-black text-white tracking-tight uppercase">Transaction Dossier</h2>
               <p className="text-[10px] font-bold text-[#4ECDC4] uppercase tracking-[0.2em]">{formatTime(record.collectedAt)}</p>
             </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-8 overflow-y-auto no-scrollbar flex-1 space-y-8">
          {/* Main Info Card */}
          <div className="relative overflow-hidden glass-card !bg-white/[0.03] !p-6 border-white/10 group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <IndianRupee size={80} />
             </div>
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Total Amount Recovered</p>
             <div className="flex items-end justify-between">
                <p className="text-4xl font-black text-[#22C55E] tracking-tighter">{formatCurrency(record.amountCollected)}</p>
                <div className={`badge ${
                  (record.statusAfterCollection?.toLowerCase() === 'collected' || record.statusAfterCollection?.toLowerCase() === 'completed') ? 'badge-collected' :
                  record.statusAfterCollection?.toLowerCase() === 'partial' ? 'badge-partial' : 'badge-pending'
                } !text-[11px] !py-1.5 !px-4`}>
                  {record.statusAfterCollection?.toUpperCase()}
                </div>
             </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            <DetailItem label="Lead Identity" val={record.customerName} sub={record.customerPhone} icon={<User size={14} />} />
            <DetailItem label="Payment Route" val={record.paymentMode} sub="Digital Receipt" icon={<CreditCard size={14} />} />
            <DetailItem label="Collection Agent" val={record.executiveName} sub="Field Executive" icon={<User size={14} />} />
            <DetailItem label="Filing Date" val={new Date(record.collectedAt).toLocaleDateString()} sub={formatTime(record.collectedAt)} icon={<Calendar size={14} />} />
          </div>

          {/* Balance Trail */}
          <div className="glass-card !bg-[#0F1923]/40 !p-6 border-white/5 space-y-4">
             <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Recovery Breakdown</h3>
             <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-white/40">Opening Exposure</span>
                <span className="text-white">{formatCurrency(record.previousPendingAmount)}</span>
             </div>
             <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-white/40">Inbound Capital</span>
                <span className="text-[#22C55E]">-{formatCurrency(record.amountCollected)}</span>
             </div>
             <div className="h-px bg-white/5 w-full pt-1" />
             <div className="flex justify-between items-center">
                <span className="text-[11px] font-black text-white uppercase tracking-widest">Residual Exposure</span>
                <span className="text-xl font-black text-[#4ECDC4] tracking-tighter">{formatCurrency(record.remainingAmount)}</span>
             </div>
          </div>

          {/* Notes */}
          {record.notes && (
            <div className="space-y-3">
              <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Agent Remarks</h3>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-medium text-white/70 italic leading-relaxed">
                "{record.notes}"
              </div>
            </div>
          )}

          {/* Receipt Proof */}
          {record.receiptImagePath && (
            <div className="space-y-4 pb-6">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Transaction Evidence</h3>
                <a 
                  href={getReceiptUrl(record.receiptImagePath)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] font-black text-[#4ECDC4] uppercase tracking-widest hover:opacity-80 transition-opacity"
                >
                  <ExternalLink size={12} /> Full Res
                </a>
              </div>
              <div className="bg-[#0F1923] rounded-[24px] p-2 border border-white/5 h-64 flex justify-center items-center overflow-hidden group">
                <img 
                  src={getReceiptUrl(record.receiptImagePath)} 
                  alt="Receipt" 
                  className="max-h-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="px-6 py-6 bg-[#1a2d42] border-t border-white/5 flex flex-col gap-3">
           {useAuthStore.getState().isAdmin() && (
             <button 
               onClick={() => {
                 if (confirm('Revert this collection? This will restore the customer\'s pending balance.')) {
                   useHistoryStore.getState().deleteRecord(record.id).then(res => {
                     if (res?.success) {
                       toast.success('Collection reverted successfully');
                       onClose();
                     } else {
                       toast.error('Failed to revert: ' + (res?.error || 'Unknown error'));
                     }
                   });
                 }
               }}
               className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
             >
               <RotateCcw size={14} />
               Revoke Payment
             </button>
           )}
           <button 
             onClick={onClose}
             className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-black text-white uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
           >
             Close Dossier
           </button>
        </div>
      </motion.div>
    </div>
  );
}

function DetailItem({ label, val, sub, icon }) {
  return (
    <div className="space-y-1.5">
       <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-1.5">
         {icon} {label}
       </p>
       <p className="text-[14px] font-black text-white leading-tight tracking-tight">{val}</p>
       <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{sub}</p>
    </div>
  );
}
