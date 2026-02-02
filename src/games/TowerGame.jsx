import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';

const ROWS = 8;
const DIFFICULTIES = {
  easy: { correct: 3, multipliers: [1.47, 1.96, 2.94, 4.41, 6.62, 9.93, 14.9, 22.35] },
  medium: { correct: 2, multipliers: [1.96, 3.92, 7.84, 15.68, 31.36, 62.72, 125.44, 250.88] },
  hard: { correct: 1, multipliers: [3.92, 15.68, 62.72, 250.88, 1003.52, 4014.08, 16056.32, 64225.28] }
};

export default function TowerGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [gameActive, setGameActive] = useState(false);
  const [currentRow, setCurrentRow] = useState(0);
  const [tower, setTower] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [history, setHistory] = useState([]);

  const config = DIFFICULTIES[difficulty];
  const tilesPerRow = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 3 : 4;
  const currentMultiplier = currentRow > 0 ? config.multipliers[currentRow - 1] : 1;

  const startGame = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'tower')) return;

    // Generate tower - each row has one safe tile (for easy), or specific pattern
    const newTower = [];
    for (let row = 0; row < ROWS; row++) {
      const rowTiles = Array(tilesPerRow).fill('trap');
      const safeIndices = new Set();
      while (safeIndices.size < config.correct) {
        safeIndices.add(Math.floor(Math.random() * tilesPerRow));
      }
      safeIndices.forEach(i => rowTiles[i] = 'safe');
      newTower.push(rowTiles);
    }

    setTower(newTower);
    setRevealed([]);
    setCurrentRow(0);
    setGameActive(true);
    setGameOver(false);
  }, [bet, state.balance, placeBet, config.correct, tilesPerRow]);

  const selectTile = useCallback((tileIndex) => {
    if (!gameActive || gameOver) return;

    const tile = tower[currentRow][tileIndex];
    const newRevealed = [...revealed, { row: currentRow, tile: tileIndex }];
    setRevealed(newRevealed);

    if (tile === 'trap') {
      // Hit trap - game over
      setGameOver(true);
      setGameActive(false);
      addWin(0, bet, 'tower', 0);
      setHistory(h => [{ won: false, rows: currentRow, mult: 0 }, ...h.slice(0, 9)]);
    } else {
      // Safe - move up
      const newRow = currentRow + 1;
      setCurrentRow(newRow);

      if (newRow === ROWS) {
        // Reached top!
        const winAmount = bet * config.multipliers[ROWS - 1];
        addWin(winAmount, bet, 'tower', config.multipliers[ROWS - 1]);
        setGameActive(false);
        setHistory(h => [{ won: true, rows: ROWS, mult: config.multipliers[ROWS - 1] }, ...h.slice(0, 9)]);
      }
    }
  }, [gameActive, gameOver, tower, currentRow, revealed, bet, addWin, config.multipliers]);

  const cashout = useCallback(() => {
    if (!gameActive || currentRow === 0) return;

    const winAmount = bet * currentMultiplier;
    addWin(winAmount, bet, 'tower', currentMultiplier);
    setGameActive(false);
    setHistory(h => [{ won: true, rows: currentRow, mult: currentMultiplier }, ...h.slice(0, 9)]);
  }, [gameActive, currentRow, bet, currentMultiplier, addWin]);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tower */}
      <div className="lg:col-span-2 bg-[#1a1a2e] rounded-xl p-6">
        <div className="max-w-sm mx-auto">
          {/* Tower rows (reversed for display) */}
          {[...Array(ROWS)].map((_, rowIndex) => {
            const row = ROWS - 1 - rowIndex;
            const isCurrentRow = row === currentRow && gameActive;
            const isPastRow = row < currentRow;
            const mult = config.multipliers[row];

            return (
              <div key={row} className="flex items-center gap-2 mb-2">
                <div className="w-16 text-right text-sm font-bold text-gray-500">
                  {mult}x
                </div>
                <div className="flex-1 flex gap-2">
                  {[...Array(tilesPerRow)].map((_, tileIndex) => {
                    const revealedTile = revealed.find(r => r.row === row && r.tile === tileIndex);
                    const showTile = revealedTile || (gameOver && row <= currentRow);
                    const isSafe = tower[row]?.[tileIndex] === 'safe';

                    return (
                      <button
                        key={tileIndex}
                        onClick={() => isCurrentRow && selectTile(tileIndex)}
                        disabled={!isCurrentRow}
                        className={`flex-1 aspect-square rounded-lg font-bold text-lg transition ${
                          showTile
                            ? isSafe
                              ? 'bg-green-500/30 text-green-400 border border-green-500'
                              : 'bg-red-500/30 text-red-400 border border-red-500'
                            : isCurrentRow
                              ? 'bg-cyan-500/20 border border-cyan-500 hover:bg-cyan-500/40 cursor-pointer'
                              : isPastRow
                                ? 'bg-gray-800 border border-gray-700'
                                : 'bg-[#12121f] border border-[#2a2a45]'
                        }`}
                      >
                        {showTile && (isSafe ? '⭐' : '💀')}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Game Status */}
        {gameActive && currentRow > 0 && (
          <div className="mt-6 text-center">
            <div className="text-3xl font-black text-cyan-400 mb-2">{currentMultiplier}x</div>
            <button
              onClick={cashout}
              className="px-8 py-3 bg-green-500 text-white rounded-xl font-bold hover:brightness-110 transition"
            >
              CASHOUT ${(bet * currentMultiplier).toFixed(2)}
            </button>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6">
            <div className="text-xs text-gray-500 uppercase mb-2">Recent Games</div>
            <div className="flex gap-2 flex-wrap">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    h.won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {h.won ? `${h.mult}x` : '💀'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {!gameActive ? (
          <BetControls
            bet={bet}
            setBet={setBet}
            onPlay={startGame}
            disabled={gameActive}
            balance={state.balance}
            buttonText="START CLIMB"
          >
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-2 rounded-lg font-bold text-sm capitalize transition ${
                      difficulty === d
                        ? 'bg-cyan-500 text-white'
                        : 'bg-[#12121f] text-gray-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </BetControls>
        ) : (
          <div className="bg-[#1a1a2e] rounded-xl p-4 space-y-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase mb-1">Current Bet</div>
              <div className="text-2xl font-bold text-white">${bet.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase mb-1">Level</div>
              <div className="text-2xl font-bold text-cyan-400">{currentRow} / {ROWS}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
