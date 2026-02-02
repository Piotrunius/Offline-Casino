import { AnimatePresence, motion } from 'framer-motion';
import { Bomb, Gem } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import { playSound } from '../utils/audioEngine';

const getRandomFloat = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
};

// Grid size options: value = total tiles
const GRID_SIZES = [
  { label: '3×3', size: 3, tiles: 9 },
  { label: '4×4', size: 4, tiles: 16 },
  { label: '5×5', size: 5, tiles: 25 },
  { label: '6×6', size: 6, tiles: 36 },
  { label: '8×8', size: 8, tiles: 64 }
];

const MinesGame = () => {
  const { state, addBalance, subtractBalance } = useCasino();
  const balance = state.balance;
  const soundEnabled = state.settings?.soundEnabled;

  const [betAmount, setBetAmount] = useState(10);
  const [gridConfig, setGridConfig] = useState(GRID_SIZES[2]); // Default 5x5
  const [mineCount, setMineCount] = useState(5);
  const [gameState, setGameState] = useState('idle'); // idle, playing, won, lost
  const [grid, setGrid] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [history, setHistory] = useState([]);
  const [lastResult, setLastResult] = useState(null);

  const totalTiles = gridConfig.tiles;
  const safeTiles = totalTiles - mineCount;

  // Calculate multiplier based on revealed tiles
  const calculateMultiplier = useCallback(
    (revealedCount) => {
      if (revealedCount === 0) return 1;

      let multiplier = 1;
      for (let i = 0; i < revealedCount; i++) {
        const remaining = totalTiles - i;
        const safeRemaining = safeTiles - i;
        multiplier *= remaining / safeRemaining;
      }
      return multiplier * 0.97; // 3% house edge
    },
    [totalTiles, safeTiles]
  );

  // Initialize grid with mines
  const initializeGrid = useCallback(() => {
    const newGrid = Array(totalTiles).fill('gem');
    const minePositions = new Set();

    while (minePositions.size < mineCount) {
      const pos = Math.floor(getRandomFloat() * totalTiles);
      minePositions.add(pos);
    }

    minePositions.forEach((pos) => {
      newGrid[pos] = 'mine';
    });

    return newGrid;
  }, [totalTiles, mineCount]);

  const startGame = useCallback(() => {
    if (betAmount > balance || gameState === 'playing') return;

    subtractBalance(betAmount);
    const newGrid = initializeGrid();
    setGrid(newGrid);
    setRevealed([]);
    setCurrentMultiplier(1);
    setGameState('playing');
    setLastResult(null);
    if (soundEnabled) playSound('betPlace');
  }, [betAmount, balance, gameState, subtractBalance, initializeGrid, soundEnabled]);

  const revealTile = useCallback(
    (index) => {
      if (gameState !== 'playing' || revealed.includes(index)) return;

      const newRevealed = [...revealed, index];
      setRevealed(newRevealed);
      if (soundEnabled) playSound('tileClick');

      if (grid[index] === 'mine') {
        // Hit a mine - game over
        setGameState('lost');
        setLastResult({ won: false, amount: betAmount });
        setHistory((prev) => [{ won: false, multiplier: 0, gems: newRevealed.length - 1 }, ...prev.slice(0, 19)]);
        if (soundEnabled) playSound('mineExplosion');
      } else {
        // Safe tile
        const gemsRevealed = newRevealed.length;
        const newMultiplier = calculateMultiplier(gemsRevealed);
        setCurrentMultiplier(newMultiplier);
        if (soundEnabled) playSound('diamond');

        // Check if all gems found
        if (gemsRevealed === safeTiles) {
          const winAmount = betAmount * newMultiplier;
          addBalance(winAmount);
          setGameState('won');
          setLastResult({ won: true, amount: winAmount, multiplier: newMultiplier });
          setHistory((prev) => [{ won: true, multiplier: newMultiplier, gems: gemsRevealed }, ...prev.slice(0, 19)]);
          if (soundEnabled) playSound('bigWin');
        }
      }
    },
    [gameState, revealed, grid, betAmount, calculateMultiplier, safeTiles, addBalance, soundEnabled]
  );

  const cashOut = useCallback(() => {
    if (gameState !== 'playing' || revealed.length === 0) return;

    const winAmount = betAmount * currentMultiplier;
    addBalance(winAmount);
    setGameState('won');
    setLastResult({ won: true, amount: winAmount, multiplier: currentMultiplier });
    setHistory((prev) => [{ won: true, multiplier: currentMultiplier, gems: revealed.length }, ...prev.slice(0, 19)]);
    if (soundEnabled) {
      playSound('cashout');
      if (currentMultiplier >= 3) playSound('bigWin');
      else playSound('betWin');
    }
  }, [gameState, revealed.length, betAmount, currentMultiplier, addBalance, soundEnabled]);

  // Reset mine count when grid size changes
  useEffect(() => {
    const maxMines = totalTiles - 1;
    if (mineCount > maxMines) {
      setMineCount(Math.min(5, maxMines));
    }
  }, [totalTiles, mineCount]);

  const maxMines = totalTiles - 1;
  const mineOptions = Array.from({ length: Math.min(24, maxMines) }, (_, i) => i + 1);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      <div className="flex-1 flex flex-col">
        {/* Game Grid */}
        <div className="flex-1 bg-casino-card border border-casino-border rounded-xl p-4 flex items-center justify-center">
          <div
            className="grid gap-2 w-full max-w-[500px] aspect-square"
            style={{
              gridTemplateColumns: `repeat(${gridConfig.size}, 1fr)`
            }}
          >
            {Array.from({ length: totalTiles }, (_, i) => {
              const isRevealed = revealed.includes(i);
              const isGameOver = gameState === 'lost' || gameState === 'won';
              const showContent = isRevealed || isGameOver;
              const isMine = grid[i] === 'mine';
              const wasClicked = isRevealed && isMine;

              return (
                <motion.button
                  key={i}
                  onClick={() => revealTile(i)}
                  disabled={gameState !== 'playing' || isRevealed}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center
                    transition-all duration-200 font-bold
                    ${
                      showContent
                        ? isMine
                          ? wasClicked
                            ? 'bg-red-600 border-red-500'
                            : 'bg-red-600/50 border-red-500/50'
                          : 'bg-casino-green/30 border-casino-green'
                        : gameState === 'playing'
                          ? 'bg-casino-bg border-casino-border hover:bg-casino-border hover:border-casino-cyan cursor-pointer'
                          : 'bg-casino-bg border-casino-border cursor-not-allowed'
                    }
                    border-2
                  `}
                  whileHover={gameState === 'playing' && !isRevealed ? { scale: 1.05 } : {}}
                  whileTap={gameState === 'playing' && !isRevealed ? { scale: 0.95 } : {}}
                >
                  <AnimatePresence mode="wait">
                    {showContent && (
                      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                        {isMine ? <Bomb className={`w-6 h-6 ${wasClicked ? 'text-white' : 'text-red-400'}`} /> : <Gem className="w-6 h-6 text-casino-green" />}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Result Display - Absolute positioned to prevent resize */}
        <div className="h-10 relative mt-2">
          <AnimatePresence>
            {lastResult && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
                <div className={`text-xl font-black ${lastResult.won ? 'text-casino-green' : 'text-casino-red'}`}>
                  {lastResult.won ? `+$${lastResult.amount.toFixed(2)}` : `-$${lastResult.amount.toFixed(2)}`}
                  {lastResult.multiplier && <span className="text-sm ml-2 text-gray-400">({lastResult.multiplier.toFixed(2)}x)</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 max-h-12">
          {history.slice(0, 15).map((h, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${h.won ? 'bg-casino-green/20 text-casino-green' : 'bg-casino-red/20 text-casino-red'}`}
            >
              <Gem className="w-3 h-3" />
              {h.gems}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-4">
        {gameState === 'playing' ? (
          /* Cash Out Button */
          <div className="bg-casino-card border border-casino-border rounded-xl p-4">
            <div className="text-center mb-4">
              <div className="text-xs text-gray-500 uppercase">Current Multiplier</div>
              <div className="text-3xl font-black text-casino-cyan">{currentMultiplier.toFixed(2)}x</div>
              <div className="text-sm text-gray-400">
                Potential: <span className="text-casino-green">${(betAmount * currentMultiplier).toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={cashOut}
              disabled={revealed.length === 0}
              className="w-full py-4 rounded-xl font-black text-lg bg-casino-green text-casino-bg hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CASH OUT ${(betAmount * currentMultiplier).toFixed(2)}
            </button>
          </div>
        ) : (
          <BetControls betAmount={betAmount} onBetChange={setBetAmount} onBet={startGame} balance={balance} disabled={gameState === 'playing'} buttonText="START GAME" />
        )}

        {/* Grid Size */}
        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <label className="text-xs text-gray-500 uppercase mb-2 block">Grid Size</label>
          <div className="grid grid-cols-5 gap-2">
            {GRID_SIZES.map((g) => (
              <button
                key={g.label}
                onClick={() => gameState !== 'playing' && setGridConfig(g)}
                disabled={gameState === 'playing'}
                className={`py-2 rounded-lg font-bold text-xs transition ${
                  gridConfig.label === g.label ? 'bg-casino-cyan text-casino-bg' : 'bg-casino-bg text-gray-400 hover:text-white disabled:hover:text-gray-400'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mines */}
        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <label className="text-xs text-gray-500 uppercase mb-2 block">
            Mines: <span className="text-casino-red font-bold">{mineCount}</span>
          </label>
          <input
            type="range"
            min="1"
            max={maxMines > 24 ? 24 : maxMines}
            value={mineCount}
            onChange={(e) => gameState !== 'playing' && setMineCount(parseInt(e.target.value))}
            disabled={gameState === 'playing'}
            className="w-full h-2 bg-casino-bg rounded-lg appearance-none cursor-pointer accent-casino-red disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>{maxMines > 24 ? 24 : maxMines}</span>
          </div>
        </div>

        {/* Info */}
        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bomb className="w-4 h-4 text-casino-red" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Game Info</span>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>
              Total Tiles: <span className="text-white">{totalTiles}</span>
            </p>
            <p>
              Safe Tiles: <span className="text-casino-green">{safeTiles}</span>
            </p>
            <p>
              Mines: <span className="text-casino-red">{mineCount}</span>
            </p>
            <p className="mt-2">Reveal gems to increase your multiplier. Cash out before hitting a mine!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinesGame;
