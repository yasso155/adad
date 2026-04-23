import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { cn } from '../lib/utils';
import { Language, TRANSLATIONS } from '../constants/translations';

interface AuthModalProps {
  onClose: () => void;
  lang: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, lang }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = TRANSLATIONS[lang];
  const isAr = lang === 'ar';

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !displayName) {
      setError(isAr ? 'الرجاء إدخال الاسم الكامل' : 'Please enter your full name');
      return;
    }
    if (!email || !password) {
      setError(isAr ? 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      return;
    }
    if (!isLogin && password.length < 6) {
      setError(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
         setError(isAr ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password');
      } else if (err.code === 'auth/email-already-in-use') {
         setError(isAr ? 'البريد الإلكتروني مستخدم بالفعل' : 'Email is already in use');
      } else if (err.code === 'auth/weak-password') {
         setError(isAr ? 'كلمة المرور ضعيفة جداً' : 'Password is too weak');
      } else if (err.code === 'auth/unauthorized-domain') {
         setError(isAr ? 'هذا النطاق غير مصرح به. يرجى إضافة localhost في وحدة تحكم Firebase.' : 'This domain is not authorized. Please add localhost to Authorized Domains in Firebase Console.');
      } else {
         setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setError(isAr ? 'هذا النطاق غير مصرح به. يرجى إضافة localhost في وحدة تحكم Firebase.' : 'This domain is not authorized. Please add localhost to Authorized Domains in Firebase Console.');
      } else if (err.code !== 'auth/cancelled-popup-request' && err.code !== 'auth/popup-closed-by-user') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir={isAr ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-sm bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-2xl overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <X size={16} className="text-white/60" />
        </button>

        <div className="p-8 pb-6">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
            <User size={24} className="text-blue-500" />
          </div>
          
          <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">
            {isLogin ? (isAr ? 'أهلاً بعودتك' : 'Welcome Back') : (isAr ? 'إنشاء حساب' : 'Create Account')}
          </h2>
          <p className="text-xs text-white/40 font-medium">
            {isLogin 
              ? (isAr ? 'قم بتسجيل الدخول للوصول إلى حسابك' : 'Sign in to access your account')
              : (isAr ? 'سجل معنا للوصول إلى كافة الميزات' : 'Register to access all features')
            }
          </p>
        </div>

        <div className="px-8 pb-8">
          {error && (
            <div className="mb-6 flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold">
              <AlertCircle size={14} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-3">
              {!isLogin && (
                <div className="relative group">
                  <User size={16} className={cn("absolute top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors", isAr ? "right-4" : "left-4")} />
                  <input 
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={isAr ? 'الاسم الكامل' : 'Full Name'}
                    className={cn(
                      "w-full h-12 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/30 transition-all text-sm text-white placeholder-white/20",
                      isAr ? "pr-12 pl-4" : "pl-12 pr-4"
                    )}
                  />
                </div>
              )}

              <div className="relative group">
                <Mail size={16} className={cn("absolute top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors", isAr ? "right-4" : "left-4")} />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isAr ? 'البريد الإلكتروني' : 'Email Address'}
                  className={cn(
                    "w-full h-12 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/30 transition-all text-sm text-white placeholder-white/20",
                    isAr ? "pr-12 pl-4" : "pl-12 pr-4"
                  )}
                />
              </div>

              <div className="relative group">
                <Lock size={16} className={cn("absolute top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors", isAr ? "right-4" : "left-4")} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isAr ? 'كلمة المرور' : 'Password'}
                  className={cn(
                    "w-full h-12 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/30 transition-all text-sm text-white placeholder-white/20",
                    isAr ? "pr-12 pl-4" : "pl-12 pr-4"
                  )}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black animate-spin rounded-full" />
              ) : (
                <>
                  {isLogin ? (isAr ? 'تسجيل الدخول' : 'Sign In') : (isAr ? 'إنشاء حساب' : 'Create Account')}
                  <ArrowRight size={16} className={cn(isAr && "rotate-180")} />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">
              {isAr ? 'أو' : 'OR'}
            </span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <button 
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full h-12 bg-transparent border border-white/10 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-white/5 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
               <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
               <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
               <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
               <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isLogin 
              ? (isAr ? 'تسجيل الدخول باستخدام Google' : 'Sign in with Google')
              : (isAr ? 'إنشاء حساب باستخدام Google' : 'Sign up with Google')
            }
          </button>

          <p className="mt-8 text-center text-[10px] text-white/30 font-medium">
            {isLogin ? (isAr ? 'ليس لديك حساب؟ ' : "Don't have an account? ") : (isAr ? 'لديك حساب بالفعل؟ ' : "Already have an account? ")}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-white hover:text-blue-400 font-bold underline decoration-white/20 underline-offset-4 transition-colors"
            >
              {isLogin ? (isAr ? 'أنشئ حساباً جديداً' : 'Sign up') : (isAr ? 'تسجيل الدخول' : 'Sign in')}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
