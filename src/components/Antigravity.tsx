import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '../lib/utils';

interface ParallaxContainerProps {
  children: React.ReactNode;
}

export const ParallaxContainer: React.FC<ParallaxContainerProps> = ({ children }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out the motion
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 2; // -1 to 1
      const y = (clientY / innerHeight - 0.5) * 2; // -1 to 1
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="relative w-full min-h-[950px] bg-[#050505] perspective-1000">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && (child.type as any).isParallaxLayer) {
          return React.cloneElement(child as React.ReactElement<any>, { smoothX, smoothY });
        }
        return child;
      })}
    </div>
  );
};

interface ParallaxLayerProps {
  depth: number; // -1 to 1, negative is further away, positive is closer
  children: React.ReactNode;
  smoothX?: any;
  smoothY?: any;
  className?: string;
}

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({ depth, children, smoothX, smoothY, className }) => {
  const x = useTransform(smoothX, (v: number) => v * depth * 50);
  const y = useTransform(smoothY, (v: number) => v * depth * 50);

  return (
    <motion.div
      style={{ x, y }}
      className={cn("absolute inset-0 pointer-events-none", className)}
    >
      <div className="pointer-events-auto h-full w-full">
        {children}
      </div>
    </motion.div>
  );
};

(ParallaxLayer as any).isParallaxLayer = true;
