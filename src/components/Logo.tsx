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
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
               <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
               <feOffset dx="0" dy="2" result="offsetblur" />
               <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3" />
               </feComponentTransfer>
               <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
               </feMerge>
            </filter>
          </defs>
          
          {/* Main "a" shape inspired by the image */}
          <path
            d="M50 15C30.67 15 15 30.67 15 50C15 69.33 30.67 85 50 85C56.5 85 62.5 83.2 67.7 80C75 75.5 80 67.5 80 58.5V45C80 28.5 66.5 15 50 15ZM50 70C39 70 30 61 30 50C30 39 39 30 50 30C61 30 70 39 70 50C70 61 61 70 50 70Z"
            fill="url(#logo-gradient)"
            filter="url(#shadow)"
          />
          
          {/* Inner accent curl */}
          <path
            d="M70 50C70 61 61 70 50 70C45 70 41 68.2 38 65.3C41.5 67.5 45.6 68.8 50 68.8C60.4 68.8 68.8 60.4 68.8 50C68.8 45.6 67.5 41.5 65.3 38C68.2 41 70 45 70 50Z"
            fill="white"
            fillOpacity="0.2"
          />
        </svg>
      </div>
      
      {showText && (
        <span className="text-2xl font-black tracking-tighter text-white">adad</span>
      )}
    </div>
  );
};
