import React from 'react';
import { motion } from 'framer-motion';

export const AdBar: React.FC = () => {
  return (
    <div className="w-full h-16 border-t border-white/5 bg-black/40 backdrop-blur-3xl flex items-center justify-center px-4 overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
      <div className="flex items-center gap-3 w-full max-w-7xl mx-auto">
        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-white/50 uppercase font-black tracking-widest shrink-0">إعلان</span>
        <div className="overflow-hidden w-full relative">
          {/* Gradient masks for smooth scrolling fade out */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/20 to-transparent z-10" />
          
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex whitespace-nowrap items-center gap-12"
          >
            <span className="text-white/60 text-sm font-medium">أفضل عروض الألواح الشمسية في السودان - <span className="text-emerald-400 font-bold">شركة شمسنا للطاقة المتجددة</span></span>
            <span className="text-white/60 text-sm font-medium">تطبيق طلبات للمطاعم والخدمات - <span className="text-blue-400 font-bold">حمل التطبيق الآن</span></span>
            <span className="text-white/60 text-sm font-medium">توصيل الأدوية للمنازل - <span className="text-orange-400 font-bold">صيدليات الإخلاص</span></span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
