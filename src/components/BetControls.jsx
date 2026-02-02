import { motion } from 'framer-motion';
import { useState } from 'react';

const BetControls = ({
  bet,
  onBetChange,
  balance,
  onPlay,
  multiplier,
  loading,
  disabled,
  maxBet,
  minBet = 1,
  showMultiplier = false
}) => {
  const [focused, setFocused] = useState(false);

  const handleBetInput = (e) => {
    let value = parseFloat(e.target.value) || 0;
    value = Math.max(minBet, Math.min(maxBet, value));
    onBetChange(value);
  };

  const quickBet = (amount) => {
    const newBet = Math.max(minBet, Math.min(maxBet, amount));
    onBetChange(newBet);
  };

  const canPlay = bet > 0 && bet <= balance && !loading && !disabled;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Bet Input */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Bet Amount
        </label>
        <div className={`relative rounded-lg border-2 transition ${
          focused
            ? 'border-casino-cyan bg-casino-bg'
            : 'border-casino-border bg-casino-bg'
        }`}>
          <input
            type="number"
            value={bet}
            onChange={handleBetInput}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            className="w-full px-4 py-3 bg-transparent text-lg font-bold text-casino-cyan outline-none placeholder-gray-500"
            placeholder="0.00"
            min={minBet}
            max={maxBet}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
            $
          </span>
        </div>
      </div>

      {/* Quick Bets */}
      <div className="grid grid-cols-4 gap-2">
        {[10, 50, 100, 500].map(amount => (
          <button
            key={amount}
            onClick={() => quickBet(amount)}
            disabled={disabled || amount > maxBet}
            className="py-2 px-2 rounded-lg bg-casino-bg border border-casino-border hover:border-casino-cyan hover:bg-casino-border disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-gray-300 hover:text-white transition"
          >
            ${amount}
          </button>
        ))}
      </div>

      {/* Range Slider */}
      <div className="space-y-2">
        <input
          type="range"
          min={minBet}
          max={maxBet}
          value={bet}
          onChange={e => onBetChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-casino-border rounded-lg appearance-none cursor-pointer accent-casino-cyan"
        />
        <div className="flex justify-between text-xs text-gray-500 font-semibold">
          <span>Min: ${minBet}</span>
          <span>Max: ${maxBet}</span>
        </div>
      </div>

      {/* Balance & Info */}
      <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-casino-bg border border-casino-border">
        <div>
          <div className="text-xs text-gray-400 font-semibold uppercase">Balance</div>
          <div className="text-lg font-bold text-casino-cyan">${balance.toFixed(2)}</div>
        </div>
        {showMultiplier && multiplier && (
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase">Multiplier</div>
            <div className="text-lg font-bold text-casino-cyan">{multiplier}x</div>
          </div>
        )}
      </div>

      {/* Play Button */}
      <motion.button
        onClick={onPlay}
        disabled={!canPlay}
        whileHover={canPlay ? { scale: 1.02 } : {}}
        whileTap={canPlay ? { scale: 0.98 } : {}}
        className={`w-full py-3 px-4 rounded-lg font-bold text-lg uppercase tracking-wider transition ${
          canPlay
            ? 'bg-gradient-to-r from-casino-cyan to-blue-500 hover:brightness-110 text-casino-bg shadow-lg shadow-casino-cyan/50'
            : 'bg-casino-border text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? 'Playing...' : 'Play'}
      </motion.button>

      {/* Error Messages */}
      {bet > balance && (
        <div className="text-sm text-red-400 font-semibold text-center">
          ⚠️ Insufficient balance
        </div>
      )}
      {bet < minBet && bet > 0 && (
        <div className="text-sm text-yellow-400 font-semibold text-center">
          ⚠️ Minimum bet: ${minBet}
        </div>
      )}
    </motion.div>
  );
};

export default BetControls;
