import { useCallback, useEffect, useRef, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '7️⃣', '💎', '🔔', '🍀'];

const PAYTABLE = {
  '7️⃣': { 3: 100, 4: 500, 5: 2500 },
  '💎': { 3: 50, 4: 200, 5: 1000 },
  '⭐': { 3: 25, 4: 100, 5: 500 },
  '🔔': { 3: 15, 4: 60, 5: 300 },
  '🍀': { 3: 15, 4: 60, 5: 300 },
  '🍇': { 3: 10, 4: 40, 5: 200 },
  '🍊': { 3: 8, 4: 30, 5: 150 },
  '🍋': { 3: 5, 4: 20, 5: 100 },
  '🍒': { 3: 3, 4: 12, 5: 50 },
};

const VOLATILITY = {
  low: { name: 'Low', weights: [15, 15, 15, 12, 10, 5, 10, 10, 8] },
  medium: { name: 'Medium', weights: [12, 12, 12, 12, 12, 8, 12, 12, 8] },
  high: { name: 'High', weights: [8, 8, 8, 10, 12, 12, 15, 15, 12] },
  extreme: { name: 'Extreme', weights: [5, 5, 5, 8, 15, 18, 18, 18, 8] },
  jackpot: { name: 'Jackpot', weights: [3, 3, 3, 5, 18, 22, 20, 20, 6] },
};

export default function SlotsGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [reelCount, setReelCount] = useState(5);
  const [rowCount, setRowCount] = useState(3);
  const [volatility, setVolatility] = useState('medium');
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [autoSpin, setAutoSpin] = useState(false);
  const autoSpinRef = useRef(false);

  useEffect(() => {
    initReels();
  }, [reelCount, rowCount]);

  useEffect(() => {
    autoSpinRef.current = autoSpin;
  }, [autoSpin]);

  const initReels = () => {
    const newReels = [];
    for (let r = 0; r < reelCount; r++) {
      const col = [];
      for (let row = 0; row < rowCount; row++) {
        col.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      }
      newReels.push(col);
    }
    setReels(newReels);
  };

  const weightedRandom = () => {
    const weights = VOLATILITY[volatility].weights;
    const total = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) return SYMBOLS[i];
    }
    return SYMBOLS[0];
  };

  const checkWins = (grid) => {
    let totalMult = 0;
    const winLines = [];

    // Check middle row for matching symbols
    const middleRow = Math.floor(rowCount / 2);
    const middleLine = grid.map(col => col[middleRow]);

    // Count consecutive matches from left
    let matchSymbol = middleLine[0];
    let matchCount = 1;
    for (let i = 1; i < middleLine.length; i++) {
      if (middleLine[i] === matchSymbol) {
        matchCount++;
      } else break;
    }

    if (matchCount >= 3 && PAYTABLE[matchSymbol] && PAYTABLE[matchSymbol][matchCount]) {
      totalMult += PAYTABLE[matchSymbol][matchCount];
      winLines.push({ symbol: matchSymbol, count: matchCount, mult: PAYTABLE[matchSymbol][matchCount] });
    }

    // Check top and bottom rows too
    for (const rowIdx of [0, rowCount - 1]) {
      if (rowIdx === middleRow) continue;
      const line = grid.map(col => col[rowIdx]);
      let sym = line[0];
      let cnt = 1;
      for (let i = 1; i < line.length; i++) {
        if (line[i] === sym) cnt++;
        else break;
      }
      if (cnt >= 3 && PAYTABLE[sym] && PAYTABLE[sym][cnt]) {
        totalMult += PAYTABLE[sym][cnt] * 0.5; // Side lines pay half
        winLines.push({ symbol: sym, count: cnt, mult: PAYTABLE[sym][cnt] * 0.5 });
      }
    }

    return { totalMult, winLines };
  };

  const spin = useCallback(() => {
    if (spinning || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'slots')) return;

    setSpinning(true);
    setResult(null);
    audio.playBet();

    let tick = 0;
    const maxTicks = 20;
    const interval = setInterval(() => {
      setReels(prev => prev.map(() => {
        const col = [];
        for (let row = 0; row < rowCount; row++) {
          col.push(weightedRandom());
        }
        return col;
      }));
      tick++;

      if (tick >= maxTicks) {
        clearInterval(interval);

        const finalReels = [];
        for (let r = 0; r < reelCount; r++) {
          const col = [];
          for (let row = 0; row < rowCount; row++) {
            col.push(weightedRandom());
          }
          finalReels.push(col);
        }
        setReels(finalReels);

        const { totalMult, winLines } = checkWins(finalReels);
        const winAmount = bet * totalMult;
        const won = totalMult > 0;

        setResult({ won, totalMult, winAmount, winLines });
        setHistory(h => [{ won, mult: totalMult }, ...h.slice(0, 7)]);
        setSpinning(false);

        addWin(winAmount, bet, 'slots', totalMult);
        if (won) audio.playWin();
        else audio.playLose();

        // Auto spin
        if (autoSpinRef.current && state.balance > bet) {
          setTimeout(() => spin(), 800);
        }
      }
    }, 60);
  }, [spinning, bet, state.balance, reelCount, rowCount, volatility, placeBet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const symbolSize = reelCount <= 3 ? 'text-6xl' : reelCount === 4 ? 'text-5xl' : 'text-4xl';
  const cellSize = reelCount <= 3 ? 'w-24 h-24' : reelCount === 4 ? 'w-20 h-20' : 'w-16 h-16';

  return (
    <div className="h-full flex gap-4">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] via-[#120a14] to-[#0a0a12] rounded-2xl p-6 flex flex-col items-center justify-center">
        {/* Slot Machine Frame */}
        <div className="bg-gradient-to-b from-gray-900 to-black p-6 rounded-3xl border-4 border-yellow-600/50 shadow-2xl shadow-yellow-500/20">
          {/* Reels */}
          <div className="flex gap-2">
            {reels.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-2">
                {col.map((symbol, rowIdx) => (
                  <div
                    key={rowIdx}
                    className={`${cellSize} bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center border-2 ${
                      rowIdx === Math.floor(rowCount / 2) ? 'border-yellow-500/50' : 'border-gray-700'
                    } ${spinning ? 'animate-pulse' : ''}`}
                  >
                    <span className={`${symbolSize}`}>{symbol}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Win indicator */}
          {result && result.won && (
            <div className="mt-4 text-center bg-gradient-to-r from-yellow-500 to-orange-500 py-3 px-6 rounded-xl">
              <div className="text-2xl font-black text-black">🎰 WIN! {result.totalMult.toFixed(1)}x 🎰</div>
              <div className="text-xl font-bold text-black">+${result.winAmount.toFixed(2)}</div>
            </div>
          )}
        </div>

        {/* Paytable Preview */}
        <div className="mt-6 bg-black/50 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
          {['7️⃣', '💎', '⭐'].map(sym => (
            <div key={sym} className="text-sm">
              <span className="text-2xl">{sym}</span>
              <div className="text-gray-400">3x: <span className="text-yellow-400">{PAYTABLE[sym][3]}x</span></div>
            </div>
          ))}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            {history.map((h, i) => (
              <span key={i} className={`px-4 py-2 rounded-xl font-bold ${h.won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                {h.won ? `${h.mult.toFixed(1)}x` : '✗'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-80 flex flex-col gap-3">
        <div className="bg-[#0a0a12] rounded-2xl p-5 flex-1 flex flex-col gap-4">
          {/* Grid Size */}
          <div>
            <label className="text-sm text-gray-400 uppercase font-bold">Reels × Rows</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { r: 3, rows: 3, label: '3×3' },
                { r: 4, rows: 3, label: '4×3' },
                { r: 5, rows: 3, label: '5×3' },
              ].map(cfg => (
                <button
                  key={cfg.label}
                  onClick={() => { setReelCount(cfg.r); setRowCount(cfg.rows); }}
                  disabled={spinning}
                  className={`py-3 rounded-xl font-bold transition-all ${
                    reelCount === cfg.r && rowCount === cfg.rows ? 'bg-yellow-600 text-black scale-105' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Volatility */}
          <div>
            <label className="text-sm text-gray-400 uppercase font-bold">Volatility</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {Object.entries(VOLATILITY).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setVolatility(key)}
                  disabled={spinning}
                  className={`py-3 rounded-xl font-bold transition-all text-sm ${
                    volatility === key ? 'bg-purple-600 text-white scale-105' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {val.name}
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount */}
          <div>
            <label className="text-sm text-gray-400 uppercase font-bold">Bet Amount</label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">$</span>
              <input
                type="number"
                value={bet}
                onChange={(e) => handleBetChange(Number(e.target.value))}
                disabled={spinning}
                className="w-full bg-black/50 border-2 border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-xl font-bold"
              />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <button onClick={() => handleBetChange(1)} disabled={spinning} className="btn-secondary py-2.5 text-sm font-bold rounded-xl">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={spinning} className="btn-secondary py-2.5 text-sm font-bold rounded-xl">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={spinning} className="btn-secondary py-2.5 text-sm font-bold rounded-xl">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={spinning} className="btn-secondary py-2.5 text-sm font-bold rounded-xl">MAX</button>
            </div>
          </div>

          {/* Quick Bets */}
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 25, 50].map(v => (
              <button key={v} onClick={() => handleBetChange(v)} disabled={spinning}
                className={`py-2 rounded-lg text-sm font-bold ${bet === v ? 'bg-yellow-600 text-black' : 'bg-gray-800 text-gray-400'}`}>
                ${v}
              </button>
            ))}
          </div>

          {/* Auto Spin Toggle */}
          <button
            onClick={() => setAutoSpin(!autoSpin)}
            disabled={spinning}
            className={`w-full py-3 rounded-xl font-bold transition-all ${
              autoSpin ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {autoSpin ? '🔴 AUTO SPIN ON' : '⚪ AUTO SPIN OFF'}
          </button>

          {/* Spin Button */}
          <button
            onClick={spin}
            disabled={spinning || bet <= 0 || bet > state.balance}
            className={`w-full py-5 rounded-xl text-2xl font-black transition-all mt-auto shadow-lg ${
              spinning
                ? 'bg-gray-700 text-gray-400'
                : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-yellow-500/30'
            }`}
          >
            {spinning ? '🎰 SPINNING...' : '🎰 SPIN'}
          </button>
        </div>
      </div>
    </div>
  );
}
