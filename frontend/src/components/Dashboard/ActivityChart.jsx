import React from 'react';
import { Layers, PieChart } from 'lucide-react';

const ActivityChart = ({ distribution }) => {
  const topics = Object.entries(distribution || {});
  const total = topics.reduce((acc, curr) => acc + curr[1], 0) || 1;

  const colorPalettes = [
    'bg-cyan-500',
    'bg-purple-500',
    'bg-accent',
    'bg-amber-400',
    'bg-blue-400',
    'bg-pink-400'
  ];

  return (
    <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-xl shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-white">Blockchain Topic Query Distribution</h3>
        </div>
        <span className="text-xs font-mono text-slate-400">RAG Semantic Categories</span>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3 pt-2">
        {topics.map(([topic, count], idx) => {
          const percentage = Math.round((count / total) * 100);
          const barColor = colorPalettes[idx % colorPalettes.length];

          return (
            <div key={topic} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">{topic}</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {count} queries ({percentage}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.max(percentage, 4)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityChart;
