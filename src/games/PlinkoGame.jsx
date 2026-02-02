import { AnimatePresence, motion } from 'framer-motion';
import { Triangle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import { playSound } from '../utils/audioEngine';

const getRandomFloat = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
};

const RISK_LEVELS = {
  low: { name: 'Low', color: 'text-casino-green' },
  medium: { name: 'Medium', color: 'text-casino-gold' },
  high: { name: 'High', color: 'text-casino-red' }
};

const ROW_OPTIONS = [8, 10, 12, 14, 16];

const getPayouts = (risk, rows) => {
  const payoutTables = {
    low: {
      8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
      10: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
      12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
      14: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
      16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16]
    },
    medium: {
      8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
      10: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
      12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
      14: [58, 15, 5, 2, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 2, 5, 15, 58],
      16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
    },
    high: {
      8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
      10: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76],
      12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
      14: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420],
      16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
    }
  };
  return payoutTables[risk][rows] || payoutTables.medium[16];
};

const PlinkoGame = () => {
  const { state, addBalance, subtractBalance } = useCasino();
  const balance = state.balance;
  const soundEnabled = state.settings?.soundEnabled;

  const [betAmount, setBetAmount] = useState(10);
  const [risk, setRisk] = useState('medium');
  const [rows, setRows] = useState(12);
  const [activeBalls, setActiveBalls] = useState([]);
  const [history, setHistory] = useState([]);
  const [lastWin, setLastWin] = useState(null);
  const [isHolding, setIsHolding] = useState(false);

  const ballIdRef = useRef(0);
  const holdIntervalRef = useRef(null);

  const payouts = getPayouts(risk, rows);
  const bucketCount = rows + 1;

  const dropBall = useCallback(() => {
    if (betAmount > balance) return;

    subtractBalance(betAmount);
    setLastWin(null);
    if (soundEnabled) playSound('plinkoStart');

    const ballId = ++ballIdRef.current;

    // Pre-calculate the entire path
    const path = [];
    let position = 0;

    for (let i = 0; i < rows; i++) {
      const goRight = getRandomFloat() < 0.5;
      position += goRight ? 1 : 0;
      path.push({ row: i, pos: position, right: goRight });
    }

    const bucketIndex = position;
    const payout = payouts[bucketIndex];
    const winAmount = betAmount * payout;

    // Add ball to active balls
    setActiveBalls((prev) => [
      ...prev,
      {
        id: ballId,
        path,
        currentStep: -1,
        bucketIndex,
        winAmount,
        payout
      }
    ]);

    // Animate the ball step by step - faster animation (50ms per step)
    let step = 0;
    let bounceCounter = 0;
    const animateStep = () => {
      if (step <= rows) {
        setActiveBalls((prev) => prev.map((b) => (b.id === ballId ? { ...b, currentStep: step } : b)));
        // Play bounce sound every few steps
        bounceCounter++;
        if (soundEnabled && bounceCounter % 3 === 0) playSound('plinkoBounce');
        step++;
        setTimeout(animateStep, 50); // 50ms per row
      } else {
        // Ball reached bottom - add winnings and update history
        addBalance(winAmount);
        setLastWin({ amount: winAmount, payout, bucketIndex });
        setHistory((prev) => [{ payout, won: payout >= 1, bucketIndex }, ...prev.slice(0, 14)]);

        if (soundEnabled) {
          playSound('plinkoLand');
          if (payout >= 5) playSound('bigWin');
          else if (payout >= 1) playSound('betWin');
          else playSound('betLose');
        }

        // Remove ball after a short delay
        setTimeout(() => {
          setActiveBalls((prev) => prev.filter((b) => b.id !== ballId));
        }, 500);
      }
    };

    animateStep();
  }, [betAmount, balance, subtractBalance, rows, payouts, addBalance, soundEnabled]);

  // Hold to drop functionality
  const handleMouseDown = useCallback(() => {
    if (betAmount > balance) return;
    setIsHolding(true);
    dropBall(); // Drop immediately on press

    // Then drop every 400ms while holding
    holdIntervalRef.current = setInterval(() => {
      if (betAmount <= balance) {
        dropBall();
      }
    }, 400);
  }, [betAmount, balance, dropBall]);

  const handleMouseUp = useCallback(() => {
    setIsHolding(false);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }
    };
  }, []);

  // Calculate ball position based on current step - adjusted for 16 rows
  const getBallPosition = (ball, boardWidth, boardHeight) => {
    if (ball.currentStep < 0) return null;

    // Adjusted margins for 16 rows
    const topMargin = rows === 16 ? 20 : 30;
    const bottomMargin = rows === 16 ? 50 : 60;
    const startY = topMargin;
    const endY = boardHeight - bottomMargin;
    const rowHeight = (endY - startY) / rows;

    // Adjusted pin spacing for more rows
    const pinSpacing = rows >= 16 ? 20 : 25;

    if (ball.currentStep >= rows) {
      // Ball is at the bottom
      const bucketWidth = (boardWidth - 40) / bucketCount;
      const x = 20 + ball.bucketIndex * bucketWidth + bucketWidth / 2;
      const y = boardHeight - 25;
      return { x, y };
    }

    // Ball is falling
    const step = ball.path[ball.currentStep];
    const pinsInRow = step.row + 3;
    const totalWidth = (pinsInRow - 1) * pinSpacing;
    const startX = (boardWidth - totalWidth) / 2;
    const x = startX + step.pos * pinSpacing + (step.right ? pinSpacing / 2 : -pinSpacing / 2);
    const y = startY + step.row * rowHeight + rowHeight / 2;

    return { x, y };
  };

  // Dynamically calculate SVG dimensions based on rows
  const svgHeight = rows >= 16 ? 550 : 500;
  const pinSpacing = rows >= 16 ? 20 : 25;

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      <div className="flex-1 flex flex-col">
        {/* Plinko Board */}
        <div className="flex-1 bg-casino-card border border-casino-border rounded-xl p-4 relative min-h-[450px]">
          <svg className="w-full h-full" viewBox={`0 0 400 ${svgHeight}`} preserveAspectRatio="xMidYMid meet">
            {/* Background */}
            <rect x="0" y="0" width="400" height={svgHeight} fill="#0a0a0a" rx="8" />

            {/* Pins */}
            {Array.from({ length: rows }, (_, rowIndex) => {
              const pinsInRow = rowIndex + 3;
              const totalWidth = (pinsInRow - 1) * pinSpacing;
              const startX = (400 - totalWidth) / 2;
              const topMargin = rows >= 16 ? 20 : 30;
              const bottomMargin = rows >= 16 ? 50 : 60;
              const y = topMargin + (rowIndex * (svgHeight - topMargin - bottomMargin)) / rows;

              return Array.from({ length: pinsInRow }, (_, pinIndex) => (
                <circle
                  key={`pin-${rowIndex}-${pinIndex}`}
                  cx={startX + pinIndex * pinSpacing}
                  cy={y}
                  r={rows >= 16 ? 3 : 4}
                  fill="#444"
                />
              ));
            })}

            {/* Buckets */}
            {payouts.map((payout, i) => {
              const bucketWidth = 360 / bucketCount;
              const x = 20 + i * bucketWidth;
              const y = svgHeight - 45;

              let color = '#22c55e';
              if (payout >= 10) color = '#eab308';
              if (payout >= 50) color = '#ef4444';
              if (payout < 1) color = '#6b7280';

              return (
                <g key={`bucket-${i}`}>
                  <rect x={x + 1} y={y} width={bucketWidth - 2} height={35} fill={color + '30'} stroke={color} strokeWidth={1.5} rx={3} />
                  <text x={x + bucketWidth / 2} y={y + 22} textAnchor="middle" fill={color} fontSize={bucketWidth > 22 ? 9 : 7} fontWeight="bold">
                    {payout}x
                  </text>
                </g>
              );
            })}

            {/* Active Balls */}
            {activeBalls.map((ball) => {
              const pos = getBallPosition(ball, 400, svgHeight);
              if (!pos) return null;

              return (
                <motion.circle
                  key={ball.id}
                  cx={pos.x}
                  cy={pos.y}
                  r={rows >= 16 ? 6 : 8}
                  fill="#f59e0b"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, cx: pos.x, cy: pos.y }}
                  transition={{ duration: 0.05, ease: 'linear' }}
                />
              );
            })}
          </svg>
        </div>

        {/* Last Win - Absolute positioned to prevent resize */}
        <div className="h-12 relative">
          <AnimatePresence>
            {lastWin && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
                <div className={`text-xl font-black ${lastWin.payout >= 1 ? 'text-casino-green' : 'text-casino-red'}`}>
                  {lastWin.payout >= 1 ? `+$${lastWin.amount.toFixed(2)}` : `-$${(betAmount - lastWin.amount).toFixed(2)}`}
                  <span className="text-sm ml-2 text-gray-400">({lastWin.payout}x)</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History - Limited to 15 items */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 max-h-12">
          {history.slice(0, 15).map((h, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`shrink-0 px-3 py-1.5 rounded text-xs font-bold ${h.won ? 'bg-casino-green/20 text-casino-green' : 'bg-casino-red/20 text-casino-red'}`}
            >
              {h.payout}x
            </motion.div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-4">
        {/* Bet Controls - without auto bet */}
        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <BetControls
            betAmount={betAmount}
            onBetChange={setBetAmount}
            onBet={dropBall}
            balance={balance}
            disabled={false}
            buttonText="DROP BALL"
            showAutoBet={false}
          />

          {/* Hold to Drop Button */}
          <button
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            disabled={betAmount > balance}
            className={`w-full mt-3 py-3 rounded-xl font-bold text-sm transition select-none ${
              isHolding
                ? 'bg-casino-cyan text-casino-bg scale-95'
                : 'bg-casino-border text-white hover:bg-casino-cyan/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isHolding ? 'DROPPING...' : 'HOLD TO DROP MULTIPLE'}
          </button>
        </div>

        {/* Risk Level */}
        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <label className="text-xs text-gray-500 uppercase mb-2 block">Risk Level</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(RISK_LEVELS).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setRisk(key)}
                className={`py-2 rounded-lg font-bold text-sm transition ${risk === key ? `bg-casino-cyan text-casino-bg` : 'bg-casino-bg text-gray-400 hover:text-white'}`}
              >
                {value.name}
              </button>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <label className="text-xs text-gray-500 uppercase mb-2 block">Rows: {rows}</label>
          <div className="grid grid-cols-5 gap-2">
            {ROW_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRows(r)}
                className={`py-2 rounded-lg font-bold text-sm transition ${rows === r ? 'bg-casino-cyan text-casino-bg' : 'bg-casino-bg text-gray-400 hover:text-white'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Triangle className="w-4 h-4 text-casino-cyan" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">About</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Drop the ball and watch it bounce through the pins. Hold the button to drop multiple balls. Higher risk = higher potential rewards but also more variance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlinkoGame;
