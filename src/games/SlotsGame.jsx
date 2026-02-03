import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

// 5 Completely different slot machines
const MACHINES = {
  classic: {
    name: 'Classic Fruits',
    reels: 3,
    rows: 1,
    symbols: ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '7️⃣'],
    paylines: [[0, 0, 0]], // Single line
    payouts: { '🍒': 2, '🍋': 3, '🍊': 4, '🍇': 5, '🔔': 8, '⭐': 15, '7️⃣': 50 },
    color: '#ff4444'
  },
  egypt: {
    name: 'Egyptian Gold',
    reels: 5,
    rows: 3,
    symbols: ['🏺', '🪲', '👁️', '🐍', '🌙', '☀️', '👑'],
    paylines: [[1,1,1,1,1], [0,0,0,0,0], [2,2,2,2,2], [0,1,2,1,0], [2,1,0,1,2]],
    payouts: { '🏺': 2, '🪲': 3, '👁️': 4, '🐍': 5, '🌙': 8, '☀️': 15, '👑': 100 },
    color: '#ffd700'
  },
  space: {
    name: 'Space Adventure',
    reels: 4,
    rows: 2,
    symbols: ['🌍', '🚀', '🛸', '👾', '⭐', '🌙', '🪐'],
    paylines: [[0,0,0,0], [1,1,1,1], [0,1,1,0], [1,0,0,1]],
    payouts: { '🌍': 2, '🚀': 4, '🛸': 6, '👾': 8, '⭐': 12, '🌙': 20, '🪐': 75 },
    color: '#a855f7'
  },
  ocean: {
    name: 'Ocean Treasure',
    reels: 3,
    rows: 3,
    symbols: ['🐚', '🦀', '🐙', '🐠', '🦈', '💎', '🧜‍♀️'],
    paylines: [[1,1,1], [0,0,0], [2,2,2], [0,1,2], [2,1,0], [0,0,1], [2,2,1]],
    payouts: { '🐚': 1, '🦀': 2, '🐙': 3, '🐠': 5, '🦈': 10, '💎': 25, '🧜‍♀️': 60 },
    color: '#00d4ff'
  },
  vegas: {
    name: 'Vegas Nights',
    reels: 5,
    rows: 1,
    symbols: ['💵', '💰', '💳', '🎰', '🃏', '💎', '🏆'],
    paylines: [[0,0,0,0,0]],
    payouts: { '💵': 1, '💰': 2, '💳': 3, '🎰': 5, '🃏': 10, '💎': 30, '🏆': 150 },
    color: '#ff00ff'
  }
};

export default function SlotsGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [machineId, setMachineId] = useState('classic');
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [winLines, setWinLines] = useState([]);
  const spinRefs = useRef([]);

  const machine = MACHINES[machineId];

  // Initialize reels
  useEffect(() => {
    const initial = [];
    for (let r = 0; r < machine.reels; r++) {
      const reel = [];
      for (let row = 0; row < machine.rows; row++) {
        reel.push(machine.symbols[Math.floor(Math.random() * machine.symbols.length)]);
      }
      initial.push(reel);
    }
    setReels(initial);
    setWinLines([]);
    setResult(null);
  }, [machineId, machine.reels, machine.rows, machine.symbols]);

  const spin = useCallback(() => {
    if (spinning || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'slots')) return;

    setSpinning(true);
    setResult(null);
    setWinLines([]);
    audio.playBet();

    // Generate final results
    const finalReels = [];
    for (let r = 0; r < machine.reels; r++) {
      const reel = [];
      for (let row = 0; row < machine.rows; row++) {
        reel.push(machine.symbols[Math.floor(Math.random() * machine.symbols.length)]);
      }
      finalReels.push(reel);
    }

    // Animate each reel
    const animateReel = (reelIdx, callback) => {
      let ticks = 0;
      const maxTicks = 15 + reelIdx * 5;

      const tick = () => {
        ticks++;

        // Random symbols while spinning
        setReels(prev => {
          const newReels = [...prev];
          const reel = [];
          for (let row = 0; row < machine.rows; row++) {
            if (ticks >= maxTicks) {
              reel.push(finalReels[reelIdx][row]);
            } else {
              reel.push(machine.symbols[Math.floor(Math.random() * machine.symbols.length)]);
            }
          }
          newReels[reelIdx] = reel;
          return newReels;
        });

        if (ticks < maxTicks) {
          if (ticks % 3 === 0) audio.playTick();
          spinRefs.current[reelIdx] = setTimeout(tick, 60);
        } else {
          callback();
        }
      };

      setTimeout(tick, reelIdx * 200);
    };

    // Animate all reels
    let completedReels = 0;
    for (let r = 0; r < machine.reels; r++) {
      animateReel(r, () => {
        completedReels++;
        if (completedReels === machine.reels) {
          // Check wins
          setTimeout(() => checkWins(finalReels), 200);
        }
      });
    }
  }, [spinning, bet, state.balance, machine, placeBet]);

  const checkWins = (finalReels) => {
    setSpinning(false);
    let totalWin = 0;
    const wins = [];

    // Check each payline
    machine.paylines.forEach((line, lineIdx) => {
      const symbols = line.map((row, reelIdx) => finalReels[reelIdx][row]);

      // Check for matches (3+ of same symbol from left)
      let matchCount = 1;
      const firstSym = symbols[0];

      for (let i = 1; i < symbols.length; i++) {
        if (symbols[i] === firstSym) matchCount++;
        else break;
      }

      if (matchCount >= 3 || (machine.reels === 3 && matchCount === 3)) {
        const payout = machine.payouts[firstSym] || 1;
        const lineWin = bet * payout * (matchCount >= 4 ? 2 : 1) * (matchCount >= 5 ? 2 : 1);
        totalWin += lineWin;
        wins.push({ lineIdx, symbol: firstSym, count: matchCount });
      }
    });

    setWinLines(wins.map(w => w.lineIdx));

    if (totalWin > 0) {
      addWin(totalWin, bet, 'slots', totalWin / bet);
      audio.playWin();
      setResult({ won: true, amount: totalWin, profit: totalWin - bet });
    } else {
      addWin(0, bet, 'slots', 0);
      audio.playLose();
      setResult({ won: false, amount: 0, profit: -bet });
    }

    setHistory(h => [{ won: totalWin > 0, amount: totalWin }, ...h.slice(0, 9)]);
  };

  useEffect(() => {
    return () => spinRefs.current.forEach(ref => clearTimeout(ref));
  }, []);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        {/* Machine name */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-black" style={{ color: machine.color }}>
            {machine.name}
          </h2>
          <div className="text-sm text-gray-500">
            {machine.reels} Reels × {machine.rows} Rows • {machine.paylines.length} Paylines
          </div>
        </div>

        {/* Slot machine */}
        <div className="rounded-2xl p-6 border-4" style={{
          borderColor: machine.color + '60',
          background: `linear-gradient(180deg, ${machine.color}10, transparent)`
        }}>
          {/* Reels container */}
          <div className="flex justify-center gap-2 p-4 bg-black/50 rounded-xl">
            {reels.map((reel, reelIdx) => (
              <div key={reelIdx} className="flex flex-col gap-1">
                {reel.map((symbol, rowIdx) => (
                  <div key={rowIdx}
                    className={`w-16 h-16 rounded-lg flex items-center justify-center text-4xl transition-all ${
                      spinning ? 'animate-pulse' : ''
                    }`}
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      border: `2px solid ${machine.color}40`,
                      boxShadow: winLines.some(l => machine.paylines[l][reelIdx] === rowIdx)
                        ? `0 0 20px ${machine.color}` : 'none'
                    }}>
                    {symbol}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Paylines indicator */}
          <div className="text-center mt-4 text-sm text-gray-400">
            {winLines.length > 0 && (
              <span style={{ color: machine.color }}>
                {winLines.length} winning line{winLines.length > 1 ? 's' : ''}!
              </span>
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="text-center mt-4">
            <div className={`text-4xl font-black ${result.won ? 'text-yellow-400' : 'text-gray-500'}`}>
              {result.won ? `WIN $${result.amount.toFixed(2)}` : 'NO WIN'}
            </div>
          </div>
        )}

        {/* Spin button */}
        <div className="flex justify-center mt-6">
          <button onClick={spin} disabled={spinning}
            className="px-16 py-4 rounded-xl font-black text-xl text-white transition-all disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${machine.color}, ${machine.color}80)` }}>
            {spinning ? 'SPINNING...' : 'SPIN'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} onPlay={spin} disabled={spinning} buttonText="SPIN" />

        {/* Machine selection */}
        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-3">Select Machine</div>
          <div className="space-y-2">
            {Object.entries(MACHINES).map(([id, m]) => (
              <button key={id} onClick={() => !spinning && setMachineId(id)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  machineId === id ? 'border-2' : 'border border-gray-700/50'
                }`}
                style={machineId === id ? { borderColor: m.color, backgroundColor: m.color + '15' } : {}}>
                <div className="font-bold" style={{ color: machineId === id ? m.color : '#fff' }}>
                  {m.name}
                </div>
                <div className="text-xs text-gray-500">
                  {m.reels}×{m.rows} • {m.paylines.length} lines • Max {Math.max(...Object.values(m.payouts))}x
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payouts */}
        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Payouts (3+ match)</div>
          <div className="grid grid-cols-2 gap-1 text-sm">
            {machine.symbols.map((s, i) => (
              <div key={i} className="flex justify-between px-2 py-1 bg-gray-800/30 rounded">
                <span className="text-xl">{s}</span>
                <span style={{ color: machine.color }}>{machine.payouts[s]}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
