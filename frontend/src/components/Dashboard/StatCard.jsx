import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'cyan' }) => {
  const colorMap = {
    cyan: 'border-cyan-500/20 text-primary bg-cyan-500/10 shadow-glow-cyan',
    purple: 'border-purple-500/20 text-purple-400 bg-purple-500/10 shadow-glow-purple',
    green: 'border-accent/20 text-accent bg-accent/10 shadow-glow-accent',
    amber: 'border-amber-500/20 text-amber-400 bg-amber-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-cyan-500/30 backdrop-blur-xl transition-all duration-300 shadow-xl"
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border ${colorMap[color] || colorMap.cyan}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl sm:text-3xl font-black text-white font-mono">{value}</h3>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </motion.div>
  );
};

export default StatCard;
