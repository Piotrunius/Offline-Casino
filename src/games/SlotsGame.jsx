import { AnimatePresence, motion } from 'framer-motion';
import { Cherry, Citrus, Coins, Crown, Diamond, Flame, Gem, Grape, Star, Zap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import { playSound } from '../utils/audioEngine';

const getRandomFloat = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
};

// Different machine themes with their own symbols and payouts
const MACHINES = {
  classic: {
    name: 'Classic Fruits',
    reels: 3,
    rows: 3,
    paylines: 3,
    volatility: 'Low',
    color: 'red',
    symbols: [
      { id: 'cherry', icon: Cherry, color: 'text-red-500', weight: 40 },
      { id: 'lemon', icon: Citrus, color: 'text-yellow-400', weight: 35 },
      { id: 'grape', icon: Grape, color: 'text-purple-500', weight: 15 },
      { id: 'star', icon: Star, color: 'text-casino-gold', weight: 7 },
      { id: 'seven', icon: Zap, color: 'text-casino-green', weight: 3 }
    ],
    payouts: {
      cherry: { 3: 3 },
      lemon: { 3: 5 },
      grape: { 3: 10 },
      star: { 3: 25 },
      seven: { 3: 75 }
    }
  },
  gems: {
    name: 'Gem Rush',
    reels: 5,
    rows: 3,
    paylines: 9,
    volatility: 'Medium',
    color: 'purple',
    symbols: [
      { id: 'gem', icon: Gem, color: 'text-purple-500', weight: 30 },
      { id: 'coin', icon: Coins, color: 'text-yellow-500', weight: 25 },
      { id: 'diamond', icon: Diamond, color: 'text-cyan-400', weight: 20 },
      { id: 'star', icon: Star, color: 'text-casino-gold', weight: 15 },
      { id: 'crown', icon: Crown, color: 'text-casino-cyan', weight: 8 },
      { id: 'seven', icon: Zap, color: 'text-casino-green', weight: 2 }
    ],
    payouts: {
      gem: { 3: 2, 4: 5, 5: 10 },
      coin: { 3: 3, 4: 8, 5: 15 },
      diamond: { 3: 5, 4: 12, 5: 25 },
      star: { 3: 10, 4: 25, 5: 50 },
      crown: { 3: 25, 4: 75, 5: 150 },
      seven: { 3: 100, 4: 500, 5: 1000 }
    }
  },
  neon: {
    name: 'Neon Nights',
    reels: 5,
    rows: 3,
    paylines: 15,
    volatility: 'Medium',
    color: 'cyan',
    symbols: [
      { id: 'coin', icon: Coins, color: 'text-pink-500', weight: 28 },
      { id: 'gem', icon: Gem, color: 'text-cyan-400', weight: 25 },
      { id: 'star', icon: Star, color: 'text-yellow-400', weight: 20 },
      { id: 'diamond', icon: Diamond, color: 'text-purple-400', weight: 15 },
      { id: 'crown', icon: Crown, color: 'text-blue-400', weight: 9 },
      { id: 'seven', icon: Zap, color: 'text-casino-green', weight: 3 }
    ],
    payouts: {
      coin: { 3: 2, 4: 4, 5: 8 },
      gem: { 3: 3, 4: 7, 5: 12 },
      star: { 3: 5, 4: 12, 5: 20 },
      diamond: { 3: 8, 4: 20, 5: 35 },
      crown: { 3: 20, 4: 50, 5: 100 },
      seven: { 3: 75, 4: 300, 5: 750 }
    }
  },
  vegas: {
    name: 'Vegas Gold',
    reels: 5,
    rows: 3,
    paylines: 20,
    volatility: 'High',
    color: 'gold',
    symbols: [
      { id: 'cherry', icon: Cherry, color: 'text-red-500', weight: 30 },
      { id: 'coin', icon: Coins, color: 'text-yellow-500', weight: 25 },
      { id: 'diamond', icon: Diamond, color: 'text-cyan-400', weight: 20 },
      { id: 'crown', icon: Crown, color: 'text-casino-gold', weight: 14 },
      { id: 'fire', icon: Flame, color: 'text-orange-500', weight: 8 },
      { id: 'seven', icon: Zap, color: 'text-casino-green', weight: 3 }
    ],
    payouts: {
      cherry: { 3: 2, 4: 4, 5: 8 },
      coin: { 3: 3, 4: 6, 5: 12 },
      diamond: { 3: 5, 4: 12, 5: 25 },
      crown: { 3: 10, 4: 30, 5: 60 },
      fire: { 3: 25, 4: 75, 5: 200 },
      seven: { 3: 100, 4: 400, 5: 1000 }
    }
  },
  mega: {
    name: 'Mega Fortune',
    reels: 5,
    rows: 4,
    paylines: 25,
    volatility: 'Extreme',
    color: 'purple',
    symbols: [
      { id: 'coin', icon: Coins, color: 'text-yellow-500', weight: 30 },
      { id: 'gem', icon: Gem, color: 'text-purple-500', weight: 25 },
      { id: 'diamond', icon: Diamond, color: 'text-cyan-400', weight: 20 },
      { id: 'star', icon: Star, color: 'text-casino-gold', weight: 13 },
      { id: 'crown', icon: Crown, color: 'text-casino-cyan', weight: 8 },
      { id: 'fire', icon: Flame, color: 'text-orange-500', weight: 3 },
      { id: 'seven', icon: Zap, color: 'text-casino-green', weight: 1 }
    ],
    payouts: {
      coin: { 3: 2, 4: 4, 5: 8 },
      gem: { 3: 3, 4: 6, 5: 12 },
      diamond: { 3: 5, 4: 10, 5: 20 },
      star: { 3: 8, 4: 20, 5: 40 },
      crown: { 3: 15, 4: 40, 5: 100 },
      fire: { 3: 50, 4: 150, 5: 500 },
      seven: { 3: 200, 4: 1000, 5: 5000 }
    }
  }
};

// Payline patterns for different machine types
const PAYLINE_PATTERNS = {
  3: [ // 3-reel: 5 lines
    [1, 1, 1],           // middle
    [0, 0, 0],           // top
    [2, 2, 2],           // bottom
    [0, 1, 2],           // diagonal down
    [2, 1, 0]            // diagonal up
  ],
  5: [ // 5-reel standard: 9 lines
    [1, 1, 1, 1, 1],     // middle
    [0, 0, 0, 0, 0],     // top
    [2, 2, 2, 2, 2],     // bottom
    [0, 0, 1, 2, 2],     // V shape
    [2, 2, 1, 0, 0],     // inverted V
    [0, 1, 1, 1, 0],     // roof
    [2, 1, 1, 1, 2],     // U shape
    [1, 0, 0, 0, 1],     // W shape top
    [1, 2, 2, 2, 1]      // W shape bottom
  ]
};

// 20 payline patterns for 4-row machines
const PAYLINE_PATTERNS_20 = [
  [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [3, 3, 3, 3, 3],
  [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], [0, 0, 1, 2, 2], [2, 2, 1, 0, 0],
  [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 1, 1, 0], [2, 1, 1, 1, 2],
  [1, 2, 1, 0, 1], [1, 0, 1, 2, 1], [3, 2, 1, 0, 0], [0, 0, 1, 2, 3],
  [0, 1, 0, 1, 0], [3, 2, 3, 2, 3], [1, 1, 2, 1, 1], [2, 2, 1, 2, 2]
];

// Create weighted array for random selection
const createWeightedArray = (symbols) => {
  const weighted = [];
  symbols.forEach((s) => {
    for (let i = 0; i < s.weight; i++) {
      weighted.push(s.id);
    }
  });
  return weighted;
};

const getRandomSymbol = (weightedArray) => {
  const index = Math.floor(getRandomFloat() * weightedArray.length);
  return weightedArray[index];
};

// Single Reel component with CSS animation
const Reel = ({ finalSymbols, spinning, reelIndex, onComplete, symbols }) => {
  const [displaySymbols, setDisplaySymbols] = useState(finalSymbols);
  const [animating, setAnimating] = useState(false);
  const weightedArray = useRef(createWeightedArray(symbols));

  useEffect(() => {
    weightedArray.current = createWeightedArray(symbols);
  }, [symbols]);

  useEffect(() => {
    if (spinning) {
      setAnimating(true);

      const spinDuration = 800 + reelIndex * 300;

      const interval = setInterval(() => {
        setDisplaySymbols(finalSymbols.map(() => getRandomSymbol(weightedArray.current)));
      }, 70);

      setTimeout(() => {
        clearInterval(interval);
        setDisplaySymbols(finalSymbols);
        setAnimating(false);
        if (onComplete) onComplete(reelIndex);
      }, spinDuration);

      return () => clearInterval(interval);
    }
  }, [spinning, finalSymbols, reelIndex, onComplete]);

  return (
    <div className={`relative overflow-hidden bg-casino-bg/80 rounded-lg border-2 ${animating ? 'border-casino-cyan' : 'border-casino-border'}`}
      style={{ height: `${finalSymbols.length * 48 + 16}px`, width: '48px' }}>
      <div className={`absolute inset-0 flex flex-col items-center justify-around py-2 transition-all ${animating ? 'blur-sm' : ''}`}>
        {displaySymbols.map((symbolId, i) => {
          const symbol = symbols.find((s) => s.id === symbolId);
          if (!symbol) return null;
          const Icon = symbol.icon;
          return (
            <motion.div
              key={i}
              className={`flex items-center justify-center ${symbol.color}`}
              animate={animating ? { y: [0, 5, 0], scale: [1, 0.95, 1] } : {}}
              transition={{ duration: 0.1, repeat: animating ? Infinity : 0 }}
            >
              <Icon className="w-8 h-8" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const SlotsGame = () => {
  const { state, addBalance, subtractBalance } = useCasino();
  const balance = state.balance;
  const soundEnabled = state.settings?.soundEnabled;

  const [selectedMachine, setSelectedMachine] = useState('gems');
  const machine = MACHINES[selectedMachine];
  const weightedArray = useRef(createWeightedArray(machine.symbols));

  const [betAmount, setBetAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState(() =>
    Array.from({ length: machine.reels }, () =>
      Array.from({ length: machine.rows }, () => machine.symbols[0].id)
    )
  );
  const [lastWin, setLastWin] = useState(null);
  const [winningLines, setWinningLines] = useState([]);
  const [history, setHistory] = useState([]);

  // Auto-bet state
  const [autoBetActive, setAutoBetActive] = useState(false);
  const [autoBetsRemaining, setAutoBetsRemaining] = useState(0);
  const autoTimeoutRef = useRef(null);
  const completedReelsRef = useRef(0);

  // Update weighted array when machine changes
  useEffect(() => {
    weightedArray.current = createWeightedArray(machine.symbols);
    // Reset reels for new machine
    setReels(Array.from({ length: machine.reels }, () =>
      Array.from({ length: machine.rows }, () => machine.symbols[0].id)
    ));
    setLastWin(null);
    setWinningLines([]);
    setHistory([]);
  }, [selectedMachine, machine]);

  const getPaylinePatterns = useCallback(() => {
    if (machine.rows === 4) return PAYLINE_PATTERNS_20.slice(0, machine.paylines);
    return (PAYLINE_PATTERNS[machine.reels] || PAYLINE_PATTERNS[5]).slice(0, machine.paylines);
  }, [machine]);

  const checkWins = useCallback((reelResults) => {
    const wins = { totalWin: 0, lines: [] };
    const patterns = getPaylinePatterns();

    patterns.forEach((pattern, lineIndex) => {
      // Get symbols along this payline
      const lineSymbols = pattern.map((rowIdx, reelIdx) => {
        if (reelIdx >= reelResults.length) return null;
        return reelResults[reelIdx][rowIdx];
      }).filter(Boolean);

      if (lineSymbols.length < machine.reels) return;

      // Count consecutive matches from left
      let matchCount = 1;
      const firstSymbol = lineSymbols[0];

      for (let i = 1; i < lineSymbols.length; i++) {
        if (lineSymbols[i] === firstSymbol) {
          matchCount++;
        } else {
          break;
        }
      }

      const minMatch = machine.reels === 3 ? 2 : 3;
      if (matchCount >= minMatch && machine.payouts[firstSymbol]) {
        const payout = machine.payouts[firstSymbol][matchCount] || 0;
        if (payout > 0) {
          wins.totalWin += payout;
          wins.lines.push({ lineIndex, pattern, symbol: firstSymbol, count: matchCount, payout });
        }
      }
    });

    return wins;
  }, [machine, getPaylinePatterns]);

  const handleSpinComplete = useCallback((reelIndex) => {
    completedReelsRef.current++;

    if (soundEnabled) playSound('slotStop');

    if (completedReelsRef.current >= machine.reels) {
      completedReelsRef.current = 0;

      setTimeout(() => {
        const wins = checkWins(reels);
        if (wins.totalWin > 0) {
          const winAmount = wins.totalWin * betAmount;
          addBalance(winAmount);
          setLastWin({ amount: winAmount, multiplier: wins.totalWin, lines: wins.lines });
          setWinningLines(wins.lines);
          setHistory((prev) => [{ won: true, multiplier: wins.totalWin }, ...prev.slice(0, 14)]);
          if (soundEnabled) {
            if (wins.totalWin >= 100) playSound('jackpot');
            else if (wins.totalWin >= 20) playSound('bigWin');
            else playSound('betWin');
          }
        } else {
          setHistory((prev) => [{ won: false, multiplier: 0 }, ...prev.slice(0, 14)]);
          if (soundEnabled) playSound('betLose');
        }
        setSpinning(false);
      }, 200);
    }
  }, [reels, betAmount, addBalance, checkWins, soundEnabled, machine.reels]);

  const spin = useCallback(() => {
    if (spinning || betAmount > balance) return;

    subtractBalance(betAmount);
    setSpinning(true);
    setLastWin(null);
    setWinningLines([]);
    completedReelsRef.current = 0;

    if (soundEnabled) playSound('slotSpin');

    const newReels = Array.from({ length: machine.reels }, () =>
      Array.from({ length: machine.rows }, () => getRandomSymbol(weightedArray.current))
    );
    setReels(newReels);
  }, [spinning, betAmount, balance, subtractBalance, soundEnabled, machine]);

  const startAutoBet = useCallback((numBets) => {
    if (spinning || betAmount > balance) return;
    setAutoBetActive(true);
    setAutoBetsRemaining(numBets);
  }, [spinning, betAmount, balance]);

  const stopAutoBet = useCallback(() => {
    setAutoBetActive(false);
    setAutoBetsRemaining(0);
    if (autoTimeoutRef.current) {
      clearTimeout(autoTimeoutRef.current);
      autoTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!spinning && autoBetActive && autoBetsRemaining > 0 && betAmount <= balance) {
      autoTimeoutRef.current = setTimeout(() => {
        setAutoBetsRemaining(prev => prev - 1);
        spin();
      }, 1200);

      return () => {
        if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
      };
    }
  }, [spinning, autoBetActive, autoBetsRemaining, betAmount, balance, spin]);

  useEffect(() => {
    return () => {
      if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    };
  }, []);

  const getColorClass = (color) => {
    switch (color) {
      case 'red': return 'border-red-500 from-red-500/20';
      case 'purple': return 'border-purple-500 from-purple-500/20';
      case 'gold': return 'border-casino-gold from-casino-gold/20';
      default: return 'border-casino-cyan from-casino-cyan/20';
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      <div className="flex-1 flex flex-col">
        {/* Machine Selection */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {Object.entries(MACHINES).map(([key, m]) => (
            <button
              key={key}
              onClick={() => !spinning && !autoBetActive && setSelectedMachine(key)}
              disabled={spinning || autoBetActive}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                selectedMachine === key
                  ? `bg-gradient-to-r ${getColorClass(m.color)} border-2`
                  : 'bg-casino-card border border-casino-border hover:border-gray-500'
              } disabled:opacity-50`}
            >
              <div className="text-xs opacity-70">{m.volatility}</div>
              <div>{m.name}</div>
              <div className="text-[10px] text-gray-400">{m.reels}×{m.rows} • {m.paylines} lines</div>
            </button>
          ))}
        </div>

        {/* Slot Machine */}
        <div className="flex-1 bg-casino-card border border-casino-border rounded-xl p-4 flex flex-col items-center justify-center">
          <div className={`bg-gradient-to-b ${getColorClass(machine.color)} to-transparent border-4 rounded-2xl p-4 shadow-2xl`}>
            {/* Header */}
            <div className="text-center mb-3">
              <h2 className="text-lg font-black tracking-wider">{machine.name.toUpperCase()}</h2>
              <div className="flex justify-center items-center gap-2 mt-1 text-xs text-gray-400">
                <span>{machine.paylines} Paylines</span>
                <span>•</span>
                <span>{machine.volatility} Volatility</span>
              </div>
            </div>

            {/* Reels Container */}
            <div className="bg-casino-bg/80 rounded-xl p-3 border-2 border-casino-border">
              <div className="flex gap-1 justify-center">
                {reels.map((reelSymbols, i) => (
                  <Reel
                    key={`${selectedMachine}-${i}`}
                    finalSymbols={reelSymbols}
                    spinning={spinning}
                    reelIndex={i}
                    onComplete={handleSpinComplete}
                    symbols={machine.symbols}
                  />
                ))}
              </div>

              {/* Active paylines indicator */}
              <div className="flex justify-center gap-1 mt-2 flex-wrap">
                {Array.from({ length: Math.min(machine.paylines, 9) }, (_, i) => (
                  <div
                    key={i}
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                      winningLines.some((w) => w.lineIndex === i)
                        ? 'bg-casino-green text-casino-bg animate-pulse'
                        : 'bg-casino-border/50 text-gray-600'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
                {machine.paylines > 9 && (
                  <div className="text-[9px] text-gray-500">+{machine.paylines - 9} more</div>
                )}
              </div>
            </div>

            {spinning && (
              <motion.div
                className="text-center mt-3"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <span className="text-casino-cyan font-bold text-sm">SPINNING...</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Win Display */}
        <AnimatePresence>
          {lastWin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-3 text-center"
            >
              <motion.div
                className="text-2xl font-black text-casino-green"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3, repeat: 3 }}
              >
                WIN! +${lastWin.amount.toFixed(2)}
              </motion.div>
              <div className="text-xs text-gray-400 mt-1 flex flex-wrap justify-center gap-1">
                {lastWin.lines.slice(0, 5).map((l, i) => (
                  <span key={i} className="bg-casino-green/20 px-2 py-0.5 rounded">
                    L{l.lineIndex + 1}: {l.count}×{l.symbol} ({l.payout}x)
                  </span>
                ))}
                {lastWin.lines.length > 5 && (
                  <span className="text-gray-500">+{lastWin.lines.length - 5} more</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 max-h-10">
          {history.slice(0, 15).map((h, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold ${
                h.won ? 'bg-casino-green/20 text-casino-green' : 'bg-casino-red/20 text-casino-red'
              }`}
            >
              {h.won ? `${h.multiplier}x` : '✗'}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-72 space-y-3">
        <BetControls
          betAmount={betAmount}
          onBetChange={setBetAmount}
          onBet={spin}
          balance={balance}
          disabled={spinning || autoBetActive}
          buttonText={spinning ? 'SPINNING...' : 'SPIN'}
          showAutoBet={false}
        />

        {/* Auto Spin */}
        <div className="bg-casino-card border border-casino-border rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-gray-400">Auto Spin</span>
            {autoBetActive && (
              <span className="text-xs text-casino-cyan">{autoBetsRemaining} left</span>
            )}
          </div>

          {autoBetActive ? (
            <button
              onClick={stopAutoBet}
              className="w-full py-2 bg-casino-red text-white rounded-lg font-bold text-sm hover:brightness-110 transition"
            >
              STOP AUTO
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {[10, 25, 50, 100].map((count) => (
                <button
                  key={count}
                  onClick={() => startAutoBet(count)}
                  disabled={spinning || betAmount > balance}
                  className="py-1.5 bg-casino-border hover:bg-casino-cyan/30 rounded text-xs font-bold transition disabled:opacity-50"
                >
                  {count}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Paytable */}
        <div className="bg-casino-card border border-casino-border rounded-xl p-3">
          <h3 className="text-xs text-gray-500 uppercase mb-2">Paytable</h3>
          <div className="space-y-1.5 text-xs max-h-32 overflow-y-auto">
            {machine.symbols.map((symbol) => {
              const Icon = symbol.icon;
              const payoutVals = Object.entries(machine.payouts[symbol.id] || {});
              return (
                <div key={symbol.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 ${symbol.color}`} />
                    <span className="text-gray-400 capitalize text-[10px]">{symbol.id}</span>
                  </div>
                  <div className="flex gap-1.5 text-gray-500 text-[9px]">
                    {payoutVals.map(([count, payout]) => (
                      <span key={count}>{count}×:{payout}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-casino-card border border-casino-border rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-3 h-3 text-casino-gold" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">How to Play</span>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Match {machine.reels === 3 ? '2' : '3'}+ symbols on any payline to win! Different machines offer varying volatility and payouts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SlotsGame;
