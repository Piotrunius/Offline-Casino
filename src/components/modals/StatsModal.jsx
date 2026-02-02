import { motion } from 'framer-motion';
import { BarChart3, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useCasino } from '../../context/CasinoContext';

const StatsModal = ({ isOpen, onClose }) => {
  const { state } = useCasino();

  if (!isOpen) return null;

  const stats = state.stats || {};
  const totalBets = stats.totalBets || 0;
  const totalWins = stats.totalWins || 0;
  const totalLosses = stats.totalLosses || 0;
  const biggestWin = stats.biggestWin || 0;
  const biggestLoss = stats.biggestLoss || 0;
  const winRate = totalBets > 0 ? ((totalWins / totalBets) * 100).toFixed(1) : 0;
  const profitLoss = totalWins - totalLosses;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
      >
        <div className="rounded-2xl bg-casino-card border border-casino-border overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="relative px-6 py-4 border-b border-casino-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-casino-cyan" />
              <h2 className="text-xl font-bold text-white">Your Stats</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-casino-border rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Overview Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-casino-bg border border-casino-border">
                <div className="text-xs text-gray-400 font-semibold uppercase">Total Bets</div>
                <div className="text-2xl font-bold text-casino-cyan">${totalBets.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-casino-bg border border-casino-border">
                <div className="text-xs text-gray-400 font-semibold uppercase">Win Rate</div>
                <div className="text-2xl font-bold text-casino-cyan">{winRate}%</div>
              </div>
            </div>

            {/* Profit/Loss */}
            <div className={`p-4 rounded-lg border ${
              profitLoss >= 0
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {profitLoss >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                <div className="text-xs text-gray-400 font-semibold uppercase">Net Profit/Loss</div>
              </div>
              <div className={`text-3xl font-bold ${
                profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {profitLoss >= 0 ? '+' : ''} ${profitLoss.toFixed(2)}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-casino-bg border border-casino-border">
                <div className="text-xs text-gray-400 font-semibold uppercase">Total Wins</div>
                <div className="text-xl font-bold text-green-400">${totalWins.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-casino-bg border border-casino-border">
                <div className="text-xs text-gray-400 font-semibold uppercase">Total Losses</div>
                <div className="text-xl font-bold text-red-400">${totalLosses.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-casino-bg border border-casino-border">
                <div className="text-xs text-gray-400 font-semibold uppercase">Biggest Win</div>
                <div className="text-xl font-bold text-green-400">${biggestWin.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-casino-bg border border-casino-border">
                <div className="text-xs text-gray-400 font-semibold uppercase">Biggest Loss</div>
                <div className="text-xl font-bold text-red-400">${biggestLoss.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-casino-border flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg bg-casino-cyan hover:brightness-110 text-casino-bg font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default StatsModal;
