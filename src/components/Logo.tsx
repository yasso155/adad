import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className, size = 40, showText = true }) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div 
        style={{ width: size, height: size }}
        className="relative flex-shrink-0"
      >
        <img 
          src="/assets/logo.png" 
          alt="Adad Logo" 
          className="w-full h-full object-contain"
        />
      </div>
      
      {showText && (
        <span className="text-2xl font-black tracking-tighter text-white">adad</span>
      )}
    </div>
  );
};
