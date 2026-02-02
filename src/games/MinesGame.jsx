import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';

export default function MinesGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [mines, setMines] = useState(5);
  const [gameActive, setGameActive] = useState(false);
  const [grid, setGrid] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [multiplier, setMultiplier] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [history, setHistory] = useState([]);

  const gridSize = 25;
  const safeSquares = gridSize - mines;

  const calculateMultiplier = (revealed) => {
    if (revealed === 0) return 1;
    let mult = 1;
    for (let i = 0; i < revealed; i++) {
      mult *= (gridSize - i) / (safeSquares - i);
    }
    return parseFloat((mult * 0.97).toFixed(2));
  };

  const startGame = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'mines')) return;

    // Generate mines
    const minePositions = new Set();
    while (minePositions.size < mines) {
      minePositions.add(Math.floor(Math.random() * gridSize));
    }

    setGrid(Array.from({ length: gridSize }, (_, i) => minePositions.has(i) ? 'mine' : 'gem'));
    setRevealed([]);
    setMultiplier(1);
    setGameActive(true);
    setGameOver(false);
  }, [bet, mines, state.balance, placeBet]);

  const revealTile = useCallback((index) => {
    if (!gameActive || revealed.includes(index) || gameOver) return;

    const newRevealed = [...revealed, index];
    setRevealed(newRevealed);

    if (grid[index] === 'mine') {
      // Hit mine - lose
      setGameOver(true);
      setGameActive(false);
      addWin(0, bet, 'mines', 0);
      setHistory(h => [{ won: false, gems: revealed.length, mult: 0 }, ...h.slice(0, 9)]);
    } else {
      // Safe - update multiplier
      const newMult = calculateMultiplier(newRevealed.length);
      setMultiplier(newMult);

      // Check if all gems found
      if (newRevealed.length === safeSquares) {
        const winAmount = bet * newMult;
        addWin(winAmount, bet, 'mines', newMult);
        setGameActive(false);
        setHistory(h => [{ won: true, gems: newRevealed.length, mult: newMult }, ...h.slice(0, 9)]);
      }
    }
  }, [gameActive, revealed, grid, gameOver, bet, safeSquares, addWin]);

  const cashout = useCallback(() => {
    if (!gameActive || revealed.length === 0) return;

    const winAmount = bet * multiplier;
    addWin(winAmount, bet, 'mines', multiplier);
    setGameActive(false);
    setHistory(h => [{ won: true, gems: revealed.length, mult: multiplier }, ...h.slice(0, 9)]);
  }, [gameActive, revealed.length, bet, multiplier, addWin]);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Game Grid */}
      <div className="lg:col-span-2 bg-[#1a1a2e] rounded-xl p-6">
        <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
          {Array.from({ length: gridSize }, (_, i) => {
            const isRevealed = revealed.includes(i);
            const showAll = gameOver || (!gameActive && revealed.length > 0);
            const isMine = grid[i] === 'mine';

            return (
              <button
                key={i}
                onClick={() => revealTile(i)}
                disabled={!gameActive || isRevealed}
                className={`aspect-square rounded-lg font-bold text-2xl transition-all ${
                  isRevealed || showAll
                    ? isMine
                      ? 'bg-red-500 text-white'
                      : 'bg-green-500/30 text-green-400 border border-green-500'
                    : gameActive
                      ? 'bg-[#12121f] hover:bg-[#1f1f35] border border-[#2a2a45] cursor-pointer'
                      : 'bg-[#12121f] border border-[#2a2a45]'
                }`}
              >
                {(isRevealed || showAll) && (isMine ? '💣' : '💎')}
              </button>
            );
          })}
        </div>

        {/* Game Status */}
        {gameActive && (
          <div className="mt-6 text-center">
            <div className="text-4xl font-black text-cyan-400 mb-2">{multiplier}x</div>
            <div className="text-gray-400">
              Potential Win: <span className="text-green-400 font-bold">${(bet * multiplier).toFixed(2)}</span>
            </div>
            <button
              onClick={cashout}
              disabled={revealed.length === 0}
              className="mt-4 px-8 py-3 bg-green-500 text-white rounded-xl font-bold hover:brightness-110 disabled:opacity-50 transition"
            >
              CASHOUT ${(bet * multiplier).toFixed(2)}
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
                  {h.won ? `${h.mult}x` : '💣'}
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
            buttonText="START GAME"
          >
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">
                Mines: {mines}
              </label>
              <input
                type="range"
                min="1"
                max="24"
                value={mines}
                onChange={(e) => setMines(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>24</span>
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
              <div className="text-xs text-gray-500 uppercase mb-1">Gems Found</div>
              <div className="text-2xl font-bold text-green-400">{revealed.length} / {safeSquares}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase mb-1">Mines</div>
              <div className="text-2xl font-bold text-red-400">{mines}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
