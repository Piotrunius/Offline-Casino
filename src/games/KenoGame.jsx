import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import { playSound } from '../utils/audioEngine';

const getRandomInt = (max) => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
};

const GRID_SIZES = {
  small: { rows: 4, cols: 10, picks: 10, maxPicks: 10 },
  normal: { rows: 8, cols: 10, picks: 10, maxPicks: 15 },
  large: { rows: 10, cols: 10, picks: 20, maxPicks: 20 }
};

const PAYOUTS = {
  10: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 1.5, 6: 3, 7: 10, 8: 50, 9: 200, 10: 1000 }
};

const KenoGame = () => {
  const { state, addBalance, subtractBalance } = useCasino();
  const balance = state.balance;
  const soundEnabled = state.settings?.soundEnabled;

  const [betAmount, setBetAmount] = useState(10);
  const [gridSize, setGridSize] = useState('normal');
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const config = GRID_SIZES[gridSize];
  const totalNumbers = config.rows * config.cols;
  const maxPicks = config.maxPicks;

  const getPayout = (hits, picks) => {
    // Simplified payout table
    const multipliers = {
      1: { 1: 2.5 },
      2: { 1: 1, 2: 5 },
      3: { 2: 2, 3: 20 },
      4: { 2: 1.5, 3: 5, 4: 50 },
      5: { 2: 1, 3: 2.5, 4: 15, 5: 100 },
      6: { 3: 1.5, 4: 5, 5: 25, 6: 200 },
      7: { 3: 1, 4: 3, 5: 10, 6: 75, 7: 500 },
      8: { 4: 2, 5: 5, 6: 25, 7: 150, 8: 1000 },
      9: { 4: 1.5, 5: 3, 6: 10, 7: 50, 8: 300, 9: 2000 },
      10: { 5: 2, 6: 5, 7: 15, 8: 100, 9: 500, 10: 5000 }
    };

    const table = multipliers[picks] || {};
    return table[hits] || 0;
  };

  const toggleNumber = (num) => {
    if (playing) return;

    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else if (selectedNumbers.length < maxPicks) {
      setSelectedNumbers([...selectedNumbers, num]);
      if (soundEnabled) playSound('kenoSelect');
    }
  };

  const quickPick = () => {
    if (playing) return;

    const nums = [];
    while (nums.length < maxPicks) {
      const num = getRandomInt(totalNumbers) + 1;
      if (!nums.includes(num)) {
        nums.push(num);
      }
    }
    setSelectedNumbers(nums.sort((a, b) => a - b));
  };

  const clearSelection = () => {
    if (!playing) {
      setSelectedNumbers([]);
      setDrawnNumbers([]);
      setResult(null);
    }
  };

  const play = useCallback((bet = betAmount) => {
    if (bet > balance || selectedNumbers.length === 0 || playing) return Promise.resolve();

    subtractBalance(bet);
    setPlaying(true);
    setDrawnNumbers([]);
    setResult(null);
    if (soundEnabled) playSound('betPlace');

    return new Promise((resolve) => {
      // Draw 10-20 numbers based on grid size
      const drawCount = Math.floor(totalNumbers * 0.2); // 20% of grid
      const drawn = [];
      while (drawn.length < drawCount) {
        const num = getRandomInt(totalNumbers) + 1;
        if (!drawn.includes(num)) {
          drawn.push(num);
        }
      }

      // Animate drawing numbers
      let i = 0;
      const drawInterval = setInterval(() => {
        if (i < drawn.length) {
          setDrawnNumbers(prev => [...prev, drawn[i]]);
          if (soundEnabled) playSound('kenoDraw');
          // Play match sound if drawn number is in selected
          if (selectedNumbers.includes(drawn[i]) && soundEnabled) {
            playSound('kenoMatch');
          }
          i++;
        } else {
          clearInterval(drawInterval);

          // Calculate hits
          const hits = selectedNumbers.filter(n => drawn.includes(n)).length;
          const multiplier = getPayout(hits, selectedNumbers.length);
          const winAmount = bet * multiplier;

          if (winAmount > 0) {
            addBalance(winAmount);
            setResult({ won: true, hits, total: selectedNumbers.length, amount: winAmount });
            if (soundEnabled) {
              if (multiplier >= 10) playSound('bigWin');
              else playSound('betWin');
            }
          } else {
            setResult({ won: false, hits, total: selectedNumbers.length, amount: 0 });
            if (soundEnabled) playSound('betLose');
          }

          setHistory(prev => [{ hits, picks: selectedNumbers.length, won: winAmount > 0 }, ...prev.slice(0, 9)]);
          setPlaying(false);
          resolve({ won: winAmount > 0 });
        }
      }, 100);
    });
  }, [betAmount, balance, selectedNumbers, playing, subtractBalance, totalNumbers, addBalance, soundEnabled]);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      <div className="flex-1 flex flex-col">
        {/* Grid */}
        <div className="flex-1 bg-casino-card border border-casino-border rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[400px]">
          {/* Result - Positioned at top */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
              >
                <div className={`px-6 py-3 rounded-xl text-center ${result.won ? 'bg-casino-green/90' : 'bg-casino-red/90'}`}>
                  <div className={`text-xl font-black text-white`}>
                    {result.hits}/{result.total} HITS
                  </div>
                  {result.won && (
                    <div className="text-sm text-white/90">+${result.amount.toFixed(2)}</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="grid gap-1 w-full max-w-xl"
            style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)` }}
          >
            {Array.from({ length: totalNumbers }, (_, i) => {
              const num = i + 1;
              const isSelected = selectedNumbers.includes(num);
              const isDrawn = drawnNumbers.includes(num);
              const isHit = isSelected && isDrawn;

              return (
                <motion.button
                  key={num}
                  onClick={() => toggleNumber(num)}
                  disabled={playing}
                  whileHover={!playing ? { scale: 1.1 } : {}}
                  whileTap={!playing ? { scale: 0.95 } : {}}
                  className={`aspect-square rounded text-xs md:text-sm font-bold flex items-center justify-center transition-all ${
                    isHit
                      ? 'bg-casino-green text-white'
                      : isDrawn
                        ? 'bg-casino-red/50 text-white'
                        : isSelected
                          ? 'bg-casino-cyan text-casino-bg'
                          : 'bg-casino-bg text-gray-400 hover:text-white'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isDrawn ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        {num}
                      </motion.span>
                    ) : (
                      num
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={quickPick}
              disabled={playing}
              className="px-4 py-2 bg-casino-bg rounded-lg text-sm font-bold text-gray-400 hover:text-white transition disabled:opacity-50"
            >
              Quick Pick
            </button>
            <button
              onClick={clearSelection}
              disabled={playing}
              className="px-4 py-2 bg-casino-bg rounded-lg text-sm font-bold text-gray-400 hover:text-white transition disabled:opacity-50"
            >
              Clear
            </button>
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
              {h.hits}/{h.picks}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-4">
        <BetControls
          betAmount={betAmount}
          onBetChange={setBetAmount}
          onBet={() => play()}
          balance={balance}
          disabled={playing || selectedNumbers.length === 0}
          buttonText={playing ? "DRAWING..." : selectedNumbers.length === 0 ? "PICK NUMBERS" : "PLAY"}
          showAutoBet={false}
        />

        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500 uppercase">Selected</span>
            <span className="text-lg font-bold text-casino-cyan">{selectedNumbers.length}/{maxPicks}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedNumbers.sort((a, b) => a - b).map(num => (
              <span key={num} className="px-2 py-1 bg-casino-cyan/20 text-casino-cyan rounded text-xs font-bold">
                {num}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Payouts ({selectedNumbers.length} picks)</h3>
          <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
            {selectedNumbers.length > 0 && Array.from({ length: selectedNumbers.length + 1 }, (_, i) => {
              const mult = getPayout(i, selectedNumbers.length);
              if (mult === 0 && i < selectedNumbers.length / 2) return null;
              return (
                <div key={i} className="flex justify-between text-gray-500">
                  <span>{i} hits</span>
                  <span className={mult > 0 ? 'text-casino-green' : ''}>{mult > 0 ? `${mult}x` : '-'}</span>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>

        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Pick up to {maxPicks} numbers. 20% of the grid will be drawn.
            More hits = bigger payouts!
          </p>
        </div>
      </div>
    </div>
  );
};

export default KenoGame;
