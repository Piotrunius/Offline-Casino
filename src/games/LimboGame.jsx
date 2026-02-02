import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import { playSound } from '../utils/audioEngine';

const getRandomFloat = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xFFFFFFFF + 1);
};

const LimboGame = () => {
  const { state, addBalance, subtractBalance } = useCasino();
  const balance = state.balance;
  const soundEnabled = state.settings?.soundEnabled;

  const [betAmount, setBetAmount] = useState(10);
  const [targetMultiplier, setTargetMultiplier] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [displayMultiplier, setDisplayMultiplier] = useState(1);
  const [history, setHistory] = useState([]);

  const winChance = Math.min(99, (99 / targetMultiplier)).toFixed(2);
  const potentialWin = (betAmount * targetMultiplier).toFixed(2);

  const play = useCallback(() => {
    if (betAmount > balance || playing) return;

    subtractBalance(betAmount);
    setPlaying(true);
    setResult(null);
    if (soundEnabled) playSound('betPlace');

    const random = getRandomFloat();
    const outcomeMultiplier = Math.max(1, 0.99 / random);

    const target = Math.min(outcomeMultiplier, targetMultiplier + 5);
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = 1 + (target - 1) * eased;

      setDisplayMultiplier(current.toFixed(2));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayMultiplier(outcomeMultiplier.toFixed(2));
        const won = outcomeMultiplier >= targetMultiplier;

        if (won) {
          const winAmount = betAmount * targetMultiplier;
          addBalance(winAmount);
          setResult({ won: true, multiplier: outcomeMultiplier.toFixed(2), amount: winAmount });
          if (soundEnabled) {
            if (outcomeMultiplier >= 5) playSound('bigWin');
            else playSound('betWin');
          }
        } else {
          setResult({ won: false, multiplier: outcomeMultiplier.toFixed(2), amount: 0 });
          if (soundEnabled) playSound('betLose');
        }

        setHistory(prev => [{ multiplier: outcomeMultiplier.toFixed(2), target: targetMultiplier, won }, ...prev.slice(0, 14)]);
        setPlaying(false);
      }
    };

    requestAnimationFrame(animate);
  }, [betAmount, balance, playing, subtractBalance, targetMultiplier, addBalance, soundEnabled]);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 bg-casino-card border border-casino-border rounded-xl p-6 flex flex-col items-center justify-center relative">
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`absolute top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-xl font-bold z-10 ${result.won ? 'bg-casino-green/90 text-white' : 'bg-casino-red/90 text-white'}`}
              >
                {result.won ? `WIN! +$${result.amount.toFixed(2)}` : 'BUST'}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            key={displayMultiplier}
            animate={playing ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.05 }}
            className={`text-7xl md:text-8xl font-black ${result ? (result.won ? 'text-casino-green' : 'text-casino-red') : (parseFloat(displayMultiplier) >= targetMultiplier ? 'text-casino-green' : 'text-white')}`}
          >
            {displayMultiplier}x
          </motion.div>

          <div className="flex items-center gap-3 mt-4">
            <div className={`w-2 h-2 rounded-full ${parseFloat(displayMultiplier) >= targetMultiplier ? 'bg-casino-green' : 'bg-gray-600'}`} />
            <span className="text-gray-400 text-sm">Target: {targetMultiplier}x</span>
            <div className={`w-2 h-2 rounded-full ${parseFloat(displayMultiplier) >= targetMultiplier ? 'bg-casino-green' : 'bg-gray-600'}`} />
          </div>

          <div className="w-full max-w-xs mt-8">
            <label className="text-xs text-gray-500 uppercase mb-2 block text-center">Target Multiplier</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTargetMultiplier(Math.max(1.01, targetMultiplier - 0.5))}
                disabled={playing}
                className="px-4 py-2 bg-casino-bg border border-casino-border rounded-lg text-white font-bold hover:bg-casino-border transition disabled:opacity-50"
              >-</button>
              <input
                type="number"
                value={targetMultiplier}
                onChange={(e) => setTargetMultiplier(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
                disabled={playing}
                step={0.1}
                min={1.01}
                className="flex-1 bg-casino-bg border border-casino-border rounded-lg px-4 py-2 text-center text-white font-bold text-lg"
              />
              <button
                onClick={() => setTargetMultiplier(targetMultiplier + 0.5)}
                disabled={playing}
                className="px-4 py-2 bg-casino-bg border border-casino-border rounded-lg text-white font-bold hover:bg-casino-border transition disabled:opacity-50"
              >+</button>
            </div>

            <div className="flex gap-2 mt-3 justify-center">
              {[1.5, 2, 3, 5, 10].map(mult => (
                <button
                  key={mult}
                  onClick={() => setTargetMultiplier(mult)}
                  disabled={playing}
                  className={`px-3 py-1.5 rounded text-sm font-bold transition ${targetMultiplier === mult ? 'bg-casino-cyan text-casino-bg' : 'bg-casino-bg border border-casino-border text-gray-400 hover:text-white hover:bg-casino-border'} disabled:opacity-50`}
                >{mult}x</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 max-h-10">
          {history.slice(0, 15).map((h, i) => (
            <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold ${h.won ? 'bg-casino-green/20 text-casino-green' : 'bg-casino-red/20 text-casino-red'}`}>
              {h.multiplier}x
            </motion.div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-72 space-y-3">
        <BetControls betAmount={betAmount} onBetChange={setBetAmount} onBet={play} balance={balance} disabled={playing} buttonText={playing ? "PLAYING..." : "PLAY"} showAutoBet={false} />

        <div className="bg-casino-card border border-casino-border rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 uppercase">Win Chance</span>
            <span className="text-lg font-bold text-casino-cyan">{winChance}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 uppercase">Potential Win</span>
            <span className="text-lg font-bold text-casino-green">${potentialWin}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LimboGame;
