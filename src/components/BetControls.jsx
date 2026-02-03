import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

export default function BetControls({
  bet,
  setBet,
  onPlay,
  disabled = false,
  buttonText = 'BET',
  showMultiplier = false,
  multiplier = 1,
  winAmount = 0,
  children
}) {
  const { state } = useCasino();

  const handleBetChange = (value) => {
    const numValue = parseFloat(value) || 0;
    setBet(Math.min(Math.max(0, numValue), state.balance));
    audio.playClick();
  };

  const handleMultiply = (factor) => {
    const newBet = Math.min(bet * factor, state.balance);
    setBet(Math.max(0.01, newBet));
    audio.playClick();
  };

  const handleMin = () => {
    setBet(1);
    audio.playClick();
  };

  const handleMax = () => {
    setBet(state.balance);
    audio.playClick();
  };

  return (
    <div className="game-card p-5 space-y-5">
      {/* Bet Amount */}
      <div className="space-y-2">
        <label className="flex items-center justify-between text-sm">
          <span className="text-gray-400 uppercase tracking-wider font-medium">Bet Amount</span>
          <span className="text-gray-500">${state.balance.toFixed(2)} available</span>
        </label>
        <div className="relative">
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
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={handleMin}
            disabled={disabled}
            className="btn-secondary py-2 text-sm font-semibold"
          >
            MIN
          </button>
          <button
            onClick={() => handleMultiply(0.5)}
            disabled={disabled}
            className="btn-secondary py-2 text-sm font-semibold"
          >
            1/2
          </button>
          <button
            onClick={() => handleMultiply(2)}
            disabled={disabled}
            className="btn-secondary py-2 text-sm font-semibold"
          >
            2x
          </button>
          <button
            onClick={handleMax}
            disabled={disabled}
            className="btn-secondary py-2 text-sm font-semibold"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Custom children (game-specific options) */}
      {children}

      {/* Multiplier & Win Display */}
      {showMultiplier && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/40 rounded-xl p-3">
            <div className="text-xs text-gray-500 uppercase mb-1">Multiplier</div>
            <div className="text-xl font-bold text-cyan-400 number-mono">{multiplier.toFixed(2)}x</div>
          </div>
          <div className="bg-black/40 rounded-xl p-3">
            <div className="text-xs text-gray-500 uppercase mb-1">Potential Win</div>
            <div className="text-xl font-bold text-green-400 number-mono">${winAmount.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Play Button */}
      <button
        onClick={() => {
          audio.playBet();
          onPlay();
        }}
        disabled={disabled || bet <= 0 || bet > state.balance}
        className="btn-primary w-full py-4 text-lg"
      >
        {buttonText}
      </button>
    </div>
  );
}
