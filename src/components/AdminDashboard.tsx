import React, { useState, useEffect } from 'react';
import { 
  getFirestore, doc, setDoc, onSnapshot, collection, 
  query, where, updateDoc, deleteDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut 
} from 'firebase/auth';
import { AnimatePresence, motion } from 'framer-motion';
import { db, auth } from '../lib/firebase';
import { 
  Settings, DollarSign, Bell, CheckCircle, Trash2, 
  Send, LogOut, ShieldCheck, AlertTriangle, Info,
  TrendingUp, Activity, Clock, Globe, Users,
  BarChart3, LayoutDashboard, Search, Database, Zap
} from 'lucide-react';
import { cn, handleFirestoreError } from '../lib/utils';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { format } from 'date-fns';

const ADMIN_EMAIL = 'YSeddig15@gmail.com';

const MOCK_ANALYTICS = [
  { date: '2026-04-16', users: 120, reports: 45, energy: 3200 },
  { date: '2026-04-17', users: 145, reports: 52, energy: 3500 },
  { date: '2026-04-18', users: 190, reports: 68, energy: 4100 },
  { date: '2026-04-19', users: 210, reports: 75, energy: 4800 },
  { date: '2026-04-20', users: 250, reports: 90, energy: 5200 },
  { date: '2026-04-21', users: 310, reports: 110, energy: 6100 },
  { date: '2026-04-22', users: 380, reports: 125, energy: 7400 },
];

const StatItem = ({ label, value, icon, color = "text-blue-500" }: { label: string, value: string | number, icon: React.ReactNode, color?: string }) => (
  <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
    <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center", color)}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] text-white/30 uppercase font-black tracking-wider leading-none mb-1">{label}</p>
      <p className="text-lg font-black leading-none">{value}</p>
    </div>
  </div>
);

export const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'rates' | 'approval' | 'notifications' | 'analytics' | 'users'>('analytics');
  const [rates, setRates] = useState({ 
    usd: 0, usdChange: 0, 
    sar: 0, sarChange: 0, 
    aed: 0, aedChange: 0, 
    eur: 0, eurChange: 0 
  });
  const [dbRates, setDbRates] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [notif, setNotif] = useState({ title: '', body: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<any>(null);
  const [systemLogs, setSystemLogs] = useState<string[]>(["System initialized", "Monitoring network..."]);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    action: () => void;
    type: 'danger' | 'info' | 'warning';
  }>({
    show: false,
    title: '',
    message: '',
    action: () => {},
    type: 'info'
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return;

    const ratesUnsub = onSnapshot(doc(db, 'settings', 'rates'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const incomingRates = {
          usd: data.usd || 0,
          usdChange: data.usdChange || 0,
          sar: data.sar || 0,
          sarChange: data.sarChange || 0,
          aed: data.aed || 0,
          aedChange: data.aedChange || 0,
          eur: data.eur || 0,
          eurChange: data.eurChange || 0
        };
        setRates(incomingRates);
        setDbRates(incomingRates);
        setLastUpdate(data.updatedAt);
      }
    }, (err) => handleFirestoreError(err, 'get', 'settings/rates'));

    const reportsQuery = query(collection(db, 'reports'), where('approved', '==', false));
    const reportsUnsub = onSnapshot(reportsQuery, (snap) => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, 'list', 'reports'));

    const usersUnsub = onSnapshot(collection(db, 'users'), (snap) => {
      setAppUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, 'list', 'users'));

    return () => {
      ratesUnsub();
      reportsUnsub();
      usersUnsub();
    };
  }, [user]);

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        console.error('Login error:', error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleUpdateRates = async () => {
    setConfirmModal({
      show: true,
      title: 'تأكيد تحديث العملات',
      message: `هل أنت متأكد من بث الأسعار الجديدة؟ (USD: ${rates.usd})`,
      type: 'warning',
      action: async () => {
        setIsUpdating(true);
        try {
          const finalRates = { ...rates };
          
          if (dbRates) {
            ['usd', 'sar', 'aed', 'eur'].forEach(key => {
              const oldVal = dbRates[key];
              const newVal = (rates as any)[key];
              if (oldVal > 0 && newVal !== oldVal) {
                const change = ((newVal - oldVal) / oldVal) * 100;
                (finalRates as any)[`${key}Change`] = parseFloat(change.toFixed(2));
              }
            });
          }

          await setDoc(doc(db, 'settings', 'rates'), {
            ...finalRates,
            updatedAt: serverTimestamp(),
            updatedBy: user?.email
          }, { merge: true });
          setSystemLogs(prev => [`Rates updated: US$ ${rates.usd}`, ...prev.slice(0, 5)]);
        } catch (e) {
          console.error(e);
        }
        setIsUpdating(false);
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const approveReport = async (id: string, name: string) => {
    setConfirmModal({
      show: true,
      title: 'تأكيد الموافقة',
      message: `هل أنت متأكد من صحة التقرير لـ ${name}؟`,
      type: 'info',
      action: async () => {
        try {
          await updateDoc(doc(db, 'reports', id), { approved: true });
          setSystemLogs(prev => ["Report approved", ...prev.slice(0, 5)]);
        } catch (e) { console.error(e); }
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const deleteReport = async (id: string, name: string) => {
    setConfirmModal({
      show: true,
      title: 'تأكيد الحذف',
      message: `هل تريد حقاً حذف تقرير ${name}؟ لا يمكن التراجع عن هذا الإجراء.`,
      type: 'danger',
      action: async () => {
        try {
          await deleteDoc(doc(db, 'reports', id));
          setSystemLogs(prev => ["Report deleted", ...prev.slice(0, 5)]);
        } catch (e) { console.error(e); }
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const broadcastNotif = async () => {
    if (!notif.title || !notif.body) return;
    setConfirmModal({
      show: true,
      title: 'تأكيد البث المباشر',
      message: 'سيتم إرسال هذا الإشعار لجميع المستخدمين فوراً. هل تود المتابعة؟',
      type: 'warning',
      action: async () => {
        setIsUpdating(true);
        try {
          await addDoc(collection(db, 'notifications'), {
            ...notif,
            sentAt: serverTimestamp(),
            sentBy: user?.email
          });
          setNotif({ title: '', body: '' });
          setSystemLogs(prev => ["Notification sent", ...prev.slice(0, 5)]);
        } catch (e) { console.error(e); }
        setIsUpdating(false);
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
        <div className="bg-white/5 border border-white/10 p-10 rounded-[48px] max-w-sm w-full text-center backdrop-blur-3xl shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <ShieldCheck size={32} className="text-blue-500" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3 tracking-tighter">ADMIN PORTAL</h1>
          <p className="text-white/40 text-sm mb-10 leading-relaxed font-medium">Restricted access. Identity verification required to enter the command center.</p>
          <button 
            onClick={login} 
            disabled={isLoggingIn}
            className={cn(
              "w-full py-5 text-black font-black rounded-3xl flex items-center justify-center gap-3 transition-all",
              isLoggingIn ? "bg-white/50 cursor-not-allowed" : "bg-white hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            {isLoggingIn ? 'Authenticating...' : 'Authenticate'}
          </button>
        </div>
      </div>
    );
  }

  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
        <div className="bg-white/5 border border-white/10 p-10 rounded-[48px] max-w-sm w-full text-center backdrop-blur-3xl shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">UNAUTHORIZED</h1>
          <p className="text-white/40 text-sm mb-6 leading-relaxed font-medium">This identifier is not registered for root access.</p>
          <div className="py-3 px-4 bg-red-500/10 border border-red-500/10 rounded-2xl mb-10 overflow-hidden">
             <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-1 opacity-50">NODE_ID</p>
             <p className="text-xs font-mono text-white/50 truncate">{user.email}</p>
          </div>
          <button onClick={() => signOut(auth)} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/50 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
            <LogOut size={14} /> TERMINATE & REHOOK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col md:flex-row font-sans overflow-y-auto md:overflow-hidden">
      {/* Sidebar - Technical Rail (Responsive) */}
      <div className={cn(
        "w-full md:w-80 md:h-full bg-white/[0.02] border-b md:border-b-0 md:border-r border-white/5 flex flex-col backdrop-blur-xl relative z-20 flex-shrink-0",
        "p-4 md:p-8"
      )}>
        <div className="mb-6 md:mb-14 flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white text-black rounded-lg md:rounded-2xl flex items-center justify-center">
               <Settings size={18} className="md:w-[22px] md:h-[22px]" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-tighter leading-none mb-1">CONTROL</h1>
              <p className="text-[8px] md:text-[10px] text-white/30 uppercase tracking-[0.34em] font-black italic">Core v2.4</p>
            </div>
          </div>
          <button onClick={() => signOut(auth)} className="md:hidden p-2 bg-white/5 rounded-lg text-white/40">
             <LogOut size={18} />
          </button>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:block flex-1 space-y-3">
          {[
            { id: 'analytics', label: 'Telemetry Dash', sub: 'Real-time Metrics', icon: <LayoutDashboard size={18} /> },
            { id: 'rates', label: 'Financial Matrix', sub: 'Global Exchange', icon: <DollarSign size={18} /> },
            { id: 'approval', label: 'Validations', sub: 'Crowdsource Link', icon: <CheckCircle size={18} />, badge: reports.length },
            { id: 'users', label: 'Identity Grid', sub: 'User Management', icon: <Users size={18} /> },
            { id: 'notifications', label: 'Broadcast Uplink', sub: 'Push System', icon: <Bell size={18} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full group relative flex items-center p-4 rounded-3xl transition-all duration-300",
                activeTab === item.id 
                  ? "bg-white text-black shadow-2xl" 
                  : "hover:bg-white/[0.03] text-white/40"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors border",
                  activeTab === item.id ? "bg-black/5 border-black/10" : "bg-white/5 group-hover:bg-white/10 border-white/5"
                )}>
                  {item.icon}
                </div>
                <div className="text-left min-w-0">
                  <p className="font-black text-sm leading-none mb-1 truncate">{item.label}</p>
                  <p className={cn("text-[8px] uppercase font-bold tracking-[0.15em] truncate", activeTab === item.id ? "text-black/40" : "text-white/20")}>
                    {item.sub}
                  </p>
                </div>
              </div>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-red-500 text-white text-[10px] font-black rounded-lg shadow-lg flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Console View (Hidden on Mobile) */}
        <div className="hidden md:block mt-8 bg-black/40 border border-white/5 p-4 rounded-2xl font-mono text-[9px] space-y-1 h-32 overflow-hidden shadow-inner">
          <p className="text-blue-500 mb-2 border-b border-white/5 pb-1 flex items-center gap-2 font-black">
             <Activity size={10} /> CONSOLE_OUTPUT
          </p>
          {systemLogs.map((log, i) => (
             <p key={i} className="text-white/20 truncate">
               <span className="text-white/10 mr-2">[{new Date().toLocaleTimeString('en-GB')}]</span>
               {log}
             </p>
          ))}
        </div>

        {/* Mobile Nav Bar */}
        <div className="md:hidden flex gap-2 overflow-x-auto py-2">
           {[
            { id: 'analytics', label: 'Stats', icon: <LayoutDashboard size={16} /> },
            { id: 'rates', label: 'Rates', icon: <DollarSign size={16} /> },
            { id: 'approval', label: 'Vetting', icon: <CheckCircle size={16} />, badge: reports.length },
            { id: 'users', label: 'Users', icon: <Users size={16} /> },
            { id: 'notifications', label: 'Broadcast', icon: <Bell size={16} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                activeTab === item.id ? "bg-white text-black shadow-lg" : "bg-white/5 text-white/40"
              )}
            >
              {item.icon}
              {item.label}
              {item.badge && item.badge > 0 && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* User Profile Info (Hidden on Mobile) */}
        <div className="hidden md:block mt-8 pt-8 border-t border-white/5">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
                 <img 
                    src={user.photoURL || ''} 
                    alt="" 
                    onError={(e) => e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.displayName}&background=0D8ABC&color=fff`} 
                 />
              </div>
              <div className="min-w-0">
                 <p className="text-sm font-black truncate">{user.displayName}</p>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-[9px] text-white/30 font-black uppercase tracking-wider">ROOT_AUTH</p>
                 </div>
              </div>
           </div>
           <button onClick={() => signOut(auth)} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/40 flex items-center justify-center gap-2 hover:bg-red-500/10 hover:text-red-400 group transition-all">
              <LogOut size={12} className="group-hover:translate-x-0.5 transition-transform" /> TERMINATE_SESSION
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#0a0a0a] flex flex-col relative md:h-full overflow-hidden">
        {/* Top Header Bar */}
        <div className="border-b border-white/5 p-4 md:p-6 bg-white/[0.01] backdrop-blur-md flex items-center justify-between z-10 overflow-x-auto flex-shrink-0">
           <div className="flex gap-3 md:gap-4 flex-shrink-0">
              <StatItem label="Vetting" value={reports.length} icon={<TrendingUp size={14} />} color="text-orange-400" />
              <StatItem label="Sync" value="99.9%" icon={<Globe size={14} />} color="text-emerald-400" />
           </div>
           <div className="hidden sm:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-[8px] md:text-[10px] font-bold text-white/30 border border-white/5 uppercase tracking-tighter flex-shrink-0 whitespace-nowrap">
              <Clock size={12} />
              DISPATCH_CLK: {new Date().toLocaleTimeString()}
           </div>
        </div>

        <div className="flex-1 md:overflow-y-auto p-6 md:p-12 relative overflow-x-hidden h-auto md:h-full">
          <AnimatePresence mode="wait">
            {activeTab === 'analytics' && (
              <motion.section 
                key="analytics" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto space-y-10"
              >
                 <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-[9px] font-black rounded uppercase tracking-widest border border-blue-500/20">Telemetry</span>
                            <h2 className="text-5xl font-black tracking-tighter italic uppercase">Platform Metrics</h2>
                        </div>
                        <p className="text-white/40 text-sm font-medium italic">High-frequency usage data and system throughput visualization.</p>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                       {(['7d', '30d', '90d'] as const).map((r) => (
                          <button
                            key={r}
                            onClick={() => setTimeRange(r)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                              timeRange === r ? "bg-white text-black shadow-lg" : "text-white/30 hover:text-white"
                            )}
                          >
                             {r}
                          </button>
                       ))}
                    </div>
                 </header>

                 {/* KPI Summary Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                       { label: 'Total Node Discovery', value: '3,842', icon: <Users size={20} />, trend: '+12.4%', color: 'text-blue-500' },
                       { label: 'Validations Processed', value: '18,290', icon: <CheckCircle size={20} />, trend: '+8.1%', color: 'text-emerald-500' },
                       { label: 'Energy Capacity (kW)', value: '1,420', icon: <Zap size={20} />, trend: '+15.2%', color: 'text-yellow-500' }
                    ].map((kpi, i) => (
                       <div key={i} className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/5 p-8 rounded-[40px] relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(59,130,246,0.05),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all">
                          <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[40px] rounded-full opacity-10 group-hover:opacity-20 transition-opacity", kpi.color.replace('text-', 'bg-'))} />
                          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                          <div className="flex justify-between items-start relative z-10">
                             <div className={cn("w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner", kpi.color)}>
                                {kpi.icon}
                             </div>
                             <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">{kpi.trend}</span>
                          </div>
                          <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1 relative z-10">{kpi.label}</p>
                          <h4 className="text-3xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 relative z-10">{kpi.value}</h4>
                       </div>
                    ))}
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Growth Chart */}
                    <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/5 p-8 rounded-[48px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden group">
                       <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                       <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.3em] mb-8 flex items-center gap-2 relative z-10">
                          <TrendingUp size={14} className="text-blue-500" /> User Growth Velocity
                       </h3>
                       <div className="h-64 w-full relative z-10">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={MOCK_ANALYTICS}>
                                <defs>
                                   <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                   </linearGradient>
                                </defs>
                                <XAxis 
                                  dataKey="date" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: '#ffffff30', fontSize: 10 }}
                                  tickFormatter={(val) => format(new Date(val), 'MMM d')}
                                />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#161616', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '12px' }}
                                  itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
                             </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    {/* Interaction Chart */}
                    <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/5 p-8 rounded-[48px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden group">
                       <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                       <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.3em] mb-8 flex items-center gap-2 relative z-10">
                          <BarChart3 size={14} className="text-emerald-500" /> Interaction Density
                       </h3>
                       <div className="h-64 w-full relative z-10">
                          <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={MOCK_ANALYTICS}>
                                <XAxis 
                                  dataKey="date" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: '#ffffff30', fontSize: 10 }}
                                  tickFormatter={(val) => format(new Date(val), 'MMM d')}
                                />
                                <Tooltip 
                                  cursor={{fill: '#ffffff05'}}
                                  contentStyle={{ backgroundColor: 'rgba(22,22,22,0.8)', backdropFilter: 'blur(10px)', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '12px' }}
                                />
                                <Bar dataKey="reports" fill="#10b981" radius={[6, 6, 0, 0]} />
                             </BarChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    {/* Solar Planning Metrics */}
                    <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/5 p-8 rounded-[48px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] lg:col-span-2 relative overflow-hidden group">
                       <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                       <div className="flex justify-between items-center mb-10 relative z-10">
                          <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2">
                             <Database size={14} className="text-orange-500" /> Computing Output (Daily Wh)
                          </h3>
                          <div className="flex gap-4">
                             <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                <span className="text-[10px] text-white/30 uppercase font-black">Design Load</span>
                             </div>
                          </div>
                       </div>
                       <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                             <LineChart data={MOCK_ANALYTICS}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis 
                                  dataKey="date" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: '#ffffff30', fontSize: 10 }}
                                  tickFormatter={(val) => format(new Date(val), 'MMM d')}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff30', fontSize: 10 }} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#161616', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '12px' }}
                                />
                                <Line type="stepAfter" dataKey="energy" stroke="#f59e0b" strokeWidth={4} dot={{ r: 6, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                             </LineChart>
                          </ResponsiveContainer>
                       </div>
                    </div>
                 </div>
              </motion.section>
            )}

            {activeTab === 'users' && (
              <motion.section 
                key="users" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto space-y-10"
              >
                 <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black rounded uppercase tracking-widest border border-emerald-500/20">Identity</span>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter italic uppercase">Identity Grid</h2>
                        </div>
                        <p className="text-white/40 text-sm font-medium italic">Active node management and permission profiling.</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 order-2 md:order-1">
                           {(['all', 'admin', 'operator'] as const).map((r) => (
                              <button
                                key={r}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                  r === 'all' ? "bg-white text-black shadow-lg" : "text-white/30 hover:text-white"
                                )}
                              >
                                 {r}
                              </button>
                           ))}
                        </div>
                        <div className="relative w-full md:w-80 group order-1 md:order-2">
                           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" size={18} />
                           <input 
                             type="text"
                             placeholder="Filter nodes..."
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                             className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 outline-none focus:border-blue-500/30 transition-all font-mono text-sm uppercase italic"
                           />
                        </div>
                    </div>
                 </header>

                 <div className="bg-[#0d0d0d] border border-white/5 rounded-[24px] md:rounded-[48px] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse min-w-[800px]">
                          <thead>
                             <tr className="border-b border-white/5">
                                <th className="p-4 md:p-8 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Operator Identity</th>
                                <th className="p-4 md:p-8 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Network Region</th>
                                <th className="p-4 md:p-8 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Heartbeat State</th>
                                <th className="p-4 md:p-8 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Permissions</th>
                                <th className="p-4 md:p-8 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Actions</th>
                             </tr>
                          </thead>
                          <tbody>
                             {(appUsers.length > 0 ? appUsers : [
                               { id: '1', displayName: 'Yassin Seddig', email: 'YSeddig15@gmail.com', photoURL: '', lastLogin: '2 mins ago', region: 'KRT-HUB-01', role: 'ROOT_ADMIN' },
                               { id: '2', displayName: 'User_44x', email: 'mod@adad.sd', photoURL: '', lastLogin: '1 hr ago', region: 'PORT-NODE-B', role: 'VETTING_OPS' },
                               { id: '3', displayName: 'Sarah Khair', email: 'sarah.k@gmail.com', photoURL: '', lastLogin: '10 min ago', region: 'ELD-LINK-A', role: 'VETTING_OPS' },
                               { id: '4', displayName: 'Ahmed Ali', email: 'ahmed@gmail.com', photoURL: '', lastLogin: 'Offline', region: 'KRT-HUB-02', role: 'VETTING_OPS' },
                             ]).filter(u => 
                               u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                               u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                             ).map((userNode) => (
                                <tr key={userNode.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                                   <td className="p-4 md:p-8">
                                      <div className="flex items-center gap-4">
                                         <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden flex-shrink-0">
                                            <img 
                                              src={userNode.photoURL || `https://ui-avatars.com/api/?name=${userNode.displayName}&background=0D8ABC&color=fff`} 
                                              alt="" 
                                              className="w-full h-full object-cover"
                                            />
                                         </div>
                                         <div className="min-w-0">
                                            <p className="font-black text-white tracking-tight italic uppercase truncate max-w-[150px] md:max-w-[200px]">{userNode.displayName}</p>
                                            <p className="text-[10px] text-white/20 font-mono lowercase truncate max-w-[150px] md:max-w-[200px]">{userNode.email}</p>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="p-4 md:p-8">
                                      <div className="flex items-center gap-2">
                                         <Globe size={12} className="text-blue-500" />
                                         <p className="text-[10px] text-white/60 font-mono uppercase tracking-[0.1em] truncate">{userNode.region || 'DEFAULT-NODE'}</p>
                                      </div>
                                   </td>
                                   <td className="p-4 md:p-8">
                                      <div className="flex flex-col gap-1">
                                         <div className="flex items-center gap-2">
                                            <div className={cn(
                                               "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]",
                                               userNode.lastLogin === 'Offline' ? "bg-white/10" : "bg-emerald-500 animate-pulse"
                                            )} />
                                            <span className={cn(
                                               "text-[10px] font-black uppercase tracking-widest",
                                               userNode.lastLogin === 'Offline' ? "text-white/20" : "text-white"
                                            )}>{userNode.lastLogin === 'Offline' ? 'LINK_TERMINATED' : 'UPLINK_ESTABLISHED'}</span>
                                         </div>
                                         <p className="text-[8px] text-white/20 font-black uppercase tracking-wider">{userNode.lastLogin}</p>
                                      </div>
                                   </td>
                                   <td className="p-4 md:p-8">
                                      <span className={cn(
                                         "px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border",
                                         userNode.role === 'ROOT_ADMIN' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                      )}>
                                         {userNode.role || 'STANDARD_USR'}
                                      </span>
                                   </td>
                                   <td className="p-4 md:p-8 relative">
                                      <div className="flex gap-2">
                                         <button className="w-10 h-10 bg-white/5 border border-white/5 rounded-xl text-white/20 hover:bg-white hover:text-black transition-all flex items-center justify-center">
                                            <Settings size={14} />
                                         </button>
                                         <button className="w-10 h-10 bg-white/5 border border-white/5 rounded-xl text-white/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                                            <ShieldCheck size={14} />
                                         </button>
                                      </div>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </motion.section>
            )}

            {activeTab === 'rates' && (
              <motion.section 
                key="rates" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-8 md:space-y-16"
              >
                 <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <div className="flex items-center gap-2 md:gap-3 mb-2">
                           <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-[8px] md:text-[9px] font-black rounded uppercase tracking-widest border border-blue-500/20">Matrix</span>
                           <h2 className="text-3xl md:text-5xl font-black tracking-tighter">EXCHANGE</h2>
                        </div>
                        <p className="text-white/40 font-medium italic text-xs md:text-sm max-w-sm">Override parallel market feeds for the Sudanese Pound (SDG).</p>
                    </div>
                    {lastUpdate && (
                      <div className="text-right">
                        <p className="text-[8px] text-white/20 font-black tracking-widest uppercase">Last Sync</p>
                        <p className="text-[10px] text-blue-400 font-black">{lastUpdate.toDate().toLocaleString()}</p>
                      </div>
                    )}
                 </header>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {([
                      { id: 'usd', ar: 'دولار أمريكي' },
                      { id: 'sar', ar: 'ريال سعودي' },
                      { id: 'aed', ar: 'درهم إماراتي' },
                      { id: 'eur', ar: 'يورو أوروبي' }
                    ]).map((curr) => (
                      <div key={curr.id} className="relative group">
                        <div className="absolute inset-0 bg-blue-500/5 rounded-[32px] md:rounded-[48px] blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <div className="relative bg-[#0d0d0d] border border-white/5 p-6 md:p-8 rounded-[32px] md:rounded-[48px] focus-within:border-blue-500/30 transition-all shadow-2xl">
                          <div className="flex justify-between items-center mb-6 md:mb-10">
                             <div className="flex flex-col">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 flex items-center justify-center rounded-xl md:rounded-2xl text-blue-500 font-black text-xs border border-white/5 mb-2">
                                   {curr.id.toUpperCase()}
                                </div>
                                <span className="text-[10px] font-black text-white/40">{curr.ar}</span>
                             </div>
                             <div className="text-right">
                                <p className="text-[8px] text-white/20 font-black tracking-[0.2em] uppercase">Auto Change %</p>
                                <div className={cn(
                                  "px-2 py-1 text-xs font-black text-right rounded-lg bg-white/5 border border-white/10 min-w-[60px]",
                                  (() => {
                                    const oldVal = dbRates?.[curr.id] || 0;
                                    const newVal = (rates as any)[curr.id];
                                    if (oldVal === 0) return "text-emerald-400";
                                    const diff = ((newVal - oldVal) / oldVal) * 100;
                                    return diff >= 0 ? "text-emerald-400" : "text-rose-400";
                                  })()
                                )}>
                                   {(() => {
                                      const oldVal = dbRates?.[curr.id] || 0;
                                      const newVal = (rates as any)[curr.id];
                                      if (oldVal === 0 || newVal === oldVal) return "0.0%";
                                      const diff = ((newVal - oldVal) / oldVal) * 100;
                                      return `${diff > 0 ? '+' : ''}${diff.toFixed(2)}%`;
                                   })()}
                                </div>
                             </div>
                          </div>
                          <label className="text-[8px] md:text-[10px] uppercase font-black text-white/30 tracking-widest block mb-2 md:mb-4">PRICE POINT</label>
                          <div className="flex items-end gap-2">
                            <input 
                              type="number"
                              value={isNaN((rates as any)[curr.id]) ? "" : (rates as any)[curr.id]}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setRates({ ...rates, [curr.id]: isNaN(val) ? 0 : val });
                              }}
                              className="bg-transparent border-none outline-none text-4xl md:text-6xl font-black w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-xs md:text-lg font-black text-white/10 mb-2">SDG</span>
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>

                 <button 
                  onClick={handleUpdateRates}
                  disabled={isUpdating}
                  className="w-full bg-white relative overflow-hidden group h-20 md:h-24 rounded-[24px] md:rounded-[40px] flex items-center justify-center shadow-2xl transition-transform active:scale-[0.98] disabled:opacity-50"
                 >
                   <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity" />
                   <div className="flex items-center gap-3 md:gap-5 relative z-10">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-black text-white rounded-xl md:rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shrink-0">
                         <Send size={18} className="md:w-[20px] md:h-[20px]" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-black font-black text-lg md:text-2xl leading-none mb-1 tracking-tighter uppercase italic">INITIATE BROADCAST</p>
                        <p className="text-black/40 text-[7px] md:text-[9px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] leading-none truncate">Release sync to all active nodes</p>
                      </div>
                   </div>
                 </button>
              </motion.section>
            )}

            {activeTab === 'approval' && (
              <motion.section 
                key="approval" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="max-w-5xl mx-auto space-y-10 md:space-y-16"
              >
                 <header>
                    <div className="flex items-center gap-2 md:gap-3 mb-2">
                        <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-[8px] md:text-[9px] font-black rounded uppercase tracking-widest border border-orange-500/20">Vetting</span>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter italic uppercase underline decoration-orange-500/50 underline-offset-8">Vetting Queue</h2>
                    </div>
                 </header>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    {reports.length === 0 && (
                      <div className="col-span-full bg-white/[0.01] border border-dashed border-white/5 rounded-[40px] md:rounded-[64px] p-24 md:p-48 text-center flex flex-col items-center justify-center">
                         <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-[24px] md:rounded-[32px] flex items-center justify-center mb-6 md:mb-8 border border-white/5">
                            <CheckCircle size={32} className="md:w-10 md:h-10 text-emerald-500/20" />
                         </div>
                         <h3 className="text-lg md:text-2xl font-black mb-2 tracking-tighter italic">QUEUE_MANIFEST_EMPTY</h3>
                         <p className="text-white/30 text-xs md:text-sm max-w-xs font-medium leading-relaxed">No anomalies detected in current vetting cycle.</p>
                      </div>
                    )}
                    
                    {reports.map((report, idx) => (
                      <motion.div 
                        key={report.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1, transition: { delay: idx * 0.05 } }}
                        className="bg-[#0d0d0d] border border-white/5 rounded-[32px] md:rounded-[48px] p-6 md:p-10 flex flex-col justify-between hover:bg-white/[0.02] shadow-2xl transition-all group lg:min-h-[320px]"
                      >
                         <div className="flex justify-between items-start mb-8 md:mb-12">
                            <div className="flex items-start gap-4 md:gap-6">
                               <div className={cn(
                                  "w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center text-lg font-black uppercase text-black italic border shrink-0",
                                  report.status === 'available' ? 'bg-emerald-400 border-emerald-500/20' : report.status === 'busy' ? 'bg-orange-400 border-orange-500/20' : 'bg-rose-400 border-rose-500/20'
                               )}>
                                  {report.status.charAt(0)}
                               </div>
                               <div className="min-w-0">
                                  <h4 className="font-black text-xl md:text-3xl tracking-tighter leading-none mb-2 truncate italic">{report.locationName}</h4>
                                  <div className="flex items-center gap-2 md:gap-3">
                                      <span className="text-[8px] md:text-[10px] text-white/30 uppercase font-black tracking-widest">{report.type}</span>
                                      <span className="w-1 h-1 bg-blue-500/20 rounded-full" />
                                      <span className="text-[8px] md:text-[10px] text-blue-400 font-black uppercase italic tracking-tighter">{report.status}</span>
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className="bg-black/40 border border-white/5 rounded-2xl md:rounded-[32px] p-4 md:p-8 mb-6 md:mb-10 italic text-white/40 text-xs md:text-sm font-medium leading-relaxed md:leading-[1.8]">
                            &ldquo;Automatic telemetry verification pending. Confirm global release of status: {report.status}.&rdquo;
                         </div>

                         <div className="flex gap-3 md:gap-4">
                            <button 
                              onClick={() => approveReport(report.id, report.locationName)}
                              className="flex-1 h-14 md:h-18 bg-white/5 border border-white/5 text-emerald-400 rounded-2xl md:rounded-[28px] flex items-center justify-center gap-2 md:gap-3 font-black uppercase text-[10px] md:text-xs tracking-tighter hover:bg-emerald-500 hover:text-black transition-all"
                            >
                              <CheckCircle size={16} className="md:w-[20px] md:h-[20px]" />
                              VALIDATE
                            </button>
                            <button 
                              onClick={() => deleteReport(report.id, report.locationName)}
                              className="w-14 h-14 md:w-18 md:h-18 bg-white/5 border border-white/5 text-white/10 rounded-2xl md:rounded-[28px] flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                            >
                              <Trash2 size={18} className="md:w-[22px] md:h-[22px]" />
                            </button>
                         </div>
                      </motion.div>
                    ))}
                 </div>
              </motion.section>
            )}

            {activeTab === 'notifications' && (
               <motion.section 
                key="notif" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10 md:gap-20"
               >
                 <div className="space-y-8 md:space-y-16">
                   <header>
                      <div className="flex items-center gap-2 md:gap-3 mb-2">
                          <span className="px-2 py-1 bg-red-500/10 text-red-500 text-[8px] md:text-[9px] font-black rounded uppercase tracking-widest border border-red-500/20">Dispatch</span>
                          <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic">Dispatch</h2>
                      </div>
                   </header>

                   <div className="space-y-6 md:space-y-10">
                      <div className="bg-[#0d0d0d] border border-white/5 p-6 md:p-10 rounded-[32px] md:rounded-[48px] focus-within:border-blue-500/30 transition-all shadow-xl">
                        <label className="text-[8px] md:text-[10px] uppercase font-black text-white/30 tracking-[0.2em] block mb-4 md:mb-8">SUBJECT</label>
                        <input 
                          type="text"
                          placeholder="URGENT..."
                          value={notif.title}
                          onChange={(e) => setNotif({ ...notif, title: e.target.value })}
                          className="bg-transparent border-none outline-none text-2xl md:text-4xl font-black w-full placeholder:text-white/5 tracking-tighter italic"
                        />
                      </div>
                      <div className="bg-[#0d0d0d] border border-white/5 p-6 md:p-10 rounded-[32px] md:rounded-[48px] focus-within:border-blue-500/30 transition-all shadow-xl">
                        <label className="text-[8px] md:text-[10px] uppercase font-black text-white/30 tracking-[0.2em] block mb-4 md:mb-8">PAYLOAD</label>
                        <textarea 
                          placeholder="TRANSCRIPT..."
                          rows={4}
                          value={notif.body}
                          onChange={(e) => setNotif({ ...notif, body: e.target.value })}
                          className="bg-transparent border-none outline-none text-lg md:text-2xl font-bold w-full resize-none placeholder:text-white/5 leading-relaxed italic"
                        />
                      </div>
                   </div>

                   <button 
                    onClick={broadcastNotif}
                    disabled={isUpdating}
                    className="w-full bg-blue-500 h-20 md:h-24 rounded-[32px] md:rounded-[40px] flex items-center justify-center shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 hover:bg-blue-400 group"
                   >
                     <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-black text-white rounded-xl md:rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                           <Send size={18} className="md:w-[26px] md:h-[26px]" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-white font-black text-lg md:text-2xl leading-none mb-1 tracking-tighter uppercase italic">START BROADCAST</p>
                          <p className="text-white/50 text-[7px] md:text-[9px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] leading-none truncate">Dispatch to all active nodes</p>
                        </div>
                     </div>
                   </button>
                 </div>

                 {/* Mobile Device Mockup (Hidden on smaller screens to save space) */}
                 <div className="hidden lg:flex flex-col items-center pt-20">
                    <p className="text-[9px] text-white/20 uppercase font-black tracking-[0.3em] mb-12 italic">Telemetry Preview</p>
                    <div className="w-[360px] h-[740px] bg-black border-[14px] border-[#161616] rounded-[64px] relative overflow-hidden shadow-[0_60px_100px_rgba(0,0,0,0.5)]">
                       <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-full z-50" />
                       <div className="w-full h-full p-8 pt-20 bg-[#070707] flex flex-col">
                          <div className="relative">
                             <AnimatePresence mode="popLayout">
                               {notif.title && (
                                 <motion.div 
                                    initial={{ y: -60, scale: 0.9, opacity: 0 }}
                                    animate={{ y: 0, scale: 1, opacity: 1 }}
                                    className="bg-white/10 backdrop-blur-3xl border border-white/10 p-6 rounded-[32px] shadow-2xl"
                                 >
                                    <div className="flex items-center gap-4 mb-4">
                                       <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-black">A</div>
                                       <p className="text-[11px] text-white font-black leading-none uppercase italic tracking-tighter">ADAD_CORE</p>
                                    </div>
                                    <h4 className="text-sm font-black text-white mb-2 italic tracking-tighter uppercase">{notif.title}</h4>
                                    <p className="text-xs text-white/60 leading-relaxed font-medium line-clamp-3">{notif.body}</p>
                                 </motion.div>
                               )}
                             </AnimatePresence>
                          </div>
                       </div>
                    </div>
                 </div>
               </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {confirmModal.show && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-3xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-[#0d0d0d] border border-white/10 rounded-[48px] p-10 text-center shadow-2xl overflow-hidden relative"
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 border",
                confirmModal.type === 'danger' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                confirmModal.type === 'warning' ? "bg-orange-500/10 border-orange-500/20 text-orange-500" :
                "bg-blue-500/10 border-blue-500/20 text-blue-500"
              )}>
                 <Info size={32} />
              </div>
              <h3 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase italic">{confirmModal.title}</h3>
              <p className="text-white/40 text-sm mb-12 leading-relaxed font-medium italic">
                {confirmModal.message}
              </p>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={confirmModal.action}
                  className={cn(
                    "w-full py-5 rounded-3xl font-black text-lg transition-all active:scale-[0.98]",
                    confirmModal.type === 'danger' ? "bg-red-500 text-white" : "bg-white text-black"
                  )}
                >
                  تأفيذ الإجراء
                </button>
                <button 
                  onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                  className="w-full py-5 bg-white/5 border border-white/10 rounded-3xl font-black text-white/50 text-sm hover:bg-white/10 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
