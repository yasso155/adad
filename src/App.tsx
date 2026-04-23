import React, { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ParallaxContainer, ParallaxLayer } from './components/Antigravity';
import { CurrencyTicker } from './components/CurrencyTicker';
import { GlassCard } from './components/GlassCard';
import { ServiceRadar } from './components/ServiceRadar';
import { SolarOrb } from './components/SolarOrb';
import { SolarPlanner } from './components/SolarPlanner';
import { ServiceMap } from './components/ServiceMap';
import { AdminDashboard } from './components/AdminDashboard';
import { SettingsMenu } from './components/SettingsMenu';
import { Sun, MapPin, Search, Bell, Settings, User, ArrowLeft, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type ViewState = 'dashboard' | 'solar' | 'map' | 'admin' | 'settings';

export default function App() {
  const [view, setView] = useState<ViewState>('dashboard');
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white flex flex-col overflow-x-hidden overflow-y-auto font-sans select-none fill-neutral-300 relative">
      {/* Background Grid & Vignette */}
      <div className="fixed inset-0 bg-grid-white bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#050505_100%)] pointer-events-none" />

      <AnimatePresence mode="wait">
        {view === 'dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center w-full z-10"
          >
            {/* Header */}
            <div className="sticky top-0 left-0 right-0 z-50 w-full px-6 py-4 flex justify-between items-center backdrop-blur-[40px] bg-[#050505]/80 border-b border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-4 max-w-lg mx-auto w-full justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setView('settings')} className="relative focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-full">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full blur-sm opacity-50" />
                    <div className="relative w-10 h-10 bg-black rounded-full flex items-center justify-center border border-white/10 overflow-hidden">
                      {user ? (
                        <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=0D8ABC&color=fff&font-size=0.4`} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <User size={16} className="text-white/40" />
                      )}
                    </div>
                  </button>
                  <div className="flex flex-col">
                    <p className="text-[9px] text-white/40 uppercase tracking-widest font-black mb-0.5">
                      {user ? 'مرحباً بك' : 'الزائر'}
                    </p>
                    <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tight">
                      {user ? (user.displayName || 'مستخدم') : 'تسجيل الدخول'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="w-10 h-10 bg-white/5 rounded-full border border-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                    <Bell size={16} />
                  </button>
                  <button 
                    onClick={() => setView('settings')}
                    className="w-10 h-10 bg-white/5 rounded-full border border-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <Settings size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full flex-1 overflow-y-auto no-scrollbar pt-6 pb-24 flex flex-col gap-6 relative z-10 max-w-[600px] mx-auto">
              
              {/* Top Section / Header Alternative Spacing */}
              {/* Currency Ticker - Smooth horizontal scroll */}
              <div className="w-full">
                <CurrencyTicker />
              </div>

              {/* Search Bar */}
              <div className="w-full px-6 md:px-8">
                 <div className="w-full relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 to-emerald-500/30 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity" />
                    <div className="relative w-full h-14 bg-[#0a0a0a]/80 backdrop-blur-2xl rounded-2xl border border-white/10 flex items-center px-4 gap-3 shadow-2xl focus-within:border-blue-500/50 transition-colors">
                       <Search className="text-blue-400 shrink-0" size={20} />
                       <input 
                         type="text" 
                         placeholder="ابحث عن الخدمات، المتاجر، أو الأسعار..." 
                         className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-white/30 font-medium"
                       />
                    </div>
                 </div>
              </div>

              {/* Grid Layout for Main Features */}
              <div className="w-full px-6 md:px-8 flex flex-col gap-6">
                <GlassCard 
                  accentColor="#00E676" 
                  onClick={() => setView('solar')}
                  className="w-full flex-col p-8 overflow-hidden relative shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(16,185,129,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)]"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                  
                  <div className="mb-6 scale-90 relative top-2 z-10 w-full flex justify-center">
                     <SolarOrb />
                  </div>
                  <div className="relative z-10 w-full px-2">
                    <h3 className="text-white font-black text-xl md:text-2xl tracking-tighter italic">مخطط الطاقة الشمسية</h3>
                    <p className="text-white/40 text-xs mt-3 max-w-[250px] mx-auto font-medium leading-relaxed">
                      احسب أحمالك وصمم نظامك الشمسي المتكامل وتعرف على السعات المطلوبة
                    </p>
                  </div>
                </GlassCard>

                <GlassCard 
                  accentColor="#3b82f6" 
                  onClick={() => setView('map')}
                  className="w-full py-6 relative shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(59,130,246,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)]"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                  <div className="flex flex-col items-center relative z-10 w-full">
                    <ServiceRadar />
                    <div className="mt-2 text-center">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-black italic">رادار الخدمات</p>
                      <p className="text-white/50 text-xs mt-2">تحديثات حالة الأسواق والمحطات</p>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Static Background Decorations (Frosted Glass Theme) */}
              <div className="fixed top-[10%] left-[-20%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="fixed bottom-[20%] right-[-20%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
            </div>
          </motion.div>
        ) : null}

        {view === 'solar' && (
          <SolarPlanner key="solar" onClose={() => setView('dashboard')} />
        )}

        {view === 'map' && (
          <ServiceMap key="map-full" onClose={() => setView('dashboard')} />
        )}

        {view === 'settings' && (
          <SettingsMenu key="settings" onClose={() => setView('dashboard')} onAdminAccess={() => setView('admin')} />
        )}

        {view === 'admin' && (
          <motion.div 
            key="admin" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
          >
             <AdminDashboard />
             <button 
              onClick={() => setView('dashboard')}
              className="absolute top-6 left-6 z-[110] w-12 h-12 bg-white text-black rounded-full shadow-2xl flex items-center justify-center font-black"
             >
                <ArrowLeft size={20} />
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
