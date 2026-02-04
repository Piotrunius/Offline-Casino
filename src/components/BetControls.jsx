import { useEffect } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

export default function BetControls({
  bet,
  setBet,
  disabled = false,
  showMultiplier = false,
  multiplier = 1,
  winAmount = 0,
  children
}) {
  const { state, setGlobalBet } = useCasino();

  // Sync with global bet on mount and when global bet changes
  useEffect(() => {
    if (state.globalBet && !disabled) {
      setBet(Math.min(state.globalBet, state.balance));
    }
  }, [state.globalBet]);

  const handleBetChange = (value) => {
    const numValue = parseFloat(value) || 0;
    const newBet = Math.min(Math.max(0, numValue), state.balance);
    setBet(newBet);
    setGlobalBet(newBet); // Sync to global
    audio.playClick();
  };

  const handleMultiply = (factor) => {
    const newBet = Math.min(bet * factor, state.balance);
    const finalBet = Math.max(0.01, newBet);
    setBet(finalBet);
    setGlobalBet(finalBet); // Sync to global
    audio.playClick();
  };

  const handleMin = () => {
    setBet(1);
    setGlobalBet(1);
    audio.playClick();
  };

  const handleMax = () => {
    setBet(state.balance);
    setGlobalBet(state.balance);
    audio.playClick();
  };

  const handleAuto5Percent = () => {
    const autoBet = Math.floor(state.balance * 0.05) || 1;
    setBet(autoBet);
    setGlobalBet(autoBet);
    audio.playClick();
  };

  return (
    <div className="game-card p-5 space-y-5 animate-fade-in-up">
      {/* Bet Amount */}
      <div className="space-y-2">
        <label className="flex items-center justify-between text-sm animate-slide-in-left">
          <span className="text-gray-400 uppercase tracking-wider font-medium">Bet Amount</span>
          <span className="text-gray-500 animate-bounce-gentle">${state.balance.toFixed(2)} available</span>
        </label>
        <div className="relative animate-scale-in">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
          <input
            type="number"
            value={bet}
            onChange={(e) => handleBetChange(e.target.value)}
            className="input-field pl-8 pr-4 text-right text-lg number-mono"
            min="0"
            step="0.01"
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-5 gap-2">
          <button
            onClick={handleMin}
            disabled={disabled}
            className="btn-secondary py-2 text-xs font-semibold hover-scale stagger-item animate-fade-in"
          >
            MIN
          </button>
          <button
            onClick={() => handleMultiply(0.5)}
            disabled={disabled}
            className="btn-secondary py-2 text-xs font-semibold hover-scale stagger-item animate-fade-in"
          >
            1/2
          </button>
          <button
            onClick={handleAuto5Percent}
            disabled={disabled}
            className="btn-secondary py-2 text-xs font-semibold bg-cyan-900/30 hover:bg-cyan-800/40 text-cyan-400 hover-scale stagger-item animate-fade-in"
            title="Auto 5% of balance"
          >
            5%
          </button>
          <button
            onClick={() => handleMultiply(2)}
            disabled={disabled}
            className="btn-secondary py-2 text-xs font-semibold hover-scale stagger-item animate-fade-in"
          >
            2x
          </button>
          <button
            onClick={handleMax}
            disabled={disabled}
            className="btn-secondary py-2 text-xs font-semibold hover-scale stagger-item animate-fade-in"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Custom children (game-specific options) */}
      {children}

      {/* Multiplier & Win Display */}
      {showMultiplier && (
        <div className="grid grid-cols-2 gap-3 animate-scale-in">
          <div className="bg-black/40 rounded-xl p-3 hover-lift transition-smooth">
            <div className="text-xs text-gray-500 uppercase mb-1">Multiplier</div>
            <div className="text-xl font-bold text-cyan-400 number-mono animate-pulse-slow">{multiplier.toFixed(2)}x</div>
          </div>
          <div className="bg-black/40 rounded-xl p-3 hover-lift transition-smooth">
            <div className="text-xs text-gray-500 uppercase mb-1">Potential Win</div>
            <div className="text-xl font-bold text-green-400 number-mono animate-bounce-gentle">${winAmount.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Large bet warning indicator */}
      {bet > state.balance * 0.5 && (
        <div className="text-xs text-yellow-400 text-center bg-yellow-900/20 rounded-lg py-2 animate-wiggle border border-yellow-500/30">
          ⚠ Large bet ({((bet / state.balance) * 100).toFixed(0)}% of balance)
        </div>
      )}
    </div>
  );
}
