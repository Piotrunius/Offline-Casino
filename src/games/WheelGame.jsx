import { motion } from 'framer-motion';
import { useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import { playSound } from '../utils/audioEngine';

const SEGMENTS = [
  { value: 1, color: '#3b82f6', label: '1x' },
  { value: 2, color: '#22c55e', label: '2x' },
  { value: 1, color: '#3b82f6', label: '1x' },
  { value: 3, color: '#eab308', label: '3x' },
  { value: 1, color: '#3b82f6', label: '1x' },
  { value: 2, color: '#22c55e', label: '2x' },
  { value: 1, color: '#3b82f6', label: '1x' },
  { value: 5, color: '#a855f7', label: '5x' },
  { value: 1, color: '#3b82f6', label: '1x' },
  { value: 2, color: '#22c55e', label: '2x' },
  { value: 1, color: '#3b82f6', label: '1x' },
  { value: 3, color: '#eab308', label: '3x' },
  { value: 1, color: '#3b82f6', label: '1x' },
  { value: 2, color: '#22c55e', label: '2x' },
  { value: 1, color: '#3b82f6', label: '1x' },
  { value: 10, color: '#ef4444', label: '10x' },
  { value: 1, color: '#3b82f6', label: '1x' },
  { value: 2, color: '#22c55e', label: '2x' },
  { value: 1, color: '#3b82f6', label: '1x' },
  { value: 50, color: '#06b6d4', label: '50x' }
];

const WheelGame = () => {
  const { state, addBalance, subtractBalance } = useCasino();
  const balance = state.balance;
  const soundEnabled = state.settings?.soundEnabled;

  const [betAmount, setBetAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const spin = () => {
    if (betAmount > balance || spinning) return;

    subtractBalance(betAmount);
    setSpinning(true);
    setResult(null);
    if (soundEnabled) playSound('wheelSpin');

    // Random result
    const segmentIndex = Math.floor(Math.random() * SEGMENTS.length);
    const segment = SEGMENTS[segmentIndex];

    // Calculate rotation
    const segmentAngle = 360 / SEGMENTS.length;
    const targetAngle = 360 - (segmentIndex * segmentAngle) - (segmentAngle / 2);
    const spins = 5 + Math.floor(Math.random() * 3);
    const finalRotation = rotation + (spins * 360) + targetAngle;

    setRotation(finalRotation);

    setTimeout(() => {
      const winAmount = betAmount * segment.value;
      addBalance(winAmount);
      setResult({ multiplier: segment.value, amount: winAmount, won: segment.value > 1 });
      setHistory(prev => [{ multiplier: segment.value, won: segment.value > 1 }, ...prev.slice(0, 14)]);
      if (soundEnabled) {
        if (segment.value >= 5) playSound('bigWin');
        else if (segment.value > 1) playSound('betWin');
        else playSound('betLose');
      }
      setSpinning(false);
    }, 4000);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-casino-gold" />
          </div>

          {/* Wheel */}
          <motion.div
            className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full border-4 border-casino-gold relative overflow-hidden"
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {SEGMENTS.map((seg, i) => {
                const angle = 360 / SEGMENTS.length;
                const startAngle = i * angle - 90;
                const endAngle = startAngle + angle;
                const x1 = 100 + 100 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 100 + 100 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 100 + 100 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 100 + 100 * Math.sin((endAngle * Math.PI) / 180);
                const largeArc = angle > 180 ? 1 : 0;

                return (
                  <g key={i}>
                    <path
                      d={`M100,100 L${x1},${y1} A100,100 0 ${largeArc},1 ${x2},${y2} Z`}
                      fill={seg.color}
                      stroke="#1a1a2e"
                      strokeWidth="1"
                    />
                    <text
                      x={100 + 65 * Math.cos(((startAngle + angle / 2) * Math.PI) / 180)}
                      y={100 + 65 * Math.sin(((startAngle + angle / 2) * Math.PI) / 180)}
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${startAngle + angle / 2 + 90}, ${100 + 65 * Math.cos(((startAngle + angle / 2) * Math.PI) / 180)}, ${100 + 65 * Math.sin(((startAngle + angle / 2) * Math.PI) / 180)})`}
                    >
                      {seg.label}
                    </text>
                  </g>
                );
              })}
              <circle cx="100" cy="100" r="20" fill="#1a1a2e" stroke="#fbbf24" strokeWidth="3" />
            </svg>
          </motion.div>
        </div>

        {/* Result */}
        <div className="h-16 flex items-center justify-center mt-4">
          {result && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`text-2xl font-black ${result.won ? 'text-casino-green' : 'text-white'}`}
            >
              {result.multiplier}x - {result.won ? `+$${(result.amount - betAmount).toFixed(2)}` : 'Break Even'}
            </motion.div>
          )}
        </div>

        {/* History */}
        <div className="flex gap-2 overflow-x-auto pb-2 max-h-12">
          {history.map((h, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`shrink-0 px-3 py-1.5 rounded text-xs font-bold ${h.won ? 'bg-casino-green/20 text-casino-green' : 'bg-gray-600/20 text-gray-400'}`}
            >
              {h.multiplier}x
            </motion.div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-4">
        <BetControls
          betAmount={betAmount}
          onBetChange={setBetAmount}
          onBet={spin}
          balance={balance}
          disabled={spinning}
          buttonText={spinning ? "SPINNING..." : "SPIN"}
          showAutoBet={false}
        />

        <div className="bg-casino-card border border-casino-border rounded-xl p-4">
          <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Payouts</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-400">1x</span>
              <span className="text-white ml-auto">40%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-400">2x</span>
              <span className="text-white ml-auto">25%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-gray-400">3x</span>
              <span className="text-white ml-auto">10%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-gray-400">5x</span>
              <span className="text-white ml-auto">5%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-400">10x</span>
              <span className="text-white ml-auto">5%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-gray-400">50x</span>
              <span className="text-white ml-auto">5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WheelGame;
