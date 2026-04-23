import React, { useState, useEffect } from 'react';
import { cn, handleFirestoreError } from '../lib/utils';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

interface Currency {
  name: string;
  price: string;
  change: string;
  isUp: boolean;
}

export const CurrencyTicker: React.FC = () => {
  const [rates, setRates] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'rates'), (doc) => {
      if (doc.exists()) {
        setRates(doc.data());
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, 'get', 'settings/rates');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const currencies = [
    { name: 'USD', ar: 'دولار أمريكي', price: (rates.usd || 600).toString(), change: rates.usdChange || 0 },
    { name: 'SAR', ar: 'ريال سعودي', price: (rates.sar || 160).toString(), change: rates.sarChange || 0 },
    { name: 'AED', ar: 'درهم إماراتي', price: (rates.aed || 163).toString(), change: rates.aedChange || 0 },
    { name: 'EUR', ar: 'يورو أوروبي', price: (rates.eur || 640).toString(), change: rates.eurChange || 0 },
  ];

  return (
    <div className="w-full relative">
      <div className="flex justify-between items-center mb-4 px-6 md:px-8">
        <h2 className="text-xs font-bold tracking-widest text-orange-400 uppercase">رادار العملات مباشر</h2>
        <div className="text-[10px] text-white/40">{loading ? 'جاري التحميل...' : 'تحديث: مباشر'}</div>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth px-6 md:px-8 pb-4">
        {currencies.map((curr) => (
          <div
            key={curr.name}
            className={cn(
              "min-w-[160px] p-5 flex flex-col items-start transition-all duration-500 group relative overflow-hidden shrink-0",
              "bg-[#0a0a0a]/60 backdrop-blur-2xl rounded-3xl",
              "border border-orange-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:border-orange-400/40 hover:shadow-[0_0_20px_rgba(249,115,22,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)]"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-3xl" />
            <div className="w-full flex justify-between items-start relative z-10">
              <span className="text-white font-bold text-[10px] uppercase">{curr.ar}</span>
              <span className={cn(
                "font-mono text-[10px]",
                curr.change >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {curr.change >= 0 ? '+' : ''}{curr.change}%
              </span>
            </div>
            <div className="text-3xl font-light mt-2 text-white">{curr.price}</div>
            <div className="text-[10px] text-white/30 mt-1">الجنيه السوداني</div>
          </div>
        ))}
        {/* Spacer for right edge padding on scroll */}
        <div className="min-w-[1px] shrink-0" />
      </div>
    </div>
  );
};
