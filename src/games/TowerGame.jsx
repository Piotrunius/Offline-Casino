import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const DIFFICULTY = {
  easy: { cols: 4, bombs: 1, mult: 1.31 },
  medium: { cols: 3, bombs: 1, mult: 1.47 },
  hard: { cols: 2, bombs: 1, mult: 1.96 },
  expert: { cols: 3, bombs: 2, mult: 2.94 }
};

const ROWS = 9;
const HOUSE_EDGE = 0.02;

export default function TowerGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [grid, setGrid] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [currentRow, setCurrentRow] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  const config = DIFFICULTY[difficulty];

  const start = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'tower')) return;

    // Generate grid
    const newGrid = [];
    for (let row = 0; row < ROWS; row++) {
      const rowData = Array(config.cols).fill('safe');
      // Place bombs
      const bombPositions = [];
      while (bombPositions.length < config.bombs) {
        const pos = Math.floor(Math.random() * config.cols);
        if (!bombPositions.includes(pos)) bombPositions.push(pos);
      }
      bombPositions.forEach(pos => { rowData[pos] = 'bomb'; });
      newGrid.push(rowData);
    }

    setGrid(newGrid);
    setRevealed(Array(ROWS).fill(null).map(() => Array(config.cols).fill(false)));
    setPlaying(true);
    setResult(null);
    setCurrentRow(0);
    setMultiplier(1);
    audio.playBet();
  }, [bet, state.balance, config, placeBet]);

  const selectTile = useCallback((row, col) => {
    if (!playing || row !== currentRow) return;

    const tile = grid[row][col];
    const newRevealed = [...revealed];
    newRevealed[row][col] = true;
    setRevealed(newRevealed);

    if (tile === 'bomb') {
      // Reveal all bombs
      const fullReveal = grid.map((r, ri) => r.map((t, ci) => t === 'bomb' || newRevealed[ri][ci]));
      setRevealed(fullReveal);
      setPlaying(false);
      addWin(0, bet, 'tower', 0);
      setResult({ won: false, profit: -bet });
      audio.playLose();
    } else {
      const newMult = multiplier * config.mult;
      setMultiplier(newMult);
      audio.playCardDeal();

      if (currentRow === ROWS - 1) {
        // Reached top
        const win = bet * newMult;
        setPlaying(false);
        addWin(win, bet, 'tower', newMult);
        setResult({ won: true, profit: win - bet, mult: newMult, reachedTop: true });
        audio.playWin();
      } else {
        setCurrentRow(currentRow + 1);
      }
    }
  }, [playing, currentRow, grid, revealed, multiplier, config.mult, bet, addWin]);

  const cashout = useCallback(() => {
    if (!playing || currentRow === 0) return;
    const win = bet * multiplier;
    addWin(win, bet, 'tower', multiplier);
    setPlaying(false);
    setResult({ won: true, profit: win - bet, mult: multiplier });
    audio.playWin();
  }, [playing, currentRow, bet, multiplier, addWin]);

  return (
    <div className="max-w-2xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        <div className="text-xs text-gray-500 mb-3">House Edge: {(HOUSE_EDGE * 100).toFixed(0)}%</div>

        {/* Difficulty Selection */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Object.entries(DIFFICULTY).map(([key, val]) => (
            <button key={key} onClick={() => !playing && setDifficulty(key)}
              disabled={playing}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition ${
                difficulty === key
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              } disabled:opacity-50`}>
              <div className="uppercase">{key}</div>
              <div className="text-[10px] opacity-70">{val.cols}x{ROWS} • {val.bombs}B</div>
            </button>
          ))}
        </div>

        {/* Tower Grid */}
        <div className="flex flex-col-reverse gap-1 mb-4">
          {Array(ROWS).fill(null).map((_, row) => (
            <div key={row} className="flex justify-center gap-1">
              {Array(config.cols).fill(null).map((_, col) => {
                const isRevealed = revealed[row]?.[col];
                const tile = grid[row]?.[col];
                const isCurrentRow = row === currentRow && playing;
                const canClick = isCurrentRow && !isRevealed;

                return (
                  <button key={col}
                    onClick={() => canClick && selectTile(row, col)}
                    disabled={!canClick}
                    className={`w-14 h-10 rounded-lg font-bold text-lg transition-all ${
                      isRevealed
                        ? tile === 'bomb'
                          ? 'bg-red-600 text-white'
                          : 'bg-green-600 text-white'
                        : isCurrentRow
                          ? 'bg-cyan-700 hover:bg-cyan-600 text-white cursor-pointer animate-pulse'
                          : row < currentRow
                            ? 'bg-gray-600 text-gray-400'
                            : 'bg-gray-700 text-gray-500'
                    }`}>
                    {isRevealed ? (tile === 'bomb' ? '💣' : '⭐') : row < currentRow ? '✓' : '?'}
                  </button>
                );
              })}
              <div className="w-16 flex items-center justify-end text-xs text-gray-500">
                {(Math.pow(config.mult, row + 1)).toFixed(2)}x
              </div>
            </div>
          ))}
        </div>

        {/* Multiplier */}
        {playing && (
          <div className="text-center mb-4">
            <div className="text-sm text-gray-400">Current Multiplier</div>
            <div className="text-3xl font-black text-cyan-400">{multiplier.toFixed(2)}x</div>
            <div className="text-sm text-gray-500">Row {currentRow + 1} / {ROWS}</div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`text-center py-4 mb-4 rounded-lg ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <div className={`text-2xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won
                ? result.reachedTop ? 'REACHED THE TOP!' : `CASHED OUT ${result.mult.toFixed(2)}x`
                : 'BOOM!'}
            </div>
            <div className="text-lg">
              {result.profit >= 0 ? `+$${result.profit.toFixed(2)}` : `-$${Math.abs(result.profit).toFixed(2)}`}
            </div>
          </div>
        )}

        {/* Controls */}
        {!playing ? (
          <button onClick={start} disabled={bet <= 0 || bet > state.balance}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-black text-xl disabled:opacity-50">
            START CLIMB
          </button>
        ) : (
          currentRow > 0 && (
            <button onClick={cashout}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black text-xl">
              CASHOUT ${(bet * multiplier).toFixed(2)}
            </button>
          )
        )}
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} onPlay={start} buttonText="START" hideButton disabled={playing} />

        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Difficulty Info</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Columns</span><span>{config.cols}</span></div>
            <div className="flex justify-between"><span>Bombs/Row</span><span className="text-red-400">{config.bombs}</span></div>
            <div className="flex justify-between"><span>Multiplier/Row</span><span className="text-green-400">{config.mult}x</span></div>
            <div className="flex justify-between"><span>Max Win</span><span className="text-yellow-400">{(Math.pow(config.mult, ROWS)).toFixed(2)}x</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
