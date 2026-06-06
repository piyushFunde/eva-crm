import { useState, useRef, useEffect } from 'react';
import {
  Upload, TrendingUp, FileSpreadsheet, IndianRupee, Info, CheckCircle,
  Loader2, Users, Target, ShieldCheck, Trash2, X, Lock, User as UserIcon,
  Activity, Share, AlertTriangle, DatabaseZap, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/utils/formatters';
import api from '@/api/axios';
import useDashboardStore from '@/store/dashboardStore';
import useUserStore from '@/store/userStore';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('operations'); // 'operations' or 'team'
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef();

  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);
  const [showClearModal, setShowClearModal] = useState(null); // 'all' | 'pending' | null
  const [clearConfirmText, setClearConfirmText] = useState('');

  const { stats, fetchDashboardStats, teamPerformance, fetchTeamPerformance } = useDashboardStore();
  const { executives, fetchExecutives, deleteExecutive } = useUserStore();

  useEffect(() => {
    fetchDashboardStats();
    fetchTeamPerformance();
    fetchExecutives();
  }, []);

  const todayTotal = stats.todayCollected || 0;
  const todayTarget = stats.todayTarget || 0;

  const handleFile = (file) => {
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
    } else {
      toast.error('Please select a valid Excel file (.xlsx, .xls)');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post('/admin/upload-customers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.success) {
        toast.success(response.message || 'Customers uploaded successfully!');
        setSelectedFile(null);
        fetchDashboardStats();
        fetchTeamPerformance(); // Refresh the staff list too!
      }
    } catch (error) {
      toast.error(error.message || 'Failed to upload customers');
    } finally {
      setIsUploading(false);
    }
  };
  const handleClearData = async (type) => {
    setIsClearing(true);
    try {
      const endpoint = type === 'all' ? '/admin/customers/all' : '/admin/customers/pending';
      const response = await api.delete(endpoint);
      if (response.success) {
        toast.success(response.message || 'Data cleared successfully!');
        fetchDashboardStats();
        fetchTeamPerformance();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to clear data');
    } finally {
      setIsClearing(false);
      setShowClearModal(null);
      setClearConfirmText('');
    }
  };


  return (
    <div className="min-h-screen bg-[#0F1923] px-5 py-8 space-y-8 max-w-7xl mx-auto w-full pb-32">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={12} className="text-[#4ECDC4]" />
            <span className="text-[10px] font-black text-[#4ECDC4] uppercase tracking-[0.3em]">Central Administration</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Command Center</h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5 self-start md:self-center">
          {[
            { id: 'operations', label: 'Operations', icon: Activity },
            { id: 'team', label: 'Manage Team', icon: Users }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${activeTab === t.id
                  ? 'bg-[#4ECDC4] text-[#0F1923] shadow-xl shadow-[#4ECDC4]/20'
                  : 'text-white/30 hover:text-white/60'
                }`}
            >
              <t.icon size={12} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'operations' ? (
          <motion.div
            key="ops"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* ── Left Column: Operations ─────────────────────── */}
            <div className="space-y-8">
              <div className="glass-card !p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#4ECDC4]/10 blur-[60px] -mr-16 -mt-16 group-hover:bg-[#4ECDC4]/20 transition-all duration-700" />

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-[#4ECDC4]/10 rounded-2xl flex items-center justify-center border border-[#4ECDC4]/10">
                    <FileSpreadsheet className="w-6 h-6 text-[#4ECDC4]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Inbound Logistics</h3>
                    <p className="text-lg font-black text-white tracking-tight mt-1">Upload Customer List</p>
                  </div>
                </div>

                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
                  className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-500 relative overflow-hidden ${isDragging ? 'border-[#4ECDC4] bg-[#4ECDC4]/5 scale-[0.99]' :
                      selectedFile ? 'border-green-500/40 bg-green-500/5' :
                        'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                >
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                  {selectedFile ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto text-green-500 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-black text-white tracking-tight">{selectedFile.name}</p>
                      <p className="text-[10px] font-black text-green-500/60 uppercase tracking-widest">Ready for processing</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/20 border border-white/5 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white tracking-tight">Drop Excel file here</p>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-2">or <span className="text-[#4ECDC4]">browse files</span></p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className={`w-full mt-8 h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 ${selectedFile && !isUploading ? 'bg-[#4ECDC4] text-[#0F1923] shadow-xl shadow-[#4ECDC4]/20 hover:scale-[1.02] active:scale-[0.98]' :
                      'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                    }`}
                >
                  {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" />Parsing...</> : <><Upload className="w-4 h-4" />Process Dataset</>}
                </button>
              </div>

              {/* ── System Backup ────────────────────────────── */}
              <div className="glass-card !p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#4ECDC4]/10 blur-[60px] -mr-16 -mt-16 group-hover:bg-[#4ECDC4]/20 transition-all duration-700" />
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#4ECDC4]/10 rounded-2xl flex items-center justify-center border border-[#4ECDC4]/10">
                    <DatabaseZap className="w-6 h-6 text-[#4ECDC4]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Maintenance</h3>
                    <p className="text-lg font-black text-white tracking-tight mt-1">System Backup</p>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-wide leading-relaxed">
                  Triggers an instant database JSON dump and collection Excel report. The resulting ZIP archive is securely emailed to the company backup address.
                </p>
                <div className="flex flex-col gap-3 mt-6">
                  <button
                    onClick={async () => {
                      setIsBackupLoading(true);
                      try {
                        const res = await api.post('/admin/backup/email-trigger');
                        if (res.success) {
                          toast.success('Backup email triggered successfully!');
                        }
                      } catch (err) {
                        toast.error(err.message || 'Failed to trigger backup');
                      } finally {
                        setIsBackupLoading(false);
                      }
                    }}
                    disabled={isBackupLoading || isDownloadingBackup}
                    className="w-full h-14 rounded-2xl bg-[#0F1923] text-white border border-white/5 font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/5 hover:border-white/20 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isBackupLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />Sending Backup...</>
                    ) : (
                      <><Share className="w-4 h-4 text-[#4ECDC4]" />Email Backup Now</>
                    )}
                  </button>

                  <button
                    onClick={async () => {
                      setIsDownloadingBackup(true);
                      try {
                        const response = await api.get('/admin/backup/download-latest', {
                          responseType: 'blob'
                        });
                        const blob = new Blob([response], { type: 'application/zip' });
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `crm_backup_${new Date().toISOString().slice(0, 10)}.zip`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                        toast.success('Latest backup downloaded successfully!');
                      } catch (err) {
                        toast.error('Download failed or no backups found on server');
                      } finally {
                        setIsDownloadingBackup(false);
                      }
                    }}
                    disabled={isBackupLoading || isDownloadingBackup}
                    className="w-full h-14 rounded-2xl bg-[#0F1923] text-white border border-white/5 font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/5 hover:border-white/20 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isDownloadingBackup ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />Downloading...</>
                    ) : (
                      <><Download className="w-4 h-4 text-[#4ECDC4]" />Download Latest Backup</>
                    )}
                  </button>
                </div>
              </div>

              {/* ── Danger Zone: Bulk Delete ─────────────────── */}
              <div className="glass-card !p-6 border border-red-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-[40px] -mr-8 -mt-8" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/10">
                    <DatabaseZap className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Danger Zone</p>
                    <p className="text-sm font-black text-white tracking-tight mt-0.5">Reset Dataset</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setShowClearModal('pending'); setClearConfirmText(''); }}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                  >
                    <Trash2 size={14} />
                    Clear Pending
                  </button>
                  <button
                    onClick={() => { setShowClearModal('all'); setClearConfirmText(''); }}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 size={14} />
                    Clear All Data
                  </button>
                </div>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-3 text-center">
                  Pending Only = keeps collection history · All Data = full reset
                </p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <SummaryCard label="Today Collected" value={formatCurrency(todayTotal)} icon={<IndianRupee size={18} />} color="text-green-400" bg="bg-green-400/10" />
                <SummaryCard label="Daily Target" value={formatCurrency(todayTarget)} icon={<Target size={18} />} color="text-[#4ECDC4]" bg="bg-[#4ECDC4]/10" />
              </div>
            </div>

            {/* ── Right Column: Performance ───────────────────── */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Force Performance</h3>
                  <p className="text-[10px] font-bold text-white/20 mt-1 uppercase">Executive Efficiency Tracking</p>
                </div>
                <TrendingUp size={16} className="text-[#4ECDC4]/30" />
              </div>

              <div className="space-y-4">
                {teamPerformance && teamPerformance.filter(exec => exec.customers > 0).map((exec, i) => {
                  const collected = exec.collected || 0;
                  const target = exec.target || 0;
                  const pct = target > 0 ? Math.round((collected / target) * 100) : 0;
                  return (
                    <div key={i} className="glass-card !p-6 space-y-5 border-white/5 hover:border-white/10 transition-all group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#4ECDC4]/10 flex items-center justify-center text-[#4ECDC4] text-base font-black border border-[#4ECDC4]/10 group-hover:scale-110 transition-transform">
                            {exec.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-[16px] font-black text-white tracking-tight">{exec.name}</p>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">{exec.customers} active leads</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[18px] font-black text-[#4ECDC4] tracking-tighter">{formatCurrency(collected)}</p>
                          <p className="text-[9px] font-black text-white/10 uppercase tracking-widest mt-1">Goal: {formatCurrency(target)}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-1.5 bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #4ECDC4 0%, #60A5FA 100%)', boxShadow: '0 0 15px rgba(78, 205, 196, 0.3)' }} />
                        </div>
                        <div className="flex justify-between items-center"><span className="text-[9px] font-black text-white/10 uppercase tracking-widest">Achievement Level</span><span className="text-[11px] font-black text-[#4ECDC4]">{pct}%</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="team"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Operational Staff</h3>
                <p className="text-[10px] font-bold text-white/20 mt-1 uppercase">Manage access for your collection force</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const url = window.location.origin;
                    const text = `Hi! Here is your access link for EVA CRM: ${url}\nLog in with the credentials provided by the admin.`;
                    if (navigator.share) {
                      navigator.share({ title: 'EVA CRM Access', text, url });
                    } else {
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-white/5 text-white/60 border border-white/10 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  <Share size={16} />
                  Share Link
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {executives.map((exec) => (
                <div key={exec.id} className="glass-card !p-6 border-white/5 flex flex-col justify-between group hover:border-white/20 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-[#4ECDC4] border border-white/5 group-hover:bg-[#4ECDC4]/10 transition-all">
                        <UserIcon size={24} />
                      </div>
                      <div>
                        <p className="text-[16px] font-black text-white tracking-tight">{exec.fullName}</p>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">@{exec.username}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <span className="text-[9px] font-black text-[#4ECDC4] uppercase tracking-[0.3em]">Executive Role</span>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${exec.fullName} from the team?`)) {
                          deleteExecutive(exec.id);
                        }
                      }}
                      className="p-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ── Clear Data Confirmation Modal ────────────────── */}
      <AnimatePresence>
        {showClearModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowClearModal(null); setClearConfirmText(''); }}
              className="absolute inset-0 bg-[#0F1923]/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md glass-card !p-10 relative z-10 border-red-500/20"
            >
              <button onClick={() => { setShowClearModal(null); setClearConfirmText(''); }} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors">
                <X size={20} />
              </button>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 mx-auto mb-6 border border-red-500/20">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tighter">
                  {showClearModal === 'all' ? 'Clear All Data?' : 'Clear Pending Data?'}
                </h3>
                <p className="text-[11px] font-black text-white/30 uppercase tracking-widest mt-3">
                  {showClearModal === 'all'
                    ? 'Permanently deletes ALL customers and collection history'
                    : 'Deletes PENDING customers only — collected history is kept'}
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-[11px] font-black text-white/40 uppercase tracking-widest text-center">
                  Type <span className="text-red-400 font-black">{showClearModal === 'all' ? 'DELETE' : 'CLEAR'}</span> to confirm
                </p>
                <input
                  type="text"
                  placeholder={showClearModal === 'all' ? 'DELETE' : 'CLEAR'}
                  value={clearConfirmText}
                  onChange={(e) => setClearConfirmText(e.target.value.toUpperCase())}
                  className="w-full bg-red-500/5 border border-red-500/20 rounded-xl py-4 px-5 text-sm font-bold text-white outline-none focus:border-red-500/50 transition-all text-center tracking-[0.3em]"
                />
                <button
                  onClick={() => handleClearData(showClearModal)}
                  disabled={
                    isClearing ||
                    (showClearModal === 'all' && clearConfirmText !== 'DELETE') ||
                    (showClearModal === 'pending' && clearConfirmText !== 'CLEAR')
                  }
                  className="w-full h-14 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] transition-all mt-2 disabled:opacity-30 disabled:cursor-not-allowed bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {isClearing
                    ? <><Loader2 className="w-5 h-5 animate-spin" />Deleting...</>
                    : <><Trash2 className="w-4 h-4" />{showClearModal === 'all' ? 'Delete Everything' : 'Clear Pending'}</>
                  }
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryCard({ label, value, icon, color, bg }) {
  return (
    <div className="glass-card !p-6 flex flex-col gap-5 border-white/5 group hover:border-white/10 transition-all">
      <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 border border-white/5`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-xl font-black text-white tracking-tighter">{value}</p>
      </div>
    </div>
  );
}

