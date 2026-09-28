import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl border border-white/10 hover:border-cyan-400/40 bg-slate-800/60 dark:bg-slate-800/80 text-cyan-400 hover:text-cyan-300 transition-all duration-200"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-purple-400" />}
    </button>
  );
};

export default ThemeToggle;
