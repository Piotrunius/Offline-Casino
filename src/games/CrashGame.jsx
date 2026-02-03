import { useCallback, useEffect, useRef, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

export default function CrashGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [autoCashout, setAutoCashout] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [betPlaced, setBetPlaced] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [currentMult, setCurrentMult] = useState(1);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [graphPoints, setGraphPoints] = useState([]);
  const animRef = useRef(null);
  const crashPointRef = useRef(1);
  const canvasRef = useRef(null);

  // Generate crash point with house edge ~3%
  const generateCrashPoint = () => {
    const e = 0.97; // 3% house edge
    const r = Math.random();
    if (r < 0.01) return 1.00; // 1% instant crash
    return Math.max(1.00, e / (1 - r));
  };

  const startRound = useCallback(async () => {
    if (playing || bet <= 0 || bet > state.balance) return;

    const confirmed = await placeBet(bet, 'crash');
    if (!confirmed) return;

    setBetPlaced(true);
    setPlaying(true);
    setCrashed(false);
    setResult(null);
    setCurrentMult(1);
    setGraphPoints([{ x: 0, y: 1 }]);
    audio.playBet();

    const crashPoint = generateCrashPoint();
    crashPointRef.current = crashPoint;

    const startTime = Date.now();
    const speed = state.settings.fastMode ? 0.15 : 0.08;

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const mult = Math.pow(Math.E, speed * elapsed);

      setGraphPoints(prev => [...prev, { x: elapsed, y: mult }]);

      if (mult >= crashPoint) {
        // CRASHED
        setCrashed(true);
        setPlaying(false);
        setBetPlaced(false);
        setCurrentMult(crashPoint);
        setResult({ crashed: true, mult: crashPoint, won: false, profit: -bet });
        setHistory(h => [{ mult: crashPoint, won: false }, ...h.slice(0, 7)]);
        addWin(0, bet, 'crash', 0);
        audio.playLose();
      } else if (autoCashout > 0 && mult >= autoCashout && betPlaced) {
        // Auto cashout
        doCashout(mult);
      } else {
        setCurrentMult(mult);
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [playing, bet, state.balance, autoCashout, state.settings.fastMode, placeBet, addWin, betPlaced]);

  const doCashout = useCallback((mult = currentMult) => {
    if (!playing || crashed || !betPlaced) return;

    cancelAnimationFrame(animRef.current);
    const winAmount = bet * mult;

    setPlaying(false);
    setBetPlaced(false);
    setResult({ crashed: false, mult, won: true, profit: winAmount - bet });
    setHistory(h => [{ mult, won: true }, ...h.slice(0, 7)]);
    addWin(winAmount, bet, 'crash', mult);
    audio.playWin();
  }, [playing, crashed, betPlaced, currentMult, bet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  // Draw graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background grid
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = height - (height * i / 4);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (graphPoints.length < 2) return;

    const maxMult = Math.max(5, currentMult * 1.2);
    const maxTime = Math.max(10, graphPoints[graphPoints.length - 1]?.x || 10);

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = crashed ? '#ef4444' : currentMult >= 2 ? '#22c55e' : '#06b6d4';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    graphPoints.forEach((point, i) => {
      const x = (point.x / maxTime) * width;
      const y = height - ((point.y - 1) / (maxMult - 1)) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill under line
    ctx.lineTo((graphPoints[graphPoints.length - 1].x / maxTime) * width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, crashed ? 'rgba(239, 68, 68, 0.3)' : currentMult >= 2 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(6, 182, 212, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
  }, [graphPoints, crashed, currentMult]);

  return (
    <div className="h-full flex gap-4">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0d0816] rounded-2xl p-6 flex flex-col items-center justify-center relative">
        {/* Multiplier Display */}
        <div className={`text-8xl font-black mb-6 transition-all ${
          crashed ? 'text-red-500 animate-pulse' :
          currentMult >= 5 ? 'text-yellow-400' :
          currentMult >= 2 ? 'text-green-400' : 'text-cyan-400'
        }`}>
          {currentMult.toFixed(2)}x
        </div>

        {/* Graph */}
        <div className="w-full max-w-lg h-48 bg-black/40 rounded-xl overflow-hidden border border-gray-800">
          <canvas
            ref={canvasRef}
            width={500}
            height={200}
            className="w-full h-full"
          />
        </div>

        {/* Crashed indicator */}
        {crashed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-red-500 font-black text-6xl animate-bounce opacity-80">
              💥 CRASHED!
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`mt-6 text-center py-4 px-8 rounded-2xl ${
            result.won
              ? 'bg-gradient-to-r from-green-900/60 to-emerald-900/60 border border-green-500/50'
              : 'bg-gradient-to-r from-red-900/60 to-rose-900/60 border border-red-500/50'
          }`}>
            <span className={`text-2xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won
                ? `🚀 CASHED OUT ${result.mult.toFixed(2)}x → +$${result.profit.toFixed(2)}`
                : `💥 CRASHED @ ${result.mult.toFixed(2)}x`}
            </span>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="absolute bottom-4 left-4 flex gap-2">
            {history.map((h, i) => (
              <span key={i} className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                h.won ? 'bg-green-900/50 text-green-400' :
                h.mult < 1.5 ? 'bg-red-900/50 text-red-400' :
                h.mult < 2 ? 'bg-orange-900/50 text-orange-400' :
                'bg-gray-800 text-gray-400'
              }`}>
                {h.mult.toFixed(2)}x
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-72 flex flex-col gap-3">
        <div className="bg-[#0a0a12] rounded-2xl p-4 flex-1 flex flex-col gap-4">
          {/* Auto Cashout */}
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">
              Auto Cashout: {autoCashout > 0 ? `${autoCashout.toFixed(2)}x` : 'OFF'}
            </label>
            <input
              type="range"
              min={0}
              max={10}
              step={0.1}
              value={autoCashout}
              onChange={(e) => !playing && setAutoCashout(Number(e.target.value))}
              disabled={playing}
              className="w-full mt-2 accent-cyan-500"
            />
            <div className="grid grid-cols-5 gap-1 mt-2">
              {[0, 1.5, 2, 3, 5].map(v => (
                <button
                  key={v}
                  onClick={() => !playing && setAutoCashout(v)}
                  disabled={playing}
                  className={`py-2 rounded-lg text-xs font-bold ${
                    autoCashout === v ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {v === 0 ? 'OFF' : `${v}x`}
                </button>
              ))}
            </div>
          </div>

          {/* Bet */}
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Bet Amount</label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
              <input
                type="number"
                value={bet}
                onChange={(e) => handleBetChange(Number(e.target.value))}
                disabled={playing}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-9 pr-3 text-white text-lg font-bold"
              />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <button onClick={() => handleBetChange(1)} disabled={playing} className="btn-secondary py-2 text-xs font-bold rounded-lg">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={playing} className="btn-secondary py-2 text-xs font-bold rounded-lg">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={playing} className="btn-secondary py-2 text-xs font-bold rounded-lg">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={playing} className="btn-secondary py-2 text-xs font-bold rounded-lg">MAX</button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-black/40 rounded-xl p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Current Value</span>
              <span className="text-green-400 font-bold">${(bet * currentMult).toFixed(2)}</span>
            </div>
            {autoCashout > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Auto @ {autoCashout}x</span>
                <span className="text-cyan-400 font-bold">${(bet * autoCashout).toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Play/Cashout Button */}
          <div className="mt-auto">
            {playing && betPlaced ? (
              <button
                onClick={() => doCashout()}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black text-xl shadow-lg shadow-yellow-500/30 animate-pulse"
              >
                💰 CASHOUT ${(bet * currentMult).toFixed(2)}
              </button>
            ) : (
              <button
                onClick={startRound}
                disabled={playing || bet <= 0 || bet > state.balance}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black text-xl disabled:opacity-50 shadow-lg shadow-green-500/30"
              >
                🚀 START
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
