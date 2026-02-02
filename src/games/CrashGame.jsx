import { AnimatePresence, motion } from 'framer-motion';
import { Info, Rocket, TrendingUp, Zap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import { playSound } from '../utils/audioEngine';

const getRandomFloat = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
};

const generateCrashPoint = () => {
  const e = getRandomFloat();
  if (e < 0.01) return 1.0;
  const houseEdge = 0.99;
  const crashPoint = houseEdge / e;
  return Math.min(1000, Math.max(1.0, Math.floor(crashPoint * 100) / 100));
};

const CrashGame = () => {
  const { state, addBalance, subtractBalance } = useCasino();
  const balance = state.balance;
  const soundEnabled = state.settings?.soundEnabled;

  const [betAmount, setBetAmount] = useState(10);
  const [gamePhase, setGamePhase] = useState('waiting');
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(null);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false);
  const [autoBetEnabled, setAutoBetEnabled] = useState(false);
  const [hasBet, setHasBet] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [cashoutMultiplier, setCashoutMultiplier] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [history, setHistory] = useState([]);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const crashPointRef = useRef(null);
  const gamePhaseRef = useRef('waiting');
  const hasCashedOutRef = useRef(false);
  const hasBetRef = useRef(false);
  const currentMultiplierRef = useRef(1.0);
  const autoCashoutRef = useRef({ enabled: false, value: 2.0 });
  const autoBetRef = useRef(false);
  const betAmountRef = useRef(10);

  const canPlay = betAmount > 0 && betAmount <= balance;

  const startGame = useCallback(() => {
    if (!canPlay) return;

    setGamePhase('countdown');
    setCountdown(5);
    setHasBet(true);
    setHasCashedOut(false);
    setCashoutMultiplier(null);
    hasBetRef.current = true;
    hasCashedOutRef.current = false;
    subtractBalance(betAmount);

    const countdownInterval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    setTimeout(() => {
      setGamePhase('running');
      const newCrashPoint = generateCrashPoint();
      setCrashPoint(newCrashPoint);
      crashPointRef.current = newCrashPoint;
      startTimeRef.current = Date.now();
      animate();
    }, 5000);
  }, [betAmount, balance, canPlay, subtractBalance]);

  const cashout = useCallback(() => {
    if (gamePhaseRef.current !== 'running' || hasCashedOutRef.current) return;

    hasCashedOutRef.current = true;
    setHasCashedOut(true);
    const multiplier = currentMultiplierRef.current;
    setCashoutMultiplier(multiplier);
    const winAmount = betAmount * multiplier;
    addBalance(winAmount);
    setGamePhase('ended');
    if (soundEnabled) playSound('win');
  }, [betAmount, addBalance, soundEnabled]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const loop = () => {
      if (gamePhaseRef.current !== 'running') return;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const multiplier = Math.max(1, Math.exp(elapsed * 0.5));
      currentMultiplierRef.current = multiplier;
      setCurrentMultiplier(multiplier);

      if (multiplier >= crashPointRef.current) {
        setGamePhase('crashed');
        if (soundEnabled) playSound('lose');
        setHistory((h) => [{ crashed: true, multiplier: crashPointRef.current }, ...h.slice(0, 9)]);
        return;
      }

      if (!hasCashedOutRef.current && autoCashoutRef.current.enabled && multiplier >= autoCashoutRef.current.value) {
        cashout();
        return;
      }

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Curve
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();

      const xScale = width / 5;
      const yScale = height / 3;

      for (let i = 0; i < elapsed; i += 0.05) {
        const m = Math.max(1, Math.exp(i * 0.5));
        const x = (i / 5) * xScale;
        const y = height - Math.log(m) * yScale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Crash line
      if (crashPointRef.current) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        const crashX = (Math.log(crashPointRef.current) / (0.5 * 5)) * xScale;
        const crashY = height - Math.log(crashPointRef.current) * yScale;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(crashX, 0);
        ctx.lineTo(crashX, height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
  }, [soundEnabled, cashout]);

  useEffect(() => {
    if (gamePhase === 'running') {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gamePhase, animate]);

  useEffect(() => {
    if (gamePhase === 'crashed' || (gamePhase === 'ended' && hasCashedOut)) {
      const timer = setTimeout(() => {
        setGamePhase('waiting');
        setCurrentMultiplier(1.0);
        setHasBet(false);
        setHasCashedOut(false);
        setCashoutMultiplier(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, hasCashedOut]);

  return (
    <div className="space-y-6 min-h-screen flex flex-col">
      {/* Game Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 rounded-2xl overflow-hidden border border-slate-700/50 bg-gradient-to-b from-slate-800/50 to-slate-900/50"
      >
        <div className="relative h-full min-h-96">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full h-full"
          />

          {/* Overlay Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
            {gamePhase === 'countdown' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-6xl font-black text-cyan-400"
              >
                {countdown || 'ROUND STARTING...'}
              </motion.div>
            )}

            {gamePhase === 'running' && (
              <div className="text-center">
                <motion.div
                  key={currentMultiplier}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="text-7xl font-black text-green-400"
                >
                  {currentMultiplier.toFixed(2)}x
                </motion.div>
              </div>
            )}

            {gamePhase === 'crashed' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="text-5xl font-black text-red-500 mb-2">CRASHED!</div>
                <div className="text-3xl font-bold text-red-400">{crashPoint?.toFixed(2)}x</div>
              </motion.div>
            )}

            {gamePhase === 'ended' && hasCashedOut && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="text-4xl font-black text-green-400 mb-2">CASHED OUT!</div>
                <div className="text-2xl font-bold text-green-300">{cashoutMultiplier?.toFixed(2)}x</div>
                <div className="text-xl font-bold text-cyan-400 mt-2">+${(betAmount * cashoutMultiplier).toFixed(2)}</div>
              </motion.div>
            )}
          </div>

          {/* Cashout Button */}
          {gamePhase === 'running' && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={cashout}
              className="absolute bottom-6 right-6 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-black text-xl transition transform hover:scale-105 pointer-events-auto shadow-lg"
            >
              CASH OUT
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bet Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-2xl border border-slate-700/50 bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-6"
        >
          <BetControls
            bet={betAmount}
            onBetChange={setBetAmount}
            balance={balance}
            onPlay={startGame}
            loading={gamePhase === 'countdown'}
            disabled={gamePhase !== 'waiting'}
            maxBet={balance}
            multiplier={currentMultiplier}
            showMultiplier={gamePhase === 'running'}
          />
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
            <label className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Auto Cashout
              </span>
              <input
                type="checkbox"
                checked={autoCashoutEnabled}
                onChange={(e) => setAutoCashoutEnabled(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </label>
            <input
              type="number"
              min="1.01"
              step="0.1"
              value={autoCashout}
              onChange={(e) => setAutoCashout(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
              disabled={!autoCashoutEnabled}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-cyan-400 font-mono text-sm disabled:opacity-50"
            />
          </div>

          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Targets</div>
            <div className="grid grid-cols-4 gap-2">
              {[1.5, 2, 3, 5].map((mult) => (
                <button
                  key={mult}
                  onClick={() => {
                    setAutoCashout(mult);
                    setAutoCashoutEnabled(true);
                  }}
                  className="py-2 px-2 rounded-lg bg-slate-700/50 hover:bg-cyan-500/30 border border-slate-700 hover:border-cyan-500 text-white font-bold text-sm transition"
                >
                  {mult}x
                </button>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Recent History</div>
              <div className="space-y-1">
                {history.slice(0, 5).map((h, i) => (
                  <div
                    key={i}
                    className={`text-sm font-bold p-2 rounded text-center ${
                      h.crashed
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {h.multiplier?.toFixed(2)}x
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

export default CrashGame;
