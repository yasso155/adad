import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Globe, Bell, Shield, Moon, 
  HelpCircle, Info, ChevronRight, LogOut,
  Mail, Smartphone, Eye, Languages
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { TRANSLATIONS, Language } from '../constants/translations';
import { DocumentViewer } from './DocumentViewer';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../constants/legal';
import { AuthModal } from './AuthModal';

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick?: () => void;
  danger?: boolean;
  rightElement?: React.ReactNode;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, label, sub, onClick, danger, rightElement }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-5 hover:bg-white/[0.03] transition-all group"
  >
    <div className="flex items-center gap-4">
      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center border",
        danger ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-white/5 border-white/5 text-white/40 group-hover:text-white"
      )}>
        {icon}
      </div>
      <div className="text-left">
        <p className={cn("text-sm font-black tracking-tight", danger ? "text-red-500" : "text-white")}>{label}</p>
        <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">{sub}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      {rightElement}
      <ChevronRight size={16} className="text-white/10 group-hover:text-white/30 transition-all" />
    </div>
  </button>
);

export const SettingsMenu: React.FC<{ onClose: () => void, onAdminAccess?: () => void }> = ({ onClose, onAdminAccess }) => {
  const [user, setUser] = useState(auth.currentUser);
  
  useEffect(() => {
    const unsub = import('firebase/auth').then(({ onAuthStateChanged }) => {
      return onAuthStateChanged(auth, setUser);
    });
    return () => {
      unsub.then(fn => fn());
    };
  }, []);

  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('adad_lang') as Language) || 'ar';
  });

  const [activeDoc, setActiveDoc] = useState<{ title: string; content: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const t = TRANSLATIONS[lang];
  const isAdmin = user?.email?.toLowerCase() === 'yseddig15@gmail.com';

  const toggleLanguage = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar';
    setLang(newLang);
    localStorage.setItem('adad_lang', newLang);
    // Reload or use a global context in a full app, 
    // for this demo we'll just update local state and show the change.
    window.location.reload(); 
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className={cn(
        "fixed inset-0 z-[100] bg-[#050505]/80 backdrop-blur-[40px] flex flex-col font-sans",
        lang === 'ar' ? "text-right" : "text-left"
      )}
      dir={lang === 'ar' ? "rtl" : "ltr"}
    >
      {/* Background Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#050505_100%)] pointer-events-none" />

      {/* Header */}
      <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5 relative z-10 bg-black/20">
        <div className={lang === 'ar' ? "text-right" : "text-left"}>
          <h2 className="text-4xl font-black tracking-tighter italic uppercase underline decoration-blue-500 underline-offset-8">
            {t.settings}
          </h2>
          <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em] mt-3">
            {t.systemConfig}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="w-14 h-14 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[20px] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-12 relative z-10">
        {/* Profile Card */}
        {user ? (
          <div className="p-8">
            <div className="bg-[#0a0a0a]/60 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <div className={cn("flex items-center gap-6 relative z-10", lang === 'ar' ? "flex-row-reverse" : "flex-row")}>
                <div className="w-20 h-20 rounded-[24px] border-2 border-blue-500/30 p-1 shadow-[0_0_20px_rgba(59,130,246,0.2)] overflow-hidden">
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'User')}&background=0D8ABC&color=fff`} 
                    alt="" 
                    className="w-full h-full rounded-[18px] object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=U&background=0D8ABC&color=fff`;
                    }}
                  />
                </div>
                <div className={lang === 'ar' ? "text-right" : "text-left"}>
                  <h3 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">{user.displayName || (lang === 'ar' ? 'مستخدم سوداني' : 'Sudanese User')}</h3>
                  <p className="text-xs text-white/40 font-medium italic mb-2">{user.email}</p>
                  <div className={cn("flex items-center gap-2", lang === 'ar' ? "justify-end" : "justify-start")}>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black rounded uppercase border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">{t.verified}</span>
                    <span className="px-2 py-0.5 bg-white/5 text-white/40 text-[8px] font-black rounded uppercase border border-white/5">{t.standardTier}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <button 
              onClick={() => setShowAuthModal(true)}
              className={cn(
                "w-full bg-[#0a0a0a]/60 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all text-center flex flex-col items-center justify-center hover:border-blue-500/30"
              )}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all" />
              <User size={32} className="text-white/40 mb-3 group-hover:text-blue-400 transition-colors" />
              <h3 className="text-lg font-black tracking-tighter text-white mb-1">
                 {lang === 'ar' ? 'تسجيل الدخول / إنشاء حساب' : 'Log In / Sign Up'}
              </h3>
              <p className="text-xs text-white/40">{lang === 'ar' ? 'للوصول إلى الميزات المتقدمة وتخصيص إعداداتك' : 'Unlock advanced features and personalize your experience'}</p>
            </button>
          </div>
        )}

        {/* Settings Groups */}
        <div className="space-y-4 text-left px-8">
          <div className="mt-4">
            <p className={cn("text-[10px] font-black text-white/20 uppercase tracking-[0.25em] mb-4", lang === 'ar' && "text-right")}>
               {lang === 'ar' ? 'التفضيلات الأساسية' : 'Core Preferences'}
            </p>
            <div className="bg-[#0a0a0a]/60 backdrop-blur-2xl border border-white/5 rounded-[32px] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
              <SettingsItem 
                icon={<Globe size={18} />} 
                label={t.language} 
                sub={t.regionalInterface} 
                onClick={toggleLanguage}
                rightElement={<span className="text-[10px] text-blue-500 font-black tracking-widest uppercase">{t.activeLang}</span>}
              />
              <SettingsItem 
                icon={<Bell size={18} />} 
                label={t.notifications} 
                sub={t.criticalAlerts} 
                rightElement={
                  <div className="w-8 h-4 bg-blue-500 rounded-full relative">
                    <div className={cn("absolute top-1 w-2 h-2 bg-white rounded-full", lang === 'ar' ? "left-1" : "right-1")} />
                  </div>
                }
              />
              <SettingsItem 
                icon={<Eye size={18} />} 
                label={t.viewMode} 
                sub={t.systemAesthetic} 
                rightElement={<Moon size={16} className="text-white/40" />}
              />
            </div>
          </div>

          <div className="mt-8">
            <p className={cn("text-[10px] font-black text-white/20 uppercase tracking-[0.25em] mb-4", lang === 'ar' && "text-right")}>
              {lang === 'ar' ? 'الأمان والدعم' : 'Security & Support'}
            </p>
            <div className="bg-[#0a0a0a]/60 backdrop-blur-2xl border border-white/5 rounded-[32px] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
              <SettingsItem 
                icon={<Shield size={18} />} 
                label={t.privacy} 
                sub={t.dataHandling} 
                onClick={() => setActiveDoc({ title: t.privacy, content: PRIVACY_POLICY })}
              />
              <SettingsItem 
                icon={<HelpCircle size={18} />} 
                label={lang === 'ar' ? 'شروط الخدمة' : 'Terms of Service'} 
                sub={lang === 'ar' ? 'القواعد والقوانين' : 'Rules & Guidelines'} 
                onClick={() => setActiveDoc({ title: lang === 'ar' ? 'شروط الخدمة' : 'Terms of Service', content: TERMS_OF_SERVICE })}
              />
              <SettingsItem 
                icon={<Info size={18} />} 
                label={t.manifest} 
                sub={t.version} 
              />
            </div>
          </div>

          {isAdmin && onAdminAccess && (
            <div className="mt-8">
              <p className={cn("text-[10px] font-black text-rose-500/50 uppercase tracking-[0.25em] mb-4", lang === 'ar' && "text-right")}>
                {lang === 'ar' ? 'صلاحيات الإدارة' : 'Admin Privileges'}
              </p>
              <div className="bg-rose-500/5 backdrop-blur-2xl border border-rose-500/20 rounded-[32px] overflow-hidden shadow-[inset_0_1px_1px_rgba(244,63,94,0.1)]">
                <SettingsItem 
                  icon={<Shield size={18} />} 
                  label={lang === 'ar' ? 'لوحة تحكم المسؤول' : 'Admin Dashboard'} 
                  sub={lang === 'ar' ? 'الوصول الكامل للنظام' : 'Full System Access'} 
                  onClick={onAdminAccess}
                  danger
                />
              </div>
            </div>
          )}

          {user && (
            <div className="mt-12">
              <div className="bg-red-500/5 backdrop-blur-2xl border border-red-500/10 rounded-[32px] overflow-hidden shadow-[inset_0_1px_1px_rgba(239,68,68,0.1)]">
                <SettingsItem 
                  icon={<LogOut size={18} />} 
                  label={t.terminateSession} 
                  sub={t.deauthenticate} 
                  danger
                  onClick={() => signOut(auth).then(() => onClose())}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-20 text-center pb-8">
           <p className="text-[9px] text-white/10 font-black uppercase tracking-[0.5em]">{t.builtForSun}</p>
           <div className="flex items-center justify-center gap-2 mt-4 opacity-10">
              <Mail size={12} />
              <Smartphone size={12} />
              <Shield size={12} />
           </div>
        </div>
      </div>

      <AnimatePresence>
        {activeDoc && (
          <DocumentViewer
            title={activeDoc.title}
            content={activeDoc.content}
            lang={lang}
            onClose={() => setActiveDoc(null)}
          />
        )}
        {showAuthModal && (
          <AuthModal 
            onClose={() => setShowAuthModal(false)} 
            lang={lang} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
