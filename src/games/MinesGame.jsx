import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

export default function MinesGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [mineCount, setMineCount] = useState(3);
  const [playing, setPlaying] = useState(false);
  const [grid, setGrid] = useState(Array(25).fill({ revealed: false, mine: false }));
  const [revealed, setRevealed] = useState(0);
  const [currentMult, setCurrentMult] = useState(1);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const calculateMult = (safe, mines) => {
    let mult = 1;
    for (let i = 0; i < safe; i++) {
      mult *= (25 - mines - i) / (25 - i);
    }
    return 0.97 / mult; // 3% house edge
  };

  const startGame = useCallback(() => {
    if (playing || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'mines')) return;

    // Place mines
    const newGrid = Array(25).fill(null).map(() => ({ revealed: false, mine: false }));
    const minePositions = new Set();
    while (minePositions.size < mineCount) {
      minePositions.add(Math.floor(Math.random() * 25));
    }
    minePositions.forEach(pos => newGrid[pos].mine = true);

    setGrid(newGrid);
    setPlaying(true);
    setRevealed(0);
    setCurrentMult(1);
    setResult(null);
    audio.playBet();
  }, [playing, bet, state.balance, mineCount, placeBet]);

  const revealTile = useCallback((idx) => {
    if (!playing || grid[idx].revealed) return;

    const newGrid = [...grid];
    newGrid[idx] = { ...newGrid[idx], revealed: true };
    setGrid(newGrid);

    if (newGrid[idx].mine) {
      // Hit mine - LOSE
      setPlaying(false);
      // Reveal all mines
      const finalGrid = newGrid.map(t => t.mine ? { ...t, revealed: true } : t);
      setGrid(finalGrid);
      setResult({ won: false, mult: 0, profit: -bet });
      setHistory(h => [{ mult: 0, won: false }, ...h.slice(0, 4)]);
      addWin(0, bet, 'mines', 0);
      audio.playLose();
    } else {
      // Safe tile
      const newRevealed = revealed + 1;
      setRevealed(newRevealed);
      const newMult = calculateMult(newRevealed, mineCount);
      setCurrentMult(newMult);
      audio.playClick();

      // Auto-win if all safe tiles revealed
      if (newRevealed >= 25 - mineCount) {
        cashout(newMult);
      }
    }
  }, [playing, grid, revealed, mineCount, bet, addWin]);

  const cashout = useCallback((mult = currentMult) => {
    if (!playing) return;
    setPlaying(false);
    const winAmount = bet * mult;
    setResult({ won: true, mult, profit: winAmount - bet });
    setHistory(h => [{ mult, won: true }, ...h.slice(0, 4)]);
    addWin(winAmount, bet, 'mines', mult);
    audio.playWin();
  }, [playing, currentMult, bet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const nextMult = revealed > 0 ? calculateMult(revealed + 1, mineCount) : calculateMult(1, mineCount);

  return (
    <div className="h-full flex gap-3">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-[#0a0a12] rounded-xl p-3 flex flex-col items-center justify-center">
        {/* Grid */}
        <div className="grid grid-cols-5 gap-1.5 w-full max-w-[280px]">
          {grid.map((tile, i) => (
            <button
              key={i}
              onClick={() => revealTile(i)}
              disabled={!playing || tile.revealed}
              className={`aspect-square rounded-lg text-xl font-bold transition-all flex items-center justify-center ${
                tile.revealed
                  ? tile.mine
                    ? 'bg-red-600 text-white'
                    : 'bg-green-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {tile.revealed ? (tile.mine ? '💣' : '💎') : ''}
            </button>
          ))}
        </div>

        {/* Current Multiplier */}
        {playing && revealed > 0 && (
          <div className="mt-3 text-center">
            <span className="text-2xl font-black text-green-400">{currentMult.toFixed(2)}x</span>
            <span className="text-gray-500 ml-2">→ next: {nextMult.toFixed(2)}x</span>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`mt-3 text-center py-2 px-6 rounded-xl ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <span className={`text-xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `CASHED ${result.mult.toFixed(2)}x → +$${result.profit.toFixed(2)}` : 'BOOM! 💣'}
            </span>
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-64 flex flex-col gap-2">
        <div className="bg-[#0a0a12] rounded-xl p-3 flex-1 flex flex-col gap-3">
          {/* Mines */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Mines: {mineCount}</label>
            <input
              type="range"
              min={1}
              max={24}
              value={mineCount}
              onChange={(e) => !playing && setMineCount(Number(e.target.value))}
              disabled={playing}
              className="w-full mt-1 accent-red-500"
            />
            <div className="grid grid-cols-4 gap-1 mt-1">
              {[1, 3, 5, 10].map(v => (
                <button key={v} onClick={() => !playing && setMineCount(v)} disabled={playing}
                  className={`py-1 rounded text-xs font-bold ${mineCount === v ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  {v}
                </button>
              ))}
            </div>
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

          {/* Info */}
          <div className="bg-black/30 rounded-lg p-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Safe Tiles</span>
              <span className="text-cyan-400 font-bold">{25 - mineCount}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">First Click</span>
              <span className="text-green-400 font-bold">{calculateMult(1, mineCount).toFixed(2)}x</span>
            </div>
          </div>

          {/* Play/Cashout */}
          {playing ? (
            <button
              onClick={() => cashout()}
              disabled={revealed === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black text-lg disabled:opacity-50"
            >
              CASHOUT ${(bet * currentMult).toFixed(2)}
            </button>
          ) : (
            <button
              onClick={startGame}
              disabled={bet <= 0 || bet > state.balance}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black text-lg disabled:opacity-50"
            >
              START GAME
            </button>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="flex gap-1 mt-auto">
              {history.map((h, i) => (
                <span key={i} className={`px-2 py-1 rounded text-xs font-bold ${h.won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {h.mult > 0 ? `${h.mult.toFixed(1)}x` : '💣'}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
