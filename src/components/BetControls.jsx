import { useState } from 'react';

export default function BetControls({
  bet,
  setBet,
  onPlay,
  disabled,
  balance,
  buttonText = 'BET',
  children
}) {
  const [inputValue, setInputValue] = useState(bet.toString());

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setBet(Math.min(num, balance));
    }
  };

  const handleBlur = () => {
    const num = parseFloat(inputValue);
    if (isNaN(num) || num < 0) {
      setInputValue(bet.toString());
    } else {
      const clamped = Math.min(num, balance);
      setBet(clamped);
      setInputValue(clamped.toString());
    }
  };

  const quickBet = (multiplier) => {
    if (multiplier === 'max') {
      setBet(balance);
      setInputValue(balance.toString());
    } else if (multiplier === 'min') {
      setBet(1);
      setInputValue('1');
    } else {
      const newBet = Math.min(bet * multiplier, balance);
      setBet(newBet);
      setInputValue(newBet.toString());
    }
  };

  const canPlay = bet > 0 && bet <= balance && !disabled;

  return (
    <div className="bg-[#1a1a2e] rounded-xl p-4 space-y-4">
      {/* Bet Amount */}
      <div>
        <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Bet Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled}
            className="w-full bg-[#12121f] border border-[#2a2a45] rounded-lg pl-7 pr-4 py-3 text-white font-bold focus:border-cyan-500 focus:outline-none disabled:opacity-50 transition"
            placeholder="0.00"
            min="0"
            step="any"
          />
        </div>
      </div>

      {/* Quick Bet Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => quickBet('min')}
          disabled={disabled}
          className="bg-[#12121f] hover:bg-[#1f1f35] border border-[#2a2a45] rounded-lg py-2 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-50 transition"
        >
          MIN
        </button>
        <button
          onClick={() => quickBet(0.5)}
          disabled={disabled}
          className="bg-[#12121f] hover:bg-[#1f1f35] border border-[#2a2a45] rounded-lg py-2 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-50 transition"
        >
          ½
        </button>
        <button
          onClick={() => quickBet(2)}
          disabled={disabled}
          className="bg-[#12121f] hover:bg-[#1f1f35] border border-[#2a2a45] rounded-lg py-2 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-50 transition"
        >
          2×
        </button>
        <button
          onClick={() => quickBet('max')}
          disabled={disabled}
          className="bg-[#12121f] hover:bg-[#1f1f35] border border-[#2a2a45] rounded-lg py-2 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-50 transition"
        >
          MAX
        </button>
      </div>

      {/* Additional Controls */}
      {children}

      {/* Play Button */}
      <button
        onClick={onPlay}
        disabled={!canPlay}
        className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-wide transition ${
          canPlay
            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:brightness-110 shadow-lg shadow-cyan-500/25'
            : 'bg-[#2a2a45] text-gray-600 cursor-not-allowed'
        }`}
      >
        {disabled ? 'PLAYING...' : buttonText}
      </button>

      {/* Balance Display */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Balance:</span>
        <span className="text-cyan-400 font-bold">${balance.toFixed(2)}</span>
      </div>
    </div>
  );
}
