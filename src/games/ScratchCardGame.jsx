import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const SYMBOLS = ['💎', '⭐', '7️⃣', '🍀', '💰', '🎯', '🔔', '🃏'];
const HOUSE_EDGE = 0.05;

const PAYOUTS = {
  3: { '💎': 100, '⭐': 50, '7️⃣': 25, '💰': 15, '🍀': 10, '🎯': 5, '🔔': 3, '🃏': 2 },
  2: { '💎': 5, '⭐': 3, '7️⃣': 2, '💰': 1.5, '🍀': 1, '🎯': 0.5, '🔔': 0, '🃏': 0 }
};

const generateCard = () => {
  const cells = [];
  // Weighted random - rarer symbols appear less
  const weights = [1, 2, 3, 5, 8, 12, 18, 25];
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  for (let i = 0; i < 9; i++) {
    let rand = Math.random() * totalWeight;
    let symbolIdx = 0;
    for (let j = 0; j < weights.length; j++) {
      rand -= weights[j];
      if (rand <= 0) {
        symbolIdx = j;
        break;
      }
    }
    cells.push({ symbol: SYMBOLS[symbolIdx], revealed: false });
  }
  return cells;
};

export default function ScratchCardGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [cells, setCells] = useState(generateCard());
  const [playing, setPlaying] = useState(false);
  const [allRevealed, setAllRevealed] = useState(false);
  const [result, setResult] = useState(null);

  const buyCard = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'scratchcard')) return;

    setCells(generateCard());
    setPlaying(true);
    setAllRevealed(false);
    setResult(null);
    audio.playBet();
  }, [bet, state.balance, placeBet]);

  const revealCell = useCallback((index) => {
    if (!playing || cells[index].revealed) return;

    const newCells = [...cells];
    newCells[index].revealed = true;
    setCells(newCells);
    audio.playReveal();

    // Check if all revealed
    if (newCells.every(c => c.revealed)) {
      finishGame(newCells);
    }
  }, [playing, cells]);

  const revealAll = useCallback(() => {
    if (!playing) return;
    const newCells = cells.map(c => ({ ...c, revealed: true }));
    setCells(newCells);
    audio.playReveal();
    finishGame(newCells);
  }, [playing, cells]);

  const finishGame = useCallback((finalCells) => {
    setPlaying(false);
    setAllRevealed(true);

    // Count symbols
    const counts = {};
    finalCells.forEach(c => {
      counts[c.symbol] = (counts[c.symbol] || 0) + 1;
    });

    // Calculate winnings
    let totalMult = 0;
    let matchedSymbols = [];

    Object.entries(counts).forEach(([symbol, count]) => {
      if (count >= 3) {
        totalMult += PAYOUTS[3][symbol];
        matchedSymbols.push({ symbol, count, mult: PAYOUTS[3][symbol] });
      } else if (count === 2 && PAYOUTS[2][symbol] > 0) {
        totalMult += PAYOUTS[2][symbol];
        matchedSymbols.push({ symbol, count, mult: PAYOUTS[2][symbol] });
      }
    });

    if (totalMult > 0) {
      const win = bet * totalMult;
      addWin(win, bet, 'scratchcard', totalMult);
      setResult({ won: true, profit: win - bet, mult: totalMult, matches: matchedSymbols });
      audio.playWin();
    } else {
      addWin(0, bet, 'scratchcard', 0);
      setResult({ won: false, profit: -bet, mult: 0, matches: [] });
      audio.playLose();
    }
  }, [bet, addWin]);

  return (
    <div className="max-w-md mx-auto">
      <div className="game-card p-6">
        <div className="text-xs text-gray-500 mb-4">House Edge: {(HOUSE_EDGE * 100).toFixed(0)}%</div>

        {/* Scratch Card */}
        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-4 border-4 border-yellow-500 mb-4">
          <div className="text-center text-yellow-200 font-black text-lg mb-3">SCRATCH & WIN!</div>
          <div className="grid grid-cols-3 gap-2">
            {cells.map((cell, i) => (
              <button
                key={i}
                onClick={() => revealCell(i)}
                disabled={!playing || cell.revealed}
                className={`aspect-square rounded-lg text-3xl font-bold transition-all ${
                  cell.revealed
                    ? 'bg-white text-gray-800'
                    : 'bg-gray-500 hover:bg-gray-400 text-gray-500 cursor-pointer'
                } disabled:cursor-default`}
              >
                {cell.revealed ? cell.symbol : '?'}
              </button>
            ))}
          </div>
        </div>

        {/* Reveal All Button */}
        {playing && !allRevealed && (
          <button onClick={revealAll}
            className="w-full py-2 mb-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold">
            REVEAL ALL
          </button>
        )}

        {/* Result */}
        {result && (
          <div className={`text-center py-4 mb-4 rounded-lg ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <div className={`text-2xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `WIN ${result.mult}x` : 'NO WIN'}
            </div>
            {result.won && (
              <>
                <div className="text-lg text-yellow-400">+${result.profit.toFixed(2)}</div>
                <div className="text-sm text-gray-400 mt-2">
                  {result.matches.map((m, i) => (
                    <span key={i} className="mr-2">{m.symbol}x{m.count}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Buy Card Button */}
        {!playing && (
          <button onClick={buyCard} disabled={bet <= 0 || bet > state.balance}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-black text-xl disabled:opacity-50 mb-4">
            BUY CARD ${bet}
          </button>
        )}

        <BetControls bet={bet} setBet={setBet} onPlay={buyCard} buttonText="BUY" hideButton />

        {/* Paytable */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-500 uppercase mb-2">Paytable (3 Match)</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(PAYOUTS[3]).map(([sym, mult]) => (
              <div key={sym} className="flex justify-between bg-gray-800/50 px-2 py-1 rounded">
                <span>{sym} x3</span>
                <span className="text-green-400">{mult}x</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2">2 matches also pay (reduced)</div>
        </div>
      </div>
    </div>
  );
}
