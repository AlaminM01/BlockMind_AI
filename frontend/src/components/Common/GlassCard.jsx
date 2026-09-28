import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', hover = true, glow = false, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        relative rounded-2xl backdrop-blur-xl
        bg-slate-900/60 dark:bg-slate-900/70 light:bg-white/80
        border border-white/10 dark:border-cyan-500/20 light:border-slate-200
        ${hover ? 'hover:border-cyan-400/40 transition-all duration-300' : ''}
        ${glow ? 'shadow-glow-cyan' : 'shadow-xl'}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
