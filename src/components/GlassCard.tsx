import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, accentColor = '#3b82f6', onClick }) => {
  // Determine gradient colors based on accentColor (simple mapping for the theme)
  const getGradient = () => {
    if (accentColor === '#3b82f6') return 'from-blue-600 to-cyan-400';
    if (accentColor === '#00E676') return 'from-emerald-600 to-teal-400';
    if (accentColor.includes('orange')) return 'from-orange-600 to-yellow-400';
    return 'from-white/10 to-transparent';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn("relative group cursor-pointer", className)}
    >
      {/* Outer Glow / Gradient Blur */}
      <div className={cn(
        "absolute -inset-1.5 rounded-[40px] blur-xl opacity-20 transition-opacity duration-500 group-hover:opacity-50",
        "bg-gradient-to-r",
        getGradient()
      )} />
      
      <div className={cn(
        "relative h-auto w-full overflow-hidden",
        "bg-[#0a0a0a]/60 backdrop-blur-3xl rounded-[36px]",
        "border flex flex-col items-center justify-center text-center p-8",
        "transition-all duration-500",
        "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.15)]"
      )}
      style={{
        borderColor: `${accentColor}4d`, // 30% opacity border
      }}
    >
      {/* Inner reflection gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-[36px]" />
      
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
         {children}
      </div>
    </div>
    </motion.div>
  );
};
