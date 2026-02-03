import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

// Emojis only for scratch cards - with REALISTIC win rates
const SYMBOLS = ['💎', '⭐', '7️⃣', '🍀', '💰', '🎯', '🔔', '🃏'];
const PAYOUTS_3 = { '💎': 50, '⭐': 25, '7️⃣': 15, '💰': 10, '🍀': 6, '🎯': 4, '🔔': 2, '🃏': 1.5 };
const PAYOUTS_2 = { '💎': 3, '⭐': 2, '7️⃣': 1.5, '💰': 1, '🍀': 0, '🎯': 0, '🔔': 0, '🃏': 0 };

// Realistic weights - rare symbols are VERY rare (win rate ~25-30%)
const WEIGHTS = [1, 3, 6, 10, 15, 20, 22, 23]; // 💎 is 1%, 🃏 is 23%

const getWeightedSymbol = () => {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < WEIGHTS.length; i++) {
    rand -= WEIGHTS[i];
    if (rand <= 0) return SYMBOLS[i];
  }
  return SYMBOLS[SYMBOLS.length - 1];
};

const generateCard = () => {
  return Array.from({ length: 9 }, () => ({
    symbol: getWeightedSymbol(),
    revealed: false
  }));
};

export default function ScratchCardGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [cells, setCells] = useState(generateCard());
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const buyCard = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'scratchcard')) return;

    setCells(generateCard());
    setPlaying(true);
    setResult(null);
    audio.playBet();
  }, [bet, state.balance, placeBet]);

  const revealCell = useCallback((idx) => {
    if (!playing || cells[idx].revealed) return;

    const newCells = [...cells];
    newCells[idx].revealed = true;
    setCells(newCells);
    audio.playClick();

    if (newCells.every(c => c.revealed)) {
      finishGame(newCells);
    }
  }, [playing, cells]);

  const revealAll = useCallback(() => {
    if (!playing) return;
    const newCells = cells.map(c => ({ ...c, revealed: true }));
    setCells(newCells);
    audio.playClick();
    finishGame(newCells);
  }, [playing, cells]);

  const finishGame = useCallback((finalCells) => {
    setPlaying(false);

    const counts = {};
    finalCells.forEach(c => {
      counts[c.symbol] = (counts[c.symbol] || 0) + 1;
    });

    let totalMult = 0;
    const matches = [];

    Object.entries(counts).forEach(([symbol, count]) => {
      if (count >= 3) {
        const mult = PAYOUTS_3[symbol] || 0;
        totalMult += mult;
        matches.push({ symbol, count, mult });
      } else if (count === 2 && PAYOUTS_2[symbol] > 0) {
        const mult = PAYOUTS_2[symbol];
        totalMult += mult;
        matches.push({ symbol, count, mult });
      }
    });

    const winAmount = bet * totalMult;
    setResult({ won: totalMult > 0, profit: winAmount - bet, mult: totalMult, matches });
    setHistory(h => [{ mult: totalMult, win: totalMult > 0 }, ...h.slice(0, 4)]);

    if (totalMult > 0) {
      addWin(winAmount, bet, 'scratchcard', totalMult);
      audio.playWin();
    } else {
      addWin(0, bet, 'scratchcard', 0);
      audio.playLose();
    }
  }, [bet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  return (
    <div className="h-full flex gap-3">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-[#0a0a12] rounded-xl p-3 flex flex-col items-center justify-center">
        {/* Scratch Card */}
        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-3 border-4 border-yellow-500 w-full max-w-xs">
          <div className="text-center text-yellow-200 font-black text-lg mb-2">SCRATCH & WIN!</div>
          <div className="grid grid-cols-3 gap-2">
            {cells.map((cell, i) => (
              <button
                key={i}
                onClick={() => revealCell(i)}
                disabled={!playing || cell.revealed}
                className={`aspect-square rounded-lg text-3xl font-bold transition-all flex items-center justify-center ${
                  cell.revealed
                    ? 'bg-white'
                    : 'bg-gray-500 hover:bg-gray-400 cursor-pointer'
                }`}
              >
                {cell.revealed ? cell.symbol : '❓'}
              </button>
            ))}
          </div>
        </div>

        {/* Reveal All */}
        {playing && (
          <button onClick={revealAll} className="mt-3 px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm">
            REVEAL ALL
          </button>
        )}

        {/* Result */}
        {result && (
          <div className={`mt-3 text-center py-2 px-6 rounded-xl ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <span className={`text-xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `${result.mult}x WIN! +$${result.profit.toFixed(2)}` : 'NO WIN'}
            </span>
            {result.matches.length > 0 && (
              <div className="text-sm text-gray-400 mt-1">
                {result.matches.map((m, i) => <span key={i} className="mr-2">{m.symbol}x{m.count}</span>)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-64 flex flex-col gap-2">
        <div className="bg-[#0a0a12] rounded-xl p-3 flex-1 flex flex-col gap-2">
          {/* Bet */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Card Price</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={bet}
                onChange={(e) => handleBetChange(Number(e.target.value))}
                disabled={playing}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-white"
              />
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              <button onClick={() => handleBetChange(1)} disabled={playing} className="btn-secondary py-1 text-xs">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={playing} className="btn-secondary py-1 text-xs">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={playing} className="btn-secondary py-1 text-xs">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={playing} className="btn-secondary py-1 text-xs">MAX</button>
            </div>
          </div>

          {/* Buy Button */}
          {!playing && (
            <button
              onClick={buyCard}
              disabled={bet <= 0 || bet > state.balance}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black text-lg disabled:opacity-50"
            >
              BUY CARD ${bet}
            </button>
          )}

          {/* Paytable */}
          <div className="bg-black/30 rounded-lg p-2 text-xs flex-1 overflow-y-auto">
            <div className="text-gray-500 uppercase mb-1">Paytable (3 match)</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
              {Object.entries(PAYOUTS_3).map(([sym, mult]) => (
                <div key={sym} className="flex justify-between">
                  <span>{sym}x3</span>
                  <span className="text-green-400">{mult}x</span>
                </div>
              ))}
            </div>
            <div className="text-gray-600 text-[10px] mt-2">2 matches: 💎=3x ⭐=2x 7️⃣=1.5x 💰=1x</div>
          </div>

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
