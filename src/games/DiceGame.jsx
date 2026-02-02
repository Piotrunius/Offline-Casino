import { motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import { playSound } from '../utils/audioEngine';

const getRandomFloat = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xFFFFFFFF + 1);
};

const DiceGame = () => {
  const { state, addBalance, subtractBalance } = useCasino();
  const balance = state.balance;
  const soundEnabled = state.settings?.soundEnabled;

  const [betAmount, setBetAmount] = useState(10);
  const [targetValue, setTargetValue] = useState(50);
  const [isRollOver, setIsRollOver] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [displayValue, setDisplayValue] = useState(50);
  const [history, setHistory] = useState([]);

  const winChance = isRollOver ? (100 - targetValue) : targetValue;
  const multiplier = Math.max(0.01, (100 / winChance) * 0.99).toFixed(4);
  const potentialWin = (betAmount * parseFloat(multiplier)).toFixed(2);

  const roll = useCallback((bet = betAmount) => {
    if (bet > balance || rolling) return;

    subtractBalance(bet);
    setRolling(true);
    setResult(null);
    if (soundEnabled) playSound('diceRoll');

    let animationFrame;
    const startTime = Date.now();
    const duration = 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        setDisplayValue((getRandomFloat() * 100).toFixed(2));
        animationFrame = requestAnimationFrame(animate);
      } else {
        const finalValue = (getRandomFloat() * 100).toFixed(2);
        setDisplayValue(finalValue);

        const isWin = isRollOver ? parseFloat(finalValue) > targetValue : parseFloat(finalValue) < targetValue;

        if (isWin) {
          const winAmount = bet * parseFloat(multiplier);
          addBalance(winAmount);
          setResult({ win: true, value: finalValue, amount: winAmount.toFixed(2) });
          if (soundEnabled) playSound('win');
        } else {
          setResult({ win: false, value: finalValue });
          if (soundEnabled) playSound('lose');
        }

        setHistory((h) => [...[{ value: finalValue, win: isWin }], ...h.slice(0, 9)]);
        setRolling(false);
      }
    };

    animationFrame = requestAnimationFrame(animate);
  }, [betAmount, balance, isRollOver, targetValue, rolling, multiplier, addBalance, subtractBalance, soundEnabled]);

  return (
    <div className="space-y-6 min-h-screen flex flex-col">
      {/* Game Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 rounded-2xl overflow-hidden border border-casino-border bg-casino-card p-8 flex flex-col items-center justify-center"
      >
        <motion.div
          animate={{ scale: rolling ? 1.1 : 1 }}
          transition={{ duration: 0.1 }}
          className="text-center"
        >
          <div className="text-8xl font-black text-casino-cyan mb-4">{displayValue}</div>
          <div className="text-2xl font-bold text-gray-300">Dice Roll</div>
        </motion.div>

        {result && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-8 text-center"
          >
            {result.win ? (
              <div>
                <div className="text-4xl font-black text-green-400 mb-2">WIN!</div>
                <div className="text-2xl font-bold text-green-300">+${result.amount}</div>
              </div>
            ) : (
              <div className="text-4xl font-black text-red-400">LOSE!</div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bet Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-2xl border border-casino-border bg-casino-card p-6"
        >
          <BetControls
            bet={betAmount}
            onBetChange={setBetAmount}
            balance={balance}
            onPlay={() => roll()}
            loading={rolling}
            disabled={rolling}
            maxBet={balance}
            multiplier={parseFloat(multiplier)}
            showMultiplier
          />
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="rounded-xl bg-casino-bg border border-casino-border p-4">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">
              Dice Target: {targetValue}
            </label>
            <input
              type="range"
              min="1"
              max="99"
              value={targetValue}
              onChange={(e) => setTargetValue(parseFloat(e.target.value))}
              className="w-full h-2 bg-casino-border rounded-lg appearance-none cursor-pointer accent-casino-cyan"
            />
          </div>

          <div className="rounded-xl bg-casino-bg border border-casino-border p-4">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">
              Bet Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsRollOver(true)}
                className={`py-2 px-3 rounded-lg font-bold text-sm transition ${
                  isRollOver
                    ? 'bg-casino-cyan text-casino-bg'
                    : 'bg-casino-border text-gray-300 hover:bg-casino-card'
                }`}
              >
                Over
              </button>
              <button
                onClick={() => setIsRollOver(false)}
                className={`py-2 px-3 rounded-lg font-bold text-sm transition ${
                  !isRollOver
                    ? 'bg-casino-cyan text-casino-bg'
                    : 'bg-casino-border text-gray-300 hover:bg-casino-card'
                }`}
              >
                Under
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-casino-bg border border-casino-border p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Win Chance</div>
            <div className="text-2xl font-black text-casino-cyan">{winChance.toFixed(2)}%</div>
            <div className="text-xs text-gray-400 mt-2">Potential: ${potentialWin}</div>
          </div>

          {history.length > 0 && (
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">History</div>
              <div className="grid grid-cols-5 gap-1">
                {history.slice(0, 10).map((h, i) => (
                  <div
                    key={i}
                    className={`p-1 rounded text-center text-xs font-bold ${
                      h.win ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {h.value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DiceGame;
