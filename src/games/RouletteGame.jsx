import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import { playSound } from '../utils/audioEngine';

// European roulette wheel order
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const getNumberColor = (num) => {
  if (num === 0) return 'green';
  return RED_NUMBERS.includes(num) ? 'red' : 'black';
};

const BET_TYPES = {
  straight: { payout: 35 },
  red: { payout: 1, numbers: RED_NUMBERS },
  black: { payout: 1, numbers: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35] },
  odd: { payout: 1, numbers: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35] },
  even: { payout: 1, numbers: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36] },
  low: { payout: 1, numbers: Array.from({ length: 18 }, (_, i) => i + 1) },
  high: { payout: 1, numbers: Array.from({ length: 18 }, (_, i) => i + 19) },
  dozen_1: { payout: 2, numbers: Array.from({ length: 12 }, (_, i) => i + 1) },
  dozen_2: { payout: 2, numbers: Array.from({ length: 12 }, (_, i) => i + 13) },
  dozen_3: { payout: 2, numbers: Array.from({ length: 12 }, (_, i) => i + 25) },
  column_1: { payout: 2, numbers: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34] },
  column_2: { payout: 2, numbers: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35] },
  column_3: { payout: 2, numbers: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36] },
};

const getRandomInt = (min, max) => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return min + (array[0] % (max - min + 1));
};

const RouletteGame = () => {
  const { state, addBalance, subtractBalance } = useCasino();
  const balance = state.balance;
  const soundEnabled = state.settings?.soundEnabled;

  const [betAmount, setBetAmount] = useState(10);
  const [bets, setBets] = useState([]);
  const [result, setResult] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [history, setHistory] = useState([]);
  const [totalWin, setTotalWin] = useState(0);
  const [keepBets, setKeepBets] = useState(false);

  const animationRef = useRef(null);

  const totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);

  const addBet = (type, numbers) => {
    if (spinning || betAmount > balance) return;
    const newBet = {
      id: Date.now() + Math.random(),
      type,
      numbers: Array.isArray(numbers) ? numbers : [numbers],
      amount: betAmount,
      payout: BET_TYPES[type]?.payout || 35
    };
    setBets(prev => [...prev, newBet]);
  };

  const handleNumberClick = (num) => {
    if (spinning) return;
    addBet('straight', num);
  };

  const handleOutsideBet = (type) => {
    if (spinning) return;
    addBet(type, BET_TYPES[type].numbers);
  };

  const clearBets = () => {
    if (spinning) return;
    setBets([]);
  };

  const spin = useCallback(async () => {
    if (bets.length === 0 || spinning || totalBet > balance) return;

    subtractBalance(totalBet);
    setSpinning(true);
    setResult(null);
    setTotalWin(0);
    if (soundEnabled) playSound('wheelSpin');

    // Generate winning number
    const winningNumber = getRandomInt(0, 36);

    // Find where this number is on the wheel
    const numberIndex = WHEEL_NUMBERS.indexOf(winningNumber);
    const slotAngle = 360 / 37; // Each slot takes this many degrees

    // The SVG draws slot 0 at the TOP (starting at -90deg in SVG coords)
    // When we rotate the wheel div, rotation goes clockwise
    // The pointer is fixed at TOP
    //
    // To land on slot N, we need that slot at the TOP
    // Slot N is at angle: N * slotAngle degrees from the TOP
    // To bring it to TOP, we rotate the wheel by: -(N * slotAngle) + random offset within slot
    //
    // For visual effect, we add full rotations and go in positive direction (clockwise)
    // So instead of -angle, we do (360 - angle) + full_rotations * 360

    const slotCenter = numberIndex * slotAngle + slotAngle / 2;
    // Add some randomness within the slot (not exactly center)
    const randomOffset = (Math.random() - 0.5) * slotAngle * 0.7;
    const angleToSlot = slotCenter + randomOffset;

    // How many full rotations for drama
    const fullRotations = 5 + Math.floor(Math.random() * 3);

    // Calculate final absolute rotation
    // We need to END at an angle where (finalRotation % 360) brings the slot to top
    // Since rotation is clockwise and the slot is at angleToSlot from top,
    // we need: finalRotation % 360 = 360 - angleToSlot (to bring it back to top)
    const currentNormalized = wheelRotation % 360;
    const targetAngle = 360 - angleToSlot;

    // Calculate how much we need to rotate to reach target
    let deltaToTarget = targetAngle - currentNormalized;
    if (deltaToTarget < 0) deltaToTarget += 360;

    const targetRotation = wheelRotation + (fullRotations * 360) + deltaToTarget;

    // Animate wheel
    const startTime = performance.now();
    const duration = 4000 + Math.random() * 2000;
    const startRotation = wheelRotation;
    let lastBounce = 0;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quart for more realistic deceleration
      const eased = 1 - Math.pow(1 - progress, 4);
      const currentRotation = startRotation + (targetRotation - startRotation) * eased;
      setWheelRotation(currentRotation);

      // Play ball bounce sounds during spin
      if (soundEnabled && progress > 0.3 && progress < 0.9) {
        const bounceInterval = 0.1 - progress * 0.05;
        if (progress - lastBounce > bounceInterval) {
          playSound('ballBounce');
          lastBounce = progress;
        }
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Spin complete
        setResult(winningNumber);
        if (soundEnabled) playSound('ballLand');

        // Calculate winnings
        let winTotal = 0;
        bets.forEach(bet => {
          if (bet.numbers.includes(winningNumber)) {
            winTotal += bet.amount + (bet.amount * bet.payout);
          }
        });

        setTotalWin(winTotal);
        setHistory(prev => [{ number: winningNumber, color: getNumberColor(winningNumber) }, ...prev.slice(0, 14)]);

        if (winTotal > 0) {
          addBalance(winTotal);
          if (soundEnabled) {
            if (winTotal >= totalBet * 10) playSound('bigWin');
            else playSound('betWin');
          }
        } else {
          if (soundEnabled) playSound('betLose');
        }

        setSpinning(false);
        if (!keepBets) {
          setBets([]);
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [bets, spinning, totalBet, balance, wheelRotation, subtractBalance, addBalance, soundEnabled, keepBets]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const renderWheel = () => {
    const slotAngle = 360 / 37;

    return (
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-casino-gold shadow-lg" />

        {/* Wheel */}
        <div
          className="absolute inset-1 rounded-full overflow-hidden"
          style={{ transform: `rotate(${wheelRotation}deg)` }}
        >
          <svg viewBox="0 0 300 300" className="w-full h-full">
            {WHEEL_NUMBERS.map((num, i) => {
              const startAngle = i * slotAngle - 90;
              const endAngle = startAngle + slotAngle;
              const color = getNumberColor(num);

              const x1 = 150 + 130 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 150 + 130 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 150 + 130 * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 150 + 130 * Math.sin((endAngle * Math.PI) / 180);

              const textAngle = startAngle + slotAngle / 2;
              const textX = 150 + 95 * Math.cos((textAngle * Math.PI) / 180);
              const textY = 150 + 95 * Math.sin((textAngle * Math.PI) / 180);

              return (
                <g key={num}>
                  <path
                    d={`M 150 150 L ${x1} ${y1} A 130 130 0 0 1 ${x2} ${y2} Z`}
                    fill={color === 'red' ? '#dc2626' : color === 'green' ? '#16a34a' : '#1f2937'}
                    stroke="#333"
                    strokeWidth="0.5"
                  />
                  <text
                    x={textX}
                    y={textY}
                    fill="white"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                  >
                    {num}
                  </text>
                </g>
              );
            })}

            {/* Center */}
            <circle cx="150" cy="150" r="35" fill="#111" stroke="#d4af37" strokeWidth="2" />
          </svg>
        </div>

        {/* Pointer at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-casino-gold" />
        </div>
      </div>
    );
  };

  const renderBettingTable = () => (
    <div className="bg-green-900/30 rounded-lg p-2 border border-green-700/50">
      {/* Number grid - compact */}
      <div className="grid gap-0.5" style={{ gridTemplateColumns: 'auto repeat(12, 1fr)' }}>
        {/* Zero */}
        <button
          onClick={() => handleNumberClick(0)}
          disabled={spinning}
          className={`row-span-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded text-xs py-4 px-1.5 transition-colors ${
            bets.some(b => b.numbers.includes(0)) ? 'ring-2 ring-casino-gold' : ''
          }`}
        >
          0
        </button>

        {/* Numbers 1-36 in correct layout */}
        {[2, 1, 0].map(row => (
          <React.Fragment key={row}>
            {Array.from({ length: 12 }, (_, col) => {
              const num = (col * 3) + (3 - row);
              const color = getNumberColor(num);
              const hasBet = bets.some(b => b.type === 'straight' && b.numbers.includes(num));

              return (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  disabled={spinning}
                  className={`py-1.5 font-bold text-[10px] rounded transition-colors ${
                    color === 'red' ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-800 hover:bg-gray-700'
                  } ${hasBet ? 'ring-1 ring-casino-gold' : ''}`}
                >
                  {num}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Outside bets - compact */}
      <div className="grid grid-cols-6 gap-0.5 mt-1">
        {['dozen_1', 'dozen_2', 'dozen_3'].map((dozen, idx) => (
          <button
            key={dozen}
            onClick={() => handleOutsideBet(dozen)}
            disabled={spinning}
            className={`col-span-2 py-1 bg-casino-card hover:bg-casino-border rounded text-[10px] font-bold transition-colors ${
              bets.some(b => b.type === dozen) ? 'ring-1 ring-casino-gold' : ''
            }`}
          >
            {idx === 0 ? '1-12' : idx === 1 ? '13-24' : '25-36'}
          </button>
        ))}

        {['low', 'even', 'red', 'black', 'odd', 'high'].map((type) => (
          <button
            key={type}
            onClick={() => handleOutsideBet(type)}
            disabled={spinning}
            className={`py-1 rounded text-[10px] font-bold transition-colors ${
              type === 'red' ? 'bg-red-600 hover:bg-red-500' :
              type === 'black' ? 'bg-gray-800 hover:bg-gray-700' :
              'bg-casino-card hover:bg-casino-border'
            } ${bets.some(b => b.type === type) ? 'ring-1 ring-casino-gold' : ''}`}
          >
            {type === 'low' ? '1-18' : type === 'high' ? '19-36' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col lg:flex-row gap-3">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Wheel and betting table in one card */}
        <div className="bg-casino-card border border-casino-border rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-center">
          {/* Wheel section */}
          <div className="flex flex-col items-center shrink-0">
            {renderWheel()}

            {/* Result under wheel */}
            <AnimatePresence>
              {result !== null && !spinning && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-3 flex flex-col items-center"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl text-white ${
                    getNumberColor(result) === 'red' ? 'bg-red-600' :
                    getNumberColor(result) === 'green' ? 'bg-green-600' : 'bg-gray-800'
                  }`}>
                    {result}
                  </div>
                  <div className={`mt-1 text-lg font-bold ${totalWin > 0 ? 'text-casino-green' : 'text-casino-red'}`}>
                    {totalWin > 0 ? `+$${totalWin.toFixed(2)}` : 'No Win'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Betting table */}
          <div className="flex-1 w-full lg:w-auto">
            {renderBettingTable()}
          </div>
        </div>

        {/* History - limited height */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 max-h-12">
          {history.slice(0, 15).map((h, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                h.color === 'red' ? 'bg-red-600' :
                h.color === 'green' ? 'bg-green-600' : 'bg-gray-800'
              }`}
            >
              {h.number}
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
          disabled={spinning || bets.length === 0}
          isPlaying={spinning}
          buttonText={spinning ? 'SPINNING...' : bets.length === 0 ? 'PLACE BETS' : `SPIN ($${totalBet.toFixed(2)})`}
          showAutoBet={false}
        />

        {/* Keep bets toggle */}
        <div className="bg-casino-card border border-casino-border rounded-xl p-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-400">Keep bets after spin</span>
            <div
              onClick={() => setKeepBets(!keepBets)}
              className={`w-10 h-5 rounded-full transition-colors relative ${keepBets ? 'bg-casino-green' : 'bg-casino-border'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${keepBets ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </label>
        </div>

        {/* Current bets */}
        <div className="bg-casino-card border border-casino-border rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-gray-400">Current Bets</span>
            {bets.length > 0 && (
              <button
                onClick={clearBets}
                disabled={spinning}
                className="text-casino-red text-xs hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {bets.length === 0 ? (
            <p className="text-gray-500 text-xs">Click to place bets</p>
          ) : (
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {bets.map((bet) => (
                <div key={bet.id} className="flex justify-between text-xs">
                  <span className="text-gray-400">
                    {bet.type === 'straight' ? `#${bet.numbers[0]}` : bet.type.replace('_', ' ')}
                  </span>
                  <span className="text-white">${bet.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-1 border-t border-casino-border flex justify-between font-bold text-sm">
                <span>Total</span>
                <span className="text-casino-gold">${totalBet.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouletteGame;
