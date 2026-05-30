import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee, CheckCircle2, Clock, Play,
  Calendar, TrendingUp, Target, Users, Loader2, ArrowUpRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import useDashboardStore from '@/store/dashboardStore';
import useHistoryStore from '@/store/historyStore';
import useNetworkStore from '@/offline/networkManager';
import { formatCurrency } from '@/utils/formatters';
import { db } from '@/offline/db';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { stats, fetchDashboardStats, isLoading } = useDashboardStore();
  const { history, fetchHistory } = useHistoryStore();
  const { isOnline } = useNetworkStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadData = async () => {
      if (isOnline) {
        const result = await fetchDashboardStats();
        if (result?.success) {
          await db.dashboardCache.put({ key: 'stats', data: result.data, timestamp: Date.now() });
        }
        fetchHistory(isAdmin, 0, false);
      } else {
        const cached = await db.dashboardCache.get('stats');
        if (cached) {
          useDashboardStore.setState({ stats: cached.data });
        }
      }
    };
    loadData();
  }, [fetchDashboardStats, fetchHistory, isOnline, isAdmin]);

  const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';
  // Admin always shows 'Administrator' - never show DB names like 'System'
  const firstName = isAdmin
    ? 'Administrator'
    : (user?.name?.split(' ')[0] || user?.fullName?.split(' ')[0] || 'Executive');

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short'
  });

  const progressPercent = stats.todayTarget > 0 
    ? Math.round((stats.todayCollected / stats.todayTarget) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#4ECDC4]" />
        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Compiling Analytics...</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-5 py-8 space-y-8 max-w-4xl mx-auto w-full pb-32"
    >
      {/* ── Header Greet ─────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-black text-[#4ECDC4] uppercase tracking-[0.2em] opacity-80">
          <Calendar size={12} />
          {today}
        </div>
        <h2 className="text-3xl font-black text-white leading-tight tracking-tighter">
          Welcome back,<br />
          {firstName}
        </h2>
        <div className="flex items-center gap-4 pt-1">
           <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
             <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">{stats.assignedCustomers || 0} Assignments</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
             <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Goal: {formatCurrency(stats.todayTarget || 0)}</span>
           </div>
        </div>
      </motion.div>

      {/* ── Metric Strip ─────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5">
        {[
          { label: 'Today Target', val: stats.todayTarget || 0, icon: Target, color: 'text-[#60A5FA]', bg: 'bg-blue-500/10', shadow: 'shadow-blue-500/5' },
          { label: 'Collected', val: stats.todayCollected || 0, icon: CheckCircle2, color: 'text-[#22C55E]', bg: 'bg-green-500/10', shadow: 'shadow-green-500/5' },
          { label: 'Pending', val: stats.todayPending || 0, icon: Clock, color: 'text-[#F59E0B]', bg: 'bg-amber-500/10', shadow: 'shadow-amber-500/5' }
        ].map((m, i) => (
          <div key={i} className={`glass-card min-w-[160px] flex-1 border-white/5 ${m.shadow} group hover:border-[#4ECDC4]/30 transition-all`}>
            <div className={`w-10 h-10 ${m.bg} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
              <m.icon size={20} className={m.color} />
            </div>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-1">{m.label}</p>
            <p className="text-xl font-black text-white tracking-tighter">{formatCurrency(m.val)}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Performance & Action ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Progress Wheel */}
        <motion.div variants={itemVariants} className="glass-card !p-6 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={80} />
          </div>
          
          <div className="w-full flex justify-between items-center mb-6">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Daily Efficiency</p>
            <div className="flex items-center gap-1 text-[#4ECDC4]">
              <span className="text-xs font-black">{progressPercent}%</span>
              <ArrowUpRight size={14} />
            </div>
          </div>

          <div className="relative w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Done', value: stats.todayCollected || 0 },
                    { name: 'Left', value: Math.max(1, (stats.todayTarget || 0) - (stats.todayCollected || 0)) }
                  ]}
                  innerRadius={55}
                  outerRadius={68}
                  paddingAngle={10}
                  dataKey="value"
                  stroke="none"
                  startAngle={90}
                  endAngle={450}
                >
                  <Cell fill="#4ECDC4" className="drop-shadow-[0_0_8px_rgba(78,205,196,0.4)]" />
                  <Cell fill="rgba(255,255,255,0.04)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white tracking-tighter">{progressPercent}%</span>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">Achieved</span>
            </div>
          </div>
          
          <div className="mt-8 w-full space-y-4">
             <div className="flex justify-between text-[11px] font-bold">
                <span className="text-white/40 uppercase">Queue Progress</span>
                <span className="text-white/60">{stats.todayCollectedCount || 0}/{stats.assignedCustomers || 0} Accounts</span>
             </div>
             <div className="progress-container">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="progress-bar"
                />
             </div>
          </div>
        </motion.div>

        {/* Start Route Card */}
        <motion.div variants={itemVariants} className="glass-card !p-8 !bg-[#4ECDC4] flex flex-col justify-between relative overflow-hidden shadow-[0_15px_40px_rgba(78,205,196,0.15)] group">
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-[40px] pointer-events-none" />
          
          <div>
            <div className="w-12 h-12 bg-[#0F1923] rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <Play size={22} className="text-[#4ECDC4] fill-[#4ECDC4] ml-1" />
            </div>
            <h3 className="text-2xl font-black text-[#0F1923] tracking-tighter leading-tight">Start Field<br />Collection</h3>
            <p className="text-[13px] font-bold text-[#0F1923]/60 mt-3 max-w-[200px]">
              Access your route map and customer details for today.
            </p>
          </div>

          <button 
            onClick={() => navigate('/my-list')}
            className="mt-10 w-full py-4 bg-[#0F1923] text-white rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl"
          >
            Open Route List
            <ArrowUpRight size={18} />
          </button>
        </motion.div>
      </div>

      {/* ── Recent Activity ─────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">Recent Activity</h3>
          <button onClick={() => navigate('/collection-history')} className="text-[10px] font-black text-[#4ECDC4] uppercase tracking-widest hover:opacity-80">View All</button>
        </div>
        
        {history.length === 0 ? (
          <div className="glass-card !py-8 border-dashed border-white/10 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-white/20" />
            </div>
            <p className="text-xs font-bold text-white/40">No collections recorded yet</p>
            <p className="text-[10px] font-medium text-white/20 mt-1 uppercase tracking-widest">Activity will appear here in real-time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 3).map((record) => (
              <div 
                key={record.id}
                onClick={() => navigate('/collection-history')}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-[#4ECDC4]/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#4ECDC4]/10 flex items-center justify-center text-[#4ECDC4] font-black border border-[#4ECDC4]/10 text-sm">
                    {record.customerName ? record.customerName[0] : '?'}
                  </div>
                  <div>
                    <p className="text-[14px] font-black text-white tracking-tight">{record.customerName}</p>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-0.5">
                      {new Date(record.collectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {record.paymentMode}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-black text-[#22C55E] tracking-tighter">{formatCurrency(record.amountCollected)}</p>
                  <p className="text-[9px] font-black text-white/10 uppercase tracking-widest mt-0.5">Collected</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
