import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Cpu, Sliders, Database, Save, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import * as api from '../../services/api';

const SettingsModal = () => {
  const { isSettingsOpen, setIsSettingsOpen, settings, setSettings, showToast, refreshHealth } =
    useApp();

  const [formData, setFormData] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isSettingsOpen) {
      api.getSettings().then((data) => {
        setFormData(data);
      });
    }
  }, [isSettingsOpen]);

  if (!isSettingsOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateSettings(formData);
      setSettings(formData);
      await refreshHealth();
      showToast('Settings saved successfully', 'success');
      setIsSettingsOpen(false);
    } catch (err) {
      showToast('Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-cyan-500/30 p-6 shadow-glow-cyan text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-white">System & Model Configuration</h3>
            </div>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4 pt-4">
            {/* Ollama Base URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ollama Endpoint URL
              </label>
              <input
                type="text"
                value={formData.ollama_base_url}
                onChange={(e) =>
                  setFormData({ ...formData, ollama_base_url: e.target.value })
                }
                placeholder="http://localhost:11434"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Local LLM Model
              </label>
              <select
                value={formData.ollama_model}
                onChange={(e) =>
                  setFormData({ ...formData, ollama_model: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50"
              >
                {(formData.available_models || [
                  'qwen2.5:1.5b',
                  'deepseek-r1:1.5b',
                  'deepseek-r1:7b',
                  'qwen2.5:0.5b',
                  'phi3:mini',
                  'llama3.2:3b',
                  'mistral:latest'
                ]).map((m) => (
                  <option key={m} value={m}>
                    {m} {m.includes('deepseek') ? '🧠 (Reasoning Model)' : m.includes('0.5b') ? '⚡ (Ultra Low RAM)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Fast default: <code className="text-cyan-400">qwen2.5:1.5b</code> | Reasoning: <code className="text-purple-400">deepseek-r1:1.5b</code> | Ultra-low RAM (4GB): <code className="text-emerald-400">qwen2.5:0.5b</code>
              </p>
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Sampling Temperature</span>
                <span className="font-mono text-cyan-400">{formData.temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={formData.temperature}
                onChange={(e) =>
                  setFormData({ ...formData, temperature: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">
                Lower values (0.1 - 0.3) provide strict adherence to retrieved blockchain texts.
              </span>
            </div>

            {/* Top-K Chunks Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Top-K Retrieved Context Chunks</span>
                <span className="font-mono text-cyan-400">{formData.similarity_top_k || 4}</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={formData.similarity_top_k || 4}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    similarity_top_k: parseInt(e.target.value),
                  })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-bold text-xs shadow-glow-cyan transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SettingsModal;
