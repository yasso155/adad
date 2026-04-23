import React from 'react';
import { motion } from 'framer-motion';
import { Sun } from 'lucide-react';

export const SolarOrb: React.FC = () => {
  return (
    <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
      {/* Outer Pulse */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={`pulse-${i}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.6, opacity: [0, 0.4, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl"
        />
      ))}

      {/* Rotating Energy Rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border border-emerald-500/30 rounded-full border-dashed"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-2 border-2 border-emerald-400/20 rounded-full border-dotted"
      />

      {/* Solar Rays (Spinning) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {[...Array(12)].map((_, i) => (
          <div
            key={`ray-${i}`}
            className="absolute w-1 h-14 bg-gradient-to-t from-transparent via-emerald-400/50 to-emerald-300 rounded-full origin-bottom"
            style={{
              transform: `rotate(${i * 30}deg) translateY(-45px)`
            }}
          />
        ))}
      </motion.div>

      {/* Core Orb */}
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 0 20px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(255,255,255,0.4)",
            "0 0 40px rgba(16, 185, 129, 0.8), inset 0 0 30px rgba(255,255,255,0.6)",
            "0 0 20px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(255,255,255,0.4)"
          ]
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-300 to-emerald-600 rounded-[24px] md:rounded-[36px] flex items-center justify-center relative z-10 border border-white/40 shadow-inner"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.15, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <Sun className="text-[#050505]" size={36} />
        </motion.div>
      </motion.div>

      {/* Energy Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            animate={{
              y: [-20, -120],
              x: [0, (i % 2 === 0 ? 40 : -40)],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            className="absolute left-1/2 bottom-1/2 w-1.5 h-1.5 bg-emerald-300 rounded-full blur-[1px] shadow-[0_0_10px_rgba(110,231,183,1)]"
          />
        ))}
      </div>
    </div>
  );
};
