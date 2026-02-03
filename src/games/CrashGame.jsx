import { useCallback, useEffect, useRef, useState } from 'react';
import BetControls from '../components/BetControls';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const HOUSE_EDGE = 0.03;

export default function CrashGame() {
  const { state, placeBet, addWin } = useCasino();
  const [bet, setBet] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(true);
  const [gameState, setGameState] = useState('waiting');
  const [multiplier, setMultiplier] = useState(1);
  const [crashPoint, setCrashPoint] = useState(0);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(0);

  const generateCrashPoint = () => {
    const e = Math.random();
    return Math.max(1, Math.floor((0.99 / (1 - e)) * 100) / 100);
  };

  const drawGraph = useCallback((currentMult, crashed = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

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
    }

    const maxDisplay = Math.max(currentMult * 1.3, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    for (let i = 1; i <= 5; i++) {
      const val = 1 + (maxDisplay - 1) * (i / 5);
      ctx.fillText(`${val.toFixed(1)}x`, w - 10, h - (i * h / 5) - 5);
    }

    const color = crashed ? '#ff3366' : '#00f5ff';
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const points = 150;
    for (let i = 0; i <= points; i++) {
      const progress = i / points;
      const mult = 1 + (currentMult - 1) * progress;
      const x = progress * w * 0.88 + 15;
      const y = h - ((mult - 1) / (maxDisplay - 1)) * h * 0.85 - 30;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = `${color}30`;
    ctx.lineWidth = 10;
    ctx.stroke();

    const endX = 0.88 * w + 15;
    const endY = h - ((currentMult - 1) / (maxDisplay - 1)) * h * 0.85 - 30;
    ctx.beginPath();
    ctx.arc(endX, endY, 15, 0, Math.PI * 2);
    ctx.fillStyle = `${color}40`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(endX, endY, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    if (crashed) {
      ctx.font = 'bold 48px sans-serif';
      ctx.fillStyle = '#ff3366';
      ctx.textAlign = 'center';
      ctx.fillText('CRASHED', w / 2, h / 2);
    }
  }, []);

  const cashOut = useCallback((mult) => {
    if (gameState !== 'running') return;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    setGameState('cashed');
    const win = bet * mult;
    addWin(win, bet, 'crash', mult);
    audio.playWin();
    setResult({ won: true, mult, profit: win - bet });
    setHistory(h => [{ mult, crashed: false }, ...h.slice(0, 19)]);
  }, [gameState, bet, addWin]);

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
      // Exponential growth - accelerates as multiplier increases
      const baseGrowth = state.settings.fastMode ? 0.00015 : 0.00006;
      const currentMult = Math.pow(Math.E, elapsed * baseGrowth);

      setMultiplier(currentMult);
      drawGraph(currentMult, false);

      // Auto cashout
      if (autoCashoutEnabled && currentMult >= autoCashout && autoCashout > 1) {
        cashOut(currentMult);
        return;
      }

      if (currentMult >= crash) {
        setGameState('crashed');
        setMultiplier(crash);
        drawGraph(crash, true);
        addWin(0, bet, 'crash', 0);
        audio.playLose();
        setResult({ won: false, mult: crash, profit: -bet });
        setHistory(h => [{ mult: crash, crashed: true }, ...h.slice(0, 19)]);
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [bet, state.balance, state.settings.fastMode, autoCashout, autoCashoutEnabled, placeBet, addWin, drawGraph, cashOut]);

  useEffect(() => {
    drawGraph(1);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [drawGraph]);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 game-card p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs text-gray-500">House Edge: {(HOUSE_EDGE * 100).toFixed(0)}%</div>
          <div className={`text-5xl font-black tabular-nums ${
            gameState === 'crashed' ? 'text-red-400' :
            gameState === 'cashed' ? 'text-green-400' : 'text-cyan-400'
          }`}>
            {multiplier.toFixed(2)}x
          </div>
        </div>

        <canvas ref={canvasRef} width={600} height={300} className="w-full rounded-xl mb-4" />

        {result && (
          <div className={`text-center text-2xl font-bold mb-4 ${result.won ? 'text-green-400' : 'text-red-400'}`}>
            {result.won ? `+$${result.profit.toFixed(2)}` : `Crashed at ${result.mult.toFixed(2)}x`}
          </div>
        )}

        {gameState === 'running' ? (
          <button onClick={() => cashOut(multiplier)}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black text-xl">
            CASHOUT ${(bet * multiplier).toFixed(2)}
          </button>
        ) : (
          <button onClick={startGame} disabled={bet <= 0 || bet > state.balance}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-black text-xl disabled:opacity-50">
            {gameState === 'waiting' ? 'START' : 'PLAY AGAIN'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        <BetControls bet={bet} setBet={setBet} onPlay={startGame} buttonText="START" hideButton />

        <div className="game-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 uppercase">Auto Cashout</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={autoCashoutEnabled}
                onChange={e => setAutoCashoutEnabled(e.target.checked)}
                className="w-4 h-4 accent-cyan-500" />
              <span className="text-sm text-gray-400">Enabled</span>
            </label>
          </div>
          <input type="number" value={autoCashout} min="1.1" max="100" step="0.1"
            onChange={e => setAutoCashout(parseFloat(e.target.value) || 2)}
            disabled={!autoCashoutEnabled}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white disabled:opacity-50" />
        </div>

        {history.length > 0 && (
          <div className="game-card p-4">
            <div className="text-xs text-gray-500 uppercase mb-3">History</div>
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <span key={i} className={`px-2 py-1 rounded text-sm font-mono ${
                  h.crashed ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'
                }`}>
                  {h.mult.toFixed(2)}x
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
