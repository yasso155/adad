import React from 'react';
import { motion } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface DocumentViewerProps {
  title: string;
  content: string;
  onClose: () => void;
  lang: 'ar' | 'en';
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ title, content, onClose, lang }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[200] bg-[#050505] flex flex-col font-sans"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/50 hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={20} className={cn(lang === 'ar' ? "rotate-180" : "")} />
          </button>
          <h2 className="text-2xl font-black tracking-tighter italic uppercase">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/50 hover:bg-white/10 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 prose prose-invert prose-blue max-w-none no-scrollbar">
        <div className={cn(
          "markdown-body text-white/80 leading-relaxed",
          lang === 'ar' ? "font-arabic text-right" : "font-sans text-left"
        )}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
};
