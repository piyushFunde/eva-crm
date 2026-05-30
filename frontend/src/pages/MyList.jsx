import { useEffect, useState } from 'react';
import { Search, Phone, Wallet, Calendar, MapPin, Loader2, ClipboardCheck, ArrowRight, PhoneForwarded, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCustomerStore from '@/store/customerStore';
import useAuthStore from '@/store/authStore';
import { toast } from 'sonner';
import CollectionModal from '@/components/CollectionModal';
import { formatCurrency, isToday, isOverdue, formatDate } from '@/utils/formatters';

const filterTabs = ['All', 'Pending', 'Collected'];

export default function MyList() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const { customers, fetchCustomers, isLoading } = useCustomerStore();

  useEffect(() => {
    fetchCustomers(0, 100, search);
  }, [fetchCustomers, search]);

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.address.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      activeFilter === 'All' || 
      (activeFilter === 'Collected' ? c.status?.toLowerCase() === 'completed' : c.status?.toLowerCase() === activeFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#0F1923] pb-32">
      {/* ── Sticky Navigation Bar ────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#0F1923]/80 backdrop-blur-xl px-5 py-6 space-y-6 border-b border-white/5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                  activeFilter === tab
                    ? 'bg-[#4ECDC4] text-[#0F1923] shadow-[0_4px_15px_rgba(78,205,196,0.3)]'
                    : 'text-white/30 hover:text-white/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Active Route</p>
             <p className="text-sm font-black text-[#4ECDC4] tracking-tighter">{filtered.length} Leads</p>
          </div>
        </div>

        {/* Dynamic Search */}
        <div className="relative group max-w-md mx-auto">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#4ECDC4] transition-all duration-300">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, ID or Locality..."
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4.5 pl-14 pr-6 text-[14px] font-bold text-white placeholder:text-white/20 outline-none focus:bg-white/[0.06] focus:border-[#4ECDC4]/50 focus:shadow-[0_0_20px_rgba(78,205,196,0.1)] transition-all duration-500"
          />
        </div>
      </div>

      {/* ── Leads Grid ───────────────────────────────────── */}
      <div className="px-5 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#4ECDC4] opacity-50" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Syncing Records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center py-24 glass-card border-dashed border-white/10"
          >
            <p className="text-sm font-bold text-white/30">No matching records found</p>
            <p className="text-[10px] text-white/10 mt-2 uppercase tracking-widest">Refine your search parameters</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode='popLayout'>
              {filtered.map((customer, i) => {
                const overdue = isOverdue(customer.dueDate);
                const dueToday = isToday(customer.dueDate);

                return (
                  <motion.div
                    key={customer.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass-card glass-card-hover group border-white/5 flex flex-col gap-5"
                  >
                    {/* Identity Section */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-white truncate tracking-tighter group-hover:text-[#4ECDC4] transition-colors">{customer.name}</h3>
                        <div className="flex flex-col gap-2 mt-2">
                          <span className="flex items-center gap-2 text-white/40 text-[11px] font-bold">
                            <Phone size={14} className="text-[#4ECDC4]/60" />
                            {customer.phone}
                          </span>
                          <span className="flex items-center gap-2 text-white/40 text-[11px] font-bold">
                            <MapPin size={14} className="text-[#4ECDC4]/60" />
                            <span className="truncate opacity-80">{customer.address}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`badge ${
                          (customer.status?.toLowerCase() === 'collected' || customer.status?.toLowerCase() === 'completed') ? 'badge-collected' :
                          customer.status?.toLowerCase() === 'partial' ? 'badge-partial' : 'badge-pending'
                        } px-3 py-1.5`}>
                          {customer.status?.toUpperCase()}
                        </div>
                        {useAuthStore.getState().isAdmin() && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete lead: ${customer.name}? This will remove them from the system.`)) {
                                useCustomerStore.getState().deleteCustomer(customer.id).then(res => {
                                  if (res?.success) {
                                    toast.success('Lead removed successfully');
                                  } else {
                                    toast.error('Failed to remove lead: ' + (res?.error || 'Unknown error'));
                                  }
                                });
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Financial Summary Box */}
                    <div className="bg-[#0F1923]/40 rounded-2xl p-4 flex items-center justify-between border border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-1 opacity-5">
                        <Wallet size={40} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Due Installment</p>
                        <p className="text-2xl font-black text-white tracking-tighter">
                          {formatCurrency(customer.emiAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Deadline</p>
                        <div className={`flex flex-col items-end font-black uppercase text-[11px] ${
                          overdue ? 'text-[#EF4444]' : dueToday ? 'text-[#F59E0B]' : 'text-[#4ECDC4]'
                        }`}>
                          <span>{dueToday ? 'Due Today' : overdue ? 'Delayed' : 'Upcoming'}</span>
                          <span className="text-[10px] text-white/40 font-bold normal-case mt-0.5">{formatDate(customer.dueDate)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive CTA */}
                    {!(customer.status?.toLowerCase() === 'collected' || customer.status?.toLowerCase() === 'completed') ? (
                      <div className="flex gap-3 pt-1">
                        <a
                          href={`tel:${customer.phone}`}
                          className="btn-secondary flex-1 !min-h-[48px] !text-[11px] !font-black !uppercase !tracking-[0.1em]"
                        >
                          <PhoneForwarded size={16} />
                          Call
                        </a>
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="btn-primary flex-1 !min-h-[48px] !text-[11px] !font-black !uppercase !tracking-[0.1em]"
                        >
                          <ClipboardCheck size={16} />
                          Collect
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-4 bg-[#22C55E]/5 rounded-xl border border-[#22C55E]/10">
                        <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center shadow-[0_0_12px_rgba(34,197,94,0.3)]">
                          <svg viewBox="0 0 10 8" className="w-3 h-3" fill="none">
                            <path d="M1 4l2.5 2.5L9 1" stroke="#0F1923" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-black text-[#22C55E] uppercase tracking-[0.2em]">Closed Account</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Floating Stats Overlay (Premium Touch) ────────── */}
      <AnimatePresence>
        {filtered.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20"
          >
             <div className="bg-[#1a2d42]/90 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-6">
                <div className="flex flex-col items-center">
                   <p className="text-[8px] font-black text-white/30 uppercase">Total Value</p>
                   <p className="text-xs font-black text-white tracking-tighter">
                      {formatCurrency(filtered.reduce((acc, c) => acc + c.emiAmount, 0))}
                   </p>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex flex-col items-center">
                   <p className="text-[8px] font-black text-white/30 uppercase">Selection</p>
                   <p className="text-xs font-black text-[#4ECDC4] tracking-tighter">{filtered.length}</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCustomer && (
          <CollectionModal
            customer={selectedCustomer}
            onClose={() => {
              setSelectedCustomer(null);
              fetchCustomers(0, 100, search);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
