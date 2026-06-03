import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, Users, IndianRupee, Download, Calendar, 
  AlertTriangle, CreditCard, ChevronRight, FileText, FileSpreadsheet, Loader2, Activity, Filter, Clock, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import useAnalyticsStore from '@/store/analyticsStore';
import { formatCurrency } from '@/utils/formatters';
import api from '@/api/axios';

const COLORS = ['#4ECDC4', '#60A5FA', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Analytics() {
  const { 
    overview, trend, paymentModes, highRisk, performance, isLoading, 
    fetchOverview, fetchTrend, fetchPaymentModes, fetchHighRisk, fetchPerformance 
  } = useAnalyticsStore();

  const [range, setRange] = useState('week');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [exportLogs, setExportLogs] = useState([]);

  useEffect(() => {
    fetchOverview();
    fetchTrend(range === 'custom' ? `custom&start=${customDates.start}&end=${customDates.end}` : range);
    fetchPaymentModes();
    fetchHighRisk();
    fetchPerformance();
    fetchExportLogs();
  }, [range, customDates]);

  const fetchExportLogs = async () => {
    try {
      const response = await api.get('/export/logs');
      if (response.success) setExportLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch export logs', error);
    }
  };

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      const response = await api.get(`/export/collections/${format}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Export Complete: ${format.toUpperCase()}`);
      fetchExportLogs();
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#4ECDC4]" />
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Compiling Intelligence...</p>
      </div>
    );
  }

  const chartData = (() => {
    if (!trend || trend.length === 0) return [];
    if (trend.length === 1) {
      const singlePoint = trend[0];
      try {
        const d = new Date(singlePoint.date);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() - 1);
          const prevDateStr = d.toISOString().split('T')[0];
          return [
            { date: prevDateStr, amount: 0 },
            singlePoint
          ];
        }
      } catch (e) {
        console.error('Failed to pad trend data', e);
      }
      return [
        { date: 'Previous', amount: 0 },
        singlePoint
      ];
    }
    return trend;
  })();

  return (
    <div className="min-h-screen bg-[#0F1923] px-5 py-8 space-y-8 max-w-7xl mx-auto w-full pb-32">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Clock size={12} className="text-[#4ECDC4]" />
             <span className="text-[10px] font-black text-[#4ECDC4] uppercase tracking-[0.3em]">Operational Intelligence</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Performance Hub</h1>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
          {['week', 'month', 'custom'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${
                range === r 
                  ? 'bg-[#4ECDC4] text-[#0F1923] shadow-xl shadow-[#4ECDC4]/20' 
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── Metric Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard 
          label="Total Volume" 
          value={formatCurrency(overview?.totalCollected || 0)} 
          sub={`+₹${overview?.todayCollections || 0} New Today`}
          icon={<IndianRupee size={18} />}
          color="text-[#4ECDC4]"
          bg="bg-[#4ECDC4]/10"
        />
        <KPICard 
          label="Efficiency" 
          value={`${overview?.successRate || 0}%`} 
          sub="Conversion Index"
          icon={<TrendingUp size={18} />}
          color="text-[#60A5FA]"
          bg="bg-blue-500/10"
        />
        <KPICard 
          label="Active Leads" 
          value={overview?.totalCustomers || 0} 
          sub="Route Distribution"
          icon={<Users size={18} />}
          color="text-[#F59E0B]"
          bg="bg-amber-500/10"
        />
        <KPICard 
          label="At Risk" 
          value={formatCurrency(overview?.totalPending || 0)} 
          sub="Capital Exposure"
          icon={<AlertTriangle size={18} />}
          color="text-[#EF4444]"
          bg="bg-red-500/10"
        />
      </div>

      {/* ── Analytics Visuals ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Area */}
        <div className="glass-card !p-8 h-[400px] flex flex-col group">
          <div className="flex justify-between items-center mb-8">
            <div>
               <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Liquidity Trend</h3>
               <p className="text-[10px] font-bold text-white/20 mt-1 uppercase">Daily Collection Flow</p>
            </div>
            <div className="w-10 h-10 bg-[#4ECDC4]/10 rounded-xl flex items-center justify-center text-[#4ECDC4]">
              <Activity size={18} />
            </div>
          </div>
          <div className="flex-1 w-full flex items-center justify-center">
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10">
                <div className="w-12 h-12 rounded-full bg-[#4ECDC4]/10 border border-[#4ECDC4]/20 flex items-center justify-center text-[#4ECDC4] mb-3">
                  <Activity size={20} />
                </div>
                <h4 className="text-xs font-black text-white uppercase tracking-widest">No Liquidity Data</h4>
                <p className="text-[10px] font-bold text-white/20 uppercase mt-1 tracking-wider">
                  Select a different range or check back later
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 25, 35, 0.9)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '16px', 
                      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                      padding: '12px'
                    }}
                    itemStyle={{ color: '#4ECDC4', fontWeight: '900', fontSize: '14px' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#4ECDC4" strokeWidth={4} fillOpacity={1} fill="url(#colorTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment Channels */}
        <div className="glass-card !p-8 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
               <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Channel Mix</h3>
               <p className="text-[10px] font-bold text-white/20 mt-1 uppercase">Transaction Methods</p>
            </div>
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="flex-1 w-full relative flex items-center justify-center">
            {paymentModes.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/20 mb-3">
                  <CreditCard size={20} />
                </div>
                <h4 className="text-xs font-black text-white uppercase tracking-widest">No Payment Channels</h4>
                <p className="text-[10px] font-bold text-white/20 uppercase mt-1 tracking-wider">
                  No records to distribute
                </p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentModes}
                      innerRadius={75}
                      outerRadius={95}
                      paddingAngle={12}
                      dataKey="value"
                      stroke="none"
                    >
                      {paymentModes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="drop-shadow-lg" />
                      ))}
                    </Pie>
                    <Tooltip content={<PaymentModeTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="text-center">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Methods</p>
                      <p className="text-xl font-black text-white">{paymentModes.length}</p>
                   </div>
                </div>
              </>
            )}
          </div>
          {paymentModes.length > 0 && (
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-6">
              {paymentModes.map((m, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg hover:bg-white/[0.05] hover:border-white/10 transition-all">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{m.name}</span>
                  <span className="text-[9px] font-black text-[#4ECDC4] ml-1">{m.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Risk & Logistics ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* High Exposure List */}
        <div className="lg:col-span-2 glass-card !p-8">
          <div className="flex justify-between items-center mb-8">
             <div>
                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Risk Exposure</h3>
                <p className="text-[10px] font-bold text-white/20 mt-1 uppercase">Top High-Value Defaults</p>
             </div>
             <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400">
               <AlertTriangle size={18} />
             </div>
          </div>
          <div className="space-y-4">
            {highRisk.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white/[0.01] border border-white/5 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 animate-pulse">
                  <CheckCircle size={24} />
                </div>
                <h4 className="text-xs font-black text-white uppercase tracking-widest">No Risk Exposure</h4>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mt-2 max-w-xs px-4">
                  All active accounts are current. There are no high-value defaults flagged.
                </p>
              </div>
            ) : (
              highRisk.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-[#EF4444]/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 text-base font-black border border-red-500/10">
                      {c.name[0]}
                    </div>
                    <div>
                      <p className="text-[16px] font-black text-white tracking-tight">{c.name}</p>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1 group-hover:text-[#EF4444]/60 transition-colors">{c.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[18px] font-black text-[#EF4444] tracking-tighter">{formatCurrency(c.emiAmount)}</p>
                    <p className="text-[9px] font-black text-white/10 uppercase tracking-widest mt-1">Pending Balance</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Data Exports */}
        <div className="glass-card !p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-8">Report Engine</h3>
            <div className="space-y-4">
              <ExportBtn 
                onClick={() => handleExport('excel')} 
                icon={<FileSpreadsheet size={18} />} 
                label="Excel Dataset" 
                sub="XLSX Structural Export" 
                disabled={isExporting} 
                activeColor="hover:border-[#4ECDC4]/40 hover:bg-[#4ECDC4]/5"
              />
              <ExportBtn 
                onClick={() => handleExport('pdf')} 
                icon={<FileText size={18} />} 
                label="PDF Dossier" 
                sub="Formatted Document" 
                disabled={isExporting} 
                activeColor="hover:border-[#60A5FA]/40 hover:bg-[#60A5FA]/5"
              />
              <ExportBtn 
                onClick={() => handleExport('csv')} 
                icon={<Download size={18} />} 
                label="CSV Flatfile" 
                sub="Raw Comma-Separated Dataset" 
                disabled={isExporting} 
                activeColor="hover:border-amber-500/40 hover:bg-amber-500/5"
              />
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-white/5">
            <div className="flex items-center gap-2 mb-6">
              <Calendar size={14} className="text-white/20" />
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Export Registry</p>
            </div>
            <div className="space-y-4">
              {exportLogs.length === 0 ? (
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider italic">No recent exports recorded</p>
              ) : (
                exportLogs.slice(0, 3).map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] font-black">
                    <span className="text-white/40 uppercase tracking-widest">{log.format} LOG</span>
                    <span className="text-white/10">
                      {log.exportedAt ? new Date(log.exportedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, sub, icon, color, bg }) {
  return (
    <div className="glass-card !p-6 flex flex-col gap-5 border-white/5 group hover:border-white/10 transition-all">
      <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 border border-white/5`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
        <p className="text-[11px] font-bold text-white/40 mt-1 opacity-80 group-hover:text-white/60 transition-colors">{sub}</p>
      </div>
    </div>
  );
}

function ExportBtn({ onClick, icon, label, sub, disabled, activeColor }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 transition-all group ${activeColor}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#0F1923] border border-white/5 flex items-center justify-center text-white/20 group-hover:text-inherit transition-all">
          {icon}
        </div>
        <div className="text-left">
          <p className="text-[15px] font-black text-white tracking-tight">{label}</p>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1.5">{sub}</p>
        </div>
      </div>
      <ChevronRight size={16} className="text-white/10 group-hover:text-inherit transition-colors" />
    </button>
  );
}

function PaymentModeTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0F1923]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].color || '#4ECDC4' }} />
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">
            {data.name}
          </span>
          <span className="text-sm font-black text-white leading-none">
            {data.value} {data.value === 1 ? 'Collection' : 'Collections'}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

