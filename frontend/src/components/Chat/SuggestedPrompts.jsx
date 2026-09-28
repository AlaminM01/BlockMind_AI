import React from 'react';
import { Sparkles, Shield, Cpu, TrendingUp, Layers, Key } from 'lucide-react';

const SuggestedPrompts = ({ onSelectPrompt }) => {
  const prompts = [
    {
      title: 'Proof of Work & Double Spending',
      query: 'What is Proof of Work and how does it prevent the double spending problem?',
      icon: Shield,
      category: 'Bitcoin',
      color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10'
    },
    {
      title: 'EVM & Gas Mechanics',
      query: 'How does the Ethereum Virtual Machine (EVM) execute bytecode and calculate gas fees with EIP-1559?',
      icon: Cpu,
      category: 'Ethereum',
      color: 'border-purple-500/30 text-purple-400 bg-purple-500/10'
    },
    {
      title: 'Automated Market Makers (AMMs)',
      query: 'Explain the constant product invariant formula x * y = k in Uniswap and how impermanent loss occurs.',
      icon: TrendingUp,
      category: 'DeFi',
      color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
    },
    {
      title: 'Optimistic vs ZK Rollups',
      query: 'What is the difference between Optimistic Rollups and Zero-Knowledge (ZK) Rollups regarding fraud proofs and validity proofs?',
      icon: Layers,
      category: 'Layer 2',
      color: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
    },
    {
      title: 'Byzantine Fault Tolerance',
      query: 'How do Byzantine Fault Tolerant (BFT) consensus algorithms guarantee safety and liveness with 2/3 validator quorum?',
      icon: Key,
      category: 'Consensus',
      color: 'border-blue-500/30 text-blue-400 bg-blue-500/10'
    },
    {
      title: 'Flash Loans & Liquidations',
      query: 'What are Flash Loans in DeFi lending protocols, and how do liquidation thresholds and health factors operate?',
      icon: Sparkles,
      category: 'DeFi Lending',
      color: 'border-pink-500/30 text-pink-400 bg-pink-500/10'
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Suggested Blockchain Questions (Grounded in Books)
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {prompts.map((p, idx) => {
          const Icon = p.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(p.query)}
              className="group p-3.5 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/40 text-left transition-all duration-200 shadow-md hover:shadow-glow-cyan flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`p-1.5 rounded-lg border text-xs ${p.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  {p.category}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-2">
                {p.title}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedPrompts;
