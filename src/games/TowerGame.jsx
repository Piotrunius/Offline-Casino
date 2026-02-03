import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const DIFFICULTIES = {
  easy: { cols: 4, mult: 1.31 },
  medium: { cols: 3, mult: 1.47 },
  hard: { cols: 2, mult: 1.96 }
};

export default function TowerGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [difficulty, setDifficulty] = useState('medium');
  const [playing, setPlaying] = useState(false);
  const [tower, setTower] = useState([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [currentMult, setCurrentMult] = useState(1);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const { cols, mult } = DIFFICULTIES[difficulty];
  const ROWS = 8;

  const startGame = useCallback(() => {
    if (playing || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'tower')) return;

    // Generate tower - one safe tile per row
    const newTower = Array(ROWS).fill(null).map(() => {
      const safe = Math.floor(Math.random() * cols);
      return Array(cols).fill(null).map((_, i) => ({
        safe: i === safe,
        revealed: false
      }));
    });

    setTower(newTower);
    setPlaying(true);
    setCurrentRow(0);
    setCurrentMult(1);
    setResult(null);
    audio.playBet();
  }, [playing, bet, state.balance, cols, placeBet]);

  const selectTile = useCallback((col) => {
    if (!playing || currentRow >= ROWS) return;

    const newTower = [...tower];
    newTower[currentRow] = newTower[currentRow].map((t, i) => ({
      ...t,
      revealed: true,
      selected: i === col
    }));
    setTower(newTower);

    if (newTower[currentRow][col].safe) {
      // Safe - go up
      const newMult = currentMult * mult;
      setCurrentMult(newMult);
      setCurrentRow(currentRow + 1);
      audio.playClick();

      if (currentRow + 1 >= ROWS) {
        // Reached top!
        cashout(newMult);
      }
    } else {
      // Hit trap - LOSE
      setPlaying(false);
      // Reveal all safes
      const finalTower = newTower.map(row => row.map(t => ({ ...t, revealed: true })));
      setTower(finalTower);
      setResult({ won: false, mult: 0, profit: -bet });
      setHistory(h => [{ mult: 0, won: false }, ...h.slice(0, 4)]);
      addWin(0, bet, 'tower', 0);
      audio.playLose();
    }
  }, [playing, tower, currentRow, currentMult, mult, ROWS, bet, addWin]);

  const cashout = useCallback((m = currentMult) => {
    if (!playing || currentRow === 0) return;
    setPlaying(false);
    const winAmount = bet * m;
    setResult({ won: true, mult: m, profit: winAmount - bet });
    setHistory(h => [{ mult: m, won: true }, ...h.slice(0, 4)]);
    addWin(winAmount, bet, 'tower', m);
    audio.playWin();
  }, [playing, currentRow, currentMult, bet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  return (
    <div className="h-full flex gap-3">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-[#0a0a12] rounded-xl p-3 flex flex-col items-center justify-center">
        {/* Tower */}
        <div className="flex flex-col-reverse gap-1 w-full max-w-[200px]">
          {Array(ROWS).fill(null).map((_, row) => (
            <div key={row} className={`grid gap-1 ${row < currentRow ? 'opacity-50' : ''}`}
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {(tower[row] || Array(cols).fill({ safe: false, revealed: false })).map((tile, col) => (
                <button
                  key={col}
                  onClick={() => row === currentRow && selectTile(col)}
                  disabled={!playing || row !== currentRow || tile.revealed}
                  className={`aspect-square rounded text-sm font-bold transition-all flex items-center justify-center ${
                    tile.revealed
                      ? tile.safe
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                      : row === currentRow && playing
                        ? 'bg-cyan-700 hover:bg-cyan-600 cursor-pointer'
                        : 'bg-gray-700'
                  }`}
                >
                  {tile.revealed ? (tile.safe ? '✓' : '✗') : ''}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Current Multiplier */}
        {playing && currentRow > 0 && (
          <div className="mt-3 text-center">
            <span className="text-2xl font-black text-green-400">{currentMult.toFixed(2)}x</span>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`mt-3 text-center py-2 px-6 rounded-xl ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <span className={`text-xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `CASHED ${result.mult.toFixed(2)}x → +$${result.profit.toFixed(2)}` : 'TRAP! ✗'}
            </span>
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-64 flex flex-col gap-2">
        <div className="bg-[#0a0a12] rounded-xl p-3 flex-1 flex flex-col gap-3">
          {/* Difficulty */}
          <div>
            <label className="text-xs text-gray-500 uppercase">Difficulty</label>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {Object.entries(DIFFICULTIES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => !playing && setDifficulty(key)}
                  disabled={playing}
                  className={`py-2 rounded-lg text-xs font-bold capitalize ${
                    difficulty === key ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 text-center mt-1">
              {cols} columns = {mult}x per row
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
              <span className="text-gray-500">Row {currentRow + 1}</span>
              <span className="text-cyan-400 font-bold">{(mult ** (currentRow + 1)).toFixed(2)}x</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Top (8 rows)</span>
              <span className="text-green-400 font-bold">{(mult ** ROWS).toFixed(2)}x</span>
            </div>
          </div>

          {/* Play/Cashout */}
          {playing ? (
            <button
              onClick={() => cashout()}
              disabled={currentRow === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black text-lg disabled:opacity-50"
            >
              CASHOUT ${(bet * currentMult).toFixed(2)}
            </button>
          ) : (
            <button
              onClick={startGame}
              disabled={bet <= 0 || bet > state.balance}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-black text-lg disabled:opacity-50"
            >
              START
            </button>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="flex gap-1 mt-auto">
              {history.map((h, i) => (
                <span key={i} className={`px-2 py-1 rounded text-xs font-bold ${h.won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {h.mult > 0 ? `${h.mult.toFixed(1)}x` : '✗'}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
