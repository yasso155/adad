import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
  Plus, MapPin, Search, Navigation, Clock, 
  CheckCircle2, AlertCircle, Fuel, Utensils, 
  Crosshair, X, Filter, Share2, Star,
  Compass
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Location {
  id: string;
  name: string;
  type: 'pharmacy' | 'bakery' | 'fuel';
  status: 'available' | 'busy' | 'low' | 'closed';
  lastUpdated: string;
  lat: number;
  lng: number;
  isSponsored?: boolean;
}

const LOCATIONS: Location[] = [
  { id: '1', name: 'Al-Amal Pharmacy', type: 'pharmacy', status: 'available', lastUpdated: '5m ago', lat: 30, lng: 40, isSponsored: true },
  { id: '2', name: 'Khartoum Bakeries', type: 'bakery', status: 'busy', lastUpdated: '12m ago', lat: 60, lng: 30 },
  { id: '3', name: 'Petronas Station', type: 'fuel', status: 'low', lastUpdated: '2m ago', lat: 45, lng: 70 },
  { id: '4', name: 'Nile Pharmacy', type: 'pharmacy', status: 'available', lastUpdated: '1h ago', lat: 15, lng: 20 },
  { id: '5', name: 'Sudanese Bread Co', type: 'bakery', status: 'available', lastUpdated: '34m ago', lat: 80, lng: 60 },
  { id: '6', name: 'Shell Station Omdurman', type: 'fuel', status: 'closed', lastUpdated: '4h ago', lat: 25, lng: 85 },
];

const STATUS_COLORS = {
  available: 'bg-emerald-500',
  busy: 'bg-orange-500',
  low: 'bg-yellow-500',
  closed: 'bg-neutral-500',
};

const TYPE_ICONS = {
  pharmacy: <Crosshair size={14} />,
  bakery: <Utensils size={14} />,
  fuel: <Fuel size={14} />,
};

export const ServiceMap: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [userPos, setUserPos] = useState<{ x: number, y: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Geolocation Tracking
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Khartoum Reference Mapping (Linear Interpolation)
        const baseLat = 15.5881; // Central Khartoum
        const baseLng = 32.5342;
        const latRange = 0.4;
        const lngRange = 0.4;

        const y = ((baseLat + latRange/2 - latitude) / latRange) * 100;
        const x = ((longitude - (baseLng - lngRange/2)) / lngRange) * 100;

        setUserPos({ x, y });
        setGeoError(null);
      },
      (err) => {
        setGeoError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);
  
  // Parallax / Tilt Physics
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    setRotateX((y - centerY) / 50);
    setRotateY((centerX - x) / 50);
  };

  return (
    <motion.div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setRotateX(0); setRotateY(0); }}
      className="fixed inset-0 z-50 bg-[#050505]/80 backdrop-blur-[40px] overflow-hidden flex flex-col font-sans"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Top Controls Overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button onClick={onClose} className="w-14 h-14 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[20px] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <X size={24} />
          </button>
          <div className="h-14 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[20px] px-5 flex items-center gap-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] focus-within:border-blue-500/50 transition-colors">
             <Search size={22} className="text-blue-400" />
             <input type="text" placeholder="Search areas..." className="bg-transparent border-none outline-none text-base w-40 text-white placeholder:text-white/30 font-medium" />
          </div>
        </div>
        
        <div className="flex gap-4 pointer-events-auto">
          <button className="w-14 h-14 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[20px] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <Filter size={24} />
          </button>
        </div>
      </div>

      {/* Main Interactive Map Stage */}
      <div className="flex-1 relative perspective-1000">
        {/* Background ambient lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,transparent_100%)] pointer-events-none" />
        
        <motion.div 
          style={{ 
            rotateX: useSpring(rotateX, { damping: 20 }), 
            rotateY: useSpring(rotateY, { damping: 20 }),
            transformStyle: 'preserve-3d'
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Map Grid / Base */}
          <div className="relative w-[150%] h-[150%] bg-[#080808]/50 overflow-hidden rounded-full shadow-[inset_0_0_100px_rgba(0,0,0,1)]">
             <div className="absolute inset-0" style={{ 
               backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
               backgroundSize: '60px 60px'
             }} />
             
             {/* Simulated Streets/Nodes */}
             <div className="absolute inset-0 flex items-center justify-center">
                <svg width="100%" height="100%" className="opacity-20 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                   <path d="M-500,500 L2500,500 M1000,-500 L1000,2500 M500,-500 L500,2500" stroke="#3b82f6" strokeWidth="2" strokeDasharray="15 15" />
                   <path d="M-500,1000 L2500,1000 M1500,-500 L1500,2500" stroke="#10b981" strokeWidth="1" strokeDasharray="5 5" opacity="0.5" />
                </svg>
             </div>
          </div>

          {/* Floating Pins */}
          {LOCATIONS.map((loc) => (
            <motion.div
              key={loc.id}
              style={{ 
                left: `${loc.lng}%`, 
                top: `${loc.lat}%`,
                transformStyle: 'preserve-3d',
                translateZ: loc.isSponsored ? 60 : 40 
              }}
              className="absolute group cursor-pointer"
              onClick={() => setSelectedLocation(loc)}
            >
              {/* Glow Effect */}
              <div className={cn(
                "absolute -inset-8 rounded-full blur-2xl opacity-20 transition-all duration-500 group-hover:opacity-60",
                STATUS_COLORS[loc.status],
                loc.isSponsored && "animate-pulse opacity-40 scale-150 shadow-[0_0_50px_rgba(59,130,246,0.5)]"
              )} />
              
              {/* 3D Pin Body */}
              <div className={cn(
                 "relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                 "bg-[#050505]/80 backdrop-blur-md border",
                 loc.isSponsored ? "border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]" : "border-white/10"
              )}>
                 <div className={cn("text-white", loc.isSponsored && "text-blue-400")}>
                    {TYPE_ICONS[loc.type]}
                 </div>
                 
                 {/* Status Dot */}
                 <div className={cn(
                   "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#050505]",
                   STATUS_COLORS[loc.status]
                 )} />
              </div>
              
              {/* Tooltip Label (sponsored only) */}
              {loc.isSponsored && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-blue-500 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest text-white shadow-xl">
                   Sponsored
                </div>
              )}
            </motion.div>
          ))}

          {/* User Location Marker (Real-time) */}
          {userPos && (
             <motion.div 
               animate={{ left: `${userPos.x}%`, top: `${userPos.y}%` }}
               style={{ transformStyle: 'preserve-3d', translateZ: 80 }}
               className="absolute z-[100]"
             >
                <div className="relative flex items-center justify-center">
                   {/* Radar Ring */}
                   <motion.div 
                      animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute w-12 h-12 bg-blue-500 rounded-full blur-sm" 
                   />
                   <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-[0_0_20px_rgba(59,130,246,0.8)] z-10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                   </div>
                   
                   <div className="absolute -bottom-10 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full whitespace-nowrap">
                      <div className="text-[10px] font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                         <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                         أنت هنا (Live)
                      </div>
                   </div>
                </div>
             </motion.div>
          )}
        </motion.div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowReport(true)}
        className="absolute bottom-10 right-6 w-16 h-16 bg-blue-500 rounded-2xl shadow-2xl shadow-blue-500/20 flex items-center justify-center text-white transform transition-transform hover:scale-110 active:scale-95 z-50"
      >
        <Plus size={32} />
        <div className="absolute -top-2 -right-2 bg-white text-blue-500 text-[8px] font-black px-2 rounded-full py-1 uppercase">Report</div>
      </button>

      {/* Bottom Information Card */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[60] p-6 pb-12"
          >
            <div className="bg-[#050505]/80 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] uppercase font-bold text-white/30 border border-white/5 italic">
                      {selectedLocation.type}
                    </span>
                    {selectedLocation.isSponsored && (
                       <Star size={14} className="text-blue-400 fill-blue-400" />
                    )}
                  </div>
                  <h2 className="text-3xl font-black text-white leading-tight">{selectedLocation.name}</h2>
                </div>
                <button 
                  onClick={() => setSelectedLocation(null)}
                  className="p-2 bg-white/5 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                       <Navigation size={14} className="text-white/30" />
                       <span className="text-[10px] text-white/30 uppercase font-bold">الحالة الحالية</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className={cn("w-3 h-3 rounded-full", STATUS_COLORS[selectedLocation.status])} />
                       <span className="font-bold text-lg capitalize">{selectedLocation.status}</span>
                    </div>
                 </div>
                 <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                       <Clock size={14} className="text-white/30" />
                       <span className="text-[10px] text-white/30 uppercase font-bold">آخر تحديث</span>
                    </div>
                    <span className="font-bold text-lg">{selectedLocation.lastUpdated}</span>
                 </div>
              </div>

              <div className="flex gap-4">
                 <button className="flex-1 py-5 bg-white text-[#050505] font-black rounded-3xl shadow-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <CheckCircle2 size={20} />
                    تأكيد الحالة
                 </button>
                 <button className="w-20 py-5 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center text-white/50">
                    <Share2 size={20} />
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal Placeholder */}
      <AnimatePresence>
        {showReport && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
           >
              <div className="w-full max-w-sm bg-[#050505] border border-white/10 rounded-[40px] p-8 flex flex-col items-center">
                 <AlertCircle size={48} className="text-blue-500 mb-6" />
                 <h2 className="text-2xl font-black mb-2 text-center">خدمة الإبلاغ عن الحالة</h2>
                 <p className="text-white/50 text-center text-sm mb-12 italic">ساعد مجتمعك بإضافة حالة المتجر الحالي.</p>
                 
                 <div className="w-full space-y-4 mb-12">
                   <button className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-bold">متوفر (Green)</button>
                   <button className="w-full py-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-400 font-bold">مزدحم / محدود (Orange)</button>
                   <button className="w-full py-4 bg-neutral-500/10 border border-neutral-500/20 rounded-2xl text-neutral-400 font-bold">غير متوفر (Gray)</button>
                 </div>

                 <button 
                  onClick={() => setShowReport(false)}
                  className="w-full py-5 bg-white/5 border border-white/10 rounded-[30px] font-bold text-white/50"
                 >
                    إلغاء
                 </button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
