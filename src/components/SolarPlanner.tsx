import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Sun, Battery, Zap, Wind, Lightbulb, 
  Tv, Refrigerator, Plus, Minus, Send, CheckCircle2, Droplets 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Device {
  id: string;
  name: string;
  arabicName: string;
  power: number; // Watts
  icon: React.ReactNode;
}

const SUDAN_DEVICES: Device[] = [
  { id: 'cooler_nasma', name: 'Nasma Cooler', arabicName: 'مكيف نسمة', power: 200, icon: <Wind size={20} /> },
  { id: 'cooler_freon', name: '12k BTU AC', arabicName: 'مكيف فريون 12', power: 1500, icon: <Zap size={20} /> },
  { id: 'fan', name: 'Ceiling Fan', arabicName: 'مروحة سقف', power: 75, icon: <Wind size={20} className="rotate-90" /> },
  { id: 'fridge', name: 'Medium Fridge', arabicName: 'ثلاجة متوسطة', power: 250, icon: <Refrigerator size={20} /> },
  { id: 'tv', name: 'LED Screen', arabicName: 'شاشة LED', power: 60, icon: <Tv size={20} /> },
  { id: 'bulb', name: 'LED Bulb', arabicName: 'لمبة LED', power: 12, icon: <Lightbulb size={20} /> },
  { id: 'water_cooler', name: 'Water Cooler', arabicName: 'مبرد ماء', power: 100, icon: <Droplets size={20} className="text-blue-400" /> },
];

interface SelectedDevice extends Device {
  count: number;
  hours: number;
}

export const SolarPlanner: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedDevices, setSelectedDevices] = useState<Record<string, SelectedDevice>>({});
  const [sunIntensity, setSunIntensity] = useState(6); // 4 (winter) to 8 (summer peak)
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const stats = useMemo(() => {
    let peakLoad = 0;
    let dailyWh = 0;
    
    Object.values(selectedDevices).forEach((dev: SelectedDevice) => {
      peakLoad += dev.power * dev.count;
      dailyWh += dev.power * dev.count * dev.hours;
    });

    // 1. حساب عدد الألواح (بافتراض لوح 545 واط وفقد 30%)
    const panelEfficiency = 0.70; 
    const requiredPanelWatts = (dailyWh / sunIntensity) / panelEfficiency;
    const panelsCount = Math.ceil(requiredPanelWatts / 545);

    // 2. حساب حجم الإنفيرتر (Inverter)
    const inverterKva = Math.ceil(((peakLoad * 1.2) / 1000) * 10) / 10; // Peak load * 1.2 safety, rounded to 1 decimal

    // 3. حساب البطاريات (بافتراض نظام 24 فولت وبطاريات 200 أمبير و50% تغطية ليلية)
    const nightLoadWh = dailyWh * 0.5;
    const batteryAhNeeded = (nightLoadWh / 24) / 0.5;
    const batteriesCount = Math.ceil(batteryAhNeeded / 200);

    return { 
      peakLoad, 
      dailyWh, 
      panelsCount, 
      batteriesCount, 
      inverterKva,
      panelWatts: Math.ceil(requiredPanelWatts)
    };
  }, [selectedDevices, sunIntensity]);

  const updateDevice = (device: Device, delta: number) => {
    setSelectedDevices(prev => {
      const isFridge = device.id.includes('fridge');
      const defaultHours = isFridge ? 24 : 8;
      const existing = prev[device.id] || { ...device, count: 0, hours: defaultHours };
      const newCount = Math.max(0, existing.count + delta);
      
      if (newCount === 0) {
        const { [device.id]: _, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [device.id]: { ...existing, count: newCount } };
    });
  };

  const updateHours = (id: string, hours: number) => {
    setSelectedDevices(prev => ({
      ...prev,
      [id]: { ...prev[id], hours: Math.min(24, Math.max(1, hours)) }
    }));
  };

  const fillPercentage = Math.min(100, (stats.dailyWh / 15000) * 100);

  if (showLeadForm) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed inset-0 z-[60] bg-[#050505]/90 backdrop-blur-3xl p-6 flex flex-col"
      >
        <div className="flex items-center mb-8">
          <button onClick={() => setShowLeadForm(false)} className="p-2 text-white/50">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white ml-4">طلب عروض أسعار</h1>
        </div>

        {!formSubmitted ? (
          <div className="space-y-6">
            <p className="text-white/50 text-sm">أرسل مخططك لشركات الطاقة الشمسية في السودان للحصول على أفضل سعر.</p>
            
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <label className="text-[10px] text-white/30 uppercase block mb-1">الاسم الكامل</label>
                <input type="text" className="bg-transparent w-full outline-none text-white font-bold" placeholder="محمد أحمد..." />
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <label className="text-[10px] text-white/30 uppercase block mb-1">رقم الهاتف (واتساب)</label>
                <input type="tel" className="bg-transparent w-full outline-none text-white font-bold" placeholder="مثال: 0912345678" />
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <label className="text-[10px] text-white/30 uppercase block mb-1">المدينة</label>
                <select className="bg-transparent w-full outline-none text-white font-bold">
                  <option className="bg-[#050505]">الخرطوم</option>
                  <option className="bg-[#050505]">بورتسودان</option>
                  <option className="bg-[#050505]">عطبرة</option>
                  <option className="bg-[#050505]">مدني</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl italic text-[10px] text-emerald-400">
               سيتم إرسال تفاصيل الأحمال: {stats.panelsCount} لوح 545W و {stats.batteriesCount} بطارية 200Ah.
            </div>

            <button 
              onClick={() => setFormSubmitted(true)}
              className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Send size={18} />
              إرسال الطلب الآن
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <CheckCircle2 size={80} className="text-emerald-500 mb-6" />
            <h2 className="text-2xl font-bold mb-2">تم الإرسال بنجاح!</h2>
            <p className="text-white/50 text-sm max-w-xs mb-8">ستتواصل معك أفضل شركات الطاقة في Sudan خلال 24 ساعة.</p>
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl font-bold"
            >
              العودة للرئيسية
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-50 bg-[#050505]/80 backdrop-blur-[40px] overflow-y-auto pb-20"
    >
      <div className="sticky top-0 z-50 bg-black/20 backdrop-blur-3xl border-b border-white/5 p-6 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-4 tracking-tighter italic">مخطط الطاقة الشمسية</h1>
        </div>
        <button 
          onClick={() => setShowLeadForm(true)}
          disabled={stats.dailyWh === 0}
          className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold disabled:opacity-30 transition-all"
        >
          اطلب عرض سعر
        </button>
      </div>

      <div className="px-6 space-y-8">
        {/* Visual Indicator Layer: Enhanced Liquid Battery */}
        <div className="relative flex flex-col items-center py-12">
           <div className="relative w-52 h-64 bg-white/5 rounded-[50px] border border-white/10 flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              {/* Battery Tip */}
              <div className="absolute top-0 w-16 h-4 bg-white/10 rounded-b-xl border-x border-b border-white/10 z-20" />
              
              {/* Dynamic Sun Glow based on Intensity */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                  boxShadow: `0 0 ${sunIntensity * 10}px ${sunIntensity * 5}px rgba(250, 204, 21, 0.2)`
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 left-10 w-4 h-4 bg-yellow-400 rounded-full z-20"
              />
              <Sun className="text-yellow-400 absolute top-9 left-9 z-20" size={24} />
              
              {/* Liquid Wave Effect with Dynamic Color Shift */}
              <div className="absolute inset-0 z-0">
                {/* Back Wave */}
                <motion.div 
                  animate={{ 
                    height: `${fillPercentage}%`,
                    x: ["-50%", "0%"],
                    backgroundColor: fillPercentage > 70 ? '#f59e0b' : '#047857' // Dynamic back wave color
                  }}
                  transition={{ 
                    height: { duration: 1.5, ease: "easeOut" },
                    x: { duration: 5, repeat: Infinity, ease: "linear" },
                    backgroundColor: { duration: 1 }
                  }}
                  className="absolute bottom-0 left-[-100%] w-[200%] opacity-30 blur-[2px] rounded-t-[100%]"
                  style={{ borderRadius: '40% 45% 0 0' }}
                />
                
                {/* Front Wave */}
                <motion.div 
                  animate={{ 
                    height: `${fillPercentage}%`,
                    x: ["0%", "-50%"],
                    background: fillPercentage > 70 
                      ? 'linear-gradient(to top, #d97706, #fbbf24, #fef3c7)' 
                      : 'linear-gradient(to top, #059669, #10b981, #34d399)'
                  }}
                  transition={{ 
                    height: { duration: 1.2, ease: "easeOut", delay: 0.1 },
                    x: { duration: 3.5, repeat: Infinity, ease: "linear" },
                    background: { duration: 1 }
                  }}
                  className="absolute bottom-0 left-[-100%] w-[200%] shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                  style={{ borderRadius: '35% 40% 0 0' }}
                />

                {/* Energy Particles (Bubbles) */}
                <AnimatePresence>
                  {stats.dailyWh > 0 && Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: '100%', x: `${20 + Math.random() * 60}%`, opacity: 0, scale: 0 }}
                      animate={{ 
                        y: `${100 - fillPercentage}%`, 
                        opacity: [0, 0.7, 0], 
                        scale: [0, 1, 0.5],
                        x: `${20 + Math.random() * 60 + Math.sin(Date.now() / 1000 + i) * 10}%`
                      }}
                      transition={{ 
                        duration: 2 + Math.random() * 2, 
                        repeat: Infinity, 
                        delay: i * 0.4,
                        ease: "easeOut"
                      }}
                      className="absolute bottom-0 w-2 h-2 bg-white/40 rounded-full blur-[1px] z-10"
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Central Metrics Card */}
              <div className="z-10 flex flex-col items-center bg-[#050505]/40 backdrop-blur-xl p-5 rounded-[32px] border border-white/10 shadow-2xl">
                <Battery size={48} className={cn("transition-colors duration-500", stats.dailyWh > 0 ? "text-white" : "text-white/20")} />
                <div className="flex flex-col items-center mt-3">
                  <motion.span 
                    key={stats.dailyWh}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-black text-white tracking-tighter leading-none"
                  >
                    {stats.dailyWh.toLocaleString()}
                  </motion.span>
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-3 opacity-90">Daily Watt-Hours</span>
                </div>
              </div>

              {/* Glass Realism Details */}
              <div className="absolute top-[15%] left-6 w-3 h-24 bg-white/10 rounded-full blur-[2px] opacity-50 z-20" />
              <div className="absolute bottom-10 right-6 w-4 h-4 bg-white/5 rounded-full blur-[4px] z-20" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10" />
           </div>
           
           {/* Sun Intensity Slider */}
           <div className="mt-8 w-full max-w-xs">
              <div className="flex justify-between text-[10px] text-white/30 mb-2 uppercase tracking-tighter">
                <span>Winter (Low)</span>
                <span>Summer (Peak)</span>
              </div>
              <input 
                type="range" min="4" max="8" step="0.5"
                value={sunIntensity}
                onChange={(e) => setSunIntensity(parseFloat(e.target.value))}
                className="w-full accent-yellow-400"
              />
              <p className="text-center text-[10px] text-yellow-500 mt-2">
                ساعات الذروة المحددة: {sunIntensity} ساعات
              </p>
           </div>
        </div>

        {/* Device Picker Layer */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest px-1">الأجهزة المنزلية</h2>
          <div className="grid grid-cols-1 gap-3">
            {SUDAN_DEVICES.map(device => {
              const selected = selectedDevices[device.id];
              return (
                <div key={device.id} className="bg-white/5 border border-white/10 p-4 rounded-3xl flex flex-col gap-4 group hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-4 flex-1 pr-2">
                      <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/10 transition-all">
                        {device.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-xs md:text-sm flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                          <span className="truncate">{device.arabicName}</span>
                          <span className="text-[9px] px-2 py-0.5 bg-white/5 rounded-full text-white/40 font-normal inline-block w-fit">
                             {device.power}W
                          </span>
                        </h3>
                        <p className="text-[9px] text-white/30 italic truncate mt-0.5">الاستهلاك لكل جهاز</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                      <button onClick={() => updateDevice(device, -1)} className="p-1.5 md:p-2 bg-white/5 rounded-full hover:bg-white/10 shrink-0"><Minus size={14} className="md:w-4 md:h-4" /></button>
                      <span className="w-5 md:w-6 text-center font-bold text-base md:text-lg shrink-0">{selected?.count || 0}</span>
                      <button onClick={() => updateDevice(device, 1)} className="p-1.5 md:p-2 bg-emerald-500/20 text-emerald-400 rounded-full hover:bg-emerald-500/30 shrink-0"><Plus size={14} className="md:w-4 md:h-4"/></button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {selected && selected.count > 0 && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 border-t border-white/5">
                          <div className="flex justify-between items-center mb-2">
                             <span className="text-[10px] text-white/30 uppercase tracking-widest">عدد ساعات التشغيل</span>
                             <span className="text-xs font-bold text-emerald-400">{selected.hours} ساعة</span>
                          </div>
                          <input 
                            type="range" min="1" max="24" step="1"
                            value={selected.hours}
                            onChange={(e) => updateHours(device.id, parseInt(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Requirements Output Layer */}
        <div className="space-y-4 pb-12">
          <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest px-1">المتطلبات المقدرة</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
              <Sun className="text-yellow-400 mb-4" size={24} />
              <div className="text-2xl font-black text-white">{stats.panelsCount}</div>
              <div className="text-[10px] text-white/30 uppercase">عدد الألواح (545W)</div>
            </div>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
              <Battery className="text-emerald-400 mb-4" size={24} />
              <div className="text-2xl font-black text-white">{stats.batteriesCount}</div>
              <div className="text-[10px] text-white/30 uppercase">عدد البطاريات (200Ah)</div>
            </div>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
              <Zap className="text-blue-400 mb-4" size={24} />
              <div className="text-2xl font-black text-white">{stats.inverterKva} kVA</div>
              <div className="text-[10px] text-white/30 uppercase">حجم الإنفرتر</div>
            </div>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
              <div className="h-6 w-6 text-orange-400 mb-4 flex items-center justify-center font-bold">{(stats.dailyWh / 1000).toFixed(1)}</div>
              <div className="text-xl font-bold text-white">kW/h</div>
              <div className="text-[10px] text-white/30 uppercase">إجمالي الاستهلاك اليومي</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
