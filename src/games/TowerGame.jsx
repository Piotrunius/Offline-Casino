import { AnimatePresence, motion } from 'framer-motion';
import { Check, RotateCcw, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import { playSound } from '../utils/audioEngine';

const getRandomInt = (max) => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
};

const DIFFICULTIES = {
  easy: { options: 4, correct: 3, multiplier: 1.33 },
  medium: { options: 3, correct: 2, multiplier: 1.5 },
  hard: { options: 2, correct: 1, multiplier: 2 }
};

const TowerGame = () => {
  const { state, addBalance, subtractBalance } = useCasino();
  const balance = state.balance;
  const soundEnabled = state.settings?.soundEnabled;

  const [betAmount, setBetAmount] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [gameActive, setGameActive] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [tower, setTower] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [history, setHistory] = useState([]);

  const maxLevels = 10;
  const config = DIFFICULTIES[difficulty];

  const calculateMultiplier = (level) => {
    return Math.pow(config.multiplier, level);
  };

  const currentMultiplier = calculateMultiplier(currentLevel);
  const nextMultiplier = calculateMultiplier(currentLevel + 1);
  const potentialWin = (betAmount * currentMultiplier).toFixed(2);

  const startGame = useCallback(() => {
    if (betAmount > balance) return;

    subtractBalance(betAmount);

    // Generate tower - each level has positions with one being unsafe
    const newTower = Array(maxLevels).fill(null).map(() => {
      const safePositions = Array(config.options).fill(true);
      // Mark random positions as unsafe based on difficulty
      const unsafeCount = config.options - config.correct;
      const unsafeIndices = [];
      while (unsafeIndices.length < unsafeCount) {
        const idx = getRandomInt(config.options);
        if (!unsafeIndices.includes(idx)) {
          unsafeIndices.push(idx);
          safePositions[idx] = false;
        }
      }
      return {
        tiles: safePositions.map(safe => ({ safe, revealed: false, selected: false }))
      };
    });

    setTower(newTower);
    setCurrentLevel(0);
    setGameActive(true);
    setGameOver(false);
    setWon(false);
    if (soundEnabled) playSound('betPlace');
  }, [betAmount, balance, config, subtractBalance, soundEnabled]);

  const selectTile = useCallback((tileIndex) => {
    if (!gameActive || gameOver) return;

    const newTower = [...tower];
    const level = newTower[currentLevel];
    const tile = level.tiles[tileIndex];

    // Mark as selected and revealed
    level.tiles[tileIndex] = { ...tile, revealed: true, selected: true };
    setTower(newTower);

    if (!tile.safe) {
      // Hit unsafe tile - game over
      // Reveal all tiles
      const revealedTower = newTower.map(lvl => ({
        ...lvl,
        tiles: lvl.tiles.map(t => ({ ...t, revealed: true }))
      }));
      setTower(revealedTower);
      setGameOver(true);
      setGameActive(false);
      setHistory(prev => [{ difficulty, level: currentLevel, won: false }, ...prev.slice(0, 9)]);
      if (soundEnabled) playSound('towerFall');
    } else {
      // Safe tile - advance
      const newLevel = currentLevel + 1;
      if (soundEnabled) playSound('towerClimb');

      if (newLevel >= maxLevels) {
        // Reached top!
        const winAmount = betAmount * calculateMultiplier(newLevel);
        addBalance(winAmount);
        setWon(true);
        setGameOver(true);
        setGameActive(false);
        setHistory(prev => [{ difficulty, level: newLevel, won: true, amount: winAmount }, ...prev.slice(0, 9)]);
        if (soundEnabled) playSound('bigWin');
      } else {
        setCurrentLevel(newLevel);
      }
    }
  }, [gameActive, gameOver, tower, currentLevel, betAmount, addBalance, difficulty, calculateMultiplier, soundEnabled]);

  const cashout = useCallback(() => {
    if (!gameActive || currentLevel === 0) return;

    const winAmount = betAmount * currentMultiplier;
    addBalance(winAmount);

    // Reveal all tiles
    const revealedTower = tower.map(lvl => ({
      ...lvl,
      tiles: lvl.tiles.map(t => ({ ...t, revealed: true }))
    }));
    setTower(revealedTower);

    setWon(true);
    setGameOver(true);
    setGameActive(false);
    setHistory(prev => [{ difficulty, level: currentLevel, won: true, amount: winAmount }, ...prev.slice(0, 9)]);
    if (soundEnabled) {
      playSound('cashout');
      playSound('betWin');
    }
  }, [gameActive, currentLevel, betAmount, currentMultiplier, addBalance, tower, difficulty, soundEnabled]);

  const resetGame = () => {
    setTower([]);
    setCurrentLevel(0);
    setGameActive(false);
    setGameOver(false);
    setWon(false);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      <div className="flex-1 flex flex-col">
        {/* Tower */}
        <div className="flex-1 bg-casino-card border border-casino-border rounded-xl p-4 flex flex-col items-center justify-center overflow-y-auto relative min-h-[400px]">
          {/* Result - at top */}
          <AnimatePresence>
            {gameOver && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
              >
                <div className={`px-6 py-3 rounded-xl text-center ${won ? 'bg-casino-green/90' : 'bg-casino-red/90'}`}>
                  <div className={`text-xl font-black text-white`}>
                    {won ? 'CASHED OUT!' : 'FELL DOWN!'}
                  </div>
                  {won && (
                    <div className="text-sm text-white/90">+${potentialWin}</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full max-w-md space-y-2">
            {/* Display tower from top to bottom */}
            {[...tower].reverse().map((level, reversedIndex) => {
              const index = maxLevels - 1 - reversedIndex;
              const isCurrentLevel = index === currentLevel && gameActive && !gameOver;
              const isPastLevel = index < currentLevel;
              const isFutureLevel = index > currentLevel;

              return (
                <div
                  key={index}
                  className={`flex gap-2 justify-center transition-all ${
                    isCurrentLevel ? 'scale-105' : isPastLevel ? 'opacity-50' : isFutureLevel && gameActive ? 'opacity-30' : ''
                  }`}
                >
                  {/* Level indicator */}
                  <div className="w-12 flex items-center justify-center text-xs text-gray-500">
                    {calculateMultiplier(index + 1).toFixed(2)}x
                  </div>

                  {/* Tiles */}
                  {level.tiles.map((tile, tileIndex) => (
                    <motion.button
                      key={tileIndex}
                      onClick={() => isCurrentLevel && selectTile(tileIndex)}
                      disabled={!isCurrentLevel}
                      whileHover={isCurrentLevel ? { scale: 1.1 } : {}}
                      whileTap={isCurrentLevel ? { scale: 0.95 } : {}}
                      className={`w-16 h-12 rounded-lg font-bold flex items-center justify-center transition-all ${
                        tile.revealed
                          ? tile.safe
                            ? tile.selected
                              ? 'bg-casino-green'
                              : 'bg-casino-green/50'
                            : tile.selected
                              ? 'bg-casino-red'
                              : 'bg-casino-red/50'
                          : isCurrentLevel
                            ? 'bg-casino-cyan hover:bg-casino-cyan/80 cursor-pointer'
                            : 'bg-casino-bg'
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {tile.revealed && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            {tile.safe ? (
                              <Check className="w-5 h-5 text-white" />
                            ) : (
                              <X className="w-5 h-5 text-white" />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </div>
              );
            })}

            {/* Base */}
            {!gameActive && tower.length === 0 && (
              <div className="text-center text-gray-500 py-20">
                <div className="text-lg">Start a game to climb the tower</div>
                <div className="text-sm mt-2">Each level increases your multiplier</div>
              </div>
            )}
          </div>
        </div>

        {/* History */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 max-h-12">
          {history.map((h, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`shrink-0 px-3 py-1.5 rounded text-xs font-bold ${
                h.won ? 'bg-casino-green/20 text-casino-green' : 'bg-casino-red/20 text-casino-red'
              }`}
            >
              Level {h.level} ({h.difficulty})
            </motion.div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-4">
        {!gameActive ? (
          <>
            <BetControls
              betAmount={betAmount}
              onBetChange={setBetAmount}
              onBet={startGame}
              balance={balance}
              buttonText="CLIMB TOWER"
              showAutoBet={false}
            />

            <div className="bg-casino-card border border-casino-border rounded-xl p-4">
              <label className="text-xs text-gray-500 uppercase mb-2 block">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(DIFFICULTIES).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`py-3 rounded font-bold text-sm capitalize transition ${
                      difficulty === key
                        ? 'bg-casino-cyan text-casino-bg'
                        : 'bg-casino-bg text-gray-400 hover:text-white'
                    }`}
                  >
                    {key}
                    <div className="text-xs opacity-70">{value.multiplier}x/lvl</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-casino-card border border-casino-border rounded-xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 uppercase">Your Bet</span>
              <span className="text-lg font-bold text-white">${betAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 uppercase">Current Level</span>
              <span className="text-lg font-bold text-casino-cyan">{currentLevel}/{maxLevels}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 uppercase">Multiplier</span>
              <span className="text-lg font-bold text-casino-gold">{currentMultiplier.toFixed(2)}x</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 uppercase">Next Level</span>
              <span className="text-lg font-bold text-white">{nextMultiplier.toFixed(2)}x</span>
            </div>

            {!gameOver && (
              <button
                onClick={cashout}
                disabled={currentLevel === 0}
                className="w-full py-4 bg-casino-green text-white rounded-lg font-black uppercase text-lg disabled:opacity-50"
              >
                Cashout ${potentialWin}
              </button>
            )}

            {gameOver && (
              <button
                onClick={resetGame}
                className="w-full py-4 bg-casino-cyan text-casino-bg rounded-lg font-black uppercase text-lg flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                New Game
              </button>
            )}
          </div>
        )}

        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Climb the tower by picking safe tiles. Each level multiplies your bet.
            Cash out anytime or reach the top for maximum rewards!
          </p>
        </div>
      </div>
    </div>
  );
};

export default TowerGame;
