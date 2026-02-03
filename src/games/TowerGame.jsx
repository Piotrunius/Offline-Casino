import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const ROWS = 10;
const COLS_PER_ROW = [4, 4, 4, 3, 3, 3, 2, 2, 2, 2];
const DIFFICULTY_MULT = {
  easy: { safe: 3, mult: 1.3 },
  medium: { safe: 2, mult: 1.7 },
  hard: { safe: 1, mult: 3.0 },
};

const generateTower = (difficulty) => {
  const tower = [];
  for (let row = 0; row < ROWS; row++) {
    const cols = COLS_PER_ROW[row];
    const safeCount = Math.min(DIFFICULTY_MULT[difficulty].safe, cols - 1);
    const tiles = Array(cols).fill(false);

    const safeIndices = [];
    while (safeIndices.length < safeCount) {
      const idx = Math.floor(Math.random() * cols);
      if (!safeIndices.includes(idx)) safeIndices.push(idx);
    }
    safeIndices.forEach(idx => tiles[idx] = true);

    tower.push(tiles);
  }
  return tower;
};

export default function TowerGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [tower, setTower] = useState([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [revealed, setRevealed] = useState([]);
  const [phase, setPhase] = useState('betting');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const start = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'tower')) return;

    setTower(generateTower(difficulty));
    setCurrentRow(0);
    setMultiplier(1);
    setRevealed([]);
    setPhase('playing');
    setResult(null);
    audio.playBet();
  }, [bet, state.balance, difficulty, placeBet]);

  const selectTile = (col) => {
    if (phase !== 'playing') return;
    if (revealed[currentRow] !== undefined) return;

    const isSafe = tower[currentRow][col];
    const newRevealed = [...revealed];
    newRevealed[currentRow] = col;
    setRevealed(newRevealed);

    audio.playTick();

    setTimeout(() => {
      if (isSafe) {
        const rowMult = DIFFICULTY_MULT[difficulty].mult;
        const newMult = multiplier * rowMult;
        setMultiplier(newMult);

        if (currentRow === ROWS - 1) {
          const win = bet * newMult;
          addWin(win, bet, 'tower', newMult);
          audio.playCashout();
          setPhase('finished');
          setResult({ won: true, multiplier: newMult, row: currentRow + 1 });
          setHistory(h => [{ won: true, row: currentRow + 1 }, ...h.slice(0, 9)]);
        } else {
          setCurrentRow(currentRow + 1);
        }
      } else {
        addWin(0, bet, 'tower', 0);
        audio.playLose();
        setPhase('finished');
        setResult({ won: false, row: currentRow + 1 });
        setHistory(h => [{ won: false, row: currentRow + 1 }, ...h.slice(0, 9)]);
      }
    }, state.settings.fastMode ? 200 : 400);
  };

  const cashOut = () => {
    if (phase !== 'playing' || currentRow === 0) return;

    const win = bet * multiplier;
    addWin(win, bet, 'tower', multiplier);
    audio.playCashout();
    setPhase('finished');
    setResult({ won: true, multiplier, row: currentRow, cashedOut: true });
    setHistory(h => [{ won: true, row: currentRow }, ...h.slice(0, 9)]);
  };

  const newGame = () => {
    setPhase('betting');
    setTower([]);
    setRevealed([]);
    setResult(null);
  };

  const displayMultiplier = (row) => {
    return Math.pow(DIFFICULTY_MULT[difficulty].mult, row + 1).toFixed(2);
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-gray-400 text-sm">Floor</div>
            <div className="text-3xl font-black text-cyan-400">{currentRow}/{ROWS}</div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-sm">Multiplier</div>
            <div className="text-3xl font-black text-green-400">{multiplier.toFixed(2)}x</div>
          </div>
        </div>

        {/* Tower */}
        <div className="flex flex-col-reverse gap-1.5 mb-6">
          {Array(ROWS).fill(0).map((_, row) => {
            const cols = COLS_PER_ROW[row];
            const isActive = phase === 'playing' && currentRow === row;
            const isPast = revealed[row] !== undefined;

            return (
              <div key={row} className="flex items-center gap-2">
                <div className="w-14 text-right text-xs text-gray-500 font-mono">
                  {displayMultiplier(row)}x
                </div>
                <div className="flex-1 flex justify-center gap-1.5">
                  {Array(cols).fill(0).map((_, col) => {
                    const isRevealed = revealed[row] === col;
                    const isSafe = tower[row]?.[col];

                    let bgColor = 'bg-gray-700/50';
                    if (isPast && isRevealed) {
                      bgColor = isSafe ? 'bg-green-600' : 'bg-red-600';
                    } else if (isPast && !isRevealed && tower[row]) {
                      bgColor = tower[row][col] ? 'bg-green-600/30' : 'bg-red-600/30';
                    } else if (isActive) {
                      bgColor = 'bg-cyan-600 hover:bg-cyan-500 cursor-pointer';
                    }

                    return (
                      <button
                        key={col}
                        onClick={() => isActive && selectTile(col)}
                        disabled={!isActive}
                        className={`w-16 h-9 rounded-lg ${bgColor} transition-all font-bold text-white text-xs flex items-center justify-center`}
                      >
                        {isPast && isRevealed && (isSafe ? '✓' : '💀')}
                        {isPast && !isRevealed && tower[row] && (tower[row][col] ? '💎' : '💣')}
                      </button>
                    );
                  })}
                </div>
                <div className="w-14" />
              </div>
            );
          })}
        </div>

        {result && (
          <div className="text-center mb-4">
            <div className={`text-3xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? (result.cashedOut ? `CASHED OUT ${result.multiplier.toFixed(2)}x` : `WON ${result.multiplier.toFixed(2)}x!`) : 'GAME OVER'}
            </div>
            <div className="text-gray-400 mt-1">Reached floor {result.row}</div>
          </div>
        )}

        {phase === 'playing' && currentRow > 0 && (
          <button onClick={cashOut}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black text-xl">
            CASHOUT ${(bet * multiplier).toFixed(2)}
          </button>
        )}

        {phase === 'finished' && (
          <div className="flex justify-center">
            <button onClick={newGame} className="btn-primary px-8 py-3 font-bold text-lg">
              NEW GAME
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {phase === 'betting' ? (
          <>
            <BetControls bet={bet} setBet={setBet} onPlay={start} buttonText="START" />

            <div className="game-card p-4">
              <div className="text-xs text-gray-500 uppercase mb-3">Difficulty</div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(DIFFICULTY_MULT).map(([key, data]) => (
                  <button
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`py-3 rounded-lg font-bold text-sm transition-all ${
                      difficulty === key
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="capitalize">{key}</div>
                    <div className="text-xs opacity-70">{data.mult}x/row</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="game-card p-4 text-center">
            <div className="text-gray-400 text-sm">Current Bet</div>
            <div className="text-3xl font-black text-cyan-400">${bet.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-1">Potential: ${(bet * multiplier).toFixed(2)}</div>
          </div>
        )}

        {history.length > 0 && (
          <div className="game-card p-4">
            <div className="text-xs text-gray-500 uppercase mb-3">History</div>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className={`flex justify-between text-sm ${h.won ? 'text-green-400' : 'text-red-400'}`}>
                  <span>{h.won ? 'WIN' : 'LOST'}</span>
                  <span>Floor {h.row}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
