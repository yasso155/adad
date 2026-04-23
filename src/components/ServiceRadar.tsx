import React from 'react';
import { MapPin, Users, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

export const ServiceRadar: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <div className="relative w-[140px] h-[140px] mb-4">
        {/* Radar concentric circles */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              delay: i * 0.6,
              ease: "easeOut"
            }}
            className="absolute inset-0 rounded-full border border-blue-400"
          />
        ))}
        
        {/* Radar sweep */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-t border-transparent"
          style={{ background: 'conic-gradient(from 0deg, #3b82f633 0%, transparent 40%)' }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40">
                <Navigation className="text-blue-400 fill-blue-400/20" size={24} />
            </div>
        </div>

        {/* Random dots representing services (mockup) */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400 rounded-full blur-[1px]" />
        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-yellow-400 rounded-full blur-[1px]" />
        <div className="absolute top-2/3 left-1/2 w-2 h-2 bg-blue-400 rounded-full blur-[1px]" />
      </div>

      <div className="mt-4 flex gap-2 justify-center w-full no-scrollbar px-2 flex-wrap">
         {['صيدليات', 'أسواق', 'غاز', 'محطات'].map((cat) => (
             <span key={cat} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/50 whitespace-nowrap">
                 {cat}
             </span>
         ))}
      </div>
    </div>
  );
};
