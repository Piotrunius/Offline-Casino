import { motion } from 'framer-motion';
import { Download, Home, RefreshCw, Upload, Volume2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useCasino } from '../../context/CasinoContext';
import audioEngine from '../../utils/audioEngine';

const SettingsModal = ({ onClose }) => {
  const { state, updateSettings, resetStats, setBalance, exportProgress, importProgress, setCurrentGame } = useCasino();
  const [settings, setSettings] = useState(state.settings);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    updateSettings({ [key]: value });
    if (key === 'soundVolume') audioEngine.setSoundVolume(value);
    else if (key === 'soundEnabled') audioEngine.setSoundEnabled(value);
  };

  const handleReset = () => {
    if (confirm('Reset all statistics?')) resetStats();
  };

  const handleResetBalance = () => {
    if (confirm('Reset balance to $500?')) setBalance(500);
  };

  const handleExport = () => exportProgress();
  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const success = importProgress(content);
        if (success) {
          setImportSuccess(true);
          setTimeout(() => { onClose(); window.location.reload(); }, 1000);
        } else {
          setImportError('Invalid save file');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-casino-card border border-casino-border rounded-2xl overflow-hidden w-full max-w-2xl">
      <div className="flex items-center justify-between p-4 border-b border-casino-border">
        <h2 className="font-bold text-xl">Settings</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <button
            onClick={() => { setCurrentGame(null); onClose(); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-casino-cyan text-casino-bg font-bold hover:brightness-110 transition"
          >
            <Home className="w-5 h-5" />
            Dashboard
          </button>

          <div className="bg-casino-bg rounded-xl p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase text-casino-cyan mb-3">
              <Volume2 className="w-4 h-4" />
              Sound
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Sound Effects</span>
                <ToggleSwitch checked={settings.soundEnabled} onChange={(val) => handleChange('soundEnabled', val)} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Volume</span>
                  <span className="text-sm text-casino-cyan">{Math.round(settings.soundVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.soundVolume}
                  onChange={(e) => handleChange('soundVolume', parseFloat(e.target.value))}
                  className="w-full accent-casino-cyan"
                  disabled={!settings.soundEnabled}
                />
              </div>
            </div>
          </div>

          <div className="bg-casino-bg rounded-xl p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase text-casino-red mb-3">
              <RefreshCw className="w-4 h-4" />
              Reset
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleResetBalance}
                className="px-3 py-2 rounded-lg border border-casino-border text-gray-400 hover:bg-white/5 hover:text-white transition text-sm"
              >
                Reset Balance
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-2 rounded-lg border border-casino-red text-casino-red hover:bg-casino-red hover:text-white transition text-sm"
              >
                Reset Stats
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-casino-bg rounded-xl p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase text-casino-green mb-3">
              <Download className="w-4 h-4" />
              Backup & Restore
            </h3>
            <p className="text-xs text-gray-500 mb-3">Export or import your progress.</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-casino-green text-white hover:brightness-110 transition text-sm font-bold"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleImportClick}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-casino-cyan text-casino-cyan hover:bg-casino-cyan hover:text-casino-bg transition text-sm font-bold"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <input ref={fileInputRef} type="file" accept=".dat,.txt" onChange={handleImportFile} className="hidden" />
            </div>
            {importError && <div className="mt-2 p-2 rounded-lg bg-casino-red/20 text-casino-red text-xs">{importError}</div>}
            {importSuccess && <div className="mt-2 p-2 rounded-lg bg-casino-green/20 text-casino-green text-xs">Progress restored!</div>}
          </div>

          <div className="bg-casino-bg rounded-xl p-4">
            <h3 className="text-sm font-bold uppercase text-casino-gold mb-3">Your Stats</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Bets</span>
                <span className="text-white font-bold">{state.stats.totalBets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Win Rate</span>
                <span className="text-casino-cyan font-bold">{state.stats.winRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Wagered</span>
                <span className="text-white font-bold">${state.stats.totalWagered.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Net Profit</span>
                <span className={`font-bold ${state.stats.netProfit >= 0 ? 'text-casino-green' : 'text-casino-red'}`}>
                  {state.stats.netProfit >= 0 ? '+' : ''}${state.stats.netProfit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-600">Casino v1.0</div>
        </div>
      </div>
    </div>
  );
};

const ToggleSwitch = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-casino-cyan' : 'bg-casino-border'}`}
  >
    <motion.div
      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
      animate={{ left: checked ? 24 : 4 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  </button>
);

export default SettingsModal;
