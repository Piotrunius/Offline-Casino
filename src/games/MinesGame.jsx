import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const GRID_SIZES = {
  small: { cols: 5, rows: 5, defaultMines: 5 },
  medium: { cols: 6, rows: 6, defaultMines: 8 },
  large: { cols: 7, rows: 7, defaultMines: 12 },
};

const calculateMultiplier = (revealed, totalTiles, mines) => {
  if (revealed === 0) return 1;
  const safeTiles = totalTiles - mines;
  let mult = 1;
  for (let i = 0; i < revealed; i++) {
    mult *= (safeTiles - i) > 0 ? (totalTiles - i) / (safeTiles - i) : 1;
  }
  return mult * 0.97;
};

export default function MinesGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [gridSize, setGridSize] = useState('small');
  const [minesCount, setMinesCount] = useState(GRID_SIZES.small.defaultMines);
  const [grid, setGrid] = useState([]);
  const [mines, setMines] = useState(new Set());
  const [revealed, setRevealed] = useState(new Set());
  const [phase, setPhase] = useState('betting');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const config = GRID_SIZES[gridSize];
  const totalTiles = config.cols * config.rows;
  const currentMult = calculateMultiplier(revealed.size, totalTiles, minesCount);
  const nextMult = calculateMultiplier(revealed.size + 1, totalTiles, minesCount);

  const start = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'mines')) return;

    const newMines = new Set();
    while (newMines.size < minesCount) {
      newMines.add(Math.floor(Math.random() * totalTiles));
    }

    setMines(newMines);
    setRevealed(new Set());
    setGrid(Array(totalTiles).fill(null));
    setPhase('playing');
    setResult(null);
    audio.playBet();
  }, [bet, state.balance, minesCount, totalTiles, placeBet]);

  const revealTile = (idx) => {
    if (phase !== 'playing' || revealed.has(idx)) return;

    const isMine = mines.has(idx);
    const newRevealed = new Set(revealed);
    newRevealed.add(idx);
    setRevealed(newRevealed);
    audio.playTick();

    if (isMine) {
      addWin(0, bet, 'mines', 0);
      audio.playLose();
      setPhase('finished');
      setResult({ won: false, revealed: revealed.size });
      setHistory(h => [{ won: false, revealed: revealed.size, mines: minesCount }, ...h.slice(0, 9)]);
    } else {
      const safeTiles = totalTiles - minesCount;
      if (newRevealed.size === safeTiles) {
        const mult = calculateMultiplier(newRevealed.size, totalTiles, minesCount);
        const win = bet * mult;
        addWin(win, bet, 'mines', mult);
        audio.playCashout();
        setPhase('finished');
        setResult({ won: true, multiplier: mult, revealed: newRevealed.size });
        setHistory(h => [{ won: true, revealed: newRevealed.size, mines: minesCount }, ...h.slice(0, 9)]);
      }
    }
  };

  const cashOut = () => {
    if (phase !== 'playing' || revealed.size === 0) return;

    const win = bet * currentMult;
    addWin(win, bet, 'mines', currentMult);
    audio.playCashout();
    setPhase('finished');
    setResult({ won: true, multiplier: currentMult, revealed: revealed.size, cashedOut: true });
    setHistory(h => [{ won: true, revealed: revealed.size, mines: minesCount }, ...h.slice(0, 9)]);
  };

  const newGame = () => {
    setPhase('betting');
    setGrid([]);
    setMines(new Set());
    setRevealed(new Set());
    setResult(null);
  };

  const maxMines = totalTiles - 1;
  const minMines = 1;

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-gray-400 text-sm">Revealed</div>
            <div className="text-3xl font-black text-cyan-400">{revealed.size}/{totalTiles - minesCount}</div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-sm">Multiplier</div>
            <div className="text-3xl font-black text-green-400">{currentMult.toFixed(2)}x</div>
          </div>
        </div>

        {/* Grid */}
        <div
          className="grid gap-2 mb-6 max-w-md mx-auto"
          style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)` }}
        >
          {Array(totalTiles).fill(0).map((_, idx) => {
            const isRevealed = revealed.has(idx);
            const isMine = mines.has(idx);
            const showMine = phase === 'finished' && isMine;

            return (
              <button
                key={idx}
                onClick={() => revealTile(idx)}
                disabled={phase !== 'playing' || isRevealed}
                className={`aspect-square rounded-xl font-bold text-2xl transition-all ${
                  isRevealed
                    ? isMine
                      ? 'bg-red-600 text-white'
                      : 'bg-green-600 text-white'
                    : showMine
                      ? 'bg-red-600/50 text-red-300'
                      : phase === 'playing'
                        ? 'bg-gray-700 hover:bg-gray-600 cursor-pointer'
                        : 'bg-gray-700/50'
                }`}
              >
                {isRevealed && (isMine ? '💣' : '💎')}
                {showMine && !isRevealed && '💣'}
              </button>
            );
          })}
        </div>

        {result && (
          <div className="text-center mb-4">
            <div className={`text-3xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won
                ? result.cashedOut
                  ? `CASHED OUT ${result.multiplier.toFixed(2)}x`
                  : `WON ${result.multiplier.toFixed(2)}x!`
                : 'BOOM! 💥'}
            </div>
            <div className="text-gray-400 mt-1">
              {result.won
                ? `Revealed ${result.revealed} gems`
                : `Found ${result.revealed} gems before hitting a mine`}
            </div>
          </div>
        )}

        {phase === 'playing' && revealed.size > 0 && (
          <button onClick={cashOut}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black text-xl">
            CASHOUT ${(bet * currentMult).toFixed(2)}
          </button>
        )}

        {phase === 'playing' && revealed.size === 0 && (
          <div className="text-center text-gray-400">
            Next gem: {nextMult.toFixed(2)}x
          </div>
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
              <div className="text-xs text-gray-500 uppercase mb-3">Grid Size</div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(GRID_SIZES).map(([key, data]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setGridSize(key);
                      setMinesCount(data.defaultMines);
                    }}
                    className={`py-3 rounded-lg font-bold text-sm transition-all ${
                      gridSize === key
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {data.cols}x{data.rows}
                  </button>
                ))}
              </div>
            </div>

            <div className="game-card p-4">
              <div className="text-xs text-gray-500 uppercase mb-3">Mines: {minesCount}</div>
              <input
                type="range"
                min={minMines}
                max={maxMines}
                value={minesCount}
                onChange={(e) => setMinesCount(parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{minMines}</span>
                <span>{maxMines}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="game-card p-4 text-center">
            <div className="text-gray-400 text-sm">Current Bet</div>
            <div className="text-3xl font-black text-cyan-400">${bet.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-1">Potential: ${(bet * currentMult).toFixed(2)}</div>
          </div>
        )}

        {history.length > 0 && (
          <div className="game-card p-4">
            <div className="text-xs text-gray-500 uppercase mb-3">History</div>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className={`flex justify-between text-sm ${h.won ? 'text-green-400' : 'text-red-400'}`}>
                  <span>{h.won ? 'WIN' : 'LOST'}</span>
                  <span>{h.revealed} gems / {h.mines} mines</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
