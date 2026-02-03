import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

// 5 Slot machines with different VOLATILITY (not just themes)
// Low volatility = frequent small wins, High volatility = rare big wins
const MACHINES = {
  classic: {
    name: 'Classic',
    volatility: 'Low',
    symbols: ['🍒', '🍋', '🍊', '🔔', '⭐', '7️⃣'],
    weights: [30, 25, 20, 15, 8, 2], // Higher = more common
    payouts: { '🍒🍒🍒': 3, '🍋🍋🍋': 4, '🍊🍊🍊': 5, '🔔🔔🔔': 10, '⭐⭐⭐': 25, '7️⃣7️⃣7️⃣': 50 },
    bgColor: 'from-red-900/50 to-red-950/50'
  },
  gems: {
    name: 'Gems',
    volatility: 'Medium',
    symbols: ['💎', '💠', '🔷', '🔶', '⬜', '🟣'],
    weights: [5, 10, 20, 25, 25, 15],
    payouts: { '💎💎💎': 100, '💠💠💠': 40, '🔷🔷🔷': 15, '🔶🔶🔶': 8, '⬜⬜⬜': 4, '🟣🟣🟣': 6 },
    bgColor: 'from-purple-900/50 to-purple-950/50'
  },
  space: {
    name: 'Space',
    volatility: 'High',
    symbols: ['🚀', '👽', '🌟', '🪐', '☄️', '🛸'],
    weights: [2, 5, 15, 25, 28, 25],
    payouts: { '🚀🚀🚀': 200, '👽👽👽': 75, '🌟🌟🌟': 20, '🪐🪐🪐': 8, '☄️☄️☄️': 4, '🛸🛸🛸': 6 },
    bgColor: 'from-blue-900/50 to-slate-950/50'
  },
  egypt: {
    name: 'Egypt',
    volatility: 'Very High',
    symbols: ['👑', '🐍', '🏺', '🔱', '💀', '🪲'],
    weights: [1, 4, 10, 20, 30, 35],
    payouts: { '👑👑👑': 500, '🐍🐍🐍': 100, '🏺🏺🏺': 30, '🔱🔱🔱': 12, '💀💀💀': 5, '🪲🪲🪲': 3 },
    bgColor: 'from-yellow-900/50 to-amber-950/50'
  },
  jackpot: {
    name: 'Jackpot',
    volatility: 'Extreme',
    symbols: ['💰', '💵', '💴', '💶', '💷', '🪙'],
    weights: [1, 2, 8, 20, 30, 39],
    payouts: { '💰💰💰': 1000, '💵💵💵': 150, '💴💴💴': 40, '💶💶💶': 15, '💷💷💷': 6, '🪙🪙🪙': 2 },
    bgColor: 'from-green-900/50 to-emerald-950/50'
  }
};

export default function SlotsGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [machineId, setMachineId] = useState('classic');
  const [reels, setReels] = useState(['🍒', '🍋', '🍊']);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const machine = MACHINES[machineId];

  const getWeightedSymbol = () => {
    const total = machine.weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (let i = 0; i < machine.weights.length; i++) {
      rand -= machine.weights[i];
      if (rand <= 0) return machine.symbols[i];
    }
    return machine.symbols[0];
  };

  const spin = useCallback(() => {
    if (spinning || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'slots')) return;

    setSpinning(true);
    setResult(null);
    audio.playBet();

    // Generate final symbols using weights
    const finals = [getWeightedSymbol(), getWeightedSymbol(), getWeightedSymbol()];
    const duration = state.settings.fastMode ? 1000 : 2000;

    // Animate
    let frame = 0;
    const maxFrames = state.settings.fastMode ? 20 : 40;
    const animate = () => {
      if (frame < maxFrames) {
        setReels([
          frame < maxFrames * 0.6 ? machine.symbols[Math.floor(Math.random() * machine.symbols.length)] : finals[0],
          frame < maxFrames * 0.75 ? machine.symbols[Math.floor(Math.random() * machine.symbols.length)] : finals[1],
          frame < maxFrames * 0.9 ? machine.symbols[Math.floor(Math.random() * machine.symbols.length)] : finals[2]
        ]);
        frame++;
        setTimeout(animate, duration / maxFrames);
      } else {
        setReels(finals);
        setSpinning(false);

        // Check win
        const key = finals.join('');
        const mult = machine.payouts[key] || 0;
        const winAmount = bet * mult;

        setResult({ symbols: finals, mult, win: winAmount });
        setHistory(h => [{ mult, win: mult > 0 }, ...h.slice(0, 4)]);

        if (mult > 0) {
          addWin(winAmount, bet, 'slots', mult);
          audio.playWin();
        } else {
          addWin(0, bet, 'slots', 0);
          audio.playLose();
        }
      }
    };
    animate();
  }, [spinning, bet, state.balance, machine, state.settings.fastMode, placeBet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  return (
    <div className="h-full flex gap-3">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-[#0a0a12] rounded-xl p-3 flex flex-col items-center justify-center">
        {/* Machine Display */}
        <div className={`bg-gradient-to-b ${machine.bgColor} rounded-2xl p-4 border-2 border-yellow-600/50 w-full max-w-xs`}>
          <div className="text-center text-yellow-400 font-black text-lg mb-2">{machine.name}</div>
          <div className="text-center text-xs text-gray-400 mb-3">Volatility: {machine.volatility}</div>

          {/* Reels */}
          <div className="flex justify-center gap-2 bg-black/50 rounded-xl p-3">
            {reels.map((sym, i) => (
              <div key={i} className={`w-16 h-16 flex items-center justify-center text-4xl bg-gray-900 rounded-lg border-2 border-gray-700 ${spinning ? 'animate-pulse' : ''}`}>
                {sym}
              </div>
            ))}
          </div>

          {/* Payline indicator */}
          <div className="flex justify-center mt-2">
            <div className="h-1 w-48 bg-yellow-500 rounded-full" />
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-4 text-center py-2 px-6 rounded-xl ${result.mult > 0 ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <span className={`text-xl font-black ${result.mult > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {result.mult > 0 ? `${result.mult}x WIN! +$${(result.win - bet).toFixed(2)}` : 'NO WIN'}
            </span>
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-64 flex flex-col gap-2">
        <div className="bg-[#0a0a12] rounded-xl p-3 flex-1 flex flex-col gap-2">
          {/* Machine Select */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Machine</label>
            <div className="grid grid-cols-1 gap-1 mt-1 max-h-32 overflow-y-auto">
              {Object.entries(MACHINES).map(([id, m]) => (
                <button
                  key={id}
                  onClick={() => !spinning && setMachineId(id)}
                  disabled={spinning}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold text-left flex justify-between items-center ${
                    machineId === id ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <span>{m.name}</span>
                  <span className={`text-[10px] ${
                    m.volatility === 'Low' ? 'text-green-400' :
                    m.volatility === 'Medium' ? 'text-yellow-400' :
                    m.volatility === 'High' ? 'text-orange-400' :
                    m.volatility === 'Very High' ? 'text-red-400' : 'text-pink-400'
                  }`}>{m.volatility}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Paytable */}
          <div className="bg-black/30 rounded-lg p-2 text-xs max-h-24 overflow-y-auto">
            <div className="text-gray-500 uppercase mb-1">Paytable</div>
            {Object.entries(machine.payouts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([combo, mult]) => (
              <div key={combo} className="flex justify-between">
                <span>{combo}</span>
                <span className="text-green-400">{mult}x</span>
              </div>
            ))}
          </div>

          {/* Bet */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Bet Amount</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={bet}
                onChange={(e) => handleBetChange(Number(e.target.value))}
                disabled={spinning}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-white"
              />
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              <button onClick={() => handleBetChange(1)} disabled={spinning} className="btn-secondary py-1 text-xs">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={spinning} className="btn-secondary py-1 text-xs">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={spinning} className="btn-secondary py-1 text-xs">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={spinning} className="btn-secondary py-1 text-xs">MAX</button>
            </div>
          </div>

          {/* Spin Button */}
          <button
            onClick={spin}
            disabled={spinning || bet <= 0 || bet > state.balance}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
          >
            {spinning ? 'SPINNING...' : 'SPIN'}
          </button>

          {/* History */}
          {history.length > 0 && (
            <div className="flex gap-1">
              {history.map((h, i) => (
                <span key={i} className={`px-2 py-1 rounded text-xs font-bold ${h.win ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {h.mult > 0 ? `${h.mult}x` : '0'}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
