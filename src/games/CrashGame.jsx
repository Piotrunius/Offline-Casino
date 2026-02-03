import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

export default function CrashGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2);
  const [gameState, setGameState] = useState('waiting'); // waiting, running, crashed, cashed
  const [multiplier, setMultiplier] = useState(1);
  const [crashPoint, setCrashPoint] = useState(0);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(0);

  // Generate crash point with house edge
  const generateCrashPoint = () => {
    const e = Math.random();
    return Math.max(1, Math.floor((1 / (1 - e)) * 100) / 100);
  };

  const drawGraph = useCallback((currentMult, crashed = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(0, h - (i * h / 10));
      ctx.lineTo(w, h - (i * h / 10));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * w / 10, 0);
      ctx.lineTo(i * w / 10, h);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    const maxDisplay = Math.max(currentMult * 1.2, 2);
    for (let i = 1; i <= 5; i++) {
      const val = 1 + (maxDisplay - 1) * (i / 5);
      ctx.fillText(`${val.toFixed(1)}x`, w - 10, h - (i * h / 5) - 10);
    }

    // Draw curve
    const color = crashed ? '#ff3366' : '#00f5ff';

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const points = 100;
    for (let i = 0; i <= points; i++) {
      const progress = i / points;
      const mult = 1 + (currentMult - 1) * Math.pow(progress, 0.7);
      const x = progress * w * 0.9 + 20;
      const y = h - ((mult - 1) / (maxDisplay - 1)) * h * 0.8 - 40;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Glow effect
    ctx.strokeStyle = `${color}40`;
    ctx.lineWidth = 12;
    ctx.stroke();

    // End point
    const endX = 0.9 * w + 20;
    const endY = h - ((currentMult - 1) / (maxDisplay - 1)) * h * 0.8 - 40;

    // Glow circle
    ctx.beginPath();
    ctx.arc(endX, endY, 20, 0, Math.PI * 2);
    ctx.fillStyle = `${color}30`;
    ctx.fill();

    // Inner circle
    ctx.beginPath();
    ctx.arc(endX, endY, 8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Crashed X
    if (crashed) {
      ctx.font = 'bold 60px sans-serif';
      ctx.fillStyle = '#ff3366';
      ctx.textAlign = 'center';
      ctx.fillText('💥', w / 2, h / 2);
    }
  }, []);

  const startGame = useCallback(() => {
    if (gameState === 'running' || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'crash')) return;

    const crash = generateCrashPoint();
    setCrashPoint(crash);
    setGameState('running');
    setMultiplier(1);
    setResult(null);
    startTimeRef.current = Date.now();
    audio.playBet();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      // Slow growth: takes about 10 seconds to reach 2x
      const growthRate = state.settings.fastMode ? 5000 : 10000;
      const currentMult = 1 + (elapsed / growthRate) * Math.pow(1 + elapsed / (growthRate * 3), 0.5);

      setMultiplier(currentMult);
      drawGraph(currentMult, false);

      // Play tick sounds at milestones
      if (Math.floor(currentMult * 10) > Math.floor((currentMult - 0.1) * 10)) {
        audio.playTick();
      }

      // Auto cashout
      if (currentMult >= autoCashout && autoCashout > 1) {
        cashOut(currentMult);
        return;
      }

      if (currentMult >= crash) {
        // Crashed
        setGameState('crashed');
        setMultiplier(crash);
        drawGraph(crash, true);
        addWin(0, bet, 'crash', 0);
        audio.playLose();
        setResult({ won: false, crashPoint: crash, profit: -bet });
        setHistory(h => [{ crash, won: false }, ...h.slice(0, 19)]);
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [bet, gameState, state.balance, state.settings.fastMode, autoCashout, placeBet, addWin, drawGraph]);

  const cashOut = useCallback((currentMult) => {
    if (gameState !== 'running') return;

    cancelAnimationFrame(animationRef.current);
    const mult = currentMult || multiplier;
    const winAmount = bet * mult;

    setGameState('cashed');
    addWin(winAmount, bet, 'crash', mult);
    audio.playCashout();
    setResult({ won: true, multiplier: mult, profit: winAmount - bet });
    setHistory(h => [{ crash: crashPoint, won: true, cashout: mult }, ...h.slice(0, 19)]);
  }, [gameState, multiplier, bet, crashPoint, addWin]);

  useEffect(() => {
    drawGraph(1, false);
    return () => cancelAnimationFrame(animationRef.current);
  }, [drawGraph]);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        {/* Multiplier Display */}
        <div className="text-center mb-4">
          <div className={`text-7xl font-black transition-all ${
            gameState === 'crashed' ? 'text-red-500' :
            gameState === 'cashed' ? 'text-green-400' : 'text-cyan-400'
          }`} style={{
            textShadow: gameState === 'crashed' ? '0 0 40px #ff3366' : '0 0 40px #00f5ff'
          }}>
            {multiplier.toFixed(2)}x
          </div>
          {gameState === 'crashed' && (
            <div className="text-red-400 text-xl mt-2">CRASHED @ {crashPoint.toFixed(2)}x</div>
          )}
        </div>

        {/* Canvas */}
        <canvas ref={canvasRef} width={600} height={300} className="w-full rounded-xl" />

        {/* Result */}
        {result && (
          <div className={`text-center mt-4 text-2xl font-bold ${result.won ? 'text-green-400' : 'text-red-400'}`}>
            {result.won ? `+$${result.profit.toFixed(2)}` : `-$${Math.abs(result.profit).toFixed(2)}`}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4">
            {history.slice(0, 10).map((h, i) => (
              <div key={i} className={`px-3 py-1 rounded-lg text-sm font-bold ${
                h.won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {h.crash.toFixed(2)}x
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} onPlay={startGame} disabled={gameState === 'running'}
          buttonText={gameState === 'running' ? 'RUNNING...' : 'START'} />

        {/* Cashout Button */}
        {gameState === 'running' && (
          <button onClick={() => cashOut()}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-black text-xl rounded-xl transition-all">
            CASHOUT ${(bet * multiplier).toFixed(2)}
          </button>
        )}

        {/* Auto Cashout */}
        <div className="game-card p-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Auto Cashout</div>
          <input
            type="number"
            min="1.1"
            step="0.1"
            value={autoCashout}
            onChange={(e) => setAutoCashout(Math.max(1.1, parseFloat(e.target.value) || 2))}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white"
          />
        </div>
      </div>
    </div>
  );
}
